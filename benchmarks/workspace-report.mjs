// Workspace extension of the existing serial benchmark reporter. No sampling,
// retry, profiling or reclassification of historical physical/CPU gates.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { distribution } from './metrics.mjs';
import { assertManifestIdentity, frozenBuildIdentity } from './repair-session.mjs';
import { cellCompleteness, fixedConditionReasons, jobProtocolReasons, observedOrderReasons, repairProcessCoverage, runGateReasons } from './repair-report.mjs';

const med = (values) => { const d = distribution(values.filter(Number.isFinite)); return { n: d.n, median: d.p50, min: d.min, max: d.max }; };
const signature = (r) => JSON.stringify({ fixture: r.manifest.fixtureSHA256[r.profile], preferences: r.before.preferences,
  dpr: r.before.dpr, rendererDPR: r.before.rendererPixelRatio, renderer: r.before.renderer, camera: r.before.camera,
  buffer: r.before.buffer, visible: [r.before.stats.lifecycle.visibleNodes, r.before.stats.lifecycle.visiblePods],
  canonical: [r.before.stats.lifecycle.canonicalNodes, r.before.stats.lifecycle.canonicalPods],
  fleetUIDs: r.before.fleet?.map((s) => s.uid), panel: r.before.panel, logView: r.before.logView });
const drawWork = (r) => ({ calls: r.before.stats.calls, triangles: r.before.stats.triangles, points: r.before.stats.points, lines: r.before.stats.lines });
export function workspacePairs(rows) {
  const pairs = [], reasons = [];
  for (const profile of ['M', 'L']) for (let block = 0; block < 3; block++) {
    const family = rows.filter((r) => r.group === 'workspace-overhead' && r.profile === profile && r.repeat === block);
    for (const harbors of [5, 10, 20]) {
      const controls = family.filter((r) => r.harbors === 1), candidates = family.filter((r) => r.harbors === harbors);
      if (controls.length !== 1 || candidates.length !== 1) { reasons.push(`Missing/duplicate overhead pair ${profile}/h${harbors}/b${block}`); continue; }
      const [a] = controls, [b] = candidates;
      if (signature(a) !== signature(b)) reasons.push(`Active workload differs ${profile}/h${harbors}/b${block}`);
      pairs.push({ family: 'registered-harbor-overhead', profile, block, harbors, control: a.runID, candidate: b.runID,
        controlCPU: a.process.browserCores, candidateCPU: b.process.browserCores,
        browserCPUChange: b.process.browserCores - a.process.browserCores, backendCPUChange: b.process.backendCores - a.process.backendCores,
        controlDrawWork: drawWork(a), candidateDrawWork: drawWork(b),
        identicalDrawWork: JSON.stringify(drawWork(a)) === JSON.stringify(drawWork(b)),
        note: 'Far-harbor rendering is measured feature overhead; different draw work is never a same-work optimization claim.' });
    }
  }
  for (let block = 0; block < 3; block++) {
    const family = rows.filter((r) => r.group === 'workspace-source' && r.repeat === block);
    const a = family.filter((r) => r.phase === 'baseline'), b = family.filter((r) => r.phase === 'optimized');
    if (a.length !== 1 || b.length !== 1) { reasons.push(`Missing/duplicate source pair b${block}`); continue; }
    if (signature(a[0]) !== signature(b[0])) reasons.push(`Single-harbor source workload differs b${block}`);
    pairs.push({ family: 'old-vs-new-single-harbor', profile: 'M', block, control: a[0].runID, candidate: b[0].runID,
      controlCPU: a[0].process.browserCores, candidateCPU: b[0].process.browserCores,
      browserCPUChange: b[0].process.browserCores - a[0].process.browserCores,
      controlDrawWork: drawWork(a[0]), candidateDrawWork: drawWork(b[0]),
      identicalDrawWork: JSON.stringify(drawWork(a[0])) === JSON.stringify(drawWork(b[0])) });
  }
  return { pairs, reasons };
}
export function workspacePanelDeltas(rows) {
  const pairs = [], reasons = [];
  for (let block = 0; block < 3; block++) {
    const family = rows.filter((r) => r.group === 'workspace-panel' && r.repeat === block);
    const closed = family.filter((r) => r.scenario === 'panel-closed'), open = family.filter((r) => r.scenario === 'panel-open');
    if (closed.length !== 1 || open.length !== 1) { reasons.push(`Missing/duplicate selected-UID panel pair b${block}`); continue; }
    const [a] = closed, [b] = open;
    if (a.runID !== b.runID || JSON.stringify(a.before.fleet) !== JSON.stringify(b.before.fleet) || JSON.stringify(a.before.camera) !== JSON.stringify(b.before.camera)) reasons.push(`Panel frozen camera/fleet differs b${block}`);
    pairs.push({ block, runID: a.runID, harbors: 20, selectedUID: 'node-0', closedCPU: a.process.browserCores, openCPU: b.process.browserCores, deltaPanel: b.process.browserCores - a.process.browserCores,
      note: 'Canonical selected UID and frozen visual phase are held in both conditions. Negative deltas are retained; this is not an old/new source CPU ratio.' });
  }
  return { pairs, reasons };
}
async function main() {
  const id = process.argv[2]; if (!/^[\w.-]+$/.test(id || '')) throw Error('New workspace session ID required');
  const directory = path.resolve('benchmarks/results', id), queue = JSON.parse(await readFile(path.join(directory, 'queue.json'), 'utf8'));
  if (queue.suite !== 'workspace') throw Error('Workspace family only');
  const partial = process.argv.includes('--partial'), reasons = [], rows = [];
  if (queue.status !== 'passed' && !partial) throw Error('Incomplete queue; --partial is progress only');
  for (const tag of new Set([queue.baselineTag, queue.candidateTag])) {
    if (JSON.stringify(await frozenBuildIdentity(process.cwd(), tag)) !== JSON.stringify(queue.buildIdentities?.[tag])) reasons.push(`Frozen build changed ${tag}`);
  }
  for (const job of queue.jobs) {
    if (job.status !== 'passed') continue;
    const folder = path.resolve('benchmarks/results', job.id), report = JSON.parse(await readFile(path.join(folder, 'summary.json'), 'utf8'));
    const samples = JSON.parse(await readFile(path.join(folder, 'process-samples.json'), 'utf8'));
    try { assertManifestIdentity(report.manifest, queue.buildIdentities[job.tag], queue.browserVersion, queue.powerSource); } catch (e) { reasons.push(`${job.id}: ${e.message}`); }
    if (report.errors.length || !report.manifest.finishedAt) reasons.push(`Run error ${job.id}`);
    if ((report.manifest.registeredHarbors || 0) !== (job.harbors || 0)) reasons.push(`Harbor count differs ${job.id}`);
    reasons.push(...jobProtocolReasons(job, report.manifest), ...observedOrderReasons(job, report.runs));
    for (const run of report.runs) {
      const process = repairProcessCoverage(run, samples);
      if (!process.complete) reasons.push(`Process coverage ${job.id}/${run.scenario}`);
      const row = { ...run, phase: job.phase, group: job.group, harbors: job.harbors || 0, runID: job.id, manifest: report.manifest, process }; rows.push(row);
      if (job.group === 'workspace-interaction' && (row.panelControlsActionabilityProxy?.samples?.length || 0) < 8)
        reasons.push(`Cached control actionability subset missing ${job.id}`);
      reasons.push(...runGateReasons(row, job.tag === queue.candidateTag ? 'optimized' : 'baseline').map((r) => `${job.id}: ${r}`));
    }
  }
  reasons.push(...cellCompleteness(queue, rows), ...fixedConditionReasons(rows));
  const pairs = workspacePairs(rows), panel = workspacePanelDeltas(rows); reasons.push(...pairs.reasons, ...panel.reasons);
  const keys = [...new Set(rows.map((r) => `${r.group}/${r.profile}/${r.harbors}/${r.scenario}`))];
  const groups = keys.map((key) => {
    const subset = rows.filter((r) => `${r.group}/${r.profile}/${r.harbors}/${r.scenario}` === key);
    return { key, n: subset.length, browserCPU: med(subset.map((r) => r.process.browserCores)), rendererCPU: med(subset.map((r) => r.process.rendererProcessCores)), gpuProcessCPU: med(subset.map((r) => r.process.gpuProcessCores)), backendCPU: med(subset.map((r) => r.process.backendCores)),
      maxSingleBrowserRSSMiB: med(subset.map((r) => r.process.maxBrowserProcessRSSKiB / 1024)), JSHeapMiB: med(subset.map((r) => r.after.heap?.used / 1048576)),
      drawsPerSecond: med(subset.map((r) => r.summary.renderedFPS)), intervalP95ms: med(subset.map((r) => r.summary.renderIntervalMs.p95)), intervalP99ms: med(subset.map((r) => r.summary.renderIntervalMs.p99)),
      cachedControlsProxyP95ms: med(subset.map((r) => r.panelControlsActionabilityProxy?.elapsedMs?.p95)),
      runs: subset.map((r) => ({ runID: r.runID, block: r.repeat, drawWork: drawWork(r), summary: r.summary, panelControlsActionabilityProxy: r.panelControlsActionabilityProxy, sceneInventory: r.after.sceneResources, workloadIntegrity: r.workloadIntegrity })) };
  });
  const long = rows.find((r) => r.scenario === 'long');
  if (long && (long.workspaceCycles?.length !== 20 || long.workspaceCycles.some((c) => !c.valid))) reasons.push('Twenty workspace transitions/cleanup cycles not proved');
  const output = { id, partial, valid: !partial && queue.status === 'passed' && !reasons.length, reasons, completedCells: rows.length, groups, pairs: pairs.pairs, panel: panel.pairs,
    long: long ? { runID: long.runID, summary: long.summary, consistency: long.consistency, logCleanup: long.logCleanup, reconnects: long.reconnects, informerResyncs: long.informerResyncs, cycles: long.repairPanelCycles, workspaceCycles: long.workspaceCycles, checkpoints: long.checkpoints } : null,
    historicalGates: { 'V11-16': 'BLOCKED: physical feedback is not measured by these proxies', 'V11-18': 'BLOCKED: new workspace measurements do not close historical unexplained CPU', 'V11-19': 'BLOCKED; manual acceptance separately PENDING' },
    notes: ['Browser CPU is all covered browser processes in core equivalents; GPU-process CPU is not GPU utilization.', 'Single-process RSS and JS heap are distinct; no summed physical RAM or energy claim.', 'Draw cadence and callback/DOM/rAF latency are proxies, not physical presentation or full-panel usability.', 'Synthetic production informer/WebSocket/store replay is separate from real Kubernetes/Hubble E2E.'] };
  await writeFile(path.join(directory, partial ? 'workspace-comparison.partial.json' : 'workspace-comparison.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify({ id, valid: output.valid, completedCells: rows.length, reasons })); if (!partial && !output.valid) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
