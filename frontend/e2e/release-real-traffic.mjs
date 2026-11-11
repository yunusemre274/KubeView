/** Finite owned06 real Hubble/UI check. Normal UI only; diagnostics are read-only. */
import { chromium, webkit, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { closePanels } from './v11-ui.helpers.js';
const run=promisify(execFile), root=path.resolve(import.meta.dirname,'../..');
const out=path.join(root,'artifacts/release-audit/ra-20261111/real-flow-ui-worker');
const attempt=path.join(out,process.argv[2]||'attempt-01');
if(existsSync(attempt)) throw Error('Immutable attempt already exists');
mkdirSync(attempt,{recursive:true});
const base='http://127.0.0.1:19846', clientNS='kvml-fbf634e8-06-client', serverNS='kvml-fbf634e8-06-server';
const report={startedAt:new Date().toISOString(),scope:'REAL owned Kubernetes + real Hubble + Chromium/Playwright WebKit UI; not performance/native Safari/other-namespace authorization',browsers:[],guardedScenarios:[]};
const save=()=>writeFileSync(path.join(attempt,'result.json'),JSON.stringify(report,null,2)+'\n');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let firstTrafficAt;
async function owned(action){
  if(action!=='inspect' && action!=='traffic-stop') { firstTrafficAt??=Date.now(); assert(Date.now()-firstTrafficAt<240000,'Traffic production budget exhausted'); }
  const {stdout}=await run('python3',[path.join(out,'owned-traffic.py'),action],{cwd:root,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',GOMAXPROCS:'1'},timeout:20000,maxBuffer:200000});
  const value=JSON.parse(stdout); report.guardedScenarios.push(value); save(); return value;
}
async function until(check,timeout=25000){let value;const end=Date.now()+timeout;while(Date.now()<end){value=await check();if(value)return value;await delay(600);}throw Error('Bounded condition timed out');}
function safeEndpoint(v={}){return {uid:v.uid??null,name:v.name??null,namespace:v.namespace??null,nodeName:v.nodeName??null,nodeUID:v.nodeUID??null,port:v.port??null};}
function safeFlow(f){return {id:f.id,source:safeEndpoint(f.source),destination:safeEndpoint(f.destination),protocol:f.protocol,verdict:f.verdict,direction:f.direction,eventCount:f.eventCount,lastObserved:f.lastObserved};}
async function diagnostic(page){return page.evaluate(()=>{const h=document.querySelector('canvas')?.__harbor;if(!h)return null;const g=h.scene.getObjectByName('harbor:measured-hubble-flows');const line=g?.children.find(o=>o.isLineSegments),arrows=g?.children.find(o=>o.isInstancedMesh);const coords=line?.geometry.attributes.position.array;const ids=arrows?.userData.harborTargets?.()||[];return {at:new Date().toISOString(),stats:h.stats().measuredTraffic,arrows:arrows?{visible:arrows.visible,count:arrows.count,ids:ids.map(v=>v.uid),matrices:Array.from(arrows.instanceMatrix.array.slice(0,arrows.count*16))}:null,anchors:ids.map((v,i)=>({flowId:v.uid,source:Array.from(coords.slice(i*72,i*72+3)),destination:Array.from(coords.slice(i*72+69,i*72+72))}))};});}
async function runBrowser(engine,type){
 const r={engine,startedAt:new Date().toISOString(),status:'RUNNING',stages:[],flowSamples:[],normalUIFailures:[],flowHTTPStatuses:[],subscriptionDeletes:[],externalBlocked:0};report.browsers.push(r);save();
 let browser,context,page,lastFlowURL,latest=null,trafficStarted=false;
 const dir=path.join(attempt,engine);mkdirSync(dir);
 const shot=async name=>{const filename=name+'.png';await page.screenshot({path:path.join(dir,filename)});r.stages.push({name,at:new Date().toISOString(),png:filename,diagnostic:await diagnostic(page),sample:latest});save();};
 const settings=async enabled=>{await closePanels(page);await page.getByRole('button',{name:'Görünüm ve ayarlar',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Görünüm ve ayarlar',exact:true});await dialog.getByRole('checkbox',{name:'Ölçülmüş trafik — Hubble',exact:true}).setChecked(enabled);await dialog.getByRole('button',{name:'Pencereyi kapat',exact:true}).click();};
 const facility=async()=>{await closePanels(page);await page.getByRole('button',{name:'Bul',exact:true}).click();const finder=page.getByRole('dialog',{name:'Dünyada bul',exact:true});await finder.getByLabel('Nesne veya kaynak ara',{exact:true}).fill('Ağ Yönlendirme Tesisi');await finder.locator('.finder-result').filter({hasText:'Ağ tesisi'}).click();await page.locator('.facility-window').getByRole('button',{name:'Ölçülmüş trafik',exact:true}).click();};
 try{
  browser=await type.launch({headless:true,timeout:12000,...(engine==='chromium'?{args:['--disable-background-networking','--disable-component-update','--disable-sync']}: {})});r.version=browser.version();
  context=await browser.newContext({viewport:{width:1440,height:940},reducedMotion:'no-preference',recordVideo:{dir,size:{width:1440,height:940}}});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==base){r.externalBlocked++;return route.abort();}return route.continue();});
  page=await context.newPage();page.setDefaultTimeout(7000);
  page.on('response',async res=>{const u=new URL(res.url());if(u.pathname!='/api/flows')return;const method=res.request().method();if(method==='DELETE'){r.subscriptionDeletes.push({at:new Date().toISOString(),status:res.status()});save();return;}lastFlowURL=res.url();r.flowHTTPStatuses.push({at:new Date().toISOString(),status:res.status()});if(res.status()!==200)return;try{const d=await res.json();latest={at:new Date().toISOString(),status:d.status,windowSeconds:d.windowSeconds,units:d.units,pair:(d.flows||[]).filter(f=>f.source?.namespace===clientNS&&f.destination?.namespace===serverNS).map(safeFlow),totalFlows:(d.flows||[]).length};r.flowSamples.push(latest);if(r.flowSamples.length>100)r.flowSamples.shift();save();}catch{}});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:12000});await page.waitForFunction(()=>Boolean(document.querySelector('canvas')?.__harbor),{timeout:20000});await delay(1000);
  await facility();await shot('01-normal-facility');
  const enable=page.getByRole('button',{name:'Ölçülmüş trafik katmanını aç',exact:true});
  try{await expect(enable).toBeEnabled({timeout:3000});await enable.click();await until(()=>latest?.status==='live',12000);r.normalEnablePass=true;}
  catch{r.normalUIFailures.push({at:new Date().toISOString(),issue:'Normal facility enable did not establish live provider; preserved before real settings checkbox fallback'});await shot('02-FIRST-NORMAL-UI-FAIL');await settings(true);await facility();await until(()=>latest?.status==='live',15000);}
  await shot('03-baseline-live');
  const initial=await owned('inspect');assert.equal(initial.pods.filter(p=>p.namespace===clientNS).length,0);assert.equal(initial.pods.filter(p=>p.namespace===serverNS&&p.ready).length,1);
  const server=initial.pods.find(p=>p.namespace===serverNS);trafficStarted=true;await owned('traffic-start');
  const one=await until(async()=>{const v=await owned('inspect');return v.pods.filter(p=>p.namespace===clientNS&&p.ready&&!p.terminating).length===1?v:false;},35000);
  const oneUID=one.pods.find(p=>p.namespace===clientNS&&p.ready).uid;
  await until(()=>latest?.pair.some(f=>f.source.uid===oneUID&&f.destination.uid===server.uid),25000);
  await facility();const list=page.getByRole('region',{name:'Ölçülmüş trafik akışları'});
  // The accessible flow action includes the same real UID/namespace pairs as the API.
  const action=page.getByRole('button',{name:new RegExp('Akışı incele:.*'+oneUID+'.*'+server.uid)}).first();
  await expect(action).toBeVisible();r.uidNamespaceUI={sourceUID:oneUID,destinationUID:server.uid,sourceNamespace:clientNS,destinationNamespace:serverNS,accessibleLabel:await action.getAttribute('aria-label')};
  const row=action.locator('xpath=ancestor::tr');for(const summary of await row.locator('summary').all())await summary.click();
  await shot('04-one-client-real-uid');
  await owned('traffic-increase');const three=await until(async()=>{const v=await owned('inspect');return v.pods.filter(p=>p.namespace===clientNS&&p.ready&&!p.terminating).length===3?v:false;},35000);
  const uids=three.pods.filter(p=>p.namespace===clientNS&&p.ready).map(p=>p.uid);
  await until(()=>uids.every(uid=>latest?.pair.some(f=>f.source.uid===uid&&f.destination.uid===server.uid)),25000);
  r.threeClientUIDs=uids;await shot('05-three-clients-list');
  await closePanels(page);await page.getByRole('button',{name:'Limanlar ve deniz haritası',exact:true}).click();await page.getByRole('button',{name:'Denizi uzaktan gör',exact:true}).click();await delay(1800);await closePanels(page);
  await until(async()=>((await diagnostic(page))?.stats?.renderedFlows||0)>0,15000);
  const a=await diagnostic(page);await delay(1100);const b=await diagnostic(page);
  r.directedAnimation={before:a,after:b,matrixChanged:JSON.stringify(a.arrows?.matrices)!==JSON.stringify(b.arrows?.matrices),distinctAnchors:b.anchors.some(v=>JSON.stringify(v.source)!==JSON.stringify(v.destination))};
  assert(r.directedAnimation.matrixChanged,'Measured arrows did not move');assert(r.directedAnimation.distinctAnchors,'Measured source/destination anchors collapsed');
  await shot('06-three-clients-world-arrows');
  await owned('traffic-stop');r.stopAt=new Date().toISOString();
  await shot('07-stop-requested');
  const empty=await until(async()=>{const v=await owned('inspect');return v.pods.filter(p=>p.namespace===clientNS).length===0?v:false;},35000);
  r.clientPodLISTZeroAt=empty.at;
  await until(async()=>latest?.pair.length===0&&((await diagnostic(page))?.stats?.renderedFlows===0),22000);r.drainedAt=new Date().toISOString();
  await facility();await shot('08-stop-window-drained');r.status='PASS';
 }catch(error){r.status='FAIL';r.failure={type:error.name,message:String(error.message).split('\n')[0].replace(/https?:\/\/\S+/g,'[redacted-address]')};if(page&&!page.isClosed())try{await shot('FAIL');}catch{};}
 finally{
  try{await owned('traffic-stop');const empty=await until(async()=>{const v=await owned('inspect');return v.pods.filter(p=>p.namespace===clientNS).length===0?v:false;},35000);r.cleanup={guardedStop:true,clientPodLISTZero:true,appPID:empty.appPID,relayPID:empty.relayPID};}catch(e){r.cleanup={failed:true,type:e.name};r.status='FAIL';}
  if(page&&!page.isClosed()){
   try{if(lastFlowURL){await until(()=>latest?.pair.length===0,22000);r.cleanup.flowPairDrained=true;}await settings(false);await delay(500);if(lastFlowURL&&!r.subscriptionDeletes.some(v=>v.status===200)){const response=await page.request.delete(lastFlowURL,{headers:{Origin:base}});r.subscriptionDeletes.push({at:new Date().toISOString(),status:response.status(),explicitCleanup:true});}r.cleanup.subscriptionReleased=r.subscriptionDeletes.some(v=>v.status===200);}catch(e){r.cleanup.subscriptionCleanupError=e.name;r.status='FAIL';}
  }
  if(context)await context.close();if(browser)await browser.close();r.browserClosed=true;r.finishedAt=new Date().toISOString();save();
 }
}
try{await owned('inspect');for(const [engine,type]of[['chromium',chromium],['webkit',webkit]]){await runBrowser(engine,type);}}finally{report.finalGuard=await owned('traffic-stop');report.finishedAt=new Date().toISOString();report.trafficProductionWallUpperBoundSeconds=firstTrafficAt?Math.ceil((Date.now()-firstTrafficAt)/1000):0;report.status=report.browsers.every(r=>r.status==='PASS')?'PASS':'FAIL';save();}
console.log(JSON.stringify({status:report.status,browsers:report.browsers.map(v=>({engine:v.engine,status:v.status,normalUIFailures:v.normalUIFailures.length,cleanup:v.cleanup})),trafficWallSeconds:report.trafficProductionWallUpperBoundSeconds}));
process.exitCode=report.status==='PASS'?0:1;
