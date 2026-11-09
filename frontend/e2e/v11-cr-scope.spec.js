import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test, expect } from "./v11-fixtures.js";
import { guardScope } from "./v11-lab.mjs";
import { chooseScope, enableManagement, findFacility } from "./v11-ui.helpers.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("V11-06 normal on-demand CR panel preserves same UID and reconciles offline same-name replacement only after real snapshot", async ({ page, lab, evidence }, info) => {
  test.skip(info.project.name !== "chromium", "One guarded owned CRD fixture; read-only UI selection and explicit real transport faults");
  test.setTimeout(240000);
  const slot = lab.slots.A, suffix = Date.now().toString(36), group = `v11-qa-${suffix}.audit.kubeview.io`;
  const plural = "v11cargos", kind = "V11Cargo", crdName = `${plural}.${group}`, name = `v11-cargo-${suffix}`;
  const snapshots = [], events = [], socketCloses = new Set();
  let crd, current, serial = 0;
  const command = (args, input) => new Promise((resolve, reject) => {
    const child = execFile("kubectl", ["--kubeconfig", lab.kubeconfig, "--context", slot.context, "--request-timeout=10s", ...args],
      { timeout: 20000, maxBuffer: 2 << 20 }, (error, stdout) => {
        if (error) reject(new Error(`Owned CR fixture Kubernetes request failed (${error.code || "transport"})`));
        else { try { resolve(JSON.parse(stdout)); } catch { reject(new Error("Owned CR fixture response was not JSON")); } }
      });
    if (input) child.stdin.end(JSON.stringify(input));
  });
  const assertFixture = (value, expectedKind, expectedUID) => {
    const m = value?.metadata, isCRD = expectedKind === "CustomResourceDefinition";
    if (value?.kind !== expectedKind || m?.name !== (isCRD ? crdName : name) ||
        (isCRD ? Boolean(m?.namespace) : m?.namespace !== slot.namespace) ||
        m?.labels?.[lab.ownerKey] !== lab.owner || !m?.uid || !m?.resourceVersion || (expectedUID && m.uid !== expectedUID))
      throw new Error("Exact CR kind/name/namespace/owner/UID/resourceVersion guard rejected");
    return value;
  };
  const remember = async (value) => fs.appendFile(path.join(root, "artifacts/v1.1.0/v11-20261108/qa/fixture-registry.jsonl"),
    `${JSON.stringify({ at: new Date().toISOString(), context: slot.context, clusterUID: slot.clusterUID,
      namespace: value.metadata.namespace || "", namespaceUID: value.metadata.namespace ? slot.namespaceUID : null,
      owner: lab.owner, kind: value.kind, name: value.metadata.name, uid: value.metadata.uid,
      resourceVersion: value.metadata.resourceVersion })}\n`);
  const uri = (isCRD = false) => `${lab.baseURL}/api/resources?${new URLSearchParams({ context: slot.context,
    namespace: isCRD ? "" : slot.namespace, group: isCRD ? "apiextensions.k8s.io" : group,
    version: "v1", resource: isCRD ? "customresourcedefinitions" : plural, name: isCRD ? crdName : name })}`;
  const createCargo = async () => {
    await guardScope(lab, slot);
    assertFixture(await command(["get", "crd", crdName, "-o", "json"]), "CustomResourceDefinition", crd.metadata.uid);
    const object = assertFixture(await command(["create", "-f", "-", "-o", "json"], {
      apiVersion: `${group}/v1`, kind, metadata: { name, namespace: slot.namespace, labels: { [lab.ownerKey]: lab.owner } },
      spec: { purpose: "actual owned CR normal-UI reconnect identity proof" },
    }), kind);
    await remember(object); return object;
  };
  const nonce = async () => {
    const response = await page.request.get(`${lab.baseURL}/api/connection?${new URLSearchParams({ context: slot.context, namespace: slot.namespace })}`);
    expect(response.status()).toBe(200); return (await response.json()).connectionID;
  };
  const deleteExact = async (object, isCRD = false) => {
    await guardScope(lab, slot);
    const response = await page.request.get(uri(isCRD));
    if (response.status() === 404) return;
    expect(response.status()).toBe(200);
    const fresh = assertFixture(await response.json(), isCRD ? "CustomResourceDefinition" : kind, object.metadata.uid);
    await guardScope(lab, slot);
    const deleted = await page.request.delete(uri(isCRD), { headers: { "X-KubeView-Connection": await nonce() },
      data: { uid: fresh.metadata.uid, resourceVersion: fresh.metadata.resourceVersion } });
    expect([200, 202, 404]).toContain(deleted.status());
    await expect.poll(async () => (await page.request.get(uri(isCRD))).status(), { timeout: 45000 }).toBe(404);
    evidence.check(`Exact owned ${isCRD ? "CRD" : "CR"} deletion observed404`, { uid: object.metadata.uid });
  };
  await page.addInitScript(() => {
    const Native = window.WebSocket; window.__v11ActualCRSockets = [];
    window.WebSocket = class extends Native {
      constructor(...args) { super(...args); if (new URL(args[0], location.href).pathname === "/ws") window.__v11ActualCRSockets.push(this); }
    };
  });
  page.on("websocket", (socket) => {
    const url = new URL(socket.url()); if (url.pathname !== "/ws") return;
    const id = ++serial;
    socket.on("close", () => socketCloses.add(id));
    socket.on("framereceived", ({ payload }) => {
      try {
        const message = JSON.parse(String(payload)), body = message.payload || message;
        if (message.type === "SNAPSHOT") {
          const values = Array.isArray(body.resources) ? body.resources : Object.values(body.resources || {});
          snapshots.push({ serial: id, context: url.searchParams.get("context"), namespace: url.searchParams.get("namespace"),
            scopes: (body.scopes || []).filter((scope) => scope.group === group),
            objects: values.filter((value) => value.apiVersion === `${group}/v1`).map((value) => ({
              uid: value.metadata.uid, resourceVersion: value.metadata.resourceVersion, namespace: value.metadata.namespace })) });
        } else if (message.type === "RESOURCE_EVENT" && body.object?.apiVersion === `${group}/v1`)
          events.push({ serial: id, action: body.action, uid: body.object.metadata.uid, resourceVersion: body.object.metadata.resourceVersion });
      } catch { /* Exact real messages still flow normally; no payload or application state is modified. */ }
    });
  });
  const panel = page.locator(".resource-details");
  const openCargo = async (uid) => {
    await findFacility(page);
    await page.getByRole("button", { name: "Kaynak kataloğu", exact: true }).click();
    await page.getByLabel("API kaynağı", { exact: true }).selectOption(`${group}/v1|${plural}`);
    const row = page.locator(".resource-table tbody tr").filter({ has: page.getByRole("button", { name, exact: true }) });
    await expect(row).toHaveCount(1); await row.getByRole("button", { name, exact: true }).click();
    await expect(panel).toContainText(uid); await expect(panel).not.toContainText("Bu kaynak silindi");
  };
  const closeTransport = async () => {
    const before = serial;
    expect(await page.evaluate(() => {
      const socket = window.__v11ActualCRSockets.findLast((value) => value.readyState === WebSocket.OPEN);
      if (!socket) return false; socket.close(1000, "explicit owned CR transport fault"); return true;
    })).toBe(true);
    await expect.poll(() => socketCloses.has(before)).toBe(true);
    await expect(page.locator(".world-brand-control")).toHaveClass(/is-stale/);
    await expect(panel).toContainText("Son bilinen veri · güncel değil");
    return before;
  };
  const authoritativeAfter = async (before, uid) => {
    let found;
    await expect.poll(() => {
      found = snapshots.findLast((snapshot) => snapshot.serial > before && snapshot.context === slot.context &&
        snapshot.namespace === slot.namespace && snapshot.scopes.some((scope) => scope.namespace === slot.namespace &&
          scope.status === "synced" && scope.authoritative === true) && snapshot.objects.some((value) => value.uid === uid));
      return Boolean(found);
    }, { timeout: 30000, message: "Actual scoped authoritative CR snapshot containing the exact current UID" }).toBe(true);
    await expect(page.locator(".world-brand-control")).not.toHaveClass(/is-stale/); return found;
  };
  try {
    await guardScope(lab, slot);
    crd = assertFixture(await command(["create", "-f", "-", "-o", "json"], {
      apiVersion: "apiextensions.k8s.io/v1", kind: "CustomResourceDefinition", metadata: { name: crdName, labels: { [lab.ownerKey]: lab.owner } },
      spec: { group, scope: "Namespaced", names: { plural, singular: "v11cargo", kind }, versions: [{ name: "v1", served: true, storage: true,
        schema: { openAPIV3Schema: { type: "object", properties: { spec: { type: "object", "x-kubernetes-preserve-unknown-fields": true } } } } }] },
    }), "CustomResourceDefinition");
    await remember(crd);
    await expect.poll(async () => (await command(["get", "crd", crdName, "-o", "json"])).status?.conditions?.some((value) =>
      value.type === "Established" && value.status === "True"), { timeout: 30000 }).toBe(true);
    current = await createCargo();
    await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
    await openCargo(current.metadata.uid); await evidence.capture("normal-catalog-selected-real-cr");
    const firstUID = current.metadata.uid, firstFault = await closeTransport();
    await evidence.capture("actual-cr-same-uid-stale");
    const sameSnapshot = await authoritativeAfter(firstFault, firstUID);
    const realSameResponse = await page.request.get(uri()); expect(realSameResponse.status()).toBe(200);
    const realSame = assertFixture(await realSameResponse.json(), kind, firstUID);
    await expect(panel).toContainText(firstUID); await expect(panel).not.toContainText("Bu kaynak silindi");
    evidence.check("Selected on-demand CR remains live at the exact same UID after actual transport reconnect", {
      uid: firstUID, resourceVersion: realSame.metadata.resourceVersion, scope: sameSnapshot.scopes });
    await evidence.capture("same-uid-live-after-real-scoped-snapshot");

    const secondFault = await closeTransport();
    await deleteExact(current); current = await createCargo(); expect(current.metadata.uid).not.toBe(firstUID);
    // This observation must precede a fresh snapshot. If the transport recovers
    // too early, fail the test precondition rather than call absence a DELETE.
    expect(snapshots.some((value) => value.serial > secondFault)).toBe(false);
    await expect(panel).not.toContainText("Bu kaynak silindi"); await expect(panel).toContainText(firstUID);
    await expect(page.locator(".world-brand-control")).toHaveClass(/is-stale/);
    evidence.check("Offline same-address replacement leaves the unobserved old selected UID stale", { oldUID: firstUID, newUID: current.metadata.uid });
    await evidence.capture("offline-replacement-retains-old-stale-selection");
    const replacementSnapshot = await authoritativeAfter(secondFault, current.metadata.uid);
    expect(replacementSnapshot.objects.some((value) => value.uid === firstUID)).toBe(false);
    await expect(panel).toContainText("Bu kaynak silindi"); await expect(panel).not.toContainText(current.metadata.uid);
    await evidence.capture("fresh-snapshot-confirms-only-old-uid-deleted");
    await openCargo(current.metadata.uid);
    evidence.check("Fresh authoritative snapshot separates deleted old UID and new UID; explicit catalog reselection opens the new resource", {
      oldUID: firstUID, newUID: current.metadata.uid, scope: replacementSnapshot.scopes });
    evidence.result.crTransport = { snapshots, events };
    await evidence.capture("new-uid-explicitly-selected");
  } catch (error) {
    evidence.result.crTransport = { snapshots, events };
    try { await evidence.capture("cr-primary-failure-before-cleanup"); } catch { /* Setup can fail before a document exists. */ }
    throw error;
  } finally {
    if (crd) {
      await page.goto(lab.baseURL); await chooseScope(page, slot.context, slot.namespace); await enableManagement(page);
      if (current) await deleteExact(current);
      await guardScope(lab, slot);
      const remaining = await command(["get", crdName, "--all-namespaces", "-o", "json"]);
      expect(remaining.items).toHaveLength(0);
      assertFixture(await command(["get", "crd", crdName, "-o", "json"]), "CustomResourceDefinition", crd.metadata.uid);
      await deleteExact(crd, true);
    }
  }
});
