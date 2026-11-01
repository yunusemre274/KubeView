import { resourcePosition, uidOf } from "./layout.js";

/** Stable slots with DELETE reclamation; cache size follows canonical resources. */
export class ResourceModuleSlots {
  constructor() {
    this.map = new Map();
    this.free = [];
    this.next = 0;
  }
  reconcile(resources) {
    const live = new Set(resources.map(uidOf));
    for (const [uid, slot] of this.map)
      if (!live.has(uid)) {
        this.map.delete(uid);
        this.free.push(slot);
      }
    this.free.sort((a, b) => a - b);
    for (const resource of resources)
      if (!this.map.has(uidOf(resource)))
        this.map.set(
          uidOf(resource),
          this.free.length ? this.free.shift() : this.next++,
        );
    return resources
      .slice()
      .sort((a, b) => this.map.get(uidOf(a)) - this.map.get(uidOf(b)));
  }
}

export function serviceSelectsPod(service, pod) {
  const selector = Object.entries(service.spec?.selector || {});
  return (
    !!selector.length &&
    pod.kind === "Pod" &&
    pod.metadata.namespace === service.metadata.namespace &&
    selector.every(([key, value]) => pod.metadata.labels?.[key] === value)
  );
}

/** Explicit current-window topology aggregation. It is never flow telemetry. */
export function topologyRelations(
  resources,
  services,
  nodesByName,
  slots,
  selectedUID,
  namespace = null,
) {
  const selected = resources.find((r) => uidOf(r) === selectedUID);
  const scopedServices = services.filter(
    (s) => !namespace || s.metadata.namespace === namespace,
  );
  const visible = scopedServices.slice(0, 6);
  const prioritized =
    selected?.kind === "Service"
      ? selected
      : selected?.kind === "Pod"
        ? scopedServices.find((s) => serviceSelectsPod(s, selected))
        : null;
  if (
    prioritized &&
    (!namespace || prioritized.metadata.namespace === namespace) &&
    !visible.includes(prioritized)
  )
    visible.push(prioritized);
  const anchors = new Map(
    visible.map((s, i) => [uidOf(s), [-48 + i * 4, 4, -51]]),
  );
  const links = [];
  let matched = 0,
    outsideWindow = 0,
    aggregated = false;
  const pods = resources.filter(
    (r) =>
      r.kind === "Pod" && (!namespace || r.metadata.namespace === namespace),
  );
  for (const service of selected?.kind === "Service" &&
  visible.includes(selected)
    ? [selected]
    : visible) {
    const matches = pods.filter((p) => serviceSelectsPod(service, p));
    matched += matches.length;
    const visiblePods = matches.filter((p) =>
      resourcePosition(p, nodesByName, slots),
    );
    outsideWindow += matches.length - visiblePods.length;
    const source = anchors.get(uidOf(service));
    if (visiblePods.length <= 36) {
      for (const pod of visiblePods)
        links.push({
          source,
          resource: pod,
          serviceUID: uidOf(service),
          count: 1,
        });
    } else {
      aggregated = true;
      const groups = new Map();
      for (const pod of visiblePods) {
        if (uidOf(pod) === selectedUID) {
          links.push({
            source,
            resource: pod,
            serviceUID: uidOf(service),
            count: 1,
          });
          continue;
        }
        const node = nodesByName.get(pod.spec?.nodeName);
        const key = node
          ? uidOf(node)
          : pod.spec?.nodeName
            ? `orphan:${pod.spec.nodeName}`
            : "pending";
        const group = groups.get(key);
        if (group) group.count++;
        else
          groups.set(key, {
            source,
            resource: node || pod,
            serviceUID: uidOf(service),
            count: 1,
            aggregate: true,
          });
      }
      links.push(...groups.values());
    }
  }
  return {
    services: visible,
    anchors,
    links,
    totalServices: scopedServices.length,
    matchedPods: matched,
    outsideWindow,
    aggregated,
  };
}

/** Never identify an old flow by a reused name/IP. Unresolved identity is omitted. */
export function flowEndpointResource(endpoint, resourcesByUID) {
  if (!endpoint?.uid) return null;
  const resource = resourcesByUID.get(endpoint.uid);
  if (
    !resource ||
    resource.kind !== "Pod" ||
    resource.metadata.namespace !== endpoint.namespace
  )
    return null;
  return resource;
}

/** Selected authorized Pod flows precede the explicit draw cap, stably. */
export function prioritizeMeasuredFlows(flows, selectedUID) {
  if (!selectedUID) return flows;
  const selected = [],
    rest = [];
  for (const flow of flows)
    (flow.source?.uid === selectedUID || flow.destination?.uid === selectedUID
      ? selected
      : rest
    ).push(flow);
  return selected.length ? [...selected, ...rest] : flows;
}
