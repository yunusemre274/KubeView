# TEST04.05 real template request/limit — FAIL

**The single real test failed at the maximum3owned-Pod guard during the positive template rollout.** The request was acceptedHTTP202, but the new2Ready/quantity/PodUID proof was not reached. `readReady` observed more than3 Pods carrying the unique owned run label; exact count, phases and deletion timestamps were not retained. This is a guarded failed phase, not a completed resources acceptance result. A transient overlap with terminating old Pods is a possibility, not an established cause. No guard was relaxed and no retry occurred.

Initial2Ready, controller generation1/observedGeneration1 and exact Pod→ReplicaSet→Deployment UID chains passed for Deployment UID2042bb69-7af4-4cdf-a3d5-318bb37c3234. Two negative resource bodies returned422: malformed quantity and CPU request greater than limit. Each rejection left the original template SHA256, Deployment generation and both PodUIDs unchanged. The read-only creation negative403 and explicit local session/management grant also passed. The positive POST used the same production `/api/actions` resources action as the UI, requesting CPU/memory requests5m/8Mi→10m/16Mi and limits50m/32Mi→100m/64Mi. These are desired request/limit values; no utilization/metrics claim is made.

| Check | Outcome |
|---|---|
|Owned scope/namespace/cluster/marker/worker identity|PASS|
|Initial2Ready and owner chains|PASS|
|Invalid quantity422; unchanged template/PodUIDs|PASS|
|Request>limit422; unchanged template/PodUIDs|PASS|
|Authorized resources HTTP202|PASS, API acceptance only|
|New template generation / all four actual quantities / both new PodUIDs|NOT COMPLETED: Pod ceiling guard fired|
|UID+RV foreground cleanup; typed/dynamic404; Pod/RS LIST0|PASS|
|Other fixture UID/spec/PodUID equality after cleanup|PASS|

Actual test elapsed6.260494s; outer process18.201s including compile/startup. Go1.26.11/GOMAXPROCS1, -p1/-parallel1, one exact test, -timeout180s and outer240s were used. Max test/outer sample gaps0.255964s/0.255s were below5s. Timing controls were valid; functional acceptance failed. No CPU or application benchmark inference is made.

Scope remained the explicit owned profile06 client namespace UID863e13d5-da6d-481d-9484-64eb088d8df8, kube-system UID e84bb50e-8d64-4bc2-905c-9b5ba193e53a, marker/owner lab kvml-d32afbf634e8 and fixed existing worker. Cluster/namespace guards ran before every requested mutation and cleanup. The separate gateway was http://127.0.0.1:57085; it used only the explicit static private admin kubeconfig and a private app-data0700 workspace. No default kubeconfig, running app19846, relay, Docker, CNI, bootstrap or product configuration was changed.

One synthetic Deployment used busybox1.37.0,2replicas, Recreate strategy,5s grace and required NodeAffinity metadata.name In worker.Name. Its durable name/run-label/UID-scope plan was flushed before any create. Following the ceiling failure, registered cleanup used exact known run-label/owner/UID and UID+resourceVersion deletion preconditions. Typed and dynamic GVK GET404 and Pod/ReplicaSet label LIST0 were recorded. The existing HTTP-server and traffic fixtures retained their original UIDs, spec hashes and PodUID sets after cleanup. Gateway/transport/Server Close cleanups returned. No source fixes or additional jobs followed the failure.

Only the authorized release_operations_real_test.go changed: common private fixture/identity/HTTP/readiness/cleanup code now serves two separately opt-in wrappers; the resource branch adds quantity/template/new-Pod assertions. Default CI skips both unless its distinct exact environment opt-in matches. No400line duplicate or production handler change was added. The shared-harness extraction means **Scale regression is RETEST_REQUIRED for this new source**; the prior ScalePASS remains historical at checkpoint46ec5508. It was not rerun in this job. All23prior Scale artifact hashes and the exact old source snapshot remain unchanged.

UI source ResourceForms.jsx submits containers{name,resources}, actionresources and UID/RV to POST/api/actions. resources.go validates quantities and request<=limit, preserves other workload fields and performs its strict dynamic update after production grant/SSAR. The test did not bypass this through Typed Update. Source before/after hashes match during execution. Source-review receipts, exact helper patch/snapshot, command, safe timeline, raw test events, cleanup and artifact checksums are included. No credential/nonce/Secret values, raw workload YAML or container logs are included. The unresolved positive rollout needs a separately authorized investigation; this report makes no release/risk-acceptance decision.
