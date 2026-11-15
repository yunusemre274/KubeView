# Preparation and future explicit phases

Only this command ran during preparation:

```sh
python3 scripts/release-provider-lab.py self-test
```

The syntax check uses in-memory compile and writes no pycache. Real phases are **not authorized by this recipe** and run is currently hard-blocked until root supplies a new fixed runtime SHA/path for PROV-CACHE-001 and reviews remaining deadline/partial-cleanup gaps.

```sh
python3 scripts/release-provider-lab.py check --confirm-owned kvml-d32afbf634e8:check-only
python3 scripts/release-provider-lab.py run --confirm-owned kvml-d32afbf634e8:add-exact-m03
python3 scripts/release-provider-lab.py cleanup --confirm-owned kvml-d32afbf634e8:cleanup-recorded-m03
```

Fixed private journal: ~/Library/Application Support/KubeView/release-audit-hubble-20261111-cold01/private/release-provider-one-worker-20261111/attempt.json. Existing control/journal refuses run replay. Cleanup never generalizes to an arbitrary name, namespace, profile, cluster or CLI command. A partial identity gap requires root disposition, not a fallback NodeAPI object or forced profile rollback.
