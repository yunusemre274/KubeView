package server

import (
	"bytes"
	"context"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
)

// This is real API/watch/log transport with an actual same-name Pod replacement
// deliberately interposed at request-opening boundaries. The test hook is nil in
// production; it changes timing, never replaces Kubernetes responses with mocks.
func TestOwnedRepairRealLogUIDReplacement(t *testing.T) {
	contextName := os.Getenv("KUBEVIEW_REPAIR_CONTEXT")
	expectedCluster := os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID")
	namespace := os.Getenv("KUBEVIEW_REPAIR_NAMESPACE")
	if contextName == "" || expectedCluster == "" || namespace == "" {
		t.Skip("requires explicit owned repair context, kube-system UID and namespace")
	}
	if !strings.HasPrefix(contextName, "kv-repair-") || !strings.HasPrefix(namespace, "kv-repair-") {
		t.Fatal("refusing context/namespace outside owned repair prefix")
	}
	s := New()
	s.ReadOnly = false
	s.Namespace = namespace
	s.Token = ""
	defer s.Close()
	c, err := s.client(contextName)
	if err != nil {
		t.Fatal(err)
	}
	u, err := url.Parse(c.Config.Host)
	if err != nil {
		t.Fatal(err)
	}
	ip := net.ParseIP(u.Hostname())
	if u.Hostname() != "localhost" && (ip == nil || !ip.IsLoopback()) {
		t.Fatal("owned repair log race test requires loopback API endpoint")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()
	cluster, err := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if err != nil || string(cluster.UID) != expectedCluster {
		t.Fatal("refusing unexpected cluster identity")
	}
	if _, err = c.Typed.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{}); err != nil {
		t.Fatal("owned namespace must already exist")
	}
	for _, boundary := range []string{"before-open", "before-first-publish"} {
		t.Run(boundary, func(t *testing.T) {
			name := "kv-log-race-" + strings.Split(uuid.NewString(), "-")[0]
			owner := uuid.NewString()
			known := map[types.UID]bool{}
			fixture := func(incarnation string) *corev1.Pod {
				return &corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, Labels: map[string]string{"kubeview.io/repair-test": "log-uid-race", "kubeview.io/repair-owner": owner}}, Spec: corev1.PodSpec{RestartPolicy: corev1.RestartPolicyNever, Containers: []corev1.Container{{Name: "app", Image: "alpine:3.21", ImagePullPolicy: corev1.PullIfNotPresent, Command: []string{"sh", "-c", "echo " + incarnation + "; sleep 1200"}}}}}
			}
			old, err := c.Typed.CoreV1().Pods(namespace).Create(ctx, fixture("REPAIR_OLD_INCARNATION"), metav1.CreateOptions{})
			if err != nil {
				t.Fatal(err)
			}
			known[old.UID] = true
			t.Cleanup(func() {
				cleanupCtx, done := context.WithTimeout(context.Background(), 20*time.Second)
				defer done()
				current, e := c.Typed.CoreV1().Pods(namespace).Get(cleanupCtx, name, metav1.GetOptions{})
				if apierrors.IsNotFound(e) {
					return
				}
				if e != nil {
					t.Errorf("own cleanup lookup: %v", e)
					return
				}
				if !known[current.UID] || current.Labels["kubeview.io/repair-owner"] != owner {
					t.Error("refusing cleanup of unowned replacement")
					return
				}
				zero := int64(0)
				if e = c.Typed.CoreV1().Pods(namespace).Delete(cleanupCtx, name, metav1.DeleteOptions{GracePeriodSeconds: &zero, Preconditions: &metav1.Preconditions{UID: &current.UID}}); e != nil && !apierrors.IsNotFound(e) {
					t.Errorf("own cleanup: %v", e)
				}
			})
			waitRunning := func() error {
				deadline := time.Now().Add(50 * time.Second)
				for time.Now().Before(deadline) {
					p, e := c.Typed.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
					if e == nil && p.Status.Phase == corev1.PodRunning {
						return nil
					}
					select {
					case <-ctx.Done():
						return ctx.Err()
					case <-time.After(200 * time.Millisecond):
					}
				}
				return context.DeadlineExceeded
			}
			if err = waitRunning(); err != nil {
				t.Fatal("initial owned Pod did not run")
			}
			type replacementResult struct {
				uid types.UID
				err error
			}
			replaced := make(chan replacementResult, 1)
			s.logOpenStage = func(stage string) {
				if stage != boundary {
					return
				}
				zero := int64(0)
				e := c.Typed.CoreV1().Pods(namespace).Delete(ctx, name, metav1.DeleteOptions{GracePeriodSeconds: &zero, Preconditions: &metav1.Preconditions{UID: &old.UID}})
				if e != nil {
					replaced <- replacementResult{err: e}
					return
				}
				deadline := time.Now().Add(20 * time.Second)
				for time.Now().Before(deadline) {
					_, e = c.Typed.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
					if apierrors.IsNotFound(e) {
						break
					}
					time.Sleep(100 * time.Millisecond)
				}
				next, e := c.Typed.CoreV1().Pods(namespace).Create(ctx, fixture("REPAIR_NEW_INCARNATION"), metav1.CreateOptions{})
				if e != nil {
					replaced <- replacementResult{err: e}
					return
				}
				known[next.UID] = true
				if e = waitRunning(); e != nil {
					replaced <- replacementResult{uid: next.UID, err: e}
					return
				}
				replaced <- replacementResult{uid: next.UID}
			}
			mux := http.NewServeMux()
			s.Register(mux)
			h := httptest.NewServer(mux)
			defer h.Close()
			q := url.Values{"context": {contextName}, "namespace": {namespace}, "pod": {name}, "container": {"app"}, "uid": {string(old.UID)}, "session": {"real-replacement-" + boundary}, "follow": {"false"}}
			request, err := http.NewRequestWithContext(ctx, "GET", h.URL+"/api/logs?"+q.Encode(), nil)
			if err != nil {
				t.Fatal(err)
			}
			response, err := http.DefaultClient.Do(request)
			if err != nil {
				t.Fatal(err)
			}
			raw, err := io.ReadAll(response.Body)
			response.Body.Close()
			if err != nil {
				t.Fatal(err)
			}
			var next replacementResult
			select {
			case next = <-replaced:
			case <-ctx.Done():
				t.Fatal("real replacement hook did not finish")
			}
			if next.err != nil {
				t.Fatalf("owned real replacement failed: %v", next.err)
			}
			if next.uid == old.UID {
				t.Fatal("replacement reused UID")
			}
			if bytes.Contains(raw, []byte("REPAIR_NEW_INCARNATION")) {
				t.Fatal("real replacement logs escaped old selected Pod UID")
			}
			if boundary == "before-open" && response.StatusCode != 409 {
				t.Fatalf("real opening replacement HTTP%d", response.StatusCode)
			}
			if boundary == "before-first-publish" && (response.StatusCode != 200 || !bytes.Contains(raw, []byte("KUBEVIEW_LOG_ERROR:"))) {
				t.Fatal("real first-chunk replacement did not produce guarded stream failure")
			}
			t.Logf("REAL API/watch/log race boundary=%s context=%s namespace=%s oldUID=%s newUID=%s HTTP=%d; new-incarnation bytes withheld; Kubernetes log endpoint remains non-atomic", boundary, contextName, namespace, old.UID, next.uid, response.StatusCode)
		})
	}
}
