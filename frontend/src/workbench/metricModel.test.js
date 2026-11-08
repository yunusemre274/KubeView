import test from "node:test";
import assert from "node:assert/strict";
import { metricTimestamp, latestMeasurement } from "./metricModel.js";
import { metricFor } from "./resourceUtils.js";
const pod = {
  kind: "Pod",
  metadata: {
    uid: "new",
    name: "same",
    namespace: "lab",
    creationTimestamp: "2026-11-08T10:00:00Z",
  },
};
test("graph time comes from the provider measurement, not gateway retrieval", () => {
  const sample = {
    available: true,
    timestamp: "2026-11-08T10:01:00Z",
    pods: [
      {
        metadata: { name: "same", namespace: "lab" },
        timestamp: "2026-11-08T10:00:15Z",
        containers: [{ usage: { cpu: "5m" } }],
      },
    ],
  };
  assert.equal(metricTimestamp(sample, pod), "2026-11-08T10:00:15Z");
  assert.equal(
    latestMeasurement(
      [sample, { available: false, timestamp: "2026-11-08T10:02:00Z" }],
      pod,
    ),
    "2026-11-08T10:00:15Z",
  );
});
test("same-name replacement excludes measurements predating the new Pod incarnation", () => {
  const sample = {
    available: true,
    pods: [
      {
        metadata: { name: "same", namespace: "lab" },
        timestamp: "2026-11-08T09:59:59Z",
        containers: [{ usage: { cpu: "5m" } }],
      },
    ],
  };
  assert.equal(metricFor(pod, sample), null);
  assert.equal(metricTimestamp(sample, pod), null);
  assert.equal(
    metricTimestamp({
      available: false,
      nodes: [{ timestamp: "2026-11-08T10:00:15Z" }],
    }),
    null,
  );
});
