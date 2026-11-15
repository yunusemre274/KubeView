const EMPTY = Object.freeze([]);
const same = (a, b) =>
  a?.length === b.length && b.every((item, i) => item === a[i]);
function group(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}
function retainBuckets(next, previous) {
  for (const [key, rows] of next)
    if (same(previous?.get(key), rows)) next.set(key, previous.get(key));
  return next;
}

// Canonical objects are never cloned or mutated. Reuse only unchanged buckets;
// a status/owner/node update, DELETE or new UID changes the relevant reference.
export function buildResourceIndex(resources, previous, sourceKey) {
  if (previous?.sourceKey !== sourceKey) previous = undefined;
  const byUID = new Map(),
    kinds = new Map(),
    podsByNode = new Map(),
    ownedByUID = new Map(),
    eventsByUID = new Map();
  const other = [];
  for (const resource of resources) {
    byUID.set(resource.metadata.uid, resource);
    group(kinds, resource.kind, resource);
    if (resource.kind === "Pod")
      group(podsByNode, resource.spec?.nodeName || "", resource);
    else if (resource.kind !== "Node" && resource.kind !== "Event")
      other.push(resource);
    for (const owner of resource.metadata?.ownerReferences || [])
      group(ownedByUID, owner.uid, resource);
    if (resource.kind === "Event")
      group(
        eventsByUID,
        resource.involvedObject?.uid || resource.regarding?.uid || "",
        resource,
      );
  }
  retainBuckets(kinds, previous?.kinds);
  retainBuckets(podsByNode, previous?.podsByNode);
  retainBuckets(ownedByUID, previous?.ownedByUID);
  retainBuckets(eventsByUID, previous?.eventsByUID);
  const nodes = kinds.get("Node") || EMPTY,
    pods = kinds.get("Pod") || EMPTY;
  const nodesByName =
    nodes === previous?.nodes
      ? previous.nodesByName
      : new Map(nodes.map((node) => [node.metadata.name, node]));
  const ships = nodes.map((node) => {
    const cargo = podsByNode.get(node.metadata.name) || EMPTY;
    const old = previous?.shipsByUID.get(node.metadata.uid);
    return old?.resource === node && old.ship.pods === cargo
      ? old.ship
      : {
          ...node,
          id: node.metadata.uid,
          name: node.metadata.name,
          pods: cargo,
        };
  });
  return {
    sourceKey,
    resources,
    byUID,
    kinds,
    podsByNode,
    ownedByUID,
    eventsByUID,
    nodes,
    pods,
    nodesByName,
    other: same(previous?.other, other) ? previous.other : other,
    ships: same(previous?.ships, ships) ? previous.ships : ships,
    shipsByUID: new Map(
      ships.map((ship) => [ship.id, { resource: byUID.get(ship.id), ship }]),
    ),
  };
}

export function detailResourceScope(index, resource, previous) {
  if (!resource || !["Node", "Pod"].includes(resource.kind))
    return { inputs: [index.resources], resources: index.resources };
  const uid = resource.metadata.uid;
  const node =
    resource.kind === "Node"
      ? index.byUID.get(uid)
      : index.nodesByName.get(resource.spec?.nodeName);
  const pods =
    resource.kind === "Node"
      ? index.podsByNode.get(resource.metadata.name) || EMPTY
      : EMPTY;
  const inputs = [
    index.sourceKey,
    index.byUID.get(uid),
    node,
    pods,
    index.other,
    index.ownedByUID.get(uid) || EMPTY,
    index.eventsByUID.get(uid) || EMPTY,
  ];
  if (previous && same(previous.inputs, inputs)) return previous;
  const unique = new Map();
  for (const row of [
    ...index.other,
    ...(node ? [node] : []),
    ...(index.byUID.has(uid) ? [index.byUID.get(uid)] : []),
    ...pods,
    ...inputs[5],
    ...inputs[6],
  ])
    unique.set(row.metadata.uid, row);
  return { inputs, resources: [...unique.values()] };
}
