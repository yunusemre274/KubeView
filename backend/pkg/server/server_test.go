package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/discovery/fake"
	"k8s.io/client-go/dynamic"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
	ktesting "k8s.io/client-go/testing"
	"k8s.io/client-go/tools/cache"
)

func testServer(t *testing.T, readOnly bool, objects ...runtime.Object) (*Server, *Clients) {
	t.Helper()
	typed := kubefake.NewSimpleClientset()
	typed.PrependReactor("create", "selfsubjectaccessreviews", func(a ktesting.Action) (bool, runtime.Object, error) {
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: true}}, nil
	})
	discovery := typed.Discovery().(*fake.FakeDiscovery)
	discovery.Resources = []*metav1.APIResourceList{{GroupVersion: "v1", APIResources: []metav1.APIResource{{Name: "pods", Kind: "Pod", Namespaced: true, Verbs: metav1.Verbs{"get", "list", "watch", "create", "update", "delete"}}, {Name: "nodes", Kind: "Node", Verbs: metav1.Verbs{"get", "list", "watch"}}, {Name: "secrets", Kind: "Secret", Namespaced: true, Verbs: metav1.Verbs{"get", "list", "watch"}}}}}
	scheme := runtime.NewScheme()
	corev1.AddToScheme(scheme)
	dynamic := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(scheme, map[schema.GroupVersionResource]string{{Version: "v1", Resource: "pods"}: "PodList", {Version: "v1", Resource: "nodes"}: "NodeList", {Version: "v1", Resource: "secrets"}: "SecretList"}, objects...)
	clients := &Clients{Dynamic: dynamic, Typed: typed, Discovery: discovery, Name: "test"}
	s := New()
	s.ReadOnly = readOnly
	s.Token = ""
	s.Namespace = "qa"
	s.clients = map[string]*Clients{"test": clients}
	return s, clients
}
func request(s *Server, method, path string, body interface{}) *httptest.ResponseRecorder {
	var payload []byte
	if body != nil {
		payload, _ = json.Marshal(body)
	}
	r := httptest.NewRequest(method, "http://localhost"+path, bytes.NewReader(payload))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	mux := http.NewServeMux()
	s.Register(mux)
	mux.ServeHTTP(w, r)
	return w
}
func pod(name, uid string) *corev1.Pod {
	return &corev1.Pod{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Pod"}, ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: "qa", UID: types.UID(uid), ResourceVersion: "rv-opaque-a"}, Spec: corev1.PodSpec{Containers: []corev1.Container{{Name: "app", Image: "nginx"}}}}
}
func TestReadOnlyAndNamespaceEnforced(t *testing.T) {
	s, _ := testServer(t, true, pod("web", "u1"))
	result := request(s, "DELETE", "/api/resources?context=test&resource=pods&namespace=qa&name=web", map[string]string{"uid": "u1", "resourceVersion": "rv-opaque-a"})
	if result.Code != 403 {
		t.Fatalf("readonly delete: %d %s", result.Code, result.Body)
	}
	result = request(s, "GET", "/api/resources?context=test&resource=pods&namespace=production", nil)
	if result.Code != 403 {
		t.Fatalf("namespace escape: %d", result.Code)
	}
}
func TestDeletePreconditionsAndUIDRecreation(t *testing.T) {
	s, c := testServer(t, false, pod("web", "new-uid"))
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "pods"}

	result := request(s, "DELETE", "/api/resources?context=test&resource=pods&name=web", map[string]string{"uid": "new-uid", "resourceVersion": "rv-opaque-a"})
	if result.Code != 202 {
		t.Fatalf("delete: %d %s", result.Code, result.Body)
	}
	_, err := c.Dynamic.Resource(gvr).Namespace("qa").Get(context.Background(), "web", metav1.GetOptions{})
	if err == nil {
		t.Fatal("deleted resource remains")
	}
	obj := &unstructured.Unstructured{Object: map[string]interface{}{"kind": "Pod", "metadata": map[string]interface{}{"name": "web", "uid": "new", "resourceVersion": "opaque"}}}
	if checkIdentity(obj, "old", "opaque") == nil {
		t.Fatal("old UID accepted for same name")
	}
}
func TestSecretSanitizationDoesNotMutateSource(t *testing.T) {
	secret := &unstructured.Unstructured{Object: map[string]interface{}{"kind": "Secret", "data": map[string]interface{}{"password": "secret-value"}, "stringData": map[string]interface{}{"token": "hidden"}, "metadata": map[string]interface{}{"name": "credentials", "annotations": map[string]interface{}{"kubectl.kubernetes.io/last-applied-configuration": "contains-password"}}}}
	safe := sanitize(secret)
	raw, _ := json.Marshal(safe)
	if strings.Contains(string(raw), "secret-value") || strings.Contains(string(raw), "hidden") || strings.Contains(string(raw), "contains-password") {
		t.Fatalf("Secret leaked: %s", raw)
	}
	if _, ok := secret.Object["data"]; !ok {
		t.Fatal("source object mutated")
	}
}
func TestOriginAndAuthentication(t *testing.T) {
	s, _ := testServer(t, false)
	s.Token = "private-token"
	r := httptest.NewRequest("GET", "http://localhost/api/contexts", nil)
	r.Header.Set("Origin", "https://attacker.example")
	r.Header.Set("Authorization", "Bearer private-token")
	w := httptest.NewRecorder()
	s.protect(s.contexts)(w, r)
	if w.Code != 403 {
		t.Fatalf("foreign origin accepted: %d", w.Code)
	}
	result := request(s, "GET", "/api/contexts", nil)
	if result.Code != 401 {
		t.Fatalf("unauthenticated accepted: %d", result.Code)
	}
}
func TestQuantityValidation(t *testing.T) {
	for _, resources := range []map[string]interface{}{{"requests": map[string]interface{}{"cpu": "1"}, "limits": map[string]interface{}{"cpu": "500m"}}, {"limits": map[string]interface{}{"memory": "-1Gi"}}, {"limits": map[string]interface{}{"cpu": "nonsense"}}} {
		if validateResources(resources) == nil {
			t.Fatalf("invalid resources accepted: %#v", resources)
		}
	}
	if err := validateResources(map[string]interface{}{"requests": map[string]interface{}{"cpu": "500m", "memory": "128Mi"}, "limits": map[string]interface{}{"cpu": "1", "memory": "1Gi"}}); err != nil {
		t.Fatal(err)
	}
}
func TestInformerWebSocketSnapshotAddUpdateDelete(t *testing.T) {
	s, c := testServer(t, true, pod("existing", "existing-uid"), &corev1.Node{TypeMeta: metav1.TypeMeta{Kind: "Node", APIVersion: "v1"}, ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "node-uid"}})
	c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		review := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview)
		attrs := review.Spec.ResourceAttributes
		allowed := attrs.Resource != "nodes" || attrs.Namespace == ""
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: allowed}}, nil
	})
	mux := http.NewServeMux()
	s.Register(mux)
	httpServer := httptest.NewServer(mux)
	defer httpServer.Close()
	conn, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(httpServer.URL, "http")+"/ws?context=test", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	conn.SetReadDeadline(time.Now().Add(8 * time.Second))
	read := func(want, action string) envelope {
		for {
			var msg envelope
			if err := conn.ReadJSON(&msg); err != nil {
				t.Fatal(err)
			}
			if msg.Type == want && (action == "" || msg.Action == action) {
				return msg
			}
		}
	}
	snapshot := read("SNAPSHOT", "")
	foundPod, foundNode := false, false
	for _, resource := range snapshot.Resources {
		if resource.GetKind() == "Pod" && string(resource.GetUID()) == "existing-uid" {
			foundPod = true
		}
		if resource.GetKind() == "Node" && string(resource.GetUID()) == "node-uid" && resource.GetNamespace() == "" {
			foundNode = true
		}
	}
	if len(snapshot.Resources) != 2 || !foundPod || !foundNode {
		t.Fatalf("wrong initial snapshot: %#v", snapshot)
	}
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	client := c.Dynamic.Resource(gvr).Namespace("qa")
	newPod := pod("new", "new-uid")
	raw, _ := runtime.DefaultUnstructuredConverter.ToUnstructured(newPod)
	created, err := client.Create(context.Background(), &unstructured.Unstructured{Object: raw}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	added := read("RESOURCE_EVENT", "ADD")
	if string(added.Object.GetUID()) != "new-uid" || added.Generation != snapshot.Generation {
		t.Fatal("identity or generation mismatch")
	}
	created.SetResourceVersion("rv-opaque-b")
	unstructured.SetNestedField(created.Object, "worker-a", "spec", "nodeName")
	if _, err = client.Update(context.Background(), created, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	updated := read("RESOURCE_EVENT", "UPDATE")
	node, _, _ := unstructured.NestedString(updated.Object.Object, "spec", "nodeName")
	if node != "worker-a" {
		t.Fatal("scheduling update lost")
	}
	if err = client.Delete(context.Background(), "new", metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	deleted := read("RESOURCE_EVENT", "DELETE")
	if string(deleted.Object.GetUID()) != "new-uid" {
		t.Fatal("delete UID lost")
	}
}

func TestDeleteRESTPreconditions(t *testing.T) {
	s, c := testServer(t, false)
	called := false
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "DELETE" {
			t.Errorf("unexpected method %s", r.Method)
		}
		var opts metav1.DeleteOptions
		if err := json.NewDecoder(r.Body).Decode(&opts); err != nil {
			t.Error(err)
		}
		if opts.Preconditions == nil || opts.Preconditions.UID == nil || string(*opts.Preconditions.UID) != "expected-uid" || opts.Preconditions.ResourceVersion == nil || *opts.Preconditions.ResourceVersion != "rv-opaque" {
			t.Errorf("missing delete preconditions: %#v", opts)
		}
		called = true
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"apiVersion":"v1","kind":"Status","status":"Success"}`))
	}))
	defer upstream.Close()
	client, err := dynamic.NewForConfig(&rest.Config{Host: upstream.URL})
	if err != nil {
		t.Fatal(err)
	}
	c.Dynamic = client
	result := request(s, "DELETE", "/api/resources?context=test&resource=pods&namespace=qa&name=web", map[string]string{"uid": "expected-uid", "resourceVersion": "rv-opaque"})
	if result.Code != 202 || !called {
		t.Fatalf("delete not forwarded: %d %s", result.Code, result.Body)
	}
}

func TestDrainEvictionPDBAndNamespaceRestriction(t *testing.T) {
	node := &corev1.Node{TypeMeta: metav1.TypeMeta{Kind: "Node", APIVersion: "v1"}, ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "node-uid", ResourceVersion: "rv1"}, Spec: corev1.NodeSpec{Unschedulable: true}}
	s, c := testServer(t, false, node)
	payload := map[string]interface{}{"resource": "nodes", "name": "worker-a", "uid": "node-uid", "resourceVersion": "rv1", "action": "drain"}
	result := request(s, "POST", "/api/actions?context=test", payload)
	if result.Code != 403 {
		t.Fatalf("namespace scoped full drain accepted: %d %s", result.Code, result.Body)
	}
	s.Namespace = ""
	p := pod("protected", "protected-uid")
	p.Spec.NodeName = "worker-a"
	p.OwnerReferences = []metav1.OwnerReference{{APIVersion: "apps/v1", Kind: "ReplicaSet", Name: "app-rs", UID: "rs-uid"}}
	if _, err := c.Typed.CoreV1().Pods("qa").Create(context.Background(), p, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	called := false
	c.Typed.(*kubefake.Clientset).PrependReactor("create", "pods", func(a ktesting.Action) (bool, runtime.Object, error) {
		if a.GetSubresource() == "eviction" {
			called = true
			return true, nil, apierrors.NewTooManyRequests("PodDisruptionBudget prevents eviction", 0)
		}
		return false, nil, nil
	})
	result = request(s, "POST", "/api/actions?context=test", payload)
	if result.Code != 202 || !called || !strings.Contains(result.Body.String(), "PodDisruptionBudget") || !strings.Contains(result.Body.String(), `"partialFailure":true`) {
		t.Fatalf("PDB result lost: %d %s", result.Code, result.Body)
	}
	existing, err := c.Typed.CoreV1().Pods("qa").Get(context.Background(), p.Name, metav1.GetOptions{})
	if err != nil || existing.UID != p.UID {
		t.Fatal("PDB-protected Pod was deleted")
	}
}
func TestReadOnlyDrainRejectedBeforeEviction(t *testing.T) {
	node := &corev1.Node{TypeMeta: metav1.TypeMeta{Kind: "Node", APIVersion: "v1"}, ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "node-uid", ResourceVersion: "rv1"}, Spec: corev1.NodeSpec{Unschedulable: true}}
	s, _ := testServer(t, true, node)
	s.Namespace = ""
	result := request(s, "POST", "/api/actions?context=test", map[string]interface{}{"resource": "nodes", "name": "worker-a", "uid": "node-uid", "resourceVersion": "rv1", "action": "drain"})
	if result.Code != 403 {
		t.Fatalf("read-only drain accepted: %d %s", result.Code, result.Body)
	}
}

func TestNamespaceScopeBlocksClusterCRUD(t *testing.T) {
	node := &corev1.Node{TypeMeta: metav1.TypeMeta{Kind: "Node", APIVersion: "v1"}, ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "node-uid", ResourceVersion: "rv1"}}
	s, _ := testServer(t, false, node)
	result := request(s, "DELETE", "/api/resources?context=test&resource=nodes&name=worker-a", map[string]interface{}{"uid": "node-uid", "resourceVersion": "rv1"})
	if result.Code != 403 {
		t.Fatalf("cluster mutation escaped namespace restriction: %d %s", result.Code, result.Body)
	}
	result = request(s, "GET", "/api/resources?context=test&resource=nodes", nil)
	if result.Code != 200 {
		t.Fatalf("cluster node read blocked: %d %s", result.Code, result.Body)
	}
}

func TestLogPermissionErrorNeverBecomesSampleOutput(t *testing.T) {
	s, c := testServer(t, false)
	c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(a ktesting.Action) (bool, runtime.Object, error) {
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: false, Reason: "pods/log denied"}}, nil
	})
	result := request(s, "GET", "/api/logs?context=test&namespace=qa&pod=web&container=app", nil)
	if result.Code != 403 || !strings.Contains(result.Body.String(), "pods/log denied") {
		t.Fatalf("log error masked: %d %s", result.Code, result.Body)
	}
}
func TestPortforwardScopeUIDAndPortValidation(t *testing.T) {
	s, c := testServer(t, false, pod("web", "uid-web"))
	c.Typed.CoreV1().Pods("qa").Create(context.Background(), pod("web", "uid-web"), metav1.CreateOptions{})
	for _, test := range []struct {
		body   map[string]interface{}
		status int
	}{
		{map[string]interface{}{"context": "test", "namespace": "production", "pod": "web", "uid": "uid-web", "port": 8080}, 403},
		{map[string]interface{}{"context": "test", "namespace": "qa", "pod": "web", "uid": "uid-web", "port": 70000}, 422},
		{map[string]interface{}{"context": "test", "namespace": "qa", "pod": "web", "uid": "old-uid", "port": 8080}, 409},
	} {
		result := request(s, "POST", "/api/portforwards", test.body)
		if result.Code != test.status {
			t.Fatalf("unsafe forwarding accepted: %d %s", result.Code, result.Body)
		}
	}
}
func TestLocalServerRejectsDNSRebindingHost(t *testing.T) {
	s, _ := testServer(t, false)
	req := httptest.NewRequest("GET", "http://attacker.example/api/contexts", nil)
	req.Header.Set("Origin", "http://attacker.example")
	result := httptest.NewRecorder()
	s.protect(s.contexts)(result, req)
	if result.Code != 403 {
		t.Fatalf("untrusted host accepted %d", result.Code)
	}
}

func TestClusterScopedReviewsIgnoreWatchNamespace(t *testing.T) {
	node := &corev1.Node{TypeMeta: metav1.TypeMeta{Kind: "Node", APIVersion: "v1"}, ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "node-uid"}}
	s, c := testServer(t, false, node, pod("web", "pod-uid"))
	reviews := []authv1.ResourceAttributes{}
	c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(a ktesting.Action) (bool, runtime.Object, error) {
		review := a.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview)
		attributes := *review.Spec.ResourceAttributes
		reviews = append(reviews, attributes)
		allowed := attributes.Resource != "nodes" || attributes.Namespace == ""
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: allowed}}, nil
	})
	result := request(s, "GET", "/api/resources?context=test&resource=nodes&name=worker-a", nil)
	if result.Code != 200 {
		t.Fatalf("real cluster-scoped Node GET falsely denied: %d %s", result.Code, result.Body)
	}
	result = request(s, "GET", "/api/capabilities?context=test&resource=nodes&name=worker-a", nil)
	if result.Code != 200 || !strings.Contains(result.Body.String(), `"cordon":true`) {
		t.Fatalf("Node capability review used namespace: %d %s", result.Code, result.Body)
	}
	result = request(s, "GET", "/api/resources?context=test&resource=pods&name=web", nil)
	if result.Code != 200 {
		t.Fatalf("namespace-scoped Pod GET failed: %d %s", result.Code, result.Body)
	}
	for _, review := range reviews {
		if review.Resource == "nodes" && review.Namespace != "" {
			t.Fatalf("Node SSAR incorrectly namespaced: %#v", review)
		}
		if review.Resource == "pods" && review.Namespace != "qa" {
			t.Fatalf("Pod SSAR lost namespace: %#v", review)
		}
	}
}

func TestScaleDoesNotAdoptRecreatedSubresourceIdentity(t *testing.T) {
	for _, test := range []struct{ name, uid, rv string }{{"new UID", "new-uid", "rv1"}, {"concurrent version", "reviewed-uid", "new-rv"}} {
		t.Run(test.name, func(t *testing.T) {
			s, c := testServer(t, false)
			c.Dynamic.(*dynamicfake.FakeDynamicClient).PrependReactor("get", "deployments", func(action ktesting.Action) (bool, runtime.Object, error) {
				kind, uid, rv := "Deployment", "reviewed-uid", "rv1"
				if action.GetSubresource() == "scale" {
					kind, uid, rv = "Scale", test.uid, test.rv
				}
				return true, &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": kind, "metadata": map[string]interface{}{"name": "web", "namespace": "qa", "uid": uid, "resourceVersion": rv}, "spec": map[string]interface{}{"replicas": int64(1)}}}, nil
			})
			result := request(s, "POST", "/api/actions?context=test", map[string]interface{}{"group": "apps", "version": "v1", "resource": "deployments", "namespace": "qa", "name": "web", "uid": "reviewed-uid", "resourceVersion": "rv1", "action": "scale", "replicas": 2})
			if result.Code != 409 {
				t.Fatalf("scale adopted changed object: %d %s", result.Code, result.Body)
			}
			for _, action := range c.Dynamic.(*dynamicfake.FakeDynamicClient).Actions() {
				if action.GetVerb() == "update" {
					t.Fatal("changed scale subresource updated")
				}
			}
		})
	}
}

func TestInformerEventsCannotRegressSnapshotIdentityOrVersion(t *testing.T) {
	store := cache.NewStore(cache.MetaNamespaceKeyFunc)
	current := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": "web", "namespace": "qa", "uid": "new-uid", "resourceVersion": "opaque-a"}}}
	if err := store.Add(current); err != nil {
		t.Fatal(err)
	}
	oldVersion := current.DeepCopy()
	oldVersion.SetResourceVersion("opaque-z")
	if currentInformerEvent(store, "UPDATE", oldVersion) {
		t.Fatal("queued older callback could regress authoritative snapshot")
	}
	previousUID := current.DeepCopy()
	previousUID.SetUID("previous-uid")
	if currentInformerEvent(store, "ADD", previousUID) {
		t.Fatal("queued old incarnation could replace recreated UID")
	}
	if !currentInformerEvent(store, "DELETE", previousUID) {
		t.Fatal("old UID deletion must remain harmless and address-independent")
	}
	if !currentInformerEvent(store, "UPDATE", current) {
		t.Fatal("current opaque resourceVersion was discarded")
	}
	if currentInformerEvent(store, "DELETE", current) {
		t.Fatal("stale DELETE removed identity still confirmed present by store")
	}
	if err := store.Delete(current); err != nil {
		t.Fatal(err)
	}
	if !currentInformerEvent(store, "DELETE", current) {
		t.Fatal("confirmed DELETE was discarded")
	}
	if currentInformerEvent(store, "ADD", current) {
		t.Fatal("queued ADD resurrected already deleted Pod")
	}
}

func TestPurposefulSecretRevealIncludesGVKAndIdentity(t *testing.T) {
	s, c := testServer(t, false)
	fixture := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "purposeful-reveal", Namespace: "qa", UID: "secret-uid", ResourceVersion: "opaque-rv", Annotations: map[string]string{"last-applied": "must-be-removed"}}, Data: map[string][]byte{"fixture": []byte("test-only")}, Type: corev1.SecretTypeOpaque}
	if _, err := c.Typed.CoreV1().Secrets("qa").Create(context.Background(), fixture, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	result := request(s, "GET", "/api/secrets/reveal?context=test&namespace=qa&name=purposeful-reveal", nil)
	if result.Code != 200 {
		t.Fatalf("purposeful reveal failed status=%d", result.Code)
	}
	var response corev1.Secret
	if err := json.Unmarshal(result.Body.Bytes(), &response); err != nil {
		t.Fatal("invalid Secret JSON")
	}
	if response.APIVersion != "v1" || response.Kind != "Secret" {
		t.Fatalf("Secret type identity missing: apiVersion=%q kind=%q", response.APIVersion, response.Kind)
	}
	if response.UID != fixture.UID || response.ResourceVersion != fixture.ResourceVersion {
		t.Fatal("purposeful reveal changed UID/resourceVersion")
	}
	if response.Annotations != nil || response.ManagedFields != nil {
		t.Fatal("reveal retained internal metadata")
	}
	if !bytes.Equal(response.Data["fixture"], fixture.Data["fixture"]) {
		t.Fatal("purposeful reveal failed to return explicitly requested fixture")
	}
}
