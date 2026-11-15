# Recorded single resources phase

The actual argv, child environment and absolute owned paths are in command.json. It selected only TestReleaseOwnedResourcesTemplate with the distinct opt-in KUBEVIEW_RELEASE_REAL_RESOURCES=owned-profile06-template-resources. The scale opt-in was not enabled by the wrapper.

```sh
GOTOOLCHAIN=go1.26.11 GOMAXPROCS=1 \
KUBEVIEW_RELEASE_REAL_RESOURCES=owned-profile06-template-resources \
KUBEVIEW_RELEASE_REAL_STATE=/ABSOLUTE/OWNED/lab.json \
KUBEVIEW_RELEASE_REAL_KUBECONFIG=/ABSOLUTE/OWNED/private/admin.json \
KUBEVIEW_RELEASE_REAL_OUTPUT=/ABSOLUTE/NEW/OUTPUT \
go test -count=1 -p=1 -parallel=1 \
  -run '^TestReleaseOwnedResourcesTemplate$' -timeout=180s -json ./pkg/server
```

Run from backend only with explicit new authorization and exact UID/owner checks. This phase has already consumed its single run; the recipe does not authorize replay. Preserve the existing FAIL. The maximum3Pod guard fired and cleanup completed. A further test must first retain the exact Pod metadata needed to distinguish terminating overlap; no automatic ceiling relaxation or handler change is included.
