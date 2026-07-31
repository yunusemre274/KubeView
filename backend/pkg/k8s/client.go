package k8s

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

var (
	ErrKubeconfigUnreadable = errors.New("kubeconfig file missing or unreadable")
)

// GetKubeconfigPath resolves the default kubeconfig path (from KUBECONFIG env or ~/.kube/config).
func GetKubeconfigPath() (string, error) {
	kubeconfigPath := os.Getenv("KUBECONFIG")
	if kubeconfigPath != "" {
		return kubeconfigPath, nil
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}
	return filepath.Join(homeDir, ".kube", "config"), nil
}

// LoadRestConfig loads rest.Config from in-cluster or out-of-cluster kubeconfig file.
func LoadRestConfig() (*rest.Config, string, error) {
	// Try in-cluster configuration first
	config, err := rest.InClusterConfig()
	if err == nil {
		fmt.Println("[k8s-client] In-cluster configuration loaded successfully.")
		return config, "in-cluster", nil
	}

	// Fallback to out-of-cluster configuration
	kubeconfigPath, err := GetKubeconfigPath()
	if err != nil {
		return nil, "", err
	}

	if _, err := os.Stat(kubeconfigPath); os.IsNotExist(err) {
		return nil, kubeconfigPath, fmt.Errorf("%w: %s", ErrKubeconfigUnreadable, kubeconfigPath)
	}

	config, err = clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, kubeconfigPath, fmt.Errorf("%w (%s): %v", ErrKubeconfigUnreadable, kubeconfigPath, err)
	}

	return config, kubeconfigPath, nil
}

// NewKubeClient initializes and returns a kubernetes.Interface client along with rest.Config.
func NewKubeClient() (kubernetes.Interface, *rest.Config, string, error) {
	config, path, err := LoadRestConfig()
	if err != nil {
		return nil, nil, path, err
	}

	client, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, nil, path, fmt.Errorf("failed to create kubernetes client: %w", err)
	}

	fmt.Printf("[k8s-client] Out-of-cluster client connected to API Server: %s (Path: %s)\n", config.Host, path)
	return client, config, path, nil
}

// CheckAndReloadKubeconfig re-reads the kubeconfig file from disk, checks if the API Server Host/Port has changed,
// and if so (or if forced), builds a brand new clientset without needing a process restart.
func CheckAndReloadKubeconfig(kubeconfigPath string, currentHost string) (kubernetes.Interface, *rest.Config, string, bool, error) {
	if kubeconfigPath == "" || kubeconfigPath == "in-cluster" {
		path, err := GetKubeconfigPath()
		if err == nil {
			kubeconfigPath = path
		}
	}

	// Verify file existence explicitly
	if _, err := os.Stat(kubeconfigPath); os.IsNotExist(err) {
		return nil, nil, "", false, fmt.Errorf("%w: %s (dosya bulunamadı)", ErrKubeconfigUnreadable, kubeconfigPath)
	}

	newConfig, err := clientcmd.BuildConfigFromFlags("", kubeconfigPath)
	if err != nil {
		return nil, nil, "", false, fmt.Errorf("%w: %s (%v)", ErrKubeconfigUnreadable, kubeconfigPath, err)
	}

	newHost := newConfig.Host
	hostChanged := newHost != currentHost

	newClient, err := kubernetes.NewForConfig(newConfig)
	if err != nil {
		return nil, nil, newHost, false, fmt.Errorf("failed to create kubernetes client for new host %s: %w", newHost, err)
	}

	return newClient, newConfig, newHost, hostChanged, nil
}
