package server

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/gorilla/websocket"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

type releaseActiveAuthzTrackedWatch struct {
	watch.Interface
	stopped *atomic.Bool
}

func (w *releaseActiveAuthzTrackedWatch) Stop() { w.stopped.Store(true); w.Interface.Stop() }

// SYNTHETIC_API/WATCH_E2E: production Register/workspace/WS/informer/broker,
// fake upstream whose already-established watch deliberately stays open after SSAR denial.
// This is not proof of real Kubernetes watch revocation behavior.
func TestReleaseActiveWatchRevalidatesPodAuthorizationAfterHeartbeat(t *testing.T) {
	began := time.Now()
	record := func(event string, fields map[string]interface{}) {
		v := map[string]interface{}{"event": event, "at": time.Now().UTC().Format(time.RFC3339Nano), "elapsedMs": time.Since(began).Milliseconds(), "namespace": "qa", "uid": "active-watch-authz-pod-uid", "context": "test"}
		for k, x := range fields {
			v[k] = x
		}
		raw, _ := json.Marshal(v)
		t.Logf("AUTHZ_REPRO %s", raw)
	}
	f := newWorkspaceFixture(t, true)
	original := labeledPod("active-watch-authz", "active-watch-authz-pod-uid", "qa", "authz-repro")
	object, err := runtime.DefaultUnstructuredConverter.ToUnstructured(original)
	if err != nil {
		t.Fatal(err)
	}
	gvr := schemaGVR("", "v1", "pods")
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{gvr: "PodList", schemaGVR("", "v1", "nodes"): "NodeList", schemaGVR("", "v1", "secrets"): "SecretList"}, &unstructured.Unstructured{Object: object})
	f.c.Dynamic = dyn
	var denied atomic.Bool
	var denyReviews, watchStarts atomic.Int64
	var watchStopped atomic.Bool
	f.c.Typed.(*kubefake.Clientset).PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		review := action.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview)
		a := review.Spec.ResourceAttributes
		if a != nil && a.Resource == "pods" && (a.Verb == "get" || a.Verb == "list" || a.Verb == "watch") {
			allowed := !denied.Load()
			if !allowed {
				denyReviews.Add(1)
			}
			record("pod_ssar", map[string]interface{}{"verb": a.Verb, "allowed": allowed})
			return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: allowed, Reason: "synthetic-policy-toggle"}}, nil
		}
		return false, nil, nil
	})
	dyn.PrependWatchReactor("pods", func(action ktesting.Action) (bool, watch.Interface, error) {
		w, e := dyn.Tracker().Watch(action.GetResource(), action.GetNamespace())
		if e != nil {
			return true, nil, e
		}
		watchStarts.Add(1)
		record("upstream_fake_watch_started", nil)
		return true, &releaseActiveAuthzTrackedWatch{Interface: w, stopped: &watchStopped}, nil
	})
	connection := f.addConnection()
	harbor := f.addHarbor(connection, []string{"qa"}, "app=authz-repro")
	server := httptest.NewServer(f.mux)
	t.Cleanup(server.Close)
	socket := workspaceSocket(t, f, server, harbor, "active-authz-tab")
	defer func() {
		socket.Close()
		workspaceBrokerEmpty(t, f.s)
		server.Close()
		probe, e := net.DialTimeout("tcp", server.Listener.Addr().String(), 200*time.Millisecond)
		if e == nil {
			probe.Close()
			t.Error("owned httptest listener remained open")
		}
		record("cleanup", map[string]interface{}{"brokerEmpty": true, "ownedListenerClosed": e != nil, "upstreamWatchStopped": watchStopped.Load(), "loopbackAddress": server.Listener.Addr().String()})
	}()
	snapshot := workspaceRead(t, socket, "SNAPSHOT")
	if len(snapshot.Resources) != 1 || string(snapshot.Resources[0].GetUID()) != "active-watch-authz-pod-uid" {
		t.Fatal("initial scoped snapshot identity missing")
	}
	record("initial_snapshot", map[string]interface{}{"resourceCount": len(snapshot.Resources), "upstreamOpen": !watchStopped.Load(), "loopbackAddress": server.Listener.Addr().String()})
	update := func(rv, canary string) {
		p, e := dyn.Resource(gvr).Namespace("qa").Get(context.Background(), "active-watch-authz", metav1.GetOptions{})
		if e != nil {
			t.Fatal(e)
		}
		p.SetResourceVersion(rv)
		p.SetAnnotations(map[string]string{"qa.kubeview.io/watch-authz-canary": canary})
		if e = dyn.Tracker().Update(gvr, p, "qa"); e != nil {
			t.Fatal(e)
		}
	}
	matches := func(p *unstructured.Unstructured, rv, canary string) bool {
		return p != nil && string(p.GetUID()) == "active-watch-authz-pod-uid" && p.GetResourceVersion() == rv && p.GetAnnotations()["qa.kubeview.io/watch-authz-canary"] == canary
	}
	update("rv-positive-watch-control", "SYNTHETIC_BASELINE")
	positive := workspaceRead(t, socket, "RESOURCE_EVENT")
	if positive.Action != "UPDATE" || !matches(positive.Object, "rv-positive-watch-control", "SYNTHETIC_BASELINE") {
		t.Fatal("positive watched UPDATE did not reach actual websocket")
	}
	record("positive_update_observed", map[string]interface{}{"rv": "rv-positive-watch-control"})
	clientID := f.c.ID
	revokedAt := time.Now()
	denied.Store(true)
	record("ssar_policy_denied_same_identity", map[string]interface{}{"clientID": clientID, "watchStarts": watchStarts.Load(), "upstreamOpen": !watchStopped.Load()})
	for _, suffix := range []string{"", "&name=active-watch-authz"} {
		req, e := http.NewRequest("GET", server.URL+"/api/resources?resource=pods&namespace=qa&"+f.scope(harbor, "active-authz-tab")+suffix, nil)
		if e != nil {
			t.Fatal(e)
		}
		req.AddCookie(f.cookie)
		req.Header.Set("Origin", server.URL)
		response, e := (&http.Client{Timeout: 2 * time.Second}).Do(req)
		if e != nil {
			t.Fatal(e)
		}
		io.Copy(io.Discard, response.Body)
		response.Body.Close()
		record("fresh_http_negative", map[string]interface{}{"status": response.StatusCode, "namedGet": suffix != ""})
		if response.StatusCode != http.StatusForbidden {
			t.Fatal("fresh Pod read did not honor synthetic SSAR denial")
		}
	}

	// A GREEN requires explicit forbidden Pod scope and a true close; timeout is never closure.
	_ = socket.SetReadDeadline(time.Now().Add(22 * time.Second))
	failedScopeSeen, canaryInjected := false, false
	injectCanary := func() {
		if canaryInjected {
			return
		}
		canaryInjected = true
		update("rv-after-deny-heartbeat", "SYNTHETIC_POST_REVOKE_CANARY")
		record("post_heartbeat_fake_tracker_update", map[string]interface{}{"rv": "rv-after-deny-heartbeat", "watchStarts": watchStarts.Load(), "upstreamOpen": !watchStopped.Load()})
	}
	for {
		var msg envelope
		if e := socket.ReadJSON(&msg); e != nil {
			var timeout net.Error
			if errors.As(e, &timeout) && timeout.Timeout() {
				t.Fatal("timeout is not an authorization-revoked stream close")
			}
			var closed *websocket.CloseError
			if !errors.As(e, &closed) && !errors.Is(e, io.EOF) {
				t.Fatalf("unexpected stream read failure: %T", e)
			}
			if !failedScopeSeen {
				t.Fatal("stream closed without explicit forbidden non-authoritative Pod scope")
			}
			if f.c.ID != clientID || !canaryInjected {
				t.Fatal("identity changed or exact canary control was not injected")
			}
			record("strict_forbidden_status_and_closed_stream", map[string]interface{}{"sameClientID": true, "canaryInjected": true, "timeoutAccepted": false})
			return
		}
		leaked := matches(msg.Object, "rv-after-deny-heartbeat", "SYNTHETIC_POST_REVOKE_CANARY")
		for _, p := range msg.Resources {
			leaked = leaked || matches(p, "rv-after-deny-heartbeat", "SYNTHETIC_POST_REVOKE_CANARY")
		}
		if leaked {
			record("post_revoke_canary_published", map[string]interface{}{"type": msg.Type, "action": msg.Action, "uidRVAndAnnotationMatched": true, "sameClientID": f.c.ID == clientID})
			t.Fatal("authorization revoked: established websocket published exact post-heartbeat Pod UID/RV/canary")
		}
		if msg.Type == "STATUS" {
			for _, scope := range msg.Scopes {
				if scope.Resource == "pods" && scope.Namespace == "qa" && scope.Status == "forbidden" && !scope.Authoritative && !msg.Synced {
					failedScopeSeen = true
					record("explicit_forbidden_pod_scope", map[string]interface{}{"authoritative": false, "synced": false})
					injectCanary()
				}
			}
			if msg.Synced && time.Since(revokedAt) >= 14*time.Second {
				record("existing_healthy_heartbeat_after_denial", map[string]interface{}{"upstreamOpen": !watchStopped.Load(), "sameClientID": f.c.ID == clientID})
				injectCanary()
			}
		}
	}
}
