# Matching frontend artifacts and common fixed backend — scoped PASS

Two new frozen production frontend builds and one common fixed benchmark test binary were produced successfully. This completes the build prerequisite for **frontend-browser-common-backend** comparison only. No app, browser, benchmark, fixture server or test was executed. Full-runtime A/B and V11-18 closure are not claimed.

| Side | Immutable frontend source | New frozen tag | Built index SHA256 |
| --- | --- | --- | --- |
| A |36d5b8f90c8afdec437bdb6e5516541b5bb859bd | `cat16-36d-20261112T113255Z` | `f682f5740ba518542ed6d84e3008b57a4a592e162b093276b4b3354e12e634a5` |
| B |f32d6b2345c0e9fcf350b83ec9a5e9d3fc651e12 | `cat16-f32-20261112T113255Z` | `0e478e0c9241d599e651eedcb65b10b31f37e0be1a89e380434a239a817032a3` |

Common backend tag: `cat16-common-f32-20261112T113255Z`, SHA256 **`9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8`**,65,238,562bytes. Exactly one `go test -c` produced it; A/B `backend.test` files are symlinks to that same common binary. Existing runner backend-tag and panel-accept same-backend-SHA semantics are preserved, not weakened. Production CLI baseline47a5… and fixed5f1c… are separate artifacts and were rechecked unchanged, along with production UI index0e478… .

## Source and dependency provenance

A was extracted from the already-verified immutable baseline archive SHA3f20716e478c4b365a6c05323c598386f1f5414b6e5f67adfac94e5bdfde4218. B frontend/backend came from a fresh `git archive` of exact f32, excluding working changes. Unique tags and private source directories were checked absent before use; historical source copies/tags were not overwritten. Existing panel-build --source was used for both without profiling. Its outDir-outside-project warning is retained; no empty/replace flag or fallback was applied.

A/B/current frontend locks are identical SHAecbd67c765f1e244df703e5e1f13c95fa32bd94abf4e9e278bec4b15f34f5d90. Existing cached node_modules were shared through panel-build's supported symlink. All155 cached hidden-lock entries matched version/integrity/resolved metadata; installed critical package manifests match source lock: Vite6.4.5, React/ReactDOM18.3.1, Three0.164.1, R3F8.18.0, Drei9.122.0. No npm install/latest resolution or dependency download occurred. This verifies lock/cache metadata compatibility, not a fresh tarball content audit.

Node24.16.0 and absolute Go1.26.11 SDK identities/hashes are recorded. The common backend is compiled from clean immutable f32 source. Current M-fixture benchmark_test.go equals f32 byte-for-byte; runtime Go files, test-only files and replay fixture files have separate SHA maps. All frozen instrumentation copies match current/f32 bytes. Source public assets and complete emitted frontend assets are hashed in the manifests. Seven frontend source files differ between A/B (App, context, HarborScene, cameraViews and interactions plus their tests); both source and assets are genuinely distinct, so this is not described as an identical-build control.

## Commands and limits

The existing Node panel-build helper ran exactly twice, then the absolute SDK ran `go test -c -p 1 -o COMMON/backend.test ./pkg/server` once from frozen B/backend. Each exact argv/cwd/environment, stdout/stderr, PID birth, timing and resource samples is attached. No test binary -list/-help/-run was invoked. No setup/build failure, retry, installation, new framework, registry operation, source edit or Git/index action occurred.

Builds were serial with GOMAXPROCS2, UV_THREADPOOL_SIZE2, Go package parallelism1, GOMEMLIMIT2GiB and Node heap cap2GiB. These are concurrency settings, not a changed machine-wide CPU quota. Supervisor-inclusive sampled owned RSS peaked **1,175,011,328bytes**, below4GiB. Battery pre/post42%/42% and free-disk samples exceeded30%/10GiB floors. Actual stages ran11:35:20.833583Z–11:35:29.823000Z; original600s preparation/build/finalization budget and60s reporting reserve are tracked in summary. All30 recorded owned process references were checked absent after completion. New frozen artifacts/private source and instrumentation copies intentionally remain; no unrelated process was terminated.

## Handoff and open runtime gates

Use the new A/B tags with `--reuse-build --reuse-binary` and the common backend tag only after separate root clearance. Frozen identities are in frozen-build-manifests.json; frontend provenance, backend runtime/test-only SHA maps, instrumentation snapshot, cached-lock metadata and protected-production identities accompany it. The old unsafe6GiB long-log baseline remains excluded; A's bounded-log source is preserved.

No measurement has validated actual NodeUID/tab/content/source, camera/FOV38 versus production24, fleet phase or8/120 versus UI2.0 two-view16/240 visibility. Those remain runtime prerequisites without quality/view reduction. Power/process/PID-birth equivalence and isolation after UI/security jobs also require preflight. Native Safari/Retina/physical presentation are separate. Matching build artifacts do not imply CPU acceptance.

A future full-runtime A/B needs distinct frozen baseline/current backend binaries and a separately reviewed protocol/comparator for intentional backend differences. That must not be smuggled into this common-backend family or relax panel-accept's existing guard. No such additional binary or protocol implementation was made here.
