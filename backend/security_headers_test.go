package main

import (
	"io"
	"mime"
	"net/http"
	"net/http/httptest"
	"net/http/httputil"
	"strings"
	"testing"
	"testing/fstest"
)

const wantedMainUIContentSecurityPolicy = "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; script-src 'self'; worker-src 'self' blob:"

type securityHeaderTransport func(*http.Request) (*http.Response, error)

func (f securityHeaderTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

// Production uses sibling API/UI mux routes. ReverseProxy copies values with
// Header.Add: an outer/global UI policy would stack and break opaque scripts.
func securityHeadersMux(t *testing.T) *http.ServeMux {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("/api/resources", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"items":[]}`))
	})
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) { http.Error(w, "test handshake only", 400) })
	proxy := &httputil.ReverseProxy{Director: func(r *http.Request) { r.URL.Scheme = "http"; r.URL.Host = "synthetic-owned-workload" }, Transport: securityHeaderTransport(func(r *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 200, Header: http.Header{"Content-Type": {"text/html"}, "Content-Security-Policy": {"upstream-policy"}}, Body: io.NopCloser(strings.NewReader(`<script>globalThis.syntheticWorkload=true</script>`)), Request: r}, nil
	}), ModifyResponse: func(r *http.Response) error {
		r.Header.Set("Content-Security-Policy", "sandbox allow-scripts allow-forms")
		return nil
	}}
	mux.Handle("/api/portforward/", proxy)
	mux.Handle("/", frontendHandler(fstest.MapFS{"index.html": {Data: []byte(`<html><script type="module" src="/assets/app.js"></script></html>`)}, "assets/app.js": {Data: []byte(`export const normalUI=true;`)}}))
	return mux
}
func TestMainUIRestrictsScriptAndWorkerSources(t *testing.T) {
	h := securityHeadersMux(t)
	for _, target := range []string{"/", "/harbor", "/harbor?next=/api/portforward/demo/", "/%68arbor", "/assets/app.js", "/assets/%61pp.js", "/index.html?script-src=unsafe-inline", "/assets/missing.js", "/harbor/%2e%2e/index.html"} {
		t.Run(target, func(t *testing.T) {
			w := httptest.NewRecorder()
			h.ServeHTTP(w, httptest.NewRequest("GET", target, nil))
			values := w.Header().Values("Content-Security-Policy")
			if len(values) != 1 || values[0] != wantedMainUIContentSecurityPolicy {
				t.Fatalf("UI policy=%q status=%d", values, w.Code)
			}
			if strings.Contains(values[0], "unsafe-inline") || strings.Contains(values[0], "unsafe-eval") {
				t.Fatal("unsafe script source enabled")
			}
		})
	}
}
func TestMainUICSPDoesNotStackOnOpaqueWorkloadPreview(t *testing.T) {
	h := securityHeadersMux(t)
	for _, target := range []string{"/api/portforward/demo/", "/api/portforward/demo/?next=/index.html", "/api/%70ortforward/demo/", "/%61pi/portforward/demo/", "/api/portforward/demo/%2e%2e/index.html", "/api/portforward/demo/%2findex.html"} {
		t.Run(target, func(t *testing.T) {
			w := httptest.NewRecorder()
			h.ServeHTTP(w, httptest.NewRequest("GET", target, nil))
			if w.Code != 200 {
				t.Fatalf("preview status=%d", w.Code)
			}
			values := w.Header().Values("Content-Security-Policy")
			if len(values) != 1 || values[0] != "sandbox allow-scripts allow-forms" {
				t.Fatalf("preview inherited/stacked UI policy: %q", values)
			}
			if !strings.Contains(w.Body.String(), "<script>") {
				t.Fatal("workload script body changed")
			}
		})
	}
}
func TestMainUICSPAPIAndCanonicalRedirectBoundary(t *testing.T) {
	h := securityHeadersMux(t)
	for _, target := range []string{"/api/resources", "/%61pi/resources", "/api/%72esources?next=/harbor", "/ws", "/%77s", "/api/missing", "/api/portforward/demo/../", "//api/resources", "/harbor/../api/resources"} {
		t.Run(target, func(t *testing.T) {
			w := httptest.NewRecorder()
			h.ServeHTTP(w, httptest.NewRequest("GET", target, nil))
			if values := w.Header().Values("Content-Security-Policy"); len(values) != 0 {
				t.Fatalf("API/WS/redirect received UI policy: %q", values)
			}
			if w.Code == 301 || w.Code == 308 {
				location := w.Header().Get("Location")
				if location == "" {
					t.Fatal("canonical redirect missing target")
				}
				follow := httptest.NewRecorder()
				h.ServeHTTP(follow, httptest.NewRequest("GET", location, nil))
				if strings.Contains(follow.Header().Get("Content-Security-Policy"), "script-src") {
					t.Fatalf("canonical API redirect landed on UI policy: %s", location)
				}
			}
		})
	}
}

func TestFrontendMIMEAndSecurityHeaders(t *testing.T) {
	const entry = `<html><script type="module" src="/assets/app.js"></script></html>`
	const script = `export const normalUI=true;`
	h := frontendHandler(fstest.MapFS{
		"index.html":    {Data: []byte(entry)},
		"assets/app.js": {Data: []byte(script)},
	})
	for _, method := range []string{http.MethodGet, http.MethodHead} {
		for _, target := range []string{"/", "/harbor", "/assets/app.js", "/assets/missing.js"} {
			t.Run(method+target, func(t *testing.T) {
				w := httptest.NewRecorder()
				h.ServeHTTP(w, httptest.NewRequest(method, target, nil))
				for name, want := range map[string]string{
					"X-Content-Type-Options": "nosniff",
					"X-Frame-Options":        "DENY",
					"Referrer-Policy":        "no-referrer",
				} {
					if got := w.Header().Get(name); got != want {
						t.Errorf("%s=%q, want %q", name, got, want)
					}
				}
				mediaType, _, err := mime.ParseMediaType(w.Header().Get("Content-Type"))
				if err != nil {
					t.Fatalf("invalid Content-Type: %v", err)
				}
				switch target {
				case "/assets/missing.js":
					if w.Code != http.StatusNotFound || mediaType != "text/plain" || strings.Contains(w.Body.String(), "<html>") || strings.Contains(w.Body.String(), script) {
						t.Fatalf("missing JS must be a plain 404, not an application success: status=%d type=%q", w.Code, mediaType)
					}
				case "/assets/app.js":
					// Both registered JavaScript MIME types identify executable JS;
					// an HTML fallback must never masquerade as an asset success.
					if w.Code != http.StatusOK || (mediaType != "text/javascript" && mediaType != "application/javascript") {
						t.Fatalf("JS asset status=%d type=%q", w.Code, mediaType)
					}
					if method == http.MethodGet && w.Body.String() != script {
						t.Fatal("JS asset body changed to application HTML")
					}
				default:
					if w.Code != http.StatusOK || mediaType != "text/html" {
						t.Fatalf("application entry status=%d type=%q", w.Code, mediaType)
					}
					if method == http.MethodGet && w.Body.String() != entry {
						t.Fatal("application entry body missing")
					}
				}
				// Direct ResponseRecorder calls do not apply the HTTP server's
				// HEAD suppression to bodies written by http.NotFound/http.Error.
				if method == http.MethodHead && w.Code == http.StatusOK && w.Body.Len() != 0 {
					t.Fatal("HEAD response included a body")
				}
			})
		}
	}
}
