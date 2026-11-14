import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Box, Blocks } from "./assets.jsx";
import { resourcePosition, uidOf } from "./layout.js";
import { ResourceModuleSlots, topologyRelations } from "./resourceRelations.js";

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
      name={`resource-module:${uid}`}
      userData={{
        harborTarget: {
          type: "resource-module",
          uid,
          name: resource.metadata.name,
          namespace: resource.metadata.namespace,
          kind: resource.kind,
          local: [0, scale[1], 0],
        },
      }}
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
  visibleNamespace,
}) {
  const allocation = useRef({
    source: sourceKey,
    storage: new ResourceModuleSlots(),
    storageDisplay: new ResourceModuleSlots(),
    services: new ResourceModuleSlots(),
  });
  if (allocation.current.source !== sourceKey)
    allocation.current = {
      source: sourceKey,
      storage: new ResourceModuleSlots(),
      storageDisplay: new ResourceModuleSlots(),
      services: new ResourceModuleSlots(),
    };
  const allStorage = resources.filter(
    (r) => r.kind === "PersistentVolumeClaim" || r.kind === "PersistentVolume",
  );
  const sortedStorage = allocation.current.storage
    .reconcile(allStorage)
    .filter(
      (r) =>
        !visibleNamespace ||
        !r.metadata.namespace ||
        r.metadata.namespace === visibleNamespace,
    );
  const services = allocation.current.services.reconcile(
    resources.filter((r) => r.kind === "Service"),
  );
  const visibleStorage = sortedStorage.slice(0, 3);
  const selectedStorage = sortedStorage.find((r) => uidOf(r) === selectedUID);
  if (selectedStorage && !visibleStorage.includes(selectedStorage))
    visibleStorage.push(selectedStorage);
  allocation.current.storageDisplay.reconcile(visibleStorage);
  const topology = useMemo(
    () =>
      layers.network
        ? topologyRelations(
            resources,
            services,
            nodesByName,
            slots,
            selectedUID,
            visibleNamespace,
          )
        : {
            services: [],
            links: [],
            anchors: new Map(),
            totalServices: 0,
            matchedPods: 0,
            outsideWindow: 0,
            aggregated: false,
          },
    [
      resources,
      layers.network,
      selectedUID,
      nodesByName,
      slots.windowOffset,
      visibleNamespace,
    ],
  );
  const connectionLinks = topology.links;
  const visibleServices = topology.services;
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
    for (const { source, resource, aggregate } of connectionLinks) {
      const destination = resourcePosition(resource, nodesByName, slots);
      if (!destination) continue;
      let px = source[0],
        py = source[1],
        pz = source[2];
      for (let segment = 1; segment <= 12; segment++) {
        const t = segment / 12,
          x = source[0] + (destination[0] - source[0]) * t,
          y =
            source[1] +
            (destination[1] + (resource.kind === "Node" ? 10 : 0) - source[1]) *
              t +
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
    connectionGeometry.setDrawRange(0, offset / 3);
    attribute.needsUpdate = offset > 0;
  });
  useEffect(() => () => connectionGeometry.dispose(), [connectionGeometry]);
  return (
    <group>
      {layers.storage !== false &&
        visibleStorage.map((r, index) => (
          <SelectableModule
            key={uidOf(r)}
            resource={r}
            position={[
              67 + allocation.current.storageDisplay.map.get(uidOf(r)) * 7,
              1,
              -42,
            ]}
            materials={materials}
            selectedUID={selectedUID}
            onSelect={onSelect}
            canSelect={canSelect}
            small
          />
        ))}
      {layers.storage !== false && sortedStorage.length > 0 && (
        <Html
          position={[80, 10, -43]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[5, 0]}
        >
          <span style={badge}>
            {visibleStorage.length}/{sortedStorage.length} PV/PVC modülü · tümü
            depoda
          </span>
        </Html>
      )}
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
          <Html
            position={[-40, 10, -51]}
            center
            style={{ pointerEvents: "none" }}
            zIndexRange={[5, 0]}
          >
            <span style={badge}>
              Topoloji · {visibleServices.length}/{topology.totalServices}{" "}
              Service · {topology.matchedPods} Pod bağı
              {topology.aggregated ? " · Node bazında özet" : ""}
              {topology.outsideWindow
                ? ` · ${topology.outsideWindow} hedef diğer bölgede`
                : ""}
            </span>
          </Html>
          <lineSegments
            geometry={connectionGeometry}
            frustumCulled={false}
            raycast={() => null}
          >
            <lineBasicMaterial color="#72a6bc" transparent opacity={0.65} />
          </lineSegments>
        </>
      )}
    </group>
  );
}
