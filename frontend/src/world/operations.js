import { secretSafeSubmission } from "../workbench/secretPayload.js";
export function acceptedOperation(result, meta, sourceKey, now = Date.now()) {
  ({result,meta}=secretSafeSubmission(result,meta));
  const returned = result.object;
  const object =
    returned?.kind === "Scale"
      ? {
          ...meta.resource,
          metadata: { ...meta.resource.metadata, ...returned.metadata },
          spec: { ...meta.resource.spec, replicas: returned.spec.replicas },
        }
      : returned;
  return {
    ...result,
    ...meta,
    id: result.operation?.id || crypto.randomUUID(),
    sourceKey,
    at: now,
    resource: object?.metadata?.uid ? object : meta.resource || meta.object,
    status: result.operation?.status === "partial" ? "partial" : "accepted",
  };
}
export function observeOperation(op, resources, now = Date.now()) {
  const list =
    resources instanceof Map
      ? resources
      : new Map(resources.map((r) => [r.metadata.uid, r]));
  const current = list.get(op.resource?.metadata?.uid);
  if (op.results)
    return {
      ...op,
      status: op.results.some((row) => !row.accepted)
        ? "partial"
        : op.results.every((row) => !list.has(row.resource.metadata.uid))
          ? "succeeded"
          : "reconciling",
    };
  let status = "accepted";
  if (op.action === "delete") status = current ? "reconciling" : "succeeded";
  else if (current) {
    const expected = op.resource;
    const generationObserved =
      !expected?.metadata?.generation ||
      current.status?.observedGeneration >= expected.metadata.generation;
    if (["Deployment", "StatefulSet", "ReplicaSet"].includes(current.kind)) {
      const desired =
        op.targetReplicas ??
        expected.spec?.replicas ??
        current.spec?.replicas ??
        1;
      const templateChanged = [
        "restart",
        "resources",
        "edit",
        "rollback",
      ].includes(op.action);
      const currentTarget = current.spec?.replicas === desired;
      const ready = (current.status?.readyReplicas || 0) === desired;
      const updated =
        !templateChanged ||
        (current.status?.updatedReplicas === desired &&
          (!expected?.spec?.template ||
            JSON.stringify(current.spec?.template?.spec?.containers) ===
              JSON.stringify(expected.spec.template.spec?.containers)));
      status =
        generationObserved && currentTarget && ready && updated
          ? "succeeded"
          : "reconciling";
    } else if (current.kind === "Pod") {
      if (op.action === "resize")
        status =
          current.status?.resize &&
          ["Deferred", "Infeasible"].includes(current.status.resize)
            ? "failed"
            : (current.status?.containerStatuses || []).every(
                  (c) =>
                    !c.resources ||
                    JSON.stringify(c.resources) ===
                      JSON.stringify(
                        expected.spec?.containers?.find(
                          (s) => s.name === c.name,
                        )?.resources,
                      ),
                )
              ? "observed"
              : "reconciling";
      else
        status =
          current.status?.phase === "Succeeded" ||
          current.status?.conditions?.some(
            (c) => c.type === "Ready" && c.status === "True",
          )
            ? "succeeded"
            : "reconciling";
    } else if (current.kind === "DaemonSet")
      status =
        generationObserved &&
        current.status?.numberReady ===
          current.status?.desiredNumberScheduled &&
        current.status?.updatedNumberScheduled ===
          current.status?.desiredNumberScheduled
          ? "succeeded"
          : "reconciling";
    else if (["cordon", "uncordon"].includes(op.action))
      status =
        Boolean(current.spec?.unschedulable) === (op.action === "cordon")
          ? "succeeded"
          : "reconciling";
    else status = "observed";
  }
  if (["accepted", "reconciling"].includes(status) && now - op.at > 120000)
    status = "timed-out";
  let observation;
  if (op.targetNode && current) {
    const target = op.targetNode;
    const pods =
      current.kind === "Pod"
        ? [current]
        : [...list.values()].filter((r) => {
            if (r.kind !== "Pod") return false;
            let item = r;
            for (let depth = 0; depth < 5; depth++) {
              const owner =
                item.metadata?.ownerReferences?.find((o) => o.controller) ||
                item.metadata?.ownerReferences?.[0];
              if (!owner) return false;
              if (owner.uid === current.metadata.uid) return true;
              item = list.get(owner.uid);
              if (!item) return false;
            }
            return false;
          });
    const assigned = pods.filter((p) => p.spec?.nodeName);
    const node = [...list.values()].find(
      (n) => n.kind === "Node" && n.metadata.name === target.name,
    );
    if (
      assigned.some((p) => p.spec.nodeName === target.name) &&
      node &&
      node.metadata.uid !== target.uid
    ) {
      status = "failed";
      observation =
        "Hedef Node aynı adla yeniden oluşturuldu; gözlenen Node UID seçilen kimlikten farklı. Gerçek Pod yerleşimi korunuyor.";
    } else if (
      target.mode === "required" &&
      assigned.some((p) => p.spec.nodeName !== target.name)
    ) {
      status = "failed";
      observation =
        "Gözlenen yerleşim zorunlu hedef Node ile uyuşmuyor. Gerçek kaynağı inceleyin.";
    } else if (
      target.mode === "preferred" &&
      assigned.some((p) => p.spec.nodeName !== target.name)
    )
      observation =
        "Scheduler korunmuş zorunlu koşullar/kaynaklar nedeniyle başka Node seçti; tercih zorunluluk değildir.";
  }
  return { ...op, status, current, observation };
}
export const OPERATION_LABELS = {
  accepted: "API kabul etti · gözlem bekleniyor",
  reconciling: "Uygulanıyor · controller sonucu bekleniyor",
  succeeded: "Gözlenen sonuç doğrulandı",
  observed: "Güncel kaynak gözlendi",
  partial: "Kısmi sonuç · kaynak bazında inceleyin",
  failed: "Uygulanamadı",
  "timed-out": "Zaman aşımı · kaynak durumunu inceleyin",
};
