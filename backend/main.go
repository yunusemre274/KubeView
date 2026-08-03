package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"

	"github.com/k8s-tersane/tersane/backend/pkg/api"
	"github.com/k8s-tersane/tersane/backend/pkg/k8s"
	"github.com/k8s-tersane/tersane/backend/pkg/netutils"
	ws "github.com/k8s-tersane/tersane/backend/pkg/websocket"
)

func resolveStaticDir() string {
	if envDir := os.Getenv("STATIC_DIR"); envDir != "" {
		if _, err := os.Stat(filepath.Join(envDir, "index.html")); err == nil {
			return envDir
		}
	}
	candidates := []string{"./public", "/app/public", "../frontend/dist", "public"}
	for _, dir := range candidates {
		if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
			return dir
		}
	}
	return ""
}

func main() {
	fmt.Println("==================================================")
	fmt.Println(" 🚢 TERSANE (K8s Shipyard 3D) — Backend Server")
	fmt.Println("==================================================")

	defaultPort := netutils.ParsePortEnv(os.Getenv("PORT"), 8000)

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	// Initialize K8s Client & RestConfig
	clientset, restConfig, kubeconfigPath, err := k8s.NewKubeClient()
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

	// Initialize K8s Watcher with WebSocket Hub and Kubeconfig Path/Host Tracking
	watcher = k8s.NewWatcher(clientset, watchNamespace, hub, kubeconfigPath, restConfig.Host)
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

	// Static File Server (Production / Standalone Bundle Handler)
	staticDir := resolveStaticDir()
	if staticDir != "" {
		fmt.Printf("[http] 🌐 Serving production 3D Frontend assets from: %s\n", staticDir)
		fileServer := http.FileServer(http.Dir(staticDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			fullPath := filepath.Join(staticDir, path)
			fi, err := os.Stat(fullPath)
			if err != nil || fi.IsDir() {
				// Serve index.html for SPA routing fallback
				http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
				return
			}
			fileServer.ServeHTTP(w, r)
		})
	} else {
		fmt.Println("[http] ℹ️ Static frontend assets not found. Running in API-only / Dev mode.")
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write([]byte(`<!DOCTYPE html><html><head><title>Tersane Backend API</title></head><body style="font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:40px;"><h1>🚢 Tersane K8s Backend API</h1><p>API Server is running in API-only mode.</p><p>Frontend Dev Server: <a href="http://localhost:5173" style="color:#38bdf8;">http://localhost:5173</a></p><p>WebSocket: <code>ws://localhost:8000/ws</code></p></body></html>`))
		})
	}

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
		fmt.Printf("[http] 🚀 Tersane Backend WebSocket Server listening on http://0.0.0.0:%d\n", assignedPort)
		if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Printf("[fatal] HTTP server error: %v\n", err)
		}
	}()

	<-ctx.Done()
	fmt.Println("\n[info] Shutting down HTTP server...")
	server.Shutdown(context.Background())
	fmt.Println("[info] Tersane Backend Server gracefully stopped.")
}
