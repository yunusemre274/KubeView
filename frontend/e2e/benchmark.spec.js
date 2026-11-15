// Opt-in: requires the isolated benchmark Go fixture, never a real cluster.
import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { installProbe } from "../../benchmarks/probe.mjs";
import { clickWorld, closeWindow } from "./world.helpers.js";
test.skip(
  process.env.KUBEVIEW_BENCH_BROWSER !== "1",
  "Explicit fixture-only test",
);
const out =
  process.env.KUBEVIEW_BENCH_EVIDENCE_DIR ||
  fileURLToPath(
    new URL("../../benchmarks/results/functional/", import.meta.url),
  );
const upstream = async (request) =>
  (await request.get("/__benchmark/state")).json();
const resources = (page) =>
  page.evaluate(() => Object.values(__KUBEVIEW_BENCHMARK__.resources));
test.beforeEach(async ({ context, page }) => {
  await context.addInitScript(installProbe);
  await context.addInitScript(() => {
    localStorage.setItem(
      "kubeview.preferences.v1",
      JSON.stringify({
        version: 1,
        quality: "medium",
        theme: "light",
        motionPreference: "full",
      }),
    );
    localStorage.setItem("kubeview-world-guide", "seen");
    addEventListener("DOMContentLoaded", () => {
      const label = document.createElement("div");
      label.textContent = "BENCHMARK — sentetik, salt okunur";
      label.style.cssText =
        "position:fixed;bottom:8px;left:8px;z-index:9999;background:#17212f;color:white;padding:6px 10px;font:12px sans-serif;pointer-events:none";
      document.body.append(label);
    });
  });
  await page.goto("/");
  await page.waitForFunction(
    () =>
      document.querySelector("canvas")?.__harbor?.stats()?.lifecycle
        ?.canonicalPods === 300,
  );
  await mkdir(out, { recursive: true });
});
test("production watcher -> store -> moving instance preserves replacement UID and resync", async ({
  page,
  request,
}, info) => {
  const initial = await resources(page),
    old = initial.find((r) => r.kind === "Pod" && r.metadata.name === "app-0");
  const node = initial.find(
    (r) => r.kind === "Node" && r.metadata.name === old.spec.nodeName,
  );
  await clickWorld(page, {
    type: "container",
    uid: old.metadata.uid,
    containerName: "app",
  });
  await expect(page.locator(".resource-details h2")).toHaveText("app");
  await expect(page.locator(".details-container-parent")).toContainText(
    "app-0",
  );
  const canvas = page.locator("canvas");
  await canvas.evaluate((c) => (c.dataset.benchmarkIdentity = "same-canvas"));
  const replacement = structuredClone(old);
  replacement.metadata.uid = `replacement-${info.project.name}`;
  replacement.metadata.resourceVersion = "replacement-version";
  const broken = structuredClone(node);
  broken.metadata.resourceVersion = "node-not-ready";
  broken.status.conditions = [{ type: "Ready", status: "False" }];
  const response = await request.post("/__benchmark/replay", {
    data: [
      { action: "DELETE", object: old, sequence: 1, atMs: 0 },
      { action: "ADD", object: replacement, sequence: 2, atMs: 200 },
      { action: "UPDATE", object: broken, sequence: 3, atMs: 400 },
    ],
  });
  expect(response.status()).toBe(202);
  await expect(page.locator(".resource-details")).toContainText(
    "Bu kaynak silindi",
  );
  await expect
    .poll(async () => {
      const list = await resources(page);
      return (
        list.some((r) => r.metadata.uid === replacement.metadata.uid) &&
        !list.some((r) => r.metadata.uid === old.metadata.uid)
      );
    })
    .toBeTruthy();
  expect((await resources(page)).filter((r) => r.kind === "Pod")).toHaveLength(
    300,
  );
  await page.screenshot({
    path: `${out}/${info.project.name}-deleted-uid.png`,
  });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await clickWorld(page, { type: "node", uid: node.metadata.uid });
  await expect(page.locator(".resource-details h2")).toHaveText(
    node.metadata.name,
  );
  await page.screenshot({ path: `${out}/${info.project.name}-node.png` });
  await page.evaluate(() => __KUBEVIEW_BENCHMARK__.latestSocket.close());
  await page.waitForFunction(() => __KUBEVIEW_BENCHMARK__.snapshots >= 2);
  await expect(canvas).toHaveAttribute(
    "data-benchmark-identity",
    "same-canvas",
  );
  expect((await resources(page)).filter((r) => r.kind === "Node")).toHaveLength(
    20,
  );
  expect(
    (await resources(page)).find(
      (r) => r.metadata.uid === replacement.metadata.uid,
    ).spec.nodeName,
  ).toBe(old.spec.nodeName);
  const healthy = structuredClone(node);
  healthy.metadata.resourceVersion = "node-ready-again";
  await request.post("/__benchmark/replay", {
    data: [{ action: "UPDATE", object: healthy, sequence: 4, atMs: 0 }],
  });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await clickWorld(page, {
    type: "container",
    uid: replacement.metadata.uid,
    containerName: "app",
  });
  await expect(page.locator(".resource-details h2")).toHaveText("app");
});
test("long real HTTP stream stays bounded; container switch and close abort subscriptions", async ({
  page,
  request,
}, info) => {
  const before = await upstream(request);
  await page.getByRole("button", { name: "Bul", exact: true }).click();
  await page.locator(".world-window input").first().fill("app-0");
  await page
    .locator(".finder-result")
    .filter({ has: page.locator("small", { hasText: "Pod · bench-0" }) })
    .filter({ has: page.locator("strong", { hasText: /^app-0$/ }) })
    .click();
  await page
    .locator(".details-tabs")
    .getByRole("button", { name: "Loglar", exact: true })
    .click();
  await expect(page.locator(".pod-logs")).toContainText(
    "Görünüm sınırına ulaşıldı",
    { timeout: 15000 },
  );
  const size = await page
    .locator(".log-output")
    .evaluate((el) => new TextEncoder().encode(el.textContent).byteLength);
  expect(size).toBeLessThanOrEqual(1024 * 1024);
  await page.locator(".pod-logs select").first().selectOption("sidecar");
  await expect
    .poll(async () => {
      const state = await upstream(request);
      return state.logRequests.at(-1)?.container;
    })
    .toBe("sidecar");
  const state = await upstream(request);
  expect(state.logRequests.at(-1)).toEqual({
    namespace: "bench-0",
    pod: "app-0",
    container: "sidecar",
  });
  await page.screenshot({
    path: `${out}/${info.project.name}-bounded-log.png`,
  });
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await expect
    .poll(async () => {
      const s = await upstream(request);
      return s.logOpened - s.logClosed;
    })
    .toBe(0);
  const after = await upstream(request);
  expect(after.logOpened - before.logOpened).toBe(2);
  await clickWorld(page, { type: "facility", id: "center" });
  await closeWindow(page);
});

test("node panel preserves live related updates, close/reopen and same canvas", async ({
  page,
  request,
}, info) => {
  const list = await resources(page);
  const node = list.find((r) => r.kind === "Node");
  const related = list.find(
    (r) =>
      r.kind === "Pod" &&
      r.spec?.nodeName === node.metadata.name &&
      r.metadata.name !== "app-0",
  );
  const unrelated = list.find(
    (r) =>
      r.kind === "Pod" &&
      r.spec?.nodeName &&
      r.spec.nodeName !== node.metadata.name,
  );
  await clickWorld(page, { type: "node", uid: node.metadata.uid });
  await page
    .locator("canvas")
    .evaluate((c) => (c.dataset.panelIdentity = "preserved"));
  const own = structuredClone(related),
    other = structuredClone(unrelated);
  own.metadata.resourceVersion = `related-${info.project.name}`;
  other.metadata.resourceVersion = `unrelated-${info.project.name}`;
  own.status.containerStatuses[0].restartCount += 23;
  other.status.containerStatuses[0].restartCount += 17;
  const result = await request.post("/__benchmark/replay", {
    data: [
      { action: "UPDATE", object: other, sequence: 501, atMs: 0 },
      { action: "UPDATE", object: own, sequence: 502, atMs: 150 },
    ],
  });
  expect(result.status()).toBe(202);
  const row = page
    .locator(".node-pod-row")
    .filter({ has: page.getByText(own.metadata.name, { exact: true }) });
  await expect(row).toContainText(
    `${own.status.containerStatuses[0].restartCount} restart`,
  );
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await clickWorld(page, { type: "node", uid: node.metadata.uid });
  await expect(row).toContainText(
    `${own.status.containerStatuses[0].restartCount} restart`,
  );
  expect(await page.locator("canvas").getAttribute("data-panel-identity")).toBe(
    "preserved",
  );
  await row.click();
  await expect(page.locator(".resource-details h2")).toHaveText(
    own.metadata.name,
  );
});

test("live log updates preserve inspected scroll position and explicit return to tail", async ({
  page,
}) => {
  const pod = (await resources(page)).find(
    (r) => r.kind === "Pod" && r.metadata.name === "app-0",
  );
  await clickWorld(page, {
    type: "container",
    uid: pod.metadata.uid,
    containerName: "app",
  });
  await page
    .locator(".details-tabs")
    .getByRole("button", { name: "Loglar", exact: true })
    .click();
  const output = page.locator(".log-output");
  await expect
    .poll(() => output.evaluate((e) => e.scrollHeight - e.clientHeight))
    .toBeGreaterThan(200);
  await output.evaluate((e) => {
    e.scrollTop = 0;
    e.dispatchEvent(new Event("scroll"));
  });
  await expect(
    page.getByRole("button", { name: "En alta dön", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(500);
  expect(await output.evaluate((e) => e.scrollTop)).toBeLessThan(24);
  await page.getByRole("button", { name: "En alta dön", exact: true }).click();
  await expect
    .poll(() =>
      output.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop),
    )
    .toBeLessThan(24);
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
});

test("pause aborts the real log stream; resume opens one fresh tail and close cleans up", async ({
  page,
  request,
}) => {
  await expect
    .poll(async () => {
      const s = await upstream(request);
      return s.logOpened - s.logClosed;
    })
    .toBe(0);
  const before = await upstream(request);
  const pod = (await resources(page)).find(
    (r) => r.kind === "Pod" && r.metadata.name === "app-0",
  );
  await clickWorld(page, {
    type: "container",
    uid: pod.metadata.uid,
    containerName: "app",
  });
  await page
    .locator(".details-tabs")
    .getByRole("button", { name: "Loglar", exact: true })
    .click();
  const output = page.locator(".log-output");
  await expect
    .poll(async () => (await output.textContent()).length)
    .toBeGreaterThan(100);
  await expect
    .poll(async () => {
      const s = await upstream(request);
      return [s.logOpened - before.logOpened, s.logOpened - s.logClosed];
    })
    .toEqual([1, 1]);
  await page
    .getByRole("button", { name: "Log akışını duraklat", exact: true })
    .click();
  await expect
    .poll(async () => {
      const s = await upstream(request);
      return [s.logClosed - before.logClosed, s.logOpened - s.logClosed];
    })
    .toEqual([1, 0]);
  const pausedText = await output.textContent();
  await page.waitForTimeout(400);
  expect(await output.textContent()).toBe(pausedText);
  await expect(page.locator(".pod-logs")).toContainText(
    "Duraklatma sunucu akışını kapatır",
  );

  const freshRequest = page.waitForRequest((r) =>
    new URL(r.url()).pathname === "/api/logs",
  );
  await page
    .getByRole("button", { name: "Logları yeniden bağla", exact: true })
    .click();
  const query = new URL((await freshRequest).url()).searchParams;
  expect(query.get("namespace")).toBe(pod.metadata.namespace);
  expect(query.get("pod")).toBe(pod.metadata.name);
  expect(query.get("container")).toBe("app");
  expect(query.get("tailLines")).toBe("150");
  expect(query.get("follow")).toBe("true");
  await expect
    .poll(async () => {
      const s = await upstream(request);
      return [s.logOpened - before.logOpened, s.logOpened - s.logClosed];
    })
    .toEqual([2, 1]);
  expect((await upstream(request)).logRequests.at(-1)).toEqual({
    namespace: pod.metadata.namespace,
    pod: pod.metadata.name,
    container: "app",
  });
  await expect
    .poll(async () => (await output.textContent()).length)
    .toBeGreaterThan(100);
  await page
    .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
    .click();
  await expect
    .poll(async () => {
      const s = await upstream(request);
      return [s.logClosed - before.logClosed, s.logOpened - s.logClosed];
    })
    .toEqual([2, 0]);
});
