# SBOM implementation — code and finite fixture tests

**Implemented, fixture-tested; actual build/schema/extract/native/performance proof remains OPEN.** Worker changed only the six assigned build/metadata/test files. No Go/Node dependency manifest or lockfile, runtime scene/UI/store/backend API, CI workflow, Git/index or ROADMAP was edited. New dependencies0. No real npm SBOM, Go command, scanner, build, browser or cluster was run.

## Delivered code

- `frontend/build/package-inventory.mjs`: build-only Rollup/Vite plugin with no runtime transforms. It records emitted JS chunk bytes/SHA and only positive-rendered npm module ownership, mapped to actual installed package name/version and lock entry. Different versions have distinct identities. Local/virtual modules have explicit counts; unknown owners have bounded SHA-only records and cannot pass exact release coverage. No absolute workstation module path is published.
- Same manifest binds **actual consumed first-party module files** (query-stripped project-relative IDs/contentSHA, including consumed modules tree-shaken to0), typed package/lock/index/config/plugin input hashes and exact public-copy file set/contentSHA. Source files never consumed by Rollup, such as unrelated test/docs, do not cause stale rejection. Public symlinks/special inputs are rejected; file hashing streams64KiB chunks. Build mode and known React profiling flag are normalized fields, not a raw environment dump.
- `frontend/vite.config.js`: adds metadata plugin after existing React plugin. It does not alter resolution, aliases, chunking, materials, canvas or runtime code. Actual JS byte equality against the frozen source has not yet been measured and remains root's real-build gate.
- `scripts/release-sbom.mjs`: Node stdlib-only orchestration/pure converters. Exact Go BuildInfo JSON yields actual linked module versions/replacements/checksum properties +stdlib/compiler; local/unversioned replacements fail instead of receiving fake published versions. Go h1 is labeled as a module checksum property, never binary SHA256. Target/CGO/revision checks, duplicate ref/dangling graph/size guards and public-field filtering fail closed.
- Source npm inventory is a separate full lock-only **SOURCE/dev/build graph**, not called runtime-shipped. Actual npm producer version is required from its metadata. Safe explicit empty npm configs, offline/include-dev/no-scripts options, narrow child env/private cache,15s timeout/2MiB buffer and finally cleanup prevent borrowing user npm configuration or emitting raw URLs/credentials/env. This actual npm invocation has not yet been exercised; fixtures inspect the intended args/env.
- `scripts/build-release.mjs`: validates current prepared inventory before embedding, including source/config/public hashes and actual copied public/JS output hashes; normal production/nonprofiler required. Adds frontend/build to relevant clean guard. After binary build, reads Go BuildInfo and emits `sbom.binary.cdx.json` (Go+positive-rendered npm package inventory) and `sbom.frontend-source.cdx.json` (resolved source/dev graph). Existing inputs/frontendAssets/binarySHA/signed:false are preserved; new BOM hashes/manifest hash/coverage maps extend provenance and outer build.json. Archive remains exclusive, outer SHA binds final tar; no circular self-archive hash.

`vcs.modified` and relevant/runtimeInputsDirty remain distinct, honestly labeled properties. Unrelated dirty evidence/docs must not make a clean-runtime prepared build appear globally clean, and existing non-require-clean developer packaging is not silently prohibited. Exact artifact binary/hash is the subject regardless; source commit alone is not a promise of pristine whole-tree source.

## Tests and preserved first failure

Root explicitly serialized TEST_SLOT with the performance worker. No tests were run while that worker held the browser measurement slot.

| Attempt | Result | Source/interpretation |
|---|---|---|
|01|19PASS/1FAIL/0SKIP;0.3501435s supervisor, sampled owned-group peak114.25MiB|Old prepared fixture assumed **no npm command at all**. New offline metadata-only npm sbom is intentional; npmci/install/run still must not happen. Exact first source/raw/result preserved. No runtime defect or relaxed output guard is claimed. |
|02|**20PASS/0FAIL/0SKIP**;0.314818084s supervisor, sampled owned-group peak114.234375MiB|Prepared test now explicitly rejects ci/install/run and requires exactlyone metadata SBOM invocation. New implementation/helper public-ref/filename dictionary source review changes are bound to this exact second source. All six before/after hashes equal. |

Command for both authorized finite slots:

```sh
node --test --test-reporter=tap --test-concurrency=1 \
  scripts/build-release.test.mjs scripts/release-sbom.test.mjs
```

15s child budget,1GiB owned group RSS cap; no stop triggered. Timings/RSS are short Node fixture receipts, **not application CPU/RAM, native browser, final package or throughput claims**. Both TEST_SLOT_RELEASED messages were sent promptly after completion; no automatic retry loop occurred. Second run was explicitly authorized after first source diagnosis and completed performance jobs.

Existing11 packager cases remain, with fake Go build versus version-json and npm install/build versus sbom separated. Two new packager groups cover prepared missing/stale/unknown/source/public-added/deleted/stale/profile rejection **before embed/build**, and malformed Go/npm metadata yielding no published archive. Seven module/plugin groups cover emitted duplicate-version/local/virtual/treeshaken ownership, unknown owner rejection, source-vs-runtime dev graph, actual module/stdlib/replacement semantics, malformed/oversize/duplicate/dangling/private URL refs, safe npm config/timeout/cleanup and consumed-source versus unconsumed-test staleness. Package provenance fixture actually checks both BOM files and bound hash fields.

Synthetic tar/binary/npm/Go outputs are produced solely by executor fixtures. Zero real archiver/compiler/npm/scanner command is delegated by those tests. This proves the intended code/data paths and failures, not actual npm CLI interoperability or official schema correctness.

## Limits and root handoff

- CycloneDX1.5 output has semantic/structural subset checks. **Full official-schema validation was not run**, and must not be inferred from validateBom's name. Root owns separately pinned schema/ref registry/jsonschema QA.
- Real current frontend build must prove module ownership resolution, consumed/public bindings, deterministic intended asset differences and no unexpected runtime JS changes. Vite emitted-JavaScript module inventory does not promise CSS/font/asset package attribution or function reachability; final asset byte inventory is separately bound.
- Real clean release build must execute installed npm lock-only args/offline configuration, Go target BuildInfo, official schema validation and actual archive extraction/hash recomputation, then native startup. Existing historical CI114 package is not relabeled as containing new BOMs.
- Source npm licenses are retained as declared labels/expressions without external URL fields; unknown license metadata is not a legal compliance assessment. Signed attestation remains signed:false without real signing keys/service.
- Root should add `scripts/release-sbom.test.mjs` to the existing CI Node test command; worker did not change workflow ownership. Root commit/push/CI/source freeze and ROADMAP adjudication remain separate.
- Global TEST-20.13/release readiness **is not complete** on fixture tests. Real providers/image BOMs, package scan, old CPU/UI latency/soak gates and manual approval are unchanged.

## Evidence

`plan.json`, both `preflight-attempt*.json`, per-attempt exact six source snapshots, `attempt01-analysis.json`, immutable `attempt01.tap/.stderr/-result.json`, separate `attempt02.tap/.stderr/-result.json`, `source-final.json` and checksums. package.json/lock before/after unchanged. Evidence contains only synthetic fixture names/values and public source, no actual credential/Secret contents.
