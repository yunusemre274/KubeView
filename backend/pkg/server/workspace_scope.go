package server

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"sync"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic"
)

func schemaGVR(group, version, resource string) schema.GroupVersionResource {
	return schema.GroupVersionResource{Group: group, Version: version, Resource: resource}
}
func baseWorkspaceClient(c *Clients) *Clients {
	if wrapped, ok := c.Dynamic.(*workspaceDynamic); ok {
		return wrapped.c
	}
	return c
}

type workspaceCacheOnlyKey struct{}

func scopeForbidden(gvr schema.GroupVersionResource, name string) error {
	return apierrors.NewForbidden(gvr.GroupResource(), name, workspaceError("kaynak namespace/selector sınırı dışında"))
}
func namespacedResource(c *Clients, gvr schema.GroupVersionResource) (bool, error) {
	list, err := c.Discovery.ServerResourcesForGroupVersion(gvr.GroupVersion().String())
	if err != nil {
		return false, err
	}
	for _, r := range list.APIResources {
		if r.Name == gvr.Resource {
			return r.Namespaced, nil
		}
	}
	return false, apierrors.NewNotFound(gvr.GroupResource(), "")
}
func selectorObject(scope *workspaceScope, obj *unstructured.Unstructured) bool {
	if obj.GetNamespace() == "" {
		if obj.GetKind() == "Node" {
			return true
		}
		if obj.GetKind() == "Namespace" {
			return scope.allowsNamespace(obj.GetName())
		}
		if obj.GetKind() == "PersistentVolume" {
			claim, _, _ := unstructured.NestedString(obj.Object, "spec", "claimRef", "namespace")
			if claim != "" && !scope.allowsNamespace(claim) {
				return false
			}
		}
		if obj.GetKind() == "ClusterRoleBinding" {
			subjects, _, _ := unstructured.NestedSlice(obj.Object, "subjects")
			for _, entry := range subjects {
				if subject, ok := entry.(map[string]interface{}); ok {
					namespace, _ := subject["namespace"].(string)
					if namespace != "" && !scope.allowsNamespace(namespace) {
						return false
					}
				}
			}
		}
		// Cluster catalog data is shared infrastructure, not namespace ownership.
		// Real Kubernetes RBAC remains required for every read/watch.
		if scope.selector.Empty() {
			return true
		}
		switch obj.GetKind() {
		case "StorageClass", "CustomResourceDefinition", "ClusterRole":
			return true
		}
		return scope.selector.Matches(labels.Set(obj.GetLabels()))
	}
	if !scope.allowsNamespace(obj.GetNamespace()) {
		return false
	}
	if scope.selector.Empty() || scope.selector.Matches(labels.Set(obj.GetLabels())) {
		return true
	}
	for _, field := range [][]string{{"spec", "template", "metadata", "labels"}, {"spec", "jobTemplate", "spec", "template", "metadata", "labels"}} {
		if values, ok, _ := unstructured.NestedStringMap(obj.Object, field...); ok && scope.selector.Matches(labels.Set(values)) {
			return true
		}
	}
	return false
}

// Relationship expansion always uses this credential and namespace. Owner UID
// must match: a reused owner name never brings a replacement into this harbor.
func (s *Server) scopeContains(ctx context.Context, c *Clients, scope *workspaceScope, obj *unstructured.Unstructured, depth int) bool {
	if selectorObject(scope, obj) {
		return true
	}
	if depth >= 6 || obj.GetNamespace() == "" || !scope.allowsNamespace(obj.GetNamespace()) {
		return false
	}
	for _, owner := range obj.GetOwnerReferences() {
		if cached, known := s.watches.owner(c.ID+":"+scope.connection.ID, owner.APIVersion, owner.Kind, obj.GetNamespace(), owner.Name); known {
			if cached != nil && cached.GetUID() == owner.UID && s.scopeContains(ctx, c, scope, cached, depth+1) {
				return true
			}
			continue
		}
		gv, err := schema.ParseGroupVersion(owner.APIVersion)
		if err != nil {
			continue
		}
		if cachedOnly, _ := ctx.Value(workspaceCacheOnlyKey{}).(bool); cachedOnly {
			continue
		}
		list, err := c.Discovery.ServerResourcesForGroupVersion(gv.String())
		if err != nil {
			continue
		}
		for _, resource := range list.APIResources {
			if resource.Kind != owner.Kind || strings.Contains(resource.Name, "/") || !resource.Namespaced {
				continue
			}
			parent, err := c.Dynamic.Resource(gv.WithResource(resource.Name)).Namespace(obj.GetNamespace()).Get(ctx, owner.Name, metav1.GetOptions{})
			if err == nil && parent.GetUID() == owner.UID && s.scopeContains(ctx, c, scope, parent, depth+1) {
				return true
			}
			break
		}
	}
	// Service/EndpointSlice topology is configured dependency, not measured flow.
	if obj.GetKind() == "EndpointSlice" {
		if name := obj.GetLabels()["kubernetes.io/service-name"]; name != "" {
			if service, known := s.watches.owner(c.ID+":"+scope.connection.ID, "v1", "Service", obj.GetNamespace(), name); known {
				return service != nil && s.scopeContains(ctx, c, scope, service, depth+1)
			}
			if cachedOnly, _ := ctx.Value(workspaceCacheOnlyKey{}).(bool); cachedOnly {
				return false
			}
			service, err := c.Dynamic.Resource(schemaGVR("", "v1", "services")).Namespace(obj.GetNamespace()).Get(ctx, name, metav1.GetOptions{})
			if err == nil {
				return s.scopeContains(ctx, c, scope, service, depth+1)
			}
		}
	}
	if obj.GetKind() == "Service" {
		selector, ok, _ := unstructured.NestedStringMap(obj.Object, "spec", "selector")
		if ok && len(selector) > 0 {
			if cachedOnly, _ := ctx.Value(workspaceCacheOnlyKey{}).(bool); cachedOnly {
				pods, known := s.watches.objects(c.ID+":"+scope.connection.ID, "Pod", obj.GetNamespace())
				if !known {
					return false
				}
				serviceSelector := labels.SelectorFromSet(selector)
				for _, pod := range pods {
					if serviceSelector.Matches(labels.Set(pod.GetLabels())) && s.scopeContains(ctx, c, scope, pod, depth+1) {
						return true
					}
				}
				return false
			}
			combined := scope.harbor.Selector
			if combined != "" {
				combined += ","
			}
			combined += labels.SelectorFromSet(selector).String()
			pods, err := c.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace(obj.GetNamespace()).List(ctx, metav1.ListOptions{LabelSelector: combined, Limit: 1})
			if err == nil {
				for i := range pods.Items {
					if labels.SelectorFromSet(selector).Matches(labels.Set(pods.Items[i].GetLabels())) {
						return true
					}
				}
			}
		}
	}
	return false
}
func (s *Server) authorizeWorkspace(ctx context.Context, c *Clients, verb, group, res, sub, ns, name string) error {
	scope := workspaceScopeFrom(ctx)
	if scope == nil {
		return nil
	}
	if ns != "" && !scope.allowsNamespace(ns) {
		return scopeForbidden(schemaGVR(group, "v1", res), name)
	}
	if ns == "" && verb != "get" && verb != "list" && verb != "watch" {
		probe, _ := ctx.Value(capabilityProbeKey{}).(bool)
		if acknowledged, _ := ctx.Value(clusterImpactKey{}).(bool); !acknowledged && !probe {
			return apierrors.NewForbidden(schema.GroupResource{Resource: res}, name, errors.New("Paylaşılan küme etkisi açıkça onaylanmalı (X-KubeView-Cluster-Impact: acknowledged)"))
		}
	}
	if name != "" && ns != "" && !scope.selector.Empty() {
		resources, _ := discover(c)
		for _, resource := range resources {
			if resource.Group == group && resource.Resource == res {
				base := c
				if wrapped, ok := c.Dynamic.(*workspaceDynamic); ok {
					base = wrapped.c
				}
				obj, err := base.Dynamic.Resource(schemaGVR(group, resource.Version, res)).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
				if err != nil {
					return err
				}
				if !s.scopeContains(ctx, base, scope, obj, 0) {
					return scopeForbidden(schemaGVR(group, resource.Version, res), name)
				}
				break
			}
		}
	}
	return nil
}

type clusterImpactKey struct{}
type capabilityProbeKey struct{}

// The dynamic adapter is the final boundary for generic/action targets, including
// body-derived namespaces. It never widens a label-filtered list to the browser.
type workspaceDynamic struct {
	dynamic.Interface
	s     *Server
	c     *Clients
	scope *workspaceScope
}

func (d *workspaceDynamic) Resource(gvr schema.GroupVersionResource) dynamic.NamespaceableResourceInterface {
	n, err := namespacedResource(d.c, gvr)
	return &workspaceResource{NamespaceableResourceInterface: d.Interface.Resource(gvr), d: d, gvr: gvr, namespaced: n, scopeErr: err}
}

type workspaceResource struct {
	dynamic.NamespaceableResourceInterface
	d          *workspaceDynamic
	gvr        schema.GroupVersionResource
	ns         string
	namespaced bool
	scopeErr   error
}

func (r *workspaceResource) Namespace(ns string) dynamic.ResourceInterface {
	out := *r
	out.ns = ns
	return &out
}
func (r *workspaceResource) base() dynamic.ResourceInterface {
	if r.namespaced && r.ns != "" {
		return r.d.Interface.Resource(r.gvr).Namespace(r.ns)
	}
	return r.d.Interface.Resource(r.gvr)
}
func (r *workspaceResource) check() error {
	if r.scopeErr != nil {
		return r.scopeErr
	}
	if r.namespaced && r.ns != "" && !r.d.scope.allowsNamespace(r.ns) {
		return scopeForbidden(r.gvr, "")
	}
	return nil
}
func (r *workspaceResource) allowed(ctx context.Context, obj *unstructured.Unstructured) bool {
	return r.d.s.scopeContains(ctx, r.d.c, r.d.scope, obj, 0)
}
func (r *workspaceResource) Get(ctx context.Context, name string, opts metav1.GetOptions, sub ...string) (*unstructured.Unstructured, error) {
	if err := r.check(); err != nil {
		return nil, err
	}
	obj, err := r.base().Get(ctx, name, opts)
	if err != nil {
		return nil, err
	}
	if !r.allowed(ctx, obj) {
		return nil, scopeForbidden(r.gvr, name)
	}
	if len(sub) > 0 {
		return r.base().Get(ctx, name, opts, sub...)
	}
	return obj, nil
}
func (r *workspaceResource) List(ctx context.Context, opts metav1.ListOptions) (*unstructured.UnstructuredList, error) {
	opts.Limit = 0
	opts.Continue = ""
	if err := r.check(); err != nil {
		return nil, err
	}
	if r.namespaced && r.ns == "" && r.d.scope.harbor.Namespaces[0] != "*" {
		out := &unstructured.UnstructuredList{}
		for _, ns := range r.d.scope.harbor.Namespaces {
			copy := *r
			copy.ns = ns
			list, err := copy.List(ctx, opts)
			if err != nil {
				return nil, err
			}
			apiVersion, kind := list.GetAPIVersion(), list.GetKind()
			if apiVersion == "" || kind == "" || out.GetKind() != "" && (out.GetAPIVersion() != apiVersion || out.GetKind() != kind) {
				return nil, apierrors.NewInternalError(errors.New("namespace list type metadata missing or inconsistent"))
			}
			// Preserve the upstream list type, including an empty union. Each
			// namespace has its own opaque RV, so only type metadata is shared.
			out.SetAPIVersion(apiVersion)
			out.SetKind(kind)
			out.Items = append(out.Items, list.Items...)
		}
		return out, nil
	}
	list, err := r.base().List(ctx, opts)
	if err != nil {
		return nil, err
	}
	items := list.Items[:0]
	for i := range list.Items {
		if r.allowed(ctx, &list.Items[i]) {
			items = append(items, list.Items[i])
		}
	}
	list.Items = items
	list.SetContinue("")
	list.SetRemainingItemCount(nil)
	return list, nil
}
func (r *workspaceResource) writeCheck(ctx context.Context, obj *unstructured.Unstructured) error {
	if err := r.check(); err != nil {
		return err
	}
	if r.namespaced && (r.ns == "" || obj.GetNamespace() != r.ns) {
		return scopeForbidden(r.gvr, obj.GetName())
	}
	if !r.allowed(ctx, obj) {
		return scopeForbidden(r.gvr, obj.GetName())
	}
	return nil
}
func (r *workspaceResource) Create(ctx context.Context, obj *unstructured.Unstructured, opts metav1.CreateOptions, sub ...string) (*unstructured.Unstructured, error) {
	if err := r.writeCheck(ctx, obj); err != nil {
		return nil, err
	}
	return r.base().Create(ctx, obj, opts, sub...)
}
func (r *workspaceResource) Update(ctx context.Context, obj *unstructured.Unstructured, opts metav1.UpdateOptions, sub ...string) (*unstructured.Unstructured, error) {
	current, err := r.Get(ctx, obj.GetName(), metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	if len(sub) > 0 {
		if obj.GetUID() != current.GetUID() || obj.GetNamespace() != current.GetNamespace() {
			return nil, scopeForbidden(r.gvr, obj.GetName())
		}
		return r.base().Update(ctx, obj, opts, sub...)
	}
	if err := r.writeCheck(ctx, obj); err != nil {
		return nil, err
	}
	return r.base().Update(ctx, obj, opts, sub...)
}
func (r *workspaceResource) UpdateStatus(ctx context.Context, obj *unstructured.Unstructured, opts metav1.UpdateOptions) (*unstructured.Unstructured, error) {
	return r.Update(ctx, obj, opts, "status")
}
func (r *workspaceResource) Delete(ctx context.Context, name string, opts metav1.DeleteOptions, sub ...string) error {
	if _, err := r.Get(ctx, name, metav1.GetOptions{}); err != nil {
		return err
	}
	return r.base().Delete(ctx, name, opts, sub...)
}
func (r *workspaceResource) DeleteCollection(context.Context, metav1.DeleteOptions, metav1.ListOptions) error {
	return scopeForbidden(r.gvr, "")
}
func (r *workspaceResource) Patch(ctx context.Context, name string, pt types.PatchType, data []byte, opts metav1.PatchOptions, sub ...string) (*unstructured.Unstructured, error) {
	if _, err := r.Get(ctx, name, metav1.GetOptions{}); err != nil {
		return nil, err
	}
	// Action patches are subresources/known resources; label-changing patches
	// need the generic PUT path so both before/after membership can be checked.
	var body map[string]interface{}
	if json.Unmarshal(data, &body) == nil {
		if metadata, ok := body["metadata"].(map[string]interface{}); ok {
			if _, ok = metadata["labels"]; ok {
				return nil, apierrors.NewBadRequest("Label değişimi kapsam denetimli PUT ile yapılmalı")
			}
		}
	}
	return r.base().Patch(ctx, name, pt, data, opts, sub...)
}
func (r *workspaceResource) Apply(context.Context, string, *unstructured.Unstructured, metav1.ApplyOptions, ...string) (*unstructured.Unstructured, error) {
	return nil, scopeForbidden(r.gvr, "")
}
func (r *workspaceResource) ApplyStatus(context.Context, string, *unstructured.Unstructured, metav1.ApplyOptions) (*unstructured.Unstructured, error) {
	return nil, scopeForbidden(r.gvr, "")
}
func (r *workspaceResource) Watch(ctx context.Context, opts metav1.ListOptions) (watch.Interface, error) {
	if err := r.check(); err != nil {
		return nil, err
	}
	if r.namespaced && r.ns == "" && r.d.scope.harbor.Namespaces[0] != "*" {
		return nil, apierrors.NewBadRequest("Birden fazla namespace watch'u broker üzerinden ayrı izlenmeli")
	}
	w, err := r.base().Watch(ctx, opts)
	if err != nil {
		return nil, err
	}
	return newScopeWatch(ctx, w, func(obj *unstructured.Unstructured) bool { return r.allowed(ctx, obj) }), nil
}

type scopeWatch struct {
	once   sync.Once
	cancel context.CancelFunc
	source watch.Interface
	out    chan watch.Event
}

func newScopeWatch(ctx context.Context, source watch.Interface, allowed func(*unstructured.Unstructured) bool) *scopeWatch {
	ctx, cancel := context.WithCancel(ctx)
	w := &scopeWatch{cancel: cancel, source: source, out: make(chan watch.Event)}
	go func() {
		defer close(w.out)
		defer source.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case event, ok := <-source.ResultChan():
				if !ok {
					return
				}
				obj, ok := event.Object.(*unstructured.Unstructured)
				if ok && !allowed(obj) {
					continue
				}
				select {
				case w.out <- event:
				case <-ctx.Done():
					return
				}
			}
		}
	}()
	return w
}
func (w *scopeWatch) Stop()                          { w.once.Do(func() { w.cancel(); w.source.Stop() }) }
func (w *scopeWatch) ResultChan() <-chan watch.Event { return w.out }

var _ dynamic.NamespaceableResourceInterface = (*workspaceResource)(nil)
var _ runtime.Object = (*unstructured.Unstructured)(nil)
