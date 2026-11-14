package server

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	dynamicfake "k8s.io/client-go/dynamic/fake"
)

func releaseSessionCookie(t *testing.T, w *httptest.ResponseRecorder, name string) *http.Cookie {
	t.Helper()
	for _, c := range w.Result().Cookies() {
		if c.Name == name {
			return c
		}
	}
	t.Fatal("expected session cookie missing")
	return nil
}
func releaseSessionCookieFlags(t *testing.T, c *http.Cookie, secure bool) {
	t.Helper()
	if !c.HttpOnly || c.SameSite != http.SameSiteStrictMode || c.Secure != secure || c.Path != "/" || c.MaxAge != 28800 {
		t.Fatal("session cookie flags or eight-hour MaxAge mismatch")
	}
}
func TestReleaseSessionCreationShapeFreshnessAndCookieFlags(t *testing.T) {
	s, _ := testServer(t, false)
	seen := map[string]bool{}
	for _, secure := range []bool{false, true} {
		name := "http"
		scheme := "http"
		if secure {
			name = "tls"
			scheme = "https"
		}
		t.Run(name, func(t *testing.T) {
			for i := 0; i < 4; i++ {
				req := httptest.NewRequest("GET", scheme+"://localhost/api/connection", nil)
				if secure {
					req.TLS = &tls.ConnectionState{}
				}
				w := httptest.NewRecorder()
				_, session := s.operator(req, w)
				cookie := releaseSessionCookie(t, w, operatorCookie)
				releaseSessionCookieFlags(t, cookie, secure)
				for _, value := range []string{cookie.Value, session.nonce} {
					id, err := uuid.Parse(value)
					if err != nil || len(value) != 36 || id.Version() != 4 || id.Variant() != uuid.RFC4122 {
						t.Fatal("generated identity is not canonical RFC4122 UUIDv4")
					}
					if seen[value] {
						t.Fatal("small creation sample reused an identity")
					}
					seen[value] = true
				}
			}
		})
	}
	// The access cookie holds a configured token, not a newly generated UUID.
	s.Token = "SYNTHETIC-CONFIGURED-ACCESS-TOKEN-NOT-A-CREDENTIAL"
	for _, secure := range []bool{false, true} {
		scheme := "http"
		if secure {
			scheme = "https"
		}
		raw, _ := json.Marshal(map[string]string{"token": s.Token})
		req := httptest.NewRequest("POST", scheme+"://localhost/api/session", bytes.NewReader(raw))
		req.Header.Set("Content-Type", "application/json")
		if secure {
			req.TLS = &tls.ConnectionState{}
		}
		w := httptest.NewRecorder()
		mux := http.NewServeMux()
		s.Register(mux)
		mux.ServeHTTP(w, req)
		if w.Code != 200 {
			t.Fatal("valid synthetic access-token session rejected")
		}
		cookie := releaseSessionCookie(t, w, accessCookie)
		releaseSessionCookieFlags(t, cookie, secure)
		if cookie.Value != s.Token {
			t.Fatal("access cookie differs from configured synthetic token")
		}
	}
}
func TestReleaseSessionExpiredCookieCannotReplayOrRestoreGrant(t *testing.T) {
	s, c := testServer(t, false, pod("web", "pod-uid"))
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	nonce := info["connectionID"].(string)
	enable := func(cookie *http.Cookie, n string) int {
		return connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", n, true), cookie, "").Code
	}
	path := "/api/resources?context=test&resource=pods&namespace=qa&name=web"
	body := map[string]interface{}{"object": pod("web", "pod-uid")}
	dyn := c.Dynamic.(*dynamicfake.FakeDynamicClient)
	if enable(cookie, nonce) != 200 {
		t.Fatal("fresh grant positive rejected")
	}
	if w := connectionRequest(s, "PUT", path, body, cookie, nonce); w.Code != 200 {
		t.Fatal("fresh session write positive rejected")
	}
	s.operatorMu.Lock()
	session := s.operators[cookie.Value]
	session.expires = time.Now().Add(-time.Second)
	s.operatorMu.Unlock()
	dyn.ClearActions()
	if w := connectionRequest(s, "PUT", path, body, cookie, nonce); w.Code != 403 {
		t.Fatal("expired session replay not rejected")
	}
	s.operatorMu.Lock()
	absolute := session.expires
	resetOperator(session)
	deadline, ok := session.ctx.Deadline()
	s.operatorMu.Unlock()
	if !ok || !deadline.Equal(absolute) || session.ctx.Err() == nil {
		t.Fatal("scope reset revived or extended expired authority")
	}
	if enable(cookie, nonce) != 403 {
		t.Fatal("expired cookie revived management after reset")
	}
	w := connectionRequest(s, "GET", "/api/connection?context=test&namespace=qa", nil, cookie, "")
	if w.Code != 200 {
		t.Fatal("fresh diagnostic after expiry failed")
	}
	fresh := releaseSessionCookie(t, w, operatorCookie)
	var next map[string]interface{}
	if json.Unmarshal(w.Body.Bytes(), &next) != nil {
		t.Fatal("invalid diagnostic JSON")
	}
	freshNonce := next["connectionID"].(string)
	if fresh.Value == cookie.Value || freshNonce == nonce || next["managementEnabled"] != false || next["readOnly"] != true {
		t.Fatal("expired identity/grant reused by diagnostic")
	}
	if w := connectionRequest(s, "PUT", path, body, cookie, nonce); w.Code != 403 {
		t.Fatal("old cookie replay accepted after new session")
	}
	if enable(fresh, nonce) != 409 {
		t.Fatal("old nonce accepted by fresh cookie")
	}
	for _, a := range dyn.Actions() {
		switch a.GetVerb() {
		case "create", "update", "patch", "delete":
			t.Fatal("expired/replayed authority reached a fake workload mutation")
		}
	}
	if enable(fresh, freshNonce) != 200 {
		t.Fatal("fresh replacement authority could not be explicitly granted")
	}
	if w := connectionRequest(s, "PUT", path, body, fresh, freshNonce); w.Code != 200 {
		t.Fatal("fresh replacement grant positive failed")
	}
}
