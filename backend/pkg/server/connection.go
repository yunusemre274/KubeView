package server

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const operatorCookie = "kubeview_operator"
const accessCookie = "kubeview_session"

func (s *Server) operatorCookieName() string {
	if s.workspace != nil {
		return s.workspace.operatorCookieName
	}
	return operatorCookie
}
func (s *Server) accessCookieName() string {
	if s.workspace != nil {
		return s.workspace.accessCookieName
	}
	return accessCookie
}

type operatorRequestKey struct{}
type operatorRequest struct{ id, nonce string }
type operatorSession struct {
	members                             map[string]workspaceMember
	streamGeneration                    string
	context, namespace, clientID, nonce string
	enabled                             bool
	expires                             time.Time
	ctx                                 context.Context
	cancel                              context.CancelFunc
}

func (s *Server) operator(r *http.Request, w http.ResponseWriter) (string, *operatorSession) {
	s.operatorMu.Lock()
	defer s.operatorMu.Unlock()
	now := time.Now()
	for id, session := range s.operators {
		if now.After(session.expires) {
			session.cancel()
			delete(s.operators, id)
		}
	}
	if request, ok := r.Context().Value(operatorRequestKey{}).(operatorRequest); ok && request.id != "" {
		if session := s.operators[request.id]; session != nil {
			return request.id, session
		}
	}
	if cookie, err := r.Cookie(s.operatorCookieName()); err == nil {
		key := operatorKey(r, cookie.Value)
		if session := s.operators[key]; session != nil {
			return key, session
		}
	}
	if len(s.operators) >= 128 {
		return "", nil
	}
	id := uuid.NewString()
	if cookie, err := r.Cookie(s.operatorCookieName()); err == nil && s.operators[cookie.Value] != nil {
		id = cookie.Value
	}
	key := operatorKey(r, id)
	if key != id && s.operators[id] == nil {
		rootCtx, rootCancel := context.WithDeadline(context.Background(), now.Add(8*time.Hour))
		s.operators[id] = &operatorSession{nonce: uuid.NewString(), expires: now.Add(8 * time.Hour), ctx: rootCtx, cancel: rootCancel}
	}
	ctx, cancel := context.WithDeadline(context.Background(), now.Add(8*time.Hour))
	session := &operatorSession{nonce: uuid.NewString(), expires: now.Add(8 * time.Hour), ctx: ctx, cancel: cancel}
	s.operators[key] = session
	http.SetCookie(w, &http.Cookie{Name: s.operatorCookieName(), Value: id, HttpOnly: true, Secure: r.TLS != nil, SameSite: http.SameSiteStrictMode, Path: "/", MaxAge: 28800})
	return key, session
}

func resetOperator(session *operatorSession) {
	session.cancel()
	// Streams already attach to this context. Expiry must cancel them even if
	// no subsequent HTTP request runs the opportunistic map cleanup.
	session.ctx, session.cancel = context.WithDeadline(context.Background(), session.expires)
	session.nonce, session.enabled = uuid.NewString(), false
	session.members = nil
	session.streamGeneration = ""
}

func (s *Server) managementAllowed(ctx context.Context, c *Clients, ns string) error {
	request, protected := ctx.Value(operatorRequestKey{}).(operatorRequest)
	// Internal capability helpers have no HTTP request. Every public route is
	// wrapped by protect, including requests without a browser cookie.
	if !protected {
		return nil
	}
	s.operatorMu.Lock()
	defer s.operatorMu.Unlock()
	session := s.operators[request.id]
	if session == nil || request.nonce == "" || time.Now().After(session.expires) {
		return apierrors.NewForbidden(schema.GroupResource{}, "", errors.New("KubeView yönetim oturumu gerekli"))
	}
	if request.nonce != session.nonce || c.Name != session.context || c.ID != session.clientID {
		return apierrors.NewConflict(schema.GroupResource{}, "", errors.New("KubeView bağlantı oturumu değişti"))
	}
	if !session.enabled {
		return apierrors.NewForbidden(schema.GroupResource{}, "", errors.New("KubeView yönetim oturumu gerekli"))
	}
	// Cluster-scoped actions keep their existing handler and Kubernetes RBAC
	// checks. A namespace selector must not be mistaken for a cluster identity.
	if ns != "" && session.namespace != "" && ns != session.namespace {
		return apierrors.NewForbidden(schema.GroupResource{}, "", errors.New("KubeView yönetim kapsamı dışında"))
	}
	return nil
}

func (s *Server) managementState(r *http.Request, c *Clients, ns string) bool {
	cookie, err := r.Cookie(s.operatorCookieName())
	if err != nil {
		return false
	}
	s.operatorMu.Lock()
	defer s.operatorMu.Unlock()
	session := s.operators[operatorKey(r, cookie.Value)]
	return !s.ReadOnly && session != nil && session.enabled && time.Now().Before(session.expires) && (c == nil || session.context == c.Name && session.clientID == c.ID) && (session.namespace == "" || ns == "" || session.namespace == ns)
}

type connectionCheck struct {
	Status   string `json:"status"`
	Message  string `json:"message"`
	Category string `json:"category,omitempty"`
}

func checkResult(err error, message string) connectionCheck {
	if err == nil {
		return connectionCheck{Status: "ok", Message: message}
	}
	v := publicError(err)
	status := "unavailable"
	if v.Category == "forbidden" {
		status = "forbidden"
	}
	return connectionCheck{Status: status, Message: v.Error, Category: v.Category}
}

func (s *Server) connection(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		problem(w, 405, "GET gerekli")
		return
	}
	c := s.requestClient(w, r)
	if c == nil {
		return
	}
	ns, err := s.namespace(r)
	if err != nil {
		problem(w, 403, err.Error())
		return
	}
	id, session := s.operator(r, w)
	if session == nil {
		problem(w, 429, "Yerel oturum sınırına ulaşıldı")
		return
	}
	s.operatorMu.Lock()
	changed := session.context != c.Name || session.namespace != ns || session.clientID != c.ID
	if changed {
		resetOperator(session)
		session.context, session.namespace, session.clientID = c.Name, ns, c.ID
	}
	nonce, enabled := session.nonce, session.enabled && !s.ReadOnly
	s.operatorMu.Unlock()
	if changed {
		s.closeOperatorForwards(id)
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	checks := map[string]interface{}{"configuration": connectionCheck{Status: "ok", Message: "Güvenilir yerel kubeconfig veya ServiceAccount seçildi"}}
	_, apiErr := c.Discovery.ServerVersion()
	checks["api"] = checkResult(apiErr, "Kubernetes API yanıt verdi")
	resources, discoveryErrors := discover(c)
	checks["discovery"] = connectionCheck{Status: "ok", Message: "Kubernetes API kaynakları keşfedildi"}
	if len(discoveryErrors) > 0 || len(resources) == 0 {
		checks["discovery"] = connectionCheck{Status: "unavailable", Category: "discovery", Message: "API keşfi eksik; erişilebilir kaynaklar kullanılabilir"}
	}
	permissions := map[string]connectionCheck{}
	for _, p := range []struct{ key, group, resource, namespace string }{{"pods", "", "pods", ns}, {"deployments", "apps", "deployments", ns}, {"nodes", "", "nodes", ""}, {"namespaces", "", "namespaces", ""}} {
		permissions[p.key] = checkResult(s.authorize(ctx, c, "list", p.group, p.resource, "", p.namespace, ""), "Listeleme izni var")
	}
	checks["permissions"] = permissions
	checks["metrics"] = connectionCheck{Status: "unavailable", Message: "Metrics API kullanılabilir değil"}
	if c.Metrics != nil {
		_, e := c.Metrics.MetricsV1beta1().PodMetricses(ns).List(ctx, metav1.ListOptions{Limit: 1})
		checks["metrics"] = checkResult(e, "Gerçek Pod metrikleri erişilebilir")
	}
	p := s.providerServices()
	checks["hubble"] = connectionCheck{Status: "unavailable", Message: "İsteğe bağlı Hubble sağlayıcısı yapılandırılmamış"}
	if p.hubble != nil {
		checks["hubble"] = connectionCheck{Status: "configured", Message: "Hubble yapılandırılmış; gerçek veri ve seçili küme eşlemesi trafik katmanında doğrulanır"}
	}
	result := map[string]interface{}{"context": c.Name, "namespace": ns, "defaultNamespace": c.Namespace, "connectionID": nonce, "readOnly": !enabled, "serverReadOnly": s.ReadOnly, "managementEnabled": enabled, "managementAvailable": !s.ReadOnly, "checks": checks}
	if scope := workspaceScopeFrom(r.Context()); scope != nil {
		result["workspaceId"] = scope.workspaceID
		result["harborId"] = scope.harbor.ID
		result["tabId"] = scope.tabID
		result["connectionRef"] = scope.connection.ID
		result["namespaces"] = scope.harbor.Namespaces
		result["selector"] = scope.harbor.Selector
		identity := s.workspaceIdentity(ctx, c, scope.connection.ID)
		result["identity"] = identity
		result["authorizationKey"] = identity.AuthorizationKey
		result["credentialGeneration"] = identity.CredentialGeneration
	}
	jsonResponse(w, 200, result)
}

func (s *Server) management(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		problem(w, 405, "POST gerekli")
		return
	}
	var body struct {
		Enabled      bool   `json:"enabled"`
		Context      string `json:"context"`
		Namespace    string `json:"namespace"`
		ConnectionID string `json:"connectionID"`
	}
	if !decode(w, r, &body) {
		return
	}
	if !body.Enabled {
		if _, session := s.operator(r, w); session == nil {
			problem(w, 429, "Yerel oturum sınırına ulaşıldı")
			return
		}
		// The initial explicit revoke may precede the first diagnostic request.
		if _, e := r.Cookie(s.operatorCookieName()); e != nil {
			jsonResponse(w, 200, map[string]interface{}{"managementEnabled": false, "readOnly": true})
			return
		}
	}
	cookie, err := r.Cookie(s.operatorCookieName())
	if err != nil {
		problem(w, 403, "Önce bağlantıyı denetleyin")
		return
	}
	s.operatorMu.Lock()
	key := operatorKey(r, cookie.Value)
	session := s.operators[key]
	if session == nil || time.Now().After(session.expires) {
		s.operatorMu.Unlock()
		problem(w, 403, "Yerel bağlantı oturumu gerekli")
		return
	}
	if !body.Enabled {
		resetOperator(session)
		nonce := session.nonce
		s.operatorMu.Unlock()
		s.closeOperatorForwards(key)
		jsonResponse(w, 200, map[string]interface{}{"managementEnabled": false, "readOnly": true, "connectionID": nonce})
		return
	}
	valid := body.ConnectionID != "" && body.ConnectionID == session.nonce && body.Context == session.context && body.Namespace == session.namespace
	s.operatorMu.Unlock()
	if !valid {
		problem(w, 409, "Bağlantı niyeti değişti; yeniden denetleyin")
		return
	}
	if s.ReadOnly {
		problem(w, 403, "Sunucu salt okunur modda (READ_ONLY=true)")
		return
	}
	c, err := s.client(body.Context)
	if err != nil {
		failure(w, err)
		return
	}
	if scope := workspaceScopeFrom(r.Context()); scope != nil {
		if body.Context != scope.connection.Context {
			problem(w, 409, "Yönetim hedefi liman bağlantısıyla uyuşmuyor")
			return
		}
		c = s.scopedClient(c, scope)
	}
	// Prove API access without assuming Namespace or Node LIST permission.
	_, err = c.Typed.AuthorizationV1().SelfSubjectAccessReviews().Create(r.Context(), accessReview("get", "", "pods", "", body.Namespace, ""), metav1.CreateOptions{})
	if err != nil {
		failure(w, err)
		return
	}
	if s.managementBeforeGrant != nil {
		s.managementBeforeGrant()
	}
	latest, err := s.client(body.Context)
	if err != nil {
		failure(w, err)
		return
	}
	if scope := workspaceScopeFrom(r.Context()); scope != nil {
		latest = s.scopedClient(latest, scope)
	}
	s.operatorMu.Lock()
	session = s.operators[key]
	valid = r.Context().Err() == nil && session != nil && time.Now().Before(session.expires) && body.ConnectionID == session.nonce && body.Context == session.context && body.Namespace == session.namespace && latest.ID == session.clientID
	if valid {
		session.enabled = true
	}
	s.operatorMu.Unlock()
	if !valid {
		problem(w, 409, "Bağlantı yönetim izni beklerken değişti; yeniden denetleyin")
		return
	}
	jsonResponse(w, 200, map[string]interface{}{"managementEnabled": true, "readOnly": false, "connectionID": body.ConnectionID})
}

func (s *Server) closeOperatorForwards(id string) {
	s.forwardMu.Lock()
	ids := []string{}
	for key, session := range s.forwards {
		if session.operatorID == id {
			ids = append(ids, key)
		}
	}
	s.forwardMu.Unlock()
	for _, key := range ids {
		s.closeForward(key)
	}
}
