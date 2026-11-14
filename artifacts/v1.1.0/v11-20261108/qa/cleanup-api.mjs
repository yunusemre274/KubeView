// Fixture teardown only; never counts as a normal-user UI management action.
import fs from "node:fs/promises";
import { loadLab, getOwned, cleanupOwned, guardScope, assertOwned } from "../../../../frontend/e2e/v11-lab.mjs";

if (process.env.KV_V11_TEST_LEASE !== "v11-20261108-qa") throw new Error("QA lease required");
const lab = await loadLab();
const known = {
  A: "80c090e7-78cb-4c7f-a31b-c4b35aed5b21",
  B: "57b9498d-36f4-433b-9d9c-4904bd97644e",
};
const results = [];
for (const slot of Object.values(lab.slots)) {
  await guardScope(lab, slot);
  const query = new URLSearchParams({ context: slot.context, namespace: slot.namespace });
  const status = await fetch(`${lab.baseURL}/api/connection?${query}`, { signal: AbortSignal.timeout(20000) });
  if (status.status !== 200) throw new Error(`Cleanup connection HTTP ${status.status}`);
  const cookie = status.headers.get("set-cookie")?.split(";")[0];
  if (!cookie?.startsWith("kubeview_operator=")) throw new Error("Cleanup operator cookie missing");
  const state = await status.json();
  const enabled = await fetch(`${lab.baseURL}/api/management`, { method: "POST", signal: AbortSignal.timeout(20000),
    headers: { Cookie: cookie, Origin: lab.baseURL, "Content-Type": "application/json" },
    body: JSON.stringify({ enabled: true, context: slot.context, namespace: slot.namespace, connectionID: state.connectionID }) });
  if (enabled.status !== 200) throw new Error(`Cleanup management HTTP ${enabled.status}`);
  const request = {};
  for (const [method, verb] of [["get", "GET"], ["delete", "DELETE"]]) {
    request[method] = async (url, options = {}) => {
      let response;
      try {
        response = await fetch(new URL(url, lab.baseURL), { method: verb, signal: AbortSignal.timeout(20000),
          headers: { Cookie: cookie, Origin: lab.baseURL, "Content-Type": "application/json", ...options.headers },
          body: options.data ? JSON.stringify(options.data) : undefined });
      } catch { throw new Error("Cleanup HTTP transport failed; no request headers recorded"); }
      return { status: () => response.status, ok: () => response.ok, json: () => response.json() };
    };
  }
  let result;
  try {
    const lookup = await request.get(`/api/resources?${new URLSearchParams({ context: slot.context, namespace: slot.namespace,
      group: "", version: "v1", resource: "pods", name: lab.samePod })}`);
    if (lookup.status() === 404) result = { status: "PASS", result: "already-absent-404-observed", uid: known[slot.slot] };
    else {
      if (!lookup.ok()) throw new Error(`Cleanup initial lookup HTTP ${lookup.status()}`);
      const object = assertOwned(lab, slot, await lookup.json(), known[slot.slot]);
      result = await cleanupOwned(lab, slot, object, request, state.connectionID);
    }
  } catch (error) { result = { status: "FAIL", result: "guarded-cleanup-failed", reason: error.message, uid: known[slot.slot] }; }
  finally {
    const revoked = await fetch(`${lab.baseURL}/api/management`, { method: "POST", signal: AbortSignal.timeout(20000),
      headers: { Cookie: cookie, Origin: lab.baseURL, "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false, context: slot.context, namespace: slot.namespace, connectionID: state.connectionID }) });
    results.push({ clusterUID: slot.clusterUID, namespace: slot.namespace, ...result, cleanupSessionRevoked: revoked.status === 200 });
  }
}
const evidence = { at: new Date().toISOString(), type: "guarded own fixture cleanup after failed browser startup", results };
await fs.writeFile(new URL(`./attempt-003-cleanup-${Date.now()}.json`, import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify(evidence)}\n`);
if (results.some((result) => result.status !== "PASS" || !result.cleanupSessionRevoked)) process.exitCode = 1;
