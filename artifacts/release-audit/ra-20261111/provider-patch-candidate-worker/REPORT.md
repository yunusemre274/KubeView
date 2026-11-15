# Official Cilium 1.20.4 patch candidate SCA

**The official patch reduces findings but is not High-clean in this snapshot.** Same Trivy DB/platform comparison: **524 → 125 component/advisory rows, 105 → 59 distinct IDs, 131 → 15 High rows, 20 → 3 distinct High IDs**. Both scans report 0 Critical rows. No candidate image was installed or executed, and no pin/cluster/source/build/global installation changed. The original 1.20.2 report is preserved byte-for-byte (SHA256 b7f5cdba6f9337680cef475d1ca87fbc97bf331a03829338ff29383751701315). Counts are package matches, not exploit counts or a release/waiver decision.

| Image | All rows old → candidate | Unique IDs | High rows | Unique High IDs |
|---|---:|---:|---:|---:|
| hubble-relay | 40 → 4 | 21 → 4 | 12 → 1 | 7 → 1 |
| cilium | 391 → 84 | 93 → 50 | 100 → 10 | 19 → 2 |
| operator-generic | 49 → 8 | 30 → 8 | 15 → 2 | 10 → 2 |
| cilium-envoy | 44 → 29 | 29 → 20 | 4 → 2 | 2 → 1 |

## Exact candidate identity

The [official v1.20.4 release](https://github.com/cilium/cilium/releases/tag/v1.20.4), published 2026-10-23, states a security rebuild with Go 1.26.10 and removal of compromised intermediates. Root's verified primary API result is `../provider-release-metadata/result.json`, SHA256 c5bbdf64909675f23889c9bdfcf98594f34d2284bd4f3a19e111f1f1c270ce15. Its release body explicitly pins the first three index digests. The separate Hubble CLI release date is not used as collector provenance.

The [official packaged chart](https://helm.cilium.io/cilium-1.20.4.tgz) was fetched over verified TLS and read as data without install/template execution. Download SHA256 `505abff8385811df1a949776fc42e9f10697989a332acc86d6e8933efcb855ed`; extracted Chart.yaml confirms version/appVersion 1.20.4. Its values pin Envoy tag v1.39.5-1792733054-8c73b2816bc8239e27f1fd53b271884688137459 with useDigest=true. Chart.yaml/values.yaml and hashes are retained; no chart signature verification is claimed. All scan inputs were exact digests resolved before scans:

- `quay.io/cilium/hubble-relay@sha256:cb23408209697ed30d2bc462e1f01eb622ea4423a891458f78bc88d7255bbfc1` (official tag `v1.20.4`)
- `quay.io/cilium/cilium@sha256:20fe92e4c86641233a450098c158d2d29085f3419931ab6bf681d2485dedf16e` (official tag `v1.20.4`)
- `quay.io/cilium/operator-generic@sha256:7a7a3489dc66ad67e420d285c8a8d2e169b0957ad15e120f593d27081bf38d82` (official tag `v1.20.4`)
- `quay.io/cilium/cilium-envoy@sha256:547ab45f6092f681d9f54f3be9fa8fb1e705c9c5dc2df388efe3a52aa6965629` (official tag `v1.39.5-1792733054-8c73b2816bc8239e27f1fd53b271884688137459`)

Each raw report confirms linux/arm64 and matching RepoDigests; manifest records image config/layer identity. `image-component-versions.json` lists parsed Go binaries and modules: observed toolchains are Go 1.26.10 on candidate Go components. No detected pebble component remains in the new Cilium report, consistent with the release note removing the utility; this is not a standalone full filesystem-absence proof.

## Remaining High floor and path assessment

| High ID | Candidate components | Installed → scanner fixed floor | Path/prerequisite evidence and uncertainty |
|---|---|---|---|
| CVE-2026-78661 / GO-2026-6860 | Relay, Cilium/CNI/helpers, operator | x/net 0.60.0 → 0.62.0 | Crafted input must reach the HTML parser's text coalescing. Hubble gRPC protobuf handling is not itself HTML parsing. Presence is established; vulnerable function linkage/input route remains unverified. [Primary Go record](https://pkg.go.dev/vuln/GO-2026-6860). |
| CVE-2026-109518 | Cilium and chart Envoy apt/libapt packages | Ubuntu 26.04: 3.2.0 → 3.2.1ubuntu0.1; Ubuntu 24.04: 2.8.3 → 2.8.4ubuntu0.1 | Requires APT package acquisition/retry and an on-path attacker. Ordinary CNI/flow traffic does not establish this route. Runtime package-maintenance behavior was not inspected; finding remains open. [Ubuntu primary notice](https://ubuntu.com/security/notices/USN-8996-1). |
| CVE-2026-116587 | Operator generic | go-jose/v4 4.1.4 → 4.1.6 | Requires parsing a crafted RSA private JWK with large parameters. Source/module presence does not demonstrate attacker-controlled JWK parser reachability in this deployment. [Primary advisory](https://github.com/go-jose/go-jose/security/advisories/GHSA-mgcc-cww5-fp2q). |

Exact component rows, installed/fixed versions and scanner severity sources are in `remaining-high-components.json` and CSV. Floors are advisory patch candidates, not a validated coherent rebuild or compatibility guarantee. The observed candidate removes previous stdlib/x509/TLS, gRPC, x/text, compress, crypto and OpenSSL High matches in this DB snapshot; absence of a match is not proof of every runtime path or future database coverage. No new High ID appeared in the candidate image set. Old fixed alternatives such as gRPC 1.82.2 are branch alternatives, not a recommendation to downgrade 1.83.1.

The previous source-level path/prerequisite assessment remains in `../provider-image-worker/REPORT.md`. Operator still has no detected OS package database, and Envoy's complete statically linked C++/BoringSSL supply chain is not established by the OS findings. A latest release label and successful mTLS status do not close those gaps or the remaining High matches.

## Existing custom CLI files: FS gap and explicit SBOM alternative

The two exact binary hashes were verified without executing either CLI. Installed help supports a single-file fs scan; each was bounded to 60 s with vuln/library only and a Go file pattern. Both returned exit 0 but **no Go analyzer results**, so their statuses are **BLOCKED_GOBINARY_COVERAGE**, not clean. Raw empty results and stderr are preserved. This does not establish that every Trivy mode lacks Mach-O support.

The authorized alternative used already preserved exact-binary buildinfo to generate small CycloneDX dependency inventories; `sbom-provenance.json` pins source and binary hashes. No main-module purl/version was fabricated, and unversioned main-module/native-library coverage remains a gap. The same DB analyzed the module inventories successfully:

| Artifact | Go dependency components including stdlib | Trivy SBOM rows | High | Assessment |
|---|---:|---:|---:|---|
| minikube.3, SHA256 0ea47b1aa27343751614b25f427771974bca6534365ab8ddee4bf7aee8ce0371 | 214 | 8 | 3 | NEW go-jose High CVE-2026-116587, v4.1.4 → v4.1.6; two additional go-jose Medium CVE-2026-116585 / CVE-2026-116586 fix v4.1.5. Other High records are already-triaged Docker daemon CVE-2026-41567 / CVE-2026-42306. |
| hubble.1, SHA256 378850e0a4d12bf6657df20e8e3edb4432f316143f391241e605951fe3fb72b2 | 104 | 0 | 0 | No go-jose component and no matches in this inventory/snapshot; not a whole-binary or main-module clearance. |

Minikube's previously recorded Engine 29.5.3 / absent daemon packages disposition remains in `../runtime-binary-worker/patched-minikube/vendor-attempt/ENVIRONMENT_TRIAGE.md`; the additional Trivy module-level Docker rows do not create proof of embedded daemon execution. The new go-jose match remains open and was not visible in the prior govulncheck result; no code/build/dependency correction is authorized or attempted here. Buildinfo-derived SBOM scanning proves component/version matching, not symbol or input reachability.

SBOM mode has no --parallel flag in installed help; it ran as one serial process with GOMAXPROCS=1. Image scans retained --parallel 1. Each static binary/SBOM attempt had 60 s, RSS 1.5 GiB and free disk 10 GiB stops, and both binary hashes remained unchanged.

## Scanner, bounds and retained evidence

Same Trivy 0.74.0 / explicit `.git/release-audit/trivy-cache` as baseline: schema 2, UpdatedAt 2026-11-10T19:01:23Z, DownloadedAt 2026-11-11T10:50:41Z, NextUpdate 2026-11-11T19:01:23Z. No DB update or credential discovery occurred; public remote pulls used empty private auth configuration and stripped credential environment. OS+library/vuln image scans, no secret scanner, no ignore-unfixed or populated ignorefile, GOMAXPROCS=1, --parallel 1, max 150 s/image, RSS 1.5 GiB and free disk 10 GiB. All four image scans completed without timeout/resource/access failure in 34.249 s active total, max sampled RSS 437,518,336 bytes. These bounds are not performance acceptance measurements. No benchmark lease-stop request arrived.

Raw JSON gzip reports, per-input manifests/timing/resource samples, CSV/JSON deltas, official chart data, supplemental SBOMs, helpers and SHA256SUMS are retained. No image/CLI execution, cluster/Secret/CNI/provider command, install, pin, source, Git/index/roadmap mutation or new agent occurred. Remaining findings and compatibility/release decisions stay open for root.

## Smallest bounded remediation candidates for coordination

- Existing minikube.3: keep proven same-tag/Go/SDK adapter constraints and move only go-jose/v4 4.1.4 to 4.1.6 to cover CVE-2026-116587 plus the two Medium 4.1.5 fixes. This is a minimum advisory floor, with graph/build/functional validation still pending root authorization. No Kubernetes/SDK major migration is implied.
- Collector patch baseline: the exact official 1.20.4 digests substantially reduce the old image findings, but all four retain at least one High match; a tag-only transition does not close the gate. Remaining floors are x/net 0.62.0 in relay/Cilium/operator, go-jose/v4 4.1.6 in operator, APT/libapt 3.2.1ubuntu0.1 in Ubuntu 26.04 Cilium and 2.8.4ubuntu0.1 in Ubuntu 24.04 Envoy. No rebuild or new patched digest was produced.
- Existing Hubble.1: its 104-component buildinfo-derived dependency inventory has zero matches in this DB and no go-jose component. Direct Mach-O coverage remains BLOCKED, and main/native-library/symbol reachability gaps remain explicit; this inventory result is not general clearance.
- Minikube module-level Docker CVE-2026-41567 / CVE-2026-42306 remain represented in the supplemental SBOM. Their old SDK 28.5.2 identity is unchanged; prior evidence separates absent daemon code from the recorded TEST Engine 29.5.3 (above 29.5.1). This environment-specific assessment is not a global risk acceptance.

No remaining High was accepted or automatically suppressed. Stop here: no further build, pin, install or lab action is running.
