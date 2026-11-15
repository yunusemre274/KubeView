// Explicit manual Safari/real-device entry: same production App and Go path.
import { spawn, execFileSync } from "node:child_process";
import { mkdir, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fixture, VERSION } from "./fixtures.mjs";
import { installProbe } from "./probe.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2),
  opt = (key, fallback) => {
    const i = args.indexOf(`--${key}`);
    return i < 0 ? fallback : args[i + 1];
  };
const phase = opt("phase", "optimized"),
  buildTag = opt("build-tag", phase),
  backendTag = opt("backend-tag", ""),
  id = opt("id", `manual-${Date.now()}`),
  profile = opt("profile", "M"),
  port = opt("port", "5195");
if (!["baseline", "optimized"].includes(phase) || !/^\d+$/.test(port))
  throw new Error("Invalid options");
if (![buildTag, id, backendTag || "default"].every((s) => /^[\w.-]+$/.test(s)))
  throw Error("Invalid identity");
const build = path.join(root, "benchmarks/.build", buildTag),
  out = path.join(root, "benchmarks/results", id);
const backendFile = path.join(
  root,
  "benchmarks/.build",
  ...(backendTag ? [backendTag, "backend.test"] : ["manual-backend.test"]),
);
await mkdir(out, { recursive: true });
await mkdir(path.join(root, "benchmarks/.build"), { recursive: true });
if (!args.includes("--reuse-build")) {
  try {
    await access(path.join(build, "index.html"));
    if (!args.includes("--replace-build"))
      throw new Error(
        `Frozen ${phase} build exists; use --reuse-build or --replace-build`,
      );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  execFileSync(
    "npm",
    [
      "--prefix",
      "frontend",
      "run",
      "build",
      "--",
      "--outDir",
      build,
      "--emptyOutDir",
    ],
    { cwd: root, stdio: "inherit" },
  );
}
if (!args.includes("--reuse-binary"))
  execFileSync("go", ["test", "-c", "-o", backendFile, "./pkg/server"], {
    cwd: path.join(root, "backend"),
    stdio: "inherit",
  });
const input = path.join(
    root,
    `benchmarks/.build/${id}-fixture-${profile}.json`,
  ),
  bootstrap = path.join(root, `benchmarks/.build/${id}-bootstrap.js`);
await writeFile(input, JSON.stringify(fixture(profile)));
await writeFile(
  bootstrap,
  `(${installProbe.toString()})();
localStorage.setItem('kubeview.preferences.v1',JSON.stringify({version:1,quality:'medium',theme:'light',motionPreference:'full',sea:true,patrol:true}));
localStorage.setItem('kubeview-world-guide','seen');
window.benchmarkManual = {phase:${JSON.stringify(phase)},profile:${JSON.stringify(profile)},fixture:${JSON.stringify(VERSION)},
 start(){__KUBEVIEW_BENCHMARK__.start()},
 async save(){const raw=__KUBEVIEW_BENCHMARK__.stop(),p=__KUBEVIEW_BENCHMARK__,c=document.querySelector('canvas'),gl=p.gl.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
 const result={date:new Date().toISOString(),phase:this.phase,profile:this.profile,fixture:this.fixture,userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},dpr:devicePixelRatio,rendererPixelRatio:p.gl.getPixelRatio(),buffer:{width:c.width,height:c.height},renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,stats:c.__harbor.stats(),source:'Explicit synthetic read-only fixture, production App, manually operated installed browser; DOM/draw are proxies',raw};
 return fetch('/__benchmark/result',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)}).then(r=>r.json())
 }};
addEventListener('DOMContentLoaded',()=>{const label=document.createElement('div');label.textContent='BENCHMARK — sentetik fixture; canlı mutasyonlar kapalı';label.style.cssText='position:fixed;bottom:8px;left:8px;background:#e6edf1;color:#20313f;padding:6px;z-index:99999;font:12px system-ui;pointer-events:none';document.body.append(label)});`,
);
const child = spawn(
  backendFile,
  ["-test.run", "^TestBenchmarkFixtureServer$", "-test.timeout", "90m"],
  {
    cwd: root,
    env: {
      ...process.env,
      KUBECONFIG: "/dev/null",
      KUBE_CONTEXT: "benchmark",
      WATCH_NAMESPACE: "",
      READ_ONLY: "true",
      KUBEVIEW_BENCH_FIXTURE: input,
      KUBEVIEW_BENCH_STATIC: build,
      KUBEVIEW_BENCH_ADDR: `127.0.0.1:${port}`,
      KUBEVIEW_BENCH_BOOTSTRAP: bootstrap,
      KUBEVIEW_BENCH_RESULT_DIR: out,
      KUBEVIEW_BENCH_LOG_BYTES: opt("log-bytes", "0"),
    },
    stdio: "inherit",
  },
);
console.log(
  `Open installed Safari: http://127.0.0.1:${port}/__benchmark/manual\nWarm 30s; console: benchmarkManual.start(); setTimeout(()=>benchmarkManual.save().then(console.log),60000)\nRepeat three times; output: ${out}. Stop server: Ctrl+C.`,
);
for (const sig of ["SIGINT", "SIGTERM"])
  process.on(sig, () => child.kill("SIGTERM"));
await new Promise((resolve) => child.once("exit", resolve));
