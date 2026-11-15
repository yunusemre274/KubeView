package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
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
	"k8s.io/apimachinery/pkg/types"
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

var widgetGVR = schema.GroupVersionResource{Group: "audit.example", Version: "v1", Resource: "widgets"}

func widget(name, uid, rv string) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "audit.example/v1", "kind": "Widget", "metadata": map[string]interface{}{"name": name, "namespace": "qa", "uid": uid, "resourceVersion": rv}, "spec": map[string]interface{}{"note": "non-sensitive-fixture"}}}
}
func scopedServer(t *testing.T, objects ...runtime.Object) (*Server, *Clients) {
	s, c := testServer(t, true)
	d := c.Discovery.(*discoveryfake.FakeDiscovery)
	d.Resources = append(d.Resources, &metav1.APIResourceList{GroupVersion: "audit.example/v1", APIResources: []metav1.APIResource{{Name: "widgets", Kind: "Widget", Namespaced: true, Verbs: metav1.Verbs{"get", "list", "watch"}}}})
	c.Dynamic = dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{{Version: "v1", Resource: "pods"}: "PodList", {Version: "v1", Resource: "nodes"}: "NodeList", {Version: "v1", Resource: "secrets"}: "SecretList", widgetGVR: "WidgetList"}, objects...)
	return s, c
}
func scopeSocket(t *testing.T, serverURL string) *websocket.Conn {
	t.Helper()
	path := "ws" + strings.TrimPrefix(serverURL, "http") + "/ws?context=test&subscribe=" + url.QueryEscape("audit.example/v1|widgets|qa")
	conn, _, err := websocket.DefaultDialer.Dial(path, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	return conn
}
func readScopeMessage(t *testing.T, conn *websocket.Conn, typ, action string) envelope {
	t.Helper()
	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	for {
		var msg envelope
		if err := conn.ReadJSON(&msg); err != nil {
			t.Fatal(err)
		}
		if msg.Type == typ && (action == "" || msg.Action == action) {
			return msg
		}
	}
}
func widgetScope(t *testing.T, msg envelope) ResourceScope {
	t.Helper()
	for _, scope := range msg.Scopes {
		if scope.Resource == "widgets" {
			return scope
		}
	}
	t.Fatal("custom GVR missing from explicit snapshot scopes")
	return ResourceScope{}
}
func containsUID(msg envelope, uid string) bool {
	for _, r := range msg.Resources {
		if string(r.GetUID()) == uid {
			return true
		}
	}
	return false
}

func TestScopedCustomResourceWatchReconnectAndAuthoritativeAbsence(t *testing.T) {
	s, c := scopedServer(t, widget("cargo", "old-uid", "opaque-start"))
	mux := http.NewServeMux()
	s.Register(mux)
	httpServer := httptest.NewServer(mux)
	defer httpServer.Close()
	first := scopeSocket(t, httpServer.URL)
	snapshot := readScopeMessage(t, first, "SNAPSHOT", "")
	scope := widgetScope(t, snapshot)
	if !scope.Authoritative || scope.Status != "synced" || scope.Namespace != "qa" || snapshot.Context != "test" || !containsUID(snapshot, "old-uid") {
		t.Fatal("real on-demand informer snapshot identity/scope missing")
	}
	first.Close()
	reconnected := scopeSocket(t, httpServer.URL)
	snapshot = readScopeMessage(t, reconnected, "SNAPSHOT", "")
	if !containsUID(snapshot, "old-uid") {
		t.Fatal("existing custom resource disappeared on same-source reconnect")
	}
	changed := widget("cargo", "old-uid", "opaque-update")
	if _, err := c.Dynamic.Resource(widgetGVR).Namespace("qa").Update(context.Background(), changed, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	updated := readScopeMessage(t, reconnected, "RESOURCE_EVENT", "UPDATE")
	if updated.Object.GetUID() != "old-uid" || updated.Scope == nil || updated.Scope.Resource != "widgets" {
		t.Fatal("custom update not connected to scoped watch")
	}
	if err := c.Dynamic.Resource(widgetGVR).Namespace("qa").Delete(context.Background(), "cargo", metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	deleted := readScopeMessage(t, reconnected, "RESOURCE_EVENT", "DELETE")
	if deleted.Object.GetUID() != "old-uid" {
		t.Fatal("wrong UID deleted")
	}
	reconnected.Close()
	offline := widget("cargo", "offline-uid", "rv-opaque-z")
	if _, err := c.Dynamic.Resource(widgetGVR).Namespace("qa").Create(context.Background(), offline, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	seen := scopeSocket(t, httpServer.URL)
	if !containsUID(readScopeMessage(t, seen, "SNAPSHOT", ""), "offline-uid") {
		t.Fatal("offline setup absent")
	}
	seen.Close()
	if err := c.Dynamic.Resource(widgetGVR).Namespace("qa").Delete(context.Background(), "cargo", metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	last := scopeSocket(t, httpServer.URL)
	empty := readScopeMessage(t, last, "SNAPSHOT", "")
	scope = widgetScope(t, empty)
	if containsUID(empty, "offline-uid") || !scope.Authoritative || scope.Status != "synced" {
		t.Fatal("offline DELETE was not reconciled by an authoritative empty GVR scope")
	}
}
func TestForbiddenCustomScopeIsNotAuthoritativeDeletion(t *testing.T) {
	s, c := scopedServer(t, widget("cargo", "private-uid", "opaque"))
	c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		review := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview)
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: review.Spec.ResourceAttributes.Resource != "widgets"}}, nil
	})
	mux := http.NewServeMux()
	s.Register(mux)
	h := httptest.NewServer(mux)
	defer h.Close()
	msg := readScopeMessage(t, scopeSocket(t, h.URL), "SNAPSHOT", "")
	scope := widgetScope(t, msg)
	if scope.Authoritative || scope.Status != "forbidden" || containsUID(msg, "private-uid") {
		t.Fatal("forbidden GVR looked like successful empty list or leaked data")
	}
}
func TestNamespaceScopeAndVersionPreferenceAreExplicit(t *testing.T) {
	resources := []Resource{{Group: "autoscaling", Version: "v1", Resource: "horizontalpodautoscalers", Kind: "HorizontalPodAutoscaler", Namespaced: true, Verbs: []string{"list", "watch"}}, {Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers", Kind: "HorizontalPodAutoscaler", Namespaced: true, Verbs: []string{"list", "watch"}}, {Group: "audit.example", Version: "v1", Resource: "widgets", Kind: "Widget", Namespaced: true, Verbs: []string{"list", "watch"}}}
	bindings := watchScopeBindings(resources, "qa", "qa", []ResourceScope{{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers", Namespace: "qa"}, {Group: "audit.example", Version: "v1", Resource: "widgets", Namespace: "other"}})
	var hpas int
	for _, b := range bindings {
		if b.scope.Resource == "horizontalpodautoscalers" {
			hpas++
			if b.scope.Version != "v2" {
				t.Fatal("default API version raced requested version")
			}
		}
		if b.scope.Resource == "widgets" && (b.scope.Status != "forbidden" || b.scope.Authoritative) {
			t.Fatal("out-of-scope subscription accepted")
		}
	}
	if hpas != 1 {
		t.Fatal("duplicate same-UID API representations subscribed")
	}
	r := httptest.NewRequest("GET", "http://localhost/ws?subscribe="+url.QueryEscape("audit.example/v1|widgets|qa"), nil)
	if list, e := requestedScopes(r); e != nil || len(list) != 1 {
		t.Fatal("valid subscription parse failed")
	}
	values := url.Values{}
	for i := 0; i < 33; i++ {
		values.Add("subscribe", "audit.example/v1|widgets|qa")
	}
	r = httptest.NewRequest("GET", "http://localhost/ws?"+values.Encode(), nil)
	if _, err := requestedScopes(r); err == nil {
		t.Fatal("unbounded subscription list accepted")
	}
	raw, _ := json.Marshal(envelope{Type: "SNAPSHOT", Scopes: []ResourceScope{}})
	if !bytes.Contains(raw, []byte(`"scopes":[]`)) {
		t.Fatal("empty scope list became legacy whole-cluster authority")
	}
}

func logFixtureServer(t *testing.T) (*Server, *Clients) {
	s, c := testServer(t, false)
	fixture := pod("web", "old-uid")
	fixture.ResourceVersion = "opaque-before"
	if _, err := c.Typed.CoreV1().Pods("qa").Create(context.Background(), fixture, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	return s, c
}
func replaceLogPod(t *testing.T, c *Clients) {
	t.Helper()
	if err := c.Typed.CoreV1().Pods("qa").Delete(context.Background(), "web", metav1.DeleteOptions{}); err != nil {
		t.Fatal(err)
	}
	next := pod("web", "replacement-uid")
	next.ResourceVersion = "opaque-replacement"
	if _, err := c.Typed.CoreV1().Pods("qa").Create(context.Background(), next, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
}
func logURL() string {
	return "/api/logs?context=test&namespace=qa&pod=web&container=app&follow=false&uid=old-uid&session=opening-test"
}
func TestLogUIDGuardInterposesReplacementAtOpeningBoundaries(t *testing.T) {
	for _, boundary := range []string{"before-open", "after-open", "before-first-publish"} {
		t.Run(boundary, func(t *testing.T) {
			s, c := logFixtureServer(t)
			s.openLogStream = func(context.Context, *Clients, string, string, *corev1.PodLogOptions) (io.ReadCloser, error) {
				return io.NopCloser(strings.NewReader("REPLACEMENT_PRIVATE_LOG\n")), nil
			}
			s.logOpenStage = func(stage string) {
				if stage == boundary {
					replaceLogPod(t, c)
				}
			}
			response := request(s, "GET", logURL(), nil)
			if strings.Contains(response.Body.String(), "REPLACEMENT_PRIVATE_LOG") {
				t.Fatal("new Pod log bytes escaped old UID session")
			}
			if boundary == "before-first-publish" {
				if response.Code != 200 || !strings.Contains(response.Body.String(), "KUBEVIEW_LOG_ERROR:opening-test:") {
					t.Fatal("committed stream did not signal identity failure")
				}
			} else if response.Code != 409 {
				t.Fatalf("opening replacement status=%d", response.Code)
			}
		})
	}
}
func TestLogGuardRequiresUIDAndEchoesSessionIdentity(t *testing.T) {
	s, _ := logFixtureServer(t)
	opened := false
	s.openLogStream = func(context.Context, *Clients, string, string, *corev1.PodLogOptions) (io.ReadCloser, error) {
		opened = true
		return io.NopCloser(strings.NewReader("old-incarnation-log\n")), nil
	}
	if response := request(s, "GET", "/api/logs?context=test&namespace=qa&pod=web&container=app", nil); response.Code != 400 || opened {
		t.Fatal("unidentified old-name log request reached upstream")
	}
	response := request(s, "GET", logURL(), nil)
	if response.Code != 200 || response.Header().Get("X-KubeView-Pod-UID") != "old-uid" || response.Header().Get("X-KubeView-Log-Session") != "opening-test" || response.Header().Get("X-KubeView-Log-Protocol") != "guarded-text-v1" {
		t.Fatal("opening identity headers not checked/echoed")
	}
	if !strings.Contains(response.Body.String(), "old-incarnation-log") {
		t.Fatal("valid expected-UID logs lost")
	}
}
func TestLogWatchCancelsStreamOnSameNameNewUID(t *testing.T) {
	s, c := logFixtureServer(t)
	pipeReader, pipeWriter := io.Pipe()
	defer pipeWriter.Close()
	s.openLogStream = func(context.Context, *Clients, string, string, *corev1.PodLogOptions) (io.ReadCloser, error) {
		return pipeReader, nil
	}
	mux := http.NewServeMux()
	s.Register(mux)
	h := httptest.NewServer(mux)
	defer h.Close()
	response, err := http.Get(h.URL + logURL())
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	replaceLogPod(t, c)
	done := make(chan []byte, 1)
	go func() { raw, _ := io.ReadAll(response.Body); done <- raw }()
	select {
	case raw := <-done:
		if !bytes.Contains(raw, []byte("KUBEVIEW_LOG_ERROR:opening-test:")) {
			t.Fatal("live session ended without identity failure")
		}
	case <-time.After(3 * time.Second):
		t.Fatal("replacement left blocked upstream log stream/watch")
	}
	if _, err := pipeWriter.Write([]byte("new-incarnation")); err == nil {
		t.Fatal("upstream pipe was not closed after UID replacement")
	}
}

func TestSecretPurposeEditorPreservesMetadataWithoutBulkLeak(t *testing.T) {
	fixture := &corev1.Secret{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Secret"}, ObjectMeta: metav1.ObjectMeta{Name: "roundtrip", Namespace: "qa", UID: types.UID("secret-uid"), ResourceVersion: "opaque-secret", Labels: map[string]string{"unknown-label": "keep"}, Annotations: map[string]string{"unknown.example/annotation": "keep", "kubectl.kubernetes.io/last-applied-configuration": "test-only-sensitive-annotation"}}, Data: map[string][]byte{"payload": []byte("synthetic-only-value")}}
	s, c := testServer(t, false, fixture)
	if _, err := c.Typed.CoreV1().Secrets("qa").Create(context.Background(), fixture, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	reveal := request(s, "GET", "/api/secrets/reveal?context=test&namespace=qa&name=roundtrip", nil)
	if reveal.Code != 200 {
		t.Fatal("purposeful synthetic Secret reveal failed")
	}
	var object map[string]interface{}
	if err := json.Unmarshal(reveal.Body.Bytes(), &object); err != nil {
		t.Fatal(err)
	}
	metadata := object["metadata"].(map[string]interface{})
	if metadata["annotations"].(map[string]interface{})["unknown.example/annotation"] != "keep" {
		t.Fatal("editor dropped existing annotation")
	}
	metadata["labels"].(map[string]interface{})["editor-label"] = "added"
	update := request(s, "PUT", "/api/resources?context=test&resource=secrets&namespace=qa&name=roundtrip", map[string]interface{}{"object": object})
	if update.Code != 200 {
		t.Fatalf("synthetic Secret update HTTP%d", update.Code)
	}
	stored, err := c.Dynamic.Resource(schema.GroupVersionResource{Version: "v1", Resource: "secrets"}).Namespace("qa").Get(context.Background(), "roundtrip", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if stored.GetAnnotations()["unknown.example/annotation"] != "keep" || stored.GetLabels()["unknown-label"] != "keep" || stored.GetLabels()["editor-label"] != "added" {
		t.Fatal("unknown metadata lost in purpose-edit round trip")
	}
	bulk := request(s, "GET", "/api/resources?context=test&resource=secrets&namespace=qa", nil)
	if bytes.Contains(bulk.Body.Bytes(), []byte("synthetic-only-value")) || bytes.Contains(bulk.Body.Bytes(), []byte("test-only-sensitive-annotation")) || bytes.Contains(bulk.Body.Bytes(), []byte(`"data"`)) {
		t.Fatal("purpose editor change leaked Secret content into bulk state")
	}
	masked := map[string]interface{}{"apiVersion": "v1", "kind": "Secret", "metadata": metadata, "keyNames": []interface{}{"payload"}}
	if response := request(s, "PUT", "/api/resources?context=test&resource=secrets&namespace=qa&name=roundtrip", map[string]interface{}{"object": masked}); response.Code != 422 {
		t.Fatal("masked Secret metadata accepted as real edit")
	}
}

func TestTemplateCapabilityResolvesVerifiedOwnerAndRejectsUnsupportedKinds(t *testing.T) {
	controller := func(kind, name, uid string) map[string]interface{} {
		return map[string]interface{}{"apiVersion": "apps/v1", "kind": kind, "name": name, "uid": uid, "controller": true}
	}
	workload := func(apiVersion, kind, name, uid string) *unstructured.Unstructured {
		return &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": apiVersion, "kind": kind, "metadata": map[string]interface{}{"name": name, "namespace": "qa", "uid": uid, "resourceVersion": "opaque"}, "spec": map[string]interface{}{"replicas": int64(2), "template": map[string]interface{}{"spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "test-only"}}}}}}}
	}
	deployment := workload("apps/v1", "Deployment", "deployment", "d-uid")
	replicaset := workload("apps/v1", "ReplicaSet", "replicaset", "rs-uid")
	replicaset.Object["metadata"].(map[string]interface{})["ownerReferences"] = []interface{}{controller("Deployment", "deployment", "d-uid")}
	ownedPod := workload("v1", "Pod", "owned", "p-uid")
	ownedPod.Object["metadata"].(map[string]interface{})["ownerReferences"] = []interface{}{controller("ReplicaSet", "replicaset", "rs-uid")}
	standalone := workload("apps/v1", "ReplicaSet", "standalone", "standalone-uid")
	job := workload("batch/v1", "Job", "job", "job-uid")
	cron := workload("batch/v1", "CronJob", "cron", "cron-uid")
	s, c := testServer(t, false)
	d := c.Discovery.(*discoveryfake.FakeDiscovery)
	d.Resources = append(d.Resources, &metav1.APIResourceList{GroupVersion: "apps/v1", APIResources: []metav1.APIResource{{Name: "deployments", Kind: "Deployment", Namespaced: true}, {Name: "replicasets", Kind: "ReplicaSet", Namespaced: true}}}, &metav1.APIResourceList{GroupVersion: "batch/v1", APIResources: []metav1.APIResource{{Name: "jobs", Kind: "Job", Namespaced: true}, {Name: "cronjobs", Kind: "CronJob", Namespaced: true}}})
	c.Dynamic = dynamicfake.NewSimpleDynamicClient(runtime.NewScheme(), deployment, replicaset, ownedPod, standalone, job, cron)
	podGVR := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	capability := s.templateResourcesCapability(context.Background(), c, podGVR, "qa", "owned", "p-uid")
	if !capability.Supported || capability.Target == nil || capability.Target.UID != "d-uid" || capability.Target.Resource != "deployments" || capability.Effect != "rollout" {
		t.Fatal("Pod→RS→Deployment capability did not resolve verified UID")
	}
	if stale := s.templateResourcesCapability(context.Background(), c, podGVR, "qa", "owned", "old-pod-uid"); stale.Supported {
		t.Fatal("old selected Pod UID was allowed to target replacement owner")
	}
	for _, test := range []struct{ group, resource, name, uid string }{{"apps", "replicasets", "standalone", "standalone-uid"}, {"batch", "jobs", "job", "job-uid"}, {"batch", "cronjobs", "cron", "cron-uid"}} {
		gvr := schema.GroupVersionResource{Group: test.group, Version: "v1", Resource: test.resource}
		got := s.templateResourcesCapability(context.Background(), c, gvr, "qa", test.name, test.uid)
		if got.Supported || got.Reason == "" {
			t.Fatal("unsupported controller had a CPU/RAM success capability")
		}
		before := len(c.Dynamic.(*dynamicfake.FakeDynamicClient).Actions())
		response := request(s, "POST", "/api/actions?context=test", map[string]interface{}{"group": test.group, "version": "v1", "resource": test.resource, "namespace": "qa", "name": test.name, "uid": test.uid, "resourceVersion": "opaque", "action": "resources", "containers": []interface{}{map[string]interface{}{"name": "app", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "20m"}}}}})
		if response.Code != 422 {
			t.Fatalf("unsupported target status=%d", response.Code)
		}
		for _, action := range c.Dynamic.(*dynamicfake.FakeDynamicClient).Actions()[before:] {
			if action.GetVerb() == "update" || action.GetVerb() == "patch" {
				t.Fatal("unsupported template action reached mutation")
			}
		}
	}
}

func TestTemplateCapabilityPreservesControllerStrategyAndReadOnly(t *testing.T) {
	for _, tc := range []struct {
		kind, resource, effect string
		spec                   map[string]interface{}
		affected               int64
	}{
		{"Deployment", "deployments", "paused-deployment", map[string]interface{}{"paused": true}, -1},
		{"StatefulSet", "statefulsets", "manual-pod-recreation", map[string]interface{}{"replicas": int64(3), "updateStrategy": map[string]interface{}{"type": "OnDelete"}}, 3},
		{"StatefulSet", "statefulsets", "partitioned-rollout", map[string]interface{}{"replicas": int64(4), "updateStrategy": map[string]interface{}{"type": "RollingUpdate", "rollingUpdate": map[string]interface{}{"partition": int64(2)}}}, 2},
		{"DaemonSet", "daemonsets", "manual-pod-recreation", map[string]interface{}{"updateStrategy": map[string]interface{}{"type": "OnDelete"}}, -1},
	} {
		t.Run(tc.kind+"-"+tc.effect, func(t *testing.T) {
			s, c := testServer(t, false)
			gvr := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: tc.resource}
			object := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": tc.kind, "metadata": map[string]interface{}{"name": "work", "namespace": "qa", "uid": "strategy-uid"}, "spec": tc.spec}}
			c.Dynamic = dynamicfake.NewSimpleDynamicClient(runtime.NewScheme(), object)
			cap := s.templateResourcesCapability(context.Background(), c, gvr, "qa", "work", "strategy-uid")
			if !cap.Supported || cap.Effect != tc.effect || cap.Reason == "" {
				t.Fatalf("controller behavior mislabeled: %+v", cap)
			}
			if tc.affected >= 0 && (cap.AffectedReplicas == nil || *cap.AffectedReplicas != tc.affected) {
				t.Fatalf("wrong affected ordinal count: %+v", cap)
			}
			s.ReadOnly = true
			if cap = s.templateResourcesCapability(context.Background(), c, gvr, "qa", "work", "strategy-uid"); cap.Supported {
				t.Fatal("read-only advertised writable template")
			}
		})
	}
}

func TestTemplateCapabilityDoesNotReadSecretBodies(t *testing.T) {
	s, c := testServer(t, false)
	client := c.Dynamic.(*dynamicfake.FakeDynamicClient)
	before := len(client.Actions())
	cap := s.templateResourcesCapability(context.Background(), c, schema.GroupVersionResource{Version: "v1", Resource: "secrets"}, "qa", "metadata-only", "secret-uid")
	if cap.Supported || len(client.Actions()) != before {
		t.Fatal("unsupported Secret template capability read a Secret object body")
	}
}
