package main

import (
	"net/http/httptest"
	"os"
	"testing"
	"testing/fstest"
)

func TestProductionFrontendRoutesAndBoundary(t *testing.T) {
	root := fstest.MapFS{"index.html": {Data: []byte("<html>world</html>")}, "assets/app-123.js": {Data: []byte("export{}")}}
	h := frontendHandler(root)
	for _, tt := range []struct {
		path, method string
		status       int
	}{
		{"/", "GET", 200}, {"/harbor", "GET", 200}, {"/assets/app-123.js", "GET", 200},
		{"/assets/missing.js", "GET", 404}, {"/api/missing", "GET", 404}, {"/api", "GET", 404}, {"/ws", "GET", 404}, {"/", "POST", 405},
	} {
		t.Run(tt.method+tt.path, func(t *testing.T) {
			r := httptest.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if w.Code != tt.status {
				t.Fatalf("status %d, want %d", w.Code, tt.status)
			}
			if tt.status == 200 && w.Header().Get("Content-Security-Policy") == "" {
				t.Fatal("missing framing boundary")
			}
		})
	}
}

func TestCLIContextDoesNotRewriteKubeconfig(t *testing.T) {
	t.Setenv("KUBE_CONTEXT", "old")
	t.Setenv("WATCH_NAMESPACE", "")
	t.Setenv("READ_ONLY", "true")
	t.Setenv("PORT", "8000")
	stop, err := configure([]string{"--context", "new", "--namespace", "allowed", "--write", "--port", "8123"})
	if stop || err != nil {
		t.Fatalf("configure %v %v", stop, err)
	}
	if os.Getenv("KUBE_CONTEXT") != "new" || os.Getenv("WATCH_NAMESPACE") != "allowed" || os.Getenv("READ_ONLY") != "false" {
		t.Fatal("CLI scope not applied to process")
	}
	// configure changes only the process environment, never a kubeconfig file.
	if _, err = configure([]string{"--port", "not-a-port"}); err == nil {
		t.Fatal("invalid port accepted")
	}
}
