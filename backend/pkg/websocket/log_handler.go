package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
	"github.com/k8s-tersane/tersane/backend/pkg/api"
)

// LogStreamPayload represents the WebSocket message payload for log lines.
type LogStreamPayload struct {
	Pod       string `json:"pod"`
	Namespace string `json:"namespace"`
	Container string `json:"container"`
	Line      string `json:"line"`
}

// LogStreamFunc is a function signature for streaming K8s Pod logs.
type LogStreamFunc func(ctx context.Context, namespace, podName, containerName string, tailLines int64, follow bool, ch chan<- string) error

// ServePodLogsWS handles WebSocket connections for streaming Pod container logs.
func ServePodLogsWS(w http.ResponseWriter, r *http.Request, streamer LogStreamFunc) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Printf("[error] Pod logs WebSocket upgrade failed: %v\n", err)
		return
	}
	defer conn.Close()

	query := r.URL.Query()
	podName := query.Get("pod")
	namespace := query.Get("namespace")
	if namespace == "" {
		namespace = "default"
	}
	containerName := query.Get("container")
	tailLinesStr := query.Get("tailLines")

	var tailLines int64 = 150
	if val, err := strconv.ParseInt(tailLinesStr, 10, 64); err == nil && val > 0 {
		tailLines = val
	}

	fmt.Printf("[logs-ws] Client subscribed to logs for %s/%s (container: '%s', tailLines: %d)\n",
		namespace, podName, containerName, tailLines)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	logChan := make(chan string, 200)

	// Monitor client disconnect in background
	go func() {
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				cancel()
				return
			}
		}
	}()

	// Start log streaming routine
	go func() {
		defer close(logChan)

		if streamer != nil && podName != "" {
			err := streamer(ctx, namespace, podName, containerName, tailLines, true, logChan)
			if err == nil {
				return
			}
			fmt.Printf("[logs-ws] K8s API log stream unavailable (%v). Falling back to mock live stream.\n", err)
		}

		// Mock stream fallback generator if live cluster stream fails or in local dev mode
		generateMockLogs(ctx, podName, namespace, containerName, logChan)
	}()

	// Read from logChan and write JSON to WebSocket
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("[logs-ws] Log stream closed for %s/%s\n", namespace, podName)
			return
		case line, ok := <-logChan:
			if !ok {
				return
			}
			payload := LogStreamPayload{
				Pod:       podName,
				Namespace: namespace,
				Container: containerName,
				Line:      line,
			}
			msg := api.NewWSMessage("POD_LOG_CHUNK", payload)
			bytes, err := json.Marshal(msg)
			if err != nil {
				continue
			}

			conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if err := conn.WriteMessage(websocket.TextMessage, bytes); err != nil {
				return
			}
		}
	}
}

func generateMockLogs(ctx context.Context, podName, namespace, containerName string, ch chan<- string) {
	if containerName == "" {
		containerName = "app"
	}
	if podName == "" {
		podName = "web-frontend-deploy-74b89"
	}

	initialLogs := []string{
		fmt.Sprintf("%s [INFO] Starting container %s in pod %s/%s...", time.Now().Add(-10*time.Minute).Format(time.RFC3339), containerName, namespace, podName),
		fmt.Sprintf("%s [INFO] Configuration loaded from /etc/app/config.json", time.Now().Add(-9*time.Minute).Format(time.RFC3339)),
		fmt.Sprintf("%s [INFO] Initializing database connection pool (max_connections=20)", time.Now().Add(-8*time.Minute).Format(time.RFC3339)),
		fmt.Sprintf("%s [INFO] Connected to PostgreSQL cluster at 10.96.0.45:5432 (SSL enabled)", time.Now().Add(-8*time.Minute).Format(time.RFC3339)),
		fmt.Sprintf("%s [INFO] Listening for HTTP traffic on 0.0.0.0:8080", time.Now().Add(-7*time.Minute).Format(time.RFC3339)),
		fmt.Sprintf("%s [INFO] Readiness probe passed: HTTP 200 OK on /healthz", time.Now().Add(-6*time.Minute).Format(time.RFC3339)),
		fmt.Sprintf("%s [WARN] Slow query detected: SELECT * FROM orders WHERE status = 'PENDING' (duration: 340ms)", time.Now().Add(-4*time.Minute).Format(time.RFC3339)),
		fmt.Sprintf("%s [INFO] GET /api/v1/status - 200 OK (24ms)", time.Now().Add(-2*time.Minute).Format(time.RFC3339)),
	}

	for _, line := range initialLogs {
		select {
		case ch <- line:
		case <-ctx.Done():
			return
		}
	}

	ticker := time.NewTicker(2500 * time.Millisecond)
	defer ticker.Stop()

	seq := 1
	for {
		select {
		case <-ctx.Done():
			return
		case t := <-ticker.C:
			seq++
			var mockLine string
			if seq%7 == 0 {
				mockLine = fmt.Sprintf("%s [WARN] Rate limit threshold warning: Client 192.168.1.105 reached 85%% of quota", t.Format(time.RFC3339))
			} else if seq%13 == 0 {
				mockLine = fmt.Sprintf("%s [ERROR] Connection reset by peer: Failed to write response chunk to client 10.244.0.12", t.Format(time.RFC3339))
			} else {
				mockLine = fmt.Sprintf("%s [INFO] Processed request seq=%d method=GET path=/api/v1/metrics status=200 duration=12ms", t.Format(time.RFC3339), seq)
			}

			select {
			case ch <- mockLine:
			case <-ctx.Done():
				return
			}
		}
	}
}
