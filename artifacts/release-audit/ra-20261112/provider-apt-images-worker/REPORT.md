# Cilium / Envoy APT-only local images — scoped PASS

Two local Linux ARM64 images now contain the signed Ubuntu fixed APT packages. Actual full-image retests remove **four component rows for one CVE, CVE-2026-109518**, across the two images. Only the two requested packages changed in each image; no extra dependency was required or package removed. **Cilium still has eight High Go module findings.** This is APT remediation evidence for these local candidates, not complete provider or release acceptance.

| Local candidate tag | Packages before → after | Current full-image findings |
| --- | --- | --- |
| `kubeview-private/cilium:1.20.4-apt-security.1` | `apt`, `libapt-pkg7.0`:3.2.0→3.2.1ubuntu0.1 | 0 Critical,8 High,64 Medium,6 Low,4 Unknown |
| `kubeview-private/cilium-envoy:1.20.4-apt-security.1` | `apt`, `libapt-pkg6.0t64`:2.8.3→2.8.4ubuntu0.1 | 0 Critical,0 High,23 Medium,4 Low,0 Unknown |

The local engine reports Cilium descriptor/image ID `sha256:107f572571a14f7c7cb37b44dc9887b79b11925f1102f0d48db7d7f39335587a` and Envoy `sha256:5872d9d1c44f90bbed712e6a0f07c1c876788aca67ceabeb782e97b9a6c75740`. Inspect also populates local RepoDigests. **No registry publication or remote immutable identity verification occurred**; the mutable local tags are not digests or release pins. The stopped, uninstalled images and private contexts remain for review/repetition.

## Actual bases and signed package chain

The reused official chart-selected Cilium reference is `quay.io/cilium/cilium@sha256:20fe92e4c86641233a450098c158d2d29085f3419931ab6bf681d2485dedf16e`, resolving locally to ARM64 manifest `sha256:1615b8097f64e1461cd55bd2037b817484d3586d1e065b88014463c797d0832a`, Ubuntu26.04/resolute. Envoy reference `quay.io/cilium/cilium-envoy@sha256:547ab45f6092f681d9f54f3be9fa8fb1e705c9c5dc2df388efe3a52aa6965629` resolves to ARM64 manifest `sha256:5a17281b6262e00a8bfe6efa0463f4cbc19aa3d6e0116bc9407ce3c71c629dae`, Ubuntu24.04/noble. These official index references, per-platform manifests, installed dpkg inventories and actual apt/apt-get/libapt binary hashes were inspected before building. No image pull occurred.

Both images actually contain APT, official `ports.ubuntu.com/ubuntu-ports` deb822 sources, gpgv and the existing Ubuntu archive keyring SHA256 `80a36b0a6de2f69f49d2df75ef473ccde121e9e190b9ea01d20a4f63778d5c31`. Original source URIs are HTTP; the build uses a temporary **HTTPS** source restricted to the relevant security suite, main component and arm64 architecture. Original source files and keyring remain byte-identical. No PPA, new key, TLS bypass, insecure repository flag or unauthenticated package allowance was used.

Verified-TLS public GETs fetched `resolute-security/InRelease` and `noble-security/InRelease` from the official Ubuntu ports repository. Gpgv in the exact existing Cilium image verified both against its existing keyring, yielding Ubuntu Archive Automatic Signing Key(2018) fingerprint **F6ECB3762474EDA9D21B7022871920D1991BC93C**. Signature logs, complete signed InRelease files and index snapshots are attached. This reuses the trust of the pinned official image/keyring; it is not a fresh independent publisher-signature verification of the OCI bases.

The signed InRelease SHA256 records validated the main arm64 Packages.xz contents. Those package entries publish exactly the fixed floors3.2.1ubuntu0.1 for resolute and2.8.4ubuntu0.1 for noble. `signed-fixed-packages.json` preserves complete entries, dependencies, filenames, sizes and SHA256 hashes:

| Signed package artifact | SHA256 |
| --- | --- |
| `apt_3.2.1ubuntu0.1_arm64.deb` | `195d94000a23c71f6661b4315d656650181d4ffedf3d3a36c6d158c3628d528a` |
| `libapt-pkg7.0_3.2.1ubuntu0.1_arm64.deb` | `a77e4bd3b761711d9d12ac4d17d9e05aaf7b6b754270831793943c6caa25e41f` |
| `apt_2.8.4ubuntu0.1_arm64.deb` | `11154a96dacbcab4f2695165e3ff45773df3c93fd3944ad2e1ac3b554fddc867` |
| `libapt-pkg6.0t64_2.8.4ubuntu0.1_arm64.deb` | `e71cd5b4bc481de6ce177c29c1031f52cedf11d491dc0fb9b0ccb1a1467afbc8` |

Preparation failures were retained. The first `/etc/os-release` copy encountered Docker's symlink handling; `/usr/lib/os-release` supplied the actual file in a fresh preparation directory. The first mutable noble Packages.xz did **not** match its signed InRelease hash and was rejected. The signed index's immutable `by-hash/SHA256/c276e50af30ba09423e6d10dab1bb67488afc3aa1198028ca3142f4052aa0970` URL supplied the matching index. The mismatching download, expected/actual hashes and sizes remain explicitly named in evidence. No unverified metadata from that download informed acceptance.

## Exact upgrade, configuration and assets

Root reviewed and explicitly cleared the attached `cilium.Dockerfile`, `envoy.Dockerfile` and plan before building. Each recipe is exact official FROM plus one RUN. It creates a temporary HTTPS Signed-By source, updates authenticated metadata, simulates the pinned install, rejects every Inst outside the two allowed packages and every Remv, then uses `--only-upgrade --no-install-recommends --no-remove` for the exact two versions. It checks dpkg versions and removes apt lists, cached debs and the temporary source in the same layer. Final read-only checks confirmed all three temporary/cache conditions. There was no full distribution upgrade, dependency expansion or build retry.

Complete before/after dpkg inventories show precisely two version changes per image, with package names/counts/architectures otherwise unchanged. Signed deb hashes are source metadata; installed apt, apt-get and libapt content hashes are separately recorded in `final-runtime-metadata-and-apt-file-hashes.json`. They are distinct identity measures. Standard APT/dpkg configuration, package documentation/licensing metadata, logs and libc-bin's normal trigger effects accompany the two package upgrades; this is not a claim that only two filesystem files changed.

The entire Docker image Config dictionaries compare equal, including Entrypoint, Cmd, User, Env, working directory, labels and ArgsEscaped where present. Both official User and Entrypoint are unset; no USER/ENV instructions were introduced. Cilium retains Cmd`/usr/bin/cilium-dbg`, working directory`/home/cilium`, HUBBLE_SERVER and INITSYSTEM. Envoy retains Cmd`/bin/bash` and its original working directory. Read-only inspection containers' uid65532/security controls are test overrides, not a changed default product User.

Every original filesystem layer remains the exact prefix of its candidate layer list. Across the two bases/candidates, all thirteen Cilium Go binaries, the one Envoy Go binary, native `cilium-envoy`/`cilium-envoy-starter`, CA bundles, original apt source/keyring and Cilium LICENSE.all retain their measured hashes, permissions, owners and sizes (19 selected Cilium assets and6 Envoy assets). No provider/CNI/controller binary was rebuilt, replaced or invoked. Existing license files are retained; this is not a new complete license or source-CVE audit.

| Image | Uncompressed history-layer bytes, official → candidate | Engine Size bytes, official → candidate |
| --- | --- | --- |
| Cilium | 734,121,984→739,569,664 (new layer5,447,680) | 240,966,361→242,813,795 (delta1,847,434) |
| Envoy | 230,989,824→236,089,344 (new layer5,099,520) | 75,160,521→76,788,578 (delta1,628,057) |

Uncompressed values are exact raw local Docker history API Size sums, not merged-rootfs disk usage; engine Size is a separate storage measure. No flatten/export/import was performed. Historical lower layers retain old APT bytes, as normal for layered package updates; the fixed packages occupy the active merged filesystem. The scans do not declare those superseded lower-layer bytes vulnerability-free. Recipes are repeatable while the signed pinned packages/base remain available, but timestamps, logs and rolling repository metadata prevent a bit-for-bit build claim.

## Full-image retest and remaining High findings

Four actual `trivy image` scans used Docker-only local inputs, OS+library package types, vulnerability scanner, offline analysis and parallel1. Existing Trivy0.74.0 binary SHA256 `5fd45afccbd5efd7a88e6da92a7b3a52c2e3ffd30d5b954f324123d6d1d24469` and the same cached DB were used throughout. DB UpdatedAt is2026-11-10T19:01:23.081219346Z; DB SHA256 `cf7fa3086682e8f77298ca8178419a530f97d7c4bd3ac203a64f2977f82e94a6` and metadata SHA256 `62046a71bc29e0ded194e98fe3cde2f51f7179f5ed9d150b7853a33cbe307477` matched before/after. No DB freshness beyond that snapshot is claimed. Automatic DB/Java/check/version/VEX updates and telemetry were disabled. Empty private auth/config/ignore inputs were used; no severity/unfixed/status suppression or remote image fallback occurred.

| Actual analyzer coverage | Official baseline | APT candidate |
| --- | --- | --- |
| Cilium Ubuntu26.04 OS | 124 package rows | 124 package rows |
| Cilium Go binaries | 13 nonempty gobinary targets | Same13 targets/package inventories |
| Cilium findings | 10 High,64 Medium,6 Low,4 Unknown | 8 High,64 Medium,6 Low,4 Unknown |
| Envoy Ubuntu24.04 OS | 95 package rows | 95 package rows |
| Envoy Go binaries | 1 nonempty gobinary target | Same target/package inventory |
| Envoy findings | 2 High,23 Medium,4 Low | 0 High,23 Medium,4 Low |

Both scans have actual Ubuntu OS inventory results and all expected gobinary targets. They are not zero-result scans being called clean. Compressed raw JSON, analyzer/package counts, projections, stderr and exact commands are retained. APT candidate results contain no CVE-2026-109518 row; baseline OS scans reproduced the vulnerable apt/libapt rows first. Other OS findings and all Go vulnerability tuples remain unchanged.

Cilium's remaining **eight High rows all concern CVE-2026-78661 / GO-2026-6860, x/net v0.60.0 below0.62.0**, in `cilium-cni`, `cilium-agent`, `cilium-bugtool`, `cilium-dbg`, `cilium-envoy-bootstrap-locality`, `cilium-health`, `cilium-mount` and `hubble`. These are package/version findings, not eight demonstrated exploits. Earlier x/net/html linkage/reachability observations do not change the installed versions or waive the findings; this job performed no new reachability assessment. Full native Cilium/Envoy source-CVE coverage and runtime compatibility are not established by Trivy's supported package inventories. Envoy's zero High count also does not clear its remaining Medium/Low findings or imply all-security acceptance.

## Resource bounds, cleanup and scope

The approved sequential baseline→build→candidate sequence for both images ran **2026-11-12T10:41:27.218230Z–10:41:45.973051Z,18.755s**, under a600s watchdog. Preflight battery50%, free disk454,514,954,240bytes; final49% and454,494,425,088bytes. Each actual RUN container inspection verified CPUperiod100000/quota200000 (2CPU), memory/swap4GiB. No parallel build was started. Trivy used GOMAXPROCS2/GOMEMLIMIT1GiB/parallel1. Peak sampled stage client-tree RSS was96,501,760bytes; the supervisor-inclusive final sample was2,000,781,312bytes after full DB byte hashing. Stage samples exclude supervisor/daemon; no whole-machine peak or performance claim is made. Existing lab activity was not used as a performance comparison.

Exact owned intermediate CIDs `3954f209c9e556a2d900890725712fab82dc788627bf1d72e4eb0e9ff53cd613` and `426ea862e71b7328aa54ca3be78f5a39e58e6e70f7ca4c876fc54481f3035a3d` were discovered from this job's stdout, verified against the expected official image and exact normalized RUN command, and observed with the prescribed hard container limits. Force-rm removed them; cleanup did not rely only on killing the build client. Final checks find all15 exact owned preparation, signature, RUN and inspection containers absent, and the job supervisor PID absent. There was no image/container prune or unrelated resource cleanup.

The previous operator candidate02 ELF SHA256 `9cde6566ecb775195173d76148e156a5cd6aa96e86b579d8c6176fadcfe0cb09` and local operator-image descriptor `0f5f919c630deb02c84c3301f61efe4b6b4aece5bde2dbbcc771e48e8aac7352` were rechecked unchanged. No source/pins, Git/index, roadmap, root-owned helper tests, installed provider, CNI/lab, current context or registry publication changed. **Open:** remaining Go High findings, other provider components, other severities, source/native CVEs, runtime/RBAC/TLS acceptance and final publication/provenance/license review. No risk exception or blanket clean claim is made.
