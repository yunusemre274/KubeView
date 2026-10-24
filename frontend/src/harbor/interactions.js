// Scene picking never changes Kubernetes identity. Display labels remain separate.
export function containersForPod(pod) {
  const groups = [
    ["container", pod?.spec?.containers],
    ["init", pod?.spec?.initContainers],
    ["ephemeral", pod?.spec?.ephemeralContainers],
  ];
  const entries = groups.flatMap(([role, items]) =>
    (items || []).map((container) => ({
      containerName: container.name,
      role,
      container,
    })),
  );
  return entries.length
    ? entries
    : [{ containerName: undefined, role: "pod", container: null }];
}
export function containerInstances(pods) {
  return pods.flatMap((resource) =>
    containersForPod(resource).map((container, index, containers) => ({
      resource,
      ...container,
      index,
      count: containers.length,
    })),
  );
}
export class PointerGesture {
  constructor(threshold = 5) {
    this.threshold = threshold;
    this.start = null;
    this.moved = false;
    this.lastButton = 0;
    this.targetKey = null;
  }
  down(event) {
    this.start = [event.clientX, event.clientY];
    this.moved = false;
    this.lastButton = event.button ?? 0;
    this.targetKey = null;
  }
  move(event) {
    if (
      this.start &&
      Math.hypot(event.clientX - this.start[0], event.clientY - this.start[1]) >
        this.threshold
    )
      this.moved = true;
  }
  up(event) {
    this.move(event);
  }
  target(key) {
    this.targetKey = key;
  }
  canSelect(event, key) {
    return (
      (!key || this.targetKey === key) &&
      this.lastButton === 0 &&
      !this.moved &&
      (event?.delta == null || event.delta <= this.threshold)
    );
  }
}

/** A visual handover only: the canonical resource and its Ready state never wait. */
export function arrivalVisual(
  queued,
  active,
  nowMS,
  wallNow = performance.now(),
) {
  const window = 320;
  const smooth = (value) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  if (active) {
    const progress = Math.max(
      0,
      Math.min(1, (nowMS - active.started) / (active.duration ?? window)),
    );
    const amount = active.simple ? smooth(progress) : 1;
    return {
      loading: progress < 1,
      stage: active.simple ? "arrival" : "transfer",
      scale: amount,
      opacity: amount,
    };
  }
  if (queued) {
    const visualRemaining = 10000 - (nowMS - queued.queuedAt),
      wallRemaining =
        queued.wallQueuedAt == null
          ? Infinity
          : 10000 - (wallNow - queued.wallQueuedAt);
    const amount = smooth(Math.min(visualRemaining, wallRemaining) / window);
    return { loading: true, stage: "queued", scale: amount, opacity: amount };
  }
  return { loading: false, stage: "settled", scale: 1, opacity: 1 };
}
