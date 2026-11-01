// Finite serial pre-v1.1 acceptance queue using the existing production runner.
// Builds must be frozen beforehand. No retries, background test fan-out or kubeconfig.
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {superviseJob} from './orchestration/supervise-job.mjs';
import path from 'node:path';
const [id,baselineTag,candidateTag]=process.argv.slice(2);
if (![id,baselineTag,candidateTag].every(x=>/^[\w.-]+$/.test(x||''))) throw Error('Usage: node benchmarks/repair-session.mjs NEW_ID BASELINE_TAG CANDIDATE_TAG');
const root=process.cwd(),directory=path.join(root,'benchmarks/results',id);
await mkdir(directory,{recursive:false});
const power=()=>execFileSync('pmset',['-g','batt'],{encoding:'utf8'});
const sourceOf=s=>s.includes('AC Power')?'AC':s.includes('Battery Power')?'battery':null;
const initialPower=power(),powerSource=sourceOf(initialPower);
if(!powerSource)throw Error('Unknown power source');
for(const tag of [baselineTag,candidateTag]){
 await readFile(path.join(root,'benchmarks/.build',tag,'index.html'));
 await readFile(path.join(root,'benchmarks/.build',tag,'backend.test'));
 await readFile(path.join(root,'benchmarks/.build',tag+'.json'));
}
const jobs=[];
// The open/closed pair shares a selected UID, camera and frozen visual phase.
const groups=[{profile:'M',group:'panel',scenarios:['panel-closed','panel-open'],matrix:true},{profile:'M',group:'effects',scenarios:['repair-node','repair-container','repair-burst']},{profile:'M',group:'idle',scenarios:['idle']},{profile:'L',group:'world',scenarios:['living']}];
for(let block=0;block<3;block++)for(const phase of (block%2?['optimized','baseline']:['baseline','optimized'])){
 const tag=phase==='baseline'?baselineTag:candidateTag;
 for(const group of groups)jobs.push({id:`${id}-${phase}-${group.profile}-${group.group}-b${block}`,phase,tag,...group,block,seconds:60,warmup:30,timeoutSeconds:group.scenarios.length*110+180});
}
jobs.push({id:`${id}-final-events`,phase:'optimized',tag:candidateTag,profile:'M',scenarios:['events'],repeats:3,seconds:60,warmup:30,timeoutSeconds:480});
jobs.push({id:`${id}-final-interaction`,phase:'optimized',tag:candidateTag,profile:'S',scenarios:['interaction'],repeats:3,seconds:60,warmup:30,timeoutSeconds:480});
jobs.push({id:`${id}-final-long`,phase:'optimized',tag:candidateTag,profile:'M',scenarios:['long'],repeats:1,seconds:60,warmup:30,longSeconds:1200,timeoutSeconds:1500});
const plan={id,createdAt:new Date().toISOString(),powerSource,initialPower,baselineTag,candidateTag,source:'Synthetic tracker → production informer/WebSocket/store/Harbor; not live Kubernetes E2E',order:'Three paired blocks, alternating build order; reverse scenario order in odd blocks. No automatic retry.',expectedCells:49,totalMinimumWindowSeconds:3*2*7*90+6*90+1230,jobs:jobs.map(j=>({...j,status:'pending'})),status:'pending'};
const save=()=>writeFile(path.join(directory,'queue.json'),JSON.stringify(plan,null,2));await save();
let signal;
const stop=s=>{signal=s;};for(const s of ['SIGINT','SIGTERM','SIGHUP'])process.on(s,()=>stop(s));
try{
 for(const job of plan.jobs){
  if(signal)throw Error(`Queue interrupted: ${signal}`);
  const current=power();if(sourceOf(current)!==powerSource)throw Error('Power source changed; no next job started');
  const scenarios=job.block%2?[...job.scenarios].reverse():job.scenarios;
  const argv=[process.execPath,'benchmarks/run.mjs','--phase',job.phase,'--build-tag',job.tag,'--backend-tag',job.tag,'--reuse-build','--reuse-binary','--id',job.id,'--profiles',job.profile,'--scenarios',scenarios.join(','),'--repeats',String(job.repeats||1),'--repeat-offset',String(job.block||0),'--warmup',String(job.warmup),'--seconds',String(job.seconds),'--long-seconds',String(job.longSeconds||1200),'--max-minutes',String(Math.ceil(job.timeoutSeconds/60)),'--dpr','1','--lock-input','--disable-browser-energy-saver','--lifecycle-counts','--experiment-family',id];
  // Force identical selected source/visual phase in the narrow paired matrix.
  if(job.matrix)argv.push('--panel-matrix');
  job.argv=argv;job.status='running';job.startedAt=new Date().toISOString();await save();
  console.log(`${job.startedAt} START ${job.id} (${scenarios.join(',')})`);
  const log=await open(path.join(directory,`${job.id}.stdout.log`),'wx');let result;
  try{result=await superviseJob({argv,cwd:root,timeoutSeconds:job.timeoutSeconds,onOutput:async chunk=>{await log.write(chunk);process.stdout.write(chunk);}});}finally{await log.close();}
  job.result=result;job.finishedAt=new Date().toISOString();job.status=result.code===0&&!result.error&&!result.timedOut&&!result.interrupted&&result.cleanupComplete?'passed':'failed';await save();
  console.log(`${job.finishedAt} ${job.status.toUpperCase()} ${job.id}`);
  if(job.status!=='passed')throw Error(`Acceptance queue stopped at ${job.id}; no automatic retry`);
 }
 plan.status='passed';plan.finishedAt=new Date().toISOString();
}catch(error){plan.status='failed';plan.error=error.stack;plan.finishedAt=new Date().toISOString();process.exitCode=1;console.error(plan.error);}
finally{plan.finalPower=power();await save();}
