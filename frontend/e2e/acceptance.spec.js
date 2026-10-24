import { test, expect } from "@playwright/test";
import {
  chooseDemo,
  clickWorld,
  closeWindow,
  readyWorld,
  target,
} from "./world.helpers";
import { FACILITIES } from "../src/world/registry";
test("full viewport world, physical facilities, Node→Pod, stable camera, keyboard and narrow sheet", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await chooseDemo(page);
  await expect(
    page.locator(
      ".world-window,.resource-details,.resource-form-dialog,.resource-table",
    ),
  ).toHaveCount(0);
  expect(await page.locator("canvas").boundingBox()).toMatchObject({
    x: 0,
    y: 0,
    width: 1440,
    height: 900,
  });
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-world-1440.png`,
  });
  const before = await page.locator("canvas").evaluate((c) => {
    c.dataset.qaIdentity = "stable";
    return c.__harbor.camera.position.toArray();
  });
  for (const [id, config] of Object.entries(FACILITIES).filter(
    ([id]) => id !== "workloads",
  )) {
    await clickWorld(page, { type: "facility", id });
    await expect(
      page.getByRole("dialog", { name: config.title, exact: true }),
    ).toBeVisible();
    if (id === "center")
      await page.screenshot({
        path: `../docs/evidence/world/${info.project.name}-center-1440.png`,
      });
    await closeWindow(page);
  }
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-qa-identity",
    "stable",
  );
  const after = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.camera.position.toArray());
  expect(after).toEqual(before);
  const node = await clickWorld(page, { type: "node", name: "marmara-01" });
  await expect(page.locator(".resource-details h2")).toHaveText(node.name);
  await expect(
    page.getByRole("button", { name: "Bu gemiye Pod ekle", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-node-1440.png`,
  });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  const pod = await clickWorld(page, {
    type: "container",
    containerName: "app",
  });
  await expect(page.locator(".resource-details h2")).toHaveText(
    pod.containerName,
  );
  await expect(page.locator(".details-container-parent")).toContainText(
    pod.name,
  );
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-pod-1440.png`,
  });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  await page.getByLabel("Nesne veya kaynak ara").fill("marmara");
  await page
    .locator(".finder-result")
    .filter({ hasText: "marmara-01" })
    .click();
  await expect(page.locator(".resource-details h2")).toHaveText("marmara-01");
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await page.keyboard.press("Control+k");
  await expect(page.getByLabel("Nesne veya kaynak ara")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator(".world-window")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  await page.getByRole("button", { name: "Koyu", exact: true }).click();
  await closeWindow(page);
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-dark-1440.png`,
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-world-1280.png`,
  });
  expect(await page.locator("canvas").boundingBox()).toMatchObject({
    width: 1280,
    height: 800,
  });
  await page.setViewportSize({ width: 768, height: 900 });
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-world-narrow-768.png`,
  });
  await clickWorld(page, { type: "node", name: "marmara-01" });
  await expect(page.locator(".resource-details")).toBeVisible();
  const sheet = await page.locator(".resource-details").boundingBox();
  expect(sheet.height).toBeLessThan(500);
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-sheet-768.png`,
  });
  expect(errors).toEqual([]);
});
test("camera drag does not select, panel scroll stays isolated, reduced motion lifecycle leaves no ghosts", async ({
  page,
}) => {
  await chooseDemo(page);
  const t = await target(page, { type: "facility", id: "center" });
  await page.mouse.move(t.x, t.y);
  await page.mouse.down();
  await page.mouse.move(t.x + 30, t.y, { steps: 5 });
  await page.mouse.move(t.x, t.y, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator(".world-window,.resource-details")).toHaveCount(0);
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await clickWorld(page, { type: "facility", id: "center" });
  await page.waitForTimeout(800);
  const before = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.camera.position.toArray());
  await page.locator(".world-window").hover();
  await page.mouse.wheel(0, 500);
  const after = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.camera.position.toArray());
  for (let i = 0; i < 3; i++) expect(after[i]).toBeCloseTo(before[i], 1);
  await closeWindow(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Örnek yük yaşam döngüsünü göster",
      exact: true,
    })
    .click();
  await page.waitForTimeout(300);
  await expect
    .poll(() =>
      page
        .locator("canvas")
        .evaluate((c) => c.__harbor.stats().lifecycle.activeTransfers),
    )
    .toBe(0);
  await page.waitForTimeout(8500);
  const targets = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.projectTargets());
  expect(targets.some((t) => t.name === "arrival-scenario")).toBeFalsy();
});
test("no cluster stays an empty interactive world with connection entry and semantic finder", async ({
  page,
}, info) => {
  await page.route("**/api/contexts", (route) =>
    route.fulfill({
      json: { contexts: [], current: "", readOnly: true, configured: false },
    }),
  );
  await page.goto("/");
  await readyWorld(page);
  await expect(
    page.locator(".world-window,.resource-details,.resource-table"),
  ).toHaveCount(0);
  const targets = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.projectTargets());
  expect(targets.filter((t) => t.type === "node")).toHaveLength(0);
  await clickWorld(page, { type: "facility", id: "center" });
  await expect(
    page.getByRole("dialog", { name: "Liman Yönetim Merkezi" }),
  ).toBeVisible();
  await closeWindow(page);
  await page.screenshot({
    path: `../docs/evidence/world/${info.project.name}-empty-world-1440.png`,
  });
});

test("initial backend failure can reconnect without reloading or inventing Nodes", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/contexts", (route) => {
    requests++;
    return requests === 1
      ? route.fulfill({ status: 503, json: { error: "Backend unavailable" } })
      : route.fulfill({
          json: {
            contexts: [],
            current: "",
            configured: false,
            readOnly: true,
          },
        });
  });
  await page.goto("/");
  await readyWorld(page);
  await page.locator(".world-brand-control").click();
  await expect(page.locator(".connection-errors")).toContainText("503");
  await page
    .getByRole("button", { name: "Yeniden bağlan", exact: true })
    .click();
  await expect.poll(() => requests).toBe(2);
  await expect(page.locator(".connection-errors")).toHaveCount(0);
  const stats = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.stats());
  expect(stats.lifecycle.canonicalNodes).toBe(0);
});

test("WebGL context loss keeps semantic world actions accessible", async ({page},info) => {
  await chooseDemo(page);
  const supported=await page.locator('canvas').evaluate(canvas=>{
    const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');
    const extension=gl?.getExtension('WEBGL_lose_context');
    if(!extension)return false;
    extension.loseContext();return true;
  });
  test.skip(!supported,'Renderer does not expose WEBGL_lose_context');
  await expect(page.getByText('3D grafik bağlantısı kesildi',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Bul',exact:true}).click();
  await page.getByLabel('Nesne veya kaynak ara').fill('marmara-01');
  await page.locator('.finder-result').filter({hasText:'marmara-01'}).click();
  await expect(page.locator('.resource-details h2')).toHaveText('marmara-01');
  await page.screenshot({path:`../docs/evidence/world/${info.project.name}-webgl-fallback.png`});
});
