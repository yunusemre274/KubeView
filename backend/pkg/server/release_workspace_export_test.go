package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
)

// Real loopback HTTP and production session/workspace handlers; Kubernetes
// clients, private client configuration and Secret are synthetic fixtures.
// No real cluster or native release package acceptance is claimed.
func TestReleaseWorkspaceExportAuthorityBoundary(t *testing.T) {
	token := strings.Repeat("export-synthetic-access-", 3)
	source := newCookieProfile(t, token)
	jar, _ := cookiejar.New(nil)
	client := &http.Client{Jar: jar, Timeout: 3 * time.Second, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	do := func(client *http.Client, profile *cookieProfile, method, path string, body interface{}, headers map[string]string) (int, []byte) {
		t.Helper()
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatal("fixture JSON encoding failed")
		}
		req, err := http.NewRequest(method, profile.http.URL+path, bytes.NewReader(raw))
		if err != nil {
			t.Fatal("fixture request construction failed")
		}
		req.Header.Set("Content-Type", "application/json")
		for k, v := range headers {
			req.Header.Set(k, v)
		}
		resp, err := client.Do(req)
		if err != nil {
			t.Fatal("owned HTTP request failed")
		}
		defer resp.Body.Close()
		b, err := io.ReadAll(io.LimitReader(resp.Body, 2<<20))
		if err != nil || len(b) >= 2<<20 {
			t.Fatal("owned HTTP response bound/read failure")
		}
		return resp.StatusCode, b
	}
	mustStatus := func(actual, wanted int, label string) {
		t.Helper()
		if actual != wanted {
			t.Fatalf("%s HTTP%d want%d", label, actual, wanted)
		}
	}
	status, _ := do(client, source, "POST", "/api/session", map[string]string{"token": token}, nil)
	mustStatus(status, 200, "source login")
	current := source.s.workspace.store.Snapshot()
	_, err := source.s.workspace.store.Update(current.Revision, func(d *ws.Document) error {
		d.Name = "Export fixture workspace"
		d.Preferences = map[string]interface{}{"theme": "light", "motion": map[string]interface{}{"water": true}}
		d.Connections[0].Name = "test" // Display names may legitimately equal context names.
		d.Harbors[0].Name = "Frontend harbor"
		d.Harbors[0].Selector = "app=front"
		d.Harbors[0].View = map[string]interface{}{"zoom": float64(2)}
		second := d.Harbors[0]
		second.ID = "export-secondary-harbor"
		second.Name = "Backend harbor"
		second.Selector = "app=back"
		second.Position = [2]float64{500, 0}
		second.View = map[string]interface{}{"zoom": float64(3)}
		d.Harbors = append(d.Harbors, second)
		d.Relations = []ws.Relation{{ID: "export-configured-relation", Type: "configured", Origin: "user", SourceHarbor: d.Harbors[0].ID, TargetHarbor: second.ID}}
		return nil
	})
	if err != nil {
		t.Fatal("safe metadata fixture update failed")
	}
	connectionNonce, workspaceDTO := enableCookieProfile(t, client, source)
	nonce := workspaceDTO["workspaceNonce"].(string)
	before := source.s.workspace.store.Snapshot()
	privatePath := filepath.Join(source.dataDir, "not-read-client-key")
	markers := []string{token, nonce, connectionNonce, privatePath, "export-synthetic-private-bearer", "export-synthetic-private-key", "export-synthetic-secret-value", "export-synthetic-cluster-identity"}
	parsed, _ := url.Parse(source.http.URL)
	for _, cookie := range jar.Cookies(parsed) {
		markers = append(markers, cookie.Value)
	}
	source.s.mu.Lock()
	source.s.clients["unused-private-client"] = &Clients{Name: "unused-private-client", ID: "export-private-generation", Config: &rest.Config{Host: "https://127.0.0.1:1", BearerToken: markers[4], TLSClientConfig: rest.TLSClientConfig{KeyData: []byte(markers[5]), CertFile: privatePath}}}
	source.s.mu.Unlock()
	if _, err = source.s.clients["test"].Typed.CoreV1().Secrets("qa").Create(context.Background(), &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "export-synthetic-secret", Namespace: "qa"}, Data: map[string][]byte{"value": []byte(markers[6])}}, metav1.CreateOptions{}); err != nil {
		t.Fatal("synthetic Secret fixture failed")
	}
	source.s.workspace.mu.Lock()
	source.s.workspace.identities[before.Connections[0].ID] = connectionIdentity{ClusterUID: markers[7], Confidence: "verified", CredentialGeneration: source.s.clients["test"].ID, AuthorizationKey: "export-private-authz-key"}
	source.s.workspace.mu.Unlock()
	markers = append(markers, "export-private-generation", "export-private-authz-key")
	sourceCookie := ""
	for _, cookie := range jar.Cookies(parsed) {
		if cookie.Name == source.s.operatorCookieName() {
			sourceCookie = cookie.Value
		}
	}
	if sourceCookie == "" {
		t.Fatal("normal HTTP handshake did not provide source operator cookie")
	}
	scopedKey := sourceCookie + "|" + before.ID + "|" + before.Harbors[0].ID + "|tab"
	source.s.operatorMu.Lock()
	session := source.s.operators[scopedKey]
	enabledBefore := session != nil && session.enabled && session.nonce == connectionNonce
	source.s.operatorMu.Unlock()
	if !enabledBefore {
		t.Fatal("normal HTTP handshake did not enable the scoped management grant")
	}
	filesBefore := releaseParserFiles(t, source.dataDir)
	var exported ws.Document
	var exportBody []byte
	t.Run("normal_export_preserves_safe_metadata", func(t *testing.T) {
		status, b := do(client, source, "GET", "/api/workspace/export", nil, nil)
		mustStatus(status, 200, "export")
		exportBody = b
		if err := json.Unmarshal(b, &exported); err != nil {
			t.Fatal("export not a workspace document")
		}
		if exported.ID != before.ID || exported.Name != before.Name || exported.Revision != before.Revision || !reflect.DeepEqual(exported.Preferences, before.Preferences) || !reflect.DeepEqual(exported.Harbors, before.Harbors) || !reflect.DeepEqual(exported.Relations, before.Relations) {
			t.Fatal("export changed safe workspace/harbor/relation metadata")
		}
		if len(exported.Connections) != 1 || exported.Connections[0].Name != "test" || exported.Connections[0].ID != before.Connections[0].ID {
			t.Fatal("display connection metadata not preserved")
		}
		t.Log("EXPORT normalHTTP200 metadataNamesSelectorsRelationsPreserved=true")
	})
	if exportBody == nil {
		t.Fatal("normal export prerequisite did not produce evidence")
	}
	assertMarkersAbsent := func(t *testing.T, b []byte) {
		t.Helper()
		for _, marker := range markers {
			if marker != "" && bytes.Contains(b, []byte(marker)) {
				t.Fatal("sensitive fixture marker unexpectedly present (value redacted)")
			}
		}
	}
	t.Run("authority_and_sensitive_material_absent", func(t *testing.T) {
		if exported.Connections[0].Context != "" || exported.Connections[0].Bound {
			t.Fatal("export carried a trusted context binding")
		}
		var doc map[string]interface{}
		if err := json.Unmarshal(exportBody, &doc); err != nil {
			t.Fatal("invalid export JSON")
		}
		for _, key := range []string{"workspaceNonce", "connectionID", "token", "cookie", "enabled", "managementEnabled", "writeGrant", "privateKey"} {
			if _, ok := doc[key]; ok {
				t.Fatal("export contains authority-bearing root field")
			}
		}
		for _, item := range doc["connections"].([]interface{}) {
			conn := item.(map[string]interface{})
			for _, key := range []string{"context", "identity", "authorizationKey", "credentialGeneration", "token", "config", "cookie", "nonce"} {
				if _, ok := conn[key]; ok {
					t.Fatal("export contains authority-bearing connection field")
				}
			}
		}
		assertMarkersAbsent(t, exportBody)
		for _, contents := range releaseParserFiles(t, source.dataDir) {
			assertMarkersAbsent(t, []byte(contents))
		}
		t.Log("EXPORT credentialNonceCookieGrantIdentitySecretMarkersAbsent=true persistedFilesMarkersAbsent=true")
	})
	t.Run("source_state_and_enabled_grant_unchanged", func(t *testing.T) {
		if !reflect.DeepEqual(before, source.s.workspace.store.Snapshot()) || !reflect.DeepEqual(filesBefore, releaseParserFiles(t, source.dataDir)) {
			t.Fatal("export changed source canonical config/files")
		}
		source.s.operatorMu.Lock()
		unchanged := source.s.operators[scopedKey] == session && session.enabled && session.nonce == connectionNonce
		source.s.operatorMu.Unlock()
		if !unchanged {
			t.Fatal("export changed active source management grant")
		}
		status, b := do(client, source, "GET", "/api/connection?"+source.scope, nil, nil)
		mustStatus(status, 200, "source remains usable")
		var diagnostic map[string]interface{}
		json.Unmarshal(b, &diagnostic)
		if diagnostic["managementEnabled"] != true || diagnostic["connectionID"] != connectionNonce {
			t.Fatal("normal source diagnostic no longer reports original enabled grant")
		}
		t.Log("EXPORT sourceConfigFilesGrantNonceUnchanged=true normalDiagnostic200=true")
	})
	t.Run("http_import_cannot_restore_binding_or_grant", func(t *testing.T) {
		destination := newCookieProfile(t, strings.Repeat("destination-synthetic-access-", 3))
		dstJar, _ := cookiejar.New(nil)
		dstClient := &http.Client{Jar: dstJar, Timeout: 3 * time.Second}
		status, _ := do(dstClient, destination, "POST", "/api/session", map[string]string{"token": destination.s.Token}, nil)
		mustStatus(status, 200, "destination login")
		status, b := do(dstClient, destination, "GET", "/api/workspace", nil, nil)
		mustStatus(status, 200, "destination normal workspace")
		var dto map[string]interface{}
		json.Unmarshal(b, &dto)
		dstBefore := destination.s.workspace.store.Snapshot()
		// Deliberately reintroduce untrusted authority fields into the HTTP import;
		// the handler must not restore a source binding, identity or management grant.
		var untrusted map[string]interface{}
		json.Unmarshal(exportBody, &untrusted)
		incoming := untrusted["connections"].([]interface{})[0].(map[string]interface{})
		incoming["context"] = "test"
		incoming["bound"] = true
		incoming["identity"] = map[string]interface{}{"clusterUID": "export-forged-admin-cluster", "confidence": "verified"}
		incoming["authorizationKey"] = "export-forged-admin-authz"
		untrusted["workspaceNonce"] = nonce
		untrusted["managementEnabled"] = true
		untrusted["writeGrant"] = connectionNonce
		status, b = do(dstClient, destination, "POST", "/api/workspace/import", map[string]interface{}{"revision": dstBefore.Revision, "workspace": untrusted}, map[string]string{"X-KubeView-Workspace-Nonce": dto["workspaceNonce"].(string)})
		mustStatus(status, 200, "HTTP import")
		dst := destination.s.workspace.store.Snapshot()
		if len(dst.Connections) != 2 || len(dst.Harbors) != 3 || len(dst.Relations) != 1 {
			t.Fatal("import collection shape unexpected")
		}
		if !reflect.DeepEqual(dst.Connections[0], dstBefore.Connections[0]) || !reflect.DeepEqual(dst.Harbors[0], dstBefore.Harbors[0]) {
			t.Fatal("import changed existing destination trusted connection")
		}
		imported := dst.Connections[1]
		if imported.ID == exported.Connections[0].ID || imported.Context != "" || imported.Bound {
			t.Fatal("HTTP import restored source authority")
		}
		for _, h := range dst.Harbors[1:] {
			if h.WorkspaceID != dst.ID || h.ConnectionRef != imported.ID {
				t.Fatal("imported references not remapped")
			}
		}
		if dst.Relations[0].Type != "configured" || dst.Relations[0].Origin != "user-imported" {
			t.Fatal("import promoted a configured relation into observed infrastructure")
		}
		scope := "workspaceId=" + dst.ID + "&harborId=" + dst.Harbors[1].ID + "&tabId=tab"
		status, _ = do(dstClient, destination, "GET", "/api/resources?resource=pods&namespace=qa&context=test&"+scope, nil, nil)
		mustStatus(status, 409, "unbound imported resource access")
		status, _ = do(dstClient, destination, "POST", "/api/management?"+scope, map[string]interface{}{"enabled": true, "context": "test", "namespace": "qa", "connectionID": connectionNonce}, nil)
		mustStatus(status, 409, "source grant cannot enable imported harbor")
		destination.s.operatorMu.Lock()
		for _, entry := range destination.s.operators {
			if entry.enabled {
				destination.s.operatorMu.Unlock()
				t.Fatal("import restored enabled operator grant")
			}
		}
		destination.s.operatorMu.Unlock()
		for _, contents := range releaseParserFiles(t, destination.dataDir) {
			assertMarkersAbsent(t, []byte(contents))
			if strings.Contains(contents, "export-forged-admin-") {
				t.Fatal("unknown authority fields persisted")
			}
		}
		if !reflect.DeepEqual(before, source.s.workspace.store.Snapshot()) {
			t.Fatal("destination import changed source workspace")
		}
		t.Log("EXPORT HTTPimport200 importedContextEmptyBoundFalse=true originalDestinationPreserved=true resource409/sourceGrant409=true destinationGrantDisabled=true")
	})
	t.Run("unauthenticated_export_rejected", func(t *testing.T) {
		c := &http.Client{Timeout: 3 * time.Second}
		status, b := do(c, source, "GET", "/api/workspace/export", nil, nil)
		mustStatus(status, 401, "unauthenticated export")
		assertMarkersAbsent(t, b)
	})
	t.Run("wrong_access_token_rejected", func(t *testing.T) {
		c := &http.Client{Timeout: 3 * time.Second}
		status, b := do(c, source, "GET", "/api/workspace/export", nil, map[string]string{"Authorization": "Bearer export-wrong-synthetic-access"})
		mustStatus(status, 401, "wrong access token")
		assertMarkersAbsent(t, b)
	})
	t.Run("foreign_origin_export_rejected", func(t *testing.T) {
		status, b := do(client, source, "GET", "/api/workspace/export", nil, map[string]string{"Origin": "https://attacker.invalid"})
		mustStatus(status, 403, "foreign origin")
		assertMarkersAbsent(t, b)
	})
	t.Run("non_get_export_rejected_without_config_change", func(t *testing.T) {
		status, b := do(client, source, "POST", "/api/workspace/export", map[string]interface{}{"revision": before.Revision}, map[string]string{"X-KubeView-Workspace-Nonce": nonce})
		mustStatus(status, 422, "non-GET export path")
		assertMarkersAbsent(t, b)
		if !reflect.DeepEqual(before, source.s.workspace.store.Snapshot()) || !reflect.DeepEqual(filesBefore, releaseParserFiles(t, source.dataDir)) {
			t.Fatal("rejected export method mutated source config/files")
		}
	})
}
