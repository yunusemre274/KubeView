package server

import (
	"context"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/tools/cache"
)

func (s *Server) metrics(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	if c.Metrics == nil {
		jsonResponse(w, 200, map[string]interface{}{"available": false, "source": "metrics.k8s.io", "timestamp": time.Now().UTC().Format(time.RFC3339), "nodes": []interface{}{}, "pods": []interface{}{}, "error": "Metrics API kullanılamıyor"})
		return
	}
	nodes, nodeErr := c.Metrics.MetricsV1beta1().NodeMetricses().List(ctx, metav1.ListOptions{})
	namespaces := []string{ns}
	scope := workspaceScopeFrom(ctx)
	if scope != nil && ns == "" && scope.harbor.Namespaces[0] != "*" {
		namespaces = scope.harbor.Namespaces
	}
	pods, podErr := c.Metrics.MetricsV1beta1().PodMetricses(namespaces[0]).List(ctx, metav1.ListOptions{})
	if podErr == nil {
		for _, namespace := range namespaces[1:] {
			list, e := c.Metrics.MetricsV1beta1().PodMetricses(namespace).List(ctx, metav1.ListOptions{})
			if e != nil {
				podErr = e
				break
			}
			pods.Items = append(pods.Items, list.Items...)
		}
	}
	if podErr == nil && scope != nil {
		items := pods.Items[:0]
		for _, metric := range pods.Items {
			if !scope.allowsNamespace(metric.Namespace) {
				continue
			}
			obj, e := baseWorkspaceClient(c).Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace(metric.Namespace).Get(ctx, metric.Name, metav1.GetOptions{})
			if e == nil && s.scopeContains(ctx, baseWorkspaceClient(c), scope, obj, 0) {
				items = append(items, metric)
			}
		}
		pods.Items = items
	}
	result := map[string]interface{}{"available": nodeErr == nil || podErr == nil, "source": "metrics.k8s.io", "timestamp": time.Now().UTC().Format(time.RFC3339), "nodes": []interface{}{}, "pods": []interface{}{}}
	errors := map[string]string{}
	if nodeErr == nil {
		result["nodes"] = nodes.Items
	} else {
		errors["nodes"] = safeError(nodeErr)
	}
	if podErr == nil {
		result["pods"] = pods.Items
	} else {
		errors["pods"] = safeError(podErr)
	}
	if len(errors) > 0 {
		result["errors"] = errors
		result["error"] = "metrics-server ölçümleri eksik veya erişilemiyor"
	}
	jsonResponse(w, 200, result)
}
func (s *Server) logs(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		problem(w, 405, "GET gerekli")
		return
	}
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	q := r.URL.Query()
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	pod := q.Get("pod")
	if ns == "" || pod == "" {
		problem(w, 400, "Ham Pod adı ve namespace gerekli")
		return
	}
	if err = s.authorize(r.Context(), c, "get", "", "pods", "log", ns, pod); err != nil {
		failure(w, err)
		return
	}
	tail := int64(150)
	if raw := q.Get("tailLines"); raw != "" {
		tail, err = strconv.ParseInt(raw, 10, 64)
		if err != nil || tail < 1 || tail > 10000 {
			problem(w, 400, "tailLines 1–10000 arasında olmalı")
			return
		}
	}
	opts := &corev1.PodLogOptions{Container: q.Get("container"), Follow: q.Get("follow") == "true", Previous: q.Get("previous") == "true", Timestamps: q.Get("timestamps") != "false", TailLines: &tail}
	expectedUID := q.Get("uid")
	if expectedUID == "" || len(expectedUID) > 128 {
		problem(w, 400, "Log için beklenen Pod UID gerekli")
		return
	}
	session, err := logSessionName(q.Get("session"))
	if err != nil {
		failure(w, err)
		return
	}
	for _, verb := range []string{"get", "watch"} {
		if err = s.authorize(r.Context(), c, verb, "", "pods", "", ns, pod); err != nil {
			failure(w, err)
			return
		}
	}
	before, err := c.Typed.CoreV1().Pods(ns).Get(r.Context(), pod, metav1.GetOptions{})
	if err != nil {
		failure(w, err)
		return
	}
	if string(before.UID) != expectedUID {
		problem(w, 409, "Pod UID değişti; kaynağı yeniden seçin")
		return
	}
	containerFound := false
	for _, container := range before.Spec.Containers {
		containerFound = containerFound || container.Name == opts.Container
	}
	for _, container := range before.Spec.InitContainers {
		containerFound = containerFound || container.Name == opts.Container
	}
	for _, container := range before.Spec.EphemeralContainers {
		containerFound = containerFound || container.Name == opts.Container
	}
	if !containerFound {
		problem(w, 422, "Seçili container bu Pod UID içinde bulunamadı")
		return
	}
	guard, err := startPodLogGuard(r.Context(), c, before)
	if err != nil {
		failure(w, err)
		return
	}
	defer guard.close()
	if s.logOpenStage != nil {
		s.logOpenStage("before-open")
	}
	opener := s.openLogStream
	if opener == nil {
		opener = openKubernetesLogs
	}
	stream, err := opener(guard.ctx, c, ns, pod, opts)
	if err != nil {
		if guarded := guard.err(); guarded != nil {
			err = guarded
		}
		failure(w, err)
		return
	}
	defer stream.Close()
	streamDone := make(chan struct{})
	defer close(streamDone)
	go func() {
		select {
		case <-guard.ctx.Done():
			stream.Close()
		case <-streamDone:
		}
	}()
	if s.logOpenStage != nil {
		s.logOpenStage("after-open")
	}
	if err = guard.check(); err != nil {
		failure(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-Accel-Buffering", "no")
	w.Header().Set("X-KubeView-Pod-UID", expectedUID)
	w.Header().Set("X-KubeView-Log-Session", session)
	w.Header().Set("X-KubeView-Log-Protocol", "guarded-text-v1")
	w.Header().Set("X-KubeView-Log-Guarantee", "observed-uid-guard; Kubernetes log API has no atomic UID precondition")
	w.WriteHeader(200)
	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
	buf := make([]byte, 8192)
	first := true
	for {
		n, e := stream.Read(buf)
		if guarded := guard.err(); guarded != nil {
			writeLogSessionError(w, session, guarded)
			return
		}
		if n > 0 {
			// Hold only this first bounded chunk until identity is checked again.
			// An adversarial replacement between GET and upstream /log opening
			// must not publish the replacement's first bytes to the old session.
			if first {
				first = false
				if s.logOpenStage != nil {
					s.logOpenStage("before-first-publish")
				}
				if err = guard.check(); err != nil {
					writeLogSessionError(w, session, err)
					return
				}
			}
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				return
			}
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
		if e != nil {
			if e != io.EOF && r.Context().Err() == nil {
				writeLogSessionError(w, session, e)
			}
			return
		}
	}

}

// Watch kinds are broad enough for the primary UI. Other installed APIs remain
// discoverable and use the generic explorer; no custom resource type is invented.
var watchKinds = map[string]bool{"Node": true, "Namespace": true, "Pod": true, "Deployment": true, "ReplicaSet": true, "StatefulSet": true, "DaemonSet": true, "Job": true, "CronJob": true, "Service": true, "EndpointSlice": true, "Ingress": true, "NetworkPolicy": true, "PersistentVolumeClaim": true, "PersistentVolume": true, "StorageClass": true, "ConfigMap": true, "Secret": true, "ServiceAccount": true, "Role": true, "ClusterRole": true, "RoleBinding": true, "ClusterRoleBinding": true, "HorizontalPodAutoscaler": true, "PodDisruptionBudget": true, "ResourceQuota": true, "LimitRange": true, "Event": true, "CustomResourceDefinition": true}

type envelope struct {
	OutOfScope           []*unstructured.Unstructured `json:"outOfScope,omitempty"`
	WorkspaceID          string                       `json:"workspaceId,omitempty"`
	HarborID             string                       `json:"harborId,omitempty"`
	TabID                string                       `json:"tabId,omitempty"`
	ConnectionRef        string                       `json:"connectionRef,omitempty"`
	AuthorizationKey     string                       `json:"authorizationKey,omitempty"`
	CredentialGeneration string                       `json:"credentialGeneration,omitempty"`
	SessionGeneration    string                       `json:"sessionGeneration,omitempty"`
	Type                 string                       `json:"type"`
	Context              string                       `json:"context,omitempty"`
	Scopes               []ResourceScope              `json:"scopes"`
	Scope                *ResourceScope               `json:"scope,omitempty"`
	Generation           string                       `json:"generation"`
	Timestamp            string                       `json:"timestamp"`
	Action               string                       `json:"action,omitempty"`
	Object               *unstructured.Unstructured   `json:"object,omitempty"`
	Resources            []*unstructured.Unstructured `json:"resources,omitempty"`
	Errors               []string                     `json:"errors,omitempty"`
	Synced               bool                         `json:"synced"`
	Reachable            bool                         `json:"reachable"`
	Message              string                       `json:"message,omitempty"`
	Upstream             bool                         `json:"upstream"`
	SnapshotReady        bool                         `json:"snapshotReady"`
}

func hasVerb(r Resource, verb string) bool {
	for _, v := range r.Verbs {
		if v == verb {
			return true
		}
	}
	return false
}
func unwrap(obj interface{}) *unstructured.Unstructured {
	if u, ok := obj.(*unstructured.Unstructured); ok {
		return u
	}
	if tomb, ok := obj.(cache.DeletedFinalStateUnknown); ok {
		return unwrap(tomb.Obj)
	}
	return nil
}

// Informer notifications may wait behind the initial snapshot while the store
// advances. Publish only the current identity/version so an older callback cannot
// regress the snapshot. Versions are compared for equality, never numerically.
func currentInformerEvent(store cache.Store, action string, obj *unstructured.Unstructured) bool {
	key, err := cache.MetaNamespaceKeyFunc(obj)
	if err != nil {
		return false
	}
	latest, exists, err := store.GetByKey(key)
	if err != nil {
		return false
	}
	current := unwrap(latest)
	if action == "DELETE" {
		return !exists || current == nil || current.GetUID() != obj.GetUID()
	}
	return exists && current != nil && current.GetUID() == obj.GetUID() && current.GetResourceVersion() == obj.GetResourceVersion()
}
func (s *Server) websocket(w http.ResponseWriter, r *http.Request) {
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	requested, err := requestedScopes(r)
	if err != nil {
		problem(w, 400, err.Error())
		return
	}
	upgrader := websocket.Upgrader{CheckOrigin: SameOrigin, ReadBufferSize: 1024, WriteBufferSize: 16384}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	conn.SetReadLimit(4096)
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	if workspaceScopeFrom(r.Context()) != nil {
		ctx = context.WithValue(ctx, workspaceCacheOnlyKey{}, true)
	}
	go func() {
		defer cancel()
		for {
			if _, _, e := conn.ReadMessage(); e != nil {
				return
			}
		}
	}()
	generation := uuid.NewString()
	previousMembers := s.beginWorkspaceMembership(r, generation)
	if s.streamProbe != nil {
		s.streamProbe(generation, "open", envelope{}, 0, 0)
		defer s.streamProbe(generation, "close", envelope{}, 0, 0)
	}

	var authorizationFailure atomic.Pointer[watchAuthorizationFailure]
	var authorizationBatch *watchAuthorizationBatch
	var stopAuthorizationPublication func(*watchAuthorizationFailure)
	send := func(msg envelope) error {
		// This is write admission, not rollback of bytes already in flight.
		if msg.Synced || msg.Type == "RESOURCE_EVENT" || msg.Type == "SNAPSHOT" || msg.Type == "SNAPSHOT_READY" {
			if authorizationBatch != nil {
				if expired := authorizationBatch.expired(); expired != nil {
					stopAuthorizationPublication(expired)
				}
			}
			if ctx.Err() != nil {
				return ctx.Err()
			}
			if authorizationFailure.Load() != nil {
				return context.Canceled
			}
		}

		if scope := workspaceScopeFrom(r.Context()); scope != nil {
			msg.WorkspaceID = scope.workspaceID
			msg.HarborID = scope.harbor.ID
			msg.TabID = scope.tabID
			msg.ConnectionRef = scope.connection.ID
			msg.AuthorizationKey = safeAuthorizationKey(c, scope.connection.ID)
			msg.CredentialGeneration = strings.TrimSuffix(c.ID, ":"+scope.connection.ID)
			msg.SessionGeneration = generation
		}
		msg.Context = c.Name
		msg.Upstream = msg.Reachable
		msg.SnapshotReady = msg.Synced
		msg.Generation = generation
		msg.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
		conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
		var start time.Time
		if s.streamProbe != nil {
			s.streamProbe(generation, "write_begin", msg, -1, 0)
			start = time.Now()
		}
		err := conn.WriteJSON(msg)
		if s.streamProbe != nil {
			s.streamProbe(generation, "write_end", msg, -1, time.Since(start))
		}
		return err
	}
	if send(envelope{Type: "STATUS", Message: "Kubernetes API ve kaynak listeleri denetleniyor"}) != nil {
		return
	}
	resources, errors := discover(c)
	if len(resources) == 0 {
		send(envelope{Type: "STATUS", Errors: errors, Message: "Kubernetes API erişilemiyor"})
		return
	}
	bindings := watchScopeBindings(resources, ns, s.Namespace, requested)
	workspaceScope := workspaceScopeFrom(r.Context())
	bindings = workspaceBindings(bindings, workspaceScope)
	factories := map[string]dynamicinformer.DynamicSharedInformerFactory{}
	informers := []cache.SharedIndexInformer{}
	out := make(chan envelope, 2048)
	var gate sync.Mutex
	ready := false
	visibleUIDs := map[string]bool{}
	watchFailed := false
	watchFailure := make(chan struct{}, 1)
	overflow := make(chan struct{}, 1)
	authorizationFailed := make(chan struct{}, 1)
	stopAuthorizationPublication = func(failure *watchAuthorizationFailure) {
		if !authorizationFailure.CompareAndSwap(nil, failure) {
			return
		}
		// Notify before taking gate: an emitter may already own it. The writer sees
		// the terminal atomic state immediately and never waits on a network call.
		select {
		case authorizationFailed <- struct{}{}:
		default:
		}
		gate.Lock()
		ready = false
		watchFailed = true
		gate.Unlock()
	}

	emit := func(action string, obj interface{}, binding *scopeBinding) {
		u := unwrap(obj)
		if u == nil {
			return
		}
		var start time.Time
		if s.streamProbe != nil {
			start = time.Now()
		}
		gate.Lock()
		defer gate.Unlock()
		if s.streamProbe != nil {
			s.streamProbe(generation, "gate_wait", envelope{}, len(out), time.Since(start))
		}
		if !ready || watchFailed || authorizationFailure.Load() != nil || !currentInformerEvent(binding.informer.GetStore(), action, u) {
			return
		}
		scope := binding.scope
		scope.Status = "synced"
		scope.Authoritative = true
		scope.Error = ""
		if workspaceScope != nil {
			inside := s.scopeContains(ctx, baseWorkspaceClient(c), workspaceScope, u, 0)
			known := visibleUIDs[string(u.GetUID())]
			if action == "DELETE" {
				if !known && !inside {
					return
				}
				delete(visibleUIDs, string(u.GetUID()))
			} else if !inside {
				if !known {
					return
				}
				action = "OUT_OF_SCOPE"
				delete(visibleUIDs, string(u.GetUID()))
			} else {
				visibleUIDs[string(u.GetUID())] = true
			}
		}
		if !s.updateWorkspaceMember(r, generation, action, u, scope) {
			select {
			case overflow <- struct{}{}:
			default:
			}
			return
		}
		msg := scopedResourceMessage(action, u, scope)
		if s.streamProbe != nil {
			s.streamProbe(generation, "queue", msg, len(out)+1, 0)
		}
		select {
		case out <- msg:
		default:
			if s.streamProbe != nil {
				s.streamProbe(generation, "overflow", msg, len(out), 0)
			}
			select {
			case overflow <- struct{}{}:
			default:
			}
		}
	}
	reconcileRelated := func() {
		if workspaceScope == nil || workspaceScope.selector.Empty() {
			return
		}
		gate.Lock()
		defer gate.Unlock()
		if !ready || watchFailed || authorizationFailure.Load() != nil {
			return
		}
		seen := map[string]bool{}
		for i := range bindings {
			binding := &bindings[i]
			if binding.informer == nil || !binding.informer.HasSynced() {
				continue
			}
			for _, object := range binding.informer.GetStore().List() {
				u := unwrap(object)
				if u == nil || seen[string(u.GetUID())] || !currentInformerEvent(binding.informer.GetStore(), "UPDATE", u) {
					continue
				}
				seen[string(u.GetUID())] = true
				inside := s.scopeContains(ctx, baseWorkspaceClient(c), workspaceScope, u, 0)
				known := visibleUIDs[string(u.GetUID())]
				if inside == known {
					continue
				}
				action := "UPDATE"
				if !inside {
					action = "OUT_OF_SCOPE"
					delete(visibleUIDs, string(u.GetUID()))
				} else {
					visibleUIDs[string(u.GetUID())] = true
				}
				if !s.updateWorkspaceMember(r, generation, action, u, binding.scope) {
					select {
					case overflow <- struct{}{}:
					default:
					}
					return
				}
				msg := scopedResourceMessage(action, u, binding.scope)
				select {
				case out <- msg:
				default:
					select {
					case overflow <- struct{}{}:
					default:
					}
					return
				}
			}
		}
	}
	for i := range bindings {
		binding := &bindings[i]
		if binding.scope.Status != "syncing" {
			errors = append(errors, binding.scope.Error)
			continue
		}
		reviewNamespace := binding.scope.Namespace
		if reviewNamespace == "*" {
			reviewNamespace = ""
		}
		for _, verb := range []string{"list", "watch"} {
			if e := s.authorize(ctx, c, verb, binding.scope.Group, binding.scope.Resource, "", reviewNamespace, ""); e != nil {
				scopeError(&binding.scope, e)
				break
			}
		}
		if binding.scope.Status != "syncing" {
			errors = append(errors, binding.scope.Kind+": "+binding.scope.Error)
			continue
		}
		// An authorized all-namespace watch already covers a narrower catalog scope.
		// Reuse its informer and callback rather than publishing every delta twice.
		for previous := 0; previous < i; previous++ {
			candidate := &bindings[previous]
			if candidate.informer != nil && candidate.scope.gvr() == binding.scope.gvr() && (candidate.scope.Namespace == "*" || candidate.scope.Namespace == binding.scope.Namespace) {
				binding.informer = candidate.informer
				break
			}
		}
		if binding.informer != nil {
			continue
		}
		var inf cache.SharedIndexInformer
		onWatchError := func(watchErr error) {
			gate.Lock()
			defer gate.Unlock()
			watchFailed = true
			scopeError(&binding.scope, watchErr)
			select {
			case watchFailure <- struct{}{}:
			default:
			}
			if ready {
				select {
				case out <- envelope{Type: "STATUS", Message: safeError(watchErr), Errors: []string{safeError(watchErr)}, Scopes: []ResourceScope{binding.scope}, Synced: false, Reachable: true}:
				default:
				}
			}
		}
		if workspaceScope != nil {
			var release func()
			inf, release, err = s.watches.acquire(c, binding.scope, onWatchError)
			if err != nil {
				scopeError(&binding.scope, err)
				errors = append(errors, safeError(err))
				continue
			}
			defer release()
		} else {
			factoryNamespace := reviewNamespace
			factory := factories[factoryNamespace]
			if factory == nil {
				factory = dynamicinformer.NewFilteredDynamicSharedInformerFactory(c.Dynamic, 10*time.Minute, factoryNamespace, nil)
				factories[factoryNamespace] = factory
			}
			inf = factory.ForResource(binding.scope.gvr()).Informer()
			inf.SetWatchErrorHandler(func(_ *cache.Reflector, watchErr error) { onWatchError(watchErr) })
		}
		binding.informer = inf
		handler, _ := inf.AddEventHandler(cache.ResourceEventHandlerFuncs{AddFunc: func(obj interface{}) { emit("ADD", obj, binding); reconcileRelated() }, UpdateFunc: func(old, obj interface{}) {
			oldU, newU := unwrap(old), unwrap(obj)
			if oldU != nil && newU != nil && oldU.GetResourceVersion() == newU.GetResourceVersion() {
				if s.streamProbe != nil {
					s.streamProbe(generation, "same_version_resync", envelope{}, 0, 0)
				}
				return
			}
			emit("UPDATE", obj, binding)
			if workspaceScope != nil && !workspaceScope.selector.Empty() && workspaceMembershipChanged(oldU, newU) {
				reconcileRelated()
			}
		}, DeleteFunc: func(obj interface{}) { emit("DELETE", obj, binding); reconcileRelated() }})
		defer inf.RemoveEventHandler(handler)
		informers = append(informers, inf)
	}
	for _, factory := range factories {
		factory.Start(ctx.Done())
	}
	deadline := time.NewTimer(12 * time.Second)
	defer deadline.Stop()
	poll := time.NewTicker(50 * time.Millisecond)
	defer poll.Stop()
wait:
	for {
		all := true
		for _, inf := range informers {
			if !inf.HasSynced() {
				all = false
				break
			}
		}
		if all {
			break
		}
		select {
		case <-ctx.Done():
			return
		case <-deadline.C:
			break wait
		case <-poll.C:
		}
	}
	gate.Lock()
	var snapshotStart time.Time
	if s.streamProbe != nil {
		snapshotStart = time.Now()
	}
	snapshot := []*unstructured.Unstructured{}
	if watchFailed {
		for i := range bindings {
			bindings[i].scope.Authoritative = false
			if bindings[i].scope.Status == "syncing" {
				bindings[i].scope.Status = "unavailable"
				bindings[i].scope.Error = "Kaynak watch doğrulanamadı; snapshot silinme kanıtı değildir"
			}
		}
	}
	scopes := make([]ResourceScope, 0, len(bindings))
	snapshotUIDs := map[string]bool{}
	newMembers := map[string]workspaceMember{}
	for uid, member := range previousMembers {
		newMembers[uid] = member
	}
	outOfScope := []*unstructured.Unstructured{}
	outOfScopeUIDs := map[string]bool{}
	synced := len(informers) > 0 && !watchFailed
	for i := range bindings {
		binding := &bindings[i]
		if binding.informer != nil {
			if !binding.informer.HasSynced() || binding.scope.Status != "syncing" {
				synced = false
				if binding.scope.Status == "syncing" {
					binding.scope.Status = "unavailable"
					binding.scope.Error = "Kaynak listesi henüz senkronize edilemedi"
				}
				errors = append(errors, binding.scope.Kind+": "+binding.scope.Error)
			} else {
				binding.scope.Authoritative = true
				binding.scope.Status = "synced"
				for _, obj := range binding.informer.GetStore().List() {
					if u := unwrap(obj); u != nil && !snapshotUIDs[string(u.GetUID())] && (binding.scope.Namespace == "*" || binding.scope.Namespace == u.GetNamespace()) {
						if workspaceScope != nil && !s.scopeContains(ctx, baseWorkspaceClient(c), workspaceScope, u, 0) {
							if member, known := previousMembers[string(u.GetUID())]; known && !outOfScopeUIDs[string(u.GetUID())] {
								outOfScope = append(outOfScope, member.object)
								outOfScopeUIDs[string(u.GetUID())] = true
								delete(newMembers, string(u.GetUID()))
							}
							continue
						}
						snapshot = append(snapshot, sanitize(u))
						snapshotUIDs[string(u.GetUID())] = true
						visibleUIDs[string(u.GetUID())] = true
						if workspaceScope != nil {
							newMembers[string(u.GetUID())] = workspaceMember{scope: binding.scope, object: memberMetadata(u)}
						}
					}
				}
				if workspaceScope != nil {
					for uid, member := range previousMembers {
						if member.scope.gvr() == binding.scope.gvr() && (binding.scope.Namespace == "*" || binding.scope.Namespace == member.object.GetNamespace()) && !snapshotUIDs[uid] {
							delete(newMembers, uid)
						}
					}
				}
			}
		}
		scopes = append(scopes, binding.scope)
	}
	if s.prepareSnapshot != nil {
		s.prepareSnapshot(snapshot)
	}
	if s.streamProbe != nil {
		s.streamProbe(generation, "snapshot_build", envelope{Resources: snapshot}, 0, time.Since(snapshotStart))
	}
	if !s.replaceWorkspaceMembers(r, generation, newMembers) {
		gate.Unlock()
		send(envelope{Type: "STATUS", Message: "Liman üyelik sınırı veya oturumu değişti; snapshot yetkili değildir", Synced: false, Reachable: true})
		return
	}
	err = send(envelope{Type: "SNAPSHOT", Resources: snapshot, OutOfScope: outOfScope, Scopes: scopes, Errors: errors, Synced: synced, Reachable: true})
	ready = true
	gate.Unlock()
	if err != nil {
		return
	}
	if send(envelope{Type: "SNAPSHOT_READY", Synced: synced, Reachable: true, Errors: errors}) != nil {
		return
	}

	gate.Lock()
	activeScopes := make([]ResourceScope, 0, len(bindings))
	for _, binding := range bindings {
		if binding.informer != nil {
			activeScopes = append(activeScopes, binding.scope)
		}
	}
	gate.Unlock()
	activeScopes = uniqueWatchAuthorizationScopes(activeScopes)
	defer func() {
		if authorizationBatch != nil {
			authorizationBatch.cancel()
		}
	}()
	sendAuthorizationFailure := func(failure *watchAuthorizationFailure) { send(watchAuthorizationFailureStatus(failure)) }

	terminal := func() bool {
		if ctx.Err() != nil {
			return true
		}
		if authorizationBatch != nil {
			if expired := authorizationBatch.expired(); expired != nil {
				stopAuthorizationPublication(expired)
			}
		}
		if failure := authorizationFailure.Load(); failure != nil {
			sendAuthorizationFailure(failure)
			return true
		}
		gate.Lock()
		failed := watchFailed
		failedScopes := []ResourceScope{}
		if failed {
			for _, binding := range bindings {
				if binding.scope.Status == "forbidden" || binding.scope.Status == "unavailable" {
					scope := binding.scope
					scope.Authoritative = false
					failedScopes = append(failedScopes, scope)
				}
			}
		}
		gate.Unlock()
		if failed {
			send(envelope{Type: "STATUS", Scopes: failedScopes, Synced: false, Reachable: true, Message: "Kaynak watch bağlantısı kesildi; yeniden snapshot alınıyor"})
			return true
		}
		return false
	}
	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()
	for {
		if terminal() {
			return
		}
		var result <-chan *watchAuthorizationFailure
		var deadline <-chan struct{}
		if authorizationBatch != nil {
			result = authorizationBatch.result
			if !authorizationBatch.completed.Load() {
				deadline = authorizationBatch.ctx.Done()
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-authorizationFailed: // sole writer sends terminal status at loop top
		case <-deadline:
			if terminal() {
				return
			}
		case failure := <-result:
			authorizationBatch.cancel()
			authorizationBatch = nil
			if failure != nil {
				stopAuthorizationPublication(failure)
			}
			if terminal() {
				return
			}
			if send(envelope{Type: "STATUS", Synced: synced, Reachable: true, Message: "Kaynak watch izinleri doğrulandı"}) != nil {
				if f := authorizationFailure.Load(); f != nil {
					sendAuthorizationFailure(f)
				}
				return
			}
		case <-watchFailure:
			if terminal() {
				return
			}
		case msg := <-out:
			if terminal() {
				return
			}
			if send(msg) != nil {
				if f := authorizationFailure.Load(); f != nil {
					sendAuthorizationFailure(f)
				}
				return
			}
		case <-overflow:
			if terminal() {
				return
			}
			send(envelope{Type: "STATUS", Message: "Mesaj kuyruğu doldu; yeniden snapshot gerekiyor", Synced: false, Reachable: true})
			return
		case <-heartbeat.C:
			if terminal() {
				return
			}
			if workspaceScope != nil {
				latest, err := s.client(workspaceScope.connection.Context)
				if err != nil || latest.ID+":"+workspaceScope.connection.ID != c.ID {
					send(envelope{Type: "STATUS", Synced: false, Reachable: false, Message: "Bağlantı kimliği değişti; yeni yetki ve snapshot gerekli"})
					return
				}
			}
			if authorizationBatch != nil {
				continue
			} // never overlap per-consumer reviews
			authorizationBatch = startWatchAuthorizationBatch(ctx, activeScopes, watchAuthorizationBudgetForScopes(activeScopes), func(reviewCtx context.Context, scope ResourceScope, verb string) error {
				return reviewWatchPermission(reviewCtx, c, scope, verb)
			}, stopAuthorizationPublication)
		}
	}

}

// Prevent accidental use of path-derived namespace strings as resource names.
func validName(name string) bool { return name != "" && !strings.ContainsAny(name, "/\\") }
