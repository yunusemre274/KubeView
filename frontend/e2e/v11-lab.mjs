// Test-only owned-lab access. Never discovers or mutates the default context.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ownerKey = "kubeview.io/v11-owner";
const resourceKinds = new Map([
  ["Pod", ["", "v1", "pods"]],
  ["Deployment", ["apps", "v1", "deployments"]],
  ["ReplicaSet", ["apps", "v1", "replicasets"]],
  ["StatefulSet", ["apps", "v1", "statefulsets"]],
  ["DaemonSet", ["apps", "v1", "daemonsets"]],
  ["ConfigMap", ["", "v1", "configmaps"]],
  ["Service", ["", "v1", "services"]],
]);

export class LabBlocked extends Error {
  constructor(message) { super(message); this.name = "LabBlocked"; }
}

function privatePath(value, label) {
  if (!value || !path.isAbsolute(value)) throw new LabBlocked(`${label}: absolute private path required`);
  const relative = path.relative(root, value);
  if (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !relative.startsWith(`.git${path.sep}`))
    throw new LabBlocked(`${label}: keep private material outside versioned evidence`);
  return value;
}

export async function loadLab() {
  const configFile = privatePath(process.env.KV_V11_CONFIG_FILE, "KV_V11_CONFIG_FILE");
  const config = {};
  // Data only: no shell evaluation, expansion, exports or executable kubeconfig content.
  for (const raw of (await fs.readFile(configFile, "utf8")).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const match = /^(KV_V11_[A-Z0-9_]+)=([^\r\n]*)$/.exec(line);
    if (!match) throw new LabBlocked("Private config.env must contain plain KV_V11_KEY=value metadata");
    config[match[1]] = match[2];
  }
  const required = (key) => {
    const value = config[`KV_V11_${key}`];
    if (!value) throw new LabBlocked(`Missing private metadata KV_V11_${key}`);
    return value;
  };
  const baseURL = new URL(required("BASE_URL"));
  if (!["127.0.0.1", "localhost", "[::1]"].includes(baseURL.hostname) || !["http:", "https:"].includes(baseURL.protocol))
    throw new LabBlocked("Only explicit loopback production gateway is allowed");
  const namespace = required("NAMESPACE"), owner = required("OWNER");
  if (!/^(kv-v11-|kv-repair-)[a-z0-9-]+$/.test(namespace) || owner !== "v11-20261108")
    throw new LabBlocked("Owned v1.1 namespace and exact run owner required");
  const slots = {};
  for (const slot of ["A", "B"]) {
    const context = required(`CONTEXT_${slot}`), clusterUID = required(`CLUSTER_UID_${slot}`);
    if (!/^(kv-v11-|kv-repair-)[a-zA-Z0-9-]+$/.test(context) || !/^[a-f0-9-]{36}$/.test(clusterUID))
      throw new LabBlocked(`Invalid explicit owned cluster ${slot}`);
    slots[slot] = { slot, context, clusterUID, namespace, namespaceUID: required(`NAMESPACE_UID_${slot}`) };
  }
  if (slots.A.clusterUID === slots.B.clusterUID || slots.A.context === slots.B.context)
    throw new LabBlocked("A and B must be two genuinely different clusters");
  return {
    baseURL: baseURL.origin, namespace, owner, slots,
    kubeconfig: privatePath(required("KUBECONFIG"), "KUBECONFIG"),
    samePod: config.KV_V11_SAME_POD || "v11-same-name",
    restrictedContext: config.KV_V11_RESTRICTED_CONTEXT || "",
    unavailableContext: config.KV_V11_UNAVAILABLE_CONTEXT || "",
    emptyNamespace: config.KV_V11_EMPTY_NAMESPACE || "",
    emptyNamespaceUID: config.KV_V11_EMPTY_NAMESPACE_UID || "",
    image: config.KV_V11_IMAGE || "nginx:1.27-alpine",
    fixtureImage: config.KV_V11_FIXTURE_IMAGE || "alpine:3.21",
    backendBinary: config.KV_V11_BACKEND_BINARY || "",
    staticDir: config.KV_V11_STATIC_DIR || "",
    recoveryDeployment: config.KV_V11_RECOVERY_DEPLOYMENT || "",
    recoveryUID: config.KV_V11_RECOVERY_UID || "",
    ownerKey,
  };
}

async function kubectl(lab, slot, args, input) {
  return new Promise((resolve, reject) => {
    const child = execFile("kubectl", ["--kubeconfig", lab.kubeconfig, "--context", slot.context,
      "--request-timeout=10s", ...args], { timeout: 20000, maxBuffer: 2 << 20 }, (error, stdout) => {
      // Never expose stderr: auth plugins and transport errors can contain credentials.
      if (error) reject(new Error(`Owned Kubernetes request failed (${error.code || "transport"})`));
      else resolve(stdout);
    });
    if (input) child.stdin.end(JSON.stringify(input));
  });
}

export async function guardScope(lab, slot) {
  const system = JSON.parse(await kubectl(lab, slot, ["get", "namespace", "kube-system", "-o", "json"]));
  if (system.metadata.uid !== slot.clusterUID) throw new Error(`Cluster ${slot.slot} UID guard rejected`);
  const namespace = JSON.parse(await kubectl(lab, slot, ["get", "namespace", slot.namespace, "-o", "json"]));
  if (namespace.metadata.uid !== slot.namespaceUID || namespace.metadata.labels?.[ownerKey] !== lab.owner)
    throw new Error(`Cluster ${slot.slot} namespace UID/owner guard rejected`);
  return { context: slot.context, clusterUID: slot.clusterUID, namespace: slot.namespace, namespaceUID: slot.namespaceUID };
}

export async function getOwned(lab, slot, kind, name) {
  if (!resourceKinds.has(kind) || !/^v11-[a-z0-9-]+$/.test(name)) throw new Error("Unowned resource selector rejected");
  await guardScope(lab, slot);
  const object = JSON.parse(await kubectl(lab, slot, ["get", resourceKinds.get(kind)[2], name, "-n", slot.namespace, "-o", "json"]));
  assertOwned(lab, slot, object);
  return object;
}

export function assertOwned(lab, slot, object, expectedUID) {
  const metadata = object?.metadata;
  if (!resourceKinds.has(object?.kind) || metadata?.namespace !== slot.namespace ||
      !/^v11-[a-z0-9-]+$/.test(metadata?.name || "") || metadata.labels?.[ownerKey] !== lab.owner ||
      !metadata.uid || !metadata.resourceVersion || (expectedUID && metadata.uid !== expectedUID))
    throw new Error("Resource kind/name/namespace/owner/UID/resourceVersion guard rejected");
  return object;
}

export function resourcePath(slot, object) {
  const [group, version, resource] = resourceKinds.get(object.kind) || [];
  if (!resource) throw new Error("Unsupported test resource kind");
  return `/api/resources?${new URLSearchParams({ context: slot.context, namespace: slot.namespace,
    group, version, resource, name: object.metadata.name })}`;
}

// Fixture setup is separate from the product action under test. The caller must
// hold the root manager's cluster/test lease before invoking this function.
export async function createFixture(lab, slot, object) {
  if (!resourceKinds.has(object?.kind) || object.metadata?.namespace !== slot.namespace ||
      !/^v11-[a-z0-9-]+$/.test(object.metadata?.name || "") ||
      object.metadata.labels?.[ownerKey] !== lab.owner || object.metadata.uid || object.metadata.resourceVersion)
    throw new Error("Fixture ownership guard rejected");
  await guardScope(lab, slot);
  // CREATE never takes over an existing object; API AlreadyExists remains failure.
  const result = JSON.parse(await kubectl(lab, slot, ["create", "-f", "-", "-o", "json"], object));
  assertOwned(lab, slot, result);
  await fs.appendFile(path.join(root, "artifacts/v1.1.0/v11-20261108/qa/fixture-registry.jsonl"),
    `${JSON.stringify({ at: new Date().toISOString(), context: slot.context, clusterUID: slot.clusterUID,
      namespace: slot.namespace, namespaceUID: slot.namespaceUID, owner: lab.owner, kind: result.kind,
      name: result.metadata.name, uid: result.metadata.uid, resourceVersion: result.metadata.resourceVersion })}\n`);
  return result;
}

// Real metadata-only watch stimulus. UID and resourceVersion JSON-patch tests
// prevent an intervening same-name replacement from receiving this mutation.
export async function patchOwnedAnnotation(lab, slot, kind, name, expectedUID, key, value) {
  if (!/^kubeview\.io\/v11-[a-z0-9-]+$/.test(key) || typeof value !== "string")
    throw new Error("Only an explicit v1.1 test annotation may be patched");
  const fresh = assertOwned(lab, slot, await getOwned(lab, slot, kind, name), expectedUID);
  const patch = [
    { op: "test", path: "/metadata/uid", value: expectedUID },
    { op: "test", path: "/metadata/resourceVersion", value: fresh.metadata.resourceVersion },
    { op: "add", path: "/metadata/annotations", value: { ...fresh.metadata.annotations, [key]: value } },
  ];
  await guardScope(lab, slot);
  const result = JSON.parse(await kubectl(lab, slot, ["patch", resourceKinds.get(kind)[2], name,
    "-n", slot.namespace, "--type=json", "-p", JSON.stringify(patch), "-o", "json"]));
  return assertOwned(lab, slot, result, expectedUID);
}

export async function cleanupOwned(lab, slot, object, request, connectionID = "") {
  await guardScope(lab, slot);
  const expected = assertOwned(lab, slot, object).metadata.uid;
  const current = await request.get(new URL(resourcePath(slot, object), lab.baseURL).href);
  if (current.status() === 404) return { status: "PASS", result: "already-absent", uid: expected };
  if (!current.ok()) throw new Error(`Cleanup lookup HTTP ${current.status()}`);
  const fresh = assertOwned(lab, slot, await current.json(), expected);
  await guardScope(lab, slot);
  const response = await request.delete(new URL(resourcePath(slot, fresh), lab.baseURL).href, {
    headers: connectionID ? { "X-KubeView-Connection": connectionID } : {},
    data: { uid: fresh.metadata.uid, resourceVersion: fresh.metadata.resourceVersion },
  });
  if (![200, 202, 404].includes(response.status())) throw new Error(`Guarded cleanup HTTP ${response.status()}`);
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const remaining = await request.get(new URL(resourcePath(slot, object), lab.baseURL).href);
    if (remaining.status() === 404) return { status: "PASS", result: "deleted-and-404-observed", uid: expected };
    if (!remaining.ok()) throw new Error(`Cleanup verification HTTP ${remaining.status()}`);
    assertOwned(lab, slot, await remaining.json(), expected);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Cleanup DELETE accepted but resource still exists after 60 seconds");
}

export async function releaseOwnedFinalizer(lab, slot, object, request, connectionID) {
  await guardScope(lab, slot);
  const expected = assertOwned(lab, slot, object).metadata.uid;
  const response = await request.get(new URL(resourcePath(slot, object), lab.baseURL).href);
  if (response.status() === 404) return;
  if (!response.ok()) throw new Error(`Finalizer lookup HTTP ${response.status()}`);
  const fresh = assertOwned(lab, slot, await response.json(), expected);
  const finalizers = fresh.metadata.finalizers || [];
  if (!finalizers.includes("kubeview.io/v11-test-hold")) return;
  if (finalizers.some((value) => value !== "kubeview.io/v11-test-hold"))
    throw new Error("Unknown finalizer present; refusing modification");
  const updated = { ...fresh, metadata: { ...fresh.metadata, finalizers: [] } };
  await guardScope(lab, slot);
  const result = await request.put(new URL(resourcePath(slot, fresh), lab.baseURL).href, {
    headers: { "X-KubeView-Connection": connectionID }, data: { object: updated },
  });
  if (![200, 202, 404].includes(result.status())) throw new Error(`Finalizer update HTTP ${result.status()}`);
}

export function publicLab(lab) {
  return { baseURL: lab.baseURL, namespace: lab.namespace, owner: lab.owner,
    clusters: Object.values(lab.slots).map(({ context, clusterUID, namespaceUID }) => ({ context, clusterUID, namespaceUID })) };
}
