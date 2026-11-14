import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const evidenceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../artifacts/v1.1.0/v11-20261108/qa");
const attemptID = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;

// No webServer: the manager supplies an independently built, same-origin
// production package and grants a test lease before invoking this config.
export default defineConfig({
  testDir: ".",
  testMatch: "v11-*.spec.js",
  workers: 1,
  fullyParallel: false,
  timeout: 180000,
  expect: { timeout: 15000 },
  outputDir: path.join(evidenceDir, "browser-artifacts", attemptID),
  reporter: [["./v11-reporter.mjs"]],
  use: { viewport: { width: 1440, height: 900 }, actionTimeout: 15000, navigationTimeout: 20000,
    trace: "off", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, launchOptions: process.platform === "darwin" ? { args: ["--use-angle=metal"] } : {} } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } } },
  ],
});
