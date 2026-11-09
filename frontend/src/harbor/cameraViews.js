import * as THREE from "three";
import { vesselPointToWorld } from "./fleet.js";
import { WORKSPACE_DIMENSIONS as W } from "../constants/dimensions.js";

const vector = (value) => Array.isArray(value) && value.length === 3 && value.every((number) => Number.isFinite(number) && Math.abs(number) <= 1e6);
export function restoreHarborCamera(view, harborId, offset = [0, 0]) {
  if (!view || !vector(view.position) || !vector(view.target)) return null;
  if (view.space === "harbor-local-v1") {
    if (view.harborId !== harborId) return null;
    return { position: [view.position[0] + offset[0], view.position[1], view.position[2] + offset[1]], target: [view.target[0] + offset[0], view.target[1], view.target[2] + offset[1]] };
  }
  if (view.space) return null;
  // Migrate an old world-space view only when it belongs near this harbor.
  // An interrupted transition in the first candidate could save A as B's view.
  if (harborId && Math.hypot(view.target[0] - offset[0], view.target[2] - offset[1]) > W.PORT_SPACING * 0.7) return null;
  return { position: [...view.position], target: [...view.target] };
}
export function captureHarborCamera(position, target, transition, harborId, offset = [0, 0]) {
  // During an automatic harbor transition, persist its destination. The current
  // interpolated point can still be over the previous harbor.
  const p = transition?.position || position, t = transition?.target || target;
  if (!vector(p) || !vector(t)) return null;
  return harborId ? { space: "harbor-local-v1", harborId, position: [p[0] - offset[0], p[1], p[2] - offset[1]], target: [t[0] - offset[0], t[1], t[2] - offset[1]] } : { position: [...p], target: [...t] };
}

export function harborFitSamples(scene, fleet, bounds, offset = [0, 0]) {
  const samples = [], instance = new THREE.Matrix4(), matrix = new THREE.Matrix4();
  scene.updateMatrixWorld(true);
  scene.traverse((object) => {
    for (let parent = object; parent; parent = parent.parent)
      if (!parent.visible || parent.userData?.workspaceSilhouette) return;
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
