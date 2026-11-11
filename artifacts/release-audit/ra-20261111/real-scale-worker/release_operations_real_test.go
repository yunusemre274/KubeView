package server

// This explicit opt-in owns one temporary profile06 Deployment. It does not
// reuse the profile02 helper or alter the running application gateway.
import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/tools/clientcmd"
)

func TestReleaseOwnedScaleTwoThreeOne(t *testing.T) {
	if os.Getenv("KUBEVIEW_RELEASE_REAL_SCALE") != "owned-profile06-2-3-1" {
		t.Skip("requires explicit owned profile06 scale opt-in")
	}
	started := time.Now()
	output := os.Getenv("KUBEVIEW_RELEASE_REAL_OUTPUT")
	statePath := os.Getenv("KUBEVIEW_RELEASE_REAL_STATE")
	configPath := os.Getenv("KUBEVIEW_RELEASE_REAL_KUBECONFIG")
	const labID = "kvml-d32afbf634e8"
	const contextName = labID + "-a"
	const clusterUID = "e84bb50e-8d64-4bc2-905c-9b5ba193e53a"
	const namespace = "kvml-fbf634e8-06-client"
	const namespaceUID = "863e13d5-da6d-481d-9484-64eb088d8df8"
	const profile = "06-limanlar-arasi-ag"
	const runLabel = "manual.kubeview.local/release-scale-run"
	for _, p := range []string{output, statePath, configPath} {
		if !filepath.IsAbs(p) {
			t.Fatal("explicit absolute owned output/state/config required")
		}
	}
	if filepath.Base(configPath) != "admin.json" || filepath.Dir(filepath.Dir(configPath)) != filepath.Dir(statePath) {
		t.Fatal("private config/state relationship refused")
	}
	evidence := map[string]interface{}{"kind": "real Kubernetes typed/dynamic + production HTTP gateway", "startedAt": started.UTC(), "clusterUID": clusterUID, "namespaceUID": namespaceUID, "profile": profile, "timeline": []interface{}{}}
	var mu sync.Mutex
	var maxGap time.Duration
	var lastWall = time.Now().UnixNano()
	stop := make(chan struct{})
	done := make(chan struct{})
	go func() {
		defer close(done)
		ticker := time.NewTicker(250 * time.Millisecond)
		defer ticker.Stop()
		for {
			select {
			case <-stop:
				return
			case <-ticker.C:
				now := time.Now().UnixNano()
				mu.Lock()
				gap := time.Duration(now - lastWall)
				if gap > maxGap {
					maxGap = gap
				}
				lastWall = now
				mu.Unlock()
			}
		}
	}()
	mark := func(name string, data interface{}) {
		mu.Lock()
		defer mu.Unlock()
		evidence["timeline"] = append(evidence["timeline"].([]interface{}), map[string]interface{}{"at": time.Now().UTC(), "step": name, "proof": data})
	}
	t.Cleanup(func() {
		close(stop)
		<-done
		mu.Lock()
		gap := maxGap
		mu.Unlock()
		if gap > 5*time.Second {
			t.Error("environment sample gap exceeds5s; bounded outcome invalid")
		}
		evidence["maxSampleGapSeconds"] = gap.Seconds()
		evidence["elapsedSeconds"] = time.Since(started).Seconds()
		evidence["failed"] = t.Failed()
		evidence["validBounded"] = !t.Failed() && gap <= 5*time.Second && time.Since(started) <= 180*time.Second
		b, _ := json.MarshalIndent(evidence, "", "  ")
		if err := os.WriteFile(filepath.Join(output, "result.json"), append(b, '\n'), 0644); err != nil {
			t.Error("safe evidence write failed")
		}
	})
	data, err := os.ReadFile(statePath)
	if err != nil {
		t.Fatal("owned lab state unavailable")
	}
	var lab workspaceRealLab
	if json.Unmarshal(data, &lab) != nil || lab.LabID != labID || lab.Clusters["a"].Name != contextName || lab.Clusters["a"].UID != clusterUID || lab.Clusters["a"].MarkerUID != "0cded75c-bc00-472f-b69f-39dfd43251f3" {
		t.Fatal("owned lab manifest identity refused")
	}
	found := false
	for _, n := range lab.Profiles[profile].Namespaces {
		if n.Name == namespace && n.UID == namespaceUID && n.Cluster == "a" {
			found = true
		}
	}
	if !found {
		t.Fatal("explicit profile06 namespace not in manifest")
	}
	raw, err := clientcmd.LoadFromFile(configPath)
	if err != nil || raw.Contexts[contextName] == nil {
		t.Fatal("explicit private config context unavailable")
	}
	cc := raw.Contexts[contextName]
	cl := raw.Clusters[cc.Cluster]
	auth := raw.AuthInfos[cc.AuthInfo]
	if cl == nil || auth == nil || auth.Exec != nil || auth.AuthProvider != nil {
		t.Fatal("config cluster or static auth guard refused")
	}
	apiURL, err := url.Parse(cl.Server)
	if err != nil || apiURL.Scheme != "https" || apiURL.User != nil || apiURL.RawQuery != "" {
		t.Fatal("explicit API URL refused")
	}
	ip := net.ParseIP(apiURL.Hostname())
	if ip == nil || !ip.IsLoopback() {
		t.Fatal("owned API endpoint must be loopback")
	}
	t.Setenv("KUBECONFIG", configPath)
	t.Setenv("KUBE_CONTEXT", contextName)
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	t.Setenv("KUBEVIEW_REPLAY", "")
	s := New()
	s.ReadOnly = false
	s.Namespace = namespace
	s.Token = ""
	t.Cleanup(s.Close)
	c, err := s.client(contextName)
	if err != nil {
		t.Fatal("explicit owned API client unavailable")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 135*time.Second)
	t.Cleanup(cancel)
	guard := func(ctx context.Context) error {
		system, e := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
		if e != nil || string(system.UID) != clusterUID {
			return fmt.Errorf("cluster UID guard")
		}
		marker, e := c.Typed.CoreV1().ConfigMaps("kube-system").Get(ctx, "kubeview-manual-lab-owner", metav1.GetOptions{})
		if e != nil || string(marker.UID) != lab.Clusters["a"].MarkerUID || marker.Labels[workspaceRealOwnerLabel] != labID {
			return fmt.Errorf("owner marker guard")
		}
		ns, e := c.Typed.CoreV1().Namespaces().Get(ctx, namespace, metav1.GetOptions{})
		if e != nil || string(ns.UID) != namespaceUID || ns.Labels[workspaceRealOwnerLabel] != labID || ns.Labels[workspaceRealProfileLabel] != profile {
			return fmt.Errorf("namespace UID/owner/profile guard")
		}
		return nil
	}
	if err = guard(ctx); err != nil {
		t.Fatal("pre-mutation identity guard failed")
	}
	worker, err := c.Typed.CoreV1().Nodes().Get(ctx, lab.Clusters["a"].Worker, metav1.GetOptions{})
	if err != nil || string(worker.UID) != lab.Clusters["a"].NodeUIDs[worker.Name] {
		t.Fatal("worker UID guard failed")
	}
	mark("identity_allowlist", map[string]interface{}{"apiLoopback": apiURL.Host, "clusterUID": clusterUID, "namespaceUID": namespaceUID, "workerUID": worker.UID})
	type fixtureProof struct {
		UID     types.UID `json:"uid"`
		SpecSHA string    `json:"specSHA256"`
		PodUIDs []string  `json:"podUIDs"`
	}
	hash := func(x interface{}) string {
		b, _ := json.Marshal(x)
		d := sha256.Sum256(b)
		return hex.EncodeToString(d[:])
	}
	captureFixture := func(ns, name string, expected types.UID) fixtureProof {
		d, e := c.Typed.AppsV1().Deployments(ns).Get(ctx, name, metav1.GetOptions{})
		if e != nil || d.UID != expected || d.Labels[workspaceRealOwnerLabel] != labID || d.Labels[workspaceRealProfileLabel] != profile {
			t.Fatal("existing fixture identity guard failed")
		}
		sel, e := metav1.LabelSelectorAsSelector(d.Spec.Selector)
		if e != nil {
			t.Fatal("fixture selector unavailable")
		}
		pods, e := c.Typed.CoreV1().Pods(ns).List(ctx, metav1.ListOptions{LabelSelector: sel.String()})
		if e != nil {
			t.Fatal("fixture Pod read failed")
		}
		uids := []string{}
		for _, pod := range pods.Items {
			uids = append(uids, string(pod.UID))
		}
		sort.Strings(uids)
		return fixtureProof{d.UID, hash(d.Spec), uids}
	}
	serverBefore := captureFixture("kvml-fbf634e8-06-server", "http-server", "fff4de0c-4ef4-46d1-8255-4c98dc9fe921")
	trafficBefore := captureFixture(namespace, "traffic", "4a3780de-63c1-4df7-89f1-1021f26c44d7")
	checkFixtures := func() {
		if !reflect.DeepEqual(serverBefore, captureFixture("kvml-fbf634e8-06-server", "http-server", serverBefore.UID)) || !reflect.DeepEqual(trafficBefore, captureFixture(namespace, "traffic", trafficBefore.UID)) {
			t.Fatal("existing fixture UID/spec/PodUID changed")
		}
		mark("other_fixtures_unchanged", map[string]interface{}{"server": serverBefore, "traffic": trafficBefore})
	}
	if err = s.ConfigureWorkspace(t.TempDir(), contextName, namespace); err != nil {
		t.Fatal("isolated workspace unavailable")
	}
	doc := s.workspace.store.Snapshot()
	var harbor ws.Harbor
	for _, h := range doc.Harbors {
		if reflect.DeepEqual(h.Namespaces, []string{namespace}) {
			harbor = h
		}
	}
	if harbor.ID == "" {
		t.Fatal("isolated scoped harbor unavailable")
	}
	mux := http.NewServeMux()
	s.Register(mux)
	gateway := httptest.NewServer(mux)
	t.Cleanup(gateway.Close)
	base, _ := url.Parse(gateway.URL)
	if ip := net.ParseIP(base.Hostname()); ip == nil || !ip.IsLoopback() {
		t.Fatal("gateway loopback guard")
	}
	evidence["gatewayURL"] = gateway.URL
	mark("isolated_gateway", map[string]interface{}{"loopbackURL": gateway.URL, "workspaceID": doc.ID, "harborID": harbor.ID, "activeAppPortUntouched": 19846})
	jar, _ := cookiejar.New(nil)
	transport := &http.Transport{Proxy: nil, ResponseHeaderTimeout: 4 * time.Second}
	t.Cleanup(transport.CloseIdleConnections)
	client := &http.Client{Jar: jar, Transport: transport, Timeout: 5 * time.Second}
	scope := url.Values{"workspaceId": {doc.ID}, "harborId": {harbor.ID}, "tabId": {"owned-scale-phase"}}
	nonce := ""
	req := func(method, path string, q url.Values, body interface{}) workspaceAcceptanceResponse {
		return workspaceAcceptanceRequest(ctx, client, base, method, path, q, body, nonce, "")
	}
	requireCode := func(v workspaceAcceptanceResponse, want int, label string) {
		if v.err != nil || v.status != want {
			t.Fatalf("%s HTTP%d expected%d; no response body logged", label, v.status, want)
		}
		mark(label, map[string]interface{}{"httpStatus": v.status})
	}
	diagnostic := req("GET", "/api/connection", scope, nil)
	requireCode(diagnostic, 200, "readonly_session_diagnostic")
	var info struct {
		ConnectionID      string             `json:"connectionID"`
		ReadOnly          bool               `json:"readOnly"`
		ManagementEnabled bool               `json:"managementEnabled"`
		Identity          connectionIdentity `json:"identity"`
	}
	if json.Unmarshal(diagnostic.body, &info) != nil || info.ConnectionID == "" || !info.ReadOnly || info.ManagementEnabled || info.Identity.ClusterUID != clusterUID || info.Identity.Confidence != "verified" {
		t.Fatal("gateway session identity/readonly guard")
	}
	nonce = info.ConnectionID
	runID := "scale-" + strings.ReplaceAll(uuid.NewString(), "-", "")[:16]
	name := "qa-" + runID
	selector := runLabel + "=" + runID
	var ownedUID types.UID
	cleanup := func() {
		clean, stopClean := context.WithTimeout(context.Background(), 35*time.Second)
		defer stopClean()
		if e := guard(clean); e != nil {
			t.Error("cleanup identity guard failed")
			return
		}
		d, e := c.Typed.AppsV1().Deployments(namespace).Get(clean, name, metav1.GetOptions{})
		if e == nil {
			if d.Labels[runLabel] != runID || d.Labels[workspaceRealOwnerLabel] != labID || (ownedUID != "" && d.UID != ownedUID) {
				t.Error("cleanup ownership guard refused")
				return
			}
			ownedUID = d.UID
			rv := d.ResourceVersion
			fg := metav1.DeletePropagationForeground
			five := int64(5)
			e = c.Typed.AppsV1().Deployments(namespace).Delete(clean, name, metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &ownedUID, ResourceVersion: &rv}, PropagationPolicy: &fg, GracePeriodSeconds: &five})
			if e != nil && !apierrors.IsNotFound(e) {
				t.Error("UID/RV cleanup rejected")
				return
			}
		} else if !apierrors.IsNotFound(e) {
			t.Error("cleanup GET unavailable")
			return
		}
		gvr := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
		for clean.Err() == nil {
			_, e1 := c.Typed.AppsV1().Deployments(namespace).Get(clean, name, metav1.GetOptions{})
			_, e2 := c.Dynamic.Resource(gvr).Namespace(namespace).Get(clean, name, metav1.GetOptions{})
			pods, e3 := c.Typed.CoreV1().Pods(namespace).List(clean, metav1.ListOptions{LabelSelector: selector})
			sets, e4 := c.Typed.AppsV1().ReplicaSets(namespace).List(clean, metav1.ListOptions{LabelSelector: selector})
			if apierrors.IsNotFound(e1) && apierrors.IsNotFound(e2) && e3 == nil && e4 == nil && len(pods.Items) == 0 && len(sets.Items) == 0 {
				mark("cleanup_verified", map[string]interface{}{"deploymentUID": ownedUID, "typedGET404": true, "dynamicGVKGET404": true, "podLabelListCount": 0, "replicaSetLabelListCount": 0, "UIDAndRVDeletePreconditions": true})
				evidence["cleanupVerified"] = true
				return
			}
			time.Sleep(200 * time.Millisecond)
		}
		t.Error("owned cleanup absence deadline")
	}
	t.Cleanup(cleanup)
	if _, e := c.Typed.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{}); !apierrors.IsNotFound(e) {
		t.Fatal("unique fixture absence not proved")
	}
	labels := map[string]string{runLabel: runID, workspaceRealOwnerLabel: labID, workspaceRealProfileLabel: profile}
	two := int32(2)
	five := int64(5)
	dep := &appsv1.Deployment{TypeMeta: metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"}, ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace, Labels: labels}, Spec: appsv1.DeploymentSpec{Replicas: &two, Selector: &metav1.LabelSelector{MatchLabels: map[string]string{runLabel: runID}}, Strategy: appsv1.DeploymentStrategy{Type: appsv1.RecreateDeploymentStrategyType}, Template: corev1.PodTemplateSpec{ObjectMeta: metav1.ObjectMeta{Labels: labels}, Spec: corev1.PodSpec{TerminationGracePeriodSeconds: &five, NodeSelector: map[string]string{"kubernetes.io/hostname": worker.Name}, Containers: []corev1.Container{{Name: "idle", Image: "busybox:1.37.0", ImagePullPolicy: corev1.PullIfNotPresent, Command: []string{"sh", "-c", "trap 'exit 0' TERM; while true; do sleep 1; done"}, Resources: corev1.ResourceRequirements{Requests: corev1.ResourceList{corev1.ResourceCPU: resource.MustParse("5m"), corev1.ResourceMemory: resource.MustParse("8Mi")}, Limits: corev1.ResourceList{corev1.ResourceCPU: resource.MustParse("50m"), corev1.ResourceMemory: resource.MustParse("32Mi")}}}}}}}}
	q := url.Values{}
	for k, v := range scope {
		q[k] = v
	}
	q.Set("group", "apps")
	q.Set("version", "v1")
	q.Set("resource", "deployments")
	q.Set("namespace", namespace)
	// Prove production session grant enforcement without mutating Kubernetes.
	requireCode(req("POST", "/api/resources", q, map[string]interface{}{"object": dep}), 403, "readonly_create_rejected")
	requireCode(req("POST", "/api/management", scope, map[string]interface{}{"enabled": true, "context": contextName, "namespace": namespace, "connectionID": nonce}), 200, "explicit_management_grant")
	if err = guard(ctx); err != nil {
		t.Fatal("pre-create guard")
	}
	requireCode(req("POST", "/api/resources", q, map[string]interface{}{"object": dep}), 201, "owned_deployment_create")
	gvr := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	readReady := func(want int32) *appsv1.Deployment {
		until := time.Now().Add(40 * time.Second)
		for time.Now().Before(until) && ctx.Err() == nil {
			d, e := c.Typed.AppsV1().Deployments(namespace).Get(ctx, name, metav1.GetOptions{})
			if e != nil || d.Labels[runLabel] != runID || d.Labels[workspaceRealOwnerLabel] != labID {
				t.Fatal("owned typed GET identity failed")
			}
			if ownedUID != "" && d.UID != ownedUID {
				t.Fatal("owned UID changed")
			}
			ownedUID = d.UID
			u, e := c.Dynamic.Resource(gvr).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
			if e != nil || u.GetUID() != ownedUID || u.GetKind() != "Deployment" || u.GetAPIVersion() != "apps/v1" {
				t.Fatal("dynamic GVK/UID readback failed")
			}
			pods, e := c.Typed.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{LabelSelector: selector})
			if e != nil {
				t.Fatal("owned Pod LIST failed")
			}
			if len(pods.Items) > 3 {
				t.Fatal("more than3ownedPods")
			}
			ready := int32(0)
			chain := []interface{}{}
			for _, pod := range pods.Items {
				ok := false
				for _, condition := range pod.Status.Conditions {
					if condition.Type == corev1.PodReady && condition.Status == corev1.ConditionTrue && pod.DeletionTimestamp == nil {
						ok = true
					}
				}
				if !ok {
					continue
				}
				if pod.Labels[runLabel] != runID || pod.Spec.NodeName != worker.Name {
					t.Fatal("Pod owner/node guard")
				}
				linked := false
				for _, ref := range pod.OwnerReferences {
					if ref.Kind != "ReplicaSet" || ref.Controller == nil || !*ref.Controller {
						continue
					}
					rs, e := c.Typed.AppsV1().ReplicaSets(namespace).Get(ctx, ref.Name, metav1.GetOptions{})
					if e != nil || rs.UID != ref.UID || rs.Labels[runLabel] != runID {
						t.Fatal("ReplicaSet UID guard")
					}
					for _, parent := range rs.OwnerReferences {
						if parent.Kind == "Deployment" && parent.UID == ownedUID && parent.Controller != nil && *parent.Controller {
							linked = true
							chain = append(chain, map[string]interface{}{"podUID": pod.UID, "replicaSetUID": rs.UID, "deploymentUID": ownedUID})
						}
					}
				}
				if !linked {
					t.Fatal("Pod→ReplicaSet→Deployment chain missing")
				}
				ready++
			}
			if d.Spec.Replicas != nil && *d.Spec.Replicas == want && d.Status.ObservedGeneration >= d.Generation && d.Status.Replicas == want && d.Status.ReadyReplicas == want && d.Status.AvailableReplicas == want && d.Status.UpdatedReplicas == want && ready == want && len(pods.Items) == int(want) {
				mark("actual_rollout_ready", map[string]interface{}{"replicas": want, "UID": ownedUID, "resourceVersion": d.ResourceVersion, "generation": d.Generation, "observedGeneration": d.Status.ObservedGeneration, "typedDynamicUIDMatch": true, "ownerChains": chain})
				return d
			}
			time.Sleep(300 * time.Millisecond)
		}
		t.Fatal("actual controller/Ready convergence deadline")
		return nil
	}
	initial := readReady(2)
	checkFixtures()
	action := func(d *appsv1.Deployment, want int64, uid, rv string) workspaceAcceptanceResponse {
		return req("POST", "/api/actions", scope, Action{Context: contextName, Group: "apps", Version: "v1", Resource: "deployments", Namespace: namespace, Name: name, UID: uid, ResourceVersion: rv, Action: "scale", Replicas: want})
	}
	if err = guard(ctx); err != nil {
		t.Fatal("pre-negative guard")
	}
	requireCode(action(initial, 3, "synthetic-wrong-uid", initial.ResourceVersion), 409, "stale_UID_scale_rejected")
	if err = guard(ctx); err != nil {
		t.Fatal("pre-scale3 guard")
	}
	requireCode(action(initial, 3, string(ownedUID), initial.ResourceVersion), 202, "scale_to3_HTTP_accepted")
	three := readReady(3)
	checkFixtures()
	if err = guard(ctx); err != nil {
		t.Fatal("pre-staleRV guard")
	}
	requireCode(action(three, 1, string(ownedUID), initial.ResourceVersion), 409, "stale_RV_scale_rejected")
	if err = guard(ctx); err != nil {
		t.Fatal("pre-scale1 guard")
	}
	requireCode(action(three, 1, string(ownedUID), three.ResourceVersion), 202, "scale_to1_HTTP_accepted")
	one := readReady(1)
	if one.Generation <= initial.Generation {
		t.Fatal("scale generation did not advance")
	}
	checkFixtures()
	mark("scale_sequence_complete", []int{2, 3, 1})
}
