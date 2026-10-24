import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Box, Blocks } from "./assets.jsx";
import { resourcePosition, uidOf } from "./layout.js";

const badge = {
  background: "#fffffff2",
  border: "1px solid #d5dfe3",
  padding: "5px 8px",
  borderRadius: 5,
  font: "12px system-ui",
  color: "#223544",
  whiteSpace: "nowrap",
  pointerEvents: "none",
};
function SelectableModule({
  resource,
  position,
  materials: m,
  selectedUID,
  onSelect,
  small = false,
  canSelect = () => true,
}) {
  const [hover, setHover] = useState(false);
  const uid = uidOf(resource);
  const scale = small ? [3, 2.3, 3] : [10, 7.5, 13];
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (canSelect(e)) onSelect?.(resource);
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
        position={[0, scale[1] / 2, 0]}
        scale={scale}
        material={small ? m.dark : m.lightRoof}
      />
      <Box
        position={[0, scale[1] + 0.2, 0]}
        scale={[scale[0] + 0.5, 0.4, scale[2] + 0.5]}
        material={m.roof}
      />
      <Box
        position={[0, scale[1] / 2, scale[2] / 2 + 0.05]}
        scale={[scale[0] * 0.7, scale[1] * 0.68, 0.15]}
        material={m.dark}
      />
      <Box
        position={[0, scale[1] * 0.88, scale[2] / 2 + 0.15]}
        scale={[scale[0] * 0.8, 0.28, 0.15]}
        material={m.yellow}
      />
      {(hover || selectedUID === uid) && (
        <Html
          style={{ pointerEvents: "none" }}
          position={[0, scale[1] + 3, 0]}
          center
          zIndexRange={[8, 0]}
        >
          <div
            style={{
              ...badge,
              borderColor: selectedUID === uid ? "#3b82f6" : "#d5dfe3",
            }}
          >
            <strong>{resource.metadata.name}</strong>
            <div>
              {resource.kind} · {resource.metadata.namespace || "Küme kapsamı"}
            </div>
          </div>
        </Html>
      )}
      {selectedUID === uid && (
        <mesh position={[0, scale[1] / 2, 0]}>
          <boxGeometry args={scale.map((s) => s + 0.4)} />
          <meshBasicMaterial color="#4b8ddc" wireframe depthTest={false} />
        </mesh>
      )}
    </group>
  );
}

/** Resource modules have real UID selection. Decorative hangars never enter the store. */
export default function FacilityResources({
  resources,
  nodesByName,
  slots,
  materials,
  selectedUID,
  onSelect,
  layers,
  sourceKey,
  canSelect,
}) {
  const allocation = useRef({ source: sourceKey, map: new Map(), next: 0 });
  if (allocation.current.source !== sourceKey)
    allocation.current = { source: sourceKey, map: new Map(), next: 0 };
  const storage = resources.filter(
    (r) => r.kind === "PersistentVolumeClaim" || r.kind === "PersistentVolume",
  );
  const services = resources.filter((r) => r.kind === "Service");
  for (const r of storage)
    if (!allocation.current.map.has(uidOf(r)))
      allocation.current.map.set(uidOf(r), allocation.current.next++);
  const visibleStorage = storage.filter(
    (r) => allocation.current.map.get(uidOf(r)) < 3,
  );
  const visibleServices = services.slice(0, 6);
  const selectedService = services.find((s) => uidOf(s) === selectedUID);
  const connectionLinks = useMemo(() => {
    if (!layers.network) return [];
    const links = [];
    for (const service of selectedService
      ? [selectedService]
      : visibleServices) {
      const selector = Object.entries(service.spec?.selector || {});
      if (!selector.length) continue;
      const index = visibleServices.findIndex(
        (s) => uidOf(s) === uidOf(service),
      );
      const source = [-48 + Math.max(0, index) * 4, 4, -51];
      for (const pod of resources
        .filter(
          (p) =>
            p.kind === "Pod" &&
            p.metadata.namespace === service.metadata.namespace &&
            selector.every(
              ([key, value]) => p.metadata.labels?.[key] === value,
            ),
        )
        .slice(0, 30))
        links.push({ source, pod });
    }
    return links;
  }, [resources, layers.network, selectedUID]);
  const connectionGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array(connectionLinks.length * 12 * 6),
        3,
      ),
    );
    return geometry;
  }, [connectionLinks]);
  useFrame(() => {
    if (!layers.network) return;
    const attribute = connectionGeometry.attributes.position,
      values = attribute.array;
    let offset = 0;
    for (const { source, pod } of connectionLinks) {
      const destination = resourcePosition(pod, nodesByName, slots) || source;
      let px = source[0],
        py = source[1],
        pz = source[2];
      for (let segment = 1; segment <= 12; segment++) {
        const t = segment / 12,
          x = source[0] + (destination[0] - source[0]) * t,
          y =
            source[1] +
            (destination[1] - source[1]) * t +
            Math.sin(t * Math.PI) * 9,
          z = source[2] + (destination[2] - source[2]) * t;
        values[offset++] = px;
        values[offset++] = py;
        values[offset++] = pz;
        values[offset++] = x;
        values[offset++] = y;
        values[offset++] = z;
        px = x;
        py = y;
        pz = z;
      }
    }
    attribute.needsUpdate = true;
  });
  useEffect(() => () => connectionGeometry.dispose(), [connectionGeometry]);
  return (
    <group>
      {layers.storage !== false &&
        visibleStorage.map((r) => (
          <SelectableModule
            key={uidOf(r)}
            resource={r}
            position={[
              -108 + allocation.current.map.get(uidOf(r)) * 13,
              1,
              -77,
            ]}
            materials={materials}
            selectedUID={selectedUID}
            onSelect={onSelect}
            canSelect={canSelect}
          />
        ))}
      {layers.network && (
        <>
          {visibleServices.map((r, i) => (
            <SelectableModule
              key={uidOf(r)}
              resource={r}
              position={[-48 + i * 4, 1, -51]}
              materials={materials}
              selectedUID={selectedUID}
              onSelect={onSelect}
              canSelect={canSelect}
              small
            />
          ))}
          <lineSegments geometry={connectionGeometry} frustumCulled={false}>
            <lineBasicMaterial color="#72a6bc" transparent opacity={0.65} />
          </lineSegments>
        </>
      )}
    </group>
  );
}
