import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

// Exercise the actual app-root provider with React 18's dispatcher. Deferred
// transports deliberately ignore AbortSignal; guards must reject late results.
const compiled = await build({ stdin: { contents: 'export { default as Provider } from "../src/context/WorkspaceProvider.jsx"; export { default as React } from "react";', resolveDir: new URL(".", import.meta.url).pathname }, bundle: true, platform: "node", format: "esm", write: false, define: { "import.meta.env.DEV": "false", "process.env.NODE_ENV": '"production"' } });
const { Provider, React } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;
const equal = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
const reply = (value) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
const document = (id, harbors = []) => ({ schemaVersion: 1, id, revision: 1, name: "Synthetic bootstrap unit", connections: harbors.length ? [{ id: "connection", context: "unit", bound: true }] : [], harbors, preferences: {}, relations: [], workspaceNonce: "synthetic-workspace-nonce" });
function mount() {
  const hooks = []; let cursor, pending, changed, tree, live = true, lateUpdates = 0;
  const memo = (factory, deps) => { const index = cursor++; if (!hooks[index] || !equal(hooks[index].deps, deps)) hooks[index] = { value: factory(), deps }; return hooks[index].value; };
  const effect = (setup, deps) => { const index = cursor++, old = hooks[index]; if (!old || !equal(old.deps, deps)) { const cell = { setup, deps, cleanup: old?.cleanup }; hooks[index] = cell; pending.push(() => { cell.cleanup?.(); cell.cleanup = setup(); }); } };
  const implementation = {
    useRef(value) { const index = cursor++; return hooks[index] ||= { current: value }; },
    useState(initial) { const index = cursor++; hooks[index] ||= { value: typeof initial === "function" ? initial() : initial }; return [hooks[index].value, (update) => { if (!live) { ++lateUpdates; return; } const value = typeof update === "function" ? update(hooks[index].value) : update; if (!Object.is(value, hooks[index].value)) { hooks[index].value = value; changed = true; } }]; },
    useMemo: memo, useCallback: (callback, deps) => memo(() => callback, deps), useEffect: effect, useLayoutEffect: effect,
  };
  const render = () => {
    let passes = 0;
    do { assert.ok(++passes < 20, "bootstrap effects must settle"); cursor = 0; pending = []; changed = false; const old = dispatcher.current; dispatcher.current = implementation; try { tree = Provider({ children: null }); } finally { dispatcher.current = old; } pending.forEach((run) => run()); } while (changed);
    return tree;
  };
  render();
  return { get tree() { return tree; }, get lateUpdates() { return lateUpdates; }, render,
    replayStrictEffects() { for (const hook of hooks) if (hook.setup) { hook.cleanup?.(); hook.cleanup = hook.setup(); } render(); },
    async settle() { for (let index = 0; index < 12; index++) await Promise.resolve(); if (live) render(); },
    unmount() { live = false; hooks.forEach((hook) => hook.cleanup?.()); },
  };
}
function environment() {
  const previous = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  const calls = [], timers = new Map(); let nextTimer = 0;
  globalThis.window = { location: { origin: "http://unit.invalid" } };
  globalThis.document = {};
  globalThis.setTimeout = globalThis.setInterval = (callback) => { const id = ++nextTimer; timers.set(id, callback); return id; };
  globalThis.clearTimeout = globalThis.clearInterval = (id) => timers.delete(id);
  globalThis.fetch = (path, options) => { const waiting = deferred(); calls.push({ path, options, ...waiting }); return waiting.promise; };
  return { calls, timers, restore() { Object.assign(globalThis, previous); } };
}
test("unmount aborts actual provider bootstrap and an old nonempty workspace cannot reopen sources", async () => {
  const env = environment(), mounted = mount();
  const registry = mounted.tree.props.workspace.registry;
  try {
    assert.equal(env.calls.length, 2);
    mounted.unmount();
    assert.ok(env.calls.every((call) => call.options.signal.aborted));
    env.calls[0].resolve(reply(document("old", [{ id: "old-harbor", connectionRef: "connection", namespaces: ["alpha"], view: {} }])));
    env.calls[1].resolve(reply({ contexts: [{ name: "unit" }] }));
    await mounted.settle();
    assert.equal(env.calls.length, 2); assert.equal(registry.cores.size, 0); assert.equal(mounted.lateUpdates, 0); assert.equal(env.timers.size, 0);
  } finally { registry.dispose(); env.restore(); }
});
test("StrictMode effect replay rejects first bootstrap and current production bootstrap still applies", async () => {
  const env = environment(), mounted = mount();
  const registry = mounted.tree.props.workspace.registry;
  try {
    mounted.replayStrictEffects(); assert.equal(env.calls.length, 4);
    assert.ok(env.calls.slice(0, 2).every((call) => call.options.signal.aborted));
    env.calls[0].resolve(reply(document("old", [{ id: "old-harbor", connectionRef: "connection", namespaces: ["alpha"], view: {} }])));
    env.calls[1].resolve(reply({ contexts: [{ name: "unit" }] }));
    await mounted.settle(); assert.equal(mounted.tree.props.workspace.record, null); assert.equal(env.calls.length, 4);
    env.calls[2].resolve(reply(document("current"))); env.calls[3].resolve(reply({ contexts: [] }));
    await mounted.settle();
    assert.equal(mounted.tree.props.workspace.record.id, "current"); assert.equal(mounted.tree.props.workspace.loading, false);
    assert.equal(registry.cores.size, 0); assert.equal(env.timers.size, 0);
    mounted.unmount(); assert.equal(mounted.lateUpdates, 0);
  } finally { registry.dispose(); env.restore(); }
});
