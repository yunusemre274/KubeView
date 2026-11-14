package server

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
)

// This group exercises the registered production resource handler and real
// client-go JSON transport against an owned minimal HTTP fixture. The existing
// typed authorization fixture remains synthetic; no Kubernetes admission/schema
// validation, browser interaction, or real-cluster acceptance is claimed.
func TestReleaseResourceParserBoundedJSONTransport(t *testing.T) {
	t.Setenv("KV_HUBBLE_ENABLED", "false")
	t.Setenv("KV_MINIKUBE_ENABLED", "false")
	s, c := testServer(t, false)
	var mu sync.Mutex
	var captured []map[string]interface{}
	var wireErrors []string
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		defer mu.Unlock()
		if r.Method != http.MethodPost || r.URL.Path != "/api/v1/namespaces/qa/pods" || r.URL.Query().Get("dryRun") != "All" || r.URL.Query().Get("fieldValidation") != "Strict" || r.URL.Query().Get("timeout") != "3s" || len(r.URL.Query()) != 3 {
			wireErrors = append(wireErrors, "unexpected method/path/dryRun/fieldValidation/timeout query")
		}
		if r.Header.Get("Content-Type") != "application/json" {
			wireErrors = append(wireErrors, "unexpected upstream content type")
		}
		decoder := json.NewDecoder(io.LimitReader(r.Body, 3<<20))
		decoder.UseNumber()
		var object map[string]interface{}
		if err := decoder.Decode(&object); err != nil {
			wireErrors = append(wireErrors, "invalid upstream object JSON")
			http.Error(w, "fixture parse rejected", 400)
			return
		}
		captured = append(captured, object)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		if err := json.NewEncoder(w).Encode(object); err != nil {
			wireErrors = append(wireErrors, "fixture response encode failed")
		}
	}))
	t.Cleanup(upstream.Close)
	dyn, err := dynamic.NewForConfig(&rest.Config{Host: upstream.URL, Timeout: 3 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	c.Dynamic = dyn
	ctx, cancel := context.WithCancel(context.Background())
	s.operatorMu.Lock()
	s.operators["resource-parser-operator"] = &operatorSession{context: "test", namespace: "qa", clientID: "unit-client", nonce: "resource-parser-intent", enabled: true, expires: time.Now().Add(time.Minute), ctx: ctx, cancel: cancel}
	s.operatorMu.Unlock()
	mux := http.NewServeMux()
	s.Register(mux)
	valid := []byte(`{"dryRun":true,"object":{"apiVersion":"v1","kind":"Pod","metadata":{"name":"parser-before","labels":{"audit":"synthetic-only"}},"spec":{"containers":[{"name":"app","image":"busybox:1.36"}]}}}`)
	large := []byte(`{"dryRun":true,"object":{"apiVersion":"v1","kind":"Pod","metadata":{"name":"oversize"},"padding":"` + strings.Repeat("x", (2<<20)+256) + `"}}`)
	// The complete input has depth10001: two envelope objects +9999 arrays.
	deep := []byte(`{"dryRun":true,"object":{"apiVersion":"v1","kind":"Pod","metadata":{"name":"depth"},"unknown":` + strings.Repeat("[", 9999) + `0` + strings.Repeat("]", 9999) + `}}`)
	if len(deep) > 128<<10 || len(large) <= 2<<20 {
		t.Fatal("fixture size guard")
	}
	// Unstructured's map values replace repeated metadata objects. This differs
	// from repeated map fields decoded into an already populated struct field.
	// Integer precision and unknown fields must survive to the strict API call;
	// this echo fixture does not pretend the real API would admit unknown fields.
	last := []byte(`{"dryRun":false,"dryRun":true,"unknownEnvelope":{"ignored":true},"object":{"apiVersion":"v1","kind":"Pod","metadata":{"name":"discarded","annotations":{"old":"first"}},"metadata":{"name":"parser-after","annotations":{"kept":"second"}},"spec":{"containers":[{"name":"app","image":"busybox:1.36"}]},"unknownField":{"integer":9007199254740993,"fraction":1.25}}}`)
	cases := []struct {
		name, mime string
		body       []byte
		status     int
	}{
		{"normal_namespace_injected", "application/json", valid, 201},
		{"malformed", "application/json", []byte(`{"object":`), 400},
		{"second_value", "application/json", append(append([]byte{}, valid...), []byte(` {}`)...), 400},
		{"non_json_mime", "text/plain", valid, 415},
		{"object_array", "application/json", []byte(`{"dryRun":true,"object":[]}`), 400},
		{"nonobject_metadata", "application/json", []byte(`{"dryRun":true,"object":{"apiVersion":"v1","kind":"Pod","metadata":"invalid"}}`), 422},
		{"missing_name", "application/json", []byte(`{"dryRun":true,"object":{"apiVersion":"v1","kind":"Pod","metadata":{}}}`), 422},
		{"null_object", "application/json", []byte(`{"dryRun":true,"object":null}`), 422},
		{"over_2MiB", "application/json", large, 400},
		{"depth_10001", "application/json", deep, 400},
		{"namespace_mismatch", "application/json", []byte(`{"dryRun":true,"object":{"apiVersion":"v1","kind":"Pod","metadata":{"name":"mismatch","namespace":"other"}}}`), 422},
		{"after_negatives_duplicate_numeric_unknown", "application/json; charset=utf-8", last, 201},
	}
	total := 0
	if len(cases) != 12 {
		t.Fatal("fixed payload-count guard")
	}
	for _, tc := range cases {
		total += len(tc.body)
		if len(tc.body) > 3<<20 || total > 8<<20 {
			t.Fatal("bounded per-payload or aggregate byte budget")
		}
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			mu.Lock()
			before := len(captured)
			mu.Unlock()
			r := httptest.NewRequest(http.MethodPost, "http://localhost/api/resources?context=test&resource=pods&namespace=qa", bytes.NewReader(tc.body))
			r.Header.Set("Content-Type", tc.mime)
			r.Header.Set("X-KubeView-Connection", "resource-parser-intent")
			r.AddCookie(&http.Cookie{Name: operatorCookie, Value: "resource-parser-operator"})
			response := httptest.NewRecorder()
			mux.ServeHTTP(response, r)
			mu.Lock()
			defer mu.Unlock()
			if response.Code != tc.status {
				t.Fatalf("status=%d want=%d bytes=%d bodySHA256=%x", response.Code, tc.status, len(tc.body), sha256.Sum256(tc.body))
			}
			if len(wireErrors) != 0 {
				t.Fatalf("wire contract errors: %v", wireErrors)
			}
			if tc.status != 201 {
				if len(captured) != before {
					t.Fatal("rejected resource body reached upstream create")
				}
			} else {
				if len(captured) != before+1 {
					t.Fatal("positive control did not reach exactly one upstream create")
				}
				object := captured[len(captured)-1]
				metadata, ok := object["metadata"].(map[string]interface{})
				if !ok || metadata["namespace"] != "qa" {
					t.Fatal("selected namespace not preserved/injected in upstream object")
				}
				var result struct {
					Operation struct{ Status string } `json:"operation"`
				}
				if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil || result.Operation.Status != "validated" {
					t.Fatal("dry-run response was not labeled validated")
				}
				if tc.name == "normal_namespace_injected" {
					labels, ok := metadata["labels"].(map[string]interface{})
					if metadata["name"] != "parser-before" || !ok || labels["audit"] != "synthetic-only" {
						t.Fatal("normal name/metadata not retained")
					}
				} else {
					annotations, ok := metadata["annotations"].(map[string]interface{})
					unknown, present := object["unknownField"].(map[string]interface{})
					if metadata["name"] != "parser-after" || !ok || len(annotations) != 1 || annotations["kept"] != "second" || !present || unknown["integer"] != json.Number("9007199254740993") || unknown["fraction"] != json.Number("1.25") {
						t.Fatal("duplicate-map/scalar or lossless numeric/unknown object policy changed")
					}
					if _, exists := object["unknownEnvelope"]; exists {
						t.Fatal("unknown mutation-envelope field leaked into object")
					}
				}
			}
			t.Logf("RESOURCE_PARSER_CASE %s status=%d bytes=%d SHA256=%x upstreamCreateDelta=%d", tc.name, response.Code, len(tc.body), sha256.Sum256(tc.body), len(captured)-before)
		})
	}
	t.Logf("RESOURCE_PARSER_TOTAL payloads=%d totalBytes=%d upstreamCreates=%d maxDepth=10001; syntheticHTTPTransportOnly", len(cases), total, len(captured))
}
