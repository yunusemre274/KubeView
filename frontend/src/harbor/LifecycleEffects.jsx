import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { VISUAL_EVENT_DIMENSIONS as V } from "../constants/dimensions.js";
import { OBJECT_DESCRIPTIONS } from "../constants/descriptions.js";
import { Box, Blocks, CargoShip, Lettering } from "./assets.jsx";
import { vesselPointToWorld } from "./fleet.js";
import { resourcePosition, uidOf } from "./layout.js";
import { hashColor } from "./materials.js";

const caption = {
  background: "#fff9ef",
  color: "#713b24",
  border: "1px solid #be7650",
  borderRadius: 5,
  padding: "5px 8px",
  font: "500 12px/1.4 system-ui",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};
const FIRE_POINTS = [
  [-4.5, 4.8, -8],
  [4.5, 4.8, 9],
  [-2, 7, -24],
];

function EventParticles({ lifecycle, nodes, fleet, clock, reducedMotion }) {
  const flames = useRef(),
    smoke = useRef(),
    rings = useRef();
  const capacity = Math.max(1, nodes.length * 3),
    nodeIDs = useMemo(() => new Set(nodes.map(uidOf)), [nodes]);
  const objects = useMemo(
    () => ({
      flame: new THREE.ConeGeometry(1, 1, 7),
      cloud: new THREE.SphereGeometry(1, 7, 5),
      ring: new THREE.RingGeometry(0.83, 1, 24),
      // setColorAt supplies instanceColor; these geometries have no color attribute.
      fire: new THREE.MeshBasicMaterial({
        color: "#ffb241",
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      soot: new THREE.MeshBasicMaterial({
        color: "#5d6265",
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
      foam: new THREE.MeshBasicMaterial({
        color: "#d5ece7",
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      dummy: new THREE.Object3D(),
      color: new THREE.Color(),
      point: [0, 0, 0],
    }),
    [],
  );
  useEffect(
    () => () => {
      for (const k of ["flame", "cloud", "ring", "fire", "soot", "foam"])
        objects[k].dispose();
    },
    [objects],
  );
  useEffect(() => {
    const meshes = [flames.current, smoke.current];
    return () => meshes.forEach((m) => m?.dispose?.());
  }, [capacity]);
  useEffect(() => {
    const mesh = rings.current;
    return () => mesh?.dispose?.();
  }, []);
  useFrame(() => {
    const now = clock.current * 1000,
      time = reducedMotion ? 0 : clock.current;
    let f = 0,
      s = 0,
      r = 0;
    const { dummy, point, color } = objects;
    for (const uid of nodeIDs) {
      const pose = fleet.pose(uid),
        state = lifecycle.current.visual.nodeVisual(uid, now);
      if (!pose || !state || state.fault < 0.002) continue;
      const amount = state.fault;
      for (let i = 0; i < FIRE_POINTS.length; i++) {
        vesselPointToWorld(pose, FIRE_POINTS[i], point);
        const flicker = 1 + 0.17 * Math.sin(time * 8 + i * 2.3);
        dummy.position.set(point[0], point[1] + 2.1 * amount, point[2]);
        dummy.rotation.set(pose.pitch, pose.yaw + i, pose.roll);
        dummy.scale.set(1.6 * amount, 5.2 * amount * flicker, 1.5 * amount);
        dummy.updateMatrix();
        flames.current?.setMatrixAt(f, dummy.matrix);
        flames.current?.setColorAt(
          f++,
          color.set(i % 2 ? "#ff8a2c" : "#ffd36a"),
        );
        for (let j = 0; j < 3; j++) {
          const phase = (((time * 0.38 + j / 3 + i * 0.11) % 1) + 1) % 1;
          dummy.position.set(
            point[0] + Math.sin(phase * 4 + i) * 1.8,
            point[1] + 4 + phase * 10,
            point[2] + phase * 3.5,
          );
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(
            (1.1 + phase * 2.2) * amount * (1 - phase * 0.25),
          );
          dummy.updateMatrix();
          smoke.current?.setMatrixAt(s++, dummy.matrix);
        }
      }
    }
    if (!reducedMotion)
      for (const effect of lifecycle.current.visual.containers.values()) {
        if (
          r >= V.MAX_CONTAINER_EFFECTS ||
          !effect.destination ||
          effect.phase === "settled"
        )
          continue;
        const phase = effect.view.splash;
        if (!(phase > 0 && phase < 1)) continue;
        dummy.position.set(effect.destination[0], 0.22, effect.destination[2]);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        const radius = 1.2 + phase * 6;
        dummy.scale.set(radius, radius, radius);
        dummy.updateMatrix();
        rings.current?.setMatrixAt(r++, dummy.matrix);
      }
    for (const [ref, count] of [
      [flames, f],
      [smoke, s],
      [rings, r],
    ])
      if (ref.current) {
        ref.current.visible = count > 0;
        ref.current.count = count;
        if (count) {
          ref.current.instanceMatrix.needsUpdate = true;
          ref.current.computeBoundingSphere();
        }
      }
    if (flames.current?.instanceColor)
      flames.current.instanceColor.needsUpdate = true;
  }, -0.6);
  return (
    <group name="harbor:bounded-event-particles">
      <instancedMesh
        key={`f${capacity}`}
        ref={flames}
        args={[objects.flame, objects.fire, capacity]}
        visible={false}
        raycast={() => null}
        dispose={null}
      />
      <instancedMesh
        key={`s${capacity}`}
        ref={smoke}
        args={[objects.cloud, objects.soot, capacity * 3]}
        visible={false}
        raycast={() => null}
        dispose={null}
      />
      <instancedMesh
        ref={rings}
        args={[objects.ring, objects.foam, V.MAX_CONTAINER_EFFECTS]}
        visible={false}
        raycast={() => null}
        dispose={null}
      />
    </group>
  );
}

export function NodeArrivalCaption({ uid, fleet, ready }) {
  const text = useRef();
  useFrame(() => {
    if (text.current) {
      const ship = fleet.ships.get(uid);
      text.current.hidden = ship?.mode !== "launching";
      const value = `Gerçek Node kaydı · ${!ready ? "Ready bekleniyor" : ship?.launchReserved ? "Kızaktan katılım" : "Güvenli katılım aralığı bekleniyor"}`;
      if (text.current.textContent !== value) text.current.textContent = value;
    }
  }, -0.5);
  return (
    <Html
      position={[0, 22, -8]}
      center
      style={{ pointerEvents: "none" }}
      zIndexRange={[8, 0]}
    >
      <span
        ref={text}
        hidden
        style={{ ...caption, color: "#4b697a", borderColor: "#6d8d9b" }}
      >
        Gerçek Node kaydı · kızaktan katılım ·{" "}
        {ready ? "Ready" : "Ready bekleniyor"}
      </span>
    </Html>
  );
}

function FaultMarker({
  effect,
  clock,
  selectedUID,
  hovered,
  onSelect,
  canSelect,
  onPickStart,
  materials,
}) {
  const group = useRef(),
    text = useRef(),
    lastVisible = useRef(null),
    key = `container:${effect.uid}:${effect.name}`;
  useFrame(() => {
    if (!group.current) return;
    const visible = effect.origin && effect.phase !== "settled";
    group.current.visible = !!visible;
    if (visible)
      group.current.position.set(
        effect.view.position[0],
        Math.max(0.8, effect.view.position[1]) + 2,
        effect.view.position[2],
      );
    if (text.current) {
      if (lastVisible.current !== visible) {
        text.current.style.display = visible ? "block" : "none";
        lastVisible.current = visible;
      }
      const phase =
        effect.phase === "recovering"
          ? "Görsel tekrar yükleme"
          : effect.phase === "faulted"
            ? "Arıza izi · kaynak hâlâ mevcut"
            : "Görsel arıza geçişi";
      const value = `${hovered ? `${effect.resource.metadata.namespace}/${effect.resource.metadata.name} · ` : ""}${effect.name} · ${effect.reason} · ${phase}`;
      if (text.current.textContent !== value) text.current.textContent = value;
    }
  }, -0.5);
  return (
    <group ref={group} visible={false} name={`container-fault:${effect.key}`}>
      <mesh
        userData={{
          harborTarget: {
            type: "container-fault",
            uid: effect.uid,
            name: effect.name,
            role: effect.role,
            namespace: effect.resource.metadata.namespace,
          },
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPickStart?.(key);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (canSelect(e, key))
            onSelect?.(effect.resource, {
              containerName: effect.name,
              containerRole: effect.role,
            });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
        }}
      >
        <octahedronGeometry args={[0.65, 0]} />
        <meshBasicMaterial
          color={effect.phase === "recovering" ? "#36847a" : "#bf6844"}
        />
      </mesh>
      <Lettering position={[0, 1, 0]} size={1} material={materials.yellow}>
        !
      </Lettering>
      <Html
        center
        position={[0, 2.3, 0]}
        style={{ pointerEvents: "none" }}
        zIndexRange={[8, 0]}
      >
        <span
          ref={text}
          title={OBJECT_DESCRIPTIONS.HARBOR_CONTAINER_FAULT.description}
          style={{
            ...caption,
            display: "block",
            maxWidth: 260,
            whiteSpace: "normal",
            transform: "translate(calc(50% + 26px), -8px)",
          }}
        />
      </Html>
    </group>
  );
}

function ProcessSignals({
  lifecycle,
  nodesByName,
  slots,
  clock,
  layers,
  onSelect,
  onOpenFacility,
  onPickStart,
  canSelect,
}) {
  const balls = useRef(),
    lines = useRef(),
    active = useRef([]),
    captionRef = useRef();
  const objects = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(V.MAX_PROCESS_SIGNALS * 12 * 6),
        3,
      ),
    );
    return {
      geometry: g,
      ball: new THREE.SphereGeometry(0.65, 7, 5),
      // Instance color is independent of the material's per-vertex color flag.
      material: new THREE.MeshBasicMaterial(),
      line: new THREE.LineBasicMaterial({
        color: "#b89f55",
        transparent: true,
        opacity: 0.28,
      }),
      dummy: new THREE.Object3D(),
      color: new THREE.Color(),
    };
  }, []);
  useEffect(
    () => () => {
      for (const k of ["geometry", "ball", "material", "line"])
        objects[k].dispose();
      balls.current?.dispose?.();
    },
    [objects],
  );
  const anchor = (signal, which) =>
    which === "pod"
      ? resourcePosition(signal.resource, nodesByName, slots)
      : which === "center"
        ? [-42, 19, -72]
        : which === "workloads"
          ? [0, 12, -45]
          : [-92, 4, -45];
  useFrame(() => {
    const now = clock.current * 1000,
      enabled = layers.controlPlane !== false;
    const current = enabled
      ? lifecycle.current.visual.signals
          .filter(
            (s) =>
              s.expires > now &&
              (s.source !== "pod" ||
                resourcePosition(s.resource, nodesByName, slots)) &&
              (s.destination !== "pod" ||
                resourcePosition(s.resource, nodesByName, slots)),
          )
          .slice(-V.MAX_PROCESS_SIGNALS)
      : [];
    active.current = current;
    if (captionRef.current) captionRef.current.hidden = !current.length;
    const array = objects.geometry.attributes.position.array;
    let offset = 0;
    for (let i = 0; i < current.length; i++) {
      const event = current[i],
        a = anchor(event, event.source),
        b = anchor(event, event.destination),
        p = Math.max(
          0,
          Math.min(1, (now - event.started) / (event.expires - event.started)),
        );
      const point = (t, k) =>
        a[k] + (b[k] - a[k]) * t + (k === 1 ? Math.sin(Math.PI * t) * 13 : 0);
      for (let j = 0; j < 12; j++)
        for (const t of [j / 12, (j + 1) / 12])
          for (let k = 0; k < 3; k++) array[offset++] = point(t, k);
      objects.dummy.position.set(point(p, 0), point(p, 1), point(p, 2));
      objects.dummy.rotation.set(0, 0, 0);
      objects.dummy.scale.setScalar(1.6);
      objects.dummy.updateMatrix();
      balls.current?.setMatrixAt(i, objects.dummy.matrix);
      balls.current?.setColorAt(
        i,
        objects.color.set(
          hashColor(
            event.resource.metadata.ownerReferences?.[0]?.uid || event.uid,
          ),
        ),
      );
    }
    objects.geometry.setDrawRange(0, current.length * 24);
    objects.geometry.attributes.position.needsUpdate = !!current.length;
    if (lines.current) lines.current.visible = !!current.length;
    if (balls.current) {
      balls.current.visible = !!current.length;
      balls.current.count = current.length;
      if (current.length) {
        balls.current.instanceMatrix.needsUpdate = true;
        if (balls.current.instanceColor)
          balls.current.instanceColor.needsUpdate = true;
        balls.current.computeBoundingSphere();
      }
    }
  }, -0.5);
  const selectKey = (s) => `process:${s.id}`;
  return (
    <group name="harbor:conceptual-control-plane">
      <Html
        position={[-42, 42, -72]}
        center
        style={{ pointerEvents: "none" }}
        zIndexRange={[6, 0]}
      >
        <span
          ref={captionRef}
          hidden
          style={{ ...caption, color: "#706128", borderColor: "#a49a6c" }}
        >
          Temsili süreç · gerçek API / owner / atama / Ready gözlemleri
        </span>
      </Html>
      <lineSegments
        ref={lines}
        geometry={objects.geometry}
        material={objects.line}
        visible={false}
        raycast={() => null}
        frustumCulled={false}
      />
      <instancedMesh
        ref={balls}
        args={[objects.ball, objects.material, V.MAX_PROCESS_SIGNALS]}
        visible={false}
        dispose={null}
        onPointerDown={(e) => {
          e.stopPropagation();
          const s = active.current[e.instanceId];
          if (s) onPickStart(selectKey(s));
        }}
        onClick={(e) => {
          e.stopPropagation();
          const s = active.current[e.instanceId];
          if (s && canSelect(e, selectKey(s))) {
            const live = lifecycle.current.visual.resourceByUID.get(s.uid);
            if (live) onSelect?.(live);
            else onOpenFacility?.("center");
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "auto";
        }}
      />
    </group>
  );
}

function Slipway({
  materials: m,
  operations,
  lifecycle,
  onOpenFacility,
  onPickStart,
  canSelect,
  clock,
  reducedMotion,
}) {
  const [hover, setHover] = useState(false);
  const preparation = useRef(),
    { invalidate } = useThree();
  const rails = useMemo(
    () =>
      [-8, 8].flatMap((x) => [
        { p: [-140 + x, 0.7, -67], s: [0.45, 0.35, 76] },
        ...[-97, -85, -73, -61, -49, -37].map((z) => ({
          p: [-140 + x, 1.1, z],
          s: [1.8, 0.8, 1.1],
        })),
      ]),
    [],
  );
  const draft = operations.find(
    (o) =>
      ["pending", "accepted", "provisioning", "reconciling"].includes(
        o.status,
      ) && !(o.nodeUID && lifecycle.current.visual.nodes.has(o.nodeUID)),
  );
  const draftMaterials = useMemo(() => {
    if (!draft) return null;
    const copies = {};
    for (const [k, value] of Object.entries(m))
      if (value?.isMaterial) {
        const c = value.clone();
        c.transparent = true;
        c.opacity = 0.4;
        c.depthWrite = false;
        copies[k] = c;
      }
    return copies;
  }, [m, !!draft]);
  useEffect(
    () => () => Object.values(draftMaterials || {}).forEach((m) => m.dispose()),
    [draftMaterials],
  );
  useFrame(() => {
    if (!draft || !preparation.current || reducedMotion || document.hidden)
      return;
    preparation.current.position.z = -61 + Math.sin(clock.current * 0.9) * 14;
    // A preparation representation, never a fabricated provider percentage.
    invalidate();
  }, -0.5);
  const key = "facility:center";
  return (
    <group
      name="harbor:node-slipway"
      onPointerDown={(e) => {
        e.stopPropagation();
        onPickStart?.(key);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (canSelect(e, key)) onOpenFacility?.("center");
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHover(false);
        document.body.style.cursor = "auto";
      }}
    >
      <Box
        position={[-140, -0.1, -62]}
        scale={[23, 1, 77]}
        rotation={[-0.025, 0, 0]}
        material={m.concrete}
      />
      <Box
        position={[-124, 0.15, -62]}
        scale={[11, 1.3, 62]}
        material={m.concrete}
      />
      <Blocks items={rails} material={m.rail} />
      <Lettering
        position={[-141, 0.85, -30]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={1.4}
        material={m.dark}
      >
        NODE / KIZAK
      </Lettering>
      {hover && (
        <Html
          position={[-140, 23, -61]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[8, 0]}
        >
          <span style={caption}>
            {OBJECT_DESCRIPTIONS.HARBOR_SLIPWAY.description}
          </span>
        </Html>
      )}
      {draft && (
        <group ref={preparation} position={[-140, 0, -61]}>
          <Box
            position={[-11, 11, 0]}
            scale={[0.5, 22, 0.5]}
            material={m.yellow}
          />
          <Box
            position={[11, 11, 0]}
            scale={[0.5, 22, 0.5]}
            material={m.yellow}
          />
          <Box
            position={[0, 22, 0]}
            scale={[22.8, 0.6, 0.7]}
            material={m.yellow}
          />
        </group>
      )}
      {draft && (
        <group position={V.LAUNCH_POSITION} rotation={[0, Math.PI, 0]}>
          <CargoShip
            position={[0, 0, 0]}
            materials={draftMaterials}
            lowDetail
            state="unknown"
          />
          <Html
            center
            position={[0, 22, 0]}
            style={{ pointerEvents: "none" }}
            zIndexRange={[7, 0]}
          >
            <div
              style={{ ...caption, color: "#4e5c69", borderColor: "#869dad" }}
            >
              <strong>İstek taslağı · Node sayılmaz</strong>
              <div>
                {draft.profile || "minikube"} ·{" "}
                {draft.status === "reconciling"
                  ? "Kayıt uzlaştırılıyor"
                  : "Sağlayıcı işlemi bekleniyor"}
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

export default function LifecycleEffects(props) {
  const {
    lifecycle,
    nodes,
    pods,
    fleet,
    slots,
    clock,
    materials,
    reducedMotion,
    onSelect,
    onOpenFacility,
    canSelect,
    onPickStart,
    selectedUID,
    layers,
    provisionOperations = [],
  } = props;
  const fallbackNodesByName = useMemo(
    () => new Map(nodes.map((n) => [n.metadata.name, n])),
    [nodes],
  );
  const nodesByName = props.nodesByName || fallbackNodesByName;
  const podIDs = useMemo(() => new Set(pods.map(uidOf)), [pods]);
  const markers =
    props.containerMarkers ||
    [...lifecycle.current.visual.containers.values()]
      .filter(
        (e) =>
          podIDs.has(e.uid) &&
          e.phase !== "settled" &&
          (e.uid === selectedUID ||
            clock.current * 1000 - e.started <
              V.CONTAINER_FALL_MS + V.CONTAINER_RECOVER_MS),
      )
      .slice(-V.MAX_CONTAINER_EFFECTS);
  return (
    <group>
      <EventParticles
        lifecycle={lifecycle}
        nodes={nodes}
        fleet={fleet}
        clock={clock}
        reducedMotion={reducedMotion}
      />
      {markers.map((effect) => (
        <FaultMarker
          key={effect.key}
          effect={effect}
          clock={clock}
          materials={materials}
          selectedUID={selectedUID}
          hovered={props.hoveredUID === effect.uid}
          onSelect={onSelect}
          canSelect={canSelect}
          onPickStart={onPickStart}
        />
      ))}
      <ProcessSignals
        lifecycle={lifecycle}
        nodesByName={nodesByName}
        slots={slots}
        clock={clock}
        layers={layers}
        onSelect={onSelect}
        onOpenFacility={onOpenFacility}
        onPickStart={onPickStart}
        canSelect={canSelect}
      />
      <Slipway
        materials={materials}
        operations={provisionOperations}
        lifecycle={lifecycle}
        onOpenFacility={onOpenFacility}
        onPickStart={onPickStart}
        canSelect={canSelect}
        clock={clock}
        reducedMotion={reducedMotion}
      />
      {lifecycle.current.visual.summarized > 0 && (
        <Html
          position={[-92, 8, -45]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[6, 0]}
        >
          <span style={caption}>
            {lifecycle.current.visual.summarized} görsel olay özetlendi · gerçek
            kayıtlar korunur
          </span>
        </Html>
      )}
    </group>
  );
}
