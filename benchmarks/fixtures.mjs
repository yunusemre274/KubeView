// Versioned synthetic Kubernetes objects, never applied to a real cluster.
import { createHash } from "node:crypto";
export const VERSION = "kubeview-benchmark-v2";
export const PROFILES = { S: [5, 50], M: [20, 300], L: [50, 1500] };
export const CREATED = "2026-10-23T00:00:00Z";
const meta = (uid, name, namespace) => ({
  uid,
  name,
  ...(namespace ? { namespace } : {}),
  resourceVersion: "initial",
  creationTimestamp: CREATED,
  labels: { app: "benchmark", seed: "20261024" },
});
const condition = (status) => [{ type: "Ready", status }];
export function fixture(profile = "M") {
  if (!PROFILES[profile]) throw new Error(`Unknown profile ${profile}`);
  const [nodes, pods] = PROFILES[profile];
  const namespaces = Array.from({ length: 4 }, (_, i) => ({
    apiVersion: "v1",
    kind: "Namespace",
    metadata: meta(`namespace-${i}`, `bench-${i}`),
  }));
  const workloads = Array.from({ length: 4 }, (_, i) => ({
    apiVersion: "apps/v1",
    kind: i === 3 ? "StatefulSet" : "Deployment",
    metadata: meta(`owner-${i}`, `app-${i}`, `bench-${i}`),
    spec: {
      replicas: Math.floor(pods / 4),
      selector: { matchLabels: { app: `app-${i}` } },
      template: {
        metadata: { labels: { app: `app-${i}` } },
        spec: {
          containers: [{ name: "app", image: "fixture.invalid/app:v1" }],
        },
      },
    },
    status: {
      readyReplicas: Math.floor(pods / 4),
      replicas: Math.floor(pods / 4),
      observedGeneration: 1,
    },
  }));
  const ships = Array.from({ length: nodes }, (_, i) => ({
    apiVersion: "v1",
    kind: "Node",
    metadata: {
      ...meta(`node-${i}`, `worker-${String(i + 1).padStart(3, "0")}`),
      labels: { "kubernetes.io/hostname": `host-${i}` },
    },
    spec: {},
    status: {
      conditions: condition("True"),
      capacity: { cpu: "8", memory: "16Gi" },
      allocatable: { cpu: "7500m", memory: "15Gi" },
      nodeInfo: { kubeletVersion: "fixture-v1.30.0" },
    },
  }));
  const cargo = Array.from({ length: pods }, (_, i) => {
    const containers = [
      {
        name: "app",
        image: "fixture.invalid/app:v1",
        resources: {
          requests: { cpu: "100m", memory: "64Mi" },
          limits: { cpu: "500m", memory: "256Mi" },
        },
      },
    ];
    if (i % 7 === 0)
      containers.push({ name: "sidecar", image: "fixture.invalid/sidecar:v1" });
    const pending = i % 41 === 40,
      failing = i % 31 === 30;
    return {
      apiVersion: "v1",
      kind: "Pod",
      metadata: {
        ...meta(`pod-${i}`, `app-${i}`, `bench-${i % 4}`),
        ...(i % 43 === 42
          ? {
              deletionTimestamp: CREATED,
              finalizers: ["fixture.invalid/finalizer"],
            }
          : {}),
        ownerReferences: [
          {
            apiVersion: "apps/v1",
            kind: workloads[i % 4].kind,
            uid: `owner-${i % 4}`,
            name: `app-${i % 4}`,
            controller: true,
          },
        ],
      },
      spec: {
        ...(pending ? {} : { nodeName: ships[i % nodes].metadata.name }),
        containers,
      },
      status: {
        phase: pending ? "Pending" : "Running",
        conditions: condition(pending || failing ? "False" : "True"),
        containerStatuses: containers.map((c) => ({
          name: c.name,
          ready: !pending && !failing,
          restartCount: !pending && failing ? 3 : 0,
          state: pending
            ? { waiting: { reason: "ContainerCreating" } }
            : failing
              ? { waiting: { reason: "CrashLoopBackOff" } }
              : { running: { startedAt: CREATED } },
        })),
      },
    };
  });
  return [...namespaces, ...workloads, ...ships, ...cargo];
}
export function apply(resources, events) {
  const map = new Map(resources.map((r) => [r.metadata.uid, r]));
  for (const e of events) {
    if (e.action === "DELETE") map.delete(e.object.metadata.uid);
    else {
      for (const [uid, old] of map)
        if (
          uid !== e.object.metadata.uid &&
          old.kind === e.object.kind &&
          old.metadata.name === e.object.metadata.name &&
          old.metadata.namespace === e.object.metadata.namespace
        )
          map.delete(uid);
      map.set(e.object.metadata.uid, e.object);
    }
  }
  return [...map.values()];
}
export function signature(resources) {
  const canonical = (value) =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, canonical(value[key])]),
          )
        : value;
  return resources
    .map((r) => [r.metadata.uid, canonical(r)])
    .sort((a, b) => a[0].localeCompare(b[0], "en"));
}
export const digest = (resources) =>
  createHash("sha256")
    .update(JSON.stringify(signature(resources)))
    .digest("hex");
export function replay(
  resources,
  { duration = 60, burst = true, startSequence = 1 } = {},
) {
  const pods = resources.filter((r) => r.kind === "Pod"),
    events = [];
  const restarts = new Map(
    pods.map((p) => [
      p.metadata.uid,
      p.status?.containerStatuses?.[0]?.restartCount || 0,
    ]),
  );
  for (let second = 0; second < duration; second++) {
    const rate = burst && second >= 25 && second < 35 ? 100 : 5;
    for (let i = 0; i < rate; i++) {
      const sequence = startSequence + events.length;
      const original = pods[sequence % pods.length];
      const object = structuredClone(original);
      object.metadata.resourceVersion = `bench-${sequence}`;
      let action = "UPDATE";
      // ADD/DELETE pairs have distinct addresses; normal updates cycle across UIDs.
      if (sequence % 20 === 1 || sequence % 20 === 2) {
        action = sequence % 20 === 1 ? "ADD" : "DELETE";
        const id = Math.floor(sequence / 20);
        object.metadata.uid = `transient-${id}`;
        object.metadata.name = `transient-${id}`;
        object.metadata.namespace = "bench-0";
        object.metadata.ownerReferences = [];
        delete object.metadata.deletionTimestamp;
        delete object.metadata.finalizers;
      } else {
        const pending = !object.spec.nodeName;
        const healthy = !pending && sequence % 13 !== 0;
        const count =
          restarts.get(object.metadata.uid) + Number(!pending && !healthy);
        restarts.set(object.metadata.uid, count);
        object.status.conditions = condition(healthy ? "True" : "False");
        object.status.containerStatuses = object.status.containerStatuses.map(
          (c, index) => ({
            ...c,
            ready: healthy,
            restartCount: index === 0 ? count : c.restartCount,
            state: pending
              ? { waiting: { reason: "ContainerCreating" } }
              : healthy
                ? { running: { startedAt: CREATED } }
                : { waiting: { reason: "CrashLoopBackOff" } },
          }),
        );
      }
      events.push({
        action,
        object,
        sequence,
        atMs: second * 1000 + (i * 1000) / rate,
      });
    }
  }
  return events;
}
