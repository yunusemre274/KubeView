package server

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/k8s-tersane/tersane/backend/pkg/traffic"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func TestOwnedRepairRealHubbleMeasuredProtocols(t *testing.T) {
	if os.Getenv("KUBEVIEW_REPAIR_PROTOCOL_PROOF") != "true" || os.Getenv("KV_HUBBLE_ENABLED") != "true" {
		t.Skip("requires explicit owned CP flow-pair and L7 policy UID proof")
	}
	s, c, ctx, contextName, gateway := ownedRepairGateway(t)
	s.Namespace = ""
	const ns = "kv-repair-qa"
	client, err := c.Typed.CoreV1().Pods(ns).Get(ctx, "flow-client", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	server, err := c.Typed.CoreV1().Pods(ns).Get(ctx, "flow-same", metav1.GetOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if string(client.UID) != os.Getenv("KUBEVIEW_REPAIR_PROTOCOL_CLIENT_UID") || string(server.UID) != os.Getenv("KUBEVIEW_REPAIR_PROTOCOL_SERVER_UID") || client.Spec.NodeName != server.Spec.NodeName || client.Labels["app"] != "kv-measured-flow" || server.Labels["app"] != "kv-measured-flow" {
		t.Fatal("refusing changed/unowned same-Node flow fixtures")
	}
	policyName, policyUID := os.Getenv("KUBEVIEW_REPAIR_PROTOCOL_POLICY"), os.Getenv("KUBEVIEW_REPAIR_PROTOCOL_POLICY_UID")
	if !strings.HasPrefix(policyName, "kv-flow-protocol-") || policyUID == "" {
		t.Fatal("explicit owned L7 policy identity required")
	}
	policy, err := c.Dynamic.Resource(schema.GroupVersionResource{Group: "cilium.io", Version: "v2", Resource: "ciliumnetworkpolicies"}).Namespace(ns).Get(ctx, policyName, metav1.GetOptions{})
	if err != nil || string(policy.GetUID()) != policyUID || policy.GetLabels()["kubeview.io/repair-owner"] != "backend-manager" {
		t.Fatal("owned L7 policy identity mismatch")
	}
	if net.ParseIP(server.Status.PodIP) == nil {
		t.Fatal("server IP invalid")
	}
	paths := []string{}
	for _, namespace := range []string{ns, ""} {
		q := url.Values{"context": {contextName}, "namespace": {namespace}, "subscription": {uuid.NewString()}}
		paths = append(paths, gateway+"/api/flows?"+q.Encode())
	}
	t.Cleanup(func() {
		cleanup, done := context.WithTimeout(context.Background(), 10*time.Second)
		defer done()
		for _, path := range paths {
			code, _ := repairHTTP(t, cleanup, "DELETE", path, nil)
			if code != 200 {
				t.Error("protocol proof lease not released")
			}
		}
	})
	fetch := func(path string) traffic.Snapshot {
		t.Helper()
		code, raw := repairHTTP(t, ctx, "GET", path, nil)
		if code != 200 {
			t.Fatalf("actual protocol flow API HTTP%d", code)
		}
		var snapshot traffic.Snapshot
		if json.Unmarshal(raw, &snapshot) != nil {
			t.Fatal("actual flow JSON malformed")
		}
		return snapshot
	}
	for deadline := time.Now().Add(12 * time.Second); ; {
		ready := true
		for _, path := range paths {
			ready = fetch(path).Status == "live" && ready
		}
		if ready {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("real Hubble TLS collectors not live")
		}
		time.Sleep(100 * time.Millisecond)
	}
	// Only validated, UID-owned Pod/IP arguments enter this test-only fixed CLI
	// command. Application payload/output is discarded and never an artifact.
	address := net.JoinHostPort(server.Status.PodIP, "8080")
	command := exec.CommandContext(ctx, "kubectl", "--kubeconfig", os.Getenv("KUBECONFIG"), "--context", contextName, "exec", "-n", ns, client.Name, "--", "sh", "-c", "set -e; for i in 1 2 3; do wget -q -T 3 -O /dev/null http://"+address+"; sleep .2; done; nslookup kubernetes.default.svc.cluster.local >/dev/null")
	command.Stdout = io.Discard
	command.Stderr = io.Discard
	if err = command.Run(); err != nil {
		t.Fatal("owned same-Node HTTP/DNS request command failed")
	}
	clientUID, serverUID := string(client.UID), string(server.UID)
	var foundL4, foundHTTP, foundDNS bool
	var dnsUID string
	for deadline := time.Now().Add(12 * time.Second); time.Now().Before(deadline); {
		for i, path := range paths {
			snapshot := fetch(path)
			for _, flow := range snapshot.Flows {
				uid := func(e traffic.Endpoint) string {
					if e.UID != nil {
						return *e.UID
					}
					return ""
				}
				src, dst := uid(flow.Source), uid(flow.Destination)
				pair := (src == clientUID && dst == serverUID) || (src == serverUID && dst == clientUID)
				if flow.Protocol == "TCP" && (flow.HTTPCode != nil || flow.HTTPProtocol != nil || flow.DNSRcode != nil || flow.LatencyMS != nil) {
					t.Fatal("genuine L4 flow retained spurious L7 application metadata")
				}
				if i == 0 && pair && flow.Protocol == "TCP" {
					foundL4 = true
				}
				if i == 0 && pair && flow.Protocol == "HTTP" && flow.HTTPCode != nil && *flow.HTTPCode == 200 && flow.HTTPProtocol != nil && *flow.HTTPProtocol == "HTTP/1.1" && flow.LatencyMS != nil {
					foundHTTP = true
				}
				if i == 1 && flow.Protocol == "DNS" && flow.TransportProtocol == "UDP" {
					if src == clientUID && flow.Destination.Namespace == "kube-system" && dst != "" {
						foundDNS = true
						dnsUID = dst
					}
					if dst == clientUID && flow.Source.Namespace == "kube-system" && src != "" {
						foundDNS = true
						dnsUID = src
					}
				}
			}
		}
		if foundL4 && foundHTTP && foundDNS {
			t.Logf("REAL owned CP-pair request→Cilium/Hubble1.20.2 TLS→strict mask/decoder→HTTP API: L4=TCP with no L7 fields; genuine HTTP/1.1 response200 + L7 response latency; genuine DNS/UDP. context=%s clusterUID=%s clientUID=%s serverUID=%s CoreDNSUID=%s policyUID=%s; QA filter excludes DNS cross-namespace while separately authorized all-namespace scope includes it; observations are not packet/byte counts", contextName, os.Getenv("KUBEVIEW_REPAIR_CLUSTER_UID"), clientUID, serverUID, dnsUID, policyUID)
			return
		}
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatalf("actual protocol proof incomplete: TCP=%t HTTP=%t DNS=%t", foundL4, foundHTTP, foundDNS)
}
