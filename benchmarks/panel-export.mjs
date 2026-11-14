// Export all new runs, including diagnostic/failed ones, without changing historical reports.
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { distribution } from "./metrics.mjs";
import { processCoverage } from "./panel-compare.mjs";
const session = JSON.parse(
  await readFile(process.argv[2] || "benchmarks/panel-session.json", "utf8"),
);
session.results ||= `benchmarks/results/${session.id}`;
const rows = [],
  groups = [];
for (const id of (await readdir("benchmarks/results"))
  .filter((x) => x.startsWith(session.id + "-"))
  .sort()) {
  let d;
  try {
    d = JSON.parse(
      await readFile(`benchmarks/results/${id}/summary.json`, "utf8"),
    );
  } catch {
    continue;
  }
  const processSamples = await readFile(
    `benchmarks/results/${id}/process-samples.json`,
    "utf8",
  )
    .then(JSON.parse)
    .catch(() => []);
  for (const r of d.runs) {
    const process = processCoverage(r, processSamples),
      s = r.summary;
    const row = {
      id,
      profile: r.profile,
      scenario: r.scenario,
      repeat: r.repeat,
      phase: d.manifest.phase,
      buildTag: d.manifest.buildTag,
      sourceSHA: d.manifest.buildProvenance?.sourceSHA256,
      excludedBySession: session.excludedReports?.find(report => report.id === id)?.reason || null,
      finished: Boolean(d.manifest.finishedAt),
      errors: d.errors,
      diagnostic: Boolean(
        d.manifest.profiler || d.manifest.gpuProfiler || d.manifest.reactProfiling,
      ),
      shortRun: d.manifest.params.warmup < 30 || d.manifest.params.seconds < 60,
      fileSmokeFlag: Boolean(d.manifest.smoke),
      warmup: d.manifest.params.warmup,
      seconds: d.manifest.params.seconds,
      power: d.manifest.powerSource,
      dpr: r.before.dpr,
      rendererDPR: r.before.rendererPixelRatio,
      buffer: r.before.buffer,
      canonical: r.before.stats.lifecycle,
      process,
      jsFPS: s.renderedFPS,
      p95: s.renderIntervalMs.p95,
      p99: s.renderIntervalMs.p99,
      submitP95: s.jsSubmitMs.p95,
      storeP95: s.callbackToStoreMs.p95,
      drawProxyP95: s.drawProxyMs.p95,
      panelDomProxyP95: s.panelDomProxyMs.p95,
      endHeapMiB: r.after.heap?.used / 1048576,
      maxProcessRSSMiB: process.maxBrowserProcessRSSKiB / 1024,
      messages: s.messages,
      producer: r.producer
        ? {
            planned: r.producer.planned,
            completed: r.producer.completed,
            valid: r.producer.valid,
          }
        : null,
      consistency: r.consistency,
      logSource: r.logSource,
      logBefore: r.before.logView,
      logAfter: r.after.logView,
      lifecycleBefore: r.before.lifecycle,
      lifecycleAfter: r.after.lifecycle,
      domBefore: r.before.dom,
      domAfter: r.after.dom,
      logCleanup: r.logCleanup,
      network: r.network,
      loadBands: r.loadBands,
      react: s.react,
      gpu: s.gpuCompletedMs,
    };
    rows.push(row);
  }
  for (const key of [
    ...new Set(d.runs.map((r) => `${r.profile}/${r.scenario}`)),
  ]) {
    const rr = rows.filter(
      (r) => r.id === id && `${r.profile}/${r.scenario}` === key,
    );
    groups.push({
      id,
      key,
      diagnostic: rr.some((r) => r.diagnostic),
      n: rr.length,
      browserCPU: distribution(rr.map((r) => r.process.browserCores)),
      rendererCPU: distribution(rr.map((r) => r.process.rendererProcessCores)),
      gpuProcessCPU: distribution(rr.map((r) => r.process.gpuProcessCores)),
      fps: distribution(rr.map((r) => r.jsFPS)),
      p95: distribution(rr.map((r) => r.p95)),
      p99: distribution(rr.map((r) => r.p99)),
      storeP95: distribution(rr.map((r) => r.storeP95)),
      drawProxyP95: distribution(rr.map((r) => r.drawProxyP95)),
      panelDomProxyP95: distribution(rr.map((r) => r.panelDomProxyP95)),
      rss: distribution(rr.map((r) => r.maxProcessRSSMiB)),
      heap: distribution(rr.map((r) => r.endHeapMiB)),
    });
  }
}
await mkdir(session.results, { recursive: true });
await writeFile(
  path.join(session.results, "all-runs.json"),
  JSON.stringify({ interpretation: 'Raw rows include failed, short and diagnostic runs. A single-repeat file smoke flag is not a duration classification or balanced-block acceptance; use panel-accept.mjs and its explicit gates.', rows, groups }, null, 2),
);
const flat = rows.map((r) => ({
  id: r.id,
  scenario: r.scenario,
  profile: r.profile,
  repeat: r.repeat,
  diagnostic: r.diagnostic,
  shortRun: r.shortRun,
  fileSmokeFlag: r.fileSmokeFlag,
  excludedBySession: r.excludedBySession,
  cpuCoverageComplete: r.process.complete,
  measurementWindowValid: r.process.clockWindow?.valid,
  browserCPU: r.process.browserCores,
  rendererCPU: r.process.rendererProcessCores,
  gpuProcessCPU: r.process.gpuProcessCores,
  browserMainCPU: r.process.browserMainCores,
  goCPU: r.process.backendCores,
  fps: r.jsFPS,
  p95: r.p95,
  p99: r.p99,
  storeP95: r.storeP95,
  drawProxyP95: r.drawProxyP95,
  rssMiB: r.maxProcessRSSMiB,
  heapMiB: r.endHeapMiB,
  messages: r.messages,
  producerValid: r.producer?.valid,
  consistent: r.consistency?.clientMatchesUpstream,
}));
const keys = Object.keys(flat[0] || {});
await writeFile(
  path.join(session.results, "all-runs.csv"),
  [
    keys.join(","),
    ...flat.map((r) => keys.map((k) => JSON.stringify(r[k] ?? null)).join(",")),
  ].join("\n") + "\n",
);
console.log({ runs: rows.length, groups: groups.length, out: session.results });
