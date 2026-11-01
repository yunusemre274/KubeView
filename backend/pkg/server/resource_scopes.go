package server

import (
	"fmt"
	"net/http"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/cache"
)

// ResourceScope declares the exact authority of a list/watch, not the whole
// cluster. An unavailable/forbidden scope never proves resource deletion.
// Namespace "*" means all namespaces; "" means a cluster-scoped resource.
type ResourceScope struct {
	Group         string `json:"group"`
	Version       string `json:"version"`
	Resource      string `json:"resource"`
	Kind          string `json:"kind"`
	Namespace     string `json:"namespace"`
	Authoritative bool   `json:"authoritative"`
	Status        string `json:"status"`
	Error         string `json:"error,omitempty"`
}

func (s ResourceScope) key() string {
	return s.Group + "/" + s.Version + "|" + s.Resource + "|" + s.Namespace
}
func (s ResourceScope) gvr() schema.GroupVersionResource {
	return schema.GroupVersionResource{Group: s.Group, Version: s.Version, Resource: s.Resource}
}
func scopeFor(resource Resource, namespace string) ResourceScope {
	if !resource.Namespaced {
		namespace = ""
	} else if namespace == "" {
		namespace = "*"
	}
	return ResourceScope{Group: resource.Group, Version: resource.Version, Resource: resource.Resource, Kind: resource.Kind, Namespace: namespace, Status: "syncing"}
}
func scopeError(scope *ResourceScope, err error) {
	scope.Authoritative = false
	scope.Status = "unavailable"
	if apierrors.IsForbidden(err) || apierrors.IsUnauthorized(err) {
		scope.Status = "forbidden"
	}
	scope.Error = err.Error()
}

// Subscriptions are declarative GVR/namespace identifiers, never arbitrary URLs.
// They share the one browser WS and remain bounded for each gateway connection.
func requestedScopes(r *http.Request) ([]ResourceScope, error) {
	raw := r.URL.Query()["subscribe"]
	if len(raw) > 32 {
		return nil, fmt.Errorf("En fazla 32 ek kaynak aboneliği kullanılabilir")
	}
	result := make([]ResourceScope, 0, len(raw))
	seen := map[string]bool{}
	for _, entry := range raw {
		parts := strings.Split(entry, "|")
		if len(parts) != 3 {
			return nil, fmt.Errorf("Abonelik apiVersion|resource|namespace biçiminde olmalı")
		}
		gv, err := schema.ParseGroupVersion(parts[0])
		if err != nil || gv.Version == "" || parts[1] == "" || strings.ContainsAny(parts[1], "/\\ .") || strings.ContainsAny(parts[2], "/\\ ") {
			return nil, fmt.Errorf("Geçersiz kaynak aboneliği")
		}
		scope := ResourceScope{Group: gv.Group, Version: gv.Version, Resource: parts[1], Namespace: parts[2], Status: "syncing"}
		if !seen[scope.key()] {
			result = append(result, scope)
			seen[scope.key()] = true
		}
	}
	return result, nil
}

type scopeBinding struct {
	scope      ResourceScope
	namespaced bool
	informer   cache.SharedIndexInformer
}

// One version per group/resource prevents alternate API representations of the
// same Kubernetes UID from racing in the canonical client store. Explicit
// catalog selection wins over the default watch version.
func watchScopeBindings(resources []Resource, namespace, restrictedNamespace string, requested []ResourceScope) []scopeBinding {
	byGVR := map[schema.GroupVersionResource]Resource{}
	preferred := map[string]string{}
	for _, r := range resources {
		byGVR[schema.GroupVersionResource{Group: r.Group, Version: r.Version, Resource: r.Resource}] = r
	}
	for _, scope := range requested {
		preferred[scope.Group+"/"+scope.Resource] = scope.Version
	}
	bindings := []scopeBinding{}
	seenKind := map[string]bool{}
	seenScope := map[string]bool{}
	appendScope := func(resource Resource, scope ResourceScope) {
		if seenScope[scope.key()] {
			return
		}
		seenScope[scope.key()] = true
		bindings = append(bindings, scopeBinding{scope: scope, namespaced: resource.Namespaced})
	}
	for _, resource := range resources {
		if !watchKinds[resource.Kind] || seenKind[resource.Kind] || !hasVerb(resource, "list") || !hasVerb(resource, "watch") {
			continue
		}
		if restrictedNamespace != "" && !resource.Namespaced && resource.Kind != "Node" {
			continue
		}
		if version := preferred[resource.Group+"/"+resource.Resource]; version != "" && version != resource.Version {
			continue
		}
		seenKind[resource.Kind] = true
		appendScope(resource, scopeFor(resource, namespace))
	}
	for _, requestedScope := range requested {
		if version := preferred[requestedScope.Group+"/"+requestedScope.Resource]; version != requestedScope.Version {
			continue
		}
		resource, exists := byGVR[requestedScope.gvr()]
		if !exists {
			requestedScope.Status = "unavailable"
			requestedScope.Error = "İstenen API kaynağı discovery içinde bulunamadı"
			appendScope(Resource{}, requestedScope)
			continue
		}
		ns := requestedScope.Namespace
		if ns == "*" {
			ns = ""
		}
		scope := scopeFor(resource, ns)
		if !hasVerb(resource, "list") || !hasVerb(resource, "watch") {
			scope.Status = "unavailable"
			scope.Error = "API kaynağı list/watch aboneliğini desteklemiyor"
		}
		if restrictedNamespace != "" && resource.Namespaced && scope.Namespace != restrictedNamespace {
			scope.Status = "forbidden"
			scope.Error = "Abonelik sunucunun namespace kapsamı dışında"
		}
		appendScope(resource, scope)
	}
	return bindings
}
