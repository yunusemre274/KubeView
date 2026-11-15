# Final CI quoted-input guard — read-only second review

**Decision: keep the small guard correction. TEST-20.11 and TEST-20.12 remain IN_PROGRESS.** Same-agent-system review, not professional third-party pentest. Reviewer ran no test, CI, browser, build, cluster or network operation, and changed no product/workflow/test/ROADMAP/Git file.

Input HEAD `e6ee6678291c6d4fca6b4ca90e3fef66e96912c7`. Final preflight four current file hashes all match; exact workflow and test snapshots match those hashes. The unchanged packaging test file also matches inputHEAD. Active workflow still differs only by the previous one-line addition invoking the policy file alongside packaging tests; no further permissions/actions/triggers/normal inputs changed.

## Preserved expected RED

`ci-policy-string-input-root` directory is historically dated14Nov, but actual preflight/run timestamps are **15Nov2026 UTC**, retained as written. Its exact test snapshot includes the14th mutant and old `=== true` artifact checks. The new mutant sets **both** `include-hidden-files` and `overwrite` to the quoted string `'true'`.

Expected RED exited1 in0.077843458s. Raw TAP has exactly one failing leaf, **quoted artifact flags are still enabled inputs**, with `missing rejection: artifact-boundary`; parent mutation group also fails by propagation. Node reports2failures (one leaf +parent), **not two independently reproduced defects**. Positive actual-workflow policy and previous13 mutant leaves passed. This isolates the missing string-input rejection without changing actual CI inputs.

## Correction and final GREEN

Diff from RED snapshot to final snapshot adds the local `disabled` helper and uses it at **both** artifact flags. Allowed values are only missing/undefined, booleanfalse or exact stringfalse/False/FALSE. Booleantrue, stringtrue, null, numbers, unknown strings and expressions fail the allowlist by source logic. Only the actual quotedtrue combination is dynamically exercised by the new mutant; unsupported values and each flag branch separately are not reported as separately tested.

Actual normal upload inputs omit both flags, so current workflow remains accepted. This is a conservative **project policy** for this reviewed lane, not a universal Action vendor input compatibility claim. No action input implementation or GitHub server was executed by these fixture tests.

Final actual combined command runs unchanged packaging +policy files. Independently counted raw TAP:

- 11 unchanged packaging top-level passes.
- 2 policy top-level passes with14 mutant subtests.
- **27PASS/0FAIL/0SKIP**,13top-level +14subtests.
- Node raw148.385875ms; root wall0.187700625s, exit0/sourceAfterMatchestrue. These are short test timings, not application CPU or performance acceptance.

Final policy test SHA256: `f29a818ccaea8ad9e71f530289adf0d14358627cd01a9874ed78cd0552f73b0f`. Workflow SHA256 remains `4badd5b47cd3a4d16080d93eaf720129445cf272687f19f7aa2d9dd85df06ad6`.

## Limits and next gate

Both quoted flags are modified in **one mutant**. Shared helper use at both source sites is reviewed, but this fixture alone would not catch every future removal of one branch while the other still rejects. It does not prove all truthy forms or all policy locations. No new test is requested merely to inflate coverage.

Previous review limits still stand: invocation detection is syntactic; untrusted PR can edit test and workflow together; a late-running guard cannot replace GitHub-enforced fork permissions/secret isolation;40hex action reference shape does not establish bundle SCA or supply-chain safety. No actual GitHub fork/admin/cache/publish experiment, remote final CI result, general release or manual approval is claimed. Root commit/push and remote CI verification remain separate.

Evidence: final and RED sibling preflight/result/rawTAP/exact snapshots; this folder's `guard-diff.txt`, `review.json` and `checksums.json`. Earlier26PASS integration review remains historical and is not relabeled as this27PASS source.
