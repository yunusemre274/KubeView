// Finite normal-user test against an explicitly owned manual02 app. No API mocks,
// credentials, Kubernetes writes, application startup or injected selections.
import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { closePanels as closeBasePanels, findResource, enableManagement } from './v11-ui.helpers.js';

const base = new URL(process.env.KV_RELEASE_URL || 'http://127.0.0.1:19842');
assert.equal(base.hostname, '127.0.0.1'); assert.equal(base.port, '19842');
assert.equal(base.pathname, '/'); assert.equal(base.search, ''); assert.equal(base.hash, '');
const inventory = JSON.parse(await readFile(process.env.KV_RELEASE_INVENTORY, 'utf8'));
assert.equal(inventory.labId, process.env.KV_RELEASE_LAB_ID);
assert.match(inventory.labId, /^kvml-[a-f0-9]{12}$/);
const fixture = inventory.profiles['02-ortak-kume'];
assert.equal(fixture.registeredHarborPlan, 2); assert.equal(fixture.namespaces.length, 2);
assert.equal(inventory.clusters.a.actualNodes.length, 2);
assert.ok(inventory.clusters.a.actualNodes.every(node => node.ready && node.uid));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const binarySHA = sha(await readFile(process.env.KV_RELEASE_BINARY));
assert.equal(binarySHA, process.env.KV_RELEASE_BINARY_SHA);
const engine = process.env.KV_RELEASE_BROWSER || 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const cycles = Number(process.env.KV_RELEASE_CYCLES || 0);
assert.ok(Number.isInteger(cycles) && cycles >= 0 && cycles <= 50);
const viewports = process.env.KV_RELEASE_PHONE_ONLY === '1' ? [[390, 844]] : [[1440, 900], [1280, 800], [768, 900]];
const out = process.env.KV_RELEASE_OUTPUT;
assert.ok(path.isAbsolute(out)); await mkdir(out, { recursive: false });
const browser = await ({ chromium, webkit }[engine]).launch({ headless: false,
  ...(engine === 'chromium' ? { args: ['--use-angle=metal'] } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  ...(!cycles && { recordVideo: { dir: out, size: { width: 1440, height: 900 } } }) });
const page = await context.newPage(); page.setDefaultTimeout(12000);
const result = { source: 'REAL Kubernetes; owned manual02; normal UI/pointer', engine, browser: browser.version(), cycles,
  binarySHA, labId: inventory.labId, clusterUID: inventory.clusters.a.systemUid,
  startedAt: new Date().toISOString(), status: 'IN_PROGRESS', checks: [], errors: [], workspaceDenials: [], screenshots: [],
  limits: ['Functional run; not CPU/FPS/physical latency acceptance.',
    'Projected read-only anchors only guide ordinary pointer clicks; no selection/state injection.'] };
page.on('pageerror', error => result.errors.push(error.message));
page.on('response', async response => {
  const url = new URL(response.url());
  if (!url.pathname.startsWith('/api/workspace') || response.status() < 400) return;
  let nonceFailure = false;
  try { const body = await response.json(); nonceFailure = String(body.error?.message || body.error || '').includes('nonce'); } catch { /* no bodies retained */ }
  result.workspaceDenials.push({ path: url.pathname, status: response.status(), nonceFailure });
});
const check = (name, detail) => result.checks.push({ name, at: new Date().toISOString(), detail });
const state = () => page.locator('canvas').evaluate(canvas => {
  const h = canvas.__harbor, rect = canvas.getBoundingClientRect();
  return { rect: [rect.x, rect.y, rect.width, rect.height], viewport: [innerWidth, innerHeight],
    canvases: document.querySelectorAll('canvas').length, bodyHeight: document.body.scrollHeight,
    centers: h.projectTargets({ type: 'facility', id: 'center' }), stats: h.stats(), camera: h.camera.position.toArray() };
});
async function capture(name) { const file = `${name}.png`; await page.mouse.move(5, 150); await page.screenshot({ path: path.join(out, file) }); result.screenshots.push(file); }
async function closePanels(page) {
  // Nameplate selection may open a modal above a restored resource panel.
  // Close in visible stacking order, without force-clicking through the modal.
  for (let index = 0; index < 4; index++) {
    const close = page.getByRole('button', { name: 'Pencereyi kapat', exact: true }).last();
    if (!(await close.isVisible())) break;
    await close.click();
  }
  await closeBasePanels(page);
}
async function settle() {
  let previous, stable = 0;
  await expect.poll(async () => {
    // Do not rerun the full diagnostic raycast on every stability sample.
    const pose = await page.locator('canvas').evaluate(canvas => canvas.__harbor.camera.position.toArray());
    stable = previous && Math.hypot(...pose.map((v, i) => v - previous[i])) < 1e-5 ? stable + 1 : 0;
    previous = pose; return stable;
  }, { intervals: [100], timeout: 12000 }).toBeGreaterThanOrEqual(3);
}
async function select(harbor) {
  // Select from the normal global map; fitting the active harbor on mobile
  // intentionally puts the neighboring nameplate outside the current view.
  await overview();
  await page.getByRole('button', { name: `${harbor.name} — limanı aç`, exact: true }).click();
  await expect(page.locator('.world-cluster-name')).toContainText(harbor.name);
  await closePanels(page); await settle();
  await expect(page.locator('.world-brand-control')).toContainText('Canlı');
  // A saved desktop camera may project the center behind the phone's HUD.
  // Use the same explicit framing control available to a normal user.
  if (page.viewportSize().width < 560) {
    await page.getByRole('button', { name: 'Limana dön', exact: true }).click();
    await settle();
  }
}
async function overview() {
  await closePanels(page);
  await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await page.getByRole('button', { name: 'Denizi uzaktan gör', exact: true }).click();
  await settle();
}
async function selectFromWindow(harbor) {
  const window = page.locator('.workspace-window');
  await window.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await expect(window).toHaveCount(0);
  await expect(page.locator('.world-cluster-name')).toContainText(harbor.name);
  await expect(page.locator('.world-brand-control')).toContainText('Canlı');
}
async function switchWithOpenPanel(harbor) {
  await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await selectFromWindow(harbor);
}
async function openLogs(harbor, pod) {
  await closePanels(page);
  await findResource(page, 'Pod', pod.name, pod.uid);
  const opening = page.waitForResponse(response => new URL(response.url()).pathname === '/api/logs');
  await page.locator('.details-tabs').getByRole('button', { name: 'Loglar', exact: true }).click();
  const response = await opening, url = new URL(response.url());
  assert.equal(response.status(), 200); assert.equal(url.searchParams.get('uid'), pod.uid);
  assert.equal(url.searchParams.get('namespace'), pod.namespace);
  assert.equal(url.searchParams.get('harborId'), harbor.id);
  assert.equal(response.headers()['x-kubeview-pod-uid'], pod.uid);
  assert.equal(response.headers()['x-kubeview-log-protocol'], 'guarded-text-v1');
  await expect(page.locator('.logs-status')).toContainText('Canlı akış');
}
async function openCreateDraft(harbor, value) {
  await closePanels(page); await settle();
  const point = (await state()).centers.find(t => t.harborId === harbor.id && t.visible); assert.ok(point);
  await page.mouse.click(point.x, point.y);
  await page.locator('.facility-window').getByRole('button', { name: 'Uygulama oluştur', exact: true }).click();
  const form = page.locator('.resource-form-dialog');
  await expect(form.getByLabel('Namespace', { exact: true })).toHaveValue(harbor.namespaces[0]);
  await form.getByLabel('Kaynak adı', { exact: true }).fill(value);
  return form;
}
const timer = setTimeout(() => browser.close().catch(() => {}), cycles ? 900000 : 150000);
try {
  const response = await page.goto(base.origin); assert.equal(response.status(), 200); result.indexSHA = sha(await response.body());
  await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats()?.lifecycle?.canonicalNodes === 2);
  await expect(page.locator('.world-brand-control')).toContainText('Canlı');
  const workspace = await (await page.request.get(`${base.origin}/api/workspace`)).json();
  assert.equal(workspace.harbors.length, 2);
  assert.deepEqual(workspace.harbors.flatMap(h => h.namespaces).sort(), fixture.namespaces.map(n => n.name).sort());
  result.harbors = workspace.harbors.map(({ id, name, namespaces }) => ({ id, name, namespaces }));
  const original = await page.locator('canvas').elementHandle();
  if (cycles) {
    const [a,b] = workspace.harbors, podFor = h => fixture.pods.find(p => p.namespace === h.namespaces[0]);
    const logs = new Map();
    result.logRequests = [];
    page.on('request', request => {
      const url = new URL(request.url()); if (url.pathname !== '/api/logs') return;
      const harbor = workspace.harbors.find(h => h.id === url.searchParams.get('harborId')), pod = harbor && podFor(harbor);
      const entry = { uid: url.searchParams.get('uid'), namespace: url.searchParams.get('namespace'), harborId: url.searchParams.get('harborId'), container: url.searchParams.get('container'), expectedUID: pod?.uid, closed: false };
      entry.valid = !!pod && entry.uid === pod.uid && entry.namespace === pod.namespace && !!url.searchParams.get('container');
      logs.set(request, entry);
      result.logRequests.push(entry);
    });
    for (const event of ['requestfinished','requestfailed']) page.on(event, request => { if (logs.has(request)) logs.get(request).closed = true; });
    page.on('response', response => { const entry = logs.get(response.request()); if (entry) entry.httpStatus = response.status(); });
    page.on('requestfailed', request => { const entry = logs.get(request); if (entry) entry.transportEnd = request.failure()?.errorText; });
    await select(a); await enableManagement(page);
    await select(b); await enableManagement(page);
    await select(a);
    for (let cycle = 0; cycle < cycles; cycle++) {
      await openLogs(a, podFor(a)); await switchWithOpenPanel(b);
      await openLogs(b, podFor(b)); await switchWithOpenPanel(a);
      // Exercise the public form's own harbor-switch action. Drafts may resume
      // in their original harbor; they must never be adopted by another one.
      if (cycle % 10 === 0 || cycle === cycles - 1) {
        const valueA = `qa-ui-draft-${cycle}-a`, valueB = `qa-ui-draft-${cycle}-b`;
        const formA = await openCreateDraft(a, valueA);
        await formA.getByRole('button', { name: 'Limanlar', exact: true }).click(); await selectFromWindow(b);
        assert.equal(await page.locator('.resource-form-dialog').count(), 0);
        const formB = await openCreateDraft(b, valueB);
        await formB.getByRole('button', { name: 'Limanlar', exact: true }).click(); await selectFromWindow(a);
        const restored = page.locator('.resource-form-dialog');
        await expect(restored.getByLabel('Kaynak adı', { exact: true })).toHaveValue(valueA);
        await expect(restored.getByLabel('Namespace', { exact: true })).toHaveValue(a.namespaces[0]);
        await restored.getByRole('button', { name: 'Formu kapat', exact: true }).click();
        await page.getByRole('button', { name: 'Taslağı bırak ve kapat', exact: true }).click();
        // Remove B's unsent draft through its own normal discard flow as well.
        await switchWithOpenPanel(b);
        await expect(page.getByLabel('Kaynak adı', { exact: true })).toHaveValue(valueB);
        await page.getByRole('button', { name: 'Formu kapat', exact: true }).click();
        await page.getByRole('button', { name: 'Taslağı bırak ve kapat', exact: true }).click();
        await switchWithOpenPanel(a);
        check('drafts-resume-only-in-original-harbor', { cycle });
      }
      assert.equal(await page.evaluate(c => c === document.querySelector('canvas'), original), true);
      check('real-a-b-a-log-selection-request-cycle', { cycle: cycle + 1, a: podFor(a).uid, b: podFor(b).uid });
      if ((cycle + 1) % 10 === 0) console.log(JSON.stringify({ completedCycles: cycle + 1, plannedCycles: cycles }));
    }
    await closePanels(page);
    await expect.poll(() => [...logs.values()].filter(log => !log.closed).length).toBe(0);
    assert.ok(logs.size >= cycles * 2); assert.ok([...logs.values()].every(log => log.valid));
    assert.equal(result.workspaceDenials.length, 0);
    await capture('after-cycles');
  }
  for (const [width, height] of cycles ? [] : viewports) {
    await page.setViewportSize({ width, height }); await closePanels(page);
    // On a narrow screen "Limana dön" intentionally fits the active harbor.
    // The existing explicit workspace overview is the two-harbor map action.
    if (width < 1100) await overview();
    else { await page.getByRole('button', { name: 'Limana dön', exact: true }).click(); await settle(); }
    const s = await state(); assert.deepEqual(s.rect, [0, 0, width, height]); assert.equal(s.canvases, 1);
    assert.ok(s.bodyHeight <= height + 1); assert.equal(await page.locator('.world-replay-badge').count(), 0);
    assert.equal(await page.locator('[role="dialog"]').count(), 0);
    for (const harbor of workspace.harbors) {
      assert.ok(s.centers.some(target => target.harborId === harbor.id && target.visible), `Center for ${harbor.id} must be visible`);
      await expect(page.getByRole('button', { name: `${harbor.name} — limanı aç`, exact: true })).toBeVisible();
    }
    check('two-distinct-visible-harbors-fullscreen', { width, height, state: s }); await capture(`world-${width}`);
    for (const harbor of workspace.harbors) {
      await select(harbor);
      const ns = harbor.namespaces[0], pod = fixture.pods.find(p => p.namespace === ns); assert.ok(pod);
      await expect.poll(async () => (await state()).stats.lifecycle.canonicalPods).toBe(1);
      const point = (await state()).centers.find(t => t.harborId === harbor.id && t.visible); assert.ok(point);
      await page.mouse.click(point.x, point.y);
      await expect(page.locator('.facility-window')).toContainText('Liman Yönetim Merkezi');
      assert.equal(await page.evaluate(c => c === document.querySelector('canvas'), original), true);
      check('physical-center-click-right-harbor', { width, harborId: harbor.id, expectedPodUID: pod.uid });
      await capture(`center-${width}-${harbor.id}`); await closePanels(page);
      // Counts alone cannot distinguish same-named resources in two projects.
      await findResource(page, 'Pod', pod.name, pod.uid);
      await expect(page.locator('.resource-details')).toContainText(ns);
      check('normal-finder-exact-pod-uid-and-namespace', { width, harborId: harbor.id, uid: pod.uid, namespace: ns });
      assert.equal(await page.evaluate(c => c === document.querySelector('canvas'), original), true);
      await closePanels(page);
    }
  }
  assert.equal(result.errors.length, 0); result.status = 'VERIFIED_DONE';
} catch (error) {
  result.status = 'FAILED'; result.failure = error.message;
  await capture('failure').catch(() => {}); process.exitCode = 1;
} finally {
  clearTimeout(timer); result.finishedAt = new Date().toISOString();
  await context.close(); await browser.close();
  await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, checks: result.checks.length, failure: result.failure, out }));
}
