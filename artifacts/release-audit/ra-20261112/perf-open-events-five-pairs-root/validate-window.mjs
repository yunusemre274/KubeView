// Reuses existing production-runner coverage and settings; no measurements here.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {processCoverage,settings} from '../../../../benchmarks/panel-compare.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const [pairText,side]=process.argv.slice(2),pair=Number(pairText);
if(!Number.isInteger(pair)||pair<0||pair>4||!['A','B'].includes(side))throw Error('Invalid planned window');
const read=async name=>JSON.parse(await readFile(path.join(dir,name),'utf8'));
const prefix=`p${pair}-${side}`,report=await read(prefix+'-runner-summary.json');
const samples=await read(prefix+'-process-samples.json'),run=report.runs[0],m=report.manifest;
const reasons=[],need=(ok,why)=>{if(!ok)reasons.push(why);};
need(report.runs.length===1&&!report.errors.length&&Boolean(m.finishedAt),'incomplete/error runner');
need(m.params.warmup===30&&m.params.seconds===60&&m.params.repeats===1&&run.repeat===pair,'window duration/repeat identity');
need(m.backendBinarySHA256==='9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8','common backend identity');
need(!m.profiler&&!m.gpuProfiler&&!m.video&&!m.cpuThrottling&&!m.adaptiveQuality&&!m.fpsCap,'diagnostic/quality override');
need(m.cameraFovOverride===38&&m.cameraFovProtocol==='explicit-camera-fov-v1','controlled M38 protocol');
need(m.quality==='medium'&&m.water&&m.patrol&&m.shadows,'same reference quality');
need(run.before.rendererPixelRatio===1&&run.before.buffer.width===1440&&run.before.buffer.height===900,'framebuffer');
need(run.before.stats.lifecycle.visibleNodes===8&&run.before.stats.lifecycle.visiblePods===120&&run.before.stats.lifecycle.canonicalNodes===20&&run.before.stats.lifecycle.canonicalPods===300,'reference initial scope');
need(run.before.panel.uid==='node-0'&&run.before.panel.tab==='Özet'&&run.before.panel.open&&run.after.panel.open,'panel target and state');
need(run.workloadIntegrity?.valid,'workload integrity');
need(run.producer?.valid&&run.producer.planned===300&&run.producer.completed===300&&run.summary.messages===300,'producer planned/applied/received5/s');
need(run.consistency?.clientMatchesUpstream&&run.consistency?.upstreamMatchesPlanned,'full canonical content equality');
const coverage=processCoverage(run,samples);
need(coverage.complete,'observed CPU cohort or clocks: '+coverage.reasons.join(';'));
need([run.summary.renderedFPS,run.summary.renderIntervalMs.p95,run.summary.renderIntervalMs.p99].every(Number.isFinite)&&run.summary.renderedFPS>=55&&run.summary.renderIntervalMs.p95<=20&&run.summary.renderIntervalMs.p99<=33.3,'M draw cadence budget');
const store=run.loadBands?.normal?.callbackToStoreMs,draw=run.loadBands?.normal?.drawProxyMs;
need(store?.n===300&&draw?.n>0&&Number.isFinite(store?.p95)&&Number.isFinite(draw?.p95)&&store.p95<=100&&draw.p95<=250,'normal callback/store/draw proxy budget');
if(pair!==0||side!=='A'){
  const ref=await read('p0-A-runner-summary.json'),r=ref.runs[0];
  need(JSON.stringify(settings(run))===JSON.stringify(settings(r)),'actual camera/preferences/fleet phase/render scope differs');
  for(const key of ['browserVersion','fixtureVersion','scenarioVersion','replaySHA256','fixtureSHA256','instrumentationSHA256','lifecycleInstrumentationSHA256','powerSource','powerSettings','lockSHA256','hardware','os','deviceScaleFactorOverride','browserEnergySaver','viewport'])
    need(JSON.stringify(m[key])===JSON.stringify(ref.manifest[key]),'manifest '+key+' differs');
  need(JSON.stringify(run.before.panel)===JSON.stringify(r.before.panel),'initial selected panel content differs');
}
const result={status:reasons.length?'FAIL':'PASS_WINDOW_REQUIRES_FULL_PAIRED_SET',purpose:'One valid30/60 window, no independent n1 CPU acceptance',pair,side,reasons,coverage,
  summary:{renderedFPS:run.summary.renderedFPS,interval:run.summary.renderIntervalMs,callbackToStore:run.loadBands?.normal?.callbackToStoreMs,drawProxy:run.loadBands?.normal?.drawProxyMs}};
await writeFile(path.join(dir,prefix+'-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pair,side,status:result.status,reasons}));
if(reasons.length)process.exitCode=1;
