# CAT-20 — immutable output directory and package contents

Started 2026-11-11 11:59:05 UTC. Base HEAD during verification: `4ec526b7ce1bc39c21b603864c9096f72eb39184`; the two owned script/test deltas are hashed in `test-run.json`. **8/8 isolated fixture tests PASS**, 0 FAIL/SKIP. No npm ci, frontend build, Go build, cross-compilation, real tar invocation, cluster/browser action, dependency edit or Git/index/roadmap write was performed by this worker.

## Applied change

Only `scripts/build-release.mjs` and new `scripts/build-release.test.mjs` changed.

- Supported syntax is **`--output-dir=ABS_OR_REL`**. Absolute paths are accepted; relative paths resolve against the invoking process's current directory. The default remains the repository's `dist/`.
- Unknown options, a missing/empty output value, repeated output flags, unknown targets and duplicate target names fail before build work. `--prepared`, `--require-clean`, the existing positional targets and the default Darwin ARM64/Linux AMD64 targets retain their behavior.
- An explicit output path must **not exist**, including an empty directory, normal symlink or dangling symlink. It is created exclusively after the source-clean check, before build work. Do not pre-create the final output directory.
- Default dist may contain unrelated historical files. A collision with **any requested target folder/binary, target archive, SHA256SUMS or build.json** fails preflight before frontend/prepare/build commands. The entire target set is checked before building the first target.
- Target folders are created exclusively. Tar writes a unique temporary filename, then archive publication uses `COPYFILE_EXCL`; an archive appearing during the build cannot be overwritten. Temporary archive files are removed on success/failure. SHA256SUMS and build.json use `wx`, so a later collision cannot silently replace either manifest.
- A failed build can leave its new output directory and partial target folder as evidence; retry with another fresh directory. Existing outputs are never automatically removed to make room.
- The script can now be imported without starting a build. Its exported function accepts an executor dependency for isolated tests; the ordinary CLI still uses `execFileSync`. There is no production CLI flag or environment setting that swaps in a test executor.

For root's later authorized full build, after source/prepared-frontend provenance is settled:

```sh
node scripts/build-release.mjs --prepared --require-clean --output-dir=/ABS/NEW_FINAL_DIR darwin-arm64 linux-amd64
```

This command was **not run**. Existing dist archives and manifests were not touched.

## Manual-lab runtime boundary

Read `scripts/manual-lab.sh`, `scripts/manual_lab.py`, `manual-lab/telemetry.py`, profiles/templates metadata and **`manual-lab/tests/real_scenarios.py`**. The latter is an opt-in real scenario runner, not a removable `test_*.py` unit file. It is preserved in the delivery bundle.

The copied runtime is an explicit allowlist:

- `scripts/manual-lab.sh`, `scripts/manual_lab.py`
- `manual-lab/profiles.json`, `telemetry.py`, `DEPENDENCIES.md`
- `manual-lab/templates/README.md`, `templates/telemetry-values.json`
- `manual-lab/tests/real_scenarios.py`

An **empty** `manual-lab/evidence/` directory is created because real_scenarios.py writes a new attempt there and does not create the parent itself. Historical evidence remains in the repository; none is copied. Developer `test_*.py`, caches/pyc, evidence files and other unlisted developer material are excluded. The original source files/evidence are preserved. Missing required runtime files make packaging fail rather than silently omit the manual runner.

Existing README/security/manual acceptance documents, RBAC files, commit-based Markdown links, platform binary names and archive names retain their prior packaging flow. SHA256SUMS still covers the produced archives. This allowlist deliberately requires updating if a future runtime gains another asset dependency.

## Executed fixture verification

Command: `node --test --test-concurrency=1 scripts/build-release.test.mjs`.

All build-tool executions (`git`, `npm`, prepare-node, `go`, `tar`) inside the tested builder are injected synthetic stubs. Temporary fixtures contain synthetic text binaries/archives; no compiled/archive/runtime acceptance is implied. Fixtures are removed by their own cleanup hooks. Metadata collection outside the test only reads the source HEAD.

The eight tests verify:

1. Prepared/clean/target parsing and default targets; unknown/malformed/repeated flags and duplicate targets rejected.
2. Existing empty/populated explicit directories and symlinks rejected before any executor call; a historical sentinel remains byte-identical.
3. Default target archive, binary folder, SHA256SUMS and build.json collisions rejected before any executor call or first-target creation.
4. Fresh relative output; prepared skips npm, embed prepare remains, selected GOOS/GOARCH/CGO flags remain, manual runtime is included, developer evidence/tests/cache are absent and source evidence survives.
5. Fresh absolute output with both default targets; an existing historical dist/build.json stays unchanged.
6. Default output allows unrelated historical files, preserves normal npm ci/build flow and Windows `.exe` naming.
7. Require-clean failure creates no output and calls no frontend/build tool.
8. A competing archive created during the fake tar step is not overwritten; temporary archive output is removed.

First 7-test green log is preserved as `packaging-fixture-tests-initial.log`; after adding the absolute/default-target case, the final 8-test run is `packaging-fixture-tests.log` (12:06:39 UTC, exit 0). Exact argv/times/HEAD/source hashes are in `test-run.json` and `test-runs.json`.

## Separate CI source review — no workflow edits or CI execution

Inspected `.github/workflows/ci.yml`; these are source/configuration observations, not a claim about a completed workflow run or official action SHA authenticity.

| Area | Observed source and remaining gap |
|---|---|
| Permissions | Lines 7–8 explicitly grant only `contents: read`; no job-level widening appears. This is a useful restricted permission declaration. |
| Action pinning | checkout, setup-go, setup-node and upload-artifact use full commit SHA references (lines 14, 15, 19, 50). Their comments state action versions; no remote verification of those SHA/version mappings was done. |
| Checkout credentials | No explicit `persist-credentials: false` appears under checkout. The workflow therefore does not explicitly guarantee that checkout credentials are removed before npm/build/test steps; root should decide the hardening change. No credential exposure was tested or claimed. |
| New packaging tests | Existing test steps run frontend, Go and benchmark suites. The new `scripts/build-release.test.mjs` suite is **not wired into this workflow**. Root can add its finite Node command before packaging; this worker does not own CI edits. |
| Source identity | `--require-clean` checks the existing selected runtime paths, not every packaged input: manual-lab assets, docs and deploy files are outside that selected dirty-path list. build.json commit/dirty is not a complete per-file bundle provenance statement. This pre-existing scope was preserved rather than broadened silently. |
| Prepared frontend | CI builds frontend immediately before `--prepared`, which is a useful ordering. The flag itself still does not attest source/build equivalence or record an embedded index hash. Root's exact prepared-build hash verification remains necessary for final packaging. |
| Provenance/signing | Archive SHA256SUMS and source build.json are uploaded, but no SBOM, artifact signature, attest-build-provenance step or equivalent signed input/output binding appears. No `id-token`/attestation write permissions are declared. Checksums alone do not establish publisher authenticity. |
| Toolchain identity | The workflow declares Go `1.26.11`, Node major `24`, `ubuntu-latest`; build.json does not record the actual runner image, Node patch, Go/tar versions or complete dependency/input digests. Reproducibility is not established here. |
| Runtime/platform | Source defines an extracted Linux binary startup + Chromium smoke path (lines 36–49). This worker did not execute it. Darwin is cross-compiled, not run by this job; cross-compilation remains distinct from platform acceptance. |
| Artifact lifecycle | Upload uses dist globs and retention 14 days (lines 50–57), with no release publishing/approval/signing step shown. CI's fresh default-dist flow remains compatible; changing CI to a custom output directory would also require updating its copy/upload paths. |

The packaging overwrite/content defect is repaired and unit verified. A real final build, tar extraction/content verification, clean-bundle manual-lab startup, exact input/output provenance, native platform checks and CI execution remain root-owned acceptance work. This report does not close those gates.
