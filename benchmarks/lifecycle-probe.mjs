// Diagnostic only. Tracks page JS timer/observer APIs without retaining targets.
// Browser-native schedulers and workers are outside these counts.
export function installLifecycleProbe() {
  const intervals = new Map(),
    timeouts = new Map(),
    observers = new Set();
  const calls = {
    timeout: 0,
    interval: 0,
    MutationObserver: 0,
    ResizeObserver: 0,
  };
  let overflow = false;
  for (const [setName, clearName, table, repeating, kind] of [
    ["setTimeout", "clearTimeout", timeouts, false, "timeout"],
    ["setInterval", "clearInterval", intervals, true, "interval"],
  ]) {
    const set = window[setName],
      clear = window[clearName];
    window[setName] = function (callback, delay, ...args) {
      if (typeof callback !== "function")
        return set.call(this, callback, delay, ...args);
      let id;
      id = set.call(
        this,
        function (...values) {
          if (!repeating) table.delete(id);
          calls[kind]++;
          return Reflect.apply(callback, this, values);
        },
        delay,
        ...args,
      );
      table.set(id, Number(delay) || 0);
      return id;
    };
    window[clearName] = function (id) {
      timeouts.delete(id);
      intervals.delete(id);
      return clear.call(this, id);
    };
  }
  if (typeof WeakRef === "function")
    for (const name of ["MutationObserver", "ResizeObserver"]) {
      const Native = window[name];
      if (!Native) continue;
      window[name] = class extends Native {
        constructor(callback) {
          if (typeof callback !== "function")
            throw new TypeError("Observer callback must be a function");
          super(function (...args) {
            calls[name]++;
            return Reflect.apply(callback, this, args);
          });
          const record = {
            ref: new WeakRef(this),
            kind: name,
            targets: new Set(),
          };
          const targetRefs = new WeakMap();
          const observe = this.observe.bind(this),
            disconnect = this.disconnect.bind(this);
          this.observe = (...args) => {
            const result = observe(...args);
            if (!targetRefs.has(args[0])) {
              const ref = new WeakRef(args[0]);
              targetRefs.set(args[0], ref);
              record.targets.add(ref);
            } else record.targets.add(targetRefs.get(args[0]));
            return result;
          };
          this.disconnect = (...args) => {
            const result = disconnect(...args);
            record.targets.clear();
            return result;
          };
          if (this.unobserve) {
            const unobserve = this.unobserve.bind(this);
            this.unobserve = (target) => {
              const result = unobserve(target);
              record.targets.delete(targetRefs.get(target));
              return result;
            };
          }
          if (observers.size < 4096) observers.add(record);
          else overflow = true;
        }
      };
    }
  window.__KUBEVIEW_LIFECYCLE__ = {
    read() {
      const active = { MutationObserver: 0, ResizeObserver: 0 };
      const instances = { MutationObserver: 0, ResizeObserver: 0 };
      for (const record of observers) {
        if (!record.ref.deref()) observers.delete(record);
        else {
          instances[record.kind]++;
          for (const ref of record.targets)
            if (!ref.deref()) record.targets.delete(ref);
          if (record.targets.size) active[record.kind]++;
        }
      }
      return {
        intervals: intervals.size,
        timeouts: timeouts.size,
        observers: active,
        observerInstances: instances,
        callbacks: { ...calls },
        overflow,
        scope:
          "Page JS API counts; observers with live observed targets, plus live observer instances. Includes benchmark collector; weak references do not force GC. No worker/native scheduler claim.",
      };
    },
  };
}
