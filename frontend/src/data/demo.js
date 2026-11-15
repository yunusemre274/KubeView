// Explicit, deterministic fixture provider. Never a fallback for live errors.
const epoch = "2026-10-23T08:00:00Z";
function meta(name, kind, namespace = "tersane-demo") {
  return {
    uid: `demo-${kind}-${name}`,
    name,
    ...(namespace ? { namespace } : {}),
    creationTimestamp: epoch,
    resourceVersion: "fixture-1",
    labels: { "app.kubernetes.io/part-of": "tersane-demo" },
  };
}
export function demoResources() {
  const nodes = ["marmara-01", "ege-02", "karadeniz-03"].map((name) => ({
    apiVersion: "v1",
    kind: "Node",
    metadata: meta(name, "Node", ""),
    spec: {},
    status: {
      conditions: [{ type: "Ready", status: "True" }],
      allocatable: { cpu: "4", memory: "8Gi" },
      nodeInfo: {
        kubeletVersion: "v1.35.1",
        operatingSystem: "linux",
        architecture: "arm64",
      },
    },
  }));
  const deployments = [
    "web-gateway",
    "orders-api",
    "worker",
    "inventory-api",
  ].map((name, i) => ({
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: meta(name, "Deployment"),
    spec: {
      replicas: 6,
      selector: { matchLabels: { app: name } },
      strategy: { type: "RollingUpdate" },
      template: {
        metadata: { labels: { app: name } },
        spec: {
          containers: [
            {
              name: "app",
              image: i === 0 ? "nginx:1.27-alpine" : "busybox:1.37",
              resources: {
                requests: { cpu: "100m", memory: "64Mi" },
                limits: { cpu: "500m", memory: "256Mi" },
              },
            },
          ],
        },
      },
    },
    status: {
      replicas: 6,
      readyReplicas: 6,
      updatedReplicas: 6,
      observedGeneration: 1,
    },
  }));
  const replicas = deployments.map((d) => ({
    apiVersion: "apps/v1",
    kind: "ReplicaSet",
    metadata: {
      ...meta(`${d.metadata.name}-6b9c87`, "ReplicaSet"),
      ownerReferences: [
        {
          kind: "Deployment",
          name: d.metadata.name,
          uid: d.metadata.uid,
          controller: true,
        },
      ],
    },
    spec: { replicas: 6 },
    status: { readyReplicas: 6 },
  }));
  const pods = Array.from({ length: 24 }, (_, i) => {
    const d = deployments[i % 4],
      rs = replicas[i % 4];
    return {
      apiVersion: "v1",
      kind: "Pod",
      metadata: {
        ...meta(
          `${d.metadata.name}-6b9c87-${String(i + 1).padStart(4, "0")}`,
          "Pod",
        ),
        labels: { app: d.metadata.name },
        ownerReferences: [
          {
            kind: "ReplicaSet",
            name: rs.metadata.name,
            uid: rs.metadata.uid,
            controller: true,
          },
        ],
      },
      spec: {
        nodeName: nodes[i % 3].metadata.name,
        serviceAccountName: "default",
        containers: d.spec.template.spec.containers,
      },
      status: {
        phase: "Running",
        conditions: [{ type: "Ready", status: i === 7 ? "False" : "True" }],
        containerStatuses: [
          {
            name: "app",
            ready: i !== 7,
            restartCount: i === 11 ? 2 : 0,
            state: { running: { startedAt: epoch } },
          },
        ],
      },
    };
  });
  const namespace = {
    apiVersion: "v1",
    kind: "Namespace",
    metadata: meta("tersane-demo", "Namespace", ""),
    status: { phase: "Active" },
  };
  const storage = {
    apiVersion: "v1",
    kind: "PersistentVolumeClaim",
    metadata: meta("orders-data", "PersistentVolumeClaim"),
    spec: {
      accessModes: ["ReadWriteOnce"],
      resources: { requests: { storage: "10Gi" } },
      storageClassName: "standard",
    },
    status: { phase: "Bound", capacity: { storage: "10Gi" } },
  };
  const service = {
    apiVersion: "v1",
    kind: "Service",
    metadata: meta("web-gateway", "Service"),
    spec: {
      selector: { app: "web-gateway" },
      type: "ClusterIP",
      ports: [{ port: 80, targetPort: 80 }],
    },
  };
  return [
    ...nodes,
    ...deployments,
    ...replicas,
    ...pods,
    namespace,
    storage,
    service,
  ];
}
export function demoMetrics(resources, tick = 0) {
  const timestamp = new Date().toISOString();
  return {
    available: true,
    source: "Demo — deterministik örnek ölçümler",
    timestamp,
    nodes: resources
      .filter((r) => r.kind === "Node")
      .map((r, i) => ({
        metadata: r.metadata,
        timestamp,
        usage: {
          cpu: `${620 + i * 180 + (tick % 5) * 20}m`,
          memory: `${1900 + i * 250}Mi`,
        },
      })),
    pods: resources
      .filter((r) => r.kind === "Pod")
      .map((r, i) => ({
        metadata: r.metadata,
        timestamp,
        containers: [
          {
            name: "app",
            usage: { cpu: `${18 + i * 2}m`, memory: `${32 + i * 3}Mi` },
          },
        ],
      })),
  };
}
