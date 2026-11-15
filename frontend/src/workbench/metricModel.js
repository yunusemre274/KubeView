import { metricFor } from "./resourceUtils.js";

export function metricTimestamp(sample, resource) {
  if (sample?.available === false) return null;
  if (resource) return metricFor(resource, sample)?.timestamp || null;
  const nodes = Array.isArray(sample?.nodes)
    ? sample.nodes
    : sample?.nodes?.items || [];
  const times = nodes
    .map((node) => Date.parse(node.timestamp))
    .filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

export function latestMeasurement(samples, resource) {
  return (
    samples
      .map((sample) => metricTimestamp(sample, resource))
      .filter(Boolean)
      .at(-1) || null
  );
}
