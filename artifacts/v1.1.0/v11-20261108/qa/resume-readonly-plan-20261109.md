# QA resume: source-only handoff, 9 November 2026

Prepared by KV-QA-MANAGER before the root's restored lab/build execution lease. No browser, test, API request, cluster mutation, Git/index write, or product-source edit was started by this worker during this review. User continuation revokes the historical pause; historical pause files and failed runs remain unchanged.

Read: AGENTS/AGENTS.md, AGENTS/qa-agent.md, the complete 207-line v1.1 application prompt, PROJECT/ARCHITECTURE/TODO/DECISIONS/METAPHOR, the root/QA/frontend PAUSE handoffs, all current v11 suite/runner/helper sources, and the acceptance ledger.

## Evidence boundary

- Last passing A/B and browser-security product source: `f3650f009320ef54342dc0cf9c7b1f8f644eed756b168bafe5560bcb2693b01d`; binary `739477b43d3b762dc58532ca52e94f410566e4c7a840ff1e876ff302934443d2`.
- The exact current-source comparison against that result finds only ResourceForms.jsx, new formLoading.js/test, and workbench.css changed. ResourceForms now hashes `62356ccbc21f7caf4427a20abae156e64138051da5c4f2fc32a0bb385e2601db`; formLoading.js `927ab3e3b8934f9e414e05a869e12f180ed47cc9506dcd38ce4efd51d3e35df5`; formLoading.test.js `275107a3dde995a188906c0343d1bccd75b07f6c44cf7296395dfb30d38012d4`; workbench.css `4bb3482f07b50e5e707d1732388d6f20b807fc7231d54119b2a87e5b8bca32e2`.
- This comparison is read-only provenance, not a frozen build or a new PASS. The old installed binary/dist are explicitly inapplicable to the new form guard.
- Historical executed total stays 2 PASS / 7 FAIL / 0 SKIP. Max-failure cases not reached remain BLOCKED.

## Ordered queue after root restores identities and supplies the new binary

1. Verify actual A/B kube-system UID, namespace UID/owner, and retained Deployment's exact current UID/owner/RV. Root owns container restore and token refresh. A is `a24740ba-cf3e-461d-b5b3-250deeb060d7`, namespace `9e5b54f8-34fa-421d-9748-c5500224660c`; B is `4ae1d47a-d5dc-4e51-aa4d-b84c0a021d32`, namespace `f083c6a8-99f4-4fe3-8cb3-980820f5d384`. Source-offline absence is never DELETE.
2. First run: `--project=chromium --grep 'owned workload recovery' --max-failures=1`. Continue only `Deployment/v11-ui-mw8bfgl6`, UID `c5e42ecc-9987-4349-9c28-c89769f162c7`. Hold the real GET response without editing it; observe disabled fields/dry-run, release, fill and recheck all four quantities, real server dry-run with unchanged stored template, apply and observed Ready, restart/new RS/new non-terminating Ready Pod UID, Pod delete/replacement, Deployment delete/API404 and deleted old-UID panel.
3. Filled real Node+Pod metrics charts; then restricted manual namespace/actual Node+Namespace403/metrics403; finalizer/old-UID/new-name selection; empty/error/explicit Demo; viewport/keyboard/reduced motion. Run each bounded group separately so a failure does not hide later BLOCKED cases.
4. Missing Metrics API is separate from a failed/unreachable Kubernetes context. Current suite has filled and restricted403 coverage but no dedicated actual missing-provider UI case; use an owned reachable context with genuinely absent Metrics API after root confirms it, without changing addons/CNI.
5. Chromium and WebKit read flows remain distinct; mutation-only Chromium cases must not be counted as WebKit PASS. WebKit is not native Safari performance evidence. Root owns actual hidden/minimize, full cleanup, provider/visual current-gates, and exclusive 31-cell/20-minute/20-panel work.

## Retest decision at final runtime freeze

The old A/B+logs and initial read-only/nonce/Origin groups remain narrow historical subchecks. Their connection/log/security implementation files are unchanged, but the shared form/CSS build changed; rerun those two bounded cases once against the final frozen runtime to establish application startup and current build scope/security continuity. Do not rerun on every intermediate build, and do not mark metrics/CR/Hubble/pending-operation isolation passed by that group.

Prior real create/dry-run/scale2→3→1 subchecks remain preserved on the intentionally retained exact Deployment UID; do not blindly recreate them. The first recovery run directly tests the changed resources form and completes the missing operation chain. Record applicable handler/source equality and the old/new evidence identities when reconciling the full scenario rows.

The prepared recovery test does not yet explicitly trigger an ordinary same-UID watch update after draft entry or test close/ESC while the initial GET is held. Those are additional form-guard acceptance checks from the frontend handoff; they require test-source extension or a separate bounded test before the form guard is considered fully reviewed.

## Execution and reporting contract

Use only run-ui.py with private plain-data qa-config.env and `KV_V11_TEST_LEASE=v11-20261108-qa`; one worker/job, maxFailures1, condition bounds, PID-bound caffeinate, source/suite/build before/after and wall/monotonic gate. New immutable run IDs preserve every earlier attempt. Never put token, nonce, kubeconfig, TLS, auth plugin output, or Secret bodies into evidence. Cleanup requires actual cluster/ns identity, exact current UID/RV and owner guard, then observed404. Keep a product failure distinct from helper/condition failures and notify root with screenshot, locator and source location before product edits.
