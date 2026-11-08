package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/k8s-tersane/tersane/backend/internal/webui"
	"github.com/k8s-tersane/tersane/backend/pkg/netutils"
	"github.com/k8s-tersane/tersane/backend/pkg/server"
)

// Set by the reproducible release build; source-only development is explicit.
var version = "development"
var commit = "unknown"

func configure(args []string) (bool, error) {
	flags := flag.NewFlagSet("kubeview", flag.ContinueOnError)
	showVersion := flags.Bool("version", false, "Print build version and exit")
	kubeconfig := flags.String("kubeconfig", "", "Trusted kubeconfig file(s), separated by the platform path separator")
	contextName := flags.String("context", "", "Initial kubeconfig context; does not change global current-context")
	namespace := flags.String("namespace", "", "Restrict this gateway to one namespace (optional)")
	bind := flags.String("bind", "", "Listen address; default 127.0.0.1. Non-loopback requires API_TOKEN")
	port := flags.String("port", "", "HTTP listen port; default 8000")
	write := flags.Bool("write", false, "Allow explicit per-browser management enablement; Kubernetes RBAC still applies")
	tokenFile := flags.String("api-token-file", "", "Read operator access token from a private file; never send it in process arguments")
	if err := flags.Parse(args); err != nil {
		return false, err
	}
	if flags.NArg() != 0 {
		return false, fmt.Errorf("unexpected positional arguments")
	}
	if *showVersion {
		fmt.Printf("KubeView %s (%s) %s/%s\n", version, commit, runtime.GOOS, runtime.GOARCH)
		return true, nil
	}
	for key, value := range map[string]string{"KUBECONFIG": *kubeconfig, "KUBE_CONTEXT": *contextName, "WATCH_NAMESPACE": *namespace, "BIND_ADDR": *bind, "PORT": *port} {
		if value != "" {
			if err := os.Setenv(key, value); err != nil {
				return false, err
			}
		}
	}
	if *port != "" {
		p, err := strconv.Atoi(*port)
		if err != nil || p < 1 || p > 65535 {
			return false, fmt.Errorf("--port must be an integer from 1 to 65535")
		}
	}
	if *write {
		os.Setenv("READ_ONLY", "false")
	}
	if *tokenFile != "" {
		data, err := os.ReadFile(*tokenFile)
		if err != nil {
			return false, fmt.Errorf("operator token file could not be read")
		}
		token := strings.TrimSpace(string(data))
		if len(token) < 32 || strings.ContainsAny(token, "\r\n") {
			return false, fmt.Errorf("operator token must contain at least 32 characters on one line")
		}
		os.Setenv("API_TOKEN", token)
	}
	return false, nil
}

func frontendHandler(root fs.FS) http.Handler {
	files := http.FileServer(http.FS(root))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if r.URL.Path == "/api" || strings.HasPrefix(r.URL.Path, "/api/") || r.URL.Path == "/ws" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'")
		name := strings.TrimPrefix(r.URL.Path, "/")
		if name == "" {
			name = "index.html"
		}
		if info, err := fs.Stat(root, name); err == nil && !info.IsDir() {
			if strings.HasPrefix(name, "assets/") {
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			} else {
				w.Header().Set("Cache-Control", "no-cache")
			}
			files.ServeHTTP(w, r)
			return
		}
		// Missing assets are errors, never HTML disguised as JavaScript or fonts.
		if filepath.Ext(name) != "" {
			http.NotFound(w, r)
			return
		}
		data, err := fs.ReadFile(root, "index.html")
		if err != nil {
			http.Error(w, "frontend unavailable", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache")
		if r.Method != http.MethodHead {
			w.Write(data)
		}
	})
}

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
	stop, err := configure(os.Args[1:])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	if stop {
		return
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	gateway := server.New()
	defer gateway.Close()
	mux := http.NewServeMux()
	gateway.Register(mux)
	mux.HandleFunc("/api/version", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"version": version, "commit": commit, "os": runtime.GOOS, "arch": runtime.GOARCH})
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("OK"))
	})
	staticDir := resolveStaticDir()
	assets, embedded := webui.Files()
	if override := os.Getenv("STATIC_DIR"); override != "" {
		if _, err := os.Stat(filepath.Join(override, "index.html")); err != nil {
			fmt.Fprintln(os.Stderr, "STATIC_DIR does not contain index.html")
			os.Exit(1)
		}
		mux.Handle("/", frontendHandler(os.DirFS(override)))
		staticDir = override
	} else if embedded {
		mux.Handle("/", frontendHandler(assets))
		staticDir = "embedded"
	} else if staticDir != "" {
		mux.Handle("/", frontendHandler(os.DirFS(staticDir)))
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
