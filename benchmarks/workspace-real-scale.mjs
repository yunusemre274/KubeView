// Actual same-name cross-cluster isolation via the normal scale form. Only the
// explicitly owned 03 fixture is eligible; restore uses UID/RV preconditions.
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { findResource, enableManagement, submitActionForm } from '../frontend/e2e/v11-ui.helpers.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'frontend/package.json')), { chromium, expect } = require('@playwright/test');
const args = process.argv.slice(2), option = (key, fallback) => { const i = args.indexOf(`--${key}`); return i < 0 ? fallback : args[i + 1]; };
const id = option('id', `workspace-real-scale-${Date.now()}`), config = option('kubeconfig', '');
if (!/^[\w.-]+$/.test(id) || !path.isAbsolute(config)) throw Error('New ID and explicit absolute owned 03 kubeconfig required');
const target = new URL(option('url', 'http://127.0.0.1:19703'));
if (target.hostname !== '127.0.0.1' || target.port !== '19703') throw Error('Explicit owned profile03 port only');
const inventory = JSON.parse(await readFile(path.join(root, 'manual-lab/evidence/ab-restricted-b-cold-05.json'), 'utf8')).finalInventory;
assert.equal(inventory.labId, 'kvml-ccdfe731dabd');
const namespace = 'kvml-e731dabd-03-same', labId = inventory.labId;
const out = path.join(root, 'artifacts/workspace', id); await mkdir(out, { recursive: false });
const result = { id, startedAt: new Date().toISOString(), source: 'Real Kubernetes API + normal scale form; owned manual profile03', checks: [], status: 'running', errors: [] };
const check = (name, detail) => result.checks.push({ name, at: new Date().toISOString(), detail });
const kubectl = (cluster, words) => JSON.parse(execFileSync('kubectl', ['--kubeconfig', config, '--context', `${labId}-${cluster}`, ...words, '-o', 'json'], { encoding: 'utf8', timeout: 12000, stdio: ['ignore', 'pipe', 'pipe'] }));
function guard(cluster) {
  assert.equal(kubectl(cluster, ['get', 'namespace', 'kube-system']).metadata.uid, inventory.clusters[cluster].systemUid);
  const ns = kubectl(cluster, ['get', 'namespace', namespace]), entry = inventory.profiles['03-bagimsiz-kumeler'].namespaces.find((n) => n.cluster === cluster);
  assert.equal(ns.metadata.uid, entry.uid); assert.equal(ns.metadata.labels['manual.kubeview.local/lab-id'], labId);
}
const deployment = (cluster) => { guard(cluster); const d = kubectl(cluster, ['-n', namespace, 'get', 'deployment', 'same-app']); assert.equal(d.metadata.labels['manual.kubeview.local/lab-id'], labId); assert.equal(d.metadata.labels['manual.kubeview.local/profile'], '03-bagimsiz-kumeler'); return d; };
const digest = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const receipt = (d) => ({ uid: d.metadata.uid, replicas: d.spec.replicas, generation: d.metadata.generation, templateHash: digest(d.spec.template) });
const podUIDs = (cluster) => kubectl(cluster, ['-n', namespace, 'get', 'pods']).items.map((p) => p.metadata.uid).sort();
const a = deployment('a'), b = deployment('b'), bPods = podUIDs('b');
assert.equal(a.spec.replicas, 1, 'Do not overwrite an already modified manual fixture'); assert.equal(b.spec.replicas, 1);
result.before = { a: receipt(a), b: receipt(b), bPodUIDs: bPods };
const browser = await chromium.launch({ headless: false, args: ['--use-angle=metal'] }), context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), page = await context.newPage();
page.setDefaultTimeout(15000); page.on('pageerror', (e) => result.errors.push(e.message));
const capture = async (name) => page.screenshot({ path: path.join(out, `${name}.png`) });
let changed = false;
async function choose(harbor) {
  await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await page.locator('.workspace-window').waitFor({ state: 'detached' });
  await expect(page.locator('.world-brand-control')).toContainText(harbor.name);
}
async function scale(uid, replicas) {
  const details = await findResource(page, 'Deployment', 'same-app', uid);
  await expect(details.getByRole('button', { name: 'Ölçekle', exact: true })).toBeEnabled();
  await details.getByRole('button', { name: 'Ölçekle', exact: true }).click();
  const form = page.locator('.resource-form-dialog');
  await form.getByRole('spinbutton').fill(String(replicas));
  await capture(`scale-form-${replicas}`);
  const accepted = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/actions' && r.request().method() === 'POST');
  await submitActionForm(page);
  const response = await accepted; assert.equal(response.status(), 202, 'Controller operation is accepted; readiness is checked separately from the real API');
  const address = new URL(response.url());
  check('normal-form-scale-accepted', { harborId: address.searchParams.get('harborId'), uid, replicas, status: response.status() });
}
try {
  await page.goto(target.origin); await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats?.().lifecycle.canonicalPods === 2, null, { timeout: 45000 });
  const doc = await (await page.request.get(`${target.origin}/api/workspace`)).json();
  const harborA = doc.harbors.find((h) => h.name === 'Bağımsız A'), harborB = doc.harbors.find((h) => h.name === 'Bağımsız B'); assert.ok(harborA && harborB);
  await choose(harborA); await enableManagement(page);
  changed = true; await scale(a.metadata.uid, 2);
  await expect.poll(() => { const d = deployment('a'); assert.equal(d.metadata.uid, a.metadata.uid); return d.status.readyReplicas; }, { timeout: 35000 }).toBe(2);
  assert.deepEqual(receipt(deployment('b')), receipt(b)); assert.deepEqual(podUIDs('b'), bPods);
  check('real-controller-scale-only-A', { a: receipt(deployment('a')), b: receipt(deployment('b')), bPodUIDs: bPods });
  await choose(harborB);
  const details = await findResource(page, 'Deployment', 'same-app', b.metadata.uid);
  await expect(details.getByRole('button', { name: 'Ölçekle', exact: true })).toBeDisabled();
  await capture('B-stays-readonly-and-unchanged');
  check('A-grant-not-carried-to-B', { harborId: harborB.id, uid: b.metadata.uid, scaleDisabled: true });
  await choose(harborA); await enableManagement(page); await scale(a.metadata.uid, 1);
  await expect.poll(() => deployment('a').status.readyReplicas, { timeout: 45000 }).toBe(1);
  assert.deepEqual(receipt(deployment('b')), receipt(b)); assert.deepEqual(podUIDs('b'), bPods);
  assert.equal(result.errors.length, 0); result.status = 'passed';
} catch (e) { result.status = 'failed'; result.failure = e.stack; await capture('failure').catch(() => {}); process.exitCode = 1; }
finally {
  if (changed) {
    try {
      const current = deployment('a'); assert.equal(current.metadata.uid, a.metadata.uid);
      if (current.spec.replicas === 2) {
        guard('a');
        const patch = JSON.stringify([{ op: 'test', path: '/metadata/uid', value: a.metadata.uid }, { op: 'test', path: '/metadata/resourceVersion', value: current.metadata.resourceVersion }, { op: 'test', path: '/spec/replicas', value: 2 }, { op: 'replace', path: '/spec/replicas', value: 1 }]);
        execFileSync('kubectl', ['--kubeconfig', config, '--context', `${labId}-a`, '-n', namespace, 'patch', 'deployment', 'same-app', '--type=json', '-p', patch], { timeout: 12000, stdio: ['ignore', 'pipe', 'pipe'] });
        check('failure-cleanup-only', { restoredReplica1: true, method: 'Direct owned UID/RV guarded API; not normal UI success' });
      } else assert.equal(current.spec.replicas, 1);
      check('final-owned-fixture-restored', { a: receipt(deployment('a')), b: receipt(deployment('b')), bPodUIDs: podUIDs('b') });
    } catch (e) { result.cleanupError = e.message; result.status = 'failed'; process.exitCode = 1; }
  }
  await context.close(); await browser.close(); result.finishedAt = new Date().toISOString(); await writeFile(path.join(out, 'result.json'), `${JSON.stringify(result, null, 2)}\n`); console.log(JSON.stringify({ id, status: result.status, checks: result.checks.length, failure: result.failure || null, cleanupError: result.cleanupError || null }));
}
