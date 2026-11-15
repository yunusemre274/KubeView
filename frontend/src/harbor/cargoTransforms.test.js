import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { vesselPointToWorld } from "./fleet.js";
import { writeCargoMatrix } from "./cargoTransforms.js";

test("vessel box basis preserves the existing world transform through turns, bob and arrival scale", () => {
  for (const yaw of [0, Math.PI / 2, -2.7, Math.PI])
    for (const scale of [0, 0.2, 1]) {
      const pose = {
        position: [52, 0.06, -78],
        yaw,
        pitch: 0.017,
        roll: -0.023,
      };
      const anchor = [2.3, 6.1, 11.4],
        offset = [-0.8, 0.7, 1.9],
        size = [0.055, 2.2, 0.06];
      const expected = new THREE.Object3D();
      expected.position.set(
        ...vesselPointToWorld(
          pose,
          anchor.map((n, i) => n + offset[i]),
        ),
      );
      expected.rotation.set(pose.pitch, pose.yaw, pose.roll, "YXZ");
      expected.scale.set(...size.map((n) => n * Math.max(0.0001, scale)));
      expected.updateMatrix();
      const basis = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(pose.pitch, pose.yaw, pose.roll, "YXZ"),
      );
      basis.setPosition(...pose.position);
      const actual = writeCargoMatrix(
        new THREE.Matrix4(),
        basis,
        anchor,
        offset,
        size,
        scale,
      );
      actual.elements.forEach((n, i) =>
        assert.ok(Math.abs(n - expected.matrix.elements[i]) < 1e-9),
      );
    }
});

test("pending and crane world-space loads retain their offset, size and orientation", () => {
  const basis = new THREE.Matrix4().makeTranslation(-90, 25, 30),
    out = new THREE.Matrix4();
  writeCargoMatrix(out, basis, [0, 0, 0], [1, 2, 3], [2, 3, 4], 0.5);
  assert.deepEqual(
    out.elements,
    [1, 0, 0, 0, 0, 1.5, 0, 0, 0, 0, 2, 0, -89, 27, 33, 1],
  );
});
