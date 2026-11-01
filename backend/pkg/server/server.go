// Package server is the local Kubernetes gateway. Credentials never leave Go.
package server

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	metrics "k8s.io/metrics/pkg/client/clientset/versioned"
)

type Clients struct {
	Dynamic   dynamic.Interface
	Typed     kubernetes.Interface
	Discovery discovery.DiscoveryInterface
	Metrics   metrics.Interface
	Config    *rest.Config
	Name      string
}
type Server struct {
	ReadOnly   bool
	Namespace  string
	Token      string
	mu         sync.Mutex
	clients    map[string]*Clients
	forwardMu  sync.Mutex
	forwards   map[string]*forwardSession
	providerMu sync.Mutex
	providers  *providerServices
	// Test harness only; nil in production. Must be assigned before serving.
	streamProbe     func(connection, stage string, msg envelope, depth int, elapsed time.Duration)
	prepareSnapshot func([]*unstructured.Unstructured)
	openLogStream   logStreamOpener
	logOpenStage    func(string)
}
type Resource struct {
	Group      string   `json:"group"`
	Version    string   `json:"version"`
	Resource   string   `json:"resource"`
	Kind       string   `json:"kind"`
	Namespaced bool     `json:"namespaced"`
	Verbs      []string `json:"verbs"`
}

func New() *Server {
	return &Server{ReadOnly: os.Getenv("READ_ONLY") != "false", Namespace: os.Getenv("WATCH_NAMESPACE"), Token: os.Getenv("API_TOKEN"), clients: map[string]*Clients{}, forwards: map[string]*forwardSession{}}
}
func (s *Server) Register(mux *http.ServeMux) {
	s.registerProviders(mux)
	mux.HandleFunc("/api/session", s.session)
	for path, fn := range map[string]http.HandlerFunc{"/api/contexts": s.contexts, "/api/discovery": s.discovery, "/api/resources": s.resources, "/api/capabilities": s.capabilities, "/api/actions": s.actions, "/api/metrics": s.metrics, "/api/logs": s.logs, "/api/exec": s.exec, "/api/portforwards": s.portforwards, "/api/portforward/": s.proxyForward, "/api/portforward": s.rawPortforward, "/api/openapi": s.openapi, "/api/secrets/reveal": s.revealSecret, "/ws": s.websocket} {
		mux.HandleFunc(path, s.protect(fn))
	}
}

// Close releases optional provider subscriptions when the local gateway stops.
func (s *Server) Close() { s.closeProviders() }

func SameOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	u, err := url.Parse(origin)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && strings.EqualFold(u.Host, r.Host)
}
func (s *Server) protect(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		if s.Token == "" {
			host := r.Host
			if h, _, err := net.SplitHostPort(host); err == nil {
				host = h
			}
			ip := net.ParseIP(host)
			if host != "localhost" && (ip == nil || !ip.IsLoopback()) {
				problem(w, 403, "Yerel erişim için localhost veya loopback adresini kullanın")
				return
			}
		}
		if !SameOrigin(r) {
			problem(w, 403, "Farklı origin üzerinden erişim reddedildi")
			return
		}
		if s.Token != "" {
			token := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if cookie, err := r.Cookie("kubeview_session"); err == nil && token == "" {
				token = cookie.Value
			}
			if subtle.ConstantTimeCompare([]byte(token), []byte(s.Token)) != 1 {
				problem(w, 401, "Oturum açılması gerekiyor")
				return
			}
		}
		next(w, r)
	}
}
func (s *Server) session(w http.ResponseWriter, r *http.Request) {
	if !SameOrigin(r) || r.Method != "POST" {
		problem(w, 403, "Oturum isteği reddedildi")
		return
	}
	var v struct {
		Token string `json:"token"`
	}
	if !decode(w, r, &v) {
		return
	}
	if s.Token == "" || subtle.ConstantTimeCompare([]byte(v.Token), []byte(s.Token)) != 1 {
		problem(w, 401, "Geçersiz erişim anahtarı")
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "kubeview_session", Value: v.Token, HttpOnly: true, Secure: r.TLS != nil, SameSite: http.SameSiteStrictMode, Path: "/", MaxAge: 28800})
	jsonResponse(w, 200, map[string]bool{"authenticated": true})
}
func jsonResponse(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
func problem(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, map[string]interface{}{"error": message, "code": status})
}
func failure(w http.ResponseWriter, err error) {
	status := 500
	if st, ok := err.(apierrors.APIStatus); ok {
		status = int(st.Status().Code)
	}
	if status < 400 {
		status = 500
	}
	problem(w, status, err.Error())
}
func decode(w http.ResponseWriter, r *http.Request, v interface{}) bool {
	if !strings.Contains(r.Header.Get("Content-Type"), "application/json") {
		problem(w, 415, "Content-Type application/json olmalı")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 2<<20)
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		problem(w, 400, "Geçersiz JSON: "+err.Error())
		return false
	}
	return true
}
func loadingRules() *clientcmd.ClientConfigLoadingRules {
	return clientcmd.NewDefaultClientConfigLoadingRules()
}
func (s *Server) contexts(w http.ResponseWriter, r *http.Request) {
	cfg, err := loadingRules().Load()
	names := []map[string]string{}
	current := os.Getenv("KUBE_CONTEXT")
	if err == nil {
		if current == "" {
			current = cfg.CurrentContext
		}
		for name := range cfg.Contexts {
			names = append(names, map[string]string{"name": name, "namespace": cfg.Contexts[name].Namespace})
		}
	}
	sort.Slice(names, func(i, j int) bool { return names[i]["name"] < names[j]["name"] })
	if len(names) == 0 {
		if _, e := rest.InClusterConfig(); e == nil {
			names = append(names, map[string]string{"name": "in-cluster"})
			current = "in-cluster"
		}
	}
	currentNamespace := ""
	if cfg != nil && cfg.Contexts[current] != nil {
		currentNamespace = cfg.Contexts[current].Namespace
	}
	result := map[string]interface{}{"contexts": names, "current": current, "currentNamespace": currentNamespace, "readOnly": s.ReadOnly, "configured": len(names) > 0, "namespace": s.Namespace}
	if err != nil {
		result["error"] = err.Error()
	}
	jsonResponse(w, 200, result)
}
func (s *Server) client(name string) (*Clients, error) {
	if name == "" {
		name = os.Getenv("KUBE_CONTEXT")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	requestedName := name
	if c := s.clients[name]; c != nil && c.Config == nil {
		return c, nil
	}
	var cfg *rest.Config
	var err error
	if name == "in-cluster" {
		cfg, err = rest.InClusterConfig()
	} else {
		rules := loadingRules()
		overrides := &clientcmd.ConfigOverrides{CurrentContext: name}
		loader := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(rules, overrides)
		if name == "" {
			raw, e := loader.RawConfig()
			if e != nil {
				return nil, e
			}
			name = raw.CurrentContext
			if name == "" {
				if cfg, err = rest.InClusterConfig(); err == nil {
					name = "in-cluster"
				}
			}
		}
		if cfg == nil {
			cfg, err = loader.ClientConfig()
		}
	}
	if err != nil {
		return nil, fmt.Errorf("Kubernetes bağlantısı yapılandırılamadı: %w", err)
	}
	cfg = rest.CopyConfig(cfg)
	cfg.UserAgent = "KubeView/Tersane"
	cfg.Timeout = 15 * time.Second
	cfg.QPS = 30
	cfg.Burst = 60
	c := &Clients{Config: cfg, Name: name}
	c.Dynamic, err = dynamic.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}
	c.Typed, err = kubernetes.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}
	c.Discovery = c.Typed.Discovery()
	c.Metrics, err = metrics.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}
	s.clients[name] = c
	s.clients[requestedName] = c
	return c, nil
}
func (s *Server) requestClient(w http.ResponseWriter, r *http.Request) *Clients {
	c, err := s.client(r.URL.Query().Get("context"))
	if err != nil {
		problem(w, 503, err.Error())
		return nil
	}
	return c
}
func (s *Server) namespace(r *http.Request) (string, error) {
	ns := r.URL.Query().Get("namespace")
	if s.Namespace != "" {
		if ns != "" && ns != s.Namespace {
			return "", fmt.Errorf("Bu bağlantı yalnız %s namespace kapsamına izin veriyor", s.Namespace)
		}
		ns = s.Namespace
	}
	return ns, nil
}
func discover(c *Clients) ([]Resource, []string) {
	_, lists, err := c.Discovery.ServerGroupsAndResources()
	errors := []string{}
	if err != nil {
		errors = append(errors, err.Error())
	}
	resources := []Resource{}
	for _, list := range lists {
		gv, e := schema.ParseGroupVersion(list.GroupVersion)
		if e != nil {
			continue
		}
		for _, a := range list.APIResources {
			if strings.Contains(a.Name, "/") {
				continue
			}
			resources = append(resources, Resource{gv.Group, gv.Version, a.Name, a.Kind, a.Namespaced, a.Verbs})
		}
	}
	sort.Slice(resources, func(i, j int) bool {
		return resources[i].Group+resources[i].Resource+resources[i].Version < resources[j].Group+resources[j].Resource+resources[j].Version
	})
	return resources, errors
}
func (s *Server) discovery(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	resources, errors := discover(c)
	jsonResponse(w, 200, map[string]interface{}{"resources": resources, "errors": errors})
}
func queryGVR(r *http.Request) schema.GroupVersionResource {
	q := r.URL.Query()
	version := q.Get("version")
	if version == "" {
		version = "v1"
	}
	return schema.GroupVersionResource{Group: q.Get("group"), Version: version, Resource: q.Get("resource")}
}

// resourceNamespace follows API discovery, so cluster-scoped SSARs and dynamic
// requests agree even when WATCH_NAMESPACE restricts the namespaced resources.
func resourceNamespace(c *Clients, gvr schema.GroupVersionResource, ns string) string {
	if list, err := c.Discovery.ServerResourcesForGroupVersion(gvr.GroupVersion().String()); err == nil {
		for _, item := range list.APIResources {
			if item.Name == gvr.Resource && !item.Namespaced {
				return ""
			}
		}
	}
	return ns
}
func (s *Server) resourceClient(c *Clients, gvr schema.GroupVersionResource, ns string) dynamic.ResourceInterface {
	ns = resourceNamespace(c, gvr, ns)
	if ns != "" {
		return c.Dynamic.Resource(gvr).Namespace(ns)
	}
	return c.Dynamic.Resource(gvr)
}

func sanitize(obj *unstructured.Unstructured) *unstructured.Unstructured {
	obj = obj.DeepCopy()
	unstructured.RemoveNestedField(obj.Object, "metadata", "managedFields")
	if obj.GetKind() == "Secret" {
		keys := []string{}
		if data, ok, _ := unstructured.NestedMap(obj.Object, "data"); ok {
			for k := range data {
				keys = append(keys, k)
			}
		}
		sort.Strings(keys)
		delete(obj.Object, "data")
		delete(obj.Object, "stringData")
		obj.SetAnnotations(nil)
		obj.Object["keyNames"] = keys
	}
	return obj
}
func (s *Server) openapi(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	data, err := c.Discovery.RESTClient().Get().AbsPath("/openapi/v2").Do(ctx).Raw()
	if err != nil {
		failure(w, err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
func (s *Server) revealSecret(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		problem(w, 405, "GET gerekli")
		return
	}
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	name := r.URL.Query().Get("name")
	if name == "" || ns == "" {
		problem(w, 400, "Ad ve namespace gerekli")
		return
	}
	if err = s.authorize(r.Context(), c, "get", "", "secrets", "", ns, name); err != nil {
		failure(w, err)
		return
	}
	obj, err := c.Typed.CoreV1().Secrets(ns).Get(r.Context(), name, metav1.GetOptions{})
	if err != nil {
		failure(w, err)
		return
	}
	obj.TypeMeta = metav1.TypeMeta{APIVersion: "v1", Kind: "Secret"}
	obj.ManagedFields = nil
	// Annotations may contain user-managed configuration. They stay inside this
	// explicitly authorized editor response, while bulk sanitize still removes
	// them (including last-applied Secret contents) from shared state.
	jsonResponse(w, 200, obj)
}
