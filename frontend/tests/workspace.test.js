import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { harborScopeKey, physicalClusterKey, canonicalResourceKey, sharedResources, safeHarborView, browserTabId, HarborViewCache, authorizedFlowHarbors, flowHarborEndpoints, workspaceRelations, nextHarborPosition, harborViewNamespace } from "../src/world/workspace.js";
import { saveHarborConfiguration } from "../src/world/workspaceMutations.js";
import { initialState, reduceMessage } from "../src/data/resourceStore.js";
import { resourceObservation } from "../src/data/resourceScopes.js";
const compiled = await build({ entryPoints: [new URL("../src/context/WorkspaceRegistry.js", import.meta.url).pathname], bundle: true, platform: "node", format: "esm", write: false, define: { "import.meta.env.DEV": "false", "process.env.NODE_ENV": '"production"' } });
const { WorkspaceRegistry, HarborSession, createSourceManager } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const pod = (uid = "same") => ({ apiVersion: "v1", kind: "Pod", metadata: { uid, name: "same", namespace: "alpha" } });
const connection = (id = "A") => ({ id, name: id, context: "same-context", bound: true, credentialGeneration: "1" });
const harbor = (id, connectionRef = "A") => ({ id, name: id, connectionRef, namespaces: ["alpha"], selector: "app=web" });
const workspace = (harbors, connections = [connection()]) => ({ id: "workspace-unit", schemaVersion: 1, connections, harbors });
function fakeCore(scope) { return { workspaceScope: scope, state: { ...initialState(scope.scopeKey), configured: true, context: scope.context, mode: "live", resources: { same: pod() }, discovery: [], activeNamespace: "alpha" }, epoch: 1, socketSerial: 1, listeners: new Set(), start() {}, cleanup() { this.closed = true; }, connect() { ++this.socketSerial; }, streamSession() { return { key: String(this.socketSerial), ready: true }; }, diagnostics() { return {}; } }; }
test("20 identical harbors share one canonical core; their grants and requests stay distinct", () => {
  let created = 0;
  const registry = new WorkspaceRegistry("unit-tab-id", (scope) => { ++created; return fakeCore(scope); });
  registry.configure(workspace(Array.from({ length: 20 }, (_, i) => harbor(`h${i}`))));
  assert.equal(created, 1); assert.equal(registry.cores.size, 1);
  const a = registry.sessions.get("h0"), b = registry.sessions.get("h1");
  a.publish({ readOnly: false, managementEnabled: true, connectionChecks: { connectionID: "only-a" } });
  assert.equal(b.state.readOnly, true); assert.equal(b.state.connectionChecks, null);
  assert.equal(a.state.resources, b.state.resources);
  registry.dispose();
});
test("unverified identities and distinct credentials never share canonical caches", () => {
  const a = connection("A"), b = connection("B");
  assert.notEqual(physicalClusterKey(a), physicalClusterKey(b));
  a.identity = b.identity = { confidence: "verified", clusterUID: "physical" };
  assert.equal(physicalClusterKey(a), physicalClusterKey(b));
  assert.notEqual(harborScopeKey(workspace([]), harbor("a", "A"), a), harborScopeKey(workspace([]), harbor("b", "B"), b));
  const registry = new WorkspaceRegistry("unit-tab-id", fakeCore);
  registry.configure(workspace([harbor("a"), harbor("b", "B")], [a, b]));
  assert.equal(registry.cores.size, 2); registry.dispose();
});
test("overcapacity preflight opens nothing and preserves the existing active canonical registry", () => {
  let opened = 0;
  const registry = new WorkspaceRegistry("unit-tab-id", (scope) => { const core = fakeCore(scope); core.start = () => ++opened; return core; });
  registry.configure(workspace([harbor("current")]));
  const existing = registry.sessions.get("current"), before = opened;
  const harbors = Array.from({ length: 100 }, (_, i) => ({ ...harbor(`oversized-${i}`), selector: `slot=${i}` }));
  assert.throws(() => registry.configure(workspace(harbors)), /64 farklı/);
  assert.equal(opened, before); assert.equal(registry.sessions.get("current"), existing); assert.equal(registry.cores.size, 1);
  registry.dispose();
});
test("physical resource union deduplicates allowed overlap but separates namespaces and clusters", () => {
  const a = connection("A"), b = connection("B"); a.identity = b.identity = { confidence: "verified", clusterUID: "physical" };
  const harbors = [harbor("one"), harbor("two", "B")], snapshots = new Map(harbors.map((h) => [h.id, { resources: { same: pod() } }]));
  const union = sharedResources(harbors, snapshots, [a, b]);
  assert.equal(union.physical.size, 1); assert.deepEqual([...union.membership.values()][0], ["one", "two"]);
  b.identity = { confidence: "verified", clusterUID: "other" };
  assert.equal(sharedResources(harbors, snapshots, [a, b]).physical.size, 2);
  assert.notEqual(canonicalResourceKey(a, pod()), canonicalResourceKey(a, { ...pod(), metadata: { ...pod().metadata, namespace: "beta" } }));
});
test("A to B to A rejects the delayed old response over 50 transitions and pins each request URL", async () => {
  const oldWindow = globalThis.window, oldFetch = globalThis.fetch;
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  const calls = [];
  globalThis.fetch = (url, options) => new Promise((resolve) => calls.push({ url, options, resolve }));
  const registry = new WorkspaceRegistry("unit-tab-id", fakeCore);
  try {
    registry.configure(workspace([harbor("a"), harbor("b", "B")], [connection(), connection("B")]));
    const a = registry.sessions.get("a"), b = registry.sessions.get("b");
    // Isolate request lifecycle from diagnostics; no synthetic network success claim.
    a.refreshConnection = b.refreshConnection = () => {};
    registry.activate("a"); a.publish({ connectionChecks: { connectionID: "nonce-a" } });
    const pending = a.request("/api/resources?namespace=alpha"), rejected = assert.rejects(pending, /önceki oturum/);
    assert.equal(calls[0].url.searchParams.get("workspaceId"), "workspace-unit");
    assert.equal(calls[0].url.searchParams.get("harborId"), "a"); assert.equal(calls[0].url.searchParams.get("tabId"), "unit-tab-id");
    for (let i = 0; i < 50; i++) registry.activate(i % 2 ? "a" : "b");
    assert.equal(calls[0].options.signal.aborted, true);
    calls[0].resolve(new Response(JSON.stringify({ items: [pod("old")] }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await rejected;
    const current = a.request("/api/resources"), accepted = { items: [pod("current")] };
    calls[1].resolve(new Response(JSON.stringify(accepted), { headers: { "Content-Type": "application/json" } }));
    assert.deepEqual(await current, accepted);
    a.deactivate(); assert.equal(a.requests.size, 0);
  } finally { registry.dispose(); globalThis.fetch = oldFetch; globalThis.window = oldWindow; }
});
test("OUT_OF_SCOPE removes membership without a delete tombstone or fake deletion status", () => {
  const state = reduceMessage(initialState("unit"), { type: "SNAPSHOT", generation: "g", resources: [pod()] });
  const next = reduceMessage(state, { type: "RESOURCE_EVENT", generation: "g", action: "OUT_OF_SCOPE", object: pod() });
  assert.equal(next.resources.same, undefined); assert.equal(next.tombstones.same, undefined);
  assert.equal(resourceObservation(next, pod()).deleted, false); assert.equal(resourceObservation(next, pod()).status, "out-of-scope");
});
test("view persistence excludes Secret, raw resources, drafts and grants and stays bounded", () => {
  const safe = safeHarborView({ camera: { position: [1, 2, 3], target: [0, 0, 0] }, selection: { uid: "secret", kind: "Secret", data: "sentinel" }, draft: "sentinel", connectionID: "sentinel", tab: "yaml" });
  assert.doesNotMatch(JSON.stringify(safe), /sentinel|secret|connectionID|draft/);
  assert.deepEqual(safe.camera.position, [1, 2, 3]);
  const cache = new HarborViewCache(3); for (let i = 0; i < 50; i++) cache.set(String(i), { search: `harbor${i}` });
  assert.equal(cache.views.size, 3); assert.equal(cache.get("0"), undefined);
});
test("tab authority is per document even when window.open clones sessionStorage", () => {
  const makeStore = () => { const data = new Map(); return { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) }; };
  const a = makeStore(), documentA = {}, documentB = {};
  a.setItem("kubeview-tab-id", "copied-opener-id");
  assert.equal(browserTabId(a, () => "unit-tab-a", documentA), "unit-tab-a");
  assert.equal(browserTabId(a, () => "ignored", documentA), "unit-tab-a");
  assert.equal(browserTabId(a, () => "unit-tab-b", documentB), "unit-tab-b");
});
test("normal create flow uses server-generated connection and harbor IDs from direct documents", async () => {
  let record = workspace([]), calls = [];
  const controller = { record, async mutate(route, options) {
    calls.push({ route, options });
    if (route.endsWith("/connections")) {
      assert.equal(options.body.connection.id, undefined);
      record = { ...record, connections: [...record.connections, { ...options.body.connection, id: "server-connection", bound: true }] };
    } else {
      assert.equal(options.body.harbor.id, undefined);
      assert.equal(options.body.harbor.connectionRef, "server-connection");
      record = { ...record, harbors: [{ ...options.body.harbor, id: "server-harbor" }] };
    }
    return record;
  } };
  const saved = await saveHarborConfiguration(controller, { id: "client-draft-only", name: "Project", connectionRef: "__new__", context: "trusted-context", namespaces: "alpha, beta", selector: "app=web", environment: "test", color: "#123456", position: [0, 0] });
  assert.equal(saved.harbor.id, "server-harbor"); assert.equal(calls.length, 2); assert.deepEqual(saved.harbor.namespaces, ["alpha", "beta"]);
});
test("latest diagnostic identity enables shared Node membership and credential rotation clears once", async () => {
  let resets = 0;
  const registry = new WorkspaceRegistry("unit-tab-id", (scope) => {
    const core = fakeCore(scope);
    core.selectSource = () => { ++resets; ++core.epoch; core.state = { ...core.state, resources: {}, connectionChecks: null }; core.listeners.forEach((listener) => listener()); };
    return core;
  });
  try {
    const config = workspace([harbor("one"), harbor("two")]); registry.configure(config);
    const core = [...registry.cores.values()][0];
    core.state.connectionChecks = { identity: { confidence: "verified", clusterUID: "live-cluster" }, credentialGeneration: "first", authorizationKey: "safe-first" };
    core.listeners.forEach((listener) => listener());
    assert.equal(registry.connections(config.connections)[0].identity.clusterUID, "live-cluster"); assert.equal(resets, 0);
    core.state.connectionChecks = { ...core.state.connectionChecks, credentialGeneration: "second", authorizationKey: "safe-second" };
    core.listeners.forEach((listener) => listener()); await Promise.resolve();
    assert.equal(resets, 1); assert.equal(Object.keys(core.state.resources).length, 0);
    core.listeners.forEach((listener) => listener()); await Promise.resolve(); assert.equal(resets, 1);
  } finally { registry.dispose(); }
});
test("workspace socket rejects foreign workspace/tab/harbor envelopes and prior session messages", () => {
  const priorWindow = globalThis.window, priorSocket = globalThis.WebSocket, sockets = [];
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.WebSocket = class { constructor(url) { this.url = url; sockets.push(this); } close() {} };
  const manager = createSourceManager({ workspaceId: "w", harborId: "h", tabId: "t", scopeKey: "scope", context: "A", namespaces: ["alpha"], bound: true });
  try {
    manager.connect(); const socket = sockets[0];
    const envelope = { type: "SNAPSHOT", generation: "g", workspaceId: "w", harborId: "h", tabId: "t", sessionGeneration: "s", resources: [pod("current")] };
    socket.onmessage({ data: JSON.stringify({ ...envelope, harborId: "foreign" }) }); assert.equal(Object.keys(manager.state.resources).length, 0);
    socket.onmessage({ data: JSON.stringify(envelope) }); assert.ok(manager.state.resources.current);
    socket.onmessage({ data: JSON.stringify({ ...envelope, type: "RESOURCE_EVENT", action: "ADD", object: pod("old"), sessionGeneration: "old" }) }); assert.equal(manager.state.resources.old, undefined);
    socket.onmessage({ data: JSON.stringify({ ...envelope, type: "RESOURCE_EVENT", action: "ADD", object: pod("new") }) }); assert.ok(manager.state.resources.new);
    assert.equal(new URL(socket.url).searchParams.get("harborId"), "h");
  } finally { manager.cleanup(); globalThis.window = priorWindow; globalThis.WebSocket = priorSocket; }
});
test("interharbor endpoint anchors require explicit authorized same-credential membership", () => {
  const c = connection(), other = connection("other"); c.identity = other.identity = { confidence: "verified", clusterUID: "same-physical" };
  const config = workspace([harbor("a"), { ...harbor("b"), namespaces: ["beta"], position: [1300, 0] }, harbor("foreign", "other")], [c, other]);
  const beta = { ...pod("beta"), metadata: { ...pod("beta").metadata, namespace: "beta" } };
  const snapshots = new Map([["a", { resources: { same: pod() } }], ["b", { resources: { beta } }], ["foreign", { resources: { forbidden: pod("forbidden") } }]]);
  assert.deepEqual(authorizedFlowHarbors(config, "a"), ["a", "b"]);
  assert.equal(flowHarborEndpoints(config, "a", snapshots, [c, other], ["a"]).has("beta"), false);
  const endpoints = flowHarborEndpoints(config, "a", snapshots, [c, other], ["a", "b", "foreign"]);
  assert.equal(endpoints.get("beta").harborId, "b"); assert.deepEqual(endpoints.get("beta").position, [1300, 0]); assert.equal(endpoints.has("forbidden"), false);
  c.identity = { confidence: "unknown" }; assert.equal(flowHarborEndpoints(config, "a", snapshots, [c, other], ["a", "b"]).size, 0);
});
test("multi-namespace authority remains the harbor union while the local beta filter changes", async () => {
  const priorWindow = globalThis.window, priorFetch = globalThis.fetch, calls = [];
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: new URL(url), options });
    return new Response(JSON.stringify({ connectionID: "current", managementEnabled: options.method === "POST", readOnly: options.method !== "POST" }), { headers: { "Content-Type": "application/json" } });
  };
  const registry = new WorkspaceRegistry("unit-tab-id", fakeCore);
  try {
    registry.configure(workspace([{ ...harbor("union"), namespaces: ["alpha", "beta"] }]));
    const session = registry.sessions.get("union"); session.active = true;
    session.overlay.activeNamespace = "beta";
    await session.refreshConnection();
    assert.equal(calls[0].url.searchParams.get("namespace"), "");
    await session.setManagement(true);
    const enable = calls.find((call) => call.options.method === "POST" && JSON.parse(call.options.body).enabled);
    assert.equal(JSON.parse(enable.options.body).namespace, "");
    await session.resetManagement();
    const revoke = calls.find((call) => call.options.method === "POST" && !JSON.parse(call.options.body).enabled);
    assert.equal(JSON.parse(revoke.options.body).namespace, "");
    assert.equal(session.state.activeNamespace, "beta");
    assert.equal(session.core.socketSerial, 1, "diagnostic and grant changes never reconnect themselves");
  } finally { registry.dispose(); globalThis.window = priorWindow; globalThis.fetch = priorFetch; }
});
test("harbor view restores only an allowed local filter and defaults union views to all", () => {
  const union = { namespaces: ["bench-0", "bench-1", "bench-2", "bench-3"] };
  assert.equal(harborViewNamespace(union), "all");
  assert.equal(harborViewNamespace(union, "bench-2"), "bench-2");
  assert.equal(harborViewNamespace(union, "outside"), "all");
  assert.equal(harborViewNamespace({ namespaces: ["*"] }), "all");
  assert.equal(harborViewNamespace({ namespaces: ["bench-2"] }, "bench-0"), "bench-2");
});
test("real canonical managers ignore context namespace hints for union scopes across socket and session diagnostics", async () => {
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch, WebSocket: globalThis.WebSocket,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  const calls = [], sockets = [], timeouts = new Set(), intervals = new Set();
  globalThis.setTimeout = (callback, delay) => { const timer = previous.setTimeout(() => { timeouts.delete(timer); callback(); }, delay); timeouts.add(timer); return timer; };
  globalThis.clearTimeout = (timer) => { timeouts.delete(timer); previous.clearTimeout(timer); };
  globalThis.setInterval = (callback, delay) => { const timer = previous.setInterval(callback, delay); intervals.add(timer); return timer; };
  globalThis.clearInterval = (timer) => { intervals.delete(timer); previous.clearInterval(timer); };
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  globalThis.document = { hidden: false };
  globalThis.WebSocket = class {
    constructor(url) { this.url = new URL(url); sockets.push(this); }
    close() { this.closed = true; }
  };
  globalThis.fetch = async (url, options = {}) => {
    const address = new URL(url, window.location.origin);
    calls.push({ url: address, options });
    const data = address.pathname === "/api/management"
      ? { managementEnabled: JSON.parse(options.body).enabled, readOnly: !JSON.parse(options.body).enabled }
      : address.pathname === "/api/connection"
        ? { connectionID: "unit-current", readOnly: true, managementAvailable: true }
        : address.pathname === "/api/discovery" ? { resources: [] } : { available: false };
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
  };
  const instances = [];
  try {
    for (const namespaces of [["bench-0", "bench-1", "bench-2", "bench-3"], ["*"], ["bench-2"]]) {
      const firstCall = calls.length, firstSocket = sockets.length;
      const scope = { workspaceId: "workspace-unit", harborId: "union", tabId: "unit-tab-id", scopeKey: JSON.stringify(namespaces),
        context: "same-context", bound: true, namespaces, contexts: [{ name: "same-context", namespace: "bench-0" }] };
      const core = createSourceManager(scope), session = new HarborSession(core, scope);
      instances.push({ core, session }); core.start();
      const expected = namespaces.length === 1 && namespaces[0] !== "*" ? namespaces[0] : "";
      assert.equal(core.state.activeNamespace, expected || "all", "canonical scope is the configured harbor, never the context hint");
      await core.managementReset;
      await new Promise((resolve) => setImmediate(resolve));
      session.activate();
      const socket = sockets[firstSocket]; assert.ok(socket, "real selectSource opened its canonical socket");
      assert.equal(socket.url.searchParams.get("namespace"), expected);
      socket.onopen();
      await core.refreshConnection(); await session.refreshConnection();
      const fixtures = Array.from({ length: 300 }, (_, index) => ({ ...pod(`unit-pod-${index}`), metadata: { ...pod().metadata, uid: `unit-pod-${index}`, name: `unit-pod-${index}`, namespace: `bench-${index % 4}` } }));
      socket.onmessage({ data: JSON.stringify({ type: "SNAPSHOT", generation: "unit-generation", workspaceId: scope.workspaceId, harborId: "union", tabId: "unit-tab-id", sessionGeneration: "unit-session", resources: expected ? fixtures.filter((item) => item.metadata.namespace === expected) : fixtures }) });
      assert.equal(core.state.snapshotReady, true); assert.equal(core.state.stale, false);
      assert.equal(Object.keys(core.state.resources).length, expected ? 75 : 300, "nonempty current snapshot is actually accepted");
      session.observeNamespace(expected || "bench-1");
      await session.setManagement(true); await session.resetManagement(); await core.refreshConnection();
      assert.equal(core.state.activeNamespace, expected || "all");
      assert.equal(session.state.activeNamespace, expected || "bench-1");
      for (const call of calls.slice(firstCall)) {
        if (call.url.pathname === "/api/connection") assert.equal(call.url.searchParams.get("namespace"), expected);
        if (call.url.pathname === "/api/management") assert.equal(JSON.parse(call.options.body).namespace, expected);
      }
      assert.equal(sockets.length, firstSocket + 1, "local filter and diagnostic refresh cannot cycle the canonical socket");
      session.dispose(); core.cleanup(); await core.managementReset;
      assert.equal(socket.closed, true); assert.equal(core.requests.size, 0); assert.equal(core.listeners.size, 0);
      assert.equal(session.listeners.size, 0); assert.equal(session.streamListeners.size, 0);
      assert.equal(timeouts.size, 0); assert.equal(intervals.size, 0);
    }
  } finally {
    for (const { core, session } of instances) { session.dispose(); core.cleanup(); await core.managementReset; }
    timeouts.forEach(previous.clearTimeout); intervals.forEach(previous.clearInterval);
    Object.assign(globalThis, previous);
  }
});
test("two per-harbor UID pins survive marker eviction without masking real DELETE, reentry or a new source", () => {
  const previous = { window: globalThis.window, WebSocket: globalThis.WebSocket };
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  let socket;
  globalThis.WebSocket = class { constructor() { socket = this; } close() {} };
  const scope = { workspaceId: "w", harborId: "h", tabId: "t", scopeKey: "unit-pinned", context: "A", namespaces: ["alpha"], bound: true };
  const core = createSourceManager(scope), session = new HarborSession(core, scope), selected = pod("selected");
  const receive = (message) => socket.onmessage({ data: JSON.stringify({ workspaceId: "w", harborId: "h", tabId: "t", sessionGeneration: "unit-session", generation: "unit-generation", ...message }) });
  try {
    core.connect(); core.publish({ isConnected: true });
    receive({ type: "SNAPSHOT", resources: [selected] });
    session.active = true;
    session.setObservationPin?.("selection", selected.metadata.uid);
    session.setObservationPin?.("form", "form-target");
    session.deactivate();
    const exits = [selected, ...Array.from({ length: 1001 }, (_, index) => ({ ...pod(`exit-${index}`), metadata: { ...pod().metadata, uid: `exit-${index}`, name: `exit-${index}` } }))];
    receive({ type: "SNAPSHOT", resources: [], outOfScope: exits });
    assert.equal(resourceObservation(core.state, selected).deleted, false, "evicting ordinary markers cannot manufacture deletion of the pinned selection");
    assert.equal(resourceObservation(core.state, selected).status, "out-of-scope");
    assert.ok(Object.keys(core.state.outOfScope).length <= 1002, "ordinary history remains bounded in addition to two pins");
    assert.equal(typeof session.setObservationPin, "function");
    receive({ type: "RESOURCE_EVENT", action: "DELETE", object: selected });
    assert.equal(resourceObservation(core.state, selected).deleted, true);
    assert.equal(core.state.outOfScope.selected, undefined);
    receive({ type: "RESOURCE_EVENT", action: "ADD", object: selected });
    assert.equal(resourceObservation(core.state, selected).deleted, false); assert.ok(core.state.resources.selected);
    assert.equal(core.state.outOfScope.selected, undefined);
    for (let index = 0; index < 50; index++) session.setObservationPin("selection", `next-selection-${index}`);
    assert.equal(session.observationPins.size, 2); assert.equal(core.observationPins.size, 2);
    core.cleanup(); core.publish({ ...initialState("new-source"), configured: false });
    assert.equal(core.observationPins.size, 0); assert.equal(session.observationPins.size, 0);
    session.dispose(); assert.equal(core.listeners.size, 0);
  } finally { session.dispose(); core.cleanup(); Object.assign(globalThis, previous); }
});
test("a new canonical metrics sample refreshes the active local view without adding polling or requests", async () => {
  const previous = { window: globalThis.window, fetch: globalThis.fetch }, calls = [];
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  const sample = (time, cpu) => ({ available: true, source: "synthetic-unit", timestamp: `2026-11-09T00:00:0${time}Z`,
    nodes: [{ metadata: { name: "node" }, usage: { cpu: `${cpu}m` } }],
    pods: [{ metadata: { name: "alpha", namespace: "alpha" } }, { metadata: { name: "beta", namespace: "beta" }, containers: [{ name: "app", usage: { cpu: `${cpu}m` } }] }] });
  let pendingResponse = null;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: new URL(url), options });
    if (pendingResponse) return pendingResponse;
    return new Response(JSON.stringify(sample(0, 1)), { headers: { "Content-Type": "application/json" } });
  };
  const scope = { workspaceId: "w", harborId: "h", tabId: "t", scopeKey: "metrics-scope", context: "A", namespaces: ["alpha", "beta"], bound: true };
  const core = createSourceManager(scope), session = new HarborSession(core, scope);
  try {
    session.active = true; session.overlay.activeNamespace = "beta"; session.lastStream = session.streamSession().key;
    await session.refreshMetrics();
    const before = calls.length, next = sample(1, 2);
    core.publish({ metrics: next, metricHistory: [next] });
    assert.equal(session.state.metrics.timestamp, next.timestamp, "old namespace overlay cannot mask a newer canonical sample");
    assert.deepEqual(session.state.metrics.pods.map((item) => item.metadata.namespace), ["beta"]);
    assert.equal(session.state.metrics.nodes, next.nodes); assert.equal(core.state.metrics, next);
    assert.equal(session.state.metricHistory.at(-1).timestamp, next.timestamp);
    assert.equal(calls.length, before, "complete authorized core samples need no duplicate HTTP request");
    let resolveOld;
    pendingResponse = new Promise((resolve) => { resolveOld = resolve; });
    const oldRequest = session.refreshMetrics(), oldCall = calls.at(-1), latest = sample(2, 3);
    core.publish({ metrics: latest, metricHistory: [next, latest] });
    assert.equal(oldCall.options.signal.aborted, true, "new core data invalidates an older local sample in flight");
    resolveOld(new Response(JSON.stringify(sample(0, 1)), { headers: { "Content-Type": "application/json" } })); await oldRequest;
    assert.equal(session.state.metrics.timestamp, latest.timestamp);
    let resolvePartial;
    pendingResponse = new Promise((resolve) => { resolvePartial = resolve; });
    const partialCount = calls.length, partial = { ...sample(3, 4), pods: [], errors: { pods: "synthetic partial union permission" } };
    core.publish({ metrics: partial, metricHistory: [latest, partial] });
    assert.equal(calls.length, partialCount + 1, "an incomplete union Pod sample may refresh only its active local namespace");
    assert.equal(calls.at(-1).url.searchParams.get("namespace"), "beta");
    resolvePartial(new Response(JSON.stringify({ ...sample(3, 4), pods: [sample(3, 4).pods[1]] }), { headers: { "Content-Type": "application/json" } }));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(session.state.metrics.timestamp, partial.timestamp); assert.equal(session.state.metrics.errors, undefined);
    const inactiveCount = calls.length;
    session.deactivate(); const inactive = sample(4, 5); core.publish({ metrics: inactive, metricHistory: [partial, inactive] });
    assert.equal(calls.length, inactiveCount, "inactive harbors never start local refresh requests");
    session.dispose(); core.cleanup(); assert.equal(core.listeners.size, 0); assert.equal(session.requests.size, 0);
  } finally { session.dispose(); core.cleanup(); Object.assign(globalThis, previous); }
});
test("offline selector exit snapshot cannot create authoritative-absence tombstones and reentry is live", () => {
  const first = reduceMessage(initialState("unit"), { type: "SNAPSHOT", generation: "first", resources: [pod()] });
  const next = reduceMessage(first, { type: "SNAPSHOT", generation: "reconnect", resources: [], outOfScope: [pod()] });
  assert.equal(next.resources.same, undefined); assert.equal(next.tombstones.same, undefined); assert.equal(resourceObservation(next, pod()).deleted, false);
  const again = reduceMessage(next, { type: "SNAPSHOT", generation: "reentry", resources: [pod()] });
  assert.equal(again.outOfScope.same, undefined); assert.equal(resourceObservation(again, pod()).deleted, false);
});
test("configured declarations never manufacture infrastructure proof or measured traffic", () => {
  const a = connection(), config = workspace([harbor("a"), harbor("b")]);
  config.relations = [{ id: "declared", type: "infrastructure", origin: "imported", sourceHarbor: "a", targetHarbor: "b" }];
  const unknown = workspaceRelations(config, new Map(), [a]);
  assert.equal(unknown[0].type, "configured"); assert.equal(unknown[0].origin, "user-configured");
  a.identity = { confidence: "verified", clusterUID: "actual-cluster" };
  const node = { apiVersion: "v1", kind: "Node", metadata: { uid: "node", name: "node" } }, map = { node };
  const snapshots = new Map([["a", { resources: map }], ["b", { resources: map }]]);
  const observed = workspaceRelations(config, snapshots, [a]);
  assert.ok(observed.some((relation) => relation.type === "infrastructure" && relation.origin === "verified-shared-node"));
  assert.ok(observed.every((relation) => relation.type !== "measured"));
});
test("observed Service/EndpointSlice relation requires exact authorized Pod UID and verified cluster", () => {
  const a = connection(); a.identity = { confidence: "verified", clusterUID: "actual-cluster" };
  const config = workspace([harbor("a"), { ...harbor("b"), namespaces: ["beta"] }]);
  const service = { apiVersion: "v1", kind: "Service", metadata: { name: "service", namespace: "alpha", uid: "service" } };
  const slice = { apiVersion: "discovery.k8s.io/v1", kind: "EndpointSlice", metadata: { name: "slice", namespace: "alpha", uid: "slice", labels: { "kubernetes.io/service-name": "service" } }, endpoints: [{ targetRef: { kind: "Pod", uid: "beta-pod", namespace: "beta" } }] };
  const target = { ...pod("beta-pod"), metadata: { ...pod("beta-pod").metadata, namespace: "beta" } };
  const snapshots = new Map([["a", { resources: { service, slice } }], ["b", { resources: { target } }]]);
  const rows = workspaceRelations(config, snapshots, [a]);
  assert.ok(rows.some((row) => row.origin === "observed-endpointslice" && row.sourceHarbor === "a" && row.targetHarbor === "b"));
  delete snapshots.get("b").resources.target;
  assert.ok(workspaceRelations(config, snapshots, [a]).every((row) => row.origin !== "observed-endpointslice"));
});
test("new harbor placement fills a free stable slot after removing an intermediate harbor", () => {
  assert.deepEqual(nextHarborPosition([{ ...harbor("a"), position: [0, 0] }, { ...harbor("c"), position: [2600, 0] }]), [1300, 0]);
});
test("accepted detached mutation remains on its original harbor without retry or Secret values", async () => {
  const priorWindow = globalThis.window, priorFetch = globalThis.fetch, calls = [];
  globalThis.window = { location: { origin: "http://localhost:8000" } };
  let resolve;
  globalThis.fetch = (url, options) => { calls.push({ url, options }); return new Promise((done) => { resolve = done; }); };
  const registry = new WorkspaceRegistry("unit-tab-id", fakeCore);
  try {
    registry.configure(workspace([harbor("a"), harbor("b")]));
    const a = registry.sessions.get("a"), b = registry.sessions.get("b");
    a.refreshConnection = b.refreshConnection = () => {};
    registry.activate("a");
    const pending = a.request("/api/resources?resource=secrets&namespace=alpha&name=config", { method: "PUT", body: { uid: "secret", resourceVersion: "unit-rv" } });
    const rejected = assert.rejects(pending, /önceki oturum/);
    registry.activate("b");
    assert.equal(calls[0].options.signal.aborted, true);
    resolve(new Response(JSON.stringify({ object: { apiVersion: "v1", kind: "Secret", metadata: { uid: "secret", name: "config", namespace: "alpha" }, data: { value: "SYNTHETIC_DO_NOT_RETAIN" } }, operation: { id: "accepted-original-a", status: "accepted" } }), { headers: { "Content-Type": "application/json" } }));
    await rejected;
    assert.equal(calls.length, 1); assert.equal(b.state.detachedOperations.length, 0);
    assert.equal(a.state.detachedOperations[0].harborId, "a"); assert.equal(a.state.detachedOperations[0].operationId, "accepted-original-a");
    assert.equal(a.state.detachedOperations[0].status, "accepted"); assert.doesNotMatch(JSON.stringify(a.state.detachedOperations), /SYNTHETIC_DO_NOT_RETAIN|data|annotations/);
  } finally { registry.dispose(); globalThis.window = priorWindow; globalThis.fetch = priorFetch; }
});
