package server

// This explicitly selected, loopback-only source exercises the ordinary
// discovery/informer/store path. It never loads a kubeconfig or writes to a
// Kubernetes API. Its fixtures and logs are labelled TEST/REPLAY throughout.
import (
	"context"
	"embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

//go:embed replay_fixtures/*.json
var replayFixtures embed.FS

var replayKinds = map[schema.GroupVersionResource]string{
	{Version: "v1", Resource: "nodes"}:                       "NodeList",
	{Version: "v1", Resource: "pods"}:                        "PodList",
	{Version: "v1", Resource: "namespaces"}:                  "NamespaceList",
	{Group: "apps", Version: "v1", Resource: "deployments"}:  "DeploymentList",
	{Group: "apps", Version: "v1", Resource: "statefulsets"}: "StatefulSetList",
}

type replaySource struct {
	mu                                      sync.Mutex
	profile, context, nonce                 string
	client                                  *Clients
	objects                                 []*unstructured.Unstructured
	cancel                                  context.CancelFunc
	lifetime                                context.Context
	close                                   context.CancelFunc
	running                                 bool
	sequence, applied, logOpened, logClosed int
	lastError                               string
}

// EnableReplay must run before Register. It is deliberately not a fallback for
// an unavailable live cluster. CLI validation also enforces loopback binding.
func (s *Server) EnableReplay(profile string) error {
	if profile != "M" && profile != "L" {
		return fmt.Errorf("replay profile must be M or L")
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.replay != nil {
		return fmt.Errorf("replay source already configured")
	}
	raw, err := replayFixtures.ReadFile("replay_fixtures/" + profile + ".json")
	if err != nil {
		return err
	}
	var objects []*unstructured.Unstructured
	if err = json.Unmarshal(raw, &objects); err != nil {
		return err
	}
	inputs := make([]runtime.Object, len(objects))
	typedObjects := []runtime.Object{}
	for i, obj := range objects {
		inputs[i] = obj.DeepCopy()
		switch obj.GetKind() {
		case "Pod":
			pod := new(corev1.Pod)
			if err = runtime.DefaultUnstructuredConverter.FromUnstructured(obj.Object, pod); err != nil {
				return err
			}
			typedObjects = append(typedObjects, pod)
		case "Node":
			node := new(corev1.Node)
			if err = runtime.DefaultUnstructuredConverter.FromUnstructured(obj.Object, node); err != nil {
				return err
			}
			typedObjects = append(typedObjects, node)
		case "Namespace":
			ns := new(corev1.Namespace)
			if err = runtime.DefaultUnstructuredConverter.FromUnstructured(obj.Object, ns); err != nil {
				return err
			}
			typedObjects = append(typedObjects, ns)
		}
	}
	typed := kubefake.NewSimpleClientset(typedObjects...)
	typed.PrependReactor("create", "selfsubjectaccessreviews", func(a ktesting.Action) (bool, runtime.Object, error) {
		verb := a.(ktesting.CreateAction).GetObject().(*authv1.SelfSubjectAccessReview).Spec.ResourceAttributes.Verb
		return true, &authv1.SelfSubjectAccessReview{Status: authv1.SubjectAccessReviewStatus{Allowed: verb == "get" || verb == "list" || verb == "watch"}}, nil
	})
	d := typed.Discovery().(*discoveryfake.FakeDiscovery)
	groups := map[string][]metav1.APIResource{}
	for gvr, listKind := range replayKinds {
		gv := gvr.GroupVersion().String()
		groups[gv] = append(groups[gv], metav1.APIResource{Name: gvr.Resource, Kind: strings.TrimSuffix(listKind, "List"), Namespaced: gvr.Resource != "nodes" && gvr.Resource != "namespaces", Verbs: metav1.Verbs{"get", "list", "watch"}})
	}
	for gv, resources := range groups {
		d.Resources = append(d.Resources, &metav1.APIResourceList{GroupVersion: gv, APIResources: resources})
	}
	r := &replaySource{profile: profile, context: "test-replay-" + profile, nonce: uuid.NewString(), objects: objects}
	r.lifetime, r.close = context.WithCancel(context.Background())
	r.client = &Clients{Dynamic: dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), replayKinds, inputs...), Typed: typed, Discovery: d, Name: r.context, ID: uuid.NewString(), Namespace: "bench-0", DataSource: "test-replay", fingerprint: "test/replay:" + profile}
	s.replay = r
	s.ReadOnly = true
	s.Namespace = ""
	s.prepareSnapshot = func(objects []*unstructured.Unstructured) {
		sort.Slice(objects, func(i, j int) bool {
			a, b := objects[i], objects[j]
			return a.GetKind()+"/"+a.GetNamespace()+"/"+a.GetName()+"/"+string(a.GetUID()) < b.GetKind()+"/"+b.GetNamespace()+"/"+b.GetName()+"/"+string(b.GetUID())
		})
	}
	s.openLogStream = r.openLogs
	return nil
}

func (s *Server) replayEnabled() bool { s.mu.Lock(); defer s.mu.Unlock(); return s.replay != nil }
func (s *Server) replayClient(name string) (*Clients, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.replay == nil {
		return nil, fmt.Errorf("replay source unavailable")
	}
	if name != "" && name != s.replay.context {
		return nil, fmt.Errorf("TEST/REPLAY source cannot connect to a live context")
	}
	return s.replay.client, nil
}
func (s *Server) replayContexts(w http.ResponseWriter, r *http.Request) {
	c, _ := s.replayClient("")
	jsonResponse(w, 200, map[string]interface{}{"contexts": []map[string]string{{"name": c.Name, "namespace": "bench-0"}}, "current": c.Name, "currentNamespace": "bench-0", "configured": true, "readOnly": true, "serverReadOnly": true, "managementAvailable": false, "dataSource": "test-replay", "sourceLabel": "TEST/REPLAY — sentetik performans verisi"})
}
func (s *Server) closeReplay() {
	s.mu.Lock()
	r := s.replay
	s.mu.Unlock()
	if r != nil {
		r.close()
		r.mu.Lock()
		if r.cancel != nil {
			r.cancel()
		}
		r.mu.Unlock()
	}
}
func (r *replaySource) openLogs(ctx context.Context, c *Clients, namespace, pod string, options *corev1.PodLogOptions) (io.ReadCloser, error) {
	if c.DataSource != "test-replay" || c.Name != r.context {
		return nil, fmt.Errorf("replay log context mismatch")
	}
	reader, writer := io.Pipe()
	stopRequest := context.AfterFunc(ctx, func() { writer.CloseWithError(context.Canceled) })
	stopSource := context.AfterFunc(r.lifetime, func() { writer.CloseWithError(context.Canceled) })
	r.mu.Lock()
	r.logOpened++
	r.mu.Unlock()
	go func() {
		defer stopRequest()
		defer stopSource()
		defer writer.Close()
		defer func() { r.mu.Lock(); r.logClosed++; r.mu.Unlock() }()
		// Closing the reader interrupts a blocked writer; the guarded log handler
		// cancels ctx on pause, UID replacement, context switch and disconnect.
		ticker := time.NewTicker(100 * time.Millisecond)
		defer ticker.Stop()
		for i := 0; ; i++ {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if _, err := fmt.Fprintf(writer, "%s TEST/REPLAY %s/%s container=%s line=%d\n", time.Now().UTC().Format(time.RFC3339Nano), namespace, pod, options.Container, i); err != nil {
					return
				}
				if !options.Follow {
					return
				}
			}
		}
	}()
	return reader, nil
}

func (s *Server) registerReplay(mux *http.ServeMux) {
	if !s.replayEnabled() {
		return
	}
	mux.HandleFunc("/api/replay/status", s.protect(func(w http.ResponseWriter, req *http.Request) {
		if req.Method != "GET" {
			problem(w, 405, "GET required")
			return
		}
		r := s.replay
		r.mu.Lock()
		defer r.mu.Unlock()
		jsonResponse(w, 200, map[string]interface{}{"dataSource": "test-replay", "profile": r.profile, "controlNonce": r.nonce, "running": r.running, "applied": r.applied, "sequence": r.sequence, "lastError": r.lastError, "logOpened": r.logOpened, "logClosed": r.logClosed, "label": "TEST/REPLAY; no real Kubernetes or traffic"})
	}))
	mux.HandleFunc("/api/replay/scenario", s.protect(func(w http.ResponseWriter, req *http.Request) {
		if req.Method != "POST" {
			problem(w, 405, "POST required")
			return
		}
		r := s.replay
		if req.Header.Get("X-KubeView-Replay") != r.nonce {
			problem(w, 403, "replay control nonce required")
			return
		}
		var input struct {
			Name       string `json:"name"`
			Count      int    `json:"count"`
			IntervalMS int    `json:"intervalMs"`
		}
		if !decode(w, req, &input) {
			return
		}
		if input.Name != "churn" && input.Name != "node-fault" && input.Name != "container-restart" && input.Name != "reset" {
			problem(w, 400, "unknown bounded replay scenario")
			return
		}
		if input.Count == 0 {
			input.Count = 100
		}
		if input.IntervalMS == 0 {
			input.IntervalMS = 200
		}
		if input.Count < 1 || input.Count > 1000 || input.IntervalMS < 20 || input.IntervalMS > 2000 {
			problem(w, 400, "count 1..1000, intervalMs 20..2000 required")
			return
		}
		r.mu.Lock()
		if r.running {
			r.mu.Unlock()
			problem(w, 409, "replay running")
			return
		}
		ctx, cancel := context.WithCancel(r.lifetime)
		r.cancel = cancel
		r.running = true
		r.lastError = ""
		r.mu.Unlock()
		go r.run(ctx, input.Name, input.Count, time.Duration(input.IntervalMS)*time.Millisecond)
		jsonResponse(w, 202, map[string]interface{}{"accepted": true, "source": "TEST/REPLAY", "scenario": input.Name, "count": input.Count})
	}))
}

func (r *replaySource) apply(ctx context.Context, obj *unstructured.Unstructured, sequence int) error {
	var gvr schema.GroupVersionResource
	for candidate, kind := range replayKinds {
		if kind == obj.GetKind()+"List" {
			gvr = candidate
			break
		}
	}
	copy := obj.DeepCopy()
	copy.SetResourceVersion(fmt.Sprintf("replay-opaque-%d", sequence))
	if _, err := r.client.Dynamic.Resource(gvr).Namespace(copy.GetNamespace()).Update(ctx, copy, metav1.UpdateOptions{}); err != nil {
		return err
	}
	switch copy.GetKind() {
	case "Pod":
		pod := new(corev1.Pod)
		if err := runtime.DefaultUnstructuredConverter.FromUnstructured(copy.Object, pod); err != nil {
			return err
		}
		if _, err := r.client.Typed.CoreV1().Pods(copy.GetNamespace()).Update(ctx, pod, metav1.UpdateOptions{}); err != nil {
			return err
		}
	case "Node":
		node := new(corev1.Node)
		if err := runtime.DefaultUnstructuredConverter.FromUnstructured(copy.Object, node); err != nil {
			return err
		}
		if _, err := r.client.Typed.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{}); err != nil {
			return err
		}
	}
	// client-go's fake action recorder is test instrumentation, not an event
	// history. Keep it bounded for an explicitly long-running manual replay.
	r.client.Dynamic.(*dynamicfake.FakeDynamicClient).ClearActions()
	r.client.Typed.(*kubefake.Clientset).ClearActions()
	return nil
}
func (r *replaySource) run(ctx context.Context, name string, count int, interval time.Duration) {
	defer func() { r.mu.Lock(); r.running = false; r.cancel = nil; r.mu.Unlock() }()
	pool := []*unstructured.Unstructured{}
	if name == "reset" {
		count = len(r.objects)
	} else {
		kind := "Pod"
		if name == "node-fault" {
			kind = "Node"
		}
		for _, obj := range r.objects {
			if obj.GetKind() == kind {
				pool = append(pool, obj)
			}
		}
	}
	for i := 0; i < count; i++ {
		if i > 0 && name != "reset" {
			timer := time.NewTimer(interval)
			select {
			case <-ctx.Done():
				timer.Stop()
				return
			case <-timer.C:
			}
		}
		var obj *unstructured.Unstructured
		if name == "reset" {
			obj = r.objects[i].DeepCopy()
		} else {
			kind := "Pod"
			if name == "node-fault" {
				kind = "Node"
			}
			index := i % len(pool)
			if name != "churn" {
				index = 0
			} // Fault/recovery refer to the same UID.
			obj = pool[index].DeepCopy()
			if kind == "Node" {
				status := "False"
				if i%2 == 1 {
					status = "True"
				}
				unstructured.SetNestedSlice(obj.Object, []interface{}{map[string]interface{}{"type": "Ready", "status": status}}, "status", "conditions")
			} else {
				unstructured.SetNestedField(obj.Object, fmt.Sprint(i), "metadata", "annotations", "kubeview.test/replay-sequence")
				if name == "container-restart" {
					current, err := r.client.Dynamic.Resource(schemaGVR("", "v1", "pods")).Namespace(obj.GetNamespace()).Get(ctx, obj.GetName(), metav1.GetOptions{})
					if err == nil {
						obj = current.DeepCopy()
					}
					statuses, _, _ := unstructured.NestedSlice(obj.Object, "status", "containerStatuses")
					if len(statuses) > 0 {
						state := statuses[0].(map[string]interface{})
						previous, _, _ := unstructured.NestedInt64(state, "restartCount")
						if i%2 == 0 {
							previous++
						}
						state["restartCount"] = previous
						state["ready"] = i%2 == 1
						if i%2 == 0 {
							state["state"] = map[string]interface{}{"waiting": map[string]interface{}{"reason": "CrashLoopBackOff"}}
						} else {
							state["state"] = map[string]interface{}{"running": map[string]interface{}{"startedAt": "2026-10-23T00:00:00Z"}}
						}
						unstructured.SetNestedSlice(obj.Object, statuses, "status", "containerStatuses")
					}
				}
			}
		}
		r.mu.Lock()
		r.sequence++
		seq := r.sequence
		r.mu.Unlock()
		err := r.apply(ctx, obj, seq)
		r.mu.Lock()
		if err != nil {
			r.lastError = err.Error()
		} else {
			r.applied++
		}
		r.mu.Unlock()
		if err != nil {
			return
		}
	}
}
