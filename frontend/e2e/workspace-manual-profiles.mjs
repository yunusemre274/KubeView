// Final delivered-binary normal UI smoke for owned real manual05/06 only.
// Starts no runner/server/cluster; reads no kubeconfig; submits no cluster write.
import { chromium, expect } from '@playwright/test';
import { closePanels, findResource, findFacility } from './v11-ui.helpers.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runStarted = Date.now(), globalDeadline = runStarted + 95000;
const receiptPath = process.env.KV_MANUAL_RECEIPT || '', binaryPath = process.env.KV_BINARY_PATH || '';
const expectedBinary = process.env.KV_EXPECTED_BINARY_SHA || '', expectedIndex = process.env.KV_EXPECTED_INDEX || '';
assert.ok(path.isAbsolute(receiptPath) && path.isAbsolute(binaryPath), 'Explicit absolute Root receipt and delivered binary paths required');
assert.match(expectedBinary, /^[a-f0-9]{64}$/); assert.match(expectedIndex, /^[a-f0-9]{64}$/);
const hash = (value) => createHash('sha256').update(value).digest('hex');
assert.equal(hash(await readFile(binaryPath)), expectedBinary, 'Exact delivered binary required; helper never executes it');
const receiptBytes = await readFile(receiptPath), input = JSON.parse(receiptBytes), receipt = input.finalInventory || input;
const labId = process.env.KV_LAB_ID || 'kvml-ccdfe731dabd'; assert.equal(receipt.labId, labId);
const cluster = receipt.clusters?.a; assert.ok(cluster?.name && cluster.systemUid && cluster.actualNodes?.length === 2);
assert.ok(cluster.actualNodes.every((node) => node.uid && node.name && node.ready === true), 'Root receipt must show the healthy actual A2 baseline');
const definitions = [
  { profile: '05-ariza-toparlanma', url: process.env.KV_PROFILE05_URL || 'http://127.0.0.1:19705', harbors: 1 },
  { profile: '06-limanlar-arasi-ag', url: process.env.KV_PROFILE06_URL || 'http://127.0.0.1:19706', harbors: 2 },
];
for (const definition of definitions) {
  definition.url = new URL(definition.url);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(definition.url.hostname) && ['http:', 'https:'].includes(definition.url.protocol) && !definition.url.username && !definition.url.password, 'Explicit loopback app only');
  definition.fixture = receipt.profiles?.[definition.profile];
  assert.equal(definition.fixture?.registeredHarborPlan, definition.harbors);
  assert.equal(definition.fixture.namespaces.length, definition.harbors);
  assert.ok(definition.fixture.namespaces.every((namespace) => namespace.cluster === 'a' && namespace.name && namespace.uid));
  assert.equal(definition.fixture.pods.length, 1, 'Root receipt must show baseline05 healthy workload and06 server-only; helper never resets scenarios');
  assert.ok(definition.fixture.pods.every((pod) => pod.cluster === 'a' && pod.uid && pod.name && pod.phase === 'Running' && pod.readyContainers === pod.containerCount));
  assert.equal(definition.fixture.pods[0].containerCount, definition.harbors === 1 ? 2 : 1);
}
const id = process.env.KV_EVIDENCE_ID || `workspace-manual05-06-${Date.now()}`; assert.match(id, /^[\w.-]+$/);
const out = path.join(root, 'artifacts/workspace', id); await mkdir(out, { recursive: false });
const result = { id, startedAt: new Date().toISOString(), status: 'running', deliveredBinarySHA256: expectedBinary, expectedIndexSHA256: expectedIndex, rootReceiptSHA256: hash(receiptBytes), cases: [], limits: [
  'Root owns actual cluster restoration, namespace ownership guards and app lifecycle; this helper starts or mutates none.',
  'Fresh Root status receipt is the expected Node/Pod/namespace UID authority; browser evidence uses actual public workspace GET and WebSocket snapshots.',
  'Normal UI smoke only; no crash/recovery/traffic scenario, Hubble, performance or user manual-acceptance claim.',
  'Native caret/camera observations do not measure physical presented latency or performance.',
  'No kubeconfig, credentials, raw frames, log/YAML bodies, nonce or HTTP headers are recorded.',
] };
const browser = await chromium.launch({ headless: false, timeout: 5000, ...(process.platform === 'darwin' ? { args: ['--use-angle=metal'] } : {}) });
let context, page, current, caseTimer;
const globalTimer = setTimeout(() => browser.close().catch(() => {}), Math.max(1, globalDeadline - Date.now()));
const sorted = (values) => [...values].sort(), nodeUIDs = sorted(cluster.actualNodes.map((node) => node.uid));
const check = (name, detail) => current.checks.push({ name, detail });
async function poll(read, accept, milliseconds = 8000) { const deadline = Date.now() + milliseconds; do { const value = await read(); if (accept(value)) return value; await page.waitForTimeout(100); } while (Date.now() < deadline); throw Error('Bounded actual UI observation did not reach its required condition'); }
async function documentFor(definition) { const response = await page.request.get(`${definition.url.origin}/api/workspace`, { timeout: 5000 }); assert.equal(response.status(), 200); return response.json(); }
async function canvasState(original) {
  return page.locator('canvas').evaluate((canvas, original) => {
    const rect = canvas.getBoundingClientRect();
    return { count: document.querySelectorAll('canvas').length, sameCanvas: !original || canvas === original, rect: [rect.x, rect.y, rect.width, rect.height], viewport: [innerWidth, innerHeight], dpr: devicePixelRatio,
      tables: [...document.querySelectorAll('table')].filter((element) => element.getBoundingClientRect().height > 0).length,
      counts: canvas.__harbor.stats().lifecycle };
  }, original);
}
async function assertCanvas(original, closed = false) {
  const value = await canvasState(original); assert.equal(value.count, 1); assert.equal(value.sameCanvas, true); assert.deepEqual(value.rect, [0, 0, 1440, 900]); assert.deepEqual(value.viewport, [1440, 900]); assert.equal(value.dpr, 1);
  if (closed) { assert.equal(await page.locator('.resource-details, .facility-window, .workspace-window').count(), 0); assert.equal(value.tables, 0); }
  return value;
}
async function capture(name) { const file = `${current.profile}-${name}.png`; await page.screenshot({ path: path.join(out, file), mask: [page.getByLabel('Container log çıktısı', { exact: true }), page.getByLabel('Kaynak YAML', { exact: true })] }); current.screenshots.push(file); }
async function ready(harbor, expectedPods) {
  await expect(page.locator('.world-cluster-name')).toContainText(harbor.name);
  await page.waitForFunction(({ pods }) => { const counts = document.querySelector('canvas')?.__harbor?.stats?.()?.lifecycle; return counts?.canonicalNodes === 2 && counts.canonicalPods === pods && /Canlı/.test(document.querySelector('.world-brand-control')?.textContent || ''); }, { pods: expectedPods }, { timeout: 12000 });
  assert.equal(await page.locator('.world-replay-badge').count(), 0); assert.ok(!(await page.locator('.world-brand-control').innerText()).includes('Demo'));
}
async function cameraPose() {
  return page.locator('canvas').evaluate((canvas) => {
    const harbor = canvas.__harbor, camera = harbor?.camera;
    let state = harbor?.scene?.__r3f?.root?.getState?.();
    if (!state) harbor?.scene?.traverse((object) => { state ||= object.__r3f?.root?.getState?.(); });
    const target = state?.controls?.target?.toArray?.();
    if (!camera || !target) return null;
    const pose = { camera: camera.position.toArray(), target, quaternion: camera.quaternion.toArray(), zoom: camera.zoom,
      forward: [-camera.matrixWorld.elements[8], 0, -camera.matrixWorld.elements[10]], source: harbor.visualLifecycleState?.()?.source || '' };
    return [...pose.camera, ...pose.target, ...pose.quaternion, pose.zoom, ...pose.forward].every(Number.isFinite) ? pose : null;
  });
}
const difference = (after, before) => after.map((value, index) => value - before[index]);
const length = (values) => Math.hypot(...values);
function stationary(before, after) {
  assert.ok(before && after, 'Existing camera/controls probe disappeared');
  const deltas = { camera: length(difference(after.camera, before.camera)), target: length(difference(after.target, before.target)), angle: length(difference(after.quaternion, before.quaternion)), zoom: Math.abs(after.zoom - before.zoom) };
  assert.ok(Object.values(deltas).every((value) => value < 1e-6), 'Camera or target moved after keyup/blur or while native textbox had focus'); assert.equal(after.source, before.source);
  return deltas;
}
function horizontalPan(before, after, key) {
  assert.ok(before && after, 'Existing camera/controls probe disappeared');
  const cameraDelta = difference(after.camera, before.camera), targetDelta = difference(after.target, before.target);
  assert.ok(length(cameraDelta) > .01, 'Focused scene arrow did not pan'); assert.ok(length(difference(cameraDelta, targetDelta)) < 1e-6, 'Camera and target did not translate together');
  assert.ok(Math.abs(cameraDelta[1]) < 1e-6 && Math.abs(targetDelta[1]) < 1e-6, 'Arrow pan changed camera/target height');
  const angleDelta = length(difference(after.quaternion, before.quaternion)); assert.ok(angleDelta < 1e-6, 'Arrow pan rotated the camera'); assert.equal(after.zoom, before.zoom); assert.equal(after.source, before.source);
  const [fx, , fz] = before.forward, [dx, , dz] = cameraDelta, along = dx * fx + dz * fz, sideways = dx * -fz + dz * fx;
  assert.ok(key === 'ArrowRight' ? sideways > 0 && Math.abs(along) < 1e-6 : along > 0 && Math.abs(sideways) < 1e-6, 'Arrow pan did not follow the camera horizontal direction');
  return { cameraDelta, targetDelta, angleDelta, zoomDelta: after.zoom - before.zoom, sourceSHA256: hash(before.source) };
}
async function normalKeyboard(originalCanvas) {
  if (!(await cameraPose())) { current.keyboard = { status: 'NOT_RUN', reason: 'Existing read-only canvas camera plus R3F controls.target probe unavailable' }; check('normal-keyboard-regression', current.keyboard); return; }
  let previous, stable = 0;
  await poll(async () => { const value = await cameraPose(); assert.ok(value); const settled = previous && ['camera', 'target', 'quaternion'].every((key) => length(difference(value[key], previous[key])) < 1e-6); stable = settled ? stable + 1 : 0; previous = value; return stable; }, (value) => value >= 3, 4000);
  const canvas = page.locator('canvas'), finderTrigger = page.getByRole('button', { name: 'Bul', exact: true });
  await expect(canvas).toHaveAttribute('tabindex', '0'); await canvas.focus(); await expect(canvas).toBeFocused();
  try {
    const beforeRight = await cameraPose(), rightStart = Date.now();
    await page.keyboard.down('ArrowRight'); await page.waitForTimeout(120); await page.keyboard.up('ArrowRight');
    const rightHeldMs = Date.now() - rightStart; assert.ok(rightHeldMs <= 200, 'ArrowRight hold exceeded the bounded 200 ms keyboard case');
    const afterRight = await cameraPose(), rightMove = horizontalPan(beforeRight, afterRight, 'ArrowRight'); await page.waitForTimeout(100);
    check('focused-canvas-horizontal-arrowright-and-keyup-stop', { status: 'PASS', heldMs: rightHeldMs, ...rightMove, stopped: stationary(afterRight, await cameraPose()) });
    const beforeUp = await cameraPose(), upStart = Date.now();
    await page.keyboard.down('ArrowUp'); await page.waitForTimeout(80); await finderTrigger.focus();
    const blurred = await cameraPose(), upMove = horizontalPan(beforeUp, blurred, 'ArrowUp'); await page.waitForTimeout(30); const blurStop = stationary(blurred, await cameraPose());
    await canvas.focus(); await page.waitForTimeout(30); const refocusStop = stationary(blurred, await cameraPose()); await page.keyboard.up('ArrowUp');
    const upHeldMs = Date.now() - upStart; assert.ok(upHeldMs <= 200, 'ArrowUp blur/refocus case exceeded the bounded 200 ms keyboard hold'); await page.waitForTimeout(80);
    check('focused-canvas-horizontal-arrowup-and-blur-clears-held-key', { status: 'PASS', heldMs: upHeldMs, ...upMove, blurStop, refocusStop, keyupStop: stationary(blurred, await cameraPose()) });
    await finderTrigger.click(); const finder = page.getByRole('dialog', { name: 'Dünyada bul', exact: true }), input = finder.getByLabel('Nesne veya kaynak ara', { exact: true });
    await expect(input).toBeFocused(); const text = 'native-caret'; await input.fill(text); const beforeText = await cameraPose();
    await input.press('ArrowLeft'); await input.press('ArrowLeft'); await page.waitForTimeout(80);
    const caret = await input.evaluate((element) => ({ start: element.selectionStart, end: element.selectionEnd, text: element.value })); assert.equal(caret.text, text); assert.equal(caret.start, text.length - 2); assert.equal(caret.end, caret.start);
    check('finder-native-caret-arrows-keep-camera-and-target', { status: 'PASS', caret: caret.start, ...stationary(beforeText, await cameraPose()) });
    await input.press('Escape'); await finder.waitFor({ state: 'detached' }); await assertCanvas(originalCanvas, true);
    current.keyboard = { status: 'PASS', cases: 3, probe: 'Existing canvas.__harbor.camera and R3F controls.target; no product-state injection' };
  } finally { await page.keyboard.up('ArrowRight').catch(() => {}); await page.keyboard.up('ArrowUp').catch(() => {}); }
}
try {
  for (const definition of definitions) {
    current = { profile: definition.profile, startedAt: new Date().toISOString(), status: 'running', checks: [], screenshots: [], errors: [], consoleErrors: [], prohibitedWrites: [], readOnlyResets: [], workspaceViewWrites: [], snapshots: [] }; result.cases.push(current);
    context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }); page = await context.newPage(); page.setDefaultTimeout(5000);
    caseTimer = setTimeout(() => { current.timedOut = true; context?.close().catch(() => {}); }, Math.max(1, Math.min(45000, globalDeadline - Date.now() - 3000)));
    page.on('pageerror', (error) => current.errors.push(error.message.replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 200)));
    page.on('console', (message) => { if (message.type() === 'error') current.consoleErrors.push(message.text().replace(/\?[^\s)]+/g, '?[redacted]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[token]').slice(0, 200)); });
    page.on('request', (request) => {
      const url = new URL(request.url()); if (['GET', 'HEAD'].includes(request.method())) return;
      if (url.pathname === '/api/management' && request.postDataJSON()?.enabled === false) current.readOnlyResets.push({ harborId: url.searchParams.get('harborId'), enabled: false });
      else if (['/api/resources', '/api/actions', '/api/management', '/api/replay/scenario', '/api/portforwards'].includes(url.pathname)) current.prohibitedWrites.push({ path: url.pathname, method: request.method() });
      else if (url.pathname.startsWith('/api/workspace/harbors/')) current.workspaceViewWrites.push({ method: request.method() });
    });
    page.on('websocket', (socket) => {
      const url = new URL(socket.url()); if (url.pathname !== '/ws') return;
      socket.on('framereceived', ({ payload }) => { try {
        const data = JSON.parse(String(payload)); if (data.type !== 'SNAPSHOT') return;
        const resources = Array.isArray(data.resources) ? data.resources : Object.values(data.resources || {});
        current.snapshots.push({ harborId: data.harborId || url.searchParams.get('harborId'),
          nodes: resources.filter((item) => item.kind === 'Node').map((item) => ({ uid: item.metadata.uid, name: item.metadata.name })),
          pods: resources.filter((item) => item.kind === 'Pod').map((item) => ({ uid: item.metadata.uid, name: item.metadata.name, namespace: item.metadata.namespace, ownedLab: item.metadata.labels?.['manual.kubeview.local/lab-id'] === labId, ownedProfile: item.metadata.labels?.['manual.kubeview.local/profile'] === definition.profile })) });
      } catch { /* No raw frames are retained. */ } });
    });
    const navigation = await page.goto(definition.url.origin, { timeout: 12000 }); assert.equal(navigation.status(), 200); assert.equal(hash(await navigation.body()), expectedIndex);
    await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats, null, { timeout: 12000 });
    const workspace = await poll(() => documentFor(definition), (value) => value.connections.length === 1 && value.connections[0].identity?.confidence === 'verified');
    assert.equal(workspace.harbors.length, definition.harbors); assert.equal(workspace.connections[0].context, cluster.name); assert.equal(workspace.connections[0].bound, true); assert.equal(workspace.connections[0].identity.clusterUID, cluster.systemUid);
    assert.deepEqual(sorted(workspace.harbors.flatMap((harbor) => harbor.namespaces)), sorted(definition.fixture.namespaces.map((namespace) => namespace.name)));
    assert.ok(workspace.harbors.every((harbor) => harbor.connectionRef === workspace.connections[0].id && harbor.namespaces.length === 1 && !harbor.selector));
    check('native-workspace-exact-registration-and-real-cluster-identity', { workspaceId: workspace.id, harborCount: workspace.harbors.length, context: cluster.name, clusterUID: cluster.systemUid });
    await closePanels(page); const canvas = await page.locator('canvas').elementHandle();
    for (const [index, harbor] of workspace.harbors.entries()) {
      await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click(); await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click(); await page.locator('.workspace-window').waitFor({ state: 'detached' });
      const expectedPods = definition.fixture.pods.filter((pod) => harbor.namespaces.includes(pod.namespace)); await ready(harbor, expectedPods.length); await closePanels(page);
      const snapshot = await poll(async () => current.snapshots.filter((item) => item.harborId === harbor.id).at(-1), (item) => item && sorted(item.nodes.map((node) => node.uid)).join() === nodeUIDs.join() && sorted(item.pods.map((pod) => pod.uid)).join() === sorted(expectedPods.map((pod) => pod.uid)).join());
      assert.ok(snapshot.pods.every((pod) => pod.ownedLab && pod.ownedProfile && harbor.namespaces.includes(pod.namespace))); await assertCanvas(canvas, true);
      check('actual-snapshot-exact-node-and-pod-UIDs', { harborId: harbor.id, namespace: harbor.namespaces[0], nodeUIDs, podUIDs: sorted(expectedPods.map((pod) => pod.uid)), canonicalNodes: 2, canonicalPods: expectedPods.length });
      if (index === 0) await capture('closed-world');
      const node = cluster.actualNodes[0]; await findResource(page, 'Node', node.name, node.uid); await assertCanvas(canvas); await page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click(); await assertCanvas(canvas, true);
      check('normal-node-panel-open-close-preserves-full-canvas', { harborId: harbor.id, uid: node.uid });
      for (const pod of expectedPods) { await findResource(page, 'Pod', pod.name, pod.uid); await assertCanvas(canvas); await capture('pod-exact-UID'); await page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click(); await assertCanvas(canvas, true); check('normal-pod-panel-open-close-preserves-full-canvas', { harborId: harbor.id, uid: pod.uid, namespace: pod.namespace }); }
      await findFacility(page, 'Yönetim Merkezi'); const facility = page.getByRole('dialog', { name: 'Liman Yönetim Merkezi', exact: true }); await expect(facility).toBeVisible(); await assertCanvas(canvas); await facility.getByRole('button', { name: 'Pencereyi kapat', exact: true }).click(); await assertCanvas(canvas, true);
      check('normal-facility-panel-open-close-preserves-full-canvas', { harborId: harbor.id, facility: 'center' });
    }
    if (definition.profile === '05-ariza-toparlanma') await normalKeyboard(canvas);
    assert.equal(current.prohibitedWrites.length, 0); assert.equal(current.errors.length, 0); assert.equal(current.consoleErrors.length, 0); current.status = 'passed'; current.finishedAt = new Date().toISOString(); clearTimeout(caseTimer); await context.close(); context = page = null;
  }
  result.status = result.cases.some((item) => item.keyboard?.status === 'NOT_RUN') ? 'partial' : 'passed';
} catch (error) { result.status = 'failed'; result.failure = String(error.message).replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 1000); if (current) { current.status = 'failed'; current.failure = result.failure; if (page) await capture('failure').catch(() => {}); } process.exitCode = 1; }
finally { clearTimeout(caseTimer); clearTimeout(globalTimer); await context?.close().catch(() => {}); await browser.close().catch(() => {}); result.finishedAt = new Date().toISOString(); await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n'); console.log(JSON.stringify({ id, status: result.status, cases: result.cases.map(({ profile, status }) => ({ profile, status })), failure: result.failure })); }
