import * as THREE from "three";
import { vesselPointToWorld } from "./fleet.js";
import { WORKSPACE_DIMENSIONS as W } from "../constants/dimensions.js";

const vector = (value) => Array.isArray(value) && value.length === 3 && value.every((number) => Number.isFinite(number) && Math.abs(number) <= 1e6);
const validFov = (value) => Number.isFinite(value) && value > 0 && value < 180;
const LEGACY_FOV = 38;

function restoreProjection(position, target, previousFov, effectiveFov) {
  if (!validFov(previousFov) || !validFov(effectiveFov)) return null;
  // PerspectiveCamera's visible target-plane height is
  // 2 * distance * tan(effectiveFOV / 2). Move along the saved viewing ray so a
  // new lens preserves that framing, target and angle. Effective FOV already
  // includes camera.zoom; the camera's zoom property itself is never changed.
  const ratio = previousFov === effectiveFov ? 1
    : Math.tan(THREE.MathUtils.degToRad(previousFov / 2)) /
      Math.tan(THREE.MathUtils.degToRad(effectiveFov / 2));
  const restored = ratio === 1 ? position
    : position.map((value, axis) => target[axis] + (value - target[axis]) * ratio);
  return vector(restored) && vector(target) ? { position: restored, target } : null;
}

export function restoreHarborCamera(view, harborId, offset = [0, 0], effectiveFov = LEGACY_FOV) {
  if (!view || !vector(view.position) || !vector(view.target)) return null;
  const previousFov = view.fov === undefined ? LEGACY_FOV : view.fov;
  if (view.space === "harbor-local-v1") {
    if (view.harborId !== harborId) return null;
    return restoreProjection([view.position[0] + offset[0], view.position[1], view.position[2] + offset[1]], [view.target[0] + offset[0], view.target[1], view.target[2] + offset[1]], previousFov, effectiveFov);
  }
  if (view.space) return null;
  // Migrate an old world-space view only when it belongs near this harbor.
  // An interrupted transition in the first candidate could save A as B's view.
  if (harborId && Math.hypot(view.target[0] - offset[0], view.target[2] - offset[1]) > W.PORT_SPACING * 0.7) return null;
  return restoreProjection([...view.position], [...view.target], previousFov, effectiveFov);
}
export function captureHarborCamera(position, target, transition, harborId, offset = [0, 0], effectiveFov = LEGACY_FOV) {
  // During an automatic harbor transition, persist its destination. The current
  // interpolated point can still be over the previous harbor.
  const p = transition?.position || position, t = transition?.target || target;
  if (!vector(p) || !vector(t) || !validFov(effectiveFov)) return null;
  return harborId ? { space: "harbor-local-v1", harborId, fov: effectiveFov, position: [p[0] - offset[0], p[1], p[2] - offset[1]], target: [t[0] - offset[0], t[1], t[2] - offset[1]] } : { fov: effectiveFov, position: [...p], target: [...t] };
}

export function harborFitSamples(scene, fleet, bounds, offset = [0, 0], includeNearby = false, includeAllHarbors = false) {
  const samples = [], instance = new THREE.Matrix4(), matrix = new THREE.Matrix4();
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    for (let parent = object; parent; parent = parent.parent)
      if (!parent.visible || (parent.userData?.workspaceSilhouette && !includeAllHarbors && !(includeNearby && parent.userData?.workspaceDetail))) return;
    if (!object.isMesh || object.name === "harbor:ocean" || object.name === "harbor:vessel-wake" || object.geometry.userData?.waterGrid || object.material?.name?.includes("wake") || ["PlaneGeometry", "RingGeometry"].includes(object.geometry.type)) return;
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    if (!box) return;
    const count = object.isInstancedMesh ? object.count : 1;
    for (let index = 0; index < count; index++) {
      if (object.isInstancedMesh) { object.getMatrixAt(index, instance); matrix.multiplyMatrices(object.matrixWorld, instance); }
      else matrix.copy(object.matrixWorld);
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) samples.push(new THREE.Vector3(x, y, z).applyMatrix4(matrix));
    }
  });
  if (fleet?.motion?.patrol) for (let distance = 0; distance < fleet.route.length; distance += 55) {
    const pose = fleet.route.pose(distance);
    for (const x of [-10, 10]) for (const z of [-38, 38]) for (const y of [0, 20]) {
      const point = vesselPointToWorld(pose, [x, y, z]);
      samples.push(new THREE.Vector3(point[0] + offset[0], point[1], point[2] + offset[1]));
    }
  }
  if (!samples.length) for (const x of [bounds.minX, bounds.maxX]) for (const z of [bounds.minZ, bounds.maxZ]) samples.push(new THREE.Vector3(x + offset[0], 0, z + offset[1]));
  return samples;
}

// Fit in camera space before projecting: points behind an initial camera cannot
// produce an unbounded iterative center correction when a second port appears.
export function fitHarborView(samples, aspect, fov = 38) {
  const points = samples.filter(point => [point.x, point.y, point.z].every(Number.isFinite));
  if (!points.length) points.push(new THREE.Vector3());
  const bounds = new THREE.Box3().setFromPoints(points);
  const center = bounds.getCenter(new THREE.Vector3()); center.y = 0;
  const direction = new THREE.Vector3(0.7, 0.9, 1).normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const vertical = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 0.88;
  const horizontal = vertical * Math.max(0.3, aspect);
  const delta = new THREE.Vector3();
  let distance = 80;
  for (const point of points) {
    delta.copy(point).sub(center);
    const depth = delta.dot(direction);
    distance = Math.max(distance, depth + Math.abs(delta.dot(right)) / horizontal, depth + Math.abs(delta.dot(up)) / vertical);
  }
  return { center, distance, position: center.clone().addScaledVector(direction, distance) };
}

// Keep millimetre-scale pier markings separable at an overview distance. A
// fixed 0.5 m near plane loses centimetres of 24-bit depth precision at 1 km.
export function updateHarborDepth(camera, target, fog) {
  if (!target) return false;
  const distance = camera.position.distanceTo(target), near = Math.max(0.5, distance / 50);
  let changed = false;
  if (Math.abs(near - camera.near) > Math.max(0.0001, near * 0.005)) {
    camera.near = near;
    camera.updateProjectionMatrix();
    changed = true;
  }
  // A narrow viewport can put a valid multi-port overview beyond the old
  // fixed fog horizon. Retain the established close-view atmosphere, while
  // keeping the orbit target readable at global-map distances.
  if (fog) {
    const start = Math.max(2800, distance * .95), end = Math.max(14000, distance * 2);
    if (Math.abs(fog.near - start) > Math.max(.1, start * .005) || Math.abs(fog.far - end) > Math.max(.1, end * .005)) {
      fog.near = start; fog.far = end; changed = true;
    }
  }
  return changed;
}
