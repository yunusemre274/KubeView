import {chromium,expect} from '../../../../frontend/node_modules/@playwright/test/index.mjs';
import {writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=process.env.KV_PACKAGED_EVIDENCE,origin='http://127.0.0.1:19849';
const result={startedAt:new Date().toISOString(),tooling:'Absolute Node + headed Playwright Chromium are automation tools, not app runtime dependencies',status:'FAIL',checks:[],externalRequestsBlocked:[],mutationRequests:[],pageErrors:[]};let browser;const timer=setTimeout(()=>browser?.close().catch(()=>{}),45000);
try{
 browser=await chromium.launch({headless:false,args:['--use-angle=metal','--disable-background-networking','--disable-component-update','--disable-sync'],timeout:10000});
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await context.route('**/*',route=>{const u=new URL(route.request().url());if(['data:','blob:'].includes(u.protocol)||u.origin===origin)return route.continue();result.externalRequestsBlocked.push({origin:u.origin});return route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(7000);page.on('pageerror',e=>result.pageErrors.push(e.message.slice(0,160)));page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))result.mutationRequests.push({method:r.method(),path:new URL(r.url()).pathname});});
 const navigation=await page.goto(origin,{timeout:12000});assert.equal(navigation.status(),200);
 const first=page.getByRole('button',{name:'İlk limanını bağla',exact:true});await first.waitFor();await expect(page.locator('canvas')).toHaveCount(1);
 const canvas=await page.locator('canvas').elementHandle();result.renderer=await page.locator('canvas').evaluate(c=>{const gl=c.getContext('webgl2')||c.getContext('webgl');if(!gl)return null;const e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER),vendor:gl.getParameter(e?e.UNMASKED_VENDOR_WEBGL:gl.VENDOR)};});
 if(!/Metal/i.test(result.renderer?.renderer||'')||/SwiftShader|llvmpipe/i.test(result.renderer?.renderer||'')){result.status='BLOCKED';throw Error('Actual Metal renderer not established; no fallback launched');}
 result.browserVersion=browser.version();result.checks.push('embedded normal empty-workspace onboarding and one Metal canvas');
 await page.screenshot({path:path.join(out,'01-empty-onboarding.png')});
 await first.click();const win=page.locator('.workspace-window');await win.waitFor();await expect(page.getByRole('textbox',{name:'Liman adı',exact:true})).toBeVisible();await expect(page.getByRole('combobox',{name:'Cluster / context',exact:true})).toBeVisible();
 await page.getByRole('textbox',{name:'Liman adı',exact:true}).fill('Paket kontrolü');await page.screenshot({path:path.join(out,'02-first-harbor-form.png')});
 await win.getByRole('button',{name:'Pencereyi kapat',exact:true}).click();await win.waitFor({state:'detached'});assert.equal(await page.evaluate(original=>original===document.querySelector('canvas'),canvas),true);await expect(first).toBeVisible();
 result.checks.push('normal onboarding form open/type/close preserves identical canvas');assert.equal(result.mutationRequests.length,0);assert.equal(result.pageErrors.length,0);result.status='PASS';
}catch(e){result.failure=String(e.message).slice(0,500);process.exitCode=1;}
finally{clearTimeout(timer);await browser?.close().catch(()=>{});result.finishedAt=new Date().toISOString();await writeFile(path.join(out,'browser-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}
