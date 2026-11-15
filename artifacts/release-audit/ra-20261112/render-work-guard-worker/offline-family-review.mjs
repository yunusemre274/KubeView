// Read the frozen family; write only new review evidence. No workload execution.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { comparePanels } from '../../../../benchmarks/panel-compare.mjs';
const out = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(out, '../../../..');
const family = path.resolve(out, '../perf-panel-balanced-five-blocks-root');
const hash = data => createHash('sha256').update(data).digest('hex');
const read = async file => JSON.parse(await readFile(file, 'utf8'));
const write = (name, data) => writeFile(path.join(out, name), JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
const original = await readFile(path.join(out, 'panel-compare.mjs.before.txt'), 'utf8');
assert.equal(hash(original), 'd3c2927c658909b0a297b2ba43327167eacfb2d09a597270ee0c275e17b52646');
// Import the exact original implementation with only its two relative module
// locations rebound to their original benchmark directory. Preserve source text.
const originalURL = pathToFileURL(path.join(root, 'benchmarks/panel-compare.mjs'));
const rebound = original.replace(/from (["'])(\.\/[^"']+)\1/g,
  (_, quote, specifier) => `from ${JSON.stringify(new URL(specifier, originalURL).href)}`);
const old = await import('data:text/javascript;base64,' + Buffer.from(rebound).toString('base64'));
const execution = await read(path.join(family, 'execution.json'));
const sides = { A: [], B: [] };
for (const job of execution.jobs) {
  const prefix = `p${job.pair}-${job.side}`;
  const report = await read(path.join(family, prefix + '-runner-summary.json'));
  report.processSamples = await read(path.join(family, prefix + '-process-samples.json'));
  sides[job.side].push(report);
}
assert.equal(sides.A.flatMap(report => report.runs).length, 20);
assert.equal(sides.B.flatMap(report => report.runs).length, 20);
const before = old.comparePanels(sides.A, sides.B);
const after = comparePanels(sides.A, sides.B);
assert.equal(before.comparable, true, 'Original automatic false positive must be reproduced');
assert.equal(after.comparable, false);
assert.equal(after.renderWorkReview.status, 'REQUIRES_RENDER_EQUIVALENCE_REVIEW');
for (const key of ['table', 'deltas', 'samples', 'inputs']) assert.deepEqual(after[key], before[key]);
const target = after.renderWorkReview.pairs.find(pair => pair.block === 3 && pair.scenario === 'panel-open-events');
assert.ok(target.differences.some(row => row.path === 'before.stats.calls' && row.before === 426 && row.after === 427));
assert.ok(target.differences.some(row => row.path === 'before.stats.lines' && row.before === 60 && row.after === 72));
const captured = await read(path.join(out, 'historical-inputs-before.json'));
for (const [file, expected] of Object.entries(captured)) assert.equal(hash(await readFile(path.join(root, file))), expected, file);
await write('offline-before.json', before);
await write('offline-after.json', after);
await write('offline-result.json', {
  status: 'PASS_OFFLINE_GUARD_RETEST_NO_NEW_MEASUREMENTS',
  originalComparable: before.comparable, correctedComparable: after.comparable,
  renderWorkStatus: after.renderWorkReview.status,
  affectedPairedCells: after.renderWorkReview.pairs.filter(pair => pair.status !== 'MATCHED_COUNTERS_ONLY').length,
  knownCounterExample: target, numericTableDeltasSamplesInputsUnchanged: true,
  historicalFilesVerifiedUnchanged: Object.keys(captured).length,
  originalSourceSHA256: hash(original),
  currentSourceSHA256: hash(await readFile(path.join(root, 'benchmarks/panel-compare.mjs'))),
  importRebinding: 'Only original relative imports resolved to their original directory; original source preserved.',
  newPerformanceWindows: 0,
});
console.log(JSON.stringify({ originalComparable: before.comparable, correctedComparable: after.comparable,
  renderWorkStatus: after.renderWorkReview.status, numericOutputsUnchanged: true,
  historicalFilesVerifiedUnchanged: Object.keys(captured).length }));
