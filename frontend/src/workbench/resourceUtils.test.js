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
test("a suspended Job with no terminal condition is suspended instead of running", () => {
  assert.deepEqual(
    resourceStatus({
      kind: "Job",
      metadata: { uid: "suspended-job", generation: 1 },
      spec: { suspend: true },
      status: { active: 0 },
    }),
    { label: "Askıya alındı", tone: "warning" },
  );
});
test("Job terminal conditions retain priority over suspend and normal running stays unchanged", () => {
  const job = { kind: "Job", spec: { suspend: true } };
  assert.deepEqual(
    resourceStatus({
      ...job,
      status: { conditions: [{ type: "Complete", status: "True" }] },
    }),
    { label: "Tamamlandı", tone: "success" },
  );
  assert.deepEqual(
    resourceStatus({
      ...job,
      status: { conditions: [{ type: "Failed", status: "True" }] },
    }),
    { label: "Başarısız", tone: "danger" },
  );
  assert.deepEqual(
    resourceStatus({
      kind: "Job",
      spec: { suspend: false },
      status: { active: 1 },
    }),
    { label: "Çalışıyor", tone: "warning" },
  );
});
test("DaemonSet missing, partial or stale observations never imply healthy readiness", () => {
  const daemonset = {
    kind: "DaemonSet",
    metadata: { uid: "daemonset", generation: 2 },
  };
  for (const status of [
    {},
    { observedGeneration: 2 },
    { observedGeneration: 2, numberReady: 1 },
    { observedGeneration: 2, desiredNumberScheduled: 1 },
    { numberReady: 1, desiredNumberScheduled: 1 },
    { observedGeneration: 1, numberReady: 1, desiredNumberScheduled: 1 },
    { observedGeneration: 2, numberReady: "1", desiredNumberScheduled: "1" },
    { observedGeneration: 2, numberReady: 1, desiredNumberScheduled: 2 },
  ])
    assert.deepEqual(resourceStatus({ ...daemonset, status }), {
      label: "Uygulanıyor",
      tone: "warning",
    });
  assert.deepEqual(
    resourceStatus({
      kind: "DaemonSet",
      status: {
        observedGeneration: 2,
        numberReady: 1,
        desiredNumberScheduled: 1,
      },
    }),
    { label: "Uygulanıyor", tone: "warning" },
  );
});
test("DaemonSet known counts and current observed generation preserve real Ready including zero eligible Nodes", () => {
  for (const count of [0, 1, 3])
    assert.deepEqual(
      resourceStatus({
        kind: "DaemonSet",
        metadata: { generation: 2 },
        status: {
          observedGeneration: 2,
          numberReady: count,
          desiredNumberScheduled: count,
        },
      }),
      { label: "Hazır", tone: "success" },
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
