package metrics

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
	metricsclient "k8s.io/metrics/pkg/client/clientset/versioned"
)

// MetricData represents CPU and Memory usage summary.
type MetricData struct {
	CPUUsage    string  `json:"cpu_usage"`    // e.g. "250m"
	MemoryUsage string  `json:"memory_usage"` // e.g. "512Mi"
	CPUPercent  float64 `json:"cpu_percent"`  // e.g. 45.2
	MemPercent  float64 `json:"mem_percent"`  // e.g. 60.5
}

// Collector fetches resource metrics from metrics.k8s.io API.
type Collector struct {
	metricsClient metricsclient.Interface
}

// NewCollector initializes a Metrics Collector using K8s REST config.
func NewCollector(config *rest.Config) (*Collector, error) {
	mc, err := metricsclient.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics clientset: %w", err)
	}
	return &Collector{metricsClient: mc}, nil
}

// GetNodeMetrics fetches CPU and Memory metrics for all nodes in the cluster.
func (c *Collector) GetNodeMetrics(ctx context.Context) (map[string]MetricData, error) {
	if c.metricsClient == nil {
		return nil, fmt.Errorf("metrics client not initialized")
	}

	nodeMetricsList, err := c.metricsClient.MetricsV1beta1().NodeMetricses().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := make(map[string]MetricData)
	for _, nm := range nodeMetricsList.Items {
		cpuMilli := nm.Usage.Cpu().MilliValue()
		memBytes := nm.Usage.Memory().Value()

		memMiB := memBytes / (1024 * 1024)

		result[nm.Name] = MetricData{
			CPUUsage:    fmt.Sprintf("%dm", cpuMilli),
			MemoryUsage: fmt.Sprintf("%dMi", memMiB),
			CPUPercent:  float64(cpuMilli) / 20.0, // Relative percent fallback
			MemPercent:  float64(memMiB) / 81.92,
		}
	}

	return result, nil
}

// GetPodMetrics fetches CPU and Memory metrics for pods.
func (c *Collector) GetPodMetrics(ctx context.Context, namespace string) (map[string]MetricData, error) {
	if c.metricsClient == nil {
		return nil, fmt.Errorf("metrics client not initialized")
	}

	podMetricsList, err := c.metricsClient.MetricsV1beta1().PodMetricses(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	result := make(map[string]MetricData)
	for _, pm := range podMetricsList.Items {
		var totalCPU int64
		var totalMem int64

		for _, container := range pm.Containers {
			totalCPU += container.Usage.Cpu().MilliValue()
			totalMem += container.Usage.Memory().Value()
		}

		key := fmt.Sprintf("%s/%s", pm.Namespace, pm.Name)
		memMiB := totalMem / (1024 * 1024)

		result[key] = MetricData{
			CPUUsage:    fmt.Sprintf("%dm", totalCPU),
			MemoryUsage: fmt.Sprintf("%dMi", memMiB),
		}
	}

	return result, nil
}
