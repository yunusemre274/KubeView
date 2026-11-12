// Short-run tool validation, never CPU/FPS/latency acceptance.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {processCoverage,settings} from '../../../../benchmarks/panel-compare.mjs';
import {cameraComparisonReasons} from '../../../../benchmarks/camera-contract.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=name=>readFile(path.join(dir,name),'utf8').then(JSON.parse);
const a=await read('A-runner-summary.json'),b=await read('B-runner-summary.json');
const reports=[a,b], checks=[];
const check=(name,passed)=>checks.push({name,passed:Boolean(passed)});
check('same-explicit-camera-projection',!cameraComparisonReasons(a,b).length&&a.manifest.cameraFovOverride===38);
check('same-frozen-common-backend',a.manifest.backendBinarySHA256==='9d35acc901bcbe6f8488042dd093a83e8a74c2d62cc77a9ef744f6ed48ee84a8'&&a.manifest.backendBinarySHA256===b.manifest.backendBinarySHA256);
check('same-actual-render-settings-and-start-fleet',JSON.stringify(settings(a.runs[0]))===JSON.stringify(settings(b.runs[0])));
check('same-Node-summary-context-and-content',JSON.stringify(a.runs[0].before.panel)===JSON.stringify(b.runs[0].before.panel));
const results=[];
for (const [i,report] of reports.entries()) {
  const label=['A','B'][i],run=report.runs[0],samples=await read(label+'-process-samples.json');
  check(label+'-one-complete-short-run',report.runs.length===1&&!report.errors.length&&Boolean(report.manifest.finishedAt)&&report.manifest.smoke===true&&report.manifest.params.seconds===3);
  check(label+'-reference-resource-and-draw-scope',[run.before,run.after].every(x=>x.stats.lifecycle.visibleNodes===8&&x.stats.lifecycle.visiblePods===120&&x.stats.lifecycle.canonicalNodes===20&&x.stats.lifecycle.canonicalPods===300&&x.rendererPixelRatio===1&&x.buffer.width===1440&&x.buffer.height===900));
  check(label+'-requested-panel',run.before.panel.uid==='node-0'&&run.before.panel.tab==='Özet'&&run.before.panel.open);
  const coverage=processCoverage(run,samples);
  check(label+'-native-process-cohort',coverage.complete);
  const roles=[...new Set((run.osBefore?.processes||[]).map(p=>p.role))].sort();
  check(label+'-actual-browser-renderer-GPU-backend-roots',['browser-main','browser-renderer','browser-gpu','backend'].every(role=>roles.includes(role)));
  const start=new Map(run.before.fleet.map(s=>[s.uid,s]));
  const moved=run.after.fleet.filter(s=>start.has(s.uid)&&s.position.some((p,j)=>Math.abs(p-start.get(s.uid).position[j])>1e-5)).map(s=>s.uid);
  check(label+'-decorative-ship-motion-resumed',moved.length>0);
  results.push({side:label,cohortValid:coverage.complete,cohortReasons:coverage.reasons,clockWindow:coverage.clockWindow,
    roles,observedProcesses:run.osBefore?.processes?.length??null,
    projectedRaycastVisibleUIDs:run.before.projectedVisibleNodeUIDs,
    fleetMovedUIDs:moved,
    limitations:'Three-second n1 tool validation; not CPU/FPS/latency acceptance. OS birth has1s resolution; unsampled short children remain a visibility limit. PNGs require separate visual inspection.'});
}
const result={status:checks.every(c=>c.passed)?'PASS_TOOL_VALIDATION_VISUAL_REVIEW_PENDING':'FAIL',purpose:'HARNESS_VALIDATION_ONLY_NOT_PERFORMANCE_ACCEPTANCE',checks,results};
await writeFile(path.join(dir,'analysis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(result.status==='FAIL')process.exitCode=1;
