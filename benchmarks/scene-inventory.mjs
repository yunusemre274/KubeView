// Read-only checkpoint inventory. Called by the existing harness inventory only;
// no frame wrapper, timer, listener, strong history or product state is installed.
export function readSceneInventory(scene, renderer) {
  if (!scene || typeof scene.traverse !== 'function') throw Error('Scene inventory requires the existing Harbor scene');
  const geometries = new Set(), materials = new Set();
  let objects = 0;
  const add = (set, value) => { if (value && (typeof value === 'object' || typeof value === 'function')) set.add(value); };
  scene.traverse(object => {
    objects++;
    add(geometries, object.geometry);
    for (const field of ['material', 'customDepthMaterial', 'customDistanceMaterial', 'overrideMaterial']) {
      const value = object[field];
      if (Array.isArray(value)) for (const item of value) add(materials, item);
      else add(materials, value);
    }
  });
  const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
  return {
    version: 'scene-inventory-v1', sampledAtMs: performance.now(),
    sceneReachable: { objects, geometries: geometries.size, materials: materials.size },
    gpuRendererInfo: { geometries: count(renderer?.info?.memory?.geometries), textures: count(renderer?.info?.memory?.textures), programs: count(renderer?.info?.programs?.length) },
    scope: 'Distinct identities reachable from the current scene, including hidden/offscreen meshes, shared/material arrays and custom depth/distance/scene-override materials. Temporary identity sets are released after this call. GPU renderer info is a different inventory of allocated objects/cached programs, not bytes or VRAM. Renderer-generated and off-scene materials are excluded; no retained-resource/GC-completion or leak-proof claim.',
  };
}
