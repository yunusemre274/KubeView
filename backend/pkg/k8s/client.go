package k8s

import (
	"fmt"
	"os"
	"path/filepath"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// NewKubeClient initializes and returns a kubernetes.Interface client.
// It attempts to load In-Cluster config first; if unavailable, falls back to Out-Of-Cluster config.
func NewKubeClient() (kubernetes.Interface, error) {
	// Try in-cluster configuration first
	config, err := rest.InClusterConfig()
	if err == nil {
		fmt.Println("[k8s-client] In-cluster configuration loaded successfully.")
		return kubernetes.NewForConfig(config)
	}

	// Fallback to out-of-cluster configuration (KUBECONFIG env or ~/.kube/config)
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath == "" {
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return nil, fmt.Errorf("failed to get user home directory: %w", err)
		}
		kubeconfigPath = filepath.Join(homeDir, ".kube", "config")
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig from %s: %w", kubeconfigPath, err)
	}

	fmt.Printf("[k8s-client] Out-of-cluster configuration loaded from %s\n", kubeconfigPath)
	return kubernetes.NewForConfig(config)
}
