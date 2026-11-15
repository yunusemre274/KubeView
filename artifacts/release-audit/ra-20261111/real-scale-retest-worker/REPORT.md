# TEST04.04 real scale2→3→1 — PASS

One authorized real retest passed in **9.438seconds**, with process elapsed18.206seconds including compile/startup. Go1.26.11/GOMAXPROCS1, -p1, -parallel1, -count1, exact test selection and -timeout180s were used; the outer limit was240s. Maximum test/outer heartbeat gaps were0.256344s/0.255s, below5s. This is a valid bounded result for this phase, not a CPU or application performance measurement.

| Observed Ready replicas | Deployment generation | Observed generation | Verified Ready owner chains |
|---|---|---|---|
|2|1|1|2|
|3|2|2|3|
|1|3|3|1|

All observations used the same Deployment UID `f4754930-4f24-489c-8743-a888bb740f48`. The helper checked exact desired/current/updated/Ready/available replica counts and controller observedGeneration using typed GET, cross-checked dynamic GET GVK/UID, and proved each Ready Pod→controller ReplicaSet→controller Deployment UID chain. At most3owned Pods were observed. Real scale actions used the production HTTP session, explicit scoped management grant, SSAR deployments/scale authorization and scale-subresource UID/resourceVersion checks. HTTP202 alone was never used as rollout proof. The readonly create was403; wrongUID and stale resourceVersion scale attempts were409.

The separate gateway was `http://127.0.0.1:56907`; its workspace/session/grant were local to this test. API allowlist was HTTPS127.0.0.1:53873, exact context/lab kvml-d32afbf634e8-a/kvml-d32afbf634e8, kube-system UID e84bb50e-8d64-4bc2-905c-9b5ba193e53a, namespace UID863e13d5-da6d-481d-9484-64eb088d8df8, verified marker/owner/profile06 and existing worker UID. Each scale flip and cleanup rechecked cluster/namespace identity. The active read-only app19846 was not configured, started or called. Global kubeconfig, relay, provider/CNI configuration and product handlers were untouched.

The fixture plan, synthetic name/run-label and ownership metadata were atomically flushed to timeline.json before the first create acceptance (plan16:16:41.860996Z; create16:16:41.880616Z). One Deployment used existing busybox1.37.0,5s termination grace, requests5mCPU/8Mi and limits50mCPU/32Mi. Required NodeAffinity matches `metadata.name In worker.Name`, preserving scheduler placement rather than assuming hostname labels. No credential/nonce/Secret values or raw resource YAML were logged. The shell payload is a literal container command, not a host shell interpolation.

Cleanup was registered before creation. It guarded the exact synthetic run labels/owner and UID, used UID+resourceVersion delete preconditions with foreground propagation, then proved typed and dynamic GVK GET404 and Pod/ReplicaSet run-label LIST0. Existing HTTP-server and traffic Deployment UIDs/spec hashes/PodUID sets remained equal after every Ready transition and after cleanup. Gateway/transport/Server Close cleanups returned; no WebSocket was opened.

The first failure is retained unchanged under real-scale-worker/ (12files, checkpoint ef6875b0); all prior artifact hashes and its exact source snapshot match the preserved receipts. The local permission probe demonstrated a0755 test child and the fixed constant workspace error requiring0700; a new app-data child was0700 and opened successfully. This retest's actual testing.T.TempDir likewise recorded0755 and safe category workspace_directory_not_private_0700. The helper now passes a newly created app-data child; the product store guard was not relaxed. A local probe preparation command initially used the backend cwd with a wrong relative output path, failing redirection before go run; its corrected preparation and failure receipt are both retained, with no lab action involved.

The only repository source change is the authorized release_operations_real_test.go helper; source hashes remained stable during execution. helper.patch shows the private workspace child, metadata.name affinity, durable pre-mutation timeline, safe local error classification and post-cleanup fixture check. This test is real HTTP/Kubernetes acceptance through an isolated admin gateway; it does not establish normal UI, active app, restricted-RBAC denial, relay or release acceptance. No further phase or retry started.

See manifest.json, result.json, command.json, timeline.json, raw go-test.jsonl, source comparisons, local probe receipts, exact helper snapshot, patch, runner and SHA256SUMS.
