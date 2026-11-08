import { secretSafeSubmission } from "../workbench/secretPayload.js";
export function acceptedOperation(result, meta, sourceKey, now = Date.now()) {
  ({ result, meta } = secretSafeSubmission(result, meta));
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
  let observation;
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
      const currentTarget = (current.spec?.replicas ?? 1) === desired;
      const ready = (current.status?.readyReplicas || 0) === desired;
      const updated =
        (current.kind === "ReplicaSet" ||
          (current.status?.updatedReplicas || 0) === desired) &&
        (!templateChanged ||
          !expected?.spec?.template ||
          JSON.stringify(current.spec?.template?.spec?.containers) ===
            JSON.stringify(expected.spec.template.spec?.containers));
      status =
        generationObserved &&
        currentTarget &&
        ready &&
        updated &&
        (current.kind !== "Deployment" ||
          ((current.status?.replicas || 0) === desired &&
            (current.status?.availableReplicas || 0) >= desired))
          ? "succeeded"
          : "reconciling";
    } else if (current.kind === "Pod") {
      if (op.action === "resize")
        status =
          current.status?.resize &&
          ["Deferred", "Infeasible"].includes(current.status.resize)
            ? "failed"
            : expected.spec?.containers?.length > 0 &&
                expected.spec.containers.every((container) => {
                  const applied = current.status?.containerStatuses?.find(
                    (c) => c.name === container.name,
                  )?.resources;
                  return (
                    applied &&
                    JSON.stringify(applied) ===
                      JSON.stringify(container.resources || {})
                  );
                })
              ? "observed"
              : "reconciling";
      else
        status =
          !current.metadata?.deletionTimestamp &&
          (current.status?.phase === "Succeeded" ||
            current.status?.conditions?.some(
              (c) => c.type === "Ready" && c.status === "True",
            ))
            ? "succeeded"
            : "reconciling";
    } else if (current.kind === "DaemonSet")
      status =
        generationObserved &&
        Number.isInteger(current.status?.desiredNumberScheduled) &&
        (current.status?.numberReady || 0) ===
          current.status?.desiredNumberScheduled &&
        (current.status?.updatedNumberScheduled || 0) ===
          current.status?.desiredNumberScheduled
          ? "succeeded"
          : "reconciling";
    else if (["cordon", "uncordon"].includes(op.action))
      status =
        Boolean(current.spec?.unschedulable) === (op.action === "cordon")
          ? "succeeded"
          : "reconciling";
    else status = "observed";
    const failed = current.status?.conditions?.find(
      (condition) =>
        (condition.type === "Progressing" &&
          condition.status === "False" &&
          condition.reason === "ProgressDeadlineExceeded") ||
        (condition.type === "ReplicaFailure" && condition.status === "True"),
    );
    if (current.status?.phase === "Failed" || (generationObserved && failed)) {
      status = "failed";
      observation =
        failed?.message ||
        failed?.reason ||
        current.status?.message ||
        current.status?.reason ||
        "Kubernetes kaynağı başarısız durum bildirdi.";
    } else if (current.metadata?.deletionTimestamp) {
      status = "reconciling";
      observation =
        "Kaynak sonlandırılıyor; canlı Ready sonucu olarak sayılmadı.";
    } else if (
      ["resources", "edit", "restart"].includes(op.action) &&
      ["StatefulSet", "DaemonSet"].includes(current.kind) &&
      current.metadata?.generation >= expected?.metadata?.generation &&
      JSON.stringify(current.spec?.template) ===
        JSON.stringify(expected?.spec?.template) &&
      (current.spec?.updateStrategy?.type === "OnDelete" ||
        current.spec?.updateStrategy?.rollingUpdate?.partition > 0)
    ) {
      status = "observed";
      observation =
        "Template güncellemesi gözlendi. OnDelete/partition stratejisi bütün Pod’ları otomatik yenilemez; Pod sonuçlarını ayrıca inceleyin.";
    }
  }
  if (["accepted", "reconciling"].includes(status) && now - op.at > 120000)
    status = "timed-out";
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
