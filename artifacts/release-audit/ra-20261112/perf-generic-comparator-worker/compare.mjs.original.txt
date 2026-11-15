import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { distribution, processMetrics } from "./metrics.mjs";
import { cameraComparisonReasons } from './camera-contract.mjs';
const [beforeDir, afterDir, outFile] = process.argv.slice(2);
if (!beforeDir || !afterDir)
  throw new Error("Usage: bench:compare -- BEFORE_DIR AFTER_DIR [OUTPUT.json]");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = async (d) =>
  JSON.parse(await readFile(path.resolve(root, d, "summary.json"), "utf8"));
const before = await read(beforeDir),
  after = await read(afterDir);
const reject = [];
reject.push(...cameraComparisonReasons(before, after));
if (
  Number(before.manifest.logPayloadBytes || 0) !==
  Number(after.manifest.logPayloadBytes || 0)
)
  reject.push("log payload bytes differ");
for (const key of [
  "fixtureVersion",
  "scenarioVersion",
  "snapshotOrder",
  "replaySHA256",
  "instrumentationSHA256",
  "fixtureSHA256",
  "backendBinarySHA256",
  "powerSource",
  "powerSettings",
  "sleepInhibition",
  "displayRefreshHz",
  "params",
  "browserVersion",
  "quality",
  "lockSHA256",
  "hardware",
  "os",
  "profiler",
  "video",
  "cpuThrottling",
  "browserEnergySaver",
  "lifecycleInstrumentationSHA256",
  "networkDiagnostic",
  "deviceScaleFactorOverride",
])
  if (
    JSON.stringify(before.manifest[key]) !== JSON.stringify(after.manifest[key])
  )
    reject.push(`manifest ${key} differs`);
for (const key of ["viewport"])
  if (
    JSON.stringify(before.manifest[key]) !== JSON.stringify(after.manifest[key])
  )
    reject.push(`manifest ${key} differs`);
if (before.manifest.smoke || after.manifest.smoke)
  reject.push("short/incomplete smoke settings: cannot claim acceptance");
if (
  before.manifest.profiler ||
  after.manifest.profiler ||
  before.manifest.gpuProfiler ||
  after.manifest.gpuProfiler
)
  reject.push("profiler run: diagnostic only");
if (before.errors.length || after.errors.length)
  reject.push("runner errors present");
const group = (report) => {
  const groups = new Map();
  for (const r of report.runs) {
    const key = `${r.profile}/${r.scenario}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return groups;
};
const b = group(before),
  a = group(after),
  rows = [];
for (const [key, br] of b) {
  const ar = a.get(key);
  if (!ar) {
    reject.push(`missing after group ${key}`);
    continue;
  }
  if (br.concat(ar).some((run) => run.comparabilityOnly)) {
    reject.push(`comparability-only inventory has no performance window ${key}`);
    continue;
  }
  const bad = br
    .concat(ar)
    .some(
      (r) =>
        r.producer &&
        (!r.producer.valid ||
          !r.consistency.clientMatchesUpstream ||
          !r.consistency.upstreamMatchesPlanned),
    );
  if (bad) reject.push(`invalid producer/consistency ${key}`);
  if (
    br
      .concat(ar)
      .some(
        (r) =>
          r.before.connectionStale ||
          r.after.connectionStale ||
          r.before.contextLost ||
          r.after.contextLost,
      )
  )
    reject.push(`stale connection or lost WebGL context ${key}`);
  if (br.length < 3 || ar.length < 3)
    reject.push(`fewer than 3 repetitions ${key}`);
  const settings = (r) => ({
    prefs: r.before.preferences,
    dpr: r.before.dpr,
    rendererPixelRatio: r.before.rendererPixelRatio,
    buffer: r.before.buffer,
    renderer: r.before.renderer,
    // Ignore arithmetic roundoff only; real pose changes remain a hard failure.
    camera: Object.fromEntries(
      Object.entries(r.before.camera).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((number) => Number(number.toFixed(9)))
          : Number(value.toFixed(9)),
      ]),
    ),
    visibleUIDs: r.before.fleet.map((ship) => ship.uid),
    visiblePods: r.before.stats.lifecycle.visiblePods,
  });
  if (
    br
      .concat(ar)
      .some(
        (r) => JSON.stringify(settings(br[0])) !== JSON.stringify(settings(r)),
      )
  )
    reject.push(`camera/DPR/preferences differ ${key}`);
  for (const metric of [
    "renderedFPS",
    "renderIntervalMs.p95",
    "renderIntervalMs.p99",
    "jsSubmitMs.p50",
    "jsSubmitMs.p95",
    "callbackToStoreMs.p95",
    "drawProxyMs.p95",
    "panelDomProxyMs.p95",
    "process.browserCores",
    "process.backendCores",
    "process.maxBrowserProcessRSSKiB",
    "process.backendRSSKiB",
  ]) {
    const value = (r) =>
      metric.split(".").reduce((v, k) => v?.[k], {
        ...r.summary,
        process: processMetrics(r.osBefore, r.osAfter),
      });
    const bd = distribution(br.map(value)),
      ad = distribution(ar.map(value));
    rows.push({
      group: key,
      metric,
      before: bd,
      after: ad,
      changePercent:
        bd.p50 && ad.p50 !== null ? ((ad.p50 - bd.p50) / bd.p50) * 100 : null,
    });
  }
}
const result = {
  comparable: reject.length === 0,
  reasons: reject,
  rows,
  interpretation:
    "Median across repetitions, full min/max range and n. Small differences within run variability are not proof of improvement. CPU/RSS remain in per-PID process samples; RSS must not be summed as unique RAM.",
};
if (outFile)
  await writeFile(path.resolve(root, outFile), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (reject.length) process.exitCode = 2;
