package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func workspaceSocket(t *testing.T, f *workspaceFixture, server *httptest.Server, harbor, tab string) *websocket.Conn {
	t.Helper()
	socket, response, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(server.URL, "http")+"/ws?"+f.scope(harbor, tab), http.Header{"Cookie": []string{f.cookie.String()}, "Origin": []string{server.URL}})
	if err != nil {
		t.Fatalf("workspace WS: %v %v", err, response)
	}
	t.Cleanup(func() { socket.Close() })
	return socket
}
func workspaceRead(t *testing.T, socket *websocket.Conn, kind string) envelope {
	t.Helper()
	_ = socket.SetReadDeadline(time.Now().Add(5 * time.Second))
	for {
		var msg envelope
		if err := socket.ReadJSON(&msg); err != nil {
			t.Fatal(err)
		}
		if msg.Type == kind {
			return msg
		}
	}
}
func workspaceBrokerEmpty(t *testing.T, s *Server) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		s.watches.mu.Lock()
		count := len(s.watches.entries)
		s.watches.mu.Unlock()
		if count == 0 {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("shared broker did not release last watch")
}

func TestWorkspaceOfflineScopeExitAndRevokedSubscriberCannotReadPeerCache(t *testing.T) {
	f := newWorkspaceFixture(t, true)
	// Use one unstructured tracker representation across offline dynamic updates
	// and relists. The typed fake PodList cannot mix typed and unstructured rows.
	objects := []runtime.Object{}
	for _, pod := range []*corev1.Pod{labeledPod("owned", "owned-uid", "qa", "a"), labeledPod("never-visible", "private-uid", "qa", "private")} {
		data, err := runtime.DefaultUnstructuredConverter.ToUnstructured(pod)
		if err != nil {
			t.Fatal(err)
		}
		objects = append(objects, &unstructured.Unstructured{Object: data})
	}
	f.c.Dynamic = dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{schemaGVR("", "v1", "pods"): "PodList", schemaGVR("", "v1", "nodes"): "NodeList", schemaGVR("", "v1", "secrets"): "SecretList"}, objects...)
	connection := f.addConnection()
	a := f.addHarbor(connection, []string{"qa"}, "app=a")
	server := httptest.NewServer(f.mux)
	defer server.Close()
	first := workspaceSocket(t, f, server, a, "tab")
	snapshot := workspaceRead(t, first, "SNAPSHOT")
	if len(snapshot.Resources) != 1 {
		t.Fatal("initial membership", snapshot.Resources)
	}
	first.Close()
	workspaceBrokerEmpty(t, f.s)
	pod, err := f.c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace("qa").Get(context.Background(), "owned", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	pod.SetLabels(map[string]string{"app": "private"})
	pod.SetResourceVersion("opaque-offline")
	if _, err = f.c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace("qa").Update(context.Background(), pod, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	second := workspaceSocket(t, f, server, a, "tab")
	snapshot = workspaceRead(t, second, "SNAPSHOT")
	if len(snapshot.Resources) != 0 || len(snapshot.OutOfScope) != 1 || string(snapshot.OutOfScope[0].GetUID()) != "owned-uid" || snapshot.OutOfScope[0].GetLabels() != nil {
		t.Fatalf("offline selector exit confused with delete or leaked outsider: %+v", snapshot)
	}
	b := f.addHarbor(connection, []string{"qa"}, "app=private")
	f.c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		review := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview)
		if review.Spec.ResourceAttributes.Resource == "pods" {
			return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: false, Reason: "revoked"}}, nil
		}
		return false, nil, nil
	})
	third := workspaceSocket(t, f, server, b, "different-tab")
	snapshot = workspaceRead(t, third, "SNAPSHOT")
	if len(snapshot.Resources) != 0 {
		t.Fatal("revoked subscriber received peer cache")
	}
	forbidden := false
	for _, scope := range snapshot.Scopes {
		if scope.Resource == "pods" {
			forbidden = scope.Status == "forbidden" && !scope.Authoritative
		}
	}
	if !forbidden {
		t.Fatal("revoked Pod binding was not explicit forbidden")
	}
	second.Close()
	third.Close()
	workspaceBrokerEmpty(t, f.s)
}

func TestWorkspaceOwnerMembershipUpdatesChildrenWithoutPodRVChange(t *testing.T) {
	deployment := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "metadata": map[string]interface{}{"name": "deployment", "namespace": "qa", "uid": "deployment-uid", "resourceVersion": "owner-a", "labels": map[string]interface{}{"app": "alpha"}}, "spec": map[string]interface{}{"template": map[string]interface{}{"metadata": map[string]interface{}{"labels": map[string]interface{}{"tier": "worker"}}}}}}
	replicaset := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": "ReplicaSet", "metadata": map[string]interface{}{"name": "replicaset", "namespace": "qa", "uid": "replicaset-uid", "resourceVersion": "rs-fixed", "ownerReferences": []interface{}{map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "name": "deployment", "uid": "deployment-uid"}}}}}
	pod := labeledPod("child", "pod-uid", "qa", "unrelated-own-label")
	pod.OwnerReferences = []metav1.OwnerReference{{APIVersion: "apps/v1", Kind: "ReplicaSet", Name: "replicaset", UID: "replicaset-uid"}}
	f := newWorkspaceFixture(t, true)
	scheme := runtime.NewScheme()
	corev1.AddToScheme(scheme)
	f.c.Dynamic = dynamicfake.NewSimpleDynamicClientWithCustomListKinds(scheme, map[schema.GroupVersionResource]string{schemaGVR("", "v1", "pods"): "PodList", schemaGVR("", "v1", "nodes"): "NodeList", schemaGVR("", "v1", "secrets"): "SecretList", schemaGVR("apps", "v1", "deployments"): "DeploymentList", schemaGVR("apps", "v1", "replicasets"): "ReplicaSetList"}, deployment, replicaset, pod)
	discovery := f.c.Discovery.(*discoveryfake.FakeDiscovery)
	discovery.Resources = append(discovery.Resources, &metav1.APIResourceList{GroupVersion: "apps/v1", APIResources: []metav1.APIResource{{Name: "deployments", Kind: "Deployment", Namespaced: true, Verbs: metav1.Verbs{"get", "list", "watch"}}, {Name: "replicasets", Kind: "ReplicaSet", Namespaced: true, Verbs: metav1.Verbs{"get", "list", "watch"}}}})
	connection := f.addConnection()
	harbor := f.addHarbor(connection, []string{"qa"}, "app=alpha")
	server := httptest.NewServer(f.mux)
	defer server.Close()
	socket := workspaceSocket(t, f, server, harbor, "tab")
	snapshot := workspaceRead(t, socket, "SNAPSHOT")
	if len(snapshot.Resources) != 3 {
		t.Fatal("owner chain not resolved from shared informer cache", snapshot.Resources)
	}
	update := deployment.DeepCopy()
	update.SetLabels(map[string]string{"app": "beta"})
	update.SetResourceVersion("owner-b")
	if _, err := f.c.Dynamic.Resource(schemaGVR("apps", "v1", "deployments")).Namespace("qa").Update(context.Background(), update, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	exited := map[string]bool{}
	for len(exited) < 3 {
		msg := workspaceRead(t, socket, "RESOURCE_EVENT")
		if msg.Action != "OUT_OF_SCOPE" {
			t.Fatalf("relationship exit became %s", msg.Action)
		}
		exited[string(msg.Object.GetUID())] = true
	}
	if !exited["pod-uid"] || !exited["replicaset-uid"] || !exited["deployment-uid"] {
		t.Fatal("owner exit did not reconcile children")
	}
	update.SetLabels(map[string]string{"app": "alpha"})
	update.SetResourceVersion("owner-c")
	if _, err := f.c.Dynamic.Resource(schemaGVR("apps", "v1", "deployments")).Namespace("qa").Update(context.Background(), update, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	entered := map[string]bool{}
	for len(entered) < 3 {
		msg := workspaceRead(t, socket, "RESOURCE_EVENT")
		if msg.Action != "UPDATE" {
			t.Fatal("owner reentry invented birth/delete", msg.Action)
		}
		entered[string(msg.Object.GetUID())] = true
	}
	socket.Close()
	workspaceBrokerEmpty(t, f.s)
}

func TestWorkspaceCredentialReloadCancelsGrantsAndDropsOldVerifiedIdentity(t *testing.T) {
	dir := t.TempDir()
	configPath := filepath.Join(dir, "private-kubeconfig")
	config := []byte("apiVersion: v1\nkind: Config\nclusters:\n- name: a\n  cluster: {server: 'https://127.0.0.1:6443'}\ncontexts:\n- name: a\n  context: {cluster: a, user: a, namespace: qa}\nusers:\n- name: a\n  user: {token: synthetic-initial}\n")
	if err := os.WriteFile(configPath, config, 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("KUBECONFIG", configPath)
	t.Setenv("KUBE_CONTEXT", "")
	s := New()
	s.Token = ""
	defer s.Close()
	old, err := s.client("a")
	if err != nil {
		t.Fatal(err)
	}
	if err = s.ConfigureWorkspace(filepath.Join(dir, "app-data"), "a", "qa"); err != nil {
		t.Fatal(err)
	}
	doc := s.workspace.store.Snapshot()
	connection := doc.Connections[0].ID
	harbor := doc.Harbors[0].ID
	s.workspace.identities[connection] = connectionIdentity{Confidence: "verified", ClusterUID: "old-verified-cluster", CredentialGeneration: old.ID}
	ctx, cancel := context.WithCancel(context.Background())
	s.operators["browser|"+doc.ID+"|"+harbor+"|tab"] = &operatorSession{clientID: old.ID + ":" + connection, enabled: true, nonce: "old-grant", expires: time.Now().Add(time.Hour), ctx: ctx, cancel: cancel, streamGeneration: "old-stream", members: map[string]workspaceMember{"old-uid": {}}}
	if err = os.WriteFile(configPath, []byte(strings.ReplaceAll(string(config), "synthetic-initial", "synthetic-rotated")), 0600); err != nil {
		t.Fatal(err)
	}
	latest, err := s.client("a")
	if err != nil || latest.ID == old.ID {
		t.Fatal("credential generation was reused", err)
	}
	select {
	case <-ctx.Done():
	default:
		t.Fatal("old scoped stream/grant not cancelled")
	}
	s.operatorMu.Lock()
	for _, session := range s.operators {
		if session.enabled || len(session.members) != 0 {
			t.Fatal("old authority survived credential reload")
		}
	}
	s.operatorMu.Unlock()
	mux := http.NewServeMux()
	s.Register(mux)
	request := httptest.NewRequest("GET", "http://localhost/api/workspace", nil)
	response := httptest.NewRecorder()
	mux.ServeHTTP(response, request)
	var dto struct {
		Connections []struct {
			Identity connectionIdentity `json:"identity"`
		} `json:"connections"`
	}
	if err = json.Unmarshal(response.Body.Bytes(), &dto); err != nil {
		t.Fatal(err)
	}
	if dto.Connections[0].Identity.Confidence != "unknown" || dto.Connections[0].Identity.ClusterUID != "" {
		t.Fatal("stale verified cluster identity leaked after credential reload")
	}
}
