import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCpuTime,parseProcessRows,processIdentity,collectScopedProcesses,inspectProcessCohort} from './process-identity.mjs';
const birth='2026-11-12T16:00:00.000Z';
const row=(pid,ppid,command,cpuSeconds=0)=>({pid,ppid,command,cpuSeconds,rssKiB:100,birth,birthSource:'darwin-ps-lstart'});
const scoped=()=>collectScopedProcesses([row(10,50,'/Google Chrome for Testing'),row(11,10,'/chrome_crashpad_handler'),row(12,11,'/other-owned-child'),row(20,50,'/frozen/backend.test'),row(50,1,'/node'),row(51,50,'/bin/ps')],{browser:10,backend:20,observer:50});
test('native C-locale ps columns preserve PID PPID birth and executable with spaces',()=>{
 const [p]=parseProcessRows('18559 2109 Thu Nov 12 20:01:04 2026 0:00.02 1280 /Application Support/Google Chrome for Testing');
 assert.equal(p.pid,18559);assert.equal(p.ppid,2109);assert.equal(p.cpuSeconds,.02);assert.equal(p.rssKiB,1280);assert.equal(p.birthResolutionMs,1000);assert.match(p.birth,/Z$/);assert.equal(p.command,'/Application Support/Google Chrome for Testing');
 for(const text of ['', '12 2 malformed 0:00.02 100 /Chrome','12 2 Thu Nov 12 20:01:04 2026 bad 100 /Chrome'])assert.throws(()=>parseProcessRows(text));
 for(const [text,expected]of[['1:02.50',62.5],['1:02:03.50',3723.5],['1-01:02:03.50',90123.5]])assert.equal(parseCpuTime(text),expected);
 for(const text of ['','bad','1:60','1-00:01','1:02:03.5.5',null])assert.equal(parseCpuTime(text),null);
});
test('all observed browser descendants count even with non-Chrome executable names',()=>{
 const rows=scoped();assert.equal(rows.find(p=>p.pid===11).cohort,'browser');assert.equal(rows.find(p=>p.pid===12).role,'browser-other');assert.equal(rows.find(p=>p.pid===20).role,'backend');assert.equal(rows.find(p=>p.pid===51).cohort,'observer');assert.ok(rows.every(processIdentity));
 const b={time:0,processes:rows},a={time:1000,processes:rows.map(p=>({...p,cpuSeconds:1}))};assert.equal(inspectProcessCohort([b,a]).valid,true);
});
test('root reuse, role change, missing identity, duplicate rows and decreasing intermediate counters reject',()=>{
 const rows=scoped();const pair=mutate=>{const a=structuredClone(rows);mutate(a);return inspectProcessCohort([{time:0,processes:rows},{time:1000,processes:a}]);};
 for(const mutate of [a=>delete a[0].birth,a=>a[0].birth='2026-11-12T16:00:01.000Z',a=>a[0].command='/other',a=>a[0].ppid=1,a=>a.push(a[0]),a=>a[0].rssKiB=NaN,a=>a[0].cpuSeconds=-1])assert.equal(pair(mutate).valid,false);
 const mid=rows.map(p=>({...p,cpuSeconds:2}));const end=rows.map(p=>({...p,cpuSeconds:1}));assert.equal(inspectProcessCohort([{time:0,processes:rows},{time:500,processes:mid},{time:1000,processes:end}]).valid,false);
 const bindings=new Map();collectScopedProcesses(rows,{browser:10,backend:20,observer:50},bindings);const reused=rows.map(p=>p.pid===10?{...p,birth:'2026-11-12T16:00:02.000Z'}:p);assert.throws(()=>collectScopedProcesses(reused,{browser:10,backend:20,observer:50},bindings));
});
test('previously observed orphan child remains in accounting and sampled failures cannot pass',()=>{
 const roots={browser:10,backend:20,observer:50},bindings=new Map(),raw=[row(10,50,'/Google Chrome for Testing'),row(11,10,'/utility'),row(20,50,'/frozen/backend.test'),row(50,1,'/node')];const first=collectScopedProcesses(raw,roots,bindings);const after=collectScopedProcesses(raw.map(p=>p.pid===11?{...p,ppid:1}:p),roots,bindings);assert.equal(after.find(p=>p.pid===11).cohort,'browser');assert.equal(inspectProcessCohort([{time:0,processes:first},{time:1000,processes:after}]).valid,false);
 assert.equal(inspectProcessCohort([{time:0,processes:first},{time:500,processes:null,error:'failed'},{time:1000,processes:first}]).valid,false);
});
test('child bindings prune exited generations and retain only active exact orphan identities',()=>{
 const roots={browser:10,backend:20,observer:50},bindings=new Map();
 for(let generation=0;generation<30;generation++){
  const rows=[row(10,50,'/Google Chrome for Testing'),row(20,50,'/frozen/backend.test'),row(50,1,'/node'),row(100+generation,10,'/utility')];
  collectScopedProcesses(rows,roots,bindings);
  assert.equal(bindings.get('children').size,3);
 }
 const orphan=[row(10,50,'/Google Chrome for Testing'),row(20,50,'/frozen/backend.test'),row(50,1,'/node'),row(129,1,'/utility')];
 assert.equal(collectScopedProcesses(orphan,roots,bindings).find(p=>p.pid===129).cohort,'browser');
 assert.equal(bindings.get('children').size,3);
 collectScopedProcesses(orphan.filter(p=>p.pid!==129),roots,bindings);assert.equal(bindings.get('children').size,2);
});
test('known owned browser main basenames permit Linux lowercase without guessing unknown binaries',()=>{
 for(const executable of ['/usr/bin/chromium','/opt/google/chrome/chrome','/Google Chrome for Testing']){
  const rows=collectScopedProcesses([row(10,50,executable),row(20,50,'/frozen/backend.test'),row(50,1,'/node')],{browser:10,backend:20,observer:50});
  assert.equal(rows.find(p=>p.pid===10).role,'browser-main');
 }
 assert.throws(()=>collectScopedProcesses([row(10,50,'/unknown-browser')],{browser:10}));
});
