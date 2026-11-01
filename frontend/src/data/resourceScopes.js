// Scope authority belongs to a GVR and namespace, never to an entire cluster
// merely because one list/watch finished. Versions remain opaque identifiers.
export const ALL_NAMESPACES = "*";
export const MAX_RESOURCE_SCOPES = 32;

export function resourceScope(descriptor, namespace = "all") {
  return {
    group: descriptor.group || "",
    version: descriptor.version || "v1",
    resource: descriptor.resource,
    kind: descriptor.kind,
    namespace:
      descriptor.namespaced === false
        ? ""
        : namespace === "all" || namespace === "*"
          ? ALL_NAMESPACES
          : namespace || ALL_NAMESPACES,
  };
}

export const scopeKey = (scope) =>
  JSON.stringify([
    scope.group || "",
    scope.version || "v1",
    scope.resource || "",
    scope.namespace ?? ALL_NAMESPACES,
  ]);

export const scopeSubscription = (scope) =>
  `${scope.group ? scope.group + "/" : ""}${scope.version}|${scope.resource}|${scope.namespace}`;

/** Leaving a namespace forgets unleased coverage; that is not resource deletion. */
export function narrowNamespaceState(state, namespace, retainedScopes = []) {
  const wanted = namespace === "all" ? ALL_NAMESPACES : namespace;
  const resources = Object.fromEntries(
    Object.entries(state.resources).filter(
      ([, resource]) =>
        !resource.metadata?.namespace ||
        wanted === ALL_NAMESPACES ||
        resource.metadata.namespace === wanted ||
        retainedScopes.some((scope) => scopeContains(scope, resource)),
    ),
  );
  const scopes = Object.fromEntries(
    Object.entries(state.scopes || {}).filter(
      ([, scope]) =>
        scope.namespace === "" ||
        scope.namespace === wanted ||
        retainedScopes.some((retained) => scopeCoversScope(retained, scope)),
    ),
  );
  return { ...state, resources, scopes };
}

export function scopeCoversScope(outer, inner) {
  return (
    (outer.group || "") === (inner.group || "") &&
    outer.version === inner.version &&
    outer.resource === inner.resource &&
    (outer.namespace === ALL_NAMESPACES || outer.namespace === inner.namespace)
  );
}

export function scopeContains(scope, resource) {
  if (!resource || !scope.kind || !scope.resource) return false;
  const apiVersion = `${scope.group ? scope.group + "/" : ""}${scope.version}`;
  return (
    resource.apiVersion === apiVersion &&
    resource.kind === scope.kind &&
    (scope.namespace === ALL_NAMESPACES ||
      (resource.metadata?.namespace || "") === scope.namespace)
  );
}

/** Retained stale data is inspectable, but is never proof of live existence. */
export function resourceObservation(state, resource) {
  const uid = resource?.metadata?.uid;
  if (!uid)
    return { status: "not-listed", deleted: false, stale: true, error: "" };
  const live = state.resources[uid];
  const tombstone = state.tombstones?.[uid];
  if (!live && tombstone)
    return {
      status: "deleted",
      deleted: true,
      stale: false,
      error: "",
      reason: tombstone.reason,
      timestamp: tombstone.timestamp,
    };
  const scopes = Object.values(state.scopes || {}).filter((scope) =>
    scopeContains(scope, live || resource),
  );
  // An explicit denied/exact namespace scope takes precedence over a broader
  // retained scope. A successful fresh watch/list still proves current absence.
  const authoritative =
    scopes.find(
      (scope) =>
        scope.authoritative &&
        scope.status === "synced" &&
        scope.namespace !== ALL_NAMESPACES,
    ) ||
    scopes.find((scope) => scope.authoritative && scope.status === "synced");
  const preciseFailure = scopes.find(
    (scope) =>
      scope.status === "forbidden" && scope.namespace !== ALL_NAMESPACES,
  );
  const failure =
    preciseFailure ||
    scopes.find((scope) => scope.status === "forbidden") ||
    scopes.find((scope) => scope.status === "unavailable");
  if (
    failure &&
    (!authoritative ||
      (preciseFailure && authoritative.namespace === ALL_NAMESPACES))
  )
    return {
      status: failure.status,
      deleted: false,
      stale: true,
      error: failure.error || "",
      timestamp: failure.timestamp,
    };
  if ((!state.isConnected || state.upstream === false) && state.mode !== "demo")
    return { status: "stale", deleted: false, stale: true, error: "" };
  if (authoritative)
    return {
      status: live ? "live" : "deleted",
      deleted: !live,
      stale: false,
      error: "",
      timestamp: authoritative.timestamp,
    };
  // Older fixtures/demo snapshots retain their explicit full-snapshot contract.
  if (state.completeSnapshot && state.snapshotReady && !state.stale)
    return {
      status: live ? "live" : "deleted",
      deleted: !live,
      stale: false,
      error: "",
    };
  return {
    status: scopes.some((scope) => scope.status === "syncing")
      ? "syncing"
      : live
        ? "stale"
        : "not-listed",
    deleted: false,
    stale: true,
    error: "",
  };
}

/** A list response may not overwrite watch changes that arrived during it. */
export function mergeResourceList(current, before, items, scope) {
  const next = { ...current };
  const addresses = new Map(
    Object.values(current).map((old) => [
      `${old.apiVersion}/${old.kind}/${old.metadata?.namespace || ""}/${old.metadata?.name}`,
      old.metadata.uid,
    ]),
  );
  for (const [uid, old] of Object.entries(before))
    if (scopeContains(scope, old) && current[uid] === old) delete next[uid];
  for (const item of items) {
    const uid = item.metadata?.uid;
    if (!uid || !scopeContains(scope, item)) continue;
    if (before[uid] && !current[uid]) continue;
    if (current[uid] && current[uid] !== before[uid]) continue;
    const atAddress = addresses.get(
      `${item.apiVersion}/${item.kind}/${item.metadata?.namespace || ""}/${item.metadata?.name}`,
    );
    if (atAddress && atAddress !== uid) {
      // A watch replacement that arrived after this list started wins. An
      // unchanged old incarnation, however, can be replaced by the fresh list.
      if (!before[atAddress] || current[atAddress] !== before[atAddress])
        continue;
      delete next[atAddress];
    }
    next[uid] = item;
  }
  return next;
}
