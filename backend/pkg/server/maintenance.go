package server

import (
	"net/http"
	"strconv"

	corev1 "k8s.io/api/core/v1"
	policyv1 "k8s.io/api/policy/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func (s *Server) maintenance(w http.ResponseWriter, r *http.Request, c *Clients, a Action, obj *unstructured.Unstructured) bool {
	switch a.Action {
	case "drain-preview", "drain":
		if a.Action == "drain" && workspaceScopeFrom(r.Context()) != nil {
			if ack, _ := r.Context().Value(clusterImpactKey{}).(bool); !ack {
				problem(w, 403, "Paylaşılan Node drain etkisi açıkça onaylanmalı")
				return true
			}
		}
		if a.Action == "drain" && !a.DryRun && s.ReadOnly {
			problem(w, 403, "Sunucu salt okunur modda")
			return true
		}
		if a.Resource != "nodes" || a.Group != "" {
			problem(w, 422, "Drain yalnız Node için kullanılabilir")
			return true
		}
		if err := s.authorize(r.Context(), c, "list", "", "pods", "", s.Namespace, ""); err != nil {
			failure(w, err)
			return true
		}
		workspaceScope := workspaceScopeFrom(r.Context())
		var pods *corev1.PodList
		var err error
		if workspaceScope == nil {
			pods, err = c.Typed.CoreV1().Pods(s.Namespace).List(r.Context(), metav1.ListOptions{FieldSelector: "spec.nodeName=" + a.Name})
		} else {
			list, e := c.Dynamic.Resource(schemaGVR("", "v1", "pods")).List(r.Context(), metav1.ListOptions{FieldSelector: "spec.nodeName=" + a.Name})
			err = e
			pods = &corev1.PodList{}
			if e == nil {
				for _, item := range list.Items {
					var pod corev1.Pod
					if e = runtime.DefaultUnstructuredConverter.FromUnstructured(item.Object, &pod); e != nil {
						err = e
						break
					}
					pods.Items = append(pods.Items, pod)
				}
			}
		}
		if err != nil {
			failure(w, err)
			return true
		}
		var pdbs *policyv1.PodDisruptionBudgetList
		var pdbErr error
		if workspaceScope != nil && workspaceScope.harbor.Namespaces[0] != "*" {
			pdbs = &policyv1.PodDisruptionBudgetList{}
			for _, namespace := range workspaceScope.harbor.Namespaces {
				list, e := c.Typed.PolicyV1().PodDisruptionBudgets(namespace).List(r.Context(), metav1.ListOptions{})
				if e != nil {
					pdbErr = e
					break
				}
				pdbs.Items = append(pdbs.Items, list.Items...)
			}
		} else {
			pdbs, pdbErr = c.Typed.PolicyV1().PodDisruptionBudgets(s.Namespace).List(r.Context(), metav1.ListOptions{})
		}
		affected := []map[string]interface{}{}
		blocked := false
		for _, pod := range pods.Items {
			skip := ""
			if pod.Annotations["kubernetes.io/config.mirror"] != "" {
				skip = "Mirror Pod; eviction uygulanmaz"
			}
			for _, owner := range pod.OwnerReferences {
				if owner.Kind == "DaemonSet" {
					skip = "DaemonSet Pod; controller yerleşimi korunur"
				}
			}
			if len(pod.OwnerReferences) == 0 && skip == "" {
				skip = "Sahipsiz Pod; güvenli drain için workload yöneticisi gerekli"
				blocked = true
			}
			matched := []map[string]interface{}{}
			pdbBlocked := false
			if pdbErr == nil {
				for _, pdb := range pdbs.Items {
					if pdb.Namespace != pod.Namespace {
						continue
					}
					selector, e := metav1.LabelSelectorAsSelector(pdb.Spec.Selector)
					if e != nil || !selector.Matches(labels.Set(pod.Labels)) {
						continue
					}
					if pdb.Status.DisruptionsAllowed < 1 {
						pdbBlocked = true
					}
					matched = append(matched, map[string]interface{}{"name": pdb.Name, "namespace": pdb.Namespace, "disruptionsAllowed": pdb.Status.DisruptionsAllowed, "currentHealthy": pdb.Status.CurrentHealthy, "desiredHealthy": pdb.Status.DesiredHealthy, "generation": pdb.Generation, "observedGeneration": pdb.Status.ObservedGeneration})
				}
			}
			affected = append(affected, map[string]interface{}{"name": pod.Name, "namespace": pod.Namespace, "uid": pod.UID, "evictable": skip == "", "reason": skip, "pdbs": matched, "pdbBlocked": pdbBlocked})
		}
		if a.Action == "drain-preview" || a.DryRun {
			if pdbErr != nil {
				for _, entry := range affected {
					entry["pdbInspectionError"] = safeError(pdbErr)
				}
			}
			partialScope := s.Namespace != "" || workspaceScope != nil && (workspaceScope.harbor.Namespaces[0] != "*" || !workspaceScope.selector.Empty())
			jsonResponse(w, 200, map[string]interface{}{"affected": affected, "blocked": blocked, "scope": s.Namespace, "requiresCordon": true, "partialScope": partialScope, "operation": map[string]interface{}{"status": "validated", "message": "Etki önizlemesi; PodDisruptionBudget API eviction sırasında denetlenir"}})
			return true
		}
		if s.Namespace != "" {
			problem(w, 403, "WATCH_NAMESPACE sınırlı bağlantıda Node'un tamamı drain edilemez; küme kapsamlı, yetkili bakım bağlantısı gerekir")
			return true
		}
		if workspaceScope != nil && (workspaceScope.harbor.Namespaces[0] != "*" || !workspaceScope.selector.Empty()) {
			problem(w, 403, "Node drain tüm küme kapsamı ve açık ortak etki onayı gerektirir; liman önizlemesi kısmi kapsamdır")
			return true
		}
		cordoned, _, _ := unstructured.NestedBool(obj.Object, "spec", "unschedulable")
		if !cordoned {
			problem(w, 409, "Önce etki önizlemesini inceleyip Node'u açıkça cordon edin")
			return true
		}
		if blocked {
			problem(w, 409, "Sahipsiz Pod'lar var; otomatik zorla silme yapılmadı")
			return true
		}
		results := []map[string]interface{}{}
		partial := false
		for i, pod := range pods.Items {
			if !affected[i]["evictable"].(bool) {
				continue
			}
			entry := map[string]interface{}{"name": pod.Name, "namespace": pod.Namespace, "uid": pod.UID, "status": "accepted"}
			uid, rv := pod.UID, pod.ResourceVersion
			err := s.authorize(r.Context(), c, "create", "", "pods", "eviction", pod.Namespace, pod.Name)
			if err == nil {
				err = c.Typed.PolicyV1().Evictions(pod.Namespace).Evict(r.Context(), &policyv1.Eviction{ObjectMeta: metav1.ObjectMeta{Name: pod.Name, Namespace: pod.Namespace}, DeleteOptions: &metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid, ResourceVersion: &rv}}})
			}
			if err != nil {
				entry["status"] = "failed"
				entry["error"] = safeError(err)
				partial = true
			}
			results = append(results, entry)
		}
		result := scopedOperation(r, c, nil, false)
		result["results"] = results
		result["partialFailure"] = partial
		result["operation"].(map[string]interface{})["status"] = "reconciling"
		result["operation"].(map[string]interface{})["message"] = "Eviction sonuçları ayrı listelendi; Node watch verisinde Pod'ların ayrılması bekleniyor"
		jsonResponse(w, 202, result)
		return true
	case "run-now", "suspend", "resume":
		if a.Group != "batch" || a.Resource != "cronjobs" {
			problem(w, 422, "Bu işlem yalnız CronJob için kullanılabilir")
			return true
		}
		verb, res := "update", "cronjobs"
		if a.Action == "run-now" {
			verb, res = "create", "jobs"
		}
		if err := s.authorize(r.Context(), c, verb, "batch", res, "", a.Namespace, ""); err != nil {
			failure(w, err)
			return true
		}
		dry := []string{}
		if a.DryRun {
			dry = []string{metav1.DryRunAll}
		}
		if a.Action == "run-now" {
			template, found, _ := unstructured.NestedMap(obj.Object, "spec", "jobTemplate")
			if !found {
				problem(w, 422, "CronJob jobTemplate bulunamadı")
				return true
			}
			job := &unstructured.Unstructured{Object: template}
			job.SetAPIVersion("batch/v1")
			job.SetKind("Job")
			job.SetName("")
			job.SetGenerateName(a.Name + "-manual-")
			job.SetNamespace(a.Namespace)
			controller := true
			job.SetOwnerReferences([]metav1.OwnerReference{{APIVersion: obj.GetAPIVersion(), Kind: obj.GetKind(), Name: obj.GetName(), UID: obj.GetUID(), Controller: &controller}})
			out, err := c.Dynamic.Resource(schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}).Namespace(a.Namespace).Create(r.Context(), job, metav1.CreateOptions{DryRun: dry, FieldValidation: metav1.FieldValidationStrict})
			if err != nil {
				failure(w, err)
				return true
			}
			jsonResponse(w, 202, scopedOperation(r, c, sanitize(out), a.DryRun))
			return true
		}
		unstructured.SetNestedField(obj.Object, a.Action == "suspend", "spec", "suspend")
		out, err := s.resourceClient(c, schema.GroupVersionResource{Group: a.Group, Version: a.Version, Resource: a.Resource}, a.Namespace).Update(r.Context(), obj, metav1.UpdateOptions{DryRun: dry})
		if err != nil {
			failure(w, err)
			return true
		}
		jsonResponse(w, 202, scopedOperation(r, c, sanitize(out), a.DryRun))
		return true
	case "rollback":
		if a.Group != "apps" || a.Resource != "deployments" {
			problem(w, 422, "Rollback bu sürümde yalnız Deployment için desteklenir")
			return true
		}
		if err := s.authorize(r.Context(), c, "update", "apps", "deployments", "", a.Namespace, a.Name); err != nil {
			failure(w, err)
			return true
		}
		paused, _, _ := unstructured.NestedBool(obj.Object, "spec", "paused")
		if paused {
			problem(w, 409, "Önce Deployment duraklatmasını kaldırın")
			return true
		}
		sets, err := c.Typed.AppsV1().ReplicaSets(a.Namespace).List(r.Context(), metav1.ListOptions{})
		if err != nil {
			failure(w, err)
			return true
		}
		current, _ := strconv.ParseInt(obj.GetAnnotations()["deployment.kubernetes.io/revision"], 10, 64)
		target := a.Revision
		var template map[string]interface{}
		best := int64(-1)
		for _, rs := range sets.Items {
			owned := false
			for _, owner := range rs.OwnerReferences {
				if owner.Kind == "Deployment" && owner.UID == obj.GetUID() {
					owned = true
				}
			}
			if !owned {
				continue
			}
			revision, _ := strconv.ParseInt(rs.Annotations["deployment.kubernetes.io/revision"], 10, 64)
			if target > 0 && revision != target {
				continue
			}
			if target == 0 && (revision >= current || revision <= best) {
				continue
			}
			converted, e := runtime.DefaultUnstructuredConverter.ToUnstructured(&rs.Spec.Template)
			if e != nil {
				failure(w, e)
				return true
			}
			template = converted
			best = revision
		}
		if template == nil {
			problem(w, 404, "Sahipliği UID ile doğrulanmış rollback revision bulunamadı")
			return true
		}
		unstructured.RemoveNestedField(template, "metadata", "labels", "pod-template-hash")
		unstructured.SetNestedMap(obj.Object, template, "spec", "template")
		dry := []string{}
		if a.DryRun {
			dry = []string{metav1.DryRunAll}
		}
		out, err := s.resourceClient(c, schema.GroupVersionResource{Group: a.Group, Version: a.Version, Resource: a.Resource}, a.Namespace).Update(r.Context(), obj, metav1.UpdateOptions{DryRun: dry})
		if err != nil {
			failure(w, err)
			return true
		}
		result := scopedOperation(r, c, sanitize(out), a.DryRun)
		result["targetRevision"] = best
		jsonResponse(w, 202, result)
		return true
	}
	return false
}
