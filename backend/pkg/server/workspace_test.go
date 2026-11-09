package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	discoveryfake "k8s.io/client-go/discovery/fake"
)

type workspaceFixture struct {
	t      *testing.T
	s      *Server
	c      *Clients
	mux    *http.ServeMux
	cookie *http.Cookie
	nonce  string
	doc    ws.Document
}

func newWorkspaceFixture(t *testing.T, readOnly bool, objects ...runtime.Object) *workspaceFixture {
	t.Helper()
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	s, c := testServer(t, readOnly, objects...)
	s.Namespace = ""
	if err := s.ConfigureWorkspace(filepath.Join(t.TempDir(), "private-workspace"), "", ""); err != nil {
		t.Fatal(err)
	}
	f := &workspaceFixture{t: t, s: s, c: c, mux: http.NewServeMux()}
	s.Register(f.mux)
	r := f.request("GET", "/api/workspace", nil, "", "")
	if r.Code != 200 {
		t.Fatal(r.Code, r.Body.String())
	}
	f.accept(r)
	return f
}
func (f *workspaceFixture) request(method, path string, body interface{}, nonce, impact string) *httptest.ResponseRecorder {
	data, _ := json.Marshal(body)
	r := httptest.NewRequest(method, "http://localhost"+path, bytes.NewReader(data))
	r.Header.Set("Content-Type", "application/json")
	if f.cookie != nil {
		r.AddCookie(f.cookie)
	}
	r.Header.Set("X-KubeView-Workspace-Nonce", f.nonce)
	r.Header.Set("X-KubeView-Connection", nonce)
	if impact != "" {
		r.Header.Set("X-KubeView-Cluster-Impact", impact)
	}
	out := httptest.NewRecorder()
	f.mux.ServeHTTP(out, r)
	return out
}
func (f *workspaceFixture) accept(r *httptest.ResponseRecorder) {
	f.t.Helper()
	if err := json.Unmarshal(r.Body.Bytes(), &f.doc); err != nil {
		f.t.Fatal(err)
	}
	var extra struct {
		Nonce string `json:"workspaceNonce"`
	}
	_ = json.Unmarshal(r.Body.Bytes(), &extra)
	f.nonce = extra.Nonce
	for _, cookie := range r.Result().Cookies() {
		if cookie.Name == f.s.operatorCookieName() {
			f.cookie = cookie
		}
	}
}
func (f *workspaceFixture) addConnection() string {
	f.t.Helper()
	r := f.request("POST", "/api/workspace/connections", map[string]interface{}{"revision": f.doc.Revision, "connection": map[string]interface{}{"name": "test connection", "context": "test"}}, "", "")
	if r.Code != 200 {
		f.t.Fatal(r.Code, r.Body.String())
	}
	f.accept(r)
	return f.doc.Connections[len(f.doc.Connections)-1].ID
}
func (f *workspaceFixture) addHarbor(connection string, namespaces []string, selector string) string {
	f.t.Helper()
	r := f.request("POST", "/api/workspace/harbors", map[string]interface{}{"revision": f.doc.Revision, "harbor": map[string]interface{}{"name": "project", "connectionRef": connection, "namespaces": namespaces, "selector": selector, "view": map[string]interface{}{}}}, "", "")
	if r.Code != 200 {
		f.t.Fatal(r.Code, r.Body.String())
	}
	f.accept(r)
	return f.doc.Harbors[len(f.doc.Harbors)-1].ID
}
func (f *workspaceFixture) scope(harbor, tab string) string {
	return "workspaceId=" + f.doc.ID + "&harborId=" + harbor + "&tabId=" + tab
}
func (f *workspaceFixture) diagnostic(harbor, tab string) map[string]interface{} {
	f.t.Helper()
	r := f.request("GET", "/api/connection?"+f.scope(harbor, tab), nil, "", "")
	if r.Code != 200 {
		f.t.Fatal(r.Code, r.Body.String())
	}
	var v map[string]interface{}
	_ = json.Unmarshal(r.Body.Bytes(), &v)
	return v
}
func labeledPod(name, uid, namespace, app string) *corev1.Pod {
	p := pod(name, uid)
	p.Namespace = namespace
	p.Labels = map[string]string{"app": app}
	return p
}

func TestWorkspaceHTTPPersistenceCSRFAndScope(t *testing.T) {
	f := newWorkspaceFixture(t, true, labeledPod("a", "uid-a", "qa", "a"), labeledPod("b", "uid-b", "qa", "b"), labeledPod("a", "uid-other", "other", "a"))
	conn := f.addConnection()
	harbor := f.addHarbor(conn, []string{"qa"}, "app in (a,c),!excluded")
	scope := f.scope(harbor, "tab-a")
	for _, entry := range []struct {
		path string
		code int
	}{{"/api/resources?resource=pods", 400}, {"/api/resources?resource=pods&" + scope + "&context=other", 409}, {"/api/resources?resource=pods&" + scope + "&namespace=other", 403}, {"/api/resources?resource=pods&" + scope + "&namespace=qa&name=b", 403}, {"/api/resources?resource=pods&" + scope, 200}} {
		r := f.request("GET", entry.path, nil, "", "")
		if r.Code != entry.code {
			t.Fatalf("%s: %d %s", entry.path, r.Code, r.Body.String())
		}
		if entry.code == 200 {
			var list unstructured.UnstructuredList
			_ = json.Unmarshal(r.Body.Bytes(), &list)
			if len(list.Items) != 1 || string(list.Items[0].GetUID()) != "uid-a" {
				t.Fatal("scope leaked", r.Body.String())
			}
		}
	}
	denied := f.request("POST", "/api/resources?resource=pods&namespace=qa&"+scope, map[string]interface{}{"object": labeledPod("new", "", "qa", "a")}, "", "")
	if denied.Code != 403 {
		t.Fatal("readonly bypass", denied.Code)
	}
	prior := f.s.workspace.store.Snapshot()
	f.nonce = "wrong"
	r := f.request("DELETE", "/api/workspace/harbors/"+harbor, map[string]interface{}{"revision": f.doc.Revision}, "", "")
	if r.Code != 403 || f.s.workspace.store.Snapshot().Revision != prior.Revision {
		t.Fatal("workspace csrf bypass")
	}
	if _, err := f.c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace("qa").Get(context.Background(), "a", metav1.GetOptions{}); err != nil {
		t.Fatal("workspace metadata operation touched Kubernetes", err)
	}
}
func TestWorkspaceMultiNamespaceAndDistinctConnectionIdentity(t *testing.T) {
	f := newWorkspaceFixture(t, true, labeledPod("same", "uid-a", "qa", "project"), labeledPod("same", "uid-b", "other", "project"), labeledPod("hidden", "uid-hidden", "private", "project"))
	first := f.addConnection()
	a := f.addHarbor(first, []string{"qa", "other"}, "app=project")
	second := f.addConnection()
	b := f.addHarbor(second, []string{"qa"}, "app=project")
	r := f.request("GET", "/api/resources?resource=pods&"+f.scope(a, "tab"), nil, "", "")
	if r.Code != 200 {
		t.Fatal(r.Code, r.Body.String())
	}
	var list unstructured.UnstructuredList
	_ = json.Unmarshal(r.Body.Bytes(), &list)
	if len(list.Items) != 2 {
		t.Fatal("multiNS union", r.Body.String())
	}
	aDiag := f.diagnostic(a, "tab")
	bDiag := f.diagnostic(b, "tab")
	if aDiag["authorizationKey"] == bDiag["authorizationKey"] {
		t.Fatal("different connections shared auth identity")
	}
	if aDiag["identity"].(map[string]interface{})["confidence"] != "unknown" {
		t.Fatal("forbidden/unknown identity was elevated")
	}
}
func TestWorkspaceGrantsAreHarborTabBoundAndScopeEditRevokes(t *testing.T) {
	f := newWorkspaceFixture(t, false, labeledPod("a", "uid-a", "qa", "a"))
	conn := f.addConnection()
	a := f.addHarbor(conn, []string{"qa"}, "app=a")
	b := f.addHarbor(conn, []string{"qa"}, "app=a")
	da := f.diagnostic(a, "tab-one")
	nonce := da["connectionID"].(string)
	enable := map[string]interface{}{"enabled": true, "context": "test", "namespace": "qa", "connectionID": nonce}
	r := f.request("POST", "/api/management?"+f.scope(a, "tab-one"), enable, "", "")
	if r.Code != 200 {
		t.Fatal(r.Code, r.Body.String())
	}
	if f.diagnostic(a, "tab-one")["managementEnabled"] != true {
		t.Fatal("grant not retained")
	}
	if f.diagnostic(a, "tab-two")["managementEnabled"] != false || f.diagnostic(b, "tab-one")["managementEnabled"] != false {
		t.Fatal("grant crossed harbor/tab")
	}
	r = f.request("POST", "/api/management?"+f.scope(b, "tab-one"), enable, "", "")
	if r.Code != 409 {
		t.Fatal("foreign grant accepted", r.Code)
	}
	r = f.request("PATCH", "/api/workspace/harbors/"+a, map[string]interface{}{"revision": f.doc.Revision, "harbor": map[string]interface{}{"selector": "app=b"}}, "", "")
	if r.Code != 200 {
		t.Fatal(r.Code, r.Body.String())
	}
	f.accept(r)
	r = f.request("POST", "/api/management?"+f.scope(a, "tab-one"), enable, "", "")
	if r.Code != 409 {
		t.Fatal("stale grant accepted", r.Code)
	}
}
func TestWorkspaceNodeImpactRequiresAcknowledgement(t *testing.T) {
	f := newWorkspaceFixture(t, false, &corev1.Node{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Node"}, ObjectMeta: metav1.ObjectMeta{Name: "shared", UID: "node-uid", ResourceVersion: "rv-node"}})
	conn := f.addConnection()
	h := f.addHarbor(conn, []string{"qa"}, "")
	diag := f.diagnostic(h, "tab")
	nonce := diag["connectionID"].(string)
	enable := map[string]interface{}{"enabled": true, "context": "test", "namespace": "qa", "connectionID": nonce}
	if r := f.request("POST", "/api/management?"+f.scope(h, "tab"), enable, "", ""); r.Code != 200 {
		t.Fatal(r.Code, r.Body.String())
	}
	action := Action{Resource: "nodes", Version: "v1", Name: "shared", UID: "node-uid", ResourceVersion: "rv-node", Action: "cordon", DryRun: true}
	r := f.request("POST", "/api/actions?"+f.scope(h, "tab"), action, nonce, "")
	if r.Code != 403 {
		t.Fatal("shared impact was not acknowledged", r.Code, r.Body.String())
	}
	r = f.request("POST", "/api/actions?"+f.scope(h, "tab"), action, nonce, "acknowledged")
	if r.Code != 202 {
		t.Fatal("acknowledged Node action failed", r.Code, r.Body.String())
	}
}
func TestWorkspaceSharedBrokerSelectorExitAndLastRelease(t *testing.T) {
	f := newWorkspaceFixture(t, true, labeledPod("a", "uid-a", "qa", "a"), labeledPod("b", "uid-b", "qa", "b"))
	conn := f.addConnection()
	a := f.addHarbor(conn, []string{"qa"}, "app=a")
	b := f.addHarbor(conn, []string{"qa"}, "app=b")
	server := httptest.NewServer(f.mux)
	defer server.Close()
	open := func(h string) *websocket.Conn {
		t.Helper()
		u := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?" + f.scope(h, "tab")
		headers := http.Header{"Cookie": []string{f.cookie.String()}, "Origin": []string{server.URL}}
		socket, res, err := websocket.DefaultDialer.Dial(u, headers)
		if err != nil {
			t.Fatalf("WS handshake: %v %v", res, err)
		}
		return socket
	}
	read := func(socket *websocket.Conn, kind, action string) envelope {
		t.Helper()
		_ = socket.SetReadDeadline(time.Now().Add(5 * time.Second))
		for {
			var msg envelope
			if err := socket.ReadJSON(&msg); err != nil {
				t.Fatal(err)
			}
			if msg.Type == kind && (action == "" || msg.Action == action) {
				return msg
			}
		}
	}
	one := open(a)
	defer one.Close()
	snapshot := read(one, "SNAPSHOT", "")
	if len(snapshot.Resources) != 1 || string(snapshot.Resources[0].GetUID()) != "uid-a" {
		t.Fatal("first snapshot not scoped", snapshot)
	}
	two := open(b)
	defer two.Close()
	snapshot = read(two, "SNAPSHOT", "")
	if len(snapshot.Resources) != 1 || string(snapshot.Resources[0].GetUID()) != "uid-b" {
		t.Fatal("second snapshot not scoped", snapshot)
	}
	f.s.watches.mu.Lock()
	watchCount := len(f.s.watches.entries)
	f.s.watches.mu.Unlock()
	if watchCount != 3 {
		t.Fatalf("identical connection/namespace did not share watches: %d", watchCount)
	}
	obj, err := f.c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace("qa").Get(context.Background(), "a", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	obj.SetLabels(map[string]string{"app": "b"})
	obj.SetResourceVersion("opaque-next")
	if _, err = f.c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace("qa").Update(context.Background(), obj, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	exit := read(one, "RESOURCE_EVENT", "OUT_OF_SCOPE")
	if string(exit.Object.GetUID()) != "uid-a" || exit.Object.GetLabels() != nil {
		t.Fatal("scope exit leaked updated contents or wrong identity")
	}
	entered := read(two, "RESOURCE_EVENT", "UPDATE")
	if string(entered.Object.GetUID()) != "uid-a" {
		t.Fatal("new selector membership not delivered")
	}
	if err = f.c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace("qa").Delete(context.Background(), "a", metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	deleted := read(two, "RESOURCE_EVENT", "DELETE")
	if string(deleted.Object.GetUID()) != "uid-a" {
		t.Fatal("real delete lost")
	}
	one.Close()
	two.Close()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		f.s.watches.mu.Lock()
		count := len(f.s.watches.entries)
		f.s.watches.mu.Unlock()
		if count == 0 {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("last subscriber did not release shared informer")
}
func TestWorkspaceScopeEnvelopeRejectsWrongWorkspace(t *testing.T) {
	f := newWorkspaceFixture(t, true)
	c := f.addConnection()
	h := f.addHarbor(c, []string{"qa"}, "")
	r := f.request("GET", "/api/resources?resource=pods&workspaceId=wrong&harborId="+url.QueryEscape(h)+"&tabId=t", nil, "", "")
	if r.Code != 404 {
		t.Fatal(fmt.Sprintf("workspace escape: %d %s", r.Code, r.Body))
	}
}

func TestWorkspaceClusterCatalogReadsAndPVNamespaceRelation(t *testing.T) {
	storage := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "storage.k8s.io/v1", "kind": "StorageClass", "metadata": map[string]interface{}{"name": "shared-storage", "uid": "storage-uid"}, "provisioner": "example.test/local"}}
	pv := func(name, ns string) *unstructured.Unstructured {
		return &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "PersistentVolume", "metadata": map[string]interface{}{"name": name, "uid": name + "-uid"}, "spec": map[string]interface{}{"claimRef": map[string]interface{}{"namespace": ns, "name": "claim"}}}}
	}
	f := newWorkspaceFixture(t, true, storage, pv("own", "qa"), pv("other", "private"))
	discovery := f.c.Discovery.(*discoveryfake.FakeDiscovery)
	discovery.Resources[0].APIResources = append(discovery.Resources[0].APIResources, metav1.APIResource{Name: "persistentvolumes", Kind: "PersistentVolume", Verbs: metav1.Verbs{"get", "list", "watch"}})
	discovery.Resources = append(discovery.Resources, &metav1.APIResourceList{GroupVersion: "storage.k8s.io/v1", APIResources: []metav1.APIResource{{Name: "storageclasses", Kind: "StorageClass", Verbs: metav1.Verbs{"get", "list", "watch"}}}})
	c := f.addConnection()
	h := f.addHarbor(c, []string{"qa"}, "")
	for _, entry := range []struct {
		query  string
		status int
	}{{"group=storage.k8s.io&resource=storageclasses&name=shared-storage", 200}, {"resource=persistentvolumes&name=own", 200}, {"resource=persistentvolumes&name=other", 403}} {
		r := f.request("GET", "/api/resources?"+entry.query+"&"+f.scope(h, "tab"), nil, "", "")
		if r.Code != entry.status {
			t.Fatal(entry.query, r.Code, r.Body.String())
		}
	}
}
func TestWorkspaceRemoveMiddleAllocatesFreePosition(t *testing.T) {
	f := newWorkspaceFixture(t, true)
	c := f.addConnection()
	f.addHarbor(c, []string{"qa"}, "")
	middle := f.addHarbor(c, []string{"qa"}, "")
	last := f.addHarbor(c, []string{"qa"}, "")
	var lastPosition [2]float64
	for _, h := range f.doc.Harbors {
		if h.ID == last {
			lastPosition = h.Position
		}
	}
	r := f.request("DELETE", "/api/workspace/harbors/"+middle, map[string]interface{}{"revision": f.doc.Revision}, "", "")
	if r.Code != 200 {
		t.Fatal(r.Code, r.Body.String())
	}
	f.accept(r)
	f.addHarbor(c, []string{"qa"}, "")
	seen := map[[2]float64]bool{}
	for _, h := range f.doc.Harbors {
		if seen[h.Position] {
			t.Fatal("new harbor overlaps existing harbor")
		}
		seen[h.Position] = true
		if h.ID == last && h.Position != lastPosition {
			t.Fatal("existing harbor repositioned")
		}
	}
}
