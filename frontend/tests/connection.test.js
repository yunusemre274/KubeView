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
  socketSerial: 1,
  scopeRevision: 1,
  connectionAbort: null,
  metricsAbort: null,
  managementReset: Promise.resolve(),
  managementIntent: false,
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

test("first mount can observe namespace before contexts arrive without opening streams or claiming authority", async () => {
  const manager = fresh();
  manager.state = {
    ...initialState("initial-mount"),
    contexts: [],
    context: "",
    mode: "live",
    configured: false,
    readOnly: true,
    managementEnabled: false,
  };
  manager.started = true;
  let streamStarts = 0;
  manager.connect = () => {
    ++streamStarts;
  };
  try {
    assert.doesNotThrow(() => manager.observeNamespace("all", "initial-mount"));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(manager.state.activeNamespace, "all");
    assert.equal(manager.state.readOnly, true);
    assert.equal(manager.state.managementEnabled, false);
    assert.equal(manager.state.snapshotReady, false);
    assert.equal(Object.keys(manager.state.resources).length, 0);
    assert.equal(Object.keys(manager.state.scopes).length, 0);
    assert.equal(manager.state.metricHistory.length, 0);
    assert.equal(streamStarts, 0);
    manager.observeNamespace("known-namespace", "initial-mount");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(manager.state.activeNamespace, "known-namespace");
    assert.equal(streamStarts, 0);
  } finally {
    manager.cleanup();
  }
});

test("management revoke is awaitable and fails closed before configuration and in demo", async () => {
  const manager = fresh();
  try {
    for (const state of [
      { mode: "live", configured: false },
      { mode: "demo", configured: true },
    ]) {
      manager.state = {
        ...manager.state,
        ...state,
        readOnly: false,
        managementEnabled: true,
      };
      manager.managementIntent = true;
      const reset = manager.resetManagement();
      assert.equal(typeof reset?.then, "function");
      await reset;
      assert.equal(manager.state.readOnly, true);
      assert.equal(manager.state.managementEnabled, false);
      assert.equal(manager.managementIntent, false);
    }
  } finally {
    manager.cleanup();
  }
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

test("each current socket open refreshes authority once and a revoked grant stays readonly after snapshot", async () => {
  const manager = fresh(),
    sockets = [],
    requests = [];
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window,
    oldSocket = globalThis.WebSocket;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.WebSocket = class {
    constructor(url) {
      this.url = url;
      sockets.push(this);
    }
    close() {}
  };
  globalThis.fetch = async (url) => {
    requests.push(url);
    const revoked = requests.length > 1;
    return reply({
      connectionID: revoked ? "new-nonce" : "nonce-a",
      readOnly: revoked,
      managementEnabled: !revoked,
    });
  };
  manager.managementIntent = true;
  manager.state = {
    ...manager.state,
    readOnly: false,
    managementEnabled: true,
  };
  try {
    manager.connect();
    const oldOpen = sockets[0].onopen;
    sockets[0].onopen();
    assert.equal(
      manager.state.readOnly,
      true,
      "old authority cannot be reused while diagnostics are pending",
    );
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(manager.state.readOnly, false);
    sockets[0].onmessage({
      data: JSON.stringify({
        type: "SNAPSHOT",
        generation: "first",
        resources: [],
      }),
    });
    assert.equal(requests.length, 1);
    sockets[0].onclose();
    manager.connect();
    oldOpen();
    assert.equal(
      requests.length,
      1,
      "superseded socket callback must be ignored",
    );
    sockets[1].onopen();
    sockets[1].onmessage({
      data: JSON.stringify({
        type: "SNAPSHOT",
        generation: "reconnected",
        resources: [],
      }),
    });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(manager.state.readOnly, true);
    assert.equal(manager.state.managementEnabled, false);
    assert.equal(manager.state.connectionChecks.connectionID, "new-nonce");
    assert.equal(
      sockets.length,
      2,
      "diagnostics and snapshots must not reconnect recursively",
    );
    assert.equal(requests.length, 2);
    assert.ok(
      requests.every(
        (url) =>
          url.pathname === "/api/connection" &&
          url.searchParams.get("namespace") === "alpha",
      ),
    );
  } finally {
    manager.cleanup();
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
    globalThis.WebSocket = oldSocket;
  }
});

test("a superseded socket's diagnostic success or failure cannot replace current authority", async () => {
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  try {
    for (const status of [200, 403]) {
      const manager = fresh(),
        waiting = deferred();
      manager.managementIntent = true;
      globalThis.fetch = () => waiting.promise;
      try {
        const pending = manager.refreshConnection();
        manager.pauseStream();
        manager.publish({
          readOnly: false,
          managementEnabled: true,
          connectionChecks: { connectionID: "current-nonce" },
        });
        waiting.resolve(
          new Response(
            JSON.stringify({
              connectionID: "obsolete",
              readOnly: true,
              managementEnabled: false,
              error: "old diagnostic",
            }),
            {
              status,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
        await pending;
        assert.equal(manager.state.readOnly, false);
        assert.equal(manager.state.managementEnabled, true);
        assert.equal(
          manager.state.connectionChecks.connectionID,
          "current-nonce",
        );
      } finally {
        manager.cleanup();
      }
    }
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});

test("late management enable from an earlier socket cannot restore a same-scope grant", async () => {
  const manager = fresh(),
    waiting = deferred();
  const oldFetch = globalThis.fetch,
    oldWindow = globalThis.window;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.fetch = () => waiting.promise;
  manager.state = {
    ...manager.state,
    readOnly: true,
    managementEnabled: false,
  };
  manager.refreshConnection = () => {
    throw new Error("obsolete enable must not refresh diagnostics");
  };
  try {
    const enabling = manager.setManagement(true);
    manager.pauseStream();
    waiting.resolve(reply({ readOnly: false, managementEnabled: true }));
    await enabling;
    assert.equal(manager.state.readOnly, true);
    assert.equal(manager.state.managementEnabled, false);
    assert.equal(manager.managementIntent, false);
  } finally {
    manager.cleanup();
    globalThis.fetch = oldFetch;
    globalThis.window = oldWindow;
  }
});
