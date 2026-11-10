package server

// Explicit owned-lab HTTP/API/watch tests. These never select a default context
// and never treat their results as browser/animation/performance acceptance.
import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

const workspaceRealAuditLabel = "manual.kubeview.local/ws-api-audit"
const workspaceRealOwnerLabel = "manual.kubeview.local/lab-id"
const workspaceRealProfileLabel = "manual.kubeview.local/profile"

type workspaceRealLab struct {
	LabID    string `json:"labId"`
	Clusters map[string]struct {
		Name      string            `json:"name"`
		UID       string            `json:"uid"`
		MarkerUID string            `json:"markerUid"`
		Worker    string            `json:"worker"`
		NodeUIDs  map[string]string `json:"nodeUids"`
	} `json:"clusters"`
	Profiles map[string]struct {
		Namespaces []struct {
			Cluster string `json:"cluster"`
			Name    string `json:"name"`
			UID     string `json:"uid"`
		} `json:"namespaces"`
		ReaderTokenExpiresAt string `json:"readerTokenExpiresAt"`
	} `json:"profiles"`
	Processes map[string]struct {
		PID       int    `json:"pid"`
		Port      int    `json:"port"`
		BinarySHA string `json:"binarySha256"`
	} `json:"processes"`
}
type workspaceRealOwned struct {
	Namespace string    `json:"namespace"`
	Name      string    `json:"name"`
	UID       types.UID `json:"uid"`
	Deleted   bool      `json:"cleanupGet404"`
}
type workspaceRealEvidence struct {
	Kind               string                `json:"kind"`
	Phase              string                `json:"phase"`
	RunID              string                `json:"runId"`
	WorkspaceID        string                `json:"workspaceId"`
	ClusterUID         string                `json:"clusterUID"`
	BinarySHA          string                `json:"gatewayBinarySHA256"`
	Steps              []string              `json:"passedSteps"`
	Objects            []*workspaceRealOwned `json:"objects"`
	Cleanup            []string              `json:"cleanup"`
	Failed             bool                  `json:"failed"`
	TemporaryHarborIDs []string              `json:"temporaryHarborIds,omitempty"`
}
type workspaceRealRun struct {
	t                                         *testing.T
	ctx                                       context.Context
	base                                      *url.URL
	http                                      *http.Client
	admin                                     kubernetes.Interface
	lab                                       workspaceRealLab
	doc                                       ws.Document
	tab, runID, clusterUID, statePath, output string
	namespaces                                []string
	namespaceUID                              map[string]string
	harbors                                   map[string]ws.Harbor
	nonces                                    map[string]string
	owned                                     []*workspaceRealOwned
	proof                                     workspaceRealEvidence
	workspaceNonce                            string
	originalDocument                          ws.Document
	temporaryHarbors                          map[string]ws.Harbor
}

func newWorkspaceRealRun(t *testing.T, phase string) *workspaceRealRun {
	t.Helper()
	enabled := os.Getenv("KUBEVIEW_WORKSPACE_REAL_PHASE")
	if enabled == "" || enabled != phase {
		t.Skip("requires explicit owned workspace API phase")
	}
	baseURL := os.Getenv("KUBEVIEW_WORKSPACE_REAL_BASE_URL")
	configPath := os.Getenv("KUBEVIEW_WORKSPACE_REAL_KUBECONFIG")
	statePath := os.Getenv("KUBEVIEW_WORKSPACE_REAL_LAB_STATE")
	expected := os.Getenv("KUBEVIEW_WORKSPACE_REAL_CLUSTER_UID")
	output := os.Getenv("KUBEVIEW_WORKSPACE_REAL_OUTPUT")
	if baseURL == "" || configPath == "" || statePath == "" || expected == "" || output == "" || !filepath.IsAbs(configPath) || !filepath.IsAbs(statePath) || !filepath.IsAbs(output) {
		t.Fatal("explicit URL/private kubeconfig/lab state/cluster UID/output required; no defaults")
	}
	base, err := url.Parse(baseURL)
	if err != nil || base.User != nil || base.RawQuery != "" || base.Fragment != "" || (base.Path != "" && base.Path != "/") || (base.Scheme != "http" && base.Scheme != "https") {
		t.Fatal("invalid explicit gateway URL")
	}
	ip := net.ParseIP(base.Hostname())
	if base.Hostname() != "localhost" && (ip == nil || !ip.IsLoopback()) {
		t.Fatal("owned gateway must be loopback")
	}
	data, err := os.ReadFile(statePath)
	if err != nil {
		t.Fatal("explicit lab state unavailable")
	}
	var lab workspaceRealLab
	if json.Unmarshal(data, &lab) != nil {
		t.Fatal("invalid explicit lab state")
	}
	cluster := lab.Clusters["a"]
	profile := lab.Profiles["02-ortak-kume"]
	process := lab.Processes["02-ortak-kume"]
	if !strings.HasPrefix(lab.LabID, "kvml-") || cluster.Name != lab.LabID+"-a" || cluster.UID != expected || cluster.MarkerUID == "" || len(profile.Namespaces) != 2 || base.Port() != strconv.Itoa(process.Port) || process.PID <= 0 || len(process.BinarySHA) != 64 {
		t.Fatal("explicit owned A/profile02/gateway identity guard failed")
	}
	loader := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(&clientcmd.ClientConfigLoadingRules{ExplicitPath: configPath}, &clientcmd.ConfigOverrides{CurrentContext: cluster.Name})
	cfg, err := loader.ClientConfig()
	if err != nil {
		t.Fatal("explicit admin kubeconfig unusable")
	}
	cfg.Timeout = 10 * time.Second
	cfg.QPS = 10
	cfg.Burst = 20
	cfg.UserAgent = "KubeView/owned-workspace-api-e2e"
	admin, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		t.Fatal("explicit admin client unavailable")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 150*time.Second)
	t.Cleanup(cancel)
	jar, _ := cookiejar.New(nil)
	transport := &http.Transport{Proxy: nil, ResponseHeaderTimeout: 12 * time.Second}
	t.Cleanup(transport.CloseIdleConnections)
	runID := "qa-ws-" + strings.ReplaceAll(uuid.NewString()[:18], "-", "")
	f := &workspaceRealRun{t: t, ctx: ctx, base: base, http: &http.Client{Jar: jar, Transport: transport, Timeout: 18 * time.Second}, admin: admin, lab: lab, tab: runID, runID: runID, clusterUID: expected, statePath: statePath, output: output, namespaceUID: map[string]string{}, harbors: map[string]ws.Harbor{}, nonces: map[string]string{}}
	f.proof = workspaceRealEvidence{Kind: "real Kubernetes + immutable HTTP gateway; not normal UI", Phase: phase, RunID: runID, ClusterUID: expected, BinarySHA: process.BinarySHA, Steps: []string{}, Objects: []*workspaceRealOwned{}, Cleanup: []string{}}
	for _, entry := range profile.Namespaces {
		if entry.Cluster != "a" || entry.UID == "" || !strings.HasPrefix(entry.Name, "kvml-") || !strings.Contains(entry.Name, "-02-") {
			t.Fatal("refusing non-profile02 namespace")
		}
		f.namespaces = append(f.namespaces, entry.Name)
		f.namespaceUID[entry.Name] = entry.UID
		f.guard(ctx, entry.Name)
	}
	worker, err := admin.CoreV1().Nodes().Get(ctx, cluster.Worker, metav1.GetOptions{})
	if err != nil || cluster.Worker == "" || string(worker.UID) != cluster.NodeUIDs[cluster.Worker] {
		t.Fatal("owned existing worker UID unavailable")
	}
	t.Cleanup(f.cleanup)
	status, body := f.gateway(http.MethodGet, "/api/workspace", nil, nil, "")
	f.code(status, 200, "workspace bootstrap")
	if json.Unmarshal(body, &f.doc) != nil || f.doc.ID == "" {
		t.Fatal("workspace DTO unavailable")
	}
	var meta struct {
		Nonce string `json:"workspaceNonce"`
	}
	if json.Unmarshal(body, &meta) != nil || meta.Nonce == "" {
		t.Fatal("workspace CSRF nonce unavailable")
	}
	f.workspaceNonce = meta.Nonce
	f.originalDocument = f.doc
	f.temporaryHarbors = map[string]ws.Harbor{}
	f.proof.WorkspaceID = f.doc.ID
	connections := map[string]ws.Connection{}
	for _, c := range f.doc.Connections {
		connections[c.ID] = c
	}
	for _, h := range f.doc.Harbors {
		if len(h.Namespaces) == 1 && connections[h.ConnectionRef].Context == cluster.Name && h.Selector == "" {
			if _, owned := f.namespaceUID[h.Namespaces[0]]; owned {
				f.harbors[h.Namespaces[0]] = h
			}
		}
	}
	if len(f.harbors) != 2 {
		t.Fatal("gateway does not contain both expected unfiltered profile02 harbors")
	}
	return f
}
func (f *workspaceRealRun) guard(ctx context.Context, namespace string) {
	f.t.Helper()
	expected, ok := f.namespaceUID[namespace]
	if !ok {
		f.t.Fatal("refusing mutation/read fixture outside registered profile02 namespaces")
	}
	cluster, err := f.admin.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
	if err != nil || string(cluster.UID) != f.clusterUID {
		f.t.Fatal("actual kube-system UID guard failed")
	}
	marker, err := f.admin.CoreV1().ConfigMaps("kube-system").Get(ctx, "kubeview-manual-lab-owner", metav1.GetOptions{})
	if err != nil || string(marker.UID) != f.lab.Clusters["a"].MarkerUID || marker.Labels[workspaceRealOwnerLabel] != f.lab.LabID {
		f.t.Fatal("actual cluster owner marker guard failed")
	}
	ns, err := f.admin.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
	if err != nil || string(ns.UID) != expected || ns.Labels[workspaceRealOwnerLabel] != f.lab.LabID || ns.Labels[workspaceRealProfileLabel] != "02-ortak-kume" {
		f.t.Fatal("actual namespace UID/owner/profile guard failed")
	}
}
func (f *workspaceRealRun) scope(namespace string) url.Values {
	h, ok := f.harbors[namespace]
	if !ok {
		f.t.Fatal("expected harbor unavailable")
	}
	return url.Values{"workspaceId": {f.doc.ID}, "harborId": {h.ID}, "tabId": {f.tab}}
}
func (f *workspaceRealRun) resourceQuery(namespace, name string) url.Values {
	q := f.scope(namespace)
	q.Set("group", "apps")
	q.Set("version", "v1")
	q.Set("resource", "deployments")
	q.Set("namespace", namespace)
	if name != "" {
		q.Set("name", name)
	}
	return q
}
func (f *workspaceRealRun) gateway(method, path string, q url.Values, body interface{}, nonce string) (int, []byte) {
	return f.gatewayContext(f.ctx, method, path, q, body, nonce)
}
func (f *workspaceRealRun) gatewayContext(ctx context.Context, method, path string, q url.Values, body interface{}, nonce string) (int, []byte) {
	f.t.Helper()
	var payload []byte
	if body != nil {
		payload, _ = json.Marshal(body)
	}
	target := *f.base
	target.Path = path
	if q != nil {
		target.RawQuery = q.Encode()
	}
	request, err := http.NewRequestWithContext(ctx, method, target.String(), bytes.NewReader(payload))
	if err != nil {
		f.t.Fatal("gateway request construction failed")
	}
	request.Header.Set("Origin", f.base.Scheme+"://"+f.base.Host)
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if nonce != "" {
		request.Header.Set("X-KubeView-Connection", nonce)
	}
	if strings.HasPrefix(path, "/api/workspace") && method != http.MethodGet {
		request.Header.Set("X-KubeView-Workspace-Nonce", f.workspaceNonce)
	}
	response, err := f.http.Do(request)
	if err != nil {
		f.t.Fatal("gateway transport failed; request outcome requires owned reconciliation")
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	if err != nil {
		f.t.Fatal("bounded gateway response unavailable")
	}
	return response.StatusCode, data
}
func (f *workspaceRealRun) code(actual, wanted int, stage string) {
	f.t.Helper()
	if actual != wanted {
		f.t.Fatalf("%s HTTP%d wanted%d", stage, actual, wanted)
	}
}
func (f *workspaceRealRun) step(name string, fn func()) bool {
	f.t.Helper()
	if !f.t.Run(name, func(t *testing.T) { old := f.t; f.t = t; defer func() { f.t = old }(); fn() }) {
		return false
	}
	f.proof.Steps = append(f.proof.Steps, name)
	return true
}
func (f *workspaceRealRun) diagnostic(namespace string) {
	f.t.Helper()
	status, body := f.gateway(http.MethodGet, "/api/connection", f.scope(namespace), nil, "")
	f.code(status, 200, "connection diagnostic")
	var value struct {
		Context           string             `json:"context"`
		ConnectionID      string             `json:"connectionID"`
		ReadOnly          bool               `json:"readOnly"`
		ServerReadOnly    bool               `json:"serverReadOnly"`
		ManagementEnabled bool               `json:"managementEnabled"`
		Identity          connectionIdentity `json:"identity"`
	}
	if json.Unmarshal(body, &value) != nil || value.Context != f.lab.Clusters["a"].Name || !value.ReadOnly || value.ManagementEnabled || value.ServerReadOnly || value.ConnectionID == "" || value.Identity.Confidence != "verified" || value.Identity.ClusterUID != f.clusterUID {
		f.t.Fatal("gateway target/identity/initial readonly diagnostic mismatch")
	}
	f.nonces[namespace] = value.ConnectionID
}
func (f *workspaceRealRun) enable(namespace string) {
	f.t.Helper()
	f.guard(f.ctx, namespace)
	status, _ := f.gateway(http.MethodPost, "/api/management", f.scope(namespace), map[string]interface{}{"enabled": true, "context": f.lab.Clusters["a"].Name, "namespace": namespace, "connectionID": f.nonces[namespace]}, "")
	f.code(status, 200, "explicit scoped management enable")
}
func (f *workspaceRealRun) fixture(namespace, name string) *appsv1.Deployment {
	labels := map[string]string{workspaceRealAuditLabel: f.runID, workspaceRealOwnerLabel: f.lab.LabID, workspaceRealProfileLabel: "02-ortak-kume", "manual.kubeview.local/ws-object": name}
	replicas := int32(1)
	worker := f.lab.Clusters["a"].Worker
	return &appsv1.Deployment{TypeMeta: metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"}, ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, Labels: labels}, Spec: appsv1.DeploymentSpec{Replicas: &replicas, Selector: &metav1.LabelSelector{MatchLabels: map[string]string{workspaceRealAuditLabel: f.runID, "manual.kubeview.local/ws-object": name}}, Template: corev1.PodTemplateSpec{ObjectMeta: metav1.ObjectMeta{Labels: labels}, Spec: corev1.PodSpec{Containers: []corev1.Container{{Name: "web", Image: "nginx:1.27.5-alpine", ImagePullPolicy: corev1.PullIfNotPresent, ReadinessProbe: &corev1.Probe{ProbeHandler: corev1.ProbeHandler{HTTPGet: &corev1.HTTPGetAction{Path: "/", Port: intstrFromInt(80)}}, PeriodSeconds: 2}}}, Affinity: &corev1.Affinity{NodeAffinity: &corev1.NodeAffinity{RequiredDuringSchedulingIgnoredDuringExecution: &corev1.NodeSelector{NodeSelectorTerms: []corev1.NodeSelectorTerm{{MatchFields: []corev1.NodeSelectorRequirement{{Key: "metadata.name", Operator: corev1.NodeSelectorOpIn, Values: []string{worker}}}}}}}}}}}}
}
func (f *workspaceRealRun) pending(namespace, name string) *workspaceRealOwned {
	f.t.Helper()
	if !strings.HasPrefix(name, "qa-ws-") {
		f.t.Fatal("fixture name prefix refused")
	}
	if _, err := f.admin.AppsV1().Deployments(namespace).Get(f.ctx, name, metav1.GetOptions{}); !apierrors.IsNotFound(err) {
		f.t.Fatal("fixture name already exists or absence not proved")
	}
	item := &workspaceRealOwned{Namespace: namespace, Name: name}
	f.owned = append(f.owned, item)
	f.proof.Objects = append(f.proof.Objects, item)
	return item
}
func (f *workspaceRealRun) capture(item *workspaceRealOwned) *appsv1.Deployment {
	f.t.Helper()
	obj, err := f.admin.AppsV1().Deployments(item.Namespace).Get(f.ctx, item.Name, metav1.GetOptions{})
	if err != nil || obj.UID == "" || obj.Labels[workspaceRealAuditLabel] != f.runID || obj.Labels[workspaceRealOwnerLabel] != f.lab.LabID {
		f.t.Fatal("created fixture UID/audit owner not proved")
	}
	if item.UID != "" && item.UID != obj.UID {
		f.t.Fatal("fixture UID unexpectedly replaced")
	}
	item.UID = obj.UID
	return obj
}
func (f *workspaceRealRun) absent(namespace, name string) {
	f.t.Helper()
	_, err := f.admin.AppsV1().Deployments(namespace).Get(f.ctx, name, metav1.GetOptions{})
	if !apierrors.IsNotFound(err) {
		f.t.Fatal("actual API absence not proved")
	}
}
func (f *workspaceRealRun) ready(item *workspaceRealOwned) {
	f.t.Helper()
	for deadline := time.Now().Add(75 * time.Second); time.Now().Before(deadline) && f.ctx.Err() == nil; time.Sleep(500 * time.Millisecond) {
		obj := f.capture(item)
		if obj.Status.ObservedGeneration < obj.Generation || obj.Status.ReadyReplicas < 1 || obj.Status.AvailableReplicas < 1 {
			continue
		}
		pods, err := f.admin.CoreV1().Pods(item.Namespace).List(f.ctx, metav1.ListOptions{LabelSelector: workspaceRealAuditLabel + "=" + f.runID})
		if err != nil {
			f.t.Fatal("owned Pod observation unavailable")
		}
		for _, pod := range pods.Items {
			ready := false
			for _, condition := range pod.Status.Conditions {
				if condition.Type == corev1.PodReady && condition.Status == corev1.ConditionTrue {
					ready = true
				}
			}
			if !ready || pod.Labels[workspaceRealAuditLabel] != f.runID {
				continue
			}
			for _, owner := range pod.OwnerReferences {
				if owner.Kind != "ReplicaSet" {
					continue
				}
				rs, err := f.admin.AppsV1().ReplicaSets(item.Namespace).Get(f.ctx, owner.Name, metav1.GetOptions{})
				if err != nil || rs.UID != owner.UID {
					continue
				}
				for _, parent := range rs.OwnerReferences {
					if parent.Kind == "Deployment" && parent.UID == item.UID {
						if pod.Spec.NodeName != f.lab.Clusters["a"].Worker {
							f.t.Fatal("owned fixture scheduled outside intended existing worker")
						}
						node, err := f.admin.CoreV1().Nodes().Get(f.ctx, pod.Spec.NodeName, metav1.GetOptions{})
						if err != nil || string(node.UID) != f.lab.Clusters["a"].NodeUIDs[pod.Spec.NodeName] {
							f.t.Fatal("actual worker UID changed")
						}
						f.t.Logf("REAL Ready deploymentUID=%s replicaSetUID=%s podUID=%s nodeUID=%s", item.UID, rs.UID, pod.UID, node.UID)
						return
					}
				}
			}
		}
	}
	f.t.Fatal("owned fixture did not become actual Ready within75s")
}
func (f *workspaceRealRun) socket(namespace string) (*websocket.Conn, <-chan envelope) {
	f.t.Helper()
	target := *f.base
	target.Scheme = "ws"
	if f.base.Scheme == "https" {
		target.Scheme = "wss"
	}
	target.Path = "/ws"
	target.RawQuery = f.scope(namespace).Encode()
	headers := http.Header{"Origin": []string{f.base.Scheme + "://" + f.base.Host}}
	for _, cookie := range f.http.Jar.Cookies(f.base) {
		headers.Add("Cookie", cookie.String())
	}
	dialer := websocket.Dialer{Proxy: nil, HandshakeTimeout: 12 * time.Second}
	conn, response, err := dialer.DialContext(f.ctx, target.String(), headers)
	if err != nil {
		code := 0
		if response != nil {
			code = response.StatusCode
		}
		f.t.Fatalf("real watch handshake HTTP%d", code)
	}
	events := make(chan envelope, 256)
	f.t.Cleanup(func() { conn.Close() })
	go func() {
		defer close(events)
		for {
			var msg envelope
			if conn.ReadJSON(&msg) != nil {
				return
			}
			select {
			case events <- msg:
			case <-f.ctx.Done():
				return
			}
		}
	}()
	return conn, events
}
func (f *workspaceRealRun) watch(events <-chan envelope, match func(envelope) bool) envelope {
	f.t.Helper()
	timer := time.NewTimer(25 * time.Second)
	defer timer.Stop()
	for {
		select {
		case msg, ok := <-events:
			if !ok {
				f.t.Fatal("real watch closed before expected proof")
			}
			if match(msg) {
				return msg
			}
		case <-timer.C:
			f.t.Fatal("real watch evidence timed out")
		case <-f.ctx.Done():
			f.t.Fatal("owned API job deadline")
		}
	}
}
func (f *workspaceRealRun) cleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
	defer cancel()
	f.proof.Failed = f.t.Failed()
	defer func() {
		f.proof.Failed = f.t.Failed()
		if err := os.MkdirAll(f.output, 0755); err == nil {
			data, _ := json.MarshalIndent(f.proof, "", "  ")
			if os.WriteFile(filepath.Join(f.output, "workspace-real-"+f.proof.Phase+"-"+f.runID+".json"), append(data, '\n'), 0644) != nil {
				f.t.Error("safe evidence write failed")
			}
		} else {
			f.t.Error("evidence directory unavailable")
		}
	}()
	defer f.cleanupTemporaryHarbors(ctx)
	for _, item := range f.owned {
		func() {
			f.guard(ctx, item.Namespace)
			obj, err := f.admin.AppsV1().Deployments(item.Namespace).Get(ctx, item.Name, metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				item.Deleted = f.waitAuditAbsent(ctx, item)
				return
			}
			if err != nil || obj.Labels[workspaceRealAuditLabel] != f.runID || obj.Labels[workspaceRealOwnerLabel] != f.lab.LabID || !strings.HasPrefix(obj.Name, "qa-ws-") {
				f.t.Error("cleanup refused unproved audit owner")
				return
			}
			if item.UID == "" {
				item.UID = obj.UID
			}
			if item.UID == "" || obj.UID != item.UID {
				f.t.Error("cleanup refused changed UID")
				return
			}
			sets, err := f.admin.AppsV1().ReplicaSets(item.Namespace).List(ctx, metav1.ListOptions{})
			if err != nil {
				f.t.Error("cleanup dependent ownership unavailable")
				return
			}
			ownedSets := map[types.UID]bool{}
			for _, rs := range sets.Items {
				for _, owner := range rs.OwnerReferences {
					if owner.UID == item.UID {
						if rs.Labels[workspaceRealAuditLabel] != f.runID {
							f.t.Error("cleanup refused unaudited dependent ReplicaSet")
							return
						}
						ownedSets[rs.UID] = true
					}
				}
			}
			pods, err := f.admin.CoreV1().Pods(item.Namespace).List(ctx, metav1.ListOptions{})
			if err != nil {
				f.t.Error("cleanup dependent Pod ownership unavailable")
				return
			}
			for _, pod := range pods.Items {
				for _, owner := range pod.OwnerReferences {
					if owner.UID == item.UID || ownedSets[owner.UID] {
						if pod.Labels[workspaceRealAuditLabel] != f.runID {
							f.t.Error("cleanup refused unaudited dependent Pod")
							return
						}
					}
				}
			}
			f.guard(ctx, item.Namespace)
			uid := item.UID
			foreground := metav1.DeletePropagationForeground
			if err = f.admin.AppsV1().Deployments(item.Namespace).Delete(ctx, item.Name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid}, PropagationPolicy: &foreground}); err != nil && !apierrors.IsNotFound(err) {
				f.t.Error("UID-precondition cleanup rejected")
				return
			}
			for ctx.Err() == nil {
				_, err = f.admin.AppsV1().Deployments(item.Namespace).Get(ctx, item.Name, metav1.GetOptions{})
				if apierrors.IsNotFound(err) {
					item.Deleted = f.waitAuditAbsent(ctx, item)
					if item.Deleted {
						f.proof.Cleanup = append(f.proof.Cleanup, "exactUID Deployment GET404 + audited Deployment/ReplicaSet/Pod LIST=0")
					}
					return
				}
				time.Sleep(200 * time.Millisecond)
			}
			f.t.Error("cleanup final GET404 timeout")
		}()
	}
}

func TestOwnedWorkspaceRealAPISmoke(t *testing.T) {
	f := newWorkspaceRealRun(t, "smoke")
	a, b := f.namespaces[0], f.namespaces[1]
	name := f.runID + "-smoke"
	fixture := f.fixture(a, name)
	pending := f.pending(a, name)
	if !f.step("readonly_and_scope_negatives", func() {
		f.diagnostic(a)
		f.guard(f.ctx, a)
		status, _ := f.gateway(http.MethodPost, "/api/resources", f.resourceQuery(a, ""), map[string]interface{}{"object": fixture}, "")
		f.code(status, 403, "browser readonly direct mutation")
		f.absent(a, name)
		q := f.resourceQuery(a, "")
		q.Set("namespace", b)
		status, _ = f.gateway(http.MethodGet, "/api/resources", q, nil, "")
		f.code(status, 403, "other namespace direct read")
	}) {
		return
	}
	if !f.step("explicit_grant_and_server_dryrun", func() {
		f.enable(a)
		f.guard(f.ctx, a)
		status, _ := f.gateway(http.MethodPost, "/api/resources", f.resourceQuery(a, ""), map[string]interface{}{"object": fixture, "dryRun": true}, f.nonces[a])
		f.code(status, 201, "server dryrun create")
		f.absent(a, name)
		status, _ = f.gateway(http.MethodGet, "/api/resources", f.resourceQuery(a, name), nil, "")
		f.code(status, 404, "dryrun actual GET404")
	}) {
		return
	}
	_, events := f.socket(a)
	if !f.step("real_watch_authority", func() {
		msg := f.watch(events, func(msg envelope) bool { return msg.Type == "SNAPSHOT" })
		found := false
		for _, scope := range msg.Scopes {
			if scope.Group == "apps" && scope.Resource == "deployments" && scope.Namespace == a && scope.Authoritative && scope.Status == "synced" {
				found = true
			}
		}
		if !found {
			f.t.Fatal("required Deployment watch scope not authoritative")
		}
	}) {
		return
	}
	if !f.step("real_create_uid_owner_ready", func() {
		f.guard(f.ctx, a)
		status, body := f.gateway(http.MethodPost, "/api/resources", f.resourceQuery(a, ""), map[string]interface{}{"object": fixture}, f.nonces[a])
		f.code(status, 201, "real create")
		obj := f.capture(pending)
		var response struct {
			Operation struct {
				WorkspaceID string                   `json:"workspaceId"`
				HarborID    string                   `json:"harborId"`
				Target      workspaceOperationTarget `json:"target"`
			} `json:"operation"`
		}
		if json.Unmarshal(body, &response) != nil || response.Operation.WorkspaceID != f.doc.ID || response.Operation.HarborID != f.harbors[a].ID || response.Operation.Target.Namespace != a || response.Operation.Target.UID != string(obj.UID) {
			f.t.Fatal("accepted operation target was not pinned to actual harbor/namespace/UID")
		}
		f.watch(events, func(msg envelope) bool {
			return msg.Type == "RESOURCE_EVENT" && msg.Action == "ADD" && msg.Object != nil && msg.Object.GetUID() == obj.UID
		})
		f.ready(pending)
	}) {
		return
	}
	f.step("granted_namespace_escape_rejected", func() {
		escapeName := f.runID + "-escape"
		f.guard(f.ctx, b)
		escaped := f.pending(b, escapeName)
		_ = escaped
		q := f.resourceQuery(a, "")
		q.Set("namespace", b)
		status, _ := f.gateway(http.MethodPost, "/api/resources", q, map[string]interface{}{"object": f.fixture(b, escapeName)}, f.nonces[a])
		f.code(status, 403, "granted cross-namespace create")
		f.absent(b, escapeName)
	})
}

func TestOwnedWorkspaceRealAPISelectorMultiNSOverlap(t *testing.T) {
	f := newWorkspaceRealRun(t, "selector-multins-overlap")
	a, b := f.namespaces[0], f.namespaces[1]
	selector := workspaceRealAuditLabel + "=" + f.runID
	alphaSelector := selector + ",manual.kubeview.local/ws-scope=alpha"
	var single, multi, overlap ws.Harbor
	var itemA, itemB *workspaceRealOwned
	streams := map[string]<-chan envelope{}
	sockets := map[string]*websocket.Conn{}
	snapshots := map[string]envelope{}
	bound := func(h ws.Harbor, msg envelope, generation string) {
		f.t.Helper()
		if msg.WorkspaceID != f.doc.ID || msg.HarborID != h.ID || msg.TabID != f.tab || msg.Context != f.lab.Clusters["a"].Name || msg.ConnectionRef != h.ConnectionRef || msg.AuthorizationKey == "" || msg.CredentialGeneration == "" || msg.Generation == "" || msg.SessionGeneration != msg.Generation || (generation != "" && msg.Generation != generation) {
			f.t.Fatal("real envelope workspace/harbor/tab/auth/credential/session binding mismatch")
		}
		if baseline, ok := snapshots[h.ID]; ok && (msg.AuthorizationKey != baseline.AuthorizationKey || msg.CredentialGeneration != baseline.CredentialGeneration) {
			f.t.Fatal("real stream unexpectedly changed authorization or credential generation")
		}
	}
	readSnapshot := func(h ws.Harbor, events <-chan envelope) envelope {
		f.t.Helper()
		msg := f.watch(events, func(msg envelope) bool { return msg.Type == "SNAPSHOT" })
		bound(h, msg, "")
		for _, namespace := range h.Namespaces {
			found := false
			for _, scope := range msg.Scopes {
				if scope.Group == "apps" && scope.Resource == "deployments" && scope.Namespace == namespace && scope.Authoritative && scope.Status == "synced" {
					found = true
				}
			}
			if !found {
				f.t.Fatal("real multi-namespace Deployment snapshot lacks authoritative scope")
			}
		}
		return msg
	}
	readEvent := func(h ws.Harbor, item *workspaceRealOwned, action string) envelope {
		f.t.Helper()
		msg := f.watch(streams[h.ID], func(msg envelope) bool {
			if msg.Type != "RESOURCE_EVENT" || msg.Object == nil || msg.Object.GetUID() != item.UID {
				return false
			}
			bound(h, msg, snapshots[h.ID].Generation)
			if msg.Action == "DELETE" && action != "DELETE" {
				f.t.Fatal("selector membership change became real DELETE")
			}
			return msg.Action == action
		})
		if msg.Scope == nil || msg.Scope.Namespace != item.Namespace || msg.Scope.Resource != "deployments" || !msg.Scope.Authoritative || msg.Object.GetNamespace() != item.Namespace || msg.Object.GetName() != item.Name {
			f.t.Fatal("real event target/scope mismatch")
		}
		return msg
	}
	putScope := func(item *workspaceRealOwned, value string) {
		f.t.Helper()
		f.guard(f.ctx, item.Namespace)
		object := f.capture(item)
		object.TypeMeta = metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"}
		object.Labels["manual.kubeview.local/ws-scope"] = value
		object.Spec.Template.Labels["manual.kubeview.local/ws-scope"] = value
		status, _ := f.gateway(http.MethodPut, "/api/resources", f.harborResource(overlap, item.Namespace, item.Name), map[string]interface{}{"object": object}, f.nonces[overlap.ID])
		f.code(status, 200, "own scope update through overlapping harbor")
		if f.capture(item).Labels["manual.kubeview.local/ws-scope"] != value {
			f.t.Fatal("real selector-label update did not persist")
		}
	}
	if !f.step("owned_selector_multins_harbors_and_real_ready", func() {
		single = f.addTemporaryHarbor(f.runID+"-single", []string{a}, alphaSelector)
		multi = f.addTemporaryHarbor(f.runID+"-multi", []string{a, b}, alphaSelector)
		overlap = f.addTemporaryHarbor(f.runID+"-overlap", []string{a, b}, selector)
		for _, h := range []ws.Harbor{single, multi, overlap} {
			f.enableHarbor(h)
		}
		itemA = f.createHarborFixture(single, a, f.runID+"-alpha", "alpha")
		itemB = f.createHarborFixture(overlap, b, f.runID+"-beta", "beta")
		if itemA.UID == itemB.UID {
			f.t.Fatal("independent namespace fixtures share UID")
		}
	}) {
		return
	}
	if !f.step("selector_negatives_and_exact_overlap_union", func() {
		f.deploymentSet(single, a, itemA.UID)
		f.deploymentSet(multi, "", itemA.UID)
		f.deploymentSet(overlap, "", itemA.UID, itemB.UID)
		status, _ := f.gateway(http.MethodGet, "/api/resources", f.harborResource(multi, b, itemB.Name), nil, "")
		f.code(status, 403, "existing resource outside label selector")
		q := f.harborResource(single, b, itemB.Name)
		status, _ = f.gateway(http.MethodGet, "/api/resources", q, nil, "")
		f.code(status, 403, "single-namespace harbor cannot borrow multi scope")
		name := f.runID + "-denied-selector"
		f.pending(a, name)
		object := f.fixture(a, name)
		object.Labels["manual.kubeview.local/ws-scope"] = "beta"
		object.Spec.Template.Labels["manual.kubeview.local/ws-scope"] = "beta"
		f.guard(f.ctx, a)
		status, _ = f.gateway(http.MethodPost, "/api/resources", f.harborResource(single, a, ""), map[string]interface{}{"object": object}, f.nonces[single.ID])
		f.code(status, 403, "write grant cannot escape selector")
		f.absent(a, name)
	}) {
		return
	}
	// Socket cleanup belongs to the phase, so open outside a leaf subtest.
	for _, h := range []ws.Harbor{single, multi, overlap} {
		sockets[h.ID], streams[h.ID] = f.socketHarbor(h)
		snapshots[h.ID] = readSnapshot(h, streams[h.ID])
	}
	if snapshots[single.ID].Generation == snapshots[multi.ID].Generation || snapshots[multi.ID].Generation == snapshots[overlap.ID].Generation {
		f.t.Fatal("different harbor streams reused session generation")
	}
	if !f.step("multins_real_update_and_target_uid", func() {
		putScope(itemB, "alpha")
		readEvent(multi, itemB, "UPDATE")
		readEvent(overlap, itemB, "UPDATE")
		f.deploymentSet(multi, "", itemA.UID, itemB.UID)
		f.deploymentSet(single, a, itemA.UID)
		f.deploymentSet(overlap, "", itemA.UID, itemB.UID)
	}) {
		return
	}
	if !f.step("out_of_scope_is_metadata_only_and_real_object_survives", func() {
		putScope(itemA, "beta")
		for _, h := range []ws.Harbor{single, multi} {
			msg := readEvent(h, itemA, "OUT_OF_SCOPE")
			if len(msg.Object.GetLabels()) != 0 || len(msg.Object.GetOwnerReferences()) != 0 || len(msg.Object.Object) != 3 || msg.Object.Object["spec"] != nil || msg.Object.Object["status"] != nil {
				f.t.Fatal("OUT_OF_SCOPE leaked post-exit resource contents")
			}
		}
		readEvent(overlap, itemA, "UPDATE")
		f.capture(itemA)
		f.deploymentSet(single, a)
		f.deploymentSet(multi, "", itemB.UID)
		f.deploymentSet(overlap, "", itemA.UID, itemB.UID)
		status, _ := f.gateway(http.MethodGet, "/api/resources", f.harborResource(single, a, itemA.Name), nil, "")
		f.code(status, 403, "scope-exited object remains inaccessible")
	}) {
		return
	}
	if !f.step("same_uid_reentry", func() {
		putScope(itemA, "alpha")
		for _, h := range []ws.Harbor{single, multi, overlap} {
			readEvent(h, itemA, "UPDATE")
		}
		f.deploymentSet(single, a, itemA.UID)
		f.deploymentSet(multi, "", itemA.UID, itemB.UID)
	}) {
		return
	}
	old := snapshots[single.ID]
	sockets[single.ID].Close()
	sockets[single.ID], streams[single.ID] = f.socketHarbor(single)
	if !f.step("reconnect_generation_guard", func() {
		current := readSnapshot(single, streams[single.ID])
		if current.Generation == old.Generation || current.AuthorizationKey != old.AuthorizationKey || current.CredentialGeneration != old.CredentialGeneration {
			f.t.Fatal("reconnect did not rotate only the stream generation")
		}
		snapshots[single.ID] = current
		f.t.Log("REAL reconnect rotated session generation and retained workspace/harbor/tab/authorization/credential binding")
	}) {
		return
	}
	f.step("real_uid_precondition_delete_reaches_all_overlapping_harbors", func() {
		f.rollout(itemA, 1)
		f.guard(f.ctx, a)
		object := f.capture(itemA)
		status, _ := f.gateway(http.MethodDelete, "/api/resources", f.harborResource(single, a, itemA.Name), map[string]interface{}{"uid": string(itemA.UID), "resourceVersion": object.ResourceVersion}, f.nonces[single.ID])
		f.code(status, 202, "real UID/RV-scoped delete")
		for _, h := range []ws.Harbor{single, multi, overlap} {
			readEvent(h, itemA, "DELETE")
		}
		f.absent(a, itemA.Name)
		f.deploymentSet(single, a)
		f.deploymentSet(multi, "", itemB.UID)
		f.deploymentSet(overlap, "", itemB.UID)
		f.capture(itemB)
	})
}

// Keep the fixture's typed HTTP probe declaration compact without accepting any
// browser-provided port or external URL.
func intstrFromInt(port int) intstr.IntOrString { return intstr.FromInt(port) }
