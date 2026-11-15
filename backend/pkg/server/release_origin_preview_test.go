package server

import (
	"bufio"
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const releasePreviewToken = "synthetic-preview-access-canary-only"

// The existing session fixture and an in-memory net.Pipe exercise the actual
// mux/proxy boundary without opening a listener or contacting a Kubernetes API.
func releasePreviewFixture(t *testing.T) (*Server, *http.Cookie, string, <-chan *http.Request) {
	t.Helper()
	s, c := testServer(t, false)
	if _, err := c.Typed.CoreV1().Pods("qa").Create(context.Background(), pod("web", "pod-uid"), metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	nonce := info["connectionID"].(string)
	if response := connectionRequest(s, http.MethodPost, "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); response.Code != http.StatusOK {
		t.Fatalf("management fixture: status=%d", response.Code)
	}
	seen := make(chan *http.Request, 4)
	transport := &http.Transport{DisableKeepAlives: true, ResponseHeaderTimeout: time.Second, DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		client, upstream := net.Pipe()
		_ = client.SetDeadline(time.Now().Add(2 * time.Second))
		_ = upstream.SetDeadline(time.Now().Add(2 * time.Second))
		go func() {
			defer upstream.Close()
			request, err := http.ReadRequest(bufio.NewReader(upstream))
			if err != nil {
				return
			}
			defer request.Body.Close()
			seen <- request
			response := &http.Response{StatusCode: http.StatusOK, ProtoMajor: 1, ProtoMinor: 1, Header: http.Header{
				"Content-Type":                     {"text/html"},
				"Set-Cookie":                       {"synthetic-takeover=1", "synthetic-second=1"},
				"Access-Control-Allow-Origin":      {"*"},
				"Access-Control-Allow-Credentials": {"true"},
				"Content-Security-Policy":          {"sandbox allow-same-origin allow-scripts"},
				"Referrer-Policy":                  {"unsafe-url"},
				"Cache-Control":                    {"public, max-age=3600"},
			}, Body: io.NopCloser(strings.NewReader("<script>/* synthetic workload canary */</script>")), Close: true, ContentLength: -1}
			_ = response.Write(upstream)
		}()
		return client, nil
	}}
	t.Cleanup(transport.CloseIdleConnections)
	s.forwards["synthetic"] = &forwardSession{forwardRequest: forwardRequest{Context: "test", Namespace: "qa", Pod: "web", UID: "pod-uid", Port: 8080}, id: "synthetic", expires: time.Now().Add(time.Minute), client: c, operatorID: cookie.Value, transport: transport}
	s.Token = releasePreviewToken
	return s, cookie, nonce, seen
}

func TestReleaseOriginPreviewOriginAndHeaderMatrix(t *testing.T) {
	s, cookie, nonce, seen := releasePreviewFixture(t)
	mux := http.NewServeMux()
	s.Register(mux)
	for _, trial := range []struct {
		name, origin, fetch string
		status              int
	}{
		{"same-origin", "http://localhost", "same-origin", http.StatusOK},
		{"same-origin-cookie-only", "http://localhost", "same-origin", http.StatusOK},
		{"missing-origin-cli", "", "", http.StatusOK},
		{"foreign-origin", "https://attacker.invalid", "", http.StatusForbidden},
		{"opaque-origin", "null", "", http.StatusForbidden},
		{"wrong-port", "http://localhost:9000", "", http.StatusForbidden},
		{"wrong-scheme", "https://localhost", "", http.StatusForbidden},
		{"cross-site-without-origin", "", "cross-site", http.StatusForbidden},
	} {
		t.Run(trial.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "http://localhost/api/portforward/synthetic/assets/page?connectionID="+nonce+"&keep=1", nil)
			request.AddCookie(cookie)
			request.AddCookie(&http.Cookie{Name: s.accessCookieName(), Value: releasePreviewToken})
			if trial.name != "same-origin-cookie-only" {
				request.Header.Set("Authorization", "Bearer "+releasePreviewToken)
			}
			request.Header.Set("Proxy-Authorization", "Basic synthetic-proxy-canary")
			request.Header.Set("X-KubeView-Connection", nonce)
			request.Header.Set("Origin", trial.origin)
			request.Header.Set("Sec-Fetch-Site", trial.fetch)
			response := httptest.NewRecorder()
			mux.ServeHTTP(response, request)
			if response.Code != trial.status {
				t.Fatalf("preview origin gate: status=%d want=%d", response.Code, trial.status)
			}
			if trial.status != http.StatusOK {
				select {
				case <-seen:
					t.Fatal("denied request reached workload transport")
				default:
				}
				return
			}
			if !strings.Contains(response.Body.String(), "synthetic workload canary") {
				t.Fatal("authorized preview body missing")
			}
			if response.Header().Get("Content-Security-Policy") != "sandbox allow-scripts allow-forms" || len(response.Header().Values("Content-Security-Policy")) != 1 {
				t.Fatal("upstream weakened opaque sandbox policy")
			}
			for _, header := range []string{"Set-Cookie", "Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"} {
				if len(response.Header().Values(header)) != 0 {
					t.Fatalf("unsafe upstream response header retained: %s", header)
				}
			}
			if response.Header().Get("Referrer-Policy") != "no-referrer" || response.Header().Get("Cache-Control") != "no-store" || response.Header().Get("X-Content-Type-Options") != "nosniff" {
				t.Fatal("preview response hardening missing")
			}
			select {
			case upstream := <-seen:
				for _, header := range []string{"Authorization", "Cookie", "Proxy-Authorization", "X-KubeView-Connection"} {
					if upstream.Header.Get(header) != "" {
						t.Fatalf("gateway credential header reached workload: %s", header)
					}
				}
				if upstream.URL.Query().Get("connectionID") != "" || upstream.URL.Query().Get("keep") != "1" || upstream.URL.Path != "/assets/page" || upstream.Host != "web" {
					t.Fatal("proxy target/query boundary changed")
				}
			case <-time.After(time.Second):
				t.Fatal("authorized preview did not reach synthetic transport")
			}
		})
	}
}

func TestReleaseOriginPreviewLoginAndWebSocketOriginGate(t *testing.T) {
	s, _ := testServer(t, false)
	s.Token = releasePreviewToken
	mux := http.NewServeMux()
	s.Register(mux)
	for _, origin := range []string{"http://localhost", "", "null", "https://attacker.invalid"} {
		for _, path := range []string{"/api/session", "/ws?context=test&namespace=qa"} {
			t.Run(path+"/"+origin, func(t *testing.T) {
				method, body, allowed := http.MethodGet, "", http.StatusBadRequest
				if path == "/api/session" {
					method, body, allowed = http.MethodPost, `{"token":"`+releasePreviewToken+`"}`, http.StatusOK
				}
				request := httptest.NewRequest(method, "http://localhost"+path, strings.NewReader(body))
				request.Header.Set("Content-Type", "application/json")
				request.Header.Set("Authorization", "Bearer "+releasePreviewToken)
				request.Header.Set("Origin", origin)
				response := httptest.NewRecorder()
				mux.ServeHTTP(response, request)
				want := allowed
				if origin == "null" || origin == "https://attacker.invalid" {
					want = http.StatusForbidden
				}
				if response.Code != want {
					t.Fatalf("login/WS origin gate: status=%d want=%d", response.Code, want)
				}
				if path == "/api/session" && want == http.StatusOK {
					cookies := response.Result().Cookies()
					if len(cookies) != 1 || cookies[0].Name != s.accessCookieName() || !cookies[0].HttpOnly || cookies[0].SameSite != http.SameSiteStrictMode || cookies[0].Path != "/" || cookies[0].MaxAge != 28800 || cookies[0].Secure {
						t.Fatal("plaintext login cookie contract changed")
					}
					if strings.Contains(response.Body.String(), releasePreviewToken) {
						t.Fatal("login response body echoed the access token")
					}
				}
				// The accepted WS case reaches its missing Upgrade-header check;
				// this in-process test intentionally does not establish a socket.
			})
		}
	}
}

func TestReleaseOriginPreviewRequiresCurrentOwnerAndGrant(t *testing.T) {
	for _, trial := range []struct {
		name   string
		status int
	}{
		{"missing-operator", http.StatusForbidden},
		{"missing-access", http.StatusUnauthorized},
		{"missing-nonce", http.StatusForbidden},
		{"stale-nonce", http.StatusConflict},
		{"disabled-grant", http.StatusForbidden},
		{"expired-forward", http.StatusGone},
		{"replaced-pod", http.StatusConflict},
		{"connect-authority-form", http.StatusNotFound},
	} {
		t.Run(trial.name, func(t *testing.T) {
			s, cookie, nonce, seen := releasePreviewFixture(t)
			method := http.MethodGet
			switch trial.name {
			case "missing-nonce":
				nonce = ""
			case "stale-nonce":
				nonce = "synthetic-stale-intent"
			case "disabled-grant":
				s.operators[cookie.Value].enabled = false
			case "expired-forward":
				s.forwards["synthetic"].expires = time.Now().Add(-time.Second)
			case "replaced-pod":
				if _, err := s.clients["test"].Typed.CoreV1().Pods("qa").Update(context.Background(), pod("web", "replacement-uid"), metav1.UpdateOptions{}); err != nil {
					t.Fatal(err)
				}
			case "connect-authority-form":
				method = http.MethodConnect
			}
			target := "http://localhost/api/portforward/synthetic/"
			if method == http.MethodConnect {
				// Standard CONNECT uses an authority target, so the mux rejects it
				// before any Pod proxy route can be selected.
				target = "localhost:8000"
			}
			request := httptest.NewRequest(method, target, nil)
			if trial.name != "missing-operator" {
				request.AddCookie(cookie)
			}
			if trial.name != "missing-access" {
				request.Header.Set("Authorization", "Bearer "+releasePreviewToken)
			}
			request.Header.Set("Origin", "http://localhost")
			request.Header.Set("X-KubeView-Connection", nonce)
			response := httptest.NewRecorder()
			mux := http.NewServeMux()
			s.Register(mux)
			mux.ServeHTTP(response, request)
			if response.Code != trial.status {
				t.Fatalf("preview grant/identity gate: status=%d want=%d", response.Code, trial.status)
			}
			select {
			case <-seen:
				t.Fatal("denied request reached workload transport")
			default:
			}
			if trial.name == "replaced-pod" && s.forwards["synthetic"] != nil {
				t.Fatal("replaced Pod forward remained cached")
			}
		})
	}
}

func TestReleaseOriginPreviewCreationReadOnlyAndGrant(t *testing.T) {
	for _, trial := range []struct {
		name     string
		readOnly bool
		enable   bool
		status   int
	}{
		{"server-read-only", true, false, http.StatusForbidden},
		{"browser-read-only", false, false, http.StatusForbidden},
		{"enabled-no-transport", false, true, http.StatusServiceUnavailable},
		{"missing-nonce", false, true, http.StatusForbidden},
		{"stale-nonce", false, true, http.StatusConflict},
	} {
		t.Run(trial.name, func(t *testing.T) {
			s, c := testServer(t, trial.readOnly)
			if _, err := c.Typed.CoreV1().Pods("qa").Create(context.Background(), pod("web", "pod-uid"), metav1.CreateOptions{}); err != nil {
				t.Fatal(err)
			}
			cookie, info := diagnostic(t, s, "test", "qa", nil)
			nonce := info["connectionID"].(string)
			if trial.enable {
				if response := connectionRequest(s, http.MethodPost, "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); response.Code != http.StatusOK {
					t.Fatalf("management fixture: status=%d", response.Code)
				}
			}
			if trial.name == "missing-nonce" {
				nonce = ""
			} else if trial.name == "stale-nonce" {
				nonce = "synthetic-stale-intent"
			}
			request := httptest.NewRequest(http.MethodPost, "http://localhost/api/portforwards?context=test", strings.NewReader(`{"namespace":"qa","pod":"web","uid":"pod-uid","port":8080}`))
			request.AddCookie(cookie)
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("Origin", "http://localhost")
			request.Header.Set("X-KubeView-Connection", nonce)
			response := httptest.NewRecorder()
			mux := http.NewServeMux()
			s.Register(mux)
			mux.ServeHTTP(response, request)
			if response.Code != trial.status {
				t.Fatalf("forward creation gate: status=%d want=%d", response.Code, trial.status)
			}
			if trial.name == "enabled-no-transport" && !strings.Contains(response.Body.String(), "Port-forward taşıma yapılandırması yok") {
				t.Fatal("authorized creation did not reach the explicit missing-transport guard")
			}
			if len(s.forwards) != 0 {
				t.Fatal("synthetic missing-transport or denied request created a forward")
			}
		})
	}
}
