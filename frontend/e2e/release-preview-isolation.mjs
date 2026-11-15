import { chromium, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.resolve(process.argv[2] || path.join(root, 'artifacts/release-audit/ra-20261111/preview-browser-worker/attempt-01'));
if (existsSync(out)) throw Error('Immutable browser attempt directory already exists');
mkdirSync(path.dirname(out), { recursive: true }); mkdirSync(out);
const base = 'http://127.0.0.1:19849';
const report = { source: 'TEST ONLY synthetic Go backend/net.Pipe + real browser; no Kubernetes/SPDY', startedAt: new Date().toISOString(), browsers: [], fixtureLines: [], outboundExfiltration: false };
const scrub = value => String(value).replace(/connectionID["'=:\s]+[^&\s"'<>]+/g, 'connectionID=[REDACTED]').replace(/http:\/\/127\.0\.0\.1:19849[^\s"']*/g, '[owned-fixture-url]');
let fixture, activeBrowser, fixtureExited = false, fixtureExitCode, readyResolve, readyReject;
const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const portReleased = () => new Promise(resolve => {
  const probe = createServer();
  probe.once('error', () => resolve(false));
  probe.listen({ host: '127.0.0.1', port: 19849, exclusive: true }, () => probe.close(() => resolve(true)));
});

async function runBrowser(name, type) {
  const started = Date.now();
  const result = { engine: name, startedAt: new Date().toISOString(), status: 'RUNNING', checks: [], statuses: [], requestCount: 0, externalRequestsBlocked: 0 };
  report.browsers.push(result);
  let timer;
  try {
    activeBrowser = await type.launch({ headless: true, timeout: 10000, ...(name === 'chromium' ? { args: ['--disable-background-networking', '--disable-component-update', '--disable-sync'] } : {}) });
    result.version = activeBrowser.version();
    timer = setTimeout(() => { result.timedOut = true; activeBrowser?.close().catch(() => {}); }, Math.max(1, 58000 - (Date.now() - started)));
    const context = await activeBrowser.newContext();
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) { result.externalRequestsBlocked++; return route.abort(); }
      if (++result.requestCount > 30) { result.requestBudgetExceeded = true; return route.abort(); }
      return route.continue();
    });
    context.on('response', response => {
      const request = response.request(), url = new URL(response.url());
      const headers = response.headers();
      result.statuses.push({ path: url.pathname, method: request.method(), status: response.status(), origin: request.headers().origin || null, authorizationHeaderPresent: Boolean(request.headers().authorization), ...(url.pathname.startsWith('/api/portforward/synthetic/') ? { csp: headers['content-security-policy'], setCookiePresent: Boolean(headers['set-cookie']), corsOriginPresent: Boolean(headers['access-control-allow-origin']), corsCredentialPresent: Boolean(headers['access-control-allow-credentials']), referrerPolicy: headers['referrer-policy'] } : {}) });
    });
    const controller = await context.newPage();
    await controller.goto(base + '/__test/control', { waitUntil: 'domcontentloaded', timeout: 8000 });
    const stats = () => controller.evaluate(async () => (await fetch('/__test/stats')).json());
    let before = await stats();
    const open = async id => {
      const opened = context.waitForEvent('page', { timeout: 8000 });
      await controller.locator('#' + id).click();
      const page = await opened;
      await page.waitForURL(url => url.pathname.startsWith('/api/portforward/synthetic/'), { waitUntil: 'domcontentloaded', timeout: 8000 });
      return page;
    };
    for (const id of ['normal', 'positive']) {
      const page = await open(id);
      await page.waitForFunction(() => Boolean(window.__previewEvidence), { timeout: 8000 });
      const evidence = await page.evaluate(() => window.__previewEvidence);
      assert.equal(evidence.jsRan, true); assert.equal(evidence.opaqueOrigin, true);
      assert.equal(evidence.cookieDenied, true); assert.equal(evidence.storageDenied, true); assert.equal(evidence.openerAbsent, true);
      assert.equal(evidence.attempts.length, 3); assert(evidence.attempts.every(attempt => attempt.fetchResolved === false));
      const after = await stats(), denied = after.deniedRequests.slice(before.deniedRequests.length);
      assert(denied.some(request => request.path === '/api/connection' && request.method === 'GET'));
      assert(denied.some(request => request.path === '/api/management' && request.method === 'POST'));
      assert(denied.every(request => request.origin === 'null' && request.status === 403 && request.knownNonce));
      assert.equal(after.upstreamCredentialsStripped, true);
      const cookies = await context.cookies(base);
      assert(cookies.some(cookie => cookie.name === 'kubeview_session' && cookie.httpOnly));
      assert.equal(cookies.some(cookie => cookie.name === 'synthetic-preview-takeover'), false);
      const mainResponses = result.statuses.filter(item => item.path.startsWith('/api/portforward/synthetic/') && item.method === 'GET');
      assert(mainResponses.some(item => item.status === 200 && !item.authorizationHeaderPresent));
      // A redirect does not instantiate the preview document. WebKit may omit
      // CSP from redirect response metadata; verify the applied document policy
      // separately while preserving the observed redirect headers in evidence.
      assert(mainResponses.filter(item => item.status === 200).every(item => item.csp === 'sandbox allow-scripts allow-forms'));
      assert(mainResponses.every(item => !item.setCookiePresent && !item.corsOriginPresent && !item.corsCredentialPresent && item.referrerPolicy === 'no-referrer'));
      result.checks.push({ name: id === 'normal' ? 'cookie-only-normal-preview-opaque-isolation' : 'known-positive-relative-redirect', pass: true, evidence, deniedRequestCount: denied.length, deniedRequests: denied, finalPath: new URL(page.url()).pathname, upstreamCredentialsStripped: after.upstreamCredentialsStripped, takeoverCookieAbsent: true });
      before = after;
      await page.close();
    }
    const deniedBeforeRedirect = before.deniedRequests.length;
    const negative = await open('negative');
    await negative.waitForURL(url => url.pathname === '/api/portforward/synthetic/api/management', { waitUntil: 'domcontentloaded', timeout: 8000 });
    const afterNegative = await stats();
    assert.equal(afterNegative.deniedRequests.length, deniedBeforeRedirect);
    assert(result.statuses.some(item => item.path === '/api/portforward/synthetic/api/management' && item.status === 404));
    result.checks.push({ name: 'root-relative-api-redirect-stays-in-preview-prefix', pass: true, finalPath: new URL(negative.url()).pathname, finalStatus: 404, extraManagementRequests: 0 });
    await negative.close();
    assert.equal(result.externalRequestsBlocked, 0); assert.equal(Boolean(result.requestBudgetExceeded), false);
    result.status = 'PASS';
  } catch (error) {
    result.status = name === 'webkit' && /Executable doesn't exist|browserType.launch.*not found/i.test(error.message) ? 'UNAVAILABLE' : 'FAIL';
    result.error = { name: error.name, message: scrub(error.message) };
  } finally {
    clearTimeout(timer);
    await activeBrowser?.close().catch(() => {}); activeBrowser = undefined;
    result.finishedAt = new Date().toISOString();
    writeFileSync(path.join(out, name + '.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  }
}

try {
  fixture = spawn('go', ['test', '-p', '1', '-parallel', '1', '-timeout', '150s', '-count=1', '-v', './pkg/server', '-run', '^TestReleasePreviewBrowserFixture$'], {
    cwd: path.join(root, 'backend'), detached: process.platform !== 'win32', env: { ...process.env, GOMAXPROCS: '1', KUBEVIEW_RELEASE_PREVIEW_BROWSER: '1', KUBECONFIG: path.join(out, 'absent-kubeconfig'), KV_HUBBLE_ENABLED: 'false', KV_MINIKUBE_ENABLED: 'false', API_TOKEN: '', KUBE_CONTEXT: '', WATCH_NAMESPACE: '', KUBEVIEW_REPLAY_PROFILE: '' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let buffered = '';
  const output = data => {
    buffered += data.toString();
    for (;;) {
      const next = buffered.indexOf('\n'); if (next < 0) break;
      const line = buffered.slice(0, next); buffered = buffered.slice(next + 1);
      if (/^(?:=== RUN|--- (?:PASS|FAIL|SKIP)|PASS$|FAIL$|ok\s|FAIL\s|TEST-ONLY)/.test(line)) report.fixtureLines.push(scrub(line));
      if (line.includes('TEST-ONLY synthetic preview fixture ready')) readyResolve();
    }
  };
  fixture.stdout.on('data', output); fixture.stderr.on('data', output);
  fixture.on('error', readyReject);
  fixture.on('exit', code => { fixtureExited = true; fixtureExitCode = code; readyReject(Error('Synthetic fixture exited before ready')); });
  await Promise.race([ready, delay(15000).then(() => { throw Error('Synthetic fixture readiness deadline'); })]);
  await runBrowser('chromium', chromium);
  if (!fixtureExited) await runBrowser('webkit', webkit);
} catch (error) {
  report.fixtureError = { name: error.name, message: scrub(error.message) };
} finally {
  await activeBrowser?.close().catch(() => {});
  if (fixture && !fixtureExited) {
    await fetch(base + '/__test/stop', { method: 'POST', headers: { Origin: base }, signal: AbortSignal.timeout(2000) }).catch(() => {});
    await Promise.race([new Promise(resolve => fixture.once('exit', resolve)), delay(3000)]);
  }
  if (fixture && !fixtureExited) {
    try { process.kill(process.platform === 'win32' ? fixture.pid : -fixture.pid, 'SIGTERM'); } catch {}
    await Promise.race([new Promise(resolve => fixture.once('exit', resolve)), delay(2000)]);
  }
  if (fixture && !fixtureExited) {
    try { process.kill(process.platform === 'win32' ? fixture.pid : -fixture.pid, 'SIGKILL'); } catch {}
    await Promise.race([new Promise(resolve => fixture.once('exit', resolve)), delay(1000)]);
  }
  report.fixtureExited = fixtureExited; report.fixtureExitCode = fixtureExitCode;
  report.listenerReleased = await portReleased();
  report.finishedAt = new Date().toISOString();
  report.status = !report.fixtureError && report.browsers[0]?.status === 'PASS' && report.browsers.every(browser => ['PASS', 'UNAVAILABLE'].includes(browser.status)) && fixtureExited && fixtureExitCode === 0 && report.listenerReleased ? 'PASS' : 'FAIL';
  writeFileSync(path.join(out, 'result.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ artifactDirectory: out, status: report.status, browsers: report.browsers.map(browser => ({ engine: browser.engine, status: browser.status, requests: browser.requestCount })), fixtureExited, fixtureExitCode }));
  if (report.status !== 'PASS') process.exitCode = 1;
}
