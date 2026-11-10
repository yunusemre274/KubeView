// Normal DOM/pointer acceptance helper, separate from CPU acceptance runs.
// No product state mutation hook, kubeconfig, Secret or raw log is recorded.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(path.join(root,'frontend/package.json'));
const {chromium,webkit}=require('playwright');
const args=process.argv.slice(2),option=(key,fallback)=>{const i=args.indexOf(`--${key}`);return i<0?fallback:args[i+1]};
const geometryRevisit=args.includes('--geometry-revisit'),runBegan=Date.now();
const target=new URL(option('url','http://127.0.0.1:19702'));
if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname)||!['http:','https:'].includes(target.protocol)||target.username||target.password)throw Error('Explicit loopback URL only');
const id=option('id',`workspace-ui-${Date.now()}`);
if(!/^[\w.-]+$/.test(id))throw Error('Safe new evidence ID required');
const out=path.join(root,'artifacts/workspace',id);
await mkdir(out,{recursive:false});
const engine=option('browser','chromium');
if(!['chromium','webkit'].includes(engine))throw Error('Use chromium or webkit; WebKit is not native Safari');
const switches=Number(option('switches','0'));
if(!Number.isInteger(switches)||switches<0||switches>100)throw Error('Bounded --switches 0..100 required');
if(geometryRevisit&&(switches!==40||Number(option('expect-nodes','0'))!==20||Number(option('expect-pods','0'))!==300||args.includes('--onboard')||option('motion','no-preference')!=='no-preference'))throw Error('Geometry revisit requires40 switches/M20 nodes300 pods/normal motion and no onboarding');
const browser=await(engine==='webkit'?webkit:chromium).launch({headless:false,...(geometryRevisit?{timeout:5000}:{}),...(engine==='chromium'?{args:['--use-angle=metal']}: {})});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:option('motion','no-preference')});
const page=await context.newPage();
const result={id,startedAt:new Date().toISOString(),url:target.origin,browser:engine,browserVersion:browser.version(),dataSource:'Normal product UI; source kind verified from actual profile',status:'running',checks:[],errors:[]};
let geometryTimer;
if(geometryRevisit){page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(10000);geometryTimer=setTimeout(()=>{result.geometryTimedOut=true;browser.close().catch(()=>{});},Math.max(1,80000-(Date.now()-runBegan)));result.geometryRevisit={checkpoints:[],prohibitedWrites:[],limits:['Read-only GPU count/scene UUID diagnostic; not a CPU benchmark or a leak/no-leak acceptance.','TextGeometry exposes no text string here; any harbor/name association is an explicit mesh-position match, never an inferred glyph decode.','No visual reset/hold, quality, data, theme, viewport or DPR change.']};page.on('request',request=>{const url=new URL(request.url());if(['GET','HEAD'].includes(request.method()))return;if(url.pathname==='/api/management'&&request.postDataJSON()?.enabled===false)return;if(['/api/resources','/api/actions','/api/management','/api/replay/scenario'].includes(url.pathname))result.geometryRevisit.prohibitedWrites.push({path:url.pathname,method:request.method()});});}
page.on('pageerror',error=>result.errors.push(error.message));
const check=(name,detail)=>result.checks.push({name,at:new Date().toISOString(),detail});
const capture=async name=>{await page.screenshot({path:path.join(out,`${name}.png`)});check('screenshot',{file:`${name}.png`});};
async function workspace(){const r=await page.request.get(`${target.origin}/api/workspace`);if(!r.ok())throw Error(`Workspace HTTP ${r.status()}`);return r.json()}
const safeWorkspace=d=>({id:d.id,revision:d.revision,schemaVersion:d.schemaVersion,connections:d.connections.map(c=>({id:c.id,name:c.name,context:c.context,bound:c.bound,identity:c.identity})),harbors:d.harbors.map(h=>({id:h.id,name:h.name,connectionRef:h.connectionRef,namespaces:h.namespaces,selector:h.selector,position:h.position}))});
async function world(){
 await page.waitForFunction(()=>document.querySelector('canvas')?.__harbor?.stats,{timeout:90000});
 return page.evaluate(()=>{const c=document.querySelector('canvas'),b=c.getBoundingClientRect();return{canvasCount:document.querySelectorAll('canvas').length,rect:{x:b.x,y:b.y,width:b.width,height:b.height},viewport:{width:innerWidth,height:innerHeight},bodyScroll:document.body.scrollHeight,stats:c.__harbor.stats(),camera:{position:c.__harbor.camera.position.toArray(),quaternion:c.__harbor.camera.quaternion.toArray(),zoom:c.__harbor.camera.zoom},brand:document.querySelector('.world-brand-control')?.textContent}});
}
async function assertWorld(){const d=await world();assert.equal(d.canvasCount,1);assert.equal(d.rect.width,d.viewport.width);assert.equal(d.rect.height,d.viewport.height);assert.ok(d.bodyScroll<=d.viewport.height+1);return d}
async function readyResources(doc){
 if(!doc.harbors.length)return;
 const nodes=Number(option('expect-nodes','0')),pods=Number(option('expect-pods','0'));
 await page.waitForFunction(({nodes,pods})=>{
  const stats=document.querySelector('canvas')?.__harbor?.stats?.();
  const brand=document.querySelector('.world-brand-control')?.textContent||'';
  return !/API bekleniyor/.test(brand)&&stats?.lifecycle?.canonicalNodes>=nodes&&stats?.lifecycle?.canonicalPods>=pods;
 },{nodes,pods},{timeout:90000});
 const actual=await world();
 if(args.includes('--expect-nodes'))assert.equal(actual.stats.lifecycle.canonicalNodes,nodes);
 if(args.includes('--expect-pods'))assert.equal(actual.stats.lifecycle.canonicalPods,pods);
 check('canonical-resources-observed',{nodes:actual.stats.lifecycle.canonicalNodes,pods:actual.stats.lifecycle.canonicalPods,brand:actual.brand});
}
async function visibleActiveWorld(){
 if(Number(option('expect-nodes','0'))<1)return;
 await page.waitForFunction(()=>document.querySelector('canvas')?.__harbor?.projectTargets({type:'node'}).some(target=>target.visible),null,{timeout:10000});
 check('active-node-mesh-is-raycast-visible',{visible:true,scope:'Actual projected scene target; separate from canonical counts and DOM brand'});
}
async function settledActiveWorld(harbor){
 await page.evaluate(()=>{delete globalThis.__workspaceCameraStability});
 await page.waitForFunction(({coordinates,needsNode})=>{
  const h=document.querySelector('canvas')?.__harbor;
  if(!h)return false;
  const group=h.scene.getObjectByName('workspace:active-harbor');
  if(!group||Math.abs(group.position.x-coordinates[0])>.001||Math.abs(group.position.z-coordinates[1])>.001)return false;
  const vector=[...h.camera.position.toArray(),...h.camera.quaternion.toArray()];
  const prior=globalThis.__workspaceCameraStability,now=performance.now();
  if(!prior||vector.some((value,index)=>Math.abs(value-prior.vector[index])>.00001)){
   globalThis.__workspaceCameraStability={vector,since:now};return false;
  }
  return now-prior.since>=180&&(!needsNode||h.projectTargets({type:'node'}).some(target=>target.visible));
 },{coordinates:harbor.position,needsNode:Number(option('expect-nodes','0'))>0},{timeout:15000});
 await page.evaluate(()=>{delete globalThis.__workspaceCameraStability});
 check('settled-camera-active-harbor-visible',{harborId:harbor.id,coordinates:harbor.position});
}
async function panelContrast(){
 const values=await page.locator('.workspace-port').evaluateAll(cards=>cards.map(card=>({foreground:getComputedStyle(card.querySelector('strong')).color,background:getComputedStyle(card).backgroundColor})));
 const rgb=value=>{const n=value.match(/[\d.]+/g)?.map(Number);if(!n||n.length<3||n.length>3&&n[3]!==1)throw Error('Opaque RGB contrast check unavailable');return n.slice(0,3)};
 const luminance=value=>rgb(value).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 const ratios=values.map(value=>{const a=luminance(value.foreground),b=luminance(value.background);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
 assert.ok(ratios.every(r=>r>=4.5),`Harbor card text contrast below 4.5: ${ratios.join(',')}`);
 check('harbor-card-text-contrast',{ratios,scope:'Computed opaque text/surface colors; no physical display contrast claim'});
}
async function openMap(){
 const button=page.getByRole('button',{name:'Limanlar ve deniz haritası',exact:true});await button.click();
 await page.locator('.workspace-window').waitFor();
}
async function geometryCheckpoint(completed,harbor,harbors){
 await settledActiveWorld(harbor);await page.waitForTimeout(80);
 const value=await page.locator('canvas').evaluate((canvas,{harbor,harbors})=>{
  const h=canvas.__harbor,geometries=new Map(),materials=new Set(),inactiveLettering=[];let objects=0,state=h.scene.__r3f?.root?.getState?.();
  if(!state)h.scene.traverse(object=>{state ||= object.__r3f?.root?.getState?.();});
  h.scene.traverse(object=>{
   objects++;const geometry=object.geometry;
   if(geometry?.uuid){geometries.set(geometry.uuid,{uuid:geometry.uuid,id:geometry.id,type:geometry.type});let ancestor=object.parent,insideInactive=false;while(ancestor){if(ancestor.name==='workspace:inactive-harbors'){insideInactive=true;break;}ancestor=ancestor.parent;}
    if(insideInactive&&geometry.type==='TextGeometry'){const position=object.position.toArray(),match=harbors.find(port=>Array.isArray(port.position)&&Math.abs(position[0]-(port.position[0]-75))<1e-6&&Math.abs(position[1]-5)<1e-6&&Math.abs(position[2]-(port.position[1]+45))<1e-6);inactiveLettering.push({geometryUUID:geometry.uuid,objectUUID:object.uuid,objectName:object.name||'',position,association:match?{method:'observed mesh position matches existing WorkspaceHarbors label placement',harborId:match.id,harborName:match.name}:null,textDirectlyAvailable:typeof geometry.parameters?.text==='string'});}
   }
   for(const field of ['material','customDepthMaterial','customDistanceMaterial','overrideMaterial']){const value=object[field];for(const material of Array.isArray(value)?value:[value])if(material?.uuid)materials.add(material.uuid);}
  });
  const active=h.scene.getObjectByName('workspace:active-harbor'),rect=canvas.getBoundingClientRect(),stats=h.stats();
  return{harborId:harbor.id,brand:document.querySelector('.world-brand-control')?.textContent,activePosition:active?[active.position.x,active.position.z]:null,camera:{position:h.camera.position.toArray(),quaternion:h.camera.quaternion.toArray(),zoom:h.camera.zoom,target:state?.controls?.target?.toArray?.()||null},gpu:{...stats.memory},sceneReachable:{objects,geometries:geometries.size,materials:materials.size},geometryUUIDs:[...geometries.keys()].sort(),geometries:[...geometries.values()].sort((a,b)=>a.uuid.localeCompare(b.uuid)),inactiveLettering:inactiveLettering.sort((a,b)=>a.position[0]-b.position[0]||a.position[2]-b.position[2]),canonical:{nodes:stats.lifecycle.canonicalNodes,pods:stats.lifecycle.canonicalPods,visibleNodes:stats.lifecycle.visibleNodes,visiblePods:stats.lifecycle.visiblePods},viewport:[innerWidth,innerHeight],canvasRect:[rect.x,rect.y,rect.width,rect.height],dpr:devicePixelRatio,rendererDPR:state?.gl?.getPixelRatio?.()||null,preferences:localStorage.getItem('kubeview.preferences.v1')};
 },{harbor,harbors});
 assert.equal(value.canonical.nodes,20);assert.equal(value.canonical.pods,300);assert.equal(value.canonical.visibleNodes,8);assert.equal(value.canonical.visiblePods,120);assert.deepEqual(value.viewport,[1440,900]);assert.deepEqual(value.canvasRect,[0,0,1440,900]);assert.equal(value.dpr,1);assert.deepEqual(value.activePosition,harbor.position);
 value.completed=completed;result.geometryRevisit.checkpoints.push(value);check('geometry-revisit-checkpoint',{completed,harborId:harbor.id,gpu:value.gpu,sceneReachable:value.sceneReachable,inactiveLettering:value.inactiveLettering.length});
}
try{
 await page.goto(target.origin);await assertWorld();
 const original=await workspace();result.workspaceBefore=safeWorkspace(original);
 await readyResources(original);
 if(original.harbors.length)await visibleActiveWorld();
 else {
  const empty=await world();assert.equal(empty.stats.lifecycle.canonicalNodes,0);assert.equal(empty.stats.lifecycle.canonicalPods,0);
  check('empty-workspace-no-fake-resources',{nodes:0,pods:0});
 }
 await capture('01-initial-world');
 if(args.includes('--onboard')){
  assert.equal(original.harbors.length,0,'Onboarding must start with empty real workspace');
  assert.equal(original.connections.length,0,'First-use test must not reuse an already bound connection');
  const namespace=option('namespace',''),contextName=option('context','');
  if(!namespace||!contextName)throw Error('--onboard requires explicit owned --context and --namespace');
  await page.getByRole('button',{name:'İlk limanını bağla',exact:true}).click();
  await page.getByLabel('Liman adı',{exact:true}).fill('İlk manuel liman');
  // The first frozen candidate has a wrapped label whose computed accessible
  // name includes option text. Use its actual DOM form order, not a test hook.
  await page.locator('.workspace-form select').nth(1).selectOption(contextName);
  await page.getByLabel('Namespace kapsamı (virgülle)',{exact:true}).fill(namespace);
  await page.getByRole('button',{name:'Bağlantıyı dene ve kapsamı önizle',exact:true}).click();
  await page.getByRole('button',{name:'Limanı kaydet',exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('.workspace-window'),{timeout:30000});
  const created=await workspace();assert.equal(created.harbors.length,1);assert.equal(created.connections.length,1);
  await readyResources(created);
  await visibleActiveWorld();
  assert.equal(created.harbors[0].connectionRef,created.connections[0].id);
  check('normal-ui-onboarding-server-generated-ids',{harborId:created.harbors[0].id,connectionId:created.connections[0].id});
  await capture('02-onboarded-world');
 }
 const doc=await workspace();
 if(geometryRevisit){assert.equal(doc.harbors.length,20);const source=await(await page.request.get(`${target.origin}/api/contexts`)).json();assert.equal(source.dataSource,'test-replay');assert.equal(source.serverReadOnly,true);await page.locator('.world-replay-badge').waitFor();const close=page.getByRole('button',{name:'Ayrıntı panelini kapat',exact:true});if(await close.isVisible())await close.click();await openMap();await page.locator('.workspace-port-select').filter({has:page.getByText(doc.harbors[0].name,{exact:true})}).click();await page.locator('.workspace-window').waitFor({state:'detached'});await readyResources(doc);await geometryCheckpoint(0,doc.harbors[0],doc.harbors);}
 if(switches){
  assert.ok(doc.harbors.length>=2,'Switch test needs at least two registered harbors');
  const initial=await assertWorld();
  const canvas=await page.locator('canvas').elementHandle();
  for(let i=0;i<switches;i++){
   const harbor=doc.harbors[(i+(geometryRevisit?1:0))%doc.harbors.length];
   await openMap();
   const port=page.locator('.workspace-port-select').filter({has:page.getByText(harbor.name,{exact:true})});
   await port.click();
   await page.locator('.workspace-window').waitFor({state:'detached'});
   await page.waitForFunction(name=>document.querySelector('.world-brand-control')?.textContent.includes(name),harbor.name);
   await readyResources(doc);
   await visibleActiveWorld();
   assert.equal(await page.evaluate(c=>c===document.querySelector('canvas'),canvas),true,'Harbor switch remounted Canvas');
   if(geometryRevisit){await settledActiveWorld(harbor);if((i+1)%20===0)await geometryCheckpoint(i+1,harbor,doc.harbors);}
  }
  await settledActiveWorld(doc.harbors[(switches-1+(geometryRevisit?1:0))%doc.harbors.length]);
  const last=await assertWorld();check('normal-ui-harbor-switches',{completed:switches,canvasPreserved:true,before:initial.stats,after:last.stats});
  await capture('03-after-switches');
 }
 if(geometryRevisit){const [initial,first,second]=result.geometryRevisit.checkpoints;assert.equal(initial.harborId,first.harborId);assert.equal(initial.harborId,second.harborId);for(const value of [first,second]){for(const key of ['position','quaternion','target'])if(initial.camera[key]&&value.camera[key])assert.ok(Math.hypot(...value.camera[key].map((n,index)=>n-initial.camera[key][index]))<1e-5,`Geometry revisit camera ${key} changed`);assert.equal(value.camera.zoom,initial.camera.zoom);assert.equal(value.preferences,initial.preferences);assert.equal(value.rendererDPR,initial.rendererDPR);}assert.equal(result.geometryRevisit.prohibitedWrites.length,0);result.geometryRevisit.comparison={initialTo20GPU:first.gpu.geometries-initial.gpu.geometries,from20To40GPU:second.gpu.geometries-first.gpu.geometries,from20To40AddedUUIDs:second.geometryUUIDs.filter(uuid=>!first.geometryUUIDs.includes(uuid)),from20To40RemovedUUIDs:first.geometryUUIDs.filter(uuid=>!second.geometryUUIDs.includes(uuid)),matchedHarborAndCamera:true,interpretation:'Counts and exact identities only; growth attribution and leak/no-leak conclusion require review.'};}
 for(const [width,height,theme] of geometryRevisit?[]:[[1440,900,'light'],[1280,800,'dark'],[768,900,'light']]){
  await page.setViewportSize({width,height});
  await page.emulateMedia({colorScheme:theme,reducedMotion:option('motion','no-preference')});
  await page.getByRole('button',{name:'Görünüm ve ayarlar',exact:true}).click();
  const themeSelect=page.getByRole('combobox',{name:'Panel teması',exact:true});
  await themeSelect.selectOption(theme);
  await themeSelect.focus();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog',{name:'Görünüm ve ayarlar',exact:true}).waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme,'Theme must actually change through the product UI');
  await assertWorld();
  await capture(`world-${width}-${theme}`);
  if(doc.harbors.length){await openMap();await capture(`harbors-${width}-${theme}`);await panelContrast();await page.getByRole('button',{name:'Pencereyi kapat',exact:true}).focus();await page.keyboard.press('Escape');await page.locator('.workspace-window').waitFor({state:'detached'});}
 }
 result.workspaceAfter=safeWorkspace(await workspace());
 result.final=await assertWorld();
 assert.equal(result.errors.length,0,'Browser page errors');
 result.status='passed';
}catch(error){result.status='failed';result.failure=error.stack;await capture('failure').catch(()=>{});process.exitCode=1}
finally{clearTimeout(geometryTimer);result.finishedAt=new Date().toISOString();await context.close().catch(()=>{});await browser.close().catch(()=>{});await writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({id,status:result.status,checks:result.checks.length,failure:result.failure||null}))}
