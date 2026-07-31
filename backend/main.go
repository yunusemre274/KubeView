package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/k8s-tersane/tersane/backend/pkg/api"
	"github.com/k8s-tersane/tersane/backend/pkg/k8s"
	"github.com/k8s-tersane/tersane/backend/pkg/netutils"
	ws "github.com/k8s-tersane/tersane/backend/pkg/websocket"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println(" 🚢 TERSANE (K8s Shipyard 3D) — Backend Server")
	fmt.Println("==================================================")

	defaultPort := netutils.ParsePortEnv(os.Getenv("PORT"), 8000)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// Initialize K8s Client
	clientset, err := k8s.NewKubeClient()
	if err != nil {
		fmt.Printf("[fatal] Failed to initialize Kubernetes client: %v\n", err)
		os.Exit(1)
	}

	watchNamespace := os.Getenv("WATCH_NAMESPACE")

	// Forward declaration for Initial State Provider closure
	var watcher *k8s.Watcher

	// Initialize WebSocket Hub
	hub := ws.NewHub(func() api.InitialStatePayload {
		if watcher != nil {
			return watcher.GetInitialState()
		}
		return api.InitialStatePayload{}
	})
	go hub.Run()

	// Initialize K8s Watcher with WebSocket Hub
	watcher = k8s.NewWatcher(clientset, watchNamespace, hub)
	go func() {
		if err := watcher.StartInformerFactory(ctx); err != nil {
			fmt.Printf("[error] Watcher stopped with error: %v\n", err)
		}
	}()

	// Register HTTP / WebSocket routes
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", hub.ServeWS)
	mux.HandleFunc("/api/v1/pods/logs/stream", func(w http.ResponseWriter, r *http.Request) {
		streamFn := func(streamCtx context.Context, namespace, podName, containerName string, tailLines int64, follow bool, ch chan<- string) error {
			return k8s.StreamPodLogs(streamCtx, clientset, namespace, podName, containerName, tailLines, follow, ch)
		}
		ws.ServePodLogsWS(w, r, streamFn)
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Resolve available port (Auto Port Detect & Fallback: 8000-8020)
	listener, assignedPort, err := netutils.ResolveAvailablePort(defaultPort, defaultPort+20)
	if err != nil {
		fmt.Printf("[fatal] Port resolution failed: %v\n", err)
		os.Exit(1)
	}

	server := &http.Server{
		Handler: mux,
	}

	go func() {
		fmt.Printf("[http] 🚀 Tersane Backend WebSocket Server listening on http://0.0.0.0:%d/ws\n", assignedPort)
		if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[fatal] HTTP server error: %v\n", err)
		}
	}()

	<-ctx.Done()
	fmt.Println("\n[info] Shutting down HTTP server...")
	server.Shutdown(context.Background())
	fmt.Println("[info] Tersane Backend Server gracefully stopped.")
}
