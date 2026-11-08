package server

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// All clients here talk to the real API server. Only this deliberate test context
// and namespace are allowed; impersonation needs no token or kubeconfig writes.
func TestDedicatedClusterRestrictedRBAC(t *testing.T) {
	if os.Getenv("KUBEVIEW_TEST_CONTEXT") != "kubeview-test" || os.Getenv("KUBEVIEW_TEST_NAMESPACE") != "kubeview-qa" {
		t.Skip("requires explicitly isolated kubeview-test / kubeview-qa")
	}
	t.Setenv("KUBE_CONTEXT", "kubeview-test")
	const namespace = "kubeview-qa"
	adminServer := New()
	defer adminServer.Close()
	verifyDedicatedCluster(t, adminServer)
	admin, err := adminServer.client("kubeview-test")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()
	name := "backend-rbac-" + strings.Split(uuid.NewString(), "-")[0]
	// Register cleanup immediately after each create. UID preconditions ensure a
	// later object with the same name cannot be accidentally removed by this test.
	cleanup := func(kind, name string, uid types.UID) {
		t.Helper()
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		options := metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid}}
		var err error
		switch kind {
		case "pod":
			err = admin.Typed.CoreV1().Pods(namespace).Delete(cleanupCtx, name, options)
		case "binding":
			err = admin.Typed.RbacV1().RoleBindings(namespace).Delete(cleanupCtx, name, options)
		case "role":
			err = admin.Typed.RbacV1().Roles(namespace).Delete(cleanupCtx, name, options)
		case "sa":
			err = admin.Typed.CoreV1().ServiceAccounts(namespace).Delete(cleanupCtx, name, options)
		}
		if err != nil && !apierrors.IsNotFound(err) {
			t.Errorf("own %s fixture cleanup failed: %v", kind, err)
		}
	}
	noMount := false
	sa, err := admin.Typed.CoreV1().ServiceAccounts(namespace).Create(ctx, &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}, AutomountServiceAccountToken: &noMount}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer cleanup("sa", sa.Name, sa.UID)
	role, err := admin.Typed.RbacV1().Roles(namespace).Create(ctx, &rbacv1.Role{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}, Rules: []rbacv1.PolicyRule{{APIGroups: []string{""}, Resources: []string{"pods"}, Verbs: []string{"get", "list", "watch"}}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer cleanup("role", role.Name, role.UID)
	binding, err := admin.Typed.RbacV1().RoleBindings(namespace).Create(ctx, &rbacv1.RoleBinding{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}, RoleRef: rbacv1.RoleRef{APIGroup: "rbac.authorization.k8s.io", Kind: "Role", Name: role.Name}, Subjects: []rbacv1.Subject{{Kind: "ServiceAccount", Name: sa.Name, Namespace: namespace}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer cleanup("binding", binding.Name, binding.UID)
	grace := int64(1)
	fixture, err := admin.Typed.CoreV1().Pods(namespace).Create(ctx, &corev1.Pod{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}, Spec: corev1.PodSpec{ServiceAccountName: sa.Name, AutomountServiceAccountToken: &noMount, TerminationGracePeriodSeconds: &grace, RestartPolicy: corev1.RestartPolicyNever, Containers: []corev1.Container{{Name: "app", Image: "busybox:1.36", Command: []string{"sleep", "60"}}}}}, metav1.CreateOptions{})
	if err != nil {
		t.Fatal(err)
	}
	defer cleanup("pod", fixture.Name, fixture.UID)
	config := rest.CopyConfig(admin.Config)
	config.Impersonate = rest.ImpersonationConfig{UserName: "system:serviceaccount:" + namespace + ":" + sa.Name, Groups: []string{"system:serviceaccounts", "system:serviceaccounts:" + namespace, "system:authenticated"}}
	typed, err := kubernetes.NewForConfig(config)
	if err != nil {
		t.Fatal(err)
	}
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		t.Fatal(err)
	}
	// Wait only for the newly created RoleBinding to become observable to real
	// authorization. No allow/deny result is fabricated or intercepted in this test.
	for attempt := 0; attempt < 100; attempt++ {
		review, e := typed.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authv1.SelfSubjectAccessReview{Spec: authv1.SelfSubjectAccessReviewSpec{ResourceAttributes: &authv1.ResourceAttributes{Namespace: namespace, Verb: "get", Resource: "pods", Name: fixture.Name}}}, metav1.CreateOptions{})
		if e != nil {
			t.Fatal(e)
		}
		if review.Status.Allowed {
			break
		}
		if attempt == 99 {
			t.Fatal("read-only Pod RoleBinding never became effective")
		}
		time.Sleep(100 * time.Millisecond)
	}
	// Config is intentionally omitted from the registered Clients container to use
	// the existing test injection seam. Typed/Dynamic/Discovery above are real
	// impersonated client-go network clients, never fake clients or API intercepts.
	restricted := New()
	restricted.ReadOnly = false
	restricted.Namespace = namespace
	restricted.Token = ""
	restricted.clients = map[string]*Clients{"restricted": {Name: "restricted", Typed: typed, Dynamic: dynamicClient, Discovery: typed.Discovery()}}
	defer restricted.Close()
	operator := explicitTestOperator(t, restricted, "restricted", namespace)
	mux := http.NewServeMux()
	restricted.Register(mux)
	httpServer := httptest.NewServer(mux)
	defer httpServer.Close()
	call := func(method, path string, body interface{}) (int, map[string]interface{}) {
		t.Helper()
		var data []byte
		if body != nil {
			data, _ = json.Marshal(body)
		}
		request, err := http.NewRequestWithContext(ctx, method, httpServer.URL+path, bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		request.Header.Set("Content-Type", "application/json")
		operator.apply(request)
		response, err := http.DefaultClient.Do(request)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		var result map[string]interface{}
		if err = json.NewDecoder(response.Body).Decode(&result); err != nil {
			t.Fatal(err)
		}
		return response.StatusCode, result
	}
	path := "/api/resources?context=restricted&resource=pods&namespace=" + namespace + "&name=" + fixture.Name
	code, read := call("GET", path, nil)
	if code != 200 {
		t.Fatalf("real RBAC allowed Pod GET failed: HTTP%d", code)
	}
	metadata := read["metadata"].(map[string]interface{})
	if metadata["uid"] != string(fixture.UID) {
		t.Fatal("read route selected wrong Pod UID")
	}
	code, capabilities := call("GET", "/api/capabilities?context=restricted&resource=pods&namespace="+namespace+"&name="+fixture.Name, nil)
	if code != 200 {
		t.Fatalf("real SSAR capabilities failed: HTTP%d", code)
	}
	verbs := capabilities["verbs"].(map[string]interface{})
	subresources := capabilities["subresources"].(map[string]interface{})
	if verbs["get"] != true || verbs["delete"] != false || subresources["log"] != false {
		t.Fatal("real SSAR capabilities did not preserve read-allowed/delete-and-log-denied policy")
	}
	code, deniedDelete := call("DELETE", path, map[string]interface{}{"uid": metadata["uid"], "resourceVersion": metadata["resourceVersion"]})
	if code != 403 || deniedDelete["code"] != float64(403) {
		t.Fatalf("restricted delete route not denied: HTTP%d", code)
	}
	code, deniedLog := call("GET", "/api/logs?context=restricted&namespace="+namespace+"&pod="+fixture.Name+"&container=app&follow=false", nil)
	if code != 403 || deniedLog["code"] != float64(403) {
		t.Fatalf("restricted logs route not denied: HTTP%d", code)
	}
	// Also prove the upstream API itself rejects these operations under exactly
	// the same identity, beyond the gateway's real SSAR-based rejection.
	uid := fixture.UID
	if err = typed.CoreV1().Pods(namespace).Delete(ctx, fixture.Name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid}}); !apierrors.IsForbidden(err) {
		t.Fatalf("upstream Pod DELETE expected Forbidden, got %v", err)
	}
	if _, err = typed.CoreV1().Pods(namespace).GetLogs(fixture.Name, &corev1.PodLogOptions{Container: "app"}).DoRaw(ctx); !apierrors.IsForbidden(err) {
		t.Fatalf("upstream pods/log expected Forbidden, got %v", err)
	}
	preserved, err := admin.Typed.CoreV1().Pods(namespace).Get(ctx, fixture.Name, metav1.GetOptions{})
	if err != nil || preserved.UID != fixture.UID || preserved.DeletionTimestamp != nil {
		t.Fatal("RBAC-denied delete changed or removed the fixture Pod")
	}
	t.Log("REAL restricted ServiceAccount: Pod GET200; SSAR get=true/delete=false/log=false; gateway DELETE403/logs403; upstream DELETE Forbidden/logs Forbidden; original Pod UID retained")
}
