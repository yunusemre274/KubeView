import {
  FLEET_DIMENSIONS as F,
  HARBOR_DIMENSIONS as D,
} from "../constants/dimensions.js";
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrap = (value, length) => ((value % length) + length) % length;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const angle = (a, b, t) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * t;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const uidOf = (resource) => resource.metadata.uid;
export const FLEET_OBSTACLES = Object.freeze([
  { id: "mainland", minX: -120, maxX: 120, minZ: -92, maxZ: -30 },
  ...[-80, 0, 80].map((x) => ({
    id: `pier:${x}`,
    minX: x - 11,
    maxX: x + 11,
    minZ: -30,
    maxZ: F.PIER_END,
  })),
]);

/** Exact arc-length rounded rectangle: every progress value is measured in world meters. */
export class HarborRoute {
  constructor({
    minX = F.ROUTE_MIN_X,
    maxX = F.ROUTE_MAX_X,
    minZ = F.ROUTE_MIN_Z,
    maxZ = F.ROUTE_MAX_Z,
    radius = F.ROUTE_RADIUS,
  } = {}) {
    this.bounds = { minX, maxX, minZ, maxZ };
    this.radius = radius;
    this.segments = [];
    this.length = 0;
    const line = (a, b) => {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      this.segments.push({ type: "line", a, b, length, start: this.length });
      this.length += length;
    };
    const arc = (center, start) => {
      const length = (radius * Math.PI) / 2;
      this.segments.push({
        type: "arc",
        center,
        angle: start,
        length,
        start: this.length,
      });
      this.length += length;
    };
    line([minX + radius, minZ], [maxX - radius, minZ]);
    arc([maxX - radius, minZ + radius], -Math.PI / 2);
    line([maxX, minZ + radius], [maxX, maxZ - radius]);
    arc([maxX - radius, maxZ - radius], 0);
    line([maxX - radius, maxZ], [minX + radius, maxZ]);
    arc([minX + radius, maxZ - radius], Math.PI / 2);
    line([minX, maxZ - radius], [minX, minZ + radius]);
    arc([minX + radius, minZ + radius], Math.PI);
    this.bottomStart = this.segments[4].start;
    this.bottomX = maxX - radius;
    // First berth phase starts at its front-water docking gate; later UIDs get
    // fixed eight-slot seed phases, never a total-count-dependent redistribution.
    this.seedOffset = this.bottomStart + (this.bottomX + 54);
  }
  pose(progress) {
    const value = wrap(progress, this.length);
    const segment =
      this.segments.find((s) => value < s.start + s.length) ||
      this.segments.at(-1);
    const t = (value - segment.start) / segment.length;
    if (segment.type === "line") {
      const dx = segment.b[0] - segment.a[0],
        dz = segment.b[1] - segment.a[1];
      return {
        position: [
          lerp(segment.a[0], segment.b[0], t),
          0,
          lerp(segment.a[1], segment.b[1], t),
        ],
        yaw: Math.atan2(dx, dz),
        pitch: 0,
        roll: 0,
      };
    }
    const theta = segment.angle + (t * Math.PI) / 2;
    return {
      position: [
        segment.center[0] + Math.cos(theta) * this.radius,
        0,
        segment.center[1] + Math.sin(theta) * this.radius,
      ],
      yaw: Math.atan2(-Math.sin(theta), Math.cos(theta)),
      pitch: 0,
      roll: 0,
    };
  }
  gateProgress(x) {
    return this.bottomStart + this.bottomX - x;
  }
}

function pointSegmentSq(point, a, b) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    den = dx * dx + dz * dz;
  const t = den
    ? clamp(((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / den, 0, 1)
    : 0;
  return (point[0] - a[0] - t * dx) ** 2 + (point[1] - a[1] - t * dz) ** 2;
}
const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
export function segmentDistance(a, b, c, d) {
  const abC = cross(a, b, c),
    abD = cross(a, b, d),
    cdA = cross(c, d, a),
    cdB = cross(c, d, b);
  if (abC * abD <= 0 && cdA * cdB <= 0) {
    const overlapX =
      Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) <=
      Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0]));
    const overlapZ =
      Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1])) <=
      Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1]));
    if (overlapX && overlapZ) return 0;
  }
  return Math.sqrt(
    Math.min(
      pointSegmentSq(a, c, d),
      pointSegmentSq(b, c, d),
      pointSegmentSq(c, a, b),
      pointSegmentSq(d, a, b),
    ),
  );
}
export function vesselCapsule(pose) {
  const x = Math.sin(pose.yaw) * F.CAPSULE_HALF_AXIS,
    z = Math.cos(pose.yaw) * F.CAPSULE_HALF_AXIS;
  return {
    a: [pose.position[0] - x, pose.position[2] - z],
    b: [pose.position[0] + x, pose.position[2] + z],
    radius: F.CAPSULE_RADIUS,
  };
}
export function vesselsOverlap(a, b, margin = 0) {
  const ca = vesselCapsule(a),
    cb = vesselCapsule(b);
  return (
    segmentDistance(ca.a, ca.b, cb.a, cb.b) <
    ca.radius + cb.radius + margin - 1e-6
  );
}
export function vesselHitsLand(pose, obstacles = FLEET_OBSTACLES) {
  const cap = vesselCapsule(pose);
  return obstacles.some((box) => {
    const inside = (p) =>
      p[0] >= box.minX &&
      p[0] <= box.maxX &&
      p[1] >= box.minZ &&
      p[1] <= box.maxZ;
    if (inside(cap.a) || inside(cap.b)) return true;
    const corners = [
      [box.minX, box.minZ],
      [box.maxX, box.minZ],
      [box.maxX, box.maxZ],
      [box.minX, box.maxZ],
    ];
    return corners.some(
      (corner, i) =>
        segmentDistance(cap.a, cap.b, corner, corners[(i + 1) % 4]) <
        cap.radius - 1e-6,
    );
  });
}
export function interpolatePose(a, b, t) {
  return {
    position: [
      lerp(a.position[0], b.position[0], t),
      lerp(a.position[1] || 0, b.position[1] || 0, t),
      lerp(a.position[2], b.position[2], t),
    ],
    yaw: angle(a.yaw, b.yaw, t),
    pitch: lerp(a.pitch || 0, b.pitch || 0, t),
    roll: lerp(a.roll || 0, b.roll || 0, t),
  };
}
export function sweptClear(from, to, others = [], obstacles = FLEET_OBSTACLES) {
  const turns = Math.abs(
    Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw)),
  );
  const steps = Math.max(
    2,
    Math.ceil(distance(from.position, to.position) / 4),
    Math.ceil(turns / (Math.PI / 36)),
  );
  for (let step = 1; step <= steps; step++) {
    const pose = interpolatePose(from, to, step / steps);
    if (
      vesselHitsLand(pose, obstacles) ||
      others.some((other) => vesselsOverlap(pose, other))
    )
      return false;
  }
  return true;
}
/** Departure stays longitudinal until the entire stern clears the pier tip. */
export function mergeTrajectory(start,end,elapsed,speed=F.DOCK_SPEED){
  const clear={position:[start.position[0],0,F.GATE_Z],yaw:0,pitch:0,roll:0}
  const straightSeconds=Math.max(.01,Math.abs(F.GATE_Z-start.position[2])/Math.max(1,speed)),duration=straightSeconds+F.TURN_SECONDS
  if(elapsed<straightSeconds)return {pose:interpolatePose(start,clear,smooth(clamp(elapsed/straightSeconds,0,1))),done:false,duration}
  const t=clamp((elapsed-straightSeconds)/F.TURN_SECONDS,0,1)
  return {pose:interpolatePose(clear,end,smooth(t)),done:t===1,duration}
}
export function vesselPointToWorld(pose, point, out = []) {
  if (!pose) {
    out[0] = point[0];
    out[1] = point[1];
    out[2] = point[2];
    return out;
  }
  const cr = Math.cos(pose.roll || 0),
    sr = Math.sin(pose.roll || 0),
    cp = Math.cos(pose.pitch || 0),
    sp = Math.sin(pose.pitch || 0),
    cy = Math.cos(pose.yaw || 0),
    sy = Math.sin(pose.yaw || 0);
  const x = point[0] * cr - point[1] * sr,
    y = point[0] * sr + point[1] * cr,
    z = point[2];
  const py = y * cp - z * sp,
    pz = y * sp + z * cp;
  out[0] = pose.position[0] + x * cy + pz * sy;
  out[1] = pose.position[1] + py;
  out[2] = pose.position[2] - x * sy + pz * cy;
  return out;
}
const healthy = (node) =>
  node.status?.conditions?.find((c) => c.type === "Ready")?.status === "True";
const dockX = (slot) => [-54, 26, -25, 55][slot % 4];
const basinFor = (slot) => (dockX(slot) < 0 ? "basin:left" : "basin:right");
export const speedMultiplier = (motion) =>
  motion?.speedMultiplier ??
  (typeof motion?.speed === "number"
    ? motion.speed
    : ({ slow: 0.65, normal: 1, fast: 1.5 }[motion?.speed] ?? 1));

export class FleetSimulator {
  constructor() {
    this.route = new HarborRoute();
    this.ships = new Map();
    this.suspended = new Map();
    this.reservations = new Map();
    this.time = 0;
    this.initialized = false;
    this.motion = { patrol: true, operations: "full" };
    this.pausedUIDs = new Set();
  }
  reset() {
    this.ships.clear();
    this.suspended.clear();
    this.reservations.clear();
    this.initialized = false;
    this.time = 0;
  }
  reconcile(
    nodes,
    slotOf,
    now = this.time,
    { snapshot = true, patrol = true, canonicalUIDs = null } = {},
  ) {
    const live = new Set(nodes.map(uidOf));
    for (const [uid, ship] of this.ships)
      if (!live.has(uid)) {
        this.releaseReservation(ship);
        this.ships.delete(uid);
        if (canonicalUIDs?.has(uid)) this.suspended.set(uid, ship);
      }
    if (canonicalUIDs)
      for (const uid of this.suspended.keys())
        if (!canonicalUIDs.has(uid)) this.suspended.delete(uid);
    for (const node of nodes) {
      const uid = uidOf(node),
        slot = slotOf(uid),
        existing = this.ships.get(uid);
      if (existing) {
        existing.node = node;
        existing.healthy = healthy(node);
        continue;
      }
      const restored = this.suspended.get(uid);
      if (restored) {
        this.suspended.delete(uid);
        restored.node = node;
        restored.healthy = healthy(node);
        restored.slot = slot;
        this.ships.set(uid, restored);
        continue;
      }
      const progress = wrap(
        this.route.seedOffset + (slot * this.route.length) / F.VISIBLE_CAPACITY,
        this.route.length,
      );
      const seed = this.route.pose(progress);
      const ship = {
        uid,
        node,
        slot,
        progress,
        pose: seed,
        mode: "patrolling",
        modeElapsed: 0,
        speed: 0,
        cruiseVelocity: F.PATROL_SPEED,
        healthy: healthy(node),
        waitingReason: null,
        request: null,
        hold: false,
      };
      if (this.initialized && this.ships.size) {
        const gap = [...this.ships.values()].every(
          (other) =>
            !vesselsOverlap(seed, other.pose, 5) &&
            (!this.onRoute(other) ||
              this.circularGap(progress, other.progress) >= F.HEADWAY),
        );
        if (!gap) {
          ship.pose = {
            position: [
              dockX(slot),
              0,
              37 + Math.floor(slot / 4) * D.BERTH_ROW_GAP,
            ],
            yaw: 0,
            pitch: 0,
            roll: 0,
          };
          ship.mode = "waiting-admission";
          ship.waitingReason = "Güvenli rota aralığı bekleniyor";
        }
      }
      if (!patrol) {
        ship.pose = {
          position: [
            dockX(slot),
            0,
            37 + Math.floor(slot / 4) * D.BERTH_ROW_GAP,
          ],
          yaw: 0,
          pitch: 0,
          roll: 0,
        };
        ship.mode = "waiting-admission";
      }
      this.ships.set(uid, ship);
    }
    if (snapshot) this.initialized = true;
  }
  onRoute(ship) {
    return ship.mode === "patrolling" || ship.mode === "route-hold";
  }
  circularGap(a, b) {
    const d = Math.abs(a - b);
    return Math.min(d, this.route.length - d);
  }
  pose(uid) {
    return this.ships.get(uid)?.pose || null;
  }
  releaseReservation(ship) {
    for (const [key, uid] of this.reservations)
      if (uid === ship.uid) this.reservations.delete(key);
    ship.mergeGate = null;
  }
  requestDock(uid, now = this.time) {
    const ship = this.ships.get(uid);
    if (!ship) return null;
    if (!ship.request)
      ship.request = { at: now, deadline: now + F.JOB_WAIT_SECONDS };
    return ship.request;
  }
  prepareTransfer(job, nowMS) {
    const ship = this.ships.get(job.nodeUID),
      now = nowMS / 1000;
    if (
      !ship ||
      !ship.healthy ||
      this.motion.reduced ||
      this.motion.paused ||
      this.motion.operations !== "full" ||
      this.motion.patrol === false ||
      this.pausedUIDs.has(ship.uid)
    )
      return { ready: true, simple: true };
    this.requestDock(ship.uid, now);
    if (ship.mode === "docked") return { ready: true, simple: false };
    if (
      now - (job.queuedAt ?? nowMS) / 1000 >= F.JOB_WAIT_SECONDS ||
      (job.wallQueuedAt != null &&
        performance.now() - job.wallQueuedAt >= F.JOB_WAIT_SECONDS * 1000)
    ) {
      ship.request = null;
      return { ready: true, simple: true };
    }
    return { ready: false };
  }
  releaseLoading(uid) {
    const ship = this.ships.get(uid);
    if (ship && ship.mode === "docked") {
      ship.mode = "departing";
      ship.modeElapsed = 0;
      ship.startPose = { ...ship.pose, position: [...ship.pose.position] };
      ship.request = null;
    }
  }
  syncLoadingOwners(owners) {
    for (const ship of this.ships.values())
      if (!owners.has(ship.uid)) {
        if (this.onRoute(ship)) ship.request = null;
        if (ship.mode === "docked") this.releaseLoading(ship.uid);
      }
  }
  mergeGates(exceptUID) {
    return [...this.ships.values()]
      .filter((ship) => ship.uid !== exceptUID && ship.mode === "merging")
      .map((ship) => ({
        uid: ship.uid,
        progress: ship.mergeGate ?? this.route.gateProgress(dockX(ship.slot)),
      }));
  }
  canMerge(ship) {
    const target = this.route.gateProgress(dockX(ship.slot)),
      others = [...this.ships.values()].filter(
        (other) => other.uid !== ship.uid,
      );
    if (
      others.some(
        (other) =>
          this.onRoute(other) &&
          this.circularGap(target, other.progress) <= F.HEADWAY + 1,
      )
    )
      return false;
    if (
      this.mergeGates(ship.uid).some(
        (gate) => this.circularGap(target, gate.progress) <= F.HEADWAY + 1,
      )
    )
      return false;
    const start =
      ship.mode === "waiting-admission"
        ? { position: [dockX(ship.slot), 0, F.MERGE_HOLD_Z], yaw: 0 }
        : ship.pose;
    const clear={position:[dockX(ship.slot),0,F.GATE_Z],yaw:0,pitch:0,roll:0},end=this.route.pose(target),poses=others.map(other=>other.pose)
    return sweptClear(start,clear,poses)&&sweptClear(clear,end,poses)

  }
  tick(dt, now, motion = this.motion, controls = {}) {
    this.time = now;
    this.motion = motion;
    this.pausedUIDs = new Set(controls.pausedUIDs || []);
    if (dt <= 0 || motion.paused || motion.reduced) {
      for (const ship of this.ships.values()) {
        ship.speed = 0;
        ship.hold = !!(
          motion.paused ||
          motion.reduced ||
          this.pausedUIDs.has(ship.uid) ||
          !ship.healthy
        );
      }
      return;
    }
    const factor = speedMultiplier(motion);
    // Fixed, bounded substeps keep sweep checks safe after a slow browser frame.
    const steps = Math.max(1, Math.ceil(Math.min(dt, 0.2) / 0.04)),
      step = Math.min(dt, 0.2) / steps;
    for (let iteration = 0; iteration < steps; iteration++)
      for (const ship of this.ships.values()) {
        const stopped =
          !ship.healthy ||
          this.pausedUIDs.has(ship.uid) ||
          motion.patrol === false;
        ship.hold = stopped;
        ship.speed = 0;
        if (stopped) {
          ship.cruiseVelocity = 0;
          ship.waitingReason = !ship.healthy
            ? "Node Ready değil · son pozisyon korunuyor"
            : this.pausedUIDs.has(ship.uid)
              ? "Kullanıcı duraklattı"
              : "Devriye kapalı";
          continue;
        }
        const others = [...this.ships.values()]
          .filter((other) => other.uid !== ship.uid)
          .map((other) => other.pose);
        let candidate = null,
          nextMode = null,
          nextProgress = ship.progress;
        if (ship.mode === "waiting-admission") {
          if (
            this.canMerge(ship) &&
            !vesselHitsLand(ship.pose) &&
            (!this.reservations.has(basinFor(ship.slot)) ||
              this.reservations.get(basinFor(ship.slot)) === ship.uid)
          ) {
            this.reservations.set(basinFor(ship.slot), ship.uid);
            ship.request = { at: now, deadline: Infinity };
            ship.mode = "departing";
            ship.modeElapsed = 0;
            ship.startPose = {
              ...ship.pose,
              position: [...ship.pose.position],
            };
          }
          continue;
        }
        if (
          ship.request &&
          ship.mode === "patrolling" &&
          ship.pose.position[2] > F.PIER_END + 45 &&
          Math.abs(ship.pose.position[0] - dockX(ship.slot)) < 38
        ) {
          const key = basinFor(ship.slot);
          if (
            !this.reservations.has(key) ||
            this.reservations.get(key) === ship.uid
          ) {
            this.reservations.set(key, ship.uid);
            ship.mode = "approaching";
            ship.modeElapsed = 0;
            ship.startPose = {
              ...ship.pose,
              position: [...ship.pose.position],
            };
            ship.waitingReason = null;
          }
        }
        if (ship.mode === "patrolling" || ship.mode === "route-hold") {
          const routeLeaders = [...this.ships.values()]
            .filter((other) => other.uid !== ship.uid && this.onRoute(other))
            .map((other) => other.progress);
          const virtualLeaders = this.mergeGates(ship.uid).map(
            (gate) => gate.progress,
          );
          const lead =
            [...routeLeaders, ...virtualLeaders]
              .map((progress) =>
                wrap(progress - ship.progress, this.route.length),
              )
              .filter((gap) => gap > 0)
              .sort((a, b) => a - b)[0] ?? Infinity;
          const desired =
            F.PATROL_SPEED * factor * clamp((lead - F.HEADWAY) / 40, 0, 1);
          ship.cruiseVelocity = Math.max(
            0,
            (ship.cruiseVelocity || 0) +
              clamp(desired - (ship.cruiseVelocity || 0), -12 * step, 3 * step),
          );
          const advance = Math.max(
            0,
            Math.min(ship.cruiseVelocity * step, lead - F.HEADWAY),
          );
          nextProgress = wrap(ship.progress + advance, this.route.length);
          candidate = this.route.pose(nextProgress);
          ship.waitingReason = advance
            ? ""
            : "Öndeki geminin güvenli aralığı bekleniyor";
          nextMode = advance ? "patrolling" : "route-hold";
        } else if (ship.mode === "approaching") {
          const t = clamp((ship.modeElapsed + step) / F.TURN_SECONDS, 0, 1);
          const end = {
            position: [dockX(ship.slot), 0, F.GATE_Z],
            yaw: 0,
            pitch: 0,
            roll: 0,
          };
          candidate = interpolatePose(ship.startPose, end, smooth(t));
          if (t === 1) nextMode = "docking";
        } else if (ship.mode === "docking") {
          const z = Math.max(
            F.DOCK_Z,
            ship.pose.position[2] - F.DOCK_SPEED * factor * step,
          );
          candidate = {
            position: [dockX(ship.slot), 0, z],
            yaw: 0,
            pitch: 0,
            roll: 0,
          };
          if (z === F.DOCK_Z) nextMode = "docked";
        } else if (ship.mode === "docked") {
          ship.waitingReason = "Vinç yüklemesi · görsel rezervasyon";
          continue;
        } else if (ship.mode === "departing") {
          const z = Math.min(
            F.MERGE_HOLD_Z,
            ship.pose.position[2] + F.DOCK_SPEED * factor * step,
          );
          candidate = {
            position: [dockX(ship.slot), 0, z],
            yaw: 0,
            pitch: 0,
            roll: 0,
          };
          if (z === F.MERGE_HOLD_Z) nextMode = "merge-wait";
        } else if (ship.mode === "merge-wait") {
          if (this.canMerge(ship)) {
            ship.mergeGate = this.route.gateProgress(dockX(ship.slot));
            ship.mode = "merging";
            ship.modeElapsed = 0;
            ship.blockedMerge = 0;
            ship.startPose = {
              ...ship.pose,
              position: [...ship.pose.position],
            };
          } else ship.waitingReason = "Güvenli çıkış aralığı bekleniyor";
          continue;
        } else if (ship.mode === "merge-retreat") {
          const t = clamp((ship.modeElapsed + step) / 1.1, 0, 1),
            end = {
              position: [dockX(ship.slot), 0, F.MERGE_HOLD_Z],
              yaw: 0,
              pitch: 0,
              roll: 0,
            };
          candidate = interpolatePose(ship.startPose, end, smooth(t));
          if (t === 1) nextMode = "merge-wait";
        } else if (ship.mode === "merging") {
          const end=this.route.pose(this.route.gateProgress(dockX(ship.slot))),transition=mergeTrajectory(ship.startPose,end,ship.modeElapsed+step,F.DOCK_SPEED*factor)
          candidate=transition.pose
          if(transition.done){nextMode='patrolling';nextProgress=this.route.gateProgress(dockX(ship.slot))}

        }
        if (candidate && sweptClear(ship.pose, candidate, others)) {
          ship.speed = distance(ship.pose.position, candidate.position) / step;
          ship.pose = candidate;
          ship.progress = nextProgress;
          ship.modeElapsed += step;
          if (nextMode && nextMode !== ship.mode) {
            ship.mode = nextMode;
            ship.modeElapsed = 0;
            if (nextMode === "patrolling") {
              this.releaseReservation(ship);
              ship.waitingReason = null;
            }
          }
        } else if (candidate) {
          ship.waitingReason = "Fiziksel açıklık bekleniyor";
          if (ship.mode === "merging") {
            ship.blockedMerge = (ship.blockedMerge || 0) + step;
            if (ship.blockedMerge > 0.3) {
              ship.mode = "merge-retreat";
              ship.modeElapsed = 0;
              ship.mergeGate = null;
              ship.startPose = {
                ...ship.pose,
                position: [...ship.pose.position],
              };
              ship.waitingReason = "Güvenli bekleme çizgisine geri çekiliyor";
            }
          }
        }
        if (
          ship.request &&
          ship.request.deadline < now &&
          ship.mode === "patrolling"
        )
          ship.request = null;
      }
  }
  snapshot() {
    return [...this.ships.values()].map((ship) => ({
      uid: ship.uid,
      name: ship.node.metadata.name,
      slot: ship.slot,
      progress: ship.progress,
      position: [...ship.pose.position],
      yaw: ship.pose.yaw,
      pitch: ship.pose.pitch,
      roll: ship.pose.roll,
      state: ship.mode,
      speed: ship.speed,
      paused: ship.hold,
      healthy: ship.healthy,
      reason: ship.waitingReason,
      reservation:
        [...this.reservations].find(([, uid]) => uid === ship.uid)?.[0] || null,
      eligibleForDock:
        ship.mode === "patrolling" &&
        ship.pose.position[2] > F.PIER_END + 45 &&
        Math.abs(ship.pose.position[0] - dockX(ship.slot)) < 38,
    }));
  }
}
