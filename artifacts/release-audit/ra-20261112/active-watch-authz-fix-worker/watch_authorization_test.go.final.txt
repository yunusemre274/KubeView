package server

import (
	"context"
	"errors"
	"fmt"
	"io"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/client-go/util/flowcontrol"
	"net"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func TestWatchAuthorizationReviewDecisions(t *testing.T) {
	scopes := []ResourceScope{{Version: "v1", Resource: "pods", Kind: "Pod", Namespace: "qa"}, {Version: "v1", Resource: "pods", Kind: "Pod", Namespace: "qa"}, {Version: "v1", Resource: "pods", Kind: "Pod", Namespace: "other"}}
	for _, tc := range []struct {
		name, denyVerb string
		transport      bool
	}{{"allowed", "", false}, {"list-denied", "list", false}, {"watch-denied", "watch", false}, {"api-error", "list", true}} {
		t.Run(tc.name, func(t *testing.T) {
			var calls []string
			failure := reviewWatchAuthorization(context.Background(), scopes, func(ctx context.Context, s ResourceScope, verb string) error {
				calls = append(calls, verb+":"+s.Namespace)
				if verb == tc.denyVerb {
					return errors.New("synthetic review failure")
				}
				return nil
			}, nil)
			if tc.denyVerb == "" {
				if failure != nil || len(calls) != 4 {
					t.Fatalf("allowed/dedup: failure=%v calls=%v", failure, calls)
				}
			} else if failure == nil || failure.Scope.Namespace != "qa" || len(calls) > 2 {
				t.Fatalf("did not stop exact failed scope: %v %v", failure, calls)
			}
		})
	}
	t.Run("parent-cancel", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel()
		calls := 0
		failure := reviewWatchAuthorization(ctx, scopes, func(context.Context, ResourceScope, string) error { calls++; return nil }, nil)
		if failure == nil || !errors.Is(failure.Err, context.Canceled) || calls != 0 {
			t.Fatal("cancelled parent performed review")
		}
	})
	t.Run("whole-batch-deadline", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 55*time.Millisecond)
		defer cancel()
		var deadlines []time.Time
		failure := reviewWatchAuthorization(ctx, scopes, func(ctx context.Context, _ ResourceScope, _ string) error {
			deadline, _ := ctx.Deadline()
			deadlines = append(deadlines, deadline)
			select {
			case <-time.After(20 * time.Millisecond):
				return nil
			case <-ctx.Done():
				return ctx.Err()
			}
		}, nil)
		if failure == nil || !errors.Is(failure.Err, context.DeadlineExceeded) || len(deadlines) > 3 {
			t.Fatal("whole batch budget not enforced", failure, len(deadlines))
		}
		for _, deadline := range deadlines {
			if deadline != deadlines[0] {
				t.Fatal("per-call deadline replaced whole-batch deadline")
			}
		}
	})
}

func TestWatchAuthorizationExactPermissionAttributes(t *testing.T) {
	typed := kubefake.NewSimpleClientset()
	c := &Clients{Typed: typed}
	var requests []authv1.ResourceAttributes
	typed.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		a := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview).Spec.ResourceAttributes
		requests = append(requests, *a)
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: true}}, nil
	})
	scopes := []ResourceScope{{Group: "apps", Version: "v1", Resource: "deployments", Namespace: "qa"}, {Version: "v1", Resource: "pods", Namespace: "other"}, {Version: "v1", Resource: "pods", Namespace: "*"}, {Version: "v1", Resource: "nodes", Namespace: ""}}
	if failure := reviewWatchAuthorization(context.Background(), scopes, func(ctx context.Context, s ResourceScope, verb string) error {
		return reviewWatchPermission(ctx, c, s, verb)
	}, nil); failure != nil {
		t.Fatal(failure)
	}
	if len(requests) != 8 {
		t.Fatal("list/watch not both reviewed", len(requests))
	}
	for i, scope := range scopes {
		namespace := scope.Namespace
		if namespace == "*" {
			namespace = ""
		}
		for j, verb := range []string{"list", "watch"} {
			a := requests[2*i+j]
			if a.Namespace != namespace || a.Group != scope.Group || a.Resource != scope.Resource || a.Verb != verb || a.Name != "" || a.Subresource != "" {
				t.Fatal("permission scope broadened", a)
			}
		}
	}
}

func TestWatchAuthorizationPermissionDenialAndError(t *testing.T) {
	for _, mode := range []string{"list", "watch", "transport"} {
		t.Run(mode, func(t *testing.T) {
			typed := kubefake.NewSimpleClientset()
			typed.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
				verb := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview).Spec.ResourceAttributes.Verb
				if mode == "transport" {
					return true, nil, errors.New("synthetic transport unavailable")
				}
				return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: verb != mode}}, nil
			})
			c := &Clients{Typed: typed}
			failure := reviewWatchAuthorization(context.Background(), []ResourceScope{{Version: "v1", Resource: "pods", Namespace: "qa"}}, func(ctx context.Context, s ResourceScope, verb string) error {
				return reviewWatchPermission(ctx, c, s, verb)
			}, nil)
			if failure == nil {
				t.Fatal("denied/error decision succeeded")
			}
			scope := failure.Scope
			scopeError(&scope, failure.Err)
			want := "forbidden"
			if mode == "transport" {
				want = "unavailable"
			}
			if scope.Status != want || scope.Authoritative || mode != "transport" && !apierrors.IsForbidden(failure.Err) {
				t.Fatal("wrong permission failure classification", scope)
			}
		})
	}
}

func TestWatchAuthorizationCapacityBudget(t *testing.T) {
	if watchAuthorizationBudgetForScopes(nil) != 5*time.Second {
		t.Fatal("empty batch margin")
	}
	scopes := []ResourceScope{{Version: "v1", Resource: "nodes", Kind: "Node"}}
	for i := 0; i < 64; i++ {
		for _, resource := range []string{"pods", "secrets"} {
			scopes = append(scopes, ResourceScope{Version: "v1", Resource: resource, Namespace: fmt.Sprintf("ns-%02d", i)})
		}
	}
	if len(uniqueWatchAuthorizationScopes(scopes)) != 129 {
		t.Fatal("normal64namespace scope grid")
	}
	budget := watchAuthorizationBudgetForScopes(scopes)
	if budget != 13600*time.Millisecond {
		t.Fatal("normal scope budget", budget)
	}
	maxScopes := make([]ResourceScope, 512)
	for i := range maxScopes {
		maxScopes[i] = ResourceScope{Version: "v1", Resource: fmt.Sprintf("resource-%03d", i), Namespace: "qa"}
	}
	if b := watchAuthorizationBudgetForScopes(maxScopes); b <= 39*time.Second || b >= 40*time.Second {
		t.Fatal("broker512 finite budget", b)
	}
	// Exercise the actual client-go30QPS/60Burst limiter, deliberately emptied.
	limiter := flowcontrol.NewTokenBucketRateLimiter(30, 60)
	defer limiter.Stop()
	for i := 0; i < 60; i++ {
		if !limiter.TryAccept() {
			t.Fatal("initial burst unavailable")
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), budget)
	defer cancel()
	calls := 0
	began := time.Now()
	failure := reviewWatchAuthorization(ctx, scopes, func(ctx context.Context, _ ResourceScope, _ string) error { calls++; return limiter.Wait(ctx) }, nil)
	if failure != nil || calls != 258 {
		t.Fatalf("all-allowed valid namespace scope falsely timed out: calls=%d failure=%v", calls, failure)
	}
	if time.Since(began) <= 5*time.Second {
		t.Fatal("rate limiter did not exercise beyond original5s budget")
	}
	t.Logf("CAPACITY uniqueScopes=129 SSARChecks=%d actualLimiter=30/60 emptiedBucket elapsed=%s budget=%s broker512Budget=%s", calls, time.Since(began), budget, watchAuthorizationBudgetForScopes(maxScopes))
}

func TestWatchAuthorizationBatchDeadlineAndBufferedCancel(t *testing.T) {
	scopes := []ResourceScope{{Version: "v1", Resource: "pods", Namespace: "qa"}}
	entered, release := make(chan struct{}), make(chan struct{})
	var failureNotified atomic.Bool
	b := startWatchAuthorizationBatch(context.Background(), scopes, 25*time.Millisecond, func(context.Context, ResourceScope, string) error { close(entered); <-release; return nil }, func(*watchAuthorizationFailure) { failureNotified.Store(true) })
	<-entered
	<-b.ctx.Done()
	if b.expired() == nil {
		t.Fatal("writer did not observe stalled whole-batch deadline")
	}
	close(release)
	select {
	case failure := <-b.result:
		if failure == nil || !failureNotified.Load() {
			t.Fatal("failure publication stop did not precede result")
		}
	case <-time.After(time.Second):
		t.Fatal("batch goroutine did not finish")
	}
	b.cancel()
	ctx, cancel := context.WithCancel(context.Background())
	notified := make(chan struct{})
	b = startWatchAuthorizationBatch(ctx, scopes, time.Second, func(ctx context.Context, _ ResourceScope, _ string) error { <-ctx.Done(); return ctx.Err() }, func(*watchAuthorizationFailure) { close(notified) })
	cancel()
	<-notified
	select {
	case failure := <-b.result:
		if failure == nil || !errors.Is(failure.Err, context.Canceled) {
			t.Fatal("cancelled batch reported success")
		}
	case <-time.After(time.Second):
		t.Fatal("buffered result/cancellation stuck")
	}
	b.cancel()
}

// Real loopback WS, fake API. A pending network review must not pause healthy
// data, and denial of one namespace/consumer must not cancel its allowed peer.
func TestWatchAuthorizationPendingReviewFlowsAndSiblingSurvives(t *testing.T) {
	f := newWorkspaceFixture(t, true)
	objects := []runtime.Object{}
	for _, p := range []*unstructured.Unstructured{{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": "watched", "namespace": "qa", "uid": "watch-qa", "resourceVersion": "rv-initial", "labels": map[string]interface{}{"app": "a"}}}}, {Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": "watched", "namespace": "other", "uid": "watch-other", "resourceVersion": "rv-initial", "labels": map[string]interface{}{"app": "a"}}}}} {
		objects = append(objects, p)
	}
	gvr := schemaGVR("", "v1", "pods")
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{gvr: "PodList", schemaGVR("", "v1", "nodes"): "NodeList", schemaGVR("", "v1", "secrets"): "SecretList"}, objects...)
	f.c.Dynamic = dyn
	var block, deny atomic.Bool
	entered, release := make(chan struct{}), make(chan struct{})
	var enterOnce, releaseOnce sync.Once
	unblock := func() { releaseOnce.Do(func() { close(release) }) }
	t.Cleanup(unblock)
	f.c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		a := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview).Spec.ResourceAttributes
		if a != nil && a.Resource == "pods" && a.Namespace == "qa" {
			if block.Load() {
				enterOnce.Do(func() { close(entered) })
				<-release
			}
			return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: !deny.Load()}}, nil
		}
		return false, nil, nil
	})
	connection := f.addConnection()
	qa := f.addHarbor(connection, []string{"qa"}, "app=a")
	other := f.addHarbor(connection, []string{"other"}, "app=a")
	server := httptest.NewServer(f.mux)
	t.Cleanup(server.Close)
	q := workspaceSocket(t, f, server, qa, "q")
	o := workspaceSocket(t, f, server, other, "o")
	defer func() { unblock(); q.Close(); o.Close(); workspaceBrokerEmpty(t, f.s); server.Close() }()
	workspaceRead(t, q, "SNAPSHOT")
	workspaceRead(t, o, "SNAPSHOT")
	update := func(namespace, rv string) {
		p, err := dyn.Resource(gvr).Namespace(namespace).Get(context.Background(), "watched", metav1.GetOptions{})
		if err != nil {
			t.Fatal(err)
		}
		p.SetResourceVersion(rv)
		if _, err = dyn.Resource(gvr).Namespace(namespace).Update(context.Background(), p, metav1.UpdateOptions{}); err != nil {
			t.Fatal(err)
		}
	}
	readRV := func(socket *websocket.Conn, uid, rv string) {
		t.Helper()
		socket.SetReadDeadline(time.Now().Add(2 * time.Second))
		for {
			var msg envelope
			if err := socket.ReadJSON(&msg); err != nil {
				t.Fatal("healthy consumer did not publish while review pending", err)
			}
			if msg.Object != nil && string(msg.Object.GetUID()) == uid && msg.Object.GetResourceVersion() == rv {
				return
			}
		}
	}
	block.Store(true)
	select {
	case <-entered:
	case <-time.After(17 * time.Second):
		t.Fatal("heartbeat did not begin bounded review")
	}
	update("qa", "rv-healthy-while-pending")
	readRV(q, "watch-qa", "rv-healthy-while-pending")
	t.Log("healthy UPDATE published while SSAR review remained blocked")
	deny.Store(true)
	unblock()
	q.SetReadDeadline(time.Now().Add(3 * time.Second))
	for {
		var msg envelope
		if err := q.ReadJSON(&msg); err != nil {
			t.Fatal("missing terminal forbidden scope", err)
		}
		for _, scope := range msg.Scopes {
			if msg.Type == "STATUS" && scope.Resource == "pods" && scope.Namespace == "qa" && scope.Status == "forbidden" && !scope.Authoritative && !msg.Synced {
				goto forbidden
			}
		}
	}
forbidden:
	update("qa", "rv-after-known-denial")
	q.SetReadDeadline(time.Now().Add(2 * time.Second))
	for {
		var msg envelope
		err := q.ReadJSON(&msg)
		if err != nil {
			var timeout net.Error
			if errors.As(err, &timeout) && timeout.Timeout() {
				t.Fatal("timeout is not closed")
			}
			var closed *websocket.CloseError
			if !errors.As(err, &closed) && !errors.Is(err, io.EOF) {
				t.Fatal(err)
			}
			break
		}
		if msg.Object != nil && msg.Object.GetResourceVersion() == "rv-after-known-denial" {
			t.Fatal("known denial published queued/new resource")
		}
	}
	update("other", "rv-authorized-sibling")
	readRV(o, "watch-other", "rv-authorized-sibling")
	f.s.watches.mu.Lock()
	remaining := len(f.s.watches.entries)
	f.s.watches.mu.Unlock()
	if remaining == 0 {
		t.Fatal("denial cancelled authorized sibling's broker")
	}
}

func TestWatchAuthorizationFailureStatus(t *testing.T) {
	for _, tc := range []struct {
		name      string
		err       error
		reachable bool
		status    string
	}{
		{"denied", apierrors.NewForbidden(schema.GroupResource{Resource: "pods"}, "", errors.New("denied")), true, "forbidden"},
		{"unauthorized", apierrors.NewUnauthorized("synthetic"), true, "forbidden"},
		{"deadline", context.DeadlineExceeded, false, "unavailable"},
		{"transport", errors.New("synthetic transport error"), false, "unavailable"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			msg := watchAuthorizationFailureStatus(&watchAuthorizationFailure{Scope: ResourceScope{Version: "v1", Resource: "pods", Kind: "Pod", Namespace: "qa", Authoritative: true}, Err: tc.err})
			if msg.Type != "STATUS" || msg.Synced || msg.SnapshotReady || msg.Reachable != tc.reachable || len(msg.Scopes) != 1 || msg.Scopes[0].Authoritative || msg.Scopes[0].Status != tc.status || msg.Scopes[0].Namespace != "qa" || msg.Scopes[0].Resource != "pods" {
				t.Fatal("terminal scope/reachability incorrect", msg)
			}
		})
	}
}
