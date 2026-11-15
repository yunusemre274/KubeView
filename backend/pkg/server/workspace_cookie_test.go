package server

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/k8s-tersane/tersane/backend/pkg/workspace"
)

type cookieProfile struct {
	s              *Server
	http           *httptest.Server
	dataDir, scope string
}

func newCookieProfile(t *testing.T, token string) *cookieProfile {
	t.Helper()
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	s, _ := testServer(t, false)
	s.Namespace = ""
	s.Token = token
	dir := filepath.Join(t.TempDir(), "app-data")
	if err := s.ConfigureWorkspace(dir, "test", "qa"); err != nil {
		t.Fatal(err)
	}
	doc := s.workspace.store.Snapshot()
	mux := http.NewServeMux()
	s.Register(mux)
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)
	return &cookieProfile{s: s, http: server, dataDir: dir, scope: "workspaceId=" + doc.ID + "&harborId=" + doc.Harbors[0].ID + "&tabId=tab"}
}
func cookieRequest(t *testing.T, client *http.Client, profile *cookieProfile, method, path string, body interface{}, headers map[string]string) (int, map[string]interface{}) {
	t.Helper()
	data, _ := json.Marshal(body)
	request, err := http.NewRequest(method, profile.http.URL+path, bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	request.Header.Set("Content-Type", "application/json")
	for name, value := range headers {
		request.Header.Set(name, value)
	}
	response, err := client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var result map[string]interface{}
	if err = json.NewDecoder(response.Body).Decode(&result); err != nil {
		t.Fatalf("invalid JSON status=%d", response.StatusCode)
	}
	return response.StatusCode, result
}
func requireCookieStatus(t *testing.T, status, wanted int, label string) {
	t.Helper()
	if status != wanted {
		t.Fatalf("%s: status=%d wanted=%d", label, status, wanted)
	}
}
func enableCookieProfile(t *testing.T, client *http.Client, profile *cookieProfile) (string, map[string]interface{}) {
	t.Helper()
	status, workspace := cookieRequest(t, client, profile, "GET", "/api/workspace", nil, nil)
	requireCookieStatus(t, status, 200, "workspace bootstrap")
	status, diagnostic := cookieRequest(t, client, profile, "GET", "/api/connection?"+profile.scope, nil, nil)
	requireCookieStatus(t, status, 200, "diagnostic")
	nonce := diagnostic["connectionID"].(string)
	status, _ = cookieRequest(t, client, profile, "POST", "/api/management?"+profile.scope, map[string]interface{}{"enabled": true, "context": "test", "namespace": "qa", "connectionID": nonce}, nil)
	requireCookieStatus(t, status, 200, "enable profile")
	return nonce, workspace
}

func TestWorkspaceProfileCookiesDoNotCollideAcrossSameHostPorts(t *testing.T) {
	t.Run("operator_nonce_and_grant", func(t *testing.T) {
		a, b := newCookieProfile(t, ""), newCookieProfile(t, "")
		jar, _ := cookiejar.New(nil)
		client := &http.Client{Jar: jar, Timeout: 5 * time.Second}
		_, aWorkspace := enableCookieProfile(t, client, a)
		enableCookieProfile(t, client, b)
		status, diagnostic := cookieRequest(t, client, a, "GET", "/api/connection?"+a.scope, nil, nil)
		requireCookieStatus(t, status, 200, "return to A")
		if diagnostic["managementEnabled"] != true {
			t.Error("opening profile B revoked profile A browser grant")
		}
		status, _ = cookieRequest(t, client, a, "PATCH", "/api/workspace", map[string]interface{}{"revision": aWorkspace["revision"], "name": "Profile A"}, map[string]string{"X-KubeView-Workspace-Nonce": aWorkspace["workspaceNonce"].(string)})
		if status != 200 {
			t.Errorf("opening profile B invalidated profile A workspace nonce: status=%d", status)
		}
		status, diagnostic = cookieRequest(t, client, b, "GET", "/api/connection?"+b.scope, nil, nil)
		requireCookieStatus(t, status, 200, "return to B")
		if diagnostic["managementEnabled"] != true {
			t.Error("returning to profile A revoked profile B browser grant")
		}
	})
	t.Run("independent_access_tokens", func(t *testing.T) {
		tokenA, tokenB := strings.Repeat("a", 32), strings.Repeat("b", 32)
		a, b := newCookieProfile(t, tokenA), newCookieProfile(t, tokenB)
		jar, _ := cookiejar.New(nil)
		client := &http.Client{Jar: jar, Timeout: 5 * time.Second}
		status, _ := cookieRequest(t, client, a, "POST", "/api/session", map[string]string{"token": tokenA}, nil)
		requireCookieStatus(t, status, 200, "login A")
		enableCookieProfile(t, client, a)
		status, _ = cookieRequest(t, client, b, "POST", "/api/session", map[string]string{"token": tokenB}, nil)
		requireCookieStatus(t, status, 200, "login B")
		enableCookieProfile(t, client, b)
		status, diagnostic := cookieRequest(t, client, a, "GET", "/api/connection?"+a.scope, nil, nil)
		if status != 200 {
			t.Errorf("login B replaced profile A access session: status=%d", status)
		} else if diagnostic["managementEnabled"] != true {
			t.Error("login B replaced profile A operator session")
		}
		status, diagnostic = cookieRequest(t, client, b, "GET", "/api/connection?"+b.scope, nil, nil)
		requireCookieStatus(t, status, 200, "authenticated B remains available")
		if diagnostic["managementEnabled"] != true {
			t.Error("profile B grant changed")
		}
		status, _ = cookieRequest(t, client, a, "GET", "/api/workspace", nil, map[string]string{"Authorization": "Bearer " + tokenB})
		requireCookieStatus(t, status, 401, "wrong profile bearer remains rejected")
	})
}

func TestWorkspaceProfileCookieNamesStableAcrossRestartWithoutGrant(t *testing.T) {
	profile := newCookieProfile(t, strings.Repeat("c", 32))
	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar, Timeout: 5 * time.Second}
	status, _ := cookieRequest(t, client, profile, "POST", "/api/session", map[string]string{"token": profile.s.Token}, nil)
	requireCookieStatus(t, status, 200, "login")
	oldNonce, oldWorkspace := enableCookieProfile(t, client, profile)
	profile.http.Close()
	profile.s.Close()
	replacement := New()
	replacement.Namespace = ""
	replacement.Token = profile.s.Token
	replacement.ReadOnly = false
	replacement.clients = profile.s.clients
	if err := replacement.ConfigureWorkspace(profile.dataDir, "", ""); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(replacement.Close)
	mux := http.NewServeMux()
	replacement.Register(mux)
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)
	restarted := &cookieProfile{s: replacement, http: server, dataDir: profile.dataDir, scope: profile.scope}
	status, workspace := cookieRequest(t, client, restarted, "GET", "/api/workspace", nil, nil)
	requireCookieStatus(t, status, 200, "stable access cookie after same-workspace restart")
	if workspace["id"] != oldWorkspace["id"] {
		t.Fatal("workspace identity changed on restart")
	}
	status, diagnostic := cookieRequest(t, client, restarted, "GET", "/api/connection?"+restarted.scope, nil, nil)
	requireCookieStatus(t, status, 200, "restart diagnostic")
	if diagnostic["managementEnabled"] != false || diagnostic["connectionID"] == oldNonce {
		t.Fatal("restart restored old browser management grant")
	}
	status, _ = cookieRequest(t, client, restarted, "POST", "/api/management?"+restarted.scope, map[string]interface{}{"enabled": true, "context": "test", "namespace": "qa", "connectionID": oldNonce}, nil)
	requireCookieStatus(t, status, 409, "old management nonce rejected after restart")
	status, _ = cookieRequest(t, client, restarted, "PATCH", "/api/workspace", map[string]interface{}{"revision": workspace["revision"], "name": "stale request"}, map[string]string{"X-KubeView-Workspace-Nonce": oldWorkspace["workspaceNonce"].(string)})
	requireCookieStatus(t, status, 403, "old workspace nonce rejected after restart")
}

func TestWorkspaceCookieNamesKeepLegacyGatewayContract(t *testing.T) {
	legacy := New()
	defer legacy.Close()
	if legacy.operatorCookieName() != operatorCookie || legacy.accessCookieName() != accessCookie {
		t.Fatal("unconfigured legacy cookie names changed")
	}
	a, b := newCookieProfile(t, ""), newCookieProfile(t, "")
	if !strings.HasPrefix(a.s.operatorCookieName(), operatorCookie+"_") || !strings.HasPrefix(a.s.accessCookieName(), accessCookie+"_") || a.s.operatorCookieName() == b.s.operatorCookieName() || a.s.accessCookieName() == b.s.accessCookieName() {
		t.Fatal("configured workspace cookie namespaces not distinct")
	}
	operatorName, accessName := a.s.operatorCookieName(), a.s.accessCookieName()
	doc := a.s.workspace.store.Snapshot()
	if _, err := a.s.workspace.store.Update(doc.Revision, func(d *workspace.Document) error { d.Name = "renamed"; return nil }); err != nil {
		t.Fatal(err)
	}
	if a.s.operatorCookieName() != operatorName || a.s.accessCookieName() != accessName {
		t.Fatal("renaming workspace changed cookie namespace")
	}
}
