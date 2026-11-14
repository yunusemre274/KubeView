# TEST-12.03 — bounded active YAML form parser guard evidence

Status: **PASS for one finite synthetic component test group; TEST-12.03 as a whole remains IN_PROGRESS**. Same agent system worker evidence, not an external professional security audit. No runtime product file changed.

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

Run the command above with current lockfile/node_modules. `preflight.json` binds production source, existing harness, lockfile and new test before execution; `policy-source-binding.json` records the additional reviewed JSON boundary/library files. `test-source-initial.js.txt` preserves the exact executed test. `attempt01.stdout`, `.stderr` and `attempt01-result.json` preserve first and only result. `checksums.json` covers all evidence files other than itself. No real credential/Secret/payload content was read or captured.
