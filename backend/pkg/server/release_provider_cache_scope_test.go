package server

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/k8s-tersane/tersane/backend/pkg/provision"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	kubefake "k8s.io/client-go/kubernetes/fake"
)

type releaseCacheRunner struct{ profileReads, inventoryReads, adds int }

func (r *releaseCacheRunner) ProfileUID(context.Context, provision.Config) (string, error) {
	r.profileReads++
	return "synthetic-cluster", nil
}
func (r *releaseCacheRunner) Inventory(context.Context, provision.Config) (provision.Inventory, error) {
	r.inventoryReads++
	return provision.Inventory{Driver: "docker"}, nil
}
func (r *releaseCacheRunner) HostExists(context.Context, provision.Config, string) (bool, error) {
	return false, nil
}
func (r *releaseCacheRunner) Add(context.Context, provision.Config, func(string), func(int)) error {
	r.adds++
	return errors.New("synthetic runner must never launch")
}

func TestReleaseProviderCachedKeyRemainsBoundToLiveCluster(t *testing.T) {
	for _, tc := range []struct {
		name, selected, actualUID string
		want                      int
	}{
		{"valid-cached-control", "test", "synthetic-cluster", 202},
		{"wrong-selected-context", "other", "synthetic-cluster", 409},
		{"changed-actual-cluster-uid", "test", "synthetic-recreated-cluster", 409},
	} {
		t.Run(tc.name, func(t *testing.T) {
			cfg := provision.Config{Enabled: true, Profile: "synthetic-provider", Context: "test", ClusterUID: "synthetic-cluster", Home: filepath.Join(t.TempDir(), ".minikube"), StateDir: t.TempDir(), Binary: "synthetic-never-executed", MaxNodes: 8, Timeout: time.Second}
			t.Setenv("KV_MINIKUBE_ENABLED", "true")
			t.Setenv("KV_MINIKUBE_CONTEXT", cfg.Context)
			t.Setenv("KV_MINIKUBE_CLUSTER_UID", cfg.ClusterUID)
			t.Setenv("KV_MINIKUBE_PROFILE", cfg.Profile)
			t.Setenv("KV_MINIKUBE_HOME", cfg.Home)
			t.Setenv("KV_PROVIDER_STATE_DIR", cfg.StateDir)
			key := uuid.NewString()
			digest := sha256.Sum256([]byte(cfg.Context + "\x00" + key))
			op := provision.Operation{ID: uuid.NewString(), KeyHash: hex.EncodeToString(digest[:]), Context: cfg.Context, Profile: cfg.Profile, ClusterUID: cfg.ClusterUID, Status: "ready", StartedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(), StageSource: "synthetic-terminal-journal", Before: map[string]string{}}
			raw, err := json.Marshal([]provision.Operation{op})
			if err != nil {
				t.Fatal("journal marshal failed")
			}
			if err = os.WriteFile(filepath.Join(cfg.StateDir, "minikube-"+cfg.Profile+".json"), raw, 0600); err != nil {
				t.Fatal("journal setup failed")
			}
			runner := &releaseCacheRunner{}
			manager, err := provision.New(cfg, runner)
			if err != nil {
				t.Fatal("terminal journal manager setup failed")
			}
			t.Cleanup(manager.Close)
			s, c := testServer(t, false)
			s.Namespace = ""
			s.providers = &providerServices{minikube: manager}
			typed := c.Typed.(*kubefake.Clientset)
			if _, err = typed.CoreV1().Namespaces().Create(context.Background(), &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "kube-system", UID: types.UID(tc.actualUID)}}, metav1.CreateOptions{}); err != nil {
				t.Fatal("cluster UID fixture failed")
			}
			if tc.selected != "test" {
				other := *c
				other.Name = tc.selected
				other.ID = "other-synthetic-client"
				s.clients[tc.selected] = &other
			}
			cookie, info := diagnostic(t, s, tc.selected, "", nil)
			nonce := info["connectionID"].(string)
			if w := connectionRequest(s, "POST", "/api/management", managementBody(tc.selected, "", nonce, true), cookie, ""); w.Code != 200 {
				t.Fatal("valid scope management grant failed")
			}
			typed.ClearActions()
			payload, _ := json.Marshal(map[string]string{"action": "add-worker", "idempotencyKey": key})
			request := httptest.NewRequest("POST", "http://localhost/api/providers/minikube/workers?context="+tc.selected, bytes.NewReader(payload))
			request.RemoteAddr = "127.0.0.1:12345"
			request.Header.Set("Content-Type", "application/json")
			request.Header.Set("Origin", "http://localhost")
			request.Header.Set("X-KubeView-Connection", nonce)
			request.AddCookie(cookie)
			mux := http.NewServeMux()
			s.Register(mux)
			w := httptest.NewRecorder()
			mux.ServeHTTP(w, request)
			var body struct {
				Operation provision.Operation `json:"operation"`
			}
			if json.Unmarshal(w.Body.Bytes(), &body) != nil {
				t.Fatal("invalid provider JSON")
			}
			cachedReturned := body.Operation.ID == op.ID
			uidReads := 0
			for _, a := range typed.Actions() {
				if a.GetVerb() == "get" && a.GetResource().Resource == "namespaces" {
					uidReads++
				}
			}
			if runner.adds != 0 {
				t.Fatal("cached/denied request launched provider runner")
			}
			if w.Code != tc.want {
				t.Fatalf("status=%d want=%d cachedOperationReturned=%t freshUIDReads=%d profileChecks=%d addCalls=%d (values omitted)", w.Code, tc.want, cachedReturned, uidReads, runner.profileReads, runner.adds)
			}
			if tc.want == 202 && !cachedReturned {
				t.Fatal("valid cached positive did not return seeded terminal operation")
			}
			if tc.want != 202 && cachedReturned {
				t.Fatal("denied scope returned cached operation")
			}
			t.Logf("cachedReturned=%t freshUIDReads=%d profileChecks=%d addCalls=%d; all identities/keys omitted", cachedReturned, uidReads, runner.profileReads, runner.adds)
		})
	}
}
