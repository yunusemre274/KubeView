import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 1. HorizontalPodAutoscaler (HPA) Extra Mobile Crane
export function HPAMobileCrane({ position = [-4, 1, 6] }) {
  const craneRef = useRef()

  useFrame(({ clock }) => {
    if (craneRef.current) {
      craneRef.current.position.z = 6 + Math.sin(clock.getElapsedTime() * 1.5) * 3
    }
  })

  return (
    <group ref={craneRef} position={position}>
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[1.5, 8, 1.5]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} />
      </mesh>
      <mesh position={[2, 7.5, 0]} castShadow>
        <boxGeometry args={[6, 1.0, 1.2]} />
        <meshStandardMaterial color="#d97706" metalness={0.5} />
      </mesh>
    </group>
  )
}

// 2. Node Affinity / Anti-Affinity Magnetic Guide Lines
export function NodeAffinityLines({ start = [2, 1, 4], end = [-22, 1, 0], active = true }) {
  if (!active) return null

  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3((start[0] + end[0]) / 2, 4, (start[2] + end[2]) / 2),
    new THREE.Vector3(...end)
  ]
  const curve = new THREE.CatmullRomCurve3(points)
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32))

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#10b981" transparent opacity={0.6} linewidth={2} />
    </line>
  )
}

// 3. PodDisruptionBudget (PDB) Maintenance Flag
export function PDBMaintenanceFlag({ position = [-16, 2, 14] }) {
  const flagRef = useRef()

  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.2
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>
      <mesh ref={flagRef} position={[0.6, 2.5, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}
