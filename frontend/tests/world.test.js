import test from "node:test";
import assert from "node:assert/strict";
import { FACILITIES, facilityFor, ownerNode } from "../src/world/registry.js";
import {
  acceptedOperation,
  observeOperation,
} from "../src/world/operations.js";
const deployment = (replicas = 1, generation = 1, ready = replicas) => ({
  apiVersion: "apps/v1",
  kind: "Deployment",
  metadata: { uid: "w", name: "work", generation },
  spec: { replicas },
  status: {
    observedGeneration: generation,
    readyReplicas: ready,
    updatedReplicas: replicas,
  },
});
test("every resource group has a world entry without adding synthetic resource identities", () => {
  for (const kind of [
    "Deployment",
    "CronJob",
    "PersistentVolumeClaim",
    "Secret",
    "Service",
    "Role",
    "CustomResourceDefinition",
  ])
    assert.ok(FACILITIES[facilityFor({ kind })]);
  assert.equal(facilityFor({ kind: "Pod" }), null);
  assert.ok(Object.values(FACILITIES).every((f) => !f.metadata));
});
test("Node context is resolved from true spec.nodeName, not namespace or owner replicas", () => {
  const n = { kind: "Node", metadata: { uid: "n", name: "worker" } };
  assert.equal(
    ownerNode({ kind: "Pod", spec: { nodeName: "worker" } }, [n]),
    n,
  );
  assert.equal(ownerNode({ kind: "Pod", spec: {} }, [n]), null);
});
test("scale acceptance retains workload identity and waits for actual desired+Ready replicas", () => {
  const op = acceptedOperation(
    {
      object: { kind: "Scale", metadata: { uid: "w" }, spec: { replicas: 3 } },
      operation: { id: "op1" },
    },
    { action: "scale", resource: deployment(), targetReplicas: 3 },
    "source",
  );
  assert.equal(op.resource.kind, "Deployment");
  assert.equal(observeOperation(op, [deployment()]).status, "reconciling");
  assert.equal(
    observeOperation(op, [deployment(3, 2, 2)]).status,
    "reconciling",
  );
  assert.equal(observeOperation(op, [deployment(3, 2, 3)]).status, "succeeded");
});
test("API delete acceptance does not remove a finalizing UID; partial failures remain partial", () => {
  const r = {
    ...deployment(),
    metadata: { uid: "w", deletionTimestamp: "now" },
  };
  const op = { action: "delete", resource: r, at: Date.now() };
  assert.equal(observeOperation(op, [r]).status, "reconciling");
  assert.equal(observeOperation(op, []).status, "succeeded");
  assert.equal(
    observeOperation(
      { results: [{ accepted: false, resource: r, error: "403" }] },
      [r],
    ).status,
    "partial",
  );
});
test("post-acceptance Node recreation is disclosed without altering real Pod placement", () => {
  const p = {
    kind: "Pod",
    metadata: { uid: "p" },
    spec: { nodeName: "worker" },
    status: { conditions: [{ type: "Ready", status: "True" }] },
  };
  const op = {
    action: "create",
    resource: p,
    at: Date.now(),
    targetNode: { name: "worker", uid: "old-node", mode: "required" },
  };
  const result = observeOperation(op, [
    p,
    { kind: "Node", metadata: { uid: "new-node", name: "worker" } },
  ]);
  assert.equal(result.status, "failed");
  assert.match(result.observation, /yeniden oluşturuldu/);
  assert.equal(p.spec.nodeName, "worker");
});

test("operation history never retains purposeful Secret values or annotations", () => {
 const secret={apiVersion:"v1",kind:"Secret",metadata:{uid:"s",name:"s",annotations:{value:"private-annotation"}},data:{password:"private-value"}};
 const op=acceptedOperation({object:secret},{action:"edit",object:secret,resource:secret},"live");
 assert.doesNotMatch(JSON.stringify(op),/private-value|private-annotation/);
 assert.equal(op.resource.metadata.uid,"s");
});
