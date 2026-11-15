# OS Medium local candidates — corrected retry scoped PASS

Three actual package upgrades remove **16 Medium component rows**: Cilium libpcre2-8-0 removes8 and zlib1g removes1; Envoy libpcre2-8-0 removes7. No extra package/version changes, additions or removals occurred. All non-target finding tuples, Go inventories and provider/native asset hashes remain unchanged. The raw Cilium High rows and all remaining Medium/Low/Unknown results are retained, without suppression or risk waiver.

| Image | Actual package changes | Medium rows removed | Current raw findings |
| --- | --- | --- | --- |
| cilium | libpcre2-8-0 10.46-1build1→10.46-1ubuntu0.1, zlib1g 1:1.3.dfsg+really1.3.1-1ubuntu3.1→1:1.3.dfsg+really1.3.1-1ubuntu3.2 | 9 | {'MEDIUM': 55, 'LOW': 6, 'UNKNOWN': 4, 'HIGH': 8} |
| envoy | libpcre2-8-0 10.42-4ubuntu2.1→10.42-4ubuntu2.2 | 7 | {'MEDIUM': 16, 'LOW': 4} |

New local tags are `kubeview-private/cilium:1.20.4-os-security.2` and `kubeview-private/cilium-envoy:1.20.4-os-security.2`. Engine descriptor/image IDs are Cilium `sha256:10169bb90a60036756c6e5764fe5154bc15987fb6a700d11bc551d7d2730b9d9` and Envoy `sha256:4e6caf599bb5162a1d0a60feaf0e3b5d196a6f8815a4581f9c251aec87e22bbc`. These are observed local identities, not published registry identities; mutable tags are not immutable release pins. Images remain stopped, local and uninstalled.

## Source chain and bounded installer

The parent APT candidates were guarded by exact local descriptor107f5725…/5872d9d1… plus complete Config and RootFS layer identities before building. FROM references those existing local descriptor references; no pull or tag fallback occurred. Prior full-image raw scans were reused as baselines because the exact guarded input images and preserved raw bytes match, avoiding an unnecessary baseline rerun. Previous full CSV, current baseline summaries and raw target tuples agree on all16 rows.

Previously signature-verified resolute-security/noble-security InRelease and arm64 main Packages.xz snapshots were reused and their preserved SHA chain rechecked. **No signed metadata was downloaded again.** Preparation downloaded only three small Ubuntu HTTPS package payloads, all matching the signed snapshot SHA256/size entries: Cilium237,450B pcre2 and61,624B zlib; Envoy213,218B pcre2. Dependencies require only already-installed libc6, with its existing2.43/2.39 versions satisfying the package floors. Exact source entries and hashes are in the parent preparation records.

Each exact approved Dockerfile adds COPY of those verified payloads and one RUN. The RUN has networknone, verifies literal package hashes, simulates with --no-download, rejects every unexpected Inst and every Remv, then installs only those local debs with --only-upgrade/--no-install-recommends/--no-remove and checks exact versions. Active temporary payloads, lists and archive debs are removed in the same RUN and their absence was verified. Downloaded debs persist in the earlier COPY layer (299,074B Cilium /213,218B Envoy payload cost), as disclosed; there is no flatten/import/export.

Attempt01 failed before producing an image: actual `apt-get --no-download install /absolute/local.deb` reported an internal non-absolute, epoch-encoded zlib install pathname. Root reviewed and authorized **one corrected retry**, removing --no-download only from actual installation so APT can acquire local files. Simulation still uses it; networknone and all package/authentication constraints remain. No TLS/auth bypass or new network download was introduced. Sealed attempt01 REPORT/SHA256SUMS remain unchanged in the sibling directory, with all failure/source/resource evidence. V2 is the only retry.

## Full retest and preservation

The two new images were fully scanned with the same existing Trivy0.74.0 executable and unchanged cached DB (UpdatedAt2026-11-10T19:01:23Z; DB SHA256 `cf7fa3086682e8f77298ca8178419a530f97d7c4bd3ac203a64f2977f82e94a6`, metadata SHA256 `62046a71bc29e0ded194e98fe3cde2f51f7179f5ed9d150b7853a33cbe307477`). Scanner executable SHA256 is `5fd45afccbd5efd7a88e6da92a7b3a52c2e3ffd30d5b954f324123d6d1d24469`. Docker-only image analysis requested OS+library vulnerability coverage, offline scan, parallel1, no updates/telemetry, empty private auth/config/ignore inputs and no finding filters. No current-DB freshness claim is made.

Actual coverage remains Ubuntu26.04/124 OS package rows plus13 nonempty Go targets for Cilium, and Ubuntu24.04/95 OS rows plus1 Go target for Envoy. Full package inventories and finding comparisons verify that only the three package versions changed and only the16 target Medium rows disappeared. `candidate-all-findings.csv` contains all93 remaining rows; `removed-medium-rows.csv` preserves all16 eliminated baseline tuples. Compressed raw JSON and exact scanner commands/stderr are retained. This is not a zero-result scan being called clean.

Complete Docker Config dictionaries and original layer prefixes remain equal. Thirteen Cilium Go binaries, one Envoy Go binary, both native Envoy assets, CA bundles, source/keyring and Cilium LICENSE.all retain their hashes, modes, owners and sizes. APT/libapt versions remain at the previous fixed values. Native CLI/controller binaries were not invoked. The earlier x/net linkage adjudication is separate evidence for unchanged ELF hashes; raw scanner High rows were not removed here. Unversioned Cilium source CVEs and complete native/source/license coverage remain outside this job.

Cilium uncompressed history-layer bytes739,569,664→741,298,176 (delta1,728,512); engine Size242,813,795→243,535,568 (delta721,773). Envoy history236,089,344→237,469,696 (delta1,380,352); engine76,788,578→77,322,037 (delta533,459). History sums, engine storage and merged filesystem usage are distinct measures. Historical parent libraries and copied deb bytes remain recoverable from lower layers; the active filesystem uses the fixed packages. Timestamp/log differences prevent a bit-for-bit reproducibility claim.

## Resources, cleanup and limits

V2 build/scan execution took8.059s. Streaming DB hashing avoids loading the full DB into the Python heap; supervisor-inclusive sampled process RSS peaked132,120,576B. CPU2/memory+swap4GiB/networknone builder flags are recorded. Cilium RUN was inspected live and its command/COPY-parent ancestry plus actual limits verified. Envoy RUN completed and force-rm removed it before live inspection; its printed reference865ccf09d284, configured flags and observed absence are retained, without claiming a missing live limit/ownership inspection. Six v2 RUN/inspection references were checked absent. Owned inspection containers used networknone/readonly/capdropALL/no-new-privileges/uid65532 and bounded resources. No global prune occurred.

The original600s wall budget includes the failed attempt and approval/repair interval, with60s reserved for reporting; final elapsed is recorded in summary.json. Both parent APT images and the previous operator ELF/image were rechecked unchanged. Candidate images/private repeatable contexts intentionally remain local. No registry publication, CNI/current-lab/context/pin/product/Git/index/roadmap mutation occurred. Native shared-library compatibility, version/TLS/CNI runtime acceptance, other unpatched severities and complete release/security gates remain open. No unsupported distro fix or risk exception was invented.

Preflight battery46%, free disk454355238912bytes; final battery45%, free disk454347460608bytes exceeded30%/10GiB floors. All7 recorded v2 executor/client process IDs were checked absent after completion.
