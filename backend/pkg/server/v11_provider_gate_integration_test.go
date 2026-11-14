package server

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/k8s-tersane/tersane/backend/pkg/provision"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Exercises the current real HTTP/session/API/CLI-read path while the actual
// three-machine profile is already at MaxNodes=3. It never needs a new worker,
// reverses no key hash, and makes no new Ready-worker claim.
func TestOwnedV11RealMinikubeManagementGate(t *testing.T) {
	if os.Getenv("KUBEVIEW_REPAIR_PROVIDER_GATE") != "true" {
		t.Skip("requires explicit owned provider gate opt-in")
	}
	expectedNamespace := os.Getenv("KUBEVIEW_REPAIR_NAMESPACE_UID")
	if expectedNamespace == "" {
		t.Skip("requires explicit owned namespace UID")
	}
	// The owned helper verifies its namespace/cluster before any provider is
	// opened; the initial diagnostics must not acquire the real profile lock.
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	s, c, ctx, contextName, gateway := ownedRepairGatewayManagement(t, false)
	ns := s.Namespace
	namespace, err := c.Typed.CoreV1().Namespaces().Get(ctx, ns, metav1.GetOptions{})
	if err != nil || string(namespace.UID) != expectedNamespace || namespace.Labels["kubeview.io/v11-owner"] != "v11-20261108" {
		t.Fatal("owned provider namespace UID/owner mismatch")
	}
	t.Setenv("KV_MINIKUBE_ENABLED", "true")
	cfg := provision.FromEnv()
	if cfg.Context != contextName || cfg.Profile != "kv-repair-1101" || cfg.ClusterUID != os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID") || cfg.MaxNodes != 3 || !filepath.IsAbs(cfg.Home) || !filepath.IsAbs(cfg.StateDir) || !strings.Contains(cfg.Home, "/.git/kv-repair-runtime/") || !strings.Contains(cfg.StateDir, "/.git/kv-repair-runtime/") {
		t.Fatal("refusing provider configuration outside explicit owned capped profile")
	}
	type inventory struct {
		Nodes     map[string]string   `json:"nodeUIDs"`
		Machines  []provision.Machine `json:"machines"`
		DockerIDs map[string]string   `json:"dockerIDs"`
	}
	readInventory := func() inventory {
		t.Helper()
		cluster, e := c.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
		if e != nil || string(cluster.UID) != cfg.ClusterUID {
			t.Fatal("owned provider cluster UID changed")
		}
		nodes, e := c.Typed.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
		if e != nil || len(nodes.Items) != 3 {
			t.Fatal("exactly three actual owned Nodes required before capped provider POST")
		}
		profile, e := (provision.CLIRunner{}).Inventory(ctx, cfg)
		if e != nil || profile.Driver != "docker" || len(profile.Machines) != 3 {
			t.Fatal("exactly three actual minikube docker machines required")
		}
		result := inventory{Nodes: map[string]string{}, Machines: profile.Machines, DockerIDs: map[string]string{}}
		sort.Slice(result.Machines, func(i, j int) bool { return result.Machines[i].Name < result.Machines[j].Name })
		for _, node := range nodes.Items {
			if node.Name != cfg.Profile && node.Name != cfg.Profile+"-m02" && node.Name != cfg.Profile+"-m03" {
				t.Fatal("unexpected owned Node name")
			}
			ready := false
			for _, condition := range node.Status.Conditions {
				ready = ready || condition.Type == corev1.NodeReady && condition.Status == corev1.ConditionTrue
			}
			if !ready {
				t.Fatal("owned provider baseline Node is not Ready")
			}
			result.Nodes[node.Name] = string(node.UID)
		}
		for _, machine := range result.Machines {
			if _, known := result.Nodes[machine.Name]; !known {
				t.Fatal("profile machine not matched to actual owned Node")
			}
			command := exec.CommandContext(ctx, "docker", "inspect", "--format", "{{.Id}}", machine.Name)
			data, e := command.Output()
			id := strings.TrimSpace(string(data))
			if e != nil || len(id) != 64 {
				t.Fatal("owned Docker machine identity unavailable")
			}
			result.DockerIDs[machine.Name] = id
		}
		return result
	}
	before := readInventory()
	journalPath := filepath.Join(cfg.StateDir, "minikube-"+cfg.Profile+".json")
	journalBefore, err := os.ReadFile(journalPath)
	if err != nil {
		t.Fatal("existing private provider journal unavailable")
	}
	var operationsBefore []provision.Operation
	if json.Unmarshal(journalBefore, &operationsBefore) != nil || len(operationsBefore) != 4 {
		t.Fatal("expected four existing terminal owned operations")
	}
	for _, operation := range operationsBefore {
		if operation.Status != "ready" || operation.Context != cfg.Context || operation.ClusterUID != cfg.ClusterUID || operation.Profile != cfg.Profile {
			t.Fatal("existing provider journal has unexpected identity/open operation")
		}
	}
	digest := func(data []byte) string { hash := sha256.Sum256(data); return hex.EncodeToString(hash[:]) }
	beforeJSON, _ := json.Marshal(before)
	t.Logf("REAL provider BEFORE inventory=%s journalSHA256=%s existingReadyOperations=%d; keys and journal content omitted", beforeJSON, digest(journalBefore), len(operationsBefore))
	s.closeProviders()
	manager, err := provision.New(cfg, nil) // production CLIRunner and existing profile lock/journal
	if err != nil {
		t.Fatal("real owned provider manager/lock unavailable")
	}
	s.providers = &providerServices{minikube: manager}
	t.Cleanup(s.closeProviders)
	s.Namespace = ""
	initial := ctx.Value(integrationOperatorKey{}).(integrationOperator)
	request := func(method, path string, body interface{}, cookie *http.Cookie, nonce string) (int, []byte, []*http.Cookie) {
		t.Helper()
		var raw []byte
		if body != nil {
			raw, _ = json.Marshal(body)
		}
		r, e := http.NewRequestWithContext(ctx, method, gateway+path, bytes.NewReader(raw))
		if e != nil {
			t.Fatal("provider HTTP request construction failed")
		}
		r.Header.Set("Origin", gateway)
		if body != nil {
			r.Header.Set("Content-Type", "application/json")
		}
		if cookie != nil {
			r.AddCookie(cookie)
		}
		if nonce != "" {
			r.Header.Set("X-KubeView-Connection", nonce)
		}
		response, e := http.DefaultClient.Do(r)
		if e != nil {
			t.Fatal("provider real HTTP transport failed")
		}
		defer response.Body.Close()
		data, e := io.ReadAll(io.LimitReader(response.Body, 2<<20))
		if e != nil {
			t.Fatal("provider HTTP response read failed")
		}
		return response.StatusCode, data, response.Cookies()
	}
	diagnosticHTTP := func(contextAlias string, cookie *http.Cookie) (integrationOperator, map[string]interface{}) {
		t.Helper()
		code, raw, cookies := request("GET", "/api/connection?"+url.Values{"context": {contextAlias}, "namespace": {""}}.Encode(), nil, cookie, "")
		if code != 200 {
			t.Fatalf("real provider diagnostic HTTP%d", code)
		}
		if cookie == nil {
			for _, value := range cookies {
				if value.Name == operatorCookie {
					cookie = value
				}
			}
		}
		var info map[string]interface{}
		if json.Unmarshal(raw, &info) != nil || cookie == nil {
			t.Fatal("provider diagnostic session missing")
		}
		nonce, ok := info["connectionID"].(string)
		if !ok || nonce == "" {
			t.Fatal("provider diagnostic nonce missing")
		}
		return integrationOperator{cookie: cookie, nonce: nonce}, info
	}
	operator, info := diagnosticHTTP(contextName, initial.cookie)
	if info["readOnly"] != true || info["managementEnabled"] != false {
		t.Fatal("provider browser management unexpectedly enabled")
	}
	workerPath := "/api/providers/minikube/workers?context=" + url.QueryEscape(contextName)
	unknownBody := map[string]string{"action": "add-worker", "idempotencyKey": "v11-capacity-" + uuid.NewString()}
	expectCode := func(method, path string, body interface{}, cookie *http.Cookie, nonce string, expected int) []byte {
		t.Helper()
		code, raw, _ := request(method, path, body, cookie, nonce)
		if code != expected {
			t.Fatalf("provider %s expectedHTTP%d got%d", method, expected, code)
		}
		return raw
	}
	status := func(op integrationOperator, canAdd bool) {
		t.Helper()
		raw := expectCode("GET", "/api/providers?context="+url.QueryEscape(contextName), nil, op.cookie, op.nonce, 200)
		var result struct {
			Minikube struct {
				Available, CanAdd bool
				Operations        []provision.Operation
			}
		}
		if json.Unmarshal(raw, &result) != nil || !result.Minikube.Available || result.Minikube.CanAdd != canAdd {
			t.Fatal("provider current management/capability status incorrect")
		}
	}
	if !t.Run("unseeded-and-management-off-rejected", func(t *testing.T) {
		expectCode("POST", workerPath, unknownBody, nil, "", 403)
		expectCode("POST", workerPath, unknownBody, operator.cookie, operator.nonce, 403)
		status(operator, false)
		t.Log("REAL current provider POST unseeded403 and cookie/current nonce without management403; configured status canAdd=false")
	}) {
		return
	}
	if !t.Run("explicit-management-current-nonce-capability", func(t *testing.T) {
		expectCode("POST", "/api/management", managementBody(contextName, "", operator.nonce, true), operator.cookie, "", 200)
		expectCode("POST", workerPath, unknownBody, operator.cookie, "", 403)
		expectCode("POST", workerPath, unknownBody, operator.cookie, "invalid-current-intent", 409)
		status(operator, true)
		t.Log("REAL explicit management+current nonce+loopback+exact context/kube-system UID+actual nodes/create SSAR => status canAdd=true; missing nonce403/wrong nonce409. This is permission availability, not capacity or worker success")
	}) {
		return
	}
	if !t.Run("actual-profile-UID-and-capacity-rejection", func(t *testing.T) {
		// Recheck actual inventory immediately before the only fully authorized
		// add-worker POST. Production Begin returns at its verified capacity
		// branch before constructing an operation or invoking CLIRunner.Add.
		if !reflect.DeepEqual(before, readInventory()) {
			t.Fatal("actual capped inventory changed before POST")
		}
		expectCode("POST", workerPath, unknownBody, operator.cookie, operator.nonce, 409)
		if len(manager.Snapshot()) != len(operationsBefore) {
			t.Fatal("capacity rejection created an operation")
		}
		t.Log("REAL valid unknown-key POST409 at MaxNodes=3 after production ProfileUID CLI/API/actual inventory Verify; existing3 machines retained, no new operation or worker Ready claim")
	}) {
		return
	}
	if !t.Run("wrong-context-and-changed-pinned-UID", func(t *testing.T) {
		other := os.Getenv("KUBEVIEW_REPAIR_OTHER_CONTEXT")
		expectedOtherUID := os.Getenv("KUBEVIEW_REPAIR_OTHER_CLUSTER_UID")
		if other == "" || expectedOtherUID == "" || other == contextName {
			t.Fatal("explicit second owned context required")
		}
		otherClient, e := s.client(other)
		if e != nil {
			t.Fatal("actual second owned context unavailable")
		}
		otherCluster, e := otherClient.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
		if e != nil || string(otherCluster.UID) != expectedOtherUID || string(otherCluster.UID) == cfg.ClusterUID {
			t.Fatal("second owned cluster UID mismatch")
		}
		expectCode("POST", "/api/providers/minikube/workers?context="+url.QueryEscape(other), unknownBody, operator.cookie, operator.nonce, 409)
		// A test-only changed expected UID exercises the real API response guard;
		// the actual cluster UID and production Manager configuration stay fixed.
		t.Setenv("KV_MINIKUBE_CLUSTER_UID", "v11-deliberately-mismatched-expected-uid")
		expectCode("GET", workerPath, nil, operator.cookie, operator.nonce, 409)
		status(operator, false)
		t.Setenv("KV_MINIKUBE_CLUSTER_UID", cfg.ClusterUID)
		status(operator, true)
		t.Logf("REAL contextB=%s clusterBUID=%s POST409 on pinned A provider; changed expected UID test configuration + actual A kube-system response GET409/canAdd=false; B read-only identity check only", other, otherCluster.UID)
	}) {
		return
	}
	if !t.Run("context-roundtrip-and-revoke-rotate-intent", func(t *testing.T) {
		old := operator
		_, _ = diagnosticHTTP(os.Getenv("KUBEVIEW_REPAIR_OTHER_CONTEXT"), operator.cookie)
		operator, info = diagnosticHTTP(contextName, operator.cookie)
		if old.nonce == operator.nonce || info["managementEnabled"] != false {
			t.Fatal("context roundtrip retained provider management intent")
		}
		expectCode("POST", workerPath, unknownBody, old.cookie, old.nonce, 409)
		expectCode("POST", workerPath, unknownBody, operator.cookie, operator.nonce, 403)
		expectCode("POST", "/api/management", managementBody(contextName, "", operator.nonce, true), operator.cookie, "", 200)
		old = operator
		raw := expectCode("POST", "/api/management", managementBody(contextName, "", operator.nonce, false), operator.cookie, "", 200)
		var revoked struct {
			ConnectionID      string `json:"connectionID"`
			ManagementEnabled bool   `json:"managementEnabled"`
		}
		if json.Unmarshal(raw, &revoked) != nil || revoked.ConnectionID == "" || revoked.ConnectionID == old.nonce || revoked.ManagementEnabled {
			t.Fatal("revoke did not rotate/cancel management intent")
		}
		operator.nonce = revoked.ConnectionID
		expectCode("POST", workerPath, unknownBody, old.cookie, old.nonce, 409)
		expectCode("POST", workerPath, unknownBody, operator.cookie, operator.nonce, 403)
		status(operator, false)
		t.Log("REAL A->B->A and revoke rotate current operator intent; stale worker POST409, current disabled intent403; no management/session token printed")
	}) {
		return
	}
	t.Run("unchanged-node-machine-operation-inventory", func(t *testing.T) {
		after := readInventory()
		if !reflect.DeepEqual(before, after) {
			t.Fatal("provider negatives/capacity changed actual Node or Docker identity")
		}
		s.closeProviders()
		journalAfter, e := os.ReadFile(journalPath)
		var operationsAfter []provision.Operation
		if e != nil || json.Unmarshal(journalAfter, &operationsAfter) != nil || !reflect.DeepEqual(operationsBefore, operationsAfter) {
			t.Fatal("existing journal operation identity/history changed")
		}
		afterJSON, _ := json.Marshal(after)
		t.Logf("REAL provider AFTER inventory=%s journalSHA256=%s existingReadyOperations=%d journalBytesEqual=%t operationHistoryEqual=true; addedNodes=0 addedMachines=0 addedOperations=0", afterJSON, digest(journalAfter), len(operationsAfter), bytes.Equal(journalBefore, journalAfter))
	})
}
