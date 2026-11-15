# TEST-12.10 — native release debug/test surface second review

**Decision: narrow TEST-12.10 completion is supported.** Same-agent-system second reviewer, not an external professional pentest. Reviewer ran no application, browser, cluster, Go test, compile or security scanner; only source/evidence reads and checksum/assertion review. Product, ROADMAP and Git were not modified by reviewer.

## Source/build binding

Native binary SHA256 `24ef0ce34d3381644fc14dc16a768bbeb7b8c580d19813ff580780e536378e68`; build commit `71b4098314c71d7c9473d88356edf7200fe62f1f`; audit checkpoint `57ad606e059d31f50d316a12f6a218f6a2edb11a`. Reviewer independently recomputed actual binary hash and all four preflight current-source hashes, and compared each against `git show 71b40983:<path>`: **4/4 identical**. Files are `backend/main.go`, `backend/pkg/server/server.go`, `replay_source.go`, `benchmark_test.go`. Broader package source binding was separately reviewed for TEST-20.01; this review does not relabel every archive member as scanned.

## Active code and route interpretation

- `main.go:main` builds a private `http.NewServeMux`; `gateway.Register(mux)` and `http.Server{Handler:mux}` use that mux. No production source pprof/expvar import or registration was found in bounded backend source search. Default-mux side effects do not implicitly register routes in this private mux.
- `server.go:Register` registers real management/workspace/Kubernetes/provider paths plus conditional replay registration; those intentional product APIs are not automatically debug vulnerabilities.
- `benchmark_test.go:TestBenchmarkFixtureServer` contains fixture environment reading, synthetic API routes (`/__benchmark/*`) and result-writing code in a Go `_test.go` file. That fixture runner is not part of the normal `go build` production main. It uses the **actual** `KUBEVIEW_BENCH_ADDR`, not a `KUBEVIEW_BENCH_PORT` key.
- `main.go:frontendHandler` checks method **before** `/api` path. Unknown GET API requests yield404; unknown POST requests yield405. Nonasset extensionless GET paths, including `/debug/pprof/`, `/debug/vars`, `/metrics`, `/__benchmark/*`, return the SPA index. A200 response alone is not a debug API. Actual evidence requires bytes/hash equality to the normal587-byte index (`d0b09c58...`). A pprof page, JSON state, metrics text or fixture-injected HTML would fail that equality.
- `replay_source.go:registerReplay` exits when replay is disabled. `--replay-profile M|L` / explicit `KUBEVIEW_REPLAY_PROFILE` is a documented production read-only TEST/REPLAY source with loopback validation, separate namespace/context labeling and nonce-controlled scenarios. It is intentionally compiled and is not claimed absent from all release modes. No replay profile was enabled in these tests.
- Optional browser globals `__KUBEVIEW_BENCHMARK__` callbacks, `canvas.__harbor` scene inspection functions and conditional React profiling hooks are JavaScript/DevTools instrumentation surfaces, not backend HTTP debug endpoints or authority bypasses. This review does not claim they were removed or browser-CSP tested here.

## Execution evidence, failures preserved

| Attempt | Observed | Interpretation |
|---|---|---|
| `native-debug-surface-root` | FAIL,19requests,2.506021s; app SIGTERM exit0/identity absent/19849 free | Fixture incorrectly demanded404 for absent POST `/api/replay/scenario`; actual405 matches active method-first handler. Benchmark-env mode never ran. No product fix is claimed. |
| `native-debug-surface-retest-root` | PASS,42requests,5.512804s; default + benchmark-test-env modes,21each | Exact GET404/POST405 distinction,8same-index GET paths per mode,4blocked POST paths,5normal health/index/version/workspace/contexts controls per mode. Reviewer verified all42rows and8byte/hash-equivalent SPA rows per mode. |
| `native-debug-surface-addr-retest-root` | PASS,21requests,2.687978s; actual fixture-env mode only | First retest's unused PORT key limitation is retained. Follow-up uses real `KUBEVIEW_BENCH_ADDR=127.0.0.1:19848`; same route checks, no result-directory write, absent kubeconfig stays absent, only owned PID TCP listener is127.0.0.1:19849. Already successful default mode was not repeated. |

Both PASS runs preserve exact native hash/source-after checks. Real healthOK, source commit version, empty workspace and empty context responses provide positive normal behavior controls; rejection-only “everything disabled” was not accepted as success. Each probe remains readonly with Hubble/minikube disabled, clean0700 private state, absolute binary path, empty owned app PATH, explicit absent kubeconfig and preserved HOME. No user's kubeconfig/current context was adopted. No real Kubernetes request or mutation is asserted.

## Safety and cleanup review

Predeclared loopback target127.0.0.1:19849 only; ≤50HTTP attempts, paced≥0.105s between starts, responses≤2MiB,45s work guard/60s phase, appRSS≤1GiB, diskfree≥10GiB. The code checks time/resource guards between requests and uses2s HTTP/subprocess timeouts. These are source guards; actual rate timestamps were not separately logged. Deadline guards are not an OS hard realtime watchdog against every possible trickling response. Observed entire runs were short and within budget.

The root corrected the initial listener gap following this review: final probes enumerate **all TCP LISTEN endpoints of the owned app PID** and require exactly127.0.0.1:19849. This does not scan or stop unrelated user's19848/5190 processes. PID/lstart+command identity is checked before signals; all three test app exits report0 after SIGTERM, captured identity absent,19849 no listener. No forced kill success is fabricated. State/bundle paths are deliberately preserved for inspection.

Remaining observation limits: direct children were sampled at guards; short-lived/reparented descendants are not an exhaustive census. UDP/unix sockets and all host ports are not covered. PID birth is OS ps-level resolution, not a kernel unique process handle. No process-RSS or energy optimization claim is drawn. Privileged workload/provider operations were not spidered.

## Acceptance boundary

The tested native artifact does not expose active pprof/expvar/benchmark fixture handlers under default or supplied fixture environment; unknown route SPA/405/404 responses and lack of result writing are independently correlated with source. Intentional replay-enabled workflow was read but not executed. No test/debug product defect required a source change. This supports this bounded TEST-12.10 result; **TEST-20.10 archive/private-data/Secret scan, all-platform exposure, provider/replay authorization, actual Kubernetes, full pentest, final package, performance and global release readiness stay open**.

Evidence inputs and source/binary recomputation: `review.json`. Root raw first failure and both PASS outputs remain in their separate sibling directories; never overwrite them. `checksums.json` binds this review's own files.
