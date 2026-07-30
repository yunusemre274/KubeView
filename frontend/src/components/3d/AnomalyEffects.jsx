import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 1. CrashLoopBackOff - Smoke & Flame Particles
export function SmokeAndFlameEffect({ position = [0, 5, 0] }) {
  const groupRef = useRef()
  const smokeRef1 = useRef()
  const smokeRef2 = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (smokeRef1.current) {
      smokeRef1.current.position.y = (t * 2) % 3 + 1
      smokeRef1.current.scale.setScalar(1 + (t % 1.5) * 0.5)
    }
    if (smokeRef2.current) {
      smokeRef2.current.position.y = ((t + 0.8) * 2) % 3 + 1
      smokeRef2.current.scale.setScalar(1 + ((t + 0.8) % 1.5) * 0.5)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Flame core */}
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#f97316" emissiveIntensity={2.0} />
      </mesh>

      {/* Smoke particle 1 */}
      <mesh ref={smokeRef1} position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.6, 12, 12]} />
        <meshStandardMaterial color="#334155" transparent opacity={0.65} />
      </mesh>

      {/* Smoke particle 2 */}
      <mesh ref={smokeRef2} position={[0.2, 2.2, 0.2]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// 2. Readiness Probe Fail - Red Flag Waving
export function RedFlagEffect({ position = [0, 6, 0] }) {
  const flagRef = useRef()

  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 4) * 0.15
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>

      <mesh ref={flagRef} position={[0.6, 1.8, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

// 3. OOMKilled - Expanding Pop Burst Particle
export function OOMKilledBurstEffect({ position = [0, 4, 0] }) {
  const burstRef = useRef()

  useFrame(({ clock }) => {
    if (burstRef.current) {
      const scale = (clock.getElapsedTime() * 3) % 2.5
      burstRef.current.scale.setScalar(scale)
      burstRef.current.material.opacity = Math.max(0, 1 - scale / 2.5)
    }
  })

  return (
    <mesh ref={burstRef} position={position}>
      <sphereGeometry args={[1.2, 16, 16]} />
      <meshStandardMaterial color="#a855f7" emissive="#c084fc" emissiveIntensity={2} transparent opacity={0.8} />
    </mesh>
  )
}
