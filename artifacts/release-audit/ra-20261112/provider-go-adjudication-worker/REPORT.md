# Nine exact Go finding rows — technical NOT_AFFECTED

All eight Cilium APT-candidate x/net High rows and the operator-image gops Unknown row are **NOT_AFFECTED / FALSE_POSITIVE_MODULE_MATCH for the exact inspected Linux ARM64 ELFs**. The affected package/code is absent; this decision does not rely on failing to find a caller. No risk waiver, scanner suppression, version upgrade or global security closure occurred. Original scanner findings remain intact.

[Per-row decisions](row-dispositions.json) bind each target, actual ELF SHA256, installed module, advisory import/symbols, fixed floor, complete-table evidence and disposition. [ELF projections](ELF-pclntab-projections.json) retain full-table hashes/counts; complete symbol/name tables and ELFs remain private under `.git/release-audit/provider-go-adjudication` or the reused reachability directory.

| Target | Module version | Function entries / full names | Decision |
| --- | --- | --- | --- |
| `opt/cni/bin/cilium-cni` | v0.60.0 | 17426/22346 | NOT_AFFECTED |
| `usr/bin/cilium-agent` | v0.60.0 | 187842/202202 | NOT_AFFECTED |
| `usr/bin/cilium-bugtool` | v0.60.0 | 11928/15913 | NOT_AFFECTED |
| `usr/bin/cilium-dbg` | v0.60.0 | 138077/148959 | NOT_AFFECTED |
| `usr/bin/cilium-envoy-bootstrap-locality` | v0.60.0 | 25100/29572 | NOT_AFFECTED |
| `usr/bin/cilium-health` | v0.60.0 | 13100/17231 | NOT_AFFECTED |
| `usr/bin/cilium-mount` | v0.60.0 | 7700/10480 | NOT_AFFECTED |
| `usr/bin/hubble` | v0.60.0 | 106524/114833 | NOT_AFFECTED |
| `usr/bin/gops` | v0.30.0 | 4256/6089 | NOT_AFFECTED |

## x/net evidence and exact scope

Fresh [Go primary advisory](https://vuln.go.dev/ID/GO-2026-6860.json) identifies CVE-2026-78661, affected import `golang.org/x/net/html`, fixed floor0.62.0 and seven symbols: Parse, ParseFragment, ParseFragmentWithOptions, ParseWithOptions, parser.addText, parser.fosterParent and parser.parse. Installed x/net remains0.60.0. All eight ELFs have zero affected-package/function matches in **every parsed function entry and the entire function-name table, including inlining names**, plus no raw affected package-path bytes. Complete ELF64 ARM64 headers and Go buildinfo confirm linux/arm64. Their pclntab hashes and entry/name counts also match the previous complete-table analysis.

The old ten affected Go ELFs comprise these eight Cilium targets plus relay and the old official operator. They overlap **8 of today's13 Cilium Go analyzer targets**, not all13. The old extraction manifest additionally contains one native Envoy starter, outside those ten Go analyses. [Complete13-target mapping](all-13-Cilium-Go-target-scope.json) records every current hash/module and scope. The five outside the old ten are loopback, health-responder, sysctlfix, gops and iptables-wrapper; current inventories contain no x/net module for them. Operator gops happens to be byte-identical to Cilium gops; only the requested operator finding receives a new disposition here.

## Gops Windows-only advisory

Fresh [Go primary advisory](https://vuln.go.dev/ID/GO-2026-5024.json) explicitly restricts CVE-2026-39824 to `golang.org/x/sys/windows`, goos=[windows], symbol NewNTUnicodeString, fixed floor0.44.0. Operator gops still carries x/sys0.30.0. Upstream tagged v0.30.0 and v0.44.0 `windows/syscall_windows.go` sources were fetched with verified TLS: the older implementation narrows the byte length without a bound; the fixed one rejects overflow. The `_windows.go` filename is an implicit Windows constraint, confirmed by installed official Go build-constraint help.

The actual gops ELF SHA256 is `61c61208e84c53b9c617b0781a4936cf1aed39175e098c2d9bd26a6a3d90c3e8`; its Go build settings are linux/arm64, and its complete4256-entry/6089-name tables contain neither Windows package functions nor NewNTUnicodeString. The package path is absent from raw bytes too. Unknown severity was not interpreted as low risk; the decision follows the explicit platform restriction and actual code absence.

## Integrity, method and limits

[Input validation](input-hash-validation.json) checks prior artifact SHA256SUMS, current private raw scan bytes against preserved compressed scans, all eight reused ELF hashes against current APT-candidate asset identities, and gops against the actual stopped operator candidate. Current local image descriptors remain Cilium107f5725… and operator0f5f919c…. Package/symbol metadata and upstream source hashes/URLs are in [primary projections](primary-source-projections.json).

The parser uses actual Go ver120 pclntab offsets, validates every function entry and reads the entire name table. Installed Go source documents both this layout and inline-call name offsets. Full name matching searches package substrings anywhere, including vendor prefixes. An initial parser syntax error occurred before analysis and was corrected; its failure record is preserved. Actual parse peak RSS333,856,768bytes stayed below2GiB. Only bounded public primary HTTPS reads and existing local tools were used, with GOMAXPROCS2. No scanner, build, dependency/tool download, VM, API test, image execution or installation ran.

One owner-labelled operator candidate container was created solely to copy gops; state remained created/PID0 and exact cleanup confirmed absence. This is a code-presence decision for these nine files only: external/dynamically loaded code, other architectures/bytes/advisories, unversioned Cilium main/source CVEs, licenses, other severities, runtime compatibility and the complete provider/global gate remain outside scope. No product/pin/Git/index/roadmap change occurred.

**Budget exception:** data parsing and the first machine summary completed before the360s deadline; report/manifest finalization completed at374.242s, exceeding it by14.242s. `summary.deadlineNotExceeded=false` preserves this failure. No further research, parsing, scans, builds or image operations were started after finalization; this note and checksum refresh only correct the delivery record. Technical dispositions and resource measurements are separate from this failed time-bound requirement.
