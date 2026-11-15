# V05 cold view regression

Normal headed Chromium UI: **4/4 checks PASS**, 2026-11-09 17:53:08–17:53:13 UTC. This is explicitly labeled TEST/REPLAY M synthetic data served by the real embedded application; it is not actual-cluster, Hubble, CPU or physical presented-latency evidence.

Binary supplied by root: `2ba3e80a3b6ef604780f3db76087bee066784ae29b81056b663eaa91c645e080`. Frontend source before/after: `ee974b3b1367777c967ff3cc38d1ffd4853c87ff39e060d6280b65a16194e559`. Dist before/after: `4dd698fb6606a31a7be223ad40551bd06fe3a153fa83517c6f18e8cd9d785a0e`; index `f631b695c418aa865f18d7ec75611a8e097bc52e874b349f0ec52ec683e34585`.

- Empty workspace: first-harbor CTA visible, one Canvas, no prior-data stale caption and no automatic socket.
- Finder → Pod `app-0` → exact UID `pod-0` → container `app` → normal Loglar tab. The log-filter text remained intact, native left-arrow caret moved to 21, and measured camera/target/quaternion distances were all zero. One Canvas remained mounted through harbor switching.
- Normal harbor navigation persisted the view. A real workspace GET returned the exact UID, namespace `bench-0`, container `app` and `tab: logs` before reload.
- A new document/cold source snapshot restored the same Pod/container/logs panel. Real replay log requests carried the expected UID/container and scope fields and received HTTP 200.

All three PNGs were opened and inspected. The magenta rectangle is Playwright screenshot masking of the log output, not product rendering. No raw logs, headers, nonce, Secret values or trace were saved.

Historical failures remain separate: `../ws-vertical04-cold-view-regression/result.json` records the macOS Home-key helper assumption; `../ws-vertical04-cold-view-helper-corrected/result.json` records the actual missing-tab persistence bug (`view.tab: null`). Neither result was rewritten. The handler fix has separate red/green unit proof and a full serial **198/198 PASS** receipt in `/tmp/kubeview-workspace-tabs-full.json`; no unit result is presented as UI evidence.

Cleanup: all three observed log requests ended with an abort/failure event after panel/source closure. The server's read-only replay counters report **3 opened / 3 closed**. About:blank, context close and browser close completed; the own helper process is absent. No Kubernetes fixture, proxy or exec session was created. Root owns the remaining gateways.

Playwright reported only **1/3 WebSocket close events**. This is an explicit observation gap: this run does not claim zero kernel TCP endpoints, Go goroutines or heap retention. Independent root socket/process checks may supplement this record without replacing the raw event counts.
