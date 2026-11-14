# Historical browser fixture checkpoint

Root is preserving the previously completed controlled preview/CSRF job and its exact helpers in Git. All10recorded source hashes still match; no product file in that set changed, so no redundant browser run was scheduled. First failure and final retest remain separately attributed to source496729e2 and the frozen final helper hashes; they are not relabeled as newly executed tests.

The test routes exist only in an opt-in `_test.go` fixture, never in production. Both Chromium and Playwright WebKit used synthetic authenticated authority and net.Pipe transport, real opaque sandbox JS/cookie/storage/opener observations, null-Origin denials and header/redirect containment. This does not prove genuine Kubernetes/SPDY forwarding or native Safari. The later UI CSP policy is separately tested at the main mux boundary; this historical fixture does not include that main handler.

No credentials, query nonce values, storage dump or workload payload is included. The new delivery checksum table covers the existing small reports/results/logs; no video was required or generated for this non-animation boundary job. Test code is checkpointed with exact evidence rather than leaving already verified helpers untracked.
