package server

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type WorkloadTarget struct {
	Group     string `json:"group"`
	Version   string `json:"version"`
	Resource  string `json:"resource"`
	Kind      string `json:"kind"`
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	UID       string `json:"uid"`
}
type TemplateResourcesCapability struct {
	Supported        bool            `json:"supported"`
	Target           *WorkloadTarget `json:"target,omitempty"`
	Effect           string          `json:"effect"`
	Reason           string          `json:"reason"`
	AffectedReplicas *int64          `json:"affectedReplicas,omitempty"`
}

func resourceForOwner(c *Clients, version, kind string) (schema.GroupVersionResource, error) {
	gv, err := schema.ParseGroupVersion(version)
	if err != nil {
		return schema.GroupVersionResource{}, err
	}
	list, err := c.Discovery.ServerResourcesForGroupVersion(version)
	if err != nil {
		return schema.GroupVersionResource{}, err
	}
	for _, resource := range list.APIResources {
		if resource.Kind == kind && !containsSubresource(resource.Name) {
			return gv.WithResource(resource.Name), nil
		}
	}
	return schema.GroupVersionResource{}, fmt.Errorf("Owner API keşfinde bulunamadı: %s/%s", version, kind)
}
func containsSubresource(name string) bool {
	for _, ch := range name {
		if ch == '/' {
			return true
		}
	}
	return false
}

// The backend resolves only verified controller ownerReferences. A suggestive
// name or a generic update permission on the selected Pod is not a capability
// to mutate an unrelated workload template.
func (s *Server) templateResourcesCapability(ctx context.Context, c *Clients, gvr schema.GroupVersionResource, namespace, name, expectedUID string) TemplateResourcesCapability {
	result := TemplateResourcesCapability{Effect: "unsupported", Reason: "CPU/RAM şablon işlemi bu kaynak türünde desteklenmiyor"}
	if name == "" {
		result.Reason = "Önce gerçek bir workload veya Pod seçin"
		return result
	}
	// Capability discovery must not read unrelated object bodies (particularly
	// Secret values) merely to report that no template operation exists.
	candidate := (gvr.Group == "" && gvr.Resource == "pods") || (gvr.Group == "apps" && (gvr.Resource == "deployments" || gvr.Resource == "statefulsets" || gvr.Resource == "daemonsets" || gvr.Resource == "replicasets")) || (gvr.Group == "batch" && (gvr.Resource == "jobs" || gvr.Resource == "cronjobs"))
	if !candidate {
		return result
	}
	if expectedUID == "" {
		result.Reason = "Şablon hedefini çözmek için seçili kaynağın UID önkoşulu gerekli"
		return result
	}
	if err := s.authorize(ctx, c, "get", gvr.Group, gvr.Resource, "", namespace, name); err != nil {
		result.Reason = safeError(err)
		return result
	}
	obj, err := s.resourceClient(c, gvr, namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		result.Reason = safeError(err)
		return result
	}
	if string(obj.GetUID()) != expectedUID {
		result.Reason = "Seçili kaynağın UID değeri değişti; yeni nesne şablon hedefi olarak kullanılmadı"
		return result
	}
	for depth := 0; depth < 4; depth++ {
		if obj.GetKind() != "Pod" && obj.GetKind() != "ReplicaSet" && obj.GetKind() != "Job" {
			break
		}
		var controller *metav1.OwnerReference
		for _, ref := range obj.GetOwnerReferences() {
			if ref.Controller != nil && *ref.Controller {
				copy := ref
				controller = &copy
				break
			}
		}
		if controller == nil {
			break
		}
		ownerGVR, e := resourceForOwner(c, controller.APIVersion, controller.Kind)
		if e != nil {
			result.Reason = safeError(e)
			return result
		}
		ownerNamespace := resourceNamespace(c, ownerGVR, obj.GetNamespace())
		if e = s.authorize(ctx, c, "get", ownerGVR.Group, ownerGVR.Resource, "", ownerNamespace, controller.Name); e != nil {
			result.Reason = "Workload sahibi okunamıyor: " + safeError(e)
			return result
		}
		owner, e := s.resourceClient(c, ownerGVR, ownerNamespace).Get(ctx, controller.Name, metav1.GetOptions{})
		if e != nil {
			result.Reason = "Workload sahibi okunamıyor: " + safeError(e)
			return result
		}
		if controller.UID == "" || owner.GetUID() != controller.UID {
			result.Reason = "Owner UID değişti veya doğrulanamadı; aynı adlı yeni workload hedeflenmedi"
			return result
		}
		obj = owner
		gvr = ownerGVR
		namespace = ownerNamespace
	}
	result.Target = &WorkloadTarget{Group: gvr.Group, Version: gvr.Version, Resource: gvr.Resource, Kind: obj.GetKind(), Namespace: obj.GetNamespace(), Name: obj.GetName(), UID: string(obj.GetUID())}
	if gvr.Group != "apps" || (gvr.Resource != "deployments" && gvr.Resource != "statefulsets" && gvr.Resource != "daemonsets") {
		switch obj.GetKind() {
		case "Pod":
			result.Reason = "Bağımsız Pod şablonu bu işlemle değiştirilemez; destekleniyorsa ayrı yerinde resize kullanın"
		case "ReplicaSet":
			result.Reason = "Bağımsız ReplicaSet şablonu mevcut Pod'ları rollout etmez. Bu CPU/RAM işlemi Deployment, StatefulSet ve DaemonSet içindir; gelecek Pod tanımı YAML'dan ayrıca düzenlenebilir"
		case "Job":
			result.Reason = "Mevcut Job Pod şablonu immutable olabilir; bu işlem Job üzerinde kaynak değişikliği veya rollout uygulamaz"
		case "CronJob":
			result.Reason = "CronJob değişikliği yalnız gelecekteki Job'ları etkiler; mevcut Pod'lar için rollout değildir. jobTemplate YAML üzerinden ayrıca düzenlenebilir"
		}
		return result
	}
	if err = s.authorize(ctx, c, "update", gvr.Group, gvr.Resource, "", namespace, obj.GetName()); err != nil {
		result.Reason = safeError(err)
		return result
	}
	result.Supported = true
	result.Effect = "rollout"
	result.Reason = "Doğrulanmış workload şablonu güncellenir; gerçek Pod/Ready sonucu ayrıca izlenir"
	if obj.GetKind() == "Deployment" {
		paused, _, _ := unstructured.NestedBool(obj.Object, "spec", "paused")
		if paused {
			result.Effect = "paused-deployment"
			result.Reason = "Deployment duraklatılmış: şablon güncellenir, rollout resume işlemine kadar başlamaz"
		}
	}
	if obj.GetKind() == "StatefulSet" || obj.GetKind() == "DaemonSet" {
		strategy, _, _ := unstructured.NestedString(obj.Object, "spec", "updateStrategy", "type")
		if strategy == "OnDelete" {
			result.Effect = "manual-pod-recreation"
			result.Reason = "OnDelete: şablon güncellenir; mevcut Pod'lar otomatik değiştirilmez"
		}
	}
	if obj.GetKind() == "StatefulSet" {
		replicas, found, _ := unstructured.NestedInt64(obj.Object, "spec", "replicas")
		if !found {
			replicas = 1
		}
		partition, _, _ := unstructured.NestedInt64(obj.Object, "spec", "updateStrategy", "rollingUpdate", "partition")
		affected := replicas - partition
		if affected < 0 {
			affected = 0
		}
		result.AffectedReplicas = &affected
		if partition > 0 && result.Effect == "rollout" {
			result.Effect = "partitioned-rollout"
			result.Reason = "RollingUpdate partition nedeniyle yalnız hedef ordinal aralığı otomatik güncellenir"
		}
	}
	return result
}
