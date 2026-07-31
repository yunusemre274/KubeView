import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

// ConfigMap (Sevkiyat Föyü Panosu) & Secret (Kilitli Çelik Kasa) 3D Meshes
export default function ConfigMapAndSecretMesh({
  configMapPosition = [-8, 0.2, -18],
  secretPosition = [-2, 0.2, -18],
  onSelectConfigMap,
  onSelectSecret
}) {
  const [hoveredCM, setHoveredCM] = useState(false)
  const [hoveredSec, setHoveredSec] = useState(false)
  const lockBeaconRef = useRef()

  useFrame(({ clock }) => {
    if (lockBeaconRef.current) {
      lockBeaconRef.current.rotation.y = clock.getElapsedTime() * 2
    }
  })

  return (
    <group>
      {/* 1. CONFIGMAP 3D MESH — SEVKİYAT FÖYÜ / TALİMAT PANOSU */}
      <group
        position={configMapPosition}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredCM(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHoveredCM(false); }}
        onClick={(e) => { e.stopPropagation(); onSelectConfigMap && onSelectConfigMap(); }}
      >
        {/* Pano Ayakları */}
        <mesh position={[-1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.2, 4, 0.2]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        <mesh position={[1.6, 2, 0]} castShadow>
          <boxGeometry args={[0.2, 4, 0.2]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>

        {/* Tahta Pano Gövdesi */}
        <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 2.6, 0.3]} />
          <meshStandardMaterial
            color={hoveredCM ? '#fbbf24' : '#b45309'}
            emissive={hoveredCM ? '#d97706' : '#000000'}
            emissiveIntensity={hoveredCM ? 0.3 : 0}
            roughness={0.7}
          />
        </mesh>

        {/* İğnelenmiş Sevkiyat Föy Kağıdı 1 */}
        <mesh position={[-0.8, 3.8, 0.18]} castShadow>
          <boxGeometry args={[1.3, 1.8, 0.04]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        <mesh position={[-0.8, 4.5, 0.22]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#ef4444" metalness={0.5} />
        </mesh>

        {/* İğnelenmiş Sevkiyat Föy Kağıdı 2 */}
        <mesh position={[0.8, 3.7, 0.18]} castShadow>
          <boxGeometry args={[1.3, 1.7, 0.04]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} />
        </mesh>
        <mesh position={[0.8, 4.4, 0.22]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} />
        </mesh>
      </group>

      {/* 2. SECRET 3D MESH — KİLİTLİ ÇELİK KASA */}
      <group
        position={secretPosition}
        onPointerOver={(e) => { e.stopPropagation(); setHoveredSec(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHoveredSec(false); }}
        onClick={(e) => { e.stopPropagation(); onSelectSecret && onSelectSecret(); }}
      >
        {/* Beton Kaide Base */}
        <mesh position={[0, 0.3, 0]} receiveShadow>
          <boxGeometry args={[4.2, 0.6, 4.2]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Ağır Çelik Kasa Gövdesi */}
        <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 3.4, 3.2]} />
          <meshStandardMaterial
            color={hoveredSec ? '#38bdf8' : '#0f172a'}
            emissive={hoveredSec ? '#0284c7' : '#000000'}
            emissiveIntensity={hoveredSec ? 0.4 : 0}
            metalness={0.85}
            roughness={0.2}
          />
        </mesh>

        {/* Kasa Kapak Çerçevesi */}
        <mesh position={[0, 2.3, 1.62]}>
          <boxGeometry args={[2.6, 2.8, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Altın Asma Kilit Simgesi */}
        <group position={[0, 2.3, 1.72]}>
          {/* Kilit Gövdesi */}
          <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.8, 0.7, 0.15]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Kilit Halkası */}
          <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.25, 0.06, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
          </mesh>
        </group>

        {/* Dönen Güvenlik Sinyal Feneri */}
        <group ref={lockBeaconRef} position={[0, 4.3, 0]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.3, 0.6, 12]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.2} />
          </mesh>
          <pointLight color="#f59e0b" intensity={2} distance={10} />
        </group>
      </group>
    </group>
  )
}
