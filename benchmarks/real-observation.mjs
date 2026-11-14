// Read-only cardinality observation; no benchmark events or Kubernetes mutations.
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.KUBEVIEW_REAL_URL || "http://127.0.0.1:8000";
const report = {
  date: new Date().toISOString(),
  source: "REAL read-only observation, NOT synthetic FPS benchmark",
  base,
  mutations: 0,
  performance: null,
};
try {
  const contexts = await fetch(`${base}/api/contexts`, {
    signal: AbortSignal.timeout(10000),
  }).then((r) => r.json());
  const selected = process.env.KUBEVIEW_REAL_CONTEXT || contexts.current;
  if (!selected) throw new Error("No explicit/current server context");
  const namespace = contexts.namespace || "";
  report.context = selected;
  report.namespace = namespace || "all";
  report.backendReadOnly = contexts.readOnly;
  for (const resource of ["nodes", "pods"]) {
    const q = new URLSearchParams({
      context: selected,
      version: "v1",
      resource,
      ...(resource === "pods" ? { namespace } : {}),
    });
    const response = await fetch(`${base}/api/resources?${q}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`${resource}: HTTP ${response.status}`);
    const result = await response.json();
    report[resource] = { total: result.items?.length ?? null };
    if (resource === "nodes")
      report.nodes.ready = result.items.filter((r) =>
        r.status?.conditions?.some(
          (c) => c.type === "Ready" && c.status === "True",
        ),
      ).length;
    else
      report.pods.phases = result.items.reduce((counts, r) => {
        const phase = r.status?.phase || "Unknown";
        counts[phase] = (counts[phase] || 0) + 1;
        return counts;
      }, {});
  }
  report.vmProcesses = execFileSync(
    "ps",
    ["-axo", "pid=,ppid=,time=,rss=,comm="],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter((s) =>
      /vfkit|qemu|VirtualMachine|com\.docker|hyperkit|minikube|kubelet/i.test(
        s,
      ),
    );
} catch (e) {
  report.error = e.message;
}
const out = path.join(root, "benchmarks/results/real-observation");
await mkdir(out, { recursive: true });
await writeFile(
  path.join(out, "observation.json"),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
