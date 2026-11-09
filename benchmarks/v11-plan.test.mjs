import test from 'node:test';
import assert from 'node:assert/strict';
import { v11Jobs } from './repair-session.mjs';

test('release subset is finite and retains paired source/order plus complete soak', () => {
  const jobs = v11Jobs('v11-plan', 'frozen-before', 'frozen-after');
  assert.equal(new Set(jobs.map(j => j.id)).size, jobs.length);
  assert.equal(jobs.reduce((n,j) => n+(j.repeats||1)*j.scenarios.length,0),31);
  for (const group of ['panel','idle','world']) {
    const pairs = jobs.filter(j=>j.group===group);
    assert.equal(pairs.length,6);
    assert.deepEqual(pairs.map(j=>j.phase),['baseline','optimized','optimized','baseline','baseline','optimized']);
    assert.ok(pairs.every(j=>j.warmup===30 && j.seconds===60));
  }
  const long = jobs.filter(j=>j.scenarios.includes('long'));
  assert.equal(long.length,1); assert.equal(long[0].longSeconds,1200);
  assert.equal(long[0].sceneInventory,true);
  assert.ok(jobs.filter(j=>!j.scenarios.includes('long')).every(j=>!j.sceneInventory));
  assert.ok(jobs.some(j=>j.scenarios.includes('events') && j.repeats===3));
  assert.ok(jobs.some(j=>j.scenarios.includes('interaction') && j.repeats===3));
  assert.ok(!jobs.some(j=>j.scenarios.some(s=>s.startsWith('repair-'))));
});
