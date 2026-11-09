// Metadata-only final cleanup for the exact retained QA reader identities.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { request } from "../../../../frontend/node_modules/playwright/index.mjs";
import { loadLab, guardScope } from "../../../../frontend/e2e/v11-lab.mjs";
import { sourceIdentity } from "../../../../frontend/e2e/v11-evidence.mjs";

if (process.env.KV_V11_TEST_LEASE !== "v11-20261108-qa") throw new Error("Root QA lease required");
const dir = path.dirname(fileURLToPath(import.meta.url));
const lab = await loadLab(), slot = lab.slots.A;
const refs = JSON.parse(await fs.readFile(path.join(path.dirname(lab.kubeconfig), "reader-resource-identities.json"), "utf8"));
const startedWall = Date.now(), startedMono = performance.now();
const globalConfig = path.join(os.homedir(), ".kube/config");
const globalHash = async () => createHash("sha256").update(await fs.readFile(globalConfig)).digest("hex");
const initialSource = await sourceIdentity(lab), beforeGlobal = await globalHash();
const result = { startedAt: new Date().toISOString(), status: "BLOCKED", type: "actual owned UID/RV/owner-guarded cleanup and metadata-only inventory",
  processPID: process.pid, sourceStart: initialSource.sourceSHA256, gitHeadStart: initialSource.gitHead,
  binarySHA256: initialSource.build.backendBinarySHA256, checks: [], inventory: [], credentialValuesRecorded: false };
const api = await request.newContext({ baseURL: lab.baseURL });
const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace });
let connectionID;
const descriptors = { RoleBinding: ["rbac.authorization.k8s.io", "rolebindings"], Role: ["rbac.authorization.k8s.io", "roles"], ServiceAccount: ["", "serviceaccounts"] };
const uri = (kind, name) => `/api/resources?${new URLSearchParams({ context: slot.context, namespace: slot.namespace,
  group: descriptors[kind][0], version: "v1", resource: descriptors[kind][1], name })}`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
try {
  assert(refs.clusterUID === slot.clusterUID && refs.namespaceUID === slot.namespaceUID && refs.namespace === slot.namespace, "Reader provenance scope mismatch");
  await guardScope(lab, slot); await guardScope(lab, lab.slots.B);
  // Validate all three retained identities before the first mutation.
  for (const ref of refs.resources) {
    const response = await api.get(uri(ref.kind, ref.name)); assert(response.status() === 200, "Retained reader identity lookup must be200");
    const value = await response.json();
    assert(value.kind === ref.kind && value.metadata.name === ref.name && value.metadata.namespace === slot.namespace &&
      value.metadata.uid === ref.uid && value.metadata.resourceVersion && value.metadata.labels?.[lab.ownerKey] === lab.owner, "Reader current exact identity/owner guard rejected");
    if (ref.kind === "Role") assert(JSON.stringify(value.rules) === JSON.stringify(refs.rules), "Reader Role rule guard rejected");
    if (ref.kind === "RoleBinding") assert(value.roleRef?.kind === "Role" && value.roleRef.name === "v11-reader" &&
      value.subjects?.length === 1 && value.subjects[0].kind === "ServiceAccount" && value.subjects[0].name === "v11-reader" &&
      value.subjects[0].namespace === slot.namespace, "Reader binding target guard rejected");
  }
  const diagnostic = await api.get(`/api/connection?${query}`); assert(diagnostic.status() === 200, "Cleanup diagnostic must be200");
  connectionID = (await diagnostic.json()).connectionID;
  const enabled = await api.post(`/api/management?${query}`, { headers: { "X-KubeView-Connection": connectionID },
    data: { enabled: true, context: slot.context, namespace: slot.namespace, connectionID } });
  assert(enabled.status() === 200, "Scoped cleanup grant must be200");
  for (const kind of ["RoleBinding", "Role", "ServiceAccount"]) {
    result.currentStep = `delete exact owned ${kind}`;
    const ref = refs.resources.find((value) => value.kind === kind);
    await guardScope(lab, slot);
    const response = await api.get(uri(kind, ref.name)); assert(response.status() === 200, "Fresh reader lookup must be200");
    const fresh = await response.json(), m = fresh.metadata;
    assert(fresh.kind === kind && m.name === ref.name && m.namespace === slot.namespace && m.uid === ref.uid &&
      m.labels?.[lab.ownerKey] === lab.owner && m.resourceVersion, "Fresh exact reader UID/RV/owner guard rejected");
    await guardScope(lab, slot);
    const deleted = await api.delete(uri(kind, ref.name), { headers: { "X-KubeView-Connection": connectionID },
      data: { uid: m.uid, resourceVersion: m.resourceVersion } });
    assert([200, 202, 404].includes(deleted.status()), "Guarded reader DELETE must be accepted");
    const deadline = Date.now() + 10000; let absent = false;
    while (Date.now() < deadline) {
      const remaining = await api.get(uri(kind, ref.name)); if (remaining.status() === 404) { absent = true; break; }
      assert(remaining.status() === 200, "Reader cleanup verification must be200 or404");
      assert((await remaining.json()).metadata.uid === ref.uid, "Reader was replaced; stop cleanup");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(absent, "Exact reader deletion not observed within10s");
    result.checks.push({ status: "PASS", kind, name: ref.name, uid: ref.uid, resourceVersionBeforeDelete: m.resourceVersion, result: "deleted-and-404-observed" });
  }
  result.currentStep = "metadata-only A/B QA namespace inventory";
  const kinds = [["", "v1", "pods"], ["apps", "v1", "deployments"], ["apps", "v1", "replicasets"], ["", "v1", "resourcequotas"],
    ["", "v1", "serviceaccounts"], ["rbac.authorization.k8s.io", "v1", "roles"], ["rbac.authorization.k8s.io", "v1", "rolebindings"],
    ["", "v1", "configmaps"], ["", "v1", "secrets"], ["autoscaling", "v2", "horizontalpodautoscalers"]];
  for (const owned of Object.values(lab.slots)) {
    await guardScope(lab, owned);
    for (const [group, version, resource] of kinds) {
      const response = await api.get(`/api/resources?${new URLSearchParams({ context: owned.context, namespace: owned.namespace, group, version, resource })}`);
      assert(response.status() === 200, "Final metadata inventory must be200");
      const items = (await response.json()).items || [];
      const records = items.map((value) => ({ kind: value.kind, name: value.metadata.name, uid: value.metadata.uid,
        resourceVersion: value.metadata.resourceVersion, owned: value.metadata.labels?.[lab.ownerKey] === lab.owner }));
      result.inventory.push({ context: owned.context, clusterUID: owned.clusterUID, namespaceUID: owned.namespaceUID, resource, objects: records });
    }
  }
  assert(!result.inventory.some((entry) => entry.objects.some((value) => value.owned)), "Owned QA resources remain after cleanup");
  result.status = "PASS";
} catch (error) {
  result.status = "FAIL"; result.error = { name: error.name, message: "A guarded cleanup or inventory invariant failed; inspect currentStep and completed metadata checks" };
  process.exitCode = 1;
} finally {
  if (connectionID) {
    try {
      const revoked = await api.post(`/api/management?${query}`, { headers: { "X-KubeView-Connection": connectionID },
        data: { enabled: false, context: slot.context, namespace: slot.namespace, connectionID } });
      result.cleanupGrantRevoked = revoked.status() === 200;
    } catch { result.cleanupGrantRevoked = false; }
  }
  await api.dispose(); result.apiContextDisposed = true;
  const finalSource = await sourceIdentity(lab);
  result.sourceEnd = finalSource.sourceSHA256; result.gitHeadEnd = finalSource.gitHead;
  result.sourceUnchanged = initialSource.sourceSHA256 === finalSource.sourceSHA256;
  result.buildUnchanged = JSON.stringify(initialSource.build) === JSON.stringify(finalSource.build);
  result.globalKubeconfigUnchanged = beforeGlobal === await globalHash();
  result.clock = { wallMs: Date.now() - startedWall, monotonicMs: performance.now() - startedMono };
  result.clock.skewMs = result.clock.wallMs - result.clock.monotonicMs;
  result.finishedAt = new Date().toISOString();
  if (!result.sourceUnchanged || !result.buildUnchanged || !result.globalKubeconfigUnchanged || Math.abs(result.clock.skewMs) >= 2000 || result.cleanupGrantRevoked === false) {
    result.status = "FAIL"; process.exitCode = 1;
  }
  const target = path.join(dir, `final-reader-cleanup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(target, `${JSON.stringify(result, null, 2)}\n`, { flag: "wx" });
  console.log(JSON.stringify({ status: result.status, path: target, ownedRemaining: result.inventory.flatMap((entry) => entry.objects.filter((value) => value.owned)).length,
    checks: result.checks, apiContextDisposed: result.apiContextDisposed, cleanupGrantRevoked: result.cleanupGrantRevoked, globalKubeconfigUnchanged: result.globalKubeconfigUnchanged }));
}
