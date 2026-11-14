import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { launch, dir, runtime, get, sleep } from "./repair-ui.mjs";
const rgb = (s) => { if (s.startsWith("#")) return s.slice(1).match(/../g).map((n) => parseInt(n, 16)); return s.match(/[\d.]+/g).slice(0, 3).map(Number); };
const luminance = (s) => rgb(s).map((n) => n / 255).map((n) => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((v, n, i) => v + n * [.2126, .7152, .0722][i], 0);
const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
const prefix = process.env.KV_CONTRAST_EVIDENCE || "frontend-final-contrast";
const output = `${dir}/${prefix}.json`; await fs.writeFile(output, "{}", { flag: "wx" });
const report = { startedAt: new Date().toISOString(), source: "Real normal UI/computed colors, all states settled; no style injection", engines: [] };
const source = await get("pod", "flow-client", runtime.namespace);
for (const engine of ["chromium", "webkit"]) {
 const ui = await launch(`${prefix}-${engine}`, { engine, video: false }), { page, result } = ui; report.engines.push(result); result.rows = [];
 async function styles(locator) {
  return locator.evaluate((element) => {
   const style = getComputedStyle(element); let parent = element.parentElement, background = "transparent";
   while (parent) { const s = getComputedStyle(parent); if (!/rgba\([^)]*,\s*0\)|transparent/.test(s.backgroundColor)) { background = s.backgroundColor; break; } parent = parent.parentElement; }
   return { color: style.color, background: style.backgroundColor, parentBackground: background, border: style.borderColor, outline: style.outlineColor, outlineWidth: style.outlineWidth, outlineStyle: style.outlineStyle, opacity: style.opacity, disabled: element.disabled, focused: document.activeElement === element, backgroundTransition: style.transitionProperty };
  });
 }
 async function read(label, locator, focus = false, hover = false) {
  if (hover) await locator.hover();
  if (focus) { await sleep(150); await page.keyboard.press("Tab"); await locator.focus(); }
  await sleep(160); const s = await styles(locator);
  const row = { label, ...s, textContrast: ratio(s.color, s.background), boundaryContrast: ratio(s.border, s.parentBackground), focusContrast: ratio(s.outline, s.parentBackground) };
  result.rows.push(row);
  if (!s.disabled) { assert(row.textContrast >= 4.5, `${engine}:${label} text ${row.textContrast}`); assert(row.boundaryContrast >= 3, `${engine}:${label} boundary ${row.boundaryContrast}`); }
  if (focus) { assert(s.focused && s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2, `${label} lacks independent focus outline`); assert(row.focusContrast >= 3, `${label} focus ${row.focusContrast}`); }
  if (s.disabled) row.requirement = "Inactive controls exempt from WCAG text/nontext contrast minimum; actual styles recorded, not claimed enabled-state pass.";
  return row;
 }
 try {
  await ui.start(); await ui.find(source.metadata.name, "Pod"); await ui.close(); // Ensure workbench CSS is loaded.
  for (const [theme, contrast, system] of [["light", "normal", "light"], ["dark", "normal", "dark"], ["light", "high", "light"], ["dark", "high", "dark"], ["system", "high", "dark"], ["system", "normal", "light"]]) {
   await page.emulateMedia({ colorScheme: system }); await page.getByRole("button", { name: "Görünüm ve ayarlar", exact: true }).click(); const panel = page.locator(".preferences-window");
   await panel.getByLabel("Panel teması", { exact: true }).selectOption(theme); await panel.getByLabel("Kontrast", { exact: true }).selectOption(contrast);
   // No text/surface crossfade is allowed even in the first theme frame.
   const immediate = await styles(panel.getByRole("button", { name: "Görsel hareketi duraklat", exact: true }));
   assert(ratio(immediate.color, immediate.background) >= 4.5, `${engine} immediate theme transition contrast`);
   await sleep(180); const base = `${theme}/${contrast}/system-${system}`;
   await read(`${base}:button`, panel.getByRole("button", { name: "Görsel hareketi duraklat", exact: true }));
   await read(`${base}:hover`, panel.getByRole("button", { name: "Görsel hareketi duraklat", exact: true }), false, true);
   await read(`${base}:icon-focus`, panel.getByRole("button", { name: "Pencereyi kapat", exact: true }), true);
   await read(`${base}:select-focus`, panel.getByLabel("Panel teması", { exact: true }), true);
   if (theme !== "system") await ui.capture(`${theme}-${contrast}-settled`);
   await ui.close();
   await page.getByRole("button", { name: "Bağlantı ve cluster kapsamını aç", exact: true }).click();
   await read(`${base}:input-focus`, page.getByLabel("Namespace adıyla kapsam", { exact: true }), true); await ui.close();
   await ui.find(source.metadata.name, "Pod"); await page.getByRole("button", { name: "Düzenle", exact: true }).click();
   const form = page.locator(".resource-form-dialog"); await form.getByLabel("Namespace", { exact: true }).waitFor();
   await read(`${base}:disabled-namespace`, form.getByLabel("Namespace", { exact: true }));
   await page.getByRole("button", { name: "Formu kapat", exact: true }).click(); const discard = page.getByRole("button", { name: "Taslağı bırak ve kapat", exact: true }); if (await discard.count()) await discard.click(); await ui.close();
  }
  result.status = "PASSED";
 } catch (error) { result.status = "FAILED"; result.error = error.stack; await ui.capture("failed").catch(() => {}); }
 finally { await ui.finish(); await fs.writeFile(output, JSON.stringify(report, null, 2)); }
}
report.status = report.engines.every((e) => e.status === "PASSED") ? "PASSED" : "FAILED";report.endedAt = new Date().toISOString();await fs.writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, engines: report.engines.map((e) => ({ engine: e.engine, status: e.status, rows: e.rows.length, error: e.error?.split("\n")[0], minEnabledText: Math.min(...e.rows.filter((r) => !r.disabled).map((r) => r.textContrast)), minBoundary: Math.min(...e.rows.filter((r) => !r.disabled).map((r) => r.boundaryContrast)), minFocus: Math.min(...e.rows.filter((r) => r.focused).map((r) => r.focusContrast)) })), evidence: output }));
if (report.status !== "PASSED") process.exitCode = 1;
