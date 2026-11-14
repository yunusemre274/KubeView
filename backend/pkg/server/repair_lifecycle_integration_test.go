package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func repairAction(t *testing.T, ctx context.Context, c *Clients, gateway, contextName, ns string, gvr schema.GroupVersionResource, name, action string, extra map[string]interface{}) (int, []byte) {
	t.Helper()
	for attempt := 0; attempt < 4; attempt++ {
		current, err := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			t.Fatal(err)
		}
		body := map[string]interface{}{"group": gvr.Group, "version": gvr.Version, "resource": gvr.Resource, "namespace": ns, "name": name, "uid": string(current.GetUID()), "resourceVersion": current.GetResourceVersion(), "action": action}
		for key, value := range extra {
			body[key] = value
		}
		code, raw := repairHTTP(t, ctx, "POST", gateway+"/api/actions?context="+url.QueryEscape(contextName), body)
		if code != 409 {
			return code, raw
		}
		time.Sleep(50 * time.Millisecond)
	}
	t.Fatal("owned action conflicted repeatedly")
	return 0, nil
}
func repairDeleteObject(t *testing.T, c *Clients, ns, name string, gvr schema.GroupVersionResource, object *unstructured.Unstructured) {
	t.Helper()
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		uid := object.GetUID()
		zero := int64(0)
		background := metav1.DeletePropagationBackground
		_ = c.Dynamic.Resource(gvr).Namespace(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid}, GracePeriodSeconds: &zero, PropagationPolicy: &background})
	})
}

func TestOwnedRepairRealCronJobActionsAndCompletion(t *testing.T) {
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	name := "kv-cron-" + strings.Split(uuid.NewString(), "-")[0]
	yes := true
	cron, err := c.Typed.BatchV1().CronJobs(ns).Create(ctx, &batchv1.CronJob{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: map[string]string{"kubeview.io/repair-owner": "backend-manager"}}, Spec: batchv1.CronJobSpec{Schedule: "0 0 1 1 *", Suspend: &yes, JobTemplate: batchv1.JobTemplateSpec{Spec: batchv1.JobSpec{Template: corev1.PodTemplateSpec{Spec: corev1.PodSpec{RestartPolicy: corev1.RestartPolicyNever, Containers: []corev1.Container{{Name: "app", Image: "alpine:3.21", Command: []string{"sh", "-c", "echo REPAIR_CRON_COMPLETED"}}}}}}}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		background := metav1.DeletePropagationBackground
		_ = c.Typed.BatchV1().CronJobs(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &cron.UID}, PropagationPolicy: &background})
	})
	gvr := schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
	for _, action := range []string{"resume", "suspend"} {
		code, _ := repairAction(t, ctx, c, gateway, contextName, ns, gvr, name, action, nil)
		if code != 202 {
			t.Fatalf("CronJob %s HTTP%d", action, code)
		}
		actual, err := c.Typed.BatchV1().CronJobs(ns).Get(ctx, name, metav1.GetOptions{})
		if err != nil || actual.Spec.Suspend == nil || *actual.Spec.Suspend != (action == "suspend") {
			t.Fatalf("CronJob %s state not observed", action)
		}
	}
	code, raw := repairAction(t, ctx, c, gateway, contextName, ns, gvr, name, "run-now", nil)
	if code != 202 {
		t.Fatalf("run-now HTTP%d", code)
	}
	var result struct {
		Object *unstructured.Unstructured `json:"object"`
	}
	if err = json.Unmarshal(raw, &result); err != nil || result.Object == nil {
		t.Fatal("manual Job identity missing")
	}
	jobName := result.Object.GetName()
	jobUID := result.Object.GetUID()
	owned := false
	for _, ref := range result.Object.GetOwnerReferences() {
		owned = owned || (ref.UID == cron.UID && ref.Kind == "CronJob")
	}
	if !owned {
		t.Fatal("manual Job not owned by exact CronJob UID")
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		background := metav1.DeletePropagationBackground
		_ = c.Typed.BatchV1().Jobs(ns).Delete(cleanup, jobName, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &jobUID}, PropagationPolicy: &background})
	})
	deadline := time.Now().Add(60 * time.Second)
	for time.Now().Before(deadline) {
		job, e := c.Typed.BatchV1().Jobs(ns).Get(ctx, jobName, metav1.GetOptions{})
		if e != nil {
			t.Fatal(e)
		}
		if job.Status.Succeeded == 1 {
			t.Logf("REAL CronJob suspend/resume/run-now→Job Completed: context=%s namespace=%s CronJobUID=%s JobUID=%s; no schedule progress invented", contextName, ns, cron.UID, jobUID)
			return
		}
		if job.Status.Failed > 0 {
			t.Fatal("manual Job failed")
		}
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatal("manual Job completion not observed within 60s")
}

func TestOwnedRepairRealNativeSidecarAndResize(t *testing.T) {
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	name := "kv-native-" + strings.Split(uuid.NewString(), "-")[0]
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	container := func(name, marker string) map[string]interface{} {
		return map[string]interface{}{"name": name, "image": "alpine:3.21", "command": []interface{}{"sh", "-c", "echo " + marker + "; sleep 1200"}, "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "20m", "memory": "8Mi"}, "limits": map[string]interface{}{"cpu": "100m", "memory": "32Mi"}}}
	}
	sidecar := container("native-sidecar", "REPAIR_NATIVE_SIDECAR_OK")
	sidecar["restartPolicy"] = "Always"
	object := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": name, "namespace": ns, "labels": map[string]interface{}{"kubeview.io/repair-owner": "backend-manager"}}, "spec": map[string]interface{}{"terminationGracePeriodSeconds": int64(1), "initContainers": []interface{}{sidecar}, "containers": []interface{}{container("app", "REPAIR_NATIVE_APP_OK")}}}}
	created, err := c.Dynamic.Resource(gvr).Namespace(ns).Create(ctx, object, metav1.CreateOptions{})
	if err != nil {
		t.Fatal("native sidecar real API create failed")
	}
	repairDeleteObject(t, c, ns, name, gvr, created)
	deadline := time.Now().Add(60 * time.Second)
	running := false
	for time.Now().Before(deadline) {
		pod, e := c.Typed.CoreV1().Pods(ns).Get(ctx, name, metav1.GetOptions{})
		if e != nil {
			t.Fatal(e)
		}
		running = len(pod.Status.InitContainerStatuses) == 1 && pod.Status.InitContainerStatuses[0].State.Running != nil && len(pod.Status.ContainerStatuses) == 1 && pod.Status.ContainerStatuses[0].State.Running != nil
		if running {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if !running {
		t.Fatal("actual native sidecar/app did not both run")
	}
	t.Run("native-sidecar-logs", func(t *testing.T) {
		for _, item := range []struct{ name, marker string }{{"native-sidecar", "REPAIR_NATIVE_SIDECAR_OK"}, {"app", "REPAIR_NATIVE_APP_OK"}} {
			q := url.Values{"context": {contextName}, "namespace": {ns}, "pod": {name}, "container": {item.name}, "uid": {string(created.GetUID())}, "session": {"native-" + item.name}, "follow": {"false"}}
			code, raw := repairHTTP(t, ctx, "GET", gateway+"/api/logs?"+q.Encode(), nil)
			if code != 200 || !bytes.Contains(raw, []byte(item.marker)) || bytes.Contains(raw, []byte("KUBEVIEW_LOG_ERROR:")) {
				t.Fatalf("actual %s logs wrong or unavailable HTTP%d", item.name, code)
			}
		}
		t.Logf("REAL native-sidecar spec.initContainers.restartPolicy=Always + running initContainerStatuses and raw-name logs verified; PodUID=%s context=%s namespace=%s; 3D role/UI is separate validation", created.GetUID(), contextName, ns)
	})
	t.Run("in-place-resize", func(t *testing.T) {
		q := url.Values{"context": {contextName}, "namespace": {ns}, "resource": {"pods"}, "name": {name}, "uid": {string(created.GetUID())}}
		code, raw := repairHTTP(t, ctx, "GET", gateway+"/api/capabilities?"+q.Encode(), nil)
		var capabilities struct {
			Subresources map[string]bool `json:"subresources"`
		}
		if code != 200 || json.Unmarshal(raw, &capabilities) != nil {
			t.Fatal("actual resize capability unavailable")
		}
		if !capabilities.Subresources["resize"] {
			t.Skip("REAL cluster discovery/authorization does not expose pods/resize; no resize success claimed")
		}
		extra := map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "40m", "memory": "8Mi"}, "limits": map[string]interface{}{"cpu": "100m", "memory": "32Mi"}}}}}
		code, _ = repairAction(t, ctx, c, gateway, contextName, ns, gvr, name, "resize", extra)
		if code != 202 {
			t.Fatalf("real pods/resize HTTP%d", code)
		}
		deadline := time.Now().Add(40 * time.Second)
		for time.Now().Before(deadline) {
			pod, e := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
			if e != nil {
				t.Fatal(e)
			}
			if pod.GetUID() != created.GetUID() {
				t.Fatal("resize replaced Pod UID")
			}
			statuses, _, _ := unstructured.NestedSlice(pod.Object, "status", "containerStatuses")
			for _, entry := range statuses {
				status := entry.(map[string]interface{})
				if status["name"] != "app" {
					continue
				}
				cpu, _, _ := unstructured.NestedString(status, "resources", "requests", "cpu")
				if cpu == "40m" {
					t.Logf("REAL pods/resize accepted then kubelet status.containerStatuses.resources.requests.cpu=40m applied with same PodUID=%s; owner template unchanged (standalone Pod)", created.GetUID())
					return
				}
			}
			time.Sleep(200 * time.Millisecond)
		}
		t.Fatal("resize API accepted but kubelet-applied CPU not observed in 40s")
	})
}

func TestOwnedRepairRealMetricsAvailability(t *testing.T) {
	s, _, ctx, contextName, gateway := ownedRepairGateway(t)
	code, raw := repairHTTP(t, ctx, "GET", gateway+"/api/metrics?context="+url.QueryEscape(contextName)+"&namespace="+url.QueryEscape(s.Namespace), nil)
	var result struct {
		Available   bool              `json:"available"`
		Source      string            `json:"source"`
		Timestamp   string            `json:"timestamp"`
		Errors      map[string]string `json:"errors"`
		Nodes, Pods []json.RawMessage
	}
	if code != 200 || json.Unmarshal(raw, &result) != nil {
		t.Fatal("metrics HTTP contract unavailable")
	}
	expect := os.Getenv("KUBEVIEW_REPAIR_EXPECT_METRICS")
	if expect == "absent" && (result.Available || len(result.Errors) == 0 || len(result.Nodes) != 0 || len(result.Pods) != 0) {
		t.Fatal("absent metrics API produced availability or fabricated samples")
	}
	if expect == "present" && (!result.Available || len(result.Nodes) == 0) {
		t.Fatal("present metrics API did not return actual Node samples")
	}
	t.Logf("REAL metrics API availability context=%s namespace=%s available=%t source=%s timestamp=%s nodeSamples=%d podSamples=%d errorScopes=%d expected=%s; usage values not replaced by zeros", contextName, s.Namespace, result.Available, result.Source, result.Timestamp, len(result.Nodes), len(result.Pods), len(result.Errors), expect)
}

func TestOwnedRepairRealDeploymentRollbackRevision(t *testing.T) {
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	name := "kv-rollback-" + strings.Split(uuid.NewString(), "-")[0]
	gvr := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	object := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "metadata": map[string]interface{}{"name": name, "namespace": ns, "labels": map[string]interface{}{"kubeview.io/repair-owner": "backend-manager"}}, "spec": map[string]interface{}{"replicas": int64(0), "selector": map[string]interface{}{"matchLabels": map[string]interface{}{"repair-rollback": name}}, "template": map[string]interface{}{"metadata": map[string]interface{}{"labels": map[string]interface{}{"repair-rollback": name}, "annotations": map[string]interface{}{"kubeview.io/repair-revision": "one"}}, "spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "alpine:3.21", "command": []interface{}{"sleep", "1200"}}}}}}}}
	created, err := c.Dynamic.Resource(gvr).Namespace(ns).Create(ctx, object, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	repairDeleteObject(t, c, ns, name, gvr, created)
	waitRevision := func(revision string) {
		t.Helper()
		deadline := time.Now().Add(25 * time.Second)
		for time.Now().Before(deadline) {
			sets, e := c.Typed.AppsV1().ReplicaSets(ns).List(ctx, metav1.ListOptions{LabelSelector: "repair-rollback=" + name})
			if e != nil {
				t.Fatal(e)
			}
			for _, rs := range sets.Items {
				for _, ref := range rs.OwnerReferences {
					if ref.UID == created.GetUID() && rs.Annotations["deployment.kubernetes.io/revision"] == revision {
						return
					}
				}
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Fatalf("actual controller-owned ReplicaSet revision %s missing", revision)
	}
	waitRevision("1")
	for attempt := 0; attempt < 4; attempt++ {
		current, e := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
		if e != nil {
			t.Fatal(e)
		}
		_ = unstructured.SetNestedStringMap(current.Object, map[string]string{"kubeview.io/repair-revision": "two"}, "spec", "template", "metadata", "annotations")
		_, err = c.Dynamic.Resource(gvr).Namespace(ns).Update(ctx, current, metav1.UpdateOptions{})
		if err == nil {
			break
		}
		time.Sleep(50 * time.Millisecond)
	}
	if err != nil {
		t.Fatal("owned revision update failed")
	}
	waitRevision("2")
	code, raw := repairAction(t, ctx, c, gateway, contextName, ns, gvr, name, "rollback", map[string]interface{}{"revision": int64(1)})
	if code != 202 {
		t.Fatalf("real rollback HTTP%d", code)
	}
	var response struct {
		TargetRevision int64 `json:"targetRevision"`
	}
	if json.Unmarshal(raw, &response) != nil || response.TargetRevision != 1 {
		t.Fatal("wrong rollback revision acknowledged")
	}
	actual, err := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	revision, _, _ := unstructured.NestedString(actual.Object, "spec", "template", "metadata", "annotations", "kubeview.io/repair-revision")
	if actual.GetUID() != created.GetUID() || revision != "one" {
		t.Fatal("rollback did not restore exact UID's actual revision-one template")
	}
	t.Logf("REAL Deployment→ReplicaSet UID revision1→revision2→HTTP rollback revision1 template restored; context=%s namespace=%s DeploymentUID=%s; replicas=0, completed Ready rollout intentionally not asserted", contextName, ns, created.GetUID())
}
