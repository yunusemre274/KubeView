// Finite normal-user manual07 functional acceptance; no Kubernetes, benchmark
// controller, response mock, product-state injection or performance measurement.
import { chromium, webkit, expect } from '@playwright/test';
import { findResource } from './v11-ui.helpers.js';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bundle = process.env.KV_MANUAL_BUNDLE || '', stateDir = process.env.KV_MANUAL_STATE || '';
assert.ok(path.isAbsolute(bundle) && path.isAbsolute(stateDir), 'Explicit absolute normal-user bundle and state required');
const profile = '07-yuk-ve-gecis', origin = 'http://127.0.0.1:19707';
const runner = path.join(bundle, 'scripts/manual-lab.sh'), binary = path.join(bundle, 'kubeview');
const id = process.env.KV_EVIDENCE_ID || `workspace-replay-profiles-${Date.now()}`; assert.match(id, /^[\w.-]+$/);
const out = path.join(root, 'artifacts/workspace', id); await mkdir(out, { recursive: false });
const hash = (value) => createHash('sha256').update(value).digest('hex');
const expectedBinary = 'ce72f9ddd776764572198111625da75264468452f58efc22dd21f30b5637d9a4';
assert.equal(hash(await readFile(binary)), expectedBinary, 'Expected frozen v06 binary required');
const before = JSON.parse(await readFile(path.join(stateDir, 'lab.json'), 'utf8'));
assert.equal(before.labId, 'kvml-ccdfe731dabd'); assert.equal(before.basePort, 19700); assert.notEqual(before.telemetry?.enabled, true);
const immutableClusters = JSON.stringify(before.clusters);
const allDefinitions = [
  ...['M', 'L'].flatMap((load) => [1, 5, 10, 20].map((harbors) => ({ load, harbors, engine: 'chromium', motion: 'no-preference', width: 1440, height: 900 }))),
  { load: 'M', harbors: 5, engine: 'webkit', motion: 'no-preference', width: 1440, height: 900 },
  { load: 'L', harbors: 20, engine: 'webkit', motion: 'reduce', width: 1280, height: 800, narrow: true },
];
const onlyCase = process.env.KV_ONLY_CASE || '';
const definitions = onlyCase ? allDefinitions.filter((item) => `${item.engine}-${item.load}-h${item.harbors}` === onlyCase) : allDefinitions;
assert.ok(!onlyCase || definitions.length === 1, 'Optional case selection must name one existing functional case');
const exec = promisify(execFile), globalDeadline = Date.now() + 600000;
let caseDeadline = globalDeadline - 20000, browser, context, page, current, caseTimer;
const result = { id, startedAt: new Date().toISOString(), status: 'running', binarySHA256: expectedBinary,
  sourceBefore: '', cases: [], runnerCommands: [], limits: [
    'TEST/REPLAY is synthetic; no real Kubernetes, Hubble or fault proof.',
    'No CPU, FPS, physical latency, native Safari or old acceptance-gate claim.',
    'Only official manual07 up/app/down; normal-user variant files remain preserved.',
    'WebKit cases are functional compatibility checks, not native Safari or performance.',
    'No credential, raw log, nonce, HTTP headers or full workspace document is recorded.',
  ] };
async function manifest(base) {
  const walk = async (directory) => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : entry.isFile() ? [path.join(directory, entry.name)] : []))).flat();
  return hash((await Promise.all((await walk(base)).sort().map(async (file) => `${hash(await readFile(file))}  ${path.relative(root, file)}`))).join('\n'));
}
result.sourceBefore = await manifest(path.join(root, 'frontend/src'));
assert.equal(result.sourceBefore, 'ee974b3b1367777c967ff3cc38d1ffd4853c87ff39e060d6280b65a16194e559');
result.runnerSHA256Before = hash(await readFile(path.join(bundle, 'scripts/manual_lab.py')));
const remaining = (cap = 10000) => { const ms = Math.min(cap, caseDeadline - Date.now(), globalDeadline - Date.now()); assert.ok(ms > 0, 'Finite case/global deadline exhausted'); return ms; };
async function command(name, definition) {
  const args = ['--state-dir', stateDir, name, '--profile', profile];
  if (name === 'app') args.push('--replay', definition.load, '--harbors', String(definition.harbors));
  const started = Date.now(), record = { name, profile, ...(definition ? { variant: `${definition.load}-h${String(definition.harbors).padStart(2, '0')}` } : {}) };
  result.runnerCommands.push(record);
  try { await exec(runner, args, { cwd: '/tmp', timeout: remaining(name === 'app' ? 30000 : 18000), maxBuffer: 256 * 1024 }); record.exitCode = 0; }
  catch (error) { record.exitCode = error.code; record.signal = error.signal; record.stderrSHA256 = hash(error.stderr || ''); throw Error(`Official manual07 ${name} failed; exit=${error.code ?? 'unknown'}, signal=${error.signal || 'none'}`); }
  finally { record.durationMs = Date.now() - started; }
}
async function publicJSON(route) { const response = await page.request.get(`${origin}${route}`, { timeout: remaining() }); assert.equal(response.status(), 200, `Public ${route} GET failed`); return response.json(); }
const check = (name, detail) => current.checks.push({ name, detail });
async function capture(name) { const file = `${current.name}-${name}.png`; await page.screenshot({ path: path.join(out, file), timeout: remaining(), mask: [page.getByLabel('Container log çıktısı', { exact: true }), page.getByLabel('Kaynak YAML', { exact: true })] }); current.screenshots.push(file); }
async function poll(read, accept, cap = 8000) {
  const deadline = Date.now() + remaining(cap);
  do { const value = await read(); if (accept(value)) return value; await page.waitForTimeout(100); } while (Date.now() < deadline);
  throw Error('Bounded functional observation did not reach the required condition');
}
async function world() {
  return page.locator('canvas').evaluate((canvas) => {
    const harbor = canvas.__harbor, rect = canvas.getBoundingClientRect(), active = harbor.scene.getObjectByName('workspace:active-harbor');
    return { count: document.querySelectorAll('canvas').length, width: rect.width, height: rect.height, viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, canvasPixels: [canvas.width, canvas.height], bodyWidth: document.body.scrollWidth,
      bodyHeight: document.body.scrollHeight, counts: harbor.stats().lifecycle, camera: harbor.camera.position.toArray(), quaternion: harbor.camera.quaternion.toArray(),
      activePosition: active ? [active.position.x, active.position.z] : null, source: harbor.visualLifecycleState?.()?.source };
  });
}
async function ready(definition) {
  const nodes = definition.load === 'M' ? 20 : 50, pods = definition.load === 'M' ? 300 : 1500, visiblePods = definition.load === 'M' ? 120 : 270;
  const expectedViewport = page.viewportSize();
  await page.waitForFunction(({ nodes, pods, visiblePods, expectedViewport }) => {
    const canvas = document.querySelector('canvas'), counts = canvas?.__harbor?.stats?.()?.lifecycle, rect = canvas?.getBoundingClientRect();
    return counts?.canonicalNodes === nodes && counts.canonicalPods === pods && counts.visibleNodes === 8 && counts.visiblePods === visiblePods &&
      innerWidth === expectedViewport.width && innerHeight === expectedViewport.height && rect.width === expectedViewport.width && rect.height === expectedViewport.height &&
      canvas.width === expectedViewport.width && canvas.height === expectedViewport.height && /Canlı/.test(document.querySelector('.world-brand-control')?.textContent || '');
  }, { nodes, pods, visiblePods, expectedViewport }, { timeout: remaining(15000) });
  await expect(page.locator('.world-replay-badge')).toContainText('TEST/REPLAY', { timeout: remaining() });
  const value = await world(); current.lastWorldGeometry = { width: value.width, height: value.height, viewport: value.viewport, dpr: value.dpr, canvasPixels: value.canvasPixels };
  assert.equal(value.count, 1); assert.deepEqual([value.width, value.height], value.viewport);
  assert.equal(value.dpr, 1); assert.deepEqual(value.canvasPixels, value.viewport, 'Canvas render resolution must match the full DPR1 viewport');
  assert.ok(value.bodyHeight <= value.viewport[1] + 1 && value.bodyWidth <= value.viewport[0] + 1, 'World caused document overflow');
  return value;
}
async function settled(harbor) {
  let previous, stable = 0;
  const value = await poll(async () => {
    const value = await world(), vector = [...value.camera, ...value.quaternion];
    const same = previous && vector.every((n, index) => Math.abs(n - previous[index]) < 1e-5);
    stable = same ? stable + 1 : 0; previous = vector;
    return { value, stable };
  }, ({ value, stable }) => stable >= 3 && value.activePosition?.every((n, index) => Math.abs(n - harbor.position[index]) < .001), 9000);
  const target = await page.locator('canvas').evaluate((canvas) => canvas.__harbor.projectTargets({ type: 'node' }).find((item) => item.visible));
  assert.ok(target?.uid, 'Settled active harbor must show an actual projected Node');
  return { value: value.value, target };
}
async function map() { await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click(); await expect(page.locator('.workspace-window')).toBeVisible(); }
async function selectHarbor(harbor, definition) {
  await map(); await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await page.locator('.workspace-window').waitFor({ state: 'detached', timeout: remaining() });
  await expect(page.locator('.world-cluster-name')).toContainText(harbor.name); await ready(definition);
}
async function themeAndAccess(definition) {
  await page.getByRole('button', { name: 'Görünüm ve ayarlar', exact: true }).click();
  const preferences = page.getByRole('dialog', { name: 'Görünüm ve ayarlar', exact: true });
  await preferences.getByLabel('Panel teması', { exact: true }).selectOption(definition.narrow ? 'dark' : 'light');
  await preferences.getByLabel('Hareket tercihi', { exact: true }).selectOption('system');
  if (definition.motion === 'reduce') await expect(preferences).toContainText('Hareket azaltma etkin');
  await preferences.getByLabel('Panel teması', { exact: true }).press('Escape'); await preferences.waitFor({ state: 'detached' });
  if (definition.engine !== 'webkit') return;
  for (const width of definition.narrow ? [1280, 768] : [1440]) {
    await page.setViewportSize({ width, height: definition.narrow ? (width === 1280 ? 800 : 900) : 900 }); await ready(definition);
    const trigger = page.getByRole('button', { name: 'Bul', exact: true }); await trigger.press('Enter');
    const finder = page.getByRole('dialog', { name: 'Dünyada bul', exact: true }), input = finder.getByLabel('Nesne veya kaynak ara', { exact: true });
    await expect(input).toBeFocused(); await input.fill('native-caret'); await input.press('ArrowLeft'); await input.press('ArrowLeft');
    assert.equal(await input.evaluate((element) => element.selectionStart), 10); await input.press('Escape'); await finder.waitFor({ state: 'detached' }); await expect(trigger).toBeFocused();
    await map(); await expect(page.locator('.workspace-port-select')).toHaveCount(definition.harbors);
    const windowRect = await page.locator('.workspace-window').boundingBox(); assert.ok(windowRect.x >= -1 && windowRect.x + windowRect.width <= width + 1, 'Workspace window extends beyond viewport');
    await capture(`${width}-map-access`); await page.getByRole('button', { name: 'Pencereyi kapat', exact: true }).press('Escape'); await page.locator('.workspace-window').waitFor({ state: 'detached' });
    check('webkit-native-caret-focus-escape-and-map-access', { width, theme: definition.narrow ? 'dark' : 'light', reduced: definition.motion === 'reduce', nativeSafari: false });
  }
}
try {
  await command('up');
  for (const definition of definitions) {
    assert.ok(result.cases.length < 10); caseDeadline = Math.min(Date.now() + 60000, globalDeadline - 20000);
    current = { ...definition, name: `${definition.engine}-${definition.load}-h${definition.harbors}`, startedAt: new Date().toISOString(), status: 'running', checks: [], screenshots: [], errors: [], snapshots: [] }; result.cases.push(current);
    caseTimer = setTimeout(() => { current.timedOut = true; browser?.close().catch(() => {}); }, remaining(60000));
    await command('down', definition); await command('app', definition);
    const state = JSON.parse(await readFile(path.join(stateDir, 'lab.json'), 'utf8')), app = state.processes[profile];
    assert.equal(JSON.stringify(state.clusters), immutableClusters); assert.equal(app.binarySha256, expectedBinary); assert.equal(app.variant, `${definition.load}-h${String(definition.harbors).padStart(2, '0')}`); assert.equal(app.writeOptIn, false);
    browser = await (definition.engine === 'webkit' ? webkit : chromium).launch({ headless: false, timeout: remaining(12000), ...(definition.engine === 'chromium' && process.platform === 'darwin' ? { args: ['--use-angle=metal'] } : {}) });
    current.browserVersion = browser.version(); context = await browser.newContext({ viewport: { width: definition.width, height: definition.height }, deviceScaleFactor: 1, reducedMotion: definition.motion, colorScheme: definition.narrow ? 'dark' : 'light' }); page = await context.newPage(); page.setDefaultTimeout(5000);
    const writes = [], readOnlyResets = [], snapshots = [], nodesByUID = new Map(); current.prohibitedWrites = writes; current.readOnlyResets = readOnlyResets;
    page.on('pageerror', (error) => current.errors.push(error.message.replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 200)));
    page.on('request', (request) => {
      const url = new URL(request.url()), pathname = url.pathname;
      if (['GET', 'HEAD'].includes(request.method())) return;
      if (pathname === '/api/management') {
        const enabled = request.postDataJSON()?.enabled;
        (enabled === false ? readOnlyResets : writes).push({ path: pathname, method: request.method(), enabled, harborId: url.searchParams.get('harborId') });
      } else if (['/api/resources', '/api/actions', '/api/replay/scenario'].includes(pathname)) writes.push({ path: pathname, method: request.method() });
    });
    page.on('websocket', (socket) => socket.on('framereceived', ({ payload }) => {
      try { const data = JSON.parse(String(payload)); if (data.type !== 'SNAPSHOT') return; const resources = Array.isArray(data.resources) ? data.resources : Object.values(data.resources || {}), nodes = resources.filter((item) => item.kind === 'Node');
        nodes.forEach((node) => nodesByUID.set(node.metadata.uid, { uid: node.metadata.uid, name: node.metadata.name })); snapshots.push({ nodes: nodes.length, pods: resources.filter((item) => item.kind === 'Pod').length, harborId: data.harborId });
      } catch { /* Other frames do not count as a snapshot. */ }
    }));
    await page.goto(origin, { timeout: remaining(15000) }); const initial = await ready(definition), workspace = await publicJSON('/api/workspace');
    assert.equal(workspace.harbors.length, definition.harbors); assert.equal(workspace.connections.length, 1); assert.equal(workspace.connections[0].context, `test-replay-${definition.load}`); assert.equal(workspace.connections[0].bound, true);
    assert.ok(workspace.harbors.every((harbor) => harbor.connectionRef === workspace.connections[0].id && harbor.namespaces.length === 4));
    const source = await publicJSON('/api/contexts'); assert.equal(source.dataSource, 'test-replay'); assert.equal(source.serverReadOnly, true); assert.equal(source.managementAvailable, false);
    const replay = await publicJSON('/api/replay/status'); assert.equal(replay.profile, definition.load); assert.equal(replay.dataSource, 'test-replay');
    await poll(async () => snapshots, (items) => items.some((item) => item.nodes === initial.counts.canonicalNodes && item.pods === initial.counts.canonicalPods)); current.snapshots = snapshots;
    check('public-workspace-explicit-replay-snapshot-and-counts', { workspaceId: workspace.id, harborCount: workspace.harbors.length, context: source.current, canonicalNodes: initial.counts.canonicalNodes, canonicalPods: initial.counts.canonicalPods, visibleNodes: initial.counts.visibleNodes, visiblePods: initial.counts.visiblePods, canvasCount: 1, dpr: initial.dpr, canvasPixels: initial.canvasPixels });
    await page.getByRole('button', { name: 'Bağlantı ve cluster kapsamını aç', exact: true }).click();
    const connection = page.getByRole('dialog', { name: 'Bağlantı ve kapsam', exact: true }); await expect(connection).toContainText('Salt okunur'); await expect(connection.getByRole('button', { name: 'Yönetim modunu aç', exact: true })).toBeDisabled(); await connection.getByRole('button', { name: 'Pencereyi kapat', exact: true }).click();
    check('official-runner-and-normal-ui-readonly', { variant: app.variant, serverReadOnly: true, managementDisabled: true });
    await themeAndAccess(definition); await page.getByRole('button', { name: 'Limana dön', exact: true }).click();
    const brand = await page.locator('.world-cluster-name').innerText(), active = workspace.harbors.find((harbor) => brand.startsWith(`${harbor.name} ·`)); assert.ok(active);
    const full = await settled(active), target = nodesByUID.get(full.target.uid); assert.ok(target, 'Visible Node must belong to an actual snapshot');
    const canvas = await page.locator('canvas').elementHandle(), details = await findResource(page, 'Node', target.name, target.uid);
    check('normal-finder-selects-snapshot-exact-uid', target);
    if (definition.harbors > 1) {
      const other = workspace.harbors.find((harbor) => harbor.id !== active.id); await selectHarbor(other, definition); await settled(other);
      const saved = (await publicJSON('/api/workspace')).harbors.find((harbor) => harbor.id === active.id); assert.equal(saved.view?.selection?.uid, target.uid);
      await selectHarbor(active, definition); await expect(details).toContainText(target.uid); await settled(active);
      assert.equal(await page.evaluate((original) => original === document.querySelector('canvas'), canvas), true); check('two-normal-harbor-switches-preserve-exact-uid-and-canvas', { uid: target.uid, activeHarborId: active.id, otherHarborId: other.id, switches: 2 });
    }
    await page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click(); await ready(definition); await capture('final-world');
    assert.equal(writes.length, 0); assert.equal(current.errors.length, 0); current.prohibitedWrites = writes; current.status = 'passed'; current.finishedAt = new Date().toISOString();
    await context.close(); await browser.close(); clearTimeout(caseTimer); context = browser = page = null; await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify({ id, case: current.name, status: current.status, checks: current.checks.length }));
  }
  result.status = 'passed';
} catch (error) {
  result.status = 'failed'; result.failure = String(error.message).replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 1000);
  if (current) { current.status = 'failed'; current.failure = result.failure; current.finishedAt = new Date().toISOString(); if (page) await capture('failure').catch(() => {}); }
  console.log(JSON.stringify({ id, status: 'failed', case: current?.name, failure: result.failure })); process.exitCode = 1;
} finally {
  clearTimeout(caseTimer);
  await context?.close().catch(() => {}); await browser?.close().catch(() => {});
  caseDeadline = globalDeadline;
  try { await command('down'); result.manual07AppStopped = true; } catch { result.manual07AppStopped = false; result.status = 'failed'; process.exitCode = 1; }
  const final = JSON.parse(await readFile(path.join(stateDir, 'lab.json'), 'utf8')); result.clusterRecordsUnchanged = JSON.stringify(final.clusters) === immutableClusters;
  result.manual07AppRecordPresent = Boolean(final.processes[profile]);
  const appData = path.join(stateDir, 'profiles', profile, 'app-data'); result.preservedVariants = (await readdir(appData).catch(() => [])).filter((name) => /^[ML]-h(?:01|05|10|20)$/.test(name)).sort();
  if (!result.clusterRecordsUnchanged || result.manual07AppRecordPresent || (result.status === 'passed' && result.preservedVariants.length !== 8)) { result.status = 'failed'; result.cleanupError = 'Final manual07 stop/preservation/cluster-record guard failed'; process.exitCode = 1; }
  result.sourceAfter = await manifest(path.join(root, 'frontend/src')); result.runnerSHA256After = hash(await readFile(path.join(bundle, 'scripts/manual_lab.py'))); result.binarySHA256After = hash(await readFile(binary)); result.finishedAt = new Date().toISOString();
  await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ id, status: result.status, cases: result.cases.length, passed: result.cases.filter((item) => item.status === 'passed').length, manual07AppStopped: result.manual07AppStopped, sourceUnchanged: result.sourceBefore === result.sourceAfter }));
}
