// Explicit, finite extra paired blocks for an observed ordering/noise question.
// This never retries automatically and never overwrites the primary session.
import{readFile,writeFile,mkdir,open}from'node:fs/promises';import path from'node:path';import{execFileSync}from'node:child_process';import{superviseJob}from'./orchestration/supervise-job.mjs';
import{pathToFileURL}from'node:url';import{assertPower,assertManifestIdentity,assertResumeIdentity,currentBrowserVersion,frozenBuildIdentity}from'./repair-session.mjs';
async function main(){
const [previousID,id]=process.argv.slice(2);if(![previousID,id].every(x=>/^[\w.-]+$/.test(x||'')))throw Error('Usage: repair-panel-counterbalance.mjs COMPLETE_SESSION NEW_SESSION');
const previous=JSON.parse(await readFile(path.resolve('benchmarks/results',previousID,'queue.json'),'utf8'));if(previous.status!=='passed')throw Error('Primary queue must finish first');
if(previous.expectedCells!==49||previous.jobs.length!==27)throw Error('Exactly one primary 49-cell queue required; at most five panel pairs');
const readPower=()=>execFileSync('pmset',['-g','batt'],{encoding:'utf8',timeout:10000}),power=readPower(),source=previous.powerSource;assertPower(power,source);
const buildIdentities=Object.fromEntries(await Promise.all([previous.baselineTag,previous.candidateTag].map(async tag=>[tag,await frozenBuildIdentity(process.cwd(),tag)]))),browserVersion=await currentBrowserVersion(process.cwd());assertResumeIdentity(previous,{...previous,buildIdentities,browserVersion});
const directory=path.resolve('benchmarks/results',id);await mkdir(directory,{recursive:false});
const plan={...previous,id,previousSession:previousID,previousSessions:[...(previous.previousSessions||[]),previousID],createdAt:new Date().toISOString(),finishedAt:null,status:'running',expectedCells:57,reason:'Two explicitly requested open-first supplemental panel blocks for an observed ordering/noise question; all primary rows retained and five paired panel blocks maximum.',jobs:[...previous.jobs]};
for(const block of [3,4])for(const phase of(block===3?['optimized','baseline']:['baseline','optimized']))plan.jobs.push({id:`${id}-${phase}-panel-b${block}`,phase,profile:'M',group:'panel',matrix:true,block,tag:phase==='baseline'?previous.baselineTag:previous.candidateTag,scenarios:['panel-closed','panel-open'],seconds:60,warmup:30,timeoutSeconds:360,status:'pending'});
const save=()=>writeFile(path.join(directory,'queue.json'),JSON.stringify(plan,null,2));await save();
try{for(const job of plan.jobs.filter(j=>j.status==='pending')){assertPower(readPower(),source);if(await currentBrowserVersion(process.cwd())!==browserVersion||JSON.stringify(await frozenBuildIdentity(process.cwd(),job.tag))!==JSON.stringify(buildIdentities[job.tag]))throw Error('Frozen build/browser identity changed; next job refused');
 const argv=[process.execPath,'benchmarks/run.mjs','--phase',job.phase,'--build-tag',job.tag,'--backend-tag',job.tag,'--reuse-build','--reuse-binary','--id',job.id,'--profiles','M','--scenarios','panel-closed,panel-open','--repeats','1','--repeat-offset',String(job.block),'--warmup','30','--seconds','60','--max-minutes','6','--dpr','1','--lock-input','--disable-browser-energy-saver','--lifecycle-counts','--panel-matrix','--experiment-family',id];
 // run.mjs alone owns reversal: odd3reverses; even4gets one explicit reversal.
 if(job.block===4)argv.push('--reverse-order');job.argv=argv;job.status='running';job.startedAt=new Date().toISOString();await save();console.log('START',job.id);
 const fd=await open(path.join(directory,job.id+'.stdout.log'),'wx');let result;try{result=await superviseJob({argv,cwd:process.cwd(),timeoutSeconds:360,onOutput:async chunk=>{await fd.write(chunk);process.stdout.write(chunk);}});}finally{await fd.close();}
 job.result=result;job.finishedAt=new Date().toISOString();job.status=result.code===0&&!result.error&&!result.timedOut&&!result.interrupted&&result.cleanupComplete?'passed':'failed';
 if(job.status==='passed')try{const report=JSON.parse(await readFile(path.resolve('benchmarks/results',job.id,'summary.json'),'utf8'));assertManifestIdentity(report.manifest,buildIdentities[job.tag],browserVersion,source);if(report.runs.map(r=>r.scenario).join(',')!=='panel-open,panel-closed')throw Error('Open-first order not actually observed');}catch(error){job.status='failed';job.failureReason=error.message;}
 await save();if(job.status!=='passed')throw Error(`Stopped at ${job.id}; no automatic retry`);
}plan.status='passed';}catch(e){plan.status='failed';plan.error=e.stack;process.exitCode=1;}finally{plan.finishedAt=new Date().toISOString();await save();}console.log(JSON.stringify({id,status:plan.status,error:plan.error}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
