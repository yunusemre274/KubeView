import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
const root='/Users/yunusemre/Desktop/KubeView',out=path.join(root,'artifacts/release-audit/ra-20261111/label-overlap-worker');
const {chromium,webkit,expect}=createRequire(path.join(root,'frontend/package.json'))('@playwright/test');
const {findResource,closePanels}=await import(pathToFileURL(path.join(root,'frontend/e2e/v11-ui.helpers.js')));
const base='http://127.0.0.1:19847';
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
 const dir=path.join(out,(process.env.KV_LABEL_PASS||'visual')+'-'+engine);mkdirSync(dir);
 const result={source:'owned07 TEST/REPLAY M5; normal UI/finder/global-map; no real Kubernetes or performance claim',engine,startedAt:new Date().toISOString(),status:'RUNNING',cases:[],errors:[]};
 let browser,timer;
 try{
  browser=await type.launch({headless:false,timeout:10000,...(engine==='chromium'?{args:['--use-angle=metal']}:{})});
  result.browser=browser.version();timer=setTimeout(()=>browser.close().catch(()=>{}),60000);
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir,size:{width:1440,height:900}}}),page=await context.newPage();page.setDefaultTimeout(8000);
  const pods=new Map();
  page.on('websocket',socket=>socket.on('framereceived',({payload})=>{try{const d=JSON.parse(String(payload));if(d.type==='SNAPSHOT'){const resources=Array.isArray(d.resources)?d.resources:Object.values(d.resources||{});for(const r of resources)if(r.kind==='Pod')pods.set(r.metadata.uid,{uid:r.metadata.uid,name:r.metadata.name,namespace:r.metadata.namespace});}}catch{}}));
  page.on('pageerror',error=>result.errors.push(error.message.replace(/\?[^\s]+/g,'?[redacted]').slice(0,200)));
  await page.goto(base);await expect(page.locator('.world-replay-badge')).toContainText('TEST/REPLAY');
  await page.waitForFunction(()=>document.querySelector('canvas')?.__harbor?.stats()?.lifecycle?.canonicalPods===300);
  const pod=[...pods.values()].find(p=>p.name==='pod-0')||[...pods.values()][0];if(!pod)throw Error('No replay Pod snapshot');result.selectedPod=pod;
  await findResource(page,'Pod',pod.name,pod.uid);await closePanels(page);
  async function settle(){let before,stable=0;await expect.poll(async()=>{const pos=await page.locator('canvas').evaluate(c=>c.__harbor.camera.position.toArray());stable=before&&Math.hypot(...pos.map((v,i)=>v-before[i]))<1e-5?stable+1:0;before=pos;return stable;},{intervals:[100],timeout:8000}).toBeGreaterThanOrEqual(3);}
  for(const [width,height] of [[390,844],[768,900],[1440,900]]){
   await page.setViewportSize({width,height});await closePanels(page);
   await page.getByRole('button',{name:'Limanlar ve deniz haritası',exact:true}).click();
   await page.getByRole('button',{name:'Denizi uzaktan gör',exact:true}).click();await settle();await page.waitForTimeout(1500);await page.mouse.move(4,150);
   const geometry=await page.evaluate(name=>{
    const plates=[...document.querySelectorAll('.harbor-nameplate')].map(el=>{const r=el.getBoundingClientRect();return{name:el.textContent,rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}}).filter(x=>x.rect.width>0&&x.rect.right>0&&x.rect.left<innerWidth&&x.rect.bottom>0&&x.rect.top<innerHeight);
    const el=[...document.querySelectorAll('div')].find(el=>el.style.pointerEvents==='none'&&getComputedStyle(el).borderTopColor==='rgb(75, 137, 209)'&&el.textContent.includes(name));
    const r=el?.getBoundingClientRect();const label=r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null;
    const overlaps=label?plates.filter(p=>Math.min(p.rect.right,label.right)>Math.max(p.rect.left,label.left)&&Math.min(p.rect.bottom,label.bottom)>Math.max(p.rect.top,label.top)).map(p=>p.name):[];
    return{label,plates,overlaps,canvases:document.querySelectorAll('canvas').length,viewport:[innerWidth,innerHeight]};
   },pod.name);
   const file='world-'+width+'.png';await page.screenshot({path:path.join(dir,file)});result.cases.push({width,height,screenshot:file,...geometry});
   if(!geometry.label)throw Error('Selected replay Pod label absent');if(geometry.overlaps.length)throw Error('Resource label overlaps harbor nameplate');
   if(geometry.label.left<15||geometry.label.right>width-15||geometry.label.top<15||geometry.label.bottom>height-15)throw Error('Resource label outside viewport');
   if(geometry.canvases!==1)throw Error('Canvas singleton changed');
  }
  if(result.errors.length)throw Error('Browser page errors');result.status='PASS';
 }catch(error){result.status='FAIL';result.failure={name:error.name,message:String(error.message).replace(/\?[^\s]+/g,'?[redacted]').slice(0,600)};}
 finally{clearTimeout(timer);await browser?.close().catch(()=>{});result.finishedAt=new Date().toISOString();writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(engine,result.status,result.cases.length);}
}
