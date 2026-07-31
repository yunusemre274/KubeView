package k8s

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestCheckAndReloadKubeconfig_MissingFile(t *testing.T) {
	fakePath := filepath.Join(t.TempDir(), "non_existent_kubeconfig.yaml")

	_, _, _, _, err := CheckAndReloadKubeconfig(fakePath, "https://127.0.0.1:51234")
	if err == nil {
		t.Fatalf("expected error for missing file, got nil")
	}

	if !errors.Is(err, ErrKubeconfigUnreadable) {
		t.Fatalf("expected ErrKubeconfigUnreadable, got %v", err)
	}
}

func TestCheckAndReloadKubeconfig_HostDriftDetection(t *testing.T) {
	tempDir := t.TempDir()
	kubeconfigPath := filepath.Join(tempDir, "config")

	fakeKubeconfigContent := `
apiVersion: v1
kind: Config
clusters:
- cluster:
    server: https://127.0.0.1:54321
  name: minikube
contexts:
- context:
    cluster: minikube
    user: minikube
  name: minikube
current-context: minikube
users:
- name: minikube
  user:
    token: fake-token
`
	if err := os.WriteFile(kubeconfigPath, []byte(fakeKubeconfigContent), 0644); err != nil {
		t.Fatalf("failed to write fake kubeconfig: %v", err)
	}

	oldHost := "https://127.0.0.1:51234"
	_, _, newHost, hostChanged, err := CheckAndReloadKubeconfig(kubeconfigPath, oldHost)
	if err != nil {
		t.Fatalf("unexpected error parsing fake kubeconfig: %v", err)
	}

	if !hostChanged {
		t.Errorf("expected hostChanged = true, got false")
	}

	if newHost != "https://127.0.0.1:54321" {
		t.Errorf("expected newHost = https://127.0.0.1:54321, got %s", newHost)
	}

	// Test when host has NOT changed
	_, _, sameHost, sameChanged, err := CheckAndReloadKubeconfig(kubeconfigPath, "https://127.0.0.1:54321")
	if err != nil {
		t.Fatalf("unexpected error on second parse: %v", err)
	}

	if sameChanged {
		t.Errorf("expected hostChanged = false when host matches, got true")
	}

	if sameHost != "https://127.0.0.1:54321" {
		t.Errorf("expected sameHost = https://127.0.0.1:54321, got %s", sameHost)
	}
}
