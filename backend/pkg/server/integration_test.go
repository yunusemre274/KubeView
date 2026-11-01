package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

// This test never selects a workstation's current context. Running it requires
// both the deliberately named disposable cluster and the dedicated namespace.
func TestDedicatedClusterManagement(t *testing.T) {
	if os.Getenv("KUBEVIEW_TEST_CONTEXT") != "kubeview-test" || os.Getenv("KUBEVIEW_TEST_NAMESPACE") != "kubeview-qa" {
		t.Skip("set KUBEVIEW_TEST_CONTEXT=kubeview-test KUBEVIEW_TEST_NAMESPACE=kubeview-qa for isolated live integration")
	}
	t.Setenv("KUBE_CONTEXT", "kubeview-test")
	s := New()
	s.ReadOnly = false
	s.Namespace = "kubeview-qa"
	s.Token = ""
	mux := http.NewServeMux()
	s.Register(mux)
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
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		raw, _ := io.ReadAll(res.Body)
		var result map[string]interface{}
		if err = json.Unmarshal(raw, &result); err != nil {
			t.Fatalf("non-JSON %s", raw)
		}
		return res.StatusCode, result
	}
	require := func(method, path string, body interface{}) map[string]interface{} {
		t.Helper()
		code, res := call(method, path, body)
		if code >= 300 {
			t.Fatalf("%s %s -> %d: %#v", method, path, code, res)
		}
		return res
	}
	nodes := require("GET", "/api/resources?resource=nodes", nil)
	if len(nodes["items"].([]interface{})) < 1 {
		t.Fatal("dedicated cluster has no nodes")
	}
	suffix := strings.Split(uuid.NewString(), "-")[0]
	name := "backend-it-" + suffix
	deploymentPath := "/api/resources?group=apps&version=v1&resource=deployments&namespace=kubeview-qa"
	deployment := map[string]interface{}{"apiVersion": "apps/v1", "kind": "Deployment", "metadata": map[string]interface{}{"name": name, "namespace": "kubeview-qa"}, "spec": map[string]interface{}{"replicas": int64(1), "selector": map[string]interface{}{"matchLabels": map[string]interface{}{"app": name}}, "template": map[string]interface{}{"metadata": map[string]interface{}{"labels": map[string]interface{}{"app": name}}, "spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "registry.k8s.io/pause:3.10", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "10m", "memory": "8Mi"}}}}}}}}
	preview := require("POST", deploymentPath, map[string]interface{}{"object": deployment, "dryRun": true})
	if preview["operation"].(map[string]interface{})["status"] != "validated" {
		t.Fatal("dry-run did not validate")
	}
	code, _ := call("GET", deploymentPath+"&name="+name, nil)
	if code != 404 {
		t.Fatal("dry-run persisted resource")
	}
	require("POST", deploymentPath, map[string]interface{}{"object": deployment})
	cleanup := func(path string) {
		t.Helper()
		for attempt := 0; attempt < 20; attempt++ {
			code, current := call("GET", path, nil)
			if code == 404 {
				return
			}
			if code >= 300 {
				t.Errorf("cleanup get %d %#v", code, current)
				return
			}
			metadata := current["metadata"].(map[string]interface{})
			code, res := call("DELETE", path, map[string]interface{}{"uid": metadata["uid"], "resourceVersion": metadata["resourceVersion"]})
			if code == 202 || code == 404 {
				return
			}
			if code != 409 {
				t.Errorf("cleanup %d %#v", code, res)
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
	}
	defer cleanup(deploymentPath + "&name=" + name)
	action := func(resource, group, name, operation string, extra map[string]interface{}) map[string]interface{} {
		t.Helper()
		path := fmt.Sprintf("/api/resources?group=%s&version=v1&resource=%s&namespace=kubeview-qa&name=%s", group, resource, name)
		for attempt := 0; attempt < 30; attempt++ {
			current := require("GET", path, nil)
			metadata := current["metadata"].(map[string]interface{})
			body := map[string]interface{}{"group": group, "version": "v1", "resource": resource, "namespace": "kubeview-qa", "name": name, "uid": metadata["uid"], "resourceVersion": metadata["resourceVersion"], "action": operation}
			for k, v := range extra {
				body[k] = v
			}
			code, res := call("POST", "/api/actions", body)
			if code < 300 {
				return res
			}
			if code != 409 {
				t.Fatalf("action %s -> %d %#v", operation, code, res)
			}
			time.Sleep(100 * time.Millisecond)
		}
		t.Fatalf("action %s repeatedly conflicted", operation)
		return nil
	}
	action("deployments", "apps", name, "scale", map[string]interface{}{"replicas": 2})
	current := require("GET", deploymentPath+"&name="+name, nil)
	if current["spec"].(map[string]interface{})["replicas"] != float64(2) {
		t.Fatal("scale target did not persist")
	}
	action("deployments", "apps", name, "restart", nil)
	action("deployments", "apps", name, "resources", map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "20m", "memory": "8Mi"}, "limits": map[string]interface{}{"cpu": "100m", "memory": "32Mi"}}}}})
	// Wait for the deployment controller's actual revision observation before rollback.
	for attempt := 0; attempt < 100; attempt++ {
		current = require("GET", deploymentPath+"&name="+name, nil)
		metadata := current["metadata"].(map[string]interface{})
		annotations, _ := metadata["annotations"].(map[string]interface{})
		if annotations["deployment.kubernetes.io/revision"] != "1" && annotations["deployment.kubernetes.io/revision"] != nil {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}
	action("deployments", "apps", name, "rollback", map[string]interface{}{"revision": 1})
	cronName := name + "-cron"
	cronPath := "/api/resources?group=batch&version=v1&resource=cronjobs&namespace=kubeview-qa"
	template := deployment["spec"].(map[string]interface{})["template"].(map[string]interface{})
	template["spec"].(map[string]interface{})["restartPolicy"] = "Never"
	cron := map[string]interface{}{"apiVersion": "batch/v1", "kind": "CronJob", "metadata": map[string]interface{}{"name": cronName, "namespace": "kubeview-qa"}, "spec": map[string]interface{}{"schedule": "0 0 1 1 *", "suspend": true, "jobTemplate": map[string]interface{}{"spec": map[string]interface{}{"template": template}}}}
	require("POST", cronPath, map[string]interface{}{"object": cron})
	defer cleanup(cronPath + "&name=" + cronName)
	action("cronjobs", "batch", cronName, "resume", nil)
	action("cronjobs", "batch", cronName, "suspend", nil)
	job := action("cronjobs", "batch", cronName, "run-now", nil)["object"].(map[string]interface{})
	jobName := job["metadata"].(map[string]interface{})["name"].(string)
	defer cleanup("/api/resources?group=batch&version=v1&resource=jobs&namespace=kubeview-qa&name=" + jobName)
	t.Log("real dedicated-cluster server dry-run/create/scale/restart/resources/rollback/CronJob resume/suspend/run-now/delete verified")
}

func TestDedicatedClusterPodSessions(t *testing.T) {
	if os.Getenv("KUBEVIEW_TEST_CONTEXT") != "kubeview-test" || os.Getenv("KUBEVIEW_TEST_NAMESPACE") != "kubeview-qa" {
		t.Skip("requires explicitly isolated kubeview-test / kubeview-qa")
	}
	t.Setenv("KUBE_CONTEXT", "kubeview-test")
	s := New()
	s.ReadOnly = false
	s.Namespace = "kubeview-qa"
	s.Token = ""
	mux := http.NewServeMux()
	s.Register(mux)
	httpServer := httptest.NewServer(mux)
	defer httpServer.Close()
	name := "backend-session-" + strings.Split(uuid.NewString(), "-")[0]
	path := "/api/resources?resource=pods&namespace=kubeview-qa&name=" + name
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
		res, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer res.Body.Close()
		var result map[string]interface{}
		json.NewDecoder(res.Body).Decode(&result)
		return res.StatusCode, result
	}
	obj := map[string]interface{}{"apiVersion": "v1", "kind": "Pod", "metadata": map[string]interface{}{"name": name, "namespace": "kubeview-qa"}, "spec": map[string]interface{}{"containers": []interface{}{map[string]interface{}{"name": "app", "image": "busybox:1.36", "command": []interface{}{"sh", "-c", "mkdir -p /tmp/web; echo kubeview-real-http > /tmp/web/index.html; httpd -f -p 8080 -h /tmp/web & echo kubeview-real-log; sleep 120"}, "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "20m", "memory": "8Mi"}, "limits": map[string]interface{}{"cpu": "100m", "memory": "32Mi"}}}}}}
	code, result := call("POST", "/api/resources?resource=pods&namespace=kubeview-qa", map[string]interface{}{"object": obj})
	if code != 201 {
		t.Fatalf("create Pod %d %#v", code, result)
	}
	defer func() {
		for attempt := 0; attempt < 20; attempt++ {
			code, obj := call("GET", path, nil)
			if code == 404 {
				return
			}
			metadata := obj["metadata"].(map[string]interface{})
			code, _ = call("DELETE", path, map[string]interface{}{"uid": metadata["uid"], "resourceVersion": metadata["resourceVersion"]})
			if code == 202 || code == 404 {
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
	}()
	var pod map[string]interface{}
	for attempt := 0; attempt < 120; attempt++ {
		_, pod = call("GET", path, nil)
		status, _ := pod["status"].(map[string]interface{})
		if status["phase"] == "Running" {
			break
		}
		if attempt == 119 {
			t.Fatalf("Pod did not run: %#v", status)
		}
		time.Sleep(500 * time.Millisecond)
	}
	metadata := pod["metadata"].(map[string]interface{})
	uid := metadata["uid"].(string)
	response, err := http.Get(httpServer.URL + "/api/logs?namespace=kubeview-qa&pod=" + name + "&container=app&follow=false&uid=" + url.QueryEscape(uid))
	if err != nil {
		t.Fatal(err)
	}
	raw, _ := io.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != 200 || !bytes.Contains(raw, []byte("kubeview-real-log")) {
		t.Fatalf("actual logs missing %d %s", response.StatusCode, raw)
	}
	query := url.Values{"namespace": {"kubeview-qa"}, "pod": {name}, "container": {"app"}, "uid": {uid}, "command": {"sh", "-c", "echo kubeview-real-exec"}}
	conn, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(httpServer.URL, "http")+"/api/exec?"+query.Encode(), nil)
	if err != nil {
		t.Fatal(err)
	}
	conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	output := []byte{}
	for {
		_, chunk, err := conn.ReadMessage()
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseNormalClosure) {
				t.Fatal(err)
			}
			break
		}
		output = append(output, chunk...)
	}
	conn.Close()
	if !bytes.Contains(output, []byte("kubeview-real-exec")) {
		t.Fatalf("actual exec output missing %s", output)
	}
	code, forward := call("POST", "/api/portforwards", map[string]interface{}{"namespace": "kubeview-qa", "pod": name, "uid": uid, "port": 8080})
	if code != 201 {
		t.Fatalf("portforward session rejected: %d %#v", code, forward)
	}
	forwardURL := forward["url"].(string)
	forwardID := forward["id"].(string)
	defer call("DELETE", "/api/portforwards?id="+forwardID, nil)
	response, err = http.Get(httpServer.URL + forwardURL)
	if err != nil {
		t.Fatal(err)
	}
	httpPage, _ := io.ReadAll(response.Body)
	response.Body.Close()
	if response.StatusCode != 200 || !bytes.Contains(httpPage, []byte("kubeview-real-http")) {
		t.Fatalf("actual port-forward HTTP missing %d %s", response.StatusCode, httpPage)
	}
	rawQuery := url.Values{"namespace": {"kubeview-qa"}, "pod": {name}, "uid": {uid}, "port": {"8080"}}
	rawSocket, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(httpServer.URL, "http")+"/api/portforward?"+rawQuery.Encode(), nil)
	if err != nil {
		t.Fatal(err)
	}
	rawSocket.SetReadDeadline(time.Now().Add(10 * time.Second))
	if err = rawSocket.WriteMessage(websocket.BinaryMessage, []byte("GET / HTTP/1.1\r\nHost: pod\r\nConnection: close\r\n\r\n")); err != nil {
		t.Fatal(err)
	}
	rawPage := []byte{}
	for {
		_, chunk, e := rawSocket.ReadMessage()
		if e != nil {
			break
		}
		rawPage = append(rawPage, chunk...)
	}
	rawSocket.Close()
	if !bytes.Contains(rawPage, []byte("kubeview-real-http")) {
		t.Fatalf("raw SPDY port-forward missing %s", rawPage)
	}
	call("DELETE", "/api/portforwards?id="+forwardID, nil)
	code, _ = call("GET", forwardURL, nil)
	if code != 410 {
		t.Fatalf("closed port-forward still accessible: %d", code)
	}
	t.Log("real pods/portforward HTTP proxy, raw WS TCP forwarding and explicit session close verified")
	_, capabilities := call("GET", "/api/capabilities?resource=pods&namespace=kubeview-qa&name="+name, nil)
	subs := capabilities["subresources"].(map[string]interface{})
	if subs["resize"] != true {
		t.Log("cluster does not offer pods/resize; log/exec verified")
		return
	}
	for attempt := 0; attempt < 20; attempt++ {
		_, pod = call("GET", path, nil)
		metadata = pod["metadata"].(map[string]interface{})
		code, result = call("POST", "/api/actions", map[string]interface{}{"resource": "pods", "namespace": "kubeview-qa", "name": name, "uid": uid, "resourceVersion": metadata["resourceVersion"], "action": "resize", "containers": []interface{}{map[string]interface{}{"name": "app", "resources": map[string]interface{}{"requests": map[string]interface{}{"cpu": "40m", "memory": "8Mi"}, "limits": map[string]interface{}{"cpu": "100m", "memory": "32Mi"}}}}})
		if code == 202 {
			break
		}
		if code != 409 {
			t.Fatalf("resize rejected %d %#v", code, result)
		}
		time.Sleep(100 * time.Millisecond)
	}
	if code != 202 {
		t.Fatal("resize conflicted repeatedly")
	}
	for attempt := 0; attempt < 100; attempt++ {
		_, pod = call("GET", path, nil)
		if pod["metadata"].(map[string]interface{})["uid"] != uid {
			t.Fatal("resize replaced Pod UID")
		}
		status := pod["status"].(map[string]interface{})
		statuses, _ := status["containerStatuses"].([]interface{})
		if len(statuses) > 0 {
			container := statuses[0].(map[string]interface{})
			resources, _ := container["resources"].(map[string]interface{})
			requests, _ := resources["requests"].(map[string]interface{})
			if requests["cpu"] == "40m" {
				t.Log("real logs/exec and applied in-place CPU resize with same Pod UID verified")
				return
			}
		}
		time.Sleep(200 * time.Millisecond)
	}
	t.Fatalf("resize accepted but applied container resources not observed: %#v", pod["status"])
}
