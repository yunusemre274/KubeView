// Explicit local GPU probe; synthetic resources, never calls Kubernetes mutations.
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:false,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const report={date:new Date().toISOString(),browser:browser.version(),headless:false,viewport:'1440x900 CSS px',quality:'medium',profiles:[],note:'Synthetic scene, controlled camera movement. Metal requested; inspect actual renderer before describing hardware results.'};
try {
 for(const [nodes,pods]of [[20,300],[50,1500]]) {
  await page.goto(`${process.env.BASE_URL||'http://127.0.0.1:5173'}/src/harbor/qa.html?nodes=${nodes}&pods=${pods}`);
  await page.waitForFunction(()=>window.harborQA?.stats()?.calls>0);await page.waitForTimeout(1200);
  report.profiles.push(await page.evaluate(async({nodes,pods})=>{
   const canvas=document.querySelector('canvas'),h=canvas.__harbor,gl=canvas.getContext('webgl2')||canvas.getContext('webgl'),ext=gl.getExtension('WEBGL_debug_renderer_info');
   const renderer=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable';
   const first=h.stats().frame,start=performance.now(),frames=[];let previous=start;
   while(performance.now()-start<5000){h.camera.position.x+=0.07;h.invalidate();await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-previous);previous=now;}
   const elapsedMs=performance.now()-start,renderedFrames=h.stats().frame-first;
   frames.sort((a,b)=>a-b);
   return {nodes,pods,renderer,renderedFrames,elapsedMs,renderedFPS:renderedFrames/(elapsedMs/1000),animationFrameP95Ms:frames[Math.floor(frames.length*.95)],stats:h.stats()};
  },{nodes,pods}));
 }
} finally {await writeFile('../docs/evidence/gpu-profile.json',JSON.stringify(report,null,2));await browser.close();}
console.log(report);
