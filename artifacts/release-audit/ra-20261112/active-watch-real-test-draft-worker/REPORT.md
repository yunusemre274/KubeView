# Real watch/RBAC revoke test draft — NOT_RUN

The Go source is an artifact-only draft, not copied to backend/pkg/server, compiled, tested or integration-ready. Only gofmt syntax/formatting ran. No app, lab, provider, cluster, credential-value read, Git/index or roadmap action occurred. Root owns final integration and execution.

Implemented body uses sealed lab/cluster/marker/namespace guards and static verified TLS patterns from release_secret_real_test.go. It builds two real TokenRequest/SSR identities with normal credential-backed clients, normal access login/workspace/connection/harbor HTTP paths, and production loopback19846 WebSockets. Both identities require exact-UID snapshot and UPDATE positives. A's RoleBinding is deleted with owner/UID/currentRV checks; real SSAR denies, direct API/gatewayGET403 and unchanged client IDs are independent assertions. B retains fresh200 and UPDATE. A needs explicit forbidden/non-authoritative/syncedfalse scope and real CloseError/EOF; timeout fails. Numeric/secret/auth bodies are not written. Six fixture records are captured for exact reverse cleanup and404; original2Nodes and profile/state checks are included.

Root identified two handoff blockers during the final minute, so the draft was frozen rather than expanded:

1. **Must correct inert fixture:** current nonexistent nodeName can trigger orphan-Pod GC. Replace with a run-unique unregistered schedulerName, empty nodeName; remove absent-Node GET and require exact scheduler plus empty nodeName on updates/observations. No actual scheduler/Node/workload should be created.
2. **Must correct cleanup ordering:** custom cleanup precedes t.TempDir registration; LIFO can remove config/workspace before gateway close. Reorder TempDir/custom cleanup or explicitly close gateway/sockets first.

Also review private-input guard order: inherited prefix loads config/state before later mode/size checks; move checks ahead of loading and enforce fresh empty output/exclusive evidence. Actual upstream-watch lifetime is not independently instrumented, so no heartbeat-only causality is asserted. Root must type-check after correction; this job deliberately did not compile/test. Main105s plus cleanup45s/evidence reserve and later outer180s remain design budgets, not measured execution results.

Exact draft/input SHA and timing are in PLAN.json. No backend source was changed. Known blockers are explicit; do not run this frozen draft unchanged.
