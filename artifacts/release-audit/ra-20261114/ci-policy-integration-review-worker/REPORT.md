# CI policy integration — second source/evidence review

**Local integration is correctly supported. TEST-20.11 and TEST-20.12 remain IN_PROGRESS.** Reviewer performed only source, Git diff, hash and raw-result reads; no test/browser/build/cluster/network execution. This is same-agent-system second review, not independent professional pentest.

## Verified change and source identity

Input audit HEAD `e6ee6678291c6d4fca6b4ca90e3fef66e96912c7`. Before-run manifest's four hashes independently match current files. Existing `scripts/build-release.test.mjs` is byte-identical to its version at that input HEAD. Workflow Git diff has **exactly one removed/one added command line**: existing `node --test scripts/build-release.test.mjs` becomes `node --test scripts/build-release.test.mjs scripts/release-ci-policy.test.mjs`. No event, permissions, checkout/action pin, job sequencing, runner or publication behavior changed in that diff. Workflow now actually invokes the policy file after frontend npm ci has supplied its existing yaml dependency; no new dependency is introduced.

## Test semantics and raw evidence

`reviewPolicy` parses actual `ci.yml`; it validates the current read-only lane's allowed events/minimal content-read grants, no repository secret interpolation, shell expression restriction, known pinned-action reference shape, nonpersisted checkout credentials/no alternate ref, correct cache-key input paths and finite artifact allowlist. Added invocation assertion recognizes a Node `--test` command containing the exact policy test path. Thirteenth in-memory negative fixture removes that path and expects `ci-policy-not-invoked`. Actual root guard source contains the corresponding condition and mutation.

`cache-dependency-path` findings are now called **cache-key-input**. That configuration selects dependency files whose hash enters a cache key; the guard does not demonstrate that a file such as the canary SSH path would itself become cached. The terminology correction matches the reviewed setup-action semantics.

Root command explicitly ran both files with TAP and `--test-concurrency=1`. Raw `tests.tap` independently yields **13 top-level passes =11 unchanged packaging +2 policy groups**, with **13 policy mutation subtests**, hence **26 total PASS/0FAIL/0SKIP**. Raw Node duration245.006625ms; root supervisor0.345871333s. stderr is empty. The fixture mutations do not execute GitHub workflows or shell payloads. Runtime/build output was not changed by those in-memory mutants.

The earlier worker report's14PASS/12mutants and “not called by CI” statements refer to its earlier source. They remain historical evidence; this new command/source/invocation must not be retroactively attached to that old run.

## Pitfalls and open acceptance boundaries

- Invocation detection is a **syntactic regression guard**, not a complete shell/control-flow analyzer. It does not prove reachability for every possible future conditional script, comment, skipped job or alternate command. The actual current direct command is simple and is included without such a wrapper.
- A malicious PR can edit both workflow and test. This repository check is not an immutable security trust anchor. Because it executes after npm/tests, it cannot retroactively protect secrets or grants already exposed by an unsafe workflow. Server-enforced fork permissions, approval and secret settings remain necessary independent boundaries and remain untested here.
- Known `actions/...@40hex` matching proves immutable-reference shape/repository allowlist, not that every new40hex pin is a reviewed safe bundle. Exact current action source/version review is separate; full transitive bundle SCA/cache-poisoning/promotion trust is not closed by this rule.
- Root's local command is serial; CI's direct Node test command does not newly specify serialism. Current packaging tests use their own bounded temporary fixtures and the policy test only reads workflow input; this review found no shared-write collision in this small pair. No remote performance conclusion is drawn.
- No actual GitHub fork rejection, effective token/secret/admin settings, remote current CI result, real runner cache poisoning, signing/provenance or final release acceptance was executed by this reviewer. Remote CI after commit/push is the manager's separate check.

Conclusion: keep the small integration and its source-bound26PASS evidence. It fixes the real gap that the local policy test previously was not invoked by CI, while **neither entire CI security phase is complete**. No additional speculative workflow rewrite or local test repetition is needed for this reviewed one-line integration.

Inputs: sibling `ci-policy-integration-root/preflight.json`, `result.json`, `tests.tap`, `tests.stderr`; current `.github/workflows/ci.yml` and `scripts/release-ci-policy.test.mjs`; historical `ci-workflow-security-worker/REPORT.md`. `review.json` records independent counts/hash checks; `checksums.json` binds this review's files.
