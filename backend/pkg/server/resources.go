package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	authv1 "k8s.io/api/authorization/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
)

func (s *Server) authorize(ctx context.Context, c *Clients, verb, group, res, sub, ns, name string) error {
	if verb != "get" && verb != "list" && verb != "watch" && s.ReadOnly {
		return apierrors.NewForbidden(schema.GroupResource{Group: group, Resource: res}, name, fmt.Errorf("Sunucu salt okunur modda (READ_ONLY=true)"))
	}
	review, err := c.Typed.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authv1.SelfSubjectAccessReview{Spec: authv1.SelfSubjectAccessReviewSpec{ResourceAttributes: &authv1.ResourceAttributes{Namespace: ns, Verb: verb, Group: group, Resource: res, Subresource: sub, Name: name}}}, metav1.CreateOptions{})
	if err != nil {
		return err
	}
	if !review.Status.Allowed {
		return apierrors.NewForbidden(schema.GroupResource{Group: group, Resource: res}, name, fmt.Errorf("Yetki reddedildi: %s", review.Status.Reason))
	}
	return nil
}
func (s *Server) capabilities(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	gvr := queryGVR(r)
	ns = resourceNamespace(c, gvr, ns)
	name := r.URL.Query().Get("name")
	verbs := map[string]bool{}
	reasons := map[string]string{}
	for _, verb := range []string{"get", "list", "watch", "create", "update", "patch", "delete"} {
		err := s.authorize(r.Context(), c, verb, gvr.Group, gvr.Resource, "", ns, name)
		verbs[verb] = err == nil
		if err != nil {
			reasons[verb] = err.Error()
		}
	}
	subs := map[string]bool{}
	for sub, verb := range map[string]string{"scale": "update", "log": "get", "exec": "create", "resize": "patch", "eviction": "create", "portforward": "create"} {
		resourceName := gvr.Resource
		if sub == "eviction" {
			resourceName = "pods"
		}
		exists := false
		if list, e := c.Discovery.ServerResourcesForGroupVersion(gvr.GroupVersion().String()); e == nil {
			for _, item := range list.APIResources {
				if item.Name == resourceName+"/"+sub {
					exists = true
					break
				}
			}
		}
		subs[sub] = exists && s.authorize(r.Context(), c, verb, gvr.Group, resourceName, sub, ns, name) == nil
	}
	actions := map[string]bool{}
	switch gvr.Resource {
	case "nodes":
		actions["cordon"] = verbs["update"]
		actions["uncordon"] = verbs["update"]
		actions["drain-preview"] = verbs["get"]
		actions["drain"] = !s.ReadOnly && s.Namespace == ""
	case "deployments":
		actions["restart"] = verbs["update"]
		actions["rollback"] = verbs["update"]
		actions["resources"] = verbs["update"]
		actions["scale"] = subs["scale"]
	case "statefulsets", "daemonsets":
		actions["restart"] = verbs["update"]
		actions["resources"] = verbs["update"]
		actions["scale"] = subs["scale"]
	case "pods":
		actions["resize"] = subs["resize"]
		actions["exec"] = subs["exec"]
	case "cronjobs":
		actions["suspend"] = verbs["update"]
		actions["resume"] = verbs["update"]
		actions["run-now"] = s.authorize(r.Context(), c, "create", "batch", "jobs", "", ns, "") == nil
	}
	scopeRestricted := false
	if s.Namespace != "" {
		if list, e := c.Discovery.ServerResourcesForGroupVersion(gvr.GroupVersion().String()); e == nil {
			for _, item := range list.APIResources {
				if item.Name == gvr.Resource && !item.Namespaced {
					scopeRestricted = true
				}
			}
		}
	}
	if scopeRestricted {
		for _, verb := range []string{"create", "update", "patch", "delete"} {
			verbs[verb] = false
			reasons[verb] = "Namespace ile sınırlandırılmış bağlantıda küme kapsamlı genel mutasyon kapalı"
		}
	}
	templateResources := s.templateResourcesCapability(r.Context(), c, gvr, ns, name, r.URL.Query().Get("uid"))
	actionReasons := map[string]string{}
	if !templateResources.Supported {
		actionReasons["resources"] = templateResources.Reason
		actions["resources"] = false
	}
	// A Pod can point at an editable owner, but the action is issued to the
	// returned target, never directly to pods with a generic update permission.
	if _, exists := actions["resources"]; !exists {
		actions["resources"] = false
	}
	jsonResponse(w, 200, map[string]interface{}{"readOnly": s.ReadOnly, "verbs": verbs, "subresources": subs, "reasons": reasons, "scopeRestricted": scopeRestricted, "actions": actions, "actionReasons": actionReasons, "templateResources": templateResources})
}

type Mutation struct {
	TargetNode      *TargetNode                `json:"targetNode,omitempty"`
	Object          *unstructured.Unstructured `json:"object"`
	DryRun          bool                       `json:"dryRun"`
	UID             string                     `json:"uid"`
	ResourceVersion string                     `json:"resourceVersion"`
}

func operation(obj interface{}, dry bool) map[string]interface{} {
	status := "accepted"
	message := "API kabul etti; sonuç watch verisinden izlenir"
	if dry {
		status = "validated"
		message = "Server dry-run doğrulandı; kümeye yazılmadı"
	}
	return map[string]interface{}{"object": obj, "operation": map[string]interface{}{"id": uuid.NewString(), "status": status, "message": message, "timestamp": time.Now().UTC().Format(time.RFC3339)}}
}
func (s *Server) resources(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	gvr := queryGVR(r)
	if gvr.Resource == "" || strings.Contains(gvr.Resource, "/") {
		problem(w, 400, "Geçerli resource gerekli")
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	ns = resourceNamespace(c, gvr, ns)
	name := r.URL.Query().Get("name")
	client := s.resourceClient(c, gvr, ns)
	ctx := r.Context()
	if r.Method == "GET" {
		verb := "list"
		if name != "" {
			verb = "get"
		}
		if err = s.authorize(ctx, c, verb, gvr.Group, gvr.Resource, "", ns, name); err != nil {
			failure(w, err)
			return
		}
		if name != "" {
			obj, e := client.Get(ctx, name, metav1.GetOptions{})
			if e != nil {
				failure(w, e)
				return
			}
			jsonResponse(w, 200, sanitize(obj))
			return
		}
		list, e := client.List(ctx, metav1.ListOptions{LabelSelector: r.URL.Query().Get("labelSelector"), FieldSelector: r.URL.Query().Get("fieldSelector")})
		if e != nil {
			failure(w, e)
			return
		}
		for i := range list.Items {
			list.Items[i] = *sanitize(&list.Items[i])
		}
		jsonResponse(w, 200, list)
		return
	}
	if r.Method != "POST" && r.Method != "PUT" && r.Method != "DELETE" {
		problem(w, 405, "Desteklenmeyen yöntem")
		return
	}
	if s.Namespace != "" {
		if list, e := c.Discovery.ServerResourcesForGroupVersion(gvr.GroupVersion().String()); e != nil {
			failure(w, e)
			return
		} else {
			for _, resource := range list.APIResources {
				if resource.Name == gvr.Resource && !resource.Namespaced {
					problem(w, 403, "Namespace ile sınırlandırılmış bağlantıda küme kapsamlı kaynak mutasyonu kapalı")
					return
				}
			}
		}
	}
	var body Mutation
	if !decode(w, r, &body) {
		return
	}
	verb := map[string]string{"POST": "create", "PUT": "update", "DELETE": "delete"}[r.Method]
	if err = s.authorize(ctx, c, verb, gvr.Group, gvr.Resource, "", ns, name); err != nil {
		failure(w, err)
		return
	}
	dry := []string{}
	if body.DryRun {
		dry = []string{metav1.DryRunAll}
	}
	if r.Method == "DELETE" {
		if name == "" || body.UID == "" || body.ResourceVersion == "" {
			problem(w, 400, "Silmek için name, uid ve resourceVersion önkoşulları gerekli")
			return
		}
		uid := types.UID(body.UID)
		rv := body.ResourceVersion
		propagation := metav1.DeletePropagationBackground
		err = client.Delete(ctx, name, metav1.DeleteOptions{DryRun: dry, PropagationPolicy: &propagation, Preconditions: &metav1.Preconditions{UID: &uid, ResourceVersion: &rv}})
		if err != nil {
			failure(w, err)
			return
		}
		jsonResponse(w, 202, operation(nil, body.DryRun))
		return
	}
	obj := body.Object
	if obj == nil || obj.GetName() == "" {
		problem(w, 422, "object.metadata.name gerekli")
		return
	}
	if ns != "" {
		if obj.GetNamespace() != "" && obj.GetNamespace() != ns {
			problem(w, 422, "Nesne namespace ile istek kapsamı uyuşmuyor")
			return
		}
		obj.SetNamespace(ns)
	}
	if obj.GetKind() == "Secret" {
		if _, ok := obj.Object["keyNames"]; ok {
			problem(w, 422, "Maskelenmiş Secret kaydedilemez; değerleri ayrı ve yetkili akışla açın")
			return
		}
	}
	if r.Method == "POST" {
		if err := s.validateTargetNode(ctx, c, obj, body.TargetNode); err != nil {
			failure(w, err)
			return
		}
		out, e := client.Create(ctx, obj, metav1.CreateOptions{DryRun: dry, FieldValidation: metav1.FieldValidationStrict})
		if e != nil {
			failure(w, e)
			return
		}
		jsonResponse(w, 201, operation(sanitize(out), body.DryRun))
		return
	}
	if name == "" || obj.GetName() != name || obj.GetUID() == "" || obj.GetResourceVersion() == "" {
		problem(w, 422, "Güncelleme için aynı ad, UID ve resourceVersion gerekli")
		return
	}
	current, e := client.Get(ctx, name, metav1.GetOptions{})
	if e != nil {
		failure(w, e)
		return
	}
	if e = checkIdentity(current, string(obj.GetUID()), obj.GetResourceVersion()); e != nil {
		failure(w, e)
		return
	}
	out, e := client.Update(ctx, obj, metav1.UpdateOptions{DryRun: dry, FieldValidation: metav1.FieldValidationStrict})
	if e != nil {
		failure(w, e)
		return
	}
	jsonResponse(w, 200, operation(sanitize(out), body.DryRun))
}
func checkIdentity(obj *unstructured.Unstructured, uid, rv string) error {
	if uid == "" || rv == "" {
		return apierrors.NewBadRequest("UID ve resourceVersion gerekli")
	}
	if string(obj.GetUID()) != uid || obj.GetResourceVersion() != rv {
		return apierrors.NewConflict(schema.GroupResource{Resource: obj.GetKind()}, obj.GetName(), fmt.Errorf("Kaynak değişti veya yeniden oluşturuldu. Yenileyip değişikliği tekrar inceleyin"))
	}
	return nil
}

type Action struct {
	Revision        int64  `json:"revision"`
	Context         string `json:"context"`
	Group           string `json:"group"`
	Version         string `json:"version"`
	Resource        string `json:"resource"`
	Namespace       string `json:"namespace"`
	Name            string `json:"name"`
	UID             string `json:"uid"`
	ResourceVersion string `json:"resourceVersion"`
	Action          string `json:"action"`
	Replicas        int64  `json:"replicas"`
	Containers      []struct {
		Name      string                 `json:"name"`
		Resources map[string]interface{} `json:"resources"`
	} `json:"containers"`
	DryRun bool `json:"dryRun"`
}

func (s *Server) actions(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		problem(w, 405, "POST gerekli")
		return
	}
	var a Action
	if !decode(w, r, &a) {
		return
	}
	if a.Context != "" {
		q := r.URL.Query()
		q.Set("context", a.Context)
		r.URL.RawQuery = q.Encode()
	}
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	if s.Namespace != "" && a.Namespace != s.Namespace && !(a.Group == "" && a.Resource == "nodes" && a.Namespace == "") {
		problem(w, 403, "İşlem namespace kapsamı dışında")
		return
	}
	if a.Version == "" {
		a.Version = "v1"
	}
	gvr := schema.GroupVersionResource{Group: a.Group, Version: a.Version, Resource: a.Resource}
	cl := s.resourceClient(c, gvr, a.Namespace)
	obj, err := cl.Get(r.Context(), a.Name, metav1.GetOptions{})
	if err != nil {
		failure(w, err)
		return
	}
	if err = checkIdentity(obj, a.UID, a.ResourceVersion); err != nil {
		failure(w, err)
		return
	}
	if s.maintenance(w, r, c, a, obj) {
		return
	}
	verb := "update"
	sub := ""
	if a.Action == "resize" {
		sub = "resize"
		verb = "patch"
	}
	if a.Action == "scale" {
		sub = "scale"
	}
	if err = s.authorize(r.Context(), c, verb, a.Group, a.Resource, sub, a.Namespace, a.Name); err != nil {
		failure(w, err)
		return
	}
	dry := []string{}
	if a.DryRun {
		dry = []string{metav1.DryRunAll}
	}
	switch a.Action {
	case "resize":
		if a.Group != "" || a.Resource != "pods" {
			problem(w, 422, "Yerinde resize yalnız Pod için kullanılabilir")
			return
		}
		list, e := c.Discovery.ServerResourcesForGroupVersion("v1")
		supported := false
		if e == nil {
			for _, resource := range list.APIResources {
				if resource.Name == "pods/resize" {
					supported = true
				}
			}
		}
		if !supported {
			problem(w, 422, "Küme pods/resize alt kaynağını sunmuyor")
			return
		}
		if len(a.Containers) == 0 {
			problem(w, 422, "En az bir container değişikliği gerekli")
			return
		}
		containers, _, _ := unstructured.NestedSlice(obj.Object, "spec", "containers")
		for _, change := range a.Containers {
			if e := validateResources(change.Resources); e != nil {
				problem(w, 422, e.Error())
				return
			}
			found := false
			for i, item := range containers {
				container := item.(map[string]interface{})
				if container["name"] == change.Name {
					container["resources"] = change.Resources
					containers[i] = container
					found = true
				}
			}
			if !found {
				problem(w, 422, "Container bulunamadı: "+change.Name)
				return
			}
		}
		patch, _ := json.Marshal(map[string]interface{}{"metadata": map[string]interface{}{"uid": a.UID, "resourceVersion": a.ResourceVersion}, "spec": map[string]interface{}{"containers": containers}})
		out, e := cl.Patch(r.Context(), a.Name, types.MergePatchType, patch, metav1.PatchOptions{DryRun: dry, FieldValidation: metav1.FieldValidationStrict}, "resize")
		if e != nil {
			failure(w, e)
			return
		}
		jsonResponse(w, 202, operation(sanitize(out), a.DryRun))
		return
	case "scale":
		if a.Group != "apps" || (a.Resource != "deployments" && a.Resource != "statefulsets" && a.Resource != "replicasets") {
			problem(w, 422, "Bu kaynak scale alt kaynağını desteklemiyor")
			return
		}
		if a.Replicas < 0 {
			problem(w, 422, "Replica sayısı negatif olamaz")
			return
		}
		hpas, e := c.Typed.AutoscalingV2().HorizontalPodAutoscalers(a.Namespace).List(r.Context(), metav1.ListOptions{})
		if e != nil {
			failure(w, e)
			return
		}
		for _, hpa := range hpas.Items {
			if hpa.Spec.ScaleTargetRef.Name == a.Name && hpa.Spec.ScaleTargetRef.Kind == obj.GetKind() {
				problem(w, 409, "Replica hedefini HPA yönetiyor: "+hpa.Name+". HPA min/max/target alanlarını düzenleyin")
				return
			}
		}
		scale, e := cl.Get(r.Context(), a.Name, metav1.GetOptions{}, "scale")
		if e != nil {
			failure(w, e)
			return
		}
		if e = checkIdentity(scale, a.UID, a.ResourceVersion); e != nil {
			failure(w, e)
			return
		}
		unstructured.SetNestedField(scale.Object, a.Replicas, "spec", "replicas")
		out, e := cl.Update(r.Context(), scale, metav1.UpdateOptions{DryRun: dry}, "scale")
		if e != nil {
			failure(w, e)
			return
		}
		jsonResponse(w, 202, operation(out, a.DryRun))
		return
	case "restart":
		if a.Resource == "statefulsets" || a.Resource == "daemonsets" {
			strategy, _, _ := unstructured.NestedString(obj.Object, "spec", "updateStrategy", "type")
			if strategy == "OnDelete" {
				problem(w, 409, "OnDelete strategy otomatik rollout yapmaz. Stratejiyi düzenleyin veya Pod silme akışını kullanın")
				return
			}
		}
		if a.Group != "apps" || (a.Resource != "deployments" && a.Resource != "statefulsets" && a.Resource != "daemonsets") {
			problem(w, 422, "Rollout restart yalnız Deployment, StatefulSet ve DaemonSet için desteklenir")
			return
		}
		if a.Resource == "deployments" {
			paused, _, _ := unstructured.NestedBool(obj.Object, "spec", "paused")
			if paused {
				problem(w, 409, "Duraklatılmış Deployment yeniden başlatılamaz")
				return
			}
		}
		annotations, _, _ := unstructured.NestedStringMap(obj.Object, "spec", "template", "metadata", "annotations")
		if annotations == nil {
			annotations = map[string]string{}
		}
		annotations["kubectl.kubernetes.io/restartedAt"] = time.Now().UTC().Format(time.RFC3339Nano)
		unstructured.SetNestedStringMap(obj.Object, annotations, "spec", "template", "metadata", "annotations")
	case "cordon", "uncordon":
		if a.Resource != "nodes" || a.Group != "" {
			problem(w, 422, "Cordon yalnız Node için kullanılabilir")
			return
		}
		unstructured.SetNestedField(obj.Object, a.Action == "cordon", "spec", "unschedulable")
	case "resources":
		if len(a.Containers) == 0 {
			problem(w, 422, "En az bir container kaynak değişikliği gerekli")
			return
		}
		if a.Group != "apps" || (a.Resource != "deployments" && a.Resource != "statefulsets" && a.Resource != "daemonsets") {
			problem(w, 422, "Kalıcı kaynak değişikliği için yönetici workload şablonunu seçin")
			return
		}
		containers, _, _ := unstructured.NestedSlice(obj.Object, "spec", "template", "spec", "containers")
		for _, change := range a.Containers {
			if err = validateResources(change.Resources); err != nil {
				problem(w, 422, change.Name+": "+err.Error())
				return
			}
			found := false
			for i, item := range containers {
				container := item.(map[string]interface{})
				if container["name"] == change.Name {
					container["resources"] = change.Resources
					containers[i] = container
					found = true
				}
			}
			if !found {
				problem(w, 422, "Container bulunamadı: "+change.Name)
				return
			}
		}
		unstructured.SetNestedSlice(obj.Object, containers, "spec", "template", "spec", "containers")
	default:
		problem(w, 422, "Desteklenmeyen işlem: "+a.Action)
		return
	}
	out, err := cl.Update(r.Context(), obj, metav1.UpdateOptions{DryRun: dry, FieldValidation: metav1.FieldValidationStrict})
	if err != nil {
		failure(w, err)
		return
	}
	jsonResponse(w, 202, operation(sanitize(out), a.DryRun))
}
func validateResources(resources map[string]interface{}) error {
	for _, key := range []string{"cpu", "memory"} {
		var request, limit *resource.Quantity
		for _, scope := range []string{"requests", "limits"} {
			m, ok := resources[scope].(map[string]interface{})
			if !ok {
				continue
			}
			raw, ok := m[key]
			if !ok {
				continue
			}
			str, ok := raw.(string)
			if !ok {
				return fmt.Errorf("%s %s string quantity olmalı", key, scope)
			}
			q, err := resource.ParseQuantity(str)
			if err != nil || q.Sign() < 0 {
				return fmt.Errorf("Geçersiz %s %s: %s", key, scope, str)
			}
			if scope == "requests" {
				request = &q
			} else {
				limit = &q
			}
		}
		if request != nil && limit != nil && request.Cmp(*limit) > 0 {
			return fmt.Errorf("%s request limit değerini aşamaz", key)
		}
	}
	return nil
}
