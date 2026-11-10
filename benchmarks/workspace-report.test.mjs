import test from 'node:test';
import assert from 'node:assert/strict';
import { workspacePairs, workspacePanelDeltas } from './workspace-report.mjs';

function cell({ group, profile = 'M', harbors, repeat, phase = 'optimized', scenario = 'living', cpu = 0.5 }) {
  return { group, profile, harbors, repeat, phase, scenario, runID: `${group}-${profile}-${harbors}-${repeat}`,
    manifest: { fixtureSHA256: { M: 'M', L: 'L' } },
    before: { preferences: { sea: true }, dpr: 1, rendererPixelRatio: 1, renderer: 'Metal', camera: { position: [1, 2, 3] }, buffer: { width: 1440, height: 900 },
      stats: { calls: 200, triangles: 40000, points: 0, lines: 0, lifecycle: { canonicalNodes: profile === 'M' ? 20 : 50, canonicalPods: profile === 'M' ? 300 : 1500, visibleNodes: 8, visiblePods: profile === 'M' ? 120 : 270 } }, fleet: [{ uid: 'node-0' }], panel: { open: false }, logView: null },
    process: { browserCores: cpu, backendCores: 0.001 } };
}
function families() {
  const rows = [];
  for (let repeat = 0; repeat < 3; repeat++) {
    for (const profile of ['M', 'L']) for (const harbors of [1, 5, 10, 20]) rows.push(cell({ group: 'workspace-overhead', repeat, profile, harbors, cpu: 0.5 + harbors / 10000 }));
    for (const phase of ['baseline', 'optimized']) rows.push(cell({ group: 'workspace-source', repeat, phase, harbors: phase === 'baseline' ? 0 : 1 }));
  }
  return rows;
}
test('workspace report never pools old source controls with four-condition harbor overhead', () => {
  const rows = families(), result = workspacePairs(rows);
  assert.deepEqual(result.reasons, []); assert.equal(result.pairs.length, 21);
  assert.equal(result.pairs.filter((p) => p.family === 'old-vs-new-single-harbor').length, 3);
  assert.equal(result.pairs.filter((p) => p.family === 'registered-harbor-overhead').length, 18);
  assert.ok(result.pairs.every((p) => p.identicalDrawWork));
  const altered = structuredClone(rows); altered.find((r) => r.harbors === 20).before.stats.triangles++;
  const feature = workspacePairs(altered);
  assert.equal(feature.pairs.filter((p) => !p.identicalDrawWork).length, 1, 'Real extra feature draw work must be visible, never silently equal');
  const missing = rows.filter((r) => !(r.group === 'workspace-overhead' && r.profile === 'M' && r.harbors === 1 && r.repeat === 0));
  assert.equal(workspacePairs(missing).reasons.length, 3);
  const duplicate = [...rows, structuredClone(rows[0])]; assert.equal(workspacePairs(duplicate).reasons.length, 3);
  const stale = structuredClone(rows); stale[1].before.stats.lifecycle.visiblePods--;
  assert.match(workspacePairs(stale).reasons.join(), /Active workload differs/);
});
test('panel report retains negative matched deltas and rejects different frozen camera/fleet', () => {
  const rows = [];
  for (let repeat = 0; repeat < 3; repeat++) for (const scenario of ['panel-closed', 'panel-open']) rows.push(cell({ group: 'workspace-panel', repeat, harbors: 20, scenario, cpu: scenario === 'panel-open' ? 0.49 : 0.5 }));
  const result = workspacePanelDeltas(rows);
  assert.deepEqual(result.reasons, []); assert.equal(result.pairs.length, 3); assert.ok(result.pairs.every((p) => p.deltaPanel < 0));
  rows[1].before.camera.position[0]++;
  assert.match(workspacePanelDeltas(rows).reasons.join(), /Panel frozen camera\/fleet differs/);
});
