import { vesselPointToWorld } from "./fleet.js";
import { HARBOR_DIMENSIONS as D } from "../constants/dimensions.js";

export const uidOf = (resource) =>
  resource?.metadata?.uid ||
  `${resource?.kind}:${resource?.metadata?.namespace || ""}/${resource?.metadata?.name || ""}`;

/** Allocation survives UPDATE, filtering, sorting and DELETE. A replacement UID gets a new slot. */
export class HarborSlots {
  constructor() {
    this.nodes = new Map();
    this.pods = new Map();
    this.nextNode = 0;
    this.nextPod = new Map();
    this.freeNodes = [];
    this.freePods = new Map();
    this.windowOffset = 0;
    this.windowSize = 20;
  }
  node(uid) {
    if (!this.nodes.has(uid)) {
      this.freeNodes.sort((a, b) => a - b);
      this.nodes.set(
        uid,
        this.freeNodes.length ? this.freeNodes.shift() : this.nextNode++,
      );
    }
    return this.nodes.get(uid);
  }
  pod(uid, nodeUID = "pending") {
    const key = JSON.stringify([nodeUID, uid]);
    if (!this.pods.has(key)) {
      const free = this.freePods.get(nodeUID) || [];
      free.sort((a, b) => a - b);
      if (free.length) this.pods.set(key, free.shift());
      else {
        const next = this.nextPod.get(nodeUID) || 0;
        this.pods.set(key, next);
        this.nextPod.set(nodeUID, next + 1);
      }
    }
    return this.pods.get(key);
  }
  reconcile(resources) {
    const live = new Map(
      resources.map((resource) => [uidOf(resource), resource]),
    );
    const nodeNames = new Map(
      resources
        .filter((r) => r.kind === "Node")
        .map((r) => [r.metadata.name, uidOf(r)]),
    );
    for (const [uid, slot] of this.nodes)
      if (!live.has(uid)) {
        this.nodes.delete(uid);
        this.freeNodes.push(slot);
        this.nextPod.delete(uid);
        this.freePods.delete(uid);
      }
    for (const [key, slot] of this.pods) {
      const [nodeUID, uid] = JSON.parse(key),
        resource = live.get(uid);
      const expected = resource
        ? nodeNames.get(resource.spec?.nodeName) || "pending"
        : null;
      if (!resource || expected !== nodeUID) {
        this.pods.delete(key);
        if (nodeUID === "pending" || live.has(nodeUID)) {
          const free = this.freePods.get(nodeUID) || [];
          free.push(slot);
          this.freePods.set(nodeUID, free);
        }
      }
    }
  }
}

export function nodeWindow(nodes, slots, requestedPage = 0, size = 20) {
  const maximum = Math.max(0, ...nodes.map((node) => slots.node(uidOf(node))));
  const pageCount = Math.max(1, Math.ceil((maximum + 1) / size));
  const page = Math.min(Math.max(0, requestedPage), pageCount - 1),
    offset = page * size;
  const visible = nodes.filter((node) => {
    const slot = slots.node(uidOf(node));
    return slot >= offset && slot < offset + size;
  });
  return {
    visible,
    page,
    pageCount,
    offset,
    size,
    total: nodes.length,
    first: offset + 1,
    last: Math.min(offset + size, maximum + 1),
  };
}

export function berthPosition(index) {
  const col = index % D.BERTH_COLUMNS;
  // Two vessels fit each 58-unit-wide basin with 13 units of hull-to-hull clearance.
  const x = [-54, 26, -25, 55][col];
  return [
    x,
    0,
    D.BERTH_FIRST_Z + Math.floor(index / D.BERTH_COLUMNS) * D.BERTH_ROW_GAP,
  ];
}

export function craneBerth(index) {
  const col = index % D.BERTH_COLUMNS;
  return {
    id: [0, 1, 1, 2][col],
    x: [-80, 0, 0, 80][col],
    direction: col < 2 ? 1 : -1,
  };
}

export function deckPosition(index) {
  const perTier = D.DECK_COLUMNS * D.DECK_ROWS;
  const slot = index % perTier;
  return [
    ((slot % D.DECK_COLUMNS) - 1) * D.DECK_COL_GAP,
    D.SHIP_DECK_Y +
      D.CONTAINER_HEIGHT / 2 +
      Math.floor(index / perTier) * (D.CONTAINER_HEIGHT + 0.15),
    -8 + Math.floor(slot / D.DECK_COLUMNS) * D.DECK_ROW_GAP,
  ];
}

export function pendingPosition(index) {
  return [
    -104 + (index % 7) * 4.1,
    3.1 + Math.floor(index / 21) * 2.65,
    -44 - Math.floor((index % 21) / 7) * 7,
  ];
}

export function sceneBounds(maxNodeSlot = 1) {
  const last = berthPosition(Math.max(1, maxNodeSlot));
  return {
    minX: D.SHORE_MIN_X,
    maxX: D.SHORE_MAX_X,
    minZ: D.SHORE_START_Z,
    maxZ: Math.max(D.PIER_MIN_END_Z, last[2] + D.SHIP_LENGTH / 2 + 12),
  };
}

export function readyState(resource) {
  if (resource?.metadata?.deletionTimestamp) return "terminating";
  const conditions = resource?.status?.conditions || [];
  const ready = conditions.find((condition) => condition.type === "Ready");
  if (resource?.kind === "Node")
    return ready?.status === "True"
      ? "ready"
      : ready?.status === "False"
        ? "failed"
        : "unknown";
  const statuses = resource?.status?.containerStatuses || [];
  if (
    statuses.some((s) =>
      ["CrashLoopBackOff", "ImagePullBackOff", "ErrImagePull"].includes(
        s.state?.waiting?.reason,
      ),
    )
  )
    return "failed";
  if (resource?.status?.phase === "Succeeded") return "completed";
  if (resource?.status?.phase === "Failed") return "failed";
  if (ready?.status === "True") return "ready";
  if (resource?.status?.phase === "Running") return "starting";
  if (resource?.status?.phase === "Pending") return "pending";
  return "unknown";
}

export function containerProblem(resource) {
  const statuses = [
    ...(resource?.status?.initContainerStatuses || []),
    ...(resource?.status?.containerStatuses || []),
  ];
  for (const status of statuses) {
    const reason =
      status.state?.waiting?.reason || status.state?.terminated?.reason;
    if (reason === "CrashLoopBackOff")
      return {
        reason,
        label: "CrashLoopBackOff · yeniden başlatılıyor",
        symbol: "↻",
      };
    if (["ImagePullBackOff", "ErrImagePull"].includes(reason))
      return { reason, label: `${reason} · image bekleniyor`, symbol: "↓" };
    if (reason === "OOMKilled")
      return { reason, label: "OOMKilled · bellek sınırı", symbol: "!" };
  }
  if (resource?.status?.phase === "Pending")
    return {
      reason: "Pending",
      label:
        resource.status.conditions?.find(
          (c) => c.type === "PodScheduled" && c.status === "False",
        )?.reason || "Node ataması bekleniyor",
      symbol: "…",
    };
  return null;
}
export class ContainerTransitions {
  constructor() {
    this.previous = null;
    this.active = new Map();
  }
  observe(pods, now = performance.now()) {
    const current = new Map();
    for (const pod of pods)
      for (const container of [
        ...(pod.status?.initContainerStatuses || []),
        ...(pod.status?.containerStatuses || []),
      ]) {
        const key = JSON.stringify([uidOf(pod), container.name]),
          termination =
            container.lastState?.terminated || container.state?.terminated;
        const value = {
          count: container.restartCount || 0,
          finished: termination?.finishedAt || "",
          reason: termination?.reason || "",
          uid: uidOf(pod),
          name: container.name,
        };
        current.set(key, value);
        const previous = this.previous?.get(key);
        if (
          previous &&
          (value.count > previous.count ||
            (value.reason === "OOMKilled" &&
              value.finished &&
              value.finished !== previous.finished))
        )
          this.active.set(key, {
            ...value,
            started: now,
            expires: now + 2800,
            oom: value.reason === "OOMKilled",
            id: `${key}:${value.count}:${value.finished}`,
          });
      }
    for (const [key, event] of this.active)
      if (!current.has(key) || now >= event.expires) this.active.delete(key);
    this.previous = current;
    return [...this.active.values()];
  }
  reset() {
    this.previous = null;
    this.active.clear();
  }
}

export const STATE_LABELS = {
  ready: "Hazır",
  failed: "Sorun var",
  unknown: "Durum bilinmiyor",
  starting: "Çalışıyor · hazır değil",
  pending: "Bekliyor",
  completed: "Tamamlandı",
  terminating: "Sonlandırılıyor",
};
export const STATE_COLORS = {
  ready: "#2f946c",
  failed: "#bc4734",
  unknown: "#768597",
  starting: "#d0992c",
  pending: "#d0992c",
  completed: "#3e819b",
  terminating: "#a47a59",
};

export function resourcePosition(resource, nodesByName, slots) {
  const uid = uidOf(resource);
  if (resource.kind === "Node") {
    const index = slots.node(uid) - slots.windowOffset;
    return index >= 0 && index < slots.windowSize
      ? slots.fleet?.pose(uid)?.position || berthPosition(index)
      : null;
  }
  if (resource.kind !== "Pod") return null;
  const node = nodesByName.get(resource.spec?.nodeName);
  if (!node)
    return resource.spec?.nodeName ? null : pendingPosition(slots.pod(uid));
  const nodeUID = uidOf(node);
  const index = slots.node(nodeUID) - slots.windowOffset;
  if (index < 0 || index >= slots.windowSize) return null;
  const berth = berthPosition(index);
  const deck = deckPosition(slots.pod(uid, nodeUID));
  const pose = slots.fleet?.pose(nodeUID);
  return pose
    ? vesselPointToWorld(pose, deck)
    : berth.map((v, index) => v + deck[index]);
}

/** One physical crane per berth. Queue is bounded and is purely visual. */
export class TransferCoordinator {
  constructor() {
    this.previous = null;
    this.active = [];
    this.queue = [];
    this.sequence = 0;
    this.positions = new Map();
  }
  reset() {
    this.previous = null;
    this.active = [];
    this.queue = [];
    this.positions.clear();
  }
  observe(
    pods,
    nodesByName,
    slots,
    reducedMotion = false,
    now = performance.now(),
  ) {
    const current = new Map(pods.map((p) => [uidOf(p), p]));
    const liveNodeNames = new Set(nodesByName.keys());
    this.active = this.active.filter(
      (t) =>
        current.has(t.uid) &&
        liveNodeNames.has(t.nodeName) &&
        current.get(t.uid).spec?.nodeName === t.nodeName &&
        now - t.started < D.TRANSFER_SECONDS * 1000,
    );
    this.queue = this.queue.filter(
      (t) =>
        current.has(t.uid) &&
        liveNodeNames.has(t.nodeName) &&
        current.get(t.uid).spec?.nodeName === t.nodeName,
    );
    if (this.previous && !reducedMotion) {
      for (const [uid, pod] of current) {
        const old = this.previous.get(uid);
        const node = nodesByName.get(pod.spec?.nodeName);
        if (!node || (old && old.spec?.nodeName === pod.spec?.nodeName))
          continue;
        const destination = resourcePosition(pod, nodesByName, slots);
        if (!destination) continue;
        const berthIndex = slots.node(uidOf(node));
        const crane = craneBerth(berthIndex);
        const origin =
          old && !old.spec?.nodeName
            ? this.positions.get(uid) || pendingPosition(slots.pod(uid))
            : [crane.x - 3 * crane.direction, 4.1, destination[2]];
        const staging = [crane.x - 3 * crane.direction, 3.1, -39];
        // A scheduled-first ADD is a short visual arrival; it does not invent a
        // scheduling event or claim the source was observed on the dock.
        const transfer = {
          id: ++this.sequence,
          uid,
          nodeName: pod.spec.nodeName,
          crane: crane.id,
          nodeUID: uidOf(node),
          queuedAt: now,
          wallQueuedAt: performance.now(),
          origin,
          destination,
          deck: deckPosition(slots.pod(uid, uidOf(node))),
          observedPending: Boolean(old && !old.spec?.nodeName),
          staging,
          resource: pod,
        };
        this.queue.push(transfer);
      }
      if (this.queue.length > D.MAX_QUEUED_TRANSFERS)
        this.queue.splice(0, this.queue.length - D.MAX_QUEUED_TRANSFERS);
    }
    if (reducedMotion) {
      this.queue = [];
      this.active = [];
      this.fleet?.syncLoadingOwners(new Set());
    }
    this.previous = current;
    this.positions = new Map(
      pods.map((p) => [uidOf(p), resourcePosition(p, nodesByName, slots)]),
    );
    this.pump(now);
    return this.active;
  }
  pump(now) {
    const finished = this.active.filter(
      (t) => now - t.started >= (t.duration ?? D.TRANSFER_SECONDS * 1000),
    );
    this.active = this.active.filter(
      (t) => now - t.started < (t.duration ?? D.TRANSFER_SECONDS * 1000),
    );
    for (const transfer of finished)
      if (
        !this.queue.some((t) => t.nodeUID === transfer.nodeUID) &&
        !this.active.some((t) => t.nodeUID === transfer.nodeUID)
      )
        this.fleet?.releaseLoading(transfer.nodeUID);
    const occupied = new Set(this.active.map((t) => t.crane));
    for (
      let index = 0;
      index < this.queue.length && this.active.length < D.MAX_TRANSFERS;
    ) {
      const transfer = this.queue[index];
      if (occupied.has(transfer.crane)) {
        index++;
        continue;
      }
      const readiness = this.fleet?.prepareTransfer(transfer, now) || {
        ready: true,
        simple: false,
      };
      if (!readiness.ready) {
        index++;
        continue;
      }
      const pose = this.fleet?.pose(transfer.nodeUID);
      const destination = pose
        ? vesselPointToWorld(pose, transfer.deck)
        : transfer.destination;
      this.active.push({
        ...transfer,
        destination,
        simple: readiness.simple,
        duration: readiness.simple ? 320 : D.TRANSFER_SECONDS * 1000,
        started: now,
      });
      occupied.add(transfer.crane);
      this.queue.splice(index, 1);
    }
    return this.active;
  }
}

const smooth = (t) => t * t * (3 - 2 * t);
export function transferPosition(transfer, now) {
  const t = Math.min(
    1,
    Math.max(
      0,
      (now - transfer.started) /
        (transfer.duration ?? D.TRANSFER_SECONDS * 1000),
    ),
  );
  if (transfer.simple) return [...transfer.destination];
  const height = Math.max(19, transfer.destination[1] + 8);
  if (t === 1) return [...transfer.destination];
  if (transfer.observedPending && transfer.staging) {
    const stage = transfer.staging;
    if (t < 0.07) {
      const s = smooth(t / 0.07);
      return [
        transfer.origin[0],
        transfer.origin[1],
        transfer.origin[2] + (stage[2] - transfer.origin[2]) * s,
      ];
    }
    if (t < 0.16) {
      const s = smooth((t - 0.07) / 0.09);
      return [
        transfer.origin[0] + (stage[0] - transfer.origin[0]) * s,
        stage[1],
        stage[2],
      ];
    }
    if (t < 0.35) {
      const s = smooth((t - 0.16) / 0.19);
      return [stage[0], stage[1] + (height - stage[1]) * s, stage[2]];
    }
    if (t < 0.76) {
      const s = smooth((t - 0.35) / 0.41);
      return [
        stage[0] + (transfer.destination[0] - stage[0]) * s,
        height,
        stage[2] + (transfer.destination[2] - stage[2]) * s,
      ];
    }
    const s = smooth((t - 0.76) / 0.24);
    return [
      transfer.destination[0],
      height + (transfer.destination[1] - height) * s,
      transfer.destination[2],
    ];
  }
  if (t < 0.25)
    return [
      transfer.origin[0],
      transfer.origin[1] + (height - transfer.origin[1]) * smooth(t / 0.25),
      transfer.origin[2],
    ];
  if (t < 0.72) {
    const s = smooth((t - 0.25) / 0.47);
    return [
      transfer.origin[0] + (transfer.destination[0] - transfer.origin[0]) * s,
      height,
      transfer.origin[2] + (transfer.destination[2] - transfer.origin[2]) * s,
    ];
  }
  return [
    transfer.destination[0],
    height + (transfer.destination[1] - height) * smooth((t - 0.72) / 0.28),
    transfer.destination[2],
  ];
}
