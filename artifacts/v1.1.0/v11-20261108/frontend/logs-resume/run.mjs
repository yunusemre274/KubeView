// The final separate owned log UI job. No mock transport or product writes.
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
if (process.env.KV_V11_LOGUI_LEASE !== "v11-20261108-logui")
  throw new Error("Root log UI lease absent; setup/browser refused");
const root = "/Users/yunusemre/Desktop/KubeView",
  base = path.dirname(fileURLToPath(import.meta.url));
const runID = new Date().toISOString().replace(/[:.]/g, "-"),
  dir = path.join(base, "runs", runID);
const require = createRequire(path.join(root, "frontend/package.json")),
  { chromium, expect } = require("@playwright/test");
const { findResource, openConnection } = await import(
  path.join(root, "frontend/e2e/v11-ui.helpers.js")
);
const contextName = "kv-repair-1101",
  clusterUID = "a24740ba-cf3e-461d-b5b3-250deeb060d7",
  namespace = "kv-repair-v11-logui",
  name = "v11-logui-roles";
const ownerKey = "kubeview.io/v11-owner",
  owner = "v11-20261108",
  instanceKey = "kubeview.io/log-ui-instance",
  instance = randomUUID();
const markers = {
  app: "KV_LOGUI_APP_CURRENT",
  init: "KV_LOGUI_INIT_COMPLETED",
  ephemeral: "KV_LOGUI_EPHEMERAL_CURRENT",
  current: "KV_LOGUI_RESTART_CURRENT",
  previous: "KV_LOGUI_RESTART_PREVIOUS",
};
const networkRequests = [],
  networkMap = new Map();
const requests = [],
  active = new Map(),
  requestRows = new Map(),
  sockets = [];
const result = {
  schemaVersion: 1,
  runID,
  startedAt: new Date().toISOString(),
  type: "actual owned Pod + actual Kubernetes pods/log + normal production UI",
  context: contextName,
  clusterUID,
  namespace,
  owner,
  requests,
  networkRequests,
  sockets,
  cases: [],
  cleanup: [],
  limits: [
    "Only predefined synthetic fixture log markers are used; no real user logs or Secret payloads.",
    "Restart is one controlled real exit42, not OOM.",
    "Pause closes the actual HTTP stream; resume refetches the selected tail and does not guarantee gap retention.",
    "No source/build/Git edits, tracing, mocking, camera/quality/DPR changes or performance claims.",
  ],
};
let kubeconfig,
  namespaceUID,
  podUID,
  browser,
  browserContext,
  page,
  proxy,
  networkObserver,
  lastSocket,
  diagnostic;
const start = Date.now(),
  mainDeadline = start + 270000,
  wallDeadline = start + 300000;
let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  page?.close().catch(() => {});
}, 270000);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const check = (condition, text) => {
  if (!condition) throw new Error(text);
};
const deadline = () =>
  check(!timedOut && Date.now() < mainDeadline, "Bounded log UI main deadline");
function kubectl(args, body) {
  try {
    return execFileSync(
      "kubectl",
      ["--context", contextName, "--request-timeout=5s", ...args],
      {
        env: { ...process.env, KUBECONFIG: kubeconfig },
        input: body == null ? undefined : JSON.stringify(body),
        encoding: "utf8",
        timeout: 8000,
        maxBuffer: 2 << 20,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  } catch (error) {
    throw new Error(
      `Owned Kubernetes command failed (${Number.isInteger(error.status) ? error.status : "transport"}); stderr/body omitted`,
    );
  }
}
const get = (kind, objectName, ns = namespace) =>
  JSON.parse(
    kubectl(["get", kind, objectName, ...(ns ? ["-n", ns] : []), "-o", "json"]),
  );
function guard(cleanup = false) {
  if (!cleanup) deadline();
  check(
    get("namespace", "kube-system", "").metadata.uid === clusterUID,
    "Cluster UID guard failed",
  );
  if (namespaceUID) {
    const n = get("namespace", namespace, "");
    check(
      n.metadata.uid === namespaceUID &&
        n.metadata.labels?.[ownerKey] === owner &&
        n.metadata.labels?.[instanceKey] === instance,
      "Namespace UID/owner/instance guard failed",
    );
  }
}
function owned(cleanup = false) {
  guard(cleanup);
  const p = get("pod", name);
  check(
    p.metadata.uid === podUID &&
      p.metadata.labels?.[ownerKey] === owner &&
      p.metadata.labels?.[instanceKey] === instance &&
      p.metadata.resourceVersion,
    "Pod UID/RV/owner/instance guard failed",
  );
  return p;
}
async function poll(fn, timeout = 30000, cleanup = false) {
  const until = Math.min(
    Date.now() + timeout,
    cleanup ? wallDeadline : mainDeadline,
  );
  while (Date.now() < until) {
    if (!cleanup) deadline();
    const value = await fn();
    if (value) return value;
    await sleep(180);
  }
  throw new Error("Bounded log UI condition deadline");
}
const identity = (p) => ({
  name: p.metadata.name,
  uid: p.metadata.uid,
  rv: p.metadata.resourceVersion,
  phase: p.status.phase,
  containers: p.status.containerStatuses?.map((c) => ({
    name: c.name,
    ready: c.ready,
    restartCount: c.restartCount,
    running: !!c.state?.running,
    lastExitCode: c.lastState?.terminated?.exitCode ?? null,
  })),
  init: p.status.initContainerStatuses?.map((c) => ({
    name: c.name,
    exitCode: c.state?.terminated?.exitCode,
  })),
  ephemeral: p.status.ephemeralContainerStatuses?.map((c) => ({
    name: c.name,
    running: !!c.state?.running,
  })),
});
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
async function evidenceCase(label, fn) {
  deadline();
  const row = {
    name: label,
    startedAt: new Date().toISOString(),
    status: "RUNNING",
  };
  result.cases.push(row);
  try {
    row.result = await fn();
    check(!result.pageErrors?.length, "Application pageerror observed");
    row.status = "PASS";
  } catch (error) {
    row.status = "FAIL";
    row.error = String(error.message).slice(0, 1500);
    throw error;
  } finally {
    row.finishedAt = new Date().toISOString();
    await save();
  }
}
async function openLogs(container = "app") {
  const details = await findResource(page, "Pod", name, podUID);
  await details
    .locator(".details-tabs")
    .getByRole("button", { name: "Container’lar", exact: true })
    .click();
  const card = details.locator(".container-card").filter({
    has: page.getByRole("button", {
      name: `${container} container’ını seç`,
      exact: true,
    }),
  });
  await card.getByRole("button", { name: "Logları aç", exact: true }).click();
  return details;
}
async function checkLog(container, previous, marker, afterRequestID = 0) {
  const row = await poll(() =>
    [...requests]
      .reverse()
      .find(
        (row) =>
          row.id > afterRequestID &&
          row.container === container &&
          row.previous === previous &&
          row.status === 200 &&
          row.uidVerified &&
          row.sessionVerified &&
          row.protocolVerified,
      ),
  );
  await expect(page.locator(".log-output")).toContainText(marker, {
    timeout: 20000,
  });
  const text = await page.locator(".log-output").innerText();
  check(
    Object.values(markers)
      .filter((value) => value !== marker)
      .every((value) => !text.includes(value)),
    "Another role/previous instance escaped into selected log output",
  );
  check(
    row.uid === podUID &&
      row.pod === name &&
      row.namespace === namespace &&
      row.context === contextName,
    "Actual log HTTP query points to another source/UID/container",
  );
  return {
    requestID: row.id,
    container,
    previous,
    uid: podUID,
    markerMatched: true,
    otherRoleMarkersAbsent: true,
    HTTPStatus: row.status,
    responseIdentityVerified: true,
  };
}
function appCounter(text) {
  return Math.max(
    -1,
    ...[...text.matchAll(/KV_LOGUI_APP_CURRENT:(\d+)/g)].map((match) =>
      Number(match[1]),
    ),
  );
}
async function cleanup() {
  if (!namespaceUID) return;
  guard(true);
  proxy = spawn(
    "kubectl",
    ["--context", contextName, "proxy", "--address=127.0.0.1", "--port=19489"],
    { env: { ...process.env, KUBECONFIG: kubeconfig }, stdio: "ignore" },
  );
  await poll(
    async () => {
      try {
        return (await fetch("http://127.0.0.1:19489/version")).ok;
      } catch {
        return false;
      }
    },
    5000,
    true,
  );
  if (podUID) {
    const current = owned(true),
      address = `http://127.0.0.1:19489/api/v1/namespaces/${namespace}/pods/${name}`;
    const response = await fetch(address, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiVersion: "v1",
        kind: "DeleteOptions",
        gracePeriodSeconds: 0,
        preconditions: {
          uid: podUID,
          resourceVersion: current.metadata.resourceVersion,
        },
      }),
    });
    check(response.ok, "Owned Pod exact UID/RV delete failed");
    await poll(async () => (await fetch(address)).status === 404, 15000, true);
    result.cleanup.push({
      kind: "Pod",
      name,
      uid: podUID,
      status: "UID/RV DELETE then404",
    });
  }
  const n = get("namespace", namespace, ""),
    address = `http://127.0.0.1:19489/api/v1/namespaces/${namespace}`;
  guard(true);
  const response = await fetch(address, {
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
  check(response.ok, "Owned namespace exact UID/RV delete failed");
  await poll(async () => (await fetch(address)).status === 404, 25000, true);
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
    "Private kubeconfig path-list guard failed",
  );
  result.sourceStart = await sources();
  const predecessor = JSON.parse(
    await fs.readFile(
      path.join(base, "runs/2026-11-09T08-34-40-579Z/result.json"),
      "utf8",
    ),
  );
  check(
    predecessor.sourceStart.sourceSHA256 === result.sourceStart.sourceSHA256 &&
      predecessor.sourceStart.binarySHA256 ===
        result.sourceStart.binarySHA256 &&
      predecessor.sourceUnchanged &&
      predecessor.buildUnchanged,
    "Predecessor source/build identity differs",
  );
  result.resumeReason =
    "One root-authorized targeted rerun after helper selected an old closed request while a new resume request was opening. Strict post-boundary request headers, observed received bytes and increased application line counters now distinguish the new stream. Close events are observed before browser context teardown; the old FAIL and missing-close observations remain unchanged.";
  result.predecessor = "runs/2026-11-09T08-34-40-579Z/result.json";
  const build = JSON.parse(
    await fs.readFile(
      path.join(root, "artifacts/v1.1.0/v11-20261108/resume-focus-build.json"),
      "utf8",
    ),
  );
  check(
    result.sourceStart.binarySHA256 === build.binarySHA256 &&
      build.commit.startsWith("0f5a5ab"),
    "Expected frozen embedded binary guard failed",
  );
  try {
    execFileSync(
      "git",
      [
        "diff",
        "--quiet",
        "0f5a5ab6b8e52e645b9e2e71dd063112ca105e98",
        "--",
        "frontend/src",
        "backend",
      ],
      { cwd: root, stdio: "ignore" },
    );
  } catch {
    throw new Error("Product source differs from frozen0f5a5ab");
  }
  result.build = { commit: build.commit, binarySHA256: build.binarySHA256 };
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
    "Log namespace already exists; no takeover permitted",
  );
  const n = JSON.parse(
    kubectl(["create", "-f", "-", "-o", "json"], {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: {
        name: namespace,
        labels: { [ownerKey]: owner, [instanceKey]: instance },
      },
    }),
  );
  namespaceUID = n.metadata.uid;
  result.namespaceUID = namespaceUID;
  guard();
  const resources = {
    requests: { cpu: "5m", memory: "8Mi" },
    limits: { cpu: "100m", memory: "64Mi" },
  };
  const p = JSON.parse(
    kubectl(["create", "-f", "-", "-o", "json"], {
      apiVersion: "v1",
      kind: "Pod",
      metadata: {
        name,
        namespace,
        labels: { [ownerKey]: owner, [instanceKey]: instance },
      },
      spec: {
        restartPolicy: "Always",
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
        volumes: [{ name: "restart-state", emptyDir: {} }],
        initContainers: [
          {
            name: "prepare",
            image: "alpine:3.21",
            imagePullPolicy: "IfNotPresent",
            resources,
            command: ["sh", "-c", `echo ${markers.init}`],
          },
        ],
        containers: [
          {
            name: "app",
            image: "alpine:3.21",
            imagePullPolicy: "IfNotPresent",
            resources,
            command: [
              "sh",
              "-c",
              `i=0;while true;do echo ${markers.app}:$i;i=$((i+1));sleep 0.3;done`,
            ],
          },
          {
            name: "restart-once",
            image: "alpine:3.21",
            imagePullPolicy: "IfNotPresent",
            resources,
            volumeMounts: [{ name: "restart-state", mountPath: "/state" }],
            command: [
              "sh",
              "-c",
              `if [ ! -f /state/restarted ];then touch /state/restarted;echo ${markers.previous};exit 42;fi;echo ${markers.current};sleep 600`,
            ],
          },
        ],
      },
    }),
  );
  podUID = p.metadata.uid;
  const ready = await poll(() => {
    const p = owned();
    return (
      p.status.initContainerStatuses?.some(
        (c) => c.name === "prepare" && c.state?.terminated?.exitCode === 0,
      ) &&
      p.status.containerStatuses?.find((c) => c.name === "app")?.ready &&
      p.status.containerStatuses?.some(
        (c) =>
          c.name === "restart-once" &&
          c.ready &&
          c.restartCount === 1 &&
          c.lastState?.terminated?.exitCode === 42,
      ) &&
      p
    );
  }, 70000);
  const current = owned();
  current.spec.ephemeralContainers = [
    {
      name: "debug-role",
      image: "alpine:3.21",
      imagePullPolicy: "IfNotPresent",
      command: ["sh", "-c", `echo ${markers.ephemeral};sleep 600`],
      targetContainerName: "app",
    },
  ];
  // Real subresource update uses the exact observed Pod UID/RV/owner snapshot.
  guard();
  kubectl(
    [
      "replace",
      "--raw",
      `/api/v1/namespaces/${namespace}/pods/${name}/ephemeralcontainers`,
      "-f",
      "-",
    ],
    current,
  );
  const actual = await poll(() => {
    const p = owned();
    return (
      p.status.ephemeralContainerStatuses?.some(
        (c) => c.name === "debug-role" && c.state?.running,
      ) && p
    );
  }, 35000);
  result.fixture = identity(actual);
  result.preEphemeral = identity(ready);
  browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=metal"],
  });
  result.browserVersion = browser.version();
  browserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  page = await browserContext.newPage();
  page.setDefaultTimeout(12000);
  networkObserver = await browserContext.newCDPSession(page);
  await networkObserver.send("Network.enable");
  networkObserver.on("Network.requestWillBeSent", ({ requestId, request }) => {
    const u = new URL(request.url);
    if (u.pathname !== "/api/logs") return;
    const row = {
      id: networkRequests.length + 1,
      uid: u.searchParams.get("uid"),
      container: u.searchParams.get("container"),
      previous: u.searchParams.get("previous") === "true",
      receivedBytes: 0,
      ended: null,
    };
    networkRequests.push(row);
    networkMap.set(requestId, row);
  });
  networkObserver.on("Network.dataReceived", ({ requestId, dataLength }) => {
    const row = networkMap.get(requestId);
    if (row) row.receivedBytes += dataLength;
  });
  networkObserver.on("Network.loadingFinished", ({ requestId }) => {
    const row = networkMap.get(requestId);
    if (row) row.ended = "finished";
  });
  networkObserver.on("Network.loadingFailed", ({ requestId }) => {
    const row = networkMap.get(requestId);
    if (row) row.ended = "failed/aborted";
  });
  page.on("pageerror", (error) => {
    (result.pageErrors ||= []).push(error.message.slice(0, 1000));
  });
  page.on("websocket", (socket) => {
    const u = new URL(socket.url());
    if (u.pathname !== "/ws") return;
    const row = {
      context: u.searchParams.get("context"),
      namespace: u.searchParams.get("namespace") || "",
      snapshot: false,
      closed: false,
    };
    sockets.push(row);
    lastSocket = row;
    socket.on("close", () => {
      row.closed = true;
    });
    socket.on("framereceived", ({ payload }) => {
      try {
        if (JSON.parse(String(payload)).type === "SNAPSHOT")
          row.snapshot = true;
      } catch {}
    });
  });
  page.on("request", (request) => {
    const u = new URL(request.url());
    if (u.pathname !== "/api/logs") return;
    const row = {
      id: requests.length + 1,
      openedAt: new Date().toISOString(),
      context: u.searchParams.get("context"),
      namespace: u.searchParams.get("namespace"),
      pod: u.searchParams.get("pod"),
      uid: u.searchParams.get("uid"),
      container: u.searchParams.get("container"),
      previous: u.searchParams.get("previous") === "true",
      follow: u.searchParams.get("follow") === "true",
      ended: null,
    };
    requests.push(row);
    requestRows.set(request, row);
    active.set(request, row);
  });
  page.on("response", async (response) => {
    const u = new URL(response.url());
    if (u.pathname === "/api/connection" && response.status() === 200) {
      const data = await response.json();
      diagnostic = { context: data.context, namespace: data.namespace || "" };
    }
    const row = requestRows.get(response.request());
    if (!row) return;
    row.status = response.status();
    row.uidVerified =
      (await response.headerValue("x-kubeview-pod-uid")) === podUID;
    row.sessionVerified =
      (await response.headerValue("x-kubeview-log-session")) ===
      u.searchParams.get("session");
    row.protocolVerified =
      (await response.headerValue("x-kubeview-log-protocol")) ===
      "guarded-text-v1";
  });
  const end = (request, kind) => {
    const row = requestRows.get(request);
    if (row) {
      row.ended = kind;
      row.endedAt = new Date().toISOString();
      active.delete(request);
    }
  };
  page.on("requestfinished", (request) => end(request, "finished"));
  page.on("requestfailed", (request) => end(request, "failed/aborted"));
  await page.goto("http://127.0.0.1:18410");
  const dialog = await openConnection(page);
  if (
    (await dialog
      .getByLabel("Cluster / context", { exact: true })
      .inputValue()) !== contextName
  )
    await dialog
      .getByLabel("Cluster / context", { exact: true })
      .selectOption(contextName);
  await poll(() => diagnostic?.context === contextName);
  await dialog
    .getByLabel("Namespace adıyla kapsam", { exact: true })
    .fill(namespace);
  await dialog
    .getByRole("button", { name: "Kapsamı uygula", exact: true })
    .click();
  await poll(
    () =>
      diagnostic?.namespace === namespace &&
      lastSocket?.namespace === namespace &&
      lastSocket.snapshot,
  );
  await dialog
    .getByRole("button", { name: "Pencereyi kapat", exact: true })
    .click();
  await evidenceCase(
    "Actual spec/status roles and app current log UI",
    async () => {
      const details = await findResource(page, "Pod", name, podUID);
      await details
        .locator(".details-tabs")
        .getByRole("button", { name: "Container’lar", exact: true })
        .click();
      const roles = [];
      for (const [container, role] of [
        ["app", "Uygulama container’ı"],
        ["restart-once", "Uygulama container’ı"],
        ["prepare", "Init container"],
        ["debug-role", "Geçici debug container"],
      ]) {
        const card = details.locator(".container-card").filter({
          has: page.getByRole("button", {
            name: `${container} container’ını seç`,
            exact: true,
          }),
        });
        await expect(card.locator(".container-role")).toHaveText(role);
        roles.push({ container, role });
      }
      await details
        .locator(".container-card")
        .filter({
          has: page.getByRole("button", {
            name: "app container’ını seç",
            exact: true,
          }),
        })
        .getByRole("button", { name: "Logları aç", exact: true })
        .click();
      const log = await checkLog("app", false, markers.app);
      await poll(() => active.size === 1);
      await capture("app-current-log");
      return { roles, log };
    },
  );
  await evidenceCase(
    "Pause closes real HTTP, resume refetches tail, repeated open does not duplicate",
    async () => {
      const requestID = [...active.values()][0].id,
        count = requests.length;
      await page
        .getByRole("button", { name: "Log akışını duraklat", exact: true })
        .click();
      await expect(page.locator(".logs-status")).toContainText("Duraklatıldı");
      await expect(page.locator(".pod-logs")).toContainText(
        "Duraklatma sunucu akışını kapatır.",
      );
      await poll(
        () =>
          active.size === 0 &&
          requests.find((row) => row.id === requestID).ended,
      );
      const paused = await page.locator(".log-output").innerText();
      const pausedCounter = appCounter(paused),
        networkBoundary = networkRequests.length;
      await sleep(700);
      check(
        (await page.locator(".log-output").innerText()) === paused &&
          requests.length === count,
        "Paused view changed or another stream opened",
      );
      await capture("paused-stream-closed");
      await page
        .getByRole("button", { name: "Logları yeniden bağla", exact: true })
        .click();
      const resumed = await checkLog("app", false, markers.app, count);
      const resumedNetwork = await poll(() =>
        networkRequests
          .slice(networkBoundary)
          .find(
            (row) =>
              row.uid === podUID &&
              row.container === "app" &&
              !row.previous &&
              row.receivedBytes > 0,
          ),
      );
      const resumedCounter = await poll(async () => {
        const counter = appCounter(
          await page.locator(".log-output").innerText(),
        );
        return counter > pausedCounter && { counter };
      });
      await poll(() => active.size === 1);
      check(
        resumed.requestID !== requestID,
        "Resume reused closed HTTP stream",
      );
      const opened = requests.length;
      await page
        .locator(".resource-details .details-tabs")
        .getByRole("button", { name: "Loglar", exact: true })
        .dblclick();
      await sleep(350);
      check(
        active.size === 1 && requests.length === opened,
        "Repeated open created duplicate actual streams",
      );
      await page
        .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
        .click();
      await poll(() => active.size === 0);
      const reopenBoundary = requests.length;
      await openLogs("app");
      const reopened = await checkLog(
        "app",
        false,
        markers.app,
        reopenBoundary,
      );
      await poll(() => active.size === 1);
      return {
        pausedRequestID: requestID,
        closedEvent: requests.find((row) => row.id === requestID).ended,
        resumedRequestID: resumed.requestID,
        pausedLastSequence: pausedCounter,
        resumedLastSequence: resumedCounter.counter,
        resumedReceivedBytes: resumedNetwork.receivedBytes,
        doubleOpenStreamCount: 1,
        reopenedRequestID: reopened.requestID,
        gapRetentionGuaranteed: false,
      };
    },
  );
  for (const [role, container, previous, marker] of [
    ["completed-init", "prepare", false, markers.init],
    ["ephemeral-current", "debug-role", false, markers.ephemeral],
    ["restarted-app-current", "restart-once", false, markers.current],
    ["app-previous", "restart-once", true, markers.previous],
  ])
    await evidenceCase(`Actual ${role} log UI identity`, async () => {
      const boundary = requests.length;
      if (
        await page.getByLabel("Önceki container", { exact: true }).isChecked()
      )
        await page.getByLabel("Önceki container", { exact: true }).uncheck();
      await page
        .getByLabel("Container", { exact: true })
        .selectOption(container);
      if (previous)
        await page.getByLabel("Önceki container", { exact: true }).check();
      const record = await checkLog(container, previous, marker, boundary);
      await capture(role + "-log");
      return record;
    });
  await evidenceCase(
    "Final current stream closes/aborts with panel, all request lifetimes end",
    async () => {
      const boundary = requests.length;
      await page.getByLabel("Önceki container", { exact: true }).uncheck();
      await checkLog("restart-once", false, markers.current, boundary);
      await poll(() => active.size === 1);
      const id = [...active.values()][0].id;
      await page
        .getByRole("button", { name: "Ayrıntı panelini kapat", exact: true })
        .click();
      await poll(() => active.size === 0 && requests.every((row) => row.ended));
      return {
        closedRequestID: id,
        closedEvent: requests.find((row) => row.id === id).ended,
        allRequestsEnded: true,
        activeRequests: active.size,
      };
    },
  );
  check(!result.pageErrors?.length, "Application pageerror observed");
  result.status = "PASS";
} catch (error) {
  result.status = "FAIL";
  result.error = String(error.message).slice(0, 2000);
  if (page) await capture("failure").catch(() => {});
} finally {
  try {
    if (page && !page.isClosed()) {
      if (active.size) {
        const close = page.getByRole("button", {
          name: "Ayrıntı panelini kapat",
          exact: true,
        });
        if (await close.isVisible()) await close.click();
      }
      await poll(() => active.size === 0, 10000, true);
      await page.goto("about:blank");
      await poll(() => sockets.every((row) => row.closed), 10000, true);
      result.documentUnloadObserved = {
        activeLogs: active.size,
        allSocketsClosed: true,
      };
    }
  } catch (error) {
    result.lifecycleCleanupError = error.message;
    result.status = "FAIL";
  }
  await networkObserver?.detach().catch(() => {});
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
  result.activeLogRequests = active.size;
  result.unclosedSockets = sockets.filter((row) => !row.closed).length;
  result.ownedProcesses = {
    browserClosed: true,
    proxyPID: proxy?.pid || null,
    proxyStopped: !proxy || proxy.exitCode != null || proxy.signalCode != null,
    watchdogCleared: true,
  };
  if (
    !result.sourceUnchanged ||
    !result.buildUnchanged ||
    !result.helperUnchanged ||
    result.activeLogRequests ||
    result.unclosedSockets ||
    result.elapsedWallMS > 300000
  )
    result.status = "FAIL";
  await save();
}
console.log(
  JSON.stringify({
    runID,
    status: result.status,
    cases: result.cases.map(({ name, status, error }) => ({
      name,
      status,
      error,
    })),
    error: result.error,
    activeLogRequests: result.activeLogRequests,
    unclosedSockets: result.unclosedSockets,
    cleanupFailed: result.cleanup.some((row) => row.status === "FAIL"),
    sourceUnchanged: result.sourceUnchanged,
    buildUnchanged: result.buildUnchanged,
    elapsedWallMS: result.elapsedWallMS,
  }),
);
if (result.status !== "PASS") process.exitCode = 1;
