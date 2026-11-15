// Aggregate whole balanced blocks without treating each n=1 file as n=3.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { distribution } from './metrics.mjs';
import { processCoverage, settings } from './panel-compare.mjs';
const session = JSON.parse(await readFile(process.argv[2] || 'benchmarks/panel-final-session.json', 'utf8'));
const root = 'benchmarks/results', directory = `${root}/${session.id}`;
const reports = [];
for (const id of (await readdir(root)).filter(id => id.startsWith(`${session.id}-`)).sort()) {
  if (session.excludedReports?.some(report => report.id === id)) continue;
  try {
    const report = JSON.parse(await readFile(`${root}/${id}/summary.json`, 'utf8'));
    const samples = JSON.parse(await readFile(`${root}/${id}/process-samples.json`, 'utf8'));
    reports.push({ ...report, processSamples: samples });
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
const groups = new Map();
for (const report of reports) for (const run of report.runs) {
  const family = report.manifest.experimentFamily || report.manifest.id.slice(session.id.length + 1).replace(/-(baseline|optimized)-b\d+$/, '').replace(/^matrix-(recovery|supplement)$/, 'matrix');
  const key = `${family}/${run.profile}/${run.scenario}`;
  if (!groups.has(key)) groups.set(key, { key, baseline: [], optimized: [] });
  groups.get(key)[report.manifest.phase].push({ report, run, cpu: processCoverage(run, report.processSamples) });
}
const table = [];
for (const group of groups.values()) {
  const reasons = [], paired = [];
  const reference = group.baseline[0];
  const beforeIDs = group.baseline.map(r => r.run.repeat).sort((a,b) => a-b);
  const afterIDs = group.optimized.map(r => r.run.repeat).sort((a,b) => a-b);
  const stabilityOnly = group.key.startsWith('long/');
  if (!stabilityOnly && JSON.stringify(beforeIDs) !== JSON.stringify(afterIDs)) reasons.push('Paired repeat-ID sets differ; never include an unmatched median');
  const fields = ['fixtureVersion', 'scenarioVersion', 'fixtureSHA256', 'replaySHA256', 'backendBinarySHA256', 'instrumentationSHA256', 'lifecycleInstrumentationSHA256', 'networkDiagnostic', 'powerSource', 'powerSettings', 'hardware', 'os', 'browserVersion', 'browserEnergySaver', 'quality', 'lockSHA256', 'viewport', 'displayRefreshHz', 'deviceScaleFactorOverride', 'snapshotOrder', 'inputLocked'];
  for (const phase of ['baseline', 'optimized']) {
    if (group[phase].length < 3 && !group.key.startsWith('long/')) reasons.push(`${phase}: fewer than three complete repeats`);
    if (new Set(group[phase].map(r => r.run.repeat)).size !== group[phase].length) reasons.push(`${phase}: duplicate repeat`);
    if (new Set(group[phase].map(r => r.report.manifest.buildProvenance?.sourceSHA256)).size > 1) reasons.push(`${phase}: mixed source`);
    for (const { report, run, cpu } of group[phase]) {
      if (!report.manifest.finishedAt || report.errors.length) reasons.push(`${report.manifest.id}: unfinished/errors`);
      if (!cpu.complete) reasons.push(`${report.manifest.id}: CPU PID coverage or measurement clock mismatch`);
      if (run.before.connectionStale || run.after.connectionStale || run.before.contextLost || run.after.contextLost) reasons.push('Stale connection or lost WebGL context');
      if (report.manifest.profiler || report.manifest.gpuProfiler || report.manifest.reactProfiling) reasons.push('Profiling data cannot be production acceptance');
      if (report.manifest.params.warmup < 30 || report.manifest.params.seconds < 60) reasons.push('Short measurement');
      if (run.workloadIntegrity?.valid === false || run.producer?.valid === false || run.consistency && Object.values(run.consistency).includes(false)) reasons.push(`${report.manifest.id}: invalid workload/data`);
      if (reference) {
        for (const field of fields) if (JSON.stringify(reference.report.manifest[field]) !== JSON.stringify(report.manifest[field])) reasons.push(`manifest ${field} differs`);
        const comparableSettings = row => {
          const value = settings(row);
          // Only panel/log matrix cells deliberately reset the visual clock.
          // Other scenarios still require the same visible fleet identities.
          if (!report.manifest.panelMatrix && !report.manifest.logMatrix)
            value.fleet = value.fleet.map(ship => ({ uid: ship.uid }));
          return value;
        };
        if (!group.key.includes('/interaction') && JSON.stringify(comparableSettings(reference.run)) !== JSON.stringify(comparableSettings(run))) reasons.push('scene/settings differ');
        if (JSON.stringify(reference.run.before.logView) !== JSON.stringify(run.before.logView)) reasons.push('Initial retained log differs');
      }
    }
  }
  for (const b of group.baseline) {
    const a = group.optimized.find(row => row.run.repeat === b.run.repeat);
    if (a) paired.push({ repeat: b.run.repeat, before: b.cpu.browserCores, after: a.cpu.browserCores, difference: a.cpu.browserCores - b.cpu.browserCores, beforeCPUmsPerFrame: b.cpu.browserCores * 1000 / b.run.summary.renderedFPS, afterCPUmsPerFrame: a.cpu.browserCores * 1000 / a.run.summary.renderedFPS });
  }
  const summarize = rows => ({
    n: rows.length,
    source: [...new Set(rows.map(r => r.report.manifest.buildProvenance?.sourceSHA256))],
    browserCPU: distribution(rows.map(r => r.cpu.browserCores)),
    rendererCPU: distribution(rows.map(r => r.cpu.rendererProcessCores)),
    gpuProcessCPU: distribution(rows.map(r => r.cpu.gpuProcessCores)),
    browserMainCPU: distribution(rows.map(r => r.cpu.browserMainCores)),
    goCPU: distribution(rows.map(r => r.cpu.backendCores)),
    cpuMsPerFrame: distribution(rows.map(r => r.cpu.browserCores * 1000 / r.run.summary.renderedFPS)),
    fps: distribution(rows.map(r => r.run.summary.renderedFPS)),
    p95: distribution(rows.map(r => r.run.summary.renderIntervalMs.p95)),
    p99: distribution(rows.map(r => r.run.summary.renderIntervalMs.p99)),
    longTasks: distribution(rows.map(r => r.run.summary.longTasks)),
    storeP95: distribution(rows.map(r => r.run.summary.callbackToStoreMs.p95)),
    drawProxyP95: distribution(rows.map(r => r.run.summary.drawProxyMs.p95)),
    panelDomProxyP95: distribution(rows.map(r => r.run.summary.panelDomProxyMs.p95)),
    rssMiB: distribution(rows.map(r => r.cpu.maxBrowserProcessRSSKiB / 1024)),
    heapMiB: distribution(rows.map(r => r.run.after.heap?.used / 1048576)),
    ids: rows.map(r => r.report.manifest.id),
  });
  table.push({ key: group.key, comparable: !stabilityOnly && !reasons.length, stabilityOnly, reasons: [...new Set(reasons)], before: summarize(group.baseline), after: summarize(group.optimized), paired });
}
const result = { generated: new Date().toISOString(), session, interpretation: 'Production paired blocks; per-file smoke flag indicates n=1 only. Aggregate acceptance requires >=3 complete distinct blocks per side, >=30s warmup and >=60s measurement. CPU is total process time/core equivalents, RSS is largest PID, DOM/draw latency proxies are not presented pixels. No automatic selection or retry.', table };
await writeFile(`${directory}/acceptance.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(table.map(row => ({ key: row.key, comparable: row.comparable, reasons: row.reasons, before: row.before.browserCPU, after: row.after.browserCPU, fpsBefore: row.before.fps.p50, fpsAfter: row.after.fps.p50, p95Before: row.before.p95.p50, p95After: row.after.p95.p50 })), null, 2));
