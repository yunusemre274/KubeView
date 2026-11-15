// Read-only progress. Queue terminal status wins over a stale interrupted stage.
import { readFile } from 'node:fs/promises';
import { measurementWindow } from '../metrics.mjs';
const [jobID, sessionFile, stageName] = process.argv.slice(2);
if (!jobID || !sessionFile || !stageName) throw Error('progress.mjs JOB_ID SESSION_JSON STAGE');
const session=JSON.parse(await readFile(sessionFile,'utf8'));
const queue=JSON.parse(await readFile('benchmarks/orchestration/queue.json','utf8'));
const job=queue.jobs.find(job=>job.id===jobID);
if (!job) throw Error('Unknown queue job');
const stage=await readFile(`benchmarks/results/${session.id}/${stageName}-state.json`,'utf8').then(JSON.parse).catch(error=>{if(error.code==='ENOENT')return {jobs:[],plan:[]};throw error;});
const option=(args,key,fallback='')=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const plannedCells=(stage.plan||[]).reduce((n,j)=>n+option(j.args,'--profiles','M').split(',').length*option(j.args,'--scenarios').split(',').length,0);
let cells=0, recordedCells=0;
const completed=stage.jobs.filter(j=>j.status==='complete');
for(const record of completed){
  const id=option(record.args,'--id');
  const report=JSON.parse(await readFile(`benchmarks/results/${id}/summary.json`,'utf8'));
  recordedCells+=report.runs.length;
  if(report.manifest.finishedAt&&!report.errors.length)cells+=report.runs.filter(run=>measurementWindow(run).valid&&run.workloadIntegrity?.valid!==false&&run.producer?.valid!==false).length;
}
const current=stage.jobs.find(j=>j.status==='running');
const terminal=['complete','failed'].includes(job.status);
console.log(JSON.stringify({status:job.status,stageStatus:stage.status,groups:completed.length,totalGroups:stage.plan?.length||0,cells,recordedCells,totalCells:plannedCells,current:!terminal&&current?`${current.name}/${current.phase}/blok${current.repeat}`:null,elapsed:!terminal&&current?Math.round((Date.now()-Date.parse(current.started))/1000):null,timedOut:job.result?.timedOut,cleanupComplete:job.result?.cleanupComplete,error:job.result?.error||stage.error}));
