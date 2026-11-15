package websocket

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/k8s-tersane/tersane/backend/pkg/api"
)

type LogStreamPayload struct {
	Pod       string `json:"pod"`
	Namespace string `json:"namespace"`
	Container string `json:"container"`
	Line      string `json:"line"`
}
type LogStreamFunc func(ctx context.Context, namespace, podName, containerName string, tailLines int64, follow bool, ch chan<- string) error

// ServePodLogsWS is retained for compatibility. Failure is never sample output.
func ServePodLogsWS(w http.ResponseWriter, r *http.Request, streamer LogStreamFunc) {
	query := r.URL.Query()
	pod := query.Get("pod")
	ns := query.Get("namespace")
	container := query.Get("container")
	if ns == "" {
		ns = "default"
	}
	if pod == "" {
		http.Error(w, "Pod adı gerekli", 400)
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	conn.SetReadLimit(4096)
	go func() {
		defer cancel()
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				return
			}
		}
	}()
	tail := int64(150)
	if v, e := strconv.ParseInt(query.Get("tailLines"), 10, 64); e == nil && v > 0 && v <= 10000 {
		tail = v
	}
	lines := make(chan string, 200)
	result := make(chan error, 1)
	go func() {
		defer close(lines)
		if streamer == nil {
			result <- fmt.Errorf("Kubernetes log sağlayıcısı kullanılamıyor")
			return
		}
		result <- streamer(ctx, ns, pod, container, tail, query.Get("follow") != "false", lines)
	}()
	for {
		select {
		case <-ctx.Done():
			return
		case line, ok := <-lines:
			conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
			if !ok {
				if err := <-result; err != nil {
					conn.WriteJSON(api.NewWSMessage(api.TypeError, map[string]string{"error": err.Error()}))
				}
				return
			}
			if err := conn.WriteJSON(api.NewWSMessage("POD_LOG_CHUNK", LogStreamPayload{pod, ns, container, line})); err != nil {
				return
			}
		}
	}
}
