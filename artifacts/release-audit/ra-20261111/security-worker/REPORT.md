# Finite backend security review and SEC-001 repair

Base source: `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`. Recorded evidence window: 2026-11-11 10:20:54–10:31 UTC. Worker: KV-SECURITY-WORKER. Scope: CAT-01 and backend portions of CAT-08–12. Read the required AGENTS/project/security material. This is source review plus finite synthetic tests, not full category acceptance.

**One confirmed finding, SEC-001, repaired after root assigned file ownership.** Baseline existing tests: **46 PASS, 3 SKIP, 0 FAIL** (top-level tests only). The preserved first regression log has **1 expected FAIL**, confirming out-of-harbor Secret disclosure under incomplete discovery. After repair, the server retest has **34 PASS, 3 SKIP, 0 FAIL**, including the original regression and an 80-request endpoint/discovery matrix. The production change is confined to `backend/pkg/server/workspace_scope.go`; related tests are in `backend/pkg/server/release_security_regression_test.go`. No dependencies or Git/index state were changed by this worker.

## SEC-001 — Typed resource scope check fails open on incomplete discovery

- Severity: **HIGH for the promised harbor confidentiality boundary**, with a prerequisite: the selected backend Kubernetes identity can GET the target Secret, while discovery omits that resource. This is not a Kubernetes RBAC bypass or unauthenticated remote access. Application scope is an additional projection/safety boundary in the documented single-operator model, not an independent tenant identity.
- Root cause at the base source: `backend/pkg/server/workspace_scope.go:199` calls `discover(c)` and discards its errors. When no discovered resource matches the named request's group/resource, the loop performs no membership check and returns success. `authorize()` then accepts a successful SSAR. Typed handlers do not use the final `workspaceDynamic` adapter.
- Proven endpoint: `GET /api/secrets/reveal`, `backend/pkg/server/server.go:527`. The ordinary full-discovery request for a Secret labeled `app=outside` in a harbor restricted to `app=allowed` correctly returns **403**. Removing only the Secrets discovery entry, with the typed Secret API and its authorization still available, makes the identical request return **200 and the synthetic Secret body**.
- Other paths sharing the same prerequisite: named Pod log, exec, and raw/create port-forward authorization (`stream.go:105`, `sessions.go:38`, `portforward.go:64`). The new repaired-state matrix covers each path, using a synthetic log opener and deliberately absent exec/forward transport. Actual exec/forward streams are not an exploitation claim; the Secret disclosure is the preserved pre-repair proof.
- Reproduction: `TestReleaseSecuritySecretRevealFailsClosedWhenDiscoveryOmitsResource`, `backend/pkg/server/release_security_regression_test.go:19`. It uses existing fake clients/fixture, has a baseline-denial control, and opens no listener. Evidence: `regression-secret-discovery.log`; base-source and initial-test hashes: `source-identity.json`; repair hashes: `repair-identity.json`.
- Existing tests matching the intended boundary all passed: `TestWorkspaceHTTPPersistenceCSRFAndScope`, `TestSecretPurposeEditorPreservesMetadataWithoutBulkLeak`, `TestPurposefulSecretRevealIncludesGVKAndIdentity`. They do not exercise omitted discovery resources in typed handlers.
- Applied repair: a named selector check now requires a resolved, namespaced resource with a nonempty version, and returns Forbidden when no matching resource is discovered. A valid target resource remains usable during an unrelated discovery-group failure because membership is still verified against the selected client's real object; missing/unavailable target versions deny access. Owner-based membership and namespace rules are preserved.
- Verification: `TestReleaseSecurityTypedSelectorsRequireResolvedDiscovery` at regression file line 65 exercises Secret/log/exec/forward-create/raw across allowed and outside labels, target omission, full discovery error, malformed/empty/unsupported version, incorrect namespaced metadata, and unrelated partial discovery errors. All 80 request cases pass. Allowed Secret/log paths return real synthetic content; allowed exec/forward requests reach only their expected missing-transport response, proving the permission gate passes without opening a network connection. The original Secret regression is now green. `retest-sec001.log` is separate from the preserved failure.
- Exact phase mapping: **TEST-10.02** (other harbor read/write), **TEST-10.04** (Secret leakage), **TEST-10.07** (alternative reveal/exec/forward auth), **TEST-01.03** (trust boundaries). This supplies S1 preparation, S2 execution, S3 diagnosis/repair and S4 finite regression evidence. Root review and the complete category scenarios remain prerequisites for S5 final acceptance.

## Exact registered HTTP surface

At this source there are **25 normal ServeMux patterns**, including two workspace patterns and the frontend root. Explicit replay adds **2** patterns. Registration is in `server.go:79`, `provider_handlers.go:62`, `replay_source.go:194`, and `main.go:201`. “Any” means the handler has no explicit method gate; this does not turn the handler into a mutation endpoint.

| Pattern | Accepted method / function | Boundary after access guard |
|---|---|---|
| `/api/session` | POST login | Guard with authentication disabled; JSON token comparison; access cookie |
| `/api/workspace` | GET; PATCH metadata | Access/origin; mutation requires root operator cookie + workspace nonce + revision |
| `/api/workspace/` | GET `export`; POST `preview`, `validate`, `import`; POST/PATCH/DELETE `connections[/id]`, `harbors[/id]`, `relations[/id]` | Same workspace nonce; schema/trusted-context checks; import strips binding and replaces IDs |
| `/api/connection` | GET diagnostics | Workspace binding; establishes scoped operator session and nonce |
| `/api/management` | POST enable/revoke | Cookie, nonce, exact context/namespace/client generation; delayed-enable recheck |
| `/api/contexts` | Any, context inventory | Access/origin; intentionally exempt from harbor binding |
| `/api/discovery` | Any, API inventory | Scoped selected connection |
| `/api/resources` | GET, POST, PUT, DELETE | Scope + SSAR; writes require server write mode and operator grant; dynamic adapter; UID/RV preconditions |
| `/api/capabilities` | Any, permission/capability probe | Scope + SSAR/probe semantics; reports conditions rather than granting permission |
| `/api/actions` | POST | Target UID/RV; fixed actions; grant/SSAR; cluster impact acknowledgement where applicable |
| `/api/metrics` | Any, metrics read | Selected credential; namespace union and Pod selector projection; real metrics API authorization |
| `/api/logs` | GET | `pods/log` + Pod GET/watch permission; namespace/selector; UID/container/session guards |
| `/api/exec` | GET WebSocket upgrade | `pods/exec create`, grant/nonce, Pod UID; command is inside selected Pod, not host shell |
| `/api/portforwards` | GET list, POST create, DELETE close | Cookie-scoped ownership; POST additionally grant, `pods/portforward create`, namespace/UID/port |
| `/api/portforward/` | Any except CONNECT, HTTP preview | Session owner + active grant; Pod UID recheck; fixed Pod dialer and response sandbox |
| `/api/portforward` | GET WebSocket upgrade, raw stream | Same creation authorization, UID and port checks |
| `/api/openapi` | Any, schema read | Scoped selected client; fixed upstream `/openapi/v2` |
| `/api/secrets/reveal` | GET | Purposeful typed Secret read + scope/SSAR; SEC-001 applies |
| `/ws` | GET WebSocket upgrade | Access/origin; bound scope; per-resource list/watch authorization and credential-scoped watch broker |
| `/api/flows` | GET, DELETE lease | Fixed configured provider; cluster API/TLS binding; credential identity and namespace permissions; lease pattern |
| `/api/providers` | GET | Provider status; worker action availability additionally uses local-peer and grant/SSAR checks |
| `/api/providers/minikube/workers` | GET reconcile/list, POST add/cancel | Loopback peer, write mode, unrestricted server namespace, grant/Node permission, fixed profile/context/cluster UID |
| `/api/version` | Any | Public build identity; registered directly by main, outside `protect` |
| `/healthz` | Any | Public constant health text; outside `protect` |
| `/` | GET/HEAD with frontend assets; any method for the source-only “frontend absent” placeholder | Public shell/assets; SPA fallback refuses `/api`, `/api/*`, `/ws`; trusted STATIC_DIR override |
| `/api/replay/status` | GET; replay only | Access/origin; reports explicit fixture source/control nonce |
| `/api/replay/scenario` | POST; replay only | Access/origin + replay nonce + bounded scenario/count/interval; no Kubernetes writes |

Fixed action names are `resize`, `scale`, `restart`, `cordon`, `uncordon`, `resources`, `drain-preview`, `drain`, `run-now`, `suspend`, `resume`, and `rollback`. No normal production registration of benchmark, profiler, or debug handlers was found. Benchmark endpoints occur in `_test.go` files. Replay is shipped but requires explicit read-only loopback configuration.

## Authentication and scope dataflow

1. `main.go` defaults to `127.0.0.1:8000`; a non-loopback configured bind requires `API_TOKEN` before listening. The standalone listener is HTTP. Kubeconfig API TLS policy remains separate; forwarded headers are not used as origin authority.
2. `guard` rejects non-loopback Host without a configured token, foreign/opaque/malformed/scheme-mismatched Origin and `Sec-Fetch-Site: cross-site`. Missing Origin remains an intentional CLI path. With a token, protected routes compare bearer header or HttpOnly SameSite=Strict access cookie. `/api/session` still applies origin/Host checks before accepting JSON login.
3. `protect` resolves workspace/harbor/document-tab against persisted server records. Context is selected by that binding, not a client-supplied credential or URL. Scoped operator keys combine cookie + workspace + harbor + tab. Stable cookie names are namespaced by workspace identity to avoid cross-port profile collision.
4. `/api/connection` creates/refreshes the management intent. `/api/management` checks body nonce/context/namespace and, after asynchronous API work, rechecks cancellation, nonce, expiry and exact client generation. Every public path has an operator request context, so the internal helper's no-HTTP-context exemption is not a public grant bypass.
5. Write authorization is server write mode + management grant + namespace/selector and cluster-impact rules + SSAR, followed by real upstream RBAC/admission. Generic/action operations pass through the dynamic scope adapter, which filters lists and checks old/new object membership. Typed named paths depend on `authorizeWorkspace`; the discovery fall-through there is SEC-001.
6. Credential generations separate caches/metrics/flow identities; matching physical cluster UID is not an authority-equivalence key. Scope/revoke/credential changes reset sessions and cancel attached contexts. Forward sessions carry owner ID; proxying strips Authorization/Cookie/proxy-auth/connection nonce, imposes opaque CSP sandbox and removes upstream Set-Cookie/CORS headers.
7. Workspace import carries document data, never raw kubeconfig credentials. Context binding is restricted to trusted server configuration. Optional minikube/Hubble command arguments come from fixed provider code and trusted environment configuration; browser body exposes no binary/profile/host shell/credential-file field. Trusted kubeconfig exec plugins remain explicitly outside the hostile-input boundary.

## High-impact attack chains checked and residual gaps

| Chain / phase mapping | Evidence and result |
|---|---|
| Foreign page → management/WS; DNS rebinding (TEST-08.04, 09.02–09.08) | Existing Origin/Host/JSON/session negatives, read-only and rebinding tests PASS. No browser attacker page was launched; real browser CSRF/WS acceptance remains unexecuted. |
| Harbor/tab/credential replay → another resource (TEST-09.03, 09.09, 10.01–10.04, 10.08–10.09) | Grant/tab binding, context round-trip, credential rotation, revoked peer-cache access, UID preconditions and shared-Node acknowledgement PASS. Missing-discovery typed Secret case exposed SEC-001; original regression and endpoint matrix PASS after repair. |
| Workload preview → operator cookies/management origin (TEST-11.05–11.07, 12.09) | Existing sandbox/credential stripping/operator ownership test PASS; frontend link uses noopener/noreferrer. Browser CSP execution, redirect/trailer matrix and navigation behavior were not tested. |
| Import/command input → host credentials or command execution (TEST-12.01–12.08, 12.10) | Existing export/import binding, symlink/oversize/public-directory, future-file preservation, fixed-provider context/driver/idempotency and Hubble environment/TLS tests PASS. Runtime PATH replacement and native TLS chain/mTLS rejection matrix were not executed. |

An established stream's session expiry is not visibly timer-driven: `operator()` purges expired entries on a later call, while `protect` attaches cancellation to `session.ctx`. Revoke/context cancellation is tested, but an otherwise idle open stream crossing the eight-hour expiry has no direct test here (TEST-09.01 / TEST-08.03). This is a review question, not a second confirmed finding.

## Evidence and limits

- `test-runs.json` contains exact argument vectors, base source SHA, timestamps, source delta and exit codes for every run. Each raw log repeats that provenance. Commands used `GOMAXPROCS=2`, `go test -p 1 -parallel 2 -timeout 90s -count=1 -v`; packages were run sequentially, with providers disabled and a nonexistent synthetic KUBECONFIG. The regression and repair runs are explicitly identified as source deltas on the base SHA, with repair-file hashes recorded.
- `existing-tests-1.log`: 32 PASS / 3 SKIP. `existing-tests-2.log`: 4 PASS. `existing-tests-3.log`: 10 PASS. `regression-secret-discovery.log`: 1 FAIL as described. `retest-sec001.log`: 34 PASS / 3 SKIP including both new regression tests. The retest repeats the first existing server set, so these are not additive unique-test counts. `test-summary.json` preserves top-level counts and skip names.
- Real-cluster tests **SKIPPED**, not accepted: `TestDedicatedClusterRestrictedRBAC` (owned cluster/namespace opt-in absent), `TestOwnedV11RealMinikubeManagementGate` (provider opt-in absent), `TestOwnedWorkspaceRealAPIIsolation` (owned workspace API opt-in absent).
- No application process, production/third-party scan, real kubeconfig, browser test, heavy build, race run, dependency edit or new HTTP target was used. Existing tests manage their existing owned httptest listeners; the new regression is in-process only. No claim is made for actual LAN bind, runtime LISTEN cleanup, real RBAC/admission or Hubble/minikube E2E.
- This report is intentionally finite. Root owns roadmap state, repair coordination and final acceptance; the above source review and tests do not close the complete CAT categories.
