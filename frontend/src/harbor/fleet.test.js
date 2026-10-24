import test from 'node:test'
import assert from 'node:assert/strict'
import {FleetSimulator,HarborRoute,FLEET_OBSTACLES,vesselHitsLand,vesselsOverlap,sweptClear,vesselPointToWorld,mergeTrajectory} from './fleet.js'
const nodes=(n=8)=>Array.from({length:n},(_,i)=>({kind:'Node',metadata:{uid:`n${i}`,name:`worker-${i}`},status:{conditions:[{type:'Ready',status:'True'}]}}))
const motion={patrol:true,speedMultiplier:1,operations:'full'}
const simulate=(sim,seconds,dt=.1)=>{for(let time=0;time<seconds-1e-6;time+=dt)sim.tick(dt,sim.time+dt,motion)}

test('arc-length route closes continuously and full vessel capsules clear mainland/piers on three loops',()=>{
  const route=new HarborRoute(),start=route.pose(0)
  for(let loop=0;loop<3;loop++)for(let d=0;d<route.length;d+=2){const p=route.pose(d+loop*route.length);assert.equal(vesselHitsLand(p),false,`land at ${d}`)}
  assert.ok(Math.hypot(...route.pose(route.length*3).position.map((v,i)=>v-start.position[i]))<1e-8)
  for(let d=0;d<route.length;d+=10){const a=route.pose(d),b=route.pose(d+.01);assert.ok(Math.abs(Math.hypot(a.position[0]-b.position[0],a.position[2]-b.position[2])-.01)<1e-6)}
})
test('eight UID phases complete three safe loops without overtaking or rephasing',()=>{
  const sim=new FleetSimulator(),resources=nodes();sim.reconcile(resources,uid=>Number(uid.slice(1)))
  const initial=new Map(sim.snapshot().map(s=>[s.uid,s.progress])),step=.2,seconds=sim.route.length*3/9
  for(let time=0;time<seconds;time+=step){sim.tick(step,time+step,motion);const states=sim.snapshot();for(let i=0;i<states.length;i++){assert.equal(vesselHitsLand({position:states[i].position,yaw:states[i].yaw}),false);for(let j=i+1;j<states.length;j++)assert.equal(vesselsOverlap({position:states[i].position,yaw:states[i].yaw},{position:states[j].position,yaw:states[j].yaw}),false)}}
  for(const state of sim.snapshot()){const delta=(state.progress-initial.get(state.uid)+sim.route.length)%sim.route.length;assert.ok(delta<2||sim.route.length-delta<2)}
})
test('UID update/add/delete never redistributes survivors and failure/manual pause preserves exact progress',()=>{
  const sim=new FleetSimulator(),resources=nodes(3);sim.reconcile(resources,uid=>Number(uid.slice(1)));simulate(sim,2)
  const before=new Map(sim.snapshot().map(s=>[s.uid,s.progress]));sim.reconcile([...resources,nodes(4)[3]],uid=>Number(uid.slice(1)))
  for(const uid of ['n0','n1','n2'])assert.equal(sim.ships.get(uid).progress,before.get(uid))
  sim.reconcile(resources.map(r=>r.metadata.uid==='n0'?{...r,status:{conditions:[{type:'Ready',status:'Unknown'}]}}:r),uid=>Number(uid.slice(1)));simulate(sim,8)
  assert.equal(sim.ships.get('n0').progress,before.get('n0'))
  sim.reconcile(resources,uid=>Number(uid.slice(1)));sim.tick(.1,sim.time+.1,motion,{pausedUIDs:['n1']});const paused=sim.ships.get('n1').progress
  for(let i=0;i<20;i++)sim.tick(.1,sim.time+.1,motion,{pausedUIDs:['n1']});assert.equal(sim.ships.get('n1').progress,paused)
  sim.tick(.1,sim.time+.1,motion,{pausedUIDs:[]});assert.notEqual(sim.ships.get('n1').progress,paused)
})
test('eligible real observation docks within ten seconds, reserves basin, releases and departs safely',()=>{
  const sim=new FleetSimulator();sim.reconcile(nodes(1),()=>0)
  const job={nodeUID:'n0',queuedAt:0};assert.equal(sim.prepareTransfer(job,0).ready,false)
  let readyAt=null
  for(let i=0;i<100;i++){sim.tick(.1,sim.time+.1,motion);const result=sim.prepareTransfer(job,sim.time*1000);assert.equal(vesselHitsLand(sim.pose('n0')),false);if(result.ready&&!result.simple){readyAt=sim.time;break}}
  assert.ok(readyAt>0&&readyAt<7);assert.equal(sim.ships.get('n0').mode,'docked');assert.equal(sim.reservations.get('basin:left'),'n0')
  simulate(sim,2.1);sim.releaseLoading('n0');simulate(sim,8)
  assert.equal(sim.ships.get('n0').mode,'patrolling');assert.equal(sim.reservations.size,0)
})
test('unavailable berths use bounded simple arrival and deleting/context reset cancels reservations',()=>{
  const sim=new FleetSimulator();sim.reconcile(nodes(1),()=>0);sim.ships.get('n0').progress=0;sim.ships.get('n0').pose=sim.route.pose(0)
  const job={nodeUID:'n0',queuedAt:0};assert.equal(sim.prepareTransfer(job,0).ready,false);simulate(sim,10.1)
  assert.deepEqual(sim.prepareTransfer(job,10100),{ready:true,simple:true})
  sim.reservations.set('basin:left','n0');sim.reconcile([],()=>0);assert.equal(sim.reservations.size,0);assert.equal(sim.ships.size,0)
  sim.reconcile(nodes(2),uid=>Number(uid.slice(1)));sim.reset();assert.equal(sim.ships.size,0);assert.equal(sim.initialized,false)
})
test('sweeps reject crossing hulls and transformed cargo follows vessel yaw/pitch/roll without mutating canonical local points',()=>{
  const a={position:[-60,0,250],yaw:Math.PI/2},b={position:[60,0,250],yaw:Math.PI/2},other={position:[0,0,250],yaw:0}
  assert.equal(sweptClear(a,b,[other]),false)
  const local=[3,5,20],pose={position:[100,.2,200],yaw:Math.PI/2,pitch:0,roll:0}
  assert.deepEqual(vesselPointToWorld(pose,local),[120,5.2,197]);assert.deepEqual(local,[3,5,20])
})


test('changing visible eight-ship region preserves each suspended UID progress and deletes stale cached UIDs',()=>{
  const sim=new FleetSimulator(),resources=nodes(16),live=new Set(resources.map(n=>n.metadata.uid))
  sim.reconcile(resources.slice(0,8),uid=>Number(uid.slice(1)),0,{canonicalUIDs:live});simulate(sim,3)
  const saved=new Map(sim.snapshot().map(s=>[s.uid,s.progress]))
  sim.reconcile(resources.slice(8),uid=>Number(uid.slice(1))-8,sim.time,{canonicalUIDs:live});simulate(sim,2)
  sim.reconcile(resources.slice(0,8),uid=>Number(uid.slice(1)),sim.time,{canonicalUIDs:live})
  for(const state of sim.snapshot())assert.equal(state.progress,saved.get(state.uid))
  live.delete('n8');sim.reconcile(resources.slice(0,8),uid=>Number(uid.slice(1)),sim.time,{canonicalUIDs:live});assert.equal(sim.suspended.has('n8'),false)
})

test('virtual merge gate holds upstream traffic before intrusion and adjacent merge gates cannot both reserve',()=>{
  const sim=new FleetSimulator();sim.reconcile(nodes(3),uid=>Number(uid.slice(1)))
  const merger=sim.ships.get('n0'),leader=sim.ships.get('n1'),follower=sim.ships.get('n2'),gate=sim.route.gateProgress(-54)
  merger.pose={position:[-54,0,188],yaw:0};merger.mode='merge-wait';sim.reservations.set('basin:left',merger.uid)
  leader.progress=gate+90;leader.pose=sim.route.pose(leader.progress);follower.progress=gate-90;follower.pose=sim.route.pose(follower.progress)
  assert.equal(sim.canMerge(merger),true)
  simulate(sim,4)
  assert.equal(merger.mode,'patrolling');assert.equal(vesselsOverlap(merger.pose,follower.pose),false)
  assert.ok((merger.progress-follower.progress+sim.route.length)%sim.route.length>=83.999)
})

test('the reported half-merged jam reverses safely to hold and restores motion without teleporting',()=>{
  const sim=new FleetSimulator();sim.reconcile(nodes(8),uid=>Number(uid.slice(1)))
  const fixture=[316.2569785293,400.2569785293,484.2569785293,568.2569785294,652.2569785294,736.2569785295,232.2569785293,804.1944132353]
  for(let i=0;i<8;i++){const ship=sim.ships.get(`n${i}`);ship.progress=fixture[i];ship.pose=sim.route.pose(ship.progress);ship.cruiseVelocity=0}
  const merging=sim.ships.get('n7');merging.mode='merging';merging.pose={position:[55,0,192.3779310575],yaw:-.13753676048};merging.startPose={position:[55,0,188],yaw:0};merging.modeElapsed=.4;sim.reservations.set('basin:right','n7')
  const initial=sim.ships.get('n5').progress
  for(let i=0;i<400;i++){const before=new Map(sim.snapshot().map(s=>[s.uid,s.position]));sim.tick(.05,sim.time+.05,motion);for(const ship of sim.ships.values()){const old=before.get(ship.uid);assert.ok(Math.hypot(ship.pose.position[0]-old[0],ship.pose.position[2]-old[2])<2);for(const other of sim.ships.values())if(other!==ship)assert.equal(vesselsOverlap(ship.pose,other.pose),false)}}
  assert.ok(sim.ships.get('n5').progress>initial+50);assert.notEqual(merging.mode,'merging')
})

test('dense eight-ship canceled docking churn completes three circuits without global merge deadlock',()=>{
  const sim=new FleetSimulator();sim.reconcile(nodes(8),uid=>Number(uid.slice(1)));const traveled=new Map([...sim.ships.keys()].map(uid=>[uid,0])),lastAdvance=new Map([...sim.ships.keys()].map(uid=>[uid,0])),maxStall=new Map([...sim.ships.keys()].map(uid=>[uid,0]));let nextRequest=0,cancelAt=-1,job=null,lastProgress=sim.ships.get('n0').progress
  for(let i=0;i<14000;i++){
    const now=i*.05
    if(now>=nextRequest){job={nodeUID:'n7',queuedAt:now*1000};sim.prepareTransfer(job,now*1000);nextRequest=now+20;cancelAt=now+.18}
    if(job&&now<cancelAt)sim.prepareTransfer(job,now*1000);else{job=null;sim.syncLoadingOwners(new Set())}
    const before=new Map(sim.snapshot().map(s=>[s.uid,s.progress]));sim.tick(.05,now+.05,motion)
    for(const ship of sim.ships.values()){const delta=(ship.progress-before.get(ship.uid)+sim.route.length)%sim.route.length;if(delta<10){traveled.set(ship.uid,traveled.get(ship.uid)+delta);if(delta>1e-5)lastAdvance.set(ship.uid,now)}maxStall.set(ship.uid,Math.max(maxStall.get(ship.uid),now-lastAdvance.get(ship.uid)));assert.equal(vesselHitsLand(ship.pose),false);for(const other of sim.ships.values())if(other.uid!==ship.uid)assert.equal(vesselsOverlap(ship.pose,other.pose),false)}
  }
  for(const uid of ['n0','n1','n2','n3','n4','n5','n6','n7'])assert.ok(traveled.get(uid)>sim.route.length*3,`${uid} only${traveled.get(uid)/sim.route.length}laps`)
  for(const [uid,stall] of maxStall)assert.ok(stall<30,`${uid} starved for${stall}seconds`)
  assert.equal([...sim.ships.values()].every(ship=>ship.speed===0),false)
})


test('all four berth columns finish full loading and depart, including rightmost stern clearance',()=>{
  for(let column=0;column<4;column++){
    const sim=new FleetSimulator();sim.reconcile(nodes(1),()=>column)
    const ship=sim.ships.get('n0'),x=[-54,26,-25,55][column];ship.progress=sim.route.gateProgress(x);ship.pose=sim.route.pose(ship.progress)
    sim.prepareTransfer({nodeUID:'n0',queuedAt:0},0)
    let docked=null,returned=null,releaseAt=null
    for(let i=0;i<600;i++){
      sim.tick(.05,sim.time+.05,motion)
      assert.equal(vesselHitsLand(ship.pose),false,`column${column} ${ship.mode} touchedpier`)
      if(ship.mode==='docked'&&docked===null){docked=sim.time;releaseAt=sim.time+2.1}
      if(releaseAt!==null&&sim.time>=releaseAt){sim.releaseLoading('n0');releaseAt=null}
      if(docked!==null&&ship.mode==='patrolling'){returned=sim.time;break}
    }
    assert.ok(docked!==null&&docked<7,`column${column} neverdocked`)
    assert.ok(returned!==null&&returned<15,`column${column} neverreturned from${ship.mode}`)
    assert.equal(sim.reservations.size,0)
  }
})
test('piecewise merge keeps every berth stern clear on the exact permission and movement path',()=>{
  const route=new HarborRoute()
  for(const x of [-54,26,-25,55]){
    const start={position:[x,0,188],yaw:0},end=route.pose(route.gateProgress(x));let done=false
    for(let t=0;t<5;t+=.01){const sample=mergeTrajectory(start,end,t);assert.equal(vesselHitsLand(sample.pose),false,`x${x} t${t}`);if(sample.done){done=true;break}}
    assert.equal(done,true)
  }
})
