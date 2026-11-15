// Bounded normal-user acceptance of the owned 03/04 manual profiles.
// Read-only: no state injection, Kubernetes writes, credentials or log payloads.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { findResource, resourceTab, closePanels } from '../frontend/e2e/v11-ui.helpers.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json'));
const { chromium, webkit, expect } = require('@playwright/test');
const args = process.argv.slice(2);
const option = (key, fallback) => { const i = args.indexOf(`--${key}`); return i < 0 ? fallback : args[i + 1]; };
const profile = option('profile', '03-bagimsiz-kumeler');
if (!['03-bagimsiz-kumeler', '04-kisitli-yetki'].includes(profile)) throw Error('Use an owned 03 or 04 manual profile');
const target = new URL(option('url', `http://127.0.0.1:${profile.startsWith('03') ? 19703 : 19704}`));
if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.username || target.password) throw Error('Loopback only');
const id = option('id', `workspace-real-${Date.now()}`);
if (!/^[\w.-]+$/.test(id)) throw Error('Safe new evidence ID required');
const out = path.join(root, 'artifacts/workspace', id);
await mkdir(out, { recursive: false });
const inventory = JSON.parse(await readFile(path.join(root, option('inventory', 'manual-lab/evidence/ab-restricted-b-cold-05.json')), 'utf8')).finalInventory;
assert.equal(inventory.labId, 'kvml-ccdfe731dabd', 'Explicit owned lab receipt required');
const fixture = inventory.profiles[profile];
const engine = option('browser', 'chromium');
if (!['chromium', 'webkit'].includes(engine)) throw Error('chromium or webkit only; WebKit is not native Safari');
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: false, ...(engine === 'chromium' ? { args: ['--use-angle=metal'] } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.setDefaultTimeout(15000);
const result = { id, profile, source: 'Real Kubernetes; normal DOM/pointer UI, read-only diagnostic observations', startedAt: new Date().toISOString(), browser: engine, version: browser.version(), checks: [], streams: [], sockets: [], errors: [], status: 'running' };
const check = (name, detail) => result.checks.push({ name, at: new Date().toISOString(), detail });
const capture = async (name) => { await page.screenshot({ path: path.join(out, `${name}.png`) }); check('screenshot', `${name}.png`); };
const streams = new Map();
page.on('pageerror', (error) => result.errors.push(error.message));
page.on('request', (request) => {
  const u = new URL(request.url()); if (u.pathname !== '/api/logs') return;
  const record = { opened: new Date().toISOString(), harborId: u.searchParams.get('harborId'), context: u.searchParams.get('context'), namespace: u.searchParams.get('namespace'), pod: u.searchParams.get('pod'), container: u.searchParams.get('container'), uid: u.searchParams.get('uid'), ended: false };
  streams.set(request, record); result.streams.push(record);
});
for (const event of ['requestfinished', 'requestfailed']) page.on(event, (request) => { const record = streams.get(request); if (record) { record.ended = true; record.closed = new Date().toISOString(); } });
page.on('response', (response) => {
  const record = streams.get(response.request()); if (!record) return;
  const headers = response.headers(); record.status = response.status(); record.openingUID = headers['x-kubeview-pod-uid']; record.protocol = headers['x-kubeview-log-protocol'];
});
page.on('websocket', (socket) => {
  const u = new URL(socket.url()); if (u.pathname !== '/ws') return;
  const record = { harborId: u.searchParams.get('harborId'), context: u.searchParams.get('context'), namespaces: u.searchParams.get('namespace'), snapshots: [], closed: false };
  result.sockets.push(record); socket.on('close', () => { record.closed = true; });
  socket.on('framereceived', ({ payload }) => {
    try {
      const data = JSON.parse(String(payload)); if (data.type !== 'SNAPSHOT') return;
      const resources = Array.isArray(data.resources) ? data.resources : Object.values(data.resources || {});
      record.snapshots.push({ at: new Date().toISOString(), pods: resources.filter((r) => r.kind === 'Pod').map((r) => ({ name: r.metadata.name, uid: r.metadata.uid, namespace: r.metadata.namespace })), nodes: resources.filter((r) => r.kind === 'Node').map((r) => ({ name: r.metadata.name, uid: r.metadata.uid })) });
      if (record.snapshots.length > 4) record.snapshots.shift();
    } catch { /* No raw frames are retained. */ }
  });
});
async function selectHarbor(harbor, expectedNodes, expectedPods) {
  await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await page.locator('.workspace-window').waitFor({ state: 'detached' });
  await expect(page.locator('.world-brand-control')).toContainText(harbor.name);
  await page.waitForFunction(({ nodes, pods }) => {
    const s = document.querySelector('canvas')?.__harbor?.stats?.();
    return s?.lifecycle?.canonicalNodes === nodes && s?.lifecycle?.canonicalPods === pods && !/API bekleniyor/.test(document.querySelector('.world-brand-control')?.textContent || '');
  }, { nodes: expectedNodes, pods: expectedPods }, { timeout: 45000 });
  const stats = await page.evaluate(() => document.querySelector('canvas').__harbor.stats());
  check('exact-active-resource-counts', { harborId: harbor.id, nodes: stats.lifecycle.canonicalNodes, pods: stats.lifecycle.canonicalPods });
  // Resource state intentionally precedes the user's camera flight. Isolate a
  // keyboard-pan assertion from that independent in-progress transition.
  await page.evaluate(() => { delete globalThis.__workspaceRealCameraStable; });
  await page.waitForFunction(() => {
    const camera = document.querySelector('canvas')?.__harbor?.camera;
    if (!camera) return false;
    const pose = [...camera.position.toArray(), ...camera.quaternion.toArray()];
    const old = globalThis.__workspaceRealCameraStable, now = performance.now();
    if (!old || pose.some((v, i) => Math.abs(v - old.pose[i]) > 0.00001)) {
      globalThis.__workspaceRealCameraStable = { pose, since: now }; return false;
    }
    return now - old.since >= 200;
  }, null, { timeout: 10000 });
  await page.evaluate(() => { delete globalThis.__workspaceRealCameraStable; });
}
try {
  await page.goto(target.origin);
  await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats, { timeout: 45000 });
  const doc = await (await page.request.get(`${target.origin}/api/workspace`)).json();
  assert.equal(doc.harbors.length, 2); assert.equal(doc.connections.length, 2);
  result.workspace = { id: doc.id, harbors: doc.harbors.map(({ id, name, connectionRef, namespaces }) => ({ id, name, connectionRef, namespaces })) };
  const canvas = await page.locator('canvas').elementHandle();
  const ordered = profile.startsWith('03') ? ['Bağımsız A', 'Bağımsız B', 'Bağımsız A'] : ['Kısıtlı okuyucu', 'Ayrı admin', 'Kısıtlı okuyucu'];
  for (const [index, name] of ordered.entries()) {
    const harbor = doc.harbors.find((h) => h.name === name); assert.ok(harbor);
    const connection = doc.connections.find((c) => c.id === harbor.connectionRef); assert.ok(connection);
    const cluster = connection.context.endsWith('-b') ? 'b' : 'a';
    const reader = name === 'Kısıtlı okuyucu';
    const expectedPods = profile.startsWith('03') ? 2 : 1;
    const nodes = reader ? 0 : inventory.clusters[cluster].nodesExpected;
    const pod = fixture.pods.find((p) => p.cluster === cluster && (profile.startsWith('03') ? p.name === 'same-pod' : true)); assert.ok(pod);
    const oldStreams = result.streams.filter((s) => !s.ended);
    await selectHarbor(harbor, nodes, expectedPods);
    await expect.poll(() => oldStreams.every((s) => s.ended), { timeout: 10000, message: 'Inactive harbor log stream must close' }).toBe(true);
    assert.equal(await page.evaluate((original) => original === document.querySelector('canvas'), canvas), true, 'Switch must preserve Canvas');
    const details = await findResource(page, 'Pod', pod.name, pod.uid);
    await expect(details).toContainText(pod.namespace);
    await capture(`${index + 1}-pod-${reader ? 'reader' : cluster}`);
    await resourceTab(page, 'Loglar');
    await expect(details.getByRole('combobox', { name: 'Container', exact: true })).toHaveValue('web');
    await expect.poll(() => result.streams.some((s) => s.harborId === harbor.id && s.uid === pod.uid && s.status === 200 && s.openingUID === pod.uid && s.protocol === 'guarded-text-v1'), { timeout: 20000, message: 'Actual log opening must confirm exact Pod UID/harbor' }).toBe(true);
    await expect(details.locator('.logs-status')).toContainText(/Canlı akış|Akış tamamlandı/);
    check('actual-log-opening-guard', { harborId: harbor.id, context: connection.context, namespace: pod.namespace, name: pod.name, uid: pod.uid, container: 'web', payloadRecorded: false });
    const before = await page.locator('canvas').evaluate((c) => c.__harbor.camera.position.toArray());
    await details.getByRole('textbox', { name: 'Loglarda ara ve filtrele', exact: true }).fill('kontrol');
    await page.keyboard.press('ArrowLeft');
    const after = await page.locator('canvas').evaluate((c) => c.__harbor.camera.position.toArray());
    assert.ok(Math.hypot(...before.map((v, i) => v - after[i])) < 0.001, 'Focused log text input must not pan camera');
    check('text-input-arrow-does-not-pan', { harborId: harbor.id });
    await capture(`${index + 1}-logs-${reader ? 'reader' : cluster}`);
  }
  await closePanels(page);
  await expect.poll(() => result.streams.every((s) => s.ended), { timeout: 10000 }).toBe(true);
  await capture('4-world-all-panels-closed');
  assert.equal(result.errors.length, 0, 'No page errors');
  if (profile.startsWith('03')) {
    const uids = new Set(result.streams.filter((s) => s.status === 200).map((s) => s.uid));
    assert.equal(uids.size, 2, 'Same-name cross-cluster Pods must remain different UIDs');
  }
  check('closed-log-cleanup', { requests: result.streams.length, active: result.streams.filter((s) => !s.ended).length });
  result.status = 'passed';
} catch (error) { result.status = 'failed'; result.failure = error.stack; await capture('failure').catch(() => {}); process.exitCode = 1; }
finally { result.finishedAt = new Date().toISOString(); await context.close(); await browser.close(); await writeFile(path.join(out, 'result.json'), `${JSON.stringify(result, null, 2)}\n`); console.log(JSON.stringify({ id, status: result.status, checks: result.checks.length, failure: result.failure || null })); }
