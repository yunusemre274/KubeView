import {
  HARBOR_DIMENSIONS as D,
  VISUAL_EVENT_DIMENSIONS as V,
} from "../constants/dimensions.js";

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
export const containerVisualKey = (uid, name, role = "app") =>
  JSON.stringify([uid, role === "container" ? "app" : role, name]);

/** Absence due to scope/RBAC is not DELETE. The canonical store owns evidence. */
export function confirmedRemoval(uid, tombstones) {
  return [
    "delete-event",
    "authoritative-absence",
    "authoritative-list-absence",
    "replaced",
  ].includes(tombstones?.[uid]?.reason);
}

export function visibleContainerMarkers(
  lifecycle,
  visibleUIDs,
  selectedUID,
  now,
) {
  return [...lifecycle.containers.values()]
    .filter(
      (effect) =>
        visibleUIDs.has(effect.uid) &&
        effect.phase !== "settled" &&
        (effect.uid === selectedUID ||
          now - effect.started < V.CONTAINER_FALL_MS + V.CONTAINER_RECOVER_MS),
    )
    .sort(
      (a, b) =>
        Number(b.uid === selectedUID) - Number(a.uid === selectedUID) ||
        Number(a.settledInitial) - Number(b.settledInitial),
    )
    .slice(0, V.MAX_CONTAINER_EFFECTS);
}

/** A scoped/reconnect snapshot describes existing objects, not live ADDs. */
export function observedNodeArrivals(
  nodes,
  lifecycle,
  snapshotUIDs,
  operations = [],
) {
  if (!lifecycle.initialized) return new Set();
  const origins =
      snapshotUIDs instanceof Set ? snapshotUIDs : new Set(snapshotUIDs || []),
    verified = new Set(
      operations.map((operation) => operation.nodeUID).filter(Boolean),
    );
  return new Set(
    nodes
      .filter(
        (node) =>
          !lifecycle.nodes.has(node.metadata.uid) &&
          (!origins.has(node.metadata.uid) || verified.has(node.metadata.uid)),
      )
      .map((node) => node.metadata.uid),
  );
}

/** Spec roles, never image/name heuristics; init success is not a crash. */
export function observedContainers(pod) {
  const spec = pod.spec || {},
    status = pod.status || {};
  return [
    ...(spec.containers || []).map((c) => ({
      spec: c,
      role: "app",
      status: status.containerStatuses?.find((s) => s.name === c.name),
    })),
    ...(spec.initContainers || []).map((c) => ({
      spec: c,
      role: c.restartPolicy === "Always" ? "sidecar" : "init",
      status: status.initContainerStatuses?.find((s) => s.name === c.name),
    })),
    ...(spec.ephemeralContainers || []).map((c) => ({
      spec: c,
      role: "ephemeral",
      status: status.ephemeralContainerStatuses?.find((s) => s.name === c.name),
    })),
  ];
}

export function containerObservation(pod, entry) {
  const s = entry.status || {},
    current = s.state || {},
    last = s.lastState?.terminated;
  const terminated = current.terminated;
  const failure = terminated && terminated.exitCode !== 0;
  const crashLoop = current.waiting?.reason === "CrashLoopBackOff";
  const evicted =
    pod.status?.phase === "Failed" && pod.status?.reason === "Evicted";
  const relevantTermination = terminated || last;
  return {
    count: s.restartCount || 0,
    finished: relevantTermination?.finishedAt || "",
    reason: evicted
      ? "Evicted"
      : failure
        ? terminated.reason || "Error"
        : crashLoop
          ? last?.reason || "CrashLoopBackOff"
          : "",
    failure: !!(failure || crashLoop || evicted),
    recovered: !!(current.running && s.ready),
    completed: !!(terminated?.exitCode === 0 && !evicted),
    waitingReason: current.waiting?.reason || "",
    lastFailure: last?.exitCode != null && last.exitCode !== 0,
    terminationFinished: last?.finishedAt || "",
    terminationReason: last?.reason || "",
  };
}

/**
 * Bounded presentation state. It never changes a Kubernetes object or reports API
 * success. The caller supplies its existing, visibility-paused visual clock.
 */
export class VisualLifecycle {
  constructor(source = "") {
    this.reset(source);
  }
  reset(source = "") {
    this.source = source;
    this.initialized = false;
    this.nodes = new Map();
    this.previousContainers = new Map();
    this.containers = new Map();
    this.pulses = new Map();
    this.signals = [];
    this.sequence = 0;
    this.summarized = 0;
    this.signalFingerprints = new Map();
    this.previousPods = new Map();
    this.operationFingerprints = new Map();
    this.resourceByUID = new Map();
    this.cachedPods = new WeakMap();
  }
  nodeVisual(uid, now) {
    const record = this.nodes.get(uid);
    if (!record) return null;
    const duration =
      record.target > record.from ? V.NODE_SINK_MS : V.NODE_RECOVER_MS;
    const t = smooth((now - record.changedAt) / duration);
    record.view.fault = lerp(record.from, record.target, t);
    record.view.communication = record.ready === "Unknown" || !record.ready;
    record.view.phase =
      record.view.fault > 0.001
        ? record.target
          ? t < 1 && record.from !== record.target
            ? "failing"
            : "failed"
          : "recovering"
        : record.view.communication
          ? "communication-lost"
          : record.pending
            ? "ready-wait"
            : "ready";
    return record.view;
  }
  signal(
    resource,
    stage,
    now,
    source,
    destination,
    label,
    signature = stage,
    operation = null,
  ) {
    const uid = resource.metadata.uid,
      fingerprint = `${uid}:${stage}`;
    if (this.signalFingerprints.get(fingerprint)?.signature === signature)
      return;
    this.signalFingerprints.set(fingerprint, { uid, signature });
    if (this.signals.length >= V.MAX_PROCESS_SIGNALS) {
      this.signals.shift();
      this.summarized++;
    }
    const owners = [];
    let current = resource;
    for (let depth = 0; depth < 5; depth++) {
      const owner =
        current.metadata?.ownerReferences?.find((o) => o.controller) ||
        current.metadata?.ownerReferences?.[0];
      if (!owner) break;
      owners.push({ uid: owner.uid, kind: owner.kind, name: owner.name });
      current = this.resourceByUID.get(owner.uid);
      if (!current) break;
    }
    this.signals.push({
      id: ++this.sequence,
      uid,
      resource,
      stage,
      started: now,
      expires: now + V.PROCESS_SIGNAL_MS,
      source,
      destination,
      label,
      owners,
      operationId: operation?.id || null,
      generation: resource.metadata.generation ?? null,
      observedGeneration: resource.status?.observedGeneration ?? null,
      dataSource:
        stage === "api-accepted"
          ? "API response"
          : "Kubernetes watch observation",
    });
  }
  observeOperations(operations, now, { simple = false, hidden = false } = {}) {
    const ids = new Set();
    for (const operation of operations || []) {
      ids.add(operation.id);
      if (
        (operation.sourceKey && operation.sourceKey !== this.source) ||
        this.operationFingerprints.has(operation.id)
      )
        continue;
      this.operationFingerprints.set(
        operation.id,
        operation.resource?.metadata?.uid || null,
      );
      if (
        simple ||
        hidden ||
        ![
          "create",
          "scale",
          "restart",
          "resources",
          "edit",
          "rollback",
        ].includes(operation.action) ||
        !operation.resource?.metadata?.uid ||
        ![
          "Pod",
          "Deployment",
          "StatefulSet",
          "DaemonSet",
          "ReplicaSet",
          "Job",
          "CronJob",
        ].includes(operation.resource.kind)
      )
        continue;
      this.signal(
        operation.resource,
        "api-accepted",
        now,
        "center",
        "workloads",
        "API isteği kabul edildi · temsili süreç",
        operation.id,
        operation,
      );
    }
    for (const id of this.operationFingerprints.keys())
      if (!ids.has(id)) this.operationFingerprints.delete(id);
  }
  observe(
    nodes,
    pods,
    {
      now = 0,
      source = this.source,
      simple = false,
      hidden = false,
      snapshotReady = true,
      resources = null,
      snapshotUIDs = null,
      newNodeUIDs = null,
    } = {},
  ) {
    if (source !== this.source) this.reset(source);
    if (!snapshotReady) return;
    const baseline = !this.initialized;
    const snapshotOrigins =
      snapshotUIDs instanceof Set ? snapshotUIDs : new Set(snapshotUIDs || []);
    this.resourceByUID = new Map(
      (resources || [...nodes, ...pods]).map((r) => [r.metadata.uid, r]),
    );
    const liveNodes = new Set();
    for (const node of nodes) {
      const uid = node.metadata.uid,
        ready =
          node.status?.conditions?.find((c) => c.type === "Ready")?.status ||
          "Unknown";
      liveNodes.add(uid);
      let record = this.nodes.get(uid);
      if (!record) {
        const nodeBaseline =
          baseline || (snapshotOrigins.has(uid) && !newNodeUIDs?.has(uid));
        const pending = !nodeBaseline && ready !== "True";
        const fault = ready === "False" && !pending ? 1 : 0;
        record = {
          uid,
          ready,
          pending,
          hadReady: ready === "True" || nodeBaseline,
          from: fault,
          target: fault,
          changedAt: now,
          view: { fault, communication: ready === "Unknown", phase: "ready" },
        };
        this.nodes.set(uid, record);
      } else if (record.ready !== ready) {
        const current = this.nodeVisual(uid, now).fault;
        record.ready = ready;
        if (ready === "True") {
          record.hadReady = true;
          record.pending = false;
        }
        const target = ready === "False" && record.hadReady ? 1 : 0;
        record.from = simple || hidden ? target : current;
        record.target = target;
        record.changedAt = now;
      }
      if (simple || hidden) record.from = record.target;
      this.nodeVisual(uid, now);
    }
    for (const uid of this.nodes.keys())
      if (!liveNodes.has(uid)) this.nodes.delete(uid);
    const live = new Set(),
      previous = new Map(),
      livePods = new Set();
    let animated = [...this.containers.values()].filter(
      (r) => now - r.started < V.CONTAINER_FALL_MS + V.CONTAINER_RECOVER_MS,
    ).length;
    for (const pod of pods) {
      const uid = pod.metadata.uid,
        terminating = Boolean(pod.metadata.deletionTimestamp),
        oldPod = this.previousPods.get(uid),
        podBaseline = baseline || (!oldPod && snapshotOrigins.has(uid));
      livePods.add(uid);
      let entries = this.cachedPods.get(pod);
      if (!entries) {
        entries = observedContainers(pod).map((entry) => ({
          ...entry,
          observation: containerObservation(pod, entry),
        }));
        this.cachedPods.set(pod, entries);
      }
      for (const entry of entries) {
        const key = containerVisualKey(uid, entry.spec.name, entry.role),
          value = entry.observation,
          old = this.previousContainers.get(key);
        live.add(key);
        previous.set(key, value);
        let effect = this.containers.get(key);
        const newRestart = !!old && value.count > old.count;
        const newTermination =
          !!old &&
          value.failure &&
          (!old.failure || (value.finished && value.finished !== old.finished));
        const newLastFailure =
          !!old &&
          value.lastFailure &&
          value.terminationFinished &&
          value.terminationFinished !== old.terminationFinished;
        const trigger =
          !terminating &&
          !value.completed &&
          (newRestart || newTermination || newLastFailure);
        if (trigger && !podBaseline && !simple && !hidden) {
          if (
            this.pulses.size >= V.MAX_CONTAINER_EFFECTS &&
            !this.pulses.has(key)
          ) {
            this.pulses.delete(this.pulses.keys().next().value);
            this.summarized++;
          }
          this.pulses.set(key, {
            uid,
            name: entry.spec.name,
            role: entry.role,
            count: value.count,
            oom:
              value.reason === "OOMKilled" ||
              value.terminationReason === "OOMKilled",
            started: now,
            expires: now + 2800,
            id: `${key}:${value.count}:${value.finished}`,
          });
        }
        if (
          (podBaseline && !terminating && value.failure) ||
          (trigger && !podBaseline)
        ) {
          if (!effect || effect.phase === "settled") {
            const animate =
              !podBaseline &&
              !simple &&
              !hidden &&
              animated < V.MAX_CONTAINER_EFFECTS;
            effect = {
              key,
              uid,
              name: entry.spec.name,
              role: entry.role,
              resource: pod,
              reason:
                value.reason || value.terminationReason || "Container restart",
              count: value.count,
              started: animate ? now : now - V.CONTAINER_FALL_MS,
              phase: animate ? "warning" : "faulted",
              settledInitial: !animate,
              origin: null,
              destination: null,
              view: {
                position: [0, 0, 0],
                yaw: 0,
                pitch: 0,
                roll: 0,
                splash: 0,
                phase: "warning",
              },
              isFailure: value.failure,
              recoverAt: null,
            };
            this.containers.set(key, effect);
            if (animate) animated++;
            else if (!podBaseline && !simple && !hidden) this.summarized++;
          } else {
            // Repeated CrashLoop updates/restarts summarize the same overboard
            // box. A healthy recovery followed by another crash is a new period.
            effect.count = value.count;
            effect.reason =
              value.reason || value.terminationReason || effect.reason;
          }
        }
        if (effect) {
          effect.resource = pod;
          if (!terminating) effect.isFailure = value.failure;
          if (!terminating && (value.recovered || value.completed)) {
            if (effect.recoverAt == null)
              effect.recoverAt = Math.max(
                now,
                effect.started + V.CONTAINER_FALL_MS,
              );
          } else if (
            !terminating &&
            value.failure &&
            effect.phase !== "settled"
          )
            effect.recoverAt = null;
          if (simple || hidden) {
            effect.started = now - V.CONTAINER_FALL_MS;
            if (
              effect.phase === "settled" ||
              (!terminating &&
                !value.failure &&
                (value.recovered || value.completed))
            ) {
              effect.phase = "settled";
              effect.recoverAt = now - V.CONTAINER_RECOVER_MS;
            } else {
              effect.phase = "faulted";
              effect.settledInitial = true;
            }
          }
        }
      }
      if (!podBaseline && !simple && !hidden) {
        if (!oldPod)
          this.signal(
            pod,
            "resource-observed",
            now,
            "workloads",
            "pending",
            "Pod gözlendi · temsili hazırlık",
          );
        if (pod.spec?.nodeName && oldPod?.spec?.nodeName !== pod.spec.nodeName)
          this.signal(
            pod,
            "assigned",
            now,
            "pending",
            "pod",
            "Node ataması gözlendi · temsili yerleştirme",
          );
        const ready = pod.status?.conditions?.some(
          (c) => c.type === "Ready" && c.status === "True",
        );
        const wasReady = oldPod?.status?.conditions?.some(
          (c) => c.type === "Ready" && c.status === "True",
        );
        if (ready && !wasReady)
          this.signal(
            pod,
            "ready",
            now,
            "pod",
            "center",
            "Ready gözlendi · temsili süreç",
            pod.status.conditions.find((c) => c.type === "Ready")
              .lastTransitionTime || "ready",
          );
      }
    }
    for (const key of this.containers.keys())
      if (!live.has(key)) this.containers.delete(key);
    for (const [key, pulse] of this.pulses)
      if (!live.has(key) || pulse.expires <= now || hidden || simple)
        this.pulses.delete(key);
    this.previousContainers = previous;
    this.previousPods = new Map(pods.map((p) => [p.metadata.uid, p]));
    this.signals = this.signals.filter(
      (s) =>
        (s.stage === "api-accepted"
          ? [...this.operationFingerprints.values()].includes(s.uid)
          : livePods.has(s.uid)) && s.expires > now,
    );
    for (const [key, value] of this.signalFingerprints)
      if (!livePods.has(value.uid) && !this.resourceByUID.has(value.uid))
        this.signalFingerprints.delete(key);
    if (hidden || simple) this.signals = [];
    this.initialized = true;
  }
  container(uid, name, role) {
    return this.containers.get(containerVisualKey(uid, name, role));
  }
  needsFrame(now, visibleNodes, visiblePods) {
    for (const record of this.nodes.values()) {
      if (visibleNodes && !visibleNodes.has(record.uid)) continue;
      if (
        Math.abs(record.target - this.nodeVisual(record.uid, now).fault) > 0.001
      )
        return true;
      // The steady flames/smoke have a finite low-cost cycle, not new events.
      if (record.target > 0) return true;
    }
    for (const record of this.containers.values())
      if (
        (!visiblePods || visiblePods.has(record.uid)) &&
        record.phase !== "settled" &&
        (now - record.started < V.CONTAINER_FALL_MS ||
          (record.recoverAt != null &&
            now - record.recoverAt < V.CONTAINER_RECOVER_MS))
      )
        return true;
    return this.signals.some((s) => s.expires > now);
  }
  summary(now) {
    return {
      nodeFaults: [...this.nodes.values()].filter(
        (n) => this.nodeVisual(n.uid, now).fault > 0.001,
      ).length,
      containerFaults: [...this.containers.values()].filter(
        (c) => c.phase !== "settled",
      ).length,
      containerTransitions: [...this.containers.values()].filter(
        (c) =>
          c.phase !== "settled" &&
          now - c.started < V.CONTAINER_FALL_MS + V.CONTAINER_RECOVER_MS,
      ).length,
      processSignals: this.signals.filter((s) => s.expires > now).length,
      summarized: this.summarized,
    };
  }
}

/** Keep a splash/fallen box in actual water, never inside concrete. */
export function waterDropTarget(origin, yaw, obstacles = []) {
  const clear = (x, z) =>
    !obstacles.some(
      (b) =>
        x >= b.minX - 2 &&
        x <= b.maxX + 2 &&
        z >= b.minZ - 2 &&
        z <= b.maxZ + 2,
    );
  for (const distance of [13, 19, 27])
    for (const side of [1, -1]) {
      const x = origin[0] + Math.cos(yaw) * distance * side,
        z = origin[2] - Math.sin(yaw) * distance * side;
      if (clear(x, z)) return [x, 0.45, z];
    }
  for (const distance of [19, 27, 40, 60, 90, 130])
    for (let i = 0; i < 8; i++) {
      const theta = (i * Math.PI) / 4,
        x = origin[0] + Math.cos(theta) * distance,
        z = origin[2] + Math.sin(theta) * distance;
      if (clear(x, z)) return [x, 0.45, z];
    }
  return [origin[0], 0.45, origin[2]];
}

/** Mutates only a reusable view, never canonical data or the parent vessel. */
export function sampleContainerEffect(
  effect,
  now,
  origin,
  pose,
  obstacles = [],
) {
  if (!effect || effect.phase === "settled") return null;
  if (!effect.origin) {
    effect.origin = [...origin];
    effect.originYaw = pose?.yaw || 0;
    effect.originPitch = pose?.pitch || 0;
    effect.originRoll = pose?.roll || 0;
    effect.destination = waterDropTarget(origin, effect.originYaw, obstacles);
  }
  const v = effect.view,
    age = Math.max(0, now - effect.started);
  const warn = V.CONTAINER_WARN_MS,
    fallEnd = V.CONTAINER_FALL_MS - V.SPLASH_MS;
  v.splash = 0;
  if (effect.recoverAt != null && now >= effect.recoverAt) {
    const t = clamp((now - effect.recoverAt) / V.CONTAINER_RECOVER_MS),
      s = smooth(t);
    for (let k = 0; k < 3; k++)
      v.position[k] = lerp(effect.destination[k], origin[k], s);
    v.position[1] += Math.sin(Math.PI * t) * 5;
    v.yaw = lerp(effect.originYaw + 1.3, pose?.yaw || 0, s);
    v.roll = lerp(0.65, pose?.roll || 0, s);
    v.pitch = lerp(0.2, pose?.pitch || 0, s);
    effect.phase = v.phase = t < 1 ? "recovering" : "settled";
    if (t === 1) return null;
  } else if (age < warn) {
    v.position[0] = origin[0] + Math.sin(age * 0.045) * 0.14;
    v.position[1] = origin[1];
    v.position[2] = origin[2];
    v.yaw = pose?.yaw || 0;
    v.pitch = pose?.pitch || 0;
    v.roll = (pose?.roll || 0) + Math.sin(age * 0.055) * 0.05;
    effect.phase = v.phase = "warning";
  } else if (age < fallEnd) {
    const t = clamp((age - warn) / (fallEnd - warn)),
      s = smooth(t);
    for (let k = 0; k < 3; k++)
      v.position[k] = lerp(effect.origin[k], effect.destination[k], s);
    v.position[1] += Math.sin(Math.PI * t) * 7;
    v.yaw = effect.originYaw + 1.3 * s;
    v.pitch = lerp(effect.originPitch, 0.2, s);
    v.roll = lerp(effect.originRoll, 0.65, s);
    effect.phase = v.phase = "falling";
  } else {
    v.position[0] = effect.destination[0];
    v.position[1] = effect.destination[1];
    v.position[2] = effect.destination[2];
    v.yaw = effect.originYaw + 1.3;
    v.pitch = 0.2;
    v.roll = 0.65;
    v.splash = effect.settledInitial ? 0 : clamp((age - fallEnd) / V.SPLASH_MS);
    effect.phase = v.phase = "faulted";
  }
  return v;
}

export function applyNodeFaultPose(pose, visual) {
  const amount = visual?.fault || 0;
  pose.position[1] -= V.NODE_SINK_DEPTH * amount;
  pose.roll += V.NODE_SINK_ROLL * amount;
  pose.pitch -= V.NODE_SINK_PITCH * amount;
  if (visual?.communication) {
    pose.roll += 0.012;
    pose.position[1] -= 0.2;
  }
  return pose;
}
