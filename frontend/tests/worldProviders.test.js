import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMeasuredFlows,
  mergeProvisionOperations,
  provisionTerminal,
} from "../src/world/useWorldProviders.js";

test("flow state retains measured L4/L7 and coverage without importing sensitive provider fields or inferring unknowns", () => {
  const value = normalizeMeasuredFlows({
    context: "lab",
    clusterUID: "owned-cluster",
    namespace: "test",
    status: "live",
    windowSeconds: 10,
    totalFlowGroups: 8,
    omittedGroups: 6,
    filteredEvents: 3,
    providerLostEvents: 2,
    mappingDropped: 1,
    duplicateEvents: 4,
    units: "observed-flow-events",
    flows: [
      {
        id: "f",
        source: {
          uid: "one",
          namespace: "test",
          name: "a",
          identityStatus: "matched",
          ip: "10.0.0.1",
          port: 80,
        },
        destination: { uid: null, ip: "10.0.0.2", port: 443 },
        protocol: "HTTP",
        transportProtocol: "TCP",
        httpCode: 503,
        httpProtocol: "HTTP/1.1",
        dnsRcode: null,
        dropReason: "POLICY_DENIED",
        eventCount: 7,
        latencyMs: 0,
        url: "sensitive",
        headers: { Authorization: "sensitive" },
        payload: "sensitive",
      },
    ],
    token: "sensitive",
    tls: "sensitive",
  });
  assert.equal(value.flows[0].latencyMs, 0);
  assert.equal(value.flows[0].httpCode, 503);
  assert.equal(value.flows[0].transportProtocol, "TCP");
  assert.equal(value.flows[0].destination.uid, null);
  assert.equal(value.flows[0].destination.containerName, null);
  assert.equal(value.flows[0].source.identityStatus, "matched");
  assert.equal(value.flows[0].dnsRcode, null);
  assert.equal(value.totalFlowGroups, 8);
  assert.equal(value.omittedGroups, 6);
  assert.equal(value.providerLostEvents, 2);
  assert.equal(value.mappingDropped, 1);
  assert.equal(value.units, "observed-flow-events");
  assert.equal(JSON.stringify(value).includes("sensitive"), false);
  const unknown = normalizeMeasuredFlows({
    flows: [{ id: "unknown", source: null, latencyMs: -1, eventCount: NaN }],
  });
  assert.equal(unknown.flows[0].eventCount, null);
  assert.equal(unknown.flows[0].latencyMs, null);
  assert.equal(
    unknown.flows[0].protocol,
    null,
    "port numbers never imply observed application protocol",
  );
  assert.equal(
    unknown.filteredEvents,
    null,
    "unknown coverage is not fabricated zero",
  );
});

test("world flow list has an explicit bounded display count and does not duplicate identities", () => {
  const value = normalizeMeasuredFlows({
    flows: Array.from({ length: 1100 }, (_, id) => ({ id: String(id) })),
  });
  assert.equal(value.flows.length, 1024);
  assert.equal(value.clientOmitted, 76);
  assert.equal(new Set(value.flows.map((flow) => flow.id)).size, 1024);
});

test("provisioning history merges by operation ID, preserves actual stage source and separates expected name from a real UID", () => {
  const before = [{ id: "operation", status: "provisioning", nodeUID: null }];
  const next = mergeProvisionOperations(before, [
    {
      id: "operation",
      status: "registered",
      expectedName: "worker-2",
      nodeUID: "actual-node-uid",
      stageSource: "Kubernetes watch",
      cancelRequested: true,
      before: { internal: "not-ui" },
      processPID: 1234,
    },
  ]);
  assert.equal(next.length, 1);
  assert.equal(next[0].nodeUID, "actual-node-uid");
  assert.equal(next[0].expectedName, "worker-2");
  assert.equal(next[0].stageSource, "Kubernetes watch");
  assert.equal(next[0].cancelRequested, true);
  assert.equal(next[0].before, undefined);
  assert.equal(next[0].processPID, undefined);
  assert.equal(provisionTerminal(next[0]), false);
  assert.equal(provisionTerminal({ status: "ready" }), true);
  assert.equal(provisionTerminal({ status: "failed" }), true);
  const bounded = mergeProvisionOperations(
    [],
    Array.from({ length: 60 }, (_, i) => ({
      id: String(i),
      startedAt: new Date(i * 1000).toISOString(),
      status: "ready",
    })),
  );
  assert.equal(bounded.length, 32);
  assert.equal(bounded[0].id, "59");
});
