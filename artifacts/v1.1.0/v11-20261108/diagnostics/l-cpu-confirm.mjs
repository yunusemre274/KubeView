// Two additional L pairs only, authorized for a concrete ambiguous CPU result.
// Reuses the existing runner, frozen identities and supervisor; no auto retries.
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {assertPower,powerSourceOf,currentBrowserVersion,frozenBuildIdentity,assertManifestIdentity} from '../../../../benchmarks/repair-session.mjs';
import {superviseJob} from '../../../../benchmarks/orchestration/supervise-job.mjs';
const root=process.cwd(),parent=JSON.parse(await readFile('benchmarks/results/v11-final-ac-20261109/queue.json','utf8'));
if(parent.status!=='passed'||parent.suite!=='v11')throw Error('The original complete queue must be preserved and passed');
const id='v11-l-controlled-battery-20261109',out=path.join(root,'benchmarks/results',id),jobs=[];
const initialPower=execFileSync('pmset',['-g','batt'],{encoding:'utf8'}),powerSource=powerSourceOf(initialPower);
if(powerSource!=='battery')throw Error('This separately declared battery experiment requires battery power');
for(const block of [3,4])for(const phase of (block%2?['optimized','baseline']:['baseline','optimized'])){
 const original=parent.jobs.find(j=>j.group==='world'&&j.phase===phase),job={...original,id:`${id}-${phase}-L-closed-b${block}`,block,group:'l-controlled',matrix:true,scenarios:['panel-closed'],status:'pending',result:undefined,startedAt:undefined,finishedAt:undefined};
 job.argv=[...original.argv];
 for(const [flag,value] of [['--id',job.id],['--repeat-offset',String(block)],['--experiment-family',id],['--scenarios','panel-closed']])job.argv[job.argv.indexOf(flag)+1]=value;
 job.argv.push('--panel-matrix');
 jobs.push(job);
}
const queue={...parent,id,previousSession:parent.id,question:'Do two later L pairs with the same selectedUID and frozen visual starting phase reproduce the CPU difference? The original living cases had different rendered work. Both versions here use battery; do not pool with the original AC results or label this unselected living.',powerSource,initialPower,jobs,expectedCells:4,totalMinimumWindowSeconds:360,status:'pending',createdAt:new Date().toISOString(),finishedAt:undefined};
await mkdir(out,{recursive:false});const save=()=>writeFile(path.join(out,'queue.json'),JSON.stringify(queue,null,2));await save();
let interrupted;for(const signal of ['SIGINT','SIGTERM','SIGHUP'])process.on(signal,()=>{interrupted=signal;});
try{
 queue.status='running';await save();
 for(const job of jobs){
  if(interrupted)throw Error('Interrupted; no next measurement starts');
  assertPower(execFileSync('pmset',['-g','batt'],{encoding:'utf8'}),powerSource);
  if(await currentBrowserVersion(root)!==parent.browserVersion||JSON.stringify(await frozenBuildIdentity(root,job.tag))!==JSON.stringify(parent.buildIdentities[job.tag]))throw Error('Frozen source/browser changed');
  job.status='running';job.startedAt=new Date().toISOString();await save();console.log(job.startedAt+' START '+job.id);
  const log=await open(path.join(out,job.id+'.stdout.log'),'wx');
  try{job.result=await superviseJob({argv:job.argv,cwd:root,timeoutSeconds:job.timeoutSeconds,onOutput:async chunk=>{await log.write(chunk);process.stdout.write(chunk);}});}finally{await log.close();}
  job.finishedAt=new Date().toISOString();job.status=job.result.code===0&&!job.result.error&&!job.result.timedOut&&!job.result.interrupted&&job.result.cleanupComplete?'passed':'failed';
  if(job.status==='passed'){const report=JSON.parse(await readFile(path.join(root,'benchmarks/results',job.id,'summary.json'),'utf8'));assertManifestIdentity(report.manifest,parent.buildIdentities[job.tag],parent.browserVersion,powerSource);}
  await save();console.log(job.finishedAt+' '+job.status.toUpperCase()+' '+job.id);if(job.status!=='passed')throw Error('Finite L confirmation stopped; no automatic retry');
 }
 queue.status='passed';
}catch(error){queue.status='failed';queue.error=error.stack;process.exitCode=1;}
finally{queue.finishedAt=new Date().toISOString();queue.finalPower=execFileSync('pmset',['-g','batt'],{encoding:'utf8'});await save();}
