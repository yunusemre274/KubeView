import { chromium, expect } from "@playwright/test";
import { copyFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import {
  chooseDemo,
  clickWorld,
  closeWindow,
  readyWorld,
} from "./world.helpers.js";
const live = process.env.RECORD_SOURCE === "live";
if (
  live &&
  (process.env.KUBEVIEW_TEST_CONTEXT !== "kubeview-test" ||
    process.env.KUBEVIEW_TEST_NAMESPACE !== "kubeview-qa")
)
  throw Error("Dedicated test flags required");
const base = "http://127.0.0.1:5173",
  browser = await chromium.launch({
    args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
  }),
  context = await browser.newContext({
    baseURL: base,
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: "../docs/evidence/motion/recording-temp",
      size: { width: 1440, height: 900 },
    },
  }),
  page = await context.newPage(),
  started = Date.now(),
  meta = {
    date: new Date().toISOString(),
    source: live ? "Gerçek kubeview-test / kubeview-qa" : "Demo — örnek veri",
    events: [],
    errors: [],
  };
let name,
  clipStart = 0,
  clipEnd;
page.on("pageerror", (e) => meta.errors.push(e.message));
const wait = (ms) => page.waitForTimeout(ms),
  podURL = () =>
    `${base}/api/resources?context=kubeview-test&namespace=kubeview-qa&group=&version=v1&resource=pods&name=${name}`;
try {
  await page.goto(base);
  if (!live) await chooseDemo(page);
  else
    await expect(page.locator(".world-brand-control")).toContainText("Canlı");
  await readyWorld(page);
  await page.waitForFunction(
    () => document.querySelector("canvas").__harbor.fleetStates().length > 0,
  );
  if (!live) {
    await wait(4500);
    await page.screenshot({
      path: "../docs/evidence/motion/fleet-overview.png",
    });
    const uid = await page
      .locator("canvas")
      .evaluate((c) => c.__harbor.fleetStates()[0].uid);
    await clickWorld(page, { type: "node", uid });
    await page.locator(".resource-motion-controls summary").click();
    await wait(1200);
    await page.screenshot({
      path: "../docs/evidence/motion/demo-soft-node.png",
    });
    await page
      .getByRole("button", { name: "Görsel devriyeyi duraklat", exact: true })
      .click();
    await wait(1000);
    await page
      .getByRole("button", { name: "Görsel devriyeyi sürdür", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await clickWorld(page, { type: "container", containerName: "app" });
    await wait(1200);
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
      .click();
    await wait(800);
    await page.getByLabel("Deniz yüzeyi hareketi", { exact: true }).uncheck();
    await wait(1400);
    await closeWindow(page);
    await wait(2300);
    await page.screenshot({
      path: "../docs/evidence/motion/sea-off-fleet-moving.png",
    });
    await page
      .getByRole("button", { name: "Görünüm ve ayarlar", exact: true })
      .click();
    await page.getByLabel("Deniz yüzeyi hareketi", { exact: true }).check();
    await page.getByLabel("Panel teması", { exact: true }).selectOption("dark");
    await wait(900);
    await page.screenshot({
      path: "../docs/evidence/motion/demo-soft-settings-dark.png",
    });
    await closeWindow(page);
    await page
      .getByRole("button", { name: "Görsel hareketleri duraklat", exact: true })
      .click();
    await wait(1600);
    await page
      .getByRole("button", { name: "Görsel hareketleri sürdür", exact: true })
      .click();
    await wait(1700);
  } else {
    const nodes = await (
        await context.request.get(
          `${base}/api/resources?context=kubeview-test&group=&version=v1&resource=nodes`,
        )
      ).json(),
      fleet = await page
        .locator("canvas")
        .evaluate((c) => c.__harbor.fleetStates());
    const node = nodes.items.find(
      (n) =>
        !n.spec.unschedulable &&
        n.status.conditions.some(
          (c) => c.type === "Ready" && c.status === "True",
        ) &&
        fleet.some((s) => s.uid === n.metadata.uid),
    );
    if (!node) throw Error("No schedulable test Node");
    meta.node = { name: node.metadata.name, uid: node.metadata.uid };
    await clickWorld(page, { type: "node", uid: node.metadata.uid });
    await page
      .getByRole("button", { name: "Bu gemiye Pod ekle", exact: true })
      .click();
    const form = page.locator(".resource-form-dialog");
    name = `fleet-record-${Date.now()}`;
    await form.getByLabel("Kaynak adı", { exact: true }).fill(name);
    await form
      .getByLabel("Ana container image", { exact: false })
      .fill("nginx:1.27-alpine");
    await form
      .getByRole("button", { name: "Server dry-run", exact: true })
      .click();
    await expect(
      form.getByText("Server dry-run başarılı.", { exact: false }),
    ).toBeVisible();
    await page.waitForFunction(
      (uid) =>
        document
          .querySelector("canvas")
          .__harbor.fleetStates()
          .some((s) => s.uid === uid && s.eligibleForDock),
      node.metadata.uid,
      { timeout: 180000 },
    );
    clipStart = Math.max(0, (Date.now() - started) / 1000 - 4);
    await page.evaluate((uid) => {
      window.__fleetMovie = [];
      setInterval(() => {
        const s = document
          .querySelector("canvas")
          .__harbor.fleetStates()
          .find((s) => s.uid === uid);
        if (s && window.__fleetMovie.at(-1)?.state !== s.state)
          window.__fleetMovie.push({ at: performance.now(), ...s });
      }, 40);
    }, node.metadata.uid);
    await form.getByRole("button", { name: "Oluştur", exact: true }).click();
    await expect(form).toHaveCount(0);
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await page.waitForFunction(
      (uid) =>
        document
          .querySelector("canvas")
          .__harbor.fleetStates()
          .some((s) => s.uid === uid && s.state === "docked"),
      node.metadata.uid,
      { timeout: 15000 },
    );
    await wait(350);
    await page.screenshot({
      path: "../docs/evidence/motion/live-docking-crane.png",
    });
    await page.waitForFunction(
      (uid) =>
        document
          .querySelector("canvas")
          .__harbor.fleetStates()
          .some((s) => s.uid === uid && s.state === "patrolling"),
      node.metadata.uid,
      { timeout: 22000 },
    );
    await wait(1000);
    await clickWorld(page, { type: "container", name, containerName: "app" });
    await page
      .locator(".details-tabs")
      .getByRole("button", { name: "Loglar", exact: true })
      .click();
    await expect(page.locator(".log-output")).toContainText(
      "docker-entrypoint",
      { timeout: 20000 },
    );
    await wait(1400);
    await page.screenshot({
      path: "../docs/evidence/motion/live-soft-container-logs.png",
    });
    meta.events = await page.evaluate(() => window.__fleetMovie);
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await wait(2000);
  }
  clipEnd = (Date.now() - started) / 1000;
} finally {
  if (live && name) {
    const r = await context.request.get(podURL());
    if (r.ok()) {
      const p = await r.json();
      meta.pod = { name, uid: p.metadata.uid, nodeName: p.spec.nodeName };
      await context.request.delete(podURL(), {
        data: {
          uid: p.metadata.uid,
          resourceVersion: p.metadata.resourceVersion,
        },
      });
    }
  }
  const video = page.video();
  await context.close();
  const raw = await video.path(),
    dest = `../docs/evidence/motion/${live ? "live-docking-cycle" : "demo-living-fleet"}.webm`;
  if (live && clipEnd)
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-ss",
        String(clipStart),
        "-i",
        raw,
        "-t",
        String(clipEnd - clipStart),
        "-c",
        "copy",
        dest,
      ],
      { stdio: "ignore" },
    );
  else await copyFile(raw, dest);
  meta.clip = { start: clipStart, end: clipEnd };
  await writeFile(
    dest.replace(".webm", ".json"),
    JSON.stringify(meta, null, 2),
  );
  await browser.close();
  console.log(meta);
}
