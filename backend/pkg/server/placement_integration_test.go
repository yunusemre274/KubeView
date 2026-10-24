package server

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// This deliberately named context and namespace are the only live mutation
// scope accepted by this opt-in test; the workstation current-context is unused.
func TestDedicatedClusterTargetedScheduling(t *testing.T) {
	if os.Getenv("KUBEVIEW_TEST_CONTEXT") != "kubeview-test" || os.Getenv("KUBEVIEW_TEST_NAMESPACE") != "kubeview-qa" {
		t.Skip("requires explicitly isolated kubeview-test / kubeview-qa")
	}
	t.Setenv("KUBE_CONTEXT", "kubeview-test")
	server := New()
	server.ReadOnly = false
	server.Namespace = "kubeview-qa"
	server.Token = ""
	mux := http.NewServeMux()
	server.Register(mux)
	httpServer := httptest.NewServer(mux)
	defer httpServer.Close()
	call := func(method, path string, body interface{}) (int, map[string]interface{}) {
		t.Helper()
		var data []byte
		if body != nil {
			data, _ = json.Marshal(body)
		}
		req, err := http.NewRequest(method, httpServer.URL+path, bytes.NewReader(data))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Content-Type", "application/json")
		response, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		raw, _ := io.ReadAll(response.Body)
		var result map[string]interface{}
		if err = json.Unmarshal(raw, &result); err != nil {
			t.Fatalf("non-JSON response: %s", raw)
		}
		return response.StatusCode, result
	}
	code, nodeList := call("GET", "/api/resources?resource=nodes", nil)
	if code != 200 {
		t.Fatalf("Node list %d %#v", code, nodeList)
	}
	nodes := nodeList["items"].([]interface{})
	if len(nodes) < 1 {
		t.Fatal("test cluster has no actual Nodes")
	}
	selected := nodes[len(nodes)-1].(map[string]interface{})
	nodeMeta := selected["metadata"].(map[string]interface{})
	nodeName, nodeUID := nodeMeta["name"].(string), nodeMeta["uid"].(string)
	code, fresh := call("GET", "/api/resources?resource=nodes&name="+url.QueryEscape(nodeName), nil)
	if code != 200 || fresh["metadata"].(map[string]interface{})["uid"] != nodeUID {
		t.Fatalf("selected Node UID verification failed: %d %#v", code, fresh)
	}
	conn, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(httpServer.URL, "http")+"/ws?context=kubeview-test", nil)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	conn.SetReadDeadline(time.Now().Add(30 * time.Second))
	var snapshot envelope
	for {
		if err = conn.ReadJSON(&snapshot); err != nil {
			t.Fatal(err)
		}
		if snapshot.Type == "SNAPSHOT" {
			break
		}
	}
	nodeCount := 0
	for _, r := range snapshot.Resources {
		if r.GetKind() == "Node" {
			nodeCount++
			if r.GetName() == "unassigned" {
				t.Fatal("synthetic Node in snapshot")
			}
		}
	}
	if nodeCount != len(nodes) {
		t.Fatalf("snapshot Node count differs from API: %d vs %d", nodeCount, len(nodes))
	}
	suffix := strings.Split(uuid.NewString(), "-")[0]
	name := "backend-target-" + suffix
	object := targetedPod(name, []interface{}{targetTerm(nodeName, "")})
	object.SetNamespace("kubeview-qa")
	unstructured.SetNestedSlice(object.Object, []interface{}{map[string]interface{}{"name": "app", "image": "busybox:1.36", "command": []interface{}{"sleep", "120"}}}, "spec", "containers")
	target := map[string]interface{}{"name": nodeName, "uid": nodeUID, "mode": "required"}
	basePath := "/api/resources?resource=pods&namespace=kubeview-qa"
	path := basePath + "&name=" + name
	cleanup := func(path string) {
		t.Helper()
		for attempt := 0; attempt < 25; attempt++ {
			code, obj := call("GET", path, nil)
			if code == 404 {
				return
			}
			if code != 200 {
				t.Errorf("cleanup get %d %#v", code, obj)
				return
			}
			metadata := obj["metadata"].(map[string]interface{})
			code, result := call("DELETE", path, map[string]interface{}{"uid": metadata["uid"], "resourceVersion": metadata["resourceVersion"]})
			if code == 202 || code == 404 {
				return
			}
			if code != 409 {
				t.Errorf("cleanup delete %d %#v", code, result)
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
	}
	code, result := call("POST", basePath, map[string]interface{}{"object": object, "dryRun": true, "targetNode": target})
	if code != 201 {
		t.Fatalf("target dry-run rejected %d %#v", code, result)
	}
	if node, _, _ := unstructured.NestedString(result["object"].(map[string]interface{}), "spec", "nodeName"); node != "" {
		t.Fatal("dry-run bypassed scheduler using nodeName")
	}
	code, _ = call("GET", path, nil)
	if code != 404 {
		t.Fatal("targeted dry-run persisted Pod")
	}
	code, result = call("POST", basePath, map[string]interface{}{"object": object, "targetNode": map[string]interface{}{"name": nodeName, "uid": "stale-node-uid", "mode": "required"}})
	if code != 409 {
		t.Fatalf("stale selected Node UID accepted: %d %#v", code, result)
	}
	code, result = call("POST", basePath, map[string]interface{}{"object": object, "targetNode": target})
	if code != 201 {
		t.Fatalf("targeted create rejected %d %#v", code, result)
	}
	defer cleanup(path)
	uid := result["object"].(map[string]interface{})["metadata"].(map[string]interface{})["uid"].(string)
	scheduled := false
	for {
		var message envelope
		if err = conn.ReadJSON(&message); err != nil {
			t.Fatal(err)
		}
		if message.Type != "RESOURCE_EVENT" || message.Object == nil || string(message.Object.GetUID()) != uid {
			continue
		}
		if message.Object.GetKind() != "Pod" {
			t.Fatal("created Pod acquired wrong kind")
		}
		actual, _, _ := unstructured.NestedString(message.Object.Object, "spec", "nodeName")
		if actual != "" {
			if actual != nodeName {
				t.Fatalf("scheduler picked wrong Node: %s != %s", actual, nodeName)
			}
			scheduled = true
			break
		}
	}
	if !scheduled {
		t.Fatal("target scheduling not observed")
	}
	t.Logf("server dry-run + stale UID rejection + watch-observed scheduler placement on metadata.name=%s verified; initial snapshot had %d actual Nodes", nodeName, nodeCount)
	// A raw affinity for a nonexistent Node remains a real Pending Pod, and the
	// real scheduling reason can be retrieved through the Event resource endpoint.
	pendingName := name + "-pending"
	pending := targetedPod(pendingName, []interface{}{targetTerm("kubeview-does-not-exist", "")})
	pending.SetNamespace("kubeview-qa")
	unstructured.SetNestedSlice(pending.Object, []interface{}{map[string]interface{}{"name": "app", "image": "busybox:1.36", "command": []interface{}{"sleep", "120"}}}, "spec", "containers")
	code, result = call("POST", basePath, map[string]interface{}{"object": pending})
	if code != 201 {
		t.Fatalf("raw Pending fixture rejected %d %#v", code, result)
	}
	pendingPath := basePath + "&name=" + pendingName
	defer cleanup(pendingPath)
	pendingUID := result["object"].(map[string]interface{})["metadata"].(map[string]interface{})["uid"].(string)
	conditionSeen, eventSeen := false, false
	for attempt := 0; attempt < 100; attempt++ {
		code, pod := call("GET", pendingPath, nil)
		if code != 200 {
			t.Fatalf("pending Pod missing %d %#v", code, pod)
		}
		node, _, _ := unstructured.NestedString(pod, "spec", "nodeName")
		if node != "" {
			t.Fatalf("unschedulable Pod placed on invented Node %s", node)
		}
		conditions, _, _ := unstructured.NestedSlice(pod, "status", "conditions")
		for _, raw := range conditions {
			condition := raw.(map[string]interface{})
			if condition["type"] == "PodScheduled" && condition["status"] == "False" && condition["reason"] == "Unschedulable" {
				conditionSeen = true
			}
		}
		code, events := call("GET", "/api/resources?resource=events&namespace=kubeview-qa&fieldSelector="+url.QueryEscape("involvedObject.uid="+pendingUID), nil)
		if code != 200 {
			t.Fatalf("scheduling Events endpoint failed %d %#v", code, events)
		}
		for _, item := range events["items"].([]interface{}) {
			event := item.(map[string]interface{})
			if event["reason"] == "FailedScheduling" && event["message"] != "" {
				eventSeen = true
			}
		}
		if conditionSeen && eventSeen {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	if !conditionSeen || !eventSeen {
		t.Fatalf("real unschedulable condition/event missing: condition=%t event=%t", conditionSeen, eventSeen)
	}
	code, nodeList = call("GET", "/api/resources?resource=nodes", nil)
	if code != 200 || len(nodeList["items"].([]interface{})) != nodeCount {
		t.Fatal("Pending Pod changed actual Node collection")
	}
	t.Log("raw Pending Pod preserved; real Unschedulable condition and UID-filtered FailedScheduling Event verified without synthetic Node")
}
