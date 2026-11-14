import test from "node:test";
import assert from "node:assert/strict";
import { podContainers } from "./containerModel.js";
test("container role follows Kubernetes fields and status is matched by raw name", () => {
  const pod = {
    spec: {
      containers: [
        { name: "api", image: "api:v1" },
        { name: "helper", image: "helper:v1" },
      ],
      initContainers: [
        { name: "migrate", image: "migrate:v1" },
        { name: "log-agent", image: "agent:v1", restartPolicy: "Always" },
      ],
      ephemeralContainers: [{ name: "debug-123", image: "debug:v1" }],
    },
    status: {
      containerStatuses: [
        { name: "helper", ready: true },
        { name: "api", ready: false },
      ],
      initContainerStatuses: [
        { name: "log-agent", restartCount: 3 },
        { name: "migrate", restartCount: 0 },
      ],
      ephemeralContainerStatuses: [
        { name: "debug-123", state: { running: {} } },
      ],
    },
  };
  const containers = podContainers(pod);
  assert.deepEqual(
    containers.map((c) => c.roleKey),
    ["app", "app", "init", "sidecar", "ephemeral"],
  );
  assert.equal(containers.find((c) => c.name === "api").observed.ready, false);
  assert.equal(
    containers.find((c) => c.name === "log-agent").observed.restartCount,
    3,
  );
  assert.equal(
    containers.find((c) => c.name === "helper").roleKey,
    "app",
    "a second app container is not guessed to be a sidecar",
  );
  assert.equal(
    pod.spec.containers[0].roleKey,
    undefined,
    "canonical spec remains untouched",
  );
});
test("an unobserved container remains unobserved", () => {
  const containers = podContainers({ spec: { containers: [{ name: "app" }] } });
  assert.equal(containers[0].observed, undefined);
  assert.deepEqual(podContainers({}), []);
});
