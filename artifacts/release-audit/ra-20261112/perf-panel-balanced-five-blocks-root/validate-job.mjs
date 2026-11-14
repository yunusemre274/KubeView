import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {processCoverage,settings} from '../../../../benchmarks/panel-compare.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const [pairText,side]=process.argv.slice(2),pair=Number(pairText);
if(!Number.isInteger(pair)||pair<0||pair>4||!['A','B'].includes(side))throw Error('Invalid planned job');
const read=async name=>JSON.parse(await readFile(path.join(dir,name),'utf8'));
const prefix=`p${pair}-${side}`,report=await read(prefix+'-runner-summary.json'),samples=await read(prefix+'-process-samples.json'),m=report.manifest;
const base=await read('p0-A-runner-summary.json'),ref=base.runs[0];
const groups=['panel-closed','panel-open','panel-closed-events','panel-open-events'];
const expected=pair%2?[...groups].reverse():groups,reasons=[],need=(ok,why)=>{if(!ok)reasons.push(why);};
need(report.runs.length===4&&JSON.stringify(report.runs.map(r=>r.scenario))===JSON.stringify(expected),'exact balanced condition order/grid');
need(!report.errors.length&&Boolean(m.finishedAt),'incomplete/error runner');
need(m.params.warmup===30&&m.params.seconds===60&&m.params.repeats===1&&m.scenarioVersion===5,'window/recording protocol');
need(m.backendBinarySHA256==='9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8','common backend identity');
need(!m.profiler&&!m.gpuProfiler&&!m.video&&!m.cpuThrottling&&!m.adaptiveQuality&&!m.fpsCap,'diagnostic/quality override');
need(m.cameraFovOverride===38&&m.cameraFovProtocol==='explicit-camera-fov-v1'&&m.quality==='medium'&&m.water&&m.patrol&&m.shadows,'M38 reference quality');
for(const key of ['browserVersion','fixtureVersion','scenarioVersion','replaySHA256','fixtureSHA256','instrumentationSHA256','lifecycleInstrumentationSHA256','powerSource','powerSettings','lockSHA256','hardware','os','deviceScaleFactorOverride','browserEnergySaver','viewport'])
  need(JSON.stringify(m[key])===JSON.stringify(base.manifest[key]),'manifest '+key+' differs');
const cells=[];
for(const run of report.runs){
  const tag=run.scenario,open=tag==='panel-open'||tag==='panel-open-events',events=tag.endsWith('-events');
  need(run.repeat===pair,tag+': repeat identity');
  need(run.before.rendererPixelRatio===1&&run.before.buffer.width===1440&&run.before.buffer.height===900,tag+': framebuffer');
  need(run.before.stats.lifecycle.visibleNodes===8&&run.before.stats.lifecycle.visiblePods===120&&run.before.stats.lifecycle.canonicalNodes===20&&run.before.stats.lifecycle.canonicalPods===300,tag+': initial resource scope');
  need(run.before.panel.open===open&&run.after.panel.open===open,tag+': normal panel state');
  if(open)need(run.before.panel.uid==='node-0'&&run.before.panel.tab==='Özet',tag+': selected Node summary');
  if(open){const openRef=base.runs.find(r=>r.scenario==='panel-open');need(JSON.stringify(run.before.panel)===JSON.stringify(openRef.before.panel),tag+': actual selected panel content differs');}
  need(JSON.stringify(settings(run))===JSON.stringify(settings(ref)),tag+': actual camera/preferences/start fleet/render scope differs');
  need(run.workloadIntegrity?.valid,tag+': workload integrity');
  const count=events?300:0;
  need(run.producer?.valid&&run.producer.planned===count&&run.producer.completed===count&&run.summary.messages===count,tag+': producer/receiver');
  need(run.consistency?.clientMatchesUpstream&&run.consistency?.upstreamMatchesPlanned,tag+': full canonical equality');
  if(!events)need(run.producer.delayMs.n===0&&run.producer.delayMs.p95===null,tag+': missing delay must remain null');
  const coverage=processCoverage(run,samples);
  need(coverage.complete,tag+': observed process cohort/clock '+coverage.reasons.join(';'));
  need([run.summary.renderedFPS,run.summary.renderIntervalMs.p95,run.summary.renderIntervalMs.p99].every(Number.isFinite)&&run.summary.renderedFPS>=55&&run.summary.renderIntervalMs.p95<=20&&run.summary.renderIntervalMs.p99<=33.3,tag+': M draw cadence budget');
  if(events){
    const store=run.loadBands?.normal?.callbackToStoreMs,draw=run.loadBands?.normal?.drawProxyMs;
    need(store?.n===300&&draw?.n>0&&Number.isFinite(store?.p95)&&Number.isFinite(draw?.p95)&&store.p95<=100&&draw.p95<=250,tag+': normal callback/store/draw proxy budget');
  }
  cells.push({scenario:tag,coverage,summary:{renderedFPS:run.summary.renderedFPS,interval:run.summary.renderIntervalMs,callbackStore:run.loadBands?.normal?.callbackToStoreMs,drawProxy:run.loadBands?.normal?.drawProxyMs},canonicalEqual:run.consistency,plannedEvents:count});
}
const result={status:reasons.length?'FAIL':'PASS_JOB_REQUIRES_FULL_FIVE_BLOCK_SET',pair,side,reasons,cells};
await writeFile(path.join(dir,prefix+'-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({pair,side,status:result.status,reasons}));
if(reasons.length)process.exitCode=1;
