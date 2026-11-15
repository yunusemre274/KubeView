package server

import (
	"context"
	"encoding/json"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/k8s-tersane/tersane/backend/pkg/traffic"
	authenticationv1 "k8s.io/api/authentication/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

// Uses an actual TokenRequest reader in a private process-local kubeconfig.
// Neither the token nor that config is written into repository/artifacts.
func TestOwnedRepairRealHubbleRestrictedNamespace(t *testing.T) {
	if os.Getenv("KV_HUBBLE_ENABLED") != "true" {
		t.Skip("requires actual configured Hubble TLS provider")
	}
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	ns := s.Namespace
	s.Namespace = ""
	name := "kv-flow-reader-" + strings.Split(uuid.NewString(), "-")[0]
	noMount := false
	sa, err := c.Typed.CoreV1().ServiceAccounts(ns).Create(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: map[string]string{"kubeview.io/repair-owner": "backend-manager"}}, AutomountServiceAccountToken: &noMount}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		_ = c.Typed.CoreV1().ServiceAccounts(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &sa.UID}})
	})
	role, err := c.Typed.RbacV1().Roles(ns).Create(ctx, &rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns}, Rules: []rbacv1.PolicyRule{{APIGroups: []string{""}, Resources: []string{"pods"}, Verbs: []string{"get", "list", "watch"}}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		_ = c.Typed.RbacV1().Roles(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &role.UID}})
	})
	binding, err := c.Typed.RbacV1().RoleBindings(ns).Create(ctx, &rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns}, RoleRef: rbacv1.RoleRef{APIGroup: "rbac.authorization.k8s.io", Kind: "Role", Name: name}, Subjects: []rbacv1.Subject{{Kind: "ServiceAccount", Namespace: ns, Name: name}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 15*time.Second)
		defer done()
		_ = c.Typed.RbacV1().RoleBindings(ns).Delete(cleanup, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &binding.UID}})
	})
	token, err := c.Typed.CoreV1().ServiceAccounts(ns).CreateToken(ctx, name, &authenticationv1.TokenRequest{Spec: authenticationv1.TokenRequestSpec{Audiences: []string{"https://kubernetes.default.svc.cluster.local"}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal("owned TokenRequest failed")
	}
	rawConfig, err := clientcmd.LoadFromFile(os.Getenv("KUBECONFIG"))
	if err != nil {
		t.Fatal("owned config unavailable")
	}
	operator := rawConfig.Contexts[contextName]
	if operator == nil {
		t.Fatal("pinned operator context absent")
	}
	rawConfig.AuthInfos[name] = &clientcmdapi.AuthInfo{Token: token.Status.Token}
	rawConfig.Contexts[name] = &clientcmdapi.Context{Cluster: operator.Cluster, AuthInfo: name, Namespace: ns}
	privateConfig := filepath.Join(t.TempDir(), "reader-kubeconfig")
	if err = clientcmd.WriteToFile(*rawConfig, privateConfig); err != nil {
		t.Fatal("private reader config write failed")
	}
	if err = os.Chmod(privateConfig, 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("KUBECONFIG", privateConfig)
	lease := uuid.NewString()
	path := gateway + "/api/flows?context=" + url.QueryEscape(name) + "&namespace=" + url.QueryEscape(ns) + "&subscription=" + url.QueryEscape(lease)
	leaseOpened := false
	t.Cleanup(func() {
		if !leaseOpened {
			return
		}
		cleanup, done := context.WithTimeout(context.Background(), 5*time.Second)
		defer done()
		requestCode, _ := repairHTTP(t, cleanup, "DELETE", path, nil)
		if requestCode != 200 {
			t.Error("reader flow lease failed to release")
		}
	})
	var snapshot traffic.Snapshot
	var code int
	createdReader := time.Now()
	for deadline := time.Now().Add(15 * time.Second); time.Now().Before(deadline); {
		var body []byte
		code, body = repairHTTP(t, ctx, "GET", path, nil)
		if code == 403 && time.Since(createdReader) < 3*time.Second {
			time.Sleep(100 * time.Millisecond)
			continue
		}
		if code != 200 {
			var failure struct {
				Error string `json:"error"`
			}
			_ = json.Unmarshal(body, &failure)
			t.Fatalf("authorized namespace Hubble HTTP%d: %s", code, failure.Error)
		}
		leaseOpened = true
		if json.Unmarshal(body, &snapshot) != nil {
			t.Fatal("Hubble snapshot malformed")
		}
		if snapshot.Status == "live" {
			break
		}
		time.Sleep(300 * time.Millisecond)
	}
	if snapshot.Status != "live" {
		t.Fatalf("actual Hubble TLS stream/health did not become live, status=%s", snapshot.Status)
	}
	for _, flow := range snapshot.Flows {
		if flow.Source.Namespace != ns || flow.Destination.Namespace != ns || flow.Source.NodeName != nil || flow.Destination.NodeName != nil || flow.Source.NodeUID != nil || flow.Destination.NodeUID != nil {
			t.Fatal("reader received unauthorized namespace/Node metadata")
		}
	}
	for _, outside := range []string{"kv-repair-qa", ""} {
		address := gateway + "/api/flows?context=" + url.QueryEscape(name) + "&namespace=" + url.QueryEscape(outside) + "&subscription=" + url.QueryEscape(lease)
		if status, _ := repairHTTP(t, ctx, "GET", address, nil); status != 403 {
			t.Fatalf("reader namespace=%q expected403, HTTP%d", outside, status)
		}
	}
	if status, _ := repairHTTP(t, ctx, "GET", gateway+"/api/resources?context="+url.QueryEscape(name)+"&resource=namespaces", nil); status != 403 {
		t.Fatalf("namespace LIST expected403, HTTP%d", status)
	}
	if status, _ := repairHTTP(t, ctx, "GET", gateway+"/api/resources?context="+url.QueryEscape(name)+"&resource=nodes", nil); status != 403 {
		t.Fatalf("Node LIST expected403, HTTP%d", status)
	}
	t.Logf("REAL Hubble TLS reader flow API contextAlias=%s allowedNamespace=%s status=%s flows=%d; local Pod LIST allowed while namespace/Node LIST and other/all-namespace flow reads403; scoped TokenRequest credentials stayed private; zero-flow endpoint Node-field coverage is unit-tested separately", name, ns, snapshot.Status, len(snapshot.Flows))
}
