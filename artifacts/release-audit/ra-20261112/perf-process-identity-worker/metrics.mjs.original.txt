// CPU uses the OS wall clock; browser performance.now can stop during Mac sleep.
// Permit up to 1s for inventory/IPC at window boundaries, never minutes of sleep.
export function measurementWindow(run) {
  const wallMs = run.osAfter?.time - run.osBefore?.time;
  const activeMs = run.summary?.durationMs;
  const differenceMs = wallMs - activeMs;
  return { wallMs, activeMs, differenceMs, toleranceMs: 1000,
    valid: Number.isFinite(wallMs) && wallMs > 0 &&
      Number.isFinite(activeMs) && activeMs > 0 && Math.abs(differenceMs) <= 1000 };
}
export function distribution(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const at = (q) =>
    sorted.length
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))]
      : null;
  return {
    n: sorted.length,
    p50: at(0.5),
    p95: at(0.95),
    p99: at(0.99),
    min: sorted[0] ?? null,
    max: sorted.at(-1) ?? null,
  };
}
export function summarize(raw) {
  const intervals = raw.frames
    .slice(1)
    .map((f, i) => f.start - raw.frames[i].start);
  return {
    durationMs: raw.durationMs,
    renderedFrames: raw.renderCount ?? raw.frames.length,
    renderedFPS:
      (raw.renderCount ?? raw.frames.length) / (raw.durationMs / 1000),
    renderIntervalMs: distribution(intervals),
    jsSubmitMs: distribution(raw.frames.map((f) => f.jsSubmitMs)),
    gapsOver50Ms: intervals.filter((x) => x > 50).length,
    gapsOver100Ms: intervals.filter((x) => x > 100).length,
    calls: distribution(raw.frames.map((f) => f.calls)),
    triangles: distribution(raw.frames.map((f) => f.triangles)),
    parseMs: distribution(raw.messages.map((x) => x.parseMs)),
    storeMs: distribution(raw.messages.map((x) => x.storeMs)),
    callbackToStoreMs: distribution(
      raw.messages.map((x) => x.callbackToStoreMs),
    ),
    commitProxyMs: distribution(raw.messages.map((x) => x.commitMs)),
    drawProxyMs: distribution(raw.messages.map((x) => x.callbackToDrawProxyMs)),
    panelDomProxyMs: distribution(raw.inputs.map((x) => x.domFeedbackMs)),
    panelRafProxyMs: distribution(raw.inputs.map((x) => x.nextRafProxyMs)),
    messages: raw.messages.length,
    longTasks: raw.longTasks.length,
    errors: raw.errors,
    gpuCompletedMs: distribution((raw.gpu || []).map((s) => s.ms)),
    presentedFPS: null,
    react: Object.fromEntries(
      [...new Set((raw.reactCommits || []).map((r) => r.id))].map((id) => {
        const rows = raw.reactCommits.filter((r) => r.id === id);
        return [
          id,
          {
            commits: rows.length,
            actualDurationMs: distribution(rows.map((r) => r.actualDuration)),
            totalActualMs: rows.reduce((n, r) => n + r.actualDuration, 0),
          },
        ];
      }),
    ),
  };
}
export function cpuSeconds(time) {
  const parts = time.split(":").map(Number);
  return parts.reduce((n, v) => n * 60 + v, 0);
}

export function processMetrics(before, after) {
  if (!before?.processes || !after?.processes) return {};
  const initial = new Map(before.processes.map((p) => [p.pid, p]));
  const span = (after.time - before.time) / 1000;
  const delta = (match) =>
    after.processes
      .filter((p) => initial.has(p.pid) && match(p.command))
      .reduce(
        (sum, p) => sum + p.cpuSeconds - initial.get(p.pid).cpuSeconds,
        0,
      ) / span;
  const maxRSS = (match) => {
    const rows = after.processes.filter((p) => match(p.command));
    return rows.length ? Math.max(...rows.map((p) => p.rssKiB)) : null;
  };
  return {
    browserCores: delta((c) => /Chrome|Chromium|MiniBrowser/.test(c)),
    gpuProcessCores: delta((c) => /Helper \(GPU\)/.test(c)),
    rendererProcessCores: delta((c) => /Helper \(Renderer\)/.test(c)),
    backendCores: delta((c) => c.endsWith("backend.test")),
    maxBrowserProcessRSSKiB: maxRSS((c) =>
      /Chrome|Chromium|MiniBrowser/.test(c),
    ),
    backendRSSKiB: maxRSS((c) => c.endsWith("backend.test")),
  };
}

export function loadBands(events, messages, { burst = true } = {}) {
  const key = (action, uid, version) =>
    `${action}:${uid}:${action === "DELETE" ? "" : version}`;
  const planned = new Map(
    events.map((e) => [
      key(e.action, e.object.metadata.uid, e.object.metadata.resourceVersion),
      e,
    ]),
  );
  for (const row of messages) {
    const e = planned.get(key(row.action, row.uid, row.version));
    if (e) {
      row.sequence = e.sequence;
      row.plannedAtMs = e.atMs;
      row.loadBand =
        burst && e.atMs >= 25000 && e.atMs < 35000 ? "burst" : "normal";
    }
  }
  return Object.fromEntries(
    ["normal", "burst"].map((band) => {
      const rows = messages.filter((row) => row.loadBand === band);
      return [
        band,
        {
          received: rows.length,
          parseMs: distribution(rows.map((r) => r.parseMs)),
          storeMs: distribution(rows.map((r) => r.storeMs)),
          callbackToStoreMs: distribution(rows.map((r) => r.callbackToStoreMs)),
          drawProxyMs: distribution(rows.map((r) => r.callbackToDrawProxyMs)),
        },
      ];
    }),
  );
}
