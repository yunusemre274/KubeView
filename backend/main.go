package main

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/k8s-tersane/tersane/backend/pkg/netutils"
	"github.com/k8s-tersane/tersane/backend/pkg/server"
)

func resolveStaticDir() string {
	if dir := os.Getenv("STATIC_DIR"); dir != "" {
		if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
			return dir
		}
	}
	for _, dir := range []string{"./public", "/app/public", "../frontend/dist", "frontend/dist"} {
		if _, err := os.Stat(filepath.Join(dir, "index.html")); err == nil {
			return dir
		}
	}
	return ""
}
func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	gateway := server.New()
	mux := http.NewServeMux()
	gateway.Register(mux)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("OK"))
	})
	staticDir := resolveStaticDir()
	if staticDir != "" {
		files := http.FileServer(http.Dir(staticDir))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if len(r.URL.Path) > 4 && r.URL.Path[:4] == "/api" {
				http.NotFound(w, r)
				return
			}
			path := filepath.Join(staticDir, filepath.Clean("/"+r.URL.Path))
			if info, err := os.Stat(path); err == nil && !info.IsDir() {
				files.ServeHTTP(w, r)
				return
			}
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
		})
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write([]byte("<!doctype html><html lang='tr'><title>KubeView API</title><body><h1>KubeView API</h1><p>Ön yüz derlenmedi. frontend dizininde npm run dev çalıştırın.</p></body></html>"))
		})
	}
	host := os.Getenv("BIND_ADDR")
	if host == "" {
		host = "127.0.0.1"
	}
	if host != "127.0.0.1" && host != "localhost" && host != "::1" && gateway.Token == "" {
		fmt.Fprintln(os.Stderr, "Paylaşılan erişim için API_TOKEN gerekli; yerel kullanımda BIND_ADDR=127.0.0.1 kullanın")
		os.Exit(1)
	}
	port := netutils.ParsePortEnv(os.Getenv("PORT"), 8000)
	listener, err := net.Listen("tcp", net.JoinHostPort(host, fmt.Sprint(port)))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	httpServer := &http.Server{Handler: mux, ReadHeaderTimeout: 10 * time.Second, IdleTimeout: 90 * time.Second}
	go func() {
		fmt.Printf("KubeView: http://%s (readOnly=%t, static=%s)\n", listener.Addr(), gateway.ReadOnly, staticDir)
		if err := httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			fmt.Fprintln(os.Stderr, err)
			cancel()
		}
	}()
	<-ctx.Done()
	shutdown, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	httpServer.Shutdown(shutdown)
}
