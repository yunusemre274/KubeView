import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { MasterBuildingInterior, ShipInterior } from './3d/BuildingInterior'
import { NetworkBuilding, NetworkFlowStream } from './3d/NetworkBuilding'
import { Eye, Building2, Ship as ShipIcon, X, Info } from 'lucide-react'

// Realistic Water Surface
function Sea() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.06 - 0.5
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[180, 180]} />
      <meshStandardMaterial color="#0b2545" roughness={0.15} metalness={0.7} />
    </mesh>
  )
}

// Concrete Pier / Harbor Dock Structure with Crane
function PierAndDock() {
  return (
    <group position={[-16, 0.2, 0]}>
      {/* Concrete Pier Base */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[12, 1.4, 34]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Yellow/Black Safety Striping Edge */}
      <mesh position={[5.9, 0.75, 0]}>
        <boxGeometry args={[0.2, 0.1, 34]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.5} />
      </mesh>

      {/* Industrial Harbor Crane (Dikey Direk + Yatay Kol) */}
      <group position={[3, 4.5, 8]}>
        {/* Main Vertical Tower */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.2, 8, 1.2]} />
          <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Horizontal Crane Arm */}
        <mesh position={[2, 3.8, 0]} castShadow>
          <boxGeometry args={[6, 0.8, 0.8]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Crane Cable */}
        <mesh position={[4, 1.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>
    </group>
  )
}

// Master Node Control Building (Pure 3D Geometry — No Canvas Text)
function MasterBuilding({ onClickBuilding }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={[-16, 0.2, -4]}>
      <mesh
        position={[0, 3.5, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClickBuilding}
        castShadow
      >
        <boxGeometry args={[8, 5.5, 10]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : '#1e293b'}
          emissive={hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      {/* Windows */}
      <mesh position={[0, 4, 5.1]}>
        <boxGeometry args={[6.5, 2.5, 0.1]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>
      {/* Radar Antenna */}
      <mesh position={[0, 6.6, -3]}>
        <cylinderGeometry args={[0.1, 0.1, 1.6, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
      </mesh>
    </group>
  )
}

// 3D Cargo Box (Pod) - Pure Geometry Grid
function CargoContainer({ position, color = '#10b981', onClick }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.2, 1.8, 4.2]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : color}
          emissive={hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      {/* Container Metal Rib Wireframe */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.25, 1.85, 4.25]} />
        <meshStandardMaterial color="#090d16" wireframe />
      </mesh>
    </group>
  )
}

// 3D Cargo Ship (Worker Node) - Recognizable Hull + Cabin + Chimney + Pod Grid
function Ship({ position = [0, 0, 0], shipData, onSelectPod, onSelectShip }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.5) * 0.08
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.015
    }
  })

  const pods = shipData.pods || []

  return (
    <group ref={groupRef} position={position}>
      {/* Main Ship Hull */}
      <mesh
        position={[0, 0.8, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelectShip(shipData)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[8, 2.2, 22]} />
        <meshStandardMaterial
          color={hovered ? '#0284c7' : '#1e293b'}
          emissive={hovered ? '#0369a1' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      {/* Pointed Bow */}
      <mesh position={[0, 0.8, 12]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[5.65, 2.2, 5.65]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cabin / Bridge Structure */}
      <mesh position={[0, 3.2, -7.5]} castShadow>
        <boxGeometry args={[6, 2.8, 4.5]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
      </mesh>
      {/* Red Chimney */}
      <mesh position={[0, 5.2, -8]} castShadow>
        <cylinderGeometry args={[0.6, 0.7, 2, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} />
      </mesh>

      {/* Cargo Pods Grid Alignment */}
      {pods.map((pod, idx) => {
        const row = Math.floor(idx / 2)
        const col = idx % 2
        const x = (col - 0.5) * 2.8
        const z = -2 + row * 4.8
        return (
          <CargoContainer
            key={pod.id || idx}
            position={[x, 2.8, z]}
            color={pod.color}
            onClick={() => onSelectPod(pod, shipData.name)}
          />
        )
      })}
    </group>
  )
}

export default function ShipyardScene({ ships = [] }) {
  const [viewMode, setViewMode] = useState('EXTERIOR') // 'EXTERIOR' | 'MASTER_BUILDING' | 'SHIP_INTERIOR'
  const [selectedShip, setSelectedShip] = useState(null)
  const [selectedPod, setSelectedPod] = useState(null)

  const defaultShips = [
    {
      id: 'node-1',
      name: 'node-alpha (Worker Node 1)',
      position: [0, 0, 0],
      metrics: { cpu_usage: '320m', memory_usage: '1024Mi', cpu_percent: 32, mem_percent: 50 },
      pods: [
        { id: 'pod-1', name: 'web-frontend (Palet A)', namespace: 'default', color: '#10b981', status: 'Running' },
        { id: 'pod-2', name: 'api-backend (Palet B)', namespace: 'default', color: '#0284c7', status: 'Running' },
        { id: 'pod-3', name: 'worker-job (Palet C)', namespace: 'production', color: '#f59e0b', status: 'Pending' }
      ]
    },
    {
      id: 'node-2',
      name: 'node-beta (Worker Node 2)',
      position: [16, 0, 0],
      metrics: { cpu_usage: '180m', memory_usage: '640Mi', cpu_percent: 18, mem_percent: 30 },
      pods: [
        { id: 'pod-4', name: 'redis-cache (Palet D)', namespace: 'production', color: '#a855f7', status: 'Running' }
      ]
    }
  ]

  const activeShips = ships.length > 0 ? ships : defaultShips

  return (
    <div className="w-full h-screen relative bg-slate-950">
      {/* 3D WebGL Canvas (Katman 1 - Pure 3D World) */}
      <Canvas
        shadows
        camera={{ position: viewMode === 'EXTERIOR' ? [28, 24, 38] : [0, 5, 12], fov: 45 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[30, 40, 25]} intensity={1.5} castShadow />
        <pointLight position={[-15, 20, -10]} intensity={0.6} color="#38bdf8" />
        <Sky sunPosition={[100, 30, 100]} />

        {viewMode === 'EXTERIOR' && (
          <>
            <Sea />
            <PierAndDock />
            <MasterBuilding onClickBuilding={() => setViewMode('MASTER_BUILDING')} />
            <NetworkBuilding position={[16, 0.2, -14]} />

            {/* Live 3D Laser Flow Lines */}
            <NetworkFlowStream start={[16, 9, -14]} end={[-16, 4, -4]} color="#f59e0b" />
            <NetworkFlowStream start={[16, 9, -14]} end={[0, 2, 0]} color="#38bdf8" />
            <NetworkFlowStream start={[16, 9, -14]} end={[16, 2, 0]} color="#a855f7" />

            {activeShips.map((ship) => (
              <Ship
                key={ship.id}
                position={ship.position}
                shipData={ship}
                onSelectPod={(pod, shipName) => setSelectedPod({ ...pod, shipName })}
                onSelectShip={(shipData) => setSelectedShip(shipData)}
              />
            ))}
          </>
        )}

        {viewMode === 'MASTER_BUILDING' && (
          <MasterBuildingInterior onExit={() => setViewMode('EXTERIOR')} />
        )}

        {viewMode === 'SHIP_INTERIOR' && (
          <ShipInterior
            shipName={selectedShip?.name || 'Gemi Alpha'}
            pods={selectedShip?.pods || []}
            onExit={() => setViewMode('EXTERIOR')}
          />
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={6}
          maxDistance={110}
        />
      </Canvas>

      {/* KATMAN 2: UI OVERLAY — Bottom View Mode Tabs */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 industrial-panel p-2 rounded-xl border-amber-500/40">
        <button
          onClick={() => setViewMode('EXTERIOR')}
          className={`industrial-btn ${viewMode === 'EXTERIOR' ? 'industrial-btn-active' : ''}`}
        >
          <Eye className="w-4 h-4" />
          <span>🦅 KUŞBAKIŞI MİMARİ</span>
        </button>

        <button
          onClick={() => setViewMode('MASTER_BUILDING')}
          className={`industrial-btn ${viewMode === 'MASTER_BUILDING' ? 'industrial-btn-active' : ''}`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 YÖNETİM BİNASI İÇİ</span>
        </button>

        <button
          onClick={() => setViewMode('SHIP_INTERIOR')}
          className={`industrial-btn ${viewMode === 'SHIP_INTERIOR' ? 'industrial-btn-blue-active' : ''}`}
        >
          <ShipIcon className="w-4 h-4" />
          <span>🚢 GEMİ İÇİ</span>
        </button>
      </div>

      {/* KATMAN 2: UI OVERLAY — Side Inspector Panel for Selected 3D Object */}
      {selectedShip && (
        <aside className="fixed top-20 left-4 z-20 w-80 industrial-panel p-4 rounded-xl border-sky-500/40 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
            <h3 className="font-industrial text-sm font-bold text-sky-400 flex items-center gap-2">
              <ShipIcon className="w-4 h-4" />
              <span>🚢 WORKER NODE MÜFETTİŞİ</span>
            </h3>
            <button
              onClick={() => setSelectedShip(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 text-xs font-mono-tech">
            <div>
              <span className="text-slate-400 block">Gemi (Node) Adı:</span>
              <strong className="text-white text-sm">{selectedShip.name}</strong>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                <span className="text-slate-400 block text-[10px]">CPU KULLANIMI:</span>
                <strong className="text-emerald-400 text-sm">{selectedShip.metrics?.cpu_usage || '240m'}</strong>
              </div>
              <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                <span className="text-slate-400 block text-[10px]">RAM KULLANIMI:</span>
                <strong className="text-purple-400 text-sm">{selectedShip.metrics?.memory_usage || '512Mi'}</strong>
              </div>
            </div>

            <button
              onClick={() => setViewMode('SHIP_INTERIOR')}
              className="w-full mt-2 industrial-btn industrial-btn-blue-active justify-center"
            >
              🚪 GEMİ İÇİNE GİR
            </button>
          </div>
        </aside>
      )}

      {/* KATMAN 2: UI OVERLAY — Pod Detail Modal */}
      {selectedPod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm industrial-panel p-6 rounded-2xl border-amber-500/50 shadow-2xl">
            <h3 className="font-industrial text-base font-bold text-amber-400 pb-2 border-b border-slate-700 flex items-center gap-2">
              <Info className="w-5 h-5" />
              <span>📦 PALET (POD) MÜFETTİŞİ</span>
            </h3>
            <div className="mt-4 space-y-3 text-xs font-mono-tech">
              <div className="flex justify-between"><span className="text-slate-400">Palet Adı:</span><span className="font-bold text-white">{selectedPod.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ambar (Namespace):</span><span className="font-bold text-sky-400">{selectedPod.namespace}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Bulunduğu Gemi:</span><span className="font-bold text-amber-300">{selectedPod.shipName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Durum:</span><span className="font-bold text-emerald-400">{selectedPod.status}</span></div>
            </div>
            <button
              onClick={() => setSelectedPod(null)}
              className="mt-6 w-full industrial-btn industrial-btn-active justify-center"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
