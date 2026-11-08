package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func ownedRepairGateway(t *testing.T) (*Server, *Clients, context.Context, string, string) {
	t.Helper()
	contextName := os.Getenv("KUBEVIEW_REPAIR_CONTEXT")
	expected := os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID")
	ns := os.Getenv("KUBEVIEW_REPAIR_NAMESPACE")
	if contextName == "" || expected == "" || ns == "" {
		t.Skip("requires explicit owned repair context, cluster UID and namespace")
	}
	if !strings.HasPrefix(contextName, "kv-repair-") || !strings.HasPrefix(ns, "kv-repair-") {
		t.Fatal("refusing unowned repair scope")
	}
	s := New()
	s.ReadOnly = false
	s.Namespace = ns
	s.Token = ""
	t.Cleanup(s.Close)
	c, err := s.client(contextName)
	if err != nil {
		t.Fatal("owned context unavailable")
	}
	u, err := url.Parse(c.Config.Host)
	if err != nil {
		t.Fatal(err)
	}
	ip := net.ParseIP(u.Hostname())
	if u.Hostname() != "localhost" && (ip == nil || !ip.IsLoopback()) {
		t.Fatal("owned repair test requires loopback API")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	t.Cleanup(cancel)
	cluster, err := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if err != nil || string(cluster.UID) != expected {
		t.Fatal("refusing unexpected cluster identity")
	}
	namespace, err := c.Typed.CoreV1().Namespaces().Get(ctx, ns, metav1.GetOptions{})
	if err != nil || namespace.Labels["kubeview.io/repair-owner"] != "backend-manager" {
		t.Fatal("refusing namespace not owned by backend repair tests")
	}
	mux := http.NewServeMux()
	s.Register(mux)
	server := httptest.NewServer(mux)
	t.Cleanup(server.Close)
	// Ownership and kube-system UID above are verified before this explicit UI
	// management handshake. No test-only bypass of the production gate is used.
	cookie, info := diagnostic(t, s, contextName, ns, nil)
	nonce := info["connectionID"].(string)
	if response := connectionRequest(s, "POST", "/api/management", managementBody(contextName, ns, nonce, true), cookie, ""); response.Code != 200 {
		t.Fatalf("owned gateway management handshake: HTTP%d", response.Code)
	}
	ctx = context.WithValue(ctx, integrationOperatorKey{}, integrationOperator{cookie: cookie, nonce: nonce})
	return s, c, ctx, contextName, server.URL
}

type integrationOperatorKey struct{}
type integrationOperator struct {
	cookie *http.Cookie
	nonce  string
}

func (operator integrationOperator) apply(request *http.Request) {
	request.AddCookie(operator.cookie)
	request.Header.Set("X-KubeView-Connection", operator.nonce)
}
func explicitTestOperator(t *testing.T, s *Server, contextName, namespace string) integrationOperator {
	t.Helper()
	cookie, info := diagnostic(t, s, contextName, namespace, nil)
	nonce := info["connectionID"].(string)
	if w := connectionRequest(s, "POST", "/api/management", managementBody(contextName, namespace, nonce, true), cookie, ""); w.Code != 200 {
		t.Fatalf("explicit management handshake: HTTP%d", w.Code)
	}
	return integrationOperator{cookie: cookie, nonce: nonce}
}
func verifyDedicatedCluster(t *testing.T, s *Server) {
	t.Helper()
	expected := os.Getenv("KUBEVIEW_TEST_CLUSTER_UID")
	if expected == "" {
		t.Skip("requires explicit KUBEVIEW_TEST_CLUSTER_UID before dedicated-cluster mutations")
	}
	c, err := s.client("kubeview-test")
	if err != nil {
		t.Fatal("dedicated context unavailable")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cluster, err := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if err != nil || string(cluster.UID) != expected {
		t.Fatal("refusing unexpected dedicated cluster UID")
	}
}

func repairHTTP(t *testing.T, ctx context.Context, method, address string, body interface{}) (int, []byte) {
	t.Helper()
	var encoded []byte
	if body != nil {
		var err error
		encoded, err = json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
	}
	request, err := http.NewRequestWithContext(ctx, method, address, bytes.NewReader(encoded))
	if err != nil {
		t.Fatal(err)
	}
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if operator, ok := ctx.Value(integrationOperatorKey{}).(integrationOperator); ok {
		operator.apply(request)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		t.Fatal(err)
	}
	return response.StatusCode, data
}

func TestOwnedRepairRealSyntheticSecretMetadataRoundTrip(t *testing.T) {
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	name := "kv-secret-" + strings.Split(uuid.NewString(), "-")[0]
	owner := uuid.NewString()
	secret, err := c.Typed.CoreV1().Secrets(ns).Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: map[string]string{"kubeview.io/repair-owner": owner, "unknown-label": "keep"}, Annotations: map[string]string{"unknown.example/annotation": "preserve", "kubectl.kubernetes.io/last-applied-configuration": "synthetic-private-annotation"}}, Data: map[string][]byte{"fixture": []byte("synthetic-only-do-not-record")}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal("synthetic Secret create failed")
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		_ = c.Typed.CoreV1().Secrets(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &secret.UID}})
	})
	q := url.Values{"context": {contextName}, "namespace": {ns}, "name": {name}}
	code, raw := repairHTTP(t, ctx, "GET", gateway+"/api/secrets/reveal?"+q.Encode(), nil)
	if code != 200 {
		t.Fatalf("purpose reveal HTTP%d", code)
	}
	var object map[string]interface{}
	if err = json.Unmarshal(raw, &object); err != nil {
		t.Fatal("purpose Secret object malformed")
	}
	metadata := object["metadata"].(map[string]interface{})
	annotations, ok := metadata["annotations"].(map[string]interface{})
	if !ok || annotations["unknown.example/annotation"] != "preserve" {
		t.Fatal("purposeful reveal lost unknown annotation")
	}
	metadata["labels"].(map[string]interface{})["edited"] = "yes"
	q.Set("resource", "secrets")
	code, _ = repairHTTP(t, ctx, "PUT", gateway+"/api/resources?"+q.Encode(), map[string]interface{}{"object": object})
	if code != 200 {
		t.Fatalf("Secret metadata edit HTTP%d", code)
	}
	stored, err := c.Typed.CoreV1().Secrets(ns).Get(ctx, name, metav1.GetOptions{})
	if err != nil || stored.Annotations["unknown.example/annotation"] != "preserve" || stored.Labels["unknown-label"] != "keep" || stored.Labels["edited"] != "yes" || !bytes.Equal(stored.Data["fixture"], secret.Data["fixture"]) {
		t.Fatal("Secret content/unknown metadata changed during purpose edit")
	}
	q.Del("name")
	code, raw = repairHTTP(t, ctx, "GET", gateway+"/api/resources?"+q.Encode(), nil)
	if code != 200 || bytes.Contains(raw, []byte(`"data"`)) || bytes.Contains(raw, []byte("synthetic-private-annotation")) || bytes.Contains(raw, []byte("synthetic-only-do-not-record")) {
		t.Fatal("bulk response leaked synthetic Secret data or private annotations")
	}
	q.Set("name", name)
	masked := map[string]interface{}{"apiVersion": "v1", "kind": "Secret", "metadata": metadata, "keyNames": []interface{}{"fixture"}}
	code, _ = repairHTTP(t, ctx, "PUT", gateway+"/api/resources?"+q.Encode(), map[string]interface{}{"object": masked})
	if code != 422 {
		t.Fatalf("mask rewrite must fail: HTTP%d", code)
	}
	t.Logf("REAL API + gateway Secret purpose edit: context=%s namespace=%s UID=%s; unknown labels/annotations and synthetic data preserved; bulk data/annotation redaction and masked-write rejection verified; no values recorded", contextName, ns, secret.UID)
}

func TestOwnedRepairRealTemplateCapabilityTargets(t *testing.T) {
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	owner := uuid.NewString()
	prefix := "kv-cap-" + strings.Split(owner, "-")[0]
	template := func(restart string) map[string]interface{} {
		return map[string]interface{}{"metadata": map[string]interface{}{"labels": map[string]interface{}{"repair-case": prefix, "kubeview.io/repair-owner": owner}}, "spec": map[string]interface{}{"restartPolicy": restart, "schedulingGates": []interface{}{map[string]interface{}{"name": "kubeview.io/repair-hold"}}, "containers": []interface{}{map[string]interface{}{"name": "app", "image": "registry.k8s.io/pause:3.10", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "1m", "memory": "8Mi"}}}}}}
	}
	selectLabels := map[string]interface{}{"matchLabels": map[string]interface{}{"repair-case": prefix}}
	cases := []struct {
		group, resource, kind string
		supported             bool
		spec                  map[string]interface{}
	}{
		{"apps", "deployments", "Deployment", true, map[string]interface{}{"replicas": int64(1), "selector": selectLabels, "template": template("Always")}},
		{"apps", "statefulsets", "StatefulSet", true, map[string]interface{}{"replicas": int64(1), "selector": selectLabels, "serviceName": prefix, "template": template("Always")}},
		{"apps", "daemonsets", "DaemonSet", true, map[string]interface{}{"selector": selectLabels, "template": template("Always")}},
		{"apps", "replicasets", "ReplicaSet", false, map[string]interface{}{"replicas": int64(0), "selector": selectLabels, "template": template("Always")}},
		{"batch", "jobs", "Job", false, map[string]interface{}{"suspend": true, "template": template("Never")}},
		{"batch", "cronjobs", "CronJob", false, map[string]interface{}{"schedule": "0 0 * * *", "suspend": true, "jobTemplate": map[string]interface{}{"spec": map[string]interface{}{"template": template("Never")}}}},
	}
	for _, item := range cases {
		t.Run(item.kind, func(t *testing.T) {
			name := prefix + "-" + strings.ToLower(item.kind)
			gvr := schema.GroupVersionResource{Group: item.group, Version: "v1", Resource: item.resource}
			object := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": item.group + "/v1", "kind": item.kind, "metadata": map[string]interface{}{"name": name, "namespace": ns, "labels": map[string]interface{}{"kubeview.io/repair-owner": owner}}, "spec": item.spec}}
			created, err := c.Dynamic.Resource(gvr).Namespace(ns).Create(ctx, object, metav1.CreateOptions{})
			if err != nil {
				t.Fatalf("owned %s create failed: %v", item.kind, err)
			}
			t.Cleanup(func() {
				cleanup, done := context.WithTimeout(context.Background(), 20*time.Second)
				defer done()
				uid := created.GetUID()
				background := metav1.DeletePropagationBackground
				err := c.Dynamic.Resource(gvr).Namespace(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid}, PropagationPolicy: &background})
				if err != nil && !apierrors.IsNotFound(err) {
					t.Error("own workload cleanup failed")
				}
			})
			check := func(resource, group, name, uid string) {
				q := url.Values{"context": {contextName}, "namespace": {ns}, "group": {group}, "version": {"v1"}, "resource": {resource}, "name": {name}, "uid": {uid}}
				code, raw := repairHTTP(t, ctx, "GET", gateway+"/api/capabilities?"+q.Encode(), nil)
				if code != 200 {
					t.Fatalf("capability HTTP%d", code)
				}
				var result struct {
					TemplateResources TemplateResourcesCapability `json:"templateResources"`
				}
				if err = json.Unmarshal(raw, &result); err != nil {
					t.Fatal(err)
				}
				cap := result.TemplateResources
				if cap.Supported != item.supported || cap.Target == nil || cap.Target.UID != string(created.GetUID()) || cap.Target.Resource != item.resource {
					t.Fatalf("actual owner capability mismatch: %+v", cap)
				}
				if !cap.Supported && cap.Reason == "" {
					t.Fatal("unsupported operation lacks explanation")
				}
				t.Logf("REAL HTTP capability selected=%s/%s UID=%s target=%s UID=%s supported=%t effect=%s", resource, name, uid, cap.Target.Resource, cap.Target.UID, cap.Supported, cap.Effect)
			}
			check(item.resource, item.group, name, string(created.GetUID()))
			if item.supported {
				deadline := time.Now().Add(25 * time.Second)
				var selected *corev1.Pod
				for time.Now().Before(deadline) {
					pods, e := c.Typed.CoreV1().Pods(ns).List(ctx, metav1.ListOptions{LabelSelector: "repair-case=" + prefix})
					if e != nil {
						t.Fatal(e)
					}
					for i := range pods.Items {
						pod := &pods.Items[i]
						for _, ref := range pod.OwnerReferences {
							if ref.UID == created.GetUID() {
								selected = pod
								break
							}
							if item.kind == "Deployment" && ref.Kind == "ReplicaSet" {
								rs, e := c.Typed.AppsV1().ReplicaSets(ns).Get(ctx, ref.Name, metav1.GetOptions{})
								if e == nil {
									for _, dref := range rs.OwnerReferences {
										if dref.UID == created.GetUID() {
											selected = pod
											break
										}
									}
								}
							}
						}
					}
					if selected != nil {
						break
					}
					time.Sleep(100 * time.Millisecond)
				}
				if selected == nil {
					t.Fatal("controller did not produce actual owned Pod")
				}
				check("pods", "", selected.Name, string(selected.UID))
			}
			// Exercise the real mutation endpoint as well as its advertised
			// capability. Gated Pods deliberately do not claim a Ready rollout.
			var updated *unstructured.Unstructured
			var code int
			for attempt := 0; attempt < 3; attempt++ {
				current, e := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
				if e != nil {
					t.Fatal(e)
				}
				body := map[string]interface{}{"group": item.group, "version": "v1", "resource": item.resource, "namespace": ns, "name": name, "uid": string(created.GetUID()), "resourceVersion": current.GetResourceVersion(), "action": "resources", "containers": []interface{}{map[string]interface{}{"name": "app", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "20m", "memory": "8Mi"}}}}}
				code, _ = repairHTTP(t, ctx, "POST", gateway+"/api/actions?context="+url.QueryEscape(contextName), body)
				if code != 409 {
					break
				}
			}
			if !item.supported {
				if code != 422 {
					t.Fatalf("unsupported resource mutation must reject, HTTP%d", code)
				}
			} else {
				if code != 202 {
					t.Fatalf("supported template mutation HTTP%d", code)
				}
				updated, err = c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
				if err != nil {
					t.Fatal(err)
				}
				containers, _, _ := unstructured.NestedSlice(updated.Object, "spec", "template", "spec", "containers")
				cpu, _, _ := unstructured.NestedString(containers[0].(map[string]interface{}), "resources", "requests", "cpu")
				if cpu != "20m" || updated.GetUID() != created.GetUID() || updated.GetGeneration() <= created.GetGeneration() {
					t.Fatal("resource update did not change verified workload template")
				}
			}
			t.Logf("REAL resource mutation kind=%s UID=%s HTTP=%d; template accepted/rejected consistently; gated workload readiness intentionally not asserted", item.kind, created.GetUID(), code)
		})
	}
}
