import { expect } from "@playwright/test";
export async function readyWorld(page) {
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.waitForFunction(
    () => document.querySelector("canvas")?.__harbor?.projectTargets,
  );
  await page.waitForTimeout(200);
}
export async function target(page, match) {
  return page
    .locator("canvas")
    .evaluate(
      (canvas, match) =>
        canvas.__harbor
          .projectTargets()
          .find(
            (t) =>
              t.visible && Object.entries(match).every(([k, v]) => t[k] === v),
          ),
      match,
    );
}
export async function clickWorld(page, match) {
  await readyWorld(page);
  await expect
    .poll(async () => Boolean(await target(page, match)), {
      message: `Projected world target ${JSON.stringify(match)}`,
    })
    .toBeTruthy();
  const t = await target(page, match);
  await page.mouse.click(t.x, t.y);
  return t;
}
export async function chooseDemo(page) {
  await page.goto("/");
  await page
    .getByRole("button", {
      name: "Bağlantı ve cluster kapsamını aç",
      exact: true,
    })
    .click();
  await page
    .getByLabel("Cluster / context", { exact: true })
    .selectOption("__demo__");
  await expect(page.locator(".world-brand-control")).toContainText("Demo");
  await page
    .getByRole("button", { name: "Pencereyi kapat", exact: true })
    .click();
  await readyWorld(page);
}
export async function closeWindow(page) {
  await page
    .getByRole("button", { name: "Pencereyi kapat", exact: true })
    .click();
  await expect(page.locator(".world-window")).toHaveCount(0);
}
