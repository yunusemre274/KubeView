import React, { useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Blocks, Lettering } from "./assets.jsx";
import { harborPosition } from "../world/workspace.js";
import { WORKSPACE_DIMENSIONS as W } from "../constants/dimensions.js";
import { OBJECT_DESCRIPTIONS } from "../constants/descriptions.js";

export default function WorkspaceHarbors({ harbors = [], activeId, materials, onSelect, canSelect, onPickStart, relations = [], onRelations, showRelations }) {
  const [hovered, setHovered] = useState(null);
  const ports = useMemo(() => harbors.map((harbor, index) => ({ ...harbor, coordinates: harborPosition(harbor, index) })).filter((harbor) => harbor.id !== activeId), [harbors, activeId]);
  const blocks = useMemo(() => ports.flatMap((harbor) => {
    const [x, z] = harbor.coordinates;
    return [
      { p: [x, 1.5, z], s: W.SILHOUETTE_BASE, c: "#a9b1a8" },
      { p: [x - 25, 11, z - 20], s: W.SILHOUETTE_CENTER, c: harbor.color || "#b47c56" },
      { p: [x + 34, 20, z - 24], s: W.SILHOUETTE_TOWER, c: "#e0d8c5" },
    ];
  }), [ports]);
  const pick = (event) => ports[Math.floor(event.instanceId / 3)];
  const edges = useMemo(() => {
    const positions = { infrastructure: [], configured: [] };
    for (const relation of relations.filter((entry) => entry.sourceHarbor === activeId || entry.targetHarbor === activeId).slice(0, 32)) {
      const source = harbors.find((harbor) => harbor.id === relation.sourceHarbor), target = harbors.find((harbor) => harbor.id === relation.targetHarbor);
      if (!source || !target) continue;
      const a = harborPosition(source, harbors.indexOf(source)), b = harborPosition(target, harbors.indexOf(target));
      positions[relation.type === "infrastructure" ? "infrastructure" : "configured"].push(a[0], 2, a[1], b[0], 2, b[1]);
    }
    return Object.fromEntries(Object.entries(positions).map(([kind, values]) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
      return [kind, geometry];
    }));
  }, [relations, harbors, activeId]);
  const lines = useMemo(() => ({ infrastructure: new THREE.LineBasicMaterial({ color: "#8295a2", transparent: true, opacity: 0.65 }), configured: new THREE.LineBasicMaterial({ color: "#be975f", transparent: true, opacity: 0.75 }) }), []);
  useEffect(() => () => Object.values(edges).forEach((geometry) => geometry.dispose()), [edges]);
  useEffect(() => () => Object.values(lines).forEach((material) => material.dispose()), [lines]);
  return <group name="workspace:inactive-harbors" userData={{ workspaceSilhouette: true }}>
    <Blocks items={blocks} material={materials.concrete} castShadow={false} receiveShadow={false}
      userData={{ harborTargets: () => ports.flatMap((harbor, index) => [0, 1, 2].map((part) => ({ type: "harbor", uid: harbor.id, name: harbor.name, instance: index * 3 + part }))) }}
      onPointerDown={(event) => { event.stopPropagation(); const harbor = pick(event); if (harbor) onPickStart?.(`harbor:${harbor.id}`); }}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(pick(event)?.id); document.body.style.cursor = "pointer"; }}
      onPointerOut={(event) => { event.stopPropagation(); setHovered(null); document.body.style.cursor = "auto"; }}
      onClick={(event) => { event.stopPropagation(); const harbor = pick(event); if (harbor && (canSelect ? canSelect(event, `harbor:${harbor.id}`) : (event.delta || 0) < 5)) onSelect(harbor.id); }} />
    {ports.map((harbor) => <group key={harbor.id}><Lettering position={[harbor.coordinates[0] - 75, 5, harbor.coordinates[1] + 45]} size={9} material={materials.dark}>{harbor.name.slice(0, 48)}</Lettering>{hovered === harbor.id && <Html center position={[harbor.coordinates[0], 48, harbor.coordinates[1]]} zIndexRange={[5, 0]}><button className="workspace-world-port" title={OBJECT_DESCRIPTIONS.WORKSPACE_HARBOR.description} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSelect(harbor.id); }}><strong>{harbor.name}</strong><span>Proje limanı · {harbor.namespaces.join(", ")} · Bağlantıyı incele</span></button></Html>}</group>)}
    {showRelations && Object.entries(edges).map(([kind, geometry]) => <lineSegments key={kind} geometry={geometry} material={lines[kind]} raycast={() => null} />)}
    {showRelations && relations.some((entry) => entry.sourceHarbor === activeId || entry.targetHarbor === activeId) && <Html position={[0, 20, 0]} center><button className="workspace-world-port" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onRelations?.(); }} title="Gri çizgi doğrulanmış ortak altyapıdır; altın çizgi yapılandırılmış ilişkidir. Ölçülmüş trafik veya kapasite transferi değildir.">Liman ilişkileri · altyapı / yapılandırma</button></Html>}
  </group>;
}
