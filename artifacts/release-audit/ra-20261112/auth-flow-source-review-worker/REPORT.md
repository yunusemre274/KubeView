# TEST-01.02 source flow review

**Source map complete; runtime acceptance pending.** This job ran no app/browser, Go/Node test, build, scan or cluster/provider operation. All23 reviewed backend/runtime/frontend-context files independently match frozen f32 bytes. All recorded repository source hashes in the four reused session/Host/Secret evidence sets also match current files. Their historical results retain their original scope and are not new PASS results.

| Boundary | Exact source entry | Meaning |
|---|---|---|
| Operator startup | main.go29/101/198/236 | Trusted kubeconfig/context, explicit writable opt-in, workspace setup; non-loopback requires token |
| Host/Origin/access token | server.go114/126/197 | Local no-token Host restriction, SameOrigin/FetchMetadata, optional Bearer/access cookie; guarded JSON login |
| Public request binding | server.go156; workspace.go123 | protect inserts request authority context and binds server-owned workspace/harbor/connection/tab |
| Browser/profile authority | workspace.go74/83; connection.go43 | Profile-specific cookie names; cookie/workspace/harbor/tab key; nonce and absolute8h operator context |
| Connection/enable/revoke | connection.go149/220/307 | Context/namespace/client-generation binding; nonce rotation; late-grant revalidation; revoke cancels contexts/forwards |
| Grant and RBAC | connection.go93; resources.go21/75 | Backend ReadOnly, live browser intent, namespace, then exact-resource SSAR Allowed and actual API authorization |
| Object scope/identity | workspace_scope.go184/333; resources.go277/344/373 | Namespace/selector/cluster-impact constraints, UID/RV preconditions, final scoped dynamic client |
| Logs/exec/forwards | sessions.go21; log_session.go54/83; portforward.go63 | Subresource RBAC, Pod UID, context-bound streams and cancellation |
| Credential/scope revoke | server.go307/388; workspace.go470/632 | Fingerprint reload rotates client generation; grants, stale membership and affected streams reset |
| Shared watches | workspace_broker.go31/77; workspace_membership.go21/37 | Credential/scoped keys, final-release cancellation and stale generation rejection |
| Frontend intent | ShipyardClusterContext.jsx236/365/410/855; WorkspaceProvider.jsx64 | Scope/nonce propagation, abort/epoch guards, serialized revoke, read-only initial state; separate workspace nonce |
| Optional providers | provider_handlers.go62/122; traffic_handlers.go194 | Same public protection plus provider-specific loopback, context/cluster identity, SSAR and credential/lease scope |

Important distinctions remain explicit. managementEnabled is application intent, not Kubernetes admin: enable's SSAR call checks API/transport success without consuming Allowed; actual operations still check Allowed in authorize and face the real API. managementAllowed's nil result for internal callers without operatorRequest is not a public bypass: protect always supplies that context, even without a cookie. ReadOnly is enforced in backend authorization; UI state alone grants nothing. Purpose Secret GET is a read permission and can succeed while write mode is disabled.

Static access-token validity and operator-grant lifetime are different: the access cookie's8h browser MaxAge does not impose independent server expiry on the configured token. Public health/version/static handlers remain outside gateway guard. Explicit remote-token mode, HTTP-vs-real-TLS cookie Secure behavior and trusted kubeconfig exec plugins retain the threat model's local-first/single-operator boundaries. Tab/harbor isolation is not a tenant identity model. Cancellation does not establish rollback of writes already accepted upstream.

result.json selects18 existing named, anchored guard tests, each NOT_RUN, with file/line/control/prerequisites and a finite root-only Go command. They cover Host/Origin/token, fresh/expired sessions, delayed-enable/revoke race, cookie profile separation, workspace CSRF/tab/harbor/scope changes, credential reload and retained-grant read-only rejection. Fake-client SSAR defaults allow in testServer; these unit controls do not prove real RBAC enforcement. The actual-cluster RestrictedRBAC and sealed owned Secret tests are listed separately with explicit opt-ins, outside the proposed group.

Historical session proof is unit/fake; Host proof is post-rebind loopback HTTP without DNS/browser/WS upgrade; Secret API/UI proof covers its sealed synthetic matrix. Deliberate upstream admission denial was not run in that Secret evidence. No broad security-clean, TLS/remote deployment, actual RBAC race, final package or TEST-01.02 closure follows from this source review. Root runs its finite guard group after GPU diagnostics end and evaluates those fresh results separately. Only this directory's report, JSON and SHA list were written.

Timing: source review/report finalization exceeded the approximate300-second target; actual elapsed is recorded in result.json. This is a review-workflow timing limit, not a measured application SLO.
