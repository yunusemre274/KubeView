// One bounded normal-UI regression on an explicitly synthetic embedded M5 app.
import { chromium, expect } from '@playwright/test';
import { findResource, closePanels } from './v11-ui.helpers.js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(new URL('../..', import.meta.url).pathname), target = new URL(process.env.KV_REPLAY_URL || 'http://127.0.0.1:19807');
assert.ok(['127.0.0.1', 'localhost'].includes(target.hostname) && !target.username && !target.password);
const id = process.env.KV_EVIDENCE_ID || `workspace-closed-panel-${Date.now()}`; assert.match(id, /^[\w.-]+$/);
const out = path.join(root, 'artifacts/workspace', id); await mkdir(out, { recursive: false });
const hash = (value) => createHash('sha256').update(value).digest('hex');
const expectedIndex = process.env.KV_EXPECTED_INDEX || hash(await readFile(path.join(root, 'frontend/dist/index.html')));
const result = { id, startedAt: new Date().toISOString(), status: 'running', expectedIndex, checks: [], errors: [], logRequests: [], prohibitedWrites: [], limits: ['Synthetic TEST/REPLAY functional check; not real Kubernetes or performance.', 'No mock/state injection, raw log, Secret, nonce or HTTP header is recorded.'] };
const browser = await chromium.launch({ headless: false, ...(process.platform === 'darwin' ? { args: ['--use-angle=metal'] } : {}) }), context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), page = await context.newPage();
page.setDefaultTimeout(5000); const pods = new Map(), logs = new Map();
const timer = setTimeout(() => browser.close().catch(() => {}), 55000);
page.on('pageerror', (error) => result.errors.push(error.message.slice(0, 200)));
page.on('websocket', (socket) => socket.on('framereceived', ({ payload }) => { try { const message = JSON.parse(String(payload)); if (message.type !== 'SNAPSHOT') return; for (const item of Array.isArray(message.resources) ? message.resources : Object.values(message.resources || {})) if (item.kind === 'Pod') pods.set(item.metadata.uid, { uid: item.metadata.uid, name: item.metadata.name, namespace: item.metadata.namespace }); } catch {} }));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.pathname === '/api/logs') { const item = { uid: url.searchParams.get('uid'), container: url.searchParams.get('container'), harborId: url.searchParams.get('harborId'), ended: false }; logs.set(request, item); result.logRequests.push(item); }
  if (['/api/resources', '/api/actions', '/api/replay/scenario'].includes(url.pathname) && !['GET', 'HEAD'].includes(request.method())) result.prohibitedWrites.push({ path: url.pathname, method: request.method() });
});
for (const event of ['requestfinished', 'requestfailed']) page.on(event, (request) => { const item = logs.get(request); if (item) item.ended = true; });
const check = (name, detail) => result.checks.push({ name, detail });
async function json(route) { const response = await page.request.get(`${target.origin}${route}`, { timeout: 5000 }); assert.equal(response.status(), 200); return response.json(); }
async function status() { const state = await json('/api/replay/status'); assert.equal(state.profile, 'M'); return { opened: state.logOpened, closed: state.logClosed, active: state.logOpened - state.logClosed }; }
async function until(read, accept) { const deadline = Date.now() + 5000; do { const value = await read(); if (accept(value)) return value; await page.waitForTimeout(100); } while (Date.now() < deadline); throw Error('Bounded log observation failed'); }
async function capture(name) { await page.screenshot({ path: path.join(out, `${name}.png`), mask: [page.getByLabel('Container log çıktısı', { exact: true })] }); }
async function ready() { await page.waitForFunction(() => { const counts = document.querySelector('canvas')?.__harbor?.stats?.()?.lifecycle; return counts?.canonicalNodes === 20 && counts.canonicalPods === 300 && counts.visibleNodes === 8 && counts.visiblePods === 120; }); await expect(page.locator('.world-replay-badge')).toContainText('TEST/REPLAY'); assert.equal(await page.locator('canvas').count(), 1); }
async function choose(harbor) { await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click(); await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click(); await page.locator('.workspace-window').waitFor({ state: 'detached' }); await expect(page.locator('.world-cluster-name')).toContainText(harbor.name); await ready(); }
try {
  const navigation = await page.goto(target.origin); assert.equal(navigation.status(), 200); assert.equal(hash(await navigation.body()), expectedIndex, 'Probe must serve the changed frozen frontend index'); await ready();
  const source = await json('/api/contexts'); assert.equal(source.dataSource, 'test-replay'); assert.equal(source.serverReadOnly, true);
  const workspace = await json('/api/workspace'); assert.equal(workspace.harbors.length, 5);
  const brand = await page.locator('.world-cluster-name').innerText(), a = workspace.harbors.find((item) => brand.startsWith(`${item.name} ·`)), b = workspace.harbors.find((item) => item.id !== a?.id); assert.ok(a && b);
  await closePanels(page); const before = await until(status, (value) => value.active === 0);
  const pod = [...pods.values()].sort((left, right) => left.name.localeCompare(right.name))[0]; assert.ok(pod);
  const details = await findResource(page, 'Pod', pod.name, pod.uid); await details.locator('.details-tabs').getByRole('button', { name: 'Loglar', exact: true }).click();
  const opened = await until(status, (value) => value.opened === before.opened + 1 && value.active === 1); await page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click();
  const closed = await until(status, (value) => value.opened === opened.opened && value.active === 0); check('normal-log-open-then-explicit-close', { pod, before, opened, closed });
  const canvas = await page.locator('canvas').elementHandle(); await choose(b);
  const saved = (await json('/api/workspace')).harbors.find((item) => item.id === a.id); assert.equal(saved.view.selection.uid, pod.uid); assert.equal(saved.view.tab, 'logs');
  await choose(a); await page.waitForTimeout(350); await expect(page.locator('.resource-details')).toHaveCount(0);
  const returned = await status(); assert.deepEqual(returned, closed); assert.equal(await page.evaluate((original) => original === document.querySelector('canvas'), canvas), true);
  check('closed-panel-A-B-A-keeps-selection-without-new-log-stream', { uid: pod.uid, tab: saved.view.tab, returned, canvasPreserved: true }); await capture('01-returned-A-panel-still-closed');
  const explicit = await findResource(page, 'Pod', pod.name, pod.uid); await explicit.locator('.details-tabs').getByRole('button', { name: 'Loglar', exact: true }).click();
  const reopened = await until(status, (value) => value.opened === returned.opened + 1 && value.active === 1); await capture('02-explicit-reopen-only-one-log');
  await page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click(); const final = await until(status, (value) => value.opened === reopened.opened && value.active === 0);
  check('new-explicit-inspect-opens-exactly-one-stream-and-closes', { uid: pod.uid, reopened, final });
  assert.equal(result.prohibitedWrites.length, 0); assert.equal(result.errors.length, 0); result.status = 'passed';
} catch (error) { result.status = 'failed'; result.failure = String(error.message).slice(0, 800); await capture('failure').catch(() => {}); process.exitCode = 1; }
finally { clearTimeout(timer); await context.close().catch(() => {}); await browser.close().catch(() => {}); result.finishedAt = new Date().toISOString(); await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ id, status: result.status, checks: result.checks.length, failure: result.failure, prohibitedWrites: result.prohibitedWrites.length })); }
