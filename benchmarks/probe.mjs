// Installed ONLY by the harness before navigation. No product import or timer.
export function installProbe() {
  const max = 100000;
  const probe = {
    sockets: new Set(),
    connection(socket) {
      this.latestSocket = socket;
      this.sockets.add(socket);
      socket.addEventListener("close", () => this.sockets.delete(socket), {
        once: true,
      });
    },
    active: false,
    resources: {},
    messages: [],
    pending: new Map(),
    snapshots: 0,
    frames: [],
    inputs: [],
    longTasks: [],
    errors: [],
    sceneUIDs: new Set(),
    reactCommits: [],
    reactCommit(
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    ) {
      if (this.active && this.reactCommits.length < max)
        this.reactCommits.push({
          id,
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime,
        });
    },
    drain() {
      const chunk = {
        frames: this.frames,
        messages: this.messages,
        inputs: this.inputs,
        longTasks: this.longTasks,
      };
      this.frames = [];
      this.messages = [];
      this.inputs = [];
      this.longTasks = [];
      return chunk;
    },
    start() {
      this.reactCommits = [];
      this.frames = [];
      this.messages = [];
      this.pending.clear();
      this.inputs = [];
      this.longTasks = [];
      this.active = true;
      this.startTime = performance.now();
    },
    stop() {
      this.active = false;
      return {
        durationMs: performance.now() - this.startTime,
        frames: this.frames,
        messages: this.messages,
        inputs: this.inputs,
        longTasks: this.longTasks,
        snapshots: this.snapshots,
        reactCommits: this.reactCommits,
        errors: this.errors,
      };
    },
    message(message, times, state) {
      this.resources = state.resources;
      if (message.type === "SNAPSHOT") this.snapshots++;
      if (!this.active || message.type !== "RESOURCE_EVENT") return;
      const resource = message.object;
      const row = {
        uid: resource.metadata.uid,
        version: resource.metadata.resourceVersion,
        action: message.action,
        callback: times.callback,
        parseMs: times.parsed - times.callback,
        storeMs: times.stored - times.parsed,
        callbackToStoreMs: times.stored - times.callback,
        publishMs: times.published - times.stored,
        wasVisible: this.sceneUIDs.has(resource.metadata.uid),
      };
      this.messages.push(row);
      this.pending.set(row.uid, row);
      if (this.messages.length > max)
        throw new Error("Benchmark sample cap exceeded");
    },
    commit(resources) {
      if (!this.active || !this.pending.size) return;
      const versions = new Map(
        resources.map((r) => [r.metadata.uid, r.metadata.resourceVersion]),
      );
      for (const [uid, row] of this.pending) {
        if (
          (row.action === "DELETE" && !versions.has(uid)) ||
          versions.get(uid) === row.version
        )
          row.commitMs = performance.now() - row.callback;
      }
    },
    renderer(gl) {
      this.gl = gl;
      const original = gl.render,
        autoReset = gl.info.autoReset;
      gl.info.autoReset = false;
      const self = this;
      gl.render = function (scene, camera) {
        if (!self.active) {
          gl.info.reset();
          return original.call(this, scene, camera);
        }
        gl.info.reset();
        const start = performance.now();
        const result = original.call(this, scene, camera);
        const end = performance.now();
        self.frames.push({
          start,
          jsSubmitMs: end - start,
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
        });
        if (self.frames.length > max)
          throw new Error("Benchmark frame cap exceeded");
        if (self.pending.size) {
          const uids = new Set();
          scene.traverse((o) => {
            if (!o.visible) return;
            const target = o.userData.harborTarget;
            if (target?.uid) uids.add(target.uid);
            const targets = o.userData.harborTargets?.();
            if (targets) for (const t of targets) uids.add(t.uid);
          });
          self.sceneUIDs = uids;
          for (const [uid, row] of self.pending)
            if (row.commitMs !== undefined) {
              row.visible =
                row.action === "DELETE"
                  ? row.wasVisible && !uids.has(uid)
                  : uids.has(uid);
              if (row.visible) row.callbackToDrawProxyMs = end - row.callback;
              self.pending.delete(uid);
            }
        }
        return result;
      };
      return () => {
        gl.render = original;
        gl.info.autoReset = autoReset;
      };
    },
  };
  globalThis.__KUBEVIEW_BENCHMARK__ = probe;
  addEventListener("error", (e) => probe.errors.push(e.message));
  if (
    globalThis.PerformanceObserver?.supportedEntryTypes?.includes("longtask")
  ) {
    new PerformanceObserver((list) => {
      if (probe.active)
        for (const entry of list.getEntries())
          probe.longTasks.push({
            start: entry.startTime,
            duration: entry.duration,
          });
    }).observe({ type: "longtask", buffered: false });
  }
  // Input -> DOM usability proxy; the harness separately confirms the UID/title.
  let input;
  addEventListener(
    "pointerdown",
    (e) => {
      if (!probe.active) return;
      input = probe.nextInput
        ? {
            ...probe.nextInput,
            start: performance.now(),
            target: e.target.tagName,
          }
        : null;
      probe.nextInput = null;
    },
    true,
  );
  new MutationObserver(() => {
    if (!input || !probe.active) return;
    const title =
      document.querySelector(".resource-form-dialog h2") ||
      document.querySelector(".resource-details h2") ||
      document.querySelector(".world-window h1");
    if (!title || !title.getBoundingClientRect().height) return;
    if (input.expectedTitle && title.textContent.trim() !== input.expectedTitle)
      return;
    const row = {
      ...input,
      title: title.textContent,
      domFeedbackMs: performance.now() - input.start,
    };
    input = null;
    requestAnimationFrame(() => {
      row.nextRafProxyMs = performance.now() - row.start;
      probe.inputs.push(row);
    });
  }).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["aria-selected", "aria-pressed"],
  });
}

// Separate timeline diagnostic: correlate the exact UID/RV with browser records.
// Never installed in the primary timing or instrumentation-overhead runs.
export function installFrameMarks() {
  const probe = globalThis.__KUBEVIEW_BENCHMARK__;
  const message = probe.message.bind(probe),
    commit = probe.commit.bind(probe),
    attach = probe.renderer.bind(probe),
    start = probe.start.bind(probe),
    stop = probe.stop.bind(probe);
  const mark = (stage, row, time) =>
    performance.mark(
      `kubeview:${stage}|${row.action}|${row.uid}|${row.version}`,
      { startTime: time },
    );
  probe.start = () => {
    start();
    performance.mark("kubeview:measurement:start");
  };
  probe.stop = () => {
    performance.mark("kubeview:measurement:stop");
    return stop();
  };
  probe.message = (event, times, state) => {
    message(event, times, state);
    if (!probe.active || event.type !== "RESOURCE_EVENT") return;
    const row = probe.messages.at(-1);
    mark("callback", row, times.callback);
    mark("store", row, times.stored);
  };
  probe.commit = (resources) => {
    commit(resources);
    for (const row of probe.pending.values())
      if (row.commitMs !== undefined && !row.traceCommit) {
        row.traceCommit = true;
        mark("commit-proxy", row, row.callback + row.commitMs);
      }
  };
  probe.renderer = (renderer) => {
    const cleanup = attach(renderer),
      render = renderer.render;
    renderer.render = function (scene, camera) {
      const rows = probe.active ? [...probe.pending.values()] : [];
      const result = render.call(this, scene, camera);
      for (const row of rows)
        if (row.callbackToDrawProxyMs !== undefined)
          mark("draw-proxy", row, row.callback + row.callbackToDrawProxyMs);
      return result;
    };
    return () => {
      renderer.render = render;
      cleanup();
    };
  };
}
