# Two actual transport/reconnect product defects

Source `63cc05cb9f891856029adec959fea2d200a8f9ffdb6a951d678a72a8b9c9400d`, embedded binary `7211abc3e5baa28c88c8367cd53953b7ab1a2ff1eae97a6b3ce4c7271126caee`, Git HEAD6f0a829 plus pending form-loading fix. No product-source change was made by QA.

Definitive attempt: `runs/2026-11-09T07-54-11-952Z-chromium-fce93bc0/result.json` (FAIL). A single owned replica-zero Deployment `v11-transport-mw8ytdp4`, UID `1c1bbe37-7f1b-4181-8516-aebc37d721ed`, was used for both probes; fixture-registry.jsonl records its name/UID. Exact UID/RV/owner cleanup observed404. Full source/suite/build integrity passed; wall/monotonic skew0.475ms, no pageerror. The test-only native WebSocket subclass merely retains actual socket references and calls close(); no payload/canonical/application state is injected. Fixture creation is setup, not normal UI CREATE acceptance.

## Dirty quantities silently replaced

Normal finder → Deployment CPU/RAM form → actual initial GET completes → enter25m/175m/28Mi/112Mi → close the actual native WebSocket → observe actual stale state → observe a fresh actual scoped snapshot containing the same UID → wait until live/loading completes. All four unsubmitted values become10m/100m/16Mi/64Mi. Independent API reads prove the stored template and resourceVersion27126 are unchanged. The actual resource GET is repeated with the same UID/RV.

Captures01(before),02(stale),03(after) show the loss. Relevant source is ResourceForms.jsx:405: the initial-load effect depends on readOnly and API identity and unconditionally calls setObject(draft) after GET without preserving a dirty draft. This is separate from the initial-GET disabled-field guard and ordinary same-UID Pod watch acceptance, which passed earlier.

## Revoked server grant is not reconciled into the UI

With the same fixture/form, use the current browser cookie+nonce for a real POST management enabled=false. The real server closes its WebSocket. Observe that actual close, stale state and a new actual same-UID scoped snapshot. Read the real diagnostic through APIRequestContext without invoking frontend refresh. The server says readOnly=true and managementEnabled=false; the form has no read-only warning and Server dry-run remains enabled. Nonce/credential values are never recorded.

Capture05 and result.revokedGrant show the mismatch. Relevant source is ShipyardClusterContext.jsx:713: connect/onopen only publishes isConnected and does not refresh the real connection/grant state. This is misleading UI, with server-side revocation still effective; the probe does not claim a server mutation authorization bypass.

Root was notified after the test and cleanup completed. No new QA test is active; the source/build window is open for the frontend owner. Preserve all original PASS/FAIL records. Revalidate both probes on the newly embedded candidate, then rerun affected acceptance flows after the final runtime freeze.
