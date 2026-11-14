# Small reproducible private recipe

Use an empty private directory and the unchanged patched.3 source recorded in baseline-receipt.json. The audited run.py provides deadline/RSS/disk supervision; for another run change only its private/artifact directory constants and deadline file to fresh paths. Do not rerun into this preserved attempt or overwrite patched.3. No binary/vendor tree belongs in the repository artifacts.

```sh
TASK_DIR=/absolute/new/private/attempt
mkdir "$TASK_DIR"
cp -cR /Users/yunusemre/Desktop/KubeView/.git/release-audit/patched-minikube-v1.38.1/source/kubernetes-minikube-c93a4cb "$TASK_DIR/source"
cd "$TASK_DIR/source"
export GOTOOLCHAIN=go1.27.4
export GOMAXPROCS=2
export GOMEMLIMIT=1536MiB
export CGO_ENABLED=1
export GOFLAGS='-mod=mod -p=1'
go get github.com/go-jose/go-jose/v4@v4.1.6
go mod vendor
```

Verify the sole require-version delta, apply sdk-alias.patch (only two references) and check the patched file hash c3a2fcd7bab86793ba247516a792e83e454724068a14b55784d7adf31196b420. Then use the exact supervised build command in REPORT.md with a fresh output path, GOFLAGS='-mod=vendor -p=1', the same true upstream/ISO/storage variables and custom patched.4 version. The recorded runner performs this minimal patch with assertions and no API rewrite.

Check go version -m without executing the binary; confirm go-jose v4.1.6 and all constrained versions. Run version/help only under an isolated MINIKUBE_HOME and KUBECONFIG=/dev/null. For scanners use the recorded govulncheck.command.json and trivy-sbom.command.json with fresh paths, preserve finding.osv counting, and regenerate a buildinfo-only CycloneDX inventory. Same DB metadata is in baseline-receipt.json. Provider/cluster acceptance is a separate root action.
