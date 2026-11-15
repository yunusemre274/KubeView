package traffic

import (
	"context"
	"fmt"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func TestExplicitNamespaceScopesFilterBothEndpointsWithoutAllNamespaceRead(t *testing.T) {
	pod := func(ns, name, uid, app, ip string) *corev1.Pod {
		return &corev1.Pod{ObjectMeta: metav1.ObjectMeta{Namespace: ns, Name: name, UID: types.UID(uid), Labels: map[string]string{"app": app}}, Spec: corev1.PodSpec{NodeName: "shared-node"}, Status: corev1.PodStatus{Phase: corev1.PodRunning, PodIP: ip}}
	}
	a := pod("alpha", "sender", "uid-alpha", "alpha", "10.0.0.1")
	b := pod("beta", "receiver", "uid-beta", "beta", "10.0.0.2")
	hidden := pod("beta", "private", "private-uid", "private", "10.0.0.3")
	client := fake.NewSimpleClientset(a, b, hidden)
	client.PrependReactor("list", "pods", func(action ktesting.Action) (bool, runtime.Object, error) {
		if action.GetNamespace() == "" {
			return true, nil, fmt.Errorf("all-namespace access forbidden")
		}
		return false, nil, nil
	})
	scopes, key, err := normalizeNamespaceScopes([]NamespaceScope{{Namespace: "alpha", Selector: "app in (alpha),!excluded"}, {Namespace: "beta", Selector: "app=beta"}})
	if err != nil {
		t.Fatal(err)
	}
	hub := &Hub{cfg: Config{ClusterUID: "cluster", ClusterName: "lab"}}
	collection := &collection{hub: hub, namespace: key, contextName: "ctx", namespaceScopes: scopes, strictEndpoints: true, history: newHistory(), seen: map[string]time.Time{}, status: "connecting"}
	if err = collection.refreshPods(context.Background(), client); err != nil {
		t.Fatal(err)
	}
	if len(collection.history.current) != 2 || len(collection.allowedEndpoints) != 2 {
		t.Fatal("unselected metadata entered history")
	}
	for _, action := range client.Actions() {
		if action.GetNamespace() == "" {
			t.Fatal("namespace union widened access")
		}
	}
	now := time.Now().UTC()
	collection.history = newHistory()
	collection.history.observe([]corev1.Pod{*a, *b}, now.Add(-2*time.Second))
	collection.history.observe([]corev1.Pod{*a, *b}, now)
	row := observedFlow{uuid: "authorized", at: now.Add(-time.Second), source: observedEndpoint{name: a.Name, namespace: a.Namespace, ip: a.Status.PodIP, cluster: "lab"}, destination: observedEndpoint{name: b.Name, namespace: b.Namespace, ip: b.Status.PodIP, cluster: "lab"}, protocol: "TCP", transport: "TCP", verdict: "FORWARDED"}
	collection.ingest(row, now)
	outside := row
	outside.uuid = "outside-selector"
	outside.destination = observedEndpoint{name: hidden.Name, namespace: hidden.Namespace, ip: hidden.Status.PodIP, cluster: "lab"}
	collection.ingest(outside, now)
	outside.uuid = "outside-namespace"
	outside.destination.namespace = "private"
	collection.ingest(outside, now)
	result := collection.snapshot(now)
	if len(result.Flows) != 1 || collection.filtered != 2 || len(result.NamespaceScopes) != 2 {
		t.Fatalf("union/endpoint scope: %+v", result)
	}
	if result.Flows[0].Source.UID == nil || *result.Flows[0].Source.UID != "uid-alpha" || result.Flows[0].Destination.UID == nil || *result.Flows[0].Destination.UID != "uid-beta" {
		t.Fatal("cross namespace temporal UID mapping lost")
	}
	b.Labels["app"] = "private"
	if _, err = client.CoreV1().Pods("beta").Update(context.Background(), b, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	collection.lastRefresh = time.Time{}
	if err = collection.refreshPods(context.Background(), client); err != nil {
		t.Fatal(err)
	}
	if len(collection.snapshot(now).Flows) != 0 {
		t.Fatal("out-of-selector endpoint remained visible after refresh")
	}
}
func TestNamespaceScopeKeysCanonicalAndDistinct(t *testing.T) {
	_, a, err := normalizeNamespaceScopes([]NamespaceScope{{Namespace: "a", Selector: "tier in (frontend,backend)"}, {Namespace: "b", Selector: "app=b"}})
	if err != nil {
		t.Fatal(err)
	}
	_, b, err := normalizeNamespaceScopes([]NamespaceScope{{Namespace: "b", Selector: "app=b"}, {Namespace: "a", Selector: "tier in (backend,frontend)"}, {Namespace: "b", Selector: "app=b"}})
	if err != nil || a != b {
		t.Fatal("equivalent namespace scopes did not canonicalize")
	}
	_, different, _ := normalizeNamespaceScopes([]NamespaceScope{{Namespace: "a", Selector: "app=private"}, {Namespace: "b", Selector: "app=b"}})
	if a == different {
		t.Fatal("different metadata scopes shared collection key")
	}
	for _, invalid := range [][]NamespaceScope{nil, {{Namespace: "../private"}}, {{Namespace: "a", Selector: "invalid in ("}}} {
		if _, _, err = normalizeNamespaceScopes(invalid); err == nil {
			t.Fatal("invalid namespace scope accepted")
		}
	}
}
