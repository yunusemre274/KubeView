// Bounded installed-Safari fallback. Run only under the root's exclusive lease.
// Never enables Apple Events JS, quits Safari, reads other tabs, or claims shared
// browser-process CPU as an isolated native Safari benchmark.
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { summarize } from '../metrics.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const session = JSON.parse(await readFile(path.join(root, 'benchmarks/panel-final-session.json'), 'utf8'));
const arg = process.argv.indexOf('--id');
const id = arg < 0 ? `${session.id}-native-safari-manual` : process.argv[arg + 1];
if (!/^[\w.-]+$/.test(id)) throw Error('Invalid manual Safari result identity');
const out = path.join(root, 'benchmarks/results', id), fixtureID = `${id}-fixture`;
const fixtureOut = path.join(root, 'benchmarks/results', fixtureID);
// A fresh loopback origin keeps the manual bootstrap's app preferences separate
// from a user's existing tabs on the usual benchmark port.
let base, targetURL;
const checkpoint = path.join(out, 'owned-window-id.txt');
const deadline = Date.now() + 90000;
const controller = new AbortController();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const asString = value => `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\r', ' ').replaceAll('\n', ' ')}"`;
const report = {
  id, started: new Date().toISOString(), status: 'pending',
  sourceBuild: session.candidate, source: 'Own read-only synthetic fixture through production informer/WebSocket/App',
  method: 'Installed Safari Apple Events fallback: a new owned window, programmatic semantic Node-panel flow, then existing benchmarkManual.start/save for a short cadence diagnostic',
  nativeSafariCPU: null,
  nativeSafariCPUScope: 'N/A: Safari browser/GPU processes are shared with user windows; no isolated process CPU ownership or acceptance claim',
  physicalPresentationFPS: null, primaryCPUAcceptance: false,
  existingUserTabsReadOrModified: false, settingsChanged: false,
  window: {}, steps: [], errors: [],
};
let server, serverDone, ownWindowID, createdOutput = false, attemptedCreate = false, serverLog = '';
const scripts = new Set();
const stopScripts = () => { for (const child of scripts) if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); };
const abort = reason => { if (!controller.signal.aborted) controller.abort(Error(reason)); stopScripts(); };
const budget = setTimeout(() => abort('Manual Safari fallback reached its 90s work deadline'), 90000);
const signals = Object.fromEntries(['SIGINT', 'SIGTERM', 'SIGHUP'].map(signal => [signal, () => abort(`Interrupted: ${signal}`)]));
for (const [signal, handler] of Object.entries(signals)) process.on(signal, handler);
const check = () => { if (controller.signal.aborted) throw controller.signal.reason; };
const workSleep = ms => {
  check();
  return new Promise((resolve, reject) => {
    const onAbort = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', onAbort); reject(controller.signal.reason); };
    const timer = setTimeout(() => { controller.signal.removeEventListener('abort', onAbort); resolve(); }, ms);
    controller.signal.addEventListener('abort', onAbort, { once: true });
  });
};
const mark = (step, data = {}) => { report.steps.push({ step, time: new Date().toISOString(), ...data }); console.log(`${step}: ${JSON.stringify(data)}`); };
const live = child => child && child.exitCode === null && child.signalCode === null;

async function appleScript(source, { cleanup = false } = {}) {
  if (!cleanup) check();
  const timeoutMS = cleanup ? 7000 : Math.min(7000, Math.max(1, deadline - Date.now()));
  const child = spawn('/usr/bin/osascript', ['-l', 'AppleScript', '-'], { stdio: ['pipe', 'pipe', 'pipe'] });
  scripts.add(child);
  let stdout = '', stderr = '';
  const append = (current, value) => (current + value).slice(-65536);
  child.stdout.on('data', data => { stdout = append(stdout, data); });
  child.stderr.on('data', data => {
    stderr = append(stderr, data);
    // This marker is emitted only after the new window ID and unique URL have
    // been verified. Node owns the checkpoint write; Safari never writes files.
    const owned = stderr.match(/KV_OWNED_WINDOW_ID=(\d+)/);
    if (attemptedCreate && owned) ownWindowID = Number(owned[1]);
  });
  const timer = setTimeout(() => { if (live(child)) child.kill('SIGTERM'); }, timeoutMS);
  const kill = setTimeout(() => { if (live(child)) child.kill('SIGKILL'); }, timeoutMS + 500);
  const done = new Promise(resolve => {
    child.once('error', error => resolve({ error: error.message }));
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  child.stdin.on('error', () => {});
  child.stdin.end(source);
  const result = await done;
  clearTimeout(timer); clearTimeout(kill); scripts.delete(child);
  if (result.code !== 0) {
    const error = Error(stderr.trim() || result.error || `osascript ended: ${JSON.stringify(result)}`);
    error.appleEvent = { ...result, stdout, stderr };
    throw error;
  }
  return stdout.trim();
}

async function javascript(code) {
  if (!Number.isSafeInteger(ownWindowID)) throw Error('No verified owned Safari window');
  const output = await appleScript(`with timeout of 4 seconds
tell application "Safari"
  set targetWindow to first window whose id is ${ownWindowID}
  set targetTab to current tab of targetWindow
  if (URL of targetTab) is not ${asString(targetURL)} then error "Owned window navigated away; refusing JavaScript in another page"
  return do JavaScript ${asString(code)} in targetTab
end tell
end timeout`);
  return JSON.parse(output);
}

async function poll(code, predicate, seconds = 12) {
  const until = Math.min(deadline, Date.now() + seconds * 1000);
  let last;
  while (Date.now() < until) {
    check(); last = await javascript(code);
    if (predicate(last)) return last;
    await workSleep(300);
  }
  throw Error(`Owned Safari page did not reach the expected state: ${JSON.stringify(last)}`);
}

async function closeOwnedWindow() {
  if (!attemptedCreate) return { status: 'no-window-created-by-this-attempt' };
  if (!ownWindowID) {
    const saved = await readFile(checkpoint, 'utf8').catch(() => '');
    if (/^\d+$/.test(saved.trim())) ownWindowID = Number(saved.trim());
  }
  if (!Number.isSafeInteger(ownWindowID)) return { status: 'no-verified-owned-window' };
  try {
    const result = await appleScript(`with timeout of 4 seconds
tell application "Safari"
  if not (exists (first window whose id is ${ownWindowID})) then return "already-closed"
  set targetWindow to first window whose id is ${ownWindowID}
  if (count of tabs of targetWindow) is not 1 then return "left-open-multiple-tabs-to-protect-user-content"
  if (URL of current tab of targetWindow) is not ${asString(targetURL)} then return "left-open-url-no-longer-owned"
  close targetWindow
  return "closed-owned-window"
end tell
end timeout`, { cleanup: true });
    return { status: result, windowID: ownWindowID };
  } catch (error) { return { status: 'cleanup-unavailable', windowID: ownWindowID, error: error.message, appleEvent: error.appleEvent }; }
}

try {
  await mkdir(out, { recursive: false }); createdOutput = true;
  await access(path.join(root, 'benchmarks/.build', session.candidate, 'index.html'));
  await access(path.join(root, 'benchmarks/.build', session.backend, 'backend.test'));
  const provenance = JSON.parse(await readFile(path.join(root, 'benchmarks/.build', `${session.candidate}.json`), 'utf8'));
  report.sourceSHA256 = provenance.sourceSHA256;
  if (report.sourceSHA256 !== '83f7558dab979a0cf32458fb7f9f91049d78b853a68539124abce257badc5e57') throw Error('This fallback is scoped to frozen production v5; the session candidate changed');
  report.lockSHA256 = provenance.files['package-lock.json'];
  report.safari = {
    app: '/Applications/Safari.app',
    version: execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleShortVersionString', '/Applications/Safari.app/Contents/Info.plist'], { encoding: 'utf8' }).trim(),
    build: execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleVersion', '/Applications/Safari.app/Contents/Info.plist'], { encoding: 'utf8' }).trim(),
    dictionary: '/Applications/Safari.app/Contents/Resources/Safari.sdef',
    dictionarySHA256: createHash('sha256').update(await readFile('/Applications/Safari.app/Contents/Resources/Safari.sdef')).digest('hex'),
  };
  report.os = execFileSync('/usr/bin/sw_vers', [], { encoding: 'utf8' }).trim();
  report.power = execFileSync('/usr/bin/pmset', ['-g', 'batt'], { encoding: 'utf8' }).trim();
  const port = await new Promise((resolve, reject) => {
    const socket = createServer(); socket.once('error', reject);
    socket.listen(0, '127.0.0.1', () => {
      const address = socket.address();
      socket.close(error => error ? reject(error) : resolve(address.port));
    });
  });
  base = `http://127.0.0.1:${port}`;
  targetURL = `${base}/__benchmark/manual?kv-manual=${encodeURIComponent(id)}`;
  check();
  const argv = ['benchmarks/serve.mjs', '--phase', 'optimized', '--build-tag', session.candidate, '--backend-tag', session.backend, '--reuse-build', '--reuse-binary', '--profile', 'M', '--port', String(port), '--id', fixtureID];
  server = spawn(process.execPath, argv, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  serverDone = new Promise(resolve => { server.once('error', error => resolve({ error: error.message })); server.once('close', (code, signal) => resolve({ code, signal })); });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { serverLog = (serverLog + data).slice(-131072); process.stdout.write(data); });
  const readyBy = Math.min(deadline, Date.now() + 10000);
  while (!serverLog.includes(`BENCHMARK FIXTURE ready ${base}`)) {
    check(); if (!live(server) || Date.now() > readyBy) throw Error('Owned frozen fixture did not announce readiness; no other server is reused');
    await workSleep(100);
  }
  mark('owned-fixture-ready', { serverPID: server.pid, fixtureID, targetURL });
  attemptedCreate = true;
  const created = await appleScript(`with timeout of 4 seconds
tell application "Safari"
  set previousWindowIDs to id of every window
  set createdDocument to make new document with properties {URL:${asString(targetURL)}}
  set createdWindow to front window
  set createdID to id of createdWindow
  if previousWindowIDs contains createdID then
    if (URL of createdDocument) is ${asString(targetURL)} then close createdDocument saving no
    error "Safari did not create an isolated new window; only the newly created local document was closed"
  end if
  if (URL of current tab of createdWindow) is not ${asString(targetURL)} then error "New front window is not the owned benchmark URL; refusing to target it"
  log ("KV_OWNED_WINDOW_ID=" & (createdID as text))
  return createdID
end tell
end timeout`);
  if (!/^\d+$/.test(created)) throw Error(`Safari did not return an owned window ID: ${created}`);
  ownWindowID = Number(created);
  await writeFile(checkpoint, String(ownWindowID), { flag: 'wx' });
  report.window = { id: ownWindowID, createdNew: true, targetURL };
  mark('owned-new-window', report.window);
  const readinessCode = `JSON.stringify((()=>{const c=document.querySelector('canvas'),p=globalThis.__KUBEVIEW_BENCHMARK__,h=c?.__harbor;const s=h?.stats();return {ready:!!(globalThis.benchmarkManual&&p?.gl&&s?.lifecycle?.canonicalPods===300&&s?.lifecycle?.canonicalNodes===20),url:location.href,userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},deviceDPR:devicePixelRatio,rendererDPR:p?.gl?.getPixelRatio(),framebuffer:c?{width:c.width,height:c.height}:null,stats:s,snapshots:p?.snapshots,contextLost:p?.gl?.getContext().isContextLost()};})())`;
  report.page = await poll(readinessCode, value => value.ready, 15);
  if (report.page.contextLost) throw Error('Owned native Safari WebGL context is lost');
  mark('native-app-ready', { viewport: report.page.viewport, deviceDPR: report.page.deviceDPR, rendererDPR: report.page.rendererDPR });
  const opened = await javascript(`JSON.stringify((()=>{const c=document.querySelector('canvas');c.dataset.safariManual=${JSON.stringify(id)};const node=Object.values(__KUBEVIEW_BENCHMARK__.resources).find(r=>r.kind==='Node'&&r.metadata.uid==='node-0');if(!node)throw Error('Expected real fixtureNodeUIDmissing');globalThis.__KV_SAFARI_NODE__={uid:node.metadata.uid,name:node.metadata.name};const b=document.querySelector('button[aria-label="Bul"]');if(!b)throw Error('Semanticfinderbuttonmissing');b.click();return {node:globalThis.__KV_SAFARI_NODE__,mode:'ProgrammaticDOMactions throughAppleEvents,notphysicalmouse/keyboardor3Draycast'};})())`);
  await poll(`JSON.stringify({ready:!!document.querySelector('.world-window input')})`, value => value.ready, 5);
  await javascript(`JSON.stringify((()=>{const i=document.querySelector('.world-window input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,__KV_SAFARI_NODE__.name);i.dispatchEvent(new Event('input',{bubbles:true}));return {requested:__KV_SAFARI_NODE__.name};})())`);
  await poll(`JSON.stringify((()=>{const b=[...document.querySelectorAll('.finder-result')].find(b=>b.querySelector('strong')?.textContent.trim()===__KV_SAFARI_NODE__.name&&b.querySelector('small')?.textContent.includes('Node'));if(b)b.click();return {ready:!!b};})())`, value => value.ready, 5);
  await poll(`JSON.stringify({ready:document.querySelector('.resource-details h2')?.textContent.trim()===__KV_SAFARI_NODE__.name})`, value => value.ready, 5);
  await javascript(`JSON.stringify((()=>{const b=document.querySelector('button[aria-label="Ayrıntı panelini kapat"]');if(!b)throw Error('Nodeclosebuttonmissing');b.click();return {closedRequested:true};})())`);
  await poll(`JSON.stringify({ready:!document.querySelector('.resource-details'),sameCanvas:document.querySelector('canvas')?.dataset.safariManual===${JSON.stringify(id)}})`, value => value.ready && value.sameCanvas, 5);
  report.functional = { ...opened, nodePanelOpened: true, nodePanelClosed: true, sameCanvas: true, canonicalSnapshotReady: true };
  mark('native-functional-flow', report.functional);
  await workSleep(5000); check();
  await javascript(`JSON.stringify((()=>{benchmarkManual.start();return {started:true,viewport:{width:innerWidth,height:innerHeight}};})())`);
  const sampledAt = Date.now(); await workSleep(15000); check();
  await javascript(`JSON.stringify((()=>{globalThis.__KV_SAFARI_SAVE__={status:'pending'};benchmarkManual.save().then(result=>{globalThis.__KV_SAFARI_SAVE__={status:'saved',result};}).catch(error=>{globalThis.__KV_SAFARI_SAVE__={status:'failed',error:String(error)};});return {requested:true};})())`);
  const saved = await poll(`JSON.stringify(globalThis.__KV_SAFARI_SAVE__)`, value => value.status !== 'pending', 5);
  if (saved.status !== 'saved' || !/^manual-[\dT.]+\.json$/.test(saved.result?.saved || '')) throw Error(`Existing manual save did not complete: ${JSON.stringify(saved)}`);
  const artifact = path.join(fixtureOut, saved.result.saved), actual = JSON.parse(await readFile(artifact, 'utf8'));
  if (actual.raw?.errors?.length) throw Error(`Native Safari page errors: ${JSON.stringify(actual.raw.errors)}`);
  report.cadenceDiagnostic = { warmupSeconds: 5, requestedSampleSeconds: 15, harnessElapsedMs: Date.now() - sampledAt, artifact: path.relative(root, artifact), sourceBuild: session.candidate, viewport: actual.viewport, deviceDPR: actual.dpr, rendererDPR: actual.rendererPixelRatio, framebuffer: actual.buffer, renderer: actual.renderer, userAgent: actual.userAgent, summary: summarize(actual.raw), acceptance: false, scope: 'One short nativeSafariJSdrawcadence diagnostic aftersemanticNodeflow. NotCPU/performanceacceptance,notphysicalpresentation,notpairedDPRcomparison.' };
  report.status = 'passed';
} catch (error) {
  report.errors.push({ message: error.message, appleEvent: error.appleEvent });
  const unavailable = Boolean(error.appleEvent && /Allow JavaScript from Apple Events|JavaScript.*(?:Apple Events|disabled|not allowed)|not authorized|not authorised|not permitted|timed out|-1743|-1712|isolated new window/i.test(error.message)) || error.code === 'EADDRINUSE';
  report.status = unavailable ? 'unavailable' : 'failed';
  report.blockingReason = error.message;
  if (!unavailable) process.exitCode = 1;
} finally {
  clearTimeout(budget);
  report.windowCleanup = await closeOwnedWindow();
  if (server && live(server)) {
    server.kill('SIGTERM');
    await Promise.race([serverDone, sleep(3000)]);
    if (live(server)) { server.kill('SIGKILL'); await Promise.race([serverDone, sleep(500)]); }
  }
  report.ownedServerParentStopped = !live(server);
  report.cleanupScope = 'Only spawned osascript/serve PIDs and verifiedownwindow ID+uniqueURL. Outerworker birth/ancestry supervisor owns descendant cleanup; Safari application/shareduserprocesses are never killed.';
  report.finished = new Date().toISOString();
  report.durationMs = Date.now() - Date.parse(report.started);
  for (const [signal, handler] of Object.entries(signals)) process.removeListener(signal, handler);
  if (createdOutput) {
    await writeFile(path.join(out, 'fixture-output.txt'), serverLog, { flag: 'wx' });
    await writeFile(path.join(out, 'result.json'), JSON.stringify(report, null, 2), { flag: 'wx' });
  }
  console.log(JSON.stringify({ id, status: report.status, blockingReason: report.blockingReason, viewport: report.page?.viewport || null, windowCleanup: report.windowCleanup, nativeSafariCPU: 'N/A', durationMs: report.durationMs }));
}
