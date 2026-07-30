import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FlowLine({ start = [18, 1, -16], end = [2, 1, 4], color = '#38bdf8' }) {
  const particleRef = useRef()

  useFrame(({ clock }) => {
    if (particleRef.current) {
      const t = (clock.getElapsedTime() * 0.4) % 1
      const x = THREE.MathUtils.lerp(start[0], end[0], t)
      const y = THREE.MathUtils.lerp(start[1], end[1], t) + Math.sin(t * Math.PI) * 1.5
      const z = THREE.MathUtils.lerp(start[2], end[2], t)
      particleRef.current.position.set(x, y, z)
    }
  })

  const points = [
    new THREE.Vector3(...start),
    new THREE.Vector3(
      (start[0] + end[0]) / 2,
      Math.max(start[1], end[1]) + 2.5,
      (start[2] + end[2]) / 2
    ),
    new THREE.Vector3(...end)
  ]
  const curve = new THREE.CatmullRomCurve3(points)
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32))

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.35} linewidth={2} />
      </line>

      <mesh ref={particleRef}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}

export default function NetworkTrafficParticles({ ships = [], showTraffic = true }) {
  if (!showTraffic) return null

  const kubeProxyPos = [18, 1, -16]
  const masterPos = [-22, 2, -14]

  return (
    <group>
      {/* Kube-proxy -> Master Node line */}
      <FlowLine start={kubeProxyPos} end={masterPos} color="#f59e0b" />

      {/* Kube-proxy -> Worker Node Ships lines */}
      {ships.map((ship) => (
        <FlowLine
          key={ship.id}
          start={kubeProxyPos}
          end={[ship.position[0], 1, ship.position[2]]}
          color="#38bdf8"
        />
      ))}
    </group>
  )
}
