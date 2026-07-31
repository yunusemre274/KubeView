import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 1. STATEFULSET SHIP (Numaralı, Sabit Demirli Özel Gemi)
export function StatefulSetShip({
  position = [-14, 0, -22],
  stsData,
  onSelectStatefulSet
}) {
  const [hovered, setHovered] = useState(false)
  const flagRef = useRef()

  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.15
    }
  })

  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelectStatefulSet && onSelectStatefulSet(stsData); }}
    >
      {/* Gemi Gövdesi (Sabit Demirli) */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[8.5, 1.2, 22]} />
        <meshStandardMaterial color="#4c1d95" metalness={0.6} roughness={0.3} />
      </mesh>

      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.5, 1.8, 22]} />
        <meshStandardMaterial
          color={hovered ? '#c084fc' : '#581c87'}
          emissive={hovered ? '#a855f7' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Sabit Çapa (Anchor Symbol) */}
      <mesh position={[-4.4, 1.2, 9]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.6, 0.1, 8, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} />
      </mesh>

      {/* Ordinal Numarası Rozet Panosu (#0, #1) */}
      <group position={[0, 5.2, -7]}>
        <mesh castShadow>
          <boxGeometry args={[3.2, 2.2, 0.4]} />
          <meshStandardMaterial color="#0f172a" border="#a855f7" />
        </mesh>
        <pointLight color="#a855f7" intensity={2} distance={10} />
      </group>

      {/* StatefulSet Pod Kutusu (redis-cache-set-0) */}
      <group position={[0, 3.6, 2]} castShadow>
        <mesh>
          <boxGeometry args={[2.4, 2.0, 4.8]} />
          <meshStandardMaterial color="#a855f7" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.45, 2.05, 4.85]} />
          <meshStandardMaterial color="#070a12" wireframe />
        </mesh>
      </group>
    </group>
  )
}

// 2. DAEMONSET EQUIPMENT (Her Geminin Direğinde Tekrar Eden 3D Anten / Ekipman)
export function DaemonSetEquipment({
  position = [0, 8.5, -7],
  dsData,
  onSelectDaemonSet
}) {
  const [hovered, setHovered] = useState(false)
  const spinnerRef = useRef()

  useFrame(({ clock }) => {
    if (spinnerRef.current) {
      spinnerRef.current.rotation.y = clock.getElapsedTime() * 3
    }
  })

  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelectDaemonSet && onSelectDaemonSet(dsData); }}
    >
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 1.8, 8]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} />
      </mesh>

      <group ref={spinnerRef} position={[0, 0.9, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.55]} />
          <meshStandardMaterial
            color={hovered ? '#fbbf24' : '#38bdf8'}
            emissive={hovered ? '#f59e0b' : '#0284c7'}
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>
    </group>
  )
}

// 3. JOB TASK BOAT (Tek Seferlik Görev Teknesi / Şalupa)
export function JobTaskBoatMesh({
  position = [14, 0.2, 18],
  jobData,
  onSelectJob
}) {
  const [hovered, setHovered] = useState(false)
  const boatRef = useRef()
  const isFailed = jobData?.status === 'Failed'
  const isCompleted = jobData?.status === 'Completed'

  useFrame(({ clock }) => {
    if (boatRef.current) {
      const t = clock.getElapsedTime()
      boatRef.current.position.y = Math.sin(t * 2) * 0.08
      boatRef.current.rotation.z = Math.sin(t * 1.5) * 0.04
    }
  })

  return (
    <group
      ref={boatRef}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelectJob && onSelectJob(jobData); }}
    >
      {/* Küçük Şalupa Gövdesi */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[4.2, 1.0, 9]} />
        <meshStandardMaterial
          color={isFailed ? '#991b1b' : isCompleted ? '#059669' : hovered ? '#fbbf24' : '#d97706'}
          emissive={isFailed ? '#ef4444' : isCompleted ? '#10b981' : hovered ? '#f59e0b' : '#000000'}
          emissiveIntensity={hovered || isFailed || isCompleted ? 0.5 : 0}
          metalness={0.4}
        />
      </mesh>

      {/* Görev Kargo Yükü */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[2.0, 1.2, 3.6]} />
        <meshStandardMaterial color={isFailed ? '#ef4444' : '#10b981'} metalness={0.3} />
      </mesh>

      {/* Sinyal Feneri */}
      <pointLight color={isFailed ? '#ef4444' : '#10b981'} intensity={2} distance={8} />
    </group>
  )
}
