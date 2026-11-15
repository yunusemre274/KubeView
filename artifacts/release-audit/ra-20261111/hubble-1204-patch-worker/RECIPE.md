# Hubble 1.20.4 private security candidate

Use only the exact official Hubble commit `3e268bbcc7243b90300debb6e5de3062656669ce` (tag object `e5e724791fb50c23194f21dd6214ac9a5fc93e02`; tree `5e0c0cec99c7159654b80439329f47a6189c5954`). Fetch its archive over verified HTTPS, verify every regular file Git blob against the official recursive tree, and retain the SHA-256 in source-manifest.json. Never use an existing repository working tree as upstream VCS identity.

Run in a fresh private source copy, preserving the supplied vendor tree; the build selects the module graph explicitly. Baseline already contains cel-go 0.30.0; unlike the old 1.20.2 candidate, no cel-go upgrade is necessary.

```sh
export GOTOOLCHAIN=go1.27.4 GOMAXPROCS=2 GOMEMLIMIT=1GiB CGO_ENABLED=0
go get -p=1 golang.org/x/net@v0.62.0
go mod edit -toolchain=go1.27.4
go build -trimpath -buildvcs=false -p=1 -mod=mod \
  -ldflags '-w -s -X github.com/cilium/cilium/hubble/pkg.Version=v1.20.4-kubeview-patched.1 -X github.com/cilium/cilium/hubble/pkg.GitHash=3e268bbcc7243b90300debb6e5de3062656669ce -X github.com/cilium/cilium/hubble/pkg.GitBranch=kubeview-audit-v1.20.4-patched.1' \
  -o /ABSOLUTE/PRIVATE/hubble-v1.20.4-kubeview-patched.1 .
```

The monitor in the retained private run.py stops the single compiler process tree above 2 GiB RSS, below 10 GiB free disk, or at its finite deadline. GOMEMLIMIT is a Go GC target, not an OS RSS limit. The Makefile confirms these linker variable paths in the versioned Cilium module. `-buildvcs=false` prevents the enclosing KubeView Git identity from being embedded; the real upstream commit is supplied to the CLI and recorded separately. This is a custom build, not the official prebuilt asset.

If the binary succeeds, run only version and top/status/observe help with explicit `/dev/null` config and a private child HOME. No relay or API command is authorized. Record `go version -m`, actual `finding.osv` GoDB results, and buildinfo-derived CycloneDX module SBOM using the pinned Trivy cache without updates. Stripped Go binaries can trigger conservative govulncheck symbol fallback. Module SBOM omits main(devel) and native code; a direct Mach-O exit-zero scan has previously provided no Go-binary coverage. Never treat those gaps as clean coverage.
