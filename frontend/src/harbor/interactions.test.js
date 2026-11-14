import test from 'node:test'
import assert from 'node:assert/strict'
import {containersForPod,containerInstances,PointerGesture,resourceLabelPosition} from './interactions.js'

test('selected resource labels fit all canvas edges without changing their world anchor or reading layout per frame', () => {
  assert.deepEqual(resourceLabelPosition(300, 200, 200, 48, 1440, 900, true), [426, 188]);
  for (const [w,h] of [[1440,900],[768,900],[390,844]]) {
    for (const [x,y] of [[w-5,h/2],[5,5],[w+100,h+100],[-100,-100]]) {
      for (const pod of [true,false]) {
        const labelWidth=Math.min(420,w-32), labelHeight=72, offset=12;
        const [left,top]=resourceLabelPosition(x,y,labelWidth,labelHeight,w,h,pod,offset);
        assert.ok(left+offset-labelWidth/2>=16 && left+offset+labelWidth/2<=w-16);
        assert.ok(top-labelHeight/2>=16 && top+labelHeight/2<=h-16);
      }
    }
  }
});

test('selected labels avoid cached harbor nameplates while staying within phone and desktop bounds', () => {
  for (const [w,h] of [[390,844],[768,900],[1440,900]]) {
    const box = {left:w/2-55,right:w/2+55,top:h/2-18,bottom:h/2+18};
    const width=Math.min(220,w-32),height=80,offset=12;
    const [x,y]=resourceLabelPosition(w/2-120,h/2+15,width,height,w,h,true,offset,[box]);
    const left=x+offset-width/2,right=x+offset+width/2,top=y-height/2,bottom=y+height/2;
    assert.ok(left>=16 && right<=w-16 && top>=16 && bottom<=h-16);
    assert.ok(right<=box.left-8 || left>=box.right+8 || bottom<=box.top-8 || top>=box.bottom+8);
  }
});

test('bounded collision placement is deterministic and preserves visible labels when no free space exists', () => {
  const boxes=[{left:16,right:374,top:16,bottom:828}];
  const args=[190,400,220,80,390,844,true,0,boxes];
  assert.deepEqual(resourceLabelPosition(...args),resourceLabelPosition(...args));
  const [x,y]=resourceLabelPosition(...args);
  assert.ok(Number.isFinite(x)&&Number.isFinite(y));
  assert.ok(x>=126&&x<=264&&y>=56&&y<=788);
  assert.deepEqual(resourceLabelPosition(300,200,200,48,1440,900,true,0,[{left:1000,right:1200,top:600,bottom:650}]),[426,188]);
});

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
