package server

import (
	"encoding/json"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// Membership signatures exclude status churn. A relevant label/owner/template/
// service-selector change can alter children without changing their own RV.
func workspaceMembershipChanged(old, current *unstructured.Unstructured) bool {
	signature := func(u *unstructured.Unstructured) string {
		if u == nil {
			return ""
		}
		template, _, _ := unstructured.NestedStringMap(u.Object, "spec", "template", "metadata", "labels")
		jobTemplate, _, _ := unstructured.NestedStringMap(u.Object, "spec", "jobTemplate", "spec", "template", "metadata", "labels")
		selector, _, _ := unstructured.NestedFieldCopy(u.Object, "spec", "selector")
		b, _ := json.Marshal([]interface{}{u.GetLabels(), u.GetOwnerReferences(), template, jobTemplate, selector})
		return string(b)
	}
	return signature(old) != signature(current)
}
func scopedResourceMessage(action string, u *unstructured.Unstructured, scope ResourceScope) envelope {
	scope.Authoritative = true
	scope.Status = "synced"
	scope.Error = ""
	object := sanitize(u)
	if action == "OUT_OF_SCOPE" {
		object = &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": u.GetAPIVersion(), "kind": u.GetKind(), "metadata": map[string]interface{}{"uid": string(u.GetUID()), "name": u.GetName(), "namespace": u.GetNamespace(), "resourceVersion": u.GetResourceVersion()}}}
	}
	return envelope{Type: "RESOURCE_EVENT", Action: action, Object: object, Scope: &scope, Synced: true, Reachable: true}
}
