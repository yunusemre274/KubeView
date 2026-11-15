import React from "react";
import { Box, ChevronRight, Cpu, MemoryStick, Plus } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { podContainers } from "./containerModel";
import {
  formatCPU,
  formatMemory,
  metricFor,
  metricUsage,
  quantityNumber,
  restartCount,
} from "./resourceUtils";

function observedStatus(container) {
  const observed = container.observed;
  if (!observed) return { label: "Durum bekleniyor", tone: "neutral" };
  if (observed.state?.waiting)
    return {
      label: observed.state.waiting.reason || "Waiting",
      tone: /BackOff|Error/.test(observed.state.waiting.reason || "")
        ? "danger"
        : "warning",
    };
  if (observed.state?.terminated)
    return {
      label:
        observed.state.terminated.reason ||
        `Exit ${observed.state.terminated.exitCode}`,
      tone: observed.state.terminated.exitCode === 0 ? "success" : "danger",
    };
  return observed.ready
    ? { label: "Ready", tone: "success" }
    : observed.state?.running
      ? { label: "Running · Hazır değil", tone: "warning" }
      : { label: "Bilinmiyor", tone: "neutral" };
}
export function ContainerContents({
  resource,
  selectedContainerName,
  onSelect,
  onLogs,
  onTerminal,
}) {
  const containers = podContainers(resource);
  const selected = containers.find((c) => c.name === selectedContainerName);
  return (
    <section className="detail-section container-contents">
      <div className="contents-title">
        <div>
          <h3>{selected ? "Seçili container" : "Pod içeriği"}</h3>
          <p>
            {containers.length} gerçek container · {resource.metadata?.name}
          </p>
        </div>
        <Box size={19} />
      </div>
      {(selected ? [selected] : containers).map((container) => {
        const observed = container.observed,
          current = observedStatus(container);
        return (
          <article
            className={`container-card ${container.name === selectedContainerName ? "container-selected" : ""}`}
            key={container.name}
          >
            <div>
              <button
                className="container-select-name"
                onClick={() => onSelect?.(container.name)}
                aria-label={`${container.name} container’ını seç`}
              >
                <Box size={15} />
                <strong>{container.name}</strong>
              </button>
              <StatusBadge status={current} />
            </div>
            <span className={`container-role role-${container.roleKey}`}>
              {container.role}
            </span>
            <code className="break-value container-image">
              {container.image}
            </code>
            <dl className="container-values">
              <div>
                <dt>CPU request / limit</dt>
                <dd>
                  {container.resources?.requests?.cpu || "Tanımsız"} /{" "}
                  {container.resources?.limits?.cpu || "Tanımsız"}
                </dd>
              </div>
              <div>
                <dt>Bellek request / limit</dt>
                <dd>
                  {container.resources?.requests?.memory || "Tanımsız"} /{" "}
                  {container.resources?.limits?.memory || "Tanımsız"}
                </dd>
              </div>
              <div>
                <dt>Yeniden başlama</dt>
                <dd>{observed?.restartCount ?? "—"}</dd>
              </div>
              {observed?.allocatedResources && (
                <div>
                  <dt>Kubelet ayrılan</dt>
                  <dd>
                    CPU {observed.allocatedResources.cpu || "—"} · Bellek{" "}
                    {observed.allocatedResources.memory || "—"}
                  </dd>
                </div>
              )}
              {observed?.resources && (
                <div>
                  <dt>Uygulanan request</dt>
                  <dd>
                    CPU {observed.resources.requests?.cpu || "—"} · Bellek{" "}
                    {observed.resources.requests?.memory || "—"}
                  </dd>
                </div>
              )}
              {observed?.lastState?.terminated && (
                <div>
                  <dt>Son termination</dt>
                  <dd>
                    {observed.lastState.terminated.reason || "—"} · Exit{" "}
                    {observed.lastState.terminated.exitCode}
                  </dd>
                </div>
              )}
              {container.ports?.length > 0 && (
                <div>
                  <dt>Portlar</dt>
                  <dd>
                    {container.ports
                      .map((p) => `${p.containerPort}/${p.protocol || "TCP"}`)
                      .join(", ")}
                  </dd>
                </div>
              )}
            </dl>
            <div className="container-card-actions">
              <button className="button" onClick={() => onLogs(container.name)}>
                Logları aç
              </button>
              <button
                className="button"
                onClick={() => onTerminal(container.name)}
              >
                Terminal aç
              </button>
              {!selectedContainerName && (
                <button
                  className="icon-button"
                  aria-label={`${container.name} container ayrıntıları`}
                  onClick={() => onSelect?.(container.name)}
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </article>
        );
      })}
      {!containers.length && (
        <p className="empty-copy">
          Bu Pod için container tanımı henüz gözlenmedi.
        </p>
      )}
      <p className="muted">
        Native sidecar, initContainer üzerinde restartPolicy=Always ile
        tanımlanır. Diğer roller container adı veya image üzerinden tahmin
        edilmez.
      </p>
    </section>
  );
}
function totals(pods, field, key) {
  const containers = pods
    .filter((p) => !["Succeeded", "Failed"].includes(p.status?.phase))
    .flatMap((p) => p.spec?.containers || []);
  const values = containers.map((c) =>
    quantityNumber(c.resources?.[field]?.[key]),
  );
  return {
    value: values.reduce((sum, value) => sum + (value ?? 0), 0),
    missing: values.filter((value) => value == null).length,
  };
}
export function NodeContents({
  resource,
  resources,
  metrics,
  onInspect,
  onAddPod,
  readOnly,
  deleted,
}) {
  const pods = resources
    .filter(
      (p) => p.kind === "Pod" && p.spec?.nodeName === resource.metadata?.name,
    )
    .sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
  const measured = metricFor(resource, metrics),
    cpuUsage = metricUsage(measured, "cpu"),
    memoryUsage = metricUsage(measured, "memory");
  const rows = [
    ["cpu", "CPU", formatCPU, Cpu, cpuUsage],
    ["memory", "Bellek", formatMemory, MemoryStick, memoryUsage],
  ];
  return (
    <>
      <section className="detail-section node-pods">
        <div className="contents-title">
          <div>
            <h3>Gemideki Pod’lar</h3>
            <p>Gerçek spec.nodeName ilişkisi · {pods.length} Pod</p>
          </div>
        </div>
        <button
          className="button button-primary node-add-pod"
          disabled={readOnly || deleted}
          title={
            readOnly
              ? "Salt okunur bağlantıda kaynak oluşturulamaz."
              : "Scheduler node affinity ile bu Node’u hedefle"
          }
          onClick={() => onAddPod?.(resource)}
        >
          <Plus size={16} />
          Bu gemiye Pod ekle
        </button>
        {pods.length ? (
          <div className="node-pod-list">
            {pods.map((pod) => (
              <button
                className="node-pod-row"
                key={pod.metadata.uid}
                onClick={() => onInspect(pod)}
              >
                <div>
                  <strong>{pod.metadata.name}</strong>
                  <small>
                    {pod.metadata.namespace} ·{" "}
                    {pod.spec?.containers?.length || 0} app container ·{" "}
                    {restartCount(pod)} restart
                  </small>
                  <StatusBadge resource={pod} />
                </div>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-copy">
            Bu kapsamda gemiye atanmış Pod yok. Atanmamış Pod’lar bekleme
            alanında kalır.
          </p>
        )}
      </section>
      <section className="detail-section node-capacity">
        <div className="contents-title">
          <div>
            <h3>Gemi kapasitesi</h3>
            <p>Node · {resource.metadata.name}</p>
          </div>
          <span>{pods.length} Pod</span>
        </div>
        {rows.map(([key, label, format, Icon, usage]) => {
          const requests = totals(pods, "requests", key),
            limits = totals(pods, "limits", key),
            allocatable = resource.status?.allocatable?.[key],
            numeric = quantityNumber(usage),
            capacity = quantityNumber(allocatable),
            percent =
              numeric != null && capacity > 0
                ? (numeric / capacity) * 100
                : null;
          return (
            <div className="capacity-resource" key={key}>
              <div className="capacity-resource-heading">
                <strong>
                  <Icon size={15} />
                  {label}
                </strong>
                <span>
                  {format(usage)} / {format(allocatable)} allocatable
                </span>
              </div>
              <div
                className="usage-track"
                role={percent == null ? undefined : "meter"}
                aria-label={`${label} kullanım / allocatable`}
                {...(percent != null
                  ? {
                      "aria-valuenow": Math.round(percent),
                      "aria-valuemin": 0,
                      "aria-valuemax": 100,
                    }
                  : {})}
              >
                <i
                  style={{
                    width: `${percent == null ? 0 : Math.min(100, percent)}%`,
                  }}
                />
              </div>
              {percent == null && (
                <span className="muted">Kullanım ölçümü yok</span>
              )}
              <dl className="container-values">
                <div>
                  <dt>Fiziksel kapasite</dt>
                  <dd>{format(resource.status?.capacity?.[key])}</dd>
                </div>
                <div>
                  <dt>App request toplamı</dt>
                  <dd>
                    {format(String(requests.value))}
                    {requests.missing ? ` · ${requests.missing} tanımsız` : ""}
                  </dd>
                </div>
                <div>
                  <dt>App limit toplamı</dt>
                  <dd>
                    {format(String(limits.value))}
                    {limits.missing
                      ? ` · ${limits.missing} limitsiz / tanımsız`
                      : ""}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
        <p className="muted">
          Request ve limit toplamları, bu kapsamda görülen aktif Pod’ların
          uygulama container’larına aittir. Init, native sidecar ve Pod overhead
          rezervasyonları bu toplama dahil değildir; container ayrıntılarında
          ayrıca gösterilir.
        </p>
      </section>
      <section className="detail-section">
        <h3>Taint ve scheduling</h3>
        <p className="muted">
          {resource.spec?.unschedulable
            ? "Cordon: yeni normal Pod ataması kapalı."
            : "Node scheduling açık."}
        </p>
        {resource.spec?.taints?.length ? (
          <div className="label-list">
            {resource.spec.taints.map((taint, index) => (
              <code key={index}>
                {taint.key}
                {taint.value ? `=${taint.value}` : ""}:{taint.effect}
              </code>
            ))}
          </div>
        ) : (
          <p className="muted">Gözlenen taint yok.</p>
        )}
      </section>
    </>
  );
}
