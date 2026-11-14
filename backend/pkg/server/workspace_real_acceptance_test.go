package server

// These opt-in phases use the existing owned-lab guards and 150s + 35s cleanup
// contract. Preparing this source does not authorize starting a gateway or lab.
import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	ws "github.com/k8s-tersane/tersane/backend/pkg/workspace"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

type workspaceAcceptanceResponse struct {
	status int
	body   []byte
	err    error
}

// Return errors to the owning test goroutine. In particular, a concurrent
// request must never call Fatal from a worker goroutine or retry a mutation.
func workspaceAcceptanceRequest(ctx context.Context, client *http.Client, base *url.URL, method, path string, query url.Values, body interface{}, connectionNonce, workspaceNonce string) workspaceAcceptanceResponse {
	var payload []byte
	if body != nil {
		var err error
		payload, err = json.Marshal(body)
		if err != nil {
			return workspaceAcceptanceResponse{err: errors.New("acceptance request encoding failed")}
		}
	}
	target := *base
	target.Path = path
	target.RawQuery = query.Encode()
	request, err := http.NewRequestWithContext(ctx, method, target.String(), bytes.NewReader(payload))
	if err != nil {
		return workspaceAcceptanceResponse{err: errors.New("acceptance request construction failed")}
	}
	request.Header.Set("Origin", base.Scheme+"://"+base.Host)
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if connectionNonce != "" {
		request.Header.Set("X-KubeView-Connection", connectionNonce)
	}
	if workspaceNonce != "" && strings.HasPrefix(path, "/api/workspace") && method != http.MethodGet {
		request.Header.Set("X-KubeView-Workspace-Nonce", workspaceNonce)
	}
	response, err := client.Do(request)
	if err != nil {
		return workspaceAcceptanceResponse{err: err}
	}
	defer response.Body.Close()
	data, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
	return workspaceAcceptanceResponse{status: response.StatusCode, body: data, err: err}
}

func workspaceAcceptanceOperationTarget(f *workspaceRealRun, body []byte, harbor ws.Harbor, item *workspaceRealOwned) {
	f.t.Helper()
	var response struct {
		Operation struct {
			ID          string                   `json:"id"`
			Status      string                   `json:"status"`
			WorkspaceID string                   `json:"workspaceId"`
			HarborID    string                   `json:"harborId"`
			Target      workspaceOperationTarget `json:"target"`
		} `json:"operation"`
	}
	if json.Unmarshal(body, &response) != nil || response.Operation.ID == "" || response.Operation.Status != "accepted" || response.Operation.WorkspaceID != f.doc.ID || response.Operation.HarborID != harbor.ID || response.Operation.Target.Group != "apps" || response.Operation.Target.Resource != "deployments" || response.Operation.Target.Namespace != item.Namespace || response.Operation.Target.Name != item.Name || response.Operation.Target.UID != string(item.UID) {
		f.t.Fatal("accepted operation lost its exact workspace/harbor/namespace/name/UID target")
	}
}

var workspaceAcceptanceSuppressedResponse = errors.New("known accepted response intentionally suppressed by test transport")

type workspaceAcceptanceSuppressResponse struct {
	base     http.RoundTripper
	observed chan int
}

func (r workspaceAcceptanceSuppressResponse) RoundTrip(request *http.Request) (*http.Response, error) {
	response, err := r.base.RoundTrip(request)
	if err != nil {
		return nil, err
	}
	_, readErr := io.Copy(io.Discard, io.LimitReader(response.Body, 2<<20))
	response.Body.Close()
	select {
	case r.observed <- response.StatusCode:
	default:
		return nil, errors.New("response suppression observed an unexpected additional request")
	}
	if readErr != nil {
		return nil, readErr
	}
	return nil, workspaceAcceptanceSuppressedResponse
}

func TestOwnedWorkspaceRealConcurrentOperationsAcceptance(t *testing.T) {
	f := newWorkspaceRealRun(t, "operations-acceptance")
	a, b := f.namespaces[0], f.namespaces[1]
	var itemA, itemB *workspaceRealOwned
	var beforeA, beforeB *appsv1.Deployment
	var bSpec []byte
	var bPods []string
	marker := "manual.kubeview.local/ws-acceptance-operation"
	if !f.step("owned_distinct_harbor_fixtures_ready", func() {
		f.diagnostic(a)
		f.enable(a)
		f.diagnostic(b)
		f.enable(b)
		itemA = f.createHarborFixture(f.harbors[a], a, f.runID+"-concurrent-a", "")
		itemB = f.createHarborFixture(f.harbors[b], b, f.runID+"-concurrent-b", "")
		beforeA, beforeB = f.rollout(itemA, 1), f.rollout(itemB, 1)
		bSpec, _ = json.Marshal(beforeB.Spec)
		bPods = f.podUIDSet(itemB)
		if itemA.UID == itemB.UID || len(bPods) != 1 {
			f.t.Fatal("distinct exact UID/Ready fixtures unavailable")
		}
	}) {
		return
	}
	if !f.step("concurrent_duplicate_scale_and_other_harbor_update", func() {
		f.guard(f.ctx, a)
		f.guard(f.ctx, b)
		action := Action{Context: f.lab.Clusters["a"].Name, Group: "apps", Version: "v1", Resource: "deployments", Namespace: a, Name: itemA.Name, UID: string(itemA.UID), ResourceVersion: beforeA.ResourceVersion, Action: "scale", Replicas: 2}
		updatedB := beforeB.DeepCopy()
		updatedB.TypeMeta = metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"}
		if updatedB.Annotations == nil {
			updatedB.Annotations = map[string]string{}
		}
		updatedB.Annotations[marker] = f.runID + "-concurrent"
		type result struct {
			target   string
			response workspaceAcceptanceResponse
		}
		barrier := make(chan struct{})
		results := make(chan result, 3)
		for index := 0; index < 2; index++ {
			go func() {
				<-barrier
				results <- result{"a", workspaceAcceptanceRequest(f.ctx, f.http, f.base, http.MethodPost, "/api/actions", f.scope(a), action, f.nonces[a], "")}
			}()
		}
		go func() {
			<-barrier
			results <- result{"b", workspaceAcceptanceRequest(f.ctx, f.http, f.base, http.MethodPut, "/api/resources", f.resourceQuery(b, itemB.Name), map[string]interface{}{"object": updatedB}, f.nonces[b], "")}
		}()
		close(barrier)
		completedRequests := make([]result, 0, 3)
		for index := 0; index < 3; index++ {
			select {
			case completed := <-results:
				completedRequests = append(completedRequests, completed)
			case <-f.ctx.Done():
				f.t.Fatal("concurrent owned requests exceeded phase deadline; no retry")
			}
		}
		accepted, conflicts := 0, 0
		for _, completed := range completedRequests {
			if completed.response.err != nil {
				f.t.Fatal("concurrent transport outcome unavailable; owned cleanup/reconciliation only, no retry")
			}
			if completed.target == "a" {
				switch completed.response.status {
				case http.StatusAccepted:
					accepted++
					workspaceAcceptanceOperationTarget(f, completed.response.body, f.harbors[a], itemA)
				case http.StatusConflict:
					conflicts++
				default:
					f.t.Fatalf("duplicate exact UID/RV scale HTTP%d", completed.response.status)
				}
			} else {
				f.code(completed.response.status, http.StatusOK, "concurrent other-harbor metadata update")
				workspaceAcceptanceOperationTarget(f, completed.response.body, f.harbors[b], itemB)
			}
		}
		if accepted != 1 || conflicts != 1 {
			f.t.Fatal("identical concurrent UID/RV scale must produce one acceptance and one conflict")
		}
		afterA, afterB := f.rollout(itemA, 2), f.capture(itemB)
		afterBSpec, _ := json.Marshal(afterB.Spec)
		afterBPods := f.podUIDSet(itemB)
		f.t.Logf("READBACK concurrent A generation=%d expected=%d; B generation=%d expected=%d; BSpecEqual=%t BPodUIDsEqual=%t", afterA.Generation, beforeA.Generation+1, afterB.Generation, beforeB.Generation+1, bytes.Equal(bSpec, afterBSpec), reflect.DeepEqual(afterBPods, bPods))
		if afterA.Generation != beforeA.Generation+1 {
			f.t.Fatal("duplicate scale did not produce exactly one A generation increment")
		}
		if afterA.Annotations[marker] != beforeA.Annotations[marker] {
			f.t.Fatal("B metadata update crossed into A annotations")
		}
		if !bytes.Equal(bSpec, afterBSpec) {
			f.t.Fatal("concurrent A scale changed B workload spec")
		}
		// Deployment annotation updates increment generation even when spec is
		// unchanged: Kubernetes v1.35.1 deployment/strategy.go PrepareForUpdate.
		// https://raw.githubusercontent.com/kubernetes/kubernetes/v1.35.1/pkg/registry/apps/deployment/strategy.go
		if afterB.Generation != beforeB.Generation+1 {
			f.t.Fatal("one B annotation PUT did not produce exactly one B generation increment")
		}
		if afterB.Annotations[marker] != f.runID+"-concurrent" {
			f.t.Fatal("concurrent B metadata annotation did not persist on B")
		}
		if !reflect.DeepEqual(afterBPods, bPods) {
			f.t.Fatal("concurrent operations replaced B Pod UIDs")
		}
		f.t.Log("REAL concurrent dispatch: A identical UID/RV scale accepted1/conflict1; B metadata PUT accepted; exact UID readbacks and B Spec/PodUID isolation verified")
	}) {
		return
	}
	if !f.step("known_accepted_response_suppression_reread_without_retry", func() {
		before := f.capture(itemB)
		object := before.DeepCopy()
		object.TypeMeta = metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"}
		object.Annotations[marker] = f.runID + "-suppressed-response"
		observed := make(chan int, 1)
		client := &http.Client{Jar: f.http.Jar, Timeout: 18 * time.Second, Transport: workspaceAcceptanceSuppressResponse{base: f.http.Transport, observed: observed}}
		f.guard(f.ctx, b)
		response := workspaceAcceptanceRequest(f.ctx, client, f.base, http.MethodPut, "/api/resources", f.resourceQuery(b, itemB.Name), map[string]interface{}{"object": object}, f.nonces[b], "")
		if !errors.Is(response.err, workspaceAcceptanceSuppressedResponse) {
			f.t.Fatal("known-accepted response suppression was not reached; no retry")
		}
		select {
		case status := <-observed:
			f.code(status, http.StatusOK, "upstream acceptance before intentional response suppression")
		default:
			f.t.Fatal("suppressed response lacks upstream acceptance observation")
		}
		after := f.capture(itemB)
		status, body := f.gateway(http.MethodGet, "/api/resources", f.resourceQuery(b, itemB.Name), nil, "")
		f.code(status, http.StatusOK, "original-harbor GET reconciles suppressed response")
		var reconciled appsv1.Deployment
		if json.Unmarshal(body, &reconciled) != nil || reconciled.UID != itemB.UID || reconciled.Annotations[marker] != f.runID+"-suppressed-response" {
			f.t.Fatal("original-harbor HTTP GET could not reconcile the suppressed exact UID effect")
		}
		afterSpec, _ := json.Marshal(after.Spec)
		currentA := f.capture(itemA)
		afterPods := f.podUIDSet(itemB)
		f.t.Logf("READBACK suppressed B generation=%d expected=%d; RVChanged=%t BSpecEqual=%t BPodUIDsEqual=%t", after.Generation, before.Generation+1, after.ResourceVersion != before.ResourceVersion, bytes.Equal(afterSpec, bSpec), reflect.DeepEqual(afterPods, bPods))
		if after.ResourceVersion == before.ResourceVersion {
			f.t.Fatal("suppressed annotation PUT did not advance B resourceVersion")
		}
		if after.Generation != before.Generation+1 {
			f.t.Fatal("one suppressed B annotation PUT did not produce exactly one B generation increment")
		}
		if after.Annotations[marker] != f.runID+"-suppressed-response" {
			f.t.Fatal("suppressed annotation PUT could not be reconciled on exact B UID")
		}
		if !bytes.Equal(afterSpec, bSpec) {
			f.t.Fatal("suppressed annotation PUT changed B workload spec")
		}
		if !reflect.DeepEqual(afterPods, bPods) {
			f.t.Fatal("suppressed annotation PUT replaced B Pod UIDs")
		}
		if currentA.Spec.Replicas == nil || *currentA.Spec.Replicas != 2 {
			f.t.Fatal("suppressed B metadata update changed A replica target")
		}
		f.t.Log("KNOWN_ACCEPTED_RESPONSE_SIMULATION: one upstream200 PUT response intentionally suppressed; exact UID GET reconciled effect; no retry. Real network timeout/cancel remains NOT RUN")
	}) {
		return
	}
	f.step("default_workspace_records_unchanged", func() {
		workspaceAcceptanceDefaultDocument(f, f.ctx)
	})
}

// Root creates this receipt beside the private lab configuration only after the
// exclusive performance lease releases. The test never starts or kills a server.
type workspaceAcceptanceSession struct {
	SchemaVersion int    `json:"schemaVersion"`
	Purpose       string `json:"purpose"`
	LabID         string `json:"labId"`
	ClusterUID    string `json:"clusterUID"`
	WorkspaceID   string `json:"workspaceId"`
	PID           int    `json:"pid"`
	BaseURL       string `json:"baseURL"`
	BinarySHA     string `json:"binarySha256"`
	DataDir       string `json:"dataDir"`
}

type workspaceAcceptanceWorkspace struct {
	f                *workspaceRealRun
	base             *url.URL
	http             *http.Client
	doc              ws.Document
	original         ws.Document
	nonce            string
	workspaceID      string
	selector         string
	connections      map[string]ws.Connection
	harbors          map[string]ws.Harbor
	kubernetesBefore string
}

func newWorkspaceAcceptanceWorkspace(f *workspaceRealRun) *workspaceAcceptanceWorkspace {
	f.t.Helper()
	path := os.Getenv("KUBEVIEW_WORKSPACE_REAL_ACCEPTANCE_SESSION")
	info, err := os.Lstat(path)
	if path == "" || !filepath.IsAbs(path) || err != nil || !info.Mode().IsRegular() || info.Mode().Perm()&0077 != 0 {
		f.t.Fatal("explicit private fresh QA session receipt required")
	}
	data, err := os.ReadFile(path)
	var session workspaceAcceptanceSession
	if err != nil || json.Unmarshal(data, &session) != nil || session.SchemaVersion != 1 || session.Purpose != "workspace-record-acceptance" || session.LabID != f.lab.LabID || session.ClusterUID != f.clusterUID || session.PID <= 0 || session.BinarySHA != f.proof.BinarySHA || session.WorkspaceID == "" || session.WorkspaceID == f.doc.ID || !filepath.IsAbs(session.DataDir) || !strings.HasPrefix(filepath.Base(session.DataDir), "qa-ws-acceptance-") {
		f.t.Fatal("fresh QA receipt identity/binary/data-dir guard failed")
	}
	directory, err := os.Lstat(session.DataDir)
	if err != nil || !directory.IsDir() || directory.Mode().Perm()&0077 != 0 {
		f.t.Fatal("fresh QA data-dir must be a real private directory")
	}
	base, err := url.Parse(session.BaseURL)
	if err != nil || base.User != nil || base.RawQuery != "" || base.Fragment != "" || (base.Path != "" && base.Path != "/") || (base.Scheme != "http" && base.Scheme != "https") || base.Port() == "" || base.Port() == f.base.Port() {
		f.t.Fatal("fresh QA gateway must use an explicit distinct loopback port")
	}
	ip := net.ParseIP(base.Hostname())
	if base.Hostname() != "localhost" && (ip == nil || !ip.IsLoopback()) {
		f.t.Fatal("fresh QA gateway must be loopback")
	}
	jar, _ := cookiejar.New(nil)
	q := &workspaceAcceptanceWorkspace{f: f, base: base, http: &http.Client{Jar: jar, Transport: f.http.Transport, Timeout: 18 * time.Second}, workspaceID: session.WorkspaceID, selector: workspaceRealOwnerLabel + "=" + f.lab.LabID + "," + workspaceRealProfileLabel + "=02-ortak-kume", connections: map[string]ws.Connection{}, harbors: map[string]ws.Harbor{}}
	response := q.request(f.ctx, http.MethodGet, "/api/workspace", nil, nil, "")
	f.code(response.status, http.StatusOK, "fresh QA workspace bootstrap")
	q.accept(response.body)
	if len(q.doc.Connections) != 0 || len(q.doc.Harbors) != 0 || len(q.doc.Relations) != 0 {
		f.t.Fatal("fresh QA workspace is not empty; refusing existing app records")
	}
	q.original = q.doc
	return q
}

func (q *workspaceAcceptanceWorkspace) request(ctx context.Context, method, path string, query url.Values, body interface{}, connectionNonce string) workspaceAcceptanceResponse {
	response := workspaceAcceptanceRequest(ctx, q.http, q.base, method, path, query, body, connectionNonce, q.nonce)
	if response.err != nil {
		q.f.t.Fatal("fresh QA native API transport outcome unavailable; no retry")
	}
	return response
}

func (q *workspaceAcceptanceWorkspace) accept(body []byte) {
	q.f.t.Helper()
	var document ws.Document
	var metadata struct {
		Nonce string `json:"workspaceNonce"`
	}
	if json.Unmarshal(body, &document) != nil || json.Unmarshal(body, &metadata) != nil || document.ID != q.workspaceID || metadata.Nonce == "" {
		q.f.t.Fatal("fresh QA workspace identity/nonce response mismatch")
	}
	for _, connection := range document.Connections {
		if !strings.HasPrefix(connection.Name, q.f.runID+"-") || (connection.Context != "" && connection.Context != q.f.lab.Clusters["a"].Name) {
			q.f.t.Fatal("fresh QA workspace contains an unowned connection; cleanup must refuse it")
		}
		q.connections[connection.ID] = connection
	}
	for _, harbor := range document.Harbors {
		if !strings.HasPrefix(harbor.Name, q.f.runID+"-") || harbor.WorkspaceID != q.workspaceID || !reflect.DeepEqual(harbor.Namespaces, []string{q.f.namespaces[0]}) || harbor.Selector != q.selector {
			q.f.t.Fatal("fresh QA workspace contains an unowned harbor; cleanup must refuse it")
		}
		if _, owned := q.connections[harbor.ConnectionRef]; !owned {
			q.f.t.Fatal("fresh QA harbor connection ownership unavailable")
		}
		q.harbors[harbor.ID] = harbor
	}
	q.doc, q.nonce = document, metadata.Nonce
}

func (q *workspaceAcceptanceWorkspace) mutate(ctx context.Context, method, path string, body map[string]interface{}) {
	body["revision"] = q.doc.Revision
	response := q.request(ctx, method, path, nil, body, "")
	q.f.code(response.status, http.StatusOK, "fresh QA native workspace mutation")
	q.accept(response.body)
}

func (q *workspaceAcceptanceWorkspace) scope(harborID string) url.Values {
	return url.Values{"workspaceId": {q.workspaceID}, "harborId": {harborID}, "tabId": {q.f.tab}}
}

func (q *workspaceAcceptanceWorkspace) resource(harborID string, item *workspaceRealOwned) url.Values {
	query := q.scope(harborID)
	query.Set("group", "apps")
	query.Set("version", "v1")
	query.Set("resource", "deployments")
	query.Set("namespace", item.Namespace)
	query.Set("name", item.Name)
	return query
}

func (q *workspaceAcceptanceWorkspace) readCanary(harborID string, item *workspaceRealOwned) {
	response := q.request(q.f.ctx, http.MethodGet, "/api/resources", q.resource(harborID, item), nil, "")
	q.f.code(response.status, http.StatusOK, "fresh QA scoped canary GET")
	var object appsv1.Deployment
	if json.Unmarshal(response.body, &object) != nil || object.UID != item.UID || object.Name != item.Name || object.Namespace != item.Namespace {
		q.f.t.Fatal("fresh QA app-record operation changed canary identity or scope")
	}
}

// H only reads an existing owned lab fixture. It never registers this UID in
// f.owned, so the existing cleanup cannot delete a manual user's Deployment.
func workspaceAcceptanceLabCanary(f *workspaceRealRun, namespace string) *appsv1.Deployment {
	f.t.Helper()
	f.guard(f.ctx, namespace)
	object, err := f.admin.AppsV1().Deployments(namespace).Get(f.ctx, "web", metav1.GetOptions{})
	if err != nil || object.UID == "" || object.Labels[workspaceRealOwnerLabel] != f.lab.LabID || object.Labels[workspaceRealProfileLabel] != "02-ortak-kume" || object.Status.ObservedGeneration < object.Generation || object.Status.ReadyReplicas < 1 {
		f.t.Fatal("existing exact-owner profile02 web canary must be Ready; no reset or mutation attempted")
	}
	return object
}

// Hash only Deployment/Pod identity, metadata and spec in the two guarded
// namespaces. Status/RV churn is not a Kubernetes write by this test. No Secret
// or ConfigMap body is read, and no Kubernetes payload is written to evidence.
func workspaceAcceptanceKubernetesFingerprint(f *workspaceRealRun, ctx context.Context) string {
	f.t.Helper()
	objects := map[string]interface{}{}
	for _, namespace := range f.namespaces {
		f.guard(ctx, namespace)
		deployments, err := f.admin.AppsV1().Deployments(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			f.t.Fatal("guarded Deployment readback unavailable")
		}
		pods, err := f.admin.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			f.t.Fatal("guarded Pod readback unavailable")
		}
		for _, object := range deployments.Items {
			objects["deployment/"+namespace+"/"+object.Name] = []interface{}{object.UID, object.Generation, object.Labels, object.Annotations, object.Spec}
		}
		for _, object := range pods.Items {
			objects["pod/"+namespace+"/"+object.Name] = []interface{}{object.UID, object.Generation, object.Labels, object.Annotations, object.Spec}
		}
	}
	data, err := json.Marshal(objects)
	if err != nil {
		f.t.Fatal("guarded Kubernetes fingerprint encoding failed")
	}
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func workspaceAcceptanceDefaultDocument(f *workspaceRealRun, ctx context.Context) {
	f.t.Helper()
	status, body := f.gatewayContext(ctx, http.MethodGet, "/api/workspace", nil, nil, "")
	f.code(status, http.StatusOK, "default02 workspace readback")
	var current ws.Document
	if json.Unmarshal(body, &current) != nil || workspaceRealDocumentHash(current) != workspaceRealDocumentHash(f.originalDocument) {
		f.t.Fatal("acceptance phase changed default02 workspace records/preferences")
	}
}

func (q *workspaceAcceptanceWorkspace) assertKubernetesUntouched(ctx context.Context) {
	q.f.t.Helper()
	if q.kubernetesBefore == "" || workspaceAcceptanceKubernetesFingerprint(q.f, ctx) != q.kubernetesBefore {
		q.f.t.Fatal("native app-record operations changed guarded Deployment/Pod identities, metadata or specs")
	}
}

func (q *workspaceAcceptanceWorkspace) cleanup() {
	ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
	defer cancel()
	response := q.request(ctx, http.MethodGet, "/api/workspace", nil, nil, "")
	q.f.code(response.status, http.StatusOK, "fresh QA cleanup workspace read")
	q.accept(response.body)
	for id, expected := range q.harbors {
		for _, current := range q.doc.Harbors {
			if current.ID == id {
				if !reflect.DeepEqual(current, expected) {
					q.f.t.Fatal("fresh QA cleanup refused changed owned harbor")
				}
				q.f.guard(ctx, q.f.namespaces[0])
				q.mutate(ctx, http.MethodDelete, "/api/workspace/harbors/"+id, map[string]interface{}{})
				q.f.proof.Cleanup = append(q.f.proof.Cleanup, "fresh QA exact created harbor ID removed")
				break
			}
		}
	}
	for id, expected := range q.connections {
		for _, current := range q.doc.Connections {
			if current.ID == id {
				if current != expected {
					q.f.t.Fatal("fresh QA cleanup refused changed owned connection")
				}
				q.mutate(ctx, http.MethodDelete, "/api/workspace/connections/"+id, map[string]interface{}{})
				q.f.proof.Cleanup = append(q.f.proof.Cleanup, "fresh QA exact created connection ID removed")
				break
			}
		}
	}
	if workspaceRealDocumentHash(q.doc) != workspaceRealDocumentHash(q.original) {
		q.f.t.Error("fresh QA workspace did not return to its original empty document except revision")
	} else {
		q.f.proof.Cleanup = append(q.f.proof.Cleanup, "fresh QA original empty workspace/preferences preserved except revision")
	}
	if q.kubernetesBefore != "" {
		q.assertKubernetesUntouched(ctx)
		q.f.proof.Cleanup = append(q.f.proof.Cleanup, "guarded Deployment/Pod fingerprint unchanged; existing manual canary not registered for deletion")
	}
	workspaceAcceptanceDefaultDocument(q.f, ctx)
}

func TestOwnedWorkspaceRealWorkspaceRecordAcceptance(t *testing.T) {
	f := newWorkspaceRealRun(t, "workspace-record-acceptance")
	q := newWorkspaceAcceptanceWorkspace(f)
	t.Cleanup(q.cleanup)
	a := f.namespaces[0]
	var canary *workspaceRealOwned
	var originalConnection, originalHarbor, importedConnection, importedHarbor string
	var exported ws.Document
	if !f.step("fresh_qa_workspace_and_guarded_canary_ready", func() {
		object := workspaceAcceptanceLabCanary(f, a)
		canary = &workspaceRealOwned{Namespace: a, Name: object.Name, UID: object.UID}
		q.kubernetesBefore = workspaceAcceptanceKubernetesFingerprint(f, f.ctx)
		f.t.Logf("FRESH_QA workspaceID=%s isolated from default02; Kubernetes fingerprint=%s", q.workspaceID, q.kubernetesBefore)
	}) {
		return
	}
	if !f.step("native_create_and_rename_preserve_harbor_and_kubernetes_identity", func() {
		q.mutate(f.ctx, http.MethodPost, "/api/workspace/connections", map[string]interface{}{"connection": map[string]interface{}{"name": f.runID + "-connection", "context": f.lab.Clusters["a"].Name}})
		if len(q.doc.Connections) != 1 {
			f.t.Fatal("fresh QA native connection create count mismatch")
		}
		originalConnection = q.doc.Connections[0].ID
		q.mutate(f.ctx, http.MethodPost, "/api/workspace/harbors", map[string]interface{}{"harbor": map[string]interface{}{"name": f.runID + "-harbor", "connectionRef": originalConnection, "namespaces": []string{a}, "selector": q.selector, "view": map[string]interface{}{"tab": "resources"}}})
		if len(q.doc.Harbors) != 1 {
			f.t.Fatal("fresh QA native harbor create count mismatch")
		}
		originalHarbor = q.doc.Harbors[0].ID
		q.readCanary(originalHarbor, canary)
		q.mutate(f.ctx, http.MethodPatch, "/api/workspace/harbors/"+originalHarbor, map[string]interface{}{"harbor": map[string]interface{}{"name": f.runID + "-renamed-harbor"}})
		if len(q.doc.Harbors) != 1 || q.doc.Harbors[0].ID != originalHarbor || q.doc.Harbors[0].Name != f.runID+"-renamed-harbor" || q.doc.Harbors[0].ConnectionRef != originalConnection {
			f.t.Fatal("native rename changed immutable harbor/connection identity")
		}
		q.readCanary(originalHarbor, canary)
		q.assertKubernetesUntouched(f.ctx)
	}) {
		return
	}
	if !f.step("native_export_import_remaps_ids_and_stays_unbound", func() {
		response := q.request(f.ctx, http.MethodGet, "/api/connection", q.scope(originalHarbor), nil, "")
		f.code(response.status, http.StatusOK, "source QA harbor management diagnostic")
		var source struct {
			ConnectionID      string `json:"connectionID"`
			ReadOnly          bool   `json:"readOnly"`
			ServerReadOnly    bool   `json:"serverReadOnly"`
			ManagementEnabled bool   `json:"managementEnabled"`
		}
		if json.Unmarshal(response.body, &source) != nil || source.ConnectionID == "" || !source.ReadOnly || source.ServerReadOnly || source.ManagementEnabled {
			f.t.Fatal("fresh QA gateway must permit explicit management but begin browser read-only")
		}
		response = q.request(f.ctx, http.MethodPost, "/api/management", q.scope(originalHarbor), map[string]interface{}{"enabled": true, "context": f.lab.Clusters["a"].Name, "namespace": a, "connectionID": source.ConnectionID}, "")
		f.code(response.status, http.StatusOK, "source QA explicit management grant before export")
		response = q.request(f.ctx, http.MethodGet, "/api/connection", q.scope(originalHarbor), nil, "")
		f.code(response.status, http.StatusOK, "source QA active grant confirmation")
		if json.Unmarshal(response.body, &source) != nil || source.ReadOnly || !source.ManagementEnabled {
			f.t.Fatal("source QA harbor grant not active before export")
		}
		response = q.request(f.ctx, http.MethodGet, "/api/workspace/export", nil, nil, "")
		f.code(response.status, http.StatusOK, "fresh QA safe export")
		if json.Unmarshal(response.body, &exported) != nil || len(exported.Connections) != 1 || len(exported.Harbors) != 1 || exported.Connections[0].Context != "" || exported.Connections[0].Bound {
			f.t.Fatal("native export preserved context binding or malformed records")
		}
		q.mutate(f.ctx, http.MethodPost, "/api/workspace/import", map[string]interface{}{"workspace": exported})
		if len(q.doc.Connections) != 2 || len(q.doc.Harbors) != 2 {
			f.t.Fatal("native import did not add exactly one copied connection/harbor")
		}
		for _, connection := range q.doc.Connections {
			if connection.ID != originalConnection {
				if connection.Context != "" || connection.Bound {
					f.t.Fatal("import granted authority before explicit binding")
				}
				importedConnection = connection.ID
			}
		}
		for _, harbor := range q.doc.Harbors {
			if harbor.ID != originalHarbor {
				if harbor.ConnectionRef != importedConnection || harbor.WorkspaceID != q.workspaceID {
					f.t.Fatal("import retained source connection/workspace binding")
				}
				importedHarbor = harbor.ID
			}
		}
		if importedConnection == "" || importedHarbor == "" {
			f.t.Fatal("imported immutable IDs were not remapped")
		}
		response = q.request(f.ctx, http.MethodGet, "/api/resources", q.resource(importedHarbor, canary), nil, "")
		f.code(response.status, http.StatusConflict, "imported harbor read blocked until explicit binding")
		response = q.request(f.ctx, http.MethodPost, "/api/management", q.scope(importedHarbor), map[string]interface{}{"enabled": true, "context": f.lab.Clusters["a"].Name, "namespace": a, "connectionID": f.runID}, "")
		f.code(response.status, http.StatusConflict, "imported harbor cannot enable management before binding")
		q.assertKubernetesUntouched(f.ctx)
	}) {
		return
	}
	if !f.step("explicit_binding_allows_read_without_inheriting_write_grant", func() {
		q.mutate(f.ctx, http.MethodPatch, "/api/workspace/connections/"+importedConnection, map[string]interface{}{"connection": map[string]interface{}{"context": f.lab.Clusters["a"].Name}})
		response := q.request(f.ctx, http.MethodGet, "/api/connection", q.scope(importedHarbor), nil, "")
		f.code(response.status, http.StatusOK, "explicitly rebound imported connection diagnostic")
		var diagnostic struct {
			ConnectionID      string             `json:"connectionID"`
			ReadOnly          bool               `json:"readOnly"`
			ServerReadOnly    bool               `json:"serverReadOnly"`
			ManagementEnabled bool               `json:"managementEnabled"`
			Identity          connectionIdentity `json:"identity"`
		}
		if json.Unmarshal(response.body, &diagnostic) != nil || diagnostic.ConnectionID == "" || !diagnostic.ReadOnly || diagnostic.ServerReadOnly || diagnostic.ManagementEnabled || diagnostic.Identity.ClusterUID != f.clusterUID {
			f.t.Fatal("explicit binding inherited a write grant or reached another cluster")
		}
		q.readCanary(importedHarbor, canary)
		current := workspaceAcceptanceLabCanary(f, a)
		if current.UID != canary.UID {
			f.t.Fatal("existing manual canary UID changed before read-only action check")
		}
		response = q.request(f.ctx, http.MethodPost, "/api/actions", q.scope(importedHarbor), Action{Context: f.lab.Clusters["a"].Name, Group: "apps", Version: "v1", Resource: "deployments", Namespace: a, Name: canary.Name, UID: string(canary.UID), ResourceVersion: current.ResourceVersion, Action: "scale", Replicas: 2, DryRun: true}, diagnostic.ConnectionID)
		f.code(response.status, http.StatusForbidden, "bound imported connection remains browser read-only")
		q.assertKubernetesUntouched(f.ctx)
	}) {
		return
	}
	f.step("native_remove_only_qa_records_kubernetes_canary_survives", func() {
		for _, id := range []string{originalHarbor, importedHarbor} {
			q.mutate(f.ctx, http.MethodDelete, "/api/workspace/harbors/"+id, map[string]interface{}{})
			f.proof.Cleanup = append(f.proof.Cleanup, "fresh QA native removed exact harbor ID "+id)
		}
		for _, id := range []string{originalConnection, importedConnection} {
			q.mutate(f.ctx, http.MethodDelete, "/api/workspace/connections/"+id, map[string]interface{}{})
			f.proof.Cleanup = append(f.proof.Cleanup, "fresh QA native removed exact connection ID "+id)
		}
		if len(q.doc.Connections) != 0 || len(q.doc.Harbors) != 0 || workspaceRealDocumentHash(q.doc) != workspaceRealDocumentHash(q.original) {
			f.t.Fatal("native removal did not preserve the original fresh QA workspace/preferences")
		}
		q.assertKubernetesUntouched(f.ctx)
		if workspaceAcceptanceLabCanary(f, a).UID != canary.UID {
			f.t.Fatal("native app-record removal replaced the existing manual canary")
		}
		workspaceAcceptanceDefaultDocument(f, f.ctx)
		f.t.Log("REAL native rename/export/import/bind/remove: QA records only; both guarded namespaces' Deployment/Pod fingerprints unchanged. No Secret body, other GVR, real timeout, or UI claim")
	})
}

// These stricter predicates are deliberately not wired into the earlier real
// selector phase from this file. Root must approve that existing-file diff;
// unit checks below alone do not upgrade the already recorded seven-case proof.
func workspaceAcceptanceCorrelatedUpdate(msg envelope, uid, namespace, name, resourceVersion, scopeLabel string) bool {
	return resourceVersion != "" && msg.Type == "RESOURCE_EVENT" && msg.Action == "UPDATE" && msg.Scope != nil && msg.Scope.Group == "apps" && msg.Scope.Version == "v1" && msg.Scope.Resource == "deployments" && msg.Scope.Namespace == namespace && msg.Scope.Authoritative && msg.Object != nil && msg.Object.GetAPIVersion() == "apps/v1" && msg.Object.GetKind() == "Deployment" && string(msg.Object.GetUID()) == uid && msg.Object.GetNamespace() == namespace && msg.Object.GetName() == name && msg.Object.GetResourceVersion() == resourceVersion && msg.Object.GetLabels()["manual.kubeview.local/ws-scope"] == scopeLabel
}

func workspaceAcceptanceSnapshotHasDeployment(msg envelope, uid, namespace, name string) bool {
	if msg.Type != "SNAPSHOT" || uid == "" {
		return false
	}
	matches := 0
	for _, object := range msg.Resources {
		if object != nil && string(object.GetUID()) == uid {
			if object.GetAPIVersion() != "apps/v1" || object.GetKind() != "Deployment" || object.GetNamespace() != namespace || object.GetName() != name {
				return false
			}
			matches++
		}
	}
	return matches == 1
}

func TestWorkspaceAcceptanceSelectorCorrelationPredicates(t *testing.T) {
	object := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "metadata": map[string]interface{}{"uid": "owned-uid", "namespace": "qa", "name": "owned", "resourceVersion": "opaque-new", "labels": map[string]interface{}{"manual.kubeview.local/ws-scope": "alpha"}}}}
	good := envelope{Type: "RESOURCE_EVENT", Action: "UPDATE", Scope: &ResourceScope{Group: "apps", Version: "v1", Resource: "deployments", Namespace: "qa", Authoritative: true}, Object: object}
	for _, entry := range []struct {
		name   string
		change func(*envelope)
		want   bool
	}{
		{"exact_correlated_update", func(*envelope) {}, true},
		{"queued_old_rv", func(msg *envelope) { msg.Object.SetResourceVersion("opaque-old") }, false},
		{"other_uid", func(msg *envelope) { msg.Object.SetUID("replacement-uid") }, false},
		{"pre_reentry_label", func(msg *envelope) { msg.Object.SetLabels(map[string]string{"manual.kubeview.local/ws-scope": "beta"}) }, false},
		{"delete_is_not_reentry", func(msg *envelope) { msg.Action = "DELETE" }, false},
	} {
		t.Run(entry.name, func(t *testing.T) {
			msg := good
			msg.Object = object.DeepCopy()
			entry.change(&msg)
			if workspaceAcceptanceCorrelatedUpdate(msg, "owned-uid", "qa", "owned", "opaque-new", "alpha") != entry.want {
				t.Fatal("correlated selector update predicate accepted stale or different resource evidence")
			}
		})
	}
	for _, entry := range []struct {
		name      string
		resources []*unstructured.Unstructured
		want      bool
	}{
		{"exact_snapshot_uid", []*unstructured.Unstructured{object}, true},
		{"authority_without_inventory", nil, false},
		{"duplicate_expected_uid", []*unstructured.Unstructured{object, object}, false},
	} {
		t.Run(entry.name, func(t *testing.T) {
			if workspaceAcceptanceSnapshotHasDeployment(envelope{Type: "SNAPSHOT", Resources: entry.resources}, "owned-uid", "qa", "owned") != entry.want {
				t.Fatal("reconnect snapshot predicate accepted missing or duplicated UID inventory")
			}
		})
	}
}
