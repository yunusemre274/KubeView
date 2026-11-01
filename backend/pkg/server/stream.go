package server

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
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
	nodes, nodeErr := c.Metrics.MetricsV1beta1().NodeMetricses().List(ctx, metav1.ListOptions{})
	pods, podErr := c.Metrics.MetricsV1beta1().PodMetricses(ns).List(ctx, metav1.ListOptions{})
	result := map[string]interface{}{"available": nodeErr == nil || podErr == nil, "source": "metrics.k8s.io", "timestamp": time.Now().UTC().Format(time.RFC3339), "nodes": []interface{}{}, "pods": []interface{}{}}
	errors := map[string]string{}
	if nodeErr == nil {
		result["nodes"] = nodes.Items
	} else {
		errors["nodes"] = nodeErr.Error()
	}
	if podErr == nil {
		result["pods"] = pods.Items
	} else {
		errors["pods"] = podErr.Error()
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
	logClient := c.Typed
	if c.Config != nil {
		config := rest.CopyConfig(c.Config)
		config.Timeout = 0
		typed, e := kubernetes.NewForConfig(config)
		if e != nil {
			failure(w, e)
			return
		}
		logClient = typed
	}
	stream, err := logClient.CoreV1().Pods(ns).GetLogs(pod, opts).Stream(r.Context())
	if err != nil {
		failure(w, err)
		return
	}
	defer stream.Close()
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(200)
	buf := make([]byte, 8192)
	for {
		n, e := stream.Read(buf)
		if n > 0 {
			if _, e := w.Write(buf[:n]); e != nil {
				return
			}
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
		if e != nil {
			if e != io.EOF {
				fmt.Fprintf(w, "\n[Log akışı kesildi: %v]\n", e)
			}
			return
		}
	}
}

// Watch kinds are broad enough for the primary UI. Other installed APIs remain
// discoverable and use the generic explorer; no custom resource type is invented.
var watchKinds = map[string]bool{"Node": true, "Namespace": true, "Pod": true, "Deployment": true, "ReplicaSet": true, "StatefulSet": true, "DaemonSet": true, "Job": true, "CronJob": true, "Service": true, "EndpointSlice": true, "Ingress": true, "NetworkPolicy": true, "PersistentVolumeClaim": true, "PersistentVolume": true, "StorageClass": true, "ConfigMap": true, "Secret": true, "ServiceAccount": true, "Role": true, "ClusterRole": true, "RoleBinding": true, "ClusterRoleBinding": true, "HorizontalPodAutoscaler": true, "PodDisruptionBudget": true, "ResourceQuota": true, "LimitRange": true, "Event": true, "CustomResourceDefinition": true}

type envelope struct {
	Type          string                       `json:"type"`
	Generation    string                       `json:"generation"`
	Timestamp     string                       `json:"timestamp"`
	Action        string                       `json:"action,omitempty"`
	Object        *unstructured.Unstructured   `json:"object,omitempty"`
	Resources     []*unstructured.Unstructured `json:"resources,omitempty"`
	Errors        []string                     `json:"errors,omitempty"`
	Synced        bool                         `json:"synced"`
	Reachable     bool                         `json:"reachable"`
	Message       string                       `json:"message,omitempty"`
	Upstream      bool                         `json:"upstream"`
	SnapshotReady bool                         `json:"snapshotReady"`
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
	upgrader := websocket.Upgrader{CheckOrigin: SameOrigin, ReadBufferSize: 1024, WriteBufferSize: 16384}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	conn.SetReadLimit(4096)
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	go func() {
		defer cancel()
		for {
			if _, _, e := conn.ReadMessage(); e != nil {
				return
			}
		}
	}()
	generation := uuid.NewString()
	if s.streamProbe != nil {
		s.streamProbe(generation, "open", envelope{}, 0, 0)
		defer s.streamProbe(generation, "close", envelope{}, 0, 0)
	}
	send := func(msg envelope) error {
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
	factory := dynamicinformer.NewFilteredDynamicSharedInformerFactory(c.Dynamic, 10*time.Minute, ns, nil)
	clusterFactory := dynamicinformer.NewDynamicSharedInformerFactory(c.Dynamic, 10*time.Minute)
	informers := []cache.SharedIndexInformer{}
	out := make(chan envelope, 2048)
	var gate sync.Mutex
	ready := false
	watchFailed := false
	watchFailure := make(chan struct{}, 1)
	overflow := make(chan struct{}, 1)
	emit := func(action string, obj interface{}, store cache.Store) {
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
		if !ready || !currentInformerEvent(store, action, u) {
			return
		}
		msg := envelope{Type: "RESOURCE_EVENT", Action: action, Object: sanitize(u), Synced: true, Reachable: true}
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
	seen := map[string]bool{}
	for _, resource := range resources {
		if !watchKinds[resource.Kind] || seen[resource.Kind] || !hasVerb(resource, "list") || !hasVerb(resource, "watch") {
			continue
		}
		if s.Namespace != "" && !resource.Namespaced && resource.Kind != "Node" {
			continue
		}
		reviewNamespace := ns
		if !resource.Namespaced {
			reviewNamespace = ""
		}
		if err := s.authorize(ctx, c, "list", resource.Group, resource.Resource, "", reviewNamespace, ""); err != nil {
			errors = append(errors, resource.Kind+": "+err.Error())
			continue
		}
		if err := s.authorize(ctx, c, "watch", resource.Group, resource.Resource, "", reviewNamespace, ""); err != nil {
			errors = append(errors, resource.Kind+": "+err.Error())
			continue
		}
		seen[resource.Kind] = true
		gvr := schema.GroupVersionResource{Group: resource.Group, Version: resource.Version, Resource: resource.Resource}
		selectedFactory := factory
		if !resource.Namespaced {
			selectedFactory = clusterFactory
		}
		inf := selectedFactory.ForResource(gvr).Informer()
		inf.SetWatchErrorHandler(func(_ *cache.Reflector, watchErr error) {
			gate.Lock()
			defer gate.Unlock()
			watchFailed = true
			select {
			case watchFailure <- struct{}{}:
			default:
			}
			if ready {
				select {
				case out <- envelope{Type: "STATUS", Message: watchErr.Error(), Errors: []string{watchErr.Error()}, Synced: false, Reachable: true}:
				default:
				}
			}
		})
		inf.AddEventHandler(cache.ResourceEventHandlerFuncs{AddFunc: func(obj interface{}) { emit("ADD", obj, inf.GetStore()) }, UpdateFunc: func(old, obj interface{}) {
			oldU, newU := unwrap(old), unwrap(obj)
			if oldU != nil && newU != nil && oldU.GetResourceVersion() == newU.GetResourceVersion() {
				if s.streamProbe != nil {
					s.streamProbe(generation, "same_version_resync", envelope{}, 0, 0)
				}
				return
			}
			emit("UPDATE", obj, inf.GetStore())
		}, DeleteFunc: func(obj interface{}) { emit("DELETE", obj, inf.GetStore()) }})
		informers = append(informers, inf)
	}
	factory.Start(ctx.Done())
	clusterFactory.Start(ctx.Done())
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
	synced := len(informers) > 0 && !watchFailed
	for _, inf := range informers {
		if !inf.HasSynced() {
			synced = false
			errors = append(errors, "Bir kaynak listesi senkronize edilemedi; yetki ve API erişimini kontrol edin")
			continue
		}
		for _, obj := range inf.GetStore().List() {
			if u := unwrap(obj); u != nil {
				snapshot = append(snapshot, sanitize(u))
			}
		}
	}
	if s.prepareSnapshot != nil {
		s.prepareSnapshot(snapshot)
	}
	if s.streamProbe != nil {
		s.streamProbe(generation, "snapshot_build", envelope{Resources: snapshot}, 0, time.Since(snapshotStart))
	}
	err = send(envelope{Type: "SNAPSHOT", Resources: snapshot, Errors: errors, Synced: synced, Reachable: true})
	ready = true
	gate.Unlock()
	if err != nil {
		return
	}
	if send(envelope{Type: "SNAPSHOT_READY", Synced: synced, Reachable: true, Errors: errors}) != nil {
		return
	}
	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-watchFailure:
			send(envelope{Type: "STATUS", Synced: false, Reachable: true, Message: "Kaynak watch bağlantısı kesildi; yeniden snapshot alınıyor"})
			return
		case msg := <-out:
			if send(msg) != nil {
				return
			}
		case <-overflow:
			send(envelope{Type: "STATUS", Message: "Mesaj kuyruğu doldu; yeniden snapshot gerekiyor", Synced: false, Reachable: true})
			return
		case <-heartbeat.C:
			gate.Lock()
			hasWatchError := watchFailed
			gate.Unlock()
			_, e := c.Discovery.ServerVersion()
			message := "Kaynak watch bağlantısı açık"
			if e != nil {
				message = e.Error()
			}
			if send(envelope{Type: "STATUS", Synced: synced && e == nil && !hasWatchError, Reachable: e == nil, Message: message}) != nil {
				return
			}
		}
	}
}

// Prevent accidental use of path-derived namespace strings as resource names.
func validName(name string) bool { return name != "" && !strings.ContainsAny(name, "/\\") }
