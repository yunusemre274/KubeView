# TEST-12.03 — bounded active YAML form parser guard evidence

Status: **PASS for one finite synthetic component test group; TEST-12.03 as a whole remains IN_PROGRESS**. Same agent system worker evidence, not an external professional security audit. No runtime product file changed.

## Attempt02 — concrete cyclic-alias follow-up after root review

This is a new finite follow-up, not an automatic retry of a failed test. Attempt01 and its exact source/results remain immutable. Root requested the removal of unused copied fixture blocks, corrected “annotation” test title to **unknown field**, and one additional ≤1KiB cyclic-alias case. The ten previous payloads are unchanged; actual form/runtime code remains unchanged.

- Preflight: `preflight-attempt02.json`; exact source: `test-source-attempt02.js.txt`; first/only follow-up result: `attempt02-result.json`, `attempt02.stdout`/`.stderr`.
- Execution 2026-11-14T12:59:37.451132Z–12:59:37.622450Z, **0.171317 s wall**. **1 top-level +11 subtests PASS**,0fail/0skip, target group23.288333ms. Same15s child/60s work safety bounds, no browser/cluster/build-release.
- Added YAML: the valid Deployment fixture plus `x-loop: &loop {self: *loop}`. It is one finite self-referential object in memory, not an expanded recursive sequence; the test never recursively traverses it. Input is asserted ≤1KiB.
- Observed: installed yaml accepts this graph; textarea/render remains reachable. Actual dryRun callback invokes fake API's production-equivalent JSON serialization; JSON.stringify rejects the circular value. Actual component catch renders the circular/cyclic serialization error, no uncaught exception/render loop occurs, no fake API request is counted as delivered, preview remains absent and submit remains disabled.
- Scope: fake API function is entered; zero delivered JSON requests is not a real network capture. No direct submit callback, browser lifecycle or resuming cyclic drafts is tested. App's actual onSafeDraft callback is a ref assignment (source reviewed); this harness does not claim full App/browser behavior.
- No new product defect/fix is claimed. JSON cannot represent cyclic Kubernetes objects; the observed path reports the serialization error instead of producing success. Frontend explicit byte/depth budgets and generic HTTP parser testing remain open.

Current executed test source SHA256: `a4999d55386e944367fc68ee976e09c0563178178964c735d54bf2237381ae75`.

## Historical attempt01 evidence

The following section describes attempt01 only. Current attempt02 uses the corrected label and11th case described above. The old title is preserved in its raw output/source and explained historically.

## Identity and execution

- Working source HEAD `6ffd1b22a164c6be83ca2783f4daf7e8346aa0d3`; product runtime checkpoint `15770296056ca2629601dba540c04741e1822e0d`.
- Test: `frontend/src/workbench/release_yaml_parser_guards.test.js`; existing `ResourceForms.test.js` hook dispatcher was reused. It imports/bundles the **actual** `ResourceForms.jsx` and installed React/yaml dependency. It is neither a rewritten parser nor a browser test.
- Installed yaml **2.9.1**, same current lockfile. Its `Document.toJS` default `maxAliasCount=100` and `Alias.resolve` throw on excessive alias expansion; this is a library count/cost bound, not a byte or object-depth limit.
- Command from `frontend`: `node --test --test-concurrency=1 --test-reporter=tap src/workbench/release_yaml_parser_guards.test.js`.
- Actual execution: 2026-11-14T12:56:23.021205Z–12:56:23.289888Z, **0.268680 s wall**. TAP **1 top-level + 10 subtests, 0 failed, 0 skipped**, target handler group 47.152667 ms. Those timings are instrumented unit execution, not application CPU or UI latency.
- Predeclared caps: ten distinct payloads, each ≤256 KiB; tested nested depth128 (task ceiling256); alias fixture ≤10,000 conceptual scalar leaves, short-circuited by default limit; child timeout15s/whole-work60s/one worker. No fuzz, cluster, browser, build-release or unrelated workload was run. The test uses a small esbuild test compile only.

## Active path and expected/observed result

`ResourceForms.jsx: parseYAML` is the textarea `onChange`. It calls the actual `yaml.parse`, rejects null/scalar/array roots, keeps the user text, clears old preview, and stores `yamlError` on failure. `validate` checks `yamlError` before the API request. Actual `dryRun` uses that validator and JSON-wrapped object. `ShipyardClusterContext.jsx` serializes request bodies with JSON.stringify; this test's fake API likewise JSON-stringifies before counting a delivered request. Backend `server.go:decode` accepts application/json only, caps bodies at2MiB and requires one JSON value. `resources.go` forwards create/update with `FieldValidationStrict`; **that backend/upstream behavior was read, not newly executed by this group**.

| Payload / normal or negative control | Expected and observed |
|---|---|
| Valid Deployment + unknown map + own `__proto__` key | One fake POST dry-run, exact namespace/name, unknown values and own key preserved; `Object.prototype` and fresh object remain unpolluted. This proves the exact parsed path, not every merge implementation. |
| Malformed flow sequence | Visible matching parse error; disabled dry-run/submit; bypassing disabled DOM by directly invoking actual dry-run callback still delivers zero requests. |
| Duplicate metadata key | Same blocked behavior; installed parser reports unique-key error. No duplicate-last-wins claim for YAML. |
| Two YAML documents | Same blocked behavior; one-resource editor does not accept a multi-document stream. |
| Sequence root | Resource-object error; no request. |
| Scalar root | Resource-object error; no request. |
| Small valid alias | One fake dry-run; JSON-equivalent values survive. |
| Exponential alias fixture | Installed default alias safeguard rejects it with resource-exhaustion error; no request or expanded large API body. |
| 128 nested arrays in an unknown field | One fake dry-run with all128 levels retained. This is a positive finite-depth observation, **not** a depth128 product limit. |
| 240KiB scalar unknown field | One fake dry-run; scalar length preserved. TAP title says “annotation”; the actual fixture is top-level `x-long`, **not** a metadata annotation or valid upstream schema claim. This label does not expand the asserted scope. |

All ten cases use actual onChange/render. Invalid cases also invoke the actual dryRun callback and assert zero delivered fake API writes. Submit is observed disabled; its callback is **not** directly invoked in this group. Native disabled/focus/layout semantics are outside this hook harness. Every form closes in finally; hook cleanups restore the global document stub and abort the request scope. Process returned exit0; no open browser/Kubernetes resource was created. No descendant census or leak profile was collected.

## Findings and limits

No exploitable defect was reproduced in these ten bounded payloads. No fix or PoC retest is therefore claimed. There is no explicit frontend YAML text-byte/depth policy in `parseYAML`; it relies on yaml's syntax/alias guards, object-root checks, later validation and backend limits. Accepted depth128/240KiB inputs do not establish an unbounded-memory exploit or a performance safety guarantee. The backend2MiB limit does not prevent all frontend work before a user pastes text. Any new UI budget must be justified and preserve valid CR/unknown fields; none was silently introduced.

Outstanding scope: generic resource HTTP decoder/duplicate/deep body tests; kubeconfig/YAML paths beyond this editor; potential cyclic values and deeper/bigger resource stress under a separately bounded plan; actual Kubernetes strict schema/admission; browser responsiveness/DOM/heap; schema-valid metadata annotation limits; all other prototype/merge sites (TEST-12.04). Existing workspace JSON/import TEST-13.01 was not rerun. This evidence does not close those gaps, broad XSS, real Kubernetes E2E or release readiness.

## Reproduction and source binding

Run the command above with current lockfile/node_modules. `preflight.json` binds production source, existing harness, lockfile and new test before execution; `policy-source-binding.json` records the additional reviewed JSON boundary/library files. `test-source-initial.js.txt` preserves the exact executed test. `attempt01.stdout`, `.stderr` and `attempt01-result.json` preserve first and only result. `checksums-attempt01.json` preserves the initial manifest; current `checksums.json` covers all evidence files other than itself. No real credential/Secret/payload content was read or captured.
