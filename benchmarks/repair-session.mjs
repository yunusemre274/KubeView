// Finite serial pre-v1.1 acceptance queue using the existing production runner.
// Builds must be frozen beforehand. No retries, background test fan-out or kubeconfig.
import {readFile,writeFile,mkdir,open,readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {superviseJob} from './orchestration/supervise-job.mjs';
import path from 'node:path';
const hash=data=>createHash('sha256').update(data).digest('hex');
export const powerSourceOf=s=>typeof s!=='string'?null:s.includes('AC Power')?'AC':s.includes('Battery Power')?'battery':null;
export function assertPower(s,expected){
 if(powerSourceOf(s)!==expected)throw Error('Power source changed; no next job started');
 const percent=Number(s.match(/(\d+)%;/)?.[1]);
 if(expected==='battery'&&(!Number.isFinite(percent)||percent<10||percent>100))throw Error('Battery below 10% or charge unknown; no next job started');
}
// Matrix reversal belongs to run.mjs. Other scenario groups have no runner reversal.
export const scenarioArguments=job=>job.block%2&&!job.matrix?[...job.scenarios].reverse():[...job.scenarios];
export const excludedAttempts=job=>[...(job.excludedAttempts||[]),...(job.excludedAttempt?[job.excludedAttempt]:[])].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i);
export function resumeJobs(previous,planned,id,reasons={}){
 if(previous.id===id||!['failed','paused'].includes(previous.status))throw Error('Resume needs a new ID and a stopped previous queue');
 if(previous.jobs.length!==planned.length)throw Error('Resume scenario plan changed');
 return previous.jobs.map((old,i)=>{
  const next=planned[i],identity=j=>[j.profile,j.phase,j.tag,j.group,j.matrix||false,j.scenarios,j.block||0,j.repeats||1,j.seconds,j.warmup,j.longSeconds||1200,j.timeoutSeconds];
  if(JSON.stringify(identity(old))!==JSON.stringify(identity(next)))throw Error('Resume job identity changed');
  if(old.status==='passed')return old;
  if(!['failed','pending'].includes(old.status))throw Error('Unfinished running job needs ownership/cleanup review before resume');
  if(old.status==='failed'&&!old.result?.cleanupComplete)throw Error('Failed job cleanup is incomplete; explicit ownership review required');
  const history=excludedAttempts(old);
  if(old.status==='failed')history.push({id:old.id,status:old.status,result:old.result,startedAt:old.startedAt,finishedAt:old.finishedAt,reason:reasons[old.id]||old.failureReason||old.result?.error||previous.error||'Failed whole job excluded; no measurement accepted'});
  return {...next,id:old.status==='pending'?old.id:next.id,status:'pending',...(history.length?{excludedAttempts:history}:{})};
 });
}
export async function frozenBuildIdentity(root,tag){
 const build=path.join(root,'benchmarks/.build',tag),provenance=JSON.parse(await readFile(path.join(root,'benchmarks/.build',tag+'.json'),'utf8')),assets={};
 const visit=async dir=>{for(const e of(await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const p=path.join(dir,e.name);if(e.isDirectory())await visit(p);else if(e.isFile()&&e.name!=='backend.test')assets[path.relative(build,p)]=hash(await readFile(p));}};await visit(build);
 return {buildIndexSHA256:hash(await readFile(path.join(build,'index.html'))),backendBinarySHA256:hash(await readFile(path.join(build,'backend.test'))),buildProvenanceSHA256:hash(JSON.stringify(provenance)),assetsSHA256:hash(JSON.stringify(assets))};
}
export function assertManifestIdentity(manifest,identity,browserVersion,powerSource){
 if(!browserVersion||!['AC','battery'].includes(powerSource)||!identity||!['buildIndexSHA256','backendBinarySHA256','buildProvenanceSHA256','assetsSHA256'].every(k=>/^[a-f0-9]{64}$/.test(identity[k]||''))||!manifest.buildProvenance||typeof manifest.buildProvenance!=='object')throw Error('Missing frozen measured source/build/browser/power identity');
 if(manifest.browserVersion!==browserVersion||manifest.powerSource!==powerSource)throw Error('Measured browser/power identity changed');
 if(manifest.powerAfter&&powerSourceOf(manifest.powerAfter)!==powerSource)throw Error('Measured power changed before cleanup');
 if(manifest.buildIndexSHA256!==identity.buildIndexSHA256||manifest.backendBinarySHA256!==identity.backendBinarySHA256||hash(JSON.stringify(manifest.buildProvenance))!==identity.buildProvenanceSHA256)throw Error('Frozen measured source/build identity changed');
}
export function assertResumeIdentity(previous,current){
 if(previous.baselineTag!==current.baselineTag||previous.candidateTag!==current.candidateTag||previous.powerSource!==current.powerSource)throw Error('Resume build/power identity changed');
 if(JSON.stringify(previous.buildIdentities)!==JSON.stringify(current.buildIdentities))throw Error('Resume frozen build files changed or were not recorded');
 if(!previous.browserVersion||previous.browserVersion!==current.browserVersion)throw Error('Resume browser changed or was not recorded');
}
export async function currentBrowserVersion(root){
 const {chromium}=createRequire(path.join(root,'frontend/package.json'))('playwright'),executable=chromium.executablePath();
 if(process.platform!=='darwin')throw Error('Browser metadata preflight currently requires the recorded macOS environment');
 return execFileSync('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',path.resolve(path.dirname(executable),'../Info.plist')],{encoding:'utf8',timeout:10000}).trim();
}
export function repairJobs(id,baselineTag,candidateTag){
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
return jobs;
}
// v1.1 changes connection/DOM lifetime, not the failure-effect renderer. Reuse
// the established runner with a bounded release subset instead of replaying all
// 49 historical repair cells. The 20-minute run still exercises burst/churn,
// logs, three reconnects, resync and twenty panel lifetimes.
export function v11Jobs(id, baselineTag, candidateTag) {
 return repairJobs(id, baselineTag, candidateTag).filter(job =>
  ['panel', 'idle', 'world'].includes(job.group) ||
  job.scenarios.some(s => ['events', 'interaction', 'long'].includes(s)))
  .map(job => job.scenarios.includes('long') ? {...job, sceneInventory:true} : job);
}
async function main(){
const [id,baselineTag,candidateTag]=process.argv.slice(2);
const resumeIndex=process.argv.indexOf('--continue-from'),previousID=resumeIndex>=0?process.argv[resumeIndex+1]:null;
if(resumeIndex>=0&&!/^[\w.-]+$/.test(previousID||''))throw Error('Invalid previous session ID');
if (![id,baselineTag,candidateTag].every(x=>/^[\w.-]+$/.test(x||''))) throw Error('Usage: node benchmarks/repair-session.mjs NEW_ID BASELINE_TAG CANDIDATE_TAG');
const root=process.cwd(),directory=path.join(root,'benchmarks/results',id);
const power=()=>execFileSync('pmset',['-g','batt'],{encoding:'utf8',timeout:10000});
const initialPower=power(),powerSource=powerSourceOf(initialPower);
if(!powerSource)throw Error('Unknown power source');
assertPower(initialPower,powerSource);
const suiteIndex=process.argv.indexOf('--suite'),suite=suiteIndex<0?'repair':process.argv[suiteIndex+1];
if(!['repair','v11'].includes(suite))throw Error('Unknown finite acceptance suite');
const buildIdentities=Object.fromEntries(await Promise.all([baselineTag,candidateTag].map(async tag=>[tag,await frozenBuildIdentity(root,tag)]))),browserVersion=await currentBrowserVersion(root),jobs=(suite==='v11'?v11Jobs:repairJobs)(id,baselineTag,candidateTag);
const plan={id,suite,createdAt:new Date().toISOString(),powerSource,initialPower,baselineTag,candidateTag,buildIdentities,browserVersion,source:'Synthetic tracker → production informer/WebSocket/store/Harbor; not live Kubernetes E2E',order:'Three paired blocks, alternating build order; matrix reversal owned once by run.mjs. No automatic retry.',expectedCells:jobs.reduce((n,j)=>n+(j.repeats||1)*j.scenarios.length,0),totalMinimumWindowSeconds:jobs.reduce((n,j)=>n+(j.repeats||1)*j.scenarios.reduce((m,s)=>m+j.warmup+(s==='long'?j.longSeconds:j.seconds),0),0),jobs:jobs.map(j=>({...j,status:'pending'})),status:'pending'};
if(previousID){
 const previous=JSON.parse(await readFile(path.resolve('benchmarks/results',previousID,'queue.json'),'utf8'));
 assertResumeIdentity(previous,plan);
 const reasons={};for(const old of previous.jobs){
  if(old.status==='passed'){const report=JSON.parse(await readFile(path.resolve('benchmarks/results',old.id,'summary.json'),'utf8'));assertManifestIdentity(report.manifest,buildIdentities[old.tag],browserVersion,powerSource);}
  if(old.status==='failed')try{reasons[old.id]=JSON.parse(await readFile(path.resolve('benchmarks/results',old.id,'summary.json'),'utf8')).errors.join('\n');}catch(e){if(e.code!=='ENOENT')throw e;}
 }
 plan.previousSession=previousID;
 plan.previousSessions=[...(previous.previousSessions||[]),previousID];
 plan.jobs=resumeJobs(previous,plan.jobs,id,reasons);
}
await mkdir(directory,{recursive:false});
const save=()=>writeFile(path.join(directory,'queue.json'),JSON.stringify(plan,null,2));await save();
let signal;
const stop=s=>{signal=s;};for(const s of ['SIGINT','SIGTERM','SIGHUP'])process.on(s,()=>stop(s));
try{
 plan.status='running';await save();
 for(const job of plan.jobs){
  if(job.status==='passed')continue;
  if(signal)throw Error(`Queue interrupted: ${signal}`);
  assertPower(power(),powerSource);
  if(await currentBrowserVersion(root)!==browserVersion||JSON.stringify(await frozenBuildIdentity(root,job.tag))!==JSON.stringify(buildIdentities[job.tag]))throw Error('Frozen build/browser identity changed; next job refused');
  const scenarios=scenarioArguments(job);
  const argv=[process.execPath,'benchmarks/run.mjs','--phase',job.phase,'--build-tag',job.tag,'--backend-tag',job.tag,'--reuse-build','--reuse-binary','--id',job.id,'--profiles',job.profile,'--scenarios',scenarios.join(','),'--repeats',String(job.repeats||1),'--repeat-offset',String(job.block||0),'--warmup',String(job.warmup),'--seconds',String(job.seconds),'--long-seconds',String(job.longSeconds||1200),'--max-minutes',String(Math.ceil(job.timeoutSeconds/60)),'--dpr','1','--lock-input','--disable-browser-energy-saver','--lifecycle-counts','--experiment-family',id];
  // Force identical selected source/visual phase in the narrow paired matrix.
  if(job.matrix)argv.push('--panel-matrix');
  if(job.sceneInventory)argv.push('--scene-inventory');
  job.argv=argv;job.status='running';job.startedAt=new Date().toISOString();await save();
  console.log(`${job.startedAt} START ${job.id} (${scenarios.join(',')})`);
  const log=await open(path.join(directory,`${job.id}.stdout.log`),'wx');let result;
  try{result=await superviseJob({argv,cwd:root,timeoutSeconds:job.timeoutSeconds,onOutput:async chunk=>{await log.write(chunk);process.stdout.write(chunk);}});}finally{await log.close();}
  job.result=result;job.finishedAt=new Date().toISOString();job.status=result.code===0&&!result.error&&!result.timedOut&&!result.interrupted&&result.cleanupComplete?'passed':'failed';
  if(job.status==='passed')try{const report=JSON.parse(await readFile(path.resolve('benchmarks/results',job.id,'summary.json'),'utf8'));assertManifestIdentity(report.manifest,buildIdentities[job.tag],browserVersion,powerSource);}catch(e){job.status='failed';job.failureReason=e.message;}
  await save();
  console.log(`${job.finishedAt} ${job.status.toUpperCase()} ${job.id}`);
  if(job.status!=='passed')throw Error(`Acceptance queue stopped at ${job.id}; no automatic retry`);
 }
 plan.status='passed';plan.finishedAt=new Date().toISOString();
}catch(error){plan.status='failed';plan.error=error.stack;plan.finishedAt=new Date().toISOString();process.exitCode=1;console.error(plan.error);}
finally{try{plan.finalPower=power();}catch(error){plan.finalPowerError=error.message;}await save();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
