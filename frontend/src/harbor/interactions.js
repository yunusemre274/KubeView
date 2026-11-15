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
      role: role === "init" && container.restartPolicy === "Always" ? "sidecar" : role,
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

// HTML labels stay beside their real anchor, but remain readable at the edge
// of the canvas. Dimensions are cached on mount/content/viewport changes, not
// read from layout during the scene's frame loop.
export function resourceLabelPosition(x, y, width, height, viewportWidth, viewportHeight, pod = false, offset = 0, obstacles = []) {
  const halfWidth = Math.min(width, Math.max(0, viewportWidth - 32)) / 2;
  const halfHeight = Math.min(height, Math.max(0, viewportHeight - 32)) / 2;
  const clamp = (value, half, extent) => Math.max(16 + half, Math.min(extent - 16 - half, value));
  const preferred = [clamp(x + offset + (pod ? halfWidth + 26 : 0), halfWidth, viewportWidth), clamp(y - (pod ? 12 : 0), halfHeight, viewportHeight)];
  if (!obstacles.length) return [preferred[0] - offset, preferred[1]];
  const boxes = obstacles.slice(0, 8);
  const candidates = [preferred];
  for (const box of boxes) candidates.push(
    [box.left - halfWidth - 8, preferred[1]], [box.right + halfWidth + 8, preferred[1]],
    [preferred[0], box.top - halfHeight - 8], [preferred[0], box.bottom + halfHeight + 8],
  );
  let best = preferred, bestOverlap = Infinity, bestDistance = Infinity;
  for (const candidate of candidates) {
    const cx = clamp(candidate[0], halfWidth, viewportWidth), cy = clamp(candidate[1], halfHeight, viewportHeight);
    let overlap = 0;
    for (const box of boxes) overlap += Math.max(0, Math.min(cx + halfWidth, box.right + 8) - Math.max(cx - halfWidth, box.left - 8)) * Math.max(0, Math.min(cy + halfHeight, box.bottom + 8) - Math.max(cy - halfHeight, box.top - 8));
    const distance = (cx - preferred[0]) ** 2 + (cy - preferred[1]) ** 2;
    if (overlap < bestOverlap || overlap === bestOverlap && distance < bestDistance) { best = [cx, cy]; bestOverlap = overlap; bestDistance = distance; }
    if (bestOverlap === 0 && bestDistance === 0) break;
  }
  return [best[0] - offset, best[1]];
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
    const amount = active.simple && !active.preserveScale ? smooth(progress) : 1;
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
