package server

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Opt-in real Kubernetes proof. The existing owned gateway helper verifies the
// explicit cluster UID, context prefix, loopback API and namespace owner before
// any fixture is created. The additional namespace UID prevents name reuse.
func TestOwnedV11RealLogRoles(t *testing.T) {
	expectedNamespace := os.Getenv("KUBEVIEW_REPAIR_NAMESPACE_UID")
	if expectedNamespace == "" {
		t.Skip("requires explicit owned KUBEVIEW_REPAIR_NAMESPACE_UID")
	}
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	namespace, err := c.Typed.CoreV1().Namespaces().Get(ctx, ns, metav1.GetOptions{})
	if err != nil || string(namespace.UID) != expectedNamespace {
		t.Fatal("refusing unexpected namespace UID")
	}
	owner := uuid.NewString()
	name := "kv-v11-log-roles-" + strings.Split(owner, "-")[0]
	grace := int64(1)
	pod, err := c.Typed.CoreV1().Pods(ns).Create(ctx, &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: map[string]string{"kubeview.io/repair-owner": owner, "kubeview.io/v11-owner": "v11-20261108"}},
		Spec: corev1.PodSpec{
			TerminationGracePeriodSeconds: &grace,
			RestartPolicy:                 corev1.RestartPolicyAlways,
			Volumes:                       []corev1.Volume{{Name: "restart-state", VolumeSource: corev1.VolumeSource{EmptyDir: &corev1.EmptyDirVolumeSource{}}}},
			InitContainers:                []corev1.Container{{Name: "prepare", Image: "alpine:3.21", Command: []string{"sh", "-c", "echo V11_LOG_INIT_COMPLETED"}}},
			Containers: []corev1.Container{
				{Name: "app", Image: "alpine:3.21", Command: []string{"sh", "-c", "echo V11_LOG_APP_CURRENT; sleep 1200"}},
				{Name: "restart-once", Image: "alpine:3.21", VolumeMounts: []corev1.VolumeMount{{Name: "restart-state", MountPath: "/state"}}, Command: []string{"sh", "-c", "if [ ! -f /state/restarted ]; then touch /state/restarted; echo V11_LOG_RESTART_PREVIOUS; exit 42; fi; echo V11_LOG_RESTART_CURRENT; sleep 1200"}},
			},
		},
	}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal("owned log-role Pod create failed")
	}
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 20*time.Second)
		defer cancel()
		for attempt := 0; attempt < 4; attempt++ {
			current, e := c.Typed.CoreV1().Pods(ns).Get(cleanup, name, metav1.GetOptions{})
			if apierrors.IsNotFound(e) {
				return
			}
			if e != nil || current.UID != pod.UID || current.Labels["kubeview.io/repair-owner"] != owner {
				t.Error("refusing log-role cleanup after identity/ownership change")
				return
			}
			zero, uid, rv := int64(0), current.UID, current.ResourceVersion
			e = c.Typed.CoreV1().Pods(ns).Delete(cleanup, name, metav1.DeleteOptions{GracePeriodSeconds: &zero, Preconditions: &metav1.Preconditions{UID: &uid, ResourceVersion: &rv}})
			if apierrors.IsConflict(e) {
				continue
			}
			if e != nil && !apierrors.IsNotFound(e) {
				t.Error("owned log-role cleanup delete failed")
				return
			}
			for cleanup.Err() == nil {
				_, e = c.Typed.CoreV1().Pods(ns).Get(cleanup, name, metav1.GetOptions{})
				if apierrors.IsNotFound(e) {
					t.Logf("REAL log-role cleanup GET404 PodUID=%s; UID/RV/owner preconditions verified", uid)
					return
				}
				time.Sleep(100 * time.Millisecond)
			}
			t.Error("owned log-role cleanup did not reach GET404")
			return
		}
		t.Error("owned log-role cleanup repeatedly conflicted")
	})
	deadline := time.Now().Add(70 * time.Second)
	var ready *corev1.Pod
	for time.Now().Before(deadline) {
		current, e := c.Typed.CoreV1().Pods(ns).Get(ctx, name, metav1.GetOptions{})
		if e != nil || current.UID != pod.UID {
			t.Fatal("log-role fixture identity lost")
		}
		initDone, appRunning, restarted := false, false, false
		for _, status := range current.Status.InitContainerStatuses {
			initDone = initDone || status.Name == "prepare" && status.State.Terminated != nil && status.State.Terminated.ExitCode == 0
		}
		for _, status := range current.Status.ContainerStatuses {
			appRunning = appRunning || status.Name == "app" && status.State.Running != nil
			restarted = restarted || status.Name == "restart-once" && status.State.Running != nil && status.RestartCount == 1 && status.LastTerminationState.Terminated != nil && status.LastTerminationState.Terminated.ExitCode == 42
		}
		if initDone && appRunning && restarted {
			ready = current
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if ready == nil {
		t.Fatal("real app/init/restart-count conditions not reached")
	}
	ready.Spec.EphemeralContainers = []corev1.EphemeralContainer{{EphemeralContainerCommon: corev1.EphemeralContainerCommon{Name: "debug-role", Image: "alpine:3.21", Command: []string{"sh", "-c", "echo V11_LOG_EPHEMERAL_CURRENT; sleep 1200"}}, TargetContainerName: "app"}}
	if _, err = c.Typed.CoreV1().Pods(ns).UpdateEphemeralContainers(ctx, name, ready, metav1.UpdateOptions{}); err != nil {
		t.Fatal("owned Pod ephemeral container update failed")
	}
	deadline = time.Now().Add(35 * time.Second)
	ephemeralRunning := false
	for time.Now().Before(deadline) {
		current, e := c.Typed.CoreV1().Pods(ns).Get(ctx, name, metav1.GetOptions{})
		if e != nil || current.UID != pod.UID {
			t.Fatal("ephemeral fixture identity lost")
		}
		for _, status := range current.Status.EphemeralContainerStatuses {
			ephemeralRunning = ephemeralRunning || status.Name == "debug-role" && status.State.Running != nil
		}
		if ephemeralRunning {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if !ephemeralRunning {
		t.Fatal("actual ephemeral container did not run")
	}
	operator := ctx.Value(integrationOperatorKey{}).(integrationOperator)
	cases := []struct {
		role, container, marker string
		previous                bool
	}{
		{"app-current", "app", "V11_LOG_APP_CURRENT", false},
		{"init-completed", "prepare", "V11_LOG_INIT_COMPLETED", false},
		{"ephemeral-current", "debug-role", "V11_LOG_EPHEMERAL_CURRENT", false},
		{"restarted-app-current", "restart-once", "V11_LOG_RESTART_CURRENT", false},
		{"app-previous", "restart-once", "V11_LOG_RESTART_PREVIOUS", true},
	}
	for _, item := range cases {
		t.Run(item.role, func(t *testing.T) {
			previous := "false"
			if item.previous {
				previous = "true"
			}
			session := "v11-role-" + item.role
			query := url.Values{"context": {contextName}, "namespace": {ns}, "pod": {name}, "container": {item.container}, "uid": {string(pod.UID)}, "session": {session}, "previous": {previous}, "follow": {"false"}}
			request, e := http.NewRequestWithContext(ctx, "GET", gateway+"/api/logs?"+query.Encode(), nil)
			if e != nil {
				t.Fatal("log request could not be constructed")
			}
			operator.apply(request)
			response, e := http.DefaultClient.Do(request)
			if e != nil {
				t.Fatal("actual gateway log request failed")
			}
			data, e := io.ReadAll(io.LimitReader(response.Body, 64<<10))
			response.Body.Close()
			if e != nil || response.StatusCode != 200 || !bytes.Contains(data, []byte(item.marker)) || bytes.Contains(data, []byte("KUBEVIEW_LOG_ERROR:")) {
				t.Fatalf("real %s log contract failed HTTP%d", item.role, response.StatusCode)
			}
			if response.Header.Get("X-KubeView-Pod-UID") != string(pod.UID) || response.Header.Get("X-KubeView-Log-Session") != session || response.Header.Get("X-KubeView-Log-Protocol") != "guarded-text-v1" {
				t.Fatal("real log response identity/protocol headers mismatched")
			}
			for _, other := range cases {
				if other.marker != item.marker && bytes.Contains(data, []byte(other.marker)) {
					t.Fatal("another container or previous/current instance escaped into selected log")
				}
			}
			t.Logf("REAL role=%s rawContainer=%s previous=%t PodUID=%s namespaceUID=%s bytes=%d; source=Kubernetes pods/log; UID/session/protocol headers verified; log payload omitted", item.role, item.container, item.previous, pod.UID, namespace.UID, len(data))
		})
	}
	t.Logf("REAL role identity observed from spec/status: init prepare terminated exit0; app running; restart-once restartCount=1 lastExitCode=42 and current running; debug-role in spec.ephemeralContainers/status.ephemeralContainerStatuses running; same PodUID=%s", pod.UID)
}
