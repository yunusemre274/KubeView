// Explicit synthetic benchmark. Run against Vite; no Kubernetes mutation.
import {chromium} from 'playwright'
import {writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
const base=process.env.BASE_URL||'http://127.0.0.1:5173'
const browser=await chromium.launch({headless:true,args:['--enable-precise-memory-info']})
const context=await browser.newContext({viewport:{width:1440,height:900}})
const page=await context.newPage()
const errors=[];page.on('pageerror',e=>errors.push(e.message))
const cdp=await context.newCDPSession(page)
const report={date:new Date().toISOString(),browser:browser.version(),viewport:'1440x900 CSS px',headless:true,quality:'medium',environment:execFileSync('system_profiler',['SPHardwareDataType'],{encoding:'utf8'}).replace(/\s*(Serial Number|Hardware UUID|Provisioning UDID).*\n/g,''),profiles:[],churn:[]}
for(const [nodes,pods]of[[20,300],[50,1500]]){
 await page.goto(`${base}/src/harbor/qa.html?nodes=${nodes}&pods=${pods}`);await page.waitForFunction(()=>window.harborQA?.stats()?.calls>0);await page.waitForTimeout(1000)
 const before=await page.evaluate(()=>window.harborQA.stats());await page.waitForTimeout(1000);const after=await page.evaluate(()=>window.harborQA.stats())
 await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage')
 const render=await page.evaluate(async()=>{const h=document.querySelector('canvas').__harbor,canvas=document.querySelector('canvas');const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const extension=gl.getExtension('WEBGL_debug_renderer_info');const renderer=extension?gl.getParameter(extension.UNMASKED_RENDERER_WEBGL):'unavailable';const first=h.stats().frame,start=performance.now();while(performance.now()-start<3000){h.camera.position.x+=0.1;h.invalidate();await new Promise(requestAnimationFrame)}const elapsed=performance.now()-start;return{renderer,renderedFrames:h.stats().frame-first,elapsedMs:elapsed,observedRenderFPS:(h.stats().frame-first)/(elapsed/1000)}});
 report.profiles.push({nodes,pods,before,after,idleFrames:after.frame-before.frame,heap,render,note:'Synthetic scene. Renderer FPS is measured during a three-second controlled camera motion; headless software renderer must not be claimed as hardware FPS.'});
 await writeFile('../docs/evidence/performance.json',JSON.stringify({...report,errors},null,2));
 await page.screenshot({path:`../docs/evidence/perf-${nodes}-${pods}.png`})
}
await page.goto(`${base}/src/harbor/qa.html?nodes=20&pods=300`);await page.waitForFunction(()=>window.harborQA?.stats()?.calls>0)
const duration=Number(process.env.CHURN_MS||600000),start=Date.now();let cycle=0
while(Date.now()-start<duration){
 const uid=`churn-${cycle++}`
 await page.evaluate(uid=>window.harborQA.pending(uid),uid);await page.waitForTimeout(100)
 await page.evaluate(uid=>window.harborQA.schedule(uid),uid);await page.waitForTimeout(300)
 await page.evaluate(uid=>window.harborQA.remove(uid),uid)
 if(cycle%10===0){await cdp.send('HeapProfiler.collectGarbage');report.churn.push({elapsedMs:Date.now()-start,cycle,heap:await cdp.send('Runtime.getHeapUsage'),stats:await page.evaluate(()=>window.harborQA.stats())});await writeFile('../docs/evidence/performance.json',JSON.stringify({...report,errors},null,2))}
 if(cycle%30===0)await page.evaluate(()=>window.harborQA.profile(20,300))
 await page.waitForTimeout(600)
}
await page.waitForTimeout(1200);await cdp.send('HeapProfiler.collectGarbage');report.churn.push({elapsedMs:Date.now()-start,cycle,heap:await cdp.send('Runtime.getHeapUsage'),stats:await page.evaluate(()=>window.harborQA.stats())});report.errors=errors
await writeFile('../docs/evidence/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify({profiles:report.profiles,churnFirst:report.churn[0],churnLast:report.churn.at(-1),errors}));await browser.close()
