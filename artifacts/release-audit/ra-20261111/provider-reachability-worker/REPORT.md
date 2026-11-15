# Candidate provider binary/source reachability

**Bounded static evidence, no risk acceptance or release decision.** Only the four authorized exact digests were pulled/inspected. Ten named Go binaries and the chart-selected Envoy starter were copied from four uniquely owned, read-only, network-none containers. Each stayed created/Running=false, was never started/run/exec'd, and was removed in finally with exact ID/owner checks. No existing container or image was deleted. No cluster/source/pin/build/install/Git/roadmap change occurred. Images remain as authorized cache objects; no rootfs archive was accumulated.

## x/net/html GO-2026-6860

All 10 exact affected Go binaries have a successfully parsed complete .gopclntab function-entry table and full function-name table, including names for inlined functions. **No golang.org/x/net/html function name is present**, including Parse, ParseFragment, ParseWithOptions, ParseFragmentWithOptions and underlying parser methods. The filter matches the substring anywhere in the full name, covering vendored prefixes. Three main files additionally have no raw bytes for the HTML package path or WithOptions names. This is scoped technical linkage-absence evidence for these exact files, not a general waiver for x/net or unknown dynamically loaded/native code.

| Exact component | Function entries parsed | ELF .symtab present | HTML name entries | Selected jose parser names |
|---|---:|---|---:|---:|
| hubble-relay:/usr/bin/hubble-relay | 102118 | False | 0 | 0 |
| cilium:/opt/cni/bin/cilium-cni | 17426 | False | 0 | 0 |
| cilium:/usr/bin/cilium-agent | 187842 | False | 0 | 0 |
| cilium:/usr/bin/cilium-bugtool | 11928 | False | 0 | 0 |
| cilium:/usr/bin/cilium-dbg | 138077 | False | 0 | 0 |
| cilium:/usr/bin/cilium-envoy-bootstrap-locality | 25100 | False | 0 | 0 |
| cilium:/usr/bin/cilium-health | 13100 | False | 0 | 0 |
| cilium:/usr/bin/cilium-mount | 7700 | False | 0 | 0 |
| cilium:/usr/bin/hubble | 106524 | False | 0 | 0 |
| operator-generic:/usr/bin/cilium-operator-generic | 172256 | True | 0 | 4 |

Independent GoDB binary scans completed on relay, agent and operator. Relay/agent emitted HTML function-looking findings; **these are not observed symbol proof for stripped ELF**. Installed govulncheck 1.9.0 source explicitly returns no symbols when ELF symbol info is missing, then uses allKnownVulnerableSymbols as a conservative fallback (binary.go:107–111). The source excerpt/hash is retained. Operator's HTML result is module-only. Full raw GoDB reports remain unchanged; counts/fields were not suppressed. The other seven binaries have pclntab coverage only, not an additional GoDB invocation within this finite job.

An initial startswith-only analysis was preserved as SUPERSEDED and its negative claim retracted when GoDB appeared to conflict. The later vendored-prefix explanation was premature: corrected substring matching and whole-binary byte checks still show no HTML names. Scanner-source inspection resolved the contradiction as stripped fallback. `analysis-correction.json` preserves both corrections. Do not use the first files or the interim messages as independent evidence.

## Operator go-jose CVE-2026-116587

The exact operator ELF genuinely links JSONWebKey.UnmarshalJSON and rawJSONWebKey.rsaPrivateKey; selected names include `github.com/go-jose/go-jose/v4.rawJSONWebKey.rsaPrivateKey`. SPIFFE JWT bundle Parse/Read/Load-related functions are also present. This is not an unlinked package finding. The [primary advisory](https://github.com/go-jose/go-jose/security/advisories/GHSA-mgcc-cww5-fp2q) requires parsing attacker-controlled private RSA JWK parameters; v4.1.6 remains its fixed floor.

Official v1.20.4 annotated tag peels to commit `beb276d2f38d4aadfda14710acf8d14a0f1ba723`, matching the operator's actual vcs.revision (modified=false). [Same-commit SPIRE client](https://github.com/cilium/cilium/blob/beb276d2f38d4aadfda14710acf8d14a0f1ba723/operator/auth/spire/client.go) defaults mutual auth false and returns a noop client unless mutual auth or ztunnel-with-SPIRE is enabled (lines169–175). Its inspected connection path constructs workloadapi.NewX509Source over the configured SPIRE agent Unix socket (lines249–255). [Vendored JWT bundle source](https://github.com/cilium/cilium/blob/beb276d2f38d4aadfda14710acf8d14a0f1ba723/vendor/github.com/spiffe/go-spiffe/v2/bundle/jwtbundle/bundle.go) parses a JWKS document using json.Unmarshal into jose.JSONWebKeySet (lines56–69), providing a real library parser chain.

An attacker-controlled request-to-JWT-bundle/private-JWK ingress from the operator's exposed RPC/HTTP entrypoints was **not established**. The inspected SPIRE entry uses X509Source; linked generic workload/JWT support does not itself prove that path is invoked. Existing owned lab values have no mutual-auth, SPIRE or ztunnel override and no command override, but are the current lab's **1.20.2** values, not proof of a running candidate1.20.4 deployment. No Secret or live process/API enumeration was performed. Keep the linked-parser finding and ingress/configuration uncertainty open for root.

## APT CVE-2026-109518

Exact image metadata, official chart daemonset/operator deployment templates and existing owned-lab configuration were inspected. Relay defaults to hubble-relay serve; Cilium image defaults to cilium-dbg while the chart selects agent/init commands; operator deployment selects its operator program; Envoy chart selects cilium-envoy-starter. No APT acquisition command occurs in the inspected chart entrypoint templates or safe current-lab command overrides. Default startup commands are distinct from the APT/libapt package presence. The Envoy starter was copied as data and never executed.

The [Ubuntu primary notice](https://ubuntu.com/security/notices/USN-8996-1) requires APT package download/retry plus an on-path attacker. No reachable Cilium/Hubble RPC that invokes APT acquisition was demonstrated. This does not prove APT maintenance is impossible: runtime maintenance/process activity was not inspected or executed, and arbitrary operator-driven changes are outside the evidence. APT remains installed at the previously scanned vulnerable versions; no patch or exception was applied.

## Bounds and handoff

Extraction commands and IDs/ownership/state/removal are in per-image receipts. All inputs match the authorized candidate RepoDigests/platform. Private extracted content totals 596,663,598 bytes, with per-file hashes retained outside repository artifacts. Conservative image-cache plus extraction allowance is 3,584,967,168 bytes (<4 GiB); no full rootfs archive was kept. Pclntab parser mmap/selected-data processing peaks are recorded (well below1.5 GiB); Docker CLI pull/extract commands were bounded to150 s and monitored. No image code executed.

Exact ELF data remains under `.git/release-audit/provider-reachability-worker/`; artifacts contain manifests, selected function evidence, GoDB gzip, chart source, tool-source excerpts, correction record and checksums. Primary source pages were read; no new Go/dependency build or extended test phase was started. Findings remain for root's final decision.
