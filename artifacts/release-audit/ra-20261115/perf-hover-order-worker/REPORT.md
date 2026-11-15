# Controlled real-pointer hover-order diagnostic — 2026-11-15

**Decision: the specific persistent-hover hypothesis is REJECTED for these two current-B cases. BENCH-RENDER-001 remains OPEN / not reproduced.** This is instrumented synthetic fixture evidence, not normal CPU/FPS acceptance or real Kubernetes E2E. No product code, normal benchmark, Git/index or ROADMAP was changed by this worker. Same-agent-system second review; not an external professional audit.

## Exact identity and finite execution

- Audit source: `e48604e2dfbbba3711a1aa64122b22b31d7c4e40`; runtime product `15770296056ca2629601dba540c04741e1822e0d`.
- Frontend `cat16-current157-20261115T095801Z`; aggregate source SHA `41b8240d6f4546ef4fd0df415cc8cb84239e3cac7251fff518ea232c10d45ddf`.
- Explicit NEW_COMMON override `cat16-common157-20261115T095801Z`; binary SHA `74cf606a29e072e620fc08b9ac40f277bc72ff5e28ec28b04fdd46eb0a94b1e1`. Frozen A was not used or altered.
- Exact six frontend asset hashes/build provenance are in [plan.json](plan.json) and the preceding [build identities](../perf-current-build-worker/actual-build-identities.json). Supervisor revalidated all assets and binary before launch.
- Executed private helper SHA `f01edbd8bf6a9e05ac19d133d983784289dc4630736f0e90584578ce396409ba`; normal `benchmarks/run.mjs` SHA `80cc55ad70f65857c5df2fa5eb79155aae5b8a5daec2d21916b8c588e39bb850` unchanged before/after. [Exact helper](run.private.mjs.txt), [narrow diff](private-change.diff), [supervisor](run-two.py.txt).
- Two jobs, zero retries, 5 s warm-up plus 10 s observation each; actual start `2026-11-15T10:11:42.588163+00:00`, end/cleanup `2026-11-15T10:12:24.186302+00:00`; total **41.598 s**, under 210 s data / 270 s work-and-cleanup limits. Per-job duration 21.067 / 19.743 s, each below 90 s. No third job.
- Final offline report elapsed from actual start **301.830 s**; finalization target exceeded: **true**. Raw actual-run timing is preserved separately; no timing was rewritten.
- Root granted the browser slot after other test/build/scanner work stopped; slot was released immediately after process cleanup. AC required, battery floor30%, low power0, disk floor10GiB; raw before/after/sampled power and owned RSS safety data are in [execution.json](execution.json). RSS samples are process safety sums, not physical RAM or performance acceptance.
- Chromium 156.0.8078.4; `ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)`. Actual fixture20 Node/300 Pod, visible8 ships/120 detailed Pods; medium, renderer DPR1, 1440×900 framebuffer, FOV38, sea and patrol on. Panel Node`node-0`/`worker-001`/Özet stayed fixed. This is not a 0/5-event matched CPU matrix.

## What was actually exercised

Normal projection supplied a visible `pod-0` / `app` target; `elementFromPoint` was the real canvas. A real Playwright mouse move reached the actual InstancedMesh and R3F hover-map instance resolved to that exact Pod/container. No direct callback, hover-state injection or different-UID fallback was used. First case moved normally to8,8 before input guard; second enabled guard/CSS canvas pointer-events none before moving to8,8. Both then reset visual phase, observed10s, restored input and moved normally again.

[Per-case resolved hits and four raw render-identity JSON/PNG stages](runtime/) contain actual object/geometry/material UUIDs, submitted main-camera callback records, geometry/index hashes, root pointer, R3F hover map, selected UID, and canonical signatures. Existing callback functions were restored in finally; all8 stages report restoration true. Geometry hashes and world transforms are asynchronous post-callback observations, **not an atomic presented-frame pose**; main-camera collection excludes shadow passes.

| Order | Stage | Main-camera callbacks | Renderer calls | Renderer line primitives | Allocated geometries | Hover entries | Yellow outlines |
|---|---|---:|---:|---:|---:|---:|---:|
| leave-before-guard | 00-before | 254 | 442 | 60 | 40 | 0 | 0 |
| leave-before-guard | 01-hover | 247 | 435 | 96 | 33 | 1 | 1 |
| leave-before-guard | 02-guard-reset | 238 | 426 | 60 | 32 | 0 | 0 |
| leave-before-guard | 03-cleanup | 246 | 434 | 60 | 32 | 0 | 0 |
| guard-before-leave | 00-before | 254 | 442 | 60 | 40 | 0 | 0 |
| guard-before-leave | 01-hover | 247 | 435 | 96 | 33 | 1 | 1 |
| guard-before-leave | 02-guard-reset | 238 | 426 | 60 | 32 | 0 | 0 |
| guard-before-leave | 03-cleanup | 246 | 434 | 60 | 32 | 0 | 0 |

Both stage sequences have the same counts. While genuinely hovered, one yellow `Mesh` with `MeshBasicMaterial.wireframe=true` and `BoxGeometry` was submitted:24 position vertices,36 triangle indices, geometry content SHA `675cb20580910db1c4d9650cc5640483e90c63cdbddb9537895e3f5ba54681de`. Installed Three converts the12 indexed triangles into72 wireframe indices and counts36 line primitives; observed renderer lines60→96 is consistent with this **source-derived accounting**, not a raw GPU wireframe-index readback. After both guard/reset paths, hover entries and yellow object disappeared; only the selected Node blue hull `LineSegments` remained. Therefore the historical **+12 LineSegments / +1 draw cannot be identified as this cargo hover object**. Before/hover/reset also include active fixture effects and phase reset, so their aggregate draw-call differences are not a standalone causal object-cost measurement.

R3F's recorded event source is a DIV, so disabling pointer events on the canvas does not itself prove that neutral pointer movement cannot reach R3F. In this actual treatment the root recorded pointermove8,8 and cleared the hover map. This is observation for this setup, not a guarantee for every browser/pointer/camera path.

## Visual review and state/cleanup

All **8 original PNGs were opened and inspected** (4/case). Full-screen world, water, moving ships and stable worker-001 contextual panel remain. Hover stage shows the app-0 label; reset/cleanup do not. The selected ship retains its blue highlight and panel. Sea/fleet poses naturally differ through time, so these are not static pixel-equivalence frames. Fixture initial fault labels are visible before the visual reset; they are not real-cluster failures.

Both cases assert full canonical signature equality with synthetic upstream, not counts alone;20/300 canonical and8/120 visible resources stay intact. Node selection/tab stay unchanged at every capture. Queues/visual-effect counts are recorded, not treated as a ten-minute leak proof.

Owned PID birth+command identities were checked before signals; captured identity checks after cleanup: 15 / 27, all absent. This cumulative supervisor ledger includes earlier captured identities, so these are not unique concurrent-process counts. Port5192 free after each job and final cleanup. No other user's process was targeted. Normal input controls/pointer style were restored before browser closure. Raw cleanup details are preserved.

## Consequence and stop rule

No product fix is justified by this result. The historical invalid paired cells remain invalid; CAT16/V11-18 and release readiness are not closed. This diagnostic produces no normal CPU savings, latency, physical FPS, energy, Safari, real-cluster or collector claim. Repeating a third neutral-hover job without a new question would not explain the old12-line identity. Root should retain the historical evidence and require actual object/geometry identity at the moment of any new mismatch before attributing or fixing it. A future finite normal A/B cohort requires a separately approved finite plan and current build/scene-quality guards; this worker started none.
