# QA checkpoint: 0f5a5ab / b741, 9 November 2026

This is the functional checkpoint for source commit `0f5a5ab6b8e52e645b9e2e71dd063112ca105e98`, product source SHA `8a1b9d69cdb53607c4064063b9c1239c76237ba5aa8b51ef8931cb5928304448`, embedded binary SHA `b7417ea5216a88de16e3a2307df55a32470f756a958681eac08643858fdc87cf`. It is not a stable release or whole-release signoff. Git/index/build/release actions remained root-owned; QA changed only its test/evidence paths and private owned-lab credentials between invocations.

[The 19 scenario ledger](acceptance-ledger.json) has 11 PASS and 8 BLOCKED rows, with explicit subclauses and proof types. Root visual/provider/full isolation/hidden/performance/20 minute/platform/distribution gates remain open. A separate correction to suspended Job and empty DaemonSet display status has source and unit validation: 160 PASS. Its new embedded build and narrow real UI status validation are a later change.

## Fresh current-build functional results

- [Full positive Deployment](runs/2026-11-09T08-30-01-963Z-chromium-f6afdbe9/result.json): real server dry-run404, create2Ready, scale2→3→1, four CPU/RAM values with unrelated metadata preserved, restart/newRS+ReadyPodUID, Pod replacement and Deployment404 on one exact UID.
- [Actual workload negatives](runs/2026-11-09T08-26-55-502Z-chromium-23a5484e/result.json): real image waiting/nonReady on the actual Node UID; preview succeeds then quota admission403 leaves404; explicit unsent draft discard/context boundary. The same-source/binary predecessor's completed Unschedulable API/UI subcheck was reused. No accepted Kubernetes operation is claimed cancelled.
- [Actual RBAC negative](runs/2026-11-09T08-32-38-782Z-chromium-253c965c/result.json): writable server+enabled scoped intent still yields restricted-identity normal UI preview403 and direct Deployment create403/GET404.
- [Production readonly UI](runs/2026-11-09T08-28-13-727Z-chromium-ab74e076/result.json): root18414 server READ_ONLY=true is visible, enable/form/dry-run cannot submit, direct management/create403 and object404. Separate [current production security5/5](../backend/prod-security-result.json) covers actual token/session401 and WebSocket Origin boundaries.
- [Final A/B](runs/2026-11-09T08-20-00-750Z-chromium-6bfe683c/result.json) and [browser security](runs/2026-11-09T08-21-35-843Z-chromium-13299d31/result.json): same name/different UID, actual scopes/logs/rapid intent/closure, missing or hostile/cross-site403 and stale nonce409.
- [G00 normal UI](runs/2026-11-09T08-22-05-119Z-chromium-2cfbe23f/result.json): actual sameUID scoped reconnect, offline same-name newUID remains stale until a real authoritative snapshot, old selection stays deleted, explicit new selection. Exact CR and unique CRD cleanup404 passed; no namespace was destroyed.
- WebKit current focus probe, three viewports768/1280/1440, finder arrows/camera isolation, full canvas/reduced-motion and empty/error/explicit Demo passed in `runner-results/2026-11-09T08-18-33-199Z-cdf37bd2.json`.

[Source applicability](source-applicability-0f5a5ab.json) keeps earlier filled actual Node/Pod chart, restricted403/no-series, missing-provider, finalizer and fixed-reconnect evidence tied to their real build identities. Relevant runtime/test modules match the0f5 checkpoint; changed focus branches received fresh current-build tests. An earlier held-GET/header/ESC/ordinary-Pod-watch invocation remains historical rather than being called a new0f5 run.

Frontend-owner forms proof adds normal STS/DS multi-container CPU/RAM, unsupported RS/Job/CronJob UX and synthetic Secret reveal/edit boundaries. Its first failed compound run is preserved; the passed STS subcheck was not blindly repeated. Frontend-owner logs has seven current functional cases PASS while its whole helper remains FAIL for a Playwright WS close-event timeout. [Independent kernel evidence](../frontend/logs-resume/kernel-socket-close-20261109.json) shows only the gateway listener and zero connected TCP endpoints/own browsers; this is transport cleanup, not a close-frame or Go heap/goroutine claim.

## Counts, environment and cleanup

QA's immutable browser history is 28 invocations: 20 PASS / 14 FAIL / 0 SKIP executed cases. The resumed 9 November portion is 18 PASS / 7 FAIL / 0 SKIP. Unreached max-failure cases were BLOCKED rather than invented SKIPs. These counts include historical product/helper failures and are separate from frontend functional cases and backend Go top-level/leaf counts.

Measured browser environment: `darwin 27.0.0 arm64`, Chromium 156.0.8078.4 and Playwright WebKit 27.2. WebKit is not native Safari or native Retina performance evidence. QA did not measure CPU/RSS/FPS or physical UI latency; root owns the exclusive performance queue.

[Final cleanup](final-reader-cleanup-2026-11-09T08-35-07-499Z.json) removed the retained exact reader RoleBinding/Role/SA using current UID/RV/owner guards and observed404. Both QA namespaces have zero owned resources; unowned default SA/rootCA ConfigMaps were preserved. The cleanup grant was revoked and API context disposed. The global kubeconfig never changed.

[Owned process proof](final-owned-processes-20261109.json): zero active QA runners, all21 resumed PID-bound caffeinate children exited, every invocation's configuration hashes unchanged. Other agents' browsers and root gateways/Hubble forwarders are not claimed stopped.

Restricted/RBAC reruns now require a fresh owned reader setup, new UID provenance and private credential between invocations. Removed/offline resources must not be adopted or treated as evidence of deletion without the recorded API404.

The [security proof map](security-evidence-map-20261109.json), [historical workload boundaries](workload-historical-evidence-boundaries-20261109.json) and [qualified harbor module applicability](../harbor-source-applicability.json) preserve unit versus real API versus normal UI distinctions. Historical Node fault/worker/crane proof is qualified core evidence; no new worker add or Node stop was run by QA. No source file or manifest here authorizes a stable tag/milestone close before all root gates pass.
