import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { resourcePosition, uidOf } from "./layout.js";
import {
  flowEndpointResource,
  prioritizeMeasuredFlows,
} from "./resourceRelations.js";
import { Lettering } from "./assets.jsx";
import { OBJECT_DESCRIPTIONS } from "../constants/descriptions.js";

const MAX_FLOWS = 96,
  SEGMENTS = 12;
const providerCaption = {
  background: "#edf5f3",
  border: "1px solid #62968f",
  borderRadius: 5,
  color: "#234e4a",
  padding: "5px 8px",
  font: "500 12px/1.4 system-ui",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

/** Actual Hubble flow-event windows. No Service ports, random packets or payload. */
export default function MeasuredTraffic({
  data,
  resources,
  nodesByName,
  slots,
  visibleNamespace,
  clock,
  motion,
  canSelect,
  onPickStart,
  onFlowSelect,
  selectedUID,
}) {
  const { invalidate, scene } = useThree(),
    line = useRef(),
    arrows = useRef(),
    caption = useRef(),
    live = useRef([]),
    expiry = useRef({ timer: null, at: 0 }),
    stats = useRef({}),
    hovered = useRef(null);
  const byUID = useMemo(
    () =>
      new Map(
        resources.filter((r) => r.kind === "Pod").map((r) => [uidOf(r), r]),
      ),
    [resources],
  );
  const flows = useMemo(
    () =>
      prioritizeMeasuredFlows(data?.flows || [], selectedUID).map((flow) => ({
        flow,
        source: flowEndpointResource(flow.source, byUID),
        destination: flowEndpointResource(flow.destination, byUID),
        at: Date.parse(flow.lastObserved),
        expires:
          Date.parse(flow.lastObserved) +
          Math.max(1, data.windowSeconds || 10) * 1000,
      })),
    [data, byUID, selectedUID],
  );
  const objects = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(MAX_FLOWS * SEGMENTS * 6), 3),
    );
    return {
      geometry,
      arrow: new THREE.ConeGeometry(0.7, 2.5, 5),
      // setColorAt uses instanceColor, not a missing geometry color attribute.
      arrowMaterial: new THREE.MeshBasicMaterial({
        color: "#6fafa6",
      }),
      lineMaterial: new THREE.LineBasicMaterial({
        color: "#609c95",
        transparent: true,
        opacity: 0.58,
      }),
      dummy: new THREE.Object3D(),
      direction: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      color: new THREE.Color(),
    };
  }, []);
  useEffect(() => {
    const read = () => stats.current;
    scene.userData.measuredTrafficStats = read;
    return () => {
      if (scene.userData.measuredTrafficStats === read)
        delete scene.userData.measuredTrafficStats;
    };
  }, [scene]);
  useEffect(() => {
    invalidate();
    return () => {
      clearTimeout(expiry.current.timer);
      expiry.current = { timer: null, at: 0 };
    };
  }, [flows, data?.status, invalidate]);
  useEffect(
    () => () => {
      for (const k of ["geometry", "arrow", "arrowMaterial", "lineMaterial"])
        objects[k].dispose();
      arrows.current?.dispose?.();
    },
    [objects],
  );
  useFrame(() => {
    const now = Date.now(),
      moving =
        !document.hidden &&
        !motion?.paused &&
        !motion?.reduced &&
        data?.status === "live";
    const shown = live.current;
    shown.length = 0;
    let unresolved = 0,
      otherRegion = 0,
      outsideNamespace = 0,
      expired = 0,
      activeCount = 0,
      nextExpiry = Infinity;
    for (const record of flows) {
      if (!Number.isFinite(record.expires) || record.expires <= now) {
        expired++;
        continue;
      }
      nextExpiry = Math.min(nextExpiry, record.expires);
      if (!record.source || !record.destination) {
        unresolved++;
        continue;
      }
      if (
        visibleNamespace &&
        (record.source.metadata.namespace !== visibleNamespace ||
          record.destination.metadata.namespace !== visibleNamespace)
      ) {
        outsideNamespace++;
        continue;
      }
      if (
        slots.visiblePodUIDs &&
        (!slots.visiblePodUIDs.has(uidOf(record.source)) ||
          !slots.visiblePodUIDs.has(uidOf(record.destination)))
      ) {
        otherRegion++;
        continue;
      }
      const a = resourcePosition(record.source, nodesByName, slots),
        b = resourcePosition(record.destination, nodesByName, slots);
      if (!a || !b) {
        otherRegion++;
        continue;
      }
      activeCount++;
      if (shown.length < MAX_FLOWS) {
        record.a = a;
        record.b = b;
        shown.push(record);
      }
    }
    let offset = 0;
    const array = objects.geometry.attributes.position.array;
    for (let i = 0; i < shown.length; i++) {
      const { flow, a, b } = shown[i],
        samePod = flow.source.uid === flow.destination.uid;
      const distance = Math.hypot(a[0] - b[0], a[2] - b[2]),
        height = Math.min(22, 4 + distance * 0.05);
      const point = (t, k) =>
        a[k] +
        (b[k] - a[k]) * t +
        (k === 1
          ? Math.sin(Math.PI * t) * height + 1
          : samePod
            ? (k === 0
                ? Math.sin(t * Math.PI * 2)
                : 1 - Math.cos(t * Math.PI * 2)) * 5
            : 0);
      for (let j = 0; j < SEGMENTS; j++)
        for (const t of [j / SEGMENTS, (j + 1) / SEGMENTS])
          for (let k = 0; k < 3; k++) array[offset++] = point(t, k);
      // Repeated tokens summarize observed flow events in the displayed window;
      // frequency is never labelled packet rate or bytes/bandwidth.
      const count = Math.max(1, flow.eventCount || 1),
        rate = Math.min(
          2.5,
          0.35 + (count / Math.max(1, data.windowSeconds || 10)) * 0.18,
        );
      const phase = moving ? (clock.current * rate + i * 0.173) % 1 : 0.68;
      objects.dummy.position.set(
        point(phase, 0),
        point(phase, 1),
        point(phase, 2),
      );
      const next = Math.min(0.9999, phase + 0.005),
        previous = Math.max(0, phase - 0.005);
      objects.direction
        .set(
          point(next, 0) - point(previous, 0),
          point(next, 1) - point(previous, 1),
          point(next, 2) - point(previous, 2),
        )
        .normalize();
      objects.dummy.quaternion.setFromUnitVectors(
        objects.up,
        objects.direction,
      );
      objects.dummy.scale.setScalar(
        1.1 + Math.min(0.9, Math.log2(count + 1) * 0.12),
      );
      objects.dummy.updateMatrix();
      arrows.current?.setMatrixAt(i, objects.dummy.matrix);
      arrows.current?.setColorAt(
        i,
        objects.color.set(
          flow.verdict === "DROPPED" || flow.verdict === "ERROR"
            ? "#c47a60"
            : "#75b7aa",
        ),
      );
    }
    objects.geometry.setDrawRange(0, offset / 3);
    objects.geometry.attributes.position.needsUpdate = offset > 0;
    objects.lineMaterial.opacity = data?.status === "live" ? 0.58 : 0.24;
    if (line.current) line.current.visible = shown.length > 0;
    if (arrows.current) {
      arrows.current.visible = shown.length > 0;
      arrows.current.count = shown.length;
      if (shown.length) {
        arrows.current.instanceMatrix.needsUpdate = true;
        if (arrows.current.instanceColor)
          arrows.current.instanceColor.needsUpdate = true;
        arrows.current.computeBoundingSphere();
      }
    }
    Object.assign(stats.current, {
      provider: "hubble",
      status: data?.status || "disabled",
      windowSeconds: data?.windowSeconds || 10,
      inputFlows: flows.length,
      renderedFlows: shown.length,
      unresolved,
      otherRegion,
      outsideNamespace,
      expired,
      aggregatedOutOfView: Math.max(0, activeCount - shown.length),
      providerDropped: data?.dropped || 0,
      providerSummarized: data?.summarized || 0,
    });
    if (caption.current) {
      const status =
        {
          live: "ölçülmüş akış olayları",
          stale: "veri eski · canlı iddiası yok",
          connecting: "bağlanıyor",
          disabled: "sağlayıcı kapalı",
          forbidden: "yetki yok",
          error: "bağlantı hatası",
        }[data?.status] || "sağlayıcı kapalı";
      const omitted =
        unresolved +
        otherRegion +
        outsideNamespace +
        Math.max(0, activeCount - shown.length);
      const selected =
        hovered.current &&
        shown.find((r) => r.flow.id === hovered.current)?.flow;
      const value = selected
        ? `${selected.source.name || "?"} → ${selected.destination.name || "?"} · ${selected.protocol || "Bilinmiyor"} · İncelemek için seçin`
        : `Hubble · ${status} · ${data?.windowSeconds || 10}sn · ${shown.length}/${activeCount + unresolved + otherRegion + outsideNamespace} akış${omitted ? ` · ${omitted} kimlik/kapsam/bölge nedeniyle çizilmedi` : ""} · flow olayı ≠ paket`;
      if (caption.current.textContent !== value)
        caption.current.textContent = value;
    }
    if (moving && shown.length) invalidate();
    else if (!document.hidden) {
      const next = nextExpiry;
      if (Number.isFinite(next) && expiry.current.at !== next) {
        clearTimeout(expiry.current.timer);
        expiry.current.at = next;
        expiry.current.timer = setTimeout(
          () => {
            expiry.current.timer = null;
            expiry.current.at = 0;
            invalidate();
          },
          Math.max(16, next - now + 5),
        );
      }
    }
  }, -0.4);
  const pick = (e) => live.current[e.instanceId]?.flow,
    key = (f) => `flow:${f.id}`;
  return (
    <group name="harbor:measured-hubble-flows">
      <lineSegments
        ref={line}
        geometry={objects.geometry}
        material={objects.lineMaterial}
        visible={false}
        frustumCulled={false}
        raycast={() => null}
      />
      <instancedMesh
        ref={arrows}
        args={[objects.arrow, objects.arrowMaterial, MAX_FLOWS]}
        visible={false}
        dispose={null}
        userData={{
          harborTargets: () =>
            live.current.map((r, instance) => ({
              type: "measured-flow",
              uid: r.flow.id,
              name: `${r.flow.source.name || "?"} → ${r.flow.destination.name || "?"}`,
              instance,
            })),
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          const f = pick(e);
          if (f) onPickStart(key(f));
        }}
        onClick={(e) => {
          e.stopPropagation();
          const f = pick(e);
          if (f && canSelect(e, key(f))) onFlowSelect?.(f);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hovered.current = pick(e)?.id;
          document.body.style.cursor = "pointer";
          invalidate();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          hovered.current = null;
          document.body.style.cursor = "auto";
          invalidate();
        }}
      />
      <Lettering
        position={[109, 8, -54]}
        size={1.2}
        material={objects.arrowMaterial}
      >
        HUBBLE
      </Lettering>
      <Html
        position={[109, 20, -54]}
        center
        style={{ pointerEvents: "none" }}
        zIndexRange={[7, 0]}
      >
        <span
          ref={caption}
          title={OBJECT_DESCRIPTIONS.HARBOR_MEASURED_TRAFFIC.description}
          style={providerCaption}
        >
          Hubble · sağlayıcı durumu bekleniyor
        </span>
      </Html>
    </group>
  );
}
