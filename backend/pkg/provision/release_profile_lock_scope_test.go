//go:build !windows

package provision

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// Different journals must not grant concurrent ownership of one physical profile.
// All Kubernetes and provider calls here use the existing fake test helpers.
func TestReleaseProfileLockSpansStateDirs(t *testing.T) {
	cfg, client, runner := testSetup(t)
	profileDir := filepath.Join(cfg.Home, "profiles", cfg.Profile)
	if err := os.MkdirAll(profileDir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(profileDir, "config.json"), []byte(`{"Name":"kv-repair-test","Driver":"docker","Nodes":[{"Name":"kv-repair-test","IP":"10.0.0.2","ControlPlane":true}]}`), 0600); err != nil {
		t.Fatal(err)
	}
	cfg.Timeout = 5 * time.Second
	finished := make(chan struct{})
	runner.add = func(ctx context.Context, line func(string)) error {
		defer close(finished)
		line("Adding node kv-repair-test-m02 to cluster kv-repair-test as [worker]")
		<-ctx.Done()
		return ctx.Err()
	}
	first, err := New(cfg, runner)
	if err != nil {
		t.Fatal("first manager failed", err)
	}
	defer first.Close()
	if duplicate, err := New(cfg, runner); err == nil {
		duplicate.Close()
		t.Fatal("control: same-StateDir lock was not exclusive")
	}
	op, err := first.Begin(context.Background(), client, cfg.Context, "profile-scope-control-key")
	if err != nil {
		t.Fatal("control: first manager could not begin fake operation", err)
	}
	await(t, func() bool { return runner.calls.Load() == 1 })
	same, err := first.Begin(context.Background(), client, cfg.Context, "profile-scope-control-key")
	if err != nil || same.ID != op.ID {
		t.Fatal("control: first manager lost same-key operation", err)
	}
	t.Log("control: first manager owns lock, fake add ran once, same-key request reused its operation")

	otherCfg := cfg
	otherCfg.StateDir = t.TempDir()
	if second, err := New(otherCfg, runner); err == nil {
		second.Close()
		t.Error("PROFILE-LOCK-SCOPE: same Home/Profile acquired by second manager with a different StateDir; physical profile ownership must remain exclusive")
	} else {
		t.Log("second manager rejected while first owns same Home/Profile")
	}

	first.Close()
	select {
	case <-finished:
	case <-time.After(time.Second):
		t.Fatal("control: first manager did not cancel and join its fake operation")
	}
	if runner.calls.Load() != 1 {
		t.Fatal("control: unexpected extra fake provider execution")
	}
	replacement, err := New(otherCfg, runner)
	if err != nil {
		t.Fatal("control: manager could not acquire profile after first closed", err)
	}
	replacement.Close()
	t.Log("control: fake operation joined and profile lock released after Close")
}

func TestReleaseProfileLockAcrossProcesses(t *testing.T) {
	cfg, _, runner := testSetup(t)
	first, err := New(cfg, runner)
	if err != nil {
		t.Fatal(err)
	}
	defer first.Close()
	childCfg := cfg
	childCfg.StateDir = t.TempDir()
	runReleaseProfileLockChild(t, childCfg, "PROFILE_LOCK_CHILD_REJECTED")
	first.Close()
	runReleaseProfileLockChild(t, childCfg, "PROFILE_LOCK_CHILD_ACQUIRED_RELEASED")
}

// The child is this Go test binary, with only synthetic configuration supplied.
// Neither branch starts an operation or executes a provider binary.
func TestReleaseProfileLockChild(t *testing.T) {
	if os.Getenv("KV_RELEASE_PROFILE_LOCK_CHILD") != "synthetic-only" {
		t.Skip("internal subprocess fixture; requires parent-owned synthetic config")
	}
	data, err := os.ReadFile(os.Getenv("KV_RELEASE_PROFILE_LOCK_CONFIG"))
	if err != nil {
		t.Fatal(err)
	}
	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		t.Fatal(err)
	}
	manager, err := New(cfg, &testRunner{})
	if err != nil {
		if !strings.Contains(err.Error(), "başka bir KubeView sağlayıcı süreci") {
			t.Fatal("unexpected constructor error", err)
		}
		fmt.Println("PROFILE_LOCK_CHILD_REJECTED")
		return
	}
	manager.Close()
	fmt.Println("PROFILE_LOCK_CHILD_ACQUIRED_RELEASED")
}

func runReleaseProfileLockChild(t *testing.T, cfg Config, expected string) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "synthetic-config.json")
	data, err := json.Marshal(cfg)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0600); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, os.Args[0], "-test.run=^TestReleaseProfileLockChild$", "-test.timeout=8s", "-test.v")
	cmd.Env = []string{"GOMAXPROCS=1", "KV_RELEASE_PROFILE_LOCK_CHILD=synthetic-only", "KV_RELEASE_PROFILE_LOCK_CONFIG=" + path}
	output, err := cmd.CombinedOutput()
	if err != nil || !bytes.Contains(output, []byte(expected+"\n")) {
		t.Fatalf("synthetic lock child: expected %s, exit=%v, output=%s", expected, err, output)
	}
	t.Log(expected)
}

func TestReleaseProfileLockHomeSymlinkAlias(t *testing.T) {
	cfg, _, runner := testSetup(t)
	first, err := New(cfg, runner)
	if err != nil {
		t.Fatal(err)
	}
	defer first.Close()
	alias := filepath.Join(t.TempDir(), "home-alias")
	if err := os.Symlink(cfg.Home, alias); err != nil {
		t.Fatal(err)
	}
	otherCfg := cfg
	otherCfg.Home, otherCfg.StateDir = alias, t.TempDir()
	if second, err := New(otherCfg, runner); err == nil {
		second.Close()
		t.Fatal("Home symlink alias bypassed physical profile lock")
	}
	first.Close()
	replacement, err := New(otherCfg, runner)
	if err != nil {
		t.Fatal("alias lock did not release after Close", err)
	}
	replacement.Close()
}

func TestReleaseProfileLockConstructorFailureReleasesBoth(t *testing.T) {
	cfg, _, runner := testSetup(t)
	journal := filepath.Join(cfg.StateDir, "minikube-"+cfg.Profile+".json")
	if err := os.WriteFile(journal, []byte("invalid synthetic journal"), 0600); err != nil {
		t.Fatal(err)
	}
	if manager, err := New(cfg, runner); err == nil {
		manager.Close()
		t.Fatal("invalid synthetic journal was accepted")
	}
	for _, path := range []string{
		filepath.Join(cfg.StateDir, "minikube-"+cfg.Profile+".lock"),
		filepath.Join(cfg.Home, ".kubeview-provider-locks", "minikube-"+cfg.Profile+".lock"),
	} {
		lock, err := lockProfile(path)
		if err != nil {
			t.Fatal("constructor failure retained a profile/journal lock", err)
		}
		if err := lock.Close(); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(journal, []byte("[]"), 0600); err != nil {
		t.Fatal(err)
	}
	replacement, err := New(cfg, runner)
	if err != nil {
		t.Fatal("constructor cleanup prevented valid reacquisition", err)
	}
	replacement.Close()
}
