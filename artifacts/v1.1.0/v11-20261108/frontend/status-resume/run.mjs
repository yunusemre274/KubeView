// Narrow real Job/DaemonSet status acceptance only; no status injection.
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
if (
  process.env.KV_V11_STATUS_LEASE !== "v11-20261108-status" ||
  !/^[a-f0-9]{64}$/.test(process.env.KV_V11_STATUS_BINARY_SHA || "")
)
  throw new Error(
    "Explicit new embedded SHA and root execution lease required before any setup",
  );
const root = "/Users/yunusemre/Desktop/KubeView",
  base = path.dirname(fileURLToPath(import.meta.url)),
  runID = new Date().toISOString().replace(/[:.]/g, "-"),
  dir = path.join(base, "runs", runID);
const expectedCommit = "32a0468ad51516a1bb38aab68760e73984c45ddf",
  expectedBinarySHA = process.env.KV_V11_STATUS_BINARY_SHA;
const require = createRequire(path.join(root, "frontend/package.json")),
  { chromium, expect } = require("@playwright/test");
const { findResource, openConnection, enableManagement } = await import(
  path.join(root, "frontend/e2e/v11-ui.helpers.js")
);
const contextName = "kv-repair-1101",
  clusterUID = "a24740ba-cf3e-461d-b5b3-250deeb060d7",
  namespace = "kv-repair-v11-status";
const ownerKey = "kubeview.io/v11-owner",
  owner = "v11-20261108",
  instanceKey = "kubeview.io/status-instance",
  instance = randomUUID(),
  roleKey = "kubeview.io/status-role";
const fixtureLabels = (role) => ({
  [ownerKey]: owner,
  [instanceKey]: instance,
  [roleKey]: role,
});
const registry = [],
  result = {
    runID,
    startedAt: new Date().toISOString(),
    testType:
      "actual owned Kubernetes + normal production UI + independent API status",
    context: contextName,
    clusterUID,
    namespace,
    owner,
    fixtures: registry,
    cases: [],
    cleanup: [],
    maxWallMS: 180000,
    limits: [
      "Completed/Failed Job precedence and missing/stale DaemonSet states are separate unit tests; no UI/status injection.",
      "Only real suspended Job and real one-Ready DaemonSet are checked. STS/Secret/log flows are not rerun.",
      "Kernel TCP absence is transport cleanup, not a WebSocket close-frame, Go heap or goroutine proof.",
    ],
  };
let kubeconfig,
  namespaceUID,
  browser,
  browserContext,
  page,
  proxy,
  diagnostic,
  socket,
  browserDisconnected = false,
  contextClosed = false;
const start = Date.now(),
  mainUntil = start + 150000,
  wallUntil = start + 180000;
const timer = setTimeout(() => page?.close().catch(() => {}), 150000);
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = () =>
  check(Date.now() < mainUntil, "Status UI main deadline reached");
function kubectl(args, object) {
  try {
    return execFileSync(
      "kubectl",
      ["--context", contextName, "--request-timeout=5s", ...args],
      {
        env: { ...process.env, KUBECONFIG: kubeconfig },
        input: object == null ? undefined : JSON.stringify(object),
        encoding: "utf8",
        timeout: 8000,
        maxBuffer: 2 << 20,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  } catch (error) {
    throw new Error(
      `Owned Kubernetes request failed (${Number.isInteger(error.status) ? error.status : "transport"}); stderr/body omitted`,
    );
  }
}
const get = (kind, name, ns = namespace) =>
  JSON.parse(
    kubectl([
      "get",
      kind,
      ...(name ? [name] : []),
      ...(ns ? ["-n", ns] : []),
      "-o",
      "json",
    ]),
  );
function guard(cleanup = false) {
  if (!cleanup) deadline();
  check(
    get("namespace", "kube-system", "").metadata.uid === clusterUID,
    "Cluster UID rejected",
  );
  if (namespaceUID) {
    const n = get("namespace", namespace, "");
    check(
      n.metadata.uid === namespaceUID &&
        n.metadata.labels?.[ownerKey] === owner &&
        n.metadata.labels?.[instanceKey] === instance,
      "Namespace UID/owner/instance rejected",
    );
  }
}
function assertOwned(object, fixture) {
  check(
    object.metadata.namespace === namespace &&
      object.metadata.labels?.[ownerKey] === owner &&
      object.metadata.labels?.[instanceKey] === instance &&
      object.metadata.resourceVersion,
    "Owned namespace/owner/instance/RV rejected",
  );
  if (fixture)
    check(
      object.kind === fixture.kind &&
        object.metadata.name === fixture.name &&
        object.metadata.uid === fixture.uid &&
        object.metadata.labels[roleKey] === fixture.role,
      "Exact fixture UID/role rejected",
    );
  return object;
}
function owned(fixture, cleanup = false) {
  guard(cleanup);
  return assertOwned(get(fixture.kind, fixture.name), fixture);
}
function create(object) {
  guard();
  check(
    object.metadata.labels?.[ownerKey] === owner &&
      object.metadata.labels?.[instanceKey] === instance &&
      object.metadata.namespace === namespace,
    "Fixture create scope rejected",
  );
  const objectOut = assertOwned(
    JSON.parse(kubectl(["create", "-f", "-", "-o", "json"], object)),
  );
  const fixture = {
    kind: objectOut.kind,
    name: objectOut.metadata.name,
    uid: objectOut.metadata.uid,
    rv: objectOut.metadata.resourceVersion,
    role: objectOut.metadata.labels[roleKey],
  };
  registry.push(fixture);
  return fixture;
}
async function poll(fn, timeout = 45000, cleanup = false) {
  const until = Math.min(Date.now() + timeout, cleanup ? wallUntil : mainUntil);
  while (Date.now() < until) {
    if (!cleanup) deadline();
    const result = await fn();
    if (result) return result;
    await sleep(180);
  }
  throw new Error("Bounded status condition deadline");
}
const hash = (value) => createHash("sha256").update(value).digest("hex");
async function sources() {
  const files = execFileSync(
      "git",
      [
        "ls-files",
        "--",
        "frontend/src",
        "backend",
        "frontend/package.json",
        "frontend/package-lock.json",
      ],
      { cwd: root, encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean),
    map = {};
  for (const file of files)
    map[file] = hash(await fs.readFile(path.join(root, file)));
  return {
    gitHead: execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim(),
    files: map,
    sourceSHA256: hash(JSON.stringify(map)),
    helperSHA256: hash(await fs.readFile(fileURLToPath(import.meta.url))),
    binarySHA256: hash(
      await fs.readFile(
        path.join(root, ".git/kv-v11-runtime/install-macos/kubeview"),
      ),
    ),
  };
}
const podRows = (fixture) =>
  get("pods")
    .items.filter((p) =>
      p.metadata.ownerReferences?.some((ref) => ref.uid === fixture.uid),
    )
    .map((p) => ({
      uid: assertOwned(p).metadata.uid,
      name: p.metadata.name,
      ownerUID: fixture.uid,
      phase: p.status.phase,
      deleting: !!p.metadata.deletionTimestamp,
      allContainersReady:
        p.status.containerStatuses?.every((c) => c.ready) === true,
    }));
async function save() {
  await fs.writeFile(
    path.join(dir, "result.json"),
    JSON.stringify(result, null, 2),
  );
}
async function capture(label) {
  await page.screenshot({ path: path.join(dir, label + ".png") });
  (result.captures ||= []).push({ label, at: new Date().toISOString() });
}
async function cleanup() {
  if (!namespaceUID) return;
  guard(true);
  proxy = spawn(
    "kubectl",
    ["--context", contextName, "proxy", "--address=127.0.0.1", "--port=19490"],
    { env: { ...process.env, KUBECONFIG: kubeconfig }, stdio: "ignore" },
  );
  await poll(
    async () => {
      try {
        return (await fetch("http://127.0.0.1:19490/version")).ok;
      } catch {
        return false;
      }
    },
    5000,
    true,
  );
  const address = (object) =>
    `http://127.0.0.1:19490/${object.kind === "DaemonSet" || object.kind === "ControllerRevision" ? "apis/apps/v1" : object.kind === "Job" ? "apis/batch/v1" : "api/v1"}/namespaces/${namespace}/${object.kind === "DaemonSet" ? "daemonsets" : object.kind === "ControllerRevision" ? "controllerrevisions" : object.kind === "Job" ? "jobs" : "pods"}/${object.metadata.name}`;
  const remove = async (object, attempt = 0) => {
    guard(true);
    const url = address(object);
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiVersion: "v1",
        kind: "DeleteOptions",
        gracePeriodSeconds: 0,
        propagationPolicy: "Background",
        preconditions: {
          uid: object.metadata.uid,
          resourceVersion: object.metadata.resourceVersion,
        },
      }),
    });
    if (response.status === 409 && attempt < 2) {
      const fresh = await fetch(url);
      if (fresh.status === 404) return;
      check(fresh.ok, "Cleanup reconciliation failed");
      const latest = assertOwned(await fresh.json());
      check(latest.metadata.uid === object.metadata.uid, "Cleanup UID changed");
      return remove(latest, attempt + 1);
    }
    check(
      response.ok || response.status === 404,
      "UID/RV resource delete rejected",
    );
    await poll(async () => (await fetch(url)).status === 404, 15000, true);
    result.cleanup.push({
      kind: object.kind,
      name: object.metadata.name,
      uid: object.metadata.uid,
      status: "UID/RV DELETE then404",
    });
  };
  for (const fixture of [...registry].reverse())
    await remove(owned(fixture, true));
  for (const kind of ["Pod", "ControllerRevision"])
    for (const object of get(kind).items.filter(
      (o) => o.metadata.labels?.[ownerKey] === owner,
    )) {
      assertOwned(object);
      check(
        object.metadata.ownerReferences?.some((ref) =>
          registry.some((f) => f.uid === ref.uid),
        ),
        "Child parent UID guard rejected",
      );
      await remove(object);
    }
  const n = get("namespace", namespace, "");
  guard(true);
  const url = `http://127.0.0.1:19490/api/v1/namespaces/${namespace}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiVersion: "v1",
      kind: "DeleteOptions",
      preconditions: {
        uid: namespaceUID,
        resourceVersion: n.metadata.resourceVersion,
      },
    }),
  });
  check(response.ok, "Namespace UID/RV delete rejected");
  await poll(async () => (await fetch(url)).status === 404, 20000, true);
  result.cleanup.push({
    namespace,
    uid: namespaceUID,
    status: "UID/RV DELETE then404",
  });
}
await fs.mkdir(dir, { recursive: true });
try {
  kubeconfig = (
    await fs.readFile(
      path.join(root, ".git/kv-v11-runtime/app-kubeconfig-pathlist.txt"),
      "utf8",
    )
  ).trim();
  check(
    kubeconfig
      .split(path.delimiter)
      .every(
        (file) =>
          path.isAbsolute(file) && file.includes(`${path.sep}.git${path.sep}`),
      ),
    "Private kubeconfig path-list rejected",
  );
  result.sourceStart = await sources();
  check(
    result.sourceStart.gitHead === expectedCommit &&
      result.sourceStart.binarySHA256 === expectedBinarySHA,
    "Expected exact commit/new binary SHA rejected",
  );
  try {
    execFileSync(
      "git",
      ["diff", "--quiet", expectedCommit, "--", "frontend/src", "backend"],
      { cwd: root, stdio: "ignore" },
    );
  } catch {
    throw new Error("Runtime source is dirty after frozen commit");
  }
  const metadata = JSON.parse(
    await fs.readFile(
      path.join(root, "artifacts/v1.1.0/v11-20261108/resume-status-build.json"),
      "utf8",
    ),
  );
  check(
    metadata.commit === expectedCommit &&
      metadata.binarySHA256 === expectedBinarySHA,
    "New embedded metadata guard rejected",
  );
  result.build = {
    commit: metadata.commit,
    binarySHA256: metadata.binarySHA256,
    version: metadata.version,
  };
  guard();
  check(
    !kubectl([
      "get",
      "namespace",
      namespace,
      "-o",
      "name",
      "--ignore-not-found",
    ]).trim(),
    "Existing status namespace refused",
  );
  const n = JSON.parse(
    kubectl(["create", "-f", "-", "-o", "json"], {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: { name: namespace, labels: fixtureLabels("status-scope") },
    }),
  );
  namespaceUID = n.metadata.uid;
  result.namespaceUID = namespaceUID;
  const resources = {
    requests: { cpu: "5m", memory: "8Mi" },
    limits: { cpu: "100m", memory: "48Mi" },
  };
  const job = create({
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: {
      name: "v11-status-suspended-job",
      namespace,
      labels: fixtureLabels("suspended-job"),
    },
    spec: {
      suspend: true,
      template: {
        metadata: { labels: fixtureLabels("suspended-job") },
        spec: {
          restartPolicy: "Never",
          containers: [
            {
              name: "app",
              image: "alpine:3.21",
              imagePullPolicy: "IfNotPresent",
              command: ["sh", "-c", "exit 0"],
              resources,
            },
          ],
        },
      },
    },
  });
  const ds = create({
    apiVersion: "apps/v1",
    kind: "DaemonSet",
    metadata: {
      name: "v11-status-daemon",
      namespace,
      labels: fixtureLabels("ready-daemon"),
    },
    spec: {
      selector: {
        matchLabels: { [roleKey]: "ready-daemon", [instanceKey]: instance },
      },
      template: {
        metadata: { labels: fixtureLabels("ready-daemon") },
        spec: {
          terminationGracePeriodSeconds: 1,
          affinity: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchFields: [
                      {
                        key: "metadata.name",
                        operator: "In",
                        values: ["kv-repair-1101-m03"],
                      },
                    ],
                  },
                ],
              },
            },
          },
          containers: [
            {
              name: "app",
              image: "alpine:3.21",
              imagePullPolicy: "IfNotPresent",
              command: ["sleep", "300"],
              resources,
            },
          ],
        },
      },
    },
  });
  const actualJob = await poll(() => {
    const o = owned(job);
    return (
      o.spec.suspend === true &&
      (o.status?.active ?? 0) === 0 &&
      o.status?.conditions?.some(
        (c) => c.type === "Suspended" && c.status === "True",
      ) &&
      podRows(job).length === 0 &&
      o
    );
  });
  const actualDS = await poll(() => {
    const o = owned(ds),
      pods = podRows(ds);
    return (
      Number.isInteger(o.status?.numberReady) &&
      o.status.numberReady === 1 &&
      o.status.desiredNumberScheduled === 1 &&
      Number.isInteger(o.status.observedGeneration) &&
      o.status.observedGeneration >= o.metadata.generation &&
      pods.length === 1 &&
      pods[0].allContainersReady &&
      !pods[0].deleting &&
      o
    );
  }, 60000);
  browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=metal"],
  });
  result.browserVersion = browser.version();
  browser.on("disconnected", () => {
    browserDisconnected = true;
  });
  browserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  browserContext.on("close", () => {
    contextClosed = true;
  });
  page = await browserContext.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => {
    (result.pageErrors ||= []).push(error.message.slice(0, 1000));
  });
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/logs")
      result.logRequests = (result.logRequests || 0) + 1;
  });
  page.on("websocket", (ws) => {
    const u = new URL(ws.url());
    if (u.pathname !== "/ws") return;
    const row = {
      context: u.searchParams.get("context"),
      namespace: u.searchParams.get("namespace") || "",
      snapshot: false,
    };
    socket = row;
    ws.on("framereceived", ({ payload }) => {
      try {
        if (JSON.parse(String(payload)).type === "SNAPSHOT")
          row.snapshot = true;
      } catch {}
    });
  });
  page.on("response", async (response) => {
    if (
      new URL(response.url()).pathname === "/api/connection" &&
      response.status() === 200
    ) {
      const data = await response.json();
      diagnostic = { context: data.context, namespace: data.namespace || "" };
    }
  });
  await page.goto("http://127.0.0.1:18410");
  const connection = await openConnection(page);
  if (
    (await connection
      .getByLabel("Cluster / context", { exact: true })
      .inputValue()) !== contextName
  )
    await connection
      .getByLabel("Cluster / context", { exact: true })
      .selectOption(contextName);
  await poll(() => diagnostic?.context === contextName, 20000);
  await connection
    .getByLabel("Namespace adıyla kapsam", { exact: true })
    .fill(namespace);
  await connection
    .getByRole("button", { name: "Kapsamı uygula", exact: true })
    .click();
  await poll(
    () =>
      diagnostic?.namespace === namespace &&
      socket?.namespace === namespace &&
      socket.snapshot,
    20000,
  );
  await connection
    .getByRole("button", { name: "Pencereyi kapat", exact: true })
    .click();
  await enableManagement(page);
  let details = await findResource(page, "Job", job.name, job.uid);
  const jobBadge = details.locator(".status-badge").first();
  await expect(jobBadge).toHaveText("Askıya alındı");
  await expect(jobBadge).toHaveClass(/status-warning/);
  check(
    podRows(job).length === 0 && (owned(job).status?.active ?? 0) === 0,
    "Suspended Job gained active Pods",
  );
  await capture("suspended-job-normal-ui");
  result.cases.push({
    name: "Real suspended Job finder/panel status",
    status: "PASS",
    uid: job.uid,
    resourceVersion: actualJob.metadata.resourceVersion,
    specSuspend: actualJob.spec.suspend,
    actualActiveField: actualJob.status?.active ?? null,
    effectiveActiveCount: 0,
    realOwnedPodCount: 0,
    actualConditions: actualJob.status.conditions,
    displayedLabel: await jobBadge.innerText(),
    displayedTone: "warning",
  });
  await save();
  details = await findResource(page, "DaemonSet", ds.name, ds.uid);
  const dsBadge = details.locator(".status-badge").first();
  await expect(dsBadge).toHaveText("Hazır");
  await expect(dsBadge).toHaveClass(/status-success/);
  const freshDS = owned(ds),
    pods = podRows(ds);
  check(
    freshDS.status.numberReady === freshDS.status.desiredNumberScheduled &&
      freshDS.status.observedGeneration >= freshDS.metadata.generation &&
      pods.length === 1 &&
      pods[0].allContainersReady,
    "Real DaemonSet readiness changed",
  );
  await capture("ready-daemonset-normal-ui");
  result.cases.push({
    name: "Real observed one-Ready DaemonSet retains healthy UI",
    status: "PASS",
    uid: ds.uid,
    resourceVersion: freshDS.metadata.resourceVersion,
    generation: freshDS.metadata.generation,
    observedGeneration: freshDS.status.observedGeneration,
    desiredNumberScheduled: freshDS.status.desiredNumberScheduled,
    numberReady: freshDS.status.numberReady,
    readyPod: pods[0],
    displayedLabel: await dsBadge.innerText(),
    displayedTone: "success",
  });
  check(!result.pageErrors?.length, "Application pageerror observed");
  check(
    !result.logRequests,
    "Unexpected logs opened during status-only acceptance",
  );
  result.status = "PASS";
} catch (error) {
  result.status = "FAIL";
  result.error = String(error.message).slice(0, 2000);
  if (page) await capture("failure").catch(() => {});
} finally {
  if (page && !page.isClosed()) {
    await page
      .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
      .click()
      .catch(() => {});
    await page.goto("about:blank").catch(() => {});
  }
  await browserContext?.close().catch(() => {});
  await browser?.close().catch(() => {});
  try {
    await cleanup();
  } catch (error) {
    result.cleanup.push({ status: "FAIL", error: error.message });
    result.status = "FAIL";
  }
  if (proxy) {
    proxy.kill("SIGTERM");
    await new Promise((resolve) => {
      if (proxy.exitCode != null) return resolve();
      proxy.once("exit", resolve);
      setTimeout(resolve, 1000);
    });
  }
  clearTimeout(timer);
  result.sourceEnd = await sources();
  result.sourceUnchanged =
    result.sourceStart?.sourceSHA256 === result.sourceEnd.sourceSHA256;
  result.buildUnchanged =
    result.sourceStart?.binarySHA256 === result.sourceEnd.binarySHA256;
  result.helperUnchanged =
    result.sourceStart?.helperSHA256 === result.sourceEnd.helperSHA256;
  result.finishedAt = new Date().toISOString();
  result.elapsedWallMS = Date.now() - start;
  result.ownedProcesses = {
    browserDisconnected,
    contextClosed,
    proxyPID: proxy?.pid || null,
    proxyStopped: !proxy || proxy.exitCode != null || proxy.signalCode != null,
    watchdogCleared: true,
  };
  result.activeLogRequests = result.logRequests || 0;
  try {
    const pid = execFileSync("lsof", ["-t", "-iTCP:18410", "-sTCP:LISTEN"], {
      encoding: "utf8",
    }).trim();
    const raw = execFileSync("lsof", ["-nP", "-a", "-p", pid, "-iTCP:18410"], {
      encoding: "utf8",
    });
    const endpoints = raw
      .split("\n")
      .filter((line) => line.includes(" TCP ") && !line.includes("(LISTEN)"));
    result.kernelTransport = {
      gatewayPID: Number(pid),
      connectedEndpointCount: endpoints.length,
      rawLsof: raw,
      limit:
        "Kernel transport inventory, not protocol-close or heap/goroutine evidence",
    };
  } catch {
    result.kernelTransport = {
      status: "BLOCKED",
      reason: "Kernel inventory unavailable",
    };
  }
  if (
    !result.sourceUnchanged ||
    !result.buildUnchanged ||
    !result.helperUnchanged ||
    result.elapsedWallMS > 180000 ||
    !browserDisconnected ||
    !contextClosed
  )
    result.status = "FAIL";
  await save();
}
console.log(
  JSON.stringify({
    runID,
    status: result.status,
    cases: result.cases,
    error: result.error,
    sourceUnchanged: result.sourceUnchanged,
    buildUnchanged: result.buildUnchanged,
    cleanupFailed: result.cleanup.some((row) => row.status === "FAIL"),
    elapsedWallMS: result.elapsedWallMS,
    ownedProcesses: result.ownedProcesses,
    kernelTransport: result.kernelTransport && {
      connectedEndpointCount: result.kernelTransport.connectedEndpointCount,
      status: result.kernelTransport.status,
    },
  }),
);
if (result.status !== "PASS") process.exitCode = 1;
