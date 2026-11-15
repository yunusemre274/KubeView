package server

// Explicit opt-in, loopback-only fixture upstream. No kubeconfig is loaded.
// The browser uses the production Server websocket/informer/sanitize code.
import (
	"context"
	"encoding/json"
	"fmt"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	k8sruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	kubefake "k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/tools/cache"
)

var benchGVR = map[string]schema.GroupVersionResource{
	"Node": {Version: "v1", Resource: "nodes"}, "Pod": {Version: "v1", Resource: "pods"}, "Namespace": {Version: "v1", Resource: "namespaces"},
	// Workspace's normal scope preview lists Services even when the frozen
	// fixture contains none. Register the real empty API, not a mock preview.
	"Service": {Version: "v1", Resource: "services"},
	"Deployment": {Group: "apps", Version: "v1", Resource: "deployments"}, "StatefulSet": {Group: "apps", Version: "v1", Resource: "statefulsets"},
}

type replayEvent struct {
	Action   string                     `json:"action"`
	Object   *unstructured.Unstructured `json:"object"`
	Sequence int                        `json:"sequence"`
	AtMS     float64                    `json:"atMs"`
}
type replaySample struct {
	Sequence  int     `json:"sequence"`
	PlannedMS float64 `json:"plannedMs"`
	ActualMS  float64 `json:"actualMs"`
	ApplyMS   float64 `json:"applyMs"`
	Error     string  `json:"error,omitempty"`
}

func TestBenchmarkFixtureServer(t *testing.T) {
	path := os.Getenv("KUBEVIEW_BENCH_FIXTURE")
	if path == "" {
		t.Skip("explicit KUBEVIEW_BENCH_FIXTURE required")
	}
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var objects []*unstructured.Unstructured
	if err = json.Unmarshal(raw, &objects); err != nil {
		t.Fatal(err)
	}
	inputs := make([]k8sruntime.Object, len(objects))
	for i, o := range objects {
		inputs[i] = o
	}
	s, c := testServer(t, true)
	s.Namespace = ""
	// The fixture's advertised context and watch envelopes must agree. The
	// production client correctly rejects messages from another context.
	c.Name = "benchmark"
	s.clients = map[string]*Clients{"benchmark": c}
	var sameVersionResyncs atomic.Int64
	s.streamProbe = func(_ string, stage string, _ envelope, _ int, _ time.Duration) {
		if stage == "same_version_resync" {
			sameVersionResyncs.Add(1)
		}
	}
	// Store.List is unordered. Freeze fixture presentation before JSON is sent,
	// so initial UID slot allocation and the visible region match every run.
	s.prepareSnapshot = func(resources []*unstructured.Unstructured) {
		key := func(r *unstructured.Unstructured) string {
			return r.GetKind() + "/" + r.GetNamespace() + "/" + r.GetName() + "/" + string(r.GetUID())
		}
		sort.Slice(resources, func(i, j int) bool { return key(resources[i]) < key(resources[j]) })
	}
	kinds := map[schema.GroupVersionResource]string{}
	groups := map[string][]metav1.APIResource{}
	for kind, gvr := range benchGVR {
		kinds[gvr] = kind + "List"
		gv := gvr.Version
		if gvr.Group != "" {
			gv = gvr.Group + "/" + gv
		}
		groups[gv] = append(groups[gv], metav1.APIResource{Name: gvr.Resource, Kind: kind, Namespaced: kind != "Node" && kind != "Namespace", Verbs: metav1.Verbs{"get", "list", "watch"}})
	}
	c.Dynamic = dynamicfake.NewSimpleDynamicClientWithCustomListKinds(k8sruntime.NewScheme(), kinds, inputs...)
	// Explicit opt-in workspace mode uses the same production persistence,
	// broker, scoped requests and frontend registry. Historical single-source
	// baselines remain untouched when this variable is absent.
	if value := os.Getenv("KUBEVIEW_BENCH_HARBORS"); value != "" {
		count, err := strconv.Atoi(value)
		if err != nil || (count != 1 && count != 5 && count != 10 && count != 20) {
			t.Fatal("benchmark harbors must be 1, 5, 10 or 20")
		}
		c.DataSource = "test-replay"
		if err = s.ConfigureWorkspace(filepath.Join(t.TempDir(), "app-data"), "benchmark", "*"); err != nil {
			t.Fatal(err)
		}
		doc := s.workspace.store.Snapshot()
		_, err = s.workspace.store.Update(doc.Revision, func(d *ws.Document) error {
			initial := d.Harbors[0]
			initial.Name = "TEST/REPLAY 01"
			d.Harbors[0] = initial
			for i := 1; i < count; i++ {
				h := initial
				h.ID = fmt.Sprintf("fixture-harbor-%02d", i+1)
				h.Name = fmt.Sprintf("TEST/REPLAY %02d", i+1)
				h.Position = [2]float64{float64(i%5) * 1400, float64(i/5) * 1400}
				d.Harbors = append(d.Harbors, h)
			}
			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
	}
	d := c.Typed.(*kubefake.Clientset).Discovery().(*fake.FakeDiscovery)
	d.Resources = nil
	for gv, rs := range groups {
		d.Resources = append(d.Resources, &metav1.APIResourceList{GroupVersion: gv, APIResources: rs})
	}
	api := http.NewServeMux()
	s.Register(api)
	var mu sync.Mutex
	samples := []replaySample{}
	running := false
	logOpened, logClosed := 0, 0
	logRequests := []map[string]string{}
	logGated := os.Getenv("KUBEVIEW_BENCH_LOG_GATED") == "1"
	var logFlow atomic.Bool
	logFlow.Store(!logGated)
	var logWrittenLines, logWrittenBytes atomic.Int64
	logBytes, _ := strconv.Atoi(os.Getenv("KUBEVIEW_BENCH_LOG_BYTES"))
	if logBytes < 0 || logBytes > 65536 {
		t.Fatal("log byte fixture must be 0..65536")
	}
	logPayload := strings.Repeat("x", logBytes)
	burstLines, _ := strconv.Atoi(os.Getenv("KUBEVIEW_BENCH_LOG_BURST_LINES"))
	if burstLines < 0 || burstLines > 20000 || burstLines*(logBytes+256) > 8<<20 {
		t.Fatal("log burst exceeds fixture resource budget")
	}
	var producerNS int64
	mux := http.NewServeMux()
	mux.HandleFunc("/__benchmark/log-flow", func(w http.ResponseWriter, r *http.Request) {
		if !logGated || r.Method != "POST" {
			problem(w, 405, "Explicit gated fixture POST only")
			return
		}
		var value struct {
			Enabled bool `json:"enabled"`
		}
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1024)).Decode(&value); err != nil {
			problem(w, 400, err.Error())
			return
		}
		logFlow.Store(value.Enabled)
		jsonResponse(w, 200, map[string]bool{"enabled": value.Enabled})
	})
	mux.HandleFunc("/__benchmark/manual", func(w http.ResponseWriter, r *http.Request) {
		index, err := os.ReadFile(filepath.Join(os.Getenv("KUBEVIEW_BENCH_STATIC"), "index.html"))
		if err != nil {
			problem(w, 500, err.Error())
			return
		}
		bootstrap, err := os.ReadFile(os.Getenv("KUBEVIEW_BENCH_BOOTSTRAP"))
		if err != nil {
			problem(w, 500, "Manual bootstrap missing; use benchmarks/serve.mjs")
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write([]byte(strings.Replace(string(index), "<head>", "<head><script>"+string(bootstrap)+"</script>", 1)))
	})
	mux.HandleFunc("/__benchmark/result", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" || !SameOrigin(r) {
			problem(w, 403, "same-origin POST required")
			return
		}
		var result json.RawMessage
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<20)).Decode(&result); err != nil {
			problem(w, 400, err.Error())
			return
		}
		out := os.Getenv("KUBEVIEW_BENCH_RESULT_DIR")
		if out == "" {
			problem(w, 400, "No result directory configured")
			return
		}
		if err := os.MkdirAll(out, 0755); err != nil {
			problem(w, 500, err.Error())
			return
		}
		file := "manual-" + time.Now().UTC().Format("20060102T150405.000000000") + ".json"
		if err := os.WriteFile(filepath.Join(out, file), result, 0644); err != nil {
			problem(w, 500, err.Error())
			return
		}
		jsonResponse(w, 200, map[string]string{"saved": file})
	})
	mux.HandleFunc("/api/contexts", func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, 200, map[string]interface{}{"contexts": []map[string]string{{"name": "benchmark"}}, "current": "benchmark", "configured": true, "readOnly": true})
	})
	mux.HandleFunc("/api/metrics", func(w http.ResponseWriter, r *http.Request) {
		jsonResponse(w, 200, map[string]interface{}{"available": false, "source": "synthetic fixture", "error": "Benchmark fixture does not provide usage metrics"})
	})
	mux.HandleFunc("/api/logs", func(w http.ResponseWriter, r *http.Request) {
		// Synthetic fixture transport only. Match the guarded client contract so
		// frontend benchmarks do not silently bypass response identity checks.
		q := r.URL.Query()
		fixture, identityErr := c.Dynamic.Resource(benchGVR["Pod"]).Namespace(q.Get("namespace")).Get(r.Context(), q.Get("pod"), metav1.GetOptions{})
		if identityErr != nil || q.Get("uid") == "" || string(fixture.GetUID()) != q.Get("uid") {
			problem(w, 409, "Benchmark fixture Pod UID uyuşmuyor")
			return
		}
		session, sessionErr := logSessionName(q.Get("session"))
		if sessionErr != nil {
			failure(w, sessionErr)
			return
		}
		w.Header().Set("X-KubeView-Pod-UID", q.Get("uid"))
		w.Header().Set("X-KubeView-Log-Session", session)
		w.Header().Set("X-KubeView-Log-Protocol", "guarded-text-v1")

		mu.Lock()
		logOpened++
		logRequests = append(logRequests, map[string]string{"namespace": r.URL.Query().Get("namespace"), "pod": r.URL.Query().Get("pod"), "container": r.URL.Query().Get("container")})
		if len(logRequests) > 20 {
			logRequests = logRequests[len(logRequests)-20:]
		}
		mu.Unlock()
		defer func() { mu.Lock(); logClosed++; mu.Unlock() }()
		w.Header().Set("Content-Type", "text/plain")
		tick := time.NewTicker(100 * time.Millisecond)
		defer tick.Stop()
		writeLine := func(i int) bool {
			timestamp := time.Now().UTC().Format(time.RFC3339Nano)
			if logGated {
				timestamp = time.Now().UTC().Format("2006-01-02T15:04:05.000000000Z")
				if i < burstLines {
					timestamp = "2026-10-23T00:00:00.000000000Z"
				}
			}
			n, err := fmt.Fprintf(w, "%s BENCHMARK synthetic log %s/%s container=%s line=%d %s\n", timestamp, r.URL.Query().Get("namespace"), r.URL.Query().Get("pod"), r.URL.Query().Get("container"), i, logPayload)
			if err == nil {
				logWrittenLines.Add(1)
				logWrittenBytes.Add(int64(n))
			}
			return err == nil
		}
		for i := 0; i < burstLines; i++ {
			if !writeLine(i) {
				return
			}
			if i%128 == 127 {
				if f, ok := w.(http.Flusher); ok {
					f.Flush()
				}
			}
		}
		if burstLines > 0 {
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
		i := burstLines
		for {
			select {
			case <-r.Context().Done():
				return
			case <-tick.C:
				if !logFlow.Load() {
					continue
				}
				if !writeLine(i) {
					return
				}
				i++
				if f, ok := w.(http.Flusher); ok {
					f.Flush()
				}
			}
		}
	})
	mux.HandleFunc("/__benchmark/replay", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			problem(w, 405, "POST only")
			return
		}
		var events []replayEvent
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<20)).Decode(&events); err != nil {
			problem(w, 400, err.Error())
			return
		}
		mu.Lock()
		if running {
			mu.Unlock()
			problem(w, 409, "replay running")
			return
		}
		running = true
		samples = nil
		mu.Unlock()
		go func() {
			defer func() {
				c.Dynamic.(*dynamicfake.FakeDynamicClient).ClearActions()
				mu.Lock()
				running = false
				mu.Unlock()
			}()
			start := time.Now()
			for _, e := range events {
				if wait := time.Duration(e.AtMS*float64(time.Millisecond)) - time.Since(start); wait > 0 {
					time.Sleep(wait)
				}
				begin := time.Now()
				client := c.Dynamic.Resource(benchGVR[e.Object.GetKind()]).Namespace(e.Object.GetNamespace())
				var err error
				switch e.Action {
				case "ADD":
					_, err = client.Create(context.Background(), e.Object, metav1.CreateOptions{})
				case "UPDATE":
					_, err = client.Update(context.Background(), e.Object, metav1.UpdateOptions{})
				case "DELETE":
					err = client.Delete(context.Background(), e.Object.GetName(), metav1.DeleteOptions{})
				}
				sample := replaySample{Sequence: e.Sequence, PlannedMS: e.AtMS, ActualMS: float64(begin.Sub(start)) / float64(time.Millisecond), ApplyMS: float64(time.Since(begin)) / float64(time.Millisecond)}
				if err != nil {
					sample.Error = err.Error()
				}
				mu.Lock()
				samples = append(samples, sample)
				producerNS += time.Since(begin).Nanoseconds()
				mu.Unlock()
			}
		}()
		jsonResponse(w, 202, map[string]int{"scheduled": len(events)})
	})
	mux.HandleFunc("/__benchmark/state", func(w http.ResponseWriter, r *http.Request) {
		list := []*unstructured.Unstructured{}
		for _, gvr := range benchGVR {
			ls, e := c.Dynamic.Resource(gvr).List(r.Context(), metav1.ListOptions{})
			if e == nil {
				for i := range ls.Items {
					list = append(list, ls.Items[i].DeepCopy())
				}
			}
		}
		c.Dynamic.(*dynamicfake.FakeDynamicClient).ClearActions()
		c.Typed.(*kubefake.Clientset).ClearActions()
		var mem runtime.MemStats
		runtime.ReadMemStats(&mem)
		mu.Lock()
		defer mu.Unlock()
		jsonResponse(w, 200, map[string]interface{}{"resources": list, "running": running, "samples": samples, "sameVersionResyncs": sameVersionResyncs.Load(), "logOpened": logOpened, "logClosed": logClosed, "logRequests": logRequests, "logWrittenLines": logWrittenLines.Load(), "logWrittenBytes": logWrittenBytes.Load(), "logFlow": logFlow.Load(), "producerApplyWallNs": producerNS, "go": map[string]interface{}{"goroutines": runtime.NumGoroutine(), "heapAlloc": mem.HeapAlloc, "heapInuse": mem.HeapInuse, "totalAlloc": mem.TotalAlloc, "numGC": mem.NumGC, "pauseTotalNs": mem.PauseTotalNs}})
	})
	mux.Handle("/api/", api)
	mux.Handle("/ws", api)
	mux.Handle("/", http.FileServer(http.Dir(os.Getenv("KUBEVIEW_BENCH_STATIC"))))
	address := os.Getenv("KUBEVIEW_BENCH_ADDR")
	if address == "" {
		address = "127.0.0.1:5190"
	}
	host, _, err := net.SplitHostPort(address)
	if err != nil || !net.ParseIP(host).IsLoopback() {
		t.Fatal("loopback only")
	}
	listener, err := net.Listen("tcp", address)
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	fmt.Printf("BENCHMARK FIXTURE ready http://%s; synthetic, read-only, no kubeconfig\n", address)
	t.Fatal(http.Serve(listener, mux))
}

func BenchmarkSnapshotCacheSanitizeMarshal(b *testing.B) {
	for _, count := range []int{50, 300, 1500} {
		b.Run(fmt.Sprint(count), func(b *testing.B) {
			store := cache.NewStore(func(obj interface{}) (string, error) {
				u := obj.(*unstructured.Unstructured)
				key, err := cache.MetaNamespaceKeyFunc(obj)
				return u.GroupVersionKind().String() + "/" + key, err
			})
			if directory := os.Getenv("KUBEVIEW_BENCH_FIXTURES"); directory != "" {
				profile := map[int]string{50: "S", 300: "M", 1500: "L"}[count]
				raw, err := os.ReadFile(filepath.Join(directory, "fixture-"+profile+".json"))
				if err != nil {
					b.Fatal(err)
				}
				var resources []*unstructured.Unstructured
				if err = json.Unmarshal(raw, &resources); err != nil {
					b.Fatal(err)
				}
				for _, r := range resources {
					store.Add(r)
				}
			} else {
				for i := 0; i < count; i++ {
					u := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": fmt.Sprintf("pod-%d", i), "namespace": "bench", "uid": fmt.Sprintf("uid-%d", i), "resourceVersion": "opaque"}, "spec": map[string]interface{}{"nodeName": "worker", "containers": []interface{}{map[string]interface{}{"name": "app", "image": "fixture.invalid/app:v1"}}}}}
					store.Add(u)
				}
			}
			b.ReportAllocs()
			b.ResetTimer()
			for i := 0; i < b.N; i++ {
				snapshot := []*unstructured.Unstructured{}
				for _, o := range store.List() {
					snapshot = append(snapshot, sanitize(o.(*unstructured.Unstructured)))
				}
				encoded, err := json.Marshal(envelope{Type: "SNAPSHOT", Resources: snapshot, Synced: true})
				if err != nil {
					b.Fatal(err)
				}
				b.SetBytes(int64(len(encoded)))
			}
		})
	}
}
