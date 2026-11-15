import test from "node:test";
import assert from "node:assert/strict";
import { applyPlacement, assertTargetNode } from "./placement.js";
const node = {
  kind: "Node",
  metadata: {
    name: "worker-a",
    uid: "node-a",
    labels: { zone: "east", disk: "ssd", generation: "4" },
  },
};
const pod = () => ({
  apiVersion: "v1",
  kind: "Pod",
  metadata: { name: "example", namespace: "qa" },
  spec: { containers: [{ name: "app", image: "nginx" }] },
});
test("required placement constrains each existing OR branch with AND metadata.name; unknown fields survive", () => {
  const original = pod();
  original.spec.nodeSelector = { disk: "ssd" };
  original.spec.affinity = {
    podAffinity: { custom: true },
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              { key: "zone", operator: "In", values: ["east"] },
            ],
          },
          {
            matchExpressions: [
              { key: "generation", operator: "Gt", values: ["2"] },
            ],
          },
        ],
      },
    },
  };
  const { object, provenance } = applyPlacement(original, node, "required");
  assert.equal(object.spec.nodeName, undefined);
  assert.deepEqual(object.spec.nodeSelector, { disk: "ssd" });
  assert.deepEqual(object.spec.affinity.podAffinity, { custom: true });
  assert.equal(
    object.spec.affinity.nodeAffinity
      .requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms.length,
    2,
  );
  for (const term of object.spec.affinity.nodeAffinity
    .requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms)
    assert.deepEqual(term.matchFields, [
      { key: "metadata.name", operator: "In", values: ["worker-a"] },
    ]);
  assert.deepEqual(
    applyPlacement(object, node, "scheduler", provenance).object,
    original,
  );
});
test("existing identical target clause is retained when only the form clause is removed", () => {
  const original = pod();
  original.spec.affinity = {
    nodeAffinity: {
      requiredDuringSchedulingIgnoredDuringExecution: {
        nodeSelectorTerms: [
          {
            matchFields: [
              { key: "metadata.name", operator: "In", values: ["worker-a"] },
            ],
          },
        ],
      },
    },
  };
  const applied = applyPlacement(original, node, "required");
  assert.equal(
    applied.object.spec.affinity.nodeAffinity
      .requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[0]
      .matchFields.length,
    2,
  );
  assert.deepEqual(
    applyPlacement(applied.object, node, "scheduler", applied.provenance)
      .object,
    original,
  );
});
test("preferred appends weight100 and does not remove selector or required affinity", () => {
  const original = pod();
  original.spec.nodeSelector = { zone: "west" };
  original.spec.affinity = {
    nodeAffinity: {
      preferredDuringSchedulingIgnoredDuringExecution: [
        {
          weight: 30,
          preference: {
            matchExpressions: [
              { key: "disk", operator: "In", values: ["ssd"] },
            ],
          },
        },
      ],
    },
  };
  const applied = applyPlacement(original, node, "preferred"),
    preferences =
      applied.object.spec.affinity.nodeAffinity
        .preferredDuringSchedulingIgnoredDuringExecution;
  assert.equal(preferences.length, 2);
  assert.equal(preferences[1].weight, 100);
  assert.deepEqual(
    applyPlacement(applied.object, node, "scheduler", applied.provenance)
      .object,
    original,
  );
});
test("selector contradiction, all incompatible OR branches and empty terms are explicit errors", () => {
  const selector = pod();
  selector.spec.nodeSelector = { zone: "west" };
  assert.throws(
    () => applyPlacement(selector, node, "required"),
    /nodeSelector/,
  );
  for (const terms of [
    [],
    [{}],
    [{ matchExpressions: [{ key: "zone", operator: "In", values: ["west"] }] }],
  ]) {
    const original = pod();
    original.spec.affinity = {
      nodeAffinity: {
        requiredDuringSchedulingIgnoredDuringExecution: {
          nodeSelectorTerms: terms,
        },
      },
    };
    assert.throws(
      () => applyPlacement(original, node, "required"),
      /boş|hiçbirini/,
    );
  }
});
test("scheduler removes own generated affinity only; authored YAML modifications are never silently deleted", () => {
  const original = pod(),
    applied = applyPlacement(original, node, "required");
  assert.deepEqual(
    applyPlacement(applied.object, node, "scheduler", applied.provenance)
      .object,
    original,
  );
  applied.object.spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[0].matchFields[0].values =
    ["worker-b"];
  assert.throws(
    () => applyPlacement(applied.object, node, "scheduler", applied.provenance),
    /YAML/,
  );
});
test("fresh Node identity must match UID and name, and nodeName bypass is rejected", () => {
  assert.equal(
    assertTargetNode(node, structuredClone(node)).metadata.uid,
    "node-a",
  );
  assert.throws(
    () =>
      assertTargetNode(node, {
        ...node,
        metadata: { ...node.metadata, uid: "recreated" },
      }),
    /yeniden/,
  );
  assert.throws(
    () =>
      assertTargetNode(node, {
        ...node,
        metadata: { ...node.metadata, deletionTimestamp: "now" },
      }),
    /siliniyor/,
  );
  const original = pod();
  original.spec.nodeName = "worker-a";
  assert.throws(() => applyPlacement(original, node, "required"), /nodeName/);
});
