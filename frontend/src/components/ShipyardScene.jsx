import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Sky } from '@react-three/drei'
import * as THREE from 'three'

// Water / Ocean mesh with gentle animation
function Sea() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.05 - 0.5
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#0b2545" roughness={0.1} metalness={0.8} />
    </mesh>
  )
}

// Dock / Harbor Pier
function Dock() {
  return (
    <group position={[-12, 0.2, 0]}>
      {/* Pier Base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 1.4, 28]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Crane Tower */}
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[1.5, 7.5, 1.5]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>
      {/* Crane Arm */}
      <mesh position={[2, 7.5, 0]}>
        <boxGeometry args={[6, 0.8, 1]} />
        <meshStandardMaterial color="#d97706" roughness={0.4} />
      </mesh>
      <Text position={[0, 9, 0]} fontSize={0.8} color="#fbbf24" anchorX="center">
        🏗️ KONTROL KULESI (API SERVER)
      </Text>
    </group>
  )
}

// 3D Cargo Box (Pod)
function CargoContainer({ position, label, color = '#22c55e', status = 'Running' }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (status === 'Pending') {
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 4) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.6, 3.6]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Container Ridges/Stripes */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.85, 1.4, 3.4]} />
        <meshStandardMaterial color="#0f172a" wireframe />
      </mesh>
      {/* Label */}
      <Text position={[0, 1.1, 0]} fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

// 3D Cargo Ship (Worker Node)
function Ship({ position = [0, 0, 0], name = 'Gemi Alpha (Worker Node 1)', pods = [] }) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.5) * 0.08
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.015
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Hull Base */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[7, 1.8, 18]} />
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bow (Pointed Front) */}
      <mesh position={[0, 0.6, 10]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[4.95, 1.8, 4.95]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bridge / Cabin */}
      <mesh position={[0, 2.5, -6]} castShadow>
        <boxGeometry args={[5, 2.2, 3.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0, 4.2, -6.5]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 1.8, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Ship Title Label */}
      <Text position={[0, 5.5, -6]} fontSize={0.7} color="#38bdf8" anchorX="center">
        🚢 {name}
      </Text>

      {/* Cargo Deck - Pods Placement */}
      {pods.map((pod, idx) => {
        // Calculate grid position on deck
        const row = Math.floor(idx / 2)
        const col = idx % 2
        const x = (col - 0.5) * 2.4
        const z = -1 + row * 4.2
        return (
          <CargoContainer
            key={pod.id || idx}
            position={[x, 2.3, z]}
            label={pod.name}
            color={pod.color}
            status={pod.status}
          />
        )
      })}
    </group>
  )
}

export default function ShipyardScene({ ships = [] }) {
  // Statik 3D Demo Verileri (Faz 3)
  const defaultShips = [
    {
      id: 'node-1',
      name: 'node-alpha (Worker Node 1)',
      position: [2, 0, 0],
      pods: [
        { id: 'pod-1', name: '📦 nginx-api (Palet A)', color: '#22c55e', status: 'Running' },
        { id: 'pod-2', name: '📦 redis-cache (Palet B)', color: '#3b82f6', status: 'Running' },
        { id: 'pod-3', name: '📦 worker-job (Palet C)', color: '#eab308', status: 'Pending' }
      ]
    },
    {
      id: 'node-2',
      name: 'node-beta (Worker Node 2)',
      position: [12, 0, 0],
      pods: [
        { id: 'pod-4', name: '📦 db-postgres (Palet D)', color: '#a855f7', status: 'Running' }
      ]
    }
  ]

  const activeShips = ships.length > 0 ? ships : defaultShips

  return (
    <div className="w-full h-screen relative">
      <Canvas
        shadows
        camera={{ position: [20, 18, 28], fov: 45 }}
        className="w-full h-full bg-slate-950"
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[25, 35, 20]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 15, -10]} intensity={0.5} color="#38bdf8" />
        <Sky sunPosition={[100, 40, 100]} />

        <Sea />
        <Dock />

        {activeShips.map((ship) => (
          <Ship key={ship.id} position={ship.position} name={ship.name} pods={ship.pods} />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={10}
          maxDistance={70}
        />
      </Canvas>
    </div>
  )
}
