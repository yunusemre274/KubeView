import { test, expect } from "./v11-fixtures.js";
import { chooseScope } from "./v11-ui.helpers.js";

test("V11-16 finder mouse versus keyboard trigger focus restoration probe", async ({ page, lab, evidence }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(lab.baseURL); await chooseScope(page, lab.slots.A.context, lab.namespace);
  await page.setViewportSize({ width: 768, height: 900 });
  const trigger = page.getByRole("button", { name: "Bul", exact: true });
  const active = () => page.evaluate(() => ({ tag: document.activeElement?.tagName,
    id: document.activeElement?.id || null, label: document.activeElement?.getAttribute("aria-label") || null }));
  const records = [];
  for (const activation of ["mouse", "keyboard"]) {
    const before = await active();
    if (activation === "mouse") await trigger.click();
    else await trigger.press("Enter");
    const finder = page.getByRole("dialog", { name: "Dünyada bul", exact: true });
    await expect(finder).toBeVisible();
    const input = finder.getByLabel("Nesne veya kaynak ara", { exact: true });
    await expect(input).toBeFocused(); await input.fill("v11"); await input.press("Escape");
    await expect(finder).toHaveCount(0);
    const after = await active(); records.push({ activation, before, after });
    evidence.result.finderFocusProbe = records;
    await evidence.capture(`${activation}-finder-escape-focus`);
    expect.soft(after.id, `${activation} activation should restore focus to the finder trigger`).toBe("world-find");
  }
});
