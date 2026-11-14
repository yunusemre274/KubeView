# CAT-11.06 / CAT-09.05 — controlled browser preview isolation

**Final attempt PASS in real Chromium 156.0.8078.4 and Playwright WebKit 27.2.** This is **synthetic backend/fake clients/net.Pipe upstream + real browser evidence**, not real Kubernetes/SPDY, native Safari, a third-party penetration test or a security certification.

Work began 2026-11-11 12:28:11 UTC. Final browser attempt ran 12:36:33–12:36:35 UTC. Only new `backend/pkg/server/release_preview_browser_test.go` and `frontend/e2e/release-preview-isolation.mjs` were added. Production runtime/auth/proxy code, cluster state, benchmark, roadmap and Git/index were not changed by this worker.

## Fixture and safety bounds

The Go test requires `KUBEVIEW_RELEASE_PREVIEW_BROWSER=1`; without it, the dedicated guard verification explicitly **SKIPS** and opens no fixture. Production builds exclude the `_test.go` routes.

The fixture uses the existing releasePreviewFixture's synthetic authenticated operator/grant, fake Pod/client and the production **Server.Register/proxyForward** path. The test-only upstream is an in-memory net.Pipe response, not a Kubernetes port-forward. KUBECONFIG is forced to a nonexistent synthetic file, optional providers are disabled, and no real Secret/credential/cluster is used.

Only owned `127.0.0.1:19849` is bound. Occupancy causes failure without stopping another process. Lifetime is 145 seconds plus at most 2 seconds shutdown, with an independent Go test timeout. The browser driver closes each browser before launching the next, rejects all non-fixture page requests, enforces a 30-request interception budget and a 58-second browser deadline. The fixture additionally caps total requests at 64. Actual runs were much shorter and smaller.

Final cleanup: fixture child exited **0**, both browsers closed, and an exclusive bind/close probe confirmed **19849 released** (`listenerReleased: true`). No global process kill or unrelated listener action occurred.

## Final observed browser results

| Evidence | Chromium | WebKit |
|---|---|---|
| Normal preview with browser cookies and no Authorization header | HTTP200; PASS | HTTP200; PASS |
| Inline synthetic JS actually executes | PASS | PASS |
| `self.origin` is opaque/null | PASS | PASS |
| document.cookie / localStorage access | SecurityError / denied | SecurityError / denied |
| opener after normal noopener/noreferrer link | null | null |
| Malicious upstream allow-same-origin CSP | Replaced; final document has `sandbox allow-scripts allow-forms` and executes as opaque | Same |
| Malicious upstream Set-Cookie / CORS headers | Absent; takeover cookie not installed | Same |
| Gateway Cookie/Authorization/connection nonce stripped before upstream | PASS, server-side synthetic observation | Same |
| Known-valid-nonce null-Origin read/management requests | 6 HTTP403 observations across normal + redirected canary | 6 HTTP403 observations across normal + redirected canary |
| Positive root-relative redirect | 302 → prefixed `/canary`200; opaque checks repeat successfully | Same |
| API-looking root-relative redirect | 302 → `/api/portforward/synthetic/api/management`404; never becomes management route | Same |
| Actual browser instance time | 0.300 seconds | 0.471 seconds |

Each normal/positive page attempts a read GET, simple management POST and JSON management request **while deliberately knowing the valid nonce**. The fake server sees `Origin: null` and rejects each observed API request with403 before the protected handler. Chromium's JSON case reached a rejected POST; WebKit's JSON case produced a rejected OPTIONS preflight. JavaScript receives TypeError/CORS rejection, so **the403 status is separately observed by the server**, not claimed as a readable browser fetch result.

For each browser, the final raw data contains 10 browser-visible control/document/redirect responses and 6 separately recorded denied API requests; those paths are disjoint. Thus **16 observed HTTP requests per browser**, below30. Playwright's route counter is14 because redirect-follow requests bypass that interception callback. `budget-summary.json` records this distinction rather than presenting the interception count as the complete HTTP total. No external page requests or outbound exfiltration target was used.

## Preserved failed attempt and corrected test assumption

`attempt-01/` is preserved unchanged with overall FAIL. Chromium passed; WebKit passed the normal opaque-isolation case, then the helper required CSP metadata on **every** response including302. WebKit's redirect response metadata omitted that CSP field, while the final200 document showed the sandbox policy and ran with opaque origin.

The helper was corrected to assert the applied CSP on final document responses, while retaining the observed redirect metadata and checking cookie/CORS/referrer cleanup separately. No production fix was made and no server bypass was demonstrated by this failure. `attempt-02/` is a separate PASS artifact. The initial failed harness was not separately source-hash frozen; its failed assertion and results remain in the first artifact. Final source hashes are recorded separately and apply to the final harness.

## Artifacts and reproducibility

- `attempt-01/result.json`, `chromium.json`, `webkit.json`: preserved initial result/failure.
- `attempt-02/result.json`, `chromium.json`, `webkit.json`: final PASS, safe path/status records, JS booleans, denial counters, fixture exit and released-listener proof.
- `budget-summary.json`: observed request totals and elapsed times.
- `source-identity.json`: final observed HEAD `496729e2e1df38081496bad3313fd7e594fbe10f`, source/helper hashes and both driver command arguments. Relevant production server/auth/proxy files have no committed diff from preceding `4ec526b7`; root integrated the test helper separately.
- `opt-in-guard.log` / `opt-in-guard-run.json`: expected SKIP without opt-in, exit0; distinct from browser PASS.

Driver commands were `node frontend/e2e/release-preview-isolation.mjs artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-01` and the same with `attempt-02`. Each launches only its own opt-in Go test child with GOMAXPROCS1, `-p 1 -parallel 1`, and closes that child/listener. Artifact fields contain no credential values, query nonce values, raw request headers, saved HTML, HAR or browser storage dump.

These checks strengthen the specific browser sandbox and CSRF claim under synthetic authority. They do not establish real Kubernetes RBAC/SPDY behavior, arbitrary redirect/download/upgrade/trailer coverage, actual app UI integration, eight-hour expiry, native Safari, professional penetration-test completeness, performance or release acceptance.
