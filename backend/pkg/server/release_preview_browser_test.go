package server

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

type previewBrowserStats struct {
	mu       sync.Mutex
	Requests int                      `json:"requests"`
	Upstream int                      `json:"upstreamRequests"`
	Stripped bool                     `json:"upstreamCredentialsStripped"`
	Denied   []map[string]interface{} `json:"deniedRequests"`
}

type previewBrowserWriter struct {
	http.ResponseWriter
	status int
}

func (w *previewBrowserWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}
func (w *previewBrowserWriter) Write(data []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	return w.ResponseWriter.Write(data)
}
func (w *previewBrowserWriter) Flush() {
	if f, ok := w.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// TEST ONLY: this route surface is absent from production binaries. The process
// lifetime and all synthetic upstream transports are bounded independently.
func TestReleasePreviewBrowserFixture(t *testing.T) {
	if os.Getenv("KUBEVIEW_RELEASE_PREVIEW_BROWSER") != "1" {
		t.Skip("explicit synthetic browser fixture opt-in required")
	}
	t.Setenv("KUBECONFIG", filepath.Join(t.TempDir(), "absent-kubeconfig"))
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	listener, err := net.Listen("tcp", "127.0.0.1:19849")
	if err != nil {
		t.Fatal("owned fixture port 19849 unavailable; no process was stopped")
	}
	defer listener.Close()
	lifetime, cancel := context.WithTimeout(context.Background(), 145*time.Second)
	defer cancel()
	s, cookie, nonce, _ := releasePreviewFixture(t)
	stats := &previewBrowserStats{Stripped: true, Denied: []map[string]interface{}{}}
	s.forwards["synthetic"].expires = time.Now().Add(145 * time.Second)
	transport := &http.Transport{DisableKeepAlives: true, ResponseHeaderTimeout: 3 * time.Second, DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
		client, upstream := net.Pipe()
		_ = client.SetDeadline(time.Now().Add(4 * time.Second))
		_ = upstream.SetDeadline(time.Now().Add(4 * time.Second))
		go func() {
			defer upstream.Close()
			request, e := http.ReadRequest(bufio.NewReader(upstream))
			if e != nil {
				return
			}
			defer request.Body.Close()
			stripped := request.URL.Query().Get("connectionID") == ""
			for _, header := range []string{"Cookie", "Authorization", "Proxy-Authorization", "X-KubeView-Connection"} {
				stripped = stripped && request.Header.Get(header) == ""
			}
			stats.mu.Lock()
			stats.Upstream++
			stats.Stripped = stats.Stripped && stripped
			stats.mu.Unlock()
			status, body := http.StatusOK, previewBrowserCanary(nonce)
			headers := http.Header{"Content-Type": {"text/html"}, "Set-Cookie": {"synthetic-preview-takeover=1; Path=/"}, "Content-Security-Policy": {"sandbox allow-same-origin allow-scripts"}, "Access-Control-Allow-Origin": {"*"}, "Access-Control-Allow-Credentials": {"true"}}
			switch request.URL.Path {
			case "/redirect":
				status, body = http.StatusFound, "synthetic positive redirect"
				headers.Set("Location", "/canary?connectionID="+nonce)
			case "/redirect-negative":
				status, body = http.StatusFound, "synthetic prefix containment redirect"
				headers.Set("Location", "/api/management?connectionID="+nonce)
			case "/api/management":
				status, body = http.StatusNotFound, "TEST ONLY: redirect stayed inside preview upstream"
			}
			response := &http.Response{StatusCode: status, ProtoMajor: 1, ProtoMinor: 1, Header: headers, Body: io.NopCloser(strings.NewReader(body)), ContentLength: -1, Close: true}
			_ = response.Write(upstream)
		}()
		return client, nil
	}}
	t.Cleanup(transport.CloseIdleConnections)
	s.forwards["synthetic"].transport = transport
	mux := http.NewServeMux()
	s.Register(mux)
	mux.HandleFunc("/__test/control", func(w http.ResponseWriter, r *http.Request) {
		http.SetCookie(w, cookie)
		http.SetCookie(w, &http.Cookie{Name: s.accessCookieName(), Value: releasePreviewToken, Path: "/", HttpOnly: true, SameSite: http.SameSiteStrictMode})
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprintf(w, `<!doctype html><title>TEST ONLY synthetic preview controller</title><a id="normal" target="_blank" rel="noopener noreferrer" href="/api/portforward/synthetic/?connectionID=%s">Open synthetic preview</a><a id="positive" target="_blank" rel="noopener noreferrer" href="/api/portforward/synthetic/redirect?connectionID=%s">Positive redirect</a><a id="negative" target="_blank" rel="noopener noreferrer" href="/api/portforward/synthetic/redirect-negative?connectionID=%s">Contained redirect</a>`, nonce, nonce, nonce)
	})
	mux.HandleFunc("/__test/stats", func(w http.ResponseWriter, r *http.Request) {
		stats.mu.Lock()
		defer stats.mu.Unlock()
		jsonResponse(w, 200, map[string]interface{}{"requests": stats.Requests, "upstreamRequests": stats.Upstream, "upstreamCredentialsStripped": stats.Stripped, "deniedRequests": stats.Denied})
	})
	mux.HandleFunc("/__test/stop", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" || !SameOrigin(r) {
			problem(w, 403, "test stop rejected")
			return
		}
		w.WriteHeader(204)
		cancel()
	})
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		stats.mu.Lock()
		stats.Requests++
		count := stats.Requests
		stats.mu.Unlock()
		if count > 64 {
			problem(w, 429, "synthetic request budget exceeded")
			cancel()
			return
		}
		observed := &previewBrowserWriter{ResponseWriter: w}
		mux.ServeHTTP(observed, r)
		if r.Header.Get("Origin") == "null" && (r.URL.Path == "/api/connection" || r.URL.Path == "/api/management") {
			stats.mu.Lock()
			stats.Denied = append(stats.Denied, map[string]interface{}{"path": r.URL.Path, "method": r.Method, "origin": "null", "status": observed.status, "knownNonce": r.URL.Query().Get("connectionID") == nonce})
			stats.mu.Unlock()
		}
	})
	server := &http.Server{Handler: handler, ReadHeaderTimeout: 3 * time.Second, IdleTimeout: 3 * time.Second}
	finished := make(chan error, 1)
	go func() { finished <- server.Serve(listener) }()
	fmt.Println("TEST-ONLY synthetic preview fixture ready 127.0.0.1:19849")
	<-lifetime.Done()
	shutdown, stop := context.WithTimeout(context.Background(), 2*time.Second)
	defer stop()
	if e := server.Shutdown(shutdown); e != nil {
		_ = server.Close()
	}
	if e := <-finished; e != nil && e != http.ErrServerClosed {
		t.Error("synthetic fixture server failed")
	}
}

func previewBrowserCanary(nonce string) string {
	return fmt.Sprintf(`<!doctype html><title>TEST ONLY opaque preview canary</title><p>Sentetik browser izolasyon kanıtı</p><script>
(async()=>{
const nonce=%q, base='http://127.0.0.1:19849';
const result={jsRan:true,opaqueOrigin:self.origin==='null',openerAbsent:opener===null};
try{document.cookie;result.cookieDenied=false}catch(e){result.cookieDenied=e.name==='SecurityError'}
try{localStorage.setItem('synthetic-preview','inert');result.storageDenied=false}catch(e){result.storageDenied=e.name==='SecurityError'}
const query='?context=test&namespace=qa&connectionID='+encodeURIComponent(nonce);
const attempts=[['read',base+'/api/connection'+query,{}],['managementSimple',base+'/api/management'+query,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({enabled:true,context:'test',namespace:'qa',connectionID:nonce})}],['managementJSON',base+'/api/management'+query,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:true,context:'test',namespace:'qa',connectionID:nonce})}]];
result.attempts=[];
for(const [kind,url,options] of attempts){try{const response=await fetch(url,{...options,credentials:'include'});result.attempts.push({kind,fetchResolved:true,status:response.status})}catch(e){result.attempts.push({kind,fetchResolved:false,errorName:e.name})}}
window.__previewEvidence=result;
})().catch(()=>{window.__previewEvidence={canaryFailure:true}});
</script>`, nonce)
}
