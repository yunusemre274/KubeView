import test from "node:test";
import assert from "node:assert/strict";
import {
  resourceStatus,
  quantityNumber,
  validateResources,
  editableResource,
  metricFor,
  metricUsage,
  resourceUID,
} from "./resourceUtils.js";
const pod = {
  apiVersion: "v1",
  kind: "Pod",
  metadata: { uid: "a", name: "same", namespace: "qa" },
  spec: { nodeName: "worker", containers: [{ name: "app" }] },
  status: {
    phase: "Running",
    conditions: [{ type: "Ready", status: "False" }],
    containerStatuses: [{ name: "app", ready: false }],
  },
};
test("Running is distinct from Ready and terminating remains visible", () => {
  assert.deepEqual(resourceStatus(pod), {
    label: "Running · Hazır değil",
    tone: "warning",
  });
  assert.equal(
    resourceStatus({
      ...pod,
      metadata: { ...pod.metadata, deletionTimestamp: "2026-01-01T00:00:00Z" },
    }).label,
    "Sonlandırılıyor",
  );
  assert.equal(
    resourceStatus({ ...pod, status: { phase: "Succeeded" } }).tone,
    "success",
  );
  assert.equal(
    resourceStatus({ ...pod, spec: { ...pod.spec, nodeName: "" } }).label,
    "Atama bekliyor",
  );
});
test("Unknown Node is not healthy and UID recreation does not alias", () => {
  assert.equal(
    resourceStatus({
      kind: "Node",
      status: { conditions: [{ type: "Ready", status: "Unknown" }] },
    }).label,
    "Ready Unknown",
  );
  assert.notEqual(
    resourceUID(pod),
    resourceUID({ ...pod, metadata: { ...pod.metadata, uid: "b" } }),
  );
});
test("CPU and binary memory quantity parse without invented defaults", () => {
  assert.equal(quantityNumber("500m"), 0.5);
  assert.equal(quantityNumber("1Gi"), 1073741824);
  assert.equal(quantityNumber("250000000n"), 0.25);
  assert.equal(quantityNumber("1e3"), 1000);
  assert.equal(quantityNumber("bad"), null);
  assert.equal(quantityNumber(undefined), null);
  assert.equal(
    validateResources([
      {
        name: "app",
        resources: { requests: { cpu: "2" }, limits: { cpu: "500m" } },
      },
    ]).length,
    1,
  );
  assert.equal(
    validateResources([
      { name: "app", resources: { requests: { memory: "500m" } } },
    ]).length,
    1,
  );
});
test("editable object preserves unknown fields and resourceVersion without mutating observed state", () => {
  const original = {
    ...pod,
    metadata: {
      ...pod.metadata,
      resourceVersion: "opaque/rv",
      managedFields: [{ manager: "controller" }],
    },
    spec: { ...pod.spec, customAllowedExtension: { a: 1 } },
  };
  const draft = editableResource(original);
  assert.equal(draft.metadata.resourceVersion, "opaque/rv");
  assert.deepEqual(draft.spec.customAllowedExtension, { a: 1 });
  assert.equal(draft.status, undefined);
  assert.equal(draft.metadata.managedFields, undefined);
  assert.equal(original.metadata.managedFields.length, 1);
});
test("metrics are matched by raw namespace/name and missing data stays missing", () => {
  const metrics = {
    available: true,
    pods: [
      {
        metadata: { name: "same", namespace: "other" },
        containers: [{ usage: { cpu: "9" } }],
      },
      {
        metadata: { name: "same", namespace: "qa" },
        containers: [
          { usage: { cpu: "250m", memory: "32Mi" } },
          { usage: { cpu: "250m", memory: "32Mi" } },
        ],
      },
    ],
  };
  assert.equal(metricUsage(metricFor(pod, metrics), "cpu"), "0.5");
  assert.equal(
    quantityNumber(metricUsage(metricFor(pod, metrics), "memory")),
    64 * 1024 ** 2,
  );
  assert.equal(metricFor(pod, { available: false }), null);
  assert.equal(metricUsage(null, "cpu"), null);
});
