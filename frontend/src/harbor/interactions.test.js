import test from 'node:test'
import assert from 'node:assert/strict'
import {containersForPod,containerInstances,PointerGesture} from './interactions.js'

test('every regular, init, restartable init and ephemeral container maps to its exact Pod UID and raw name',()=>{
  const resource={kind:'Pod',metadata:{uid:'pod-uid',name:'plain-api-name',namespace:'test'},spec:{containers:[{name:'api'},{name:'metrics'},{name:'proxy'},{name:'fourth'}],initContainers:[{name:'prepare'},{name:'init-sidecar',restartPolicy:'Always'}],ephemeralContainers:[{name:'debug'}]}}
  const instances=containerInstances([resource])
  assert.equal(instances.length,7)
  assert.deepEqual(instances.map(i=>i.containerName),['api','metrics','proxy','fourth','prepare','init-sidecar','debug'])
  assert.deepEqual(instances.map(i=>i.role),['container','container','container','container','init','init','ephemeral'])
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
