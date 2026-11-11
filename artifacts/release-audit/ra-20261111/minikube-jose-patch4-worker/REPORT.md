# Private minikube go-jose patched.4

**Build, version/help and scanners completed. The three go-jose findings are removed; other inventory findings remain.** New private binary `.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4` has SHA256 `98e42bafefb50d652b8c4760412703d936b6201d1d6d6c27163c5f69f130ddae`, 136,795,746 bytes. It prints v1.38.1-kubeview-patched.4 and real upstream commit c93a4cb9311efc66b90d33ea03f75f2c4120e9b0. ISO v1.38.0 and storage v5 remain unchanged. It is a custom patched binary, not an official distribution.

The prior patched.3 source/vendor and binary were preserved by macOS copy-on-write clones. Original and preserved .3 binary SHA256 remains 0ea47b1aa27343751614b25f427771974bca6534365ab8ddee4bf7aee8ce0371. Baseline go.mod/go.sum/modules.txt, SDK alias source and full vendor tree receipt are preserved. Final integrity verifies the original .3 source and vendor tree remain unchanged. No product source/pin/global CLI, lab, Git/index or roadmap was changed.

One graph operation changed **only github.com/go-jose/go-jose/v4 v4.1.4 → v4.1.6**. All other require versions and Go/toolchain directives remain unchanged, including Kubernetes 0.35.1, Docker SDK 28.5.2+incompatible, gRPC 1.83.2, Go 1.27.4 and prior security floors. One vendor regeneration changed 14 paths, restricted to go-jose/v4 and modules.txt. The same two archive.Compression references were changed to the existing local Compression alias after vendoring. Its hash remains c3a2fcd7bab86793ba247516a792e83e454724068a14b55784d7adf31196b420. Exact go.mod/go.sum diffs, SDK patch and vendor delta/hashes are retained.

The one build passed in 31.910 s. Compiler-tree peak sampled owned RSS was 2,643,968,000 bytes, below the separate 4 GiB compiler cap. GOMAXPROCS=2, GOMEMLIMIT=1536MiB, -p=1, CGO_ENABLED=1, minimum free disk 10 GiB, one build/no retries, and a six-minute deadline anchored to 13:16:29 UTC were enforced. These are compiler-job observations, not application performance evidence.

Full build command (cwd `.git/release-audit/minikube-jose-patch4/source`; GOTOOLCHAIN=go1.27.4, GOFLAGS='-mod=vendor -p=1'):

```sh
go build -trimpath -buildvcs=false -p=1 -mod=vendor -tags libvirt_dlopen -ldflags '-X k8s.io/minikube/pkg/version.version=v1.38.1-kubeview-patched.4 -X k8s.io/minikube/pkg/version.isoVersion=v1.38.0 -X k8s.io/minikube/pkg/version.gitCommitID=c93a4cb9311efc66b90d33ea03f75f2c4120e9b0 -X k8s.io/minikube/pkg/version.storageProvisionerVersion=v5' -o /Users/yunusemre/Desktop/KubeView/.git/release-audit/minikube-jose-patch4/minikube-v1.38.1-kubeview-patched.4 k8s.io/minikube/cmd/minikube
```

Version and top-level help passed with isolated private MINIKUBE_HOME and KUBECONFIG=/dev/null. No cluster, node or provider command ran; root owns real functional acceptance.

## Scanner results and retained gaps

Govulncheck 1.9.0 binary mode: **6 actual finding.osv IDs / 592 events**; 356 catalog OSV records are not the finding count. Matched IDs remain GO-2026-4883, 4887, 5617, 5668, 5746 and 6778, exactly the prior Docker/distribution inventory. DB timestamp is 2026-11-11T02:51:11Z. Exit 0 was not interpreted as clean. Main `(devel)` coverage remains separately triaged; [primary source/range and TEST daemon disposition](../runtime-binary-worker/patched-minikube/vendor-attempt/ENVIRONMENT_TRIAGE.md) remain applicable to their recorded inputs.

Same Trivy 0.74.0 / unchanged private DB (UpdatedAt 2026-11-10T19:01:23Z, DownloadedAt 2026-11-11T10:50:41Z): the 214-component buildinfo-derived dependency SBOM changed **8 → 5 rows, 3 → 2 High**. No go-jose row remains: High CVE-2026-116587 and Medium CVE-2026-116585/116586 disappeared after v4.1.6. The [primary High advisory](https://github.com/go-jose/go-jose/security/advisories/GHSA-mgcc-cww5-fp2q) concerns crafted private RSA JWK parsing; no exploit was attempted.

Remaining Trivy High IDs are CVE-2026-41567 and CVE-2026-42306 in the retained Docker SDK module identity. Their daemon implementations were previously shown absent from this CLI; the recorded TEST Engine 29.5.3 exceeds the 29.5.1 fixes. That is a recorded environment-specific disposition, not global acceptance or proof for another Engine. Distribution CVE-2026-85747 and Docker Medium records remain.

The direct Mach-O fs no-coverage results from the previous attempt remain intact. This task used explicit CycloneDX derived from exact buildinfo, not a false whole-file clean result. Main-module purl was omitted rather than inventing a released module identity; native libraries and symbol/input reachability are not covered by this module inventory. SBOM mode lacks --parallel; one process with GOMAXPROCS=1 and explicit DB/no updates/empty ignorefile was used. Raw scanner JSON gzip, component list, source hashes and exact commands are retained. No remaining finding is automatically waived and no release decision is made.
