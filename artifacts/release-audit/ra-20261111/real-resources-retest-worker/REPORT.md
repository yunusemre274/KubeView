# TEST04.05 controlled resources retest — PASS

One real retest passed in **9.38810275s**; outer process elapsed19.294s including compile/startup. All9pure guard cases passed. Max test/outer sampling gaps0.270312s/0.279s were below5s. Initial battery17% passed the explicit >12% start gate. Go1.26.11/GOMAXPROCS1, -p1/-parallel1,180s test/240s outer limits and135s API+35s cleanup contexts were retained. The phase was finalized within its6minute budget. No retry or Scale regression ran.

The current run **confirmed** the precise4API-object condition: both initial old Pod UIDs were Succeeded with nonnil deletionTimestamp and their original ReplicaSet UID; two new Pending Pods belonged to a different, verified controller ReplicaSet. The source/controller check agrees: pinned Kubernetes1.35.1 excludes terminal Failed/Succeeded old Pod records when deciding whether old Pods are still running. [Primary controller source](https://raw.githubusercontent.com/kubernetes/kubernetes/v1.35.1/pkg/controller/deployment/recreate.go). The local HTTPS fetch failed with URLError and is retained; the official source was then read through the web tool. This evidence establishes the overlap in **this retest**; the earlier failed run lacked the required metadata and its exact cause remains unproven.

This was a separately authorized resource envelope, not a blind total-Pod ceiling increase. Resources mode permits at most2current Pods plus at most2exact known old UID/ReplicaSet records that are terminal and deleting. Every record must prove its controller owner; strategy must be Recreate. More than4total, more than2active, unknown terminal/deleting residue, wrong old ReplicaSet, missing limits or declared aggregate limits above300mCPU/192MiB fail immediately with cleanup. The Scale ceiling remains3. Trace rows retain exact UID, phase, deletion timestamp, ReplicaSet, ownership and declared limits whenever extra API records appear.

The conservative sum over all4records reached300mCPU and201,326,592bytes(192MiB) of declared limits: two old50m/32Mi and two new100m/64Mi. Terminal API records remain visible in the report; they are not silently removed from the observed count. These are declared configuration limits, not measured CPU/RAM usage. Application quality, frame and performance budgets were not changed.

| Acceptance | Result |
|---|---|
|Initial2Ready / final2Ready|PASS|
|Same Deployment UID; generation/observedGeneration1→2|PASS|
|Template and both new Pod requests10mCPU/16Mi, limits100mCPU/64Mi|PASS, quantity comparison|
|Both PodUIDs replaced; verified new Pod→RS→Deployment chain|PASS|
|Unrelated Deployment spec preserved|PASS|
|Invalid quantity422 and request>limit422, old template/generation/PodUIDs unchanged|PASS|
|Readonly create403 and explicit HTTP session/grant/SSAR path|PASS|
|UID/RV cleanup, typed+dynamic404, Pod/RS label LIST0|PASS|
|Existing server/traffic UID/spec/PodUID sets after cleanup|PASS|

The same Deployment UID was c19783a2-977f-423e-aa37-15f6f75ac124. Typed Deployment/Pod GETs supplied actual desired/Ready/generation and quantity checks; dynamic GET cross-checked GVK/UID. The positive action used the UI's POST/api/actions resources model; no direct Typed Update bypass was used. Requests, limits and utilization were kept distinct. Real HTTP gateway was http://127.0.0.1:57551, separate from active app19846. Durable synthetic name/run-label plan was flushed before creation.

The exact owned lab/marker/client namespace/worker UID guards and static private admin kubeconfig remained unchanged; each requested mutation and cleanup rechecked actual scope. The fixture retained2replicas, busybox1.37.0,5s grace, Recreate and required metadata.name affinity. Cleanup removed only the exact owned Deployment with UID+RV preconditions; both GET404s and Pod/RS LIST0 were observed, then existing fixture equality was rechecked. Gateway/transport/Server cleanup returned. No active app, relay, product handler, CNI/Docker/bootstrap, global kubeconfig/PATH, Git/index or roadmap was changed.

The9pure cases explicitly covered known old terminal+deleting2 plus new2 allowed, initial2allowed,4active rejected, wrong old UID rejected,5total rejected, wrong owner rejected, wrong strategy rejected, Scale4rejected and Scale3allowed. They do not replace a real Scale regression. Shared-harness source changed, so actual Scale regression remains RETEST_REQUIRED for root's later phase. The first ResourcesFAIL's20files and source snapshot remain unchanged; its FAIL is not rewritten. Only the authorized test file changed. Source hashes were stable throughout execution.

See manifest/result/timeline, primary-controller-source.json, raw go-test events, exact argv/runner, helper patch/snapshot, source comparisons, preserved failed-checkpoint receipts and SHA256SUMS. No credential/nonce/Secret values, raw resource YAML or container logs are included. No further phase started.
