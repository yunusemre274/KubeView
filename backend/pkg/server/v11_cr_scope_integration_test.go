package server

import (
	"context"
	"errors"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	authenticationv1 "k8s.io/api/authentication/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

// Complements the normal-UI six-case frontend-G00-real.mjs proof. All objects,
// permissions, LIST/watch messages and UIDs here come from the owned real API;
// this test does not assert frontend selection or stale presentation.
func TestOwnedV11RealCustomScope(t *testing.T) {
	expectedNamespace := os.Getenv("KUBEVIEW_REPAIR_NAMESPACE_UID")
	if expectedNamespace == "" {
		t.Skip("requires explicit owned KUBEVIEW_REPAIR_NAMESPACE_UID")
	}
	s, c, ctx, contextName, gateway := ownedRepairGatewayManagement(t, false)
	ns := s.Namespace
	owner := uuid.NewString()
	group := "v11-" + strings.Split(owner, "-")[0] + ".audit.kubeview.io"
	gvr := schema.GroupVersionResource{Group: group, Version: "v1", Resource: "repaircargos"}
	crdGVR := schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
	name := "reconnect-cargo"
	labels := map[string]string{"kubeview.io/repair-owner": owner, "kubeview.io/v11-owner": "v11-20261108"}
	guard := func(checkCtx context.Context) bool {
		cluster, e1 := c.Typed.CoreV1().Namespaces().Get(checkCtx, "kube-system", metav1.GetOptions{})
		namespace, e2 := c.Typed.CoreV1().Namespaces().Get(checkCtx, ns, metav1.GetOptions{})
		return e1 == nil && e2 == nil && string(cluster.UID) == os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID") && string(namespace.UID) == expectedNamespace && namespace.Labels["kubeview.io/repair-owner"] == "backend-manager" && namespace.Labels["kubeview.io/v11-owner"] == "v11-20261108"
	}
	if !guard(ctx) {
		t.Fatal("refusing unexpected cluster/namespace UID or ownership")
	}
	type ownedObject struct {
		gvr      schema.GroupVersionResource
		ns, name string
		uid      types.UID
	}
	owned := []ownedObject{}
	objectClient := func(resource schema.GroupVersionResource, namespace string) interface {
		Get(context.Context, string, metav1.GetOptions, ...string) (*unstructured.Unstructured, error)
		Delete(context.Context, string, metav1.DeleteOptions, ...string) error
	} {
		if namespace == "" {
			return c.Dynamic.Resource(resource)
		}
		return c.Dynamic.Resource(resource).Namespace(namespace)
	}
	remove := func(deleteCtx context.Context, item ownedObject) error {
		if !guard(deleteCtx) {
			return apierrors.NewConflict(item.gvr.GroupResource(), item.name, errors.New("owned scope changed"))
		}
		client := objectClient(item.gvr, item.ns)
		current, err := client.Get(deleteCtx, item.name, metav1.GetOptions{})
		if apierrors.IsNotFound(err) {
			return nil
		}
		if err != nil {
			return err
		}
		if current.GetUID() != item.uid || current.GetLabels()["kubeview.io/repair-owner"] != owner || current.GetLabels()["kubeview.io/v11-owner"] != labels["kubeview.io/v11-owner"] {
			return apierrors.NewConflict(item.gvr.GroupResource(), item.name, errors.New("owned resource identity changed"))
		}
		if item.gvr == crdGVR {
			// Never delete a definition while dependent CRs could be removed with
			// it. This is an actual all-namespace LIST of the unique owned GVR.
			dependents, e := c.Dynamic.Resource(gvr).List(deleteCtx, metav1.ListOptions{})
			if e != nil || len(dependents.Items) != 0 {
				return apierrors.NewConflict(item.gvr.GroupResource(), item.name, errors.New("dependent CR absence not verified"))
			}
			t.Logf("REAL CRD cleanup dependent CRs all-namespace LIST=0 group=%s CRDUID=%s", group, item.uid)
		}
		uid, rv := current.GetUID(), current.GetResourceVersion()
		if err = client.Delete(deleteCtx, item.name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid, ResourceVersion: &rv}}); err != nil && !apierrors.IsNotFound(err) {
			return err
		}
		for deleteCtx.Err() == nil {
			_, err = client.Get(deleteCtx, item.name, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				return nil
			}
			if err != nil {
				return err
			}
			time.Sleep(100 * time.Millisecond)
		}
		return deleteCtx.Err()
	}
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 35*time.Second)
		defer cancel()
		for i := len(owned) - 1; i >= 0; i-- {
			if err := remove(cleanup, owned[i]); err != nil {
				t.Errorf("guarded owned cleanup failed resource=%s UID=%s", owned[i].gvr.Resource, owned[i].uid)
			}
		}
	})
	create := func(resource schema.GroupVersionResource, namespace, kind, objectName string, spec map[string]interface{}) *unstructured.Unstructured {
		t.Helper()
		if !guard(ctx) {
			t.Fatal("ownership changed before owned CREATE")
		}
		obj := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": resource.GroupVersion().String(), "kind": kind, "metadata": map[string]interface{}{"name": objectName}}}
		obj.SetNamespace(namespace)
		obj.SetLabels(labels)
		for key, value := range spec {
			obj.Object[key] = value
		}
		var result *unstructured.Unstructured
		var err error
		if namespace == "" {
			result, err = c.Dynamic.Resource(resource).Create(ctx, obj, metav1.CreateOptions{})
		} else {
			result, err = c.Dynamic.Resource(resource).Namespace(namespace).Create(ctx, obj, metav1.CreateOptions{})
		}
		if err != nil {
			t.Fatalf("owned CREATE failed resource=%s (existing names are never overwritten)", resource.Resource)
		}
		owned = append(owned, ownedObject{resource, namespace, objectName, result.GetUID()})
		return result
	}
	crd := create(crdGVR, "", "CustomResourceDefinition", gvr.Resource+"."+group, map[string]interface{}{"spec": map[string]interface{}{
		"group": group, "scope": "Namespaced", "names": map[string]interface{}{"plural": gvr.Resource, "singular": "repaircargo", "kind": "V11RepairCargo"},
		"versions": []interface{}{map[string]interface{}{"name": "v1", "served": true, "storage": true, "schema": map[string]interface{}{"openAPIV3Schema": map[string]interface{}{"type": "object", "properties": map[string]interface{}{"spec": map[string]interface{}{"type": "object", "x-kubernetes-preserve-unknown-fields": true}}}}}},
	}})
	established := false
	for deadline := time.Now().Add(20 * time.Second); time.Now().Before(deadline); {
		current, err := c.Dynamic.Resource(crdGVR).Get(ctx, crd.GetName(), metav1.GetOptions{})
		if err != nil || current.GetUID() != crd.GetUID() {
			t.Fatal("owned CRD identity lost")
		}
		conditions, _, _ := unstructured.NestedSlice(current.Object, "status", "conditions")
		for _, raw := range conditions {
			condition, ok := raw.(map[string]interface{})
			established = established || ok && condition["type"] == "Established" && condition["status"] == "True"
		}
		if established {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}
	if !established {
		t.Fatal("owned unique CRD did not become Established")
	}
	cargo := func() *unstructured.Unstructured {
		return create(gvr, ns, "V11RepairCargo", name, map[string]interface{}{"spec": map[string]interface{}{"purpose": "non-sensitive-v11-scope-proof"}})
	}
	first := cargo()
	operator := ctx.Value(integrationOperatorKey{}).(integrationOperator)
	open := func(contextAlias, scopeNamespace string, cookie *http.Cookie) *websocket.Conn {
		t.Helper()
		q := url.Values{"context": {contextAlias}, "namespace": {ns}, "subscribe": {gvr.GroupVersion().String() + "|" + gvr.Resource + "|" + scopeNamespace}}
		header := http.Header{"Origin": {gateway}}
		if cookie != nil {
			header.Set("Cookie", cookie.String())
		}
		conn, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(gateway, "http")+"/ws?"+q.Encode(), header)
		if err != nil {
			t.Fatal("real scoped WebSocket open failed")
		}
		t.Cleanup(func() { conn.Close() })
		return conn
	}
	read := func(conn *websocket.Conn, typ, action string) envelope {
		t.Helper()
		conn.SetReadDeadline(time.Now().Add(20 * time.Second))
		for {
			var msg envelope
			if err := conn.ReadJSON(&msg); err != nil {
				t.Fatal("real scoped WebSocket read failed")
			}
			if msg.Type == typ && (action == "" || msg.Action == action) && (typ != "RESOURCE_EVENT" || msg.Object != nil && msg.Object.GetAPIVersion() == gvr.GroupVersion().String()) {
				return msg
			}
		}
	}
	scope := func(msg envelope, namespace, status string, authoritative bool) {
		t.Helper()
		found := false
		for _, current := range msg.Scopes {
			if current.Group == group && current.Version == "v1" && current.Resource == gvr.Resource && current.Namespace == namespace {
				found = true
				if current.Status != status || current.Authoritative != authoritative {
					t.Fatal("real CR scope authority/status incorrect")
				}
			}
		}
		if !found || msg.Generation == "" {
			t.Fatal("real CR explicit scope/generation missing")
		}
		for _, object := range msg.Resources {
			if object.GetAPIVersion() == gvr.GroupVersion().String() && object.GetNamespace() != ns {
				t.Fatal("cross-namespace CR leaked into snapshot")
			}
		}
	}
	var conn *websocket.Conn
	var initialGeneration string
	if !t.Run("read-only-session-and-same-UID-reconnect", func(t *testing.T) {
		path := gateway + "/api/resources?" + url.Values{"context": {contextName}, "namespace": {ns}, "group": {group}, "version": {"v1"}, "resource": {gvr.Resource}, "name": {name}}.Encode()
		if code, _ := repairHTTP(t, ctx, "DELETE", path, map[string]string{"uid": string(first.GetUID()), "resourceVersion": first.GetResourceVersion()}); code != 403 {
			t.Fatalf("browser management-off DELETE expected403 got%d", code)
		}
		conn = open(contextName, ns, operator.cookie)
		before := read(conn, "SNAPSHOT", "")
		scope(before, ns, "synced", true)
		if before.Context != contextName || !containsUID(before, string(first.GetUID())) {
			t.Fatal("initial real CR snapshot missing expected UID")
		}
		initialGeneration = before.Generation
		conn.Close()
		conn = open(contextName, ns, operator.cookie)
		after := read(conn, "SNAPSHOT", "")
		scope(after, ns, "synced", true)
		if after.Generation == initialGeneration || !containsUID(after, string(first.GetUID())) {
			t.Fatal("same-source reconnect lost UID or reused generation")
		}
		t.Logf("REAL readonly session context=%s namespace=%s namespaceUID=%s CRUID=%s sameUID reconnect with distinct WS generation; browser mutation403; no management enable", contextName, ns, expectedNamespace, first.GetUID())
	}) {
		return
	}
	if !t.Run("live-update-and-DELETE", func(t *testing.T) {
		current, err := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
		if err != nil || current.GetUID() != first.GetUID() || !guard(ctx) {
			t.Fatal("owned CR identity lost before UPDATE")
		}
		_ = unstructured.SetNestedField(current.Object, "updated", "spec", "stage")
		updated, err := c.Dynamic.Resource(gvr).Namespace(ns).Update(ctx, current, metav1.UpdateOptions{})
		if err != nil {
			t.Fatal("real CR UPDATE failed")
		}
		message := read(conn, "RESOURCE_EVENT", "UPDATE")
		if message.Object.GetUID() != first.GetUID() || message.Object.GetResourceVersion() != updated.GetResourceVersion() || message.Scope == nil || !message.Scope.Authoritative {
			t.Fatal("real UPDATE UID/RV/authority mismatch")
		}
		if err = remove(ctx, owned[len(owned)-1]); err != nil {
			t.Fatal("real guarded CR DELETE failed")
		}
		message = read(conn, "RESOURCE_EVENT", "DELETE")
		if message.Object.GetUID() != first.GetUID() {
			t.Fatal("wrong real CR UID deleted")
		}
		t.Logf("REAL API UPDATE RV echoed and watch DELETE UID=%s; guarded API GET404", first.GetUID())
	}) {
		return
	}
	if !t.Run("same-name-new-UID", func(t *testing.T) {
		next := cargo()
		message := read(conn, "RESOURCE_EVENT", "ADD")
		if next.GetUID() == first.GetUID() || message.Object.GetUID() != next.GetUID() || message.Object.GetName() != first.GetName() {
			t.Fatal("same-name replacement UID was not distinguished")
		}
		first = next
		t.Logf("REAL same raw address new CRUID=%s; old DELETE is a separate UID event", next.GetUID())
	}) {
		return
	}
	if !t.Run("offline-DELETE-authoritative-relist", func(t *testing.T) {
		conn.Close()
		if err := remove(ctx, owned[len(owned)-1]); err != nil {
			t.Fatal("owned offline DELETE failed")
		}
		conn = open(contextName, ns, operator.cookie)
		empty := read(conn, "SNAPSHOT", "")
		scope(empty, ns, "synced", true)
		if containsUID(empty, string(first.GetUID())) {
			t.Fatal("offline deleted CR survived authoritative relist")
		}
		for _, object := range empty.Resources {
			if object.GetAPIVersion() == gvr.GroupVersion().String() {
				t.Fatal("unique GVR relist was not empty")
			}
		}
		conn.Close()
		t.Logf("REAL offline API DELETE UID=%s GET404; reconnect authoritative empty GVR scope; frontend stale presentation is not asserted", first.GetUID())
	}) {
		return
	}
	if !t.Run("outside-namespace-scope-is-forbidden", func(t *testing.T) {
		outside := ns + "-outside"
		other := open(contextName, outside, operator.cookie)
		defer other.Close()
		message := read(other, "SNAPSHOT", "")
		scope(message, outside, "forbidden", false)
		t.Logf("REAL gateway restrictedNamespace=%s requested on-demand namespace=%s: forbidden nonauthoritative; no outside namespace created", ns, outside)
	}) {
		return
	}
	t.Run("real-RBAC-loss-forbidden-and-restore-same-UID", func(t *testing.T) {
		retained := cargo()
		alias := "kv-repair-cr-reader-" + strings.Split(owner, "-")[0]
		saGVR := schema.GroupVersionResource{Version: "v1", Resource: "serviceaccounts"}
		roleGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
		bindingGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
		create(saGVR, ns, "ServiceAccount", alias, map[string]interface{}{"automountServiceAccountToken": false})
		create(roleGVR, ns, "Role", alias, map[string]interface{}{"rules": []interface{}{map[string]interface{}{"apiGroups": []interface{}{group}, "resources": []interface{}{gvr.Resource}, "verbs": []interface{}{"get", "list", "watch"}}, map[string]interface{}{"apiGroups": []interface{}{""}, "resources": []interface{}{"pods"}, "verbs": []interface{}{"get", "list", "watch"}}}})
		bindingSpec := map[string]interface{}{"roleRef": map[string]interface{}{"apiGroup": "rbac.authorization.k8s.io", "kind": "Role", "name": alias}, "subjects": []interface{}{map[string]interface{}{"kind": "ServiceAccount", "namespace": ns, "name": alias}}}
		create(bindingGVR, ns, "RoleBinding", alias, bindingSpec)
		binding := owned[len(owned)-1]
		expiration := int64(600)
		token, err := c.Typed.CoreV1().ServiceAccounts(ns).CreateToken(ctx, alias, &authenticationv1.TokenRequest{Spec: authenticationv1.TokenRequestSpec{ExpirationSeconds: &expiration}}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned reader TokenRequest failed")
		}
		config, err := loadingRules().Load()
		if err != nil || config.Contexts[contextName] == nil {
			t.Fatal("trusted merged operator config unavailable")
		}
		config.AuthInfos[alias] = &clientcmdapi.AuthInfo{Token: token.Status.Token}
		config.Contexts[alias] = &clientcmdapi.Context{Cluster: config.Contexts[contextName].Cluster, AuthInfo: alias, Namespace: ns}
		privateConfig := filepath.Join(t.TempDir(), "reader-kubeconfig")
		if err = clientcmd.WriteToFile(*config, privateConfig); err != nil {
			t.Fatal("private reader kubeconfig write failed")
		}
		if err = os.Chmod(privateConfig, 0600); err != nil {
			t.Fatal("private reader kubeconfig permission failed")
		}
		t.Setenv("KUBECONFIG", privateConfig)
		reader, err := s.client(alias)
		if err != nil {
			t.Fatal("private restricted reader unavailable")
		}
		waitPermission := func(allowed bool) {
			t.Helper()
			for deadline := time.Now().Add(8 * time.Second); time.Now().Before(deadline); {
				err := s.authorize(ctx, reader, "list", group, gvr.Resource, "", ns, "")
				if allowed && err == nil || !allowed && apierrors.IsForbidden(err) {
					return
				}
				time.Sleep(100 * time.Millisecond)
			}
			t.Fatal("real reader RBAC propagation did not reach expected permission")
		}
		waitPermission(true)
		cookie, info := diagnostic(t, s, alias, ns, nil)
		if info["readOnly"] != true || info["managementEnabled"] != false {
			t.Fatal("restricted diagnostic unexpectedly enabled management")
		}
		for _, resource := range []string{"nodes", "namespaces"} {
			path := gateway + "/api/resources?" + url.Values{"context": {alias}, "version": {"v1"}, "resource": {resource}}.Encode()
			if code, _ := repairHTTP(t, ctx, "GET", path, nil); code != 403 {
				t.Fatalf("real restricted %s LIST expected403 got%d", resource, code)
			}
		}
		visible := open(alias, ns, cookie)
		message := read(visible, "SNAPSHOT", "")
		scope(message, ns, "synced", true)
		if message.Context != alias || !containsUID(message, string(retained.GetUID())) {
			t.Fatal("restricted reader could not see authorized same CR UID")
		}
		visible.Close()
		if err = remove(ctx, binding); err != nil {
			t.Fatal("owned rolebinding revoke failed")
		}
		waitPermission(false)
		denied := open(alias, ns, cookie)
		message = read(denied, "SNAPSHOT", "")
		scope(message, ns, "forbidden", false)
		if containsUID(message, string(retained.GetUID())) {
			t.Fatal("forbidden scope leaked private CR")
		}
		denied.Close()
		stillReal, err := c.Dynamic.Resource(gvr).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
		if err != nil || stillReal.GetUID() != retained.GetUID() {
			t.Fatal("RBAC loss changed actual CR identity")
		}
		create(bindingGVR, ns, "RoleBinding", alias, bindingSpec)
		waitPermission(true)
		restored := open(alias, ns, cookie)
		defer restored.Close()
		message = read(restored, "SNAPSHOT", "")
		scope(message, ns, "synced", true)
		if !containsUID(message, string(retained.GetUID())) {
			t.Fatal("RBAC restore failed to recover same actual UID")
		}
		t.Logf("REAL TokenRequest reader own namespace LIST/watch allowed, Node/Namespace LIST403; rolebinding delete -> forbidden nonauthoritative while operator GET retains CRUID=%s -> rolebinding recreation same UID synced; credentials and nonce omitted", retained.GetUID())
	})
}
