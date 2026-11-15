import { test, expect } from "@playwright/test";
import { clickWorld, readyWorld } from "./world.helpers";
const scope = "context=kubeview-test&namespace=kubeview-qa";
async function cleanup(request, kind, name) {
  const path = `/api/resources?${scope}&group=${kind === "deployments" ? "apps" : ""}&version=v1&resource=${kind}&name=${name}`;
  for (let i = 0; i < 6; i++) {
    const response = await request.get(path);
    if (response.status() === 404) return;
    const resource = await response.json();
    const result = await request.delete(path, {
      data: {
        uid: resource.metadata.uid,
        resourceVersion: resource.metadata.resourceVersion,
      },
    });
    if (result.status() !== 409) return;
  }
}
async function liveWorld(page) {
  await page.goto("/");
  await expect(page.locator(".world-brand-control")).toContainText(
    "kubeview-test",
  );
  await expect(page.locator(".world-brand-control")).toContainText("Canlı");
  await readyWorld(page);
}
test.beforeEach(({}, info) => {
  test.skip(
    process.env.KUBEVIEW_TEST_CONTEXT !== "kubeview-test" ||
      process.env.KUBEVIEW_TEST_NAMESPACE !== "kubeview-qa",
    "Explicit dedicated cluster and namespace required",
  );
  test.skip(
    info.project.name !== "chromium",
    "Mutation runs once; read flows run in both engines",
  );
});
test("real center → create Deployment → watch cargo → exact Pod log → scale → delete", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  const name = `world-it-${Date.now()}`,
    pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  try {
    await liveWorld(page);
    await clickWorld(page, { type: "facility", id: "center" });
    await page
      .getByRole("button", { name: "Uygulama oluştur", exact: true })
      .click();
    let dialog = page.locator(".resource-form-dialog");
    await dialog.getByLabel("Kaynak adı", { exact: true }).fill(name);
    await dialog
      .getByLabel("Ana container image", { exact: false })
      .fill("nginx:1.27-alpine");
    await dialog.getByLabel("Replica sayısı", { exact: true }).fill("2");
    await dialog
      .getByRole("button", { name: "Server dry-run", exact: true })
      .click();
    await expect(
      dialog.getByText("Server dry-run başarılı.", { exact: false }),
    ).toBeVisible();
    expect(
      (
        await request.get(
          `/api/resources?${scope}&group=apps&version=v1&resource=deployments&name=${name}`,
        )
      ).status(),
    ).toBe(404);
    await dialog.getByRole("button", { name: "Oluştur", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".resource-details h2")).toHaveText(name);
    await page.screenshot({
      path: "../docs/evidence/world/live-created-workload.png",
    });
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await expect
      .poll(
        async () => {
          const result = await request.get(
            `/api/resources?${scope}&group=apps&version=v1&resource=deployments&name=${name}`,
          );
          return (await result.json()).status?.readyReplicas;
        },
        { timeout: 60000 },
      )
      .toBe(2);
    const targets = await page
      .locator("canvas")
      .evaluate((c) => c.__harbor.projectTargets());
    const cargo = targets.find(
      (t) => t.type === "container" && t.name.startsWith(name),
    );
    expect(cargo).toBeTruthy();
    await clickWorld(page, {
      type: "container",
      uid: cargo.uid,
      containerName: "app",
    });
    await expect(page.locator(".resource-details h2")).toHaveText("app");
    await expect(page.locator(".details-container-parent")).toContainText(
      cargo.name,
    );
    await page
      .locator(".details-tabs")
      .getByRole("button", { name: "Loglar", exact: true })
      .click();
    await expect(page.locator(".logs-status")).toContainText("Canlı akış", {
      timeout: 30000,
    });
    await expect(page.locator(".log-output")).toContainText(
      "docker-entrypoint",
      { timeout: 30000 },
    );
    await page.screenshot({
      path: "../docs/evidence/world/live-container-logs.png",
    });
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await clickWorld(page, { type: "facility", id: "center" });
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Ölçekle", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Ölçekle", exact: true }).click();
    dialog = page.locator(".resource-form-dialog");
    await dialog.getByLabel("Yeni replica sayısı", { exact: true }).fill("3");
    await dialog.getByRole("button", { name: "Uygula", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(
        async () => {
          const result = await request.get(
            `/api/resources?${scope}&group=apps&version=v1&resource=deployments&name=${name}`,
          );
          return (await result.json()).status?.readyReplicas;
        },
        { timeout: 60000 },
      )
      .toBe(3);
    await page.getByRole("button", { name: "Sil", exact: true }).click();
    dialog = page.locator(".resource-form-dialog");
    await dialog
      .getByLabel(`Onaylamak için “${name}” yazın`, { exact: true })
      .fill(name);
    await dialog
      .getByRole("button", { name: "Silmeyi onayla", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".resource-details")).toContainText(
      "Bu kaynak silindi",
      { timeout: 15000 },
    );
    expect(pageErrors).toEqual([]);
  } finally {
    await cleanup(request, "deployments", name);
  }
});
test("real ship → required affinity Pod → observed chosen Node → delete; no scheduler bypass", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);
  const name = `world-target-${Date.now()}`;
  try {
    await liveWorld(page);
    const node = await clickWorld(page, {
      type: "node",
      name: "kubeview-test-m02",
    });
    await page
      .getByRole("button", { name: "Bu gemiye Pod ekle", exact: true })
      .click();
    const dialog = page.locator(".resource-form-dialog");
    await expect(
      dialog.getByLabel("Pod yerleşimi", { exact: true }),
    ).toHaveValue("required");
    await dialog.getByLabel("Kaynak adı", { exact: true }).fill(name);
    await dialog
      .getByLabel("Ana container image", { exact: false })
      .fill("nginx:1.27-alpine");
    await dialog
      .getByLabel("CPU request", { exact: false })
      .first()
      .fill("25m");
    const dryResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/resources") && r.request().method() === "POST",
    );
    await dialog
      .getByRole("button", { name: "Server dry-run", exact: true })
      .click();
    const dry = await (await dryResponse).json();
    expect(dry.object.spec.nodeName).toBeUndefined();
    expect(
      dry.object.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.every(
        (term) =>
          term.matchFields.some(
            (c) => c.key === "metadata.name" && c.values[0] === node.name,
          ),
      ),
    ).toBeTruthy();
    await expect(
      dialog.getByText("Server dry-run başarılı.", { exact: false }),
    ).toBeVisible();
    await page.screenshot({
      path: "../docs/evidence/world/live-ship-pod-form.png",
    });
    await dialog.getByRole("button", { name: "Oluştur", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect
      .poll(
        async () => {
          const r = await request.get(
            `/api/resources?${scope}&version=v1&resource=pods&name=${name}`,
          );
          return (await r.json()).spec?.nodeName;
        },
        { timeout: 60000 },
      )
      .toBe(node.name);
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click();
    await page.waitForTimeout(2500);
    await clickWorld(page, { type: "container", name, containerName: "app" });
    await expect(page.locator(".details-container-parent")).toContainText(name);
    await page.screenshot({
      path: "../docs/evidence/world/live-ship-created-pod.png",
    });
  } finally {
    await cleanup(request, "pods", name);
  }
});
