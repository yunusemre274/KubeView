import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { publicLab } from "./v11-lab.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const evidenceDir = path.join(root, "artifacts/v1.1.0/v11-20261108/qa");
const exec = promisify(execFile);
const hash = (data) => createHash("sha256").update(data).digest("hex");

async function filesBelow(dir, prefix = "") {
  const files = [];
  for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(path.join(dir, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

export async function sourceIdentity(lab) {
  const sourceFiles = ["frontend/package.json", "frontend/package-lock.json", "frontend/index.html", "backend/go.mod", "backend/go.sum"];
  for (const file of await filesBelow(path.join(root, "frontend/src"))) sourceFiles.push(`frontend/src/${file}`);
  for (const file of await filesBelow(path.join(root, "backend"))) {
    if (file.endsWith(".go") && !file.endsWith("_test.go")) sourceFiles.push(`backend/${file}`);
  }
  const files = {};
  for (const file of sourceFiles.sort()) files[file] = hash(await fs.readFile(path.join(root, file)));
  const testFiles = {};
  for (const file of await filesBelow(path.join(root, "frontend/e2e"))) {
    if (path.basename(file).startsWith("v11-")) testFiles[`frontend/e2e/${file}`] = hash(await fs.readFile(path.join(root, "frontend/e2e", file)));
  }
  const build = {};
  if (lab.backendBinary) build.backendBinarySHA256 = hash(await fs.readFile(lab.backendBinary));
  if (lab.staticDir) {
    const assets = {};
    for (const file of await filesBelow(lab.staticDir)) assets[file] = hash(await fs.readFile(path.join(lab.staticDir, file)));
    build.staticFiles = assets;
    build.staticSHA256 = hash(JSON.stringify(assets));
  }
  return { gitHead: (await exec("git", ["rev-parse", "HEAD"], { cwd: root })).stdout.trim(),
    sourceSHA256: hash(JSON.stringify(files)), files, suiteSHA256: hash(JSON.stringify(testFiles)), testFiles, build,
    packageVersion: JSON.parse(await fs.readFile(path.join(root, "frontend/package.json"), "utf8")).version };
}

export async function beginEvidence(page, info, lab, acceptanceIDs) {
  const startedWallMs = Date.now(), startedMonotonicMs = performance.now();
  const runID = `${new Date().toISOString().replace(/[:.]/g, "-")}-${info.project.name}-${randomUUID().slice(0, 8)}`;
  const runDir = path.join(evidenceDir, "runs", runID);
  await fs.mkdir(runDir, { recursive: true });
  const result = {
    schemaVersion: 1, runID, title: info.title, acceptanceIDs, startedAt: new Date().toISOString(),
    status: "BLOCKED", testType: "real normal production UI + independent actual Kubernetes API assertions",
    command: process.env.KV_V11_INVOKED_COMMAND || "KV_V11_CONFIG_FILE=/private/config.env KV_V11_TEST_LEASE=v11-20261108-qa npx playwright test -c e2e/v11-playwright.config.js",
    environment: { os: `${os.platform()} ${os.release()} ${os.arch()}`, browser: info.project.name,
      browserVersion: page.context().browser()?.version(), viewport: page.viewportSize(), ...publicLab(lab) },
    sourceStart: await sourceIdentity(lab), sourceEnd: null, checks: [], captures: [], pageErrorCount: 0, pageErrors: [],
    limits: ["API accepted is distinct from controller completion", "No physical latency/presented-FPS claim", "No Secret/reveal/credential bodies recorded"],
  };
  const pageError = (error) => {
    result.pageErrorCount++;
    const message = String(error.message || error.name || "pageerror").split(/\nCall log:/)[0]
      .replace(/((?:X-KubeView-Connection|Cookie|Set-Cookie|Authorization)\s*[:=]\s*)[^\r\n]*/gi, "$1[REDACTED]")
      .replace(/([?&]connectionID=)[^&\s"'<>]*/gi, "$1[REDACTED]")
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_TOKEN]");
    result.pageErrors.push({ name: error.name, message });
  };
  page.on("pageerror", pageError);
  const save = () => fs.writeFile(path.join(runDir, "result.json"), `${JSON.stringify(result, null, 2)}\n`);
  await save();
  return {
    result,
    check(name, metadata = {}) { result.checks.push({ at: new Date().toISOString(), ...metadata,
      ...(metadata.name ? { resourceName: metadata.name } : {}), name, status: "PASS" }); },
    async capture(label) {
      const filename = `${String(result.captures.length + 1).padStart(2, "0")}-${label}.png`;
      await page.screenshot({ path: path.join(runDir, filename) });
      const visibleScope = await page.evaluate(() => ({
        context: document.querySelector('select[aria-label="Cluster / context"]')?.value,
        namespace: document.querySelector('select[aria-label="Namespace kapsamı"]')?.value,
        manualNamespace: document.querySelector('input[aria-label="Namespace adıyla kapsam"]')?.value,
        alerts: [...document.querySelectorAll('.connection-window [role="alert"]')].map((node) => node.textContent),
      }));
      result.captures.push({ label, path: filename, at: new Date().toISOString(), visibleScope });
      await save();
    },
    async finish() {
      result.sourceEnd = await sourceIdentity(lab);
      result.sourceUnchanged = result.sourceStart.sourceSHA256 === result.sourceEnd.sourceSHA256;
      result.suiteUnchanged = result.sourceStart.suiteSHA256 === result.sourceEnd.suiteSHA256;
      result.buildUnchanged = JSON.stringify(result.sourceStart.build) === JSON.stringify(result.sourceEnd.build);
      result.finishedAt = new Date().toISOString();
      result.clock = { elapsedWallMs: Date.now() - startedWallMs, elapsedMonotonicMs: performance.now() - startedMonotonicMs };
      result.clock.skewMs = result.clock.elapsedWallMs - result.clock.elapsedMonotonicMs;
      result.clock.valid = Math.abs(result.clock.skewMs) < 2000;
      result.status = info.status === "passed" ? "PASS" : info.status === "skipped" ? "SKIP" : "FAIL";
      if (!result.sourceUnchanged || !result.suiteUnchanged || !result.buildUnchanged || !result.clock.valid || result.pageErrorCount) {
        result.status = "FAIL";
        result.integrityFailure = true;
      }
      page.off("pageerror", pageError);
      await save();
      await info.attach("v11-evidence", { path: path.join(runDir, "result.json"), contentType: "application/json" });
      return result;
    },
  };
}
