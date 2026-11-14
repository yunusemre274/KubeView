import { test as base, expect } from "@playwright/test";
import { loadLab, guardScope, LabBlocked } from "./v11-lab.mjs";
import { beginEvidence } from "./v11-evidence.mjs";

if (process.env.KV_V11_TEST_LEASE !== "v11-20261108-qa")
  throw new LabBlocked("Root manager QA execution lease is absent; refusing test collection before browser startup");

export const test = base.extend({
  lab: async ({}, use) => {
    if (process.env.KV_V11_TEST_LEASE !== "v11-20261108-qa")
      throw new LabBlocked("Root manager QA test lease required; no browser/cluster run is authorized by this helper");
    const lab = await loadLab();
    if (!lab.backendBinary || !lab.staticDir)
      throw new LabBlocked("Production binary and static build paths are required for source/build evidence");
    await guardScope(lab, lab.slots.A);
    await guardScope(lab, lab.slots.B);
    await use(lab);
  },
  evidence: [async ({ page, lab }, use, info) => {
    const ids = [...info.title.matchAll(/V11-\d{2}/g)].map((match) => match[0]);
    const evidence = await beginEvidence(page, info, lab, ids);
    const failFast = (error) => {
      const safeMessage = evidence.result.pageErrors.at(-1)?.message || error.name || "Application pageerror";
      const failure = new Error(`Application pageerror: ${safeMessage}`);
      failure.name = "ApplicationPageError";
      throw failure;
    };
    page.on("pageerror", failFast);
    await use(evidence);
    page.off("pageerror", failFast);
    const result = await evidence.finish();
    expect(result.sourceUnchanged, "Product source changed during this run").toBe(true);
    expect(result.suiteUnchanged, "QA suite source changed during this run").toBe(true);
    expect(result.buildUnchanged, "Production build changed during this run").toBe(true);
    expect(result.clock.valid, "Wall/monotonic clock discontinuity invalidated this attempt").toBe(true);
    expect(result.pageErrorCount, "Unexpected application errors").toBe(0);
  }, { auto: true }],
});

export { expect };
