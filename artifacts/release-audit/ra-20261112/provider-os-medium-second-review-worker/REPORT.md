# OS Medium image artifact second review — scoped VERIFIED

The recorded local image remediation is supported. Recomputing the full raw scans removes exactly **16 Medium component rows**: Cilium pcre2 removes8 and zlib1g1; Envoy pcre2 removes7. Added findings:0. Both CSVs match every raw tuple:16 removed rows and93 remaining rows. No material discrepancy was found.

| Image | Actual recorded version changes | Remaining raw findings |
| --- | --- | --- |
| Cilium | libpcre2-8-0 10.46-1build1→10.46-1ubuntu0.1; zlib1g1:1.3.dfsg+really1.3.1-1ubuntu3.1→…3.2 |8High/55Medium/6Low/4Unknown |
| Envoy | libpcre2-8-0 10.42-4ubuntu2.1→10.42-4ubuntu2.2 |16Medium/4Low |

SHA manifests pass **64/64 attempt02,18/18 attempt01 and107/107 parent APT entries**. Current HEAD context is b844d74e02ba4f8bdf64c087b6fda2e8d32798d9; runtime source context remains f32d6b23. Raw image IDs match the guarded parent and new candidate inspect descriptors. This review does not freshly inspect Docker state or execute images.

Every non-target finding tuple retains class/type/CVE/package/version/fixed floor/severity/status/DataSource. Only the OS target display label is normalized because the new local tag differs; Go target paths are preserved. All Go package rows compare equal as JSON (13Cilium targets/1Envoy target). Complete Config dictionaries and original layer prefixes match. Recorded selected ELF/native/CA/key/source/license SHA maps and file modes/UID/GID/sizes match parents. Dpkg inventories show precisely the allowed two/one version changes, without additions/removals; APT fixes remain present.

Source checks reconcile retained InRelease/index hashes with prior recorded successful Ubuntu-key gpgv receipts, literal signed index SHA entries, all three package versions/deb hashes/sizes and verified-download receipts. Cryptographic signature execution was not repeated. Same Trivy executable and DB byte hashes were retained; command records request Docker-only OS+library scanning offline without severity/unfixed/status suppression. OS inventory coverage remains124/95rows plus the expected Go targets. No zero-result clean claim is involved.

Attempt01 exit100 and the epoch-encoded local-deb pathname error remain preserved. Its REPORT/manifest hashes match the seal stored before retry. Comparing Dockerfiles confirms the sole retry change: remove --no-download from actual local-file installation, while simulation keeps it. Build command records retain networknone, CPU2/memory4GiB and force-rm; exact package/no-removal guards remain. No newly downloaded metadata or unsafe authentication fallback is shown.

Cleanup evidence records6v2 container references and7executor/client PIDs absent, active temporary deb/list/cache cleanup, unchanged parent/operator identities and preserved namespace/lab scope. Wall time recomputes to524.168929s, agreeing with524.169s summary and below600s. These are historical receipt checks, not fresh live cleanup assertions.

**Evidence limits:** attempt02/result.json field ownedIntermediateContainers.865ccf09d284.alreadyAbsentBeforeInspect is true. The short Envoy RUN completed before live inspection; final-owned-and-protected-resource-state.json reports completeCIDKnown=false. Configured build flags/printed reference/absence exist, but a fullCID or live limit/command observation must not be invented. This disclosed limitation does not contradict raw image content/tuple verification. Old libraries and copied deb payloads remain in lower layers; full merged-image scans do not clear historical layer bytes. Engine size and uncompressed history size are distinct measures.

Scope is solely recorded **local, uninstalled candidates**, with no registry immutable-identity claim. No new build, scan, Docker/lab/K8s action, product/Git/index/roadmap write or agent was used. No real CNI/native-library compatibility/TLS/runtime/release PASS, risk waiver, broad security-clean claim or Go-finding suppression follows. Detailed checks and concrete evidence fields are retained in result.json.
