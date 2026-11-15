# Exact warm-build attempt

The source and graph are the unchanged post-attempt state from the first Hubble 1.20.4 candidate. Read preflight.json and source-graph-hashes.json; no graph/get/download command was issued. The output binary did not exist before this attempt. The exact argv and environment are in build.json.

```sh
GOTOOLCHAIN=go1.27.4 GOMAXPROCS=2 GOMEMLIMIT=1GiB CGO_ENABLED=0 \
  go build -trimpath -buildvcs=false -p=1 -mod=mod \
  -ldflags '-w -s -X github.com/cilium/cilium/hubble/pkg.Version=v1.20.4-kubeview-patched.1 -X github.com/cilium/cilium/hubble/pkg.GitHash=3e268bbcc7243b90300debb6e5de3062656669ce -X github.com/cilium/cilium/hubble/pkg.GitBranch=kubeview-audit-v1.20.4-patched.1' \
  -o /ABSOLUTE/PRIVATE/hubble-v1.20.4-kubeview-patched.1 .
```

**The retained runner did not enforce its wall-clock cap successfully.** It requested 240 seconds but observed 494.590 seconds. It polls the process tree and time and has no independent hard-kill watchdog; do not treat this runner as a reliable hard wall bound. No second attempt is included or authorized by this receipt. The cause of the gap is unknown. The original attempt-runner.py is retained as failed control evidence, not a recommended replacement.
