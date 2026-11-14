// Real owned profile03, normal UI only. No workload mutation is submitted.
import { chromium, expect } from '@playwright/test';
import { parse, stringify } from 'yaml';
import { findResource, enableManagement } from './v11-ui.helpers.js';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const deadline = Date.now() + 85000;
const target = new URL(process.env.KV_REAL_URL || 'http://127.0.0.1:19703');
assert.equal(target.origin, 'http://127.0.0.1:19703');
const id = process.env.KV_EVIDENCE_ID || `workspace-draft-${Date.now()}`; assert.match(id, /^[\w.-]+$/);
const out = path.join(root, 'artifacts/workspace', id); await mkdir(out, { recursive: false });
const namespace = 'kvml-e731dabd-03-same', uidA = '4ba19cc9-9fbc-44d5-84c5-83d1a01cb6cc', uidB = '37f1b711-a541-4dd5-a40d-361b72a203db';
const hash = (value) => createHash('sha256').update(value).digest('hex');
const config = process.env.KV_OWNED_KUBECONFIG || ''; assert.ok(path.isAbsolute(config), 'Explicit absolute owned kubeconfig required');
const inventory = JSON.parse(await readFile(path.join(root, 'manual-lab/evidence/ab-restricted-b-cold-05.json'), 'utf8')).finalInventory;
assert.equal(inventory.labId, 'kvml-ccdfe731dabd');
const read = (cluster, words) => JSON.parse(execFileSync('kubectl', ['--kubeconfig', config, '--context', `${inventory.labId}-${cluster}`, ...words, '-o', 'json'], { encoding: 'utf8', timeout: Math.max(1, Math.min(10000, deadline - Date.now())), stdio: ['ignore', 'pipe', 'pipe'] }));
function ownedFixture(cluster, deploymentUID) {
  assert.equal(read(cluster, ['get', 'namespace', 'kube-system']).metadata.uid, inventory.clusters[cluster].systemUid);
  const ns = read(cluster, ['get', 'namespace', namespace]), expected = inventory.profiles['03-bagimsiz-kumeler'].namespaces.find((entry) => entry.cluster === cluster);
  assert.equal(ns.metadata.uid, expected.uid); assert.equal(ns.metadata.labels['manual.kubeview.local/lab-id'], inventory.labId);
  const deployment = read(cluster, ['-n', namespace, 'get', 'deployment', 'same-app']); assert.equal(deployment.metadata.uid, deploymentUID);
  const pod = read(cluster, ['-n', namespace, 'get', 'pod', 'same-pod']), expectedPod = inventory.profiles['03-bagimsiz-kumeler'].pods.find((entry) => entry.cluster === cluster && entry.name === 'same-pod');
  assert.equal(pod.metadata.uid, expectedPod.uid); assert.equal(pod.metadata.labels['manual.kubeview.local/lab-id'], inventory.labId);
  return { namespaceUID: ns.metadata.uid, deploymentUID, podUID: pod.metadata.uid, podContainer: pod.spec.containers[0].name };
}
let owned;
try { owned = { a: ownedFixture('a', uidA), b: ownedFixture('b', uidB) }; }
catch {
  await writeFile(path.join(out, 'result.json'), JSON.stringify({ id, status: 'failed', failure: 'Owned Kubernetes identity guard failed before browser launch.', kubernetesMutations: [], finishedAt: new Date().toISOString() }, null, 2) + '\n');
  console.log(JSON.stringify({ id, status: 'failed', failure: 'Owned Kubernetes identity guard failed before browser launch.' })); process.exit(1);
}
async function manifest(directory) {
  const walk = async (base) => (await Promise.all((await readdir(base, { withFileTypes: true })).map(async (entry) => entry.isDirectory() ? walk(path.join(base, entry.name)) : entry.isFile() ? [path.join(base, entry.name)] : []))).flat();
  return hash((await Promise.all((await walk(path.join(root, directory))).sort().map(async (file) => `${hash(await readFile(file))}  ${path.relative(root, file)}`))).join('\n'));
}
const result = { id, startedAt: new Date().toISOString(), status: 'running', checks: [], errors: [],
  source: 'Actual owned A/B Kubernetes profile03 and normal UI; local draft is not applied.', sourceBefore: await manifest('frontend/src'), distBefore: await manifest('frontend/dist'),
  owned,
  limits: ['No workload mutation or dry-run is submitted.', 'No Secret, raw log, complete YAML, nonce or HTTP header is recorded.', 'Read-only camera observations are not physical presented latency.'] };
const browser = await chromium.launch({ headless: false, ...(process.platform === 'darwin' ? { args: ['--use-angle=metal'] } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }), page = await context.newPage();
page.setDefaultTimeout(10000); page.setDefaultNavigationTimeout(15000);
const writes = [], management = [], diagnostics = [], gets = [], logs = new Map(), sockets = []; let timer;
const check = (name, detail) => result.checks.push({ name, at: new Date().toISOString(), detail });
page.on('pageerror', (error) => result.errors.push(error.message.replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 240)));
page.on('request', (request) => {
  const url = new URL(request.url());
  if (['/api/resources', '/api/actions'].includes(url.pathname) && !['GET', 'HEAD'].includes(request.method())) writes.push({ path: url.pathname, method: request.method() });
  if (url.pathname === '/api/management' && request.method() === 'POST') { const body = request.postDataJSON(); management.push({ harborId: url.searchParams.get('harborId'), enabled: body.enabled }); }
  if (url.pathname === '/api/logs') logs.set(request, { uid: url.searchParams.get('uid'), container: url.searchParams.get('container'), harborId: url.searchParams.get('harborId'), scopePresent: ['workspaceId', 'harborId', 'tabId'].every((key) => Boolean(url.searchParams.get(key))), status: null, ended: false });
});
page.on('response', async (response) => {
  const url = new URL(response.url()), log = logs.get(response.request()); if (log) log.status = response.status();
  try {
    if (response.status() !== 200) return;
    if (url.pathname === '/api/connection') { const value = await response.json(); diagnostics.push({ harborId: url.searchParams.get('harborId'), context: value.context, namespace: value.namespace, readOnly: value.readOnly, managementEnabled: value.managementEnabled }); }
    if (url.pathname === '/api/resources' && url.searchParams.get('name') === 'same-app' && url.searchParams.get('resource') === 'deployments') { const value = await response.json(); gets.push({ harborId: url.searchParams.get('harborId'), context: url.searchParams.get('context'), uid: value.metadata?.uid, resourceVersion: value.metadata?.resourceVersion, draftAnnotationPresent: Object.hasOwn(value.metadata?.annotations || {}, 'kubeview.io/local-draft-check'), templateSHA256: hash(JSON.stringify(value.spec?.template || {})) }); }
  } catch { /* Canceled reads do not prove a current result. */ }
});
for (const event of ['requestfinished', 'requestfailed']) page.on(event, (request) => { const log = logs.get(request); if (log) log.ended = true; });
page.on('websocket', (socket) => { const record = { closed: false }; sockets.push(record); socket.on('close', () => { record.closed = true; }); });
const poll = async (read, accept, timeout = 7000) => { const until = Date.now() + timeout; do { const value = await read(); if (accept(value)) return value; await page.waitForTimeout(100); } while (Date.now() < until); throw Error('Bounded observation did not reach its required condition'); };
async function capture(name) { await page.screenshot({ path: path.join(out, `${name}.png`), mask: [page.getByLabel('Kaynak YAML', { exact: true }), page.getByLabel('Container log çıktısı', { exact: true })] }); }
async function pose() { return page.locator('canvas').evaluate((canvas) => { const h = canvas.__harbor; let state = h.scene.__r3f?.root?.getState?.(); if (!state) h.scene.traverse((object) => { state ||= object.__r3f?.root?.getState?.(); }); return { camera: h.camera.position.toArray(), target: state?.controls?.target?.toArray(), quaternion: h.camera.quaternion.toArray(), source: h.visualLifecycleState?.()?.source }; }); }
const distance = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
function unchanged(before, after) { assert.ok(before.target && after.target); const deltas = { camera: distance(before.camera, after.camera), target: distance(before.target, after.target), quaternion: distance(before.quaternion, after.quaternion) }; assert.ok(Object.values(deltas).every((value) => value < 1e-7), 'Form input/scroll changed the camera'); assert.equal(before.source, after.source); return { ...deltas, sourceSHA256: hash(before.source || '') }; }
async function settledPose() {
  let previous, stable = 0, current;
  await poll(async () => {
    current = await pose();
    const still = previous?.target && current.target && previous.source === current.source && ['camera', 'target', 'quaternion'].every((key) => distance(previous[key], current[key]) < 1e-8);
    stable = still ? stable + 1 : 0; previous = current; return stable;
  }, (count) => count >= 3, 4000);
  return current;
}
async function choose(harbor, viaForm = false) {
  if (viaForm) await page.locator('.resource-form-dialog').getByRole('button', { name: 'Limanlar', exact: true }).click();
  else await page.getByRole('button', { name: 'Limanlar ve deniz haritası', exact: true }).click();
  await page.locator('.workspace-port-select').filter({ has: page.getByText(harbor.name, { exact: true }) }).click();
  await page.locator('.workspace-window').waitFor({ state: 'detached' });
  await expect(page.locator('.world-cluster-name')).toContainText(harbor.name);
  await poll(async () => page.locator('.world-brand-control').innerText(), (text) => text.includes('Canlı'));
  assert.equal(await page.locator('canvas').count(), 1); assert.equal(writes.length, 0);
}
const deploymentGet = (harborId) => page.waitForResponse((response) => {
  const url = new URL(response.url()); return url.pathname === '/api/resources' && url.searchParams.get('resource') === 'deployments' && url.searchParams.get('name') === 'same-app' && url.searchParams.get('harborId') === harborId && response.request().method() === 'GET';
});
try {
  timer = setTimeout(() => browser.close().catch(() => {}), Math.max(1, deadline - Date.now()));
  await page.goto(target.origin); await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats?.().lifecycle.canonicalPods === 2);
  const document = await (await page.request.get(`${target.origin}/api/workspace`)).json();
  const a = document.harbors.find((harbor) => harbor.name === 'Bağımsız A'), b = document.harbors.find((harbor) => harbor.name === 'Bağımsız B'); assert.ok(a && b);
  assert.ok(a.namespaces.includes(namespace) && b.namespaces.includes(namespace));
  const canvas = await page.locator('canvas').elementHandle();
  await choose(a); await enableManagement(page);
  const details = await findResource(page, 'Deployment', 'same-app', uidA);
  const fresh = deploymentGet(a.id);
  await expect(details.getByRole('button', { name: 'Düzenle', exact: true })).toBeEnabled(); await details.getByRole('button', { name: 'Düzenle', exact: true }).click();
  const response = await fresh; assert.equal(response.status(), 200); const actual = await response.json(); assert.equal(actual.metadata.uid, uidA); assert.equal(actual.metadata.namespace, namespace);
  const form = page.locator('.resource-form-dialog'); await expect(form.locator('.form-dialog-body')).toHaveAttribute('aria-busy', 'false');
  await form.getByRole('button', { name: 'YAML', exact: true }).click();
  const editor = form.getByRole('textbox', { name: 'Kaynak YAML', exact: true }); await expect(editor).toBeEditable();
  const object = parse(await editor.inputValue()); assert.equal(object.metadata.uid, uidA); object.metadata.annotations = { ...object.metadata.annotations, 'kubeview.io/local-draft-check': 'unsent-v05' };
  const draft = stringify(object); await editor.fill(draft); await page.waitForTimeout(650);
  assert.equal(parse(await editor.inputValue()).metadata.uid, uidA);
  const before = await pose(); await editor.press('ArrowLeft'); await editor.press('ArrowLeft'); await page.waitForTimeout(80);
  const caret = await editor.evaluate((input) => ({ start: input.selectionStart, end: input.selectionEnd })); assert.equal(caret.start, draft.length - 2); assert.equal(caret.end, caret.start);
  check('dirty-yaml-native-arrows-preserve-body-and-camera', { uid: uidA, draftSHA256: hash(draft), caret: caret.start, ...unchanged(before, await pose()) });
  const body = form.locator('.form-dialog-body');
  const measure = (element) => ({ top: element.scrollTop, height: element.clientHeight, total: element.scrollHeight });
  const bodySize = await body.evaluate(measure), editorSize = await editor.evaluate(measure);
  const useEditor = editorSize.total > editorSize.height + 1;
  const scrollTarget = useEditor ? editor : body, geometry = useEditor ? editorSize : bodySize;
  result.scrollObservation = { element: useEditor ? 'yaml-editor' : 'form-body', ...geometry };
  assert.ok(geometry.total > geometry.height + 1, 'No actual form/editor overflow is available for this fixture');
  const box = await scrollTarget.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const scrollPose = await pose(); await page.mouse.wheel(0, geometry.top > 0 ? -420 : 420); await page.waitForTimeout(120);
  const scrolled = await scrollTarget.evaluate((element) => element.scrollTop); result.scrollObservation.after = scrolled;
  assert.notEqual(scrolled, geometry.top, 'Actual form interior did not scroll');
  check('form-interior-scroll-isolated-from-world', { ...result.scrollObservation, ...unchanged(scrollPose, await pose()) }); await capture('01-A-dirty-form');
  await choose(b, true); assert.equal(await form.count(), 0);
  const bDetails = await findResource(page, 'Deployment', 'same-app', uidB); await expect(bDetails.getByRole('button', { name: 'Düzenle', exact: true })).toBeDisabled();
  await poll(async () => diagnostics.filter((entry) => entry.harborId === b.id).at(-1), (entry) => entry?.readOnly === true && entry?.managementEnabled === false);
  check('same-name-B-keeps-own-uid-and-no-A-grant', { harborId: b.id, uid: uidB, editDisabled: true }); await capture('02-B-own-UID-readonly');
  const freshReturn = deploymentGet(a.id);
  await choose(a); await form.waitFor();
  await expect(form.getByRole('textbox', { name: 'Kaynak YAML', exact: true })).toHaveValue(draft);
  check('A-return-immediate-draft-before-fresh-get-settles', { harborId: a.id, uid: uidA, draftSHA256: hash(draft) });
  const returnedResponse = await freshReturn; assert.equal(returnedResponse.status(), 200);
  const returnedActual = await returnedResponse.json(); assert.equal(returnedActual.metadata.uid, uidA); assert.equal(returnedActual.metadata.namespace, namespace);
  assert.ok(!Object.hasOwn(returnedActual.metadata.annotations || {}, 'kubeview.io/local-draft-check'));
  await expect(form.locator('.form-dialog-body')).toHaveAttribute('aria-busy', 'false');
  await expect(form.getByText('Kaynağın güncel sürümü alınıyor…', { exact: true })).toHaveCount(0);
  await expect(editor).toBeEditable(); await expect(editor).toHaveValue(draft);
  await poll(async () => gets.filter((entry) => entry.harborId === a.id && entry.uid === uidA).length, (count) => count >= 2);
  const restored = parse(await editor.inputValue()); assert.equal(restored.metadata.uid, uidA); assert.equal(restored.metadata.annotations['kubeview.io/local-draft-check'], 'unsent-v05');
  await expect(form.locator('.eyebrow')).toContainText(a.name);
  assert.equal(await page.evaluate((original) => original === document.querySelector('canvas'), canvas), true);
  check('A-return-after-completed-fresh-get-keeps-exact-safe-draft-uid-mode-and-panel', { harborId: a.id, uid: uidA, draftSHA256: hash(draft), byteEqual: true, annotationPresent: true, canvasPreserved: true, loading: false, freshGetCount: gets.filter((entry) => entry.harborId === a.id && entry.uid === uidA).length });
  await editor.click();
  const returnedCaretBefore = await editor.evaluate((input) => ({ start: input.selectionStart, end: input.selectionEnd })), returnedPose = await settledPose();
  assert.equal(returnedCaretBefore.start, returnedCaretBefore.end);
  const caretStep = returnedCaretBefore.start >= 2 ? -1 : 1, caretKey = caretStep < 0 ? 'ArrowLeft' : 'ArrowRight';
  await editor.press(caretKey); await editor.press(caretKey); await page.waitForTimeout(80);
  const returnedCaret = await editor.evaluate((input) => ({ start: input.selectionStart, end: input.selectionEnd }));
  assert.equal(returnedCaret.start, returnedCaretBefore.start + 2 * caretStep); assert.equal(returnedCaret.end, returnedCaret.start); assert.equal(await editor.inputValue(), draft);
  check('post-fresh-get-native-caret-keeps-draft-and-camera', { uid: uidA, draftSHA256: hash(draft), caretBefore: returnedCaretBefore.start, caret: returnedCaret.start, nativeArrowStep: caretStep, ...unchanged(returnedPose, await pose()) });
  const returnedSize = await scrollTarget.evaluate(measure); assert.ok(returnedSize.total > returnedSize.height + 1);
  const returnedBox = await scrollTarget.boundingBox(); await page.mouse.move(returnedBox.x + returnedBox.width / 2, returnedBox.y + returnedBox.height / 2);
  const returnedScrollPose = await pose(); await page.mouse.wheel(0, returnedSize.top > 0 ? -420 : 420); await page.waitForTimeout(120);
  const returnedTop = await scrollTarget.evaluate((element) => element.scrollTop); assert.notEqual(returnedTop, returnedSize.top); assert.equal(await editor.inputValue(), draft);
  check('post-fresh-get-real-interior-scroll-keeps-draft-and-camera', { uid: uidA, before: returnedSize.top, after: returnedTop, ...unchanged(returnedScrollPose, await pose()) }); await capture('03-A-restored-after-fresh-get-and-native-input');
  await form.getByRole('button', { name: 'Formu kapat', exact: true }).click(); await form.getByRole('button', { name: 'Taslağı bırak ve kapat', exact: true }).click(); await form.waitFor({ state: 'detached' });
  const samePodBoundary = logs.size;
  const podDetails = await findResource(page, 'Pod', 'same-pod', owned.a.podUID), podUID = owned.a.podUID;
  await podDetails.locator('.details-tabs').getByRole('button', { name: 'Loglar', exact: true }).click();
  await poll(async () => [...logs.values()], (records) => records.some((entry) => entry.uid === podUID && entry.harborId === a.id && entry.status === 200));
  await choose(b); await poll(async () => [...logs.values()], (records) => records.every((entry) => entry.ended));
  const bPodDetails = await findResource(page, 'Pod', 'same-pod', owned.b.podUID); await bPodDetails.locator('.details-tabs').getByRole('button', { name: 'Loglar', exact: true }).click();
  await poll(async () => [...logs.values()], (records) => records.some((entry) => entry.uid === owned.b.podUID && entry.harborId === b.id && entry.status === 200));
  await capture('04-B-same-pod-own-UID-logs');
  assert.ok(!management.some((entry) => entry.harborId === b.id && entry.enabled));
  const boundary = logs.size; await choose(a); await page.locator('.pod-logs').waitFor();
  await poll(async () => [...logs.values()].slice(0, boundary), (records) => records.every((entry) => entry.ended));
  await poll(async () => [...logs.values()].slice(boundary), (records) => records.some((entry) => entry.uid === podUID && entry.harborId === a.id && entry.status === 200));
  await page.getByRole('button', { name: 'Ayrıntı panelini kapat', exact: true }).click(); await poll(async () => [...logs.values()], (records) => records.every((entry) => entry.ended));
  const samePodLogs = [...logs.values()].slice(samePodBoundary); assert.equal(samePodLogs.length, 3);
  assert.deepEqual(samePodLogs.map((entry) => entry.uid), [owned.a.podUID, owned.b.podUID, owned.a.podUID]);
  assert.ok(samePodLogs.every((entry) => entry.container === (entry.harborId === a.id ? owned.a.podContainer : owned.b.podContainer)));
  check('same-pod-A-B-A-logs-use-distinct-exact-UIDs-and-all-close', { podUID, bPodUID: owned.b.podUID, harborA: a.id, harborB: b.id, scopePresent: samePodLogs.every((entry) => entry.scopePresent), streams: samePodLogs.length, ended: samePodLogs.filter((entry) => entry.ended).length, allObservedRequestsEnded: [...logs.values()].every((entry) => entry.ended) });
  await page.getByRole('button', { name: 'Bağlantı ve cluster kapsamını aç', exact: true }).click();
  const connection = page.getByRole('dialog', { name: 'Bağlantı ve kapsam', exact: true });
  const revoke = connection.getByRole('button', { name: 'Salt okunur moda dön', exact: true });
  if (await revoke.isVisible()) { await revoke.click(); await expect(connection.getByRole('button', { name: 'Yönetim modunu aç', exact: true })).toBeVisible(); }
  await connection.getByRole('button', { name: 'Pencereyi kapat', exact: true }).click();
  assert.ok(gets.every((entry) => !entry.draftAnnotationPresent), 'Local-only annotation appeared in actual API data');
  assert.equal(writes.length, 0); assert.equal(result.errors.length, 0); result.status = 'passed';
} catch (error) {
  result.status = 'failed'; result.failure = String(error.message).replace(/\?[^\s)]+/g, '?[redacted]').slice(0, 1000); await capture('failure').catch(() => {}); process.exitCode = 1;
} finally {
  clearTimeout(timer); await page.goto('about:blank').catch(() => {}); await context.close().catch(() => {}); await browser.close().catch(() => {});
  result.kubernetesMutations = writes; result.management = management; result.freshResourceGets = gets; result.logRequests = [...logs.values()]; result.socketCount = sockets.length; result.socketClosedEvents = sockets.filter((entry) => entry.closed).length;
  result.sourceAfter = await manifest('frontend/src'); result.distAfter = await manifest('frontend/dist'); result.finishedAt = new Date().toISOString();
  await writeFile(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ id, status: result.status, checks: result.checks.length, failure: result.failure, kubernetesWrites: writes.length, logRequests: logs.size, sourceUnchanged: result.sourceBefore === result.sourceAfter }));
}
