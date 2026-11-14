package server

import (
	"context"
	"encoding/json"
	"testing"

	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// Return explicit upstream JSON list metadata, without a fake client filling in
// missing kinds. Production must preserve the real response, not guess a kind.
type workspaceNamespaceLists struct {
	dynamic.Interface
	lists map[string]*unstructured.UnstructuredList
}

func (c *workspaceNamespaceLists) Resource(gvr schema.GroupVersionResource) dynamic.NamespaceableResourceInterface {
	if gvr != schemaGVR("", "v1", "pods") {
		return c.Interface.Resource(gvr)
	}
	return &workspaceNamespaceListResource{NamespaceableResourceInterface: c.Interface.Resource(gvr), lists: c.lists}
}

type workspaceNamespaceListResource struct {
	dynamic.NamespaceableResourceInterface
	lists     map[string]*unstructured.UnstructuredList
	namespace string
}

func (r *workspaceNamespaceListResource) Namespace(namespace string) dynamic.ResourceInterface {
	copy := *r
	copy.namespace = namespace
	return &copy
}

func (r *workspaceNamespaceListResource) List(context.Context, metav1.ListOptions) (*unstructured.UnstructuredList, error) {
	return r.lists[r.namespace].DeepCopy(), nil
}

func TestWorkspaceMultiNamespaceListJSONContract(t *testing.T) {
	for _, empty := range []bool{false, true} {
		name := "populated"
		if empty {
			name = "empty"
		}
		t.Run(name, func(t *testing.T) {
			s, c := testServer(t, true)
			lists := map[string]*unstructured.UnstructuredList{}
			for _, namespace := range []string{"qa", "other"} {
				list := &unstructured.UnstructuredList{Object: map[string]interface{}{"apiVersion": "v1", "kind": "PodList", "metadata": map[string]interface{}{"resourceVersion": "opaque-" + namespace}}}
				if !empty {
					for _, app := range []string{"project", "excluded"} {
						list.Items = append(list.Items, unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": app, "namespace": namespace, "uid": namespace + "-" + app, "labels": map[string]interface{}{"app": app}}}})
					}
				}
				lists[namespace] = list
			}
			upstream := &workspaceNamespaceLists{Interface: c.Dynamic, lists: lists}
			c.Dynamic = upstream
			scope := &workspaceScope{harbor: ws.Harbor{Namespaces: []string{"qa", "other"}}, selector: labels.SelectorFromSet(labels.Set{"app": "project"})}
			adapter := &workspaceDynamic{Interface: upstream, s: s, c: c, scope: scope}
			union, err := adapter.Resource(schemaGVR("", "v1", "pods")).List(context.Background(), metav1.ListOptions{})
			if err != nil {
				t.Fatal(err)
			}
			body, err := json.Marshal(union)
			if err != nil {
				t.Fatal(err)
			}
			var decoded unstructured.UnstructuredList
			if err := json.Unmarshal(body, &decoded); err != nil {
				t.Fatalf("multi-namespace union must decode as a Kubernetes list: %v", err)
			}
			if decoded.GetAPIVersion() != "v1" || decoded.GetKind() != "PodList" {
				t.Fatalf("upstream list type metadata lost: %s/%s", decoded.GetAPIVersion(), decoded.GetKind())
			}
			if decoded.GetResourceVersion() != "" || decoded.GetContinue() != "" || decoded.GetRemainingItemCount() != nil {
				t.Fatal("namespace-specific resource versions or pagination leaked into the union")
			}
			want := 2
			if empty {
				want = 0
			}
			if len(decoded.Items) != want {
				t.Fatalf("filtered namespace union count %d, want %d", len(decoded.Items), want)
			}
			for _, item := range decoded.Items {
				if item.GetLabels()["app"] != "project" || item.GetUID() == "" {
					t.Fatal("union leaked an excluded object or lost its identity")
				}
			}
		})
	}
}

func TestWorkspaceMultiNamespaceListRejectsInvalidUpstreamTypes(t *testing.T) {
	for _, entry := range []struct {
		name, apiVersion, kind string
	}{
		{"missing_kind", "v1", ""},
		{"missing_api_version", "", "PodList"},
		{"inconsistent_kind", "v1", "SecretList"},
		{"inconsistent_api_version", "other/v2", "PodList"},
	} {
		t.Run(entry.name, func(t *testing.T) {
			s, c := testServer(t, true)
			upstream := &workspaceNamespaceLists{Interface: c.Dynamic, lists: map[string]*unstructured.UnstructuredList{
				"qa":    {Object: map[string]interface{}{"apiVersion": "v1", "kind": "PodList"}},
				"other": {Object: map[string]interface{}{"apiVersion": entry.apiVersion, "kind": entry.kind}},
			}}
			c.Dynamic = upstream
			scope := &workspaceScope{harbor: ws.Harbor{Namespaces: []string{"qa", "other"}}, selector: labels.Everything()}
			adapter := &workspaceDynamic{Interface: upstream, s: s, c: c, scope: scope}
			union, err := adapter.Resource(schemaGVR("", "v1", "pods")).List(context.Background(), metav1.ListOptions{})
			if !apierrors.IsInternalError(err) || union != nil {
				t.Fatal("invalid upstream metadata must fail without guessing or exposing a partial union")
			}
		})
	}
}
