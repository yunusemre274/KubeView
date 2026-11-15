import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readSceneInventory} from './scene-inventory.mjs';
test('deduplicates shared and array/depth/distance/override materials including hidden meshes',()=>{
  const g={}, m={}, depth={}, distance={}, override={}, nodes=[{geometry:g,material:[m,m],customDepthMaterial:depth,overrideMaterial:override},{visible:false,geometry:g,material:m,customDistanceMaterial:distance}];
  const result=readSceneInventory({traverse:visit=>nodes.forEach(visit)},{info:{memory:{geometries:7,textures:3},programs:[{},{}]}});
  assert.deepEqual(result.sceneReachable,{objects:2,geometries:1,materials:4});
  assert.deepEqual(result.gpuRendererInfo,{geometries:7,textures:3,programs:2});
});
test('fresh checkpoint inventory observes removal/replacement and retains no resource history',()=>{
  const nodes=[{geometry:{},material:{}}],scene={traverse:visit=>nodes.forEach(visit)};
  assert.equal(readSceneInventory(scene).sceneReachable.materials,1);
  nodes.length=0;
  assert.deepEqual(readSceneInventory(scene).sceneReachable,{objects:0,geometries:0,materials:0});
  nodes.push({material:{}});
  assert.equal(readSceneInventory(scene).sceneReachable.materials,1);
  assert.equal(readSceneInventory(scene).gpuRendererInfo.geometries,null);
});
test('serialized browser function schedules nothing and preserves input objects',()=>{
  let scheduled=0;
  const fail=()=>{scheduled++;throw Error('Unexpected scheduler')};
  const context=vm.createContext({performance:{now:()=>12},setTimeout:fail,setInterval:fail,requestAnimationFrame:fail});
  const read=vm.runInContext(`(${readSceneInventory.toString()})`,context);
  const material=Object.freeze({}),geometry=Object.freeze({}),object=Object.freeze({material,geometry});
  const result=read({traverse:visit=>visit(object)});
  assert.equal(result.sceneReachable.materials,1);assert.equal(result.sampledAtMs,12);assert.equal(scheduled,0);
  assert.throws(()=>read(null),/existing Harbor scene/);
});
