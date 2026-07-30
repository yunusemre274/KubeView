import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function NetworkPolicyBarriers({ position = [-10, 1.5, 0], active = true, onSelectNetworkPolicy }) {
  const laserRef = useRef()

  useFrame(({ clock }) => {
    if (laserRef.current) {
      laserRef.current.material.opacity = 0.5 + Math.sin(clock.getElapsedTime() * 4) * 0.25
    }
  })

  if (!active) return null

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelectNetworkPolicy && onSelectNetworkPolicy(); }}
    >
      {/* Security Barrier Pillar 1 */}
      <mesh position={[0, 2, -18]} castShadow>
        <boxGeometry args={[0.6, 4, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Security Barrier Pillar 2 */}
      <mesh position={[0, 2, 18]} castShadow>
        <boxGeometry args={[0.6, 4, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Red Laser Fence Beam */}
      <mesh ref={laserRef} position={[0, 2.5, 0]}>
        <boxGeometry args={[0.15, 0.15, 36]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} transparent opacity={0.7} />
      </mesh>

      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.15, 0.15, 36]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}
