package server

import (
	"context"
	"net"
	"net/http"
	"os/exec"
	"time"

	"github.com/k8s-tersane/tersane/backend/pkg/provision"
	"github.com/k8s-tersane/tersane/backend/pkg/traffic"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type providerServices struct {
	minikube      *provision.Manager
	minikubeError error
	hubble        *traffic.Hub
	hubbleError   error
}

func (s *Server) providerServices() *providerServices {
	s.providerMu.Lock()
	defer s.providerMu.Unlock()
	if s.providers != nil {
		return s.providers
	}
	p := &providerServices{}
	if s.replayEnabled() {
		s.providers = p
		return p
	}
	cfg := provision.FromEnv()
	if cfg.Enabled {
		if _, e := exec.LookPath(cfg.Binary); e != nil {
			p.minikubeError = e
		} else {
			p.minikube, p.minikubeError = provision.New(cfg, nil)
		}
	}
	hcfg := traffic.FromEnv()
	if hcfg.Enabled {
		p.hubble, p.hubbleError = traffic.NewHub(hcfg)
	}
	s.providers = p
	return p
}
func (s *Server) closeProviders() {
	s.providerMu.Lock()
	p := s.providers
	s.providers = nil
	s.providerMu.Unlock()
	if p != nil {
		if p.minikube != nil {
			p.minikube.Close()
		}
		if p.hubble != nil {
			p.hubble.Close()
		}
	}
}
func (s *Server) registerProviders(mux *http.ServeMux) {
	mux.HandleFunc("/api/flows", s.protect(s.flows))
	mux.HandleFunc("/api/providers", s.protect(s.providersStatus))
	mux.HandleFunc("/api/providers/minikube/workers", s.protect(s.providerWorker))
}
func localOperator(r *http.Request) bool {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return false
	}
	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}
func (s *Server) providersStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		problem(w, 405, "GET gerekli")
		return
	}
	p := s.providerServices()
	configured := p.minikube != nil
	reason := "Yerel minikube sağlayıcısı etkinleştirilmemiş"
	canAdd := false
	minikube := map[string]interface{}{"available": configured, "canAdd": false, "reason": reason, "operations": []provision.Operation{}}
	if p.minikubeError != nil {
		minikube["reason"] = "Yerel sağlayıcı yapılandırması veya işlem kilidi doğrulanamadı"
	}
	if configured {
		minikube["configuration"] = p.minikube.Configuration()
		if !localOperator(r) {
			minikube["reason"] = "Worker sağlama yalnız yerel operatöre açık"
		} else if c := s.requestClient(w, r); c != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
			defer cancel()
			cfg := provision.FromEnv()
			ns, e := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
			if c.Name != cfg.Context || e != nil || string(ns.UID) != cfg.ClusterUID {
				minikube["reason"] = "Seçili context/küme kimliği sağlayıcı eşlemesiyle uyuşmuyor"
			} else {
				minikube["operations"] = p.minikube.Snapshot()
				if !s.ReadOnly && s.Namespace == "" && s.authorize(ctx, c, "create", "", "nodes", "", "", "") == nil {
					canAdd = true
					minikube["reason"] = "Gerçek minikube worker ekleme · profil kilidi ve API kimliği işlem öncesinde doğrulanır"
				} else {
					minikube["reason"] = "Worker ekleme için yerel yazma modu, küme kapsamı ve nodes create yetkisi gerekir"
				}
			}
			minikube["canAdd"] = canAdd
		} else {
			return
		}
	}
	hubble := map[string]interface{}{"available": p.hubble != nil, "configured": traffic.FromEnv().Enabled, "provider": "hubble", "reason": "Gerçek Hubble akış sağlayıcısı yapılandırılmamış", "windowSeconds": 10}
	if p.hubble != nil {
		hubble["reason"] = "Hubble · gerçek akış gözlemleri; erişim seçili Kubernetes kimliği/kapsamıyla doğrulanır"
	}
	if p.hubbleError != nil {
		hubble["reason"] = "Hubble CLI/TLS/context yapılandırması doğrulanamadı"
	}
	jsonResponse(w, 200, map[string]interface{}{"minikube": minikube, "hubble": hubble})
}
func (s *Server) providerWorker(w http.ResponseWriter, r *http.Request) {
	if !localOperator(r) {
		problem(w, 403, "Worker sağlama yalnız yerel operatöre açık")
		return
	}
	if s.ReadOnly || s.Namespace != "" {
		problem(w, 403, "Worker sağlama için küme kapsamlı yazma modu gerekir")
		return
	}
	p := s.providerServices()
	if p.minikube == nil {
		problem(w, 503, "Minikube sağlayıcısı yapılandırılmamış veya profil kilidi açılamadı")
		return
	}
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	cfg := provision.FromEnv()
	if c.Name != cfg.Context {
		problem(w, 409, "Seçili context sağlayıcı context'i değil")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	if err := s.authorize(ctx, c, "create", "", "nodes", "", "", ""); err != nil {
		failure(w, err)
		return
	}
	// Begin can return an idempotent cached result before its own Verify call.
	// Keep that result bound to the selected live cluster on POST as well as GET.
	ns, e := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if e != nil {
		failure(w, e)
		return
	}
	if string(ns.UID) != cfg.ClusterUID {
		problem(w, 409, "Küme kimliği değişti")
		return
	}
	if r.Method == "GET" {
		p.minikube.Reconcile(ctx, c.Typed)
		jsonResponse(w, 200, map[string]interface{}{"operations": p.minikube.Snapshot()})
		return
	}
	if r.Method != "POST" {
		problem(w, 405, "GET veya POST gerekli")
		return
	}
	var body struct {
		Action         string `json:"action"`
		ID             string `json:"id"`
		IdempotencyKey string `json:"idempotencyKey"`
	}
	if !decode(w, r, &body) {
		return
	}
	if body.Action == "cancel" {
		if _, _, e := p.minikube.Verify(ctx, c.Typed, c.Name); e != nil {
			problem(w, 409, "Yerel sağlayıcı profil/küme kimliği veya API erişimi doğrulanamadı")
			return
		}
		if e := p.minikube.Cancel(body.ID); e != nil {
			problem(w, 404, "Yerel sağlayıcı işlemi bulunamadı veya işlem kaydı güncellenemedi")
			return
		}
		jsonResponse(w, 202, map[string]interface{}{"operations": p.minikube.Snapshot()})
		return
	}
	if body.Action != "" && body.Action != "add-worker" {
		problem(w, 400, "Desteklenmeyen sağlayıcı işlemi")
		return
	}
	op, e := p.minikube.Begin(ctx, c.Typed, c.Name, body.IdempotencyKey)
	if e != nil {
		problem(w, 409, "Yerel sağlayıcı isteği reddedildi; profil/küme kimliğini, kapasiteyi ve açık işlemleri kontrol edin")
		return
	}
	jsonResponse(w, 202, map[string]interface{}{"operation": op})
}
