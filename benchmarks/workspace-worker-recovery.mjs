// Real owned worker stop/Unknown/recovery. Not status injection or a False/fire
// test. Three normal documents observe two shared harbors and independent B.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { findResource } from '../frontend/e2e/v11-ui.helpers.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json')), { chromium, expect } = require('@playwright/test');
const args = process.argv.slice(2), option = (key, fallback) => { const i = args.indexOf(`--${key}`); return i < 0 ? fallback : args[i + 1]; };
const config = option('kubeconfig', ''), runner = option('runner', ''), stateDir = option('state-dir', ''), id = option('id', `workspace-worker-${Date.now()}`);
if (![config, runner, stateDir].every(path.isAbsolute) || !/^[\w.-]+$/.test(id)) throw Error('Explicit absolute owned config/runner/state-dir and safe new ID required');
const out = path.join(root, 'artifacts/workspace', id); await mkdir(out, { recursive: false });
const inventory = JSON.parse(await readFile(path.join(root, 'manual-lab/evidence/ab-restricted-b-cold-05.json'), 'utf8')).finalInventory;
const state = JSON.parse(await readFile(path.join(stateDir, 'lab.json'), 'utf8'));
assert.equal(state.labId, inventory.labId); assert.equal(state.labId, 'kvml-ccdfe731dabd');
const worker = state.clusters.a.worker, workerUID = state.clusters.a.nodeUids[worker];
assert.ok(worker && worker !== state.clusters.a.name && workerUID);
const result = { id, startedAt: new Date().toISOString(), source: 'Real owned Docker/minikube worker power; real Node API/WS; normal object panels', worker: { name: worker, uid: workerUID }, status: 'running', samples: [], screenshots: [], snapshots: [], errors: [], limits: ['Ready Unknown is communication loss; this does not produce Ready False or prove a physical server failure.', 'Three independent browser documents intentionally observe live sources; no performance comparison is made.'] };
const read = (cluster, args) => JSON.parse(execFileSync('kubectl', ['--kubeconfig', config, '--context', state.clusters[cluster].name, ...args, '-o', 'json'], { timeout: 10000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
function node(cluster, name) { return read(cluster, ['get', 'node', name]); }
const ready = (n) => n.status.conditions.find((c) => c.type === 'Ready')?.status;
function guard() {
  for (const cluster of ['a', 'b']) assert.equal(read(cluster, ['get', 'namespace', 'kube-system']).metadata.uid, inventory.clusters[cluster].systemUid);
  assert.equal(node('a', worker).metadata.uid, workerUID);
}
guard(); assert.equal(ready(node('a', worker)), 'True');
const bNode = inventory.clusters.b.actualNodes[0], bPods = read('b', ['-n', 'kvml-e731dabd-03-same', 'get', 'pods']).items.map((p) => p.metadata.uid).sort();
const browser = await chromium.launch({ headless: false, args: ['--use-angle=metal'] }), context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
let stopped = false;
const pages = [];
const scenario = (name) => execFileSync(runner, ['--state-dir', stateDir, 'scenario', '--profile', '05-ariza-toparlanma', '--name', name], { cwd: '/tmp', encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
async function capture(phase) {
  const upstream = node('a', worker), b = node('b', bNode.name);
  const sample = { at: new Date().toISOString(), phase, upstream: { uid: upstream.metadata.uid, ready: ready(upstream), resourceVersion: upstream.metadata.resourceVersion }, b: { uid: b.metadata.uid, ready: ready(b) }, views: [] };
  assert.equal(b.metadata.uid, bNode.uid); assert.equal(ready(b), 'True');
  for (const entry of pages) {
    sample.views.push({ name: entry.name, ...await entry.page.locator('canvas').evaluate((c) => ({ stats: c.__harbor.stats(), visual: c.__harbor.visualLifecycleState(), frame: c.__harbor.stats().frame })) });
    const file = `${phase}-${entry.name}.png`; await entry.page.screenshot({ path: path.join(out, file) }); result.screenshots.push({ at: new Date().toISOString(), file });
  }
  result.samples.push(sample);
}
try {
  for (const [port, name, uid, resourceName] of [[19702, 'Proje 1', workerUID, worker], [19702, 'Proje 2', workerUID, worker], [19703, 'Bağımsız B', bNode.uid, bNode.name]]) {
    const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', (e) => result.errors.push(e.message));
    pages.push({ page, name: name.replaceAll(' ', '-') });
    page.on('websocket', (socket) => {
      const url = new URL(socket.url()); if (url.pathname !== '/ws') return;
      socket.on('framereceived', ({ payload }) => {
        try {
          const data = JSON.parse(String(payload)); if (data.type !== 'SNAPSHOT') return;
          const resources = Array.isArray(data.resources) ? data.resources : Object.values(data.resources || {});
          result.snapshots.push({ at: new Date().toISOString(), document: name, harborId: url.searchParams.get('harborId'), context: url.searchParams.get('context'), nodes: resources.filter((r) => r.kind === 'Node').map((r) => ({ uid: r.metadata.uid, name: r.metadata.name, ready: ready(r) })) });
        } catch { /* Never retain raw websocket payloads. */ }
      });
    });
    await page.goto(`http://127.0.0.1:${port}`); await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats, null, { timeout: 45000 });
    await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
    await page.locator('.workspace-port-select').filter({ has: page.getByText(name, { exact: true }) }).click();
    await page.locator('.workspace-window').waitFor({ state: 'detached' });
    await expect(page.locator('.world-brand-control')).toContainText(name);
    await page.waitForFunction((uid) => document.querySelector('canvas')?.__harbor?.visualLifecycleState?.()?.nodes.some((node) => node.uid === uid), uid, { timeout: 45000 });
    await findResource(page, 'Node', resourceName, uid);
  }
  await capture('0-before'); guard(); stopped = true;
  result.stopRequestedAt = new Date().toISOString(); scenario('node-stop');
  await expect.poll(() => ready(node('a', worker)), { timeout: 100000, intervals: [1000, 2000] }).toBe('Unknown');
  result.unknownObservedAt = new Date().toISOString();
  for (const entry of pages.slice(0, 2)) await entry.page.waitForFunction((uid) => document.querySelector('canvas')?.__harbor?.visualLifecycleState?.().nodes.some((n) => n.uid === uid && n.communication), workerUID, { timeout: 15000 });
  await capture('1-unknown');
  await new Promise((resolve) => setTimeout(resolve, 2000)); await capture('2-unknown-held');
  for (const sample of result.samples.slice(1)) for (const view of sample.views.slice(0, 2)) {
    assert.equal(view.stats.lifecycle.canonicalNodes, 2); assert.equal(view.stats.lifecycle.canonicalPods, 1);
    assert.ok(view.visual.nodes.find((n) => n.uid === workerUID)?.communication);
  }
  result.recoveryRequestedAt = new Date().toISOString(); scenario('node-recover');
  await expect.poll(() => ready(node('a', worker)), { timeout: 90000, intervals: [1000, 2000] }).toBe('True');
  for (const entry of pages.slice(0, 2)) await entry.page.waitForFunction((uid) => document.querySelector('canvas')?.__harbor?.visualLifecycleState?.().nodes.some((n) => n.uid === uid && !n.communication), workerUID, { timeout: 15000 });
  stopped = false; await capture('3-recovered');
  assert.deepEqual(read('b', ['-n', 'kvml-e731dabd-03-same', 'get', 'pods']).items.map((p) => p.metadata.uid).sort(), bPods);
  assert.equal(result.errors.length, 0); result.status = 'passed';
} catch (e) {
  result.status = 'failed'; result.failure = e.stack; await capture('failure').catch(() => {});
  for (const entry of pages) await entry.page.screenshot({ path: path.join(out, `failure-${entry.name}.png`) }).catch(() => {});
  process.exitCode = 1;
}
finally {
  if (stopped) { try { scenario('node-recover'); guard(); result.cleanupReady = ready(node('a', worker)); if (result.cleanupReady !== 'True') throw Error('Worker not Ready after cleanup'); } catch (e) { result.cleanupError = e.message; result.status = 'failed'; process.exitCode = 1; } }
  await context.close(); await browser.close(); result.finishedAt = new Date().toISOString(); await writeFile(path.join(out, 'result.json'), `${JSON.stringify(result, null, 2)}\n`); console.log(JSON.stringify({ id, status: result.status, samples: result.samples.length, failure: result.failure || null, cleanupError: result.cleanupError || null }));
}
