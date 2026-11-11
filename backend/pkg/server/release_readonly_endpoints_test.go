package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func releaseMutationCount(actions []ktesting.Action) int {
	n := 0
	for _, a := range actions {
		if a.GetResource().Resource == "selfsubjectaccessreviews" {
			continue
		}
		switch a.GetVerb() {
		case "create", "update", "patch", "delete", "delete-collection":
			n++
		}
	}
	return n
}
func TestReleaseReadOnlyEndpointsRetainedGrant(t *testing.T) {
	object := func(name, uid string) map[string]interface{} {
		return map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": name, "namespace": "qa", "uid": uid, "resourceVersion": "rv-opaque-a"}, "spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "synthetic:never-pulled"}}}}
	}
	cases := []struct {
		name, method, path string
		body               interface{}
		positive           int
		readOnlyText       string
		mutates            bool
		typedPod           bool
	}{
		{"create", "POST", "/api/resources?context=test&resource=pods&namespace=qa", map[string]interface{}{"object": object("new", "")}, 201, "READ_ONLY=true", true, false},
		{"replace", "PUT", "/api/resources?context=test&resource=pods&namespace=qa&name=web", map[string]interface{}{"object": object("web", "pod-uid")}, 200, "READ_ONLY=true", true, false},
		{"delete", "DELETE", "/api/resources?context=test&resource=pods&namespace=qa&name=web", map[string]interface{}{"uid": "pod-uid", "resourceVersion": "rv-opaque-a"}, 202, "READ_ONLY=true", true, false},
		{"restart-action", "POST", "/api/actions?context=test", map[string]interface{}{"group": "apps", "version": "v1", "resource": "deployments", "namespace": "qa", "name": "work", "uid": "deploy-uid", "resourceVersion": "rv1", "action": "restart"}, 202, "READ_ONLY=true", true, false},
		{"resize-patch-action", "POST", "/api/actions?context=test", map[string]interface{}{"resource": "pods", "namespace": "qa", "name": "web", "uid": "pod-uid", "resourceVersion": "rv-opaque-a", "action": "resize", "containers": []interface{}{map[string]interface{}{"name": "app", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "20m"}}}}}, 202, "READ_ONLY=true", true, false},
		{"exec", "GET", "/api/exec?context=test&namespace=qa&pod=web&container=app&uid=pod-uid", nil, 503, "READ_ONLY=true", false, true},
		{"preview-create", "POST", "/api/portforwards?context=test", map[string]interface{}{"context": "test", "namespace": "qa", "pod": "web", "uid": "pod-uid", "port": 8080}, 503, "READ_ONLY=true", false, true},
		{"raw-forward", "GET", "/api/portforward?context=test&namespace=qa&pod=web&uid=pod-uid&port=8080", nil, 503, "READ_ONLY=true", false, true},
		{"provision", "POST", "/api/providers/minikube/workers?context=test", map[string]interface{}{"context": "test", "idempotencyKey": "synthetic-readonly"}, 503, "küme kapsamlı yazma", false, false},
	}
	for _, tc := range cases {
		for _, readOnly := range []bool{false, true} {
			label := tc.name + "/write-enabled"
			if readOnly {
				label = tc.name + "/global-read-only"
			}
			t.Run(label, func(t *testing.T) {
				deployment := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "metadata": map[string]interface{}{"name": "work", "namespace": "qa", "uid": "deploy-uid", "resourceVersion": "rv1"}, "spec": map[string]interface{}{"template": map[string]interface{}{"metadata": map[string]interface{}{"annotations": map[string]interface{}{}}}}}}
				s, c := testServer(t, false, pod("web", "pod-uid"), deployment)
				s.Namespace = ""
				s.providers = &providerServices{}
				typed := c.Typed.(*kubefake.Clientset)
				dyn := c.Dynamic.(*dynamicfake.FakeDynamicClient)
				c.Typed.Discovery().(*discoveryfake.FakeDiscovery).Resources[0].APIResources = append(c.Typed.Discovery().(*discoveryfake.FakeDiscovery).Resources[0].APIResources, metav1.APIResource{Name: "pods/resize", Namespaced: true, Kind: "Pod", Verbs: metav1.Verbs{"patch"}})
				if _, err := typed.CoreV1().Pods("qa").Create(context.Background(), pod("web", "pod-uid"), metav1.CreateOptions{}); err != nil {
					t.Fatal(err)
				}
				cookie, info := diagnostic(t, s, "test", "qa", nil)
				nonce := info["connectionID"].(string)
				if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); w.Code != 200 {
					t.Fatalf("valid grant fixture: %d", w.Code)
				}
				s.ReadOnly = readOnly
				typed.ClearActions()
				dyn.ClearActions()
				var w *httptest.ResponseRecorder
				if tc.name == "provision" {
					// Provider routes require an actual loopback operator address;
					// httptest's default 192.0.2.1 is intentionally not loopback.
					raw, _ := json.Marshal(tc.body)
					r := httptest.NewRequest(tc.method, "http://localhost"+tc.path, bytes.NewReader(raw))
					r.RemoteAddr = "127.0.0.1:12345"
					r.Header.Set("Content-Type", "application/json")
					r.Header.Set("X-KubeView-Connection", nonce)
					r.AddCookie(cookie)
					w = httptest.NewRecorder()
					mux := http.NewServeMux()
					s.Register(mux)
					mux.ServeHTTP(w, r)
				} else {
					w = connectionRequest(s, tc.method, tc.path, tc.body, cookie, nonce)
				}
				want := tc.positive
				if readOnly {
					want = http.StatusForbidden
				}
				if w.Code != want {
					t.Fatalf("status=%d want=%d body=%s", w.Code, want, w.Body)
				}
				mutations := releaseMutationCount(typed.Actions()) + releaseMutationCount(dyn.Actions())
				if readOnly {
					if !strings.Contains(w.Body.String(), tc.readOnlyText) {
						t.Fatalf("not a read-only denial: %s", w.Body)
					}
					if mutations != 0 {
						t.Fatalf("read-only reached %d mutation actions", mutations)
					}
					for _, a := range typed.Actions() {
						if a.GetResource().Resource == "pods" {
							t.Fatal("read-only reached typed Pod transport/subresource preflight")
						}
					}
				} else {
					if tc.mutates && mutations == 0 {
						t.Fatal("accepted positive did not reach fake mutation")
					}
					if tc.typedPod {
						found := false
						for _, a := range typed.Actions() {
							found = found || a.GetVerb() == "get" && a.GetResource().Resource == "pods"
						}
						if !found {
							t.Fatal("positive did not reach transport preflight")
						}
					}
				}
			})
		}
	}
}
func TestReleaseReadOnlySecretReadAndUnsupportedPatch(t *testing.T) {
	secret := &corev1.Secret{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Secret"}, ObjectMeta: metav1.ObjectMeta{Name: "credentials", Namespace: "qa", UID: "secret-uid"}, Data: map[string][]byte{"canary": []byte("SYNTHETIC-CANARY-NOT-CREDENTIAL")}}
	s, c := testServer(t, false, secret)
	cookie, info := diagnostic(t, s, "test", "qa", nil)
	nonce := info["connectionID"].(string)
	if w := connectionRequest(s, "POST", "/api/management", managementBody("test", "qa", nonce, true), cookie, ""); w.Code != 200 {
		t.Fatal("grant fixture")
	}
	s.ReadOnly = true
	if w := connectionRequest(s, "GET", "/api/resources?context=test&resource=secrets&namespace=qa&name=credentials", nil, cookie, nonce); w.Code != 200 || strings.Contains(w.Body.String(), "SYNTHETIC-CANARY-NOT-CREDENTIAL") {
		t.Fatalf("Secret metadata read contract: %d", w.Code)
	}
	dyn := c.Dynamic.(*dynamicfake.FakeDynamicClient)
	dyn.ClearActions()
	// Generic PATCH is not a registered resource mutation contract; 405 is not
	// presented as evidence of the read-only guard. Resize above tests actual PATCH.
	if w := connectionRequest(s, "PATCH", "/api/resources?context=test&resource=secrets&namespace=qa&name=credentials", map[string]interface{}{"metadata": map[string]interface{}{"uid": "secret-uid"}}, cookie, nonce); w.Code != 405 {
		t.Fatalf("unsupported generic PATCH=%d", w.Code)
	}
	if releaseMutationCount(dyn.Actions()) != 0 {
		t.Fatal("unsupported PATCH reached mutation")
	}
}
