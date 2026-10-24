package server

import (
	"context"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
)

// Exec connects only to the Kubernetes pods/exec subresource. There is no host
// command runner. Closing the browser socket cancels the upstream process stream.
func (s *Server) exec(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	q := r.URL.Query()
	pod := q.Get("pod")
	container := q.Get("container")
	if ns == "" || !validName(pod) || !validName(container) {
		problem(w, 400, "Namespace, ham Pod adı ve container gerekli")
		return
	}
	if err = s.authorize(r.Context(), c, "create", "", "pods", "exec", ns, pod); err != nil {
		failure(w, err)
		return
	}
	obj, err := c.Typed.CoreV1().Pods(ns).Get(r.Context(), pod, metav1.GetOptions{})
	if err != nil {
		failure(w, err)
		return
	}
	if uid := q.Get("uid"); uid == "" || string(obj.UID) != uid {
		problem(w, 409, "Pod UID değişti; kaynağı yeniden seçin")
		return
	}
	if c.Config == nil {
		problem(w, 503, "Exec taşıma yapılandırması yok")
		return
	}
	command := q["command"]
	if len(command) == 0 {
		command = []string{"/bin/sh"}
	}
	if len(command) > 64 {
		problem(w, 400, "Çok fazla komut argümanı")
		return
	}
	for _, part := range command {
		if len(part) > 4096 || strings.ContainsRune(part, 0) {
			problem(w, 400, "Geçersiz komut argümanı")
			return
		}
	}
	config := rest.CopyConfig(c.Config)
	config.Timeout = 0
	url := c.Typed.CoreV1().RESTClient().Post().Resource("pods").Namespace(ns).Name(pod).SubResource("exec").VersionedParams(&corev1.PodExecOptions{Container: container, Command: command, Stdin: true, Stdout: true, Stderr: true, TTY: false}, scheme.ParameterCodec).URL()
	executor, err := remotecommand.NewSPDYExecutor(config, http.MethodPost, url)
	if err != nil {
		failure(w, err)
		return
	}
	conn, err := (&websocket.Upgrader{CheckOrigin: SameOrigin}).Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer func() {
		conn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Exec oturumu sonlandı"), time.Now().Add(time.Second))
		conn.Close()
	}()
	conn.SetReadLimit(64 << 10)
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	reader, writer := io.Pipe()
	defer reader.Close()
	defer writer.Close()
	var mu sync.Mutex
	output := &socketWriter{conn: conn, mu: &mu}
	go func() {
		defer cancel()
		defer writer.Close()
		for {
			kind, data, e := conn.ReadMessage()
			if e != nil {
				return
			}
			if kind == websocket.TextMessage || kind == websocket.BinaryMessage {
				if _, e = writer.Write(data); e != nil {
					return
				}
			}
		}
	}()
	err = executor.StreamWithContext(ctx, remotecommand.StreamOptions{Stdin: reader, Stdout: output, Stderr: output, Tty: false})
	if err != nil && ctx.Err() == nil {
		output.Write([]byte("\r\n[Exec hatası: " + err.Error() + "]\r\n"))
	}
}

type socketWriter struct {
	conn *websocket.Conn
	mu   *sync.Mutex
}

func (s *socketWriter) Write(p []byte) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
	if err := s.conn.WriteMessage(websocket.BinaryMessage, p); err != nil {
		return 0, err
	}
	return len(p), nil
}
