// Combine complete paired blocks, including supplements; never select samples by CPU.
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { distribution, processMetrics, measurementWindow } from "./metrics.mjs";
import { inspectProcessCohort, processIdentity } from './process-identity.mjs';
const browser = (p) => /Chrome|Chromium|MiniBrowser/.test(p.command);
const round = (value) =>
  JSON.parse(
    JSON.stringify(value, (_, v) =>
      typeof v === "number" ? Number(v.toFixed(9)) : v,
    ),
  );
export function processCoverage(run, samples = []) {
  const b = run.osBefore,
    a = run.osAfter;
  const snapshots = [
    b,
    ...samples.filter((s) => !Number.isFinite(s?.time) || s.time > b?.time && s.time < a?.time),
    a,
  ];
  const cohort = inspectProcessCohort(snapshots), metrics = processMetrics(b,a);
  const clockWindow = measurementWindow(run);
  const accounting = b?.processes || [];
  const complete = cohort.valid && metrics.valid && clockWindow.valid && accounting.some(p => p.role === 'browser-main') && accounting.some(p => p.role === 'backend');
  let mainCores = null;
  if (complete) {
    const initial = new Map(b.processes.map(p => [processIdentity(p),p]));
    mainCores = a.processes.filter(p => p.role === 'browser-main').reduce((sum,p) => sum+p.cpuSeconds-initial.get(processIdentity(p)).cpuSeconds,0)/((a.time-b.time)/1000);
  }
  const measured = complete ? metrics : Object.fromEntries(Object.keys(metrics).filter(k => k.endsWith('Cores') || k.endsWith('RSSKiB')).map(k => [k,null]));
  return {
    ...measured,
    valid: complete,
    reasons: [...cohort.reasons,...(!metrics.valid?metrics.reasons:[]),...(!accounting.some(p=>p.role==='browser-main')?['Missing browser root']:[]),...(!accounting.some(p=>p.role==='backend')?['Missing backend root']:[])],
    browserMainCores: mainCores,
    churn: cohort.churn,
    clockWindow,
    complete,
  };
}
export function settings(run) {
  const b = run.before;
  return round({
    preferences: b.preferences,
    dpr: b.dpr,
    rendererDPR: b.rendererPixelRatio,
    buffer: b.buffer,
    renderer: b.renderer,
    camera: b.camera,
    fleet: b.fleet,
    visibleNodes: b.stats.lifecycle.visibleNodes,
    visiblePods: b.stats.lifecycle.visiblePods,
    canonicalNodes: b.stats.lifecycle.canonicalNodes,
    canonicalPods: b.stats.lifecycle.canonicalPods,
  });
}
function reviewSubmittedWork(sides, blocks, scenarios) {
  const pairs = [], allocationObservations = [];
  const knownCount = value => Number.isFinite(value) && value >= 0;
  const compareCount = (path, before, after) => ({
    path,
    before: knownCount(before) ? before : null,
    after: knownCount(after) ? after : null,
    status: !knownCount(before) || !knownCount(after)
      ? "UNKNOWN" : before === after ? "MATCHED" : "DIFFERENT",
  });
  for (const block of blocks) for (const scenario of scenarios) {
    const rows = sides.map(side => side.filter(run => run.repeat === block && run.scenario === scenario));
    const differences = [], unknowns = [];
    const [before, after] = rows.map(side => side[0]);
    if (rows.some(side => side.length !== 1)) {
      unknowns.push({ path: "pairedCell", before: null, after: null, status: "UNKNOWN" });
    } else {
      const inspect = (path, a, b) => {
        const observation = compareCount(path, a, b);
        if (observation.status === "UNKNOWN") unknowns.push(observation);
        if (observation.status === "DIFFERENT") differences.push(observation);
      };
      for (const boundary of ["before", "after"]) {
        for (const key of ["calls", "triangles", "lines", "points"])
          inspect(`${boundary}.stats.${key}`, before[boundary]?.stats?.[key], after[boundary]?.stats?.[key]);
        for (const key of ["geometries", "textures"])
          allocationObservations.push({ block, scenario, ...compareCount(
            `${boundary}.stats.memory.${key}`,
            before[boundary]?.stats?.memory?.[key], after[boundary]?.stats?.memory?.[key],
          ) });
      }
      for (const key of ["calls", "triangles"]) {
        const a = before.summary?.[key], b = after.summary?.[key];
        // Different frame totals are expected; sample counts prove presence only.
        if (![a?.n, b?.n].every(n => Number.isSafeInteger(n) && n > 0))
          unknowns.push({ path: `summary.${key}.n`, status: "UNKNOWN",
            before: Number.isSafeInteger(a?.n) && a.n > 0 ? a.n : null,
            after: Number.isSafeInteger(b?.n) && b.n > 0 ? b.n : null });
        for (const percentile of ["p50", "p95", "p99", "min", "max"])
          inspect(`summary.${key}.${percentile}`, a?.[percentile], b?.[percentile]);
      }
    }
    pairs.push({ block, scenario, status: unknowns.length ? "UNKNOWN"
      : differences.length ? "REQUIRES_RENDER_EQUIVALENCE_REVIEW" : "MATCHED_COUNTERS_ONLY",
      differences, unknowns });
  }
  const status = pairs.some(pair => pair.status === "UNKNOWN") ? "UNKNOWN"
    : pairs.some(pair => pair.differences.length) ? "REQUIRES_RENDER_EQUIVALENCE_REVIEW"
      : pairs.length ? "MATCHED_COUNTERS_ONLY" : "UNKNOWN";
  return {
    protocol: "paired-submitted-work-v1", status,
    automaticEligibility: status === "MATCHED_COUNTERS_ONLY",
    pairs, allocationObservations,
    interpretation: "Counter differences or unknown data require external semantic and visual equivalence review; counters alone assign no performance or quality verdict. Matching counters establish only this guard's scope. Allocation observations describe renderer memory inventory separately, without establishing active draws, retained JS or leaks.",
  };
}
export function comparePanels(baselines, candidates) {
  const reasons = [];
  const reference = baselines[0].manifest;
  const fields = [
    "fixtureVersion",
    "scenarioVersion",
    "replaySHA256",
    "instrumentationSHA256",
    "fixtureSHA256",
    "backendBinarySHA256",
    "powerSource",
    "powerSettings",
    "displayRefreshHz",
    "browserVersion",
    "quality",
    "lockSHA256",
    "hardware",
    "os",
    "viewport",
    "deviceScaleFactorOverride",
    "browserEnergySaver",
    "lifecycleInstrumentationSHA256",
    "networkDiagnostic",
    "snapshotOrder",
    "fpsCap",
    "adaptiveQuality",
    "shadows",
    "production",
    "inputLocked",
  ];
  const sides = [baselines, candidates].map((reports) =>
    reports.flatMap((report) => {
      for (const key of fields)
        if (
          JSON.stringify(report.manifest[key]) !==
          JSON.stringify(reference[key])
        )
          reasons.push(`manifest ${key} differs: ${report.manifest.id}`);
      if (report.errors.length || !report.manifest.finishedAt)
        reasons.push(`incomplete/error run: ${report.manifest.id}`);
      if (
        report.manifest.profiler ||
        report.manifest.gpuProfiler ||
        report.manifest.video
      )
        reasons.push(`diagnostic run: ${report.manifest.id}`);
      if (
        report.manifest.params.warmup < 30 ||
        report.manifest.params.seconds < 60
      )
        reasons.push(`short duration: ${report.manifest.id}`);
      return report.runs.map((run) => ({
        ...run,
        runId: report.manifest.id,
        process: processCoverage(run, report.processSamples),
      }));
    }),
  );
  const groups = [
    "panel-closed",
    "panel-open",
    "panel-closed-events",
    "panel-open-events",
  ];
  const refSettings = JSON.stringify(settings(sides[0][0]));
  for (const run of sides.flat()) {
    if (JSON.stringify(settings(run)) !== refSettings)
      reasons.push(
        `settings/phase differ ${run.runId}/${run.scenario}/${run.repeat}`,
      );
    if (!run.process.complete)
      reasons.push(
        `incomplete CPU coverage (PID or measurement clocks) ${run.runId}/${run.scenario}/${run.repeat}`,
      );
    if (
      run.before.contextLost ||
      run.after.contextLost ||
      run.before.connectionStale ||
      run.after.connectionStale
    )
      reasons.push(`stale/lost ${run.runId}/${run.scenario}/${run.repeat}`);
    if (
      run.producer &&
      (!run.producer.valid ||
        !run.consistency.clientMatchesUpstream ||
        !run.consistency.upstreamMatchesPlanned ||
        run.summary.messages !== run.producer.planned)
    )
      reasons.push(`event loss ${run.runId}/${run.scenario}/${run.repeat}`);
  }
  const blocks = sides.map((rows) =>
    [...new Set(rows.map((r) => r.repeat))].sort((a, b) => a - b),
  );
  if (
    blocks[0].length < 3 ||
    JSON.stringify(blocks[0]) !== JSON.stringify(blocks[1])
  )
    reasons.push("insufficient or unequal paired blocks");
  for (const [side, rows] of sides.entries())
    for (const block of blocks[side])
      for (const scenario of groups)
        if (
          rows.filter((r) => r.repeat === block && r.scenario === scenario)
            .length !== 1
        )
          reasons.push(`missing/duplicate cell ${side}/${block}/${scenario}`);
  const renderWorkReview = reviewSubmittedWork(sides, blocks[0], groups);
  if (!renderWorkReview.automaticEligibility)
    reasons.push(`REQUIRES_RENDER_EQUIVALENCE_REVIEW: ${renderWorkReview.status}`);
  const metrics = {
    browserCPU: (r) => r.process.browserCores,
    rendererCPU: (r) => r.process.rendererProcessCores,
    gpuProcessCPU: (r) => r.process.gpuProcessCores,
    browserMainCPU: (r) => r.process.browserMainCores,
    goCPU: (r) => r.process.backendCores,
    cpuMsPerJSFrame: (r) =>
      (r.process.browserCores * r.summary.durationMs) /
      r.summary.renderedFrames,
    jsFPS: (r) => r.summary.renderedFPS,
    intervalP95ms: (r) => r.summary.renderIntervalMs.p95,
    intervalP99ms: (r) => r.summary.renderIntervalMs.p99,
    submitP95ms: (r) => r.summary.jsSubmitMs.p95,
    callbackStoreP95ms: (r) => r.summary.callbackToStoreMs.p95,
    callbackDrawProxyP95ms: (r) => r.summary.drawProxyMs.p95,
    maxProcessRSSMiB: (r) => r.process.maxBrowserProcessRSSKiB / 1024,
    jsHeapEndMiB: (r) => r.after.heap?.used / 1048576,
  };
  const table = groups.map((scenario) => ({
    scenario,
    ...Object.fromEntries(
      ["before", "after"].map((side, i) => [
        side,
        Object.fromEntries(
          Object.entries(metrics).map(([name, get]) => [
            name,
            distribution(
              sides[i].filter((r) => r.scenario === scenario).map(get),
            ),
          ]),
        ),
      ]),
    ),
  }));
  const deltas = sides
    .map((rows) =>
      [false, true].map((events) => ({
        events,
        blocks: blocks[0].map((block) => {
          const closed = rows.find(
            (r) =>
              r.repeat === block &&
              r.scenario === `panel-closed${events ? "-events" : ""}`,
          );
          const open = rows.find(
            (r) =>
              r.repeat === block &&
              r.scenario === `panel-open${events ? "-events" : ""}`,
          );
          return {
            block,
            closed: closed?.process.browserCores ?? null,
            open: open?.process.browserCores ?? null,
            delta:
              open && closed
                ? open.process.browserCores - closed.process.browserCores
                : null,
          };
        }),
      })),
    )
    .map((rows) =>
      rows.map((row) => ({
        ...row,
        signedDelta: distribution(row.blocks.map((b) => b.delta)),
      })),
    );
  return {
    comparable: !reasons.length,
    reasons: [...new Set(reasons)],
    renderWorkReview,
    inputs: {
      before: baselines.map((r) => r.manifest.id),
      after: candidates.map((r) => r.manifest.id),
    },
    table,
    deltas,
    samples: sides.map((rows) =>
      rows.map((r) => ({
        runId: r.runId,
        scenario: r.scenario,
        block: r.repeat,
        process: r.process,
      })),
    ),
    interpretation:
      "Signed open-minus-closed deltas within each balanced block, no positivity constraint. Supplemental blocks included in full. Process CPU time/core equivalents; no summed physical RSS or GPU-time inference. DOM/draw latency is a proxy, not visible presentation.",
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [before, after, out] = process.argv.slice(2);
  if (!out)
    throw Error(
      "Usage: node benchmarks/panel-compare.mjs BEFORE_DIR[,SUPPLEMENT_DIR] AFTER_DIR OUTPUT.json",
    );
  const read = async (dirs) =>
    Promise.all(
      dirs
        .split(",")
        .map(async (d) => ({
          ...JSON.parse(await readFile(`${d}/summary.json`, "utf8")),
          processSamples: JSON.parse(
            await readFile(`${d}/process-samples.json`, "utf8"),
          ),
        })),
    );
  const result = comparePanels(await read(before), await read(after));
  await writeFile(out, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        comparable: result.comparable,
        reasons: result.reasons,
        renderWorkReview: { status: result.renderWorkReview.status,
          affectedPairs: result.renderWorkReview.pairs.filter(pair => pair.status !== "MATCHED_COUNTERS_ONLY").length },
        table: result.table.map((r) => ({
          scenario: r.scenario,
          before: r.before.browserCPU,
          after: r.after.browserCPU,
        })),
        deltas: result.deltas,
      },
      null,
      2,
    ),
  );
  if (!result.comparable) process.exitCode = 2;
}
