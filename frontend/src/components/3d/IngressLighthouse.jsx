import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export default function IngressLighthouse({ position = [28, 0.2, 18], onSelectIngress, onHover }) {
  const beaconRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.getElapsedTime() * 1.8
    }
  })

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    onHover && onHover('INGRESS')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    onHover && onHover(null)
  }

  return (
    <group
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => { e.stopPropagation(); onSelectIngress && onSelectIngress(); }}
    >
      {/* 3D Visual Identification Label */}
      <Text position={[0, 10.5, 0]} fontSize={0.65} color="#38bdf8" anchorX="center" outlineWidth={0.06} outlineColor="#0f172a">
        🚨 INGRESS GATEWAY
      </Text>

      {/* Outer Harbor Pier */}
      <mesh position={[0, 0.4, 0]} receiveShadow castShadow>
        <boxGeometry args={[10, 1.2, 14]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Lighthouse Tower Base */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[1.8, 2.5, 6, 16]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : '#f8fafc'} roughness={0.3} />
      </mesh>

      {/* Red Stripe */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[2.0, 2.1, 1.2, 16]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>

      {/* Lighthouse Beacon Housing */}
      <mesh position={[0, 7.5, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 1.8, 12]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.7} />
      </mesh>

      {/* Lighthouse Roof Cap */}
      <mesh position={[0, 9.0, 0]} castShadow>
        <coneGeometry args={[2.2, 1.5, 12]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} />
      </mesh>

      {/* Rotating Beacon Light Beam */}
      <group ref={beaconRef} position={[0, 7.5, 0]}>
        <mesh position={[2.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[1.2, 5, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.5} transparent opacity={0.65} />
        </mesh>
        <pointLight color="#f59e0b" intensity={3.5} distance={25} />
      </group>
    </group>
  )
}
