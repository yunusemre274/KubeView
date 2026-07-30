import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Sky, Html } from '@react-three/drei'
import * as THREE from 'three'
import { MasterBuildingInterior, ShipInterior } from './3d/BuildingInterior'
import { Eye, Building2, Ship as ShipIcon } from 'lucide-react'

// Water / Ocean mesh
function Sea() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.05 - 0.5
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[140, 140]} />
      <meshStandardMaterial color="#0b2545" roughness={0.1} metalness={0.8} />
    </mesh>
  )
}

// Enterable Master Node Building & Dock Pier
function EnterableMasterBuilding({ onEnterBuilding }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={[-14, 0.2, 0]}>
      {/* Pier Base */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[10, 1.4, 30]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>

      {/* Enterable Master Node Building Structure */}
      <mesh
        position={[0, 3.5, -4]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onEnterBuilding}
        castShadow
      >
        <boxGeometry args={[8, 5.5, 10]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : '#1e293b'}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Glass Windows */}
      <mesh position={[0, 4, 1.1]}>
        <boxGeometry args={[6.5, 2.8, 0.2]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.5} />
      </mesh>

      {/* Crane Tower */}
      <mesh position={[0, 4.5, 6]}>
        <boxGeometry args={[1.5, 7.5, 1.5]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>

      <Text position={[0, 7, -4]} fontSize={0.75} color="#38bdf8" anchorX="center">
        🏢 MASTER NODE YÖNETİM BİNASI
      </Text>

      <Html position={[0, 1.2, -4]} center>
        <button
          onClick={onEnterBuilding}
          className="glass-panel px-3 py-1.5 rounded-lg text-amber-300 text-xs font-bold border border-amber-500/50 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Building2 className="w-4 h-4" />
          <span>🚪 İÇİNE GİR</span>
        </button>
      </Html>
    </group>
  )
}

// 3D Cargo Box (Pod)
function CargoContainer({ position, label, color = '#22c55e', status = 'Running', onClick }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (status === 'Pending') {
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 4) * 0.1
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <boxGeometry args={[1.8, 1.6, 3.6]} />
        <meshStandardMaterial color={hovered ? '#38bdf8' : color} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.85, 1.4, 3.4]} />
        <meshStandardMaterial color="#0f172a" wireframe />
      </mesh>
      <Text position={[0, 1.1, 0]} fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}

// 3D Cargo Ship (Worker Node)
function Ship({ position = [0, 0, 0], name = 'Gemi Alpha', pods = [], metrics, onSelectPod, onEnterShip }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.5) * 0.08
      groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.2) * 0.015
    }
  })

  const cpuPercent = metrics?.cpu_percent || 35
  const memPercent = metrics?.mem_percent || 48

  return (
    <group ref={groupRef} position={position}>
      {/* Hull Base */}
      <mesh
        position={[0, 0.6, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onEnterShip}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[7, 1.8, 18]} />
        <meshStandardMaterial color={hovered ? '#0284c7' : '#1e293b'} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bow */}
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

      {/* Metrics & Enter Button */}
      <Html position={[0, 6.2, -6]} center distanceFactor={25}>
        <div className="glass-panel px-3 py-1.5 rounded-lg text-white text-[11px] whitespace-nowrap border border-sky-500/40 shadow-xl flex flex-col gap-1">
          <div className="font-bold text-sky-300 flex items-center justify-between gap-2">
            <span>🚢 {name}</span>
            <button
              onClick={onEnterShip}
              className="px-2 py-0.5 bg-sky-500/30 hover:bg-sky-500/50 rounded text-[10px] text-sky-200 border border-sky-400/40 cursor-pointer"
            >
              🚪 İÇİNE GİR
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">CPU:</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-emerald-400" style={{ width: `${Math.min(cpuPercent, 100)}%` }} />
            </div>
            <span className="font-mono text-emerald-300">{metrics?.cpu_usage || '240m'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">RAM:</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div className="h-full bg-purple-400" style={{ width: `${Math.min(memPercent, 100)}%` }} />
            </div>
            <span className="font-mono text-purple-300">{metrics?.memory_usage || '512Mi'}</span>
          </div>
        </div>
      </Html>

      {/* Cargo Deck - Pods Placement */}
      {pods.map((pod, idx) => {
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
            onClick={() => onSelectPod(pod, name)}
          />
        )
      })}
    </group>
  )
}

export default function ShipyardScene({ ships = [] }) {
  const [viewMode, setViewMode] = useState('EXTERIOR') // 'EXTERIOR' | 'MASTER_BUILDING' | 'SHIP_INTERIOR'
  const [activeShipForInterior, setActiveShipForInterior] = useState(null)
  const [selectedPod, setSelectedPod] = useState(null)

  const defaultShips = [
    {
      id: 'node-1',
      name: 'node-alpha (Worker Node 1)',
      position: [0, 0, 0],
      metrics: { cpu_usage: '320m', memory_usage: '1024Mi', cpu_percent: 32, mem_percent: 50 },
      pods: [
        { id: 'pod-1', name: '📦 nginx-api (Palet A)', color: '#22c55e', status: 'Running', metrics: { cpu_usage: '45m', memory_usage: '128Mi' } },
        { id: 'pod-2', name: '📦 redis-cache (Palet B)', color: '#3b82f6', status: 'Running', metrics: { cpu_usage: '110m', memory_usage: '256Mi' } },
        { id: 'pod-3', name: '📦 worker-job (Palet C)', color: '#eab308', status: 'Pending', metrics: { cpu_usage: '0m', memory_usage: '0Mi' } }
      ]
    },
    {
      id: 'node-2',
      name: 'node-beta (Worker Node 2)',
      position: [14, 0, 0],
      metrics: { cpu_usage: '180m', memory_usage: '640Mi', cpu_percent: 18, mem_percent: 30 },
      pods: [
        { id: 'pod-4', name: '📦 db-postgres (Palet D)', color: '#a855f7', status: 'Running', metrics: { cpu_usage: '160m', memory_usage: '512Mi' } }
      ]
    }
  ]

  const activeShips = ships.length > 0 ? ships : defaultShips

  return (
    <div className="w-full h-screen relative">
      {/* Mode Selector Top Floating Bar */}
      <div className="fixed top-24 right-4 z-20 flex items-center gap-2 glass-panel p-2 rounded-xl border border-sky-500/40">
        <button
          onClick={() => setViewMode('EXTERIOR')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            viewMode === 'EXTERIOR' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>🦅 KUŞBAKIŞI MİMARİ</span>
        </button>

        <button
          onClick={() => setViewMode('MASTER_BUILDING')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            viewMode === 'MASTER_BUILDING' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 YÖNETİM BİNASI İÇİ</span>
        </button>

        <button
          onClick={() => {
            setActiveShipForInterior(activeShips[0])
            setViewMode('SHIP_INTERIOR')
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            viewMode === 'SHIP_INTERIOR' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <ShipIcon className="w-4 h-4" />
          <span>🚢 GEMİ İÇİ</span>
        </button>
      </div>

      <Canvas
        shadows
        camera={{ position: viewMode === 'EXTERIOR' ? [22, 20, 30] : [0, 5, 12], fov: 45 }}
        className="w-full h-full bg-slate-950"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[25, 35, 20]} intensity={1.4} castShadow />
        <pointLight position={[-10, 15, -10]} intensity={0.5} color="#38bdf8" />
        <Sky sunPosition={[100, 40, 100]} />

        {viewMode === 'EXTERIOR' && (
          <>
            <Sea />
            <EnterableMasterBuilding onEnterBuilding={() => setViewMode('MASTER_BUILDING')} />
            {activeShips.map((ship) => (
              <Ship
                key={ship.id}
                position={ship.position}
                name={ship.name}
                pods={ship.pods}
                metrics={ship.metrics}
                onSelectPod={(pod, shipName) => setSelectedPod({ ...pod, shipName })}
                onEnterShip={() => {
                  setActiveShipForInterior(ship)
                  setViewMode('SHIP_INTERIOR')
                }}
              />
            ))}
          </>
        )}

        {viewMode === 'MASTER_BUILDING' && (
          <MasterBuildingInterior onExit={() => setViewMode('EXTERIOR')} />
        )}

        {viewMode === 'SHIP_INTERIOR' && (
          <ShipInterior
            shipName={activeShipForInterior?.name || 'Gemi Alpha'}
            pods={activeShipForInterior?.pods || []}
            onExit={() => setViewMode('EXTERIOR')}
          />
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={5}
          maxDistance={90}
        />
      </Canvas>

      {/* Pod Detail Modal */}
      {selectedPod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm glass-panel p-6 rounded-2xl text-white border border-sky-500/40 shadow-2xl">
            <h3 className="text-lg font-bold text-sky-400 pb-2 border-b border-slate-700 flex items-center gap-2">
              📦 PALET DETAYLARI (POD)
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Palet Adı:</span><span className="font-semibold text-white">{selectedPod.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Bulunduğu Gemi:</span><span className="font-semibold text-sky-300">{selectedPod.shipName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Durum:</span><span className="font-bold text-emerald-400">{selectedPod.status}</span></div>
            </div>
            <button
              onClick={() => setSelectedPod(null)}
              className="mt-6 w-full py-2 bg-sky-500 hover:bg-sky-600 rounded-xl font-bold text-slate-950 transition-all"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
