import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function safeError(error) {
  // Browser/API request Call logs can include the current operator nonce. Keep
  // the useful assertion message, discard request call logs and all stacks.
  const message = String(error?.message || "").split(/\nCall log:/)[0]
    .replace(/((?:X-KubeView-Connection|Cookie|Set-Cookie|Authorization)\s*[:=]\s*)[^\r\n]*/gi, "$1[REDACTED]")
    .replace(/([?&]connectionID=)[^&\s"'<>]*/gi, "$1[REDACTED]")
    .replace(/((?:connectionID|kubeview_operator)["']?\s*[:=]\s*["']?)[A-Za-z0-9_.+/=-]+/gi, "$1[REDACTED]");
  return { name: error?.name || "Error", message };
}

export default class V11Reporter {
  constructor() {
    const runID = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
    this.results = { schemaVersion: 1, runID, startedAt: new Date().toISOString(), tests: [], errors: [] };
  }
  onBegin(_config, suite) {
    this.results.expectedTests = suite.allTests().length;
    process.stdout.write(`[KV-QA-MANAGER] Starting ${this.results.expectedTests} bounded browser cases\n`);
  }
  onTestEnd(test, result) {
    const status = result.status === "passed" ? "PASS" : result.status === "skipped" ? "SKIP" : "FAIL";
    this.results.tests.push({ title: test.title, project: test.parent.project()?.name, status,
      durationMs: result.duration, retry: result.retry, errors: result.errors.map(safeError),
      attachments: result.attachments.map(({ name, path: attachmentPath, contentType }) => ({ name, path: attachmentPath, contentType })) });
    process.stdout.write(`[KV-QA-MANAGER] ${status} ${test.title}\n`);
  }
  onError(error) { this.results.errors.push(safeError(error)); }
  async onEnd(result) {
    this.results.finishedAt = new Date().toISOString();
    this.results.runnerStatus = result.status;
    this.results.counts = this.results.tests.reduce((all, test) => ({ ...all, [test.status]: all[test.status] + 1 }), { PASS: 0, FAIL: 0, SKIP: 0 });
    const output = path.join(root, "artifacts/v1.1.0/v11-20261108/qa/playwright-results.json");
    await fs.mkdir(path.dirname(output), { recursive: true });
    const immutableDir = path.join(path.dirname(output), "runner-results");
    await fs.mkdir(immutableDir, { recursive: true });
    this.results.immutableResult = `runner-results/${this.results.runID}.json`;
    await fs.writeFile(path.join(immutableDir, `${this.results.runID}.json`), `${JSON.stringify(this.results, null, 2)}\n`, { flag: "wx" });
    await fs.writeFile(output, `${JSON.stringify(this.results, null, 2)}\n`);
    process.stdout.write(`[KV-QA-MANAGER] ${JSON.stringify(this.results.counts)}; ${result.status}\n`);
  }
}
