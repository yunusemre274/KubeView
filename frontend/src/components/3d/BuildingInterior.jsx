import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'

// Master Node Control Building Interior
export function MasterBuildingInterior({ onExit }) {
  const lightRef = useRef()

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(clock.getElapsedTime() * 3) * 0.2
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Interior Floor & Walls */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[16, 0.2, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 4, -8]}>
        <boxGeometry args={[16, 9, 0.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-8, 4, 0]}>
        <boxGeometry args={[0.2, 9, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[8, 4, 0]}>
        <boxGeometry args={[0.2, 9, 16]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Observation Window to Harbor/Ships */}
      <mesh position={[0, 4.5, 8]}>
        <boxGeometry args={[14, 5, 0.1]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.3} />
      </mesh>

      {/* Control Desk & Monitors (API Server / ETCD Captain Desk) */}
      <mesh position={[0, 1, 3]} castShadow>
        <boxGeometry args={[8, 1.2, 2.5]} />
        <meshStandardMaterial color="#334155" roughness={0.3} />
      </mesh>

      {/* Holographic Monitors */}
      <mesh position={[-2, 2.2, 3]}>
        <boxGeometry args={[2.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[2, 2.2, 3]}>
        <boxGeometry args={[2.2, 1.2, 0.1]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
      </mesh>

      {/* Point Light Source */}
      <pointLight ref={lightRef} position={[0, 6, 0]} color="#38bdf8" intensity={1.5} distance={20} />

      <Text position={[0, 3.2, 2.9]} fontSize={0.4} color="#ffffff" anchorX="center">
        🏢 MASTER NODE KONTROL MASASI
      </Text>
      <Text position={[0, 2.6, 2.9]} fontSize={0.3} color="#38bdf8" anchorX="center">
        👨‍✈️ etcd (Tersane Kaptanı) Kayıt Odası
      </Text>

      <Html position={[0, 0, 7.5]} center>
        <div className="glass-panel px-4 py-2 rounded-xl text-white text-xs font-bold border border-sky-500/50 flex items-center gap-2">
          <span>🪟 Pencereden Dışarıdaki Canlı Gemileri (Nodes) Seyrediyorsunuz</span>
        </div>
      </Html>
    </group>
  )
}

// Ship (Worker Node) Interior & Helmsman Deck
export function ShipInterior({ shipName = 'Gemi Alpha', pods = [], onExit }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Ship Hold Interior */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[14, 0.2, 22]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Helmsman Steering Wheel (Kubelet 2. Kaptan) */}
      <group position={[0, 2, -7]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1, 1, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </mesh>
        <Text position={[0, 1.8, 0]} fontSize={0.5} color="#fbbf24" anchorX="center">
          👨‍✈️⚓ Kubelet (Geminin Dümencisi)
        </Text>
      </group>

      <Text position={[0, 4, -9]} fontSize={0.7} color="#38bdf8" anchorX="center">
        🚢 {shipName} — AMBAR VE İÇ SAHNE
      </Text>
    </group>
  )
}
