package server

import (
	"bytes"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strconv"
	"testing"
	"time"

	"github.com/google/uuid"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

func (f *workspaceRealRun) podUIDSet(item *workspaceRealOwned) []string {
	f.t.Helper()
	pods, err := f.admin.CoreV1().Pods(item.Namespace).List(f.ctx, metav1.ListOptions{LabelSelector: workspaceRealAuditLabel + "=" + f.runID + ",manual.kubeview.local/ws-object=" + item.Name})
	if err != nil {
		f.t.Fatal("owned Pod UID set unavailable")
	}
	ids := []string{}
	for _, pod := range pods.Items {
		if pod.DeletionTimestamp != nil {
			continue
		}
		ready := false
		for _, condition := range pod.Status.Conditions {
			if condition.Type == corev1.PodReady && condition.Status == corev1.ConditionTrue {
				ready = true
			}
		}
		if !ready {
			continue
		}
		for _, owner := range pod.OwnerReferences {
			if owner.Kind != "ReplicaSet" {
				continue
			}
			rs, err := f.admin.AppsV1().ReplicaSets(item.Namespace).Get(f.ctx, owner.Name, metav1.GetOptions{})
			if err != nil || rs.UID != owner.UID {
				f.t.Fatal("owned Pod ReplicaSet UID mismatch")
			}
			for _, parent := range rs.OwnerReferences {
				if parent.UID == item.UID {
					ids = append(ids, string(pod.UID))
				}
			}
		}
	}
	sort.Strings(ids)
	return ids
}
func (f *workspaceRealRun) action(item *workspaceRealOwned, action string, replicas int64, uid, rv string) int {
	f.t.Helper()
	f.guard(f.ctx, item.Namespace)
	status, _ := f.gateway(http.MethodPost, "/api/actions", f.scope(item.Namespace), Action{Context: f.lab.Clusters["a"].Name, Group: "apps", Version: "v1", Resource: "deployments", Namespace: item.Namespace, Name: item.Name, UID: uid, ResourceVersion: rv, Action: action, Replicas: replicas}, f.nonces[item.Namespace])
	return status
}

func TestOwnedWorkspaceRealAPIIsolation(t *testing.T) {
	f := newWorkspaceRealRun(t, "isolation")
	a, b := f.namespaces[0], f.namespaces[1]
	name := f.runID + "-same"
	var itemA, itemB *workspaceRealOwned
	var bSpec []byte
	var bGeneration int64
	var bPods, priorAPods []string
	oldRV := ""
	assertB := func() {
		current := f.capture(itemB)
		spec, _ := json.Marshal(current.Spec)
		if !bytes.Equal(spec, bSpec) || current.Generation != bGeneration || !reflect.DeepEqual(f.podUIDSet(itemB), bPods) {
			f.t.Fatal("A operation changed same-name B Deployment or Pod UID set")
		}
	}
	if !f.step("same_name_distinct_uid_ready", func() {
		f.diagnostic(a)
		f.enable(a)
		f.diagnostic(b)
		f.enable(b)
		itemA = f.createHarborFixture(f.harbors[a], a, name, "")
		itemB = f.createHarborFixture(f.harbors[b], b, name, "")
		if itemA.UID == itemB.UID {
			f.t.Fatal("same-name namespaces merged UID")
		}
		initialA := f.rollout(itemA, 1)
		initialB := f.rollout(itemB, 1)
		oldRV = initialA.ResourceVersion
		bSpec, _ = json.Marshal(initialB.Spec)
		bGeneration = initialB.Generation
		bPods = f.podUIDSet(itemB)
		if len(bPods) != 1 {
			f.t.Fatal("B baseline Ready Pod UID missing")
		}
	}) {
		return
	}
	if !f.step("scale_A_preserves_B", func() {
		current := f.capture(itemA)
		f.code(f.action(itemA, "scale", 2, string(itemA.UID), current.ResourceVersion), 202, "real scale A")
		f.rollout(itemA, 2)
		priorAPods = f.podUIDSet(itemA)
		if len(priorAPods) != 2 {
			f.t.Fatal("A actual Ready Pod count after scale is not2")
		}
		assertB()
	}) {
		return
	}
	if !f.step("restart_A_preserves_B", func() {
		current := f.capture(itemA)
		f.code(f.action(itemA, "restart", 0, string(itemA.UID), current.ResourceVersion), 202, "real restart A")
		f.rollout(itemA, 2)
		after := f.podUIDSet(itemA)
		if len(after) != 2 {
			f.t.Fatal("A restart did not converge to2 Ready Pods")
		}
		for _, old := range priorAPods {
			for _, current := range after {
				if old == current {
					f.t.Fatal("restart did not replace owned A Pod UIDs")
				}
			}
		}
		assertB()
	}) {
		return
	}
	if !f.step("stale_uid_and_opaque_rv_rejected", func() {
		current := f.capture(itemA)
		f.code(f.action(itemA, "scale", 3, uuid.NewString(), current.ResourceVersion), 409, "stale UID")
		if current.ResourceVersion == oldRV {
			f.t.Fatal("real stale RV fixture did not advance")
		}
		f.code(f.action(itemA, "scale", 3, string(itemA.UID), oldRV), 409, "stale real opaque RV")
		after := f.capture(itemA)
		if after.Generation != current.Generation || after.Spec.Replicas == nil || *after.Spec.Replicas != 2 {
			f.t.Fatal("stale operation mutated A")
		}
		assertB()
	}) {
		return
	}
	f.step("restricted04_real_rbac_and_direct_routes", func() { f.restricted04(a); assertB() })
}

func workspaceRealQuery(query url.Values) url.Values {
	out := url.Values{}
	for key, values := range query {
		out[key] = append([]string(nil), values...)
	}
	return out
}
func (f *workspaceRealRun) readonlyGateway(base *url.URL, path string, q url.Values) (int, []byte) {
	f.t.Helper()
	target := *base
	target.Path = path
	target.RawQuery = q.Encode()
	request, err := http.NewRequestWithContext(f.ctx, http.MethodGet, target.String(), nil)
	if err != nil {
		f.t.Fatal("restricted gateway request invalid")
	}
	request.Header.Set("Origin", base.Scheme+"://"+base.Host)
	response, err := f.http.Do(request)
	if err != nil {
		f.t.Fatal("restricted gateway transport unavailable")
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		f.t.Fatal("restricted bounded response unavailable")
	}
	return response.StatusCode, data
}
func (f *workspaceRealRun) restricted04(outsideNamespace string) {
	f.t.Helper()
	configPath := os.Getenv("KUBEVIEW_WORKSPACE_REAL_READER_KUBECONFIG")
	baseURL := os.Getenv("KUBEVIEW_WORKSPACE_REAL_RESTRICTED_BASE_URL")
	base, err := url.Parse(baseURL)
	process := f.lab.Processes["04-kisitli-yetki"]
	profile := f.lab.Profiles["04-kisitli-yetki"]
	if configPath == "" || !filepath.IsAbs(configPath) || err != nil || base.User != nil || base.RawQuery != "" || base.Path != "" || base.Scheme != f.base.Scheme || base.Port() != strconv.Itoa(process.Port) || process.PID <= 0 || len(profile.Namespaces) != 1 {
		f.t.Fatal("explicit restricted04 kubeconfig/owned gateway required")
	}
	ip := net.ParseIP(base.Hostname())
	if ip == nil || !ip.IsLoopback() {
		f.t.Fatal("restricted04 URL must be loopback")
	}
	expires, err := time.Parse(time.RFC3339, profile.ReaderTokenExpiresAt)
	if err != nil || !expires.After(time.Now().Add(2*time.Minute)) {
		f.t.Fatal("restricted04 token requires guarded owner refresh before test")
	}
	entry := profile.Namespaces[0]
	f.guard(f.ctx, f.namespaces[0])
	namespace, err := f.admin.CoreV1().Namespaces().Get(f.ctx, entry.Name, metav1.GetOptions{})
	if err != nil || entry.Cluster != "a" || string(namespace.UID) != entry.UID || namespace.Labels[workspaceRealOwnerLabel] != f.lab.LabID || namespace.Labels[workspaceRealProfileLabel] != "04-kisitli-yetki" {
		f.t.Fatal("restricted04 namespace UID/owner guard failed")
	}
	contextName := f.lab.Clusters["a"].Name + "-reader"
	loader := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(&clientcmd.ClientConfigLoadingRules{ExplicitPath: configPath}, &clientcmd.ConfigOverrides{CurrentContext: contextName})
	cfg, err := loader.ClientConfig()
	if err != nil {
		f.t.Fatal("explicit restricted reader config unavailable")
	}
	cfg.Timeout = 10 * time.Second
	reader, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		f.t.Fatal("restricted reader client unavailable")
	}
	pods, err := reader.CoreV1().Pods(entry.Name).List(f.ctx, metav1.ListOptions{})
	if err != nil || len(pods.Items) == 0 {
		f.t.Fatal("restricted reader actual own Pod read failed")
	}
	if _, err = reader.CoreV1().Namespaces().Get(f.ctx, "kube-system", metav1.GetOptions{}); !apierrors.IsForbidden(err) {
		f.t.Fatal("restricted reader unexpectedly accessed cluster identity")
	}
	name := f.runID + "-denied04"
	if _, err = f.admin.CoreV1().ConfigMaps(entry.Name).Get(f.ctx, name, metav1.GetOptions{}); !apierrors.IsNotFound(err) {
		f.t.Fatal("restricted dry-run name absence unproved")
	}
	f.guard(f.ctx, f.namespaces[0])
	namespace, err = f.admin.CoreV1().Namespaces().Get(f.ctx, entry.Name, metav1.GetOptions{})
	if err != nil || string(namespace.UID) != entry.UID || namespace.Labels[workspaceRealOwnerLabel] != f.lab.LabID {
		f.t.Fatal("restricted dry-run ownership changed")
	}
	_, err = reader.CoreV1().ConfigMaps(entry.Name).Create(f.ctx, &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: entry.Name, Labels: map[string]string{workspaceRealAuditLabel: f.runID}}, Data: map[string]string{"audit": "dry-run-only"}}, metav1.CreateOptions{DryRun: []string{metav1.DryRunAll}})
	if !apierrors.IsForbidden(err) {
		f.t.Fatal("actual readonly SA dry-run create was not403")
	}
	if _, err = f.admin.CoreV1().ConfigMaps(entry.Name).Get(f.ctx, name, metav1.GetOptions{}); !apierrors.IsNotFound(err) {
		f.t.Fatal("restricted denied dry-run unexpectedly persisted")
	}
	status, body := f.readonlyGateway(base, "/api/workspace", nil)
	f.code(status, 200, "restricted workspace read")
	var document ws.Document
	if json.Unmarshal(body, &document) != nil {
		f.t.Fatal("restricted workspace DTO invalid")
	}
	connections := map[string]ws.Connection{}
	for _, connection := range document.Connections {
		connections[connection.ID] = connection
	}
	var harbor ws.Harbor
	for _, candidate := range document.Harbors {
		if connections[candidate.ConnectionRef].Context == contextName && len(candidate.Namespaces) == 1 && candidate.Namespaces[0] == entry.Name {
			harbor = candidate
		}
	}
	if harbor.ID == "" {
		f.t.Fatal("restricted reader harbor absent")
	}
	scope := url.Values{"workspaceId": {document.ID}, "harborId": {harbor.ID}, "tabId": {f.tab}}
	status, body = f.readonlyGateway(base, "/api/connection", scope)
	f.code(status, 200, "restricted readonly diagnostic")
	var diagnostic struct {
		ReadOnly bool               `json:"readOnly"`
		Identity connectionIdentity `json:"identity"`
	}
	if json.Unmarshal(body, &diagnostic) != nil || !diagnostic.ReadOnly || diagnostic.Identity.Confidence != "unknown" || diagnostic.Identity.ClusterUID != "" {
		f.t.Fatal("restricted connection elevated identity or write permission")
	}
	pod := pods.Items[0]
	if len(pod.Spec.Containers) == 0 {
		f.t.Fatal("restricted log Pod has no real container")
	}
	for _, path := range []string{"/api/logs", "/api/metrics", "/api/flows"} {
		q := workspaceRealQuery(scope)
		q.Set("namespace", outsideNamespace)
		q.Set("pod", pod.Name)
		q.Set("container", pod.Spec.Containers[0].Name)
		q.Set("uid", string(pod.UID))
		q.Set("subscription", f.runID)
		status, _ = f.readonlyGateway(base, path, q)
		f.code(status, 403, "restricted outside-namespace "+path)
	}
	q := workspaceRealQuery(scope)
	q.Set("namespace", entry.Name)
	q.Set("pod", pod.Name)
	q.Set("container", pod.Spec.Containers[0].Name)
	q.Set("uid", uuid.NewString())
	status, _ = f.readonlyGateway(base, "/api/logs", q)
	f.code(status, 409, "restricted typed log wrong UID")
	q = workspaceRealQuery(scope)
	q.Set("namespace", entry.Name)
	q.Set("resource", "pods")
	q.Set("context", f.lab.Clusters["a"].Name)
	status, _ = f.readonlyGateway(base, "/api/resources", q)
	f.code(status, 409, "restricted context cannot borrow admin")
	status, body = f.gateway(http.MethodGet, "/api/connection", f.scope(f.namespaces[0]), nil, "")
	f.code(status, 200, "profile02 remains independent after04")
	var original struct {
		Enabled bool `json:"managementEnabled"`
	}
	if json.Unmarshal(body, &original) != nil || !original.Enabled {
		f.t.Fatal("restricted04 profile cookie visit altered profile02 grant")
	}
	f.t.Log("REAL readonly SA: own Pod read, cluster identity403, dryruncreate403/GET404, scoped logs/metrics/flows403, wronglogUID409, admincontext409")
}
