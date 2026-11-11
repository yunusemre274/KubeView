import { writeCargoMatrix } from "./cargoTransforms.js";
import React, {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  HARBOR_DIMENSIONS as D,
  FLEET_DIMENSIONS as F,
  VISUAL_EVENT_DIMENSIONS as V,
} from "../constants/dimensions.js";
import {
  Box,
  Blocks,
  CargoShip,
  Cylinder,
  Gantry,
  Hangar,
  Lettering,
  OperationsBuilding,
  UNIT_BOX,
  HULL,
} from "./assets.jsx";
import FacilityResources from "./FacilityResources.jsx";
import {
  VisualLifecycle,
  sampleContainerEffect,
  applyNodeFaultPose,
  confirmedRemoval,
  visibleContainerMarkers,
  observedNodeArrivals,
} from "./visualLifecycle.js";
import LifecycleEffects, { NodeArrivalCaption } from "./LifecycleEffects.jsx";
import MeasuredTraffic from "./MeasuredTraffic.jsx";
import WorkspaceHarbors from "./WorkspaceHarbors.jsx";
import { cacheVisualView, pruneVisualViews } from "./visualViews.js";
import { captureHarborCamera, restoreHarborCamera, harborFitSamples, fitHarborView, updateHarborDepth } from "./cameraViews.js";
import { harborWorldPosition as harborPosition, nearbyHarbors } from "../world/workspace.js";
import WorldFacilities, { FacilityHit } from "./WorldFacilities.jsx";
import Ocean, { ShipWake } from "./Ocean.jsx";
import {
  createWaterState,
  advanceWaterState,
  sampleWater,
  waterNeedsFrame,
} from "./waterModel.js";
import {
  FleetSimulator,
  vesselPointToWorld,
  speedMultiplier,
  FLEET_OBSTACLES,
} from "./fleet.js";
import {
  containersForPod,
  containerInstances,
  PointerGesture,
  arrivalVisual,
} from "./interactions.js";
import { hashColor, makeMaterials, makeSurfaceMaps } from "./materials.js";
import {
  HarborSlots,
  TransferCoordinator,
  ContainerTransitions,
  containerProblem,
  berthPosition,
  craneBerth,
  deckPosition,
  pendingPosition,
  nodeWindow,
  readyState,
  resourcePosition,
  sceneBounds,
  STATE_COLORS,
  STATE_LABELS,
  transferPosition,
  uidOf,
} from "./layout.js";

const EMPTY_OPERATIONS = Object.freeze([]);
const EMPTY_TOMBSTONES = Object.freeze({});
const EMPTY_SNAPSHOT_UIDS = new Set();

const item = (p, s, c, r) => ({ p, s, c, r });
const labelStyle = {
  background: "#fffffff2",
  color: "#223544",
  border: "1px solid #d5dfe3",
  padding: "5px 9px",
  borderRadius: 5,
  font: "500 12px/1.35 system-ui, sans-serif",
  whiteSpace: "nowrap",
  boxShadow: "0 2px 6px #102c3a15",
  pointerEvents: "none",
  userSelect: "none",
};
const statusLabelStyle = { fontSize: 12, color: "#536776", marginTop: 2 };

function Terrain({ materials: m, bounds, lowDetail }) {
  const blocks = useMemo(() => {
    const concrete = [item([0, -0.5, -61], [240, 3, 62])],
      edging = [],
      rail = [],
      yellow = [],
      road = [],
      black = [],
      white = [];
    const pierLength = bounds.maxZ - D.PIER_START_Z;
    for (const x of [-80, 0, 80]) {
      concrete.push(
        item(
          [x, -0.5, D.PIER_START_Z + pierLength / 2],
          [D.PIER_WIDTH, 3, pierLength],
        ),
      );
      for (const side of [-1, 1]) {
        edging.push(
          item(
            [x + side * 10.8, 1.08, D.PIER_START_Z + pierLength / 2],
            [0.45, 0.35, pierLength],
          ),
        );
        rail.push(
          item(
            [x + side * 8, 1.06, D.PIER_START_Z + pierLength / 2 - 7],
            [0.25, 0.15, pierLength + 14],
          ),
        );
        yellow.push(
          item(
            [x + side * 9.8, 1.28, D.PIER_START_Z + pierLength / 2],
            [0.13, 0.03, pierLength],
          ),
        );
        for (let z = -21; z < bounds.maxZ; z += 12) {
          black.push(item([x + side * 11.05, 0.1, z], [0.65, 2.4, 2.8]));
          black.push(item([x + side * 9, 1.8, z + 2.5], [0.65, 1.2, 0.65]));
          black.push(item([x + side * 9, 2.3, z + 2.5], [1.8, 0.3, 0.65]));
        }
      }
      for (let z = -21; z < bounds.maxZ; z += 10) {
        edging.push(item([x, 1.025, z], [21.4, 0.025, 0.055]));
        yellow.push(item([x, 1.04, z], [0.22, 0.03, 3.8]));
      }
      // Concrete panel joins are visible without increasing triangle complexity.
      edging.push(
        item(
          [x, 1.025, D.PIER_START_Z + pierLength / 2],
          [0.06, 0.025, pierLength],
        ),
      );
    }
    road.push(item([0, 1.04, -38], [239, 0.04, 11]));
    for (let x = -113; x < 120; x += 9)
      white.push(item([x, 1.09, -38], [4, 0.025, 0.19]));
    yellow.push(
      item([0, 1.08, -31.9], [239, 0.03, 0.22]),
      item([0, 1.08, -44], [239, 0.03, 0.2]),
    );
    for (let x = -120; x <= 120; x += 12) {
      rail.push(item([x, 2.4, -91], [0.15, 3.2, 0.15]));
    }
    rail.push(
      item([0, 3.4, -91], [240, 0.12, 0.12]),
      item([0, 1.9, -91], [240, 0.12, 0.12]),
    );
    // Pending apron markings are a location label, never a synthetic Node resource.
    yellow.push(
      item([-92, 1.04, -56], [34, 0.035, 0.25]),
      item([-109, 1.04, -56], [0.25, 0.035, 24]),
      item([-75, 1.04, -56], [0.25, 0.035, 24]),
    );
    return { concrete, edging, rail, yellow, road, black, white };
  }, [bounds.maxZ]);
  return (
    <group>
      <Blocks items={blocks.concrete} material={m.concrete} />
      <Blocks items={blocks.edging} material={m.edge} />
      <Blocks items={blocks.rail} material={m.rail} />
      <Blocks items={blocks.yellow} material={m.yellow} castShadow={false} />
      <Blocks items={blocks.road} material={m.road} castShadow={false} />
      <Blocks items={blocks.black} material={m.black} />
      <Blocks items={blocks.white} material={m.white} castShadow={false} />
      <Lettering
        position={[-92, 1.1, -57]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={m.dark}
        size={1.5}
      >
        BEKLEME ALANI
      </Lettering>
      <Lettering
        position={[0, 1.1, 89]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={m.dark}
        size={2.4}
      >
        02
      </Lettering>
      <Lettering
        position={[-80, 1.1, 89]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={m.dark}
        size={2.4}
      >
        01
      </Lettering>
      <Lettering
        position={[80, 1.1, 89]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={m.dark}
        size={2.4}
      >
        03
      </Lettering>
      {!lowDetail && (
        <group>
          {/* Small site equipment establishes scale without pretending to be cluster data. */}
          {[-10, 0, 10].map((x, i) => (
            <group key={x} position={[x, 1.3, -41]}>
              <Box
                position={[0, 0.45, 0]}
                scale={[3.9, 0.5, 2.3]}
                material={m.rust}
              />
              <Box
                position={[-1.1, 0.9, 0]}
                scale={[1.1, 0.7, 2]}
                material={m.yellow}
              />
              {[-1.2, 1.2].map((xx) => (
                <Cylinder
                  key={xx}
                  position={[xx, 0, 0]}
                  scale={[0.5, 2.7, 0.5]}
                  rotation={[Math.PI / 2, 0, 0]}
                  material={m.black}
                />
              ))}
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

function ResourceLabel({
  resource,
  position,
  selected,
  hover,
  labels,
  offset = 0,
  visualStatus,
  onlyWhileLoading = false,
}) {
  const ref = useRef(),
    visualRef = useRef(),
    nameRef = useRef(),
    last = useRef({});
  useFrame(() => {
    if (!visualStatus) return;
    const visual = visualStatus(),
      opacity = visual.opacity ?? 1;
    if (ref.current && last.current.opacity !== opacity) {
      ref.current.style.opacity = String(opacity);
      last.current.opacity = opacity;
    }
    const visible = !!(visual.loading || visual.orphan);
    const show = (!onlyWhileLoading || visible) && !visual.suppressLabel;
    if (ref.current && last.current.show !== show) {
      ref.current.style.display = show ? "block" : "none";
      last.current.show = show;
    }
    const hideName = !!(onlyWhileLoading && visual.loading && !visual.orphan);
    if (nameRef.current && last.current.hideName !== hideName) {
      nameRef.current.style.display = hideName ? "none" : "inline-block";
      last.current.hideName = hideName;
    }
    const visualLabel = visual.orphan
      ? "orphan"
      : visual.loading
        ? "loading"
        : "";
    if (visualRef.current && last.current.loading !== visualLabel) {
      if (visualRef.current) {
        visualRef.current.hidden = !visible;
        visualRef.current.textContent = visual.orphan
          ? "Atanmış Node kaydı yok · son görsel konum"
          : visual.loading
            ? "Görsel yükleme sürüyor"
            : "";
      }
      last.current.loading = visualLabel;
    }
  });
  if (!labels && !selected && !hover && !onlyWhileLoading) return null;
  const state = readyState(resource);
  return (
    <Html
      style={{ pointerEvents: "none" }}
      center
      position={position}
      zIndexRange={[8, 0]}
    >
      <div
        ref={ref}
        style={{
          ...labelStyle,
          borderColor: selected ? "#4b89d1" : "#d5dfe3",
          marginLeft: offset,
          ...(resource.kind === "Pod"
            ? { transform: "translate(calc(50% + 26px), -12px)" }
            : {}),
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: 3,
            background: STATE_COLORS[state],
            marginRight: 6,
            verticalAlign: "middle",
          }}
        />
        <span
          ref={nameRef}
          title={resource.metadata?.name}
          style={{
            display: "inline-block",
            maxWidth: resource.kind === "Pod" ? 220 : undefined,
            overflow: "hidden",
            textOverflow: "ellipsis",
            verticalAlign: "middle",
          }}
        >
          {resource.metadata?.name}
        </span>
        {(selected || hover) && (
          <div style={statusLabelStyle}>
            {resource.kind} ·{" "}
            {containerProblem(resource)?.label || STATE_LABELS[state]}
            {resource.kind === "Pod"
              ? ` · ${resource.metadata?.namespace || "default"}`
              : ""}
          </div>
        )}
        <div
          ref={visualRef}
          className="harbor-visual-status"
          hidden
          style={{
            fontSize: 12,
            color: "#805a13",
            marginTop: 3,
            fontWeight: 500,
          }}
          aria-live="polite"
        />
      </div>
    </Html>
  );
}

const DEFAULT_MOTION = Object.freeze({
  patrol: false,
  sea: false,
  bob: false,
  wake: false,
  speedMultiplier: 1,
  seaAmplitude: 0,
  operations: "simple",
  reduced: false,
  paused: false,
});
function FleetFrame({
  fleet,
  clock,
  waterState,
  motion,
  shipControls,
  visible,
  coordinator,
  selectedUID,
  onShipMotionChange,
  lifecycle,
  slots,
  worldOffset = [0, 0],
  primary = true,
}) {
  const { invalidate, scene } = useThree(),
    lastReport = useRef(-Infinity),
    waterSample = useRef({});
  useEffect(() => {
    invalidate();
  }, [motion, shipControls, visible, invalidate]);
  useEffect(() => {
    if (!primary) return;
    const snapshot = () => fleet.snapshot();
    scene.userData.fleetStates = snapshot;
    return () => {
      if (scene.userData.fleetStates === snapshot)
        delete scene.userData.fleetStates;
    };
  }, [fleet, scene, primary]);
  useEffect(() => {
    const probe = globalThis.__KUBEVIEW_BENCHMARK__;
    if (!probe || !primary) return;
    // Diagnostic setup only, outside measured time. Canonical resources are untouched.
    const reset = () => {
      const ships = [...fleet.ships.values()];
      const slots = new Map(ships.map((ship) => [ship.uid, ship.slot]));
      fleet.reset();
      clock.current = 0;
      waterState.current = createWaterState(0);
      waterState.current.strength = motion.sea
        ? (motion.seaAmplitude ??
          (typeof motion.seaStrength === "number"
            ? motion.seaStrength
            : ({ calm: 0.15, light: 0.45, noticeable: 1 }[motion.seaStrength] ??
              0.45)))
        : 0;
      fleet.reconcile(
        ships.map((ship) => ship.node),
        (uid) => slots.get(uid),
        0,
        { snapshot: true, patrol: motion.patrol },
      );
      probe.visualHold = true;
      lastReport.current = -Infinity;
      invalidate();
    };
    probe.resetVisual = reset;
    return () => {
      if (probe.resetVisual === reset) delete probe.resetVisual;
    };
  }, [fleet, clock, waterState, motion, invalidate, primary]);
  useFrame((_, delta) => {
    const enabled =
        visible &&
        !motion.paused &&
        !motion.reduced &&
        !globalThis.__KUBEVIEW_BENCHMARK__?.visualHold,
      dt = enabled ? Math.min(0.2, Math.max(0, delta)) : 0;
    if (dt && primary) clock.current += dt;
    const amplitude = motion.sea
      ? (motion.seaAmplitude ??
        (typeof motion.seaStrength === "number"
          ? motion.seaStrength
          : ({ calm: 0.15, light: 0.45, noticeable: 1 }[motion.seaStrength] ??
            0.45)))
      : 0;
    if (primary) {
      if (motion.reduced) waterState.current.strength = 0;
      advanceWaterState(waterState.current, dt, amplitude);
    }
    fleet.syncLoadingOwners(
      new Set(
        [...coordinator.current.active, ...coordinator.current.queue].map(
          (t) => t.nodeUID,
        ),
      ),
    );
    // A neighboring view continues this harbor's last explicit visual pause
    // controls; absence of an active panel is not a request to resume its ships.
    if (primary) fleet.presentationControls = shipControls;
    fleet.tick(dt, clock.current, motion, primary ? shipControls : fleet.presentationControls);
    for (const ship of fleet.ships.values()) {
      const steady = ["docking", "docked", "departing", "approaching"].includes(
        ship.mode,
      );
      const sample = sampleWater(
        waterState.current.time,
        ship.pose.position[0] + worldOffset[0],
        ship.pose.position[2] + worldOffset[1],
        motion.bob && !steady ? waterState.current.strength : 0,
        waterSample.current,
      );
      ship.bob ??= { height: 0, pitch: 0, roll: 0 };
      const targetPitch = -Math.atan(
          sample.dx * Math.sin(ship.pose.yaw) +
            sample.dz * Math.cos(ship.pose.yaw),
        ),
        targetRoll = Math.atan(
          sample.dx * Math.cos(ship.pose.yaw) -
            sample.dz * Math.sin(ship.pose.yaw),
        );
      const ease =
        motion.reduced || (waterState.current.strength === 0 && !amplitude)
          ? 1
          : 1 - Math.exp(-dt * 4);
      ship.bob.height += (sample.height - ship.bob.height) * ease;
      ship.bob.pitch += (targetPitch - ship.bob.pitch) * ease;
      ship.bob.roll += (targetRoll - ship.bob.roll) * ease;
      ship.pose.position[1] =
        ship.bob.height +
        (ship.mode === "launching" ? ship.launchHeight || 0 : 0);
      ship.pose.pitch = ship.bob.pitch;
      ship.pose.roll = ship.bob.roll;
      applyNodeFaultPose(
        ship.pose,
        lifecycle.current.visual.nodeVisual(ship.uid, clock.current * 1000),
      );
      slots.current.lastVisual ??= new Map();
      let previous = slots.current.lastVisual.get(ship.uid);
      if (!previous) {
        previous = { position: [0, 0, 0], pose: { yaw: 0, pitch: 0, roll: 0 } };
        slots.current.lastVisual.set(ship.uid, previous);
      }
      for (let i = 0; i < 3; i++) previous.position[i] = ship.pose.position[i];
      previous.pose.yaw = ship.pose.yaw;
      previous.pose.pitch = ship.pose.pitch;
      previous.pose.roll = ship.pose.roll;
    }
    coordinator.current.pump(clock.current * 1000);
    if (
      enabled &&
      ((motion.patrol &&
        [...fleet.ships.values()].some(
          (ship) => ship.healthy && !fleet.pausedUIDs.has(ship.uid),
        )) ||
        waterNeedsFrame(waterState.current, amplitude) ||
        coordinator.current.active.length ||
        coordinator.current.queue.length ||
        lifecycle.current.visual.needsFrame(
          clock.current * 1000,
          fleet.ships,
          slots.current.visiblePodUIDs,
        ))
    )
      invalidate();
    if (
      selectedUID &&
      onShipMotionChange &&
      performance.now() - lastReport.current > 500
    ) {
      lastReport.current = performance.now();
      const state = fleet.snapshotShip(selectedUID);
      if (state) {
        const ready = fleet.ships
          .get(state.uid)
          .node.status?.conditions?.find((c) => c.type === "Ready")?.status;
        onShipMotionChange({
          ...state,
          state: motion.reduced
            ? "reduced"
            : state.paused
              ? ready === "Unknown"
                ? "unknown"
                : ready === "False"
                  ? "not-ready"
                  : "paused"
              : state.state === "patrolling"
                ? "patrol"
                : [
                      "departing",
                      "merging",
                      "merge-wait",
                      "merge-retreat",
                    ].includes(state.state)
                  ? "returning"
                  : state.state,
          visualLoading: state.state === "docked",
        });
      }
    }
  }, -3);
  return null;
}

function podVisual(pod, nodesByName, slots, transfers, clock) {
  const uid = uidOf(pod),
    transfer = transfers.current.active.find((t) => t.uid === uid),
    queued = transfers.current.queue.find((t) => t.uid === uid);
  const node = nodesByName.get(pod.spec?.nodeName),
    pose = node && slots.fleet?.pose(uidOf(node));
  const appearance = arrivalVisual(queued, transfer, clock.current * 1000);
  appearance.suppressLabel =
    slots.containerMarkers?.some(
      (effect) => effect.uid === uid && effect.phase !== "settled",
    ) || false;
  if (transfer?.simple && pose) {
    const progress = Math.max(
      0,
      Math.min(
        1,
        (clock.current * 1000 - transfer.started) / transfer.duration,
      ),
    );
    const ease = progress * progress * (3 - 2 * progress),
      local = [
        transfer.deck[0] - (1 - ease) * 6,
        transfer.deck[1] + (1 - ease) * 4 + Math.sin(progress * Math.PI) * 2,
        transfer.deck[2] - (1 - ease) * 8,
      ];
    let position = vesselPointToWorld(pose, local),
      transferPose = pose;
    if (transfer.simpleOrigin) {
      const destination = vesselPointToWorld(pose, transfer.deck);
      position = destination.map(
        (value, index) =>
          transfer.simpleOrigin[index] +
          (value - transfer.simpleOrigin[index]) * ease,
      );
      position[1] += Math.sin(progress * Math.PI) * 2;
      transferPose = {
        yaw: pose.yaw * ease,
        pitch: pose.pitch * ease,
        roll: pose.roll * ease,
      };
    }
    return {
      ...appearance,
      position,
      pose: { ...transferPose, position },
      attached: false,
    };
  }
  if (transfer && !transfer.simple)
    return {
      ...appearance,
      position: transferPosition(transfer, clock.current * 1000),
      pose: null,
    };
  if (queued) return { ...appearance, position: queued.origin, pose: null };
  return {
    ...appearance,
    position: resourcePosition(pod, nodesByName, slots),
    pose:
      pose ||
      (pod.spec?.nodeName && slots.lastVisual?.get(uid)?.pose
        ? {
            ...slots.lastVisual.get(uid).pose,
            position: resourcePosition(pod, nodesByName, slots),
          }
        : null),
    attached: !!pose,
    orphan: !!pod.spec?.nodeName && !node,
  };
}
function MovingAnchor({
  resource,
  nodesByName,
  slots,
  transfers,
  clock,
  offset = [0, 0, 0],
  children,
}) {
  const ref = useRef();
  useFrame(() => {
    const visual =
      resource.kind === "Pod"
        ? podVisual(resource, nodesByName, slots, transfers, clock)
        : { position: resourcePosition(resource, nodesByName, slots) };
    if (ref.current && visual.position)
      ref.current.position.set(
        visual.position[0] + offset[0],
        visual.position[1] + offset[1],
        visual.position[2] + offset[2],
      );
  }, -1.5);
  return <group ref={ref}>{children}</group>;
}
function VesselGroup({ uid, fleet, children, motion, clock, waterState }) {
  const ref = useRef(),
    wake = useRef(),
    speed = useRef(0);
  useFrame(() => {
    const ship = fleet.ships.get(uid);
    if (!ship || !ref.current) return;
    const p = ship.pose;
    ref.current.position.set(...p.position);
    ref.current.rotation.set(p.pitch || 0, p.yaw, p.roll || 0, "YXZ");
    speed.current = ship.speed;
    if (wake.current) {
      wake.current.position.set(p.position[0], 0, p.position[2]);
      wake.current.rotation.y = p.yaw;
    }
  }, -2);
  const initial = fleet.pose(uid) || {
    position: [0, 0, 0],
    yaw: 0,
    pitch: 0,
    roll: 0,
  };
  return (
    <>
      <group
        ref={ref}
        position={initial.position}
        rotation={[initial.pitch || 0, initial.yaw, initial.roll || 0, "YXZ"]}
      >
        {children}
      </group>
      <group
        ref={wake}
        position={[initial.position[0], 0, initial.position[2]]}
        rotation={[0, initial.yaw, 0]}
      >
        <ShipWake
          motion={motion}
          clock={clock}
          waterState={waterState}
          speed={speed}
        />
      </group>
    </>
  );
}
function PodCargo({
  pods,
  nodesByName,
  slots,
  materials: m,
  selectedUID,
  onSelect,
  onHover,
  hovering,
  labels,
  transfers,
  reducedMotion,
  lowDetail,
  canSelect,
  onPickStart,
  clock,
  lifecycle,
  selectedContainerName,
}) {
  const body = useRef(),
    details = useRef(),
    status = useRef(),
    selection = useRef();
  const matrix = useMemo(() => new THREE.Matrix4(), []),
    basisEuler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []),
    tint = useMemo(() => new THREE.Color(), []),
    effectBasis = useMemo(() => new THREE.Matrix4(), []);
  const cached = useRef(new Map()),
    bases = useRef(new Map()),
    frame = useRef(0);
  const records = useMemo(() => {
    const live = new Set();
    const rows = pods.map((pod) => {
      const uid = uidOf(pod),
        node = nodesByName.get(pod.spec?.nodeName),
        nodeUID = node && uidOf(node);
      live.add(uid);
      let row = cached.current.get(uid);
      if (row?.pod === pod && row.nodeUID === nodeUID && row.slots === slots)
        return row;
      const containers = containersForPod(pod);
      const length =
        (D.CONTAINER_LENGTH - (containers.length - 1) * 0.15) /
        containers.length;
      row = {
        pod,
        uid,
        nodeUID,
        slots,
        deck: node ? deckPosition(slots.pod(uid, nodeUID)) : null,
        boxes: containers.map((container, c) => ({
          containerName: container.containerName,
          role: container.role,
          worldPosition: [0, 0, 0],
          offset: [
            0,
            0,
            -D.CONTAINER_LENGTH / 2 + length / 2 + c * (length + 0.15),
          ],
          size: [D.CONTAINER_WIDTH, D.CONTAINER_HEIGHT, length],
        })),
      };
      cached.current.set(uid, row);
      return row;
    });
    for (const uid of cached.current.keys())
      if (!live.has(uid)) cached.current.delete(uid);
    return rows;
  }, [pods, nodesByName, slots]);
  const instances = useMemo(() => containerInstances(pods), [pods]),
    bodyCount = instances.length;
  const statusBoxes = useMemo(
    () => [
      {
        offset: [
          0,
          D.CONTAINER_HEIGHT / 2 + 0.03,
          -D.CONTAINER_LENGTH / 2 + 0.2,
        ],
        size: [D.CONTAINER_WIDTH, 0.14, 0.36],
      },
      {
        offset: [
          -D.CONTAINER_WIDTH / 2 + 0.2,
          0.7,
          D.CONTAINER_LENGTH / 2 + 0.07,
        ],
        size: [0.32, 0.45, 0.08],
      },
    ],
    [],
  );
  const detailBoxes = useMemo(
    () =>
      [0, 1, 2].map((d) => ({
        offset: [(d - 1) * 0.8, 0, D.CONTAINER_LENGTH / 2 + 0.02],
        size: [d === 1 ? 0.035 : 0.055, D.CONTAINER_HEIGHT - 0.2, 0.06],
      })),
    [],
  );
  useLayoutEffect(() => {
    const meshes = [body.current, details.current, status.current];
    return () =>
      meshes.forEach((mesh) => mesh?.dispatchEvent({ type: "dispose" }));
  }, [bodyCount, pods.length]);
  useLayoutEffect(() => {
    if (!records.length) bases.current.clear();
    if (!body.current || !status.current) return;
    let bodyIndex = 0;
    const liveBasis = new Set();
    records.forEach((row, index) => {
      liveBasis.add(row.uid);
      if (row.nodeUID) liveBasis.add(row.nodeUID);
      row.boxes.forEach((_, c) =>
        body.current.setColorAt(
          bodyIndex++,
          tint
            .set(
              hashColor(row.pod.metadata.ownerReferences?.[0]?.uid || row.uid),
            )
            .offsetHSL(0, 0, c * 0.035),
        ),
      );
      status.current.setColorAt(
        index * 2,
        tint.set(STATE_COLORS[readyState(row.pod)]),
      );
      status.current.setColorAt(
        index * 2 + 1,
        tint.set(hashColor(row.pod.metadata.namespace)),
      );
    });
    if (body.current.instanceColor)
      body.current.instanceColor.needsUpdate = true;
    if (status.current.instanceColor)
      status.current.instanceColor.needsUpdate = true;
    for (const key of bases.current.keys())
      if (!liveBasis.has(key)) bases.current.delete(key);
  }, [records, tint]);
  const zero = useMemo(() => [0, 0, 0], []);
  const place = useCallback(() => {
    if (!body.current || !details.current || !status.current) return;
    const revision = ++frame.current;
    let bodyIndex = 0;
    for (let index = 0; index < records.length; index++) {
      const row = records[index],
        pod = row.pod,
        uid = row.uid;
      const visual = podVisual(pod, nodesByName, slots, transfers, clock),
        p = visual.position,
        pose = visual.pose;
      if (!p) continue;
      slots.lastVisual ??= new Map();
      let last = slots.lastVisual.get(uid);
      if (!last) {
        last = { position: [0, 0, 0], pose: null };
        slots.lastVisual.set(uid, last);
      }
      last.position[0] = p[0];
      last.position[1] = p[1];
      last.position[2] = p[2];
      if (pose) {
        last.pose ??= { yaw: 0, pitch: 0, roll: 0 };
        last.pose.yaw = pose.yaw;
        last.pose.pitch = pose.pitch;
        last.pose.roll = pose.roll;
      } else last.pose = null;
      const key = visual.attached && pose && row.deck ? row.nodeUID : uid;
      let basis = bases.current.get(key);
      if (!basis) {
        basis = { matrix: new THREE.Matrix4(), revision: -1 };
        bases.current.set(key, basis);
      }
      if (basis.revision !== revision) {
        if (visual.attached && pose && row.deck) {
          basisEuler.set(pose.pitch || 0, pose.yaw || 0, pose.roll || 0, "YXZ");
          basis.matrix
            .makeRotationFromEuler(basisEuler)
            .setPosition(...pose.position);
        } else if (pose) {
          basisEuler.set(pose.pitch || 0, pose.yaw || 0, pose.roll || 0, "YXZ");
          basis.matrix.makeRotationFromEuler(basisEuler).setPosition(...p);
        } else basis.matrix.makeTranslation(p[0], p[1], p[2]);
        basis.revision = revision;
      }
      const anchor = visual.attached && pose && row.deck ? row.deck : zero;
      for (const box of row.boxes) {
        writeCargoMatrix(
          matrix,
          basis.matrix,
          anchor,
          box.offset,
          box.size,
          visual.scale,
        );
        const effect = lifecycle.current.visual.container(
          uid,
          box.containerName,
          box.role,
        );
        if (effect && effect.phase !== "settled") {
          const e = matrix.elements;
          box.worldPosition[0] = e[12];
          box.worldPosition[1] = e[13];
          box.worldPosition[2] = e[14];
          const view = sampleContainerEffect(
            effect,
            clock.current * 1000,
            box.worldPosition,
            pose,
            FLEET_OBSTACLES,
          );
          if (view) {
            basisEuler.set(view.pitch, view.yaw, view.roll, "YXZ");
            effectBasis
              .makeRotationFromEuler(basisEuler)
              .setPosition(...view.position);
            writeCargoMatrix(
              matrix,
              effectBasis,
              zero,
              zero,
              box.size,
              visual.scale,
            );
          }
        }
        if (
          selection.current &&
          uid === selectedUID &&
          selectedContainerName === box.containerName
        ) {
          const e = matrix.elements;
          selection.current.position.set(e[12], e[13], e[14]);
          const view = effect?.phase !== "settled" ? effect?.view : null;
          selection.current.rotation.set(
            view?.pitch || pose?.pitch || 0,
            view?.yaw ?? pose?.yaw ?? 0,
            view?.roll || pose?.roll || 0,
            "YXZ",
          );
          selection.current.scale.set(
            1,
            1,
            Math.max(0.1, box.size[2] / D.CONTAINER_LENGTH),
          );
        }
        body.current.setMatrixAt(bodyIndex++, matrix);
      }
      for (let k = 0; k < statusBoxes.length; k++) {
        const box = statusBoxes[k];
        writeCargoMatrix(
          matrix,
          basis.matrix,
          anchor,
          box.offset,
          box.size,
          visual.scale,
        );
        status.current.setMatrixAt(index * 2 + k, matrix);
      }
      for (let k = 0; k < detailBoxes.length; k++) {
        const box = detailBoxes[k];
        writeCargoMatrix(
          matrix,
          basis.matrix,
          anchor,
          box.offset,
          box.size,
          visual.scale,
        );
        details.current.setMatrixAt(index * 3 + k, matrix);
      }
      if (
        selection.current &&
        ((uid === selectedUID && !selectedContainerName) ||
          (!selectedUID && uid === hovering))
      ) {
        selection.current.position.set(...p);
        selection.current.rotation.set(
          pose?.pitch || 0,
          pose?.yaw || 0,
          pose?.roll || 0,
          "YXZ",
        );
        selection.current.scale.setScalar(Math.max(0.0001, visual.scale));
      }
    }
    for (const ref of [body, details, status]) {
      ref.current.instanceMatrix.needsUpdate = true;
      ref.current.computeBoundingSphere();
    }
  }, [
    records,
    nodesByName,
    slots,
    transfers,
    clock,
    selectedUID,
    hovering,
    matrix,
    basisEuler,
    zero,
    statusBoxes,
    detailBoxes,
    lifecycle,
    selectedContainerName,
    effectBasis,
  ]);
  useLayoutEffect(() => place(), [place]);
  useFrame(() => place(), -1);
  const picked = (e) => instances[e.instanceId],
    key = (t) => `container:${uidOf(t.resource)}:${t.containerName || ""}`;
  const pointerDown = (e) => {
    e.stopPropagation();
    const t = picked(e);
    if (t) onPickStart(key(t));
  };
  const click = (e) => {
    e.stopPropagation();
    const t = picked(e);
    if (t && canSelect(e, key(t)))
      onSelect?.(t.resource, {
        containerName: t.containerName,
        containerRole: t.role,
      });
  };
  const over = (e) => {
    e.stopPropagation();
    const t = picked(e);
    if (t) onHover(t.resource);
    document.body.style.cursor = "pointer";
  };
  const out = (e) => {
    e.stopPropagation();
    onHover(null);
    document.body.style.cursor = "auto";
  };
  const selected = pods.find((p) => uidOf(p) === selectedUID),
    hovered = pods.find((p) => uidOf(p) === hovering);
  return (
    <group>
      {bodyCount > 0 && (
        <instancedMesh
          key={`body${bodyCount}`}
          ref={body}
          args={[UNIT_BOX, m.cargo, bodyCount]}
          userData={{
            harborTargets: () =>
              instances.map((t, index) => ({
                type: "container",
                uid: uidOf(t.resource),
                name: t.resource.metadata.name,
                namespace: t.resource.metadata.namespace,
                containerName: t.containerName,
                containerRole: t.role,
                instance: index,
              })),
          }}
          onPointerDown={pointerDown}
          onClick={click}
          onPointerOver={over}
          onPointerMove={over}
          onPointerOut={out}
          castShadow
          receiveShadow
          dispose={null}
        />
      )}
      {pods.length > 0 && (
        <>
          <instancedMesh
            key={`detail${pods.length}`}
            ref={details}
            args={[UNIT_BOX, m.rail, pods.length * 3]}
            dispose={null}
          />
          <instancedMesh
            key={`status${pods.length}`}
            ref={status}
            args={[UNIT_BOX, m.cargo, pods.length * 2]}
            dispose={null}
          />
        </>
      )}
      {[
        ...new Set(
          [
            selected,
            hovered,
            ...pods
              .filter(
                (pod) =>
                  pod.spec?.nodeName && !nodesByName.has(pod.spec.nodeName),
              )
              .slice(0, 3),
            ...pods
              .filter((pod) =>
                [...transfers.current.active, ...transfers.current.queue].some(
                  (job) => job.uid === uidOf(pod),
                ),
              )
              .slice(0, 4),
          ].filter(Boolean),
        ),
      ].map((pod) => (
        <MovingAnchor
          key={uidOf(pod)}
          resource={pod}
          nodesByName={nodesByName}
          slots={slots}
          transfers={transfers}
          clock={clock}
          offset={[0, 4.8, 0]}
        >
          <ResourceLabel
            resource={pod}
            position={[0, 0, 0]}
            selected={pod === selected}
            hover={pod === hovered}
            labels={labels}
            onlyWhileLoading={pod !== selected && pod !== hovered}
            visualStatus={() =>
              podVisual(pod, nodesByName, slots, transfers, clock)
            }
          />
        </MovingAnchor>
      ))}
      {(selected || hovered) && (
        <mesh ref={selection} raycast={() => null}>
          <boxGeometry
            args={[
              D.CONTAINER_WIDTH + 0.35,
              D.CONTAINER_HEIGHT + 0.35,
              D.CONTAINER_LENGTH + 0.35,
            ]}
          />
          <meshBasicMaterial
            color={selected ? "#4b8ddc" : "#e5be62"}
            wireframe
            depthTest={false}
            transparent
            opacity={0.95}
          />
        </mesh>
      )}
    </group>
  );
}

function WorkingCrane({
  index,
  materials,
  coordinator,
  lowDetail,
  reducedMotion,
  onOpenFacility,
  selectedFacility,
  canSelect,
  focusFacilityRequest,
  clock,
}) {
  const group = useRef(),
    trolley = useRef(),
    cable = useRef(),
    spreader = useRef(),
    hadTransfer = useRef(false),
    approach = useRef(null);
  const pierX = [-80, 0, 80][index],
    direction = index === 2 ? -1 : 1;
  const berth = [pierX, 0, D.BERTH_FIRST_Z];
  useFrame(() => {
    const transfer = coordinator.current.active.find(
      (t) => t.crane === index && !t.simple,
    );
    if (!group.current) return;
    if (transfer && !reducedMotion) {
      hadTransfer.current = true;
      if (approach.current?.job !== transfer)
        approach.current = {
          job: transfer,
          z: group.current.position.z,
          x: trolley.current?.position.x ?? -2,
          height: spreader.current?.position.y ?? 18.1,
        };
      const progress =
        (clock.current * 1000 - transfer.started) / (D.TRANSFER_SECONDS * 1000);
      const p =
        transfer.observedPending && progress < 0.16
          ? transfer.staging
          : transferPosition(transfer, clock.current * 1000);
      const phase = Math.max(0, Math.min(1, progress / 0.16)),
        ease = phase * phase * (3 - 2 * phase),
        destinationX = (p[0] - pierX) * direction,
        x = approach.current.x + (destinationX - approach.current.x) * ease;
      group.current.position.z =
        approach.current.z + (p[2] - approach.current.z) * ease;
      if (trolley.current) trolley.current.position.x = x;
      const loadTop = p[1] + D.CONTAINER_HEIGHT / 2 + 0.4 - 1,
        pickupHeight =
          approach.current.height + (loadTop - approach.current.height) * ease,
        // The load rests on the deck while the spreader releases and retracts.
        release = Math.max(0, Math.min(1, (progress - 0.94) / 0.06)),
        hookHeight = pickupHeight + release * 3;
      if (cable.current) {
        cable.current.position.set(x, (26.1 + hookHeight) / 2, 0);
        cable.current.scale.y = Math.max(0.1, 26.1 - hookHeight);
      }
      if (spreader.current)
        spreader.current.position.set(x, hookHeight - 0.05, 0);
    } else if (hadTransfer.current) {
      hadTransfer.current = false;
      approach.current = null;
      if (trolley.current) trolley.current.position.x = -2;
      if (cable.current) {
        cable.current.position.set(-2, 22.1, 0);
        cable.current.scale.y = 8;
      }
      if (spreader.current) spreader.current.position.set(-2, 18.1, 0);
    }
  });
  // Gantry wheels/feet stay on the same pier; the entire bridge can travel along its rails.
  return (
    <group
      ref={group}
      position={[pierX, 1, berth[2] + 10]}
      scale={[direction, 1, 1]}
    >
      <FacilityHit
        id="scheduling"
        hitbox={false}
        name="Yerleştirme vinci"
        description="Pending Pod atamaları ve gerçek scheduling gerekçeleri"
        size={[index === 1 ? 61 : 44, 31, 13]}
        anchor={[index === 1 ? 0 : 10.5, 28, 1.8]}
        selected={selectedFacility === "scheduling"}
        canSelect={canSelect}
        onOpen={onOpenFacility}
      >
        <Gantry
          materials={materials}
          rust={index % 3 === 1}
          trolley={-2}
          hoist={11}
          lowDetail={lowDetail}
          externalHoist
          doubleJib={index === 1}
        />
        <group ref={trolley} position={[-2, 0, 0]}>
          <Box
            position={[0, 26.8, 0]}
            scale={[3, 0.8, 3.3]}
            material={materials.rail}
          />
        </group>
        <mesh
          ref={cable}
          geometry={UNIT_BOX}
          material={materials.rail}
          position={[-1.4, 20.5, 0]}
          scale={[0.065, 11, 0.065]}
          dispose={null}
        />
        <group ref={spreader} position={[-1.4, 15.1, 0]}>
          <Box scale={[3.65, 0.3, 6.3]} material={materials.yellow} />
        </group>
      </FacilityHit>
    </group>
  );
}

function DockShuttles({ coordinator, materials: m, reducedMotion, clock }) {
  const groups = useRef([]);
  useFrame(() => {
    const pending = coordinator.current.active.filter(
      (t) => t.observedPending && !t.simple,
    );
    for (let i = 0; i < D.MAX_TRANSFERS; i++) {
      const group = groups.current[i],
        transfer = pending[i];
      if (!group) continue;
      const visible =
        transfer &&
        !reducedMotion &&
        (clock.current * 1000 - transfer.started) /
          (D.TRANSFER_SECONDS * 1000) <
          0.16;
      group.visible = Boolean(visible);
      if (visible) {
        const p = transferPosition(transfer, clock.current * 1000);
        group.position.set(p[0], p[1] - D.CONTAINER_HEIGHT / 2 - 0.25, p[2]);
      }
    }
  });
  return (
    <group>
      {Array.from({ length: D.MAX_TRANSFERS }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            groups.current[i] = g;
          }}
          visible={false}
        >
          <Box scale={[3.7, 0.5, 6.6]} material={m.yellow} />
          <Box
            position={[-0.8, 0.65, -2.6]}
            scale={[1.8, 1.2, 1.8]}
            material={m.rust}
          />
          {[-1.8, 1.8].map((x) => (
            <Cylinder
              key={x}
              position={[x, -0.3, 0]}
              scale={[0.5, 5.1, 0.5]}
              rotation={[Math.PI / 2, 0, 0]}
              material={m.black}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function RemovalGhost({ ghost, reducedMotion }) {
  const ref = useRef(),
    material = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color:
            ghost.resource.kind === "Node"
              ? "#49768b"
              : hashColor(
                  ghost.resource.metadata?.ownerReferences?.[0]?.uid ||
                    ghost.uid,
                ),
          transparent: true,
          opacity: 0.5,
          roughness: 0.8,
          depthWrite: false,
        }),
      [ghost.uid],
    );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    if (!ref.current) return;
    const t = Math.min(
      1,
      (performance.now() - ghost.started) / (ghost.expires - ghost.started),
    );
    material.opacity = (1 - t) * 0.5;
    ref.current.visible = t < 1;
    if (!reducedMotion) ref.current.position.y = ghost.position[1] + t * 0.65;
  });
  const pod = ghost.resource.kind === "Pod";
  return (
    <group
      ref={ref}
      position={ghost.position}
      rotation={[
        ghost.pose?.pitch || 0,
        ghost.pose?.yaw || 0,
        ghost.pose?.roll || 0,
        "YXZ",
      ]}
    >
      <mesh
        geometry={pod ? UNIT_BOX : HULL}
        scale={
          pod
            ? [D.CONTAINER_WIDTH, D.CONTAINER_HEIGHT, D.CONTAINER_LENGTH]
            : [1, 1, 1]
        }
        material={material}
        dispose={null}
      />
      <Html
        style={{ pointerEvents: "none" }}
        center
        position={[0, pod ? 5 : 14, 0]}
        zIndexRange={[6, 0]}
      >
        <span
          style={{ ...labelStyle, color: "#745a48", background: "#fff8ec" }}
        >
          Silindi · görsel çıkış
        </span>
      </Html>
    </group>
  );
}
function LifecycleIndicators({
  pods,
  nodesByName,
  slots,
  lifecycle,
  revision,
  selectedUID,
  reducedMotion,
  labels,
  visibleNamespace,
  transfers,
  clock,
}) {
  const podMap = new Map(pods.map((p) => [uidOf(p), p]));
  const hasSpecificMarker = (uid) =>
    slots.containerMarkers?.some(
      (effect) => effect.uid === uid && effect.phase !== "settled",
    );
  const problems = pods
    .filter((p) => containerProblem(p) && !hasSpecificMarker(uidOf(p)))
    .slice(0, 12);
  const pulses = [...lifecycle.current.containers.active.values()]
    .filter((p) => podMap.has(p.uid) && !hasSpecificMarker(p.uid))
    .slice(-8);
  return (
    <group>
      {lifecycle.current.ghosts
        .filter(
          (g) =>
            !visibleNamespace ||
            g.resource.kind === "Node" ||
            g.resource.metadata.namespace === visibleNamespace,
        )
        .map((ghost) => (
          <RemovalGhost
            key={ghost.uid}
            ghost={ghost}
            reducedMotion={reducedMotion}
          />
        ))}
      {labels &&
        problems.map((pod) => {
          const problem = containerProblem(pod),
            selected = selectedUID === uidOf(pod);
          return (
            <MovingAnchor
              key={uidOf(pod)}
              resource={pod}
              nodesByName={nodesByName}
              slots={slots}
              transfers={transfers}
              clock={clock}
              offset={[0, 3.6, 0]}
            >
              <Html
                style={{ pointerEvents: "none" }}
                center
                position={[0, 0, 0]}
                zIndexRange={[8, 0]}
              >
                <span
                  style={{
                    ...labelStyle,
                    padding: "3px 6px",
                    color: ["ImagePullBackOff", "ErrImagePull"].includes(
                      problem.reason,
                    )
                      ? "#396b81"
                      : "#a64632",
                    fontWeight: 600,
                  }}
                >
                  {problem.symbol}
                  {selected ? ` ${problem.label}` : ""}
                </span>
              </Html>
            </MovingAnchor>
          );
        })}
      {pulses.map((pulse) => {
        const pod = podMap.get(pulse.uid);
        return (
          <MovingAnchor
            key={pulse.id}
            resource={pod}
            nodesByName={nodesByName}
            slots={slots}
            transfers={transfers}
            clock={clock}
            offset={[0, 6, 0]}
          >
            <Html
              style={{ pointerEvents: "none" }}
              center
              position={[0, 0, 0]}
              zIndexRange={[9, 0]}
            >
              <span
                style={{
                  ...labelStyle,
                  background: pulse.oom ? "#fff0e5" : "#fff8e2",
                  borderColor: "#c79c58",
                  color: "#85591f",
                }}
              >
                ↻ {pulse.oom ? "OOMKilled" : pulse.name} · restart {pulse.count}
              </span>
            </Html>
          </MovingAnchor>
        );
      })}
    </group>
  );
}

function ViewController({
  controls,
  bounds,
  focusRequest,
  overviewRequest,
  selected,
  slots,
  nodesByName,
  sourceKey,
  focusFacilityRequest,
  shipControls,
  fleet,
  motion,
  onFollowEnd,
  worldOffset = [0, 0],
  harborView,
  viewBridge,
  activeHarborId,
  workspaceHarbors = [],
}) {
  const { camera, size, invalidate, scene, gl } = useThree();
  const focusLensScale = Math.tan(THREE.MathUtils.degToRad(19)) / Math.tan(THREE.MathUtils.degToRad(camera.getEffectiveFOV() / 2));
  const panKeys = useRef(new Set()),
    panStarting = useRef(false),
    endFollow = useRef(onFollowEnd);
  endFollow.current = onFollowEnd;
  const panVectors = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      right: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
    }),
    [],
  );
  useEffect(() => {
    const canvas = gl.domElement,
      doc = canvas.ownerDocument,
      win = doc.defaultView,
      previousTabIndex = canvas.getAttribute("tabindex"),
      previousLabel = canvas.getAttribute("aria-label");
    const arrowKeys = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
    ]);
    const clear = () => panKeys.current.clear();
    const focus = () => canvas.focus({ preventScroll: true });
    const keyDown = (event) => {
      if (
        doc.activeElement !== canvas ||
        event.target !== canvas ||
        !arrowKeys.has(event.key) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      event.preventDefault();
      if (!panKeys.current.size) {
        // The first demand frame may include time spent idle; never pan by it.
        panStarting.current = true;
        endFollow.current?.();
      }
      panKeys.current.add(event.key);
      invalidate();
    };
    const keyUp = (event) => {
      if (panKeys.current.delete(event.key)) event.preventDefault();
    };
    const visibility = () => {
      if (doc.hidden) clear();
    };
    canvas.tabIndex = 0;
    canvas.setAttribute(
      "aria-label",
      "3D liman — yön tuşlarıyla kamerayı kaydır",
    );
    canvas.addEventListener("pointerdown", focus);
    canvas.addEventListener("keydown", keyDown);
    canvas.addEventListener("keyup", keyUp);
    canvas.addEventListener("blur", clear);
    win.addEventListener("blur", clear);
    doc.addEventListener("visibilitychange", visibility);
    return () => {
      clear();
      canvas.removeEventListener("pointerdown", focus);
      canvas.removeEventListener("keydown", keyDown);
      canvas.removeEventListener("keyup", keyUp);
      canvas.removeEventListener("blur", clear);
      win.removeEventListener("blur", clear);
      doc.removeEventListener("visibilitychange", visibility);
      for (const [name, value] of [
        ["tabindex", previousTabIndex],
        ["aria-label", previousLabel],
      ]) {
        if (value === null) canvas.removeAttribute(name);
        else canvas.setAttribute(name, value);
      }
    };
  }, [gl, invalidate]);
  const lastFocus = useRef(focusRequest),
    lastOverview = useRef(overviewRequest);
  const transition = useRef(null), lastHarbor = useRef(activeHarborId), viewOwner = useRef(null);
  const fit = useCallback(() => {
    transition.current = null;
    const pair = size.width >= 1100 && nearbyHarbors(workspaceHarbors, activeHarborId).length > 0;
    const samples = harborFitSamples(scene, pair ? null : fleet, bounds, worldOffset, pair);
    const { center, position, distance } = fitHarborView(samples, size.width / size.height, camera.fov);
    camera.position.copy(position);
    camera.lookAt(center);
    updateHarborDepth(camera, center);
    camera.far = Math.max(2500, distance * 5);
    camera.updateProjectionMatrix();
    controls.current?.target.copy(center);
    controls.current?.update();
    invalidate();
  }, [camera, size.width, size.height, bounds.maxZ, worldOffset[0], worldOffset[1], workspaceHarbors, activeHarborId]);
  const fittedData = useRef(false);
  useEffect(() => {
    const from = camera.position.clone(), fromTarget = controls.current?.target.clone();
    if (activeHarborId && viewOwner.current?.harborId === activeHarborId && controls.current) {
      const dx = worldOffset[0] - viewOwner.current.offset[0], dz = worldOffset[1] - viewOwner.current.offset[1];
      if (dx || dz) { camera.position.x += dx; camera.position.z += dz; controls.current.target.x += dx; controls.current.target.z += dz; transition.current = null; controls.current.update(); }
      fittedData.current = true;
      viewOwner.current = { harborId: activeHarborId, sourceKey, offset: [...worldOffset] };
      invalidate();
      return;
    }
    const restored = restoreHarborCamera(harborView?.camera, activeHarborId, worldOffset, camera.getEffectiveFOV());
    fittedData.current = Boolean(restored);
    if (restored) {
      camera.position.fromArray(restored.position);
      controls.current?.target.fromArray(restored.target);
      camera.far = Math.max(2500, camera.position.distanceTo(controls.current?.target || new THREE.Vector3()) * 5);
      camera.updateProjectionMatrix();
      controls.current?.update();
    } else fit();
    if (activeHarborId && lastHarbor.current && lastHarbor.current !== activeHarborId && !motion?.reduced && !motion?.paused && fromTarget) {
      transition.current = { from, fromTarget, to: camera.position.clone(), toTarget: controls.current.target.clone(), elapsed: 0 };
      camera.position.copy(from); controls.current.target.copy(fromTarget); controls.current.update();
    }
    lastHarbor.current = activeHarborId;
    viewOwner.current = { harborId: activeHarborId, sourceKey, offset: [...worldOffset] };
    invalidate();
  }, [sourceKey, worldOffset[0], worldOffset[1]]);
  useLayoutEffect(() => {
    if (!viewBridge) return;
    const bridge = {
      harborId: activeHarborId,
      capture: () => controls.current && viewOwner.current?.sourceKey === sourceKey && viewOwner.current?.harborId === activeHarborId ? captureHarborCamera(camera.position.toArray(), controls.current.target.toArray(), transition.current ? { position: transition.current.to.toArray(), target: transition.current.toTarget.toArray() } : null, activeHarborId, worldOffset, camera.getEffectiveFOV()) : null,
      cancelTransition() { transition.current = null; },
      overviewWorkspace() {
        const positions = workspaceHarbors.map((harbor, index) => harborPosition(harbor, index));
        if (!positions.length) return fit();
        const minX = Math.min(...positions.map((position) => position[0])), maxX = Math.max(...positions.map((position) => position[0])), minZ = Math.min(...positions.map((position) => position[1])), maxZ = Math.max(...positions.map((position) => position[1]));
        const center = new THREE.Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2), distance = Math.max(maxX - minX, maxZ - minZ) * 1.5 + 700;
        transition.current = null;
        camera.position.copy(center).add(new THREE.Vector3(0, distance, distance * 0.7));
        controls.current?.target.copy(center); camera.far = distance * 5; camera.updateProjectionMatrix(); controls.current?.update(); invalidate();
      },
    };
    viewBridge.current = bridge;
    return () => { if (viewBridge.current === bridge) viewBridge.current = null; };
  }, [viewBridge, camera, controls, activeHarborId, workspaceHarbors, fit]);
  const fittedSize = useRef([size.width, size.height]);
  useEffect(() => {
    if (fittedSize.current[0] === size.width && fittedSize.current[1] === size.height) return;
    fittedSize.current = [size.width, size.height];
    fit();
  }, [size.width, size.height]);
  useEffect(() => {
    if (!fittedData.current && nodesByName.size) {
      fittedData.current = true;
      fit();
    }
  }, [nodesByName.size, fit]);
  useEffect(() => {
    if (lastOverview.current !== overviewRequest) {
      lastOverview.current = overviewRequest;
      fit();
    }
  }, [overviewRequest, fit]);
  useEffect(() => {
    if (lastFocus.current === focusRequest) return;
    const p =
      selected &&
      (slots.visualPosition?.(selected) ||
        resourcePosition(selected, nodesByName, slots));
    if (!p) return;
    lastFocus.current = focusRequest;
    transition.current = null;
    const center = new THREE.Vector3(p[0] + worldOffset[0], p[1], p[2] + worldOffset[1]);
    camera.position.copy(center).add(new THREE.Vector3(55, 60, 75).multiplyScalar(focusLensScale));
    controls.current?.target.copy(center);
    controls.current?.update();
    invalidate();
  }, [
    focusRequest,
    selected,
    nodesByName,
    slots,
    camera,
    invalidate,
    sourceKey,
  ]);
  const lastFacilityFocus = useRef("");
  useEffect(() => {
    if (!focusFacilityRequest?.id) return;
    const key = `${focusFacilityRequest.id}:${focusFacilityRequest.revision}`;
    if (key === lastFacilityFocus.current) return;
    const object = scene.getObjectByName("workspace:active-harbor")?.getObjectByName(`facility:${focusFacilityRequest.id}`);
    if (!object) return;
    lastFacilityFocus.current = key;
    transition.current = null;
    const center = new THREE.Box3()
      .setFromObject(object)
      .getCenter(new THREE.Vector3());
    center.y = Math.min(24, center.y);
    camera.position.copy(center).add(new THREE.Vector3(42, 51, 68).multiplyScalar(focusLensScale));
    controls.current?.target.copy(center);
    controls.current?.update();
    invalidate();
  }, [
    focusFacilityRequest?.id,
    focusFacilityRequest?.revision,
    scene,
    camera,
    invalidate,
  ]);

  const followOffset = useRef(new THREE.Vector3(55, 60, 75)),
    lastFollow = useRef(null);
  useFrame((_, delta) => {
    updateHarborDepth(camera, controls.current?.target);
    const keys = panKeys.current;
    if (keys.size) transition.current = null;
    if (transition.current && !keys.size) {
      const value = transition.current;
      value.elapsed += Math.min(delta, 0.1);
      const t = Math.min(1, value.elapsed / 0.45), ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(value.from, value.to, ease);
      controls.current?.target.lerpVectors(value.fromTarget, value.toTarget, ease);
      controls.current?.update(); invalidate();
      if (t === 1) transition.current = null;
      return;
    }
    if (
      keys.size &&
      gl.domElement.ownerDocument.activeElement === gl.domElement &&
      controls.current?.enabled
    ) {
      const { forward, right, offset, up } = panVectors;
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, up).normalize();
      offset
        .copy(right)
        .multiplyScalar(
          Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft")),
        )
        .addScaledVector(
          forward,
          Number(keys.has("ArrowUp")) - Number(keys.has("ArrowDown")),
        );
      offset.normalize().multiplyScalar(panStarting.current ? 0 : 75 * delta);
      panStarting.current = false;
      camera.position.add(offset);
      controls.current.target.add(offset);
      invalidate();
      return;
    }
    if (motion?.paused || motion?.reduced) return;
    const uid = shipControls?.followUID,
      pose = uid && fleet?.pose(uid);
    if (!pose) {
      lastFollow.current = null;
      return;
    }
    if (lastFollow.current !== uid) {
      lastFollow.current = uid;
      followOffset.current
        .copy(camera.position)
        .sub(new THREE.Vector3(pose.position[0] + worldOffset[0], pose.position[1], pose.position[2] + worldOffset[1]));
      if (followOffset.current.length() > 190 * focusLensScale)
        followOffset.current.set(55, 60, 75).multiplyScalar(focusLensScale);
    }
    const target = new THREE.Vector3(pose.position[0] + worldOffset[0], pose.position[1], pose.position[2] + worldOffset[1]);
    const desired = target.clone().add(followOffset.current);
    if (
      camera.position.distanceToSquared(desired) > 1e-8 ||
      !controls.current ||
      controls.current.target.distanceToSquared(target) > 1e-8
    ) {
      camera.position.copy(desired);
      controls.current?.target.copy(target);
      controls.current?.update();
      invalidate();
    }
  });

  return null;
}

// A neighboring port reads its own already-authorized session. It does not
// create a transport, borrow the active scope or synthesize Node/Pod resources.
function NearbyHarbor({ harbor, index, session, views, protectedSources, materials, quality, layers, clock, waterState, motion, visible, canSelect, onPickStart, onHarborSelect, onSelect }) {
  const [snapshot, setSnapshot] = useState(() => session?.state || null);
  const [hovered, setHovered] = useState(null);
  useLayoutEffect(() => {
    const receive = next => setSnapshot(previous => previous?.resources === next?.resources && previous?.sourceKey === next?.sourceKey && previous?.stale === next?.stale && previous?.snapshotReady === next?.snapshotReady ? previous : next);
    receive(session?.state || null);
    session?.listeners.add(receive);
    return () => session?.listeners.delete(receive);
  }, [session]);
  const source = snapshot?.sourceKey || `unbound:${harbor.id}`;
  const visual = useMemo(() => {
    let saved = views.get(source);
    if (!saved) { saved = { slots: new HarborSlots(), fleet: new FleetSimulator() }; cacheVisualView(views, source, saved, harbor.id, protectedSources); }
    return saved;
  }, [source, views]);
  const slots = useMemo(() => ({ current: visual.slots }), [visual]);
  const fleet = visual.fleet;
  const coordinator = useMemo(() => ({ current: new TransferCoordinator() }), [source]);
  const lifecycle = useMemo(() => ({ current: { visual: new VisualLifecycle(source), containers: new ContainerTransitions(), ghosts: [] } }), [source]);
  const resources = useMemo(() => Object.values(snapshot?.resources || {}), [snapshot?.resources]);
  const nodes = useMemo(() => resources.filter(r => r.kind === "Node"), [resources]);
  const nodesByName = useMemo(() => new Map(nodes.map(node => [node.metadata.name, node])), [nodes]);
  slots.current.reconcile(resources);
  nodes.forEach(node => slots.current.node(uidOf(node)));
  const window = nodeWindow(nodes, slots.current, 0, F.VISIBLE_CAPACITY);
  slots.current.windowOffset = window.offset;
  const pods = useMemo(() => resources.filter(r => r.kind === "Pod" && (!r.spec?.nodeName || nodes.some(n => n.metadata.name === r.spec.nodeName && slots.current.node(uidOf(n)) < F.VISIBLE_CAPACITY) || !nodesByName.has(r.spec.nodeName))), [resources, nodes, nodesByName, slots]);
  const position = useMemo(() => harborPosition(harbor, index), [harbor.position?.[0], harbor.position?.[1], index]);
  const bounds = useMemo(() => ({ ...sceneBounds(7), maxZ: F.PIER_END }), []);
  fleet.reconcile(window.visible, uid => slots.current.node(uid) - window.offset, clock.current, { snapshot: true, patrol: motion.patrol, canonicalUIDs: new Set(nodes.map(uidOf)) });
  slots.current.fleet = fleet; coordinator.current.fleet = fleet;
  slots.current.visiblePodUIDs = new Set(pods.map(uidOf));
  useEffect(() => {
    // Overview displays the current fault state, never a backlog of unseen events.
    lifecycle.current.visual.observe(nodes, pods, { now: clock.current * 1000, source, simple: true, snapshotReady: !!snapshot?.snapshotReady, snapshotUIDs: new Set(resources.map(uidOf)) });
  }, [nodes, pods, lifecycle, source, snapshot?.snapshotReady, resources]);
  const select = (resource, options) => onSelect?.(harbor.id, resource, options);
  const pickStart = key => onPickStart(`${harbor.id}:${key}`);
  const canPick = (event, key) => canSelect(event, key ? `${harbor.id}:${key}` : undefined);
  const lowDetail = quality === "low" || nodes.length > 12;
  return <group name={`workspace:nearby-harbor:${harbor.id}`} position={[position[0], 0, position[1]]} userData={{ workspaceSilhouette: true, workspaceDetail: true, harborId: harbor.id }}>
    <FleetFrame primary={false} fleet={fleet} slots={slots} coordinator={coordinator} lifecycle={lifecycle}
      clock={clock} waterState={waterState} motion={motion} visible={visible} worldOffset={position} />
    <Terrain materials={materials} bounds={bounds} lowDetail={lowDetail} />
    <WorldFacilities materials={materials} pierEnd={bounds.maxZ} canSelect={canPick} onOpenFacility={facilityId => onHarborSelect?.(harbor.id, facilityId)} />
    {[0, 1, 2].map(i => <WorkingCrane key={i} index={i} materials={materials} coordinator={coordinator}
      lowDetail={lowDetail} reducedMotion={motion.reduced || motion.paused} clock={clock}
      onOpenFacility={id => onHarborSelect?.(harbor.id, id)} canSelect={canPick} />)}
    {layers.nodes !== false && window.visible.map(node => {
      const uid = uidOf(node), state = readyState(node);
      return <VesselGroup key={uid} uid={uid} fleet={fleet} motion={motion} clock={clock} waterState={waterState}>
        <group name={`node:${uid}`} userData={{ harborTarget: { type: "node", uid, name: node.metadata.name, local: [0, 11.8 + D.SHIP_FREEBOARD_LIFT, -21.8] } }} onPointerDown={event => { event.stopPropagation(); pickStart(`node:${uid}`); }}>
          <CargoShip position={[0, 0, 0]} materials={materials} state={state} slot={slots.current.node(uid)} lowDetail={lowDetail}
            hovered={hovered === uid} radarData={{ uid, name: node.metadata.name }}
            onClick={event => { event.stopPropagation(); if (canPick(event, `node:${uid}`)) select(node); }}
            onPointerOver={event => { event.stopPropagation(); setHovered(uid); document.body.style.cursor = "pointer"; }}
            onPointerOut={event => { event.stopPropagation(); setHovered(null); document.body.style.cursor = "auto"; }} />
          <ResourceLabel resource={node} position={[0, 19, -22]} hover={hovered === uid} labels={layers.labels !== false && nodes.length <= 12} />
        </group>
      </VesselGroup>;
    })}
    {layers.pods !== false && <PodCargo pods={pods} nodesByName={nodesByName} slots={slots.current} materials={materials} onSelect={select}
      onHover={resource => setHovered(resource ? uidOf(resource) : null)} hovering={hovered} labels={false}
      transfers={coordinator} reducedMotion={motion.reduced || motion.paused} lowDetail={lowDetail}
      canSelect={canPick} onPickStart={pickStart} clock={clock} lifecycle={lifecycle} />}
    <HarborNameplate harbor={harbor} position={[0, 0]} stale={snapshot?.stale} onSelect={onHarborSelect} />
  </group>;
}

function HarborNameplate({ harbor, position, onSelect, active = false, stale = false }) {
  return <Html position={[position[0] + 8, 110, position[1] - 76]} center zIndexRange={[5, 0]}>
    <button className="harbor-nameplate" data-active={active} aria-label={`${harbor.name} — limanı aç`} title={`${harbor.namespaces.join(", ")}${stale ? " · Son bilinen veri" : ""}`}
      onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onSelect?.(harbor.id); }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m12 2 10 5.5v9L12 22 2 16.5v-9Z M2 7.5l10 5.5 10-5.5M12 13v9M7 4.75l10 5.5" /></svg>
      <span>{harbor.name}</span>{stale && <small>Eski veri</small>}
    </button>
  </Html>;
}

function SceneWorld({
  resources,
  selectedUID,
  selectedContainerName,
  provisionOperations = EMPTY_OPERATIONS,
  workloadOperations = EMPTY_OPERATIONS,
  resourceTombstones = EMPTY_TOMBSTONES,
  snapshotUIDs = EMPTY_SNAPSHOT_UIDS,
  measuredFlows,
  onFlowSelect,
  onSelect,
  quality,
  layers,
  focusRequest,
  overviewRequest,
  reducedMotion,
  sourceKey,
  onStats,
  visibleNamespace,
  snapshotReady,
  onWindowInfo,
  onOpenFacility,
  selectedFacility,
  canSelect,
  focusFacilityRequest,
  motion,
  shipControls,
  onFollowEnd,
  onPickStart,
  onShipMotionChange,
  workspaceHarbors = [],
  activeHarborId,
  workspaceRelations = [],
  onHarborSelect,
  onHarborRelations,
  harborView,
  viewBridge,
  harborEndpoints,
  workspaceRegistry,
  onHarborResourceSelect,
}) {
  const { invalidate, gl, scene } = useThree();
  const controls = useRef(),
    slots = useRef(new HarborSlots()),
    coordinator = useRef(new TransferCoordinator()),
    lastSource = useRef(sourceKey),
    lastHarbor = useRef(activeHarborId),
    fleet = useRef(new FleetSimulator()),
    clock = useRef(0),
    waterState = useRef(createWaterState(0)), visualViews = useRef(new Map());
  const activeHarbor = workspaceHarbors.find((harbor) => harbor.id === activeHarborId);
  const worldOffset = useMemo(() => activeHarbor ? harborPosition(activeHarbor, workspaceHarbors.indexOf(activeHarbor)) : [0, 0], [activeHarbor?.id, activeHarbor?.position?.[0], activeHarbor?.position?.[1]]);
  const nearby = useMemo(() => nearbyHarbors(workspaceHarbors, activeHarborId), [workspaceHarbors, activeHarborId]);
  const lightCenter = useMemo(() => {
    const other = nearby[0];
    if (!other) return worldOffset;
    const point = harborPosition(other, workspaceHarbors.indexOf(other));
    return [(point[0] + worldOffset[0]) / 2, (point[1] + worldOffset[1]) / 2];
  }, [nearby, workspaceHarbors, worldOffset]);
  const lightTarget = useMemo(() => { const object = new THREE.Object3D(); object.position.set(lightCenter[0], 0, lightCenter[1]); return object; }, [lightCenter]);
  const protectedSources = [sourceKey, ...nearby.map(harbor => workspaceRegistry?.sessions.get(harbor.id)?.state.sourceKey)].filter(Boolean);
  pruneVisualViews(visualViews.current, workspaceHarbors.map(harbor => harbor.id));
  if (lastSource.current !== sourceKey) {
    if (lastHarbor.current && workspaceHarbors.some(harbor => harbor.id === lastHarbor.current))
      cacheVisualView(visualViews.current, lastSource.current, { slots: slots.current, fleet: fleet.current }, lastHarbor.current, protectedSources);
    lastSource.current = sourceKey;
    lastHarbor.current = activeHarborId;
    const saved = activeHarborId && visualViews.current.get(sourceKey);
    slots.current = saved?.slots || new HarborSlots();
    coordinator.current.reset();
    fleet.current = saved?.fleet || new FleetSimulator();
    if (!activeHarborId) { clock.current = 0; waterState.current = createWaterState(0); }
  }
  if (activeHarborId) cacheVisualView(visualViews.current, sourceKey, { slots: slots.current, fleet: fleet.current }, activeHarborId, protectedSources);
  const [visible, setVisible] = useState(!document.hidden);
  const maps = useMemo(() => makeSurfaceMaps(), []);
  const materials = useMemo(() => makeMaterials(maps), [maps]);
  useEffect(
    () => () => {
      materials.dispose();
      maps.dispose();
      document.body.style.cursor = "auto";
    },
    [maps, materials],
  );
  const [hovered, setHovered] = useState(null),
    [lifecycleRevision, setLifecycleRevision] = useState(0);
  const lifecycle = useRef({
    source: sourceKey,
    initialized: false,
    previous: new Map(),
    ghosts: [],
    containers: new ContainerTransitions(),
    visual: new VisualLifecycle(sourceKey),
  });
  if (lifecycle.current.source !== sourceKey)
    lifecycle.current = {
      source: sourceKey,
      initialized: false,
      previous: new Map(),
      ghosts: [],
      containers: new ContainerTransitions(),
      visual: new VisualLifecycle(sourceKey),
    };
  const lifecycleTimer = useRef();
  const [windowIndex, setWindowIndex] = useState(0),
    lastWindow = useRef("");
  useEffect(() => setWindowIndex(0), [sourceKey]);
  const nodes = useMemo(
    () => resources.filter((resource) => resource.kind === "Node"),
    [resources],
  );
  const pods = useMemo(
    () => resources.filter((resource) => resource.kind === "Pod"),
    [resources],
  );
  const snapshotOrigins = useMemo(
    () =>
      snapshotUIDs instanceof Set ? snapshotUIDs : new Set(snapshotUIDs || []),
    [snapshotUIDs],
  );
  const displayPods = useMemo(
    () =>
      visibleNamespace
        ? pods.filter((p) => p.metadata.namespace === visibleNamespace)
        : pods,
    [pods, visibleNamespace],
  );
  slots.current.reconcile(resources);
  nodes.forEach((node) => slots.current.node(uidOf(node)));
  slots.current.windowSize = F.VISIBLE_CAPACITY;
  const visibleWindow = nodeWindow(
    nodes,
    slots.current,
    windowIndex,
    F.VISIBLE_CAPACITY,
  );
  slots.current.windowOffset = visibleWindow.offset;
  const windowKey = `${sourceKey}:${visibleWindow.page}`;
  if (lastWindow.current !== windowKey) {
    lastWindow.current = windowKey;
    coordinator.current.reset();
    lifecycle.current.initialized = false;
    lifecycle.current.previous.clear();
    lifecycle.current.ghosts = [];
    lifecycle.current.containers.reset();
  }
  const newNodeUIDs = observedNodeArrivals(
    nodes,
    lifecycle.current.visual,
    snapshotOrigins,
    provisionOperations,
  );
  fleet.current.reconcile(
    visibleWindow.visible,
    (uid) => slots.current.node(uid) - visibleWindow.offset,
    clock.current,
    {
      snapshot: snapshotReady,
      patrol: motion.patrol,
      canonicalUIDs: new Set(nodes.map(uidOf)),
      arrivals: newNodeUIDs,
    },
  );
  slots.current.fleet = fleet.current;
  coordinator.current.fleet = fleet.current;
  const nodesByName = useMemo(
    () => new Map(nodes.map((node) => [node.metadata?.name, node])),
    [nodes],
  );
  const visibleNames = new Set(
    visibleWindow.visible.map((node) => node.metadata.name),
  );
  const renderPods = displayPods.filter(
    (p) =>
      !p.spec?.nodeName ||
      visibleNames.has(p.spec.nodeName) ||
      !nodesByName.has(p.spec.nodeName),
  );
  slots.current.visiblePodUIDs = new Set(renderPods.map(uidOf));
  const containerMarkers = visibleContainerMarkers(
    lifecycle.current.visual,
    slots.current.visiblePodUIDs,
    selectedUID,
    clock.current * 1000,
  );
  slots.current.containerMarkers = containerMarkers;
  const selected = resources.find(
    (resource) => uidOf(resource) === selectedUID,
  );
  const maxSlot = Math.max(
    1,
    ...visibleWindow.visible.map(
      (node) => slots.current.node(uidOf(node)) - visibleWindow.offset,
    ),
  );
  const bounds = useMemo(() => ({ ...sceneBounds(7), maxZ: F.PIER_END }), []);
  slots.current.visualPosition = (resource) =>
    resource.kind === "Pod"
      ? podVisual(resource, nodesByName, slots.current, coordinator, clock)
          .position
      : resourcePosition(resource, nodesByName, slots.current);
  const lowDetail = quality === "low" || nodes.length > 12;
  // Read-only diagnostic: real identity plus sampled presentation, no setters
  // or dev-only event injection. Useful for correlating watch records/video.
  scene.userData.visualLifecycleState = () => ({
    source: sourceKey,
    clock: clock.current,
    sourceWallStart: lifecycle.current.visual.sourceWallStart,
    nodes: [...lifecycle.current.visual.nodes.keys()].map((uid) => ({
      uid,
      ...lifecycle.current.visual.nodeVisual(uid, clock.current * 1000),
      pose: fleet.current.snapshotShip(uid) || null,
    })),
    containers: [...lifecycle.current.visual.containers.values()].map(
      (effect) => ({
        uid: effect.uid,
        name: effect.name,
        role: effect.role,
        phase: effect.phase,
        reason: effect.reason,
        count: effect.count,
        started: effect.started,
        recoverAt: effect.recoverAt,
        position: effect.origin ? [...effect.view.position] : null,
        origin: effect.origin ? [...effect.origin] : null,
        destination: effect.destination ? [...effect.destination] : null,
      }),
    ),
    signals: lifecycle.current.visual.signals.map(
      ({ resource, ...signal }) => signal,
    ),
    summary: lifecycle.current.visual.summary(clock.current * 1000),
  });
  scene.userData.harborStats = () => ({
    canonicalNodes: nodes.length,
    visibleNodes: visibleWindow.visible.length,
    nodePage: visibleWindow.page,
    nodePages: visibleWindow.pageCount,
    canonicalPods: pods.length,
    visiblePods: renderPods.length,
    nodeSlots: slots.current.nodes.size,
    podSlots: slots.current.pods.size,
    activeTransfers: coordinator.current.active.length,
    queuedTransfers: coordinator.current.queue.length,
    visualLoadingUIDs: [
      ...new Set(
        [...coordinator.current.active, ...coordinator.current.queue].map(
          (job) => job.uid,
        ),
      ),
    ],
    exitGhosts: lifecycle.current.ghosts.length,
    containerTransitions: lifecycle.current.containers.active.size,
    visualEvents: lifecycle.current.visual.summary(clock.current * 1000),
    summarizedTransfers: coordinator.current.summarized || 0,
  });
  useEffect(() => {
    if (onWindowInfo)
      onWindowInfo({
        ...visibleWindow,
        next: () =>
          setWindowIndex((value) =>
            Math.min(visibleWindow.pageCount - 1, value + 1),
          ),
        previous: () => setWindowIndex((value) => Math.max(0, value - 1)),
      });
  }, [
    visibleWindow.page,
    visibleWindow.pageCount,
    visibleWindow.total,
    onWindowInfo,
  ]);
  useEffect(() => {
    if (
      shipControls?.followUID &&
      slots.current.nodes.has(shipControls.followUID)
    )
      setWindowIndex(
        Math.floor(
          slots.current.node(shipControls.followUID) / F.VISIBLE_CAPACITY,
        ),
      );
  }, [shipControls?.followUID]);
  const lastExplicitFocus = useRef(focusRequest);
  useEffect(() => {
    if (lastExplicitFocus.current === focusRequest) return;
    lastExplicitFocus.current = focusRequest;
    const resource = resources.find((r) => uidOf(r) === selectedUID);
    const node =
      resource?.kind === "Node"
        ? resource
        : nodesByName.get(resource?.spec?.nodeName);
    if (node)
      setWindowIndex(
        Math.floor(slots.current.node(uidOf(node)) / F.VISIBLE_CAPACITY),
      );
  }, [focusRequest, selectedUID, nodesByName, resources]);
  useEffect(() => {
    if (!snapshotReady) return;
    const now = performance.now(),
      live = new Map(resources.map((resource) => [uidOf(resource), resource])),
      state = lifecycle.current;
    state.ghosts = state.ghosts.filter((ghost) => now < ghost.expires);
    if (state.initialized) {
      for (const [uid, previous] of state.previous)
        if (
          !live.has(uid) &&
          previous.position &&
          confirmedRemoval(uid, resourceTombstones)
        )
          state.ghosts.push({
            ...previous,
            ...slots.current.lastVisual?.get(uid),
            uid,
            started: now,
            expires: now + (reducedMotion ? 180 : 600),
          });
    } else {
      // A snapshot is a baseline, even if the cluster has zero Pods. It must
      // never be replayed as ADD animations when the socket becomes ready.
      coordinator.current.reset();
      state.containers.reset();
      state.initialized = true;
    }
    state.ghosts = state.ghosts.slice(-12);
    if (slots.current.lastVisual)
      for (const uid of slots.current.lastVisual.keys())
        if (!live.has(uid)) slots.current.lastVisual.delete(uid);
    state.previous = new Map(
      resources
        .filter((r) => r.kind === "Pod" || r.kind === "Node")
        .map((resource) => [
          uidOf(resource),
          {
            resource,
            position: resourcePosition(resource, nodesByName, slots.current),
          },
        ]),
    );
    slots.current.reconcile(resources);
    coordinator.current.observe(
      pods,
      nodesByName,
      slots.current,
      !visible || reducedMotion || motion.reduced || motion.paused,
      clock.current * 1000,
      snapshotOrigins,
    );
    state.visual.observe(nodes, pods, {
      now: clock.current * 1000,
      source: sourceKey,
      simple:
        reducedMotion ||
        motion.reduced ||
        motion.paused ||
        motion.operations === "simple",
      hidden: !visible,
      snapshotReady,
      resources,
      snapshotUIDs: snapshotOrigins,
      newNodeUIDs,
    });
    state.containers.active = state.visual.pulses;
    setLifecycleRevision((revision) => revision + 1);
    clearTimeout(lifecycleTimer.current);
    const scheduleExpiry = () => {
      const wallNow = performance.now();
      state.ghosts = state.ghosts.filter((g) => g.expires > wallNow);
      for (const [key, event] of state.containers.active)
        if (event.expires <= clock.current * 1000)
          state.containers.active.delete(key);
      setLifecycleRevision((revision) => revision + 1);
      invalidate();
      const expires = [
        ...state.ghosts.map((g) => g.expires),
        ...[...state.containers.active.values()].map(
          (e) => wallNow + Math.max(0, e.expires - clock.current * 1000),
        ),
      ];
      if (expires.length)
        lifecycleTimer.current = setTimeout(
          scheduleExpiry,
          Math.max(16, Math.min(...expires) - wallNow + 10),
        );
    };
    const expires = [
      ...state.ghosts.map((g) => g.expires),
      ...[...state.containers.active.values()].map(
        (e) => now + Math.max(0, e.expires - clock.current * 1000),
      ),
    ];
    if (expires.length)
      lifecycleTimer.current = setTimeout(
        scheduleExpiry,
        Math.max(16, Math.min(...expires) - now + 10),
      );
    invalidate();
  }, [
    resources,
    pods,
    nodesByName,
    reducedMotion,
    sourceKey,
    snapshotReady,
    visibleWindow.page,
    visible,
    motion.reduced,
    motion.paused,
    motion.operations,
    resourceTombstones,
    snapshotOrigins,
  ]);
  useEffect(() => {
    if (!snapshotReady) return;
    lifecycle.current.visual.observeOperations(
      workloadOperations,
      clock.current * 1000,
      {
        simple:
          reducedMotion ||
          motion.reduced ||
          motion.paused ||
          motion.operations === "simple",
        hidden: !visible,
      },
    );
    invalidate();
  }, [
    workloadOperations,
    snapshotReady,
    sourceKey,
    visible,
    reducedMotion,
    motion.reduced,
    motion.paused,
    motion.operations,
    invalidate,
  ]);
  useEffect(() => () => clearTimeout(lifecycleTimer.current), []);
  useEffect(() => {
    const listener = () => {
      setVisible(!document.hidden);
      if (!document.hidden) invalidate();
    };
    document.addEventListener("visibilitychange", listener);
    return () => document.removeEventListener("visibilitychange", listener);
  }, [invalidate]);
  useEffect(() => {
    scene.background = new THREE.Color("#dae5e6");
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.92;
  }, [scene, gl]);
  useEffect(() => {
    if (!onStats) return;
    const timer = setInterval(
      () =>
        onStats({
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
        }),
      2000,
    );
    return () => clearInterval(timer);
  }, [onStats, gl]);
  const hover = useCallback(
    (resource) => setHovered(resource ? uidOf(resource) : null),
    [],
  );
  return (
    <>
      <fog attach="fog" args={["#43808c", 2800, 14000]} />
      <hemisphereLight args={["#eaf4f7", "#536b70", 1.5]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[lightCenter[0] - 368, 275, lightCenter[1] - 198]}
        target={lightTarget}
        intensity={2.4}
        color="#fff0ce"
        castShadow={quality !== "low"}
        shadow-mapSize-width={quality === "high" ? 4096 : 2048}
        shadow-mapSize-height={quality === "high" ? 4096 : 2048}
        shadow-camera-left={nearby.length ? -540 : -280}
        shadow-camera-right={nearby.length ? 540 : 280}
        shadow-camera-top={nearby.length ? 440 : 280}
        shadow-camera-bottom={nearby.length ? -440 : -280}
        shadow-camera-far={1200}
        shadow-normalBias={0.06}
        shadow-bias={-0.00012}
        shadow-radius={3}
      />
      <primitive object={lightTarget} />
      <WorkspaceHarbors detailedIds={nearby.map(h => h.id)} harbors={workspaceHarbors} activeId={activeHarborId} materials={materials} onSelect={onHarborSelect} canSelect={canSelect} onPickStart={onPickStart} relations={workspaceRelations} showRelations={layers.network} onRelations={onHarborRelations} />
      {nearby.map(harbor => <NearbyHarbor key={harbor.id} harbor={harbor} index={workspaceHarbors.indexOf(harbor)}
        session={workspaceRegistry?.sessions.get(harbor.id)} views={visualViews.current} protectedSources={protectedSources}
        materials={materials} quality={quality} layers={layers} clock={clock} waterState={waterState} motion={motion} visible={visible}
        canSelect={canSelect} onPickStart={onPickStart} onHarborSelect={onHarborSelect} onSelect={onHarborResourceSelect} />)}
      {activeHarbor && <HarborNameplate harbor={activeHarbor} position={worldOffset} active onSelect={onHarborSelect} />}
      <group name="workspace:active-harbor" userData={{ harborId: activeHarborId }} position={[worldOffset[0], 0, worldOffset[1]]}>
      <FleetFrame
        fleet={fleet.current}
        clock={clock}
        waterState={waterState}
        motion={motion}
        shipControls={shipControls}
        visible={visible}
        coordinator={coordinator}
        selectedUID={
          selected?.kind === "Pod"
            ? nodesByName.get(selected.spec?.nodeName)?.metadata.uid
            : selectedUID
        }
        onShipMotionChange={onShipMotionChange}
        lifecycle={lifecycle}
        slots={slots}
        worldOffset={worldOffset}
      />
      <Ocean
        motion={motion}
        clock={clock}
        waterState={waterState}
        quality={quality}
        bounds={bounds}
      />
      <Terrain materials={materials} bounds={bounds} lowDetail={lowDetail} />
      <WorldFacilities
        materials={materials}
        onOpenFacility={onOpenFacility}
        selectedFacility={selectedFacility}
        canSelect={canSelect}
        pierEnd={bounds.maxZ}
      />
      {layers.nodes !== false &&
        visibleWindow.visible.map((node) => {
          const uid = uidOf(node),
            slot = slots.current.node(uid),
            position = berthPosition(slot - visibleWindow.offset),
            state = readyState(node);
          return (
            <VesselGroup
              key={uid}
              uid={uid}
              fleet={fleet.current}
              motion={motion}
              clock={clock}
              waterState={waterState}
            >
              <group
                name={`node:${uid}`}
                userData={{
                  harborTarget: {
                    type: "node",
                    uid,
                    name: node.metadata.name,
                    local: [0, 11.8 + D.SHIP_FREEBOARD_LIFT, -21.8],
                  },
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onPickStart(`node:${uid}`);
                }}
              >
                <CargoShip
                  position={[0, 0, 0]}
                  materials={materials}
                  state={state}
                  slot={slot}
                  selected={selectedUID === uid}
                  hovered={hovered === uid}
                  lowDetail={lowDetail}
                  radarData={{ uid, name: node.metadata.name }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canSelect(e, `node:${uid}`)) onSelect?.(node);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    hover(node);
                    document.body.style.cursor = "pointer";
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    hover(null);
                    document.body.style.cursor = "auto";
                  }}
                />
                <ResourceLabel
                  resource={node}
                  position={[0, 8, 29]}
                  offset={slot % 4 < 2 ? -28 : 38}
                  selected={selectedUID === uid}
                  hover={hovered === uid}
                  labels={layers.labels !== false && nodes.length <= 12}
                />
                {(node.status?.conditions || []).some(
                  (c) =>
                    ["MemoryPressure", "DiskPressure", "PIDPressure"].includes(
                      c.type,
                    ) && c.status === "True",
                ) && (
                  <Html
                    style={{ pointerEvents: "none" }}
                    position={[0, 18, -22]}
                    center
                    zIndexRange={[7, 0]}
                  >
                    <span
                      style={{
                        ...labelStyle,
                        borderColor: "#c99735",
                        color: "#8f661d",
                      }}
                    >
                      {(node.status.conditions || [])
                        .filter(
                          (c) =>
                            [
                              "MemoryPressure",
                              "DiskPressure",
                              "PIDPressure",
                            ].includes(c.type) && c.status === "True",
                        )
                        .map((c) => c.type)
                        .join(" · ")}
                    </span>
                  </Html>
                )}
                {state !== "ready" && (
                  <Html
                    style={{ pointerEvents: "none" }}
                    position={[9, 12, -23]}
                    center
                    zIndexRange={[7, 0]}
                  >
                    <span
                      title={STATE_LABELS[state]}
                      style={{
                        ...labelStyle,
                        borderColor: STATE_COLORS[state],
                        color: STATE_COLORS[state],
                        fontWeight: 700,
                      }}
                    >
                      {state === "unknown"
                        ? "? İletişim kaybı · fiziksel arıza kanıtı değil"
                        : `! ${STATE_LABELS[state]}`}
                    </span>
                  </Html>
                )}
                {fleet.current.ships.get(uid)?.mode === "launching" && (
                  <NodeArrivalCaption
                    uid={uid}
                    fleet={fleet.current}
                    ready={state === "ready"}
                  />
                )}
              </group>
            </VesselGroup>
          );
        })}
      {[0, 1, 2].map((index) => (
        <WorkingCrane
          key={index}
          index={index}
          materials={materials}
          coordinator={coordinator}
          reducedMotion={reducedMotion}
          lowDetail={lowDetail}
          onOpenFacility={onOpenFacility}
          selectedFacility={selectedFacility}
          canSelect={canSelect}
          clock={clock}
        />
      ))}
      {layers.pods !== false && (
        <PodCargo
          pods={renderPods}
          nodesByName={nodesByName}
          slots={slots.current}
          materials={materials}
          selectedUID={selectedUID}
          onSelect={onSelect}
          onHover={hover}
          hovering={hovered}
          labels={layers.labels !== false}
          transfers={coordinator}
          reducedMotion={reducedMotion}
          lowDetail={lowDetail}
          canSelect={canSelect}
          onPickStart={onPickStart}
          clock={clock}
          lifecycle={lifecycle}
          selectedContainerName={selectedContainerName}
        />
      )}
      <LifecycleEffects
        hoveredUID={hovered}
        containerMarkers={containerMarkers}
        lifecycle={lifecycle}
        nodes={visibleWindow.visible}
        nodesByName={nodesByName}
        pods={renderPods}
        fleet={fleet.current}
        slots={slots.current}
        clock={clock}
        materials={materials}
        reducedMotion={
          reducedMotion ||
          motion.reduced ||
          motion.operations === "simple" ||
          motion.paused
        }
        onSelect={onSelect}
        onOpenFacility={onOpenFacility}
        canSelect={canSelect}
        onPickStart={onPickStart}
        selectedUID={selectedUID}
        layers={layers}
        provisionOperations={provisionOperations}
        workloadOperations={workloadOperations}
      />
      <LifecycleIndicators
        pods={renderPods}
        nodesByName={nodesByName}
        slots={slots.current}
        lifecycle={lifecycle}
        revision={lifecycleRevision}
        selectedUID={selectedUID}
        reducedMotion={reducedMotion}
        labels={layers.labels !== false}
        visibleNamespace={visibleNamespace}
        transfers={coordinator}
        clock={clock}
      />
      <FacilityResources
        resources={resources}
        nodesByName={nodesByName}
        slots={slots.current}
        materials={materials}
        selectedUID={selectedUID}
        onSelect={onSelect}
        layers={layers}
        sourceKey={sourceKey}
        canSelect={canSelect}
        visibleNamespace={visibleNamespace}
      />
      {layers.measuredTraffic && (
        <MeasuredTraffic
          selectedUID={selectedUID}
          data={measuredFlows}
          resources={resources}
          nodesByName={nodesByName}
          slots={slots.current}
          visibleNamespace={visibleNamespace}
          clock={clock}
          motion={motion}
          canSelect={canSelect}
          onPickStart={onPickStart}
          onFlowSelect={onFlowSelect}
          harborEndpoints={harborEndpoints}
          activeHarborId={activeHarborId}
          worldOffset={worldOffset}
        />
      )}
      <DockShuttles
        coordinator={coordinator}
        materials={materials}
        reducedMotion={reducedMotion}
        clock={clock}
      />
      </group>
      <OrbitControls
        ref={controls}
        makeDefault
        onStart={() => {
          viewBridge?.current?.cancelTransition?.();
          if (shipControls?.followUID) onFollowEnd?.();
        }}
        enableDamping
        dampingFactor={0.13}
        minDistance={32}
        maxDistance={Math.max(1800, bounds.maxZ * 2.5, workspaceHarbors.length > 1 ? 15000 : 0)}
        minPolarAngle={Math.PI / 10}
        maxPolarAngle={Math.PI / 2.4}
        enablePan
        screenSpacePanning={false}
        zoomSpeed={0.75}
        target={[0, 0, 0]}
        onChange={() => {
          if (controls.current) {
            controls.current.target.y = Math.max(
              0,
              Math.min(30, controls.current.target.y),
            );
            invalidate();
          }
        }}
      />
      <ViewController
        controls={controls}
        bounds={bounds}
        focusRequest={focusRequest}
        overviewRequest={overviewRequest}
        selected={selected}
        slots={slots.current}
        nodesByName={nodesByName}
        sourceKey={windowKey}
        focusFacilityRequest={focusFacilityRequest}
        shipControls={shipControls}
        fleet={fleet.current}
        motion={motion}
        onFollowEnd={onFollowEnd}
        worldOffset={worldOffset}
        harborView={harborView}
        viewBridge={viewBridge}
        activeHarborId={activeHarborId}
        workspaceHarbors={workspaceHarbors}
      />
    </>
  );
}

class HarborErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div
        role="status"
        style={{ padding: 32, color: "#526074", font: "14px system-ui" }}
      >
        3D görünüm başlatılamadı. Üstteki Bul kontrolüyle tesislere ve gerçek
        kaynak işlemlerine erişebilirsiniz.
        <button
          type="button"
          onClick={() => {
            this.setState({ error: null });
            this.props.onRetry?.();
          }}
          style={{ display: "block", marginTop: 12 }}
        >
          Düşük kaliteyle yeniden dene
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function HarborScene({
  resources = [],
  selectedUID,
  selectedContainerName,
  provisionOperations = EMPTY_OPERATIONS,
  workloadOperations = EMPTY_OPERATIONS,
  resourceTombstones = EMPTY_TOMBSTONES,
  snapshotUIDs = EMPTY_SNAPSHOT_UIDS,
  measuredFlows = null,
  onFlowSelect,
  onSelect,
  quality = "medium",
  layers = {},
  focusRequest = 0,
  overviewRequest = 0,
  reducedMotion = false,
  sourceKey = "cluster",
  isStale = false,
  onStats,
  visibleNamespace = null,
  snapshotReady = true,
  onOpenFacility,
  selectedFacility,
  onMissed,
  focusFacilityRequest,
  motion = DEFAULT_MOTION,
  shipControls = {},
  onFollowEnd,
  onShipMotionChange,
  workspaceHarbors,
  activeHarborId,
  workspaceRelations,
  onHarborSelect,
  onHarborRelations,
  harborView,
  viewBridge,
  harborEndpoints,
  workspaceRegistry,
  onHarborResourceSelect,
}) {
  const [lost, setLost] = useState(false),
    [fallback, setFallback] = useState(false),
    [retry, setRetry] = useState(0);
  const gesture = useRef(new PointerGesture(5));
  const canSelect = useCallback(
    (event, key) => gesture.current.canSelect(event, key),
    [],
  );
  const onPickStart = useCallback((key) => gesture.current.target(key), []);
  const localQuality = fallback ? "low" : quality;
  const [windowInfo, setWindowInfo] = useState(null);
  const created = useCallback(({ gl, camera, scene, invalidate }) => {
    const canvas = gl.domElement;
    const stopBenchmark = globalThis.__KUBEVIEW_BENCHMARK__?.renderer(gl);
    canvas.__harbor = {
      camera,
      scene,
      invalidate,
      fleetStates: () => scene.userData.fleetStates?.() || [],
      visualLifecycleState: () =>
        scene.userData.visualLifecycleState?.() || null,
      projectTargets: (filter = {}) => {
        scene.updateMatrixWorld(true);
        const rect = canvas.getBoundingClientRect(),
          result = [],
          vector = new THREE.Vector3(),
          matrix = new THREE.Matrix4(),
          raycaster = new THREE.Raycaster(),
          pointer = new THREE.Vector2();
        const occluders = [];
        scene.traverse((object) => {
          if (
            !object.isMesh ||
            object.material?.wireframe ||
            (object.material?.transparent &&
              object.material.opacity < 0.9 &&
              object.material.colorWrite !== false)
          )
            return;
          for (let parent = object; parent; parent = parent.parent)
            if (!parent.visible) return;
          occluders.push(object);
        });
        const candidates = [
          [0, 0.501, 0],
          ...[-0.32, 0, 0.32].flatMap((x) =>
            [-0.35, 0, 0.35].map((z) => [x, 0.501, z]),
          ),
          ...[-0.501, 0.501].flatMap((x) =>
            [-0.25, 0.1, 0.35].flatMap((y) =>
              [-0.3, 0, 0.3].map((z) => [x, y, z]),
            ),
          ),
          ...[-0.501, 0.501].flatMap((z) =>
            [-0.25, 0.1, 0.35].flatMap((y) =>
              [-0.3, 0, 0.3].map((x) => [x, y, z]),
            ),
          ),
        ];
        const project = (descriptor, object, local, instance) => {
          for (let parent = object; parent; parent = parent.parent) if (parent.userData?.harborId) { descriptor = { ...descriptor, harborId: parent.userData.harborId }; break; }
          if (
            Object.entries(filter).some(
              ([key, value]) => descriptor[key] !== value,
            )
          )
            return;
          let visible = false,
            point = null;
          if (instance != null) {
            object.getMatrixAt(instance, matrix);
            for (const face of candidates) {
              vector
                .set(...face)
                .applyMatrix4(matrix)
                .applyMatrix4(object.matrixWorld);
              const distance = camera.position.distanceTo(vector);
              vector.project(camera);
              if (
                vector.z < -1 ||
                vector.z > 1 ||
                Math.abs(vector.x) > 1 ||
                Math.abs(vector.y) > 1
              )
                continue;
              pointer.set(vector.x, vector.y);
              raycaster.setFromCamera(pointer, camera);
              raycaster.far = distance + 0.5;
              const hit = raycaster.intersectObjects(occluders, false)[0];
              if (hit?.object !== object || hit.instanceId !== instance)
                continue;
              // A subpixel sliver under another container is not a reliable tap
              // target. Require a small CSS-pixel neighborhood on the same face.
              const safe = [
                [-1.1, 0],
                [1.1, 0],
                [0, -1.1],
                [0, 1.1],
              ].every(([dx, dy]) => {
                pointer.set(
                  vector.x + (dx * 2) / rect.width,
                  vector.y - (dy * 2) / rect.height,
                );
                raycaster.setFromCamera(pointer, camera);
                const nearby = raycaster.intersectObjects(occluders, false)[0];
                return (
                  nearby?.object === object && nearby.instanceId === instance
                );
              });
              if (safe) {
                visible = true;
                point = vector.clone();
                break;
              }
            }
            if (!point)
              vector
                .set(0, 0.5, 0)
                .applyMatrix4(matrix)
                .applyMatrix4(object.matrixWorld)
                .project(camera);
          } else {
            vector
              .set(...local)
              .applyMatrix4(object.matrixWorld)
              .project(camera);
            visible =
              vector.z > -1 &&
              vector.z < 1 &&
              Math.abs(vector.x) < 1 &&
              Math.abs(vector.y) < 1;
          }
          result.push({
            ...descriptor,
            x: rect.left + ((vector.x + 1) * rect.width) / 2,
            y: rect.top + ((1 - vector.y) * rect.height) / 2,
            visible,
          });
        };
        scene.traverse((object) => {
          if (!object.visible) return;
          const target = object.userData?.harborTarget;
          if (target) {
            const { local, ...descriptor } = target;
            project(descriptor, object, local || [0, 0, 0]);
          }
          const targets = object.userData?.harborTargets?.();
          if (targets)
            for (const target of targets) {
              const { instance, ...descriptor } = target;
              project(descriptor, object, null, instance);
            }
        });
        return result;
      },
      stats: () => ({
        ...gl.info.render,
        measuredTraffic: scene.userData.measuredTrafficStats?.() || null,
        memory: { ...gl.info.memory },
        lifecycle: scene.userData.harborStats?.(),
      }),
    };
    const onLost = (e) => {
      e.preventDefault();
      setLost(true);
    };
    const onRestore = () => setLost(false);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestore);
    canvas.__harborCleanup = () => {
      stopBenchmark?.();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestore);
    };
  }, []);
  const wrap = useRef();
  useEffect(
    () => () => {
      wrap.current?.querySelector("canvas")?.__harborCleanup?.();
    },
    [],
  );
  return (
    <div
      ref={wrap}
      data-harbor-scene="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#d8e5e6",
      }}
      onPointerDownCapture={(event) => gesture.current.down(event)}
      onPointerMoveCapture={(event) => gesture.current.move(event)}
      onPointerUpCapture={(event) => gesture.current.up(event)}
    >
      <HarborErrorBoundary
        onRetry={() => {
          setFallback(true);
          setRetry((x) => x + 1);
        }}
      >
        <Canvas
          key={retry}
          style={{ position: "absolute", inset: 0 }}
          frameloop="demand"
          dpr={[
            1,
            localQuality === "low" ? 1 : localQuality === "high" ? 1.75 : 1.4,
          ]}
          shadows={localQuality !== "low"}
          camera={{ fov: 24, near: 0.5, far: 2500, position: [180, 220, 280] }}
          gl={{
            antialias: localQuality !== "low",
            alpha: false,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true,
          }}
          onCreated={created}
          onPointerMissed={(event) => {
            if (canSelect(event)) onMissed?.();
          }}
          fallback={
            <div style={{ padding: 32, font: "14px system-ui" }}>
              WebGL kullanılamıyor. Üstteki Bul kontrolüyle tesisleri ve kaynak
              işlemlerini açabilirsiniz.
            </div>
          }
        >
          <Suspense fallback={null}>
            <SceneWorld
              resources={resources}
              selectedUID={selectedUID}
              selectedContainerName={selectedContainerName}
              provisionOperations={provisionOperations}
              workloadOperations={workloadOperations}
              resourceTombstones={resourceTombstones}
              snapshotUIDs={snapshotUIDs}
              measuredFlows={measuredFlows}
              onFlowSelect={onFlowSelect}
              onSelect={onSelect}
              quality={localQuality}
              layers={layers}
              focusRequest={focusRequest}
              overviewRequest={overviewRequest}
              reducedMotion={reducedMotion}
              sourceKey={sourceKey}
              onStats={onStats}
              visibleNamespace={visibleNamespace}
              snapshotReady={snapshotReady}
              onWindowInfo={setWindowInfo}
              onOpenFacility={onOpenFacility}
              selectedFacility={selectedFacility}
              canSelect={canSelect}
              focusFacilityRequest={focusFacilityRequest}
              motion={motion}
              shipControls={shipControls}
              onFollowEnd={onFollowEnd}
              onPickStart={onPickStart}
              onShipMotionChange={onShipMotionChange}
              workspaceHarbors={workspaceHarbors}
              activeHarborId={activeHarborId}
              workspaceRelations={workspaceRelations}
              onHarborSelect={onHarborSelect}
              onHarborRelations={onHarborRelations}
              harborView={harborView}
              viewBridge={viewBridge}
              harborEndpoints={harborEndpoints}
              workspaceRegistry={workspaceRegistry}
              onHarborResourceSelect={onHarborResourceSelect}
            />
          </Suspense>
        </Canvas>
      </HarborErrorBoundary>
      {windowInfo?.pageCount > 1 && (
        <nav
          aria-label="3D Node sayfaları"
          style={{
            position: "absolute",
            left: 68,
            top: 68,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            border: "1px solid #cfdce1",
            borderRadius: 7,
            background: "#ffffffed",
            color: "#334958",
            font: "12px system-ui",
            boxShadow: "0 2px 8px #12323e15",
          }}
        >
          <button
            type="button"
            aria-label="Önceki Node grubu"
            disabled={windowInfo.page === 0}
            onClick={windowInfo.previous}
            style={{
              width: 36,
              height: 36,
              border: "1px solid #d5dfe3",
              background: "#fff",
              borderRadius: 4,
            }}
          >
            ‹
          </button>
          <span>
            {windowInfo.first}–{windowInfo.last} / {windowInfo.total} Node ·
            tümü merkezde
          </span>
          <button
            type="button"
            aria-label="Sonraki Node grubu"
            disabled={windowInfo.page >= windowInfo.pageCount - 1}
            onClick={windowInfo.next}
            style={{
              width: 36,
              height: 36,
              border: "1px solid #d5dfe3",
              background: "#fff",
              borderRadius: 4,
            }}
          >
            ›
          </button>
        </nav>
      )}
      {lost && (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            padding: 24,
            background: "#f4f6f8eb",
            font: "14px system-ui",
            color: "#17212f",
          }}
        >
          3D grafik bağlantısı kesildi. Kaynak verileri korunuyor.
          <button
            type="button"
            onClick={() => {
              setFallback(true);
              setLost(false);
              setRetry((x) => x + 1);
            }}
            style={{ marginTop: 12 }}
          >
            Düşük kaliteyle yeniden aç
          </button>
        </div>
      )}
      {isStale && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            ...labelStyle,
            color: "#855910",
            background: "#fff8e9",
          }}
        >
          Son bilinen görünüm · veri güncel değil
        </div>
      )}
    </div>
  );
}
export default React.memo(HarborScene);
