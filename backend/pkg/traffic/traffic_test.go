package traffic

// These fixtures exercise the adapter and temporal/authorization contract.
// They are not Hubble/Cilium or real Kubernetes end-to-end evidence.
import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/fake"
)

func flowFixture(now time.Time, uuid string) []byte {
	return []byte(fmt.Sprintf(`{"flow":{"time":%q,"uuid":%q,"verdict":"FORWARDED","IP":{"source":"10.0.0.1","destination":"10.0.0.2","encrypted":true},"source":{"pod_name":"sender","namespace":"qa","cluster_name":"lab","labels":["private-label"]},"destination":{"pod_name":"receiver","namespace":"qa","cluster_name":"lab"},"l4":{"TCP":{"source_port":40000,"destination_port":80}},"traffic_direction":"EGRESS","is_reply":false}}`, now.Format(time.RFC3339Nano), uuid))
}

func TestJSONPBWhitelistAndMeasuredProtocols(t *testing.T) {
	now := time.Now().UTC()
	row, lost, err := decodeObservation(flowFixture(now, "one"))
	if err != nil || row == nil || lost != 0 || row.protocol != "TCP" || row.latencyMS != nil {
		t.Fatalf("port 80/encrypted must remain measured TCP: row=%+v lost=%d err=%v", row, lost, err)
	}
	var envelope map[string]interface{}
	if err = json.Unmarshal(flowFixture(now, "http"), &envelope); err != nil {
		t.Fatal(err)
	}
	flow := envelope["flow"].(map[string]interface{})
	flow["l7"] = map[string]interface{}{"type": "RESPONSE", "latency_ns": "1250000", "http": map[string]interface{}{"code": 200, "protocol": "HTTP/2", "url": "https://private.invalid/secret", "headers": []string{"Authorization: hidden"}}}
	line, _ := json.Marshal(envelope)
	row, _, err = decodeObservation(line)
	if err != nil || row.protocol != "HTTP" || row.httpProtocol == nil || *row.httpProtocol != "HTTP/2" || row.latencyMS == nil || *row.latencyMS != 1.25 {
		t.Fatalf("actual L7 response was not retained correctly: %+v %v", row, err)
	}
	if strings.Contains(fmt.Sprintf("%+v", row), "private.invalid") || strings.Contains(fmt.Sprintf("%+v", row), "Authorization") {
		t.Fatal("sensitive L7 field retained")
	}
	flow["l7"].(map[string]interface{})["type"] = "REQUEST"
	line, _ = json.Marshal(envelope)
	row, _, err = decodeObservation(line)
	if err != nil || row.latencyMS != nil || row.protocol == "gRPC" {
		t.Fatal("request latency or inferred gRPC was invented")
	}
	flow["l7"] = map[string]interface{}{"type": "RESPONSE", "latencyNs": "2000000", "dns": map[string]interface{}{"rcode": 3, "query": "private.cluster.local"}}
	flow["l4"] = map[string]interface{}{"UDP": map[string]interface{}{"sourcePort": 40000, "destinationPort": 53}}
	line, _ = json.Marshal(envelope)
	row, _, err = decodeObservation(line)
	if err != nil || row.protocol != "DNS" || row.transport != "UDP" || row.dnsRcode == nil || *row.dnsRcode != 3 {
		t.Fatalf("DNS/UDP measured fields: %+v %v", row, err)
	}
	_, lost, err = decodeObservation([]byte(`{"lost_events":{"num_events":"19"}}`))
	if err != nil || lost != 19 {
		t.Fatal("provider loss must remain explicit")
	}
}

func podFixture(uid, name, ip string) corev1.Pod {
	return corev1.Pod{ObjectMeta: metav1.ObjectMeta{UID: types.UID(uid), Name: name, Namespace: "qa"}, Spec: corev1.PodSpec{NodeName: "worker"}, Status: corev1.PodStatus{Phase: corev1.PodRunning, PodIP: ip}}
}

func TestIdentityHistoryPositiveIntervalsReuseAndBounds(t *testing.T) {
	h := newHistory()
	start := time.Now().UTC()
	pod := podFixture("old", "sender", "10.0.0.1")
	endpoint := observedEndpoint{name: pod.Name, namespace: pod.Namespace, ip: pod.Status.PodIP}
	h.observe([]corev1.Pod{pod}, start)
	if h.endpoint(endpoint, start, true).UID != nil {
		t.Fatal("a single current-IP observation is not an interval")
	}
	h.observe([]corev1.Pod{pod}, start.Add(2*time.Second))
	if got := h.endpoint(endpoint, start.Add(time.Second), true); got.UID == nil || *got.UID != "old" || got.NodeName == nil {
		t.Fatalf("positive old interval missing: %+v", got)
	}
	if h.endpoint(endpoint, start.Add(-time.Nanosecond), true).UID != nil {
		t.Fatal("old flow was bound to current IP")
	}
	if h.endpoint(endpoint, start.Add(time.Second), false).NodeName != nil {
		t.Fatal("node metadata escaped denied policy")
	}
	newPod := podFixture("new", "sender", "10.0.0.1")
	h.observe([]corev1.Pod{newPod}, start.Add(4*time.Second))
	h.observe([]corev1.Pod{newPod}, start.Add(6*time.Second))
	if h.endpoint(endpoint, start.Add(3*time.Second), true).UID != nil {
		t.Fatal("IP reuse gap was incorrectly assigned")
	}
	if got := h.endpoint(endpoint, start.Add(5*time.Second), true); got.UID == nil || *got.UID != "new" {
		t.Fatalf("new UID interval missing: %+v", got)
	}
	if got := h.endpoint(endpoint, start.Add(time.Second), true); got.UID == nil || *got.UID != "old" {
		t.Fatalf("historical flow migrated to replacement: %+v", got)
	}
	h.breakContinuity()
	h.observe([]corev1.Pod{newPod}, start.Add(9*time.Second))
	h.observe([]corev1.Pod{newPod}, start.Add(10*time.Second))
	if h.endpoint(endpoint, start.Add(8*time.Second), true).UID != nil {
		t.Fatal("failed LIST interval bridged")
	}
	h.observe([]corev1.Pod{newPod}, start.Add(50*time.Second))
	h.observe([]corev1.Pod{newPod}, start.Add(52*time.Second))
	if got := h.endpoint(endpoint, start.Add(51*time.Second), true); got.UID == nil || *got.UID != "new" {
		t.Fatal("pruning left a detached current binding")
	}
	for i := 0; i < maxBindingsPerIP+5; i++ {
		p := podFixture(fmt.Sprint(i), "sender", "10.0.0.1")
		h.observe([]corev1.Pod{p}, start.Add(53*time.Second+time.Duration(i)*time.Millisecond))
	}
	if len(h.byIP[endpoint.ip]) > maxBindingsPerIP || h.dropped == 0 {
		t.Fatal("IP history must be finite and omissions explicit")
	}
}

func TestBothEndpointNamespaceGateAndBoundedFlowWindow(t *testing.T) {
	now := time.Now().UTC()
	row, _, _ := decodeObservation(flowFixture(now, "one"))
	if !row.permitted("qa") {
		t.Fatal("owned namespace rejected")
	}
	row.destination.namespace = "private"
	if row.permitted("qa") {
		t.Fatal("cross-namespace endpoint metadata must be dropped even if CLI OR-filters it in")
	}
	row.destination.namespace = "qa"
	row.source.name = ""
	if row.permitted("") {
		t.Fatal("unknown endpoint must not pass global gate")
	}
	row, _, _ = decodeObservation(flowFixture(now, "one"))
	h := &Hub{cfg: Config{ClusterUID: "cluster", ClusterName: "lab"}}
	s := &collection{hub: h, contextName: "ctx", namespace: "qa", history: newHistory(), seen: map[string]time.Time{}, status: "connecting"}
	s.ingest(*row, now)
	s.ingest(*row, now)
	for i := 0; i < maxEvents+20; i++ {
		copy := *row
		copy.uuid = fmt.Sprintf("event-%d", i)
		copy.source.name = fmt.Sprintf("sender-%d", i)
		s.ingest(copy, now)
	}
	result := s.snapshot(now)
	if s.count != maxEvents || len(s.seen) != maxEvents || result.Dropped == 0 || result.DuplicateEvents != 1 || len(result.Flows) != maxFlowGroups || result.OmittedGroups == 0 {
		t.Fatalf("unbounded or hidden aggregation: count=%d seen=%d result=%+v", s.count, len(s.seen), result)
	}
	if !strings.Contains(result.Units, "not packets") {
		t.Fatal("flow observations must not be packets/bandwidth")
	}
	if after := s.snapshot(now.Add(Window + time.Second)); len(after.Flows) != 0 {
		t.Fatal("stopped traffic remained animated beyond measurement window")
	}
}

func fakeCLI(t *testing.T, mode string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "hubble-fixture")
	// Standalone fixture process. No network, kubeconfig or installed Hubble is
	// used; cancellation exercises the same child process lifecycle as production.
	script := `#!/bin/sh
for arg in "$@"; do
 case "$arg" in
 version) printf 'hubble v1.20.2\n'; exit 0;;
 status) exit 0;;
 observe) MODE=observe;;
 esac
done
if [ "$MODE" != observe ]; then exit 3; fi
`
	if mode == "exit" {
		script += "exit 7\n"
	} else {
		if mode == "fail-once" {
			flag := "'" + strings.ReplaceAll(path+".observed", "'", "'\\''") + "'"
			script += fmt.Sprintf("if [ ! -f %s ]; then : > %s; exit 7; fi\n", flag, flag)
		}
		script += "while :; do sleep 0.05; done\n"
	}
	if err := os.WriteFile(path, []byte(script), 0700); err != nil {
		t.Fatal(err)
	}
	return path
}
func fixtureConfig(t *testing.T, mode string) Config {
	return Config{Enabled: true, Context: "ctx", ClusterUID: "cluster", ClusterName: "lab", Server: "127.0.0.1:4245", Binary: fakeCLI(t, mode), AllowLoopbackPlaintext: true}
}
func waitFor(t *testing.T, condition func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if condition() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("condition did not become true")
}

func TestTLSConfigAndEnvironmentIsolation(t *testing.T) {
	cfg := fixtureConfig(t, "wait")
	cfg.AllowLoopbackPlaintext = false
	_, tls, err := cfg.validate()
	if err != nil || !tls {
		t.Fatalf("TLS must default on: tls=%t err=%v", tls, err)
	}
	cfg.AllowLoopbackPlaintext = true
	cfg.Server = "public.invalid:4245"
	_, tls, err = cfg.validate()
	if err != nil || !tls {
		t.Fatal("plaintext override must not permit remote server")
	}
	cfg.Server = "127.0.0.1:4245"
	_, tls, err = cfg.validate()
	if err != nil || tls {
		t.Fatal("explicit owned loopback lab override failed")
	}
	cfg.TLSCert = "only-cert"
	if _, _, err = cfg.validate(); err == nil {
		t.Fatal("partial mTLS accepted")
	}
	t.Setenv("HUBBLE_BASIC_AUTH_PASSWORD", "should-not-escape")
	t.Setenv("KUBECONFIG", "private-kubeconfig")
	t.Setenv("HTTPS_PROXY", "private-proxy")
	env := strings.Join(safeEnvironment("/private"), "\n")
	if strings.Contains(env, "should-not-escape") || strings.Contains(env, "KUBECONFIG") || strings.Contains(env, "PROXY") {
		t.Fatal("implicit provider credentials/config leaked")
	}
}

func TestLeasesIdentityIsolationAndCollectorCleanup(t *testing.T) {
	h, err := NewHub(fixtureConfig(t, "wait"))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()
	client := fake.NewSimpleClientset()
	ctxA := WithIdentity(context.Background(), "reader-a")
	ctxB := WithIdentity(context.Background(), "reader-b")
	for _, ctx := range []context.Context{ctxA, ctxB} {
		if _, err = h.Snapshot(ctx, client, "ctx", "qa", false, "same-lease"); err != nil {
			t.Fatal(err)
		}
	}
	if _, err = h.Snapshot(ctxA, client, "ctx", "qa", false, "second-lease"); err != nil {
		t.Fatal(err)
	}
	var first *collection
	h.mu.Lock()
	for _, scope := range h.scopes {
		if strings.Contains(scope.key, "reader-a") {
			first = scope
		}
	}
	h.mu.Unlock()
	if first == nil {
		t.Fatal("reader scope missing")
	}
	waitFor(t, func() bool { return first.snapshot(time.Now().UTC()).Status == "live" })
	if got := first.snapshot(time.Now().UTC()); len(got.Flows) != 0 || got.Status != "live" {
		t.Fatal("healthy zero-flow provider must remain live")
	}
	h.ReleaseIdentity(ctxA, "ctx", "qa", "same-lease")
	h.mu.Lock()
	count := len(h.scopes)
	h.mu.Unlock()
	if count != 2 {
		t.Fatal("one browser canceled another lease")
	}
	h.ReleaseIdentity(ctxA, "ctx", "qa", "second-lease")
	select {
	case <-first.done:
	case <-time.After(3 * time.Second):
		t.Fatal("collector process/health reader not cleaned up")
	}
	h.mu.Lock()
	count = len(h.scopes)
	h.mu.Unlock()
	if count != 1 {
		t.Fatal("reader identity release canceled other identity")
	}
	directory := h.directory
	h.Close()
	if _, err = os.Stat(directory); !os.IsNotExist(err) {
		t.Fatal("private config retained after Close")
	}
}

func TestScopeLimitsExpiryFailureAndCloseRace(t *testing.T) {
	h, err := NewHub(fixtureConfig(t, "exit"))
	if err != nil {
		t.Fatal(err)
	}
	client := fake.NewSimpleClientset()
	ctx := WithIdentity(context.Background(), "reader")
	if _, err = h.Snapshot(ctx, client, "ctx", "qa", false, "one"); err != nil {
		t.Fatal(err)
	}
	h.mu.Lock()
	var scope *collection
	for _, s := range h.scopes {
		scope = s
	}
	h.mu.Unlock()
	waitFor(t, func() bool { return scope.snapshot(time.Now().UTC()).Status == "error" })
	row, _, _ := decodeObservation(flowFixture(time.Now().UTC(), "measured"))
	scope.mu.Lock()
	scope.ingest(*row, time.Now().UTC())
	scope.mu.Unlock()
	scope.setFailure("closed")
	if scope.snapshot(time.Now().UTC()).Status != "stale" {
		t.Fatal("stream disconnect with observed data must become stale")
	}
	for i := 1; i < maxLeases; i++ {
		if _, err = h.Snapshot(ctx, client, "ctx", "qa", false, fmt.Sprint(i)); err != nil {
			t.Fatal(err)
		}
	}
	if _, err = h.Snapshot(ctx, client, "ctx", "qa", false, "overflow"); err == nil {
		t.Fatal("lease limit not enforced")
	}
	scope.mu.Lock()
	for lease := range scope.leases {
		scope.leases[lease] = time.Now().Add(-leaseTTL - time.Second)
	}
	scope.mu.Unlock()
	waitFor(t, func() bool { h.mu.Lock(); defer h.mu.Unlock(); return len(h.scopes) == 0 })
	var wg sync.WaitGroup
	for i := 0; i < 16; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_, _ = h.Snapshot(ctx, client, "ctx", fmt.Sprintf("ns-%d", i), false, "one")
		}(i)
	}
	h.Close()
	wg.Wait()
}

func TestProviderDisconnectReconnectWithoutNewLease(t *testing.T) {
	h, err := NewHub(fixtureConfig(t, "fail-once"))
	if err != nil {
		t.Fatal(err)
	}
	defer h.Close()
	ctx := WithIdentity(context.Background(), "reader")
	if _, err = h.Snapshot(ctx, fake.NewSimpleClientset(), "ctx", "qa", false, "same-active-lease"); err != nil {
		t.Fatal(err)
	}
	h.mu.Lock()
	var scope *collection
	for _, s := range h.scopes {
		scope = s
	}
	h.mu.Unlock()
	waitFor(t, func() bool { return scope.snapshot(time.Now().UTC()).Status == "error" })
	waitFor(t, func() bool { return scope.snapshot(time.Now().UTC()).Status == "live" })
	h.ReleaseIdentity(ctx, "ctx", "qa", "same-active-lease")
	select {
	case <-scope.done:
	case <-time.After(3 * time.Second):
		t.Fatal("reconnect supervisor left child processes/timer after last lease")
	}
}

func TestSelectedUIDPrioritizesAlreadyAuthorizedDenseGroups(t *testing.T) {
	now := time.Now().UTC()
	h := &Hub{cfg: Config{ClusterUID: "cluster", ClusterName: "lab"}}
	s := &collection{hub: h, contextName: "ctx", namespace: "qa", history: newHistory(), seen: map[string]time.Time{}, status: "live"}
	pods := []corev1.Pod{podFixture("selected-uid", "sender", "10.0.0.1"), podFixture("receiver-uid", "receiver", "10.0.0.2")}
	s.history.observe(pods, now.Add(-2*time.Second))
	s.history.observe(pods, now)
	selected, _, _ := decodeObservation(flowFixture(now.Add(-time.Second), "selected"))
	s.ingest(*selected, now)
	for i := 0; i < maxFlowGroups+5; i++ {
		row, _, _ := decodeObservation(flowFixture(now, fmt.Sprint(i)))
		row.source.name = fmt.Sprintf("other-%d", i)
		s.ingest(*row, now)
	}
	plain := s.snapshot(now)
	preferred := s.snapshot(now, "selected-uid")
	if plain.TotalFlowGroups != preferred.TotalFlowGroups || plain.OmittedGroups != preferred.OmittedGroups || len(preferred.Flows) != maxFlowGroups {
		t.Fatal("selection changed collection scope/counts or bound")
	}
	if preferred.Flows[0].Source.UID == nil || *preferred.Flows[0].Source.UID != "selected-uid" {
		t.Fatal("selected authorized older group silently omitted outside newest512")
	}
	for _, flow := range plain.Flows {
		if flow.Source.UID != nil && *flow.Source.UID == "selected-uid" {
			t.Fatal("fixture did not put selected group outside original newest512")
		}
	}
}

func TestProviderClusterBindingAndUnknownEndpointIdentityGate(t *testing.T) {
	now := time.Now().UTC()
	h := &Hub{cfg: Config{ClusterUID: "local-cluster-uid", ClusterName: "lab"}}
	s := &collection{hub: h, contextName: "ctx", namespace: "qa", history: newHistory(), seen: map[string]time.Time{}, status: "live"}
	remote, _, _ := decodeObservation(flowFixture(now, "remote"))
	remote.source.cluster = "other-cluster"
	remote.destination.cluster = "other-cluster"
	s.ingest(*remote, now)
	if s.count != 0 || s.filtered != 1 {
		t.Fatal("local namespace SSAR was used to expose a matching namespace in a remote cluster")
	}
	unknown, _, _ := decodeObservation(flowFixture(now.Add(-time.Second), "unknown"))
	unknown.source.cluster = ""
	unknown.destination.cluster = ""
	s.ingest(*unknown, now)
	if result := s.snapshot(now); len(result.Flows) != 0 || result.UnverifiedClusterEvents != 1 {
		t.Fatal("unknown cluster endpoint exposed without positive local UID intervals")
	}
	pods := []corev1.Pod{podFixture("source-local", "sender", "10.0.0.1"), podFixture("destination-local", "receiver", "10.0.0.2")}
	s.history.observe(pods, now.Add(-2*time.Second))
	s.history.observe(pods, now)
	if result := s.snapshot(now); len(result.Flows) != 1 || result.Flows[0].Source.UID == nil || *result.Flows[0].Source.UID != "source-local" {
		t.Fatal("confirmed local history could not establish unknown-cluster endpoint identity")
	}
}
