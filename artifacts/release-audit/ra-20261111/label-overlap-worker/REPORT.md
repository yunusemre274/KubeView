# UI-002 selected label / harbor nameplate — finite candidate

Started 2026-11-11 12:51:08 UTC. Only `frontend/src/harbor/HarborScene.jsx`, `interactions.js` and `interactions.test.js` changed. App/provider/backend/API/ocean/ship-motion code, roadmap and Git/index were not changed by this worker. `source.diff` records the exact three-file candidate delta.

**Selected-label scope: 228 frontend tests PASS; frontend build PASS; Chromium and WebKit 390/768/1440 REPLAY checks PASS with zero selected-label/nameplate rectangle intersections and one Canvas.** All six final screenshots were opened with the image tool. This is owned07 TEST/REPLAY visual evidence, not real Kubernetes, performance or full visual acceptance.

## Change and bounded cost

- Harbor nameplates retain their existing world transforms, text, controls, pointer behavior and anchors. Their button dimensions are cached at mount and name/stale/viewport changes, then removed from the per-scene cache on unmount. There is no new observer, timer, frame loop, frame-time DOM layout read or React state update.
- A selected/hovered ResourceLabel uses the existing Drei `calculatePosition` callback and its existing cached dimensions. It projects at most **16** cached nameplate anchors, retains at most **8** on-screen rectangles, and considers at most **33** placements: the current preferred position plus four sides per nameplate.
- The pure helper keeps the label within the existing 16px viewport margin and prefers zero overlap with an 8px nameplate gap, then shortest displacement. If no free candidate exists, it keeps the label visible and chooses minimum overlap rather than hiding text. Resource object/UID, world anchor and label pointer-events are unchanged.
- Per affected label the upper bound is 16 matrix projections and **264** rectangle-overlap checks. If the preferred location is already clear, candidate evaluation stops immediately; ordinary unselected/unhovered labels take the old placement fast path without allocating obstacle arrays. This is a code-level work bound, **not measured CPU/latency evidence**. No new scene frame subscription or per-Pod observer was introduced.

Pure tests cover phone/tablet/desktop viewport edges, collision separation/gap, existing offset behavior, deterministic visible fallback when all space is blocked, and unchanged placement for a distant obstacle. Source cost remained small and strictly bounded, so the candidate was not rolled back for a measured/structural frame-work increase.

## Owned07 lifecycle and exact final candidate

Only `down --profile 07-yuk-ve-gecis`, followed by `app --profile 07-yuk-ve-gecis --replay M --harbors 5 --binary <private candidate>`, ran against the explicitly owned normal-user state. No cluster/node up or other profile lifecycle command ran. Non07 process records in that state remained hash-identical. The active real Hubble apps/ports were not targeted.

- Lab ID: `kvml-aed6bc565b30`; state: normal-user `release-audit-lab-20261111`.
- Final private binary: `.git/release-audit/ui-label-worker/kubeview-final`.
- Version: **`1.1.0-ui-label-final-496729e2`**, commit label explicitly `496729e2e1df38081496bad3313fd7e594fbe10f-ui-label-worker-dirty`.
- SHA256: **`3ddc2feb0d3e1b5d3d1293e9613075440cc70a7051ae5b045a96562e748f2415`**.
- Embedded index SHA256: `b24eb0b6f554d30e2398a183d0649a8f5d32a025dc70c421b72e00cedfcc0dd6`.
- Build toolchain: existing Go **1.26.11 darwin/arm64**, `GOMAXPROCS=1`, `CGO_ENABLED=0`, `go build -p 1 -trimpath`, after frontend build and prepare-webui.
- Owned07 remains running read-only for review at **19847, PID85489**, variant **M-h05**. A PID-specific lsof check confirmed that exact PID owns the listener. Browsers are closed; no test job remains running.

`candidate-final.json` includes exact binary/index/source hashes, version output, PID, listener verification, source-diff hash and build/test commands. The first candidate and first screenshots remain separately preserved; the final candidate adds only the empty-obstacle/clear-preferred fast paths.

## Browser procedure and observed limits

The driver uses normal UI finder selection and verifies the actual REPLAY Pod UID in the detail panel (`app-0`, UID `pod-0`, namespace `bench-0`). It closes the panel, uses **Limanlar ve deniz haritası → Denizi uzaktan gör**, resizes to390/768/1440 and observes camera settling read-only. It does not inject selection, camera or source state. Each browser runs separately with DPR1, screenshot/video recording and a finite timeout. Rect reads are test-only DOM observations, not product frame work.

Final artifacts:

- `visual-final-chromium/`: Chromium156.0.8078.4; three PNGs, video and `result.json` PASS.
- `visual-final-webkit/`: Playwright WebKit27.2; three PNGs, video and `result.json` PASS. This is not native Safari.
- `frontend-final-tests.log`: 228 PASS /0 FAIL; `frontend-final-build.log`, `prepare-final.log`, `private-final-build.log` and final runner logs: success.
- `visual-chromium/` and `visual-webkit/`: initial candidate's unmodified screenshots/videos/results; earlier build/test/provenance logs are also retained.
- The two task-supplied real02 failure screenshots were opened as the original problem reference; real02 was not restarted or rerun.

**Important visual limit:** the 390px REPLAY world has separate orange fault-trace captions overlapping the harbor-nameplate region, and the five-harbor global view also clips long nameplates at the edge. Those are not the selected blue Pod ResourceLabel rectangles measured by this fix and were not hidden or altered. The short `app-0` REPLAY label also wraps into a narrow/tall box under the existing width styles. Final390 screenshots preserve these issues rather than claiming every world annotation/name is fully readable. At768/1440 the selected blue label is separate from the nameplates, while long nameplates can still overlap one another in the dense REPLAY overview.

Therefore this candidate repairs the **selected ResourceLabel versus cached nameplate collision** path and provides bounded geometry/browser evidence. It does **not** close a broader all-label layout/readability gate, the original real02 acceptance, native Safari, performance or release acceptance. Root should review the remaining orange-caption/nameplate cases separately before declaring UI-002 wholly closed.
