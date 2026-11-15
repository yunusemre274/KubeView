package server

// Explicit opt-in: production handlers plus real Kubernetes API. No browser UI.
import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"

	authnv1 "k8s.io/api/authentication/v1"
	authzv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/metadata"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

func TestReleaseOwnedSecretPurposeReal(t *testing.T) {
	if os.Getenv("KUBEVIEW_RELEASE_REAL_SECRET") != "owned-secret-purpose-v1" {
		t.Skip("requires explicit sealed owned synthetic Secret opt-in")
	}
	started := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 105*time.Second)
	defer cancel()
	out := os.Getenv("KUBEVIEW_RELEASE_REAL_OUTPUT")
	statePath, configPath, receiptPath := os.Getenv("KUBEVIEW_RELEASE_REAL_STATE"), os.Getenv("KUBEVIEW_RELEASE_REAL_KUBECONFIG"), os.Getenv("KUBEVIEW_RELEASE_REAL_SECRET_RECEIPT")
	if !filepath.IsAbs(out) || !filepath.IsAbs(statePath) || !filepath.IsAbs(configPath) || !filepath.IsAbs(receiptPath) {
		t.Fatal("explicit absolute paths required")
	}
	proof := map[string]interface{}{"mode": "PRODUCTION_HANDLER_REAL_KUBERNETES_SYNTHETIC_SECRET_NOT_BROWSER_UI", "startedAt": started.UTC(), "events": []interface{}{}, "valuesRecorded": false}
	write := func(name string, value interface{}) {
		b, e := json.MarshalIndent(value, "", "  ")
		if e != nil || os.WriteFile(filepath.Join(out, name), append(b, '\n'), 0600) != nil {
			t.Error("safe evidence write failed")
		}
	}
	t.Cleanup(func() {
		proof["elapsedSeconds"], proof["failed"] = time.Since(started).Seconds(), t.Failed()
		proof["within180Seconds"] = time.Since(started) <= 180*time.Second
		write("result.json", proof)
	})
	mark := func(event string, fields map[string]interface{}) {
		proof["events"] = append(proof["events"].([]interface{}), map[string]interface{}{"event": event, "at": time.Now().UTC(), "proof": fields})
	}
	hash := func(v interface{}) string {
		b, _ := json.Marshal(v)
		sum := sha256.Sum256(b)
		return hex.EncodeToString(sum[:])
	}
	filehash := func(path string) string {
		b, e := os.ReadFile(path)
		if e != nil {
			t.Fatal("owned baseline file unavailable")
		}
		sum := sha256.Sum256(b)
		return hex.EncodeToString(sum[:])
	}
	var receipt struct{ Namespace, NamespaceUID, NamespaceOwnerLabel, LabID, ClusterUID, OwnerMarkerUID, Seal string }
	b, e := os.ReadFile(receiptPath)
	if e != nil || json.Unmarshal(b, &receipt) != nil || receipt.Namespace != "kvrel-secret-20261112-21bddadc" || receipt.NamespaceUID != "56a3bd1d-cc63-4f7e-a3d0-b0114c99b58d" || receipt.Seal != "db34037d06b44bddba8b63eb7c586ec1" || receipt.LabID != "kvml-d32afbf634e8" || receipt.ClusterUID != "e84bb50e-8d64-4bc2-905c-9b5ba193e53a" || receipt.OwnerMarkerUID != "0cded75c-bc00-472f-b69f-39dfd43251f3" || receipt.NamespaceOwnerLabel != "manual.kubeview.local/lab-id" {
		t.Fatal("root sealed namespace receipt mismatch")
	}
	var lab workspaceRealLab
	b, e = os.ReadFile(statePath)
	if e != nil || json.Unmarshal(b, &lab) != nil || lab.LabID != receipt.LabID || lab.Clusters["a"].UID != receipt.ClusterUID || lab.Clusters["a"].MarkerUID != receipt.OwnerMarkerUID || lab.Clusters["a"].Name != "kvml-d32afbf634e8-a" {
		t.Fatal("owned lab state mismatch")
	}
	raw, e := clientcmd.LoadFromFile(configPath)
	if e != nil {
		t.Fatal("private operator config unavailable")
	}
	contextName := lab.Clusters["a"].Name
	cc := raw.Contexts[contextName]
	if cc == nil {
		t.Fatal("owned operator context missing")
	}
	cl, ai := raw.Clusters[cc.Cluster], raw.AuthInfos[cc.AuthInfo]
	if cl == nil || ai == nil || ai.Exec != nil || ai.AuthProvider != nil || cl.InsecureSkipTLSVerify || len(cl.CertificateAuthorityData) == 0 {
		t.Fatal("private static verified TLS configuration required")
	}
	u, e := url.Parse(cl.Server)
	if e != nil || u.Scheme != "https" || net.ParseIP(u.Hostname()) == nil || !net.ParseIP(u.Hostname()).IsLoopback() || u.User != nil {
		t.Fatal("owned API loopback HTTPS required")
	}
	t.Setenv("KUBECONFIG", configPath)
	t.Setenv("KUBE_CONTEXT", "")
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	t.Setenv("KUBEVIEW_REPLAY", "")
	adminServer := New()
	adminServer.ReadOnly = false
	adminServer.Namespace = receipt.Namespace
	adminServer.Token = ""
	t.Cleanup(adminServer.Close)
	admin, e := adminServer.client(contextName)
	if e != nil {
		t.Fatal("owned real admin client unavailable")
	}
	meta, e := metadata.NewForConfig(admin.Config)
	if e != nil {
		t.Fatal("metadata-only client unavailable")
	}
	guard := func(c context.Context) error {
		short, stop := context.WithTimeout(c, 5*time.Second)
		defer stop()
		system, err := admin.Typed.CoreV1().Namespaces().Get(short, "kube-system", metav1.GetOptions{})
		if err != nil || string(system.UID) != receipt.ClusterUID {
			return fmt.Errorf("cluster_UID_guard")
		}
		marker, err := admin.Typed.CoreV1().ConfigMaps("kube-system").Get(short, "kubeview-manual-lab-owner", metav1.GetOptions{})
		if err != nil || string(marker.UID) != receipt.OwnerMarkerUID || marker.Labels[receipt.NamespaceOwnerLabel] != receipt.LabID {
			return fmt.Errorf("cluster_owner_marker_guard")
		}
		ns, err := admin.Typed.CoreV1().Namespaces().Get(short, receipt.Namespace, metav1.GetOptions{})
		if err != nil || string(ns.UID) != receipt.NamespaceUID || ns.Labels[receipt.NamespaceOwnerLabel] != receipt.LabID || ns.Labels["kubeview.io/audit-run"] != "ra-20261112-secret-purpose" || ns.Annotations["kubeview.io/audit-seal"] != receipt.Seal || ns.DeletionTimestamp != nil {
			return fmt.Errorf("namespace_UID_owner_seal_guard")
		}
		return nil
	}
	needGuard := func(c context.Context) {
		if guard(c) != nil {
			t.Fatal("live owned identity guard failed")
		}
	}
	needGuard(ctx)
	secretGVR := schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
	initial, e := meta.Resource(secretGVR).Namespace(receipt.Namespace).List(ctx, metav1.ListOptions{})
	if e != nil || len(initial.Items) != 0 {
		t.Fatal("sealed namespace Secret metadata inventory is not empty")
	}
	profilePath := filepath.Join(filepath.Dir(statePath), "minikube/.minikube/profiles", contextName, "config.json")
	profileBefore, stateBefore := filehash(profilePath), filehash(statePath)
	readNodes := func(c context.Context) map[string]interface{} {
		nodes, err := admin.Typed.CoreV1().Nodes().List(c, metav1.ListOptions{})
		if err != nil || len(nodes.Items) != 2 {
			t.Fatal("original Node inventory unavailable")
		}
		result := map[string]interface{}{}
		for _, n := range nodes.Items {
			ready := false
			for _, condition := range n.Status.Conditions {
				if condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue {
					ready = true
				}
			}
			if string(n.UID) != lab.Clusters["a"].NodeUIDs[n.Name] || !ready {
				t.Fatal("original Node UID or Ready mismatch")
			}
			result[n.Name] = map[string]interface{}{"UID": n.UID, "metadataHash": hash([]interface{}{n.Labels, n.Annotations, n.CreationTimestamp, n.OwnerReferences, n.Finalizers, n.Spec})}
		}
		return result
	}
	nodesBefore := readNodes(ctx)
	var random [24]byte
	if _, e = rand.Read(random[:]); e != nil {
		t.Fatal("synthetic randomness unavailable")
	}
	runID := hex.EncodeToString(random[:8])
	name := "kv-secret-" + runID
	const runLabel = "kubeview.io/secret-run"
	labels := func() map[string]string {
		return map[string]string{receipt.NamespaceOwnerLabel: receipt.LabID, runLabel: runID, "unknown-label": "keep"}
	}
	type owned struct {
		GVR  schema.GroupVersionResource
		Name string
		UID  types.UID
	}
	ownedObjects := []owned{}
	capture := func(gvr schema.GroupVersionResource, m metav1.Object) {
		ownedObjects = append(ownedObjects, owned{gvr, m.GetName(), m.GetUID()})
		write("owned-fixtures.json", ownedObjects)
	}
	t.Cleanup(func() {
		clean, stop := context.WithTimeout(context.Background(), 30*time.Second)
		defer stop()
		removed := []interface{}{}
		for i := len(ownedObjects) - 1; i >= 0; i-- {
			x := ownedObjects[i]
			if guard(clean) != nil {
				t.Error("cleanup cluster namespace guard refused")
				break
			}
			resource := meta.Resource(x.GVR).Namespace(receipt.Namespace)
			m, err := resource.Get(clean, x.Name, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				removed = append(removed, map[string]interface{}{"UID": x.UID, "absent": true})
				continue
			}
			if err != nil || m.UID != x.UID || m.Labels[runLabel] != runID || m.Labels[receipt.NamespaceOwnerLabel] != receipt.LabID {
				t.Error("cleanup exact fixture UID owner refused")
				continue
			}
			rv := m.ResourceVersion
			if resource.Delete(clean, x.Name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &x.UID, ResourceVersion: &rv}}) != nil {
				t.Error("exact fixture delete failed")
				continue
			}
			for {
				_, err = resource.Get(clean, x.Name, metav1.GetOptions{})
				if apierrors.IsNotFound(err) {
					removed = append(removed, map[string]interface{}{"UID": x.UID, "absent": true})
					break
				}
				if err != nil || clean.Err() != nil {
					t.Error("exact fixture GET404 not observed")
					break
				}
				time.Sleep(50 * time.Millisecond)
			}
		}
		remaining, err := meta.Resource(secretGVR).Namespace(receipt.Namespace).List(clean, metav1.ListOptions{LabelSelector: runLabel + "=" + runID})
		if err != nil || len(remaining.Items) != 0 {
			t.Error("synthetic Secret metadata inventory not empty")
		}
		if filehash(profilePath) != profileBefore || filehash(statePath) != stateBefore || !reflect.DeepEqual(readNodes(clean), nodesBefore) {
			t.Error("original profile lab or Node metadata changed")
		}
		proof["cleanup"] = removed
		proof["allExactFixturesAbsent"] = len(removed) == len(ownedObjects)
		proof["namespaceNotDeleted"] = true
		proof["profileLabAndOriginalNodesUnchanged"] = true
	})
	value := []byte(hex.EncodeToString(random[:]))
	annotation := "synthetic-private-" + hex.EncodeToString(random[:])
	needGuard(ctx)
	secret, e := admin.Typed.CoreV1().Secrets(receipt.Namespace).Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: receipt.Namespace, Labels: labels(), Annotations: map[string]string{"unknown.example/annotation": "preserve", "kubectl.kubernetes.io/last-applied-configuration": annotation}}, Type: corev1.SecretTypeOpaque, Data: map[string][]byte{"payload": value}}, metav1.CreateOptions{})
	if e != nil {
		t.Fatal("synthetic Secret create failed")
	}
	capture(secretGVR, secret)
	proof["namespaceUID"], proof["SecretUID"], proof["syntheticDataHash"] = receipt.NamespaceUID, secret.UID, hash(secret.Data)
	aliases := []string{"secret-list-" + runID, "secret-get-" + runID}
	for i, alias := range aliases {
		needGuard(ctx)
		no := false
		sa, err := admin.Typed.CoreV1().ServiceAccounts(receipt.Namespace).Create(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: alias, Namespace: receipt.Namespace, Labels: labels()}, AutomountServiceAccountToken: &no}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned restricted ServiceAccount create failed")
		}
		capture(schema.GroupVersionResource{Version: "v1", Resource: "serviceaccounts"}, sa)
		rules := []rbacv1.PolicyRule{{APIGroups: []string{""}, Resources: []string{"secrets"}, Verbs: []string{"list"}}}
		if i == 1 {
			rules[0].Verbs = []string{"get"}
			rules[0].ResourceNames = []string{name}
		}
		needGuard(ctx)
		role, err := admin.Typed.RbacV1().Roles(receipt.Namespace).Create(ctx, &rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: alias, Namespace: receipt.Namespace, Labels: labels()}, Rules: rules}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned restricted Role create failed")
		}
		capture(schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}, role)
		needGuard(ctx)
		binding, err := admin.Typed.RbacV1().RoleBindings(receipt.Namespace).Create(ctx, &rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: alias, Namespace: receipt.Namespace, Labels: labels()}, RoleRef: rbacv1.RoleRef{APIGroup: "rbac.authorization.k8s.io", Kind: "Role", Name: alias}, Subjects: []rbacv1.Subject{{Kind: "ServiceAccount", Namespace: receipt.Namespace, Name: alias}}}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned restricted RoleBinding create failed")
		}
		capture(schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}, binding)
		needGuard(ctx)
		expiration := int64(600)
		token, err := admin.Typed.CoreV1().ServiceAccounts(receipt.Namespace).CreateToken(ctx, alias, &authnv1.TokenRequest{Spec: authnv1.TokenRequestSpec{ExpirationSeconds: &expiration}}, metav1.CreateOptions{})
		if err != nil || token.Status.Token == "" {
			t.Fatal("owned restricted TokenRequest failed")
		}
		raw.AuthInfos[alias] = &clientcmdapi.AuthInfo{Token: token.Status.Token}
		raw.Contexts[alias] = &clientcmdapi.Context{Cluster: cc.Cluster, AuthInfo: alias, Namespace: receipt.Namespace}
	}
	temp := t.TempDir()
	if os.Chmod(temp, 0700) != nil {
		t.Fatal("private temp mode failed")
	}
	privateConfig := filepath.Join(temp, "kubeconfig")
	if clientcmd.WriteToFile(*raw, privateConfig) != nil || os.Chmod(privateConfig, 0600) != nil {
		t.Fatal("private synthetic identity config failed")
	}
	t.Setenv("KUBECONFIG", privateConfig)
	noLeak := func(body []byte) {
		for _, canary := range [][]byte{value, []byte(base64.StdEncoding.EncodeToString(value)), []byte(annotation)} {
			if bytes.Contains(body, canary) {
				t.Fatal("synthetic private content escaped non-purpose response")
			}
		}
	}
	type session struct {
		s            *Server
		mux          *http.ServeMux
		cookie       *http.Cookie
		nonce, alias string
	}
	call := func(x *session, method, path string, q url.Values, body interface{}, purpose bool) (int, []byte) {
		if method != http.MethodGet {
			needGuard(ctx)
		}
		q2 := url.Values{}
		for k, v := range q {
			q2[k] = v
		}
		q2.Set("context", x.alias)
		q2.Set("namespace", receipt.Namespace)
		encoded, _ := json.Marshal(body)
		req := httptest.NewRequest(method, "http://localhost"+path+"?"+q2.Encode(), bytes.NewReader(encoded)).WithContext(ctx)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Origin", "http://localhost")
		if x.cookie != nil {
			req.AddCookie(x.cookie)
		}
		if x.nonce != "" {
			req.Header.Set("X-KubeView-Connection", x.nonce)
		}
		w := httptest.NewRecorder()
		x.mux.ServeHTTP(w, req)
		if !purpose {
			noLeak(w.Body.Bytes())
		}
		fields := map[string]interface{}{"identity": x.alias, "method": method, "path": path, "status": w.Code}
		if w.Code >= 400 {
			var failure struct {
				Category string `json:"category"`
				Error    string `json:"error"`
			}
			_ = json.Unmarshal(w.Body.Bytes(), &failure)
			category := "other_or_absent"
			for _, allowed := range []string{"forbidden", "unauthorized", "invalid", "conflict", "not_found", "unavailable", "timeout", "bad_request"} {
				if failure.Category == allowed {
					category = allowed
				}
			}
			fields["safeErrorCategory"] = category
			fields["knownMalformedJSONMessage"] = failure.Error == "Geçersiz JSON"
			fields["knownMaskedWriteMessage"] = failure.Error == "Maskelenmiş Secret kaydedilemez; değerleri ayrı ve yetkili akışla açın"
		}
		mark("handler", fields)
		return w.Code, w.Body.Bytes()
	}
	newSession := func(s *Server, alias string) *session {
		x := &session{s: s, alias: alias, mux: http.NewServeMux()}
		s.Register(x.mux)
		req := httptest.NewRequest("GET", "http://localhost/api/connection?context="+url.QueryEscape(alias)+"&namespace="+receipt.Namespace, nil).WithContext(ctx)
		w := httptest.NewRecorder()
		x.mux.ServeHTTP(w, req)
		if w.Code != 200 {
			t.Fatal("production diagnostic failed")
		}
		for _, cookie := range w.Result().Cookies() {
			if cookie.Name == s.operatorCookieName() {
				x.cookie = cookie
			}
		}
		var info struct {
			ConnectionID string `json:"connectionID"`
			ReadOnly     bool   `json:"readOnly"`
		}
		if json.Unmarshal(w.Body.Bytes(), &info) != nil || x.cookie == nil || info.ConnectionID == "" || !info.ReadOnly {
			t.Fatal("initial scoped management state invalid")
		}
		x.nonce = info.ConnectionID
		return x
	}
	enable := func(x *session) {
		code, _ := call(x, "POST", "/api/management", nil, map[string]interface{}{"enabled": true, "context": x.alias, "namespace": receipt.Namespace, "connectionID": x.nonce}, false)
		if code != 200 {
			t.Fatal("explicit management enable failed")
		}
	}
	adminSession := newSession(adminServer, contextName)
	query := url.Values{"name": {name}}
	code, body := call(adminSession, "GET", "/api/secrets/reveal", query, nil, true)
	var revealed corev1.Secret
	if code != 200 || json.Unmarshal(body, &revealed) != nil || revealed.UID != secret.UID || !reflect.DeepEqual(revealed.Data, secret.Data) || !reflect.DeepEqual(revealed.Annotations, secret.Annotations) {
		t.Fatal("authorized purpose reveal lost private data or unknown metadata")
	}
	revealed.Labels["edited"] = "yes"
	revealed.Annotations["edited.example/audit"] = "yes"
	resourceQuery := url.Values{"name": {name}, "resource": {"secrets"}}
	code, _ = call(adminSession, "PUT", "/api/resources", resourceQuery, map[string]interface{}{"object": revealed}, false)
	if code != 403 {
		t.Fatal("pre-management write did not fail403")
	}
	beforeGrant, beforeGrantErr := admin.Typed.CoreV1().Secrets(receipt.Namespace).Get(ctx, name, metav1.GetOptions{})
	if beforeGrantErr != nil || beforeGrant.UID != secret.UID || beforeGrant.ResourceVersion != secret.ResourceVersion || !reflect.DeepEqual(beforeGrant.Data, secret.Data) || !reflect.DeepEqual(beforeGrant.Labels, secret.Labels) || !reflect.DeepEqual(beforeGrant.Annotations, secret.Annotations) {
		t.Fatal("pre-management denial changed synthetic Secret")
	}
	enable(adminSession)
	code, _ = call(adminSession, "PUT", "/api/resources", resourceQuery, map[string]interface{}{"object": revealed}, false)
	if code != 200 {
		t.Fatal("managed purpose edit did not return200")
	}
	needGuard(ctx)
	stored, e := admin.Typed.CoreV1().Secrets(receipt.Namespace).Get(ctx, name, metav1.GetOptions{})
	if e != nil || stored.UID != secret.UID || !reflect.DeepEqual(stored.Data, secret.Data) || !reflect.DeepEqual(stored.Labels, revealed.Labels) || !reflect.DeepEqual(stored.Annotations, revealed.Annotations) || stored.Type != secret.Type || !reflect.DeepEqual(stored.Immutable, secret.Immutable) {
		t.Fatal("purpose metadata edit changed data type or unknown metadata")
	}
	currentHash := hash([]interface{}{stored.UID, stored.ResourceVersion, stored.Data, stored.Labels, stored.Annotations, stored.Type, stored.Immutable})
	unchanged := func() {
		needGuard(ctx)
		current, err := admin.Typed.CoreV1().Secrets(receipt.Namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil || hash([]interface{}{current.UID, current.ResourceVersion, current.Data, current.Labels, current.Annotations, current.Type, current.Immutable}) != currentHash {
			t.Fatal("denied operation changed synthetic Secret")
		}
	}
	listQuery := url.Values{"resource": {"secrets"}, "labelSelector": {runLabel + "=" + runID}}
	checkSanitized := func(body []byte, list bool) {
		var document map[string]interface{}
		if json.Unmarshal(body, &document) != nil {
			t.Fatal("sanitized response malformed")
		}
		objects := []interface{}{document}
		if list {
			items, ok := document["items"].([]interface{})
			if !ok || len(items) != 1 {
				t.Fatal("bulk response not exact synthetic Secret")
			}
			objects = items
		}
		for _, item := range objects {
			obj, ok := item.(map[string]interface{})
			if !ok {
				t.Fatal("sanitized object malformed")
			}
			m, ok := obj["metadata"].(map[string]interface{})
			if !ok || m["uid"] != string(secret.UID) || obj["data"] != nil || obj["stringData"] != nil || m["annotations"] != nil || !reflect.DeepEqual(obj["keyNames"], []interface{}{"payload"}) {
				t.Fatal("sanitized Secret fields or UID mismatch")
			}
		}
	}
	code, body = call(adminSession, "GET", "/api/resources", listQuery, nil, false)
	if code != 200 {
		t.Fatal("admin bulk read failed")
	}
	checkSanitized(body, true)
	code, body = call(adminSession, "GET", "/api/resources", resourceQuery, nil, false)
	if code != 200 {
		t.Fatal("admin named metadata read failed")
	}
	checkSanitized(body, false)
	for i, alias := range aliases {
		s := New()
		s.ReadOnly = false
		s.Namespace = receipt.Namespace
		s.Token = ""
		t.Cleanup(s.Close)
		c, err := s.client(alias)
		if err != nil || c.Config.BearerToken == "" || len(c.Config.CertData) != 0 || len(c.Config.KeyData) != 0 || c.Config.ExecProvider != nil || c.Config.AuthProvider != nil {
			t.Fatal("real restricted token client not isolated")
		}
		subject, err := c.Typed.AuthenticationV1().SelfSubjectReviews().Create(ctx, &authnv1.SelfSubjectReview{}, metav1.CreateOptions{})
		if err != nil || subject.Status.UserInfo.Username != "system:serviceaccount:"+receipt.Namespace+":"+alias {
			t.Fatal("real restricted upstream identity not proved")
		}
		for _, verb := range []string{"list", "get", "update"} {
			want := (i == 0 && verb == "list") || (i == 1 && verb == "get")
			deadline := time.Now().Add(10 * time.Second)
			for {
				review, err := c.Typed.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authzv1.SelfSubjectAccessReview{Spec: authzv1.SelfSubjectAccessReviewSpec{ResourceAttributes: &authzv1.ResourceAttributes{Namespace: receipt.Namespace, Verb: verb, Resource: "secrets", Name: name}}}, metav1.CreateOptions{})
				if err != nil {
					t.Fatal("real restricted access review failed")
				}
				if review.Status.Allowed == want {
					mark("real_SA_RBAC", map[string]interface{}{"identity": alias, "verb": verb, "allowed": want})
					break
				}
				if time.Now().After(deadline) || ctx.Err() != nil {
					t.Fatal("restricted Role permissions did not converge")
				}
				time.Sleep(100 * time.Millisecond)
			}
		}
		x := newSession(s, alias)
		enable(x)
		code, body = call(x, "GET", "/api/secrets/reveal", query, nil, i == 1)
		want := 403
		if i == 1 {
			want = 200
		}
		if code != want {
			t.Fatal("restricted reveal status mismatch")
		}
		if i == 1 {
			var private corev1.Secret
			if json.Unmarshal(body, &private) != nil || private.UID != secret.UID || !reflect.DeepEqual(private.Data, secret.Data) {
				t.Fatal("get-only real reveal mismatch")
			}
		}
		code, body = call(x, "GET", "/api/resources", listQuery, nil, false)
		want = 403
		if i == 0 {
			want = 200
		}
		if code != want {
			t.Fatal("restricted list status mismatch")
		}
		if i == 0 {
			checkSanitized(body, true)
		}
		restrictedObject := stored.DeepCopy()
		restrictedObject.TypeMeta = metav1.TypeMeta{APIVersion: "v1", Kind: "Secret"}
		envelopeBytes, envelopeErr := json.Marshal(map[string]interface{}{"object": restrictedObject})
		var envelope struct {
			Object struct {
				Kind       string `json:"kind"`
				APIVersion string `json:"apiVersion"`
				Metadata   struct {
					UID             string `json:"uid"`
					ResourceVersion string `json:"resourceVersion"`
				} `json:"metadata"`
			} `json:"object"`
		}
		if envelopeErr != nil || json.Unmarshal(envelopeBytes, &envelope) != nil {
			t.Fatal("restricted envelope serialization failed")
		}
		hasKind, hasVersion := envelope.Object.Kind == "Secret", envelope.Object.APIVersion == "v1"
		uidMatches, rvMatches := envelope.Object.Metadata.UID == string(secret.UID), envelope.Object.Metadata.ResourceVersion == stored.ResourceVersion
		mark("restricted_PUT_envelope", map[string]interface{}{"identity": alias, "hasKind": hasKind, "hasApiVersion": hasVersion, "UIDMatches": uidMatches, "RVMatches": rvMatches})
		if !hasKind || !hasVersion || !uidMatches || !rvMatches {
			t.Fatal("restricted envelope identity guard failed")
		}
		code, _ = call(x, "PUT", "/api/resources", resourceQuery, map[string]interface{}{"object": restrictedObject}, false)
		if code != 403 {
			t.Fatal("restricted update did not fail403")
		}
		unchanged()
	}
	masked := map[string]interface{}{"apiVersion": "v1", "kind": "Secret", "metadata": stored.ObjectMeta, "keyNames": []string{"payload"}}
	code, _ = call(adminSession, "PUT", "/api/resources", resourceQuery, map[string]interface{}{"object": masked}, false)
	if code != 422 {
		t.Fatal("current identity masked write did not fail422")
	}
	unchanged()
	mark("purpose_metadata_redaction_masked_and_restricted_complete", map[string]interface{}{"SecretUID": secret.UID, "dataEqual": true, "unknownMetadataPreserved": true, "nonPurposeNoLeak": true, "restrictedIdentities": 2, "maskedWriteStatus": 422})
	proof["assertionsPassed"] = true
}
