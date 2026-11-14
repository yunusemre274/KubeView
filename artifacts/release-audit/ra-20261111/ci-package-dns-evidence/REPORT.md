# CI package gate — BLOCKED

The following exact commits reached successful source tests, frontend build and real darwin-arm64/linux-amd64 package compilation. Go opt-in lab tests skipped by design are not real Kubernetes acceptance. All three then failed at `npx playwright install --with-deps chromium`: Ubuntu archive/security host DNS resolution failed, APT exited100, and the install step exited1.

| Commit | Run | Job |
|---|---:|---:|
|46ec55080c23eb1502092ddd8b3c63ff409fded7|43057610046|130651169093|
|df656bf288bd2d80a559ad02118321ccdb516f7f|43058817820|130655472761|
|96adbf6092cba098cef351072b045e0946a4525a|43059785493|130658873437|

Job step receipts and selected public APT errors are in results.json. Clean Linux binary/browser startup and artifact upload were **SKIPPED**. Package compilation is not clean-install runtime acceptance, and no uploaded artifact is assumed available. No workflow retry, DNS override, TLS bypass, platform reduction or dependency-check removal was applied.

This is an observed infrastructure blocker at those run identities, not proof of a product runtime fault or a successful final candidate. Subsequent commits have separate CI runs; their status must be checked separately. TEST20.01 stays open/blocked. The current local final package also has not been produced and exercised in a clean environment.
