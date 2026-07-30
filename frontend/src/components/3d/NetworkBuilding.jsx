import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// Kube-proxy Network & Radio Tower Building
export function NetworkBuilding({ position = [14, 0.2, -14] }) {
  const beaconRef = useRef()

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.getElapsedTime() * 2
    }
  })

  return (
    <group position={position}>
      {/* Pier / Platform Base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 1.2, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Network Station Structure */}
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[5, 4.8, 5]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Radio Antenna Tower */}
      <mesh position={[0, 7.5, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 4.5, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
      </mesh>

      {/* Rotating Signal Beacon */}
      <group ref={beaconRef} position={[0, 9.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.6, 16, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>
        <pointLight color="#38bdf8" intensity={2} distance={15} />
      </group>

      <Text position={[0, 11, 0]} fontSize={0.7} color="#38bdf8" anchorX="center">
        🏢📻 KUBE-PROXY (AĞ & TELSİZ BİNASI)
      </Text>

      <Html position={[0, 0.8, 4.2]} center>
        <div className="glass-panel px-3 py-1 rounded-lg text-sky-300 text-[10px] font-bold border border-sky-500/40 whitespace-nowrap shadow-lg">
          ⚡ Canlı Trafik Yönlendirme ve Ağ Güvenliği Merkezi
        </div>
      </Html>
    </group>
  )
}

// Animated 3D Network Traffic Flow Tube
export function NetworkFlowStream({ start = [14, 8, -14], end = [0, 2, 0], color = '#38bdf8' }) {
  const lineRef = useRef()

  useFrame(({ clock }) => {
    if (lineRef.current) {
      lineRef.current.material.dashOffset = -clock.getElapsedTime() * 3
    }
  })

  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)]
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)

  return (
    <line ref={lineRef} geometry={lineGeometry}>
      <lineDashedMaterial
        color={color}
        dashSize={1.5}
        gapSize={0.8}
        linewidth={3}
        transparent
        opacity={0.8}
      />
    </line>
  )
}
