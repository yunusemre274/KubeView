package server

// Explicit opt-in integration test; ordinary test runs skip owned lab mutations.
// No fake clients/reactors, Config=nil, explicitTestOperator or auth-response substitution.
import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	authnv1 "k8s.io/api/authentication/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/metadata"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

func TestReleaseOwnedWatchRoleBindingRevocationReal(t *testing.T) {
	if os.Getenv("KUBEVIEW_RELEASE_REAL_WATCH_AUTHZ") != "owned-watch-revoke-v1" {
		t.Skip("requires explicit sealed owned real watch-revocation opt-in")
	}
	started := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 105*time.Second)
	defer cancel()
	out := os.Getenv("KUBEVIEW_RELEASE_REAL_OUTPUT")
	statePath, configPath, receiptPath := os.Getenv("KUBEVIEW_RELEASE_REAL_STATE"), os.Getenv("KUBEVIEW_RELEASE_REAL_KUBECONFIG"), os.Getenv("KUBEVIEW_RELEASE_REAL_SECRET_RECEIPT")
	if !filepath.IsAbs(out) || !filepath.IsAbs(statePath) || !filepath.IsAbs(configPath) || !filepath.IsAbs(receiptPath) {
		t.Fatal("explicit absolute paths required")
	}
	for _, path := range []string{out, filepath.Dir(configPath), filepath.Dir(statePath)} {
		info, err := os.Lstat(path)
		if err != nil || !info.IsDir() || info.Mode()&os.ModeSymlink != 0 || info.Mode().Perm()&0077 != 0 {
			t.Fatal("private directory guard failed")
		}
	}
	for _, path := range []string{statePath, configPath, receiptPath} {
		info, err := os.Lstat(path)
		if err != nil || !info.Mode().IsRegular() || info.Mode()&os.ModeSymlink != 0 || info.Mode().Perm()&0077 != 0 || info.Size() > 2<<20 {
			t.Fatal("private input guard failed")
		}
	}
	for _, name := range []string{"result.json", "owned-fixtures.json"} {
		if _, err := os.Lstat(filepath.Join(out, name)); !os.IsNotExist(err) {
			t.Fatal("existing evidence refuses overwrite")
		}
	}
	proof := map[string]interface{}{"mode": "PRODUCTION_WS_REAL_ROLEBINDING_REVOCATION_NOT_BROWSER_UI", "startedAt": started.UTC(), "events": []interface{}{}, "valuesRecorded": false}
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
	podGVR := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	initial, e := meta.Resource(podGVR).Namespace(receipt.Namespace).List(ctx, metav1.ListOptions{})
	if e != nil || len(initial.Items) != 0 {
		t.Fatal("sealed namespace Pod metadata inventory is not empty")
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
			lease, err := admin.Typed.CoordinationV1().Leases("kube-node-lease").Get(c, n.Name, metav1.GetOptions{})
			if err != nil || lease.Spec.RenewTime == nil {
				t.Fatal("original Node fresh lease unavailable")
			}
			age := time.Since(lease.Spec.RenewTime.Time)
			if age < -5*time.Second || age > 30*time.Second {
				t.Fatal("cached Node Ready without a fresh lease is not a healthy lab")
			}
			result[n.Name] = map[string]interface{}{"UID": n.UID, "metadataHash": hash([]interface{}{n.Labels, n.Annotations, n.CreationTimestamp, n.OwnerReferences, n.Finalizers, n.Spec})}
		}
		return result
	}
	nodesBefore := readNodes(ctx)

	// All HTTP/token values remain in memory or a0700 temporary directory.
	// Never include responses, config, cookies, nonces or raw errors in evidence.
	var random [32]byte
	if _, e = rand.Read(random[:]); e != nil {
		t.Fatal("private test randomness unavailable")
	}
	runID := hex.EncodeToString(random[:8])
	const runLabel = "kubeview.io/watch-authz-run"
	labels := func() map[string]string {
		return map[string]string{receipt.NamespaceOwnerLabel: receipt.LabID, runLabel: runID}
	}
	roleName, podName := "kv-watch-"+runID, "kv-watch-"+runID
	inactiveScheduler := "kv-audit-no-scheduler-" + runID
	aliases := []string{"kv-watch-a-" + runID, "kv-watch-b-" + runID}
	type owned struct {
		GVR  schema.GroupVersionResource
		Name string
		UID  types.UID
	}
	ownedObjects := []owned{}
	capture := func(gvr schema.GroupVersionResource, object metav1.Object) {
		ownedObjects = append(ownedObjects, owned{gvr, object.GetName(), object.GetUID()})
		write("owned-fixtures.json", ownedObjects)
	}
	var gateway *Server
	var listener net.Listener
	var server *http.Server
	sockets := []*websocket.Conn{}
	private := t.TempDir()
	if os.Chmod(private, 0700) != nil {
		t.Fatal("private temporary mode failed")
	}
	// Registered before the first fixture create; every successful create is captured immediately.
	t.Cleanup(func() {
		clean, stop := context.WithTimeout(context.Background(), 45*time.Second)
		defer stop()
		for _, socket := range sockets {
			_ = socket.Close()
		}
		if gateway != nil {
			gateway.Close()
		}
		if server != nil {
			_ = server.Close()
		}
		if listener != nil {
			_ = listener.Close()
		}
		if gateway != nil {
			for {
				gateway.watches.mu.Lock()
				empty := len(gateway.watches.entries) == 0
				gateway.watches.mu.Unlock()
				if empty {
					proof["brokerEmpty"] = true
					break
				}
				if clean.Err() != nil {
					t.Error("broker references not released")
					break
				}
				time.Sleep(50 * time.Millisecond)
			}
		}
		removed := []map[string]interface{}{}
		for i := len(ownedObjects) - 1; i >= 0; i-- {
			x := ownedObjects[i]
			if guard(clean) != nil {
				t.Error("cleanup live identity guard refused")
				break
			}
			resource := meta.Resource(x.GVR).Namespace(receipt.Namespace)
			object, err := resource.Get(clean, x.Name, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				removed = append(removed, map[string]interface{}{"UID": x.UID, "absent": true})
				continue
			}
			if err != nil || object.UID != x.UID || object.Labels[runLabel] != runID || object.Labels[receipt.NamespaceOwnerLabel] != receipt.LabID {
				t.Error("cleanup exact owner UID refused")
				continue
			}
			rv := object.ResourceVersion
			zero := int64(0)
			if guard(clean) != nil {
				t.Error("cleanup predelete guard refused")
				break
			}
			err = resource.Delete(clean, x.Name, metav1.DeleteOptions{GracePeriodSeconds: &zero, Preconditions: &metav1.Preconditions{UID: &x.UID, ResourceVersion: &rv}})
			if err != nil && !apierrors.IsNotFound(err) {
				t.Error("cleanup exact delete failed")
				continue
			}
			for {
				_, err = resource.Get(clean, x.Name, metav1.GetOptions{})
				if apierrors.IsNotFound(err) {
					removed = append(removed, map[string]interface{}{"UID": x.UID, "absent": true})
					break
				}
				if err != nil || clean.Err() != nil {
					t.Error("cleanup GET404 not observed")
					break
				}
				time.Sleep(100 * time.Millisecond)
			}
		}
		proof["cleanup"] = removed
		proof["allSixFixturesAbsent"] = len(ownedObjects) == 6 && len(removed) == 6
		if len(removed) != len(ownedObjects) {
			t.Error("owned fixture cleanup incomplete")
		}
		if guard(clean) != nil || filehash(profilePath) != profileBefore || filehash(statePath) != stateBefore || !reflect.DeepEqual(readNodes(clean), nodesBefore) {
			t.Error("original lab profile namespace or Nodes changed")
		}
		if listener != nil {
			probe, err := net.DialTimeout("tcp", "127.0.0.1:19846", 200*time.Millisecond)
			if err == nil {
				_ = probe.Close()
				t.Error("owned listener remains open")
			}
			proof["listenerClosed"] = err != nil
		}
		proof["namespaceNotDeleted"] = true
	})
	listener, e = net.Listen("tcp", "127.0.0.1:19846")
	if e != nil {
		t.Fatal("owned port19846 unavailable; no fallback")
	}
	no := false
	saGVR := schema.GroupVersionResource{Version: "v1", Resource: "serviceaccounts"}
	roleGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
	bindingGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	for _, alias := range aliases {
		needGuard(ctx)
		object, err := admin.Typed.CoreV1().ServiceAccounts(receipt.Namespace).Create(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: alias, Namespace: receipt.Namespace, Labels: labels()}, AutomountServiceAccountToken: &no}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("restricted SA create failed")
		}
		capture(saGVR, object)
	}
	needGuard(ctx)
	role, e := admin.Typed.RbacV1().Roles(receipt.Namespace).Create(ctx, &rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: roleName, Namespace: receipt.Namespace, Labels: labels()}, Rules: []rbacv1.PolicyRule{{APIGroups: []string{""}, Resources: []string{"pods"}, Verbs: []string{"get", "list", "watch"}}}}, metav1.CreateOptions{})
	if e != nil {
		t.Fatal("read Pod role create failed")
	}
	capture(roleGVR, role)
	bindings := []*rbacv1.RoleBinding{}
	for _, alias := range aliases {
		needGuard(ctx)
		binding, err := admin.Typed.RbacV1().RoleBindings(receipt.Namespace).Create(ctx, &rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: alias, Namespace: receipt.Namespace, Labels: labels()}, RoleRef: rbacv1.RoleRef{APIGroup: "rbac.authorization.k8s.io", Kind: "Role", Name: roleName}, Subjects: []rbacv1.Subject{{Kind: "ServiceAccount", Namespace: receipt.Namespace, Name: alias}}}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned RoleBinding create failed")
		}
		capture(bindingGVR, binding)
		bindings = append(bindings, binding)
	}
	needGuard(ctx)
	grace := int64(0)
	yes, unprivilegedUID := true, int64(65534)
	podObject, e := admin.Typed.CoreV1().Pods(receipt.Namespace).Create(ctx, &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{Name: podName, Namespace: receipt.Namespace, Labels: labels()},
		Spec: corev1.PodSpec{
			SchedulerName: inactiveScheduler, ServiceAccountName: aliases[0], AutomountServiceAccountToken: &no,
			TerminationGracePeriodSeconds: &grace, RestartPolicy: corev1.RestartPolicyNever,
			SecurityContext: &corev1.PodSecurityContext{RunAsNonRoot: &yes, RunAsUser: &unprivilegedUID, SeccompProfile: &corev1.SeccompProfile{Type: corev1.SeccompProfileTypeRuntimeDefault}},
			Containers: []corev1.Container{{Name: "inert", Image: "synthetic.invalid/never-pulled:watch-authz",
				SecurityContext: &corev1.SecurityContext{AllowPrivilegeEscalation: &no, Capabilities: &corev1.Capabilities{Drop: []corev1.Capability{"ALL"}}}}},
		},
	}, metav1.CreateOptions{})
	if e != nil {
		t.Fatal("inert Pod admission failed; no workload fallback")
	}
	capture(podGVR, podObject)
	if podObject.Spec.NodeName != "" || podObject.Spec.SchedulerName != inactiveScheduler {
		t.Fatal("inert Pod scheduler guard changed")
	}
	restrictedConfig := clientcmdapi.NewConfig()
	restrictedConfig.Clusters[cc.Cluster] = cl.DeepCopy()
	for _, alias := range aliases {
		needGuard(ctx)
		expiration := int64(600)
		token, err := admin.Typed.CoreV1().ServiceAccounts(receipt.Namespace).CreateToken(ctx, alias, &authnv1.TokenRequest{Spec: authnv1.TokenRequestSpec{ExpirationSeconds: &expiration}}, metav1.CreateOptions{})
		if err != nil || token.Status.Token == "" || time.Until(token.Status.ExpirationTimestamp.Time) < 180*time.Second {
			t.Fatal("bounded restricted TokenRequest failed")
		}
		restrictedConfig.AuthInfos[alias] = &clientcmdapi.AuthInfo{Token: token.Status.Token}
		restrictedConfig.Contexts[alias] = &clientcmdapi.Context{Cluster: cc.Cluster, AuthInfo: alias, Namespace: receipt.Namespace}
	}
	restrictedPath := filepath.Join(private, "restricted-kubeconfig")
	if clientcmd.WriteToFile(*restrictedConfig, restrictedPath) != nil || os.Chmod(restrictedPath, 0600) != nil {
		t.Fatal("private restricted config write failed")
	}
	configBefore := filehash(restrictedPath)
	t.Setenv("KUBECONFIG", restrictedPath)
	t.Setenv("KUBEVIEW_REPLAY_PROFILE", "")
	gateway = New()
	gateway.ReadOnly = true
	gateway.Namespace = receipt.Namespace
	gateway.Token = hex.EncodeToString(random[:])
	if gateway.ConfigureWorkspace(filepath.Join(private, "app-data"), "", "") != nil {
		t.Fatal("fresh workspace configure failed")
	}
	mux := http.NewServeMux()
	gateway.Register(mux)
	server = &http.Server{Handler: mux, ReadHeaderTimeout: 5 * time.Second}
	go func() { _ = server.Serve(listener) }()
	base, _ := url.Parse("http://127.0.0.1:19846")
	jar, _ := cookiejar.New(nil)
	httpClient := &http.Client{Jar: jar, Timeout: 5 * time.Second, Transport: &http.Transport{Proxy: nil}}
	defer httpClient.CloseIdleConnections()
	doc := ws.Document{}
	workspaceNonce := ""
	request := func(method, path string, query url.Values, body interface{}, nonce string) (int, []byte) {
		t.Helper()
		if query == nil {
			query = url.Values{}
		}
		short, stop := context.WithTimeout(ctx, 5*time.Second)
		defer stop()
		response := workspaceAcceptanceRequest(short, httpClient, base, method, path, query, body, nonce, workspaceNonce)
		if response.err != nil || len(response.body) > 2<<20 {
			t.Fatal("bounded gateway request failed")
		}
		return response.status, response.body
	}
	accept := func(data []byte) {
		t.Helper()
		var extra struct {
			WorkspaceNonce string `json:"workspaceNonce"`
		}
		if json.Unmarshal(data, &doc) != nil || json.Unmarshal(data, &extra) != nil || extra.WorkspaceNonce == "" {
			t.Fatal("workspace DTO invalid")
		}
		workspaceNonce = extra.WorkspaceNonce
	}
	code, data := request("POST", "/api/session", nil, map[string]string{"token": gateway.Token}, "")
	if code != 200 {
		t.Fatal("normal access session login failed")
	}
	code, data = request("GET", "/api/workspace", nil, nil, "")
	if code != 200 {
		t.Fatal("workspace bootstrap failed")
	}
	accept(data)
	scopes := []url.Values{}
	clients := []*Clients{}
	clientIDs := []string{}
	nonces := []string{}
	for index, alias := range aliases {
		code, data = request("POST", "/api/workspace/connections", nil, map[string]interface{}{"revision": doc.Revision, "connection": map[string]interface{}{"name": "restricted", "context": alias}}, "")
		if code != 200 {
			t.Fatal("normal workspace connection create failed")
		}
		accept(data)
		connectionID := doc.Connections[len(doc.Connections)-1].ID
		code, data = request("POST", "/api/workspace/harbors", nil, map[string]interface{}{"revision": doc.Revision, "harbor": map[string]interface{}{"name": "owned watch", "connectionRef": connectionID, "namespaces": []string{receipt.Namespace}, "selector": runLabel + "=" + runID, "view": map[string]interface{}{}}}, "")
		if code != 200 {
			t.Fatal("normal harbor create failed")
		}
		accept(data)
		harborID := doc.Harbors[len(doc.Harbors)-1].ID
		query := url.Values{"workspaceId": {doc.ID}, "harborId": {harborID}, "tabId": {"watch-tab-" + fmt.Sprint(index)}, "namespace": {receipt.Namespace}}
		code, data = request("GET", "/api/connection", query, nil, "")
		var diagnostic struct {
			ConnectionID      string `json:"connectionID"`
			ServerReadOnly    bool   `json:"serverReadOnly"`
			ManagementEnabled bool   `json:"managementEnabled"`
		}
		if code != 200 || json.Unmarshal(data, &diagnostic) != nil || diagnostic.ConnectionID == "" || !diagnostic.ServerReadOnly || diagnostic.ManagementEnabled {
			t.Fatal("ordinary readonly connection diagnostic failed")
		}
		client, err := gateway.client(alias)
		if err != nil || client.Config == nil || client.ID == "" {
			t.Fatal("real credential-backed client required")
		}
		identity, err := client.Typed.AuthenticationV1().SelfSubjectReviews().Create(ctx, &authnv1.SelfSubjectReview{}, metav1.CreateOptions{})
		if err != nil || identity.Status.UserInfo.Username != "system:serviceaccount:"+receipt.Namespace+":"+alias {
			t.Fatal("actual restricted identity mismatch")
		}
		scopes = append(scopes, query)
		clients = append(clients, client)
		clientIDs = append(clientIDs, client.ID)
		nonces = append(nonces, diagnostic.ConnectionID)
	}
	if clientIDs[0] == clientIDs[1] {
		t.Fatal("different credentials shared client identity")
	}
	reviews := 0
	review := func(client *Clients, want bool) bool {
		t.Helper()
		for _, verb := range []string{"get", "list", "watch"} {
			reviews++
			if reviews > 120 {
				t.Fatal("authorization poll budget exceeded")
			}
			short, stop := context.WithTimeout(ctx, 5*time.Second)
			answer, err := client.Typed.AuthorizationV1().SelfSubjectAccessReviews().Create(short, accessReview(verb, "", "pods", "", receipt.Namespace, ""), metav1.CreateOptions{})
			stop()
			if err != nil {
				t.Fatal("real SSAR request failed; no fabricated decision")
			}
			if answer.Status.Allowed != want {
				return false
			}
		}
		return true
	}
	waitReview := func(client *Clients, want bool) {
		t.Helper()
		deadline := time.NewTimer(10 * time.Second)
		defer deadline.Stop()
		for {
			if review(client, want) {
				return
			}
			select {
			case <-ctx.Done():
				t.Fatal("main authorization deadline")
			case <-deadline.C:
				t.Fatal("RBAC propagation deadline")
			case <-time.After(500 * time.Millisecond):
			}
		}
	}
	waitReview(clients[0], true)
	waitReview(clients[1], true)
	queryResource := func(index int) url.Values {
		q := url.Values{}
		for k, v := range scopes[index] {
			q[k] = append([]string(nil), v...)
		}
		q.Set("resource", "pods")
		q.Set("version", "v1")
		q.Set("name", podName)
		return q
	}
	fresh := func(index, want int) {
		t.Helper()
		code, body := request("GET", "/api/resources", queryResource(index), nil, nonces[index])
		if code != want {
			t.Fatal("fresh gateway read status mismatch")
		}
		if want == 200 {
			var object unstructured.Unstructured
			if json.Unmarshal(body, &object) != nil || object.GetUID() != podObject.UID {
				t.Fatal("fresh gateway read wrong UID")
			}
		}
	}
	fresh(0, 200)
	fresh(1, 200)
	type frame struct {
		Message envelope
		End     string
	}
	channels := []<-chan frame{}
	for index := range aliases {
		target := *base
		target.Scheme = "ws"
		target.Path = "/ws"
		q := url.Values{}
		for k, v := range scopes[index] {
			q[k] = v
		}
		q.Set("connectionID", nonces[index])
		target.RawQuery = q.Encode()
		headers := http.Header{"Origin": {base.String()}}
		for _, cookie := range jar.Cookies(base) {
			headers.Add("Cookie", cookie.String())
		}
		socket, reply, err := (&websocket.Dialer{Proxy: nil, HandshakeTimeout: 5 * time.Second}).DialContext(ctx, target.String(), headers)
		if err != nil {
			if reply != nil && reply.Body != nil {
				_ = reply.Body.Close()
			}
			t.Fatal("real production WebSocket upgrade failed")
		}
		sockets = append(sockets, socket)
		if deadline, ok := ctx.Deadline(); ok {
			_ = socket.SetReadDeadline(deadline)
		}
		events := make(chan frame, 128)
		channels = append(channels, events)
		go func(conn *websocket.Conn, ch chan frame) {
			defer close(ch)
			for {
				var msg envelope
				err := conn.ReadJSON(&msg)
				f := frame{Message: msg}
				if err != nil {
					var timeout net.Error
					var closed *websocket.CloseError
					switch {
					case errors.As(err, &timeout) && timeout.Timeout():
						f.End = "timeout"
					case errors.As(err, &closed):
						f.End = "close"
					case errors.Is(err, io.EOF):
						f.End = "eof"
					default:
						f.End = "read_error"
					}
				}
				select {
				case ch <- f:
				case <-ctx.Done():
					return
				}
				if err != nil {
					return
				}
			}
		}(socket, events)
	}
	matches := func(msg envelope, rv, marker string) bool {
		match := func(object *unstructured.Unstructured) bool {
			return object != nil && object.GetUID() == podObject.UID && (rv == "" || object.GetResourceVersion() == rv) && (marker == "" || object.GetAnnotations()["kubeview.io/watch-marker"] == marker)
		}
		if match(msg.Object) {
			return true
		}
		for _, object := range msg.Resources {
			if match(object) {
				return true
			}
		}
		return false
	}
	waitMessage := func(index int, match func(envelope) bool) {
		t.Helper()
		timer := time.NewTimer(15 * time.Second)
		defer timer.Stop()
		for {
			select {
			case f, ok := <-channels[index]:
				if !ok || f.End != "" {
					t.Fatal("watch ended before positive control")
				}
				if match(f.Message) {
					return
				}
			case <-timer.C:
				t.Fatal("positive watch control deadline")
			case <-ctx.Done():
				t.Fatal("main watch deadline")
			}
		}
	}
	for index := range aliases {
		waitMessage(index, func(msg envelope) bool { return msg.Type == "SNAPSHOT" && matches(msg, "", "") })
	}
	updates := 0
	update := func(marker string) string {
		t.Helper()
		updates++
		if updates > 10 {
			t.Fatal("controlled update budget exceeded")
		}
		needGuard(ctx)
		current, err := admin.Typed.CoreV1().Pods(receipt.Namespace).Get(ctx, podName, metav1.GetOptions{})
		if err != nil || current.UID != podObject.UID || current.Labels[runLabel] != runID || current.Spec.NodeName != "" || current.Spec.SchedulerName != inactiveScheduler {
			t.Fatal("update exact owned inert Pod guard failed")
		}
		if current.Annotations == nil {
			current.Annotations = map[string]string{}
		}
		current.Annotations["kubeview.io/watch-marker"] = marker
		needGuard(ctx)
		written, err := admin.Typed.CoreV1().Pods(receipt.Namespace).Update(ctx, current, metav1.UpdateOptions{})
		if err != nil || written.UID != podObject.UID {
			t.Fatal("controlled Pod update failed")
		}
		return written.ResourceVersion
	}
	rv := update("positive-" + runID)
	for index := range aliases {
		waitMessage(index, func(msg envelope) bool { return msg.Action == "UPDATE" && matches(msg, rv, "positive-"+runID) })
	}
	mark("two_real_identities_snapshot_and_update", map[string]interface{}{"samePodUID": true, "differentCredentialIDs": true, "readOnly": true})
	needGuard(ctx)
	binding, e := admin.Typed.RbacV1().RoleBindings(receipt.Namespace).Get(ctx, bindings[0].Name, metav1.GetOptions{})
	if e != nil || binding.UID != bindings[0].UID || binding.Labels[runLabel] != runID {
		t.Fatal("exact RoleBinding revoke guard failed")
	}
	uid, resourceVersion := binding.UID, binding.ResourceVersion
	needGuard(ctx)
	e = admin.Typed.RbacV1().RoleBindings(receipt.Namespace).Delete(ctx, binding.Name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid, ResourceVersion: &resourceVersion}})
	if e != nil {
		t.Fatal("exact RoleBinding revoke failed")
	}
	waitReview(clients[0], false)
	if !review(clients[1], true) {
		t.Fatal("authorized sibling lost permission")
	}
	if _, e = clients[0].Typed.CoreV1().Pods(receipt.Namespace).Get(ctx, podName, metav1.GetOptions{}); !apierrors.IsForbidden(e) {
		t.Fatal("real API GET must be Forbidden after revoke")
	}
	fresh(0, 403)
	fresh(1, 200)
	for index, alias := range aliases {
		current, err := gateway.client(alias)
		if err != nil || current.ID != clientIDs[index] {
			t.Fatal("credential generation changed during RBAC revoke")
		}
	}
	if filehash(restrictedPath) != configBefore {
		t.Fatal("restricted credential config changed")
	}
	mark("real_rbac_denied_same_credential", map[string]interface{}{"SSARAllowed": false, "reviewHTTP403Assumed": false, "actualAPIGet403": true, "gatewayGet403": true, "sameClientID": true, "siblingGet200": true})
	failedScope, canaryInjected, closed := false, false, false
	canaryRV := ""
	canary := "after-known-failure-" + runID
	deadline := time.NewTimer(30 * time.Second)
	defer deadline.Stop()
	for !closed {
		select {
		case f, ok := <-channels[0]:
			if !ok {
				t.Fatal("missing true WebSocket terminal evidence")
			}
			if f.End != "" {
				if f.End != "close" && f.End != "eof" {
					t.Fatal("timeout/read error is not WebSocket closure")
				}
				if !failedScope || !canaryInjected {
					t.Fatal("close requires explicit failed scope and canary control")
				}
				closed = true
				break
			}
			msg := f.Message
			if canaryInjected && matches(msg, canaryRV, canary) {
				t.Fatal("post-known-failure Pod payload escaped revoked watch")
			}
			if msg.Type == "STATUS" {
				for _, scope := range msg.Scopes {
					if scope.Group == "" && scope.Version == "v1" && scope.Resource == "pods" && scope.Namespace == receipt.Namespace && scope.Status == "forbidden" && !scope.Authoritative && !msg.Synced {
						failedScope = true
						if !canaryInjected {
							canaryRV = update(canary)
							canaryInjected = true
							fresh(1, 200)
							waitMessage(1, func(peer envelope) bool { return peer.Action == "UPDATE" && matches(peer, canaryRV, canary) })
						}
					}
				}
			}
		case <-deadline.C:
			t.Fatal("authorization-revoked WebSocket close timeout is FAIL")
		case <-ctx.Done():
			t.Fatal("main105-second budget expired")
		}
	}
	if !review(clients[0], false) || !review(clients[1], true) {
		t.Fatal("final real RBAC control mismatch")
	}
	fresh(0, 403)
	fresh(1, 200)
	for index, alias := range aliases {
		current, err := gateway.client(alias)
		if err != nil || current.ID != clientIDs[index] {
			t.Fatal("final credential ID changed")
		}
	}
	mark("explicit_failed_scope_true_close_and_sibling_positive", map[string]interface{}{"nonAuthoritative": true, "synced": false, "trueClose": closed, "timeoutAccepted": false, "postFailureCanaryNotPublished": true, "siblingUpdateObserved": true})
	proof["mainPassed"] = true
	proof["SSARCalls"] = reviews
	proof["controlledUpdates"] = updates
	proof["upstreamLifetimePath"] = "not independently instrumented; real upstream may close first; no heartbeat-only causality claim"
	proof["privateValuesRecorded"] = false
}
