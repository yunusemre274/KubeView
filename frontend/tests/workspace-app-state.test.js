import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { buildResourceIndex } from "../src/data/resourceIndex.js";
import { resourceObservation } from "../src/data/resourceScopes.js";
import { initialState } from "../src/data/resourceStore.js";

// Synthetic state inputs exercise App's actual hooks and event handlers. Child
// elements are inspected without mounting a renderer or claiming 3D/UI evidence.
const compiled = await build({ stdin: { contents: 'export { default as App } from "../src/App.jsx"; export { default as Details } from "../src/workbench/ResourceDetails.jsx"; export { default as React } from "react";', resolveDir: new URL(".", import.meta.url).pathname },
  bundle: true, platform: "node", format: "esm", write: false, loader: { ".css": "empty" },
  banner: { js: `import { createRequire } from "node:module"; const require = createRequire(${JSON.stringify(import.meta.url)});` },
  define: { "import.meta.env.DEV": "false", "import.meta.env.VITE_REACT_PROFILE": '"0"', "process.env.NODE_ENV": '"production"' } });
const { App, Details, React } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;
const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const nodes = (tree) => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === "object" ? [tree, ...nodes(tree.props?.children)] : [];
const content = (tree) => Array.isArray(tree) ? tree.map(content).join("") : tree && typeof tree === "object" ? content(tree.props?.children) : tree == null || typeof tree === "boolean" ? "" : String(tree);
const pod = (uid = "old-uid") => ({ apiVersion: "v1", kind: "Pod", metadata: { uid, name: "same-name", namespace: "alpha", resourceVersion: "opaque" }, spec: { containers: [{ name: "app" }] }, status: { phase: "Running" } });
function workspace(id = "a", selection = { uid: "old-uid", kind: "Pod", namespace: "alpha", containerName: "app" }) {
  const harbor = { id, name: id, connectionRef: "connection", namespaces: ["alpha"], view: { selection, tab: "yaml" } };
  const connections = [{ id: "connection", bound: true, context: "unit", identity: { confidence: "verified", clusterUID: "unit-cluster" } }];
  return { activeId: id, activeHarbor: harbor, view: harbor.view,
    record: { id: "workspace", harbors: [harbor], connections, relations: [] },
    registry: { snapshots: () => new Map(), connections: (records) => records }, getView: () => harbor.view,
    saveView() {}, persistView: async () => {}, selectHarbor() {} };
}
function connection(patch = {}) {
  const state = { ...initialState("empty"), configured: true, context: "unit", mode: "live", discovery: [], readOnly: true, ...patch };
  const resources = patch.resources || [];
  return { ...state, resources, resourceIndex: buildResourceIndex(resources, null, state.sourceKey),
    api: { context: "unit", mode: "live", request: async () => ({}), streamSession: () => ({ key: state.sourceKey, ready: false }), subscribeStreamSession: () => () => {} },
    observeNamespace() {}, retainKind: patch.retainKind || (() => () => {}), resourceObservation: (resource) => resourceObservation({ ...state, resources: Object.fromEntries(resources.map((item) => [item.metadata.uid, item])) }, resource),
  };
}
function environment() {
  const previous = Object.fromEntries(["window", "document", "matchMedia", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "localStorage"].map((key) => [key, globalThis[key]]));
  const timers = new Map(), frames = new Map(), listeners = new Set(); let next = 0;
  const add = (type, listener) => listeners.add(listener), remove = (type, listener) => listeners.delete(listener);
  globalThis.window = { innerWidth: 1440, location: { origin: "http://unit.invalid", href: "http://unit.invalid/" }, addEventListener: add, removeEventListener: remove };
  globalThis.document = { activeElement: null, documentElement: { dataset: {} }, querySelector: () => null, getElementById: () => null, addEventListener: add, removeEventListener: remove };
  globalThis.matchMedia = () => ({ matches: false, addEventListener: add, removeEventListener: remove });
  globalThis.localStorage = { getItem: () => "seen", setItem() {} };
  globalThis.setTimeout = globalThis.setInterval = (callback) => { const id = ++next; timers.set(id, callback); return id; };
  globalThis.clearTimeout = globalThis.clearInterval = (id) => timers.delete(id);
  globalThis.requestAnimationFrame = (callback) => { const id = ++next; frames.set(id, callback); return id; };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  return { timers, frames, listeners, flushFrames() { const current = [...frames.values()]; frames.clear(); current.forEach((callback) => callback(0)); }, restore() { Object.assign(globalThis, previous); } };
}
function mount(initial, renderComponent = () => App()) {
  const hooks = []; let cursor, pending, changed, tree, current = initial, mounted = true, lateUpdates = 0;
  const memo = (factory, deps) => { const index = cursor++; if (!hooks[index] || !equal(hooks[index].deps, deps)) hooks[index] = { value: factory(), deps }; return hooks[index].value; };
  const effect = (setup, deps) => { const index = cursor++, old = hooks[index]; if (!old || !equal(old.deps, deps)) { const cell = { deps, cleanup: old?.cleanup }; hooks[index] = cell; pending.push(() => { cell.cleanup?.(); cell.cleanup = setup(); }); } };
  const implementation = { useContext: () => current,
    useRef(value) { const index = cursor++; return hooks[index] ||= { current: value }; },
    useState(initialValue) { const index = cursor++; hooks[index] ||= { value: typeof initialValue === "function" ? initialValue() : initialValue }; return [hooks[index].value, (update) => { if (!mounted) { ++lateUpdates; return; } const value = typeof update === "function" ? update(hooks[index].value) : update; if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; changed = true; } }]; },
    useMemo: memo, useCallback: (callback, deps) => memo(() => callback, deps), useEffect: effect, useLayoutEffect: effect };
  const render = (next = current) => {
    current = next; let passes = 0;
    do { assert.ok(++passes < 30, "component effects must settle"); cursor = 0; pending = []; changed = false; const before = dispatcher.current; dispatcher.current = implementation; try { tree = renderComponent(current); } finally { dispatcher.current = before; } pending.forEach((run) => run()); } while (changed);
    return tree;
  };
  render();
  return { render, get lateUpdates() { return lateUpdates; }, find: (predicate) => nodes(tree).find(predicate),
    details: () => nodes(tree).find((node) => node.props?.onSelectContainer && node.props?.resource),
    scene: () => nodes(tree).find((node) => node.props?.viewBridge && node.props?.onOpenFacility),
    facility: () => nodes(tree).find((node) => node.props?.onNamespace && node.props?.id),
    async settle() { for (let index = 0; index < 12; index++) await Promise.resolve(); if (mounted) render(); },
    unmount() { mounted = false; hooks.forEach((hook) => hook.cleanup?.()); } };
}
async function withApp(run, renderComponent) {
  const env = environment(), app = mount(connection(), renderComponent);
  try { await run(app); }
  finally {
    try { env.flushFrames(); app.unmount(); await app.settle(); assert.equal(app.lateUpdates, 0); assert.equal(env.timers.size, 0); assert.equal(env.frames.size, 0); assert.equal(env.listeners.size, 0); }
    finally { env.restore(); }
  }
}
const live = (view, resources, patch = {}) => connection({ workspace: view, sourceKey: `source:${view.activeId}`, resources, snapshotReady: true, stale: false, isConnected: true, upstream: true, ...patch });
test("a harbor switch never commits an old Pod panel with the new harbor API before layout restoration", async () => {
  const frames = [];
  await withApp(async (app) => {
    const a = workspace(), b = workspace("b", { uid: "beta-uid", kind: "Pod", namespace: "beta" });
    b.activeHarbor.namespaces = ["beta"];
    const beta = { ...pod("beta-uid"), metadata: { ...pod("beta-uid").metadata, namespace: "beta" } };
    app.render(live(a, [pod()])); app.details().props.onTabChange("logs"); app.render();
    app.render(live(b, [beta]));
    assert.equal(app.details()?.props.resource.metadata.uid, "beta-uid");
    assert.ok(!frames.some(frame => frame.source === "source:b" && frame.uid === "old-uid"),
      "even the render before layout restoration must not give A's Pod to B's API");
    app.render(live(a, [pod()]));
    assert.equal(app.details()?.props.resource.metadata.uid, "old-uid");
    assert.ok(!frames.some(frame => frame.source === "source:a" && frame.uid === "beta-uid"));
  }, (current) => {
    const tree = App(), details = nodes(tree).find(node => node.props?.onSelectContainer && node.props?.resource);
    if (details) frames.push({ source: current.sourceKey, uid: details.props.resource.metadata.uid });
    return tree;
  });
});
test("a harbor switch never gives a facility the old namespace and new connection together", async () => {
  const frames = [];
  await withApp(async (app) => {
    const a = workspace(), b = workspace("b", null); b.activeHarbor.namespaces = ["beta"];
    app.render(live(a, [pod()])); app.scene().props.onOpenFacility("center"); app.render();
    app.render(live(b, []));
    assert.ok(!frames.some(frame => frame.source === "source:b" && frame.namespace === "alpha"));
  }, (current) => {
    const tree = App(), facility = nodes(tree).find(node => node.props?.onNamespace && node.props?.id);
    if (facility) frames.push({ source: current.sourceKey, namespace: facility.props.namespace });
    return tree;
  });
});
test("switching namespaces never retains the previous Pod in the new harbor core", async () => withApp(async (app) => {
  const a = workspace(), b = workspace("b", { uid: "beta-uid", kind: "Pod", namespace: "beta" });
  b.activeHarbor.namespaces = ["beta"];
  const beta = { ...pod("beta-uid"), metadata: { ...pod("beta-uid").metadata, namespace: "beta" } };
  const descriptor = { group: "", version: "v1", resource: "pods", kind: "Pod", namespaced: true };
  const calls = [];
  app.render(live(a, [pod()], { discovery: [descriptor] }));
  app.render(live(b, [beta], { discovery: [descriptor], retainKind: (kind, namespace) => { calls.push(namespace); return () => {}; } }));
  assert.deepEqual(calls, ["beta"], "a passive effect from the previous render must not subscribe alpha on B");
  assert.equal(app.details()?.props.resource.metadata.uid, "beta-uid");
}));
test("closed log panel stays closed across warm harbor return while its UID highlight survives", async () => withApp(async (app) => {
  const a = workspace(), b = workspace("b", { uid: "other", kind: "Pod", namespace: "alpha" });
  app.render(live(a, [pod()])); app.details().props.onTabChange("logs"); app.render();
  app.details().props.onClose(); app.render();
  assert.equal(Boolean(app.details()), false); assert.equal(app.scene().props.selectedUID, "old-uid");
  app.render(live(b, [pod("other")])); app.render(live(a, [pod()]));
  assert.equal(app.scene().props.selectedUID, "old-uid", "closing the panel keeps its safe world selection highlight");
  assert.equal(Boolean(app.details()), false, "a harbor switch must not reopen a resource panel the user closed");
  app.scene().props.onSelect(pod()); app.render();
  assert.equal(app.details()?.props.resource.metadata.uid, "old-uid", "a new explicit inspect still opens the closed selection");
}));
test("closed log panel stays closed after a returning harbor's first fresh snapshot", async () => withApp(async (app) => {
  const a = workspace(), b = workspace("b", { uid: "other", kind: "Pod", namespace: "alpha" });
  app.render(live(a, [pod()])); app.details().props.onTabChange("logs"); app.render(); app.details().props.onClose(); app.render();
  app.render(live(b, [pod("other")])); app.render(live(a, [], { snapshotReady: false, stale: true }));
  assert.equal(Boolean(app.details()), false);
  app.render(live(a, [pod()]));
  assert.equal(app.scene().props.selectedUID, "old-uid");
  assert.equal(Boolean(app.details()), false, "delayed selection resolution must retain the closed-panel intent");
}));
test("cached facility remains open when a returning selection resolves after its snapshot", async () => withApp(async (app) => {
  const a = workspace(), b = workspace("b", { uid: "other", kind: "Pod", namespace: "alpha" });
  app.render(live(a, [pod()])); app.scene().props.onOpenFacility("center"); app.render();
  app.render(live(b, [pod("other")])); app.render(live(a, [], { snapshotReady: false, stale: true }));
  assert.equal(app.facility()?.props.id, "center"); app.render(live(a, [pod()]));
  assert.equal(app.facility()?.props.id, "center"); assert.equal(Boolean(app.details()), false); assert.equal(app.scene().props.selectedUID, "old-uid");
}));
test("an open safe dirty form and resource panel still restore together on harbor return", async () => withApp(async (app) => {
  const a = workspace(), b = workspace("b", { uid: "other", kind: "Pod", namespace: "alpha" });
  app.render(live(a, [pod()])); app.details().props.onAction("edit", pod()); app.render();
  const draft = { sourceKey: "source:a", uid: "old-uid", action: "edit", object: pod(), mode: "yaml", yamlText: "local unsent yaml", dirty: true };
  app.find((node) => node.props?.onSafeDraft)?.props.onSafeDraft(draft);
  app.render(live(b, [pod("other")])); app.render(live(a, [pod()]));
  assert.equal(app.details()?.props.resource.metadata.uid, "old-uid");
  const restoredForm = app.find((node) => node.props?.onSafeDraft);
  assert.equal(restoredForm?.props.resource.metadata.uid, "old-uid"); assert.equal(restoredForm?.props.restoredDraft, draft);
}));
test("cold persisted exact UID restores its panel once after the first current snapshot arrives", async () => withApp(async (app) => {
  const view = workspace();
  app.render(connection({ workspace: view, sourceKey: "source:a" })); assert.equal(app.details(), undefined);
  app.render(live(view, [pod()], { sessionRevision: "a:1" }));
  assert.equal(app.details()?.props.resource.metadata.uid, "old-uid");
  assert.equal(app.details()?.props.selectedContainerName, "app");
  assert.equal(app.details()?.props.resource.__tab, "yaml");
  const oldTabCallback = app.details().props.onTabChange;
  assert.equal(typeof oldTabCallback, "function", "App must receive normal UI tab changes");
  oldTabCallback("logs"); app.render(); assert.equal(app.details().props.resource.__tab, "logs");
  app.details().props.onClose(); app.render(); app.render(live(view, [pod()]));
  assert.equal(app.details(), undefined, "a later snapshot cannot reopen a panel the user closed");
  app.scene().props.onSelect(pod(), { containerName: "app" }); app.render(); app.details().props.onTabChange("logs"); app.render();
  const other = workspace("b", { uid: "other", kind: "Pod", namespace: "alpha" });
  app.render(live(other, [pod("other")], { sessionRevision: "b:1" }));
  oldTabCallback("terminal"); app.render(); assert.equal(app.details().props.resource.__tab, "yaml");
  app.render(live(view, [pod()], { sessionRevision: "a:2" }));
  oldTabCallback("terminal"); app.render(); assert.equal(app.details().props.resource.__tab, "logs", "an A-to-B-to-A callback cannot change the new A session");
}));
test("cold restore never follows a same-name replacement or overrides a newer user panel", async () => withApp(async (app) => {
  const a = workspace(); app.render(connection({ workspace: a, sourceKey: "source:a" }));
  app.render(live(a, [pod("replacement")])); assert.equal(app.details(), undefined);
  app.render(live(a, [pod()])); assert.equal(app.details(), undefined, "first current absence consumes the saved selection");
  const b = workspace("b"); app.render(connection({ workspace: b, sourceKey: "source:b" }));
  app.scene().props.onOpenFacility("center"); app.render();
  app.render(live(b, [pod()]));
  assert.equal(app.details(), undefined); assert.equal(app.facility()?.props.id, "center");
}));
test("empty onboarding has no last-known-view stale label, while a disconnected observed harbor does", async () => withApp(async (app) => {
  app.render(connection({ workspace: { activeHarbor: null, activeId: null, record: null }, sourceKey: "empty", stale: true }));
  assert.equal(app.scene().props.isStale, false);
  app.render(connection({ workspace: workspace(), sourceKey: "source:a", stale: true, lastUpdated: "2026-11-09T00:00:00Z" }));
  assert.equal(app.scene().props.isStale, true);
}));
test("resource tab handlers report normal tab clicks and container log routes to the parent", async () => {
  const env = environment(), tabs = [], containers = [];
  let component;
  const clickTab = (label) => {
    const nav = component.find((node) => node.props?.className === "details-tabs");
    nodes(nav).find((node) => node.type === "button" && content(node) === label).props.onClick(); component.render();
  };
  try {
    const DetailsComponent = Details.type || Details;
    component = mount({ resource: pod(), readOnly: true, resources: [pod()], onClose() {}, onTabChange: (tab) => tabs.push(tab), onSelectContainer: (name) => containers.push(name) }, (props) => DetailsComponent(props));
    clickTab("YAML"); assert.deepEqual(tabs, ["yaml"]);
    clickTab("Container’lar");
    component.find((node) => node.props?.onLogs && node.props?.onTerminal).props.onLogs("app"); component.render();
    assert.deepEqual(containers, ["app"]); assert.deepEqual(tabs, ["yaml", "containers", "logs"]);
    const nav = component.find((node) => node.props?.className === "details-tabs");
    assert.equal(nodes(nav).find((node) => node.type === "button" && content(node) === "Loglar").props["aria-current"], "page");
  } finally {
    try { component?.unmount(); await component?.settle(); assert.equal(component?.lateUpdates || 0, 0); assert.equal(env.timers.size, 0); assert.equal(env.listeners.size, 0); }
    finally { env.restore(); }
  }
});
