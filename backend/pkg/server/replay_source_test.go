package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestExplicitReplayFixtureIdentityAndNoLiveFallback(t *testing.T) {
	for _, tc := range []struct {
		profile     string
		nodes, pods int
	}{{"M", 20, 300}, {"L", 50, 1500}} {
		t.Run(tc.profile, func(t *testing.T) {
			t.Setenv("KUBECONFIG", t.TempDir()+"/does-not-exist")
			s := New()
			defer s.Close()
			s.ReadOnly = false
			if err := s.EnableReplay(tc.profile); err != nil {
				t.Fatal(err)
			}
			c, err := s.client("test-replay-" + tc.profile)
			if err != nil {
				t.Fatal(err)
			}
			if !s.ReadOnly || c.DataSource != "test-replay" || c.Config != nil || c.Metrics != nil {
				t.Fatal("fixture not isolated/read-only/unmeasured")
			}
			if _, err = s.client("live-context"); err == nil {
				t.Fatal("live context accepted by test source")
			}
			nodes, err := c.Dynamic.Resource(schemaGVR("", "v1", "nodes")).List(context.Background(), metav1.ListOptions{})
			if err != nil || len(nodes.Items) != tc.nodes {
				t.Fatalf("nodes: %v %d", err, len(nodes.Items))
			}
			pods, err := c.Typed.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
			if err != nil || len(pods.Items) != tc.pods {
				t.Fatalf("typed pods: %v %d", err, len(pods.Items))
			}
			first := pods.Items[0].DeepCopy()
			u, err := c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace(first.Namespace).Get(context.Background(), first.Name, metav1.GetOptions{})
			if err != nil || u.GetUID() != first.UID {
				t.Fatal("guarded log and informer trackers disagree")
			}
			if err = s.ConfigureWorkspace(filepath.Join(t.TempDir(), "app-data"), "", ""); err != nil {
				t.Fatal(err)
			}
			mux := http.NewServeMux()
			s.Register(mux)
			request := func(method, path, body, nonce string) *httptest.ResponseRecorder {
				req := httptest.NewRequest(method, "http://127.0.0.1"+path, strings.NewReader(body))
				req.Header.Set("Content-Type", "application/json")
				req.Header.Set("X-KubeView-Replay", nonce)
				w := httptest.NewRecorder()
				mux.ServeHTTP(w, req)
				return w
			}
			w := request("GET", "/api/replay/status", "", "")
			if w.Code != 200 {
				t.Fatalf("status %d %s", w.Code, w.Body.String())
			}
			var status struct {
				ControlNonce string `json:"controlNonce"`
			}
			if err = json.Unmarshal(w.Body.Bytes(), &status); err != nil || status.ControlNonce == "" {
				t.Fatal("nonce missing")
			}
			if w = request("POST", "/api/replay/scenario", `{"name":"churn","count":1}`, ""); w.Code != 403 {
				t.Fatal("unguarded producer accepted")
			}
			if w = request("POST", "/api/replay/scenario", `{"name":"shell"}`, status.ControlNonce); w.Code != 400 {
				t.Fatal("arbitrary scenario accepted")
			}
			if w = request("POST", "/api/replay/scenario", `{"name":"churn","count":1001}`, status.ControlNonce); w.Code != 400 {
				t.Fatal("unbounded producer accepted")
			}
			if w = request("POST", "/api/replay/scenario", `{"name":"churn","count":1}`, status.ControlNonce); w.Code != 202 {
				t.Fatalf("producer %d %s", w.Code, w.Body.String())
			}
			deadline := time.Now().Add(2 * time.Second)
			for {
				s.replay.mu.Lock()
				running, applied, lastErr := s.replay.running, s.replay.applied, s.replay.lastError
				s.replay.mu.Unlock()
				if !running {
					if applied != 1 || lastErr != "" {
						t.Fatalf("apply %d %s", applied, lastErr)
					}
					break
				}
				if time.Now().After(deadline) {
					t.Fatal("producer did not finish")
				}
				time.Sleep(time.Millisecond)
			}
		})
	}
}

func TestReplayLogCloseAndBoundedSourceCleanup(t *testing.T) {
	s := New()
	if err := s.EnableReplay("M"); err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	c, _ := s.client("")
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	r, err := s.openLogStream(ctx, c, "bench-0", "app-0", &corev1.PodLogOptions{Container: "app", Follow: true})
	if err != nil {
		t.Fatal(err)
	}
	buffer := make([]byte, 1024)
	n, err := r.Read(buffer)
	if err != nil || !strings.Contains(string(buffer[:n]), "TEST/REPLAY") {
		t.Fatalf("unlabelled log: %v", err)
	}
	r.Close()
	cancel()
	deadline := time.Now().Add(time.Second)
	for {
		s.replay.mu.Lock()
		closed := s.replay.logClosed
		s.replay.mu.Unlock()
		if closed == 1 {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("closed log goroutine remained")
		}
		time.Sleep(time.Millisecond)
	}
	r2, err := s.openLogStream(context.Background(), c, "bench-0", "app-0", &corev1.PodLogOptions{Container: "app"})
	if err != nil {
		t.Fatal(err)
	}
	all, err := io.ReadAll(r2)
	r2.Close()
	if err != nil || len(all) > 1024 {
		t.Fatal("non-follow log not bounded")
	}
}

func TestReplayScopedHTTPLogUsesRealSessionGuards(t *testing.T) {
	s := New()
	defer s.Close()
	if err := s.EnableReplay("M"); err != nil {
		t.Fatal(err)
	}
	if err := s.ConfigureWorkspace(filepath.Join(t.TempDir(), "profile"), "test-replay-M", "bench-0"); err != nil {
		t.Fatal(err)
	}
	doc := s.workspace.store.Snapshot()
	scope := "workspaceId=" + url.QueryEscape(doc.ID) + "&harborId=" + url.QueryEscape(doc.Harbors[0].ID) + "&tabId=replay-log-document"
	mux := http.NewServeMux()
	s.Register(mux)
	initial := httptest.NewRecorder()
	mux.ServeHTTP(initial, httptest.NewRequest("GET", "http://127.0.0.1/api/connection?"+scope, nil))
	if initial.Code != 200 {
		t.Fatalf("connection %d: %s", initial.Code, initial.Body.String())
	}
	request := httptest.NewRequest("GET", "http://127.0.0.1/api/logs?"+scope+"&namespace=bench-0&pod=app-0&uid=pod-0&container=sidecar&session=replay-session&follow=false", nil)
	for _, cookie := range initial.Result().Cookies() {
		request.AddCookie(cookie)
	}
	response := httptest.NewRecorder()
	mux.ServeHTTP(response, request)
	if response.Code != 200 || response.Header().Get("X-KubeView-Pod-UID") != "pod-0" || !strings.Contains(response.Body.String(), "TEST/REPLAY bench-0/app-0 container=sidecar") {
		t.Fatalf("scoped guarded log %d: %s", response.Code, response.Body.String())
	}
}
