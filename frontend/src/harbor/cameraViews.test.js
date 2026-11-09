import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { captureHarborCamera, restoreHarborCamera, harborFitSamples } from "./cameraViews.js";
import { safeHarborView } from "../world/workspace.js";

test("50 interrupted switches save each harbor's intended destination rather than the previous interpolated camera", () => {
  const saved = new Map(), ports = [{ id: "a", offset: [0, 0] }, { id: "b", offset: [1400, 0] }];
  for (let index = 0; index < 50; index++) {
    const port = ports[index % 2], position = [port.offset[0] + 215, 337, 511], target = [port.offset[0], 0, 170];
    const view = captureHarborCamera([215, 337, 511], [0, 0, 170], { position, target }, port.id, port.offset);
    saved.set(port.id, safeHarborView({ camera: view }).camera);
    const restored = restoreHarborCamera(saved.get(port.id), port.id, port.offset);
    assert.deepEqual(restored.position, position); assert.deepEqual(restored.target, target);
  }
  assert.equal(restoreHarborCamera(saved.get("a"), "b", [1400, 0]), null);
  assert.equal(restoreHarborCamera({ position: [215, 337, 511], target: [0, 0, 170] }, "b", [1400, 0]), null);
  assert.deepEqual(restoreHarborCamera(saved.get("b"), "b", [2800, 200]).position, [3015, 337, 711]);
});
test("active camera fit samples are translation invariant including fleet route and exclude remote LOD", () => {
  const geometry = new THREE.BoxGeometry(10, 10, 10), material = new THREE.MeshBasicMaterial();
  const scene = (offset) => {
    const root = new THREE.Scene(), active = new THREE.Group(), remote = new THREE.Group();
    active.position.set(offset[0], 0, offset[1]); active.add(new THREE.Mesh(geometry, material));
    remote.userData.workspaceSilhouette = true; remote.position.set(-10000, 0, -10000); remote.add(new THREE.Mesh(geometry, material));
    root.add(active, remote); return root;
  };
  const fleet = { motion: { patrol: true }, route: { length: 110, pose: (distance) => ({ position: [distance, 0, 30], yaw: 0 }) } };
  try {
    const a = harborFitSamples(scene([0, 0]), fleet, {}, [0, 0]), b = harborFitSamples(scene([1400, 200]), fleet, {}, [1400, 200]);
    assert.equal(a.length, b.length); assert.ok(a.length > 8, "actual route envelope is included");
    for (let index = 0; index < a.length; index++) {
      assert.ok(Math.abs(b[index].x - a[index].x - 1400) < 1e-9);
      assert.ok(Math.abs(b[index].z - a[index].z - 200) < 1e-9);
      assert.equal(a[index].y, b[index].y);
      assert.ok(a[index].x > -1000, "inactive harbor cannot affect active fit");
    }
  } finally { geometry.dispose(); material.dispose(); }
});
test("empty harbor fit fallback and user camera capture retain the correct coordinate frame", () => {
  const samples = harborFitSamples(new THREE.Scene(), null, { minX: -10, maxX: 10, minZ: -20, maxZ: 20 }, [1400, 200]);
  assert.deepEqual(samples.map((point) => point.toArray()), [[1390, 0, 180], [1390, 0, 220], [1410, 0, 180], [1410, 0, 220]]);
  const captured = captureHarborCamera([1500, 60, 300], [1400, 0, 200], null, "b", [1400, 200]);
  assert.deepEqual(captured.position, [100, 60, 100]); assert.deepEqual(restoreHarborCamera(captured, "b", [1400, 200]).position, [1500, 60, 300]);
});
