import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assertPower,powerSourceOf,repairJobs,workspaceJobs,scenarioArguments,resumeJobs,excludedAttempts,frozenBuildIdentity,assertManifestIdentity,assertResumeIdentity} from './repair-session.mjs';
import {runGateReasons,expectedJobCells,cellCompleteness,repairProcessCoverage,observedOrderReasons,jobProtocolReasons,independentPairReasons,panelDeltas,fixedConditionReasons} from './repair-report.mjs';
import './repair-panel-counterbalance.mjs'; // Importing helpers must never start a queue.

const jobs=()=>repairJobs('new','start','final');
test('workspace plan is finite: paired four-condition blocks, separate source controls and one final soak',()=>{
 const plan=workspaceJobs('new','start','final');
 assert.equal(plan.length,35);
 assert.ok(plan.every(j=>j.visualStartLocked===true));
 assert.ok(plan.slice(0,6).every(j=>j.group==='workspace-source'));
 assert.equal(plan.flatMap(expectedJobCells).length,46);
 const panel = plan.find(j=>j.group==='workspace-panel');
 assert.deepEqual(panel.scenarios,['panel-closed','panel-open']);
 assert.equal(panel.matrix,true);
 assert.ok(panel.timeoutSeconds>(panel.seconds+panel.warmup)*panel.repeats*panel.scenarios.length);
 for(const profile of ['M','L']){
  const rows=plan.filter(j=>j.group==='workspace-overhead'&&j.profile===profile);
  assert.equal(rows.length,12);
  assert.deepEqual(rows.map(j=>j.harbors),[1,5,10,20,20,10,5,1,1,5,10,20]);
  for(const harbors of [1,5,10,20])assert.deepEqual(rows.filter(j=>j.harbors===harbors).map(j=>j.block),[0,1,2]);
  assert.ok(rows.every(j=>j.tag==='final'&&j.warmup===30&&j.seconds===60));
 }
 assert.equal(plan.filter(j=>j.group==='workspace-source').length,6);
 assert.equal(plan.filter(j=>j.scenarios.includes('long')).length,1);
 assert.equal(plan.at(-1).longSeconds,1200);
 assert.equal(plan.at(-1).harbors,20);
 const priority=workspaceJobs('new','start','final',{longFirst:true});
 assert.equal(priority[0].longSeconds,1200);
 assert.deepEqual(priority.slice(1),plan.slice(0,-1));
 assert.equal(priority.length,plan.length);
 const previous={id:'old',status:'failed',jobs:structuredClone(plan).map(j=>({...j,status:'pending'}))};
 const altered=structuredClone(plan);altered[2].harbors=20;
 assert.throws(()=>resumeJobs(previous,altered,'other'));
});
const clone=structuredClone;
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const identity={buildIndexSHA256:'a'.repeat(64),backendBinarySHA256:'b'.repeat(64),buildProvenanceSHA256:digest({source:'frozen'}),assetsSHA256:'c'.repeat(64)};
const manifest=()=>({buildIndexSHA256:identity.buildIndexSHA256,backendBinarySHA256:identity.backendBinarySHA256,buildProvenance:{source:'frozen'},browserVersion:'148.0.1',powerSource:'battery',powerAfter:"Now drawing from 'Battery Power'\n 39%; discharging;"});
const run=(scenario='living',profile='M')=>({scenario,profile,repeat:0,workloadIntegrity:{valid:true},before:{visibility:'visible'},after:{visibility:'visible'},summary:{durationMs:60000,renderedFPS:60,renderIntervalMs:{p95:18,p99:25},panelDomProxyMs:{p95:30},panelRafProxyMs:{p95:40}}});
function producer(r){r.producer={valid:true,planned:2,completed:2,errors:[],samples:[{},{}],delayMs:{p95:1}};r.consistency={clientMatchesUpstream:true,upstreamMatchesPlanned:true};r.summary.messages=2;return r;}

test('finite primary plan is exactly 49 cells in 27 serial jobs; panel reversal occurs once',()=>{
 const plan=jobs();assert.equal(plan.length,27);assert.equal(plan.flatMap(expectedJobCells).length,49);
 for(const j of plan)assert.ok(Number.isFinite(j.timeoutSeconds)&&j.timeoutSeconds>(j.scenarios.includes('long')?1200:(j.seconds+j.warmup)*(j.repeats||1)*j.scenarios.length));
 assert.deepEqual(plan.filter(j=>j.group==='panel').map(j=>j.phase),['baseline','optimized','optimized','baseline','baseline','optimized']);
 for(const j of plan.filter(j=>j.matrix)){assert.deepEqual(scenarioArguments(j),['panel-closed','panel-open']);const actual=j.block%2?['panel-open','panel-closed']:j.scenarios;assert.deepEqual(observedOrderReasons(j,actual.map(scenario=>({scenario}))),[]);if(j.block%2)assert.equal(observedOrderReasons(j,j.scenarios.map(scenario=>({scenario}))).length,1);}
 assert.deepEqual(scenarioArguments(plan.find(j=>j.group==='effects'&&j.block===1)),['repair-burst','repair-container','repair-node']);
 assert.equal(plan.at(-1).longSeconds,1200);
});

test('real one-repeat smoke manifests are valid only with full windows and three pooled independent pairs',()=>{
 const plan=jobs(),rows=[];
 for(const job of plan){const repeats=job.repeats||1,m={production:true,inputLocked:true,browserEnergySaver:{ok:true},panelMatrix:Boolean(job.matrix),repeatOffset:job.block||0,params:{repeats,warmup:30,seconds:60,profiles:[job.profile],scenarios:scenarioArguments(job)},smoke:repeats<3};
  assert.deepEqual(jobProtocolReasons(job,m),[]);
  assert.ok(jobProtocolReasons(job,{...m,workspaceCycleProbe:true}).length);
  assert.ok(jobProtocolReasons({...job,visualStartLocked:true},m).length);
  assert.deepEqual(jobProtocolReasons({...job,visualStartLocked:true},{...m,visualStartLocked:true}),[]);
  if(repeats===1){assert.equal(m.smoke,true);assert.ok(jobProtocolReasons(job,{...m,smoke:false}).length);}
  for(const warmup of [0,29])assert.ok(jobProtocolReasons(job,{...m,smoke:true,params:{...m.params,warmup}}).length);
  assert.ok(jobProtocolReasons(job,{...m,smoke:true,params:{...m.params,seconds:59}}).length);
  if(job.group==='panel')rows.push({phase:job.phase,repeat:job.block});
 }
 assert.deepEqual(independentPairReasons(rows,'M/panel-open'),[]);
 assert.ok(independentPairReasons(rows.filter(r=>r.repeat<2),'M/panel-open').length);
 assert.ok(independentPairReasons(rows.slice(1),'M/panel-open').length);
 const long=plan.at(-1);assert.equal(long.repeats,1);assert.equal(long.longSeconds,1200);
});

test('battery guard accepts 10%, rejects unknown/below threshold and any source change',()=>{
 assert.equal(powerSourceOf('unknown'),null);assert.equal(powerSourceOf(null),null);
 for(const p of [10,39,100])assert.doesNotThrow(()=>assertPower(`Battery Power ${p}%; discharging;`,'battery'));
 for(const s of ['Battery Power 9%; discharging;','Battery Power unknown','AC Power 39%; charging;','unknown'])assert.throws(()=>assertPower(s,'battery'));
 assert.doesNotThrow(()=>assertPower('AC Power 39%; charging;','AC'));
});

test('resume keeps accepted and pending IDs, gives failed jobs new IDs and retains every exclusion',()=>{
 const planned=jobs().slice(0,3),previous={id:'old',status:'failed',jobs:planned.map((j,i)=>({...j,id:`old-${i}`,status:['passed','failed','pending'][i]}))};
 previous.jobs[1].result={cleanupComplete:true};previous.jobs[1].excludedAttempt={id:'first-failure',reason:'clock'};
 const before=clone(previous),next=resumeJobs(previous,planned,'new',{'old-1':'external load'});
 assert.equal(next[0].id,'old-0');assert.equal(next[1].id,planned[1].id);assert.equal(next[2].id,'old-2');assert.equal(next[1].excludedAttempts[1].reason,'external load');assert.deepEqual(previous,before);
 next[1].status='failed';next[1].result={cleanupComplete:true};
 const again=resumeJobs({id:'new',status:'failed',jobs:next},repairJobs('newer','start','final').slice(0,3),'newer');
 assert.deepEqual(excludedAttempts(again[1]).map(x=>x.id),['first-failure','old-1',planned[1].id]);
 for(const mutate of [p=>p.id='new',p=>p.status='running',p=>p.jobs[1].result.cleanupComplete=false,p=>p.jobs[1].status='running',p=>p.jobs[1].seconds=61]){const p=clone(before);mutate(p);assert.throws(()=>resumeJobs(p,planned,'new'));}
});

test('resume and measured identity reject altered source, assets, browser and power',()=>{
 const current={baselineTag:'start',candidateTag:'final',powerSource:'battery',browserVersion:'148.0.1',buildIdentities:{start:identity,final:identity}};
 assert.doesNotThrow(()=>assertResumeIdentity(current,current));assert.doesNotThrow(()=>assertManifestIdentity(manifest(),identity,current.browserVersion,current.powerSource));
 for(const field of ['baselineTag','candidateTag','powerSource','browserVersion','buildIdentities']){const previous=clone(current);delete previous[field];assert.throws(()=>assertResumeIdentity(previous,current));}
 for(const field of ['buildIndexSHA256','backendBinarySHA256','buildProvenance','browserVersion','powerSource','powerAfter']){const m=manifest();m[field]=field==='powerAfter'?'AC Power':field==='buildProvenance'?{source:'changed'}:'changed';assert.throws(()=>assertManifestIdentity(m,identity,current.browserVersion,current.powerSource));}
 assert.throws(()=>assertManifestIdentity(manifest(),undefined,current.browserVersion,current.powerSource));
});

test('frozen identity covers nested frontend assets, backend binary and source provenance',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'kv-repair-unit-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const build=path.join(root,'benchmarks/.build/frozen');await mkdir(path.join(build,'assets'),{recursive:true});
 for(const [file,value] of [['index.html','index'],['backend.test','binary'],['assets/app.js','first']])await writeFile(path.join(build,file),value);
 await writeFile(build+'.json',JSON.stringify({source:'first'}));const first=await frozenBuildIdentity(root,'frozen');
 await writeFile(path.join(build,'assets/app.js'),'changed');const asset=await frozenBuildIdentity(root,'frozen');assert.notEqual(first.assetsSHA256,asset.assetsSHA256);assert.equal(first.backendBinarySHA256,asset.backendBinarySHA256);
 await writeFile(build+'.json',JSON.stringify({source:'changed'}));assert.notEqual(asset.buildProvenanceSHA256,(await frozenBuildIdentity(root,'frozen')).buildProvenanceSHA256);
 await writeFile(path.join(build,'backend.test'),'changed');assert.notEqual(first.backendBinarySHA256,(await frozenBuildIdentity(root,'frozen')).backendBinarySHA256);
});

test('49-cell ledger rejects missing, duplicate, unexpected and misidentified cells',()=>{
 const queue={expectedCells:49,jobs:jobs()},rows=queue.jobs.flatMap(j=>expectedJobCells(j).map(cell=>{const [profile,scenario,repeat]=cell.split('/');return {runID:j.id,profile,scenario,repeat:Number(repeat)};}));
 assert.deepEqual(cellCompleteness(queue,rows),[]);
 for(const invalid of [rows.slice(1),[...rows,rows[0]],[...rows.slice(1),rows[1]],rows.map((r,i)=>i? r:{...r,runID:'foreign'}),rows.map((r,i)=>i? r:{...r,repeat:99})])assert.ok(cellCompleteness(queue,invalid).length);
 assert.ok(cellCompleteness({...queue,expectedCells:48},rows).length);
 assert.ok(cellCompleteness({...queue,jobs:[...queue.jobs,queue.jobs[0]]},rows).length);
});

test('cadence and interaction gates reject missing, infinite, negative and over-budget values',()=>{
 assert.deepEqual(runGateReasons(run(),'optimized'),[]);assert.deepEqual(runGateReasons({...run(),profile:'L',summary:{durationMs:60000,renderedFPS:30,renderIntervalMs:{p95:40,p99:50}}},'optimized'),[]);
 for(const v of [undefined,NaN,Infinity,-1,20.1]){const r=run();r.summary.renderIntervalMs.p95=v;assert.ok(runGateReasons(r,'optimized').length);}
 for(const v of [undefined,NaN,Infinity,54]){const r=run();r.summary.renderedFPS=v;assert.ok(runGateReasons(r,'optimized').length);}
 const r=run('interaction');assert.deepEqual(runGateReasons(r,'optimized'),[]);r.summary.panelRafProxyMs.p95=Infinity;assert.ok(runGateReasons(r,'optimized').some(s=>s.includes('Interaction')));
 const idle=run('idle');idle.summary.durationMs=Infinity;assert.ok(runGateReasons(idle,'optimized').length);
});

test('repair gates require the three named full canonical checks and matching digest',()=>{
 const r=run('repair-node');r.repair={acceptance:{valid:true,canonical:{clientMatchesUpstream:true,upstreamMatchesPlanned:true,clientMatchesPlanned:true},finalDigest:'same',expectedDigest:'same',visual:{valid:true}}};
 assert.deepEqual(runGateReasons(r,'optimized'),[]);
 for(const mutate of [x=>x.repair.acceptance.finalDigest='bad',x=>x.repair.acceptance.canonical={a:true,b:true,c:true},x=>x.repair.acceptance.visual.valid=false]){const bad=clone(r);mutate(bad);assert.ok(runGateReasons(bad,'optimized').length);}
 r.repair.acceptance.visual.valid=false;assert.deepEqual(runGateReasons(r,'baseline'),[]);
});

test('event gate requires complete producer, full canonical equality and finite latency bands',()=>{
 const r=producer(run('events'));r.loadBands={normal:{received:250,callbackToStoreMs:{p95:100},drawProxyMs:{p95:250}},burst:{received:1000,callbackToStoreMs:{p95:250},drawProxyMs:{p95:500}}};assert.deepEqual(runGateReasons(r,'optimized'),[]);
 for(const mutate of [x=>x.producer.completed=1,x=>x.producer.delayMs.p95=Infinity,x=>x.producer.samples.pop(),x=>x.consistency.clientMatchesUpstream=false,x=>x.loadBands.burst.received=999,x=>x.loadBands.normal.drawProxyMs.p95=NaN]){const bad=clone(r);mutate(bad);assert.ok(runGateReasons(bad,'optimized').length);}
});

test('long gate requires 20 unique stream cycles, 40 checkpoints, resync and reconnects',()=>{
 const r=producer(run('long'));r.summary.durationMs=1200000;r.summary.messages=1; // Snapshots intentionally recover messages missed during reconnect.
 r.repairPanelCycles=Array.from({length:20},(_,i)=>({cycle:i+1,valid:true,streams:{before:1,closed:0,reopened:1,opened:1,closedRequests:1}}));r.checkpoints=Array.from({length:40},()=>({quiescentResourceCounts:true}));r.logCleanup={opened:24,closed:24,remaining:0};r.informerResyncs=1;r.reconnects=3;
 assert.deepEqual(runGateReasons(r,'optimized'),[]);
 for(const mutate of [x=>x.summary.durationMs=1199999,x=>x.repairPanelCycles.pop(),x=>x.repairPanelCycles[1].cycle=1,x=>x.repairPanelCycles[1].streams.closed=1,x=>x.logCleanup.remaining=1,x=>x.checkpoints.pop(),x=>x.checkpoints[0].quiescentResourceCounts=false,x=>x.informerResyncs=0,x=>x.reconnects=2]){const bad=clone(r);mutate(bad);assert.ok(runGateReasons(bad,'optimized').length);}
});

test('CPU coverage rejects missing/churning PIDs, counter regression and sleep clock gaps',()=>{
 const processes=cpu=>[{pid:1,command:'/Chrome.app/Google Chrome for Testing',cpuSeconds:cpu,rssKiB:100},{pid:2,command:'/frozen/backend.test',cpuSeconds:cpu/10,rssKiB:20}];
 const r={summary:{durationMs:60000},osBefore:{time:1000,processes:processes(10)},osAfter:{time:61000,processes:processes(40)}},samples=[{time:31000,processes:processes(25)}];
 assert.equal(repairProcessCoverage(r,samples).complete,true);
 for(const mutate of [x=>x.osBefore.processes.pop(),x=>x.osAfter.processes.shift(),x=>x.osAfter.processes[0].cpuSeconds=NaN,x=>x.osAfter.processes[1].cpuSeconds=0,x=>x.osAfter.time+=1001]){const bad=clone(r);mutate(bad);assert.equal(repairProcessCoverage(bad,samples).complete,false);}
 const churn=clone(samples);churn[0].processes[1].pid=3;assert.equal(repairProcessCoverage(r,churn).complete,false);
 const regression=clone(samples);regression[0].processes[0].cpuSeconds=50;assert.equal(repairProcessCoverage(r,regression).complete,false);
});

test('panel deltas retain signed open-minus-closed values and reject ambiguous pairs',()=>{
 const rows=['baseline','optimized'].flatMap((phase,i)=>['panel-closed','panel-open'].map((scenario,j)=>({profile:'M',phase,scenario,repeat:0,runID:phase,process:{browserCores:i? [.1,.4][j]:[.4,.2][j]}}))),reasons=[];
 const deltas=panelDeltas(rows,reasons);assert.deepEqual(reasons,[]);assert.equal(deltas[0].deltaPanel,-.2);assert.ok(Math.abs(deltas[1].deltaPanel-.3)<1e-12);
 for(const invalid of [[...rows,rows[0]],rows.slice(1),rows.map((r,i)=>i?r:{...r,process:{browserCores:NaN}})]){const why=[];panelDeltas(invalid,why);assert.ok(why.length);}
});

test('session-wide conditions reject power/browser/hardware changes across separate blocks',()=>{
 const rows=[{runID:'a',manifest:{powerSource:'battery',powerSettings:'fixed',browserVersion:'148',hardware:'Mac',scenarioVersion:4,buildIndexSHA256:'baseline'}},{runID:'b',manifest:{powerSource:'battery',powerSettings:'fixed',browserVersion:'148',hardware:'Mac',scenarioVersion:2,buildIndexSHA256:'candidate'}}];
 assert.deepEqual(fixedConditionReasons(rows),[]);
 for(const key of ['powerSource','powerSettings','browserVersion','hardware','instrumentationSHA256']){const bad=clone(rows);bad[1].manifest[key]='changed';assert.equal(fixedConditionReasons(bad).length,1);}
});
