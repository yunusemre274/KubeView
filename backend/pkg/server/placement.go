package server

import (
	"context"
	"fmt"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/selection"
)

// TargetNode is optional creation intent from a selected ship. The Kubernetes
// scheduler still performs placement; neither this envelope nor the form writes
// spec.nodeName. YAML-only creation without this envelope remains unrestricted.
type TargetNode struct {
	Name string `json:"name"`
	UID  string `json:"uid"`
	Mode string `json:"mode"`
}

func podSpecForPlacement(obj *unstructured.Unstructured) (map[string]interface{}, error) {
	var path []string
	switch obj.GetKind() {
	case "Pod":
		path = []string{"spec"}
	case "Deployment", "ReplicaSet", "StatefulSet", "DaemonSet", "Job":
		path = []string{"spec", "template", "spec"}
	case "CronJob":
		path = []string{"spec", "jobTemplate", "spec", "template", "spec"}
	default:
		return nil, apierrors.NewBadRequest("Seçilen kaynak türünde Pod placement şablonu yok")
	}
	spec, found, err := unstructured.NestedMap(obj.Object, path...)
	if err != nil || !found {
		return nil, apierrors.NewBadRequest("Pod spec şablonu bulunamadı")
	}
	return spec, nil
}
func (s *Server) validateTargetNode(ctx context.Context, c *Clients, obj *unstructured.Unstructured, target *TargetNode) error {
	if target == nil {
		return nil
	}
	if target.Mode != "required" && target.Mode != "preferred" && target.Mode != "scheduler" {
		return apierrors.NewBadRequest("targetNode.mode required, preferred veya scheduler olmalı")
	}
	spec, err := podSpecForPlacement(obj)
	if err != nil {
		return err
	}
	nodeName, _, err := unstructured.NestedString(spec, "nodeName")
	if err != nil {
		return apierrors.NewBadRequest("Pod spec.nodeName string olmalı")
	}
	if nodeName != "" {
		return apierrors.NewBadRequest("Node hedefleme spec.nodeName ile scheduler'ı atlayamaz; metadata.name nodeAffinity kullanın")
	}
	if target.Mode == "scheduler" {
		return nil
	}
	if !validName(target.Name) || target.UID == "" {
		return apierrors.NewBadRequest("Seçilen Node için ham name ve UID gerekli")
	}
	if err = s.authorize(ctx, c, "get", "", "nodes", "", "", target.Name); err != nil {
		return err
	}
	node, err := c.Typed.CoreV1().Nodes().Get(ctx, target.Name, metav1.GetOptions{})
	if err != nil {
		return err
	}
	if string(node.UID) != target.UID {
		return apierrors.NewConflict(schema.GroupResource{Resource: "nodes"}, target.Name, fmt.Errorf("Seçilen Node UID değişti veya aynı adla yeniden oluşturuldu; Node'u tekrar seçin"))
	}
	affinityRaw, found, err := unstructured.NestedMap(spec, "affinity", "nodeAffinity")
	if err != nil || !found {
		return apierrors.NewBadRequest("Node hedefi için nodeAffinity placement niyeti bulunamadı")
	}
	var affinity corev1.NodeAffinity
	if err = runtime.DefaultUnstructuredConverter.FromUnstructured(affinityRaw, &affinity); err != nil {
		return apierrors.NewBadRequest("nodeAffinity geçersiz: " + err.Error())
	}
	if target.Mode == "preferred" {
		for _, term := range affinity.PreferredDuringSchedulingIgnoredDuringExecution {
			if term.Weight > 0 && term.Weight <= 100 && explicitNodeConstraint(term.Preference, target.Name) {
				return nil
			}
		}
		return apierrors.NewBadRequest("Tercihli Node hedefi için pozitif ağırlıklı metadata.name In [seçilen Node] matchFields şartı gerekli")
	}
	selector := affinity.RequiredDuringSchedulingIgnoredDuringExecution
	if selector == nil || len(selector.NodeSelectorTerms) == 0 {
		return apierrors.NewBadRequest("Zorunlu Node hedefi için boş olmayan required nodeSelectorTerms gerekli")
	}
	for i, term := range selector.NodeSelectorTerms {
		if !explicitNodeConstraint(term, target.Name) {
			return apierrors.NewBadRequest(fmt.Sprintf("nodeSelectorTerms[%d] seçilen Node metadata.name değerini tek başına In ile sınırlamalı; her OR terimine AND şartı ekleyin", i))
		}
	}
	nodeSelector, _, err := unstructured.NestedStringMap(spec, "nodeSelector")
	if err != nil {
		return apierrors.NewBadRequest("nodeSelector string değerli harita olmalı")
	}
	if !labels.SelectorFromSet(nodeSelector).Matches(labels.Set(node.Labels)) {
		return apierrors.NewBadRequest("Mevcut nodeSelector seçilen Node etiketleriyle çelişiyor; özgün alanlar korunarak seçim düzeltilmeli")
	}
	for _, term := range selector.NodeSelectorTerms {
		matches, err := nodeSelectorTermMatches(term, node)
		if err != nil {
			return apierrors.NewBadRequest("Node affinity koşulu geçersiz: " + err.Error())
		}
		if matches {
			return nil
		}
	}
	return apierrors.NewBadRequest("Mevcut zorunlu affinity koşulları seçilen Node ile çelişiyor; hiçbir OR terimi eşleşmiyor")
}
func explicitNodeConstraint(term corev1.NodeSelectorTerm, name string) bool {
	for _, requirement := range term.MatchFields {
		if requirement.Key == "metadata.name" && requirement.Operator == corev1.NodeSelectorOpIn && len(requirement.Values) == 1 && requirement.Values[0] == name {
			return true
		}
	}
	return false
}
func nodeSelectorTermMatches(term corev1.NodeSelectorTerm, node *corev1.Node) (bool, error) {
	if len(term.MatchExpressions) == 0 && len(term.MatchFields) == 0 {
		return false, nil
	}
	for _, entry := range []struct {
		requirements []corev1.NodeSelectorRequirement
		values       labels.Set
	}{{term.MatchExpressions, labels.Set(node.Labels)}, {term.MatchFields, labels.Set{"metadata.name": node.Name}}} {
		for _, raw := range entry.requirements {
			var op selection.Operator
			switch raw.Operator {
			case corev1.NodeSelectorOpIn:
				op = selection.In
			case corev1.NodeSelectorOpNotIn:
				op = selection.NotIn
			case corev1.NodeSelectorOpExists:
				op = selection.Exists
			case corev1.NodeSelectorOpDoesNotExist:
				op = selection.DoesNotExist
			case corev1.NodeSelectorOpGt:
				op = selection.GreaterThan
			case corev1.NodeSelectorOpLt:
				op = selection.LessThan
			default:
				return false, fmt.Errorf("Desteklenmeyen selector operator: %s", raw.Operator)
			}
			requirement, err := labels.NewRequirement(raw.Key, op, raw.Values)
			if err != nil {
				return false, err
			}
			if !requirement.Matches(entry.values) {
				return false, nil
			}
		}
	}
	return true, nil
}
