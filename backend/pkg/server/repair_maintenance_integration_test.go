package server

import (
	"context"
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// The coordinator must explicitly reserve an otherwise idle, owned worker.
// Never selects the current context's first Node or drains arbitrary workloads.
func TestOwnedRepairRealDrainRespectsPDB(t *testing.T) {
	nodeName, expectedNodeUID := os.Getenv("KUBEVIEW_REPAIR_DRAIN_NODE"), os.Getenv("KUBEVIEW_REPAIR_DRAIN_NODE_UID")
	if nodeName == "" || expectedNodeUID == "" {
		t.Skip("requires explicitly reserved owned worker name and UID")
	}
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	if !strings.HasPrefix(nodeName, contextName+"-m") {
		t.Fatal("refusing worker outside owned repair cluster")
	}
	nodes := schema.GroupVersionResource{Version: "v1", Resource: "nodes"}
	deployments := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	pdbs := schema.GroupVersionResource{Group: "policy", Version: "v1", Resource: "poddisruptionbudgets"}
	initial, err := c.Dynamic.Resource(nodes).Get(ctx, nodeName, metav1.GetOptions{})
	if err != nil || string(initial.GetUID()) != expectedNodeUID {
		t.Fatal("reserved worker UID mismatch")
	}
	original, _, _ := unstructured.NestedBool(initial.Object, "spec", "unschedulable")
	if original {
		t.Fatal("reserved worker already cordoned; no baseline scheduling attempted")
	}
	// Full Node maintenance cannot run through the namespace-limited product
	// endpoint. Scope here is deliberately widened only in this owned gateway.
	s.Namespace = ""
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 20*time.Second)
		defer done()
		for attempt := 0; attempt < 6; attempt++ {
			current, e := c.Dynamic.Resource(nodes).Get(cleanup, nodeName, metav1.GetOptions{})
			if e != nil || string(current.GetUID()) != expectedNodeUID {
				t.Error("reserved Node changed; refusing restore to another UID")
				return
			}
			_ = unstructured.SetNestedField(current.Object, original, "spec", "unschedulable")
			if _, e = c.Dynamic.Resource(nodes).Update(cleanup, current, metav1.UpdateOptions{}); e == nil {
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Error("failed restoring owned Node scheduling state")
	})
	name := "kv-drain-" + strings.Split(uuid.NewString(), "-")[0]
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		for deadline := time.Now().Add(12 * time.Second); time.Now().Before(deadline); {
			pods, e := c.Typed.CoreV1().Pods(ns).List(cleanup, metav1.ListOptions{LabelSelector: "repair-drain=" + name})
			if e == nil && len(pods.Items) == 0 {
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Error("own drain workload Pods remained before Node restore")
	})
	template := map[string]interface{}{"metadata": map[string]interface{}{"labels": map[string]interface{}{"repair-drain": name}}, "spec": map[string]interface{}{"terminationGracePeriodSeconds": int64(1), "affinity": map[string]interface{}{"nodeAffinity": map[string]interface{}{"requiredDuringSchedulingIgnoredDuringExecution": map[string]interface{}{"nodeSelectorTerms": []interface{}{map[string]interface{}{"matchFields": []interface{}{map[string]interface{}{"key": "metadata.name", "operator": "In", "values": []interface{}{nodeName}}}}}}}}, "containers": []interface{}{map[string]interface{}{"name": "app", "image": "alpine:3.21", "command": []interface{}{"sleep", "1200"}, "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "10m", "memory": "8Mi"}}}}}}
	deployment := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "metadata": map[string]interface{}{"name": name, "namespace": ns, "labels": map[string]interface{}{"kubeview.io/repair-owner": "backend-manager"}}, "spec": map[string]interface{}{"replicas": int64(1), "selector": map[string]interface{}{"matchLabels": map[string]interface{}{"repair-drain": name}}, "template": template}}}
	created, err := c.Dynamic.Resource(deployments).Namespace(ns).Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	repairDeleteObject(t, c, ns, name, deployments, created)
	var podUID, podName string
	for deadline := time.Now().Add(50 * time.Second); time.Now().Before(deadline); {
		pods, e := c.Typed.CoreV1().Pods(ns).List(ctx, metav1.ListOptions{LabelSelector: "repair-drain=" + name})
		if e != nil {
			t.Fatal(e)
		}
		for _, pod := range pods.Items {
			if pod.Spec.NodeName == nodeName && len(pod.Status.ContainerStatuses) > 0 && pod.Status.ContainerStatuses[0].Ready {
				podUID, podName = string(pod.UID), pod.Name
			}
		}
		if podUID != "" {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if podUID == "" {
		t.Fatal("own worker-targeted Pod did not become Ready")
	}
	// Before cordon/eviction, ensure the worker has no non-owned evictable Pod.
	all, e := c.Typed.CoreV1().Pods("").List(ctx, metav1.ListOptions{FieldSelector: "spec.nodeName=" + nodeName})
	if e != nil {
		t.Fatal(e)
	}
	for _, pod := range all.Items {
		safe := pod.Annotations["kubernetes.io/config.mirror"] != "" || (pod.Namespace == ns && pod.Labels["repair-drain"] == name)
		for _, ref := range pod.OwnerReferences {
			safe = safe || ref.Kind == "DaemonSet"
		}
		if !safe {
			t.Fatalf("worker contains unreserved evictable Pod %s/%s; drain not attempted", pod.Namespace, pod.Name)
		}
	}
	pdb := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "policy/v1", "kind": "PodDisruptionBudget", "metadata": map[string]interface{}{"name": name, "namespace": ns, "labels": map[string]interface{}{"kubeview.io/repair-owner": "backend-manager"}}, "spec": map[string]interface{}{"minAvailable": int64(1), "selector": map[string]interface{}{"matchLabels": map[string]interface{}{"repair-drain": name}}}}}
	createdPDB, err := c.Dynamic.Resource(pdbs).Namespace(ns).Create(ctx, pdb, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	repairDeleteObject(t, c, ns, name, pdbs, createdPDB)
	waitBudget := func(allowed bool) {
		t.Helper()
		for deadline := time.Now().Add(30 * time.Second); time.Now().Before(deadline); {
			actual, e := c.Typed.PolicyV1().PodDisruptionBudgets(ns).Get(ctx, name, metav1.GetOptions{})
			if e != nil {
				t.Fatal(e)
			}
			if actual.Status.ObservedGeneration >= actual.Generation && actual.Status.CurrentHealthy == 1 && ((actual.Status.DisruptionsAllowed > 0) == allowed) {
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Fatal("actual PDB controller budget did not converge")
	}
	waitBudget(false)
	if code, _ := repairAction(t, ctx, c, gateway, contextName, "", nodes, nodeName, "cordon", nil); code != 202 {
		t.Fatalf("cordon HTTP%d", code)
	}
	code, raw := repairAction(t, ctx, c, gateway, contextName, "", nodes, nodeName, "drain-preview", nil)
	if code != 200 {
		t.Fatalf("drain-preview HTTP%d", code)
	}
	if !strings.Contains(string(raw), `"pdbBlocked":true`) {
		t.Fatal("preview did not show actual blocked PDB")
	}
	code, raw = repairAction(t, ctx, c, gateway, contextName, "", nodes, nodeName, "drain", nil)
	if code != 202 {
		t.Fatalf("blocked drain HTTP%d", code)
	}
	var result struct {
		Partial bool                                                   `json:"partialFailure"`
		Results []struct{ Name, Namespace, UID, Status, Error string } `json:"results"`
	}
	if json.Unmarshal(raw, &result) != nil || !result.Partial {
		t.Fatal("eviction PDB rejection did not expose partial failure")
	}
	blocked := false
	for _, entry := range result.Results {
		if entry.UID == podUID && entry.Name == podName && entry.Status == "failed" && strings.Contains(strings.ToLower(entry.Error), "disruption budget") {
			blocked = true
		}
	}
	if !blocked {
		t.Fatal("real API eviction did not report owned Pod PDB rejection")
	}
	still, e := c.Typed.CoreV1().Pods(ns).Get(ctx, podName, metav1.GetOptions{})
	if e != nil || string(still.UID) != podUID || still.DeletionTimestamp != nil {
		t.Fatal("blocked eviction removed or terminated actual Pod")
	}
	actualPDB, e := c.Dynamic.Resource(pdbs).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
	if e != nil {
		t.Fatal(e)
	}
	_ = unstructured.SetNestedField(actualPDB.Object, int64(0), "spec", "minAvailable")
	if _, e = c.Dynamic.Resource(pdbs).Namespace(ns).Update(ctx, actualPDB, metav1.UpdateOptions{}); e != nil {
		t.Fatal(e)
	}
	waitBudget(true)
	code, raw = repairAction(t, ctx, c, gateway, contextName, "", nodes, nodeName, "drain", nil)
	if code != 202 {
		t.Fatalf("allowed drain HTTP%d", code)
	}
	if json.Unmarshal(raw, &result) != nil || result.Partial {
		t.Fatal("allowed eviction unexpectedly failed")
	}
	accepted := false
	for _, entry := range result.Results {
		accepted = accepted || (entry.UID == podUID && entry.Status == "accepted")
	}
	if !accepted {
		t.Fatal("own Pod eviction acceptance missing")
	}
	for deadline := time.Now().Add(20 * time.Second); time.Now().Before(deadline); {
		pod, e := c.Typed.CoreV1().Pods(ns).Get(ctx, podName, metav1.GetOptions{})
		if e != nil || string(pod.UID) != podUID {
			t.Logf("REAL reserved-worker cordon→drain-preview PDB blocked→API eviction rejected without Pod deletion→minAvailable0→eviction accepted and old UID absent; context=%s Node=%s NodeUID=%s PodUID=%s; Node original scheduling restored in cleanup; DaemonSets preserved", contextName, nodeName, expectedNodeUID, podUID)
			return
		}
		time.Sleep(100 * time.Millisecond)
	}
	t.Fatal("accepted eviction old Pod remained after grace period")
}
