package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	k8sruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	dynamicfake "k8s.io/client-go/dynamic/fake"
)

func TestBenchmarkSlowReaderReconnect(t *testing.T) {
	if os.Getenv("KUBEVIEW_BENCH_NETWORK") != "1" {
		t.Skip("explicit network diagnostic opt-in")
	}
	s, c := testServer(t, true, pod("existing", "existing"))
	initial, _ := k8sruntime.DefaultUnstructuredConverter.ToUnstructured(pod("existing", "existing"))
	c.Dynamic = dynamicfake.NewSimpleDynamicClientWithCustomListKinds(k8sruntime.NewScheme(), map[schema.GroupVersionResource]string{
		{Version: "v1", Resource: "pods"}: "PodList", {Version: "v1", Resource: "nodes"}: "NodeList", {Version: "v1", Resource: "secrets"}: "SecretList",
	}, &unstructured.Unstructured{Object: initial})
	baseGoroutines := runtime.NumGoroutine()
	var mu sync.Mutex
	type queued struct {
		at   time.Time
		size int
	}
	queues := map[string]map[*unstructured.Unstructured]queued{}
	closes := map[string]bool{}
	opens := []string{}
	queueBytes, maxQueueBytes, maxDepth := 0, 0, 0
	var queueAges, gateWait, writeTimes, snapshotBuild []float64
	var snapshotBytes []int
	var observerMarshalNS int64
	s.streamProbe = func(id, stage string, msg envelope, depth int, elapsed time.Duration) {
		now := time.Now()
		size := 0
		if stage == "queue" {
			raw, _ := json.Marshal(msg.Object)
			size = len(raw)
		}
		if stage == "write_begin" && msg.Type == "SNAPSHOT" {
			raw, _ := json.Marshal(msg)
			size = len(raw)
		}
		encodedAt := time.Now()
		mu.Lock()
		defer mu.Unlock()
		observerMarshalNS += encodedAt.Sub(now).Nanoseconds()
		switch stage {
		case "open":
			opens = append(opens, id)
			queues[id] = map[*unstructured.Unstructured]queued{}
		case "queue":
			if closes[id] {
				return
			}
			queues[id][msg.Object] = queued{at: now, size: size}
			queueBytes += size
			if queueBytes > maxQueueBytes {
				maxQueueBytes = queueBytes
			}
			if depth > maxDepth {
				maxDepth = depth
			}
		case "gate_wait":
			gateWait = append(gateWait, float64(elapsed)/float64(time.Millisecond))
		case "write_begin", "overflow":
			if q, ok := queues[id][msg.Object]; ok {
				queueAges = append(queueAges, float64(now.Sub(q.at))/float64(time.Millisecond))
				queueBytes -= q.size
				delete(queues[id], msg.Object)
			}
			if msg.Type == "SNAPSHOT" {
				snapshotBytes = append(snapshotBytes, size)
			}
		case "write_end":
			writeTimes = append(writeTimes, float64(elapsed)/float64(time.Millisecond))
		case "snapshot_build":
			snapshotBuild = append(snapshotBuild, float64(elapsed)/float64(time.Millisecond))
		case "close":
			for _, q := range queues[id] {
				queueAges = append(queueAges, float64(now.Sub(q.at))/float64(time.Millisecond))
				queueBytes -= q.size
			}
			delete(queues, id)
			closes[id] = true
		}
	}
	mux := http.NewServeMux()
	s.Register(mux)
	server := httptest.NewServer(mux)
	defer server.Close()
	url := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws?context=test"
	connect := func(dialer *websocket.Dialer) *websocket.Conn {
		conn, _, err := dialer.Dial(url, nil)
		if err != nil {
			t.Fatal(err)
		}
		conn.SetReadDeadline(time.Now().Add(20 * time.Second))
		for {
			var msg envelope
			if err = conn.ReadJSON(&msg); err != nil {
				t.Fatal(err)
			}
			if msg.Type == "SNAPSHOT_READY" {
				if !msg.Synced {
					t.Fatal("unsynced initial snapshot")
				}
				break
			}
		}
		return conn
	}
	normal := connect(websocket.DefaultDialer)
	defer normal.Close()
	slowDialer := *websocket.DefaultDialer
	slowDialer.NetDialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
		conn, err := (&net.Dialer{}).DialContext(ctx, network, address)
		if err == nil {
			if tcp, ok := conn.(*net.TCPConn); ok {
				tcp.SetReadBuffer(1024)
			}
		}
		return conn, err
	}
	slow := connect(&slowDialer)
	defer slow.Close()
	mu.Lock()
	slowID := opens[len(opens)-1]
	mu.Unlock()
	starts := sync.Map{}
	deliveries := make(chan float64, 400)
	seen := sync.Map{}
	go func() {
		for {
			var msg envelope
			if normal.ReadJSON(&msg) != nil {
				return
			}
			if msg.Type == "RESOURCE_EVENT" && msg.Object != nil {
				key := msg.Action + ":" + string(msg.Object.GetUID())
				if start, ok := starts.Load(key); ok {
					seen.Store(key, true)
					deliveries <- float64(time.Since(start.(time.Time))) / float64(time.Millisecond)
				}
			}
		}
	}()
	client := c.Dynamic.Resource(schema.GroupVersionResource{Version: "v1", Resource: "pods"}).Namespace("qa")
	payload := strings.Repeat("benchmark-", 4096)
	reconnectsDone := make(chan struct{})
	reconnectSamples := []map[string]interface{}{}
	go func() {
		defer close(reconnectsDone)
		for _, cohort := range []int{1, 3} {
			time.Sleep(150 * time.Millisecond)
			var wg sync.WaitGroup
			for i := 0; i < cohort; i++ {
				wg.Add(1)
				go func() {
					defer wg.Done()
					begin := time.Now()
					conn, _, err := websocket.DefaultDialer.Dial(url, nil)
					if err != nil {
						t.Error(err)
						return
					}
					defer conn.Close()
					conn.SetReadDeadline(time.Now().Add(8 * time.Second))
					items := 0
					for {
						var m envelope
						if err = conn.ReadJSON(&m); err != nil {
							t.Error(err)
							return
						}
						if m.Type == "SNAPSHOT" {
							items = len(m.Resources)
							if !m.Synced || items == 0 {
								t.Error("reconnect snapshot incomplete")
								return
							}
						}
						if m.Type == "SNAPSHOT_READY" {
							if !m.Synced || items == 0 {
								t.Error("reconnect not ready")
								return
							}
							break
						}
					}
					mu.Lock()
					reconnectSamples = append(reconnectSamples, map[string]interface{}{"cohort": cohort, "snapshotItems": items, "readyMs": float64(time.Since(begin)) / float64(time.Millisecond)})
					mu.Unlock()
				}()
			}
			wg.Wait()
		}
	}()
	const count = 150
	begin := time.Now()
	for i := 0; i < count; i++ {
		uid := fmt.Sprintf("net-%d", i)
		obj := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": uid, "uid": uid, "namespace": "qa", "resourceVersion": uid, "annotations": map[string]interface{}{"benchmark": payload}}, "spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "fixture.invalid/app:v1"}}}}}
		starts.Store("ADD:"+uid, time.Now())
		if _, err := client.Create(context.Background(), obj, metav1.CreateOptions{}); err != nil {
			t.Fatal(err)
		}
		time.Sleep(10 * time.Millisecond)
	}
	for i := 0; i < count; i++ {
		uid := fmt.Sprintf("net-%d", i)
		starts.Store("DELETE:"+uid, time.Now())
		if err := client.Delete(context.Background(), uid, metav1.DeleteOptions{}); err != nil {
			t.Fatal(err)
		}
		time.Sleep(5 * time.Millisecond)
	}
	latency := []float64{}
	deadline := time.After(8 * time.Second)
	for len(latency) < count*2 {
		select {
		case d := <-deliveries:
			latency = append(latency, d)
		case <-deadline:
			t.Fatalf("normal client missed changes: %d/%d", len(latency), count*2)
		}
	}
	<-reconnectsDone
	deadlineAt := time.Now().Add(14 * time.Second)
	for {
		mu.Lock()
		closed := closes[slowID]
		mu.Unlock()
		if closed {
			break
		}
		if time.Now().After(deadlineAt) {
			t.Fatal("slow-reader write deadline did not clean up connection")
		}
		time.Sleep(100 * time.Millisecond)
	}
	normal.Close()
	slow.Close()
	time.Sleep(500 * time.Millisecond)
	deadlineAt = time.Now().Add(5 * time.Second)
	for runtime.NumGoroutine() > baseGoroutines+8 && time.Now().Before(deadlineAt) {
		time.Sleep(100 * time.Millisecond)
	}
	finalGoroutines := runtime.NumGoroutine()
	mu.Lock()
	defer mu.Unlock()
	if len(queues) != 0 || queueBytes != 0 {
		t.Fatalf("stream cleanup leaked queues: %d %d", len(queues), queueBytes)
	}
	if finalGoroutines > baseGoroutines+8 {
		t.Fatalf("goroutine cleanup: %d -> %d", baseGoroutines, finalGoroutines)
	}
	report := map[string]interface{}{"date": time.Now().UTC(), "normalChanges": len(latency), "expected": count * 2, "normalDeliveryMs": latency, "clients": "one normal, one stopped reader, three concurrent reconnects (per-connection informers; no shared fan-out hub)", "goroutinesBefore": baseGoroutines, "goroutinesAfter": finalGoroutines, "maxQueueDepth": maxDepth, "maxQueuedResourceJSONBytes": maxQueueBytes, "queueAgeMs": queueAges, "gateWaitMs": gateWait, "writeWallMs": writeTimes, "snapshotBuildMs": snapshotBuild, "snapshotEnvelopeBytes": snapshotBytes, "elapsedMs": float64(time.Since(begin)) / float64(time.Millisecond), "probeMarshalWallNs": observerMarshalNS, "probeNote": "Diagnostic only: queue bytes are JSON-equivalent resource payload size, not resident Go bytes; observer serialization adds cost. Write wall includes JSON encoding and socket write, not completed network/GPU time."}
	report["reconnectSamples"] = reconnectSamples
	if out := os.Getenv("KUBEVIEW_BENCH_RESULT_DIR"); out != "" {
		os.MkdirAll(out, 0755)
		raw, _ := json.MarshalIndent(report, "", "  ")
		if err := os.WriteFile(filepath.Join(out, "backend-network.json"), raw, 0644); err != nil {
			t.Fatal(err)
		}
	}
	t.Logf("delivered %d changes; queue max=%d bytes=%d; goroutines %d -> %d", len(latency), maxDepth, maxQueueBytes, baseGoroutines, finalGoroutines)
}
