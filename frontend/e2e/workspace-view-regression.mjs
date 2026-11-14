// Bounded normal DOM regression. Replay data is explicitly synthetic; this is
// not actual-cluster, performance or physical presented-latency evidence.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const replay = new URL(process.env.KV_REPLAY_URL || 'http://127.0.0.1:19807');
const empty = new URL(process.env.KV_EMPTY_URL || 'http://127.0.0.1:19801');
for (const url of [replay, empty]) assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) && !url.username && !url.password, 'Explicit loopback target required');
const id = process.env.KV_EVIDENCE_ID || `workspace-view-${new Date().toISOString().replace(/[:.]/g, '-')}`;
assert.match(id, /^[\w.-]+$/);
const out = path.join(root, 'artifacts/workspace', id);
await mkdir(out, { recursive: false });
async function manifest(directory) {
  const walk = async (base) => (await Promise.all((await readdir(base, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? walk(path.join(base, entry.name)) : entry.isFile() ? [path.join(base, entry.name)] : []))).flat();
  const files = (await walk(path.join(root, directory))).sort();
  const rows = await Promise.all(files.map(async (file) => `${createHash('sha256').update(await readFile(file)).digest('hex')}  ${path.relative(root, file)}`));
  return createHash('sha256').update(rows.join('\n')).digest('hex');
}
const result = { id, startedAt: new Date().toISOString(), status: 'running', checks: [], errors: [],
  limits: ['Normal UI and real embedded replay HTTP/WS only; no response mock or product state injection.', 'TEST/REPLAY fixtures are synthetic, not actual Kubernetes or Hubble evidence.', 'No raw logs, headers, nonce, Secret values or traces saved.', 'Caret/camera observations are not physical presented latency.'],
  sourceBefore: await manifest('frontend/src'), distBefore: await manifest('frontend/dist') };
const browser = await chromium.launch({ headless: false, ...(process.platform === 'darwin' ? { args: ['--use-angle=metal'] } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage(); page.setDefaultTimeout(8000); page.setDefaultNavigationTimeout(15000);
const logRequests = new Map(), sockets = new Set(); let timer, timedOut = false;
const check = (name, detail) => result.checks.push({ name, at: new Date().toISOString(), detail });
page.on('pageerror', (error) => result.errors.push(error.message.replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 240)));
page.on('websocket', (socket) => { const record = { closed: false }; sockets.add(record); socket.on('close', () => { record.closed = true; }); });
page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.pathname !== '/api/logs') return;
  const headers = request.headers();
  logRequests.set(request, { uid: url.searchParams.get('uid'), container: url.searchParams.get('container'), namespace: url.searchParams.get('namespace'),
    scopePresent: ['workspaceId', 'harborId', 'tabId'].every((key) => Boolean(url.searchParams.get(key))),
    noncePresent: Boolean(url.searchParams.get('connectionID') || headers['x-kubeview-connection']), status: null, phase: 'pending' });
});
page.on('response', (response) => { const record = logRequests.get(response.request()); if (record) record.status = response.status(); });
page.on('requestfinished', (request) => { const record = logRequests.get(request); if (record) record.phase = 'finished'; });
page.on('requestfailed', (request) => { const record = logRequests.get(request); if (record) record.phase = 'aborted-or-failed'; });
const poll = async (read, accept, milliseconds = 8000) => {
  const deadline = Date.now() + milliseconds; let value;
  do { value = await read(); if (accept(value)) return value; await page.waitForTimeout(100); } while (Date.now() < deadline);
  throw new Error('Bounded observation did not reach its required condition');
};
async function document() { const response = await page.request.get(`${replay.origin}/api/workspace`); assert.equal(response.ok(), true, 'Workspace GET failed'); return response.json(); }
const safeView = (harbor) => ({ harborId: harbor?.id, revision: harbor?.revision, selection: harbor?.view?.selection ? { uid: harbor.view.selection.uid, kind: harbor.view.selection.kind, namespace: harbor.view.selection.namespace, containerName: harbor.view.selection.containerName } : null, tab: harbor?.view?.tab || null });
async function replayStats() { const response = await page.request.get(`${replay.origin}/api/replay/status`); assert.equal(response.ok(), true); const data = await response.json(); return { dataSource: data.dataSource, profile: data.profile, logOpened: data.logOpened, logClosed: data.logClosed }; }
async function capture(name) { await page.screenshot({ path: path.join(out, `${name}.png`), mask: [page.getByLabel('Container log çıktısı', { exact: true })] }); }
async function pose() {
  return page.locator('canvas').evaluate((canvas) => {
    const harbor = canvas.__harbor; let state = harbor.scene.__r3f?.root?.getState?.();
    if (!state) harbor.scene.traverse((object) => { state ||= object.__r3f?.root?.getState?.(); });
    return { camera: harbor.camera.position.toArray(), quaternion: harbor.camera.quaternion.toArray(), target: state?.controls?.target?.toArray() || null,
      stats: harbor.stats(), source: harbor.visualLifecycleState?.()?.source };
  });
}
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
async function ready() {
  await page.waitForFunction(() => { const stats = document.querySelector('canvas')?.__harbor?.stats?.(); return stats?.lifecycle?.canonicalNodes === 20 && stats.lifecycle.canonicalPods === 300 && /Canlı/.test(document.querySelector('.world-brand-control')?.textContent || ''); }, null, { timeout: 20000 });
  assert.equal(await page.locator('canvas').count(), 1);
  await page.locator('.world-replay-badge').waitFor({ state: 'visible' });
}
async function switchTo(harbor) {
  await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await page.locator('.workspace-window').waitFor({ state: 'detached' }); await ready();
}
try {
  timer = setTimeout(() => { timedOut = true; browser.close().catch(() => {}); }, 85000);
  await page.goto(empty.origin);
  await page.getByRole('button', { name: 'İlk limanını bağla', exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats?.());
  assert.equal(await page.getByText('Son bilinen görünüm · veri güncel değil', { exact: true }).count(), 0);
  assert.equal(await page.locator('canvas').count(), 1);
  check('empty-onboarding-has-no-last-known-stale-claim', { canvasCount: 1, sockets: sockets.size }); await capture('00-empty-onboarding');
  await page.goto(replay.origin); await ready();
  const originalCanvas = await page.locator('canvas').elementHandle();
  const initial = await document(), brand = await page.locator('.world-cluster-name').innerText();
  const active = initial.harbors.find((harbor) => brand.startsWith(`${harbor.name} ·`));
  assert.ok(active, 'Actual active harbor could not be identified');
  const other = initial.harbors.find((harbor) => harbor.id !== active.id); assert.ok(other, 'Two registered replay harbors required');
  result.replayBefore = await replayStats();
  await page.getByRole('button', { name: 'Bul', exact: true }).click();
  const finder = page.getByRole('dialog', { name: 'Dünyada bul', exact: true });
  await finder.getByRole('combobox', { name: 'Bulucu kaynak türü', exact: true }).selectOption('Pod');
  await finder.getByRole('textbox', { name: 'Nesne veya kaynak ara', exact: true }).fill('');
  const first = finder.locator('.finder-result').first(), name = await first.locator('strong').innerText(); await first.click();
  const details = page.getByRole('complementary', { name: `${name} kaynak ayrıntıları`, exact: true }); await details.waitFor();
  const tabs = details.getByRole('navigation', { name: 'Kaynak ayrıntı sekmeleri', exact: true });
  await tabs.getByRole('button', { name: 'Özet', exact: true }).click();
  const uid = await details.locator('.detail-row').filter({ has: page.locator('dt', { hasText: /^UID$/ }) }).locator('dd code').innerText();
  await tabs.getByRole('button', { name: 'Container’lar', exact: true }).click();
  const containerButton = details.locator('.container-select-name').first(), containerName = await containerButton.locator('strong').innerText();
  await containerButton.click(); await tabs.getByRole('button', { name: 'Loglar', exact: true }).click();
  await poll(async () => [...logRequests.values()], (records) => records.some((record) => record.uid === uid && record.container === containerName && record.status === 200));
  const filter = details.getByRole('textbox', { name: 'Loglarda ara ve filtrele', exact: true });
  await filter.fill('unsubmitted-view-filter'); await filter.focus();
  await page.waitForTimeout(650); const before = await pose();
  // fill() leaves the native caret at the end. Home differs on macOS; exercise
  // two ordinary left movements from that known position instead.
  await filter.press('ArrowLeft'); await filter.press('ArrowLeft'); await page.waitForTimeout(100);
  const after = await pose(), caret = await filter.evaluate((input) => ({ start: input.selectionStart, end: input.selectionEnd, text: input.value }));
  assert.equal(caret.text, 'unsubmitted-view-filter'); assert.equal(caret.start, caret.text.length - 2); assert.equal(caret.end, caret.start);
  assert.ok(before.target && after.target, 'OrbitControls target read unavailable');
  const motion = { cameraDistance: distance(before.camera, after.camera), targetDistance: distance(before.target, after.target), quaternionDistance: distance(before.quaternion, after.quaternion) };
  assert.ok(Object.values(motion).every((value) => value < 1e-7), 'Focused log input arrows moved the world camera');
  check('normal-log-filter-native-caret-and-stable-world', { uid, containerName, caret: caret.start, ...motion, canvasCount: 1 }); await capture('01-selected-container-log-filter');
  result.target = { harborId: active.id, name, uid, containerName, tab: 'logs' };
  await switchTo(other);
  assert.equal(await page.evaluate((canvas) => canvas === document.querySelector('canvas'), originalCanvas), true, 'Switch remounted Canvas');
  let observed;
  try { await poll(async () => { const current = await document(); observed = safeView(current.harbors.find((harbor) => harbor.id === active.id)); return observed; }, (view) => view.selection?.uid === uid && view.selection?.containerName === containerName && view.tab === 'logs', 5000); }
  catch { result.persistedViewObserved = observed; throw new Error('Normal UI did not persist the exact UID/container/logs tab through workspace GET'); }
  result.persistedViewObserved = observed; check('workspace-get-confirms-ui-persisted-view', observed);
  await switchTo(active); const requestBoundary = logRequests.size;
  await page.reload(); await ready();
  await details.waitFor({ state: 'visible' });
  assert.equal(await tabs.getByRole('button', { name: 'Loglar', exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(await details.getByRole('combobox', { name: 'Container', exact: true }).inputValue(), containerName);
  await poll(async () => [...logRequests.values()].slice(requestBoundary), (records) => records.some((record) => record.uid === uid && record.container === containerName && record.status === 200));
  check('cold-reload-restores-exact-uid-container-and-tab', { uid, containerName, tab: 'logs', canvasCount: await page.locator('canvas').count() });
  await capture('02-cold-restored-panel');
  await details.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click();
  await poll(async () => [...logRequests.values()], (records) => records.every((record) => record.phase !== 'pending'));
  assert.equal(result.errors.length, 0, 'Page runtime error'); result.status = 'passed';
} catch (error) {
  result.status = 'failed'; result.failure = String(error.message).replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 1000);
  await capture('failure').catch(() => {}); process.exitCode = 1;
} finally {
  clearTimeout(timer); result.timedOut = timedOut;
  const close = page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true });
  if (await close.isVisible().catch(() => false)) await close.click().catch(() => {});
  await poll(async () => [...logRequests.values()], (records) => records.every((record) => record.phase !== 'pending'), 1500).catch(() => {});
  await page.goto('about:blank').catch(() => {});
  await poll(async () => [...sockets], (records) => records.every((record) => record.closed), 1500).catch(() => {});
  await context.close().catch(() => {}); await browser.close().catch(() => {});
  result.logRequests = [...logRequests.values()]; result.socketCount = sockets.size; result.socketClosed = [...sockets].filter((record) => record.closed).length;
  const response = await fetch(`${replay.origin}/api/replay/status`, { signal: AbortSignal.timeout(2000) }).catch(() => null);
  if (response?.ok) { const data = await response.json(); result.replayAfter = { dataSource: data.dataSource, profile: data.profile, logOpened: data.logOpened, logClosed: data.logClosed }; }
  result.sourceAfter = await manifest('frontend/src'); result.distAfter = await manifest('frontend/dist');
  result.finishedAt = new Date().toISOString(); await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ id, status: result.status, checks: result.checks.length, failure: result.failure, logRequests: result.logRequests.length, sockets: result.socketCount, closed: result.socketClosed, sourceUnchanged: result.sourceBefore === result.sourceAfter }));
}
