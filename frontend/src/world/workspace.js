import { WORKSPACE_DIMENSIONS as W } from "../constants/dimensions.js";
// Workspace identities are configuration identities, never Kubernetes objects.
export const MAX_HARBOR_VIEWS = 64;
export const normalizeNamespaces = (values = ["*"]) => {
  const namespaces = [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].sort();
  return namespaces.includes("*") ? ["*"] : namespaces;
};
export function harborViewNamespace(harbor, preferred) {
  const namespaces = normalizeNamespaces(harbor.namespaces);
  if (preferred === "all" || preferred === "*") return "all";
  if (preferred && (namespaces.includes("*") || namespaces.includes(preferred))) return preferred;
  return namespaces.length === 1 && namespaces[0] !== "*" ? namespaces[0] : "all";
}
export function harborScopeKey(workspace, harbor, connection) {
  // A verified cluster UID alone does not prove equal credentials/permissions.
  return JSON.stringify([workspace.id, connection.id, connection.credentialGeneration || "", connection.authorizationKey || "", normalizeNamespaces(harbor.namespaces), harbor.selector || ""]);
}
export function physicalClusterKey(connection) {
  const identity = connection?.identity;
  return identity?.confidence === "verified" && identity.clusterUID
    ? `cluster:${identity.clusterUID}`
    : `connection:${connection?.id || "unbound"}`;
}
export function canonicalResourceKey(connection, resource) {
  const api = resource.apiVersion || "v1";
  const group = api.includes("/") ? api.split("/")[0] : "";
  // Use discovery's resource name when available; kind is a safe separate fallback.
  return JSON.stringify([physicalClusterKey(connection), group, resource.resource || resource.kind, resource.metadata?.namespace || "", resource.metadata?.uid]);
}
export function sharedResources(harbors, snapshots, connections) {
  const membership = new Map(), physical = new Map(), groups = [], maps = new WeakMap();
  for (const harbor of harbors) {
    const connection = connections.find((c) => c.id === harbor.connectionRef);
    const snapshot = snapshots.get(harbor.id);
    if (!connection || !snapshot || snapshot.stale === true || snapshot.snapshotReady === false) continue;
    const resources = snapshot.resources || {};
    let identities = maps.get(resources);
    if (!identities) { identities = new Map(); maps.set(resources, identities); }
    const cluster = physicalClusterKey(connection);
    let group = identities.get(cluster);
    if (!group) { group = { resources, connection, members: [] }; identities.set(cluster, group); groups.push(group); }
    group.members.push(harbor.id);
  }
  for (const group of groups) {
    const members = Object.freeze([...new Set(group.members)]);
    for (const resource of Object.values(group.resources)) {
      const key = canonicalResourceKey(group.connection, resource);
      if (!resource.metadata?.uid) continue;
      physical.set(key, resource);
      membership.set(key, membership.has(key) ? Object.freeze([...new Set([...membership.get(key), ...members])]) : members);
    }
  }
  return { physical, membership };
}
export function workspaceRelations(workspace, snapshots, connections) {
  const union = sharedResources(workspace.harbors, snapshots, connections), result = (workspace.relations || []).map((relation) => ({ ...relation, type: "configured", origin: "user-configured", declaredType: relation.type })), known = new Set();
  for (const [key, resource] of union.physical) {
    if (resource.kind !== "Node" || !JSON.parse(key)[0].startsWith("cluster:")) continue;
    const members = [...new Set(union.membership.get(key))].sort();
    for (let i = 0; i < members.length; i++) for (let j = i + 1; j < members.length; j++) {
      const pair = `${members[i]}:${members[j]}`;
      if (known.has(pair)) continue;
      known.add(pair);
      result.push({ id: `infrastructure:${pair}`, type: "infrastructure", origin: "verified-shared-node", sourceHarbor: members[i], targetHarbor: members[j] });
    }
  }
  const pods = new Map();
  for (const [key, resource] of union.physical) if (resource.kind === "Pod")
    pods.set(`${JSON.parse(key)[0]}:${resource.metadata.uid}`, { key, resource });
  for (const harbor of workspace.harbors) {
    const connection = connections.find((item) => item.id === harbor.connectionRef), snapshot = snapshots.get(harbor.id);
    if (!connection || connection.identity?.confidence !== "verified" || !snapshot || snapshot.stale === true || snapshot.snapshotReady === false) continue;
    const resources = Object.values(snapshot.resources || {});
    for (const slice of resources.filter((resource) => resource.kind === "EndpointSlice")) {
      const serviceName = slice.metadata.labels?.["kubernetes.io/service-name"];
      if (!resources.some((resource) => resource.kind === "Service" && resource.metadata.namespace === slice.metadata.namespace && resource.metadata.name === serviceName)) continue;
      for (const endpoint of slice.endpoints || []) {
        const ref = endpoint.targetRef;
        if (!ref?.uid || ref.kind && ref.kind !== "Pod") continue;
        const pod = pods.get(`${physicalClusterKey(connection)}:${ref.uid}`);
        if (!pod || pod.resource.metadata.namespace !== (ref.namespace || slice.metadata.namespace)) continue;
        for (const targetHarbor of union.membership.get(pod.key) || []) {
          if (targetHarbor === harbor.id) continue;
          const key = `observed:${harbor.id}:${targetHarbor}:${slice.metadata.uid}`;
          if (known.has(key)) continue;
          known.add(key);
          result.push({ id: key, type: "configured", origin: "observed-endpointslice", sourceHarbor: harbor.id, targetHarbor, serviceUID: resources.find((resource) => resource.kind === "Service" && resource.metadata.namespace === slice.metadata.namespace && resource.metadata.name === serviceName)?.metadata.uid, endpointSliceUID: slice.metadata.uid });
        }
      }
    }
  }
  return result.slice(0, 512);
}
export function authorizedFlowHarbors(workspace, activeId) {
  const active = workspace?.harbors.find((harbor) => harbor.id === activeId);
  return active ? workspace.harbors.filter((harbor) => harbor.connectionRef === active.connectionRef).map((harbor) => harbor.id).sort() : [];
}
export function flowHarborEndpoints(workspace, activeId, snapshots, connections, authorizedHarborIds = []) {
  const active = workspace?.harbors.find((harbor) => harbor.id === activeId), endpoints = new Map();
  const connection = connections.find((item) => item.id === active?.connectionRef);
  if (!active || connection?.identity?.confidence !== "verified") return endpoints;
  const harbors = workspace.harbors.filter((harbor) => authorizedHarborIds.includes(harbor.id) && harbor.connectionRef === active.connectionRef)
    .sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId) || a.id.localeCompare(b.id));
  const seen = new WeakSet();
  for (const harbor of harbors) {
    const snapshot = snapshots.get(harbor.id);
    if (!snapshot || snapshot.stale === true || snapshot.snapshotReady === false || !snapshot.resources || seen.has(snapshot.resources)) continue;
    seen.add(snapshot.resources);
    for (const resource of Object.values(snapshot.resources)) {
      if (resource.kind !== "Pod" || endpoints.has(resource.metadata.uid)) continue;
      endpoints.set(resource.metadata.uid, { resource, harborId: harbor.id, harborName: harbor.name, position: harborWorldPosition(harbor, workspace.harbors.indexOf(harbor)) });
    }
  }
  return endpoints;
}
export function safeHarborView(value = {}) {
  // Persist only an explicit allowlist. Never serialize a resource, Secret, log,
  // auth grant or editor contents into the workspace view record.
  const result = {};
  if (value.camera && [value.camera.position, value.camera.target].every((v) => Array.isArray(v) && v.length === 3 && v.every((number) => Number.isFinite(number) && Math.abs(number) <= 1e6))) {
    result.camera = { position: [...value.camera.position], target: [...value.camera.target] };
    if (Number.isFinite(value.camera.fov) && value.camera.fov > 0 && value.camera.fov < 180) result.camera.fov = value.camera.fov;
    if (value.camera.space === "harbor-local-v1" && typeof value.camera.harborId === "string") Object.assign(result.camera, { space: value.camera.space, harborId: value.camera.harborId.slice(0, 128) });
  }
  if (value.selection?.uid && value.selection.kind !== "Secret")
    result.selection = { uid: String(value.selection.uid), kind: String(value.selection.kind || ""), namespace: String(value.selection.namespace || ""), containerName: String(value.selection.containerName || "") };
  if (typeof value.tab === "string") result.tab = value.tab.slice(0, 80);
  if (typeof value.namespace === "string") result.namespace = value.namespace.slice(0, 253);
  if (typeof value.search === "string") result.search = value.search.slice(0, 200);
  return result;
}
const documentTabIds = new WeakMap();
let fallbackTabId;
export function browserTabId(_storage, uuid = () => globalThis.crypto.randomUUID(), documentIdentity = globalThis.document) {
  // window.open/duplicate can clone sessionStorage. Authority must be fresh for
  // this document, independently of any copied navigation/view preferences.
  if (documentIdentity && typeof documentIdentity === "object") {
    if (!documentTabIds.has(documentIdentity)) documentTabIds.set(documentIdentity, uuid());
    return documentTabIds.get(documentIdentity);
  }
  return (fallbackTabId ||= uuid());
}
export function harborPosition(harbor, index = 0) {
  return Array.isArray(harbor.position) && harbor.position.length === 2 && harbor.position.every(Number.isFinite)
    ? harbor.position : [(index % 4) * W.PORT_SPACING, Math.floor(index / 4) * W.PORT_SPACING];
}
// Convert saved layout coordinates to the shared sea. Use this for every
// rendered anchor (including flows); never use it to rewrite workspace records.
export function harborWorldPosition(harbor, index = 0) {
  const [px, pz] = harborPosition(harbor, index);
  const x = px * W.WORLD_SPACING / W.PORT_SPACING, z = pz * W.WORLD_ROW_SPACING / W.PORT_SPACING;
  const c = Math.cos(W.WORLD_ROTATION), s = Math.sin(W.WORLD_ROTATION);
  return [x * c - z * s, x * s + z * c];
}
export function nearbyHarbors(harbors = [], activeId, limit = W.NEARBY_DETAIL_LIMIT) {
  const index = harbors.findIndex((harbor) => harbor.id === activeId);
  if (index < 0) return [];
  const origin = harborWorldPosition(harbors[index], index);
  return harbors.map((harbor, i) => ({ harbor, distance: Math.hypot(...harborWorldPosition(harbor, i).map((value, axis) => value - origin[axis])) }))
    .filter(({ harbor }) => harbor.id !== activeId)
    .sort((a, b) => a.distance - b.distance || a.harbor.id.localeCompare(b.harbor.id))
    .slice(0, limit).map(({ harbor }) => harbor);
}
export function nextHarborPosition(harbors) {
  const occupied = harbors.map(harborPosition);
  for (let index = 0; index < 1024; index++) {
    const candidate = harborPosition({}, index);
    if (occupied.every((position) => Math.hypot(position[0] - candidate[0], position[1] - candidate[1]) >= W.PORT_SPACING * 0.8)) return candidate;
  }
  throw new Error("Yeni liman için boş yer bulunamadı; kayıtlı düzeni inceleyin.");
}

export class HarborViewCache {
  constructor(limit = MAX_HARBOR_VIEWS) { this.limit = limit; this.views = new Map(); }
  set(id, view) {
    this.views.delete(id);
    this.views.set(id, safeHarborView(view));
    while (this.views.size > this.limit) this.views.delete(this.views.keys().next().value);
  }
  get(id) { return this.views.get(id); }
  remove(id) { this.views.delete(id); }
}
