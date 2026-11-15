# Exact provider-image SCA

Reviewed 2026-11-11T13:02:30.007620+00:00. **Four scans completed with High findings open: 524 package/advisory rows, 105 distinct IDs across images, 131 High rows representing 20 distinct High IDs; 0 Critical rows.** Rows in different packages, binaries or images are preserved separately and are not counted as separate exploits. No release or waiver decision is made.

| Image | Rows | Unique IDs | High / Critical rows | Unique High IDs | Duration |
|---|---:|---:|---:|---:|---:|
| hubble-relay | 40 | 21 | 12 / 0 | 7 | 8.474 s |
| cilium | 391 | 93 | 100 / 0 | 19 | 21.777 s |
| operator-generic | 49 | 30 | 15 / 0 | 10 | 8.246 s |
| cilium-envoy | 44 | 29 | 4 / 0 | 2 | 7.231 s |

Exact inventory digests, in scan order (all observed linux/arm64 and matching RepoDigests):

- `quay.io/cilium/hubble-relay@sha256:d309c977870e9dbede7122a10eee09a4c9d66685e8d52af62d9c3c113f815b0f`
- `quay.io/cilium/cilium@sha256:2939231d0d3e3ebddcd80fffa168b7ddcc78fdf0dc864d1c8c126ff523c54f01`
- `quay.io/cilium/operator-generic@sha256:64d8798350e8569b8e7622563fed6e44dce2625f311e4651b774816516c744fc`
- `quay.io/cilium/cilium-envoy@sha256:af7382699576b9e65e9184efa52eeca0b58aea70ad6e511bf260c91d9f740463`

Input inventory: `../hubble-cold01/collector-image-inventory.json`, lab kvml-d32afbf634e8 / cluster UID e84bb50e-8d64-4bc2-905c-9b5ba193e53a, SHA256 d46af9ed8c432f994360e0226940ff96f26ca49b810e431ffb7bcee5e89d8706. Per-image manifests include image config ID, layer diff IDs, platform, OS, timing, raw JSON hash and exact command. No mutable tag target was used.

Trivy 0.74.0 SHA256 5fd45afccbd5efd7a88e6da92a7b3a52c2e3ffd30d5b954f324123d6d1d24469 used explicit `.git/release-audit/trivy-cache`: DB schema 2, UpdatedAt 2026-11-10T19:01:23Z, DownloadedAt 2026-11-11T10:50:41Z, NextUpdate 2026-11-11T19:01:23Z. Initial plain --version showed the stale default October cache; that cache was not used for scans. The exact cache version and installed help are retained. This database snapshot may lag newly published advisories; no comprehensive-current or zero-vulnerability claim is made.

Only vuln / os+library scanners, remote digest pulls, linux/arm64, --parallel 1 and GOMAXPROCS=1 were used. Dependency identification was offline; DB/Java/check/version/VEX updates were disabled. Empty private auth/Docker config and removed registry/cloud credential environment prevented loading existing registry credentials. Empty ignorefile was explicit, and unfixed findings were included. No image, provider, cluster, Secret, CNI or host-runtime command ran; no image/version/pin/source/build/Git/roadmap changed.

Each scan was capped at 150 s, owned RSS 1.5 GiB and minimum free disk 10 GiB. GOMEMLIMIT=1024MiB was a scanner-only soft limit. All completed without error/resource stop: 45.728 s active scan total; maximum sampled owned RSS 447,381,504 bytes. These are bounded-job observations, not performance acceptance. No benchmark lease-stop request arrived.

## Versions and components

`all-findings.csv` has all 524 rows; `high-critical-findings.csv` has 131 High rows with exact target binary, package, installed/fixed versions and severity source. Each `*-raw.json.gz` is the raw scanner JSON, verified against its manifest SHA256. `high-critical-triage.json` maps all 20 High IDs to component matches and prerequisite limits. Alternatives in fixed-version fields are scanner metadata: for an installed gRPC 1.83.1 branch, compatible fix is 1.83.2, not a downgrade to 1.82.2. No patched digest or image upgrade was evaluated.

| Image | Package | Installed | Scanner fixed alternatives | Unique High IDs in group |
|---|---|---|---|---:|
| cilium | apt | `3.2.0` | `3.2.1ubuntu0.1` | 1 |
| cilium | github.com/klauspost/compress | `v1.18.6` | `1.18.7` | 1 |
| cilium | golang.org/x/crypto | `v0.53.0` | `0.55.0` | 1 |
| cilium | golang.org/x/net | `v0.56.0` | `0.60.0` | 1 |
| cilium | golang.org/x/net | `v0.56.0` | `0.62.0` | 1 |
| cilium | golang.org/x/text | `v0.39.0` | `0.41.0` | 1 |
| cilium | google.golang.org/grpc | `v1.83.1` | `1.82.2, 1.83.2, 1.84.0-dev.0.20260825144003-d5a41119e0e3, 1.85.0-dev.0.20260825072537-93e31b48545e` | 1 |
| cilium | libapt-pkg7.0 | `3.2.0` | `3.2.1ubuntu0.1` | 1 |
| cilium | libssl3t64 | `3.5.5-1ubuntu3.5` | `3.5.5-1ubuntu3.6` | 1 |
| cilium | openssl | `3.5.5-1ubuntu3.5` | `3.5.5-1ubuntu3.6` | 1 |
| cilium | openssl-provider-legacy | `3.5.5-1ubuntu3.5` | `3.5.5-1ubuntu3.6` | 1 |
| cilium | stdlib | `v1.26.5` | `1.25.13, 1.26.6, 1.27.0-rc.3` | 7 |
| cilium | stdlib | `v1.26.5` | `1.26.10, 1.27.3` | 1 |
| cilium | stdlib | `v1.26.5` | `1.26.6, 1.27.0-rc.3` | 1 |
| cilium | stdlib | `v1.26.5` | `1.26.9, 1.27.2` | 3 |
| cilium | stdlib | `v1.26.8` | `1.26.10, 1.27.3` | 1 |
| cilium | stdlib | `v1.26.8` | `1.26.9, 1.27.2` | 3 |
| cilium-envoy | apt | `2.8.3` | `2.8.4ubuntu0.1` | 1 |
| cilium-envoy | libapt-pkg6.0t64 | `2.8.3` | `2.8.4ubuntu0.1` | 1 |
| cilium-envoy | libssl3t64 | `3.0.13-0ubuntu3.15` | `3.0.13-0ubuntu3.16` | 1 |
| cilium-envoy | openssl | `3.0.13-0ubuntu3.15` | `3.0.13-0ubuntu3.16` | 1 |
| hubble-relay | golang.org/x/net | `v0.56.0` | `0.60.0` | 1 |
| hubble-relay | golang.org/x/net | `v0.56.0` | `0.62.0` | 1 |
| hubble-relay | golang.org/x/text | `v0.39.0` | `0.41.0` | 1 |
| hubble-relay | google.golang.org/grpc | `v1.83.1` | `1.82.2, 1.83.2, 1.84.0-dev.0.20260825144003-d5a41119e0e3, 1.85.0-dev.0.20260825072537-93e31b48545e` | 1 |
| hubble-relay | stdlib | `v1.26.8` | `1.26.10, 1.27.3` | 1 |
| hubble-relay | stdlib | `v1.26.8` | `1.26.9, 1.27.2` | 3 |
| operator-generic | github.com/go-jose/go-jose/v4 | `v4.1.4` | `4.1.6` | 1 |
| operator-generic | github.com/klauspost/compress | `v1.18.6` | `1.18.7` | 1 |
| operator-generic | golang.org/x/crypto | `v0.53.0` | `0.55.0` | 1 |
| operator-generic | golang.org/x/net | `v0.56.0` | `0.60.0` | 1 |
| operator-generic | golang.org/x/net | `v0.56.0` | `0.62.0` | 1 |
| operator-generic | golang.org/x/text | `v0.39.0` | `0.41.0` | 1 |
| operator-generic | google.golang.org/grpc | `v1.83.1` | `1.82.2, 1.83.2, 1.84.0-dev.0.20260825144003-d5a41119e0e3, 1.85.0-dev.0.20260825072537-93e31b48545e` | 1 |
| operator-generic | stdlib | `v1.26.8` | `1.26.10, 1.27.3` | 1 |
| operator-generic | stdlib | `v1.26.8` | `1.26.9, 1.27.2` | 3 |

Hubble relay has Debian 13.7 (six detected OS packages, two Go binaries); Cilium has Ubuntu 26.04 and many Go agent/CNI/helper binaries; Envoy has Ubuntu 24.04 OS findings. Operator has no detected OS package database (`OS: null`), so absence of OS findings is a coverage limitation. The Envoy C++/BoringSSL/static library supply chain was not established by these detections; OS results do not constitute a full Envoy-code audit. Bundled gops, pebble and diagnostic binaries remain inventory findings; their actual execution and reachable inputs were not inspected.

## Source paths and prerequisites

The [v1.20.2 relay source](https://github.com/cilium/cilium/blob/v1.20.2/pkg/hubble/relay/server/server.go) around lines 98–105 constructs TLS grpc.NewServer plus a separate gRPC health server. It connects to peer clients and can expose Prometheus metrics via promhttp. It does not select grpc xds.NewGRPCServer in that constructor. The [operator reference source](https://github.com/cilium/cilium/blob/v1.20.2/operator/cmd/root.go) wires Kubernetes clients, health/metrics, auth and optional subsystems; this does not itself prove attacker-controlled private-JWK parsing. Exact image-to-source build attestation was not independently verified. Primary source pages were viewed; direct urllib copies failed and remain BLOCKED_FETCH in the manifest rather than fabricated local evidence.

| High ID | Scanner issue | Required path/input and evidence limit |
|---|---|---|
| CVE-2026-109518 | apt: apt: Remote code execution via hard link reuse during package download retries | APT package-download retry and an on-path attacker, not ordinary Cilium network traffic. [Primary](https://ubuntu.com/security/notices/USN-8996-1) |
| CVE-2026-111943 | crypto/x509: golang: crypto/x509: Man-in-the-middle attacks via untrusted intermediate certificates | Go x509.Verify with compromised intermediates in affected trust-store circumstances; no malicious-chain acceptance was tested. [Primary](https://pkg.go.dev/vuln/GO-2026-6809) |
| CVE-2026-116587 | github.com/go-jose/go-jose: go-jose: Denial of Service via crafted RSA parameters in JWKs | Attacker-controlled large RSA private JWK parsing; operator parser reachability is unverified. [Primary](https://github.com/go-jose/go-jose/security/advisories/GHSA-mgcc-cww5-fp2q) |
| CVE-2026-33818 | encoding/asn1: golang: Go encoding/asn1: Denial of Service via excessive recursion in Unmarshal | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-5972) |
| CVE-2026-39821 | golang.org/x/net/idna: golang: net/http: golang.org/x/net/idna: Privilege escalation via incorrect Punycode label processing | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-5026) |
| CVE-2026-46600 | golang.org/x/net/dns/dnsmessage: golang.org/x/net/dns/dnsmessage: Denial of Service via invalid DNS record parsing | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-5942) |
| CVE-2026-56851 | golang.org/x/text: golang.org/x/text: Denial of Service via out-of-bounds slice error in Nickname profile | PRECIS Nickname transformation of crafted input with a short destination buffer; profile reachability is unverified. [Primary](https://pkg.go.dev/vuln/GO-2026-6629) |
| CVE-2026-56853 | net/http: golang: Go net/http: Unencrypted HTTP/2 connections vulnerable to Denial of Service | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-6089) |
| CVE-2026-56854 | golang.org/x/crypto/ssh: golang.org/x/crypto/ssh: Authentication bypass due to unenforced source-address restrictions | SSH server certificate authentication relies on source-address restrictions; no Cilium SSH-server entrypoint was demonstrated. [Primary](https://pkg.go.dev/vuln/GO-2026-6303) |
| CVE-2026-56858 | html/template: golang: Go html/template: Cross-Site Scripting via pathological input | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-6091) |
| CVE-2026-56859 | encoding/xml: golang: Go: Denial of Service via XML decoding recursion depth issue | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-6088) |
| CVE-2026-56860 | net/url: golang: golang net/url: Denial of Service from quadratic complexity in path resolution | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-6218) |
| CVE-2026-56862 | crypto/tls: golang: Golang crypto/tls: Denial of Service via indefinite KeyUpdate messages | Older stdlib finding in bundled pebble; vulnerable function/input and actual helper execution remain unverified. See exact advisory imports and component row. [Primary](https://pkg.go.dev/vuln/GO-2026-6090) |
| CVE-2026-63209 | github.com/klauspost/compress: klauspost/compress: Denial of Service via integer overflow in dictionary processing | Untrusted S2 dictionary through NewDict followed by Dict.Encode; generic compression is insufficient evidence. [Primary](https://github.com/klauspost/compress/security/advisories/GHSA-259r-337f-4rfw) |
| CVE-2026-78661 | golang.org/x/net/html: golang.org/x/net/html: Denial of Service via crafted HTML input | Crafted input reaches x/net/html text coalescing; protobuf flow handling is not itself HTML parsing. [Primary](https://pkg.go.dev/vuln/GO-2026-6860) |
| CVE-2026-78667 | net/http: golang: golang: Denial of Service via crafted HTTP Range headers | net/http FileServer/ServeContent/ServeFile with many Range values; reference relay metrics uses promhttp rather than an identified file-serving route. [Primary](https://pkg.go.dev/vuln/GO-2026-6609) |
| CVE-2026-78669 | net/http: net/http/internal/http2: golang.org/x/net/http2: net/http: Denial of Service via excessive HTTP/2 SETTINGS frames | HTTP/2 peer sends many small SETTINGS window updates across many streams; relay gRPC is a relevant transport, but exact vulnerable calls are unverified. [Primary](https://pkg.go.dev/vuln/GO-2026-6611) |
| CVE-2026-84445 | google.golang.org/grpc: gRPC-Go: Denial of Service via malformed RPC requests | gRPC xds.NewGRPCServer routing after a transport connection, with missing authority/Host. Reference relay constructor uses plain grpc.NewServer. [Primary](https://github.com/grpc/grpc-go/security/advisories/GHSA-2v4p-qf9q-27wj) |
| CVE-2026-84782 | openssl: compat-openssl: openssl: Information disclosure via DTLS handshake retransmission | OpenSSL DTLS handshake retransmission while a write is suspended; TCP Go TLS does not itself establish that path. [Primary](https://openssl-library.org/news/secadv/20260929.txt) |
| CVE-2026-97031 | crypto/tls: golang: crypto/tls: Denial of Service via multiple ECH outer extension references | Go TLS server processes malformed ECH extension references; ECH configuration was not established. [Primary](https://pkg.go.dev/vuln/GO-2026-6607) |

The primary APT notice requires package-download retries plus an on-path attacker, and the OpenSSL advisory requires DTLS retransmission. A Go gRPC/TCP listener alone does not establish either path. The gRPC issue requires the library's xDS routing constructor; use of Envoy's similarly named xDS protocol is not equivalent evidence. HTTP/2 is materially relevant to relay transport, so its findings remain open pending exact symbol/configuration analysis. No CVE was actively tested or exploited.

Primary Go OSV records already captured by this release audit are retained, with unmatched High IDs explicit. Current web access to several Go JSON endpoints failed; existing official records were used transparently. Successful lab mTLS checks do not patch the collector or prove resistance to these CVEs. The locally patched Hubble CLI is a separate artifact and changes none of these images. Findings and unresolved paths remain open for root's remediation/release decision.
