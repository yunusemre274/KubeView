CAT07 dependency audit and coordinated Go remediation completed on 2026-11-11. Starting source: `36d5b8f90c8afdec437bdb6e5516541b5bb859bd`, branch `redesign/harbor-workbench`. This worker changed only production `backend/go.mod` and `backend/go.sum`; the coordinator owns Dockerfile/CI/docs alignment and all Git actions. This is dependency verification, not stable release acceptance.

**Results**

| Check | Exact result | Duration |
|---|---|---:|
| Baseline npm audit, all lock/dev/runtime dependencies | PASS: zero advisory matches, JSON valid, no error object/stderr; 204 dependency paths match lock count | 0.672s |
| Isolated npm positive control | PASS: lodash 4.17.20 reports expected GHSA-35jh-r3h4-6jhm and four advisory records; audit exits 1; no node_modules created or code executed | 0.622s audit, 0.453s lock creation |
| Baseline Go source scan, `./...` | Findings: 42 advisory IDs (21 symbol / 15 package-only / 6 module-only) | 5.218s |
| Baseline Go release-main scan, `.` | Same 42 IDs; static trace differences retained | 5.468s |
| Baseline Go vet, `-p=1 ./...` | PASS | 14.541s |
| Official Go 1.26.11 availability/download | PASS, official release 2026-11-10; local Go toolchain cache, no global PATH change | 11.729s |
| Coordinated Go dependency update / tidy | PASS | 4.357s / 0.763s |
| Patched Go vet, `-p=1 ./...` | PASS, no output | 59.504s |
| Patched Go tests, `-p=1 -parallel=2 -timeout=90s -json ./...` | PASS: 94 top-level PASS, 25 explicit SKIP; 239 PASS including subtests; six test packages pass | 27.974s |
| Patched Go release-main scan, `.` | PASS: zero finding events parsed; Go 1.26.11 confirmed in scanner config | 3.439s |
| npm CycloneDX SBOM, lock-only | PASS: CycloneDX 1.5, 203 unique components for 204 paths (fdir 6.5.0 appears twice) | 0.186s |

Commands ran serially with `GOMAXPROCS=2`; Go build package parallelism was limited to one. Each command had a 120s outer bound; positive-control commands had 30s. No timeout occurred. Scanner JSON exit 0 was not treated as a clean gate: actual finding events were counted. govulncheck v1.9.0 was pinned and installed only under `.git/release-audit/tools`. Both scans used https://vuln.go.dev, revision `2026-11-11T02:51:11Z`. npm audit does not expose a database revision; its result is bounded to the query time in its command manifest.

**Final dependency selection**

| Item | Baseline | Candidate |
|---|---:|---:|
| Minimum Go directive/toolchain | 1.22.0 directive / 1.26.5 installed | 1.26.11 |
| github.com/gorilla/websocket | 1.5.1 | 1.5.3 |
| github.com/moby/spdystream | 0.2.0 | 0.5.1 |
| golang.org/x/net | 0.23.0 | 0.62.0 |
| golang.org/x/oauth2 | 0.10.0 | 0.27.0 |
| golang.org/x/sys | 0.18.0 | 0.49.0 |
| golang.org/x/term | 0.18.0 | 0.47.0 |
| golang.org/x/text | 0.14.0 | 0.43.0 |

All selected `k8s.io/*` module versions remain unchanged; api/apimachinery/client-go/metrics remain 0.30.0. No Kubernetes major migration or frontend lock upgrade was performed. x/net 0.62.0 is the smallest database-reported floor that clears all baseline x/net matches, including package-only HTML advisories. Its official manifest requires Go 1.26 and selects text 0.43.0, sys 0.49.0, term 0.47.0 and crypto 0.58.0. The latter is in the module graph even though it is not an application-loaded package. Full graph changes are recorded in `remediation-manifest.json`: twelve selected version increases plus removal of unused cloud.google.com/go/compute; cloud metadata moves 0.2.3→0.3.0 and x/mod, x/sync, x/tools graph versions also rise. Tidy removed the obsolete direct appengine requirement. This is a tested compatible candidate, not proof of compatibility with every Kubernetes/auth-plugin configuration.

The [official Go release history](https://go.dev/doc/devel/release#go1.26.11) confirms the same-minor patched release. The [upstream SPDY advisory](https://github.com/moby/spdystream/security/advisories/GHSA-pc3f-x583-g7j2) identifies 0.5.1 as fixed. Every advisory's affected intervals, module versions, evidence level and review status are preserved in `go-advisories.json`, `go-findings-summary.json` and the 42-row `go-baseline-triage.json`. `BASELINE.md` records the original threat-model assessment and minimum advisory floors before graph resolution.

The baseline's strongest direct runtime candidate was [GO-2026-6609](https://pkg.go.dev/vuln/GO-2026-6609), because production assets use http.FileServer and accept incoming Range headers. SPDY and HTTP/2 client parsing matches depended on a malicious upstream peer. HTTP/2/TLS server, multipart, CONNECT and MaxBytesReader races were reviewed against their actual prerequisites; symbol presence alone did not establish exploitation. The unreviewed Gorilla weak-PRNG advisory conflicted with exact installed 1.5.1 crypto/rand source, preserved in `gorilla-baseline-source-evidence.json`; the update removes its scanner match without asserting that the baseline used weak randomness. No malicious payload, active external scan or real-cluster attack was executed.

**Verification scope and retained gaps**

The patched verification ran on the working tree with the dependency changes plus another worker's `backend/pkg/server/workspace_scope.go` version SHA256 `4b838de64aa1339b7541fcf631f14191ade824da4a50fd0ba5cc13d242940a5d` (mtime 10:29:05Z, before vet/test/scan). This worker did not edit that file. Candidate go.mod/go.sum hashes and command timing are in `remediation-manifest.json`; this is not a claim that the starting commit alone has the patched results.

All 25 opt-in real-cluster/benchmark tests skipped; exact names and reasons are preserved in `patched-test-skips.json`. They were not converted to PASS. No container image was built/scanned; no Kubernetes context or browser was opened; no real exec/SPDY network interoperability, race run, custom-tag build, Linux/Windows source scan or release-binary scan was performed. Default Darwin/arm64 main source analysis found no current advisory matches after the update. Root must align its Go build toolchain and repeat platform/real-cluster gates required by the release plan.

The npm audit included dev tooling; its zero-match result does not make build/dev dependencies irrelevant or establish absence of unknown vulnerabilities. Frontend package.json and lock hashes remain unchanged. Docker Alpine OS packages, image digests, external Hubble/minikube/provider binaries, and bundled browser versions remain outside this audit. The baseline Docker/CI reproducibility observations in BASELINE.md are historical; coordinator changes supersede them.

**Artifacts and SBOM feasibility**

Raw scanner and test JSON streams are losslessly gzip-compressed; each `.command.json` identifies its file, timing, actual exit code, resource limit and uncompressed SHA256. npm audit and positive-control JSON remain plain, with small fixture copies for reproduction. No inherited environment, kubeconfig or credentials were collected. `scope-validation.json` confirms frontend lock preservation and the positive fixture's absent node_modules. The only auxiliary retrieval failures were Python HTTPS certificate validation for candidate manifests; Go's verified module fetch succeeded without weakening TLS, and those failures remain recorded.

`npm-sbom.stdout` is a native CycloneDX 1.5 source/lock SBOM. `patched-go-sbom.json` is govulncheck's native loaded-module inventory; `patched-go-module-inventory.json` records the broader selected graph. A complete release SBOM is feasible but still requires a concrete release binary and container/OS inventory, followed by SPDX/CycloneDX assembly and artifact linkage; the current source inventories do not claim full release coverage. Generated checksums in `SHA256SUMS` cover this worker's report and raw artifacts, excluding that checksum file itself.
