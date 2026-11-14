package server

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"reflect"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/client-go/rest"
)

type workspaceRuntime struct {
	store              *ws.Store
	operatorCookieName string
	accessCookieName   string
	mu                 sync.Mutex
	identities         map[string]connectionIdentity
}
type connectionIdentity struct {
	ClusterUID           string `json:"clusterUID,omitempty"`
	Confidence           string `json:"confidence"`
	AuthorizationKey     string `json:"authorizationKey,omitempty"`
	CredentialGeneration string `json:"credentialGeneration,omitempty"`
}
type workspaceRequestKey struct{}
type operationTargetKey struct{}
type workspaceOperationTarget struct {
	Group           string `json:"group"`
	Version         string `json:"version"`
	Resource        string `json:"resource"`
	Namespace       string `json:"namespace"`
	Name            string `json:"name"`
	UID             string `json:"uid"`
	ResourceVersion string `json:"resourceVersion"`
}
type workspaceScope struct {
	workspaceID, tabID string
	harbor             ws.Harbor
	connection         ws.Connection
	revision           uint64
	selector           labels.Selector
}

func workspaceScopeFrom(ctx context.Context) *workspaceScope {
	v, _ := ctx.Value(workspaceRequestKey{}).(*workspaceScope)
	return v
}
func (v *workspaceScope) allowsNamespace(ns string) bool {
	for _, allowed := range v.harbor.Namespaces {
		if allowed == "*" || allowed == ns {
			return true
		}
	}
	return false
}
func scopeValue(r *http.Request, header, query string) string {
	if v := r.Header.Get(header); v != "" {
		return v
	}
	return r.URL.Query().Get(query)
}
func operatorKey(r *http.Request, cookie string) string {
	if scope := workspaceScopeFrom(r.Context()); scope != nil {
		return cookie + "|" + scope.workspaceID + "|" + scope.harbor.ID + "|" + scope.tabID
	}
	return cookie
}

// ConfigureWorkspace must be called before Register/serving. An empty explicit
// legacyContext starts empty, without consulting the user's current-context.
func (s *Server) ConfigureWorkspace(dataDir, legacyContext, legacyNamespace string) error {
	if s.workspace != nil {
		return errors.New("workspace already configured")
	}
	if legacyContext != "" && !s.trustedWorkspaceContext(legacyContext) {
		return errors.New("legacy context is not in trusted server configuration")
	}
	store, err := ws.Open(dataDir, legacyContext, legacyNamespace)
	if err != nil {
		return err
	}
	// Browser cookie storage is host-scoped, not port-scoped. Independent local
	// profiles need stable names, including before the first authenticated GET.
	// These immutable names are cached once; guards never clone the document.
	identityHash := sha256.Sum256([]byte(store.Snapshot().ID))
	suffix := "_" + hex.EncodeToString(identityHash[:8])
	s.workspace = &workspaceRuntime{store: store, operatorCookieName: operatorCookie + suffix, accessCookieName: accessCookie + suffix, identities: map[string]connectionIdentity{}}
	return nil
}
func (s *Server) trustedWorkspaceContext(name string) bool {
	if name == "" {
		return false
	}
	if s.replayEnabled() {
		c, e := s.replayClient(name)
		return e == nil && c.Name == name
	}
	s.mu.Lock()
	c := s.clients[name]
	s.mu.Unlock()
	if c != nil && c.Config == nil {
		return true
	}
	if name == "in-cluster" {
		_, err := rest.InClusterConfig()
		return err == nil
	}
	cfg, err := loadingRules().Load()
	return err == nil && cfg.Contexts[name] != nil
}
func (s *Server) bindWorkspaceRequest(w http.ResponseWriter, r *http.Request) (*http.Request, bool) {
	if s.workspace == nil || r.URL.Path == "/api/contexts" || strings.HasPrefix(r.URL.Path, "/api/workspace") || s.replayEnabled() && (r.URL.Path == "/api/replay/status" || r.URL.Path == "/api/replay/scenario") {
		return r, true
	}
	workspaceID := scopeValue(r, "X-KubeView-Workspace", "workspaceId")
	harborID := scopeValue(r, "X-KubeView-Harbor", "harborId")
	tabID := scopeValue(r, "X-KubeView-Tab", "tabId")
	if workspaceID == "" || harborID == "" || tabID == "" || len(tabID) > 128 || strings.ContainsAny(tabID, "|/\\ \t\r\n") {
		problem(w, 400, "workspaceId, harborId ve tabId gerekli")
		return r, false
	}
	doc := s.workspace.store.Snapshot()
	if workspaceID != doc.ID {
		problem(w, 404, "Workspace bulunamadı")
		return r, false
	}
	for _, h := range doc.Harbors {
		if h.ID == harborID {
			for _, c := range doc.Connections {
				if c.ID == h.ConnectionRef {
					if !c.Bound || c.Context == "" {
						problem(w, 409, "İçe aktarılan bağlantıyı güvenilir context ile bağlayın")
						return r, false
					}
					if explicit := r.URL.Query().Get("context"); explicit != "" && explicit != c.Context {
						problem(w, 409, "Context liman bağlantısıyla uyuşmuyor")
						return r, false
					}
					selector, _ := labels.Parse(h.Selector)
					scope := &workspaceScope{workspaceID: doc.ID, tabID: tabID, harbor: h, connection: c, revision: doc.Revision, selector: selector}
					ctx := context.WithValue(r.Context(), workspaceRequestKey{}, scope)
					ctx = context.WithValue(ctx, clusterImpactKey{}, r.Header.Get("X-KubeView-Cluster-Impact") == "acknowledged")
					w.Header().Set("X-KubeView-Workspace", scope.workspaceID)
					w.Header().Set("X-KubeView-Harbor", scope.harbor.ID)
					w.Header().Set("X-KubeView-Tab", scope.tabID)
					return r.WithContext(ctx), true
				}
			}
		}
	}
	problem(w, 404, "Liman bulunamadı")
	return r, false
}
func (s *Server) scopedClient(c *Clients, scope *workspaceScope) *Clients {
	out := *c
	out.ID = c.ID + ":" + scope.connection.ID
	out.Dynamic = &workspaceDynamic{Interface: c.Dynamic, s: s, c: c, scope: scope}
	return &out
}
func safeAuthorizationKey(c *Clients, connectionID string) string {
	sum := sha256.Sum256([]byte(strings.TrimSuffix(c.ID, ":"+connectionID) + "|" + connectionID))
	return hex.EncodeToString(sum[:16])
}
func (s *Server) workspaceIdentity(ctx context.Context, c *Clients, connectionID string) connectionIdentity {
	base := *c
	base.ID = strings.TrimSuffix(c.ID, ":"+connectionID)
	identity := connectionIdentity{Confidence: "unknown", AuthorizationKey: safeAuthorizationKey(&base, connectionID), CredentialGeneration: base.ID}
	if c.DataSource == "test-replay" {
		identity.Confidence = "test-replay"
		identity.ClusterUID = "test/replay/" + c.Name
	} else if obj, err := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{}); err == nil && obj.UID != "" {
		identity.ClusterUID = string(obj.UID)
		identity.Confidence = "verified"
	}
	s.workspace.mu.Lock()
	s.workspace.identities[connectionID] = identity
	s.workspace.mu.Unlock()
	return identity
}
func (s *Server) workspaceDTO(w http.ResponseWriter, r *http.Request, doc ws.Document) {
	_, session := s.operator(r, w)
	if session == nil {
		problem(w, 429, "Yerel oturum sınırı")
		return
	}
	s.operatorMu.Lock()
	nonce := session.nonce
	s.operatorMu.Unlock()
	b, _ := json.Marshal(doc)
	var dto map[string]interface{}
	_ = json.Unmarshal(b, &dto)
	dto["workspaceNonce"] = nonce
	for _, item := range dto["connections"].([]interface{}) {
		c := item.(map[string]interface{})
		id := c["id"].(string)
		s.workspace.mu.Lock()
		identity, ok := s.workspace.identities[id]
		s.workspace.mu.Unlock()
		if !ok {
			identity.Confidence = "unknown"
		}
		if contextName, ok := c["context"].(string); ok && contextName != "" {
			client, err := s.client(contextName)
			if err != nil || identity.CredentialGeneration != "" && identity.CredentialGeneration != client.ID {
				identity = connectionIdentity{Confidence: "unknown"}
			}
			if err == nil {
				identity.AuthorizationKey = safeAuthorizationKey(client, id)
				identity.CredentialGeneration = client.ID
			}
		}
		c["identity"] = identity
		c["authorizationKey"] = identity.AuthorizationKey
		c["credentialGeneration"] = identity.CredentialGeneration
	}
	jsonResponse(w, 200, dto)
}
func (s *Server) workspaceCSRF(w http.ResponseWriter, r *http.Request) bool {
	cookie, err := r.Cookie(s.operatorCookieName())
	if err != nil {
		problem(w, 403, "Önce workspace'i okuyun")
		return false
	}
	s.operatorMu.Lock()
	session := s.operators[cookie.Value]
	valid := session != nil && time.Now().Before(session.expires) && r.Header.Get("X-KubeView-Workspace-Nonce") != "" && r.Header.Get("X-KubeView-Workspace-Nonce") == session.nonce
	s.operatorMu.Unlock()
	if !valid {
		problem(w, 403, "Workspace nonce gerekli veya değişti")
		return false
	}
	return true
}
func (s *Server) workspaceHandler(w http.ResponseWriter, r *http.Request) {
	if s.workspace == nil {
		problem(w, 404, "Workspace yapılandırılmamış")
		return
	}
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/workspace"), "/")
	if r.Method == "GET" {
		switch path {
		case "":
			s.workspaceDTO(w, r, s.workspace.store.Snapshot())
		case "export":
			jsonResponse(w, 200, ws.Export(s.workspace.store.Snapshot()))
		default:
			problem(w, 404, "Workspace yolu bulunamadı")
		}
		return
	}
	if !s.workspaceCSRF(w, r) {
		return
	}
	if path == "preview" || path == "validate" {
		s.workspacePreview(w, r)
		return
	}
	var body struct {
		Revision    uint64                 `json:"revision"`
		Name        *string                `json:"name"`
		Preferences map[string]interface{} `json:"preferences"`
		Connection  json.RawMessage        `json:"connection"`
		Harbor      json.RawMessage        `json:"harbor"`
		Relation    json.RawMessage        `json:"relation"`
		Workspace   *ws.Document           `json:"workspace"`
	}
	if !decode(w, r, &body) {
		return
	}
	before := s.workspace.store.Snapshot()
	parts := strings.Split(path, "/")
	id := ""
	if len(parts) == 2 {
		id = parts[1]
	} else if len(parts) > 2 {
		problem(w, 404, "Geçersiz workspace yolu")
		return
	}
	doc, err := s.workspace.store.Update(body.Revision, func(d *ws.Document) error {
		if path == "" && r.Method == "PATCH" {
			if body.Name != nil {
				d.Name = *body.Name
			}
			if body.Preferences != nil {
				d.Preferences = body.Preferences
			}
			return nil
		}
		if path == "import" && r.Method == "POST" && body.Workspace != nil {
			return ws.ImportInto(d, *body.Workspace)
		}
		if r.Method != "POST" && r.Method != "PATCH" && r.Method != "DELETE" {
			return errors.New("POST/PATCH/DELETE gerekli")
		}
		switch parts[0] {
		case "connections":
			index := -1
			for i, c := range d.Connections {
				if c.ID == id {
					index = i
				}
			}
			if r.Method == "DELETE" {
				if index < 0 {
					return errors.New("bağlantı bulunamadı")
				}
				for _, h := range d.Harbors {
					if h.ConnectionRef == id {
						return errors.New("önce bu bağlantının limanlarını kaldırın")
					}
				}
				d.Connections = append(d.Connections[:index], d.Connections[index+1:]...)
				return nil
			}
			var c ws.Connection
			if id != "" {
				if index < 0 {
					return errors.New("bağlantı bulunamadı")
				}
				c = d.Connections[index]
			} else if r.Method != "POST" {
				return errors.New("bağlantı ID gerekli")
			}
			if len(body.Connection) == 0 {
				return errors.New("connection gerekli")
			}
			if err := json.Unmarshal(body.Connection, &c); err != nil {
				return err
			}
			if id != "" && c.ID != id {
				return errors.New("bağlantı ID değiştirilemez")
			}
			if id == "" {
				c.ID = uuid.NewString()
			}
			if !s.trustedWorkspaceContext(c.Context) {
				return errors.New("context güvenilir sunucu kubeconfig'inde yok")
			}
			c.Bound = true
			if c.Name == "" {
				c.Name = c.Context
			}
			if index < 0 {
				d.Connections = append(d.Connections, c)
			} else {
				d.Connections[index] = c
			}
			return nil
		case "harbors":
			index := -1
			for i, h := range d.Harbors {
				if h.ID == id {
					index = i
				}
			}
			if r.Method == "DELETE" {
				if index < 0 {
					return errors.New("liman bulunamadı")
				}
				d.Harbors = append(d.Harbors[:index], d.Harbors[index+1:]...)
				relations := d.Relations[:0]
				for _, rel := range d.Relations {
					if rel.SourceHarbor != id && rel.TargetHarbor != id {
						relations = append(relations, rel)
					}
				}
				d.Relations = relations
				return nil
			}
			var h ws.Harbor
			if id != "" {
				if index < 0 {
					return errors.New("liman bulunamadı")
				}
				h = d.Harbors[index]
			} else if r.Method != "POST" {
				return errors.New("liman ID gerekli")
			}
			if len(body.Harbor) == 0 {
				return errors.New("harbor gerekli")
			}
			if err := json.Unmarshal(body.Harbor, &h); err != nil {
				return err
			}
			if id != "" && h.ID != id {
				return errors.New("liman ID değiştirilemez")
			}
			if id == "" {
				h.ID = uuid.NewString()
				h.Position = availableHarborPosition(d.Harbors, h.Position)
			}
			h.WorkspaceID = d.ID
			if s.Namespace != "" && (len(h.Namespaces) != 1 || h.Namespaces[0] != s.Namespace) {
				return errors.New("Liman namespace kapsamı sunucu WATCH_NAMESPACE sınırını genişletemez")
			}
			if h.View == nil {
				h.View = map[string]interface{}{}
			}
			if index < 0 {
				d.Harbors = append(d.Harbors, h)
			} else {
				d.Harbors[index] = h
			}
			return nil
		case "relations":
			index := -1
			for i, rel := range d.Relations {
				if rel.ID == id {
					index = i
				}
			}
			if r.Method == "DELETE" {
				if index < 0 {
					return errors.New("ilişki bulunamadı")
				}
				d.Relations = append(d.Relations[:index], d.Relations[index+1:]...)
				return nil
			}
			var rel ws.Relation
			if id != "" {
				if index < 0 {
					return errors.New("ilişki bulunamadı")
				}
				rel = d.Relations[index]
			}
			if err := json.Unmarshal(body.Relation, &rel); err != nil {
				return err
			}
			if id != "" && rel.ID != id {
				return errors.New("ilişki ID değiştirilemez")
			}
			if id == "" {
				rel.ID = uuid.NewString()
			}
			if rel.Type != "configured" || rel.Origin != "user" {
				return errors.New("kullanıcı ilişkisi configured/user olmalı; altyapı kanıtı uydurulamaz")
			}
			if index < 0 {
				d.Relations = append(d.Relations, rel)
			} else {
				d.Relations[index] = rel
			}
			return nil
		}
		return errors.New("geçersiz workspace yolu")
	})
	if err != nil {
		code := 422
		if errors.Is(err, ws.ErrRevision) {
			code = 409
		}
		problem(w, code, err.Error())
		return
	}
	s.invalidateWorkspaceChanges(before, doc)
	s.workspaceDTO(w, r, doc)
}
func (s *Server) invalidateWorkspaceChanges(before, after ws.Document) {
	changed := map[string]bool{}
	for _, h := range before.Harbors {
		var current *ws.Harbor
		for i := range after.Harbors {
			if after.Harbors[i].ID == h.ID {
				current = &after.Harbors[i]
				break
			}
		}
		if current == nil || current.ConnectionRef != h.ConnectionRef || current.Selector != h.Selector || !reflect.DeepEqual(current.Namespaces, h.Namespaces) {
			changed[h.ID] = true
		}
	}
	for _, old := range before.Connections {
		for _, next := range after.Connections {
			if old.ID == next.ID && old.Context != next.Context {
				for _, h := range before.Harbors {
					if h.ConnectionRef == old.ID {
						changed[h.ID] = true
					}
				}
				s.workspace.mu.Lock()
				delete(s.workspace.identities, old.ID)
				s.workspace.mu.Unlock()
			}
		}
	}
	s.operatorMu.Lock()
	ids := []string{}
	for key, session := range s.operators {
		for h := range changed {
			if strings.Contains(key, "|"+before.ID+"|"+h+"|") {
				resetOperator(session)
				ids = append(ids, key)
				break
			}
		}
	}
	s.operatorMu.Unlock()
	for _, id := range ids {
		s.closeOperatorForwards(id)
	}
}
func (s *Server) workspacePreview(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		problem(w, 405, "POST gerekli")
		return
	}
	var body struct {
		ConnectionRef string   `json:"connectionRef"`
		Context       string   `json:"context"`
		Namespaces    []string `json:"namespaces"`
		Selector      string   `json:"selector"`
	}
	if !decode(w, r, &body) {
		return
	}
	d := s.workspace.store.Snapshot()
	if body.ConnectionRef != "" {
		for _, c := range d.Connections {
			if c.ID == body.ConnectionRef {
				body.Context = c.Context
			}
		}
	}
	if !s.trustedWorkspaceContext(body.Context) {
		problem(w, 422, "Güvenilir context seçin")
		return
	}
	if s.Namespace != "" && (len(body.Namespaces) != 1 || body.Namespaces[0] != s.Namespace) {
		problem(w, 403, "Önizleme sunucu namespace sınırını genişletemez")
		return
	}
	probe := ws.Document{ID: uuid.NewString(), SchemaVersion: 1, Revision: 1, Name: "preview", Preferences: map[string]interface{}{}, Connections: []ws.Connection{{ID: "preview-connection", Context: body.Context, Bound: true}}, Harbors: []ws.Harbor{{ID: "preview-harbor", Name: "preview", ConnectionRef: "preview-connection", Namespaces: body.Namespaces, Selector: body.Selector, View: map[string]interface{}{}}}}
	probe.Harbors[0].WorkspaceID = probe.ID
	if err := ws.Validate(probe); err != nil {
		problem(w, 422, err.Error())
		return
	}
	c, err := s.client(body.Context)
	if err != nil {
		failure(w, err)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	identity := s.workspaceIdentity(ctx, c, body.ConnectionRef)
	checks := map[string]connectionCheck{}
	counts := map[string]int{}
	errs := []string{}
	selector, _ := labels.Parse(body.Selector)
	scope := &workspaceScope{workspaceID: d.ID, harbor: probe.Harbors[0], connection: probe.Connections[0], selector: selector}
	scoped := s.scopedClient(c, scope)
	for _, entry := range []struct{ group, version, resource, kind string }{{"", "v1", "pods", "Pod"}, {"apps", "v1", "deployments", "Deployment"}, {"", "v1", "services", "Service"}} {
		list, e := scoped.Dynamic.Resource(schemaGVR(entry.group, entry.version, entry.resource)).List(ctx, metav1.ListOptions{})
		checks[entry.resource] = checkResult(e, "Kapsam okunabildi")
		if e == nil {
			counts[entry.kind] = len(list.Items)
		} else {
			errs = append(errs, safeError(e))
		}
	}
	overlaps := []map[string]interface{}{}
	for _, h := range d.Harbors {
		if h.ConnectionRef != body.ConnectionRef {
			continue
		}
		common := []string{}
		for _, ns := range h.Namespaces {
			for _, other := range body.Namespaces {
				if ns == other || ns == "*" || other == "*" {
					common = append(common, ns)
					break
				}
			}
		}
		if len(common) > 0 {
			overlaps = append(overlaps, map[string]interface{}{"harborId": h.ID, "namespaces": common, "selector": h.Selector, "potential": true})
		}
	}
	jsonResponse(w, 200, map[string]interface{}{"valid": len(errs) == 0, "context": c.Name, "namespaces": body.Namespaces, "selector": body.Selector, "identity": identity, "checks": checks, "counts": counts, "overlaps": overlaps, "errors": errs})
}
func workspaceError(message string) error { return fmt.Errorf("Liman kapsamı: %s", message) }
func scopedOperation(r *http.Request, c *Clients, obj interface{}, dry bool) map[string]interface{} {
	result := operation(obj, dry)
	scope := workspaceScopeFrom(r.Context())
	if scope == nil {
		return result
	}
	op := result["operation"].(map[string]interface{})
	op["workspaceId"] = scope.workspaceID
	op["harborId"] = scope.harbor.ID
	op["connectionRef"] = scope.connection.ID
	op["context"] = c.Name
	op["tabId"] = scope.tabID
	op["credentialGeneration"] = strings.TrimSuffix(c.ID, ":"+scope.connection.ID)
	target, _ := r.Context().Value(operationTargetKey{}).(workspaceOperationTarget)
	if resource, ok := obj.(*unstructured.Unstructured); ok && resource != nil {
		target.Name = resource.GetName()
		target.Namespace = resource.GetNamespace()
		target.UID = string(resource.GetUID())
		target.ResourceVersion = resource.GetResourceVersion()
	}
	op["target"] = target
	return result
}
func availableHarborPosition(harbors []ws.Harbor, preferred [2]float64) [2]float64 {
	occupied := map[[2]float64]bool{}
	for _, h := range harbors {
		occupied[h.Position] = true
	}
	if !occupied[preferred] {
		return preferred
	}
	for slot := 0; ; slot++ {
		position := [2]float64{float64(slot%5) * 1400, float64(slot/5) * 1400}
		if !occupied[position] {
			return position
		}
	}
}
func (s *Server) retireWorkspaceClient(id string) {
	s.operatorMu.Lock()
	for _, session := range s.operators {
		if session.clientID == id || strings.HasPrefix(session.clientID, id+":") {
			resetOperator(session)
		}
	}
	s.operatorMu.Unlock()
}
