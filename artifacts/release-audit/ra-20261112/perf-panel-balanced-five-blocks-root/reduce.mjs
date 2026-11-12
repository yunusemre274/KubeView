// Offline only: run after the sealed ten-job family has stopped. No workload.
import { readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { comparePanels } from '../../../../benchmarks/panel-compare.mjs';
import { distribution } from '../../../../benchmarks/metrics.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../../..');
const read = async name => JSON.parse(await readFile(path.join(dir, name), 'utf8'));
const sha = data => createHash('sha256').update(data).digest('hex');
const need = (condition, reason) => { if (!condition) throw Error(reason); };
try {
  await access(path.join(dir, 'balanced-summary.json'));
  throw Error('Existing offline summary: use a separate reviewed output, never overwrite');
} catch (error) { if (error.code !== 'ENOENT') throw error; }

const execution = await read('execution.json');
const plan = await read('plan.json');
need(execution.status === 'PASS_RUNS_COMPLETED_RAW_VALIDITY_REVIEW_PENDING', 'Family stopped/incomplete; no accepted aggregate');
need(execution.jobs.length === 10 && plan.windows === 40 && plan.independentBlocks === 5, 'Require all five planned blocks');
need(execution.elapsedSeconds <= 4500 && execution.backendUnchanged && execution.port5192Free && execution.cleanup.every(row => row.capturedIdentityAbsent), 'Execution/cleanup guard failed');
for (const [file, expected] of Object.entries(execution.sourceSHA256)) {
  need(sha(await readFile(path.join(root, file))) === expected, `Frozen source differs: ${file}`);
}
const frozen = JSON.parse(await readFile(path.join(dir, '../perf-matching-build-worker/frozen-build-manifests.json'), 'utf8'));
const inputs = { A: [], B: [] };
const cells = [];
const evidence = {};
const plannedOrder = ['AB', 'BA', 'AB', 'BA', 'AB'];
for (let index = 0; index < execution.jobs.length; index++) {
  const job = execution.jobs[index];
  const pair = Math.floor(index / 2), side = plannedOrder[pair][index % 2];
  need(job.pair === pair && job.side === side && job.exitCode === 0 && Object.values(job.cleanup).every(Boolean), 'Planned order/job cleanup differs');
  const prefix = `p${pair}-${side}`;
  const report = await read(prefix + '-runner-summary.json');
  const samples = await read(prefix + '-process-samples.json');
  const validation = await read(prefix + '-validation.json');
  need(validation.status === 'PASS_JOB_REQUIRES_FULL_FIVE_BLOCK_SET' && validation.cells.length === 4 && !validation.reasons.length, 'Invalid job retained; no accepted aggregate');
  const identity = frozen.frontends[side];
  const provenance = JSON.parse(await readFile(path.join(dir, `../perf-matching-build-worker/frontend-${side}-build-provenance.json`), 'utf8'));
  need(report.manifest.id === job.id && report.manifest.buildTag === identity.tag && report.manifest.buildIndexSHA256 === identity.indexSHA256 && report.manifest.backendBinarySHA256 === identity.backendSHA256 && JSON.stringify(report.manifest.buildProvenance) === JSON.stringify(provenance), 'Frozen source attribution mismatch');
  inputs[side].push({ ...report, processSamples: samples });
  for (const suffix of ['-runner-summary.json', '-process-samples.json', '-validation.json', '-cleanup.json']) {
    const file = prefix + suffix;
    evidence[file] = sha(await readFile(path.join(dir, file)));
  }
  for (const run of report.runs) {
    const validated = validation.cells.find(row => row.scenario === run.scenario);
    need(validated?.coverage.complete && run.repeat === pair, 'Missing validated cell');
    const p = validated.coverage;
    const events = run.scenario.endsWith('-events');
    cells.push({ pair, side, scenario: run.scenario, runId: job.id,
      sourceCommit: identity.sourceCommit, invocationCommit: report.manifest.commit,
      sourceAttributionProtocol: 'frozen-matching-manifest-v1',
      dataCorrect: run.consistency.clientMatchesUpstream && run.consistency.upstreamMatchesPlanned,
      receivedEvents: run.summary.messages,
      metrics: {
        browserCores: p.browserCores, rendererCores: p.rendererProcessCores,
        gpuProcessCores: p.gpuProcessCores, browserMainCores: p.browserMainCores,
        backendFixtureCores: p.backendCores,
        maxSingleBrowserProcessEndRSSMiB: p.maxBrowserProcessRSSKiB / 1024,
        backendProcessEndRSSMiB: p.backendRSSKiB / 1024,
        pageJSHeapEndUsedMiB: run.after.heap?.used == null ? null : run.after.heap.used / 1048576,
        jsDrawsPerSecond: run.summary.renderedFPS,
        windowFrameP95Ms: run.summary.renderIntervalMs.p95,
        windowFrameP99Ms: run.summary.renderIntervalMs.p99,
        windowCallbackStoreP95Ms: events ? run.loadBands.normal.callbackToStoreMs.p95 : null,
        windowVisibleDrawProxyP95Ms: events ? run.loadBands.normal.drawProxyMs.p95 : null,
      },
    });
  }
}
need(cells.length === 40 && cells.every(c => c.dataCorrect) && cells.reduce((n, c) => n + c.receivedEvents, 0) === 6000, 'Full forty-cell canonical/event grid required');
const comparison = comparePanels(inputs.A, inputs.B);
need(comparison.comparable, 'Existing panel comparator rejected: ' + comparison.reasons.join('; '));
const scenarios = ['panel-closed', 'panel-open', 'panel-closed-events', 'panel-open-events'];
const paired = (a, b) => ({ difference: Number.isFinite(a) && Number.isFinite(b) ? b - a : null,
  percent: Number.isFinite(a) && Number.isFinite(b) && a !== 0 ? (b - a) / a * 100 : null });
const metricRows = scenarios.map(scenario => ({ scenario,
  rows: Object.keys(cells[0].metrics).map(metric => {
    const pairs = Array.from({ length: 5 }, (_, pair) => {
      const a = cells.find(c => c.pair === pair && c.side === 'A' && c.scenario === scenario).metrics[metric];
      const b = cells.find(c => c.pair === pair && c.side === 'B' && c.scenario === scenario).metrics[metric];
      return { pair, before: a, after: b, ...paired(a, b) };
    });
    return { metric, before: distribution(pairs.map(p => p.before)), after: distribution(pairs.map(p => p.after)),
      pairedDifference: distribution(pairs.map(p => p.difference)), pairedPercent: distribution(pairs.map(p => p.percent)), pairs };
  }),
}));
const deltaOfDeltas = [false, true].map(events => {
  const rows = ['A', 'B'].map(side => comparison.deltas[side === 'A' ? 0 : 1].find(row => row.events === events));
  const pairs = rows[0].blocks.map((a, index) => {
    const b = rows[1].blocks[index];
    need(a.block === b.block, 'Delta block identity differs');
    return { pair: a.block, before: a.delta, after: b.delta, difference: b.delta - a.delta };
  });
  return { events, pairs, pairedDifference: distribution(pairs.map(p => p.difference)) };
});
const result = {
  status: 'COMPLETE_GRID_OFFLINE_REVIEW_PENDING', pairs: 5, windows: 40, protocol: 5,
  scope: 'Frozen frontend A36d/Bf32, common fixed backend; synthetic M20/300, detailed8/120, medium/DPR1/1440x900/controlledFOV38; natural Node0 Summary panel open/closed at0/5events-s',
  totalReceivedEvents: 6000, allCanonicalContentEqual: true, evidence,
  cells, metricRows, signedPanelDeltas: comparison.deltas, deltaOfDeltas,
  existingComparator: comparison,
  limitations: [
    'Only frozen frontend sources differ; this is not a full-runtime or real Kubernetes/Hubble load comparison.',
    'Natural panel closure exposes more scene/labels; the measurement includes that compositing/occlusion difference, not pixel-equivalent compositions.',
    'CPU core equivalents include the observed related browser process cohort; birth granularity is one second and wholly unsampled short children may remain unseen.',
    'Backend CPU includes fake upstream tracker/event producer; GPU-process CPU is not GPU utilization or GPU time.',
    'RSS is the largest single browser process at the window end, not a time-series peak or total physical RAM. JS heap is a separate measurement.',
    'Per-window percentile distributions are not pooled percentiles of every frame/event. Draw-proxy latency is not physical presented screen latency.',
    'Zero-event delay and callback measurements remain null; no observed events does not mean zero latency.',
    'Five signed within-build deltas and five source differences are reported without forcing positive panel cost or selecting CPU outcomes.',
    'Ten restarted jobs do not constitute the continuous sixty-minute stability soak. Native Safari, Retina, energy and physical-screen latency remain unmeasured.',
    'No product optimization or renderer quality change was introduced for this matrix; open RSS mechanism findings remain separate.',
  ],
};
await writeFile(path.join(dir, 'balanced-summary.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, pairs: result.pairs, windows: result.windows, totalReceivedEvents: result.totalReceivedEvents, metricRows, signedPanelDeltas: result.signedPanelDeltas, deltaOfDeltas }, null, 2));
