import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { initialState } from "../src/data/resourceStore.js";
import {
  connectionStatus,
  safeConnectionDiagnostics,
} from "../src/world/connectionState.js";

const compiled = await build({
  entryPoints: [
    new URL("../src/context/ShipyardClusterContext.jsx", import.meta.url)
      .pathname,
  ],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  define: {
    "import.meta.env.DEV": "false",
    "process.env.NODE_ENV": '"production"',
  },
});
const { singletonManager } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`
);
const fresh = () => ({
  ...singletonManager,
  state: {
    ...initialState("live:A:1"),
    context: "A",
    mode: "live",
    contexts: [{ name: "A" }],
    configured: true,
    activeNamespace: "alpha",
    watchNamespace: "",
    connectionChecks: { connectionID: "nonce-a" },
  },
  listeners: new Set(),
  streamListeners: new Set(),
  scopeSubscriptions: new Map(),
  scopeRequests: new Map(),
  requests: new Set(),
  storeTimings: [],
  demoTimers: [],
  socket: null,
  poll: null,
  retry: null,
  epoch: 1,
  scopeRevision: 1,
  connectionAbort: null,
  metricsAbort: null,
  managementReset: Promise.resolve(),
});
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const reply = (body) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

test("connection labels distinguish browser, API, first synchronization and demo", () => {
  assert.match(
    connectionStatus({ configured: true, isConnected: true, upstream: true }),
    /senkronize/,
  );
  assert.match(
    connectionStatus({ configured: true, lastUpdated: "now" }),
    /Stale/,
  );
  assert.match(connectionStatus({ mode: "demo" }), /Demo/);
});
test("copy diagnostics excludes raw errors, Secret metadata, endpoint and session credentials", () => {
  const secret = "DO_NOT_COPY";
  const diagnostic = safeConnectionDiagnostics(
    {
      context: "owned-lab",
      mode: "live",
      errors: [secret],
      resources: [{ data: secret }],
      connectionChecks: {
        connectionID: secret,
        token: secret,
        checks: { api: { status: "error", message: secret, category: secret } },
      },
    },
    "alpha",
  );
  assert.doesNotMatch(
    JSON.stringify(diagnostic),
    /DO_NOT_COPY|connectionID|token|resources|message/,
  );
  assert.equal(diagnostic.checks.api.status, "error");
});
test("context cleanup aborts pending HTTP and rejects a late accepted mutation", async () => {
  const manager = fresh(),
    waiting = deferred();
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window;
  let request;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return waiting.promise;
  };
  try {
    const pending = manager.request("/api/actions", {
      method: "POST",
      body: { action: "restart" },
    });
    assert.equal(request.options.headers["X-KubeView-Connection"], "nonce-a");
    manager.cleanup();
    assert.equal(request.options.signal.aborted, true);
    waiting.resolve(reply({ operation: { id: "old-A" } }));
    await assert.rejects(pending, /önceki oturum/);
  } finally {
    manager.cleanup();
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});
test("namespace switch cancels metrics and never appends an alpha response into beta", async () => {
  const manager = fresh(),
    calls = [];
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.fetch = (url, options) => {
    const waiting = deferred();
    calls.push({ url, options, waiting });
    return waiting.promise;
  };
  manager.resetManagement = () => Promise.resolve();
  manager.scheduleScopeRefresh = () => {};
  try {
    const alpha = manager.refreshMetrics();
    manager.observeNamespace("beta", manager.state.sourceKey);
    await Promise.resolve();
    assert.equal(calls[0].options.signal.aborted, true);
    assert.equal(manager.state.readOnly, true);
    assert.equal(calls[1].url.searchParams.get("namespace"), "beta");
    calls[0].waiting.resolve(
      reply({
        available: true,
        timestamp: "2026-11-08T10:00:00Z",
        pods: [{ name: "same", namespace: "alpha" }],
      }),
    );
    await alpha;
    assert.equal(manager.state.metricHistory.length, 0);
    calls[1].waiting.resolve(
      reply({
        available: true,
        timestamp: "2026-11-08T10:00:01Z",
        pods: [{ name: "same", namespace: "beta" }],
      }),
    );
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(manager.state.metricHistory.length, 1);
    assert.equal(manager.state.metrics.pods[0].namespace, "beta");
  } finally {
    manager.cleanup();
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});
test("late management enable cannot restore writes after alpha to beta to alpha", async () => {
  const manager = fresh(),
    waiting = deferred();
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.fetch = () => waiting.promise;
  manager.resetManagement = () => Promise.resolve();
  manager.refreshMetrics = () => Promise.resolve();
  manager.scheduleScopeRefresh = () => {};
  manager.refreshConnection = () => {
    throw new Error("stale enable must not refresh diagnostics");
  };
  try {
    const enable = manager.setManagement(true);
    manager.observeNamespace("beta", manager.state.sourceKey);
    manager.observeNamespace("alpha", manager.state.sourceKey);
    waiting.resolve(reply({ readOnly: false, managementEnabled: true }));
    await enable;
    assert.equal(manager.state.readOnly, true);
    assert.equal(manager.state.managementEnabled, false);
    assert.equal(manager.state.connectionChecks, null);
  } finally {
    manager.cleanup();
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});
test("diagnostics never reenable management without an explicit current-view intent", async () => {
  const manager = fresh();
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.fetch = async () =>
    reply({
      connectionID: "fresh-nonce",
      readOnly: false,
      serverReadOnly: false,
      managementEnabled: true,
      managementAvailable: true,
    });
  try {
    await manager.refreshConnection();
    assert.equal(manager.state.readOnly, true);
    assert.equal(manager.state.managementEnabled, false);
  } finally {
    manager.cleanup();
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});
