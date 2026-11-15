package provision

import (
	"context"
	"errors"
	"path/filepath"
	"sync/atomic"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

// These are deterministic provider contract tests, not real worker E2E.
type testRunner struct {
	inv        Inventory
	calls      atomic.Int32
	add        func(context.Context, func(string)) error
	profileUID string
}

func (r *testRunner) Inventory(context.Context, Config) (Inventory, error)     { return r.inv, nil }
func (r *testRunner) ProfileUID(context.Context, Config) (string, error)       { return r.profileUID, nil }
func (r *testRunner) HostExists(context.Context, Config, string) (bool, error) { return false, nil }
func (r *testRunner) Add(ctx context.Context, _ Config, line func(string), started func(int)) error {
	r.calls.Add(1)
	started(111)
	return r.add(ctx, line)
}
func testSetup(t *testing.T) (Config, *fake.Clientset, *testRunner) {
	t.Helper()
	cfg := Config{Enabled: true, Profile: "kv-repair-test", Context: "kv-repair-test", ClusterUID: "owned-cluster-uid", Home: filepath.Join(t.TempDir(), ".minikube"), StateDir: t.TempDir(), Binary: "minikube", MaxNodes: 8, Timeout: time.Second}
	c := fake.NewSimpleClientset(&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "kube-system", UID: types.UID(cfg.ClusterUID)}}, &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: cfg.Profile, UID: "control-plane-uid"}})
	r := &testRunner{profileUID: cfg.ClusterUID, inv: Inventory{Driver: "docker", Machines: []Machine{{Name: cfg.Profile, IP: "10.0.0.2"}}}}
	return cfg, c, r
}
func await(t *testing.T, fn func() bool) {
	t.Helper()
	end := time.Now().Add(2 * time.Second)
	for time.Now().Before(end) {
		if fn() {
			return
		}
		time.Sleep(time.Millisecond * 5)
	}
	t.Fatal("bounded provider condition not met")
}
func TestWrongContextOrProfileClusterNeverRuns(t *testing.T) {
	cfg, c, r := testSetup(t)
	m, e := New(cfg, r)
	if e != nil {
		t.Fatal(e)
	}
	defer m.Close()
	for _, ctx := range []string{"production", ""} {
		if _, e = m.Begin(context.Background(), c, ctx, "same-key-123456789"); e == nil {
			t.Fatal("wrong context accepted")
		}
	}
	r.profileUID = "other-cluster"
	if _, e = m.Begin(context.Background(), c, cfg.Context, "same-key-123456789"); e == nil {
		t.Fatal("wrong provider cluster accepted")
	}
	if r.calls.Load() != 0 {
		t.Fatal("provider was run")
	}
}
func TestProfileLockAndRestartNeverBlindlyRetry(t *testing.T) {
	cfg, c, r := testSetup(t)
	r.add = func(ctx context.Context, _ func(string)) error { <-ctx.Done(); return ctx.Err() }
	m, e := New(cfg, r)
	if e != nil {
		t.Fatal(e)
	}
	if other, e := New(cfg, r); e == nil {
		other.Close()
		t.Fatal("concurrent profile owner allowed")
	}
	op, e := m.Begin(context.Background(), c, cfg.Context, "restart-key-123456789")
	if e != nil {
		t.Fatal(e)
	}
	await(t, func() bool { return r.calls.Load() == 1 })
	m.Close()
	m2, e := New(cfg, r)
	if e != nil {
		t.Fatal(e)
	}
	defer m2.Close()
	same, e := m2.Begin(context.Background(), c, cfg.Context, "restart-key-123456789")
	if e != nil || same.ID != op.ID {
		t.Fatal("idempotent resume lost", e)
	}
	if _, e = m2.Begin(context.Background(), c, cfg.Context, "different-key-123456789"); e == nil {
		t.Fatal("unfinished request allowed second worker")
	}
	if r.calls.Load() != 1 {
		t.Fatal("provider retried across restart")
	}
}
func TestCLIExitZeroIsNotReadyOrUnrelatedNodeAttribution(t *testing.T) {
	cfg, c, r := testSetup(t)
	r.add = func(_ context.Context, line func(string)) error {
		line("Adding node kv-repair-test-m02 to cluster kv-repair-test as [worker]")
		return nil
	}
	m, e := New(cfg, r)
	if e != nil {
		t.Fatal(e)
	}
	defer m.Close()
	op, e := m.Begin(context.Background(), c, cfg.Context, "request-key-123456789")
	if e != nil {
		t.Fatal(e)
	}
	await(t, func() bool {
		for _, o := range m.Snapshot() {
			if o.ID == op.ID && o.ProcessExited {
				return true
			}
		}
		return false
	})
	for _, o := range m.Snapshot() {
		if o.Status == "ready" || o.NodeUID != "" {
			t.Fatal("CLI exit was used as Node readiness")
		}
	}
	_, _ = c.CoreV1().Nodes().Create(context.Background(), &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: "unrelated-worker", UID: "unrelated", CreationTimestamp: metav1.Now()}, Status: corev1.NodeStatus{Conditions: []corev1.NodeCondition{{Type: corev1.NodeReady, Status: corev1.ConditionTrue}}}}, metav1.CreateOptions{})
	if m.Reconcile(context.Background(), c) {
		t.Fatal("unrelated Node completed request")
	}
}
func TestDoubleRequestAndRealObservationAssociation(t *testing.T) {
	cfg, c, r := testSetup(t)
	gate := make(chan struct{})
	r.add = func(ctx context.Context, line func(string)) error {
		line("Adding node kv-repair-test-m02 to cluster kv-repair-test as [worker]")
		select {
		case <-gate:
			return nil
		case <-ctx.Done():
			return ctx.Err()
		}
	}
	m, e := New(cfg, r)
	if e != nil {
		t.Fatal(e)
	}
	defer m.Close()
	a, e := m.Begin(context.Background(), c, cfg.Context, "double-key-123456789")
	if e != nil {
		t.Fatal(e)
	}
	b, e := m.Begin(context.Background(), c, cfg.Context, "double-key-123456789")
	if e != nil || a.ID != b.ID {
		t.Fatal("duplicate request not idempotent", e)
	}
	await(t, func() bool { return r.calls.Load() == 1 })
	r.inv.Machines = append(r.inv.Machines, Machine{Name: cfg.Profile + "-m02", IP: "10.0.0.3"})
	_, e = c.CoreV1().Nodes().Create(context.Background(), &corev1.Node{ObjectMeta: metav1.ObjectMeta{Name: cfg.Profile + "-m02", UID: "new-worker-uid", CreationTimestamp: metav1.Now()}, Status: corev1.NodeStatus{Addresses: []corev1.NodeAddress{{Type: corev1.NodeInternalIP, Address: "10.0.0.3"}}, Conditions: []corev1.NodeCondition{{Type: corev1.NodeReady, Status: corev1.ConditionTrue}}}}, metav1.CreateOptions{})
	if e != nil {
		t.Fatal(e)
	}
	close(gate)
	await(t, func() bool {
		for _, o := range m.Snapshot() {
			if o.Status == "ready" && o.NodeUID == "new-worker-uid" {
				return true
			}
		}
		return false
	})
	if r.calls.Load() != 1 {
		t.Fatal("duplicate actual provider execution")
	}
}
func TestUnsupportedDriverAndInvalidIdempotency(t *testing.T) {
	cfg, c, r := testSetup(t)
	r.add = func(context.Context, func(string)) error { return errors.New("must not run") }
	r.inv.Driver = "none"
	m, e := New(cfg, r)
	if e != nil {
		t.Fatal(e)
	}
	defer m.Close()
	if _, e = m.Begin(context.Background(), c, cfg.Context, "valid-key-123456789"); e == nil {
		t.Fatal("unsupported driver accepted")
	}
	if _, e = m.Begin(context.Background(), c, cfg.Context, "bad; shell"); e == nil {
		t.Fatal("invalid idempotency key accepted")
	}
}

var _ kubernetes.Interface = (*fake.Clientset)(nil)
