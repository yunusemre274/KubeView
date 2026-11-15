package server

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
)

func (f *workspaceRealRun) scopeHarbor(h ws.Harbor) url.Values {
	return url.Values{"workspaceId": {f.doc.ID}, "harborId": {h.ID}, "tabId": {f.tab}}
}
func (f *workspaceRealRun) harborResource(h ws.Harbor, namespace, name string) url.Values {
	q := f.scopeHarbor(h)
	q.Set("group", "apps")
	q.Set("version", "v1")
	q.Set("resource", "deployments")
	if namespace != "" {
		q.Set("namespace", namespace)
	}
	if name != "" {
		q.Set("name", name)
	}
	return q
}
func (f *workspaceRealRun) acceptWorkspace(body []byte) {
	f.t.Helper()
	var document ws.Document
	var extra struct {
		Nonce string `json:"workspaceNonce"`
	}
	if json.Unmarshal(body, &document) != nil || document.ID != f.originalDocument.ID || json.Unmarshal(body, &extra) != nil || extra.Nonce == "" {
		f.t.Fatal("workspace response identity/nonce mismatch")
	}
	f.doc = document
	f.workspaceNonce = extra.Nonce
}
func (f *workspaceRealRun) addTemporaryHarbor(name string, namespaces []string, selector string) ws.Harbor {
	f.t.Helper()
	for _, namespace := range namespaces {
		f.guard(f.ctx, namespace)
	}
	connection := f.harbors[f.namespaces[0]].ConnectionRef
	before := map[string]bool{}
	for _, h := range f.doc.Harbors {
		before[h.ID] = true
	}
	status, body := f.gateway(http.MethodPost, "/api/workspace/harbors", nil, map[string]interface{}{"revision": f.doc.Revision, "harbor": map[string]interface{}{"name": name, "connectionRef": connection, "namespaces": namespaces, "selector": selector, "view": map[string]interface{}{}}}, "")
	f.code(status, 200, "own temporary harbor create")
	f.acceptWorkspace(body)
	var added []ws.Harbor
	for _, h := range f.doc.Harbors {
		if !before[h.ID] {
			added = append(added, h)
		}
	}
	if len(added) != 1 || added[0].Name != name || !strings.HasPrefix(name, f.runID) || added[0].ConnectionRef != connection {
		f.t.Fatal("temporary harbor created ID not proved")
	}
	h := added[0]
	f.temporaryHarbors[h.ID] = h
	f.proof.TemporaryHarborIDs = append(f.proof.TemporaryHarborIDs, h.ID)
	return h
}
func (f *workspaceRealRun) enableHarbor(h ws.Harbor) {
	f.t.Helper()
	for _, namespace := range h.Namespaces {
		f.guard(f.ctx, namespace)
	}
	status, body := f.gateway(http.MethodGet, "/api/connection", f.scopeHarbor(h), nil, "")
	f.code(status, 200, "temporary harbor diagnostic")
	var info struct {
		ConnectionID      string             `json:"connectionID"`
		ReadOnly          bool               `json:"readOnly"`
		ManagementEnabled bool               `json:"managementEnabled"`
		Identity          connectionIdentity `json:"identity"`
	}
	if json.Unmarshal(body, &info) != nil || info.ConnectionID == "" || !info.ReadOnly || info.ManagementEnabled || info.Identity.ClusterUID != f.clusterUID {
		f.t.Fatal("temporary harbor inherited management or wrong identity")
	}
	namespace := ""
	if len(h.Namespaces) == 1 {
		namespace = h.Namespaces[0]
	}
	status, _ = f.gateway(http.MethodPost, "/api/management", f.scopeHarbor(h), map[string]interface{}{"enabled": true, "context": f.lab.Clusters["a"].Name, "namespace": namespace, "connectionID": info.ConnectionID}, "")
	f.code(status, 200, "temporary harbor explicit enable")
	f.nonces[h.ID] = info.ConnectionID
}
func (f *workspaceRealRun) createHarborFixture(h ws.Harbor, namespace, name, scopeLabel string) *workspaceRealOwned {
	f.t.Helper()
	item := f.pending(namespace, name)
	object := f.fixture(namespace, name)
	if scopeLabel != "" {
		object.Labels["manual.kubeview.local/ws-scope"] = scopeLabel
		object.Spec.Template.Labels["manual.kubeview.local/ws-scope"] = scopeLabel
	}
	f.guard(f.ctx, namespace)
	nonce := f.nonces[h.ID]
	if nonce == "" {
		nonce = f.nonces[namespace]
	}
	status, _ := f.gateway(http.MethodPost, "/api/resources", f.harborResource(h, namespace, ""), map[string]interface{}{"object": object}, nonce)
	f.code(status, 201, "scoped owned create")
	f.capture(item)
	f.ready(item)
	return item
}
func (f *workspaceRealRun) socketHarbor(h ws.Harbor) (*websocket.Conn, <-chan envelope) {
	f.t.Helper()
	base := f.harbors[f.namespaces[0]]
	f.harbors[f.namespaces[0]] = h
	conn, events := f.socket(f.namespaces[0])
	f.harbors[f.namespaces[0]] = base
	return conn, events
}
func (f *workspaceRealRun) deploymentSet(h ws.Harbor, namespace string, expected ...types.UID) {
	f.t.Helper()
	status, body := f.gateway(http.MethodGet, "/api/resources", f.harborResource(h, namespace, ""), nil, "")
	f.code(status, 200, "scoped deployment list")
	var list unstructured.UnstructuredList
	if json.Unmarshal(body, &list) != nil {
		f.t.Fatal("scoped resource list malformed")
	}
	set := map[types.UID]bool{}
	for _, object := range list.Items {
		if set[object.GetUID()] || object.GetLabels()[workspaceRealAuditLabel] != f.runID {
			f.t.Fatal("overlap list duplicated UID or leaked outside audit selector")
		}
		set[object.GetUID()] = true
	}
	if len(set) != len(expected) {
		f.t.Fatal("scoped union has unexpected UID count")
	}
	for _, uid := range expected {
		if !set[uid] {
			f.t.Fatal("scoped union lost expected UID")
		}
	}
}
func (f *workspaceRealRun) updateScope(item *workspaceRealOwned, value string) {
	f.t.Helper()
	f.guard(f.ctx, item.Namespace)
	object := f.capture(item)
	object.TypeMeta = metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"}
	object.Labels["manual.kubeview.local/ws-scope"] = value
	object.Spec.Template.Labels["manual.kubeview.local/ws-scope"] = value
	status, _ := f.gateway(http.MethodPut, "/api/resources", f.resourceQuery(item.Namespace, item.Name), map[string]interface{}{"object": object}, f.nonces[item.Namespace])
	f.code(status, 200, "owned external scope-label update")
}
func (f *workspaceRealRun) rollout(item *workspaceRealOwned, replicas int32) *appsv1.Deployment {
	f.t.Helper()
	for deadline := time.Now().Add(60 * time.Second); time.Now().Before(deadline) && f.ctx.Err() == nil; time.Sleep(300 * time.Millisecond) {
		object := f.capture(item)
		if object.Spec.Replicas != nil && *object.Spec.Replicas == replicas && object.Status.ObservedGeneration >= object.Generation && object.Status.UpdatedReplicas == replicas && object.Status.ReadyReplicas == replicas && object.Status.AvailableReplicas >= replicas && object.Status.Replicas == replicas {
			return object
		}
	}
	f.t.Fatal("owned rollout did not converge within60s")
	return nil
}
func (f *workspaceRealRun) waitAuditAbsent(ctx context.Context, item *workspaceRealOwned) bool {
	selector := workspaceRealAuditLabel + "=" + f.runID + ",manual.kubeview.local/ws-object=" + item.Name
	for ctx.Err() == nil {
		deployments, e1 := f.admin.AppsV1().Deployments(item.Namespace).List(ctx, metav1.ListOptions{LabelSelector: selector})
		sets, e2 := f.admin.AppsV1().ReplicaSets(item.Namespace).List(ctx, metav1.ListOptions{LabelSelector: selector})
		pods, e3 := f.admin.CoreV1().Pods(item.Namespace).List(ctx, metav1.ListOptions{LabelSelector: selector})
		if e1 == nil && e2 == nil && e3 == nil && len(deployments.Items) == 0 && len(sets.Items) == 0 && len(pods.Items) == 0 {
			return true
		}
		time.Sleep(200 * time.Millisecond)
	}
	f.t.Error("audit-only Deployment/ReplicaSet/Pod final LIST not empty")
	return false
}
func workspaceRealDocumentHash(document ws.Document) string {
	document.Revision = 0
	data, _ := json.Marshal(document)
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
func (f *workspaceRealRun) cleanupTemporaryHarbors(ctx context.Context) {
	if len(f.temporaryHarbors) == 0 {
		return
	}
	status, body := f.gatewayContext(ctx, http.MethodGet, "/api/workspace", nil, nil, "")
	f.code(status, 200, "cleanup workspace read")
	f.acceptWorkspace(body)
	for id, expected := range f.temporaryHarbors {
		var current *ws.Harbor
		for i := range f.doc.Harbors {
			if f.doc.Harbors[i].ID == id {
				current = &f.doc.Harbors[i]
				break
			}
		}
		if current == nil {
			continue
		}
		if current.Name != expected.Name || current.ConnectionRef != expected.ConnectionRef || !strings.HasPrefix(current.Name, f.runID) {
			f.t.Error("temporary harbor cleanup refused changed record")
			continue
		}
		for _, namespace := range expected.Namespaces {
			f.guard(ctx, namespace)
		}
		status, body = f.gatewayContext(ctx, http.MethodDelete, "/api/workspace/harbors/"+id, nil, map[string]interface{}{"revision": f.doc.Revision}, "")
		f.code(status, 200, "cleanup own temporary harbor")
		f.acceptWorkspace(body)
		f.proof.Cleanup = append(f.proof.Cleanup, "created temporary harbor ID removed")
	}
	if workspaceRealDocumentHash(f.doc) != workspaceRealDocumentHash(f.originalDocument) {
		f.t.Error("workspace config outside owned temporary records changed")
	} else {
		f.proof.Cleanup = append(f.proof.Cleanup, "original workspace document preserved except revision")
	}
}
