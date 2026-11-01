import test from 'node:test'
import assert from 'node:assert/strict'
import { HarborSlots, TransferCoordinator, berthPosition, deckPosition, readyState, resourcePosition, sceneBounds, ContainerTransitions, containerProblem, craneBerth, nodeWindow, transferPosition, uidOf } from './layout.js'
import { HARBOR_DIMENSIONS as D } from '../constants/dimensions.js'

const node = (uid,name=uid) => ({kind:'Node',metadata:{uid,name},status:{conditions:[{type:'Ready',status:'True'}]}})
const pod = (uid,nodeName='',additional={}) => ({kind:'Pod',metadata:{uid,name:uid,namespace:'test'},spec:{nodeName,containers:[{name:'web'}]},status:{phase:'Running'},...additional})

test('50 stable node berths stay off land, off piers and do not intersect',()=>{
  const boxes=Array.from({length:50},(_,i)=>{const p=berthPosition(i);return {x:p[0],z:p[2]}})
  for(const a of boxes){
    assert.ok(a.z-D.SHIP_LENGTH/2>D.PIER_START_Z)
    for(const x of [-80,0,80]) assert.ok(Math.abs(a.x-x)>(D.SHIP_WIDTH+D.PIER_WIDTH)/2)
    for(const b of boxes) if(a!==b) assert.ok(Math.abs(a.x-b.x)>D.SHIP_WIDTH||Math.abs(a.z-b.z)>D.SHIP_LENGTH)
  }
  assert.ok(sceneBounds(49).maxZ>boxes[49].z+D.SHIP_LENGTH/2)
})

test('UPDATE, filtered display and deletes preserve UID slots; new UID is distinct',()=>{
  const slots=new HarborSlots();const a=node('uid-a','same-name'), b=node('uid-b')
  assert.equal(slots.node(uidOf(a)),0);assert.equal(slots.node(uidOf(b)),1)
  slots.reconcile([b]);assert.equal(slots.node(uidOf(b)),1)
  assert.equal(slots.node(uidOf(node('replacement','same-name'))),0)
  assert.equal(slots.pod('p',uidOf(b)),0);assert.equal(slots.pod('q',uidOf(b)),1);assert.equal(slots.pod('p',uidOf(b)),0)
})

test('pending Pods use dock apron without synthetic Node',()=>{
  const slots=new HarborSlots(), nodes=new Map([['worker',node('n','worker')]])
  const p=resourcePosition(pod('pending'),nodes,slots)
  assert.ok(p[2]<D.PIER_START_Z)
  assert.equal(slots.nodes.size,0)
  const placed=resourcePosition(pod('scheduled','worker'),nodes,slots)
  assert.equal(slots.nodes.size,1);assert.ok(placed[2]>D.PIER_START_Z)
})

test('initial snapshot has no transfers, schedule transition runs once, DELETE cancels',()=>{
  const slots=new HarborSlots(), nodes=new Map([['worker',node('n','worker')]]), c=new TransferCoordinator()
  assert.equal(c.observe([pod('old','worker'),pod('p')],nodes,slots,false,0).length,0)
  assert.equal(c.observe([pod('old','worker'),pod('p','worker')],nodes,slots,false,10).length,1)
  assert.equal(c.observe([pod('old','worker'),pod('p','worker')],nodes,slots,false,30).length,1)
  c.observe([pod('old','worker')],nodes,slots,false,50)
  assert.equal(c.active.length,0);assert.equal(c.queue.length,0)
})

test('bounded queue, one load per crane, canceled nodes, context reset and reduced motion',()=>{
  const slots=new HarborSlots(), nodes=new Map([['worker',node('n','worker')]]), c=new TransferCoordinator()
  c.observe([],nodes,slots,false,0)
  c.observe(Array.from({length:60},(_,i)=>pod(`p${i}`,'worker')),nodes,slots,false,1)
  assert.equal(c.active.length,1);assert.ok(c.queue.length<=D.MAX_QUEUED_TRANSFERS)
  c.observe([pod('p59','worker')],new Map(),slots,false,2)
  assert.equal(c.active.length,0);assert.equal(c.queue.length,0)
  c.reset();assert.equal(c.previous,null)
  c.observe([],nodes,slots,true,0);c.observe([pod('new','worker')],nodes,slots,true,1)
  assert.equal(c.active.length,0)
})

test('Running is distinct from Ready; failures, completed, deletion and Unknown are distinct',()=>{
  assert.equal(readyState(pod('p','worker')),'starting')
  assert.equal(readyState(pod('p','worker',{status:{phase:'Running',conditions:[{type:'Ready',status:'True'}]}})),'ready')
  assert.equal(readyState(pod('p','worker',{status:{phase:'Succeeded'}})),'completed')
  assert.equal(readyState(pod('p','worker',{status:{containerStatuses:[{state:{waiting:{reason:'ImagePullBackOff'}}}]}})),'failed')
  assert.equal(readyState({...node('n'),status:{conditions:[{type:'Ready',status:'Unknown'}]}}),'unknown')
  assert.equal(readyState({...pod('p'),metadata:{uid:'p',deletionTimestamp:'now'}}),'terminating')
})

test('transfer ends exactly at canonical container position; decks are above hull',()=>{
  const t={origin:[0,2,0],destination:[26,5.45,42],started:0}
  assert.deepEqual(transferPosition(t,0),t.origin)
  assert.deepEqual(transferPosition(t,D.TRANSFER_SECONDS*1000),t.destination)
  assert.ok(transferPosition(t,800)[1]>t.destination[1])
  for(let i=0;i<300;i++)assert.ok(deckPosition(i)[1]-D.CONTAINER_HEIGHT/2>=D.SHIP_DECK_Y)
})


test('churn reuses freed slots without growing deck tiers or moving surviving UIDs',()=> {
  const slots=new HarborSlots(),n=node('n','worker'),survivor=pod('survivor','worker')
  slots.node('n');assert.equal(slots.pod('survivor','n'),0)
  for(let i=0;i<2000;i++) {
    const p=pod(`transient-${i}`,'worker')
    slots.reconcile([n,survivor]);assert.equal(slots.pod(p.metadata.uid,'n'),1)
    slots.reconcile([n,survivor,p]);assert.equal(slots.pod('survivor','n'),0)
  }
  slots.reconcile([n,survivor])
  assert.equal(slots.nextPod.get('n'),2);assert.equal(slots.pods.size,1)
  for(let i=0;i<2000;i++) {slots.node(`transient-node-${i}`);slots.reconcile([n,survivor])}
  assert.equal(slots.nextNode,2);assert.equal(slots.nodes.size,1)
})

test('one physical crane per pier, including central pier shared by both basin sides',()=> {
  const nodes=Array.from({length:4},(_,i)=>node(`n${i}`,`worker${i}`)),map=new Map(nodes.map(n=>[n.metadata.name,n])),slots=new HarborSlots(),c=new TransferCoordinator()
  nodes.forEach(n=>slots.node(uidOf(n)))
  c.observe([],map,slots,false,0)
  c.observe(nodes.map((n,i)=>pod(`p${i}`,n.metadata.name)),map,slots,false,1)
  assert.equal(c.active.length,3);assert.equal(c.queue.length,1)
  assert.deepEqual(craneBerth(1).id,craneBerth(2).id)
})

test('restart and OOM transitions emit once per container fingerprint; initial state and old OOM never replay',()=> {
  const t=new ContainerTransitions()
  const sample=(count,finished,reason='OOMKilled')=>pod('same','worker',{status:{containerStatuses:[{name:'app',restartCount:count,state:{running:{}},lastState:{terminated:{reason,finishedAt:finished}}}]}})
  assert.equal(t.observe([sample(2,'old')],0).length,0)
  assert.equal(t.observe([sample(3,'new')],1).length,1)
  for(let i=2;i<30;i++){const events=t.observe([sample(3,'new')],i);assert.equal(events.length,1);assert.equal(events[0].started,1)}
  assert.equal(t.observe([sample(3,'new')],3000).length,0)
  assert.equal(t.observe([sample(3,'new')],3100).length,0)
  assert.equal(t.observe([],3200).length,0)
  assert.equal(t.observe([sample(3,'new')],3300).length,0)
  assert.equal(containerProblem(sample(3,'new')),null)
  const waiting=reason=>pod('p','worker',{status:{containerStatuses:[{name:'app',state:{waiting:{reason}}}]}})
  assert.notEqual(containerProblem(waiting('CrashLoopBackOff')).symbol,containerProblem(waiting('ImagePullBackOff')).symbol)
})


test('dense scene pages preserve the full store and UID allocations; changing pages creates no resources',()=> {
  const resources=Array.from({length:50},(_,i)=>node(`n${i}`,`worker${i}`)),slots=new HarborSlots()
  resources.forEach(n=>slots.node(uidOf(n)))
  const original=new Map(slots.nodes)
  const first=nodeWindow(resources,slots,0),second=nodeWindow(resources,slots,1),third=nodeWindow(resources,slots,2)
  assert.equal(first.visible.length,20);assert.equal(second.visible.length,20);assert.equal(third.visible.length,10)
  assert.equal(first.total,50);assert.equal(first.pageCount,3);assert.equal(resources.length,50)
  assert.deepEqual(slots.nodes,original)
  slots.windowOffset=20
  assert.equal(resourcePosition(resources[0],new Map(),slots),null)
  assert.deepEqual(resourcePosition(resources[20],new Map(),slots),berthPosition(0))
  const map=new Map(resources.map(n=>[n.metadata.name,n])),c=new TransferCoordinator()
  c.observe([],map,slots,false,0);c.observe([pod('offscreen','worker0')],map,slots,false,1)
  assert.equal(c.active.length,0)
})

test('Node fault hands a crane load continuously to a short actual-target arrival; replacement UID cancels old reservation',()=> {
  const slots=new HarborSlots(), n=node('old-node','worker'), map=new Map([['worker',n]]), c=new TransferCoordinator();
  c.observe([],map,slots,false,0); c.observe([pod('load','worker')],map,slots,false,10);
  const transfer=c.active[0], before=transferPosition(transfer,500);
  const failed={...n,status:{conditions:[{type:'Ready',status:'False'}]}};
  c.observe([pod('load','worker')],new Map([['worker',failed]]),slots,false,500);
  assert.equal(c.active[0].simple,true); assert.deepEqual(c.active[0].simpleOrigin,before); assert.equal(c.active[0].started,500);
  c.observe([pod('load','worker')],new Map([['worker',node('new-node','worker')]]),slots,false,600);
  assert.ok(c.active.every(t=>t.nodeUID==='new-node')); assert.ok(c.queue.every(t=>t.nodeUID==='new-node'));
  c.observe([],new Map(),slots,false,700); assert.equal(c.active.length,0); assert.equal(c.queue.length,0);
})
