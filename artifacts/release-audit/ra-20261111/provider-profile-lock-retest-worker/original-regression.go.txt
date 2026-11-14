//go:build !windows

package provision

import (
	"context"
	"os"
	"path/filepath"
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
