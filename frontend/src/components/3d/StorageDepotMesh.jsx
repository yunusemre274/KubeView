import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 3D Land-Based Storage Warehouse (PVC / PV Kiralanmış Depo Ambarı)
export default function StorageDepotMesh({
  position = [-28, 0.2, 18],
  pvcData,
  pvData,
  targetPodPosition = [2, 1, 4],
  onSelectStorage
}) {
  const [hovered, setHovered] = useState(false)
  const beaconRef = useRef()
  const lineRef = useRef()

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.getElapsedTime() * 1.5
    }
  })

  // Calculate curve line from Land Storage Depot to target Pod/Ship
  const connectionCurve = React.useMemo(() => {
    const start = new THREE.Vector3(position[0], position[1] + 2.5, position[2])
    const end = new THREE.Vector3(targetPodPosition[0], targetPodPosition[1] + 2.5, targetPodPosition[2])
    const mid = new THREE.Vector3((start.x + end.x) / 2, Math.max(start.y, end.y) + 6, (start.z + end.z) / 2)
    return new THREE.QuadraticBezierCurve3(start, mid, end)
  }, [position, targetPodPosition])

  const linePoints = React.useMemo(() => connectionCurve.getPoints(30), [connectionCurve])

  return (
    <group>
      {/* 1. POD-STORAGE GLOWING CONNECTION LINE */}
      <line ref={lineRef}>
        <bufferGeometry attach="geometry" setFromPoints={linePoints} />
        <lineBasicMaterial attach="material" color="#a855f7" linewidth={3} transparent opacity={0.8} />
      </line>

      {/* 2. 3D LAND STORAGE WAREHOUSE MESH */}
      <group
        position={position}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e) => { e.stopPropagation(); onSelectStorage && onSelectStorage(pvcData, pvData); }}
      >
        {/* Beton Taban Kaide */}
        <mesh position={[0, 0.4, 0]} receiveShadow>
          <boxGeometry args={[7.5, 0.8, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Depo Ambar Ana Gövdesi */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.5, 4.8, 9]} />
          <meshStandardMaterial
            color={hovered ? '#a855f7' : '#1e1b4b'}
            emissive={hovered ? '#7e22ce' : '#000000'}
            emissiveIntensity={hovered ? 0.4 : 0}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Oluklu Çatı (Corrugated Roof) */}
        <mesh position={[0, 6.0, 0]} rotation={[0, 0, 0]} castShadow>
          <prismGeometry args={[7, 1.6, 9]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Ambar Kepenk Kapısı */}
        <mesh position={[3.3, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[4.2, 3.2, 0.1]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Kapasite & Erişim Rozet Panosu */}
        <group position={[0, 5.2, 4.56]}>
          <mesh>
            <boxGeometry args={[4.5, 0.9, 0.1]} />
            <meshStandardMaterial color="#0f172a" border="#a855f7" />
          </mesh>
          <pointLight color="#a855f7" intensity={1.5} distance={8} />
        </group>

        {/* Dönen Sinyal Feneri */}
        <group ref={beaconRef} position={[0, 6.9, 0]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.3, 0.6, 12]} />
            <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.5} />
          </mesh>
          <pointLight color="#a855f7" intensity={2} distance={12} />
        </group>
      </group>
    </group>
  )
}
