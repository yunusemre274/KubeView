package k8s

import (
	"bufio"
	"context"
	"fmt"
	"io"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
)

// StreamPodLogs opens a log stream from Kubernetes API for the specified Pod and Container.
// It sends log lines to the provided ch channel until context is cancelled or stream ends.
func StreamPodLogs(ctx context.Context, clientset kubernetes.Interface, namespace, podName, containerName string, tailLines int64, follow bool, ch chan<- string) error {
	if namespace == "" {
		namespace = "default"
	}

	opts := &corev1.PodLogOptions{
		Follow:     follow,
		Timestamps: true,
	}

	if containerName != "" {
		opts.Container = containerName
	}

	if tailLines > 0 {
		opts.TailLines = &tailLines
	}

	req := clientset.CoreV1().Pods(namespace).GetLogs(podName, opts)
	stream, err := req.Stream(ctx)
	if err != nil {
		return fmt.Errorf("failed to open K8s log stream for %s/%s (%s): %w", namespace, podName, containerName, err)
	}
	defer stream.Close()

	reader := bufio.NewReader(stream)
	for {
		select {
		case <-ctx.Done():
			return nil
		default:
			line, err := reader.ReadString('\n')
			if err != nil {
				if err == io.EOF {
					if line != "" {
						select {
						case ch <- line:
						case <-ctx.Done():
						}
					}
					return nil
				}
				return fmt.Errorf("error reading log stream: %w", err)
			}

			select {
			case ch <- line:
			case <-ctx.Done():
				return nil
			}
		}
	}
}
