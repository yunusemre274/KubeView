# Exact partial cleanup

Operational cleanup PASS; original worker operation remainsFAIL. Removed only the exact newly created, unreferenced m03volume, then CAS-restored the pending profile to the captured original full-byte SHA c8266879d0e6ae53f2b6d9d255e2a8bfedf550a918f4d0988f2e447a1e7cc1a5. Both locks and all UID/birth/label/no-user/exclusive-target/full-profile-equality gates passed. No NodeAPI or minikube delete/add/retry was used.

NewNode/container/volume/network targets absent; original2ReadyUIDs, fixture/Cilium/network/volumes/manualstate equal; originalFAIL journals unchanged. App90910 and CLI91166were absent;19849free. Only original2nodes remainwarm. No pending new resource remains, while failed journals are intentionally retained.

Operational cleanup completed90.491s including preparation (<120s). Reporting exceeded180s: timingFAIL is explicit in manifest, separate from successful cleanup. Full original job stayed within720s. No further API call or helper edit followed. Public profile files are safe projections; complete original/current bytes and immutable journals remain private0600 under.git/release-audit/real-minikube-add-current-worker/.
