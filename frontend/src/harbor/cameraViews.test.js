import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { captureHarborCamera, restoreHarborCamera, harborFitSamples, fitHarborView } from "./cameraViews.js";
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

test("UI2 camera fit frames two ports without near-plane runaway on desktop and narrow screens", () => {
  for (const aspect of [1672/941,1440/900,1280/800,768/900]) {
    const points = [0,550].flatMap(x => [-212,212].flatMap(dx => [-183,276].flatMap(z => [0,42].map(y => new THREE.Vector3(x+dx,y,z+x*.44)))));
    const fit = fitHarborView(points, aspect), camera = new THREE.PerspectiveCamera(38,aspect,.5,10000);
    camera.position.copy(fit.position); camera.lookAt(fit.center); camera.updateMatrixWorld();
    assert.ok(fit.distance < 4000 && fit.distance > 80);
    for (const point of points) { const ndc=point.clone().project(camera); assert.ok(Math.abs(ndc.x)<=.881); assert.ok(Math.abs(ndc.y)<=.881); assert.ok(ndc.z>-1 && ndc.z<1); }
    const shifted = fitHarborView(points.map(p=>p.clone().add(new THREE.Vector3(5000,0,2000))),aspect);
    assert.ok(Math.abs(shifted.distance-fit.distance)<1e-8);
    assert.ok(shifted.position.clone().sub(fit.position).distanceTo(new THREE.Vector3(5000,0,2000))<1e-8);
  }
});

test("legacy 38-degree view migrates to 24 degrees without cropping or changing target and viewing angle", () => {
  const aspect = 1440 / 900;
  const points = [-212, 212].flatMap(x => [-183, 276].flatMap(z => [0, 42].map(y => new THREE.Vector3(x, y, z))));
  const fit = fitHarborView(points, aspect, 38);
  const legacy = { space: "harbor-local-v1", harborId: "a", position: fit.position.toArray(), target: fit.center.toArray() };
  const restored = restoreHarborCamera(legacy, "a", [0, 0], 24);
  const before = new THREE.PerspectiveCamera(38, aspect, .5, 10000);
  const after = new THREE.PerspectiveCamera(24, aspect, .5, 10000);
  before.position.copy(fit.position); before.lookAt(fit.center); before.updateMatrixWorld();
  after.position.fromArray(restored.position); after.lookAt(new THREE.Vector3(...restored.target)); after.updateMatrixWorld();
  assert.deepEqual(restored.target, legacy.target);
  assert.ok(1 - Math.abs(before.quaternion.dot(after.quaternion)) < 1e-12, "viewing angle is unchanged");
  assert.equal(after.zoom, 1, "lens migration does not write camera.zoom");
  for (const point of points) {
    const ndc = point.clone().project(after);
    assert.ok(Math.abs(ndc.x) < 1 && Math.abs(ndc.y) < 1, "existing harbor remains in view");
  }
  // Perspective necessarily changes away from this plane. Preserve apparent
  // scale at the OrbitControls target, not an impossible pixel-identical image.
  for (const [x, y] of [[-100, -60], [100, 60], [-100, 60], [100, -60]]) {
    const point = new THREE.Vector3(x, y, 0).applyQuaternion(before.quaternion).add(fit.center);
    const a = point.clone().project(before), b = point.clone().project(after);
    assert.ok(Math.abs(a.x - b.x) < 1e-12 && Math.abs(a.y - b.y) < 1e-12);
  }
  assert.deepEqual(legacy.position, fit.position.toArray(), "the saved record is not mutated");
});

test("captured effective FOV respects camera zoom and repeated restores do not drift", () => {
  const before = new THREE.PerspectiveCamera(38, 1.6, .5, 10000), after = new THREE.PerspectiveCamera(24, 1.6, .5, 10000);
  before.zoom = 1.25; after.zoom = 1.6;
  before.updateProjectionMatrix(); after.updateProjectionMatrix();
  const target = [500, 0, -200], position = [700, 250, 140], offset = [500, -200];
  const captured = captureHarborCamera(position, target, null, "b", offset, before.getEffectiveFOV());
  assert.equal(captured.fov, before.getEffectiveFOV());
  let restored = restoreHarborCamera(captured, "b", offset, after.getEffectiveFOV());
  const first = [...restored.position];
  const heightBefore = new THREE.Vector3(...position).distanceTo(new THREE.Vector3(...target)) * Math.tan(THREE.MathUtils.degToRad(before.getEffectiveFOV() / 2));
  const heightAfter = new THREE.Vector3(...restored.position).distanceTo(new THREE.Vector3(...restored.target)) * Math.tan(THREE.MathUtils.degToRad(after.getEffectiveFOV() / 2));
  assert.ok(Math.abs(heightBefore - heightAfter) < 1e-10);
  for (let i = 0; i < 50; i++) {
    const view = captureHarborCamera(restored.position, restored.target, null, "b", offset, after.getEffectiveFOV());
    restored = restoreHarborCamera(view, "b", offset, after.getEffectiveFOV());
    assert.deepEqual(restored.position, first);
    assert.deepEqual(restored.target, target);
  }
  assert.equal(after.zoom, 1.6);
});

test("camera FOV validation rejects degenerate lenses while unversioned captures remain compatible", () => {
  const position = [200, 300, 400], target = [0, 0, 0];
  for (const fov of [0, -1, 180, Infinity, NaN, "24", null]) {
    assert.equal(captureHarborCamera(position, target, null, null, [0, 0], fov), null);
    assert.equal(restoreHarborCamera({ position, target, fov }, null, [0, 0], 24), null);
    assert.equal(restoreHarborCamera({ position, target }, null, [0, 0], fov), null);
  }
  assert.deepEqual(restoreHarborCamera({ position, target }, null), { position, target });
  const transition = { position: [300, 400, 500], target: [0, 0, 100] };
  const captured = captureHarborCamera(position, target, transition, "a", [0, 0], 24);
  assert.equal(captured.fov, 24);
  assert.deepEqual(captured.position, transition.position);
  assert.deepEqual(captured.target, transition.target);
});
