package server

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	authv1 "k8s.io/api/authorization/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func connectionRequest(s *Server, method, path string, body interface{}, cookie *http.Cookie, nonce string) *httptest.ResponseRecorder {
	raw, _ := json.Marshal(body)
	r := httptest.NewRequest(method, "http://localhost"+path, bytes.NewReader(raw))
	r.Header.Set("Content-Type", "application/json")
	if cookie != nil {
		r.AddCookie(cookie)
	}
	if nonce != "" {
		r.Header.Set("X-KubeView-Connection", nonce)
	}
	w := httptest.NewRecorder()
	mux := http.NewServeMux()
	s.Register(mux)
	mux.ServeHTTP(w, r)
	return w
}
func diagnostic(t *testing.T, s *Server, contextName, namespace string, cookie *http.Cookie) (*http.Cookie, map[string]interface{}) {
	t.Helper()
	w := connectionRequest(s, "GET", "/api/connection?context="+contextName+"&namespace="+namespace, nil, cookie, "")
	if w.Code != 200 {
		t.Fatalf("diagnostic: %d %s", w.Code, w.Body)
	}
	if cookie == nil {
		for _, c := range w.Result().Cookies() {
			if c.Name == operatorCookie {
				cookie = c
			}
		}
	}
	if cookie == nil {
		t.Fatal("missing operator cookie")
	}
	var result map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &result)
	return cookie, result
}
func managementBody(contextName, namespace, nonce string, enabled bool) map[string]interface{} {
	return map[string]interface{}{"context": contextName, "namespace": namespace, "connectionID": nonce, "enabled": enabled}
}

func TestManagementStartsReadOnlyAndCannotBypassSession(t *testing.T) {
	s, c := testServer(t, false, pod("web", "pod-uid"))
	path := "/api/resources?context=test&resource=pods&namespace=qa&name=web"
	body := map[string]string{"uid": "pod-uid", "resourceVersion": "rv-opaque-a"}
	if w := connectionRequest(s, "DELETE", path, body, nil, ""); w.Code != 403 {
		t.Fatalf("unseeded write: %d %s", w.Code, w.Body)
	}
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	if info["readOnly"] != true || info["managementAvailable"] != true {
		t.Fatalf("initial state: %#v", info)
	}
	nonce := info["connectionID"].(string)
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); w.Code != 200 {
		t.Fatalf("enable: %d %s", w.Code, w.Body)
	}
	for _, badNonce := range []string{"", "old-intent"} {
		want := 409
		if badNonce == "" {
			want = 403
		}
		if w := connectionRequest(s, "DELETE", path, body, cookie, badNonce); w.Code != want {
			t.Fatalf("bad nonce accepted: %d %s", w.Code, w.Body)
		}
	}
	if w := connectionRequest(s, "DELETE", path, body, cookie, nonce); w.Code != 202 {
		t.Fatalf("enabled write: %d %s", w.Code, w.Body)
	}
	if _, err := c.Dynamic.Resource(schema.GroupVersionResource{Version: "v1", Resource: "pods"}).Namespace("qa").Get(context.Background(), "web", metav1.GetOptions{}); !apierrors.IsNotFound(err) {
		t.Fatal("write did not reach selected client")
	}
	s.ReadOnly = true
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); w.Code != 403 {
		t.Fatalf("READ_ONLY bypass: %d", w.Code)
	}
}

func TestDelayedManagementEnableCannotSurviveRevokeAndContextRoundTrip(t *testing.T) {
	s, c := testServer(t, false)
	s.Namespace = ""
	other := *c
	other.Name, other.ID = "other", "other-client"
	s.clients["other"] = &other
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	nonce := info["connectionID"].(string)
	entered, release := make(chan struct{}), make(chan struct{})
	var once sync.Once
	s.managementBeforeGrant = func() { once.Do(func() { close(entered) }); <-release }
	done := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		done <- connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, true), cookie, "")
	}()
	select {
	case <-entered:
	case <-time.After(3 * time.Second):
		t.Fatal("enable did not reach interposed permission check")
	}
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, false), cookie, ""); w.Code != 200 {
		t.Fatal(w.Body)
	}
	_, b := diagnostic(t, s, "other", "qa", cookie)
	_, again := diagnostic(t, s, "test", "qa", cookie)
	if again["connectionID"] == nonce || again["connectionID"] == b["connectionID"] {
		t.Fatal("scope roundtrip reused intent")
	}
	close(release)
	select {
	case w := <-done:
		if w.Code != 409 {
			t.Fatalf("late enable: %d %s", w.Code, w.Body)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("late enable did not finish")
	}
	_, final := diagnostic(t, s, "test", "qa", cookie)
	if final["managementEnabled"] != false {
		t.Fatal("late request restored management")
	}
}

func TestConnectionRestrictedNamespaceDoesNotRequireNodeOrNamespaceList(t *testing.T) {
	s, c := testServer(t, true, pod("web", "pod-uid"))
	c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(a ktesting.Action) (bool, runtime.Object, error) {
		attrs := a.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview).Spec.ResourceAttributes
		allowed := attrs.Namespace == "qa" && (attrs.Resource == "pods" || attrs.Resource == "deployments")
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: allowed}}, nil
	})
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	checks := info["checks"].(map[string]interface{})["permissions"].(map[string]interface{})
	if checks["nodes"].(map[string]interface{})["status"] != "forbidden" || checks["namespaces"].(map[string]interface{})["status"] != "forbidden" || checks["pods"].(map[string]interface{})["status"] != "ok" {
		t.Fatalf("restricted checks: %#v", checks)
	}
	if w := connectionRequest(s, "GET", "/api/resources?context=test&resource=pods&namespace=qa", nil, cookie, ""); w.Code != 200 {
		t.Fatalf("authorized scope unavailable: %d %s", w.Code, w.Body)
	}
}

func TestOriginHostJSONAndSessionNegatives(t *testing.T) {
	s, _ := testServer(t, false)
	for _, trial := range []struct {
		name, host, origin, fetch, content, body string
		tls                                      bool
		status                                   int
	}{
		{"foreign-origin", "localhost", "https://attacker.example", "", "application/json", "{}", false, 403},
		{"wrong-scheme", "localhost", "https://localhost", "", "application/json", "{}", false, 403},
		{"opaque-origin", "localhost", "null", "", "application/json", "{}", false, 403},
		{"origin-userinfo", "localhost", "http://user@localhost", "", "application/json", "{}", false, 403},
		{"dns-rebind", "attacker.example", "", "", "application/json", "{}", false, 403},
		{"fetch-site", "localhost", "", "cross-site", "application/json", "{}", false, 403},
		{"form-json-substring", "localhost", "http://localhost", "", "text/plain; application/json", "{}", false, 415},
		{"multiple-json", "localhost", "http://localhost", "", "application/json", "{} {}", false, 400},
		{"tls-downgrade", "localhost", "http://localhost", "", "application/json", "{}", true, 403},
	} {
		t.Run(trial.name, func(t *testing.T) {
			r := httptest.NewRequest("POST", "http://"+trial.host+"/api/management", strings.NewReader(trial.body))
			r.Header.Set("Origin", trial.origin)
			r.Header.Set("Sec-Fetch-Site", trial.fetch)
			r.Header.Set("Content-Type", trial.content)
			if trial.tls {
				r.TLS = &tls.ConnectionState{}
			}
			w := httptest.NewRecorder()
			s.protect(s.management)(w, r)
			if w.Code != trial.status {
				t.Fatalf("%d %s", w.Code, w.Body)
			}
		})
	}
	r := httptest.NewRequest("POST", "http://attacker.example/api/session", strings.NewReader(`{"token":"private"}`))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	s.session(w, r)
	if w.Code != 403 {
		t.Fatal("session endpoint bypassed Host guard")
	}
}

func TestConnectionErrorsDoNotExposeCredentials(t *testing.T) {
	secret := "PRIVATE_TOKEN_OR_PLUGIN_STDERR"
	for _, trial := range []struct {
		err      error
		category string
		code     int
	}{
		{errors.New("getting credentials: exec: missing-plugin " + secret), "auth_plugin", 503},
		{errors.New("x509: certificate has expired " + secret), "tls", 503},
		{&net.DNSError{Err: secret, Name: "private.example"}, "dns", 503},
		{context.DeadlineExceeded, "timeout", 503},
		{apierrors.NewUnauthorized(secret), "authentication", 401},
		{apierrors.NewForbidden(schema.GroupResource{Resource: "pods"}, "web", errors.New(secret)), "forbidden", 403},
		{apierrors.NewConflict(schema.GroupResource{Resource: "pods"}, "web", errors.New(secret)), "conflict", 409},
	} {
		w := httptest.NewRecorder()
		failure(w, trial.err)
		var v connectionError
		json.Unmarshal(w.Body.Bytes(), &v)
		if v.Category != trial.category || w.Code != trial.code || strings.Contains(w.Body.String(), secret) {
			t.Fatalf("unsafe/misclassified error: %d %s", w.Code, w.Body)
		}
	}
}

func TestMergedKubeconfigSelectionReloadAndNoGlobalMutation(t *testing.T) {
	t.Setenv("KUBE_CONTEXT", "")
	dir := t.TempDir()
	first := filepath.Join(dir, "first")
	second := filepath.Join(dir, "second")
	a := []byte("apiVersion: v1\nkind: Config\ncurrent-context: a\nclusters:\n- name: a\n  cluster: {server: 'https://127.0.0.1:6443'}\ncontexts:\n- name: a\n  context: {cluster: a, user: a, namespace: alpha}\nusers:\n- name: a\n  user: {token: private-alpha}\n")
	b := []byte("apiVersion: v1\nkind: Config\nclusters:\n- name: b\n  cluster: {server: 'https://127.0.0.1:7443'}\ncontexts:\n- name: b\n  context: {cluster: b, user: b, namespace: beta}\nusers:\n- name: b\n  user: {token: private-beta}\n")
	if err := os.WriteFile(first, a, 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(second, b, 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("KUBECONFIG", first+string(os.PathListSeparator)+second)
	s := New()
	defer s.Close()
	selected, err := s.client("b")
	if err != nil {
		t.Fatal(err)
	}
	if selected.Name != "b" || selected.Namespace != "beta" || selected.Config.Host != "https://127.0.0.1:7443" || selected.Config.BearerToken != "private-beta" {
		t.Fatal("explicit merged context did not select exact config")
	}
	again, err := s.client("b")
	if err != nil || again != selected {
		t.Fatal("unchanged config rebuilt cached client")
	}
	if err := os.WriteFile(second, bytes.ReplaceAll(b, []byte("private-beta"), []byte("rotated-beta")), 0600); err != nil {
		t.Fatal(err)
	}
	rotated, err := s.client("b")
	if err != nil || rotated.ID == selected.ID || rotated.Config.BearerToken != "rotated-beta" {
		t.Fatal("credential rotation did not invalidate transport identity")
	}
	current, err := s.client("")
	if err != nil || current.Name != "a" || current.Namespace != "alpha" {
		t.Fatal("explicit selection mutated current context")
	}
	unchanged, _ := os.ReadFile(first)
	if !bytes.Equal(unchanged, a) {
		t.Fatal("global kubeconfig changed")
	}
	w := connectionRequest(s, "GET", "/api/contexts", nil, nil, "")
	if strings.Contains(w.Body.String(), "private-") || strings.Contains(w.Body.String(), "127.0.0.1:6443") {
		t.Fatal("context listing exposed credential or API URL")
	}
}

func TestScopeSwitchCancelsInFlightStreams(t *testing.T) {
	s, c := testServer(t, true)
	s.Namespace = ""
	other := *c
	other.Name, other.ID = "other", "other-client"
	s.clients["other"] = &other
	cookie, _ := diagnostic(t, s, "test", "qa", nil)
	entered, canceled := make(chan struct{}), make(chan struct{})
	handler := s.protect(func(w http.ResponseWriter, r *http.Request) { close(entered); <-r.Context().Done(); close(canceled) })
	r := httptest.NewRequest("GET", "http://localhost/api/logs?context=test&namespace=qa", nil)
	r.AddCookie(cookie)
	go handler(httptest.NewRecorder(), r)
	select {
	case <-entered:
	case <-time.After(time.Second):
		t.Fatal("stream not opened")
	}
	diagnostic(t, s, "other", "qa", cookie)
	select {
	case <-canceled:
	case <-time.After(time.Second):
		t.Fatal("old scope stream survived switch")
	}
}

func TestPortForwardSandboxStripsGatewayCredentialsAndBindsOperator(t *testing.T) {
	s, c := testServer(t, false)
	if _, err := c.Typed.CoreV1().Pods("qa").Create(context.Background(), pod("web", "pod-uid"), metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	nonce := info["connectionID"].(string)
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); w.Code != 200 {
		t.Fatal(w.Body)
	}
	seen := make(chan *http.Request, 1)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen <- r.Clone(context.Background())
		w.Header().Set("Set-Cookie", "gateway-takeover=1")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<script>fetch('/api/resources')</script>`))
	}))
	defer upstream.Close()
	u, _ := url.Parse(upstream.URL)
	transport := &http.Transport{DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
		return (&net.Dialer{}).DialContext(ctx, "tcp", u.Host)
	}}
	s.forwards["sandbox"] = &forwardSession{forwardRequest: forwardRequest{Context: "test", Namespace: "qa", Pod: "web", UID: "pod-uid", Port: 8080}, id: "sandbox", expires: time.Now().Add(time.Minute), client: c, operatorID: cookie.Value, transport: transport}
	r := httptest.NewRequest("GET", "http://localhost/api/portforward/sandbox/?connectionID="+nonce+"&keep=1", nil)
	r.AddCookie(cookie)
	r.AddCookie(&http.Cookie{Name: "kubeview_session", Value: "PRIVATE_GATEWAY_TOKEN"})
	r.Header.Set("Authorization", "Bearer PRIVATE_GATEWAY_TOKEN")
	r.Header.Set("X-KubeView-Connection", nonce)
	w := httptest.NewRecorder()
	s.protect(s.proxyForward)(w, r)
	if w.Code != 200 || !strings.Contains(w.Body.String(), "<script>") {
		t.Fatalf("HTTP preview regressed: %d %s", w.Code, w.Body)
	}
	csp := w.Header().Get("Content-Security-Policy")
	if !strings.Contains(csp, "sandbox") || strings.Contains(csp, "allow-same-origin") || w.Header().Get("Set-Cookie") != "" || w.Header().Get("Access-Control-Allow-Origin") != "" || w.Header().Get("Access-Control-Allow-Credentials") != "" {
		t.Fatalf("untrusted page escaped response isolation: %#v", w.Header())
	}
	request := <-seen
	if request.Header.Get("Authorization") != "" || request.Header.Get("Cookie") != "" || request.Header.Get("X-KubeView-Connection") != "" || request.URL.Query().Get("connectionID") != "" || request.URL.Query().Get("keep") != "1" {
		t.Fatal("gateway credentials reached workload")
	}
	foreign, foreignInfo := diagnostic(t, s, "test", "qa", nil)
	foreignNonce := foreignInfo["connectionID"].(string)
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", foreignNonce, true), foreign, ""); w.Code != 200 {
		t.Fatal(w.Body)
	}
	if w := connectionRequest(s, "GET", "/api/portforward/sandbox/?connectionID="+foreignNonce, nil, foreign, ""); w.Code != 403 {
		t.Fatalf("foreign operator used proxy: %d", w.Code)
	}
	if w := connectionRequest(s, "DELETE", "/api/portforwards?id=sandbox", nil, foreign, foreignNonce); w.Code != 403 {
		t.Fatalf("foreign operator closed proxy: %d", w.Code)
	}
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, false), cookie, ""); w.Code != 200 {
		t.Fatal(w.Body)
	}
	if _, exists := s.forwards["sandbox"]; exists {
		t.Fatal("revoked proxy remained cached")
	}
}
