# Reproduce the explicit owned scale test

Only use the exact owned state and private admin kubeconfig specified in command.json after re-verifying the recorded lab/cluster/namespace UIDs and ownership. Never select a default context or run against a different lab. The test has an explicit opt-in and a135second API context plus35second independently guarded cleanup.

From backend, with the absolute paths shown in command.json set as child-process environment variables:

```sh
GOTOOLCHAIN=go1.26.11 GOMAXPROCS=1 \
KUBEVIEW_RELEASE_REAL_SCALE=owned-profile06-2-3-1 \
KUBEVIEW_RELEASE_REAL_STATE=/ABSOLUTE/OWNED/lab.json \
KUBEVIEW_RELEASE_REAL_KUBECONFIG=/ABSOLUTE/OWNED/private/admin.json \
KUBEVIEW_RELEASE_REAL_OUTPUT=/ABSOLUTE/NEW/OUTPUT \
go test -count=1 -p=1 -parallel=1 \
  -run '^TestReleaseOwnedScaleTwoThreeOne$' -timeout=180s -json ./pkg/server
```

No replay is implied by this recipe. The actual single invocation is preserved in command.json. Any sample gap above5seconds invalidates the bounded result; keep the pre-mutation timeline for owner-guarded cleanup if the process is externally interrupted.
