Native Safari alternate MCP capability discovery: PARTIAL / BLOCKED_CLIENT_PROTOCOL_SUPPORT. One owned stdio process, no retry. This is neither a browser automation denial nor proof that Safari MCP is unsupported. No native app/Retina/performance gate closes.

Installed `/usr/bin/safaridriver --help` advertises `--mcp` using stdin/stdout JSON-RPC; help exits1 despite printing this capability. Primary WebKit documentation identifies Safari27's MCP server and the same flag. The probe launched exact argv `/usr/bin/safaridriver --mcp` with exclusively owned pipes, no HTTP listener/ancestry assumption. Resolved executable SHA and helper SHA are in result.json.

Observed: owned child PID80131 answered initialize within0.205s; combined stdout/stderr read144bytes, below64KiB. Client requested protocol2025-11-25; server proposed2024-11-05 and serverInfo nameSafari/version1.0.0. This is MCP implementation metadata, not browser version. The receipt field negotiatedProtocol contains the server proposal; the client did NOT accept a final protocol agreement. The helper supported only its requested2025-11-25, so it disconnected on the older proposal. Methods actually sent: initialize ONLY. notifications/initialized, tools/list and tools/call were NOT SENT; tool names were NOT DISCOVERED, not an observed empty list.

MCP lifecycle permits a different server-supported version and recommends disconnect when the client does not support it. Stdio is newline-delimited JSON-RPC over the child pipes. The deliberate client-version guard caused the partial result; no OS automation setting or driver failure was diagnosed. A separately authorized future probe could implement documented2024-11-05 compatibility before initialize/initialized/tools-list; it was not retried here.

Cleanup: stdin closed, the exact Popen child exited0, stdout/stderr pipes and selector closed. No SIGTERM/SIGKILL was needed. Process elapsed0.204913s, <=10s; no persistent helper process claimed active. No HTTP endpoint attribution, broad kill or unrelated process manipulation was attempted. Session creation, browser/navigation/inspect-page tool, user page read, enable flag, OS automation setting or product/lab action was not performed. No raw server log/response body or credential value was saved; receipt contains whitelisted protocol/server metadata, byte/time counts and ownership/cleanup only.

Primary references checked:
- [MCP2025-11-25 transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports): child stdin/stdout/newline transport.
- [MCP lifecycle/version negotiation](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle): initialize first; initialized notification after successful agreement; disconnect on unsupported response version.
- [WebKit Safari MCP introduction](https://webkit.org/blog/18136/introducing-the-safari-mcp-server-for-web-developers/): Safari27 MCP mode and documented flag.

Files: result.json safe receipt; private `.git/release-audit/native-safari-mcp-discovery-worker/probe.py`; SHA256SUMS. No product/Git/index/roadmap edit. Root owns checkpoint and any separate follow-up authorization.
