package server

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	dynamicfake "k8s.io/client-go/dynamic/fake"
)

func targetedPod(name string, terms []interface{}) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": name, "namespace": "qa"}, "spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "busybox:1.36"}}, "affinity": map[string]interface{}{"nodeAffinity": map[string]interface{}{"requiredDuringSchedulingIgnoredDuringExecution": map[string]interface{}{"nodeSelectorTerms": terms}}}}}}
}
func targetTerm(node, zone string) map[string]interface{} {
	term := map[string]interface{}{"matchFields": []interface{}{map[string]interface{}{"key": "metadata.name", "operator": "In", "values": []interface{}{node}}}}
	if zone != "" {
		term["matchExpressions"] = []interface{}{map[string]interface{}{"key": "zone", "operator": "In", "values": []interface{}{zone}}}
	}
	return term
}
func TestTargetNodeRequiredPreservesORAndIdentity(t *testing.T) {
	s, c := testServer(t, false)
	node := &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "new-node-uid", Labels: map[string]string{"zone": "east", "kubernetes.io/hostname": "different-from-metadata-name"}}}
	if _, err := c.Typed.CoreV1().Nodes().Create(context.Background(), node, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	target := &TargetNode{Name: node.Name, UID: string(node.UID), Mode: "required"}
	object := targetedPod("targeted", []interface{}{targetTerm(node.Name, "east"), targetTerm(node.Name, "west")})
	before, _ := json.Marshal(object)
	if err := s.validateTargetNode(context.Background(), c, object, target); err != nil {
		t.Fatal(err)
	}
	after, _ := json.Marshal(object)
	if string(before) != string(after) {
		t.Fatal("placement validation changed existing manifest")
	}
	for name, edit := range map[string]func(*unstructured.Unstructured){"unguarded OR alternative": func(obj *unstructured.Unstructured) {
		unstructured.SetNestedSlice(obj.Object, []interface{}{targetTerm(node.Name, "east"), map[string]interface{}{"matchExpressions": []interface{}{map[string]interface{}{"key": "zone", "operator": "In", "values": []interface{}{"east"}}}}}, "spec", "affinity", "nodeAffinity", "requiredDuringSchedulingIgnoredDuringExecution", "nodeSelectorTerms")
	}, "empty alternatives": func(obj *unstructured.Unstructured) {
		unstructured.SetNestedSlice(obj.Object, []interface{}{}, "spec", "affinity", "nodeAffinity", "requiredDuringSchedulingIgnoredDuringExecution", "nodeSelectorTerms")
	}, "conflicting preserved requirements": func(obj *unstructured.Unstructured) {
		unstructured.SetNestedSlice(obj.Object, []interface{}{targetTerm(node.Name, "west")}, "spec", "affinity", "nodeAffinity", "requiredDuringSchedulingIgnoredDuringExecution", "nodeSelectorTerms")
	}, "scheduler bypass": func(obj *unstructured.Unstructured) {
		unstructured.SetNestedField(obj.Object, node.Name, "spec", "nodeName")
	}, "conflicting nodeSelector": func(obj *unstructured.Unstructured) {
		unstructured.SetNestedStringMap(obj.Object, map[string]string{"zone": "west"}, "spec", "nodeSelector")
	}} {
		t.Run(name, func(t *testing.T) {
			copy := object.DeepCopy()
			edit(copy)
			if err := s.validateTargetNode(context.Background(), c, copy, target); err == nil {
				t.Fatal("invalid target intent accepted")
			}
		})
	}
	stale := *target
	stale.UID = "previous-node-uid"
	if err := s.validateTargetNode(context.Background(), c, object, &stale); !apierrors.IsConflict(err) {
		t.Fatalf("same-name recreated Node not rejected: %v", err)
	}
}
func TestTargetNodePreferredAndRawYAML(t *testing.T) {
	s, c := testServer(t, false)
	node := &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "node-uid", Labels: map[string]string{"zone": "east"}}}
	c.Typed.CoreV1().Nodes().Create(context.Background(), node, metav1.CreateOptions{})
	object := targetedPod("preferred", []interface{}{targetTerm("other-worker", "west")})
	unstructured.SetNestedSlice(object.Object, []interface{}{map[string]interface{}{"weight": int64(100), "preference": targetTerm(node.Name, "")}}, "spec", "affinity", "nodeAffinity", "preferredDuringSchedulingIgnoredDuringExecution")
	if err := s.validateTargetNode(context.Background(), c, object, &TargetNode{Name: node.Name, UID: string(node.UID), Mode: "preferred"}); err != nil {
		t.Fatalf("preference must preserve hard constraints even when ignored: %v", err)
	}
	unstructured.SetNestedField(object.Object, "manual-node", "spec", "nodeName")
	if err := s.validateTargetNode(context.Background(), c, object, nil); err != nil {
		t.Fatalf("raw YAML without intent was changed: %v", err)
	}
	if err := s.validateTargetNode(context.Background(), c, object, &TargetNode{Mode: "scheduler"}); err == nil {
		t.Fatal("target intent accepted scheduler bypass")
	}
}
func TestCreateTargetUIDMismatchDoesNotReachMutation(t *testing.T) {
	s, c := testServer(t, false)
	c.Typed.CoreV1().Nodes().Create(context.Background(), &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: "worker-a", UID: "new-uid"}}, metav1.CreateOptions{})
	object := targetedPod("should-not-exist", []interface{}{targetTerm("worker-a", "")})
	result := request(s, "POST", "/api/resources?context=test&resource=pods&namespace=qa", map[string]interface{}{"object": object, "targetNode": map[string]interface{}{"name": "worker-a", "uid": "old-uid", "mode": "required"}, "dryRun": true})
	if result.Code != 409 || !strings.Contains(result.Body.String(), "UID") {
		t.Fatalf("stale Node intent accepted: %d %s", result.Code, result.Body)
	}
	for _, action := range c.Dynamic.(*dynamicfake.FakeDynamicClient).Actions() {
		if action.GetVerb() == "create" {
			t.Fatal("mutation reached before target Node identity validation")
		}
	}
}
