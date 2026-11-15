// Final read-only real-cluster UI regressions. No QA Pod/Node mutation.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { launch, get, dir, runtime, sleep, poll } from "./repair-ui.mjs";
const prefix = process.env.KV_FINAL_EVIDENCE || "frontend-final-regression";
const onlyMotion = process.env.KV_FINAL_ONLY_MOTION === "1";
const source = await get("pod", "flow-client", runtime.namespace), node = await get("node", source.spec.nodeName, "");
const report = { startedAt: new Date().toISOString(), source: "Normal start.sh / real owned cluster / read-only physical and semantic UI", context: runtime.context, clusterUID: runtime.clusterUID, namespace: runtime.namespace, pod: { uid: source.metadata.uid, name: source.metadata.name, container: source.spec.containers[0].name, node: source.spec.nodeName }, engines: [], limitations: [] };
await fs.writeFile(`${dir}/${prefix}.json`, "{}", { flag: "wx" });
const save = () => fs.writeFile(`${dir}/${prefix}.json`, JSON.stringify(report, null, 2));
const norm = (vector) => Math.hypot(...vector);
const distance = (a, b) => norm(a.position.map((v, i) => v - b.position[i]));
const horizontalDistance = (a, b) => Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
async function state(page) {
  return page.locator("canvas").evaluate((canvas) => {
    const h = canvas.__harbor, u = h.scene.getObjectByName("harbor:ocean")?.material.userData.oceanUniforms;
    return { camera: { position: h.camera.position.toArray(), rotation: h.camera.quaternion.toArray(), zoom: h.camera.zoom, forward: [-h.camera.matrixWorld.elements[8], 0, -h.camera.matrixWorld.elements[10]] }, fleet: h.fleetStates(), water: u ? { time: u.uWaterTime.value, strength: u.uWaterStrength.value } : null, stats: h.stats(), hidden: document.hidden };
  });
}
async function formClose(page) {
  await page.getByRole("button", { name: "Formu kapat", exact: true }).click();
  const discard = page.getByRole("button", { name: "Taslağı bırak ve kapat", exact: true });
  if (await discard.count()) await discard.click();
}
for (const engine of ["chromium", "webkit"]) {
  const ui = await launch(`${prefix}-${engine}`, { engine, video: false }), { page, result } = ui;
  report.engines.push(result); result.cases = []; result.browser = ui.browser.version();
  const canvas = page.locator("canvas"); let canvasHandle;
  async function run(name, fn) {
    if (onlyMotion && !/sea and patrol|dark high-contrast/.test(name)) return;
    const row = { name, startedAt: new Date().toISOString() }; result.cases.push(row);
    try { row.result = await fn(); row.status = "PASSED"; }
    catch (error) { row.status = "FAILED"; row.error = error.stack; await ui.capture(`failure-${result.cases.length}`).catch(() => {}); await ui.close().catch(() => {}); }
    row.endedAt = new Date().toISOString(); await ui.save(); await save();
  }
  async function invariant() {
    assert.equal(await canvas.evaluate((current, original) => current === original, canvasHandle), true, "Canvas was remounted");
    const viewport = page.viewportSize(), box = await canvas.boundingBox();
    assert.equal(box.x, 0); assert.equal(box.y, 0); assert.equal(box.width, viewport.width); assert.equal(box.height, viewport.height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1), false, "Page body scrolls");
    return box;
  }
  try {
    await ui.start(); canvasHandle = await canvas.elementHandle();
    await run("focused arrows move horizontally in view directions, preserve orientation/zoom and stop on release/blur", async () => {
      await canvas.focus(); const initial = (await state(page)).camera; let before = initial;
      const rows = [];
      for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
        await page.keyboard.down(key); await sleep(300); await page.keyboard.up(key);
        const after = (await state(page)).camera, delta = after.position.map((v, i) => v - before.position[i]);
        const [fx, , fz] = before.forward, along = delta[0] * fx + delta[2] * fz, sideways = delta[0] * -fz + delta[2] * fx;
        assert(distance(before, after) > 5 && distance(before, after) < 50);
        assert(Math.abs(delta[1]) < 1e-6); assert(norm(after.rotation.map((v, i) => v - initial.rotation[i])) < 1e-6); assert.equal(after.zoom, initial.zoom);
        assert(key === "ArrowUp" ? along > 0 : key === "ArrowDown" ? along < 0 : key === "ArrowLeft" ? sideways < 0 : sideways > 0);
        await sleep(250); assert(distance(after, (await state(page)).camera) < 0.01, "Release failed to stop pan");
        rows.push({ key, delta, along, sideways }); before = after;
      }
      await page.keyboard.down("ArrowUp"); await sleep(200); await page.getByRole("button", { name: "Bul", exact: true }).focus();
      const blurred = (await state(page)).camera; await sleep(250); assert(distance(blurred, (await state(page)).camera) < 0.01);
      await canvas.focus(); await sleep(150); assert(distance(blurred, (await state(page)).camera) < 0.01); await page.keyboard.up("ArrowUp");
      await page.getByRole("button", { name: "Limana dön", exact: true }).click(); return { initial, rows, blurClearedHeldKey: true };
    });
    await run("finder and real targeted create-form fields keep caret/arrows and wheel isolated from camera", async () => {
      await page.getByRole("button", { name: "Bul", exact: true }).click(); const input = page.getByLabel("Nesne veya kaynak ara", { exact: true });
      await input.fill("worker"); await input.press("End"); const before = (await state(page)).camera;
      await input.press("ArrowLeft"); assert.equal(await input.evaluate((el) => el.selectionStart), 5);
      await input.press("ArrowDown"); await sleep(150); assert(distance(before, (await state(page)).camera) < 0.01);
      await page.keyboard.press("Escape"); await ui.find(node.metadata.name, "Node");
      await page.getByRole("button", { name: "Bu gemiye Pod ekle", exact: true }).click();
      const form = page.locator(".resource-form-dialog"), field = form.getByLabel("Kaynak adı", { exact: true });
      await field.fill("unsubmitted-camera-draft"); await field.press("End"); const formBefore = (await state(page)).camera;
      await field.press("ArrowLeft"); const cursor = await field.evaluate((el) => el.selectionStart); assert.equal(cursor, "unsubmitted-camera-draft".length - 1);
      await field.press("ArrowDown"); await form.hover(); await page.mouse.wheel(0, 250); await sleep(250);
      assert(distance(formBefore, (await state(page)).camera) < 0.01); await formClose(page); await ui.close();
      return { caret: cursor, noSubmission: true, noCameraPanFromFields: true };
    });
    await run("1440, 1280 and 768 worlds retain full canvas when actual Node panels open; 768 sheet stays bounded", async () => {
      const rows = [];
      for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 768, height: 900 }]) {
        await ui.close(); await page.setViewportSize(viewport); await page.getByRole("button", { name: "Limana dön", exact: true }).click(); await sleep(350);
        const box = await invariant(), before = (await state(page)).camera;
        await ui.find(node.metadata.name, "Node"); const panel = await page.locator(".resource-details").boundingBox();
        await invariant(); assert(distance(before, (await state(page)).camera) < 0.01, "Panel changed camera");
        assert(panel.x >= -1 && panel.y >= -1 && panel.x + panel.width <= viewport.width + 1 && panel.y + panel.height <= viewport.height + 1);
        if (viewport.width === 768) assert(panel.height < 500, "Narrow sheet exceeds initial bounded height");
        await ui.capture(`node-panel-${viewport.width}`); await ui.close(); await invariant(); rows.push({ viewport, canvas: box, panel });
      }
      await page.setViewportSize({ width: 1440, height: 900 }); return rows;
    });
    await run("actual moving container pointer target opens the expected Pod UID/container, without selecting ship", async () => {
      await ui.find(source.metadata.name, "Pod");
      await page.getByText("Görsel seyir ve kamera", { exact: true }).click();
      await page.getByRole("button", { name: "Gemiyi kamerayla izle", exact: true }).click();
      await page.getByRole("button", { name: "Sahnede göster", exact: true }).click(); await sleep(700);
      const projected = await ui.world({ type: "container", uid: source.metadata.uid, containerName: source.spec.containers[0].name });
      assert.equal(await page.locator(".resource-details h2").innerText(), source.spec.containers[0].name);
      assert((await page.locator(".details-container-parent").innerText()).includes(source.metadata.name));
      await page.locator(".details-tabs").getByRole("button", { name: "YAML", exact: true }).click();
      assert((await page.locator(".yaml-output").innerText()).includes(source.metadata.uid));
      await ui.capture("actual-moving-container-correct-uid"); await ui.close();
      // Manual orbit cancels explicit follow before independent water/camera tests.
      await page.mouse.move(600, 500); await page.mouse.down(); await page.mouse.move(640, 510, { steps: 5 }); await page.mouse.up();
      await page.getByRole("button", { name: "Limana dön", exact: true }).click(); return { projected, actualUID: source.metadata.uid, actualContainer: source.spec.containers[0].name };
    });
    await run("sea and patrol switches are independent; system reduced motion pauses visuals without removing real resources", async () => {
      await page.getByRole("button", { name: "Görünüm ve ayarlar", exact: true }).click(); const panel = page.locator(".preferences-window");
      await panel.getByLabel("Deniz yüzeyi hareketi", { exact: true }).uncheck();
      await poll(async () => (await state(page)).water.strength === 0, 6000);
      const before = await state(page); await sleep(700); const seaOff = await state(page);
      assert.deepEqual(seaOff.water, before.water); assert.equal(seaOff.water.strength, 0);
      const moving = before.fleet.find((s) => s.uid === node.metadata.uid), moved = seaOff.fleet.find((s) => s.uid === node.metadata.uid);
      assert(horizontalDistance(moving, moved) > 1, "Sea off unexpectedly stopped patrol");
      await panel.getByLabel("Gemi devriyesi", { exact: true }).uncheck(); await panel.getByLabel("Deniz yüzeyi hareketi", { exact: true }).check(); await sleep(1000);
      const patrolOff = await state(page); await sleep(650); const stillSeaOn = await state(page);
      assert(horizontalDistance(patrolOff.fleet.find((s) => s.uid === node.metadata.uid), stillSeaOn.fleet.find((s) => s.uid === node.metadata.uid)) < 0.05);
      assert(stillSeaOn.water.time > patrolOff.water.time, "Patrol off unexpectedly stopped sea");
      await panel.getByLabel("Gemi devriyesi", { exact: true }).check(); await panel.getByLabel("Hareket tercihi", { exact: true }).selectOption("system");
      await page.emulateMedia({ reducedMotion: "reduce" }); await poll(async () => (await state(page)).water.strength === 0, 6000); await sleep(350); const reduced = await state(page); await sleep(650); const reducedAfter = await state(page);
      assert.deepEqual(reducedAfter.water, reduced.water); assert(horizontalDistance(reduced.fleet.find((s) => s.uid === node.metadata.uid), reducedAfter.fleet.find((s) => s.uid === node.metadata.uid)) < 0.05);
      assert((await panel.innerText()).includes("Hareket azaltma etkin")); await ui.capture("reduced-motion-settings-real-world");
      await panel.getByLabel("Hareket tercihi", { exact: true }).selectOption("full"); await page.emulateMedia({ reducedMotion: "no-preference" }); await ui.close();
      const current = await get("pod", source.metadata.name, runtime.namespace); assert.equal(current.metadata.uid, source.metadata.uid);
      return { before, seaOff, patrolOff, stillSeaOn, reduced, reducedAfter, upstreamPodUIDUnchanged: current.metadata.uid };
    });
    await run("opaque dark high-contrast Soft UI settings remain bounded and readable", async () => {
      await page.getByRole("button", { name: "Görünüm ve ayarlar", exact: true }).click(); const panel = page.locator(".preferences-window");
      await panel.getByLabel("Panel teması", { exact: true }).selectOption("dark"); await panel.getByLabel("Kontrast", { exact: true }).selectOption("high");
      const style = await panel.evaluate((el) => { const s = getComputedStyle(el); return { background: s.backgroundColor, color: s.color, opacity: s.opacity, borderColor: s.borderColor }; });
      assert.equal(style.opacity, "1"); assert(!/rgba\([^)]*,\s*0[.,]/.test(style.background));
      await invariant(); await ui.capture("soft-ui-dark-high-contrast"); await ui.close(); return style;
    });
  } catch (error) { result.startupError = error.stack; await ui.capture("startup-or-unrecovered-error").catch(() => {}); }
  finally { await canvasHandle?.dispose(); await ui.finish(); await save(); }
}
report.endedAt = new Date().toISOString(); report.status = report.engines.every((engine) => !engine.startupError && engine.cases.every((c) => c.status === "PASSED")) ? "PASSED" : "FAILED";
await save(); console.log(JSON.stringify({ status: report.status, engines: report.engines.map((engine) => ({ browser: engine.engine, cases: engine.cases.map((c) => ({ name: c.name, status: c.status, error: c.error?.split("\n")[0] })), startupError: engine.startupError, pageErrors: engine.errors })), evidence: `${dir}/${prefix}.json` }));
if (report.status !== "PASSED") process.exitCode = 1;
