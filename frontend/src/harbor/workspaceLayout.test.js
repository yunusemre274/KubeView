import test from 'node:test';
import assert from 'node:assert/strict';
import { harborWorldPosition } from '../world/workspace.js';
import { HarborRoute, vesselsOverlap, vesselHitsLand, FLEET_OBSTACLES } from './fleet.js';

test('default neighboring port routes clear hulls and the other port land in both grid axes', () => {
  const route = new HarborRoute(), samples = [];
  // Full 72 m hull capsules + 4 m margin, not only route center lines.
  for (let distance = 0; distance < route.length; distance += 10) samples.push(route.pose(distance));
  for (const position of [[1300, 0], [0, 1300], [1300, 1300]]) {
    const [x, z] = harborWorldPosition({ position });
    const shiftedLand = FLEET_OBSTACLES.map(box => ({ ...box, minX: box.minX + x, maxX: box.maxX + x, minZ: box.minZ + z, maxZ: box.maxZ + z }));
    for (const a of samples) {
      assert.equal(vesselHitsLand(a, shiftedLand), false, `other port land ${position}`);
      for (const b of samples) assert.equal(vesselsOverlap(a, { ...b, position: [b.position[0] + x, b.position[1], b.position[2] + z] }, 4), false, `overlap at grid ${position}`);
    }
  }
});
