import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { chooseDemo, clickWorld, closeWindow } from "./world.helpers.js";
const fleet = (page) =>
  page.locator("canvas").evaluate((c) => c.__harbor.fleetStates());
const separation = (a, b) =>
  Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
const water = (page) =>
  page.locator("canvas").evaluate((c) => {
    const u =
      c.__harbor.scene.getObjectByName("harbor:ocean")?.material.userData
        .oceanUniforms;
    return u
      ? { time: u.uWaterTime.value, strength: u.uWaterStrength.value }
      : null;
  });
async function ready(page) {
  await chooseDemo(page);
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.fleetStates?.().length === 3,
  );
}
async function controls(page) {
  const summary = page.locator(".resource-motion-controls summary");
  if (await summary.count()) await summary.click();
}
test("moving Node/cargo keep UID; local pause and follow preserve canvas, camera and data", async ({
  page,
}, info) => {
  await ready(page);
  const initial = await fleet(page),
    uid = initial[0].uid;
  await page.waitForTimeout(1200);
  expect(
    separation(
      initial[0],
      (await fleet(page)).find((s) => s.uid === uid),
    ),
  ).toBeGreaterThan(2);
  const before = await page.locator("canvas").evaluate((c) => {
    c.dataset.motionIdentity = "stable";
    return c.__harbor.camera.position.toArray();
  });
  const ship = await clickWorld(page, { type: "node", uid });
  await expect(page.locator(".resource-details h2")).toHaveText(ship.name);
  await controls(page);
  await expect(
    page.getByRole("button", { name: "Gemiyi kamerayla izle", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(
    await page
      .locator("canvas")
      .evaluate((c) => c.__harbor.camera.position.toArray()),
  ).toEqual(before);
  await page
    .getByRole("button", { name: "Görsel devriyeyi duraklat", exact: true })
    .click();
  await page.waitForTimeout(700);
  const stopped = (await fleet(page)).find((s) => s.uid === uid);
  await page.waitForTimeout(700);
  expect(
    separation(
      stopped,
      (await fleet(page)).find((s) => s.uid === uid),
    ),
  ).toBeLessThan(0.05);
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-soft-node.png`,
  });
  await page
    .getByRole("button", { name: "Görsel devriyeyi sürdür", exact: true })
    .click();
  await expect
    .poll(async () =>
      separation(
        stopped,
        (await fleet(page)).find((s) => s.uid === uid),
      ),
    )
    .toBeGreaterThan(1);
  await page
    .getByRole("button", { name: "Gemiyi kamerayla izle", exact: true })
    .click();
  await page.waitForTimeout(500);
  await page.mouse.move(320, 500);
  await page.mouse.down();
  await page.mouse.move(360, 510, { steps: 5 });
  await page.mouse.up();
  await expect(
    page.getByRole("button", { name: "Gemiyi kamerayla izle", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-motion-identity",
    "stable",
  );
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await page.waitForTimeout(400);
  const cargo = await clickWorld(page, {
    type: "container",
    containerName: "app",
  });
  await expect(page.locator(".resource-details h2")).toHaveText(
    cargo.containerName,
  );
  await expect(page.locator(".details-container-parent")).toContainText(
    cargo.name,
  );
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-soft-pod.png`,
  });
});
test("sea toggle freezes only water; patrol/global pause and system preference retain phase", async ({
  page,
}, info) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  const panel = page.locator(".preferences-window");
  await panel.getByLabel("Deniz yüzeyi hareketi", { exact: true }).uncheck();
  await page.waitForTimeout(1500);
  const w1 = await water(page),
    p1 = (await fleet(page))[0];
  expect(w1.strength).toBe(0);
  await page.waitForTimeout(700);
  const w2 = await water(page),
    p2 = (await fleet(page))[0];
  expect(w2).toEqual(w1);
  expect(separation(p1, p2)).toBeGreaterThan(1);
  await panel.getByLabel("Gemi devriyesi", { exact: true }).uncheck();
  await page.waitForTimeout(1000);
  const stopped = await fleet(page),
    frame = await page
      .locator("canvas")
      .evaluate((c) => c.__harbor.stats().frame);
  await closeWindow(page);
  await page.waitForTimeout(1000);
  expect(separation(stopped[0], (await fleet(page))[0])).toBeLessThan(0.05);
  const idle = await page
    .locator("canvas")
    .evaluate((c) => c.__harbor.stats().frame);
  await page.waitForTimeout(700);
  expect(
    await page.locator("canvas").evaluate((c) => c.__harbor.stats().frame),
  ).toBe(idle);
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  await panel.getByLabel("Gemi devriyesi", { exact: true }).check();
  await panel.getByLabel("Deniz yüzeyi hareketi", { exact: true }).check();
  await closeWindow(page);
  await page.waitForTimeout(600);
  expect(separation(stopped[0], (await fleet(page))[0])).toBeLessThan(15);
  await page
    .getByRole("button", { name: "Görsel hareketleri duraklat", exact: true })
    .click();
  await page.waitForTimeout(1200);
  const paused = (await fleet(page))[0],
    staticSea = await water(page);
  await page.waitForTimeout(600);
  expect(separation(paused, (await fleet(page))[0])).toBeLessThan(0.05);
  expect(await water(page)).toEqual(staticSea);
  await page
    .getByRole("button", { name: "Görsel hareketleri sürdür", exact: true })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(1200);
  const reduced = (await fleet(page))[0];
  await page.waitForTimeout(600);
  expect(separation(reduced, (await fleet(page))[0])).toBeLessThan(0.05);
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  await expect(panel).toContainText("Hareket azaltma etkin");
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-reduced-settings.png`,
  });
  await panel
    .getByLabel("Hareket tercihi", { exact: true })
    .selectOption("full");
  await closeWindow(page);
  await expect
    .poll(async () => separation(reduced, (await fleet(page))[0]))
    .toBeGreaterThan(1);
});
test("soft UI settings remain opaque, accessible and persistent in both themes and narrow world", async ({
  page,
}, info) => {
  await ready(page);
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  const panel = page.locator(".preferences-window");
  await panel.getByLabel("Panel teması", { exact: true }).selectOption("light");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-soft-settings-light.png`,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .include(".preferences-window")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await panel.getByLabel("Panel teması", { exact: true }).selectOption("dark");
  await panel.getByLabel("Kontrast", { exact: true }).selectOption("high");
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-soft-settings-dark.png`,
  });
  expect(
    (
      await new AxeBuilder({ page })
        .include(".preferences-window")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await closeWindow(page);
  await page.reload();
  await page
    .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
    .click();
  await expect(panel.getByLabel("Panel teması", { exact: true })).toHaveValue(
    "dark",
  );
  await expect(panel.getByLabel("Kontrast", { exact: true })).toHaveValue(
    "high",
  );
  await closeWindow(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-fleet-1280.png`,
  });
  await page.setViewportSize({ width: 768, height: 900 });
  await page.getByRole("button", { name: "Limana dön", exact: true }).click();
  await page.screenshot({
    path: `../docs/evidence/motion/${info.project.name}-fleet-narrow.png`,
  });
  expect(await page.locator("canvas").boundingBox()).toMatchObject({
    width: 768,
    height: 900,
  });
});

test("real WebSocket reconnect keeps Node UID, selection and patrol progress", async ({
  page,
}, info) => {
  test.skip(
    process.env.KUBEVIEW_TEST_CONTEXT !== "kubeview-test" ||
      process.env.KUBEVIEW_TEST_NAMESPACE !== "kubeview-qa",
    "Dedicated test context required",
  );
  test.skip(info.project.name !== "chromium", "Real upstream reconnect once");
  const sockets = [];
  await page.routeWebSocket("**/ws?**", (socket) => {
    socket.connectToServer();
    sockets.push(socket);
  });
  await page.goto("/");
  await expect(page.locator(".world-brand-control")).toContainText("Canlı");
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.fleetStates?.().length > 0,
  );
  const a = (await fleet(page))[0];
  await clickWorld(page, { type: "node", uid: a.uid });
  await page
    .locator("canvas")
    .evaluate((c) => (c.dataset.motionIdentity = "retained"));
  await sockets[0].close({ code: 1012, reason: "Explicit test reconnect" });
  await expect.poll(() => sockets.length).toBeGreaterThan(1);
  await expect(page.locator(".world-brand-control")).toContainText("Canlı");
  const b = (await fleet(page)).find((s) => s.uid === a.uid);
  expect(b).toBeTruthy();
  expect(separation(a, b)).toBeLessThan(60);
  await expect(page.locator(".resource-details h2")).toHaveText(a.name);
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-motion-identity",
    "retained",
  );
});

test("far-vessel arrival stays one UID and finishes without an unbounded crane queue", async ({
  page,
}) => {
  await page.goto("/src/harbor/qa.html?fullscreen=1&nodes=1&pods=0");
  await page.waitForFunction(
    () => window.harborQA?.fleetStates?.()?.length === 1,
  );
  await page.waitForTimeout(6500);
  await page.evaluate(() => window.harborQA.pending("bounded-arrival"));
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    window.harborQA.schedule("bounded-arrival", "worker-01");
    window.harborQA.select({ metadata: { uid: "bounded-arrival" } });
  });
  await expect(
    page.getByText("Görsel yükleme sürüyor", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator("canvas")
        .evaluate((c) => c.__harbor.stats().lifecycle.canonicalPods),
    )
    .toBe(1);
  const started = Date.now();
  await expect
    .poll(
      () =>
        page
          .locator("canvas")
          .evaluate((c) => c.__harbor.stats().lifecycle.queuedTransfers),
      { timeout: 13000 },
    )
    .toBe(0);
  await page.waitForTimeout(600);
  expect(Date.now() - started).toBeLessThan(12500);
  const result = await page.locator("canvas").evaluate((c) => ({
    stats: c.__harbor.stats(),
    instances: (() => {
      let count = 0;
      c.__harbor.scene.traverse((o) => {
        if (o.userData.harborTargets)
          count += o.userData
            .harborTargets()
            .filter((t) => t.uid === "bounded-arrival").length;
      });
      return count;
    })(),
  }));
  expect(result.instances).toBe(1);
  expect(result.stats.lifecycle.canonicalPods).toBe(1);
  expect(result.stats.lifecycle.activeTransfers).toBe(0);
  await expect(
    page.getByText("Görsel yükleme sürüyor", { exact: true }),
  ).toHaveCount(0);
});
