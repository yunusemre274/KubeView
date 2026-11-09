// Read complete serial repair-session output. No sampling, browser or retries.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {processCoverage} from './panel-compare.mjs';
import {distribution} from './metrics.mjs';
import {assertManifestIdentity,excludedAttempts,frozenBuildIdentity,scenarioArguments} from './repair-session.mjs';
const finiteAtMost=(v,max)=>Number.isFinite(v)&&v>=0&&v<=max;
export function runGateReasons(r,phase){
 const reasons=[],name=`${r.profile}/${r.scenario}/${r.repeat}`;
 if(r.workloadIntegrity?.valid!==true||!r.before||!r.after||r.before.contextLost||r.after.contextLost||r.before.connectionStale||r.after.connectionStale||r.before.visibility!=='visible'||r.after.visibility!=='visible')reasons.push(`Integrity/stale ${name}`);
 if(!Number.isFinite(r.summary?.durationMs)||r.summary.durationMs<60000)reasons.push(`Finite measurement window ${name}`);
 if(['events','long'].includes(r.scenario)){const p=r.producer;if(p?.valid!==true||!Number.isSafeInteger(p.planned)||p.planned<=0||p.completed!==p.planned||!Array.isArray(p.errors)||p.errors.length||!Array.isArray(p.samples)||p.samples.length!==p.planned||!Number.isFinite(p.delayMs?.p95)||p.delayMs.p95>=100||(r.scenario==='events'&&r.summary?.messages!==p.planned)||r.consistency?.clientMatchesUpstream!==true||r.consistency?.upstreamMatchesPlanned!==true)reasons.push(`Producer/full canonical signature ${name}`);}
 if(r.scenario?.startsWith('repair-')){const a=r.repair?.acceptance;if(a?.valid!==true||!a.canonical||Object.keys(a.canonical).length!==3||['clientMatchesUpstream','upstreamMatchesPlanned','clientMatchesPlanned'].some(k=>a.canonical[k]!==true)||!a.finalDigest||a.finalDigest!==a.expectedDigest||(phase==='optimized'&&a.visual?.valid!==true))reasons.push(`Repair/full canonical gate ${name}`);}
 if(phase==='optimized'&&r.scenario!=='idle'){
  if(!Number.isFinite(r.summary?.renderedFPS)||r.summary.renderedFPS<(r.profile==='L'?30:55)||!finiteAtMost(r.summary?.renderIntervalMs?.p95,r.profile==='L'?40:20)||!finiteAtMost(r.summary?.renderIntervalMs?.p99,r.profile==='L'?50:33.3))reasons.push(`JS cadence budget ${name}`);
  if(r.scenario==='events')for(const band of ['normal','burst']){const b=r.loadBands?.[band];if(!b||b.received!==(band==='burst'?1000:250)||!finiteAtMost(b.callbackToStoreMs?.p95,band==='burst'?250:100)||!finiteAtMost(b.drawProxyMs?.p95,band==='burst'?500:250))reasons.push(`Data latency proxy budget ${name}/${band}`);}
  if(r.scenario==='interaction'&&(!finiteAtMost(r.summary?.panelDomProxyMs?.p95,100)||!finiteAtMost(r.summary?.panelRafProxyMs?.p95,100)))reasons.push(`Interaction feedback proxy budget ${name}`);
 }
 if(r.scenario==='long'&&(r.summary?.durationMs<1200000||r.repairPanelCycles?.length!==20||r.repairPanelCycles?.some((c,i)=>c.valid!==true||c.cycle!==i+1||c.streams?.before!==1||c.streams?.closed!==0||c.streams?.reopened!==1||c.streams?.opened!==1||c.streams?.closedRequests!==1)||r.logCleanup?.remaining!==0||!(r.logCleanup?.opened>0)||r.logCleanup?.opened!==r.logCleanup?.closed||!Number.isSafeInteger(r.informerResyncs)||r.informerResyncs<=0||r.reconnects!==3||r.checkpoints?.length!==40||r.checkpoints?.some(c=>c.quiescentResourceCounts!==true)))reasons.push(`Long panel/stream/resync gate ${name}`);
 return reasons;
}
export function expectedJobCells(job){return Array.from({length:job.repeats||1},(_,i)=>job.scenarios.map(s=>`${job.profile}/${s}/${(job.block||0)+i}`)).flat();}
export function cellCompleteness(queue,rows){
 const reasons=[],expected=queue.jobs.flatMap(expectedJobCells).length;
 if(expected!==queue.expectedCells)reasons.push(`Declared cell count differs: planned ${expected}, declared ${queue.expectedCells}`);
 const ids=queue.jobs.map(j=>j.id);if(new Set(ids).size!==ids.length)reasons.push('Duplicate job IDs in queue');
 for(const row of rows)if(!ids.includes(row.runID))reasons.push(`Unexpected run ID ${row.runID}`);
 for(const job of queue.jobs){const cells=rows.filter(r=>r.runID===job.id).map(r=>`${r.profile}/${r.scenario}/${r.repeat}`),want=expectedJobCells(job);for(const c of new Set([...cells,...want]))if(cells.filter(x=>x===c).length!==want.filter(x=>x===c).length)reasons.push(`Missing/duplicate/unexpected cell ${job.id}/${c}`);}
 if(rows.length!==queue.expectedCells)reasons.push(`Incomplete cells ${rows.length}/${queue.expectedCells}`);
 return reasons;
}
export function repairProcessCoverage(run,samples=[]){
 let result;try{result=processCoverage(run,samples);}catch{return {complete:false};}
 const match=p=>/Chrome|Chromium|MiniBrowser/.test(p.command)||p.command?.endsWith('backend.test'),browser=p=>/Chrome|Chromium|MiniBrowser/.test(p.command),backend=p=>p.command?.endsWith('backend.test');
 const snapshots=[run.osBefore,...samples.filter(s=>s.time>run.osBefore.time&&s.time<run.osAfter.time),run.osAfter],first=snapshots[0].processes.filter(match),identity=rows=>rows.filter(match).map(p=>[p.pid,p.command]).sort((a,b)=>a[0]-b[0]);
 if(!first.some(browser)||!first.some(backend)||snapshots.some((s,i)=>!Number.isFinite(s.time)||(i>0&&s.time<=snapshots[i-1].time)||JSON.stringify(identity(s.processes))!==JSON.stringify(identity(first))||s.processes.filter(match).some(p=>!Number.isFinite(p.cpuSeconds)||p.cpuSeconds<0||!Number.isFinite(p.rssKiB)||p.rssKiB<0||i>0&&p.cpuSeconds<snapshots[i-1].processes.find(q=>q.pid===p.pid)?.cpuSeconds))||!finiteAtMost(result.browserCores,Infinity)||!finiteAtMost(result.backendCores,Infinity))result.complete=false;
 return result;
}
export function observedOrderReasons(job,runs){
 const expected=Array.from({length:job.repeats||1},(_,i)=>{const repeat=(job.block||0)+i,args=scenarioArguments(job);return job.matrix&&(repeat+Number(Boolean(job.argv?.includes('--reverse-order'))))%2?[...args].reverse():args;}).flat();
 return JSON.stringify(runs.map(r=>r.scenario))===JSON.stringify(expected)?[]:[`Actual scenario order differs ${job.id}`];
}
export function jobProtocolReasons(job,m){
 // run.mjs marks one-repeat invocations as smoke; independent paired blocks are pooled below.
 const declaredSmoke=m.params?.warmup<30||m.params?.seconds<60||m.params?.repeats<3;
 return m.profiler||m.gpuProfiler||m.bufferDiagnostic||m.reactProfilingBuild||m.video||m.smoke!==declaredSmoke||m.cpuThrottling||m.production!==true||m.inputLocked!==true||m.browserEnergySaver?.ok!==true||!Number.isFinite(m.params?.warmup)||m.params.warmup<30||!Number.isFinite(m.params?.seconds)||m.params.seconds<60||m.panelMatrix!==Boolean(job.matrix)||m.repeatOffset!==(job.block||0)||m.params?.repeats!==(job.repeats||1)||m.params?.profiles?.join(',')!==job.profile||JSON.stringify(m.params?.scenarios)!==JSON.stringify(scenarioArguments(job))?[`Diagnostic/short/production protocol ${job.id}`]:[];
}
export function independentPairReasons(rows,key,partial=false){
 const blocks=[...new Set(rows.map(r=>r.repeat))],complete=blocks.filter(block=>['baseline','optimized'].every(phase=>rows.filter(r=>r.repeat===block&&r.phase===phase).length===1));
 return !partial&&complete.length<3?[`Insufficient independent pairs ${key}`]:[];
}
const fixedManifestFields=['fixtureVersion','repairScenarioVersion','repairHarnessSHA256','replaySHA256','snapshotOrder','instrumentationSHA256','lifecycleInstrumentationSHA256','networkDiagnostic','nodeVersion','goVersion','hardware','os','powerSource','powerSettings','displayRefreshHz','nativeDisplay','browserVersion','quality','lockSHA256','viewport','deviceScaleFactorOverride','shadows','water','patrol','fpsCap','adaptiveQuality','production','inputLocked','browserEnergySaver'];
const manifestConditions=m=>({
 ...Object.fromEntries(fixedManifestFields.filter(k=>k!=='lockSHA256').map(k=>[k,m[k]])),
 dependencyGraphSHA256:m.dependencyGraphSHA256||m.lockSHA256,
});
export function fixedConditionReasons(runs){
 const reference=runs[0]?.manifest;return reference?runs.filter(r=>JSON.stringify(manifestConditions(r.manifest))!==JSON.stringify(manifestConditions(reference))).map(r=>`Fixed session conditions differ ${r.runID}`):[];
}
export function panelDeltas(runs,reasons=[]){
 const panel=[],blocks=[...new Set(runs.filter(r=>['panel-open','panel-closed'].includes(r.scenario)).map(r=>r.repeat))].sort((a,b)=>a-b);
 for(const block of blocks)for(const phase of ['baseline','optimized']){const cells=scenario=>runs.filter(r=>r.profile==='M'&&r.scenario===scenario&&r.phase===phase&&r.repeat===block),closed=cells('panel-closed'),open=cells('panel-open');if(closed.length!==1||open.length!==1){reasons.push(`Missing/duplicate panel pair ${phase}/${block}`);continue;}if(closed[0].runID!==open[0].runID||!finiteAtMost(closed[0].process?.browserCores,Infinity)||!finiteAtMost(open[0].process?.browserCores,Infinity)){reasons.push(`Invalid panel CPU pair ${phase}/${block}`);continue;}panel.push({block,phase,closedCPU:closed[0].process.browserCores,openCPU:open[0].process.browserCores,deltaPanel:open[0].process.browserCores-closed[0].process.browserCores,selectedUID:'node-0',actualScenarioOrder:runs.filter(r=>r.runID===open[0].runID).map(r=>r.scenario),runID:open[0].runID});}
 return panel;
}
async function main(){
const id=process.argv[2];if(!/^[\w.-]+$/.test(id||''))throw Error('Usage: node benchmarks/repair-report.mjs SESSION_ID');
const directory=path.resolve('benchmarks/results',id),queue=JSON.parse(await readFile(path.join(directory,'queue.json'),'utf8'));
const partial=process.argv.includes('--partial'),reasons=[],runs=[];
if(queue.status!=='passed'&&!partial)throw Error('Queue is incomplete; use --partial only for progress, never acceptance');
if(!queue.buildIdentities||!queue.browserVersion)reasons.push('Missing frozen build/browser identity in queue');
for(const tag of new Set([queue.baselineTag,queue.candidateTag]))try{if(JSON.stringify(await frozenBuildIdentity(process.cwd(),tag))!==JSON.stringify(queue.buildIdentities?.[tag]))reasons.push(`Frozen build assets/provenance changed ${tag}`);}catch(error){reasons.push(`Frozen build identity unavailable ${tag}: ${error.message}`);}
for(const job of queue.jobs){
 if(job.status!=='passed')continue;
 const folder=path.resolve('benchmarks/results',job.id),report=JSON.parse(await readFile(path.join(folder,'summary.json'),'utf8')),samples=JSON.parse(await readFile(path.join(folder,'process-samples.json'),'utf8'));
 if(report.errors.length||!report.manifest.finishedAt)reasons.push(`Incomplete report ${job.id}`);
 const m=report.manifest;if(m.id!==job.id||m.phase!==job.phase||m.buildTag!==job.tag||m.backendTag!==job.tag||m.powerSource!==queue.powerSource)reasons.push(`Job manifest identity ${job.id}`);
 try{assertManifestIdentity(m,queue.buildIdentities?.[job.tag],queue.browserVersion,queue.powerSource);}catch(e){reasons.push(`${job.id}: ${e.message}`);}
 reasons.push(...jobProtocolReasons(job,m));
 reasons.push(...observedOrderReasons(job,report.runs));
 for(const r of report.runs){const process=repairProcessCoverage(r,samples);
  const row={...r,phase:job.phase,runID:job.id,process,manifest:report.manifest};runs.push(row);
  if(!process.complete)reasons.push(`CPU coverage/clock ${job.id}/${r.scenario}/${r.repeat}`);
  reasons.push(...runGateReasons(r,job.phase).map(reason=>`${job.id}: ${reason}`));
 }
}
reasons.push(...cellCompleteness(queue,runs));
reasons.push(...fixedConditionReasons(runs));
const med=values=>{const d=distribution(values);return {median:d.p50,min:d.min,max:d.max,n:d.n};};
const actualSettings=r=>({manifest:{...manifestConditions(r.manifest),scenarioVersion:r.manifest.scenarioVersion},fixture:r.manifest.fixtureSHA256[r.profile],preferences:r.before.preferences,dpr:r.before.dpr,camera:r.before.camera,buffer:r.before.buffer,rendererDPR:r.before.rendererPixelRatio,renderer:r.before.renderer,visible:[r.before.stats.lifecycle.visibleNodes,r.before.stats.lifecycle.visiblePods],canonical:[r.before.stats.lifecycle.canonicalNodes,r.before.stats.lifecycle.canonicalPods],fleet:r.manifest.panelMatrix?r.before.fleet:r.before.fleet?.map(s=>({uid:s.uid})),panel:r.before.panel,logView:r.before.logView});
for(const phase of ['baseline','optimized']){const rows=runs.filter(r=>r.phase===phase),builds=new Set(rows.map(r=>JSON.stringify([r.manifest.buildIndexSHA256,r.manifest.backendBinarySHA256,r.manifest.buildProvenance])));if(builds.size>1)reasons.push(`Mixed frozen source/build ${phase}`);}
const metrics={browserCPU:r=>r.process.browserCores,rendererCPU:r=>r.process.rendererProcessCores,gpuProcessCPU:r=>r.process.gpuProcessCores,browserMainCPU:r=>r.process.browserMainCores,backendCPU:r=>r.process.backendCores,maxSingleBrowserRSSMiB:r=>r.process.maxBrowserProcessRSSKiB/1024,backendRSSMiB:r=>r.process.backendRSSKiB/1024,JSHeapMiB:r=>r.after.heap?.used/1048576,jsDrawsPerSecond:r=>r.summary.renderedFPS,intervalP95ms:r=>r.summary.renderIntervalMs.p95,intervalP99ms:r=>r.summary.renderIntervalMs.p99,callbackStoreP95ms:r=>r.summary.callbackToStoreMs.p95,callbackDrawProxyP95ms:r=>r.summary.drawProxyMs.p95,panelDOMProxyP95ms:r=>r.summary.panelDomProxyMs.p95,panelRAFProxyP95ms:r=>r.summary.panelRafProxyMs.p95,geometryDelta:r=>r.after.stats.memory.geometries-r.before.stats.memory.geometries,textureDelta:r=>r.after.stats.memory.textures-r.before.stats.memory.textures};
const keys=[...new Set(runs.map(r=>`${r.profile}/${r.scenario}`))],groups=keys.map(key=>{const [profile,scenario]=key.split('/'),sides={};
 for(const phase of ['baseline','optimized']){const rows=runs.filter(r=>r.profile===profile&&r.scenario===scenario&&r.phase===phase);if(!rows.length)continue;
  sides[phase]={n:rows.length,metrics:Object.fromEntries(Object.entries(metrics).map(([k,f])=>[k,med(rows.map(f))])),runs:rows.map(r=>({runID:r.runID,repeat:r.repeat,settings:actualSettings(r),cpuCoverage:r.process.complete,repair:r.repair?.acceptance,budget:r.scenario==='idle'?null:{draw:r.summary.renderedFPS>=(profile==='L'?30:55),p95:r.summary.renderIntervalMs.p95<=(profile==='L'?40:20),p99:r.summary.renderIntervalMs.p99<=(profile==='L'?50:33.3)}}))};
 }
 const matched=[];if(sides.baseline&&sides.optimized){const rows=runs.filter(r=>r.profile===profile&&r.scenario===scenario),blocks=[...new Set(rows.map(r=>r.repeat))].sort((a,b)=>a-b);reasons.push(...independentPairReasons(rows,key,partial));for(const block of blocks){const a=runs.find(r=>r.profile===profile&&r.scenario===scenario&&r.phase==='baseline'&&r.repeat===block),b=runs.find(r=>r.profile===profile&&r.scenario===scenario&&r.phase==='optimized'&&r.repeat===block);if(!a||!b){reasons.push(`Missing pair ${key}/${block}`);continue;}if(JSON.stringify(actualSettings(a))!==JSON.stringify(actualSettings(b)))reasons.push(`Settings differ ${key}/${block}`);matched.push({block,browserCPUChange:b.process.browserCores-a.process.browserCores,backendCPUChange:b.process.backendCores-a.process.backendCores});}}
 return {profile,scenario,...sides,paired:matched};});
const panel=panelDeltas(runs,reasons),long=runs.find(r=>r.scenario==='long');
const output={id,at:new Date().toISOString(),partial:partial||queue.status!=='passed',valid:!partial&&queue.status==='passed'&&!reasons.length,reasons,excludedJobs:queue.jobs.flatMap(job=>excludedAttempts(job).map(attempt=>({replacementJobID:job.id,...attempt}))),groups,panel,long:long?{runID:long.runID,summary:long.summary,consistency:long.consistency,producer:long.producer,logCleanup:long.logCleanup,informerResyncs:long.informerResyncs,reconnects:long.reconnects,cycles:long.repairPanelCycles?.map(c=>({cycle:c.cycle,valid:c.valid,streams:c.streams})),checkpoints:long.checkpoints}:null,notes:['New visual effects add work; difference is feature cost, not a same-work optimization claim.','Browser GPU process CPU is not GPU utilization; RSS is per PID, not summed physical RAM.','JS draw cadence and DOM/rAF feedback are proxies, not physical presented FPS/full usability.','Baseline and final backend binaries intentionally differ; production changes are recorded by their source/build provenance.','This is synthetic replay, not real cluster/provider performance. Actual Hubble costs are separate.']};
await writeFile(path.join(directory,partial?'comparison.partial.json':'comparison.json'),JSON.stringify(output,null,2));console.log(JSON.stringify({id,valid:output.valid,partial:output.partial,reasons,completedCells:runs.length,groups:groups.length}));if(!partial&&!output.valid)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
