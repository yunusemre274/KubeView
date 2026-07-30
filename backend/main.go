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
	ws "github.com/k8s-tersane/tersane/backend/pkg/websocket"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println(" 🚢 TERSANE (K8s Shipyard) — Backend Server (Faz 2)")
	fmt.Println("==================================================")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

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
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	go func() {
		fmt.Printf("[http] Tersane WebSocket Server listening on http://0.0.0.0:%s/ws\n", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[fatal] HTTP server error: %v\n", err)
		}
	}()

	<-ctx.Done()
	fmt.Println("\n[info] Shutting down HTTP server...")
	server.Shutdown(context.Background())
	fmt.Println("[info] Tersane Backend Server gracefully stopped.")
}
