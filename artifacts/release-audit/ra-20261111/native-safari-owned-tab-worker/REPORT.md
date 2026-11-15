# Native Safari owned-tab functional smoke — NOT RUN

Source HEAD: `5affead7a01e079102a14e1844c618164bdb4759`. Candidate SHA256: `f9e70b607c1689800f253ccaa6841d05e3a6951e6c032f837b7cf78f1dd4ecd4`; expected candidate hash matches: `True`. Read-only selector source: `frontend/e2e/release-packaged-startup.mjs` (SHA256 `dac6141c997caada2bae6cd22d932f322a9d271331e86bdcdf724d052707c134`).

The source review confirmed the empty-app path uses the normal “İlk limanını bağla” button, `.workspace-window`, “Liman adı” textbox and “Pencereyi kapat” close button. The intended app boundary was a fresh private empty data directory, nonexistent explicit kubeconfig, read-only mode, disabled providers and owned loopback19843.

No app, Safari driver, tab, page read or browser tool call was started. No OS setting, product file, existing tab, lab, app, cluster or relay was changed. The original300-second wall budget began18:39:33UTC. Source review/context handoff used the safe execution margin; starting a new browser lifecycle with cleanup remaining was rejected. This is a time-budget limit, not Safari automation denial, browser failure, functional result or evidence of a product issue. No retry was performed.

Native functional assertions, tab/origin guards, actual UA/DPR/viewport/framebuffer, screenshots and lifecycle cleanup exercise are **NOT RUN**. The earlier MCP metadata-only result remains separate; tools/list is not a page interaction. Native application/Retina/performance acceptance remains open.

No new process existed to clean up. Raw bounded receipt: `result.json`. No credential/cookie/nonce/header/page payload was recorded.
