// Single headed normal-user Secret flow. Private values never enter evidence.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import path from 'node:path';
import { parse, stringify } from 'yaml';
import { findResource, enableManagement, closePanels } from './v11-ui.helpers.js';

const origin = 'http://127.0.0.1:19843', out = process.env.KV_SECRET_UI_OUTPUT;
const fixture = JSON.parse(await readFile(process.env.KV_SECRET_UI_PRIVATE, 'utf8'));
const expected = fixture.secret;
const secretStrings = [fixture.value, Buffer.from(fixture.value).toString('base64'), fixture.privateAnnotation];
const result = { status: 'FAIL', mode: 'NORMAL_HEADED_UI_REAL_KUBERNETES_SYNTHETIC_SECRET', startedAt: new Date().toISOString(), checks: [], requests: [], screenshots: [], screenshotBlocks: [], pageErrorCount: 0, consoleMessageCount: 0 };
const sha = value => createHash('sha256').update(value).digest('hex');
let browser, context, page, currentStep = 'launch', revealActive = false;
let guardSequence = 0;
const need = (ok, category) => { if (!ok) { const e = new Error(category); e.safeCategory = category; throw e; } };
const check = (name, proof = {}) => result.checks.push({ name, proof });
const maskSelector = 'pre,code,textarea,input,[role="alert"],.inline-alert.alert-danger,.resource-details .label-list';
const timer = setTimeout(() => browser?.close().catch(() => {}), 118000);
async function liveGuard() {
  const sequence = ++guardSequence, directory = path.dirname(process.env.KV_SECRET_UI_PRIVATE);
  await writeFile(path.join(directory, 'guard-request.json'), JSON.stringify({ sequence }));
  const deadline = Date.now() + 7000;
  while (Date.now() < deadline) {
    try { const answer = JSON.parse(await readFile(path.join(directory, `guard-reply-${sequence}.json`), 'utf8')); need(answer.ok === true, 'live_owned_write_guard'); return; } catch (error) { if (error.safeCategory) throw error; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  need(false, 'live_owned_write_guard_timeout');
}
async function privateDOMProof() {
  return page.evaluate(({ values, selector }) => {
    let present = false, outside = false;
    const contains = text => values.some(v => v && String(text || '').includes(v));
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const n = walker.currentNode; if (contains(n.textContent)) { present = true; if (!n.parentElement?.closest(selector)) outside = true; } }
    for (const e of document.querySelectorAll('textarea,input')) if (contains(e.value)) { present = true; if (!e.closest(selector)) outside = true; }
    return { present, outside };
  }, { values: secretStrings, selector: maskSelector });
}
async function capture(name, allowMaskedPrivate = false) {
  need(result.screenshots.length < 4, 'screenshot_limit');
  if (revealActive) { result.screenshotBlocks.push({ name, reason: 'reveal_active_no_capture' }); return; }
  const proof = await privateDOMProof();
  if (proof.outside || (!allowMaskedPrivate && proof.present)) { result.screenshotBlocks.push({ name, reason: 'private_DOM_mask_proof_failed' }); return; }
  await page.screenshot({ path: path.join(out, name), mask: [page.locator(maskSelector)], timeout: 5000 });
  result.screenshots.push({ file: name, maskProof: true, privateOutsideMask: false });
}
try {
  need(path.isAbsolute(out) && fixture.uid === expected.metadata.uid && fixture.namespace === expected.metadata.namespace, 'private_fixture_identity');
  browser = await chromium.launch({ headless: false, args: ['--use-angle=metal', '--disable-background-networking', '--disable-component-update', '--disable-sync'], timeout: 10000 });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await context.route('**/*', route => { const u = new URL(route.request().url()); return ['data:', 'blob:'].includes(u.protocol) || u.origin === origin ? route.continue() : route.abort(); });
  page = await context.newPage(); page.setDefaultTimeout(7000);
  page.on('pageerror', () => ++result.pageErrorCount);
  page.on('console', () => ++result.consoleMessageCount);
  page.on('request', request => { const u = new URL(request.url()); if (u.origin === origin) result.requests.push({ method: request.method(), path: u.pathname }); });
  page.on('response', response => { const u = new URL(response.url()); if (u.origin === origin) result.requests.push({ method: response.request().method(), path: u.pathname, status: response.status() }); });
  currentStep = 'normal_navigation_Metal_scope';
  const navigation = await page.goto(origin, { timeout: 15000 }); need(navigation.status() === 200, 'index_status');
  result.indexSHA256 = sha(await navigation.body()); need(result.indexSHA256 === fixture.indexSHA256, 'embedded_index_identity');
  await page.waitForFunction(() => document.querySelector('canvas')?.__harbor?.stats()?.lifecycle?.canonicalNodes === 2, undefined, { timeout: 15000 });
  result.renderer = await page.locator('canvas').evaluate(c => { const gl = c.getContext('webgl2') || c.getContext('webgl'); const e = gl?.getExtension('WEBGL_debug_renderer_info'); return { renderer: gl?.getParameter(e ? e.UNMASKED_RENDERER_WEBGL : gl.RENDERER), vendor: gl?.getParameter(e ? e.UNMASKED_VENDOR_WEBGL : gl.VENDOR) }; });
  if (!/Metal/i.test(result.renderer.renderer || '') || /SwiftShader|llvmpipe|software/i.test(result.renderer.renderer || '')) { result.status = 'BLOCKED'; throw Object.assign(new Error(), { safeCategory: 'actual_Metal_not_established' }); }
  const originalCanvas = await page.locator('canvas').elementHandle();
  need(await page.locator('canvas').count() === 1, 'one_canvas');
  currentStep = 'normal_finder_exact_Secret';
  let details = await findResource(page, 'Secret', fixture.name, fixture.uid);
  need(await details.evaluate((e, ns) => e.textContent.includes(ns), fixture.namespace), 'normal_panel_namespace');
  check('normal_finder_exact_UID_namespace', { UID: fixture.uid, namespace: fixture.namespace });
  await capture('01-secret-metadata.png');
  currentStep = 'normal_reveal_private_DOM';
  const revealResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/secrets/reveal' && r.request().method() === 'GET');
  await details.getByRole('button', { name: 'Yetkiyle Secret değerlerini aç', exact: true }).click(); revealActive = true;
  need((await revealResponse).status() === 200, 'purpose_reveal_status');
  await page.waitForFunction(value => document.querySelector('.resource-details .yaml-output')?.textContent.includes(value), fixture.value, { timeout: 7000 });
  check('revealed_private_DOM_equals_synthetic', { valueEqual: true, valueHash: sha(fixture.value), screenshotWhileRevealed: false });
  currentStep = 'normal_hide';
  await details.getByRole('button', { name: 'Değerleri gizle', exact: true }).click(); revealActive = false;
  await details.getByRole('button', { name: 'Yetkiyle Secret değerlerini aç', exact: true }).waitFor();
  need(!(await privateDOMProof()).present, 'hide_removes_private_DOM'); check('normal_hide_removes_private_DOM');
  await capture('02-after-hide.png');
  need(await details.getByRole('button', { name: 'Gizli içeriği düzenle', exact: true }).isDisabled(), 'pregrant_purpose_edit_disabled'); check('normal_pregrant_purpose_edit_disabled');
  currentStep = 'normal_management_enable';
  await liveGuard();
  await enableManagement(page);
  details = await findResource(page, 'Secret', fixture.name, fixture.uid);
  currentStep = 'normal_purpose_editor';
  const editorReveal = page.waitForResponse(r => new URL(r.url()).pathname === '/api/secrets/reveal' && r.request().method() === 'GET');
  await details.getByRole('button', { name: 'Gizli içeriği düzenle', exact: true }).click();
  need((await editorReveal).status() === 200, 'editor_purpose_reveal_status');
  const form = page.locator('.resource-form-dialog'), yaml = form.getByRole('textbox', { name: 'Kaynak YAML', exact: true });
  await yaml.waitFor();
  const draft = parse(await yaml.inputValue());
  need(draft.kind === 'Secret' && draft.metadata.uid === fixture.uid && draft.metadata.name === fixture.name && draft.metadata.namespace === fixture.namespace && !!draft.metadata.resourceVersion, 'purpose_editor_identity');
  need(isDeepStrictEqual(draft.data, expected.data) && isDeepStrictEqual(draft.metadata.labels, expected.metadata.labels) && isDeepStrictEqual(draft.metadata.annotations, expected.metadata.annotations), 'purpose_editor_data_unknown_metadata');
  draft.metadata.labels[fixture.newLabelKey] = fixture.newLabelValue;
  draft.metadata.annotations[fixture.newAnnotationKey] = fixture.newAnnotationValue;
  await yaml.fill(stringify(draft)); check('normal_YAML_metadata_edit_only', { UID: fixture.uid, originalDataEqual: true, oldUnknownMetadataEqual: true });
  currentStep = 'normal_server_dryrun';
  await liveGuard();
  const dryResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/resources' && r.request().method() === 'PUT');
  await form.getByRole('button', { name: 'Server dry-run', exact: true }).click(); need((await dryResponse).status() === 200, 'dryrun_status');
  await form.locator('.dry-run-preview').getByText('Server dry-run başarılı. Kaynak henüz uygulanmadı.', { exact: true }).waitFor();
  const preview = parse(await form.locator('.dry-run-preview details[open] pre').textContent());
  need(preview.data === undefined && preview.stringData === undefined && preview.metadata?.annotations === undefined, 'dryrun_preview_sanitized');
  check('normal_server_dryrun_preview_sanitized'); await capture('03-purpose-dryrun-masked.png', true);
  currentStep = 'normal_apply_and_canonical_observation';
  await liveGuard();
  const saveResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/resources' && r.request().method() === 'PUT');
  await form.getByRole('button', { name: 'Uygula', exact: true }).click(); const saved = await saveResponse; need(saved.status() === 200, 'save_status');
  // Inspect only safe metadata from the normal operation response; never export its body.
  const operation = await saved.json(); need(operation.object?.data === undefined && operation.object?.metadata?.uid === fixture.uid, 'operation_result_sanitized_identity');
  result.acceptedResourceVersion = operation.object.metadata.resourceVersion;
  await form.waitFor({ state: 'detached' });
  await page.waitForFunction(({ key, value }) => [...document.querySelectorAll('.resource-details .label-list code')].some(e => e.textContent === `${key}=${value}`), { key: fixture.newLabelKey, value: fixture.newLabelValue }, { timeout: 12000 });
  check('normal_save_accepted_and_canonical_label_observed', { UID: fixture.uid, acceptedResourceVersion: result.acceptedResourceVersion });
  currentStep = 'normal_panels_close_same_canvas';
  await closePanels(page);
  need(await page.locator('.resource-form-dialog,.resource-details').count() === 0, 'panels_closed');
  need(await page.evaluate(c => c === document.querySelector('canvas'), originalCanvas), 'same_canvas');
  need(!(await privateDOMProof()).present, 'closed_panels_private_DOM_absent');
  check('normal_close_same_canvas_private_DOM_clear'); await capture('04-panels-closed.png');
  need(result.pageErrorCount === 0, 'pageerror_count'); result.status = 'PASS';
} catch (error) {
  result.failure = { step: currentStep, errorClass: error?.name || 'Error', safeCategory: error?.safeCategory || 'details_omitted' };
  process.exitCode = 1;
} finally {
  clearTimeout(timer); await context?.close().catch(() => {}); await browser?.close().catch(() => {});
  result.finishedAt = new Date().toISOString(); await writeFile(path.join(out, 'browser-result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ status: result.status, checks: result.checks.length, screenshotCount: result.screenshots.length, failure: result.failure }));
}
