// Artifact-only normal-UI validation. Collection/setup is forbidden without
// the root manager's separate execution lease. Never persist Secret values.
import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

if (process.env.KV_V11_FORMS_LEASE !== "v11-20261108-forms")
  throw new Error(
    "Root forms execution lease absent; no browser or Kubernetes setup started",
  );

const root = "/Users/yunusemre/Desktop/KubeView";
const base = path.dirname(fileURLToPath(import.meta.url));
const runID = new Date().toISOString().replace(/[:.]/g, "-");
const dir = path.join(base, "runs", runID);
const require = createRequire(path.join(root, "frontend/package.json"));
const { chromium, expect } = require("@playwright/test");
const YAML = require("yaml");
const { findResource, enableManagement, openConnection, closePanels } =
  await import(path.join(root, "frontend/e2e/v11-ui.helpers.js"));
const contextName = "kv-repair-1101";
const clusterUID = "a24740ba-cf3e-461d-b5b3-250deeb060d7";
const namespace = "kv-repair-v11-forms";
const ownerKey = "kubeview.io/v11-owner",
  owner = "v11-20261108";
const roleKey = "kubeview.io/forms-role";
const labels = (role) => ({
  [ownerKey]: owner,
  [roleKey]: role,
  "audit.kubeview.io/preserve-label": "unknown-label-kept",
});
const annotations = {
  "audit.kubeview.io/preserve-annotation": "unknown-annotation-kept",
};
const kinds = {
  StatefulSet: ["apps", "v1", "statefulsets"],
  DaemonSet: ["apps", "v1", "daemonsets"],
  ReplicaSet: ["apps", "v1", "replicasets"],
  Job: ["batch", "v1", "jobs"],
  CronJob: ["batch", "v1", "cronjobs"],
  Secret: ["", "v1", "secrets"],
  Pod: ["", "v1", "pods"],
  ControllerRevision: ["apps", "v1", "controllerrevisions"],
};
const initialResources = {
  requests: { cpu: "5m", memory: "8Mi" },
  limits: { cpu: "100m", memory: "48Mi" },
};
const editedResources = {
  requests: { cpu: "20m", memory: "24Mi" },
  limits: { cpu: "150m", memory: "96Mi" },
};
const requested = process.env.KV_V11_FORMS_STAGE || "all";
const resumeFrom = process.env.FROM || "statefulset";
if (!["statefulset", "daemonset"].includes(resumeFrom))
  throw new Error("Unknown resume boundary");
const runDeadline = Date.now() + 480000;
if (!["all", "workloads", "unsupported", "secret"].includes(requested))
  throw new Error("Unknown stage");
const registry = [],
  capabilities = [],
  secretBoundaries = [],
  sentinels = [];
const result = {
  schemaVersion: 1,
  runID,
  stage: requested,
  resumeFrom,
  limitsMilliseconds: { stage: 300000, total: 480000 },
  startedAt: new Date().toISOString(),
  testType:
    "real owned Kubernetes + normal production UI + independent actual API reconciliation",
  context: contextName,
  clusterUID,
  namespace,
  owner,
  fixtures: registry,
  cases: [],
  capabilities,
  secretBoundaries,
  cleanup: [],
  limits: [
    "Fixture setup is direct owned API; product changes use normal UI.",
    "Secret plaintext/base64 values stay only in memory; assertions record booleans.",
    "No traces/video; Secret reveal/editor never captured.",
    "API acceptance is distinct from rollout completion; no physical latency/FPS claim.",
  ],
};
let kubeconfig, namespaceUID, browser, browserContext, page, proxy, activeStage;
let secretMode = false,
  currentSocket,
  currentDiagnostic;
let binaryPath;
const clone = (value) => structuredClone(value);
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
const same = (left, right) =>
  JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const hash = (value) => createHash("sha256").update(value).digest("hex");
const check = (value, message) => {
  if (!value) throw new Error(message);
};
const cleanError = (error) => {
  let text = `${error?.name || "Error"}: ${error?.message || "Unknown failure"}`;
  for (const value of sentinels)
    text = text.split(value).join("[REDACTED_SYNTHETIC_SECRET]");
  return text.slice(0, 2500);
};
function deadline() {
  if (
    Date.now() > runDeadline ||
    activeStage?.expired ||
    (activeStage && Date.now() > activeStage.until)
  )
    throw new Error("Stage five-minute deadline reached");
}
function kubectl(args, input) {
  try {
    return execFileSync(
      "kubectl",
      ["--context", contextName, "--request-timeout=10s", ...args],
      {
        env: { ...process.env, KUBECONFIG: kubeconfig },
        input: input == null ? undefined : JSON.stringify(input),
        encoding: "utf8",
        timeout: 20000,
        maxBuffer: 2 << 20,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
  } catch (error) {
    // kubectl/auth-plugin errors may contain credentials or submitted bodies.
    throw new Error(
      `Owned Kubernetes command failed (${Number.isInteger(error.status) ? error.status : "transport"}); stderr/body withheld`,
    );
  }
}
const get = (kind, name, ns = namespace) =>
  JSON.parse(
    kubectl([
      "get",
      kinds[kind]?.[2] || kind.toLowerCase(),
      ...(name ? [name] : []),
      ...(ns ? ["-n", ns] : []),
      "-o",
      "json",
    ]),
  );
function guardScope(cleanup = false) {
  if (!cleanup) deadline();
  check(
    get("Namespace", "kube-system", "").metadata.uid === clusterUID,
    "Cluster UID guard rejected",
  );
  if (namespaceUID) {
    const n = get("Namespace", namespace, "");
    check(
      n.metadata.uid === namespaceUID &&
        n.metadata.labels?.[ownerKey] === owner,
      "Namespace UID/owner guard rejected",
    );
  }
}
function assertOwned(object, expected, { child = false } = {}) {
  const metadata = object?.metadata;
  check(
    metadata?.namespace === namespace &&
      metadata.labels?.[ownerKey] === owner &&
      metadata.labels?.[roleKey] &&
      metadata.uid &&
      metadata.resourceVersion,
    "Resource namespace/owner/role/UID/RV guard rejected",
  );
  if (expected)
    check(
      object.kind === expected.kind &&
        metadata.name === expected.name &&
        metadata.uid === expected.uid &&
        metadata.labels[roleKey] === expected.role,
      "Exact resource identity guard rejected",
    );
  if (child)
    check(
      metadata.ownerReferences?.some((ref) =>
        registry.some((parent) => parent.uid === ref.uid),
      ),
      "Child owner UID chain guard rejected",
    );
  return object;
}
function getOwned(fixture, cleanup = false) {
  guardScope(cleanup);
  return assertOwned(get(fixture.kind, fixture.name), fixture);
}
function createFixture(object) {
  guardScope();
  check(
    object.metadata.namespace === namespace &&
      object.metadata.labels?.[ownerKey] === owner &&
      object.metadata.labels?.[roleKey],
    "Fixture create guard rejected",
  );
  const created = assertOwned(
    JSON.parse(kubectl(["create", "-f", "-", "-o", "json"], object)),
  );
  const entry = {
    kind: created.kind,
    name: created.metadata.name,
    uid: created.metadata.uid,
    resourceVersion: created.metadata.resourceVersion,
    role: created.metadata.labels[roleKey],
  };
  registry.push(entry);
  return entry;
}
async function poll(fn, timeout = 90000) {
  const until = Math.min(Date.now() + timeout, activeStage?.until || Infinity);
  while (Date.now() < until) {
    deadline();
    const value = await fn();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Bounded real-state condition did not complete");
}
async function sourceIdentity() {
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
    .filter(Boolean);
  const map = {};
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
    binarySHA256: hash(await fs.readFile(binaryPath)),
  };
}
async function save() {
  const text = JSON.stringify(result, null, 2);
  check(
    !sentinels.some((value) => text.includes(value)),
    "Secret evidence scanner rejected output",
  );
  await fs.writeFile(path.join(dir, "result.json"), text);
}
async function capture(label) {
  // No screenshot is taken while a purpose-specific Secret view/editor is open.
  if (secretMode) {
    const text = await page.locator("body").innerText();
    const fields = await page
      .locator("textarea,input")
      .evaluateAll((nodes) => nodes.map((node) => node.value || "").join("\n"));
    check(
      !sentinels.some(
        (value) => text.includes(value) || fields.includes(value),
      ),
      "Secret value visible; screenshot refused",
    );
    check(
      (await page.locator(".resource-form-dialog").count()) === 0,
      "Secret editor screenshot refused",
    );
  }
  await page.screenshot({ path: path.join(dir, `${label}.png`) });
  (result.captures ||= []).push({ label, at: new Date().toISOString() });
}
async function stage(name, fn) {
  const row = { name, startedAt: new Date().toISOString(), status: "RUNNING" };
  result.cases.push(row);
  activeStage = {
    until: Math.min(Date.now() + 300000, runDeadline),
    expired: false,
    row,
  };
  const timer = setTimeout(() => {
    activeStage.expired = true;
    page?.close().catch(() => {});
  }, activeStage.until - Date.now());
  try {
    row.result = await fn();
    deadline();
    row.status = "PASS";
  } catch (error) {
    row.status = "FAIL";
    row.error = cleanError(error);
    throw error;
  } finally {
    clearTimeout(timer);
    row.finishedAt = new Date().toISOString();
    activeStage = null;
    await save();
  }
}
const affinity = {
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
};
function podTemplate(role, restartPolicy = "Always") {
  return {
    metadata: { labels: labels(role), annotations: clone(annotations) },
    spec: {
      affinity: clone(affinity),
      restartPolicy,
      volumes: [{ name: "scratch", emptyDir: {} }],
      terminationGracePeriodSeconds: 1,
      containers: ["app", "sidecar"].map((name) => ({
        name,
        image: "alpine:3.21",
        imagePullPolicy: "IfNotPresent",
        command: ["sleep", "900"],
        env: [{ name: "PRESERVE_ME", value: `role-${name}` }],
        resources: clone(initialResources),
        volumeMounts: [{ name: "scratch", mountPath: `/scratch-${name}` }],
        readinessProbe: {
          exec: { command: ["sh", "-c", "test -d /scratch-" + name] },
          periodSeconds: 2,
        },
      })),
    },
  };
}
function workloadObject(kind, name, role) {
  const template = podTemplate(
    role,
    ["Job", "CronJob"].includes(kind) ? "Never" : "Always",
  );
  const object = {
    apiVersion: kinds[kind][0] + "/v1",
    kind,
    metadata: {
      name,
      namespace,
      labels: labels(role),
      annotations: clone(annotations),
    },
  };
  if (kind === "StatefulSet")
    object.spec = {
      serviceName: "v11-forms-headless",
      replicas: 1,
      selector: { matchLabels: { [roleKey]: role } },
      updateStrategy: { type: "RollingUpdate" },
      template,
    };
  else if (kind === "DaemonSet")
    object.spec = {
      selector: { matchLabels: { [roleKey]: role } },
      updateStrategy: {
        type: "RollingUpdate",
        rollingUpdate: { maxUnavailable: 1 },
      },
      template,
    };
  else if (kind === "ReplicaSet")
    object.spec = {
      replicas: 0,
      selector: { matchLabels: { [roleKey]: role } },
      template,
    };
  else if (kind === "Job") object.spec = { suspend: true, template };
  else
    object.spec = {
      suspend: true,
      schedule: "0 0 1 1 *",
      jobTemplate: { spec: { template } },
    };
  return object;
}
function ownedPods(fixture) {
  return get("Pod")
    .items.filter((p) =>
      p.metadata.ownerReferences?.some((ref) => ref.uid === fixture.uid),
    )
    .map((p) => assertOwned(p, null, { child: true }));
}
function workloadReady(object) {
  if ((object.status?.observedGeneration || 0) < object.metadata.generation)
    return false;
  if (object.kind === "StatefulSet")
    return (
      object.status?.readyReplicas === 1 &&
      object.status?.updatedReplicas === 1 &&
      object.status?.currentRevision === object.status?.updateRevision
    );
  return (
    object.status?.desiredNumberScheduled === 1 &&
    object.status?.numberReady === 1 &&
    object.status?.updatedNumberScheduled === 1 &&
    !object.status?.numberUnavailable
  );
}
const metadataView = (object) => ({
  kind: object.kind,
  name: object.metadata.name,
  uid: object.metadata.uid,
  resourceVersion: object.metadata.resourceVersion,
  generation: object.metadata.generation,
  role: object.metadata.labels[roleKey],
  owner: object.metadata.labels[ownerKey],
});
async function configureScope() {
  const dialog = await openConnection(page);
  if (
    (await dialog
      .getByLabel("Cluster / context", { exact: true })
      .inputValue()) !== contextName
  )
    await dialog
      .getByLabel("Cluster / context", { exact: true })
      .selectOption(contextName);
  await poll(() => currentDiagnostic?.context === contextName, 30000);
  await dialog
    .getByLabel("Namespace adıyla kapsam", { exact: true })
    .fill(namespace);
  await dialog
    .getByRole("button", { name: "Kapsamı uygula", exact: true })
    .click();
  await poll(
    () =>
      currentDiagnostic?.context === contextName &&
      currentDiagnostic.namespace === namespace &&
      currentSocket?.namespace === namespace &&
      currentSocket.snapshot,
    30000,
  );
  await expect(
    dialog.getByText("Snapshot alındı", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Pencereyi kapat", exact: true })
    .click();
  await enableManagement(page);
}
async function editWorkload(kind, name, role) {
  const fixture = createFixture(workloadObject(kind, name, role));
  const before = await poll(() => {
    const object = getOwned(fixture);
    return workloadReady(object) && object;
  });
  activeStage.row.evidence = { before: metadataView(before) };
  const oldPods = ownedPods(fixture);
  check(
    oldPods.length === 1 &&
      oldPods[0].status?.containerStatuses?.every((c) => c.ready),
    "Initial owned multi-container Pod is not Ready",
  );
  const details = await findResource(page, kind, name, fixture.uid);
  const action = details.getByRole("button", {
    name: "CPU / RAM",
    exact: true,
  });
  await expect(action).toBeEnabled();
  guardScope();
  getOwned(fixture);
  await action.click();
  const form = page.locator(".resource-form-dialog");
  await expect(
    form.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true }),
  ).toHaveCount(0);
  const group = form.getByRole("group", { name: "app", exact: true });
  for (const [label, value] of [
    ["CPU request", "20m"],
    ["CPU limit", "150m"],
    ["Bellek request", "24Mi"],
    ["Bellek limit", "96Mi"],
  ])
    await group.getByLabel(label, { exact: false }).fill(value);
  await form
    .getByRole("button", { name: "Server dry-run", exact: true })
    .click();
  await expect(form.locator(".dry-run-preview")).toContainText(
    "Server dry-run başarılı.",
  );
  const afterDryRun = getOwned(fixture);
  check(
    same(afterDryRun.spec, before.spec),
    "Dry-run changed the workload spec",
  );
  await capture(`${kind.toLowerCase()}-dry-run`);
  const accepted = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/actions" &&
      response.request().method() === "POST" &&
      response.request().postDataJSON()?.action === "resources" &&
      response.request().postDataJSON()?.uid === fixture.uid,
  );
  guardScope();
  getOwned(fixture);
  await form.getByRole("button", { name: "Uygula", exact: true }).click();
  const response = await accepted;
  activeStage.row.evidence.APIAccepted = response.status();
  check(response.status() === 202, "Template API did not return202 acceptance");
  await expect(form).toHaveCount(0);
  const after = await poll(() => {
    const object = getOwned(fixture);
    return (
      object.spec?.template?.spec?.containers?.[0]?.resources?.requests?.cpu ===
        "20m" &&
      workloadReady(object) &&
      object
    );
  }, 100000);
  const expectedSpec = clone(before.spec);
  expectedSpec.template.spec.containers[0].resources = clone(editedResources);
  check(
    same(after.spec, expectedSpec),
    "Template mutation lost or changed unrelated spec/container/env/probe/volume/affinity metadata",
  );
  const controllerAnnotation = "deprecated.daemonset.template.generation";
  const beforeAnnotations = clone(before.metadata.annotations || {});
  const afterAnnotations = clone(after.metadata.annotations || {});
  const changes = [
    ...new Set([
      ...Object.keys(beforeAnnotations),
      ...Object.keys(afterAnnotations),
    ]),
  ].filter((key) => beforeAnnotations[key] !== afterAnnotations[key]);
  activeStage.row.evidence.annotationChangedKeys = changes;
  if (kind === "DaemonSet") {
    activeStage.row.evidence.controllerOwnedAnnotation = {
      key: controllerAnnotation,
      before: beforeAnnotations[controllerAnnotation] ?? null,
      after: afterAnnotations[controllerAnnotation] ?? null,
    };
    delete beforeAnnotations[controllerAnnotation];
    delete afterAnnotations[controllerAnnotation];
  }
  const metadataPreserved =
    same(after.metadata.labels, before.metadata.labels) &&
    same(afterAnnotations, beforeAnnotations);
  activeStage.row.evidence.unknownMetadataPreserved = metadataPreserved;
  activeStage.row.evidence.after = metadataView(after);
  check(
    metadataPreserved,
    "Workload unknown metadata changed outside the exact controller-owned annotation",
  );
  const newPods = ownedPods(fixture).filter(
    (p) => !p.metadata.deletionTimestamp,
  );
  check(
    newPods.length === 1 &&
      newPods[0].metadata.uid !== oldPods[0].metadata.uid &&
      newPods[0].status.containerStatuses.every((c) => c.ready),
    "RollingUpdate did not reach a new exact Ready Pod UID",
  );
  check(
    same(
      newPods[0].spec.containers.find((c) => c.name === "app").resources,
      editedResources,
    ),
    "New Pod resources differ from the accepted template",
  );
  await capture(`${kind.toLowerCase()}-observed-ready`);
  return {
    before: metadataView(before),
    after: metadataView(after),
    strategy: after.spec.updateStrategy,
    APIAccepted: 202,
    dryRunDidNotMutate: true,
    multiContainerMetadataPreserved: true,
    oldPodUID: oldPods[0].metadata.uid,
    newReadyPodUID: newPods[0].metadata.uid,
    actualStatus: after.status,
  };
}
async function unsupportedWorkloads() {
  const results = [];
  for (const [kind, name, role, reason] of [
    [
      "ReplicaSet",
      "v11-forms-standalone-rs",
      "unsupported-rs",
      /Bağımsız ReplicaSet/,
    ],
    ["Job", "v11-forms-suspended-job", "unsupported-job", /Job.*immutable/],
    [
      "CronJob",
      "v11-forms-suspended-cron",
      "unsupported-cron",
      /CronJob.*gelecekteki/,
    ],
  ]) {
    const fixture = createFixture(workloadObject(kind, name, role)),
      before = getOwned(fixture);
    const details = await findResource(page, kind, name, fixture.uid);
    const button = details.getByRole("button", {
      name: "CPU / RAM",
      exact: true,
    });
    await expect(button).toBeDisabled();
    await expect.poll(() => button.getAttribute("title")).toMatch(reason);
    await expect(details).toContainText(reason);
    const capability = [...capabilities]
      .reverse()
      .find(
        (c) =>
          c.name === name &&
          c.uid === fixture.uid &&
          c.template?.supported === false,
      );
    check(
      capability,
      "Unsupported state was not backed by actual capability response",
    );
    await capture(`${kind.toLowerCase()}-unsupported`);
    check(
      same(getOwned(fixture).spec, before.spec),
      "Unsupported UX unexpectedly changed the real object",
    );
    results.push({
      kind,
      ...metadataView(before),
      disabled: true,
      reason: await button.getAttribute("title"),
      actualCapability: capability.template,
      mutationObserved: false,
    });
  }
  return results;
}
async function secretCase() {
  secretMode = true;
  const plain = `synthetic-${randomUUID()}`,
    updated = `synthetic-edited-${randomUUID()}`;
  const encoded = Buffer.from(plain).toString("base64"),
    changed = Buffer.from(updated).toString("base64");
  sentinels.push(plain, updated, encoded, changed);
  const fixture = createFixture({
    apiVersion: "v1",
    kind: "Secret",
    type: "Opaque",
    metadata: {
      name: "v11-forms-synthetic-secret",
      namespace,
      labels: labels("synthetic-secret"),
      annotations: clone(annotations),
    },
    data: { fixture: encoded },
  });
  const before = getOwned(fixture);
  let details = await findResource(page, "Secret", fixture.name, fixture.uid);
  check(
    !(await details.innerText()).includes(plain),
    "Secret leaked before explicit reveal",
  );
  await details
    .getByRole("button", {
      name: "Yetkiyle Secret değerlerini aç",
      exact: true,
    })
    .click();
  await expect(
    details.getByRole("button", { name: "Değerleri gizle", exact: true }),
  ).toBeVisible();
  check(
    (await details.innerText()).includes(plain),
    "Explicit Secret reveal did not match generated value",
  );
  await details
    .getByRole("button", { name: "Değerleri gizle", exact: true })
    .click();
  check(
    !(await details.innerText()).includes(plain),
    "Secret hide left its generated value visible",
  );
  guardScope();
  getOwned(fixture);
  await details
    .getByRole("button", { name: "Gizli içeriği düzenle", exact: true })
    .click();
  const form = page.locator(".resource-form-dialog"),
    editor = form.getByLabel("Kaynak YAML", { exact: true });
  await expect(
    form.getByText("Kaynağın güncel sürümü alınıyor…", { exact: true }),
  ).toHaveCount(0);
  const revealed = YAML.parse(await editor.inputValue());
  check(
    revealed?.data?.fixture === encoded &&
      revealed.metadata.uid === fixture.uid &&
      !Object.hasOwn(revealed, "keyNames"),
    "Purpose-specific editor did not load the real identity/value",
  );
  check(
    revealed.metadata.annotations?.["audit.kubeview.io/preserve-annotation"] ===
      annotations["audit.kubeview.io/preserve-annotation"],
    "Secret reveal lost unknown annotation",
  );
  const masked = clone(revealed);
  delete masked.data;
  masked.keyNames = ["fixture"];
  const requestsBefore = result.secretMutationRequests || 0;
  await editor.fill(YAML.stringify(masked));
  await form
    .getByRole("button", { name: "Server dry-run", exact: true })
    .click();
  await expect(form.getByRole("alert")).toContainText(/maskelenmiş metadata/i);
  check(
    (result.secretMutationRequests || 0) === requestsBefore &&
      getOwned(fixture).data.fixture === encoded,
    "Masked metadata reached or changed the real Secret",
  );
  revealed.data.fixture = changed;
  await editor.fill(YAML.stringify(revealed));
  await form
    .getByRole("button", { name: "Server dry-run", exact: true })
    .click();
  await expect(form.locator(".dry-run-preview")).toContainText(
    "Server dry-run başarılı.",
  );
  const preview = await form.locator(".dry-run-preview").innerText();
  check(
    !sentinels.some((value) => preview.includes(value)),
    "Dry-run preview leaked Secret values",
  );
  check(
    getOwned(fixture).data.fixture === encoded,
    "Secret dry-run mutated its actual value",
  );
  const accepted = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/resources" &&
      response.request().method() === "PUT" &&
      response.request().postDataJSON()?.object?.metadata?.name ===
        fixture.name &&
      response.request().postDataJSON()?.dryRun === false,
  );
  guardScope();
  getOwned(fixture);
  await form.getByRole("button", { name: "Uygula", exact: true }).click();
  check((await accepted).status() === 200, "Secret update not accepted");
  await expect(form).toHaveCount(0);
  const after = getOwned(fixture);
  check(
    after.data.fixture === changed &&
      after.metadata.uid === before.metadata.uid,
    "Secret value or UID differs after accepted update",
  );
  check(
    same(after.metadata.labels, before.metadata.labels) &&
      same(after.metadata.annotations, before.metadata.annotations),
    "Secret update lost unknown metadata",
  );
  await closePanels(page);
  details = await findResource(page, "Secret", fixture.name, fixture.uid);
  const bodyText = await page.locator("body").innerText();
  check(
    !sentinels.some((value) => bodyText.includes(value)),
    "Reopened Secret view retained a revealed value",
  );
  await expect(
    details.getByRole("button", {
      name: "Yetkiyle Secret değerlerini aç",
      exact: true,
    }),
  ).toBeVisible();
  check(
    secretBoundaries.length > 0 &&
      secretBoundaries.every(
        (row) => !row.hasData && !row.hasStringData && !row.containsSentinel,
      ),
    "Canonical Secret metadata boundary failed",
  );
  await capture("secret-reopened-metadata-only");
  return {
    before: metadataView(before),
    after: metadataView(after),
    syntheticRevealMatched: true,
    hideClearedDOM: true,
    maskedMetadataRejectedBeforeHTTP: true,
    dryRunDidNotMutate: true,
    dryRunPreviewMetadataOnly: true,
    unknownMetadataPreserved: true,
    actualUpdatedValueMatched: true,
    reopenedViewMetadataOnly: true,
    recordedPayloads: false,
  };
}
async function cleanup() {
  if (!namespaceUID) return;
  guardScope(true);
  proxy = spawn(
    "kubectl",
    ["--context", contextName, "proxy", "--address=127.0.0.1", "--port=19488"],
    { env: { ...process.env, KUBECONFIG: kubeconfig }, stdio: "ignore" },
  );
  const until = Date.now() + 5000;
  while (Date.now() < until) {
    try {
      if ((await fetch("http://127.0.0.1:19488/version")).ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const url = (kind, name) => {
    const [group, version, resource] = kinds[kind];
    return `http://127.0.0.1:19488/${group ? `apis/${group}/${version}` : `api/${version}`}/namespaces/${namespace}/${resource}/${name}`;
  };
  const remove = async (object, attempt = 0) => {
    guardScope(true);
    const response = await fetch(url(object.kind, object.metadata.name), {
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
      const latest = await fetch(url(object.kind, object.metadata.name));
      if (latest.status === 404) {
        result.cleanup.push({
          kind: object.kind,
          name: object.metadata.name,
          uid: object.metadata.uid,
          status: "concurrent owned deletion404",
        });
        return;
      }
      check(latest.ok, "Cleanup reconciliation failed");
      const fresh = assertOwned(await latest.json(), {
        kind: object.kind,
        name: object.metadata.name,
        uid: object.metadata.uid,
        role: object.metadata.labels[roleKey],
      });
      return remove(fresh, attempt + 1);
    }
    check(
      response.ok || response.status === 404,
      `Exact UID/RV cleanup failed (${response.status})`,
    );
    const until = Date.now() + 20000;
    while (Date.now() < until) {
      if (
        (await fetch(url(object.kind, object.metadata.name))).status === 404
      ) {
        result.cleanup.push({
          kind: object.kind,
          name: object.metadata.name,
          uid: object.metadata.uid,
          status: "UID/RV DELETE then404",
        });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error("Exact resource DELETE404 deadline");
  };
  for (const fixture of [...registry].reverse()) {
    const response = await fetch(url(fixture.kind, fixture.name));
    if (response.status === 404) {
      result.cleanup.push({
        kind: fixture.kind,
        name: fixture.name,
        uid: fixture.uid,
        status: "already404",
      });
      continue;
    }
    check(response.ok, "Cleanup inventory API failed");
    await remove(assertOwned(await response.json(), fixture));
  }
  for (const kind of ["Pod", "ControllerRevision"]) {
    for (const object of get(kind).items.filter(
      (o) => o.metadata.labels?.[ownerKey] === owner,
    )) {
      assertOwned(object, null, { child: true });
      const response = await fetch(url(kind, object.metadata.name));
      if (response.status === 404) continue;
      await remove(
        assertOwned(
          await response.json(),
          {
            kind,
            name: object.metadata.name,
            uid: object.metadata.uid,
            role: object.metadata.labels[roleKey],
          },
          { child: true },
        ),
      );
    }
  }
  const n = get("Namespace", namespace, "");
  guardScope(true);
  const address = `http://127.0.0.1:19488/api/v1/namespaces/${namespace}`;
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
  check(response.ok, "Namespace UID/RV cleanup failed");
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    if ((await fetch(address)).status === 404) {
      result.cleanup.push({
        namespace,
        uid: namespaceUID,
        status: "UID/RV DELETE then404",
      });
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Namespace DELETE404 deadline");
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
        (p) => path.isAbsolute(p) && p.includes(`${path.sep}.git${path.sep}`),
      ),
    "Private kubeconfig path-list guard failed",
  );
  binaryPath =
    process.env.KV_V11_FORMS_BINARY ||
    path.join(root, ".git/kv-v11-runtime/install-macos/kubeview");
  const build = JSON.parse(
    await fs.readFile(
      path.join(root, "artifacts/v1.1.0/v11-20261108/resume-focus-build.json"),
      "utf8",
    ),
  );
  result.sourceStart = await sourceIdentity();
  if (resumeFrom === "daemonset") {
    const predecessorPath = path.join(
      base,
      "runs/2026-11-09T08-26-30-255Z/result.json",
    );
    const predecessor = JSON.parse(await fs.readFile(predecessorPath, "utf8"));
    check(
      predecessor.cases[0]?.status === "PASS" &&
        predecessor.sourceStart.sourceSHA256 ===
          result.sourceStart.sourceSHA256 &&
        predecessor.sourceStart.binarySHA256 ===
          result.sourceStart.binarySHA256 &&
        predecessor.sourceUnchanged &&
        predecessor.buildUnchanged,
      "Source-identical previous StatefulSet PASS could not be reused",
    );
    result.reusedStatefulSet = {
      path: path.relative(base, predecessorPath),
      status: "PASS",
      sourceSHA256: predecessor.sourceStart.sourceSHA256,
      binarySHA256: predecessor.sourceStart.binarySHA256,
    };
    result.resumeReason =
      "Keep the source-identical StatefulSet PASS. The previous DaemonSet assertion compared all annotations; this helper excludes only deprecated.daemonset.template.generation and records its exact transition while comparing every other annotation/label and the full preserved spec. Previous FAIL remains unchanged.";
  }
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
  check(
    result.sourceStart.binarySHA256 === build.binarySHA256 &&
      build.commit.startsWith("0f5a5ab"),
    "Expected frozen embedded binary guard failed",
  );
  result.build = {
    commit: build.commit,
    binarySHA256: build.binarySHA256,
    version: build.version,
  };
  guardScope();
  const existing = JSON.parse(
    kubectl([
      "get",
      "namespace",
      namespace,
      "-o",
      "json",
      "--ignore-not-found",
    ]) || "null",
  );
  check(
    !existing,
    "Forms namespace already exists; no takeover without a separately recorded UID",
  );
  const n = JSON.parse(
    kubectl(["create", "-f", "-", "-o", "json"], {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: {
        name: namespace,
        labels: { [ownerKey]: owner, [roleKey]: "forms-scope" },
      },
    }),
  );
  namespaceUID = n.metadata.uid;
  result.namespaceUID = namespaceUID;
  guardScope();
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
  page.on("pageerror", (error) => {
    (result.pageErrors ||= []).push(cleanError(error));
  });
  page.on("websocket", (socket) => {
    const query = new URL(socket.url());
    if (query.pathname !== "/ws") return;
    const observation = {
      namespace: query.searchParams.get("namespace") || "",
      snapshot: false,
    };
    currentSocket = observation;
    socket.on("framereceived", ({ payload }) => {
      try {
        const message = JSON.parse(String(payload));
        if (message.type === "SNAPSHOT") observation.snapshot = true;
        const objects =
          message.type === "SNAPSHOT"
            ? Array.isArray(message.resources)
              ? message.resources
              : Object.values(message.resources || {})
            : [message.object];
        for (const object of objects.filter(
          (o) => o?.kind === "Secret" && o.metadata?.namespace === namespace,
        ))
          secretBoundaries.push({
            at: new Date().toISOString(),
            uid: object.metadata.uid,
            hasData: Object.hasOwn(object, "data"),
            hasStringData: Object.hasOwn(object, "stringData"),
            keyNames: object.keyNames || [],
            containsSentinel: sentinels.some((value) =>
              JSON.stringify(object).includes(value),
            ),
          });
      } catch {}
    });
  });
  page.on("response", async (response) => {
    try {
      const u = new URL(response.url());
      if (u.pathname === "/api/connection" && response.status() === 200) {
        const data = await response.json();
        currentDiagnostic = {
          context: data.context,
          namespace: data.namespace || "",
          readOnly: data.readOnly,
        };
      }
      if (
        u.pathname === "/api/capabilities" &&
        response.status() === 200 &&
        u.searchParams.get("namespace") === namespace
      ) {
        const data = await response.json();
        capabilities.push({
          name: u.searchParams.get("name"),
          uid: u.searchParams.get("uid"),
          template: data.templateResources,
        });
      }
      if (
        u.pathname === "/api/resources" &&
        response.request().method() === "PUT" &&
        secretMode
      )
        result.secretMutationRequests =
          (result.secretMutationRequests || 0) + 1;
      // Do not record raw response bodies, request bodies, URLs or headers.
    } catch {}
  });
  await page.goto("http://127.0.0.1:18410");
  await configureScope();
  if (["all", "workloads"].includes(requested)) {
    if (resumeFrom !== "daemonset")
      await stage(
        "StatefulSet RollingUpdate CPU/RAM + two-container metadata preservation",
        () => editWorkload("StatefulSet", "v11-forms-sts", "stateful-template"),
      );
    await stage(
      "DaemonSet RollingUpdate CPU/RAM + two-container metadata preservation",
      () => editWorkload("DaemonSet", "v11-forms-ds", "daemon-template"),
    );
  }
  if (["all", "unsupported"].includes(requested))
    await stage(
      "Standalone ReplicaSet/Job/CronJob actual unsupported UX",
      unsupportedWorkloads,
    );
  if (["all", "secret"].includes(requested))
    await stage(
      "Synthetic Secret reveal/edit + masked-boundary preservation",
      secretCase,
    );
  check(!result.pageErrors?.length, "Application pageerror observed");
  result.status = "PASS";
} catch (error) {
  result.status = "FAIL";
  result.error = cleanError(error);
  if (page && !secretMode) await capture("failure").catch(() => {});
} finally {
  await browserContext?.close().catch(() => {});
  await browser?.close().catch(() => {});
  try {
    await cleanup();
  } catch (error) {
    result.cleanup.push({ status: "FAIL", error: cleanError(error) });
    result.status = "FAIL";
  }
  if (proxy) {
    proxy.kill("SIGTERM");
    await new Promise((resolve) => {
      if (proxy.exitCode != null) resolve();
      else {
        proxy.once("exit", resolve);
        setTimeout(resolve, 2000);
      }
    });
  }
  if (binaryPath) {
    result.sourceEnd = await sourceIdentity();
    result.sourceUnchanged =
      result.sourceStart?.sourceSHA256 === result.sourceEnd.sourceSHA256;
    result.helperUnchanged =
      result.sourceStart?.helperSHA256 === result.sourceEnd.helperSHA256;
    result.buildUnchanged =
      result.sourceStart?.binarySHA256 === result.sourceEnd.binarySHA256;
    if (
      !result.sourceUnchanged ||
      !result.helperUnchanged ||
      !result.buildUnchanged
    )
      result.status = "FAIL";
  }
  result.finishedAt = new Date().toISOString();
  result.ownedProcesses = {
    browserClosed: true,
    proxyPID: proxy?.pid || null,
    proxyStopped: !proxy || proxy.exitCode != null || proxy.signalCode != null,
  };
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
    cleanupFailed: result.cleanup.some((row) => row.status === "FAIL"),
    sourceUnchanged: result.sourceUnchanged,
    buildUnchanged: result.buildUnchanged,
  }),
);
if (result.status !== "PASS") process.exitCode = 1;
