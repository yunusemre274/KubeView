import test from 'node:test'
import assert from 'node:assert/strict'
import {containersForPod,containerInstances,PointerGesture} from './interactions.js'

test('every regular, init, restartable init and ephemeral container maps to its exact Pod UID and raw name',()=>{
  const resource={kind:'Pod',metadata:{uid:'pod-uid',name:'plain-api-name',namespace:'test'},spec:{containers:[{name:'api'},{name:'metrics'},{name:'proxy'},{name:'fourth'}],initContainers:[{name:'prepare'},{name:'init-sidecar',restartPolicy:'Always'}],ephemeralContainers:[{name:'debug'}]}}
  const instances=containerInstances([resource])
  assert.equal(instances.length,7)
  assert.deepEqual(instances.map(i=>i.containerName),['api','metrics','proxy','fourth','prepare','init-sidecar','debug'])
  assert.deepEqual(instances.map(i=>i.role),['container','container','container','container','init','sidecar','ephemeral'])
  for(const instance of instances){assert.equal(instance.resource.metadata.uid,'pod-uid');assert.equal(instance.resource.metadata.name,'plain-api-name');assert.equal(instance.count,7)}
  assert.equal(containersForPod({spec:{}})[0].containerName,undefined)
})

test('drag greater than 5 CSS pixels suppresses selection including a drag returned to its starting point',()=>{
  const gesture=new PointerGesture(5)
  gesture.down({clientX:100,clientY:100,button:0});gesture.move({clientX:104,clientY:102});gesture.up({clientX:104,clientY:102});assert.equal(gesture.canSelect({delta:4.5}),true)
  gesture.down({clientX:100,clientY:100,button:0});gesture.move({clientX:106,clientY:100});gesture.up({clientX:100,clientY:100});assert.equal(gesture.canSelect({delta:0}),false)
  gesture.down({clientX:100,clientY:100,button:2});gesture.up({clientX:100,clientY:100});assert.equal(gesture.canSelect({delta:0}),false)
  gesture.down({clientX:100,clientY:100,button:0});gesture.up({clientX:100,clientY:100});assert.equal(gesture.canSelect({delta:6}),false)
  gesture.down({clientX:100,clientY:100,button:0});gesture.up({clientX:100,clientY:100});assert.equal(gesture.canSelect({delta:0}),true)
})


test('moving vessel or container identity changing between pointer down/up cancels picking',()=>{
  const gesture=new PointerGesture();gesture.down({clientX:100,clientY:100,button:0});gesture.target('container:uid-old:api');gesture.up({clientX:100,clientY:100})
  assert.equal(gesture.canSelect({delta:0},'container:uid-old:api'),true)
  assert.equal(gesture.canSelect({delta:0},'container:uid-new:api'),false)
  assert.equal(gesture.canSelect({delta:0},'container:uid-old:sidecar'),false)
  gesture.down({clientX:100,clientY:100,button:0});gesture.up({clientX:100,clientY:100});assert.equal(gesture.canSelect({delta:0},'node:appeared-after-down'),false)
})

test('queued fallback shrinks to invisible before the same UID grows on its actual vessel',async()=>{
  const {arrivalVisual}=await import('./interactions.js'),queued={uid:'same-uid',queuedAt:0,wallQueuedAt:0}
  assert.equal(arrivalVisual(queued,null,9000,9000).scale,1)
  const shrink=arrivalVisual(queued,null,9840,9840);assert.equal(shrink.loading,true);assert.equal(shrink.scale,.5)
  assert.equal(arrivalVisual(queued,null,10000,10000).scale,0)
  const active={uid:'same-uid',started:10000,simple:true,duration:320}
  assert.equal(arrivalVisual(null,active,10000).scale,0)
  assert.equal(arrivalVisual(null,active,10160).scale,.5)
  assert.equal(arrivalVisual(null,active,10320).scale,1)
  assert.equal(arrivalVisual(null,null,10321).loading,false)
  assert.equal(active.uid,queued.uid)
})
test('wall-time bound also shrinks fallback while full crane transfers stay opaque',async()=>{
  const {arrivalVisual}=await import('./interactions.js')
  assert.equal(arrivalVisual({queuedAt:0,wallQueuedAt:1000},null,200,10900).scale<1,true)
  assert.equal(arrivalVisual(null,{started:0,simple:false,duration:2100},1000).scale,1)
})

test('a crane handover preserves the existing box visibility instead of replaying its arrival scale', async () => {
  const {arrivalVisual}=await import('./interactions.js');
  const active = {simple:true,preserveScale:true,started:100,duration:700};
  for (const now of [100,101,450,800]) {
    const visual=arrivalVisual(null,active,now);
    assert.equal(visual.scale,1); assert.equal(visual.opacity,1);
  }
});
