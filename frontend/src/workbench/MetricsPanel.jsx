import React, { useMemo, useState } from "react";
import "./workbench.css";
import { Activity, Info } from "lucide-react";
import {
  formatCPU,
  formatMemory,
  metricFor,
  metricUsage,
  quantityNumber,
  resourceStatus,
} from "./resourceUtils";

function sampleValue(sample, resource, key) {
  if (sample.available === false) return null;
  if (resource)
    return quantityNumber(metricUsage(metricFor(resource, sample), key));
  const nodes = Array.isArray(sample.nodes)
    ? sample.nodes
    : sample.nodes?.items || [];
  if (!nodes.length) return null;
  const values = nodes.map((n) =>
    quantityNumber(n.usage?.[key] ?? n[`${key}_usage`]),
  );
  return values.some((v) => v == null)
    ? null
    : values.reduce((sum, n) => sum + n, 0);
}
function LineChart({ samples, resource, metric, label, color }) {
  const width = 620,
    height = 172,
    padding = { left: 58, right: 16, top: 16, bottom: 32 };
  const points = samples
    .map((s) => ({
      time: Date.parse(s.timestamp),
      value: sampleValue(s, resource, metric),
    }))
    .filter((p) => Number.isFinite(p.time));
  const available = points.filter((p) => p.value != null);
  const format =
    metric === "cpu"
      ? (value) => formatCPU(String(value))
      : (value) => formatMemory(String(value));
  if (!available.length)
    return (
      <div className="metric-chart">
        <div className="metric-chart-heading">
          <strong>{label}</strong>
          <span>{metric === "cpu" ? "millicore / CPU" : "Mi / Gi"}</span>
        </div>
        <div className="chart-empty">
          <Activity size={20} />
          <span>Bu aralıkta ölçüm yok</span>
        </div>
      </div>
    );
  const minimum = points[0].time,
    maximum = Math.max(minimum + 1000, points[points.length - 1].time),
    maxValue =
      Math.max(
        ...available.map((p) => p.value),
        metric === "cpu" ? 0.001 : 1048576,
      ) * 1.15;
  const x = (value) =>
      padding.left +
      ((value - minimum) / (maximum - minimum)) *
        (width - padding.left - padding.right),
    y = (value) =>
      height -
      padding.bottom -
      (value / maxValue) * (height - padding.top - padding.bottom);
  let path = "",
    gap = true;
  for (const p of points) {
    if (p.value == null) {
      gap = true;
      continue;
    }
    path += `${gap ? "M" : "L"}${x(p.time)},${y(p.value)} `;
    gap = false;
  }
  return (
    <div className="metric-chart">
      <div className="metric-chart-heading">
        <strong>{label}</strong>
        <span>{format(available.at(-1).value)}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label} zaman serisi; ${available.length} gerçek ölçüm`}
      >
        <title>
          {label} — {metric === "cpu" ? "CPU core" : "byte"} cinsinden gerçek
          kullanım
        </title>
        {[0, 0.5, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(maxValue * ratio)}
              y2={y(maxValue * ratio)}
              stroke="var(--border, #DDE3EA)"
              strokeDasharray="3 4"
            />
            <text
              x={padding.left - 8}
              y={y(maxValue * ratio) + 4}
              textAnchor="end"
              fill="var(--text-muted, #526074)"
              fontSize="11"
            >
              {format(maxValue * ratio)}
            </text>
          </g>
        ))}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {available.map((p, i) => (
          <circle
            key={`${p.time}-${i}`}
            cx={x(p.time)}
            cy={y(p.value)}
            r={available.length < 3 ? 4 : 2.5}
            fill={color}
          >
            <title>
              {new Date(p.time).toLocaleString("tr-TR")} · {format(p.value)} ·
              ham değer: {p.value} {metric === "cpu" ? "CPU" : "byte"}
            </title>
          </circle>
        ))}
        {[0, 0.5, 1].map((ratio) => (
          <text
            key={ratio}
            x={x(minimum + (maximum - minimum) * ratio)}
            y={height - 9}
            textAnchor={ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"}
            fill="var(--text-muted, #526074)"
            fontSize="11"
          >
            {new Date(minimum + (maximum - minimum) * ratio).toLocaleTimeString(
              "tr-TR",
              { hour: "2-digit", minute: "2-digit", second: "2-digit" },
            )}
          </text>
        ))}
      </svg>
    </div>
  );
}
export default function MetricsPanel({
  metrics,
  history: inputHistory,
  resource,
  resources = [],
  range,
  onRangeChange,
  onFilter,
}) {
  const history = inputHistory || metrics?.history || [];
  const [localRange, setLocalRange] = useState(5);
  const selectedRange = range || localRange;
  const samples = useMemo(() => {
    const all = history.length ? history : metrics ? [metrics] : [];
    const latest = all.length
      ? Date.parse(all[all.length - 1].timestamp)
      : Date.now();
    return all.filter(
      (s) => Date.parse(s.timestamp) >= latest - selectedRange * 60000,
    );
  }, [history, metrics, selectedRange]);
  const nodes = resources.filter((r) => r.kind === "Node");
  const podCounts = resources
    .filter((r) => r.kind === "Pod")
    .reduce((all, pod) => {
      const label = resourceStatus(pod).label;
      all[label] = (all[label] || 0) + 1;
      return all;
    }, {});
  return (
    <section className="metrics-panel">
      <div className="section-heading">
        <div>
          <strong>{resource ? "Kaynak metrikleri" : "Kaynak kullanımı"}</strong>
          <p>CPU ve bellek · gerçek kullanım</p>
        </div>
        <div className="segmented-control">
          {[5, 15, 60].map((value) => (
            <button
              key={value}
              className={selectedRange === value ? "active" : ""}
              onClick={() => {
                setLocalRange(value);
                onRangeChange?.(value);
              }}
            >
              {value === 60 ? "1 saat" : `${value} dk`}
            </button>
          ))}
        </div>
      </div>
      {metrics?.available === false && (
        <div className="inline-alert alert-warning">
          <Info size={16} />
          <span>
            Metrik alınamıyor:{" "}
            {metrics.error || "metrics-server erişimi veya yetkisi yok."}
          </span>
        </div>
      )}
      <div className="metric-charts">
        <LineChart
          samples={samples}
          resource={resource}
          metric="cpu"
          label="CPU kullanımı"
          color="#2563eb"
        />
        <LineChart
          samples={samples}
          resource={resource}
          metric="memory"
          label="Bellek kullanımı"
          color="#16807b"
        />
      </div>
      <p className="metric-source">
        Kaynak: {metrics?.source || "metrics.k8s.io"} · Oturum belleğinde{" "}
        {samples.length} örnek
        {samples.length > 0
          ? ` · ${new Date(samples[0].timestamp).toLocaleTimeString("tr-TR")} – ${new Date(samples[samples.length - 1].timestamp).toLocaleTimeString("tr-TR")}`
          : ""}
        . Eksik ölçümler boşluk olarak gösterilir; uzun süreli geçmiş deposu
        bağlı değildir.
      </p>
      {!resource && nodes.length > 0 && (
        <div className="node-metrics">
          <h3>Node başına kullanım</h3>
          {nodes.map((node) => {
            const measured = metricFor(node, metrics);
            const cpu = quantityNumber(metricUsage(measured, "cpu")),
              capacity = quantityNumber(node.status?.allocatable?.cpu);
            const percent =
              cpu != null && capacity > 0 ? (cpu / capacity) * 100 : null;
            return (
              <div className="node-metric-row" key={node.metadata?.uid}>
                <span>{node.metadata.name}</span>
                <div
                  className="usage-track"
                  role="meter"
                  aria-label={`${node.metadata.name} CPU / allocatable`}
                  aria-valuenow={
                    percent == null ? undefined : Math.round(percent)
                  }
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <i style={{ width: `${Math.min(100, percent || 0)}%` }} />
                </div>
                <span>
                  {percent == null ? "Veri yok" : `${percent.toFixed(1)}%`} ·{" "}
                  {formatCPU(metricUsage(measured, "cpu"))} /{" "}
                  {formatCPU(node.status?.allocatable?.cpu)}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {!resource && Object.keys(podCounts).length > 0 && (
        <div className="pod-distribution">
          <h3>Pod durum dağılımı</h3>
          {Object.entries(podCounts).map(([label, count]) => (
            <button
              className="distribution-item"
              key={label}
              onClick={() => onFilter?.(label)}
            >
              <span>{label}</span>
              <strong>{count}</strong>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
