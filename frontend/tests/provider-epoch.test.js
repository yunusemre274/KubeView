import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

// Synthetic unit evidence around the actual production hook. No real Hubble,
// browser, cluster, network request or wall-clock timer is used by this suite.
// The bundle is evaluated only when the root manager authorizes a test run.
const compiled = await build({
  stdin: {
    contents:
      'export { default as useWorldProviders } from "../src/world/useWorldProviders.js"; export { default as React } from "react";',
    resolveDir: new URL(".", import.meta.url).pathname,
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
const { useWorldProviders, React } = await import(
  `data:text/javascript;base64,${Buffer.from(`${compiled.outputFiles[0].text}\n//# sourceURL=provider-epoch-unit.js`).toString("base64")}`
);
const dispatcher =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    .ReactCurrentDispatcher;
const equalDeps = (left, right) =>
  left && right && left.length === right.length &&
  left.every((value, index) => Object.is(value, right[index]));
const microtasks = async () => {
  for (let index = 0; index < 8; ++index) await Promise.resolve();
};

function mountHook(initialProps) {
  const hooks = [];
  let props = initialProps, cursor, effects, changed, value;
  let mounted = true, lateUpdates = 0;
  function memo(factory, deps) {
    const index = cursor++;
    if (!hooks[index] || !equalDeps(hooks[index].deps, deps))
      hooks[index] = { value: factory(), deps };
    return hooks[index].value;
  }
  const hookDispatcher = {
    useState(initial) {
      const index = cursor++;
      if (!hooks[index])
        hooks[index] = { value: typeof initial === "function" ? initial() : initial };
      return [hooks[index].value, (update) => {
        if (!mounted) { ++lateUpdates; return; }
        const next = typeof update === "function" ? update(hooks[index].value) : update;
        if (!Object.is(next, hooks[index].value)) {
          hooks[index].value = next;
          changed = true;
        }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return hooks[index] ||= { current: initial };
    },
    useMemo: memo,
    useCallback(callback, deps) { return memo(() => callback, deps); },
    useEffect(setup, deps) {
      const index = cursor++, previous = hooks[index];
      if (!previous || !equalDeps(previous.deps, deps)) {
        const cell = { deps, cleanup: previous?.cleanup };
        hooks[index] = cell;
        effects.push({ cell, setup });
      }
    },
  };
  function render(patch = {}) {
    assert.equal(mounted, true, "a closed hook cannot be rerendered");
    props = { ...props, ...patch };
    let passes = 0;
    do {
      assert.ok(++passes < 30, "provider effects must settle without a render loop");
      cursor = 0; effects = []; changed = false;
      const previous = dispatcher.current;
      dispatcher.current = hookDispatcher;
      try { value = useWorldProviders(props); }
      finally { dispatcher.current = previous; }
      // React runs changed passive-effect cleanups before their new setups.
      effects.forEach(({ cell }) => cell.cleanup?.());
      effects.forEach(({ cell, setup }) => { cell.cleanup = setup(); });
    } while (changed);
    return value;
  }
  render();
  return {
    render,
    get value() { return value; },
    get lateUpdates() { return lateUpdates; },
    async settle() { await microtasks(); render(); await microtasks(); render(); },
    unmount() {
      if (!mounted) return;
      mounted = false;
      hooks.forEach(hook => hook.cleanup?.());
    },
  };
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
function createAPI(context, streamKey) {
  const listeners = new Set(), calls = [], urlCalls = [];
  const state = { active: true, session: { key: streamKey, ready: true } };
  const api = {
    request(rawPath, options = {}) {
      const waiting = deferred();
      const call = { path: rawPath, url: new URL(rawPath, "http://unit.invalid"), options, waiting, resolved: false };
      calls.push(call);
      // Deliberately ignore cancellation in this synthetic transport so the
      // real hook must reject a delayed response after its signal is aborted.
      return waiting.promise;
    },
    url(rawPath) {
      assert.equal(state.active, true, "cleanup must use its pinned URL, not call a superseded API.url");
      const url = new URL(rawPath, "http://unit.invalid");
      url.searchParams.set("context", context);
      urlCalls.push(url.toString());
      return url.toString();
    },
    streamSession: () => state.session,
    subscribeStreamSession(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  return {
    api, state, calls, listeners, urlCalls,
    flowCalls: () => calls.filter(call => call.url.pathname === "/api/flows"),
    statusCalls: () => calls.filter(call => call.url.pathname === "/api/providers"),
    resolve(call, result) {
      assert.ok(call, "the actual hook must issue a request");
      assert.equal(call.resolved, false, "each deferred response resolves once");
      call.resolved = true; call.waiting.resolve(result);
    },
    changeSession(key) { state.session = { key, ready: true }; listeners.forEach(listener => listener()); },
  };
}
const connection = (api, context, epoch = 1) => ({
  api: api.api, context, mode: "live", readOnly: true,
  sourceKey: `unit-live:${context}:${epoch}`,
});
const flowValue = (id, namespace, protocol = "TCP", leaseID = `lease-${id}`) => ({
  provider: "hubble", status: "live", leaseID, namespace,
  observedAt: "2026-11-09T00:00:00Z", updatedAt: "2026-11-09T00:00:00Z",
  units: "explicit synthetic unit fixture", windowSeconds: 10,
  flows: [{ id, source: { uid: `unit-source-${id}`, name: `source-${id}`, namespace },
    destination: { uid: `unit-destination-${id}`, name: `destination-${id}`, namespace },
    protocol, transportProtocol: protocol, eventCount: 3,
    firstObserved: "2026-11-09T00:00:00Z", lastObserved: "2026-11-09T00:00:00Z" }],
});
const statusValue = id => ({
  hubble: { configured: true, available: true, status: `unit-status-${id}` },
  minikube: { canAdd: false, operations: [{ id: `unit-operation-${id}`, status: "succeeded", nodeUID: `unit-node-${id}` }] },
});
function assertCurrentFlow(hook, id, namespace, protocol = "TCP") {
  assert.equal(hook.value.measuredFlows.status, "live");
  assert.equal(hook.value.measuredFlows.namespace, namespace);
  assert.deepEqual(hook.value.measuredFlows.flows.map(flow => ({
    id: flow.id, uid: flow.source.uid, protocol: flow.protocol,
    transport: flow.transportProtocol,
  })), [{ id, uid: `unit-source-${id}`, protocol, transport: protocol }]);
}

function environment() {
  const original = { window: globalThis.window, fetch: globalThis.fetch,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  const timers = new Map(), cleared = [], deletes = [], apis = [];
  let timerSequence = 0, hook;
  globalThis.window = { location: { href: "http://unit.invalid/", origin: "http://unit.invalid" } };
  globalThis.setTimeout = (callback, delay) => {
    const id = ++timerSequence; timers.set(id, { callback, delay }); return id;
  };
  globalThis.clearTimeout = id => {
    if (timers.has(id)) cleared.push({ id, delay: timers.get(id).delay });
    timers.delete(id);
  };
  globalThis.fetch = (url, options) => {
    deletes.push({ url: new URL(url), options });
    return Promise.resolve({ ok: true, status: 204 });
  };
  return {
    timers, cleared, deletes,
    api(context, key = `stream-${context}`) { const api = createAPI(context, key); apis.push(api); return api; },
    mount(props) { hook = mountHook({ trafficEnabled: true, namespace: "alpha", ...props }); return hook; },
    pollOnce() {
      const entry = [...timers].find(([, timer]) => timer.delay === 1000);
      assert.ok(entry, "an accepted current result must schedule the bounded poll");
      timers.delete(entry[0]); entry[1].callback();
    },
    async stop() {
      try {
        hook?.unmount();
        for (const api of apis) for (const call of api.calls) if (!call.resolved) {
          call.resolved = true; call.waiting.resolve({});
        }
        await microtasks();
        assert.equal(timers.size, 0, "unmount and settled DELETE cleanup leave no hook timer");
        assert.ok(apis.every(api => api.listeners.size === 0), "unmount removes stream listeners");
        assert.equal(hook?.lateUpdates || 0, 0, "late responses cannot update an unmounted hook");
      } finally {
        globalThis.window = original.window; globalThis.fetch = original.fetch;
        globalThis.setTimeout = original.setTimeout; globalThis.clearTimeout = original.clearTimeout;
      }
    },
  };
}

test("actual provider hook rejects late nonempty A/B flows after A to B to A and accepts current A", async () => {
  const env = environment();
  try {
    const firstA = env.api("A", "A-epoch1"), b = env.api("B", "B-epoch2"), finalA = env.api("A", "A-epoch3");
    const hook = env.mount({ connection: connection(firstA, "A", 1) });
    firstA.resolve(firstA.flowCalls()[0], flowValue("first-A", "alpha", "UDP", "lease-first-A"));
    await hook.settle(); assertCurrentFlow(hook, "first-A", "alpha", "UDP");
    env.pollOnce(); const lateA = firstA.flowCalls()[1];
    firstA.state.active = false;
    hook.render({ connection: connection(b, "B", 2) });
    assert.equal(lateA.options.signal.aborted, true);
    assert.equal(firstA.statusCalls()[0].options.signal.aborted, true);
    const closingA = env.deletes.find(row => row.url.searchParams.get("context") === "A");
    assert.ok(closingA); assert.equal(closingA.options.method, "DELETE");
    assert.equal(closingA.options.keepalive, true);
    assert.equal(closingA.options.credentials, "same-origin");
    assert.equal(closingA.url.searchParams.get("namespace"), "alpha");
    assert.equal(closingA.url.searchParams.get("leaseID"), "lease-first-A");
    assert.equal(closingA.url.searchParams.get("subscription"), firstA.flowCalls()[0].url.searchParams.get("subscription"));
    const lateB = b.flowCalls()[0]; b.state.active = false;
    hook.render({ connection: connection(finalA, "A", 3) });
    assert.equal(lateB.options.signal.aborted, true);
    assert.equal(b.statusCalls()[0].options.signal.aborted, true);
    finalA.resolve(finalA.statusCalls()[0], statusValue("current-A"));
    finalA.resolve(finalA.flowCalls()[0], flowValue("current-A", "alpha"));
    await hook.settle(); assertCurrentFlow(hook, "current-A", "alpha");
    firstA.resolve(lateA, flowValue("late-A", "alpha", "UDP"));
    b.resolve(lateB, flowValue("late-B", "alpha", "DNS"));
    firstA.resolve(firstA.statusCalls()[0], statusValue("obsolete-A"));
    b.resolve(b.statusCalls()[0], statusValue("obsolete-B"));
    await hook.settle(); assertCurrentFlow(hook, "current-A", "alpha");
    assert.equal(hook.value.providers.hubble.status, "unit-status-current-A");
    assert.deepEqual(hook.value.provisionOperations.map(row => row.id), ["unit-operation-current-A"]);
  } finally { await env.stop(); }
});

test("actual provider hook rejects an alpha flow callback after namespace beta and releases the alpha lease", async () => {
  const env = environment();
  try {
    const api = env.api("A"); const hook = env.mount({ connection: connection(api, "A") });
    api.resolve(api.flowCalls()[0], flowValue("alpha-current", "alpha", "TCP", "lease-alpha"));
    await hook.settle(); assertCurrentFlow(hook, "alpha-current", "alpha");
    env.pollOnce(); const lateAlpha = api.flowCalls()[1];
    hook.render({ namespace: "beta" });
    assert.equal(lateAlpha.options.signal.aborted, true);
    const closing = env.deletes.at(-1);
    assert.equal(closing.url.searchParams.get("context"), "A");
    assert.equal(closing.url.searchParams.get("namespace"), "alpha");
    assert.equal(closing.url.searchParams.get("leaseID"), "lease-alpha");
    const beta = api.flowCalls().at(-1);
    assert.equal(beta.url.searchParams.get("namespace"), "beta");
    api.resolve(beta, flowValue("beta-current", "beta"));
    await hook.settle(); assertCurrentFlow(hook, "beta-current", "beta");
    api.resolve(lateAlpha, flowValue("alpha-late", "alpha", "UDP"));
    await hook.settle(); assertCurrentFlow(hook, "beta-current", "beta");
  } finally { await env.stop(); }
});

test("actual provider hook stream-session change aborts old flow poll and accepts only the new session result", async () => {
  const env = environment();
  try {
    const api = env.api("A", "session-before"); const hook = env.mount({ connection: connection(api, "A") });
    api.resolve(api.flowCalls()[0], flowValue("session-before", "alpha", "UDP", "lease-session-before"));
    await hook.settle(); env.pollOnce(); const old = api.flowCalls()[1];
    assert.equal(api.listeners.size, 1);
    api.changeSession("session-after"); hook.render();
    assert.equal(old.options.signal.aborted, true);
    assert.equal(api.listeners.size, 1, "a key change does not duplicate the stream listener");
    const closing = env.deletes.at(-1);
    assert.equal(closing.url.searchParams.get("context"), "A");
    assert.equal(closing.url.searchParams.get("leaseID"), "lease-session-before");
    api.resolve(api.flowCalls().at(-1), flowValue("session-after", "alpha"));
    await hook.settle(); assertCurrentFlow(hook, "session-after", "alpha");
    api.resolve(old, flowValue("obsolete-session", "alpha", "DNS"));
    await hook.settle(); assertCurrentFlow(hook, "session-after", "alpha");
  } finally { await env.stop(); }
});

test("actual provider hook cancels scheduled polling, aborts status reads and removes listeners on unmount", async () => {
  const env = environment();
  try {
    const api = env.api("A"); const hook = env.mount({ connection: connection(api, "A") });
    const status = api.statusCalls()[0], flow = api.flowCalls()[0];
    api.resolve(flow, flowValue("before-unmount", "alpha", "TCP", "lease-unmount"));
    await hook.settle(); assertCurrentFlow(hook, "before-unmount", "alpha");
    assert.ok([...env.timers.values()].some(timer => timer.delay === 1000));
    api.state.active = false; hook.unmount(); await microtasks();
    assert.equal(status.options.signal.aborted, true);
    assert.equal(flow.options.signal.aborted, true);
    assert.equal(api.listeners.size, 0);
    assert.ok(env.cleared.some(timer => timer.delay === 1000));
    assert.equal(env.timers.size, 0, "DELETE settlement also clears the cleanup deadline");
    const closing = env.deletes.at(-1);
    assert.equal(closing.url.searchParams.get("leaseID"), "lease-unmount");
    assert.equal(closing.url.searchParams.get("context"), "A");
    api.resolve(status, statusValue("late-after-unmount")); await microtasks();
    assert.equal(hook.lateUpdates, 0);
  } finally { await env.stop(); }
});

test("actual provider hook discards a nonempty response that resolves after pending-flow unmount", async () => {
  const env = environment();
  try {
    const api = env.api("A"); const hook = env.mount({ connection: connection(api, "A") });
    const pending = api.flowCalls()[0]; hook.unmount();
    assert.equal(pending.options.signal.aborted, true);
    api.resolve(pending, flowValue("unmounted-late", "alpha", "UDP"));
    await microtasks();
    assert.equal(hook.lateUpdates, 0);
    assert.equal(env.timers.size, 0);
    assert.equal(api.listeners.size, 0);
  } finally { await env.stop(); }
});
