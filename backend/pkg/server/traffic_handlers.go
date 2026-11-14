package server

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"regexp"
	"sort"
	"time"

	"github.com/k8s-tersane/tersane/backend/pkg/traffic"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"
)

// providerTransport identifies the API server rather than the caller. A pinned
// operator context attests the cluster UID; all Pod reads still use the actual
// request's Kubernetes credentials and namespace authorization.
func providerTransport(config *rest.Config) (string, error) {
	if config == nil {
		return "", errors.New("API bağlantı kimliği yok")
	}
	ca := config.CAData
	if len(ca) == 0 && config.CAFile != "" {
		var err error
		ca, err = os.ReadFile(config.CAFile)
		if err != nil {
			return "", err
		}
	}
	h := sha256.New()
	err := json.NewEncoder(h).Encode(struct {
		Host, ServerName string
		Insecure         bool
		CA               []byte
	}{config.Host, config.ServerName, config.Insecure, ca})
	return hex.EncodeToString(h.Sum(nil)), err
}

// Hash actual auth material only into an opaque, private collection key. Never
// expose it in responses/logs. File rotation produces a distinct subscription.
func trafficIdentity(config *rest.Config) (string, error) {
	transport, err := providerTransport(config)
	if err != nil {
		return "", err
	}
	read := func(path string, fallback []byte) ([]byte, error) {
		if len(fallback) > 0 || path == "" {
			return fallback, nil
		}
		return os.ReadFile(path)
	}
	cert, err := read(config.CertFile, config.CertData)
	if err != nil {
		return "", err
	}
	key, err := read(config.KeyFile, config.KeyData)
	if err != nil {
		return "", err
	}
	token, err := read(config.BearerTokenFile, nil)
	if err != nil {
		return "", err
	}
	h := sha256.New()
	err = json.NewEncoder(h).Encode(struct {
		Transport, Username, Password, Token string
		TokenFile, Cert, Key                 []byte
		Impersonate                          rest.ImpersonationConfig
		AuthProvider                         interface{}
		Exec                                 interface{}
	}{transport, config.Username, config.Password, config.BearerToken, token, cert, key, config.Impersonate, config.AuthProvider, config.ExecProvider})
	return hex.EncodeToString(h.Sum(nil)), err
}

func (s *Server) verifyTrafficCluster(ctx context.Context, c *Clients, cfg traffic.Config) error {
	trusted, err := s.client(cfg.Context)
	if err != nil {
		return errors.New("Yapılandırılmış Hubble küme kimliği doğrulanamıyor")
	}
	identity, err := trusted.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if err != nil || string(identity.UID) != cfg.ClusterUID {
		return errors.New("Hubble sağlayıcısının sabit küme UID eşlemesi doğrulanamadı")
	}
	selected, e1 := providerTransport(c.Config)
	pinned, e2 := providerTransport(trusted.Config)
	if e1 != nil || e2 != nil || selected != pinned {
		return errors.New("Seçili context Hubble sağlayıcısının API/TLS küme kimliğiyle uyuşmuyor")
	}
	return nil
}

var trafficLeasePattern = regexp.MustCompile(`^[A-Za-z0-9_-]{16,128}$`)

func (s *Server) flows(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" && r.Method != "DELETE" {
		problem(w, 405, "GET veya DELETE gerekli")
		return
	}
	lease := r.URL.Query().Get("subscription")
	if !trafficLeasePattern.MatchString(lease) {
		problem(w, 400, "Sınırlı istemci aboneliği kimliği gerekli")
		return
	}
	scopeRequest := r
	if r.URL.Query().Get("namespace") == "all" {
		scopeRequest = r.Clone(r.Context())
		u := *r.URL
		q := u.Query()
		q.Del("namespace")
		u.RawQuery = q.Encode()
		scopeRequest.URL = &u
	}
	ns, err := s.namespace(scopeRequest)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	if ns == "all" {
		ns = ""
	}
	p := s.providerServices()
	cfg := traffic.FromEnv()
	if p.hubble == nil {
		jsonResponse(w, 200, map[string]interface{}{"status": "disabled", "provider": "hubble", "flows": []interface{}{}, "windowSeconds": 10, "error": "Gerçek Hubble sağlayıcısı kullanılamıyor; temsili topoloji trafik değildir"})
		return
	}
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	fingerprint, err := trafficIdentity(c.Config)
	if err != nil {
		problem(w, 503, "Trafik kimliği güvenli biçimde doğrulanamadı")
		return
	}
	var workspaceScopes []traffic.NamespaceScope
	var authorizedHarborIDs []string
	if scope := workspaceScopeFrom(r.Context()); scope != nil {
		fingerprint += "|workspace-connection:" + scope.connection.ID
		requested := r.URL.Query()["harborIds"]
		if len(requested) == 0 {
			requested = []string{scope.harbor.ID}
		}
		if len(requested) > 100 {
			problem(w, 400, "En fazla100 trafik limanı seçilebilir")
			return
		}
		wanted := map[string]bool{}
		for _, id := range requested {
			wanted[id] = true
		}
		seen := map[string]bool{}
		for _, harbor := range s.workspace.store.Snapshot().Harbors {
			if !wanted[harbor.ID] {
				continue
			}
			if harbor.ConnectionRef != scope.connection.ID {
				problem(w, 403, "Trafik limanları aynı bağlantı ve kimliği kullanmalı")
				return
			}
			delete(wanted, harbor.ID)
			authorizedHarborIDs = append(authorizedHarborIDs, harbor.ID)
			for _, namespace := range harbor.Namespaces {
				if s.Namespace != "" && namespace != s.Namespace {
					continue
				}
				if namespace == "*" {
					namespace = ""
				}
				key := namespace + "\x00" + harbor.Selector
				if !seen[key] {
					workspaceScopes = append(workspaceScopes, traffic.NamespaceScope{Namespace: namespace, Selector: harbor.Selector})
					seen[key] = true
				}
			}
		}
		if len(wanted) > 0 {
			problem(w, 403, "Trafik limanı bu workspace'te bulunamadı")
			return
		}
		if len(workspaceScopes) == 0 {
			problem(w, 403, "Trafik için izinli workspace namespace kapsamı yok")
			return
		}
		sort.Slice(workspaceScopes, func(i, j int) bool {
			return workspaceScopes[i].Namespace+workspaceScopes[i].Selector < workspaceScopes[j].Namespace+workspaceScopes[j].Selector
		})
	}
	ctx, cancel := context.WithTimeout(traffic.WithIdentity(r.Context(), fingerprint), 8*time.Second)
	defer cancel()
	ctx = traffic.WithSelectedUID(ctx, r.URL.Query().Get("selectedUID"))
	if err = s.verifyTrafficCluster(ctx, c, cfg); err != nil {
		problem(w, 409, err.Error())
		return
	}
	// No Namespace LIST permission is needed to use a known authorized namespace.
	if workspaceScopes != nil {
		for _, scope := range workspaceScopes {
			review, e := c.Typed.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, accessReview("list", "", "pods", "", scope.Namespace, ""), metav1.CreateOptions{})
			if e != nil {
				failure(w, e)
				return
			}
			if !review.Status.Allowed {
				problem(w, 403, "Workspace trafik namespace kapsamı için Pod list izni gerekli")
				return
			}
		}
	} else if err = s.authorize(ctx, c, "list", "", "pods", "", ns, ""); err != nil {
		failure(w, err)
		return
	}
	if r.Method == "DELETE" {
		if workspaceScopes != nil {
			p.hubble.ReleaseScopesIdentity(ctx, cfg.Context, workspaceScopes, lease)
		} else {
			p.hubble.ReleaseIdentity(ctx, cfg.Context, ns, lease)
		}
		jsonResponse(w, 200, map[string]bool{"released": true})
		return
	}
	allowNodes := s.authorize(ctx, c, "get", "", "nodes", "", "", "") == nil
	var snapshot traffic.Snapshot
	if workspaceScopes != nil {
		snapshot, err = p.hubble.SnapshotScopes(ctx, c.Typed, cfg.Context, workspaceScopes, allowNodes, lease)
		snapshot.Namespace = ns
	} else {
		snapshot, err = p.hubble.Snapshot(ctx, c.Typed, cfg.Context, ns, allowNodes, lease)
	}
	if err != nil {
		failure(w, err)
		return
	}
	// A restricted kubeconfig alias can share the attested cluster, without
	// sharing its Pod collector or receiving the operator's endpoint metadata.
	snapshot.Context = c.Name
	jsonResponse(w, 200, struct {
		traffic.Snapshot
		AuthorizedHarborIDs []string `json:"authorizedHarborIds,omitempty"`
	}{snapshot, authorizedHarborIDs})
}
