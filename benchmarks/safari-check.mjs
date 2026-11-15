import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const i = process.argv.indexOf("--id");
const evidenceId =
  i < 0 ? `native-safari-access-${Date.now()}` : process.argv[i + 1];
if (!/^[\w.-]+$/.test(evidenceId)) throw Error("Invalid result id");
const out = path.join(root, "benchmarks/results", evidenceId);
await mkdir(out, { recursive: true });
const report = {
  date: new Date().toISOString(),
  method: "Installed safaridriver, availability only; NOT an FPS measurement",
  version: execFileSync("/usr/bin/safaridriver", ["--version"], {
    encoding: "utf8",
  }).trim(),
  status: "pending",
};
const child = spawn("/usr/bin/safaridriver", ["--port", "6199"], {
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (b) => (output += b));
child.stderr.on("data", (b) => (output += b));
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch("http://127.0.0.1:6199/status", {
        signal: AbortSignal.timeout(1000),
      });
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw new Error("safaridriver did not become ready");
  const response = await fetch("http://127.0.0.1:6199/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      capabilities: { alwaysMatch: { browserName: "safari" } },
    }),
    signal: AbortSignal.timeout(70000),
  });
  report.httpStatus = response.status;
  report.response = await response.json();
  const session = report.response.value?.sessionId;
  report.status = session ? "available" : "unavailable";
  if (session)
    await fetch(`http://127.0.0.1:6199/session/${session}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(5000),
    });
} catch (e) {
  report.status = "unavailable";
  report.error = e.message;
} finally {
  child.kill("SIGTERM");
  report.driverOutput = output;
  report.finishedAt = new Date().toISOString();
  await writeFile(
    path.join(out, "availability.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
if (report.status !== "available") process.exitCode = 2;
