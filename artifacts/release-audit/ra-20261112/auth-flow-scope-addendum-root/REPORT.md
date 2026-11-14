# TEST-01.02 — six-control scope addendum

**6 exact top-level +18 subtests PASS; final peer review pending.**

This group ran only the six missing controls identified by the prior source/peer
review. The earlier17 were not rerun or rewritten. Source HEADbf8c87e2, runtimef32
unchanged. It completed in2.276627s/150s wall, fixedGo1.26.11,p1/parallel1/count1,
90sGo timeout, syntheticfake/in-processHTTP fixtures. Allsourcebefore/afterhashes
match, noFAIL/SKIP, correct packagePASS, three capturedidentitiesabsent.

The six controls cover workspace CSRF/persistence/scope, harbor/tab grant and
selector-edit revoke, explicit shared-Node-impact acknowledgement, synthetic
kubeconfig credential-generation reload, globalReadOnly despite retained grant,
and typed Secret selector fail-closed when discovery omits the resource.

The credential test constructs a client from a0600temporarysynthetickubeconfig
and verifies fingerprint/generation/revoke; it does not prove real APIcredential
revocation. Exec/forward positive503 checks reach transport preflight only, not
an actual terminal or tunnel. Provider paths are disabled; all upstream clients
in the mutation/Secret fixtures are fake. No actual user Secret/kubeconfig was
read. NoNodeprovisioning or realCluster/RBAC/TLS/WS/provideracceptance follows.

The runner is a separate copy of the committed17-test runner, changing only the
exact expected count17→6 and explicit KV_MINIKUBE/KV_HUBBLE=false/API_TOKENempty.
[Plan/helperSHA](plan.json),[exactargv/timing/cleanup](execution.json),
[JSONevents](go-test.jsonl),[23unique/31nested union](coverage-union.json).
No historicaloutput or test expectation was rewritten. Three known absent
identities do not establish an exhaustive census of all short-lived processes.

Together the two fresh groups cover all18 source-suggestednames plus5neighbors,
23unique top-level and31nestedcontrols. This is a source/targetedguardcoverage
statement, not a claim that allsecuritycategories or realKubernetes passed.
Root owns phase closure after the addendum peer review.
