# Native Safari evaluation contract — observed

One newly created owned about:blank tab was switched to by its exact create-response handle and checked through page_info before each of three fixed evaluations. Raw tool results were preserved before any decoder:

| Function body supplied | Raw text result | isError |
| --- | --- | --- |
| `1+1` | `null` | false |
| `JSON.stringify({ok:true,marker:"kv-owned-eval"})` | `null` | false |
| `return 1+1` | `2` | false |

The installed evaluate_javascript metadata explicitly describes a JavaScript **function body** and requires an explicit return for values. Only this tool's description and full inputSchema were retained from tools/list. The prior app helper supplied an immediately invoked expression without an outer function-body return. This installed contract and the constant controls explain its decoded-null harness outcome; application rendering remains untested by that earlier result. No KubeView app smoke was rerun in this diagnostic.

Owned child PID `90384`, negotiated protocol `2024-11-05`. Exact created handle was closed with matching acknowledgement; no pending tab. Stdin EOF yielded child exit `0` without signals. Runtime `0.888026s` /20s, aggregate stdout+stderr `13287` bytes /64KiB. Start `2026-11-11T18:52:39.656725+00:00`; finish `2026-11-11T18:52:40.544764+00:00`. No retry. No app, list_tabs/get_page_content, personal page, cookies/storage, OS setting, browser navigation beyond new about:blank, viewport emulation or product change.

Source HEAD `3e8df4d71fae2dec7d31139630c328586898dec6`; safaridriver SHA256 `0e113cd573e6cfdcf0329107c78c50fca01a15ed448e1b6827042df5335d33e8`. Command `python3 .git/release-audit/native-safari-evaluation-contract-worker/probe.py`; helper SHA256 `36cd34b94e9bb05c557f07167827e43226291d6e5c06dcb550f2a8e407fc9577`. Safe raw responses and installed tool contract: `result.json`. Native KubeView UI, Retina and performance gates remain **NOT RUN**.
