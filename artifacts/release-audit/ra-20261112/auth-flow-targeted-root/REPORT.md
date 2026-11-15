# TEST-01.02 — active auth dataflow: targeted guard execution

Status: **17 TOP-LEVEL /13 SUBTESTS PASS; PHASE ADJUDICATION PENDING**.

Runtime product f32 is unchanged; invocation HEAD2934b8f0. Root first verified
port5192 free after both instrumented GPU diagnostic jobs ended. This run used
Go1.26.11, fake Kubernetes clients/in-process HTTP and owned test fixtures only,
KUBECONFIG=/dev/null,GOMAXPROCS2,GOMEMLIMIT1GiB,package parallelism1,test parallelism1,
-count=1 and90s Go timeout. No real cluster/provider/cookie credential was read.

One actual invocation finished in4.966728s of150s wall budget (15s cleanupreserve).
Peak sampled summed owned Go process RSS648.984375MiB over20 samples, below1.5GiB;
this is not exact physical RAM. Four captured process identities are absent;
source before/after hashes match. stdout JSON has all17 expected top-level PASS,
13 nested PASS,package PASS,zeroFAIL andzeroSKIP. No automatic retry, cached-test
PASS or compiler exit alone was treated as test acceptance.

[Plan/test names/source hashes](plan.json),[exact command/cwd/timing/process cleanup](execution.json),
[Go JSON events](go-test.jsonl),[runner source](run.py),
[source-flow audit](../auth-flow-source-review-worker/REPORT.md).

The source worker's separate proposed18-test list is NOT this group's execution:
root ran12 of that list plus5 relevant neighbor controls. Six suggested scope/
credential/direct-read-only controls are still NOT_RUN in this new group. Historic
proofs keep their original scope and source byte-equivalence; fake-client SSAR
fixtures do not prove actual upstream RBAC/admission behavior. Management enable
checks API transport, while actual operations check SSAR Allowed and face the API.

The access-cookie MaxAge is not a separate server expiry for a configured static
access token; the operator/grant absolute8h lifetime is different. The internal
managementAllowed path without operatorRequest is not a public bypass because
protect supplies that authority context. Read-only, stale/missing nonce/context,
revoke/late-enable, profile cookies and scope cancellation have positive/negative
controls in this group; all routes, tenants, TLS, real RBAC, websocket handshakes,
provider paths and final packaging are separate phases.

The source review's approximate300s workflow target was exceeded (~340s); recorded
as a workflow timing miss, not a passed productSLO. A second reviewer evaluates
whether the six unrun source-suggested controls are required before this specific
source-dataflow phase can close. No whole CAT09/CAT10 acceptance is asserted.

To inspect/repeat: the exact argv/17-name anchored regex is in plan/execution.
Historical run.py refuses if supervisor/execution already exists. A new run needs
a fresh output directory at the same depth and a newly checked source/plan record;
never overwrite these results or relabel current source as the historical source.
