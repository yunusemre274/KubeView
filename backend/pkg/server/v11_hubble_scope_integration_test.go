package server

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/k8s-tersane/tersane/backend/pkg/traffic"
	authenticationv1 "k8s.io/api/authentication/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

func TestOwnedV11RealHubbleReadOnlyScope(t *testing.T) {
	if os.Getenv("KUBEVIEW_REPAIR_HUBBLE_GATE") != "true" || os.Getenv("KV_HUBBLE_ENABLED") != "true" {
		t.Skip("requires explicit owned real Hubble TLS gate opt-in")
	}
	expectedNamespace := os.Getenv("KUBEVIEW_REPAIR_NAMESPACE_UID")
	if expectedNamespace == "" {
		t.Skip("requires explicit owned namespace UID")
	}
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	s, c, ctx, contextName, gateway := ownedRepairGatewayManagement(t, false)
	ns := s.Namespace
	guard := func(checkCtx context.Context) bool {
		cluster, e1 := c.Typed.CoreV1().Namespaces().Get(checkCtx, "kube-system", metav1.GetOptions{})
		namespace, e2 := c.Typed.CoreV1().Namespaces().Get(checkCtx, ns, metav1.GetOptions{})
		return e1 == nil && e2 == nil && string(cluster.UID) == os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID") && string(namespace.UID) == expectedNamespace && namespace.Labels["kubeview.io/repair-owner"] == "backend-manager" && namespace.Labels["kubeview.io/v11-owner"] == "v11-20261108"
	}
	if !guard(ctx) {
		t.Fatal("owned Hubble cluster/namespace UID or owner mismatch")
	}
	// Let the real restricted identity, rather than a server namespace filter,
	// determine whether another/all-namespace Pod collection is authorized.
	s.Namespace = ""
	owner := uuid.NewString()
	prefix := "kv-v11-flow-" + strings.Split(owner, "-")[0]
	labels := map[string]string{"kubeview.io/repair-owner": owner, "kubeview.io/v11-owner": "v11-20261108"}
	type fixture struct {
		gvr    schema.GroupVersionResource
		object *unstructured.Unstructured
	}
	fixtures := []fixture{}
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		for i := len(fixtures) - 1; i >= 0; i-- {
			item := fixtures[i]
			client := c.Dynamic.Resource(item.gvr).Namespace(ns)
			current, err := client.Get(cleanup, item.object.GetName(), metav1.GetOptions{})
			if apierrors.IsNotFound(err) {
				continue
			}
			if err != nil || !guard(cleanup) || current.GetUID() != item.object.GetUID() || current.GetLabels()["kubeview.io/repair-owner"] != owner {
				t.Error("refusing Hubble fixture cleanup after identity/owner change")
				continue
			}
			uid, rv, zero := current.GetUID(), current.GetResourceVersion(), int64(0)
			err = client.Delete(cleanup, current.GetName(), metav1.DeleteOptions{Preconditions: &metav1.Preconditions{UID: &uid, ResourceVersion: &rv}, GracePeriodSeconds: &zero})
			if err != nil && !apierrors.IsNotFound(err) {
				t.Error("guarded Hubble fixture DELETE failed")
				continue
			}
			gone := false
			for cleanup.Err() == nil {
				_, err = client.Get(cleanup, current.GetName(), metav1.GetOptions{})
				if apierrors.IsNotFound(err) {
					gone = true
					break
				}
				time.Sleep(100 * time.Millisecond)
			}
			if !gone {
				t.Error("Hubble fixture cleanup did not reach GET404")
			} else {
				t.Logf("REAL Hubble own cleanup resource=%s UID=%s GET404 after UID/RV/owner guard", item.gvr.Resource, uid)
			}
		}
	})
	create := func(gvr schema.GroupVersionResource, kind, name string, fields map[string]interface{}) *unstructured.Unstructured {
		t.Helper()
		if !guard(ctx) {
			t.Fatal("owned scope changed before Hubble fixture CREATE")
		}
		obj := &unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": gvr.GroupVersion().String(), "kind": kind, "metadata": map[string]interface{}{"name": name, "namespace": ns}}}
		obj.SetLabels(labels)
		for key, value := range fields {
			obj.Object[key] = value
		}
		result, err := c.Dynamic.Resource(gvr).Namespace(ns).Create(ctx, obj, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned Hubble fixture CREATE failed")
		}
		fixtures = append(fixtures, fixture{gvr, result})
		return result
	}
	podGVR := schema.GroupVersionResource{Version: "v1", Resource: "pods"}
	nodeNames := []string{"kv-repair-1101-m02", "kv-repair-1101-m03"}
	for _, name := range nodeNames {
		node, err := c.Typed.CoreV1().Nodes().Get(ctx, name, metav1.GetOptions{})
		if err != nil || node.UID == "" {
			t.Fatal("owned worker Node unavailable for scheduler affinity")
		}
	}
	pods := map[string]*corev1.Pod{}
	for _, item := range []struct {
		role, node string
		server     bool
	}{{"client", nodeNames[0], false}, {"same", nodeNames[0], true}, {"cross", nodeNames[1], true}} {
		image, command, memory := "alpine:3.21", []interface{}{"sh", "-c", "exec sleep 600"}, "48Mi"
		if item.server {
			// This server image/foreground command is already exercised by the
			// current real workload UI fixture; Alpine does not promise httpd.
			image, command, memory = "nginx:1.27-alpine", []interface{}{"nginx", "-g", "daemon off;"}, "128Mi"
		}
		create(podGVR, "Pod", prefix+"-"+item.role, map[string]interface{}{"spec": map[string]interface{}{"restartPolicy": "Never", "terminationGracePeriodSeconds": int64(1), "affinity": map[string]interface{}{"nodeAffinity": map[string]interface{}{"requiredDuringSchedulingIgnoredDuringExecution": map[string]interface{}{"nodeSelectorTerms": []interface{}{map[string]interface{}{"matchFields": []interface{}{map[string]interface{}{"key": "metadata.name", "operator": "In", "values": []interface{}{item.node}}}}}}}}, "containers": []interface{}{map[string]interface{}{"name": "app", "image": image, "imagePullPolicy": "IfNotPresent", "command": command, "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "5m", "memory": "8Mi"}, "limits": map[string]interface{}{"memory": memory}}}}}})
	}
	for deadline := time.Now().Add(70 * time.Second); time.Now().Before(deadline); {
		for _, role := range []string{"client", "same", "cross"} {
			p, err := c.Typed.CoreV1().Pods(ns).Get(ctx, prefix+"-"+role, metav1.GetOptions{})
			if err != nil || p.Labels["kubeview.io/repair-owner"] != owner {
				t.Fatal("owned Hubble Pod identity lost")
			}
			if p.Status.Phase == corev1.PodFailed || p.Status.Phase == corev1.PodSucceeded {
				t.Fatalf("owned Hubble fixture terminal before Ready role=%s phase=%s", role, p.Status.Phase)
			}
			for _, condition := range p.Status.Conditions {
				if condition.Type == corev1.PodReady && condition.Status == corev1.ConditionTrue && net.ParseIP(p.Status.PodIP) != nil {
					pods[role] = p
				}
			}
		}
		if len(pods) == 3 {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if len(pods) != 3 || pods["client"].Spec.NodeName != pods["same"].Spec.NodeName || pods["client"].Spec.NodeName == pods["cross"].Spec.NodeName {
		t.Fatal("real scheduler same/cross Node Ready placement not reached")
	}
	t.Logf("REAL scheduler affinity fixtures clientUID=%s sameNodeServerUID=%s crossNodeServerUID=%s nodeA=%s nodeB=%s; standalone Pods, no spec.nodeName bypass", pods["client"].UID, pods["same"].UID, pods["cross"].UID, nodeNames[0], nodeNames[1])
	// Inherit the private KUBECONFIG environment so kubectl performs its normal
	// path-list merge; --kubeconfig accepts one filename, not that list.
	capability := exec.CommandContext(ctx, "kubectl", "--context", contextName, "exec", "-n", ns, pods["client"].Name, "-c", "app", "--", "sh", "-c", "command -v wget >/dev/null")
	capability.Stdout, capability.Stderr = io.Discard, io.Discard
	if capability.Run() != nil {
		t.Fatal("actual owned client wget capability unavailable")
	}
	t.Log("REAL owned client wget capability read succeeded; actual nginx:1.27-alpine foreground servers Ready on same/cross Nodes; no Alpine httpd assumption")
	type lease struct {
		path     string
		operator integrationOperator
		released bool
	}
	leases := []*lease{}
	request := func(requestCtx context.Context, method, path string, operator integrationOperator, origin string) (int, []byte) {
		t.Helper()
		r, err := http.NewRequestWithContext(requestCtx, method, path, nil)
		if err != nil {
			t.Fatal("Hubble HTTP construction failed")
		}
		if operator.cookie != nil {
			operator.apply(r)
		}
		if origin != "" {
			r.Header.Set("Origin", origin)
		}
		response, err := http.DefaultClient.Do(r)
		if err != nil {
			t.Fatal("Hubble real HTTP transport failed")
		}
		defer response.Body.Close()
		data, err := io.ReadAll(io.LimitReader(response.Body, 2<<20))
		if err != nil {
			t.Fatal("Hubble HTTP response read failed")
		}
		return response.StatusCode, data
	}
	newLease := func(alias, namespace string, operator integrationOperator) *lease {
		value := &lease{path: gateway + "/api/flows?" + url.Values{"context": {alias}, "namespace": {namespace}, "subscription": {uuid.NewString()}}.Encode(), operator: operator}
		leases = append(leases, value)
		return value
	}
	release := func(value *lease) {
		t.Helper()
		if !value.released {
			code, _ := request(ctx, "DELETE", value.path, value.operator, gateway)
			if code != 200 {
				t.Fatalf("readonly identity-bound lease DELETE HTTP%d", code)
			}
			value.released = true
		}
	}
	t.Cleanup(func() {
		cleanup, cancel := context.WithTimeout(context.Background(), 8*time.Second)
		defer cancel()
		for _, value := range leases {
			if !value.released {
				code, _ := request(cleanup, "DELETE", value.path, value.operator, gateway)
				if code != 200 {
					t.Error("Hubble lease cleanup failed")
				}
			}
		}
		s.closeProviders()
	})
	fetch := func(value *lease) traffic.Snapshot {
		t.Helper()
		code, raw := request(ctx, "GET", value.path, value.operator, gateway)
		if code != 200 {
			t.Fatalf("actual Hubble GET HTTP%d", code)
		}
		var snapshot traffic.Snapshot
		if json.Unmarshal(raw, &snapshot) != nil || snapshot.Provider != "hubble" || snapshot.Namespace != ns || snapshot.ClusterUID != os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID") || snapshot.WindowSeconds != 10 {
			t.Fatal("actual Hubble snapshot scope/cluster/window malformed")
		}
		return snapshot
	}
	waitLive := func(value *lease) traffic.Snapshot {
		t.Helper()
		var snapshot traffic.Snapshot
		for deadline := time.Now().Add(15 * time.Second); time.Now().Before(deadline); {
			snapshot = fetch(value)
			if snapshot.Status == "live" {
				return snapshot
			}
			time.Sleep(150 * time.Millisecond)
		}
		t.Fatalf("actual Hubble TLS collector not live status=%s", snapshot.Status)
		return snapshot
	}
	operator := ctx.Value(integrationOperatorKey{}).(integrationOperator)
	adminLease := newLease(contextName, ns, operator)
	if !t.Run("readonly-live-GET-lease-DELETE-and-Origin", func(t *testing.T) {
		snapshot := waitLive(adminLease)
		if snapshot.Context != contextName {
			t.Fatal("actual flow context incorrect")
		}
		second := newLease(contextName, ns, operator)
		waitLive(second)
		release(second)
		if fetch(adminLease).Status != "live" {
			t.Fatal("releasing one lease restarted the independent live operator lease")
		}
		for _, origin := range []string{"null", "https://foreign.example"} {
			code, _ := request(ctx, "GET", adminLease.path, operator, origin)
			if code != 403 {
				t.Fatalf("flow Origin negative HTTP%d", code)
			}
		}
		t.Log("REAL Hubble1.20.2 mTLS current readonly GET live and independent lease DELETE200 without management; same-origin accepted, null/foreign Origin403")
	}) {
		return
	}
	produce := func() time.Time {
		t.Helper()
		for _, role := range []string{"same", "cross"} {
			p, err := c.Typed.CoreV1().Pods(ns).Get(ctx, pods[role].Name, metav1.GetOptions{})
			if err != nil || p.UID != pods[role].UID || p.Labels["kubeview.io/repair-owner"] != owner {
				t.Fatal("destination Pod UID changed before owned traffic")
			}
		}
		client, err := c.Typed.CoreV1().Pods(ns).Get(ctx, pods["client"].Name, metav1.GetOptions{})
		if err != nil || client.UID != pods["client"].UID || !guard(ctx) {
			t.Fatal("source Pod/scope changed before owned traffic")
		}
		// Exact UID-owned Pod IPs enter this fixed test command. Response bytes,
		// URLs, headers and command output are never logged or put in evidence.
		command := "set -e; for i in 1 2 3; do wget -q -T 3 -O /dev/null http://" + net.JoinHostPort(pods["same"].Status.PodIP, "80") + "; wget -q -T 3 -O /dev/null http://" + net.JoinHostPort(pods["cross"].Status.PodIP, "80") + "; sleep .2; done"
		process := exec.CommandContext(ctx, "kubectl", "--context", contextName, "exec", "-n", ns, client.Name, "-c", "app", "--", "sh", "-c", command)
		process.Stdout = io.Discard
		process.Stderr = io.Discard
		if process.Run() != nil {
			t.Fatal("bounded owned same/cross request command failed")
		}
		return time.Now().UTC()
	}
	pair := func(flow traffic.Flow, role string) bool {
		if flow.Source.UID == nil || flow.Destination.UID == nil {
			return false
		}
		a, b := *flow.Source.UID, *flow.Destination.UID
		return a == string(pods["client"].UID) && b == string(pods[role].UID) || b == string(pods["client"].UID) && a == string(pods[role].UID)
	}
	findPairs := func(value *lease, restricted bool) traffic.Snapshot {
		t.Helper()
		var snapshot traffic.Snapshot
		for deadline := time.Now().Add(15 * time.Second); time.Now().Before(deadline); {
			snapshot = fetch(value)
			same, cross := false, false
			for _, flow := range snapshot.Flows {
				if flow.Source.Namespace != ns || flow.Destination.Namespace != ns {
					t.Fatal("cross-namespace endpoint leaked")
				}
				if restricted && (flow.Source.NodeName != nil || flow.Destination.NodeName != nil || flow.Source.NodeUID != nil || flow.Destination.NodeUID != nil) {
					t.Fatal("restricted identity received Node metadata")
				}
				if pair(flow, "same") || pair(flow, "cross") {
					if flow.Protocol != "TCP" || flow.TransportProtocol != "TCP" || flow.HTTPCode != nil || flow.HTTPProtocol != nil || flow.LatencyMS != nil || flow.DNSRcode != nil {
						t.Fatal("plain measured L4 gained invented L7 metadata")
					}
					if flow.LastObserved.Before(snapshot.ObservedAt.Add(-10*time.Second)) || flow.LastObserved.After(snapshot.ObservedAt) || flow.EventCount == 0 {
						t.Fatal("measured flow outside actual observation window")
					}
					same = same || pair(flow, "same")
					cross = cross || pair(flow, "cross")
				}
			}
			if same && cross {
				return snapshot
			}
			time.Sleep(200 * time.Millisecond)
		}
		t.Fatalf("actual same/cross measured UID pairs not both observed; groups=%d status=%s", len(snapshot.Flows), snapshot.Status)
		return snapshot
	}
	pairSummary := func(snapshot traffic.Snapshot) []map[string]interface{} {
		result := []map[string]interface{}{}
		for _, flow := range snapshot.Flows {
			if pair(flow, "same") || pair(flow, "cross") {
				result = append(result, map[string]interface{}{"sourceUID": *flow.Source.UID, "destinationUID": *flow.Destination.UID, "protocol": flow.Protocol, "firstObserved": flow.FirstObserved, "lastObserved": flow.LastObserved, "eventCount": flow.EventCount, "sourceIdentity": flow.Source.IdentityStatus, "destinationIdentity": flow.Destination.IdentityStatus})
			}
		}
		return result
	}
	var lastTraffic time.Time
	if !t.Run("real-same-and-cross-Node-measured-TCP-UID-time", func(t *testing.T) {
		fetch(adminLease)
		lastTraffic = produce()
		snapshot := findPairs(adminLease, false)
		t.Logf("REAL bounded3 same+3 cross owned requests -> Cilium/Hubble mTLS -> current GET; actual TCP UID pairs confirmed in10s window observedAt=%s lastRequestEnded=%s flowGroups=%d; L7 fields nil, payload omitted", snapshot.ObservedAt.Format(time.RFC3339Nano), lastTraffic.Format(time.RFC3339Nano), len(snapshot.Flows))
		summary, _ := json.Marshal(pairSummary(snapshot))
		t.Logf("REAL operator safe measured flow summaries=%s", summary)
	}) {
		return
	}
	if !t.Run("actual-restricted-identity-own-namespace-only", func(t *testing.T) {
		alias := prefix + "-reader"
		saGVR := schema.GroupVersionResource{Version: "v1", Resource: "serviceaccounts"}
		roleGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
		bindingGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
		create(saGVR, "ServiceAccount", alias, map[string]interface{}{"automountServiceAccountToken": false})
		create(roleGVR, "Role", alias, map[string]interface{}{"rules": []interface{}{map[string]interface{}{"apiGroups": []interface{}{""}, "resources": []interface{}{"pods"}, "verbs": []interface{}{"get", "list", "watch"}}}})
		create(bindingGVR, "RoleBinding", alias, map[string]interface{}{"roleRef": map[string]interface{}{"apiGroup": "rbac.authorization.k8s.io", "kind": "Role", "name": alias}, "subjects": []interface{}{map[string]interface{}{"kind": "ServiceAccount", "namespace": ns, "name": alias}}})
		expiration := int64(600)
		token, err := c.Typed.CoreV1().ServiceAccounts(ns).CreateToken(ctx, alias, &authenticationv1.TokenRequest{Spec: authenticationv1.TokenRequestSpec{ExpirationSeconds: &expiration}}, metav1.CreateOptions{})
		if err != nil {
			t.Fatal("owned Hubble reader TokenRequest failed")
		}
		config, err := loadingRules().Load()
		if err != nil || config.Contexts[contextName] == nil {
			t.Fatal("trusted merged operator config unavailable")
		}
		config.AuthInfos[alias] = &clientcmdapi.AuthInfo{Token: token.Status.Token}
		config.Contexts[alias] = &clientcmdapi.Context{Cluster: config.Contexts[contextName].Cluster, AuthInfo: alias, Namespace: ns}
		privateConfig := filepath.Join(t.TempDir(), "hubble-reader-kubeconfig")
		if clientcmd.WriteToFile(*config, privateConfig) != nil || os.Chmod(privateConfig, 0600) != nil {
			t.Fatal("private Hubble reader config failed")
		}
		t.Setenv("KUBECONFIG", privateConfig)
		cookie, info := diagnostic(t, s, alias, ns, nil)
		if info["managementEnabled"] != false {
			t.Fatal("reader unexpectedly enabled management")
		}
		reader := integrationOperator{cookie: cookie, nonce: info["connectionID"].(string)}
		readerLease := newLease(alias, ns, reader)
		defer release(readerLease)
		waitLive(readerLease)
		lastTraffic = produce()
		snapshot := findPairs(readerLease, true)
		if snapshot.Context != alias {
			t.Fatal("reader response used operator context")
		}
		// An identical client lease ID is not sufficient to share the operator's
		// credential-bound collection. Its DELETE must leave the admin lease live.
		q, err := url.Parse(adminLease.path)
		if err != nil {
			t.Fatal("lease URL parse failed")
		}
		query := q.Query()
		query.Set("context", alias)
		q.RawQuery = query.Encode()
		code, _ := request(ctx, "DELETE", q.String(), reader, gateway)
		if code != 200 {
			t.Fatal("identity-bound foreign lease release failed")
		}
		if fetch(adminLease).Status != "live" {
			t.Fatal("foreign-identity lease release restarted the live operator collector")
		}
		for _, resource := range []string{"nodes", "namespaces"} {
			code, _ := request(ctx, "GET", gateway+"/api/resources?"+url.Values{"context": {alias}, "version": {"v1"}, "resource": {resource}}.Encode(), reader, gateway)
			if code != 403 {
				t.Fatalf("real reader %s LIST HTTP%d", resource, code)
			}
		}
		for _, outside := range []string{ns + "-outside", ""} {
			path := gateway + "/api/flows?" + url.Values{"context": {alias}, "namespace": {outside}, "subscription": {uuid.NewString()}}.Encode()
			code, _ := request(ctx, "GET", path, reader, gateway)
			if code != 403 {
				t.Fatalf("reader outside/all namespace expected403 got%d", code)
			}
		}
		t.Logf("REAL distinct TokenRequest identity measured own namespace same/cross TCP UID pairs with Node metadata nil; Node/Namespace LIST403 and outside/all flow GET403; foreign-identity same-lease DELETE leaves operator live; readerContext=%s", alias)
		summary, _ := json.Marshal(pairSummary(snapshot))
		t.Logf("REAL reader safe measured flow summaries=%s", summary)
	}) {
		return
	}
	if !t.Run("actual-other-cluster-and-current-session-roundtrip", func(t *testing.T) {
		other := os.Getenv("KUBEVIEW_REPAIR_OTHER_CONTEXT")
		otherClient, err := s.client(other)
		if err != nil || other == "" {
			t.Fatal("actual owned second context unavailable")
		}
		cluster, err := otherClient.Typed.CoreV1().Namespaces().Get(ctx, "kube-system", metav1.GetOptions{})
		if err != nil || string(cluster.UID) != os.Getenv("KUBEVIEW_REPAIR_OTHER_CLUSTER_UID") {
			t.Fatal("actual second cluster UID mismatch")
		}
		path := gateway + "/api/flows?" + url.Values{"context": {other}, "namespace": {ns}, "subscription": {uuid.NewString()}}.Encode()
		code, _ := request(ctx, "GET", path, operator, gateway)
		if code != 409 {
			t.Fatalf("actual B flow provider binding expected409 got%d", code)
		}
		_, _ = diagnostic(t, s, other, ns, operator.cookie)
		cookie, info := diagnostic(t, s, contextName, ns, operator.cookie)
		if info["managementEnabled"] != false || info["connectionID"] == operator.nonce {
			t.Fatal("current context roundtrip reused management intent")
		}
		operator = integrationOperator{cookie: cookie, nonce: info["connectionID"].(string)}
		adminLease.operator = operator
		snapshot := waitLive(adminLease)
		if snapshot.Context != contextName {
			t.Fatal("actual B response contaminated A flow context")
		}
		t.Logf("REAL contextB clusterUID=%s current flow GET409 API/TLS provider binding; A->B->A new intent remains readonly and current GET reports A only; no B mutations", cluster.UID)
	}) {
		return
	}
	// List this Go test process's direct Hubble observe children privately. Full
	// command lines contain TLS paths and are never logged. Root's kubectl relay
	// forward is a different parent/executable and cannot match this selector.
	observePIDs := func() []int {
		t.Helper()
		data, err := exec.Command("ps", "-axo", "pid=,ppid=,command=").Output()
		if err != nil {
			t.Fatal("owned collector process inventory failed")
		}
		result := []int{}
		for _, line := range strings.Split(string(data), "\n") {
			fields := strings.Fields(line)
			if len(fields) < 4 {
				continue
			}
			parent, _ := strconv.Atoi(fields[1])
			if parent != os.Getpid() || fields[2] != os.Getenv("KV_HUBBLE_BINARY") {
				continue
			}
			observe, follow := false, false
			for _, field := range fields[3:] {
				observe = observe || field == "observe"
				follow = follow || field == "--follow"
			}
			if observe && follow {
				pid, _ := strconv.Atoi(fields[0])
				if pid > 0 {
					result = append(result, pid)
				}
			}
		}
		return result
	}
	if !t.Run("owned-collector-transport-interruption-and-bounded-retry", func(t *testing.T) {
		pids := observePIDs()
		if len(pids) != 1 {
			t.Fatalf("expected one owned operator collector after reader release, got%d", len(pids))
		}
		process, err := os.FindProcess(pids[0])
		if err != nil || process.Kill() != nil {
			t.Fatal("owned observe-only collector interruption failed")
		}
		interrupted := time.Now().UTC()
		stale := false
		for deadline := time.Now().Add(1500 * time.Millisecond); time.Now().Before(deadline); {
			snapshot := fetch(adminLease)
			if snapshot.Status == "stale" {
				stale = true
				break
			}
			time.Sleep(30 * time.Millisecond)
		}
		if !stale {
			t.Fatal("actual observe transport interruption did not mark prior measured data stale")
		}
		waitLive(adminLease)
		pidsAfter := observePIDs()
		if len(pidsAfter) != 1 || pidsAfter[0] == pids[0] {
			t.Fatal("bounded collector retry did not create a new owned observe process")
		}
		t.Logf("REAL owned observe subprocess transport interrupted at=%s -> stale -> bounded actual mTLS reconnect/health live with distinct PID; root relay untouched. This is collector interruption, not relay/CNI outage proof", interrupted.Format(time.RFC3339Nano))
	}) {
		return
	}
	if !t.Run("actual-window-expiry-after-bounded-traffic-stop", func(t *testing.T) {
		for deadline := time.Now().Add(15 * time.Second); time.Now().Before(deadline); {
			snapshot := fetch(adminLease)
			pairs := 0
			for _, flow := range snapshot.Flows {
				if pair(flow, "same") || pair(flow, "cross") {
					pairs++
				}
			}
			if time.Since(lastTraffic) > 11*time.Second && pairs == 0 {
				t.Log("REAL traffic stopped; own measured same/cross UID pair groups expired from10s window; no synthetic flow kept alive")
				return
			}
			time.Sleep(200 * time.Millisecond)
		}
		t.Fatal("measured pair flow groups did not expire after bounded traffic stop")
	}) {
		return
	}
	t.Run("lease-release-reacquire-and-child-cleanup", func(t *testing.T) {
		release(adminLease)
		for deadline := time.Now().Add(5 * time.Second); time.Now().Before(deadline) && len(observePIDs()) != 0; {
			time.Sleep(50 * time.Millisecond)
		}
		if len(observePIDs()) != 0 {
			t.Fatal("last identity lease release left observe child")
		}
		fresh := newLease(contextName, ns, operator)
		waitLive(fresh)
		release(fresh)
		s.closeProviders()
		if len(observePIDs()) != 0 {
			t.Fatal("provider Close left owned observe child")
		}
		t.Log("REAL readonly last-lease DELETE canceled collector; reacquire established actual TLS live; release+Hub.Close joined subprocess/readers and left zero owned observe children")
	})
}
