// Two finite diagnostic JS samples, not acceptance CPU repeats.
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import path from 'node:path';
import {superviseJob} from '../../../../benchmarks/orchestration/supervise-job.mjs';
const root=process.cwd(),base='v11-l-js-diagnostic-20261109',dir=path.join(root,'benchmarks/results',base);
const parent=JSON.parse(await readFile('benchmarks/results/v11-final-ac-20261109/queue.json','utf8'));
if(parent.status!=='passed')throw Error('Completed frozen parent required');
await mkdir(dir,{recursive:false});
const record={id:base,type:'CDP CPU sampling + start PNG, heavy diagnostic excluded from production CPU comparisons',question:'Which JS/DOM paths dominate the residual L work; can caption updates be identified? Native renderer/GPU CPU remains outside this sample.',status:'running',jobs:[]};
try{for(const phase of ['baseline','optimized']){
 const old=parent.jobs.find(j=>j.group==='world'&&j.phase===phase),argv=[...old.argv],id=base+'-'+phase;
 for(const [flag,value] of [['--id',id],['--warmup','30'],['--seconds','15'],['--max-minutes','3'],['--experiment-family',base]])argv[argv.indexOf(flag)+1]=value;
 argv.push('--profile-cpu','--scene-inventory','--capture-start');
 const job={id,phase,argv};record.jobs.push(job);await writeFile(path.join(dir,'queue.json'),JSON.stringify(record,null,2));
 const log=await open(path.join(dir,phase+'.stdout.log'),'wx');
 try{job.result=await superviseJob({argv,cwd:root,timeoutSeconds:180,onOutput:async chunk=>{await log.write(chunk);process.stdout.write(chunk);}});}finally{await log.close();}
 if(job.result.code!==0||!job.result.cleanupComplete||job.result.timedOut)throw Error('Diagnostic stopped; no automatic retry');
 }record.status='passed';
}catch(e){record.status='failed';record.error=e.stack;process.exitCode=1;}
finally{record.finishedAt=new Date().toISOString();await writeFile(path.join(dir,'queue.json'),JSON.stringify(record,null,2));}
