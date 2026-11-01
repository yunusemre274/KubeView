import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { installLifecycleProbe } from "./lifecycle-probe.mjs";
test("diagnostic timer accounting preserves arguments and cross-clear, observers release targets", () => {
  const callbacks = new Map();
  let id = 0;
  class Observer {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  const w = {
    WeakRef,
    MutationObserver: Observer,
    ResizeObserver: Observer,
    setTimeout: (fn, delay, ...args) => {
      callbacks.set(++id, () => fn(...args));
      return id;
    },
    setInterval: (fn, delay, ...args) => {
      callbacks.set(++id, () => fn(...args));
      return id;
    },
    clearTimeout: (id) => callbacks.delete(id),
    clearInterval: (id) => callbacks.delete(id),
  };
  vm.runInNewContext(`(${installLifecycleProbe.toString()})()`, {
    window: w,
    WeakRef,
  });
  const read = () => w.__KUBEVIEW_LIFECYCLE__.read();
  let value;
  const once = w.setTimeout((...args) => (value = args), 180, "a", 2);
  assert.equal(read().timeouts, 1);
  callbacks.get(once)();
  assert.deepEqual(value, ["a", 2]);
  assert.equal(read().timeouts, 0);
  const interval = w.setInterval(() => {}, 180);
  w.clearTimeout(interval);
  assert.equal(read().intervals, 0);
  const target = {};
  const observer = new w.ResizeObserver(() => {});
  observer.observe(target);
  observer.observe(target);
  assert.equal(read().observers.ResizeObserver, 1);
  observer.unobserve(target);
  assert.equal(read().observers.ResizeObserver, 0);
  observer.observe(target);
  observer.disconnect();
  assert.equal(read().observers.ResizeObserver, 0);
  observer.observe(target);
  assert.equal(read().observers.ResizeObserver, 1);
});
