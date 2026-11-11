// Normal App, isolated read-only API/WebSocket fixtures. Never connects to Kubernetes.
// Start Vite or an existing static app separately; this file owns only its browser.
import { chromium, webkit, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { closePanels as closeBasePanels } from './v11-ui.helpers.js';

async function closePanels(page) {
  // A connection modal may cover a restored resource panel: close topmost first.
  for (let i = 0; i < 4; i++) {
    const close = page.getByRole('button', { name: 'Pencereyi kapat', exact: true }).last();
    if (!(await close.isVisible())) break;
    await close.click();
  }
  await closeBasePanels(page);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const origin = new URL(process.env.KV_UI2_URL || 'http://127.0.0.1:5173');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname), 'Loopback UI only');
const id = process.env.KV_UI2_RUN_ID || `reference-${new Date().toISOString().replace(/[:.]/g, '-')}`;
assert.match(id, /^[\w.-]+$/);
const baseline = process.env.KV_UI2_BASELINE === '1', engine = process.env.KV_UI2_BROWSER || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const out = path.join(root, 'artifacts/ui2', id); await mkdir(out, { recursive: false });
const hash = value => createHash('sha256').update(value).digest('hex');
const fixtureTime = '2026-11-11T08:00:00Z';
const nodes = ['worker-01', 'worker-02'].map((name, index) => ({ apiVersion: 'v1', kind: 'Node', metadata: {
  uid: `ui2-test-node-${index + 1}`, name, resourceVersion: 'test-rv-1', creationTimestamp: fixtureTime, labels: { 'kubernetes.io/hostname': name } }, spec: {}, status: {
  conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: fixtureTime }], capacity: { cpu: '4', memory: '8Gi' }, allocatable: { cpu: '4', memory: '8Gi' },
  nodeInfo: { kubeletVersion: 'v1.35.1', operatingSystem: 'linux', architecture: 'arm64' } } }));
const pods = ['a', 'b'].map(side => ({ apiVersion: 'v1', kind: 'Pod', metadata: {
  uid: `ui2-test-pod-${side}`, name: `workload-${side}`, namespace: `namespace-${side}`, resourceVersion: 'test-rv-1', creationTimestamp: fixtureTime,
  labels: { 'kubeview.test/source': 'ui2-visual-fixture' } }, spec: { nodeName: nodes[0].metadata.name,
  containers: ['app', 'metrics'].map(name => ({ name, image: 'fixture:never-pulled', resources: { requests: { cpu: '100m', memory: '64Mi' }, limits: { cpu: '500m', memory: '256Mi' } } })) },
  status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }], containerStatuses: ['app', 'metrics'].map(name => ({ name, ready: true, restartCount: 0, state: { running: { startedAt: fixtureTime } } })) } }));
const namespaces = ['a', 'b'].map(side => ({ apiVersion: 'v1', kind: 'Namespace', metadata: { uid: `ui2-test-namespace-${side}`, name: `namespace-${side}`, resourceVersion: 'test-rv-1' }, status: { phase: 'Active' } }));
const identity = { confidence: 'verified', clusterUID: 'ui2-fixture-cluster-uid' };
const workspace = { schemaVersion: 1, id: 'ui2-visual-workspace', revision: 1, name: 'UI 2.0 TEST fixture', workspaceNonce: 'ui2-test-not-an-auth-secret', preferences: {}, relations: [],
  connections: [{ id: 'ui2-connection', name: 'TEST cluster', context: 'ui2-test-cluster', bound: true, credentialGeneration: 'test-generation-1', authorizationKey: 'test-readonly', identity }],
  harbors: ['a', 'b'].map((side, index) => ({ id: `ui2-harbor-${side}`, name: `Namespace ${side.toUpperCase()}`, connectionRef: 'ui2-connection', namespaces: [`namespace-${side}`], selector: '', position: [index * 1300, 0], view: {} })) };
const fixture = { workspace, nodes, pods, namespaces };
const reference = await readFile(path.join(root, 'Kubeview_UI_2.0.png')).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
let livePods = [...pods];
const testSockets = new Map();
const result = { id, engine, headless: process.env.KV_UI2_HEADLESS === '1', baseline, startedAt: new Date().toISOString(), status: 'running', source: 'TEST/REPLAY — isolated read-only mocked HTTP and WebSocket; NOT Kubernetes E2E',
  fixtureSHA256: hash(JSON.stringify(fixture)), referenceSHA256: reference ? hash(reference) : null, checks: [], screenshots: [], errors: [], consoleErrors: [], prohibitedWrites: [], unexpectedAPI: [], scopes: [], streamEvents: [], limits: [
    'No real cluster, mutation, provisioning or traffic collector was used. Scoped fixture identity is synthetic.',
    'Video and short JS draw samples are visual diagnostics, not production CPU/FPS or physical feedback acceptance.',
    'Read-only existing scene probes inspect poses/material uniforms; interactions use normal DOM and pointer paths.',
    'Playwright WebKit is not native Safari hardware performance.'
  ] };
const record = (name, detail = {}) => result.checks.push({ name, status: 'PASS', ...detail });
const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: process.env.KV_UI2_HEADLESS === '1', timeout: 15000,
  ...(engine === 'chromium' && process.platform === 'darwin' ? { args: ['--use-angle=metal'] } : {}) });
const context = await browser.newContext({ viewport: { width: 1672, height: 941 }, deviceScaleFactor: 1, reducedMotion: 'no-preference', recordVideo: { dir: path.join(out, 'video'), size: { width: 1672, height: 941 } } });
const page = await context.newPage(); page.setDefaultTimeout(7000);
const timeout = setTimeout(() => { result.timedOut = true; context.close().catch(() => {}); }, baseline ? 60000 : 180000);
const diagnosticFor = harbor => ({ context: 'ui2-test-cluster', namespace: harbor?.namespaces[0] || '', dataSource: 'test-replay', readOnly: true, serverReadOnly: true, managementEnabled: false, managementAvailable: false,
  identity, credentialGeneration: 'test-generation-1', authorizationKey: 'test-readonly', checks: { api: { status: 'ok' }, configuration: { status: 'ok' }, discovery: { status: 'ok' },
    permissions: { nodes: { status: 'ok' }, pods: { status: 'ok' }, namespaces: { status: 'ok' } }, metrics: { status: 'unavailable' }, hubble: { status: 'unavailable' } } });
const scoped = harbor => [...nodes, ...livePods.filter(pod => harbor?.namespaces.includes(pod.metadata.namespace)), ...namespaces.filter(namespace => harbor?.namespaces.includes(namespace.metadata.name))];
await page.route('**/api/**', async route => {
  const request = route.request(), url = new URL(request.url()), pathname = url.pathname, method = request.method();
  const harbor = workspace.harbors.find(item => item.id === url.searchParams.get('harborId'));
  const reply = (json, status = 200) => route.fulfill({ status, json });
  if (pathname === '/api/workspace' && method === 'GET') return reply(workspace);
  if (pathname.startsWith('/api/workspace/harbors/') && method === 'PATCH') {
    const existing = workspace.harbors.find(item => item.id === pathname.split('/').at(-1)), next = request.postDataJSON()?.harbor;
    assert.ok(existing && next?.id === existing.id, 'View writes may only address the two test harbor records');
    assert.deepEqual(next.namespaces, existing.namespaces); existing.view = next.view || {}; workspace.revision++; return reply(workspace);
  }
  if (pathname === '/api/contexts') return reply({ contexts: [{ name: 'ui2-test-cluster' }], current: 'ui2-test-cluster', configured: true, readOnly: true, serverReadOnly: true, dataSource: 'test-replay', sourceLabel: 'TEST/REPLAY — UI 2.0 synthetic fixture' });
  if (pathname === '/api/connection') return reply(diagnosticFor(harbor));
  if (pathname === '/api/management' && method === 'POST' && request.postDataJSON()?.enabled === false) return reply({ readOnly: true, managementEnabled: false });
  if (!['GET', 'HEAD'].includes(method)) { result.prohibitedWrites.push({ path: pathname, method }); return reply({ error: 'UI2 visual fixture is read-only' }, 403); }
  if (pathname === '/api/discovery') return reply({ resources: [
    { group: '', version: 'v1', resource: 'nodes', kind: 'Node', namespaced: false, verbs: ['get', 'list', 'watch'] },
    { group: '', version: 'v1', resource: 'pods', kind: 'Pod', namespaced: true, verbs: ['get', 'list', 'watch'] },
    { group: '', version: 'v1', resource: 'namespaces', kind: 'Namespace', namespaced: false, verbs: ['get', 'list', 'watch'] } ], errors: [] });
  if (pathname === '/api/metrics') return reply({ available: false, source: 'UI2 visual fixture — no measurements', error: 'Ölçüm alınamıyor' });
  if (pathname === '/api/capabilities') return reply({ readOnly: true, verbs: { get: true, list: true, watch: true }, actions: {}, subresources: {} });
  if (pathname === '/api/providers') return reply({ minikube: { available: false, canAdd: false, reason: 'TEST fixture' }, hubble: { available: false, configured: false, reason: 'TEST fixture' } });
  if (pathname === '/api/providers/minikube/workers') return reply({ operations: [] });
  if (pathname === '/api/flows') return reply({ status: 'disabled', flows: [], reason: 'TEST fixture has no traffic measurements' });
  if (pathname === '/api/resources') {
    if (!harbor) return reply({ error: 'Fixture scope required' }, 403);
    const namespace = url.searchParams.get('namespace');
    if (namespace && !harbor.namespaces.includes(namespace)) return reply({ error: 'Fixture namespace forbidden' }, 403);
    const resource = url.searchParams.get('resource'), kind = { nodes: 'Node', pods: 'Pod', namespaces: 'Namespace' }[resource], name = url.searchParams.get('name');
    const items = scoped(harbor).filter(item => !kind || item.kind === kind).filter(item => !namespace || !item.metadata.namespace || item.metadata.namespace === namespace);
    if (name) { const item = items.find(value => value.metadata.name === name); return reply(item || { error: 'Fixture resource not found' }, item ? 200 : 404); }
    return reply({ apiVersion: 'v1', kind: `${kind || 'Resource'}List`, items });
  }
  result.unexpectedAPI.push({ path: pathname, method }); return reply({ error: 'Not implemented in read-only UI2 fixture' }, 404);
});
await page.routeWebSocket('**/ws?**', socket => {
  const url = new URL(socket.url()), harbor = workspace.harbors.find(item => item.id === url.searchParams.get('harborId'));
  assert.ok(harbor, 'WebSocket must carry an explicit test harbor');
  const resources = scoped(harbor); result.scopes.push({ harborId: harbor.id, namespace: harbor.namespaces[0], nodeUIDs: nodes.map(node => node.metadata.uid), podUIDs: resources.filter(item => item.kind === 'Pod').map(item => item.metadata.uid) });
  const envelope = { generation: 'ui2-test-snapshot', sessionGeneration: `ui2-test-session:${harbor.id}`, workspaceId: workspace.id, harborId: harbor.id,
    tabId: url.searchParams.get('tabId'), context: 'ui2-test-cluster' };
  testSockets.set(harbor.id, { socket, envelope });
  socket.send(JSON.stringify({ ...envelope, type: 'SNAPSHOT', resources, timestamp: new Date().toISOString(), synced: true, upstream: true, errors: [] }));
});
await page.addInitScript(() => {
  // Initial input preference only. No canonical state, camera or renderer mutation.
  if (!localStorage.getItem('kubeview.preferences.v1')) localStorage.setItem('kubeview.preferences.v1', JSON.stringify({ version: 1, quality: 'medium', theme: 'light', motionPreference: 'full' }));
});
page.on('pageerror', error => result.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text().slice(0, 500)); });
const capture = async name => { const file = `${name}.png`; await page.screenshot({ path: path.join(out, file) }); result.screenshots.push(file); };
const state = () => page.locator('canvas').evaluate(canvas => {
  const api = canvas.__harbor, gl = api.stats(), ocean = api.scene.getObjectByName('harbor:ocean'), uniforms = ocean?.material.userData.oceanUniforms;
  let r3f = api.scene.__r3f?.root?.getState?.();
  const geometries = new Set(), materials = new Set(), wakes = [];
  api.scene.traverse(object => { r3f ||= object.__r3f?.root?.getState?.(); if (object.geometry) geometries.add(object.geometry.uuid); for (const material of (Array.isArray(object.material) ? object.material : [object.material])) if (material) materials.add(material.uuid);
    if (object.name === 'harbor:vessel-wake') wakes.push({ visible: object.visible, opacity: object.material.uniforms?.uOpacity?.value, time: object.material.uniforms?.uTime?.value }); });
  const rect = canvas.getBoundingClientRect();
  return { rect: [rect.x, rect.y, rect.width, rect.height], viewport: [innerWidth, innerHeight], canvasCount: document.querySelectorAll('canvas').length,
    camera: api.camera.position.toArray(), target: r3f?.controls?.target.toArray(), quaternion: api.camera.quaternion.toArray(), zoom: api.camera.zoom,
    fleet: api.fleetStates(), water: uniforms && Object.fromEntries(Object.entries(uniforms).filter(([, uniform]) => typeof uniform.value === 'number').map(([key, uniform]) => [key, uniform.value])),
    wakes, render: gl, geometries: geometries.size, materials: materials.size, preferences: JSON.parse(localStorage.getItem('kubeview.preferences.v1')) };
});
const delta = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
const checkSameCamera = (a, b) => { assert.ok(delta(a.camera, b.camera) < 1e-5, `Camera moved: ${JSON.stringify({before:a.camera,after:b.camera})}`); assert.ok(delta(a.quaternion, b.quaternion) < 1e-5); assert.equal(a.zoom, b.zoom); };
const settings = async () => { await page.getByRole('button', { name: 'Görünüm ve ayarlar', exact: true }).click(); await expect(page.getByRole('dialog', { name: 'Görünüm ve ayarlar', exact: true })).toBeVisible(); };
const closeSettings = () => page.getByRole('dialog', { name: 'Görünüm ve ayarlar', exact: true }).getByRole('button', { name: 'Pencereyi kapat', exact: true }).click();
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('kubeview.preferences.v1')));
async function pick(match) {
  let point;
  await expect.poll(async () => { point = await page.locator('canvas').evaluate((canvas, match) => canvas.__harbor.projectTargets(match).find(target => target.visible), match); return !!point; }).toBe(true);
  await page.mouse.click(point.x, point.y); return point;
}
async function selectHarbor(id) {
  const harbor = workspace.harbors.find(item => item.id === id);
  await closePanels(page);
  await page.getByRole('button', { name: `${harbor.name} — limanı aç`, exact: true }).click();
  await expect(page.locator('.world-cluster-name')).toContainText(harbor.name);
  await closePanels(page); // Nameplate intentionally opens the connection window.
  await settleCamera();
}
const scopedVessel = (harborId, uid) => page.locator('canvas').evaluate((canvas, { harborId, uid }) => {
  const scene = canvas.__harbor.scene;
  scene.updateMatrixWorld(true);
  let scope;
  scene.traverse(object => { if (object.userData?.harborId === harborId && (object.name === 'workspace:active-harbor' || object.name === `workspace:nearby-harbor:${harborId}`)) scope = object; });
  const vessel = scope?.getObjectByName(`node:${uid}`);
  if (!vessel) return null;
  const matrix = [...vessel.matrixWorld.elements];
  return { harborId, uid, matrix, position: matrix.slice(12, 15), nearby: scope.name.startsWith('workspace:nearby-harbor:') };
}, { harborId, uid });
function fixtureEvent(harborId, action, object) {
  const transport = testSockets.get(harborId); assert.ok(transport, 'Test event requires that exact scoped WebSocket');
  transport.socket.send(JSON.stringify({ ...transport.envelope, type: 'RESOURCE_EVENT', action, object, timestamp: new Date().toISOString() }));
  result.streamEvents.push({ source: 'synthetic WebSocket replay, not Kubernetes E2E', harborId, action, uid: object.metadata.uid, namespace: object.metadata.namespace, resourceVersion: object.metadata.resourceVersion, at: new Date().toISOString() });
}
async function settleCamera() {
  let previous, stable = 0;
  await expect.poll(async () => { const next = await state(); stable = previous && delta(next.camera, previous.camera) < 1e-5 && delta(next.quaternion, previous.quaternion) < 1e-6 ? stable + 1 : 0; previous = next; return stable; }, { timeout: 5000, intervals: [100] }).toBeGreaterThanOrEqual(3);
}
async function drawSample(milliseconds = 2500) {
  return page.locator('canvas').evaluate(async (canvas, duration) => {
    const start = performance.now(), intervals = []; let last = null, priorFrame = canvas.__harbor.stats().frame, draws = 0;
    await new Promise(resolve => { const sample = now => { const frame = canvas.__harbor.stats().frame; if (frame !== priorFrame) { draws += frame - priorFrame; if (last != null) intervals.push(now - last); last = now; priorFrame = frame; } if (now - start >= duration) resolve(); else requestAnimationFrame(sample); }; requestAnimationFrame(sample); });
    intervals.sort((a, b) => a - b); const elapsed = performance.now() - start;
    return { elapsedMs: elapsed, jsDraws: draws, jsDrawsPerSecond: draws * 1000 / elapsed, p95RafObservedDrawIntervalMs: intervals[Math.floor(intervals.length * .95)] ?? null,
      p99RafObservedDrawIntervalMs: intervals[Math.floor(intervals.length * .99)] ?? null, stats: canvas.__harbor.stats(), videoEnabled: true };
  }, milliseconds);
}
try {
  const navigation = await page.goto(origin.origin, { timeout: 20000 }); assert.equal(navigation.status(), 200); result.indexSHA256 = hash(await navigation.body());
  await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats()?.lifecycle?.canonicalNodes === 2, null, { timeout: 20000 });
  await expect(page.locator('.world-replay-badge')).toBeVisible(); await expect(page.locator('.world-cluster-name')).toContainText('Namespace A');
  await page.waitForTimeout(1200); await settleCamera(); const originalCanvas = await page.locator('canvas').elementHandle(); const initial = await state();
  assert.deepEqual(initial.rect, [0, 0, 1672, 941]); assert.equal(initial.canvasCount, 1); assert.equal(await page.locator('[role="dialog"]').count(), 0);
  assert.ok(initial.render.calls > 0 && initial.render.triangles > 0, 'The scene must actually draw, not only populate canonical state');
  assert.ok([...initial.camera, ...initial.target].every(value => Number.isFinite(value) && Math.abs(value) < 10000), 'Two-port camera framing left the bounded visible harbor world');
  record('normal-startup-full-viewport-with-no-dashboard', { state: initial }); await capture('01-world-reference');
  result.movingDrawDiagnostic = await drawSample(); result.movingEnd = await state(); await capture('02-world-moving');
  assert.ok(result.movingEnd.water.uWaterTime > initial.water.uWaterTime, 'The shared sea clock must advance with sea enabled');
  assert.notDeepEqual(result.movingEnd.fleet, initial.fleet, 'The fleet must move while enabled');
  record('visible-motion-progress', { fromWaterTime: initial.water.uWaterTime, toWaterTime: result.movingEnd.water.uWaterTime, fleet: result.movingEnd.fleet });
  if (baseline) { result.status = 'BASELINE_CAPTURED'; }
  else if (process.env.KV_UI2_FACILITY_ONLY === '1') {
    for (const side of ['a', 'b']) {
      const harborId = `ui2-harbor-${side}`;
      await pick({ type: 'facility', id: 'center', harborId });
      await expect(page.getByRole('dialog', { name: 'Liman Yönetim Merkezi', exact: true })).toBeVisible();
      await expect(page.locator('.world-cluster-name')).toContainText(`Namespace ${side.toUpperCase()}`);
      await page.getByRole('button', { name: 'Yaklaş', exact: true }).click(); await settleCamera();
      const current = await state();
      const facility = await page.locator('canvas').evaluate(canvas => {
        const object = canvas.__harbor.scene.getObjectByName('workspace:active-harbor').getObjectByName('facility:center');
        return object.getWorldPosition(canvas.__harbor.camera.position.clone()).toArray();
      });
      assert.ok(Math.hypot(current.target[0] - facility[0], current.target[2] - facility[2]) < 30, 'Focus must address the active harbor center, not the same facility in the neighboring harbor');
      record(`facility-${side}-physical-click-and-scoped-focus`, { target: current.target, facility });
      await capture(`facility-${side}-focus`); await closePanels(page);
      await page.getByRole('button', { name: 'Limana dön', exact: true }).click(); await settleCamera();
    }
    assert.equal(result.errors.length, 0); assert.equal(result.consoleErrors.length, 0); result.status = 'PASS';
  }
  else {
    await settings(); const settingsCamera = await state(); await capture('03-settings');
    await page.getByLabel('Deniz yüzeyi hareketi', { exact: true }).uncheck();
    await expect.poll(async () => (await state()).water?.uWaterStrength ?? 1).toBeLessThan(.001);
    const seaOff = await state(); await page.waitForTimeout(450); const seaStill = await state();
    assert.equal(seaOff.water.uWaterTime, seaStill.water.uWaterTime); assert.ok(seaStill.wakes.every(wake => !wake.visible || !wake.opacity));
    assert.equal(seaStill.preferences.patrol, true); assert.notDeepEqual(seaStill.fleet, seaOff.fleet, 'Fleet must continue with sea off'); checkSameCamera(settingsCamera, seaStill);
    record('sea-off-freezes-water-and-wake-with-independent-fleet', { seaOff, seaStill });
    await page.getByLabel('Güneş yansımaları', { exact: true }).uncheck(); assert.equal((await saved()).sunGlint, false);
    await page.getByLabel('Deniz yüzeyi hareketi', { exact: true }).check();
    await page.getByLabel('Hafif gemi salınımı', { exact: true }).uncheck();
    await page.getByLabel('Gemi izi', { exact: true }).uncheck(); await page.waitForTimeout(250); const noEffects = await state();
    assert.equal(noEffects.preferences.bob, false); assert.equal(noEffects.preferences.wake, false); assert.equal(noEffects.water.uSunGlint, 0); assert.ok(noEffects.wakes.every(wake => !wake.visible || !wake.opacity));
    record('independent-glint-bob-wake-preferences', { state: noEffects }); await capture('04-effects-disabled');
    await page.getByLabel('Gemi devriyesi', { exact: true }).uncheck(); await page.waitForTimeout(800); const stopped = await state(); await page.waitForTimeout(450); const still = await state();
    for (const ship of stopped.fleet) {
      const next = still.fleet.find(item => item.uid === ship.uid); assert.ok(next);
      assert.equal(next.position[0], ship.position[0], 'Patrol-off must preserve the exact horizontal X position');
      assert.equal(next.position[2], ship.position[2], 'Patrol-off must preserve the exact horizontal Z position');
      assert.equal(next.progress, ship.progress, 'Patrol-off must preserve the route phase');
      assert.ok(Math.abs(next.position[1] - ship.position[1]) <= 1e-4, 'Only sub-millimetre residual heave settling is allowed after bob is disabled');
    }
    assert.ok(still.water.uWaterTime > stopped.water.uWaterTime); record('patrol-off-keeps-water-live', { stopped, still });
    for (const label of ['Güneş yansımaları', 'Hafif gemi salınımı', 'Gemi izi', 'Gemi devriyesi']) await page.getByLabel(label, { exact: true }).check();
    await page.getByRole('button', { name: 'Görsel hareketi duraklat', exact: true }).click(); await page.waitForTimeout(900);
    const paused = await state(); await page.waitForTimeout(350); const pausedLater = await state(); assert.equal(paused.water.uWaterTime, pausedLater.water.uWaterTime); assert.deepEqual(paused.fleet, pausedLater.fleet);
    record('global-pause-freezes-visual-state', { state: pausedLater }); await page.getByRole('button', { name: 'Görsel hareketi sürdür', exact: true }).click();
    await page.getByLabel('Hareket tercihi', { exact: true }).selectOption('reduced'); await expect(page.locator('.motion-preference-status')).toContainText('Hareket azaltma etkin'); await page.waitForTimeout(500);
    const reduced = await state(); await page.waitForTimeout(300); const reducedLater = await state(); assert.equal(reduced.water.uWaterTime, reducedLater.water.uWaterTime); assert.deepEqual(reduced.fleet, reducedLater.fleet);
    record('reduced-motion-keeps-state-and-disables-decoration', { state: reducedLater }); await capture('05-reduced-motion');
    await closeSettings();
    const node = nodes[0]; record('physical-node-click', { target: await pick({ type: 'node', uid: node.metadata.uid, harborId: 'ui2-harbor-a' }) });
    await expect(page.locator('.resource-details h2')).toHaveText(node.metadata.name); await capture('06-node-panel'); await closePanels(page);
    record('physical-container-click', { target: await pick({ type: 'container', uid: pods[0].metadata.uid, containerName: 'metrics' }) });
    await expect(page.locator('.resource-details h2')).toHaveText('metrics'); await expect(page.locator('.resource-details')).toContainText(pods[0].metadata.name); await expect(page.locator('.resource-details')).toContainText(pods[0].metadata.namespace); await capture('07-pod-container-panel');
    await closePanels(page); const same = await page.locator('canvas').evaluate((canvas, original) => canvas === original, originalCanvas); assert.equal(same, true);
    record('panel-open-close-retains-canvas');

    // Isolate horizontal patrol from legitimate water-driven heave/roll using
    // normal preferences, then exercise per-harbor pause through the Node panel.
    await settings(); await page.getByLabel('Hareket tercihi', { exact: true }).selectOption('full');
    await page.getByLabel('Deniz yüzeyi hareketi', { exact: true }).uncheck();
    await page.getByLabel('Hafif gemi salınımı', { exact: true }).uncheck(); await closeSettings(); await page.waitForTimeout(900);
    await pick({ type: 'node', uid: nodes[0].metadata.uid, harborId: 'ui2-harbor-a' });
    await page.locator('.resource-motion-controls summary').click();
    await page.getByRole('button', { name: 'Görsel devriyeyi duraklat', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Görsel devriyeyi sürdür', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(900); const pausedA = await scopedVessel('ui2-harbor-a', nodes[0].metadata.uid); assert.ok(pausedA);
    await selectHarbor('ui2-harbor-b'); await page.waitForTimeout(250);
    const neighboringA = await scopedVessel('ui2-harbor-a', nodes[0].metadata.uid), movingB = await scopedVessel('ui2-harbor-b', nodes[0].metadata.uid);
    assert.ok(neighboringA?.nearby && movingB && !movingB.nearby);
    assert.ok(delta(pausedA.matrix, neighboringA.matrix) < 1e-5, 'Paused A vessel jumped when it became a neighboring harbor');
    await page.waitForTimeout(400); const neighboringALater = await scopedVessel('ui2-harbor-a', nodes[0].metadata.uid), movingBLater = await scopedVessel('ui2-harbor-b', nodes[0].metadata.uid);
    assert.ok(delta(neighboringA.matrix, neighboringALater.matrix) < 1e-5, 'Paused A vessel moved while B was active');
    assert.ok(delta(movingB.position, movingBLater.position) > .01, 'B visual motion must remain independent from A pause');
    record('paused-node-pose-survives-active-to-nearby-transition', { pausedA, neighboringA, neighboringALater, movingB, movingBLater });
    await selectHarbor('ui2-harbor-a'); await pick({ type: 'node', uid: nodes[0].metadata.uid, harborId: 'ui2-harbor-a' });
    const motionDetails = page.locator('.resource-motion-controls'); if ((await motionDetails.getAttribute('open')) === null) await motionDetails.locator('summary').click();
    await expect(page.getByRole('button', { name: 'Görsel devriyeyi sürdür', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Görsel devriyeyi sürdür', exact: true }).click(); await closePanels(page);
    record('return-to-harbor-keeps-paused-button-state-and-normal-resume');
    await settings(); await page.getByLabel('Deniz yüzeyi hareketi', { exact: true }).check(); await page.getByLabel('Hafif gemi salınımı', { exact: true }).check(); await closeSettings();

    // Click an actual container mesh in the neighboring scope, not its caption.
    record('physical-neighbor-container-click', { target: await pick({ type: 'container', uid: pods[1].metadata.uid, containerName: 'metrics', harborId: 'ui2-harbor-b' }) });
    await expect(page.locator('.world-cluster-name')).toContainText('Namespace B'); await page.waitForTimeout(300);
    await expect(page.locator('.resource-details h2')).toHaveText('metrics');
    await expect(page.locator('.details-container-parent')).toContainText(pods[1].metadata.name);
    await expect(page.locator('.details-scope')).toContainText('namespace-b');
    await page.locator('.details-tabs').getByRole('button', { name: 'Özet', exact: true }).click(); await expect(page.locator('.resource-details')).toContainText(pods[1].metadata.uid);
    assert.equal((await state()).render.lifecycle.canonicalNodes, 2); await capture('08-neighbor-scope'); record('neighbor-harbor-click-activates-correct-scoped-resources');
    await closePanels(page); await page.getByRole('button', { name: 'Bul', exact: true }).click(); const input = page.getByLabel('Nesne veya kaynak ara', { exact: true });
    await input.fill('workload-a'); assert.equal(await page.locator('.finder-result').count(), 0);
    await input.fill('workload-b'); await expect(page.locator('.finder-result')).toHaveCount(1);
    record('neighbor-finder-exposes-only-its-scoped-pod');
    await input.fill('workload'); await settleCamera(); const beforeInput = await state(); await input.press('ArrowLeft'); await input.press('ArrowLeft'); await page.waitForTimeout(150);
    assert.equal(await input.evaluate(element => element.selectionStart), 6); checkSameCamera(beforeInput, await state());
    record('textbox-arrow-keys-preserve-native-caret-and-camera'); await input.press('Escape');
    const canvas = page.locator('canvas'); await canvas.focus(); const beforeArrow = await state(); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(160); await page.keyboard.up('ArrowRight'); const afterArrow = await state();
    assert.ok(delta(afterArrow.camera, beforeArrow.camera) > .01); assert.ok(Math.abs(afterArrow.camera[1] - beforeArrow.camera[1]) < 1e-9, 'Arrow pan must preserve height (floating point tolerance only)'); assert.ok(delta(afterArrow.quaternion, beforeArrow.quaternion) < 1e-6);
    const dc = afterArrow.camera.map((v, i) => v - beforeArrow.camera[i]), dt = afterArrow.target.map((v, i) => v - beforeArrow.target[i]); assert.ok(delta(dc, dt) < 1e-5);
    await page.waitForTimeout(150); checkSameCamera(afterArrow, await state()); record('focused-arrow-translates-camera-and-target-horizontally-then-stops', { cameraDelta: dc, targetDelta: dt });
    await settings(); await page.getByLabel('Hareket tercihi', { exact: true }).selectOption('full'); await page.getByLabel('Güneş yansımaları', { exact: true }).uncheck(); await closeSettings();
    await page.reload({ timeout: 20000 }); await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats()?.lifecycle?.canonicalNodes === 2); await settings();
    await expect(page.getByLabel('Güneş yansımaları', { exact: true })).not.toBeChecked(); await expect(page.getByLabel('Gemi devriyesi', { exact: true })).toBeChecked(); record('visual-preferences-survive-reload-without-changing-resource-scope');
    await page.getByLabel('Güneş yansımaları', { exact: true }).check(); await closeSettings(); await capture('09-world-restored');
    for (const [width, height] of [[1440, 900], [1280, 800], [768, 900]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(250); const resized = await state(); assert.deepEqual(resized.rect, [0, 0, width, height]);
      await capture(`10-world-${width}`); record(`fullscreen-${width}`, { rect: resized.rect });
    }
    await page.setViewportSize({ width: 1672, height: 941 }); await selectHarbor('ui2-harbor-b');
    await settings(); await page.getByLabel('Hareket tercihi', { exact: true }).selectOption('reduced'); await closeSettings();
    await pick({ type: 'container', uid: pods[1].metadata.uid, containerName: 'metrics', harborId: 'ui2-harbor-b' });
    const removed = { ...pods[1], metadata: { ...pods[1].metadata, resourceVersion: 'test-rv-deleted' } };
    livePods = livePods.filter(pod => pod.metadata.uid !== removed.metadata.uid); fixtureEvent('ui2-harbor-b', 'DELETE', removed);
    await expect(page.locator('.resource-details')).toContainText('Bu kaynak silindi');
    await expect.poll(async () => (await state()).render.lifecycle.canonicalPods).toBe(0); fixtureEvent('ui2-harbor-b', 'DELETE', removed);
    await page.waitForTimeout(200); assert.equal((await state()).render.lifecycle.canonicalNodes, 2); assert.equal((await state()).render.lifecycle.canonicalPods, 0);
    await capture('11-selected-B-deleted'); record('scoped-delete-and-duplicate-remove-only-B-pod-and-preserve-node-count');
    const replacement = { ...pods[1], metadata: { ...pods[1].metadata, uid: 'ui2-test-pod-b-replacement', resourceVersion: 'test-rv-replacement' } };
    livePods.push(replacement); fixtureEvent('ui2-harbor-b', 'ADD', replacement);
    await expect.poll(async () => (await state()).render.lifecycle.canonicalPods).toBe(1);
    await expect(page.locator('.resource-details')).toContainText('Bu kaynak silindi');
    await page.locator('.details-tabs').getByRole('button', { name: 'Özet', exact: true }).click(); await expect(page.locator('.resource-details')).toContainText(pods[1].metadata.uid);
    record('same-name-new-UID-does-not-retarget-deleted-selection');
    await selectHarbor('ui2-harbor-a'); assert.equal((await state()).render.lifecycle.canonicalPods, 1);
    await pick({ type: 'container', uid: pods[0].metadata.uid, containerName: 'metrics', harborId: 'ui2-harbor-a' });
    await expect(page.locator('.resource-details h2')).toHaveText('metrics'); await expect(page.locator('.details-container-parent')).toContainText(pods[0].metadata.name);
    assert.equal(await page.locator('.resource-details').getByText('Bu kaynak silindi', { exact: false }).count(), 0);
    record('A-pod-remains-selectable-after-B-delete-and-replacement'); await closePanels(page);
    await settings(); await page.getByLabel('Hareket tercihi', { exact: true }).selectOption('full'); await closeSettings(); await capture('12-restored-world-after-replay');
    assert.equal(result.prohibitedWrites.length, 0); assert.equal(result.errors.length, 0); assert.equal(result.consoleErrors.length, 0);
    result.status = 'PASS';
  }
} catch (error) {
  result.status = 'FAIL'; result.failure = { message: error.message, stack: error.stack }; await capture('failure').catch(() => {}); process.exitCode = 1;
} finally {
  clearTimeout(timeout); result.finishedAt = new Date().toISOString(); result.browserVersion = browser.version();
  await page.keyboard.up('ArrowRight').catch(() => {}); await context.close(); await browser.close();
  await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ id, status: result.status, checks: result.checks.length, output: out, failure: result.failure?.message }));
}
