# TEST-12.06 — workspace export credential and write-grant boundary

**PASS for the new finite HTTP/session/export→import group.** This is owned loopback TCP HTTP through the production handlers with fake Kubernetes clients, a synthetic Secret, synthetic credential-bearing private cache, and real in-memory KubeView operator grants. It is not real Kubernetes, browser or native release-package E2E. Same-agent-system worker evidence, not independent professional pentest.

## Identity, command and budget

- Audit source HEAD `ae7aebc51984a144f10b4780989a6d1a8f19197e`; product runtime checkpoint `15770296056ca2629601dba540c04741e1822e0d`. New test only: `backend/pkg/server/release_workspace_export_test.go`.
- Command from `backend`: `GOMAXPROCS=2 go test -json -p 1 -parallel 1 -timeout 60s ./pkg/server -run '^TestReleaseWorkspaceExportAuthorityBoundary$' -count=1`.
- First/only execution: 2026-11-14T13:15:49.932315Z–13:15:55.560886Z. **1 top-level +8 subtests PASS,0fail,0skip**; wrapper **5.628568s**. No import fuzz/store suite or unrelated package suite was rerun.
- Safety plan: one Go group/one worker;60s Go and outer limit; each HTTP client timeout3s, response capped2MiB; owned process-group RSS cap1536MiB; free disk≥10GiB. Sampled owned process-group peak **658.953MiB**, not retained app RAM or a native-package memory benchmark. Stop was not triggered. No browser/provider/bootstrap/build-release/external target was used.
- Exact source SHA256: `ca0f91743bbe16420238eb21cb0e262a213f1268c3978948533f021e14742d80`. Before-run source/lock/helper hashes in `preflight.json` all still match (`result-summary.json`). Exact executed source archived as `test-source-attempt01.go.txt`.

## Active source boundary

1. `server.go:Register` protects `/api/workspace` and subpaths with `guard`/`protect`. API access authentication and same-Origin checks run before the handler. Workspace configuration read is local-operator metadata, not a new Kubernetes RBAC grant.
2. `workspace.go:workspaceDTO` serves normal GET `/api/workspace`, adds the workspace nonce and current connection identity/authorization-generation fields for normal app operation. Those are deliberately distinct from the export format.
3. GET `/api/workspace/export` directly serializes `ws.Export(store.Snapshot())`. `workspace/store.go:Export` clones the typed `Document`, clears every trusted `Connection.Context`, sets `Bound=false`, and preserves display metadata, scope selectors, layout/preferences and configured relations. It does not serialize Server, rest.Config, operatorSession or identity cache.
4. Kubernetes credentials live in private `Clients.Config`/client transport. Operator access token lives in Server.Token/access cookie; browser grant, nonce, scope and expiry live in `Server.operators`/operatorSession. Computed connection identities live in `workspaceRuntime.identities`, outside persisted Document. The test seeds synthetic markers into these stores and a fake Secret; none is a real credential.
5. POST `/api/workspace/import` uses the actual workspace nonce and revision, decodes the typed Document and `ImportInto`. It strips source binding again and remaps IDs/references. Imported connection requires explicit trusted server-side rebind before resource access. Config import does not import an enabled operator session.

## Eight finite subtests

| Subtest | Positive/negative control and observation |
|---|---|
| Normal export | Actual authenticated GET200; workspace ID/name/revision/preferences, two named harbor records, namespaces, distinct label selectors, view/position and configured relation exactly preserved. Display connection name `test` deliberately equals a trusted context name and remains display metadata. |
| No authority/sensitive material | Export's connection Context empty/Boundfalse; root nonce/token/cookie/management-grant fields absent; connection context/identity/authz/generation/private-config fields absent. Exact synthetic token, both nonces, actual cookie values, cache bearer/key/path/generation/authz/cluster-identity and fake-Secret markers absent from export bytes and all owned source config/backup files. No marker values or headers are logged. |
| Source unchanged | Export leaves source canonical snapshot, revision and persisted file bytes unchanged. Existing scoped operator object remains enabled with identical nonce. Normal `/api/connection` GET200 still reports that original grant enabled, proving export did not globally disable the app. |
| Concrete HTTP export→import | Separate local app/cookie profile; normal access login +workspace nonce; before import the test deliberately injects `context=test,bound=true`, forged verified-cluster/authz fields and old source nonce/grant into exported JSON. Actual import200 creates fresh connection/harbor IDs, preserves original destination trusted records, imports configured/user-imported relation, leaves imported Contextempty/Boundfalse. Scoped resource GET and source-grant management attempt both409; no destination operator enabled. Sensitive/forged markers absent from destination persistence. Source workspace remains unchanged. |
| Unauthenticated read | No cookie/bearer→401 and no sensitive marker in error. |
| Wrong access token | Wrong synthetic bearer→401 and no sensitive marker in error. |
| Foreign Origin | Valid authenticated cookie plus `https://attacker.invalid`→403 and no sensitive marker in error. |
| Wrong export method | Authenticated POST with valid workspace nonce/revision→422 invalid workspace path, with source snapshot/files unchanged. The handler's current method policy is422 here, not a fabricated405 expectation. |

The group uses normal HTTP `/api/session` login, GET workspace + scoped connection diagnostic and POST `/api/management` to create the real in-memory scoped grant. It does not seed `enabled=true` manually or call a private authorization bypass. Existing `newCookieProfile`/`enableCookieProfile` helpers are reused. Kubernetes SSAR/discovery/Secret storage are fake fixtures; this does not prove actual kubeconfig rotation or live Kubernetes permissions.

## Findings, cleanup and limits

No product defect was reproduced in this finite group; no runtime fix or failure→retest is claimed. First result/source are preserved, not overwritten. `t.Cleanup` closes owned httptest servers and Server runtime and removes t.TempDir state. Go subprocess exited0. No independent socket/child/heap census was collected; resource stability is not claimed from this short group.

Scope excludes global archive/private-data scanning, arbitrary user-authored preference/display text redaction, browser downloads, real Kubernetes, final packaged binary, all context/credential migration/restart paths and broad fuzz. Display names/namespace selectors/configured relationships are intentionally exportable; clearing binding authority does not promise erasing all words that happen to match context names. Source config legitimately retains its trusted Context/Bound binding; the assertion is that secret/session/grant values do not persist, not that all binding metadata vanishes from source config. Export does not promise generic detection of a user manually typing sensitive data into a permitted display preference.

This group supports TEST-12.06's concrete local workspace export trust boundary. It does not close CAT-12 in general, TEST-20.10 package-private-data scan, user manual approval or global release readiness. Review/roadmap/commit decisions remain with the main manager.

## Evidence

- `preflight.json`: predeclared source, scope and safety caps.
- `attempt01.stdout`/`.stderr`: bounded raw Go JSON events; no header/body credential dumps.
- `attempt01-result.json`: command, timestamps, status, process-group peak and stop state.
- `result-summary.json`: parsed1+8 results and unchanged source checks.
- `test-source-attempt01.go.txt`: exact executed test.
- `checksums.json`: this directory's evidence hashes, excluding itself.
