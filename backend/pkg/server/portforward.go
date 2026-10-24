package server

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httputil"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/httpstream"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/portforward"
	"k8s.io/client-go/transport/spdy"
)

type forwardRequest struct {
	Context   string `json:"context"`
	Namespace string `json:"namespace"`
	Pod       string `json:"pod"`
	UID       string `json:"uid"`
	Port      int    `json:"port"`
}
type forwardSession struct {
	forwardRequest
	id        string
	expires   time.Time
	client    *Clients
	transport *http.Transport
	timer     *time.Timer
	mu        sync.Mutex
	active    map[*forwardConn]bool
	closed    bool
}

func (s *Server) validateForward(w http.ResponseWriter, r *http.Request, target forwardRequest) (*Clients, bool) {
	if target.Context != "" {
		q := r.URL.Query()
		q.Set("context", target.Context)
		r.URL.RawQuery = q.Encode()
	}
	if target.Port < 1 || target.Port > 65535 || !validName(target.Pod) || target.Namespace == "" || target.UID == "" {
		problem(w, 422, "Namespace, Pod, UID ve 1–65535 arasında port gerekli")
		return nil, false
	}
	if s.Namespace != "" && s.Namespace != target.Namespace {
		problem(w, 403, "Port-forward namespace kapsamı dışında")
		return nil, false
	}
	c := s.requestClient(w, r)
	if c == nil {
		return nil, false
	}
	if err := s.authorize(r.Context(), c, "create", "", "pods", "portforward", target.Namespace, target.Pod); err != nil {
		failure(w, err)
		return nil, false
	}
	pod, err := c.Typed.CoreV1().Pods(target.Namespace).Get(r.Context(), target.Pod, metav1.GetOptions{})
	if err != nil {
		failure(w, err)
		return nil, false
	}
	if string(pod.UID) != target.UID {
		problem(w, 409, "Pod yeniden oluşturuldu; yeni UID ile tekrar açın")
		return nil, false
	}
	if c.Config == nil {
		problem(w, 503, "Port-forward taşıma yapılandırması yok")
		return nil, false
	}
	return c, true
}
func (s *Server) closeForward(id string) {
	s.forwardMu.Lock()
	session := s.forwards[id]
	delete(s.forwards, id)
	s.forwardMu.Unlock()
	if session == nil {
		return
	}
	session.mu.Lock()
	session.closed = true
	active := []*forwardConn{}
	for conn := range session.active {
		active = append(active, conn)
	}
	session.mu.Unlock()
	if session.timer != nil {
		session.timer.Stop()
	}
	session.transport.CloseIdleConnections()
	for _, conn := range active {
		conn.Close()
	}
}
func (session *forwardSession) description() map[string]interface{} {
	return map[string]interface{}{"id": session.id, "url": "/api/portforward/" + session.id + "/", "expiresAt": session.expires.UTC().Format(time.RFC3339), "namespace": session.Namespace, "pod": session.Pod, "uid": session.UID, "port": session.Port, "context": session.Context, "status": "created", "transport": "Kubernetes pods/portforward (SPDY)"}
}
func (s *Server) portforwards(w http.ResponseWriter, r *http.Request) {
	if r.Method == "DELETE" {
		id := r.URL.Query().Get("id")
		s.closeForward(id)
		jsonResponse(w, 200, map[string]bool{"closed": true})
		return
	}
	if r.Method == "GET" {
		s.forwardMu.Lock()
		sessions := []map[string]interface{}{}
		for _, session := range s.forwards {
			sessions = append(sessions, session.description())
		}
		s.forwardMu.Unlock()
		jsonResponse(w, 200, map[string]interface{}{"sessions": sessions})
		return
	}
	if r.Method != "POST" {
		problem(w, 405, "POST, GET veya DELETE gerekli")
		return
	}
	var target forwardRequest
	if !decode(w, r, &target) {
		return
	}
	c, ok := s.validateForward(w, r, target)
	if !ok {
		return
	}
	session := &forwardSession{forwardRequest: target, id: uuid.NewString(), expires: time.Now().Add(15 * time.Minute), client: c, active: map[*forwardConn]bool{}}
	session.Context = c.Name
	session.transport = &http.Transport{Proxy: nil, DisableKeepAlives: true, ResponseHeaderTimeout: 20 * time.Second, DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		conn, err := dialPodPort(ctx, c, target.Namespace, target.Pod, target.Port)
		if err != nil {
			return nil, err
		}
		session.mu.Lock()
		if session.closed {
			session.mu.Unlock()
			conn.Close()
			return nil, fmt.Errorf("Port-forward oturumu sonlandı")
		}
		session.active[conn] = true
		session.mu.Unlock()
		conn.setOnClose(func() { session.mu.Lock(); delete(session.active, conn); session.mu.Unlock() })
		return conn, nil
	}}
	s.forwardMu.Lock()
	if len(s.forwards) >= 32 {
		s.forwardMu.Unlock()
		problem(w, 429, "En fazla 32 port-forward oturumu açılabilir")
		return
	}
	session.timer = time.AfterFunc(time.Until(session.expires), func() { s.closeForward(session.id) })
	s.forwards[session.id] = session
	s.forwardMu.Unlock()
	jsonResponse(w, 201, session.description())
}
func (s *Server) proxyForward(w http.ResponseWriter, r *http.Request) {
	parts := strings.SplitN(strings.TrimPrefix(r.URL.Path, "/api/portforward/"), "/", 2)
	id := parts[0]
	s.forwardMu.Lock()
	session := s.forwards[id]
	s.forwardMu.Unlock()
	if session == nil || time.Now().After(session.expires) {
		problem(w, 410, "Port-forward oturumu sonlandı")
		return
	}
	if r.Method == http.MethodConnect {
		problem(w, 405, "CONNECT desteklenmiyor")
		return
	}
	pod, err := session.client.Typed.CoreV1().Pods(session.Namespace).Get(r.Context(), session.Pod, metav1.GetOptions{})
	if err != nil {
		failure(w, err)
		return
	}
	if string(pod.UID) != session.UID {
		s.closeForward(id)
		problem(w, 409, "Hedef Pod UID değişti; oturum kapatıldı")
		return
	}
	prefix := "/api/portforward/" + id
	proxy := httputil.ReverseProxy{Transport: session.transport, Director: func(request *http.Request) {
		request.URL.Scheme = "http"
		request.URL.Host = "kubeview-pod"
		request.Host = session.Pod
		request.URL.Path = strings.TrimPrefix(request.URL.Path, prefix)
		request.URL.RawPath = ""
		request.Header.Del("Authorization")
		request.Header.Del("Cookie")
		request.Header.Del("Proxy-Authorization")
	}, ModifyResponse: func(response *http.Response) error {
		response.Header.Del("Set-Cookie")
		response.Header.Set("Content-Security-Policy", "sandbox allow-scripts allow-forms")
		response.Header.Set("Referrer-Policy", "no-referrer")
		response.Header.Set("Cache-Control", "no-store")
		if location := response.Header.Get("Location"); strings.HasPrefix(location, "/") {
			response.Header.Set("Location", prefix+location)
		}
		return nil
	}, ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
		problem(w, 502, "Pod port-forward hatası: "+err.Error())
	}}
	proxy.ServeHTTP(w, r)
}
func (s *Server) rawPortforward(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	port, _ := strconv.Atoi(q.Get("port"))
	target := forwardRequest{Context: q.Get("context"), Namespace: q.Get("namespace"), Pod: q.Get("pod"), UID: q.Get("uid"), Port: port}
	c, ok := s.validateForward(w, r, target)
	if !ok {
		return
	}
	upstream, err := dialPodPort(r.Context(), c, target.Namespace, target.Pod, target.Port)
	if err != nil {
		failure(w, err)
		return
	}
	defer upstream.Close()
	socket, err := (&websocket.Upgrader{CheckOrigin: SameOrigin}).Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer socket.Close()
	socket.SetReadLimit(1 << 20)
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	var mu sync.Mutex
	go func() {
		defer cancel()
		for {
			_, data, e := socket.ReadMessage()
			if e != nil {
				return
			}
			if _, e = upstream.Write(data); e != nil {
				return
			}
		}
	}()
	done := make(chan error, 1)
	go func() { _, e := io.Copy(&socketWriter{conn: socket, mu: &mu}, upstream); done <- e }()
	select {
	case <-ctx.Done():
	case <-done:
	}
	socket.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Port-forward oturumu sonlandı"), time.Now().Add(time.Second))
}
func dialPodPort(ctx context.Context, c *Clients, namespace, pod string, port int) (*forwardConn, error) {
	config := rest.CopyConfig(c.Config)
	config.Timeout = 0
	roundTripper, upgrader, err := spdy.RoundTripperFor(config)
	if err != nil {
		return nil, err
	}
	url := c.Typed.CoreV1().RESTClient().Post().Resource("pods").Namespace(namespace).Name(pod).SubResource("portforward").URL()
	dialer := spdy.NewDialer(upgrader, &http.Client{Transport: roundTripper, Timeout: 15 * time.Second}, http.MethodPost, url)
	stream, protocol, err := dialer.Dial(portforward.PortForwardProtocolV1Name)
	if err != nil {
		return nil, err
	}
	if protocol != portforward.PortForwardProtocolV1Name {
		stream.Close()
		return nil, fmt.Errorf("Port-forward protokolü uyuşmuyor")
	}
	headers := http.Header{}
	headers.Set(corev1.StreamType, corev1.StreamTypeError)
	headers.Set(corev1.PortHeader, strconv.Itoa(port))
	headers.Set(corev1.PortForwardRequestIDHeader, "0")
	errorStream, err := stream.CreateStream(headers)
	if err != nil {
		stream.Close()
		return nil, err
	}
	errorStream.Close()
	headers.Set(corev1.StreamType, corev1.StreamTypeData)
	dataStream, err := stream.CreateStream(headers)
	if err != nil {
		stream.Close()
		return nil, err
	}
	conn := &forwardConn{data: dataStream, stream: stream, done: make(chan struct{})}
	go func() {
		data, err := io.ReadAll(errorStream)
		if err != nil || len(data) > 0 {
			conn.mu.Lock()
			if len(data) > 0 {
				conn.upstreamError = fmt.Errorf("%s", data)
			} else {
				conn.upstreamError = err
			}
			conn.mu.Unlock()
			conn.Close()
		}
	}()
	go func() {
		select {
		case <-ctx.Done():
			conn.Close()
		case <-conn.done:
		}
	}()
	return conn, nil
}

type forwardConn struct {
	data          httpstream.Stream
	stream        httpstream.Connection
	done          chan struct{}
	once          sync.Once
	mu            sync.Mutex
	upstreamError error
	onClose       func()
}

func (c *forwardConn) Read(p []byte) (int, error) {
	n, err := c.data.Read(p)
	if err != nil {
		c.mu.Lock()
		if c.upstreamError != nil {
			err = c.upstreamError
		}
		c.mu.Unlock()
	}
	return n, err
}
func (c *forwardConn) Write(p []byte) (int, error) { return c.data.Write(p) }
func (c *forwardConn) Close() error {
	c.once.Do(func() {
		close(c.done)
		c.data.Close()
		c.stream.Close()
		c.mu.Lock()
		onClose := c.onClose
		c.mu.Unlock()
		if onClose != nil {
			onClose()
		}
	})
	return nil
}
func (c *forwardConn) setOnClose(fn func()) {
	c.mu.Lock()
	c.onClose = fn
	closed := false
	select {
	case <-c.done:
		closed = true
	default:
	}
	c.mu.Unlock()
	if closed {
		fn()
	}
}
func (c *forwardConn) LocalAddr() net.Addr                { return forwardAddr("kubeview") }
func (c *forwardConn) RemoteAddr() net.Addr               { return forwardAddr("kubernetes-pod") }
func (c *forwardConn) SetDeadline(t time.Time) error      { return nil }
func (c *forwardConn) SetReadDeadline(t time.Time) error  { return nil }
func (c *forwardConn) SetWriteDeadline(t time.Time) error { return nil }

type forwardAddr string

func (a forwardAddr) Network() string { return "kubernetes-portforward" }
func (a forwardAddr) String() string  { return string(a) }
