import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { MasterBuildingInterior, ShipInterior } from './3d/BuildingInterior'
import { Eye, Building2, Ship as ShipIcon, X, Anchor, ShieldCheck, Layers, Box, Info } from 'lucide-react'

// 1. Vibrant Animated Ocean Surface
function Ocean() {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime()
      meshRef.current.position.y = Math.sin(t * 1.2) * 0.08 - 0.5
      meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.005
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[260, 260, 32, 32]} />
      <meshStandardMaterial
        color="#0284c7"
        roughness={0.1}
        metalness={0.6}
        emissive="#0369a1"
        emissiveIntensity={0.15}
      />
    </mesh>
  )
}

// 2. Green Shoreline Island & Concrete Piers
function DockAndShore() {
  return (
    <group position={[-20, 0.2, 0]}>
      {/* Green Shoreline Island (Arka Plan Canlı Kara Parçası) */}
      <mesh position={[-12, 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[18, 2, 80]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>

      {/* Main Concrete Pier Base extending into the sea */}
      <mesh position={[2, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[16, 1.6, 50]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      {/* Yellow Safety Striping Along Dock Edges */}
      <mesh position={[9.9, 1.05, 0]}>
        <boxGeometry args={[0.25, 0.1, 50]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>
    </group>
  )
}

// 3. Iconic Yellow Gantry Crane (Tersane Vinci)
function GantryCrane({ position = [-12, 1, 10] }) {
  return (
    <group position={position}>
      {/* Main Vertical Lattice Legs */}
      <mesh position={[-2.5, 6, -2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[2.5, 6, -2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-2.5, 6, 2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[2.5, 6, 2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Top Horizontal Crane Boom Beam */}
      <mesh position={[2, 12.2, 0]} castShadow>
        <boxGeometry args={[14, 1.4, 1.8]} />
        <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Trolley & Steel Cable */}
      <group position={[6, 9.5, 0]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[1.6, 0.8, 1.6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 5, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        {/* Suspended Pod Container */}
        <mesh position={[0, -3.8, 0]} castShadow>
          <boxGeometry args={[2, 1.6, 4]} />
          <meshStandardMaterial color="#10b981" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

// 4. Harbor Village & Master Control Building
function HarborVillage({ onClickBuilding }) {
  const [hovered, setHovered] = useState(false)
  const radarRef = useRef()

  useFrame(({ clock }) => {
    if (radarRef.current) {
      radarRef.current.rotation.y = clock.getElapsedTime() * 2
    }
  })

  return (
    <group position={[-20, 1.0, -12]}>
      {/* Master Control Building */}
      <mesh
        position={[0, 4, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClickBuilding}
        castShadow
      >
        <boxGeometry args={[10, 6.5, 12]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : '#1e293b'}
          emissive={hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={hovered ? 0.35 : 0}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Red Pitched Roof */}
      <mesh position={[0, 7.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[9, 3, 4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>

      {/* Glass Windows */}
      <mesh position={[0, 4.5, 6.05]}>
        <boxGeometry args={[8, 3, 0.1]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>

      {/* Rotating Radar Tower */}
      <group ref={radarRef} position={[0, 9.8, -4]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.5, 0.4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </mesh>
      </group>

      {/* Secondary Harbor Warehouses */}
      <mesh position={[12, 2.5, -4]} castShadow>
        <boxGeometry args={[8, 4, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
    </group>
  )
}

// 5. 3D Cargo Box Container (Pod)
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
        <boxGeometry args={[2.4, 2.0, 4.8]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : color}
          emissive={hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={hovered ? 0.4 : 0}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      {/* Container Wireframe Borders */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.45, 2.05, 4.85]} />
        <meshStandardMaterial color="#070a12" wireframe />
      </mesh>
    </group>
  )
}

// 6. Vibrant Cargo Ship (Worker Node) - Salınım Yapan Gemi
function CargoShip({ position = [0, 0, 0], shipData, onSelectPod, onSelectShip }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.12
      groupRef.current.rotation.z = Math.sin(t * 1.1 + position[0]) * 0.02
      groupRef.current.rotation.x = Math.cos(t * 0.9 + position[0]) * 0.015
    }
  })

  const pods = shipData.pods || []

  return (
    <group ref={groupRef} position={position}>
      {/* Red Underwater Hull Bottom */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[9, 1.2, 26]} />
        <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Main Navy Ship Hull */}
      <mesh
        position={[0, 1.8, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onSelectShip(shipData)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[9, 1.8, 26]} />
        <meshStandardMaterial
          color={hovered ? '#0284c7' : '#1e293b'}
          emissive={hovered ? '#0369a1' : '#000000'}
          emissiveIntensity={hovered ? 0.35 : 0}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Pointed Bow */}
      <mesh position={[0, 1.8, 14.5]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[6.35, 1.8, 6.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* White Cabin / Bridge Structure */}
      <mesh position={[0, 4.2, -9]} castShadow>
        <boxGeometry args={[7, 3.2, 5.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>

      {/* Red Chimney Funnel */}
      <mesh position={[0, 6.5, -9.5]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 2.2, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} />
      </mesh>

      {/* Cargo Pod Containers Grid */}
      {pods.map((pod, idx) => {
        const row = Math.floor(idx / 2)
        const col = idx % 2
        const x = (col - 0.5) * 3.2
        const z = -3 + row * 5.4
        return (
          <CargoContainer
            key={pod.id || idx}
            position={[x, 3.7, z]}
            color={pod.color}
            onClick={() => onSelectPod(pod, shipData.name)}
          />
        )
      })}
    </group>
  )
}

// 7. Smooth Camera Lerp Controller
function CameraController({ targetPosition, targetLookAt }) {
  const { camera, controls } = useThree()

  useFrame(() => {
    if (targetPosition) {
      camera.position.lerp(targetPosition, 0.05)
    }
    if (targetLookAt && controls) {
      controls.target.lerp(targetLookAt, 0.05)
      controls.update()
    }
  })

  return null
}

export default function ShipyardScene({ ships = [] }) {
  const [viewMode, setViewMode] = useState('EXTERIOR')
  const [selectedShip, setSelectedShip] = useState(null)
  const [selectedPod, setSelectedPod] = useState(null)
  const [selectedNamespace, setSelectedNamespace] = useState('all')

  // Smooth Camera Target State
  const [camTargetPos, setCamTargetPos] = useState(new THREE.Vector3(32, 28, 42))
  const [camTargetLookAt, setCamTargetLookAt] = useState(new THREE.Vector3(0, 2, 0))

  const defaultShips = [
    {
      id: 'node-1',
      name: 'node-alpha (Worker Node 1)',
      position: [2, 0, 4],
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
      position: [22, 0, -4],
      metrics: { cpu_usage: '180m', memory_usage: '640Mi', cpu_percent: 18, mem_percent: 30 },
      pods: [
        { id: 'pod-4', name: 'redis-cache (Palet D)', namespace: 'production', color: '#a855f7', status: 'Running' }
      ]
    }
  ]

  const activeShips = ships.length > 0 ? ships : defaultShips
  const totalPallets = activeShips.reduce((acc, s) => acc + (s.pods?.length || 0), 0)

  const handleSelectShip = (ship) => {
    setSelectedShip(ship)
    setSelectedPod(null)
    setCamTargetPos(new THREE.Vector3(ship.position[0] + 14, 12, ship.position[2] + 20))
    setCamTargetLookAt(new THREE.Vector3(...ship.position))
  }

  const handleResetCamera = () => {
    setSelectedShip(null)
    setSelectedPod(null)
    setViewMode('EXTERIOR')
    setCamTargetPos(new THREE.Vector3(32, 28, 42))
    setCamTargetLookAt(new THREE.Vector3(0, 2, 0))
  }

  return (
    <div className="w-full h-screen relative bg-slate-950">
      
      {/* KATMAN 2: MINIMAL TOP BAR OVERLAY (%5 Yükseklik) */}
      <header className="fixed top-0 left-0 right-0 z-30 p-3 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto industrial-panel px-4 py-2 rounded-xl border-amber-500/30">
          
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
              <Anchor className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h1 className="font-industrial text-lg text-amber-400 font-bold leading-none tracking-wider">
                TERSANE <span className="text-[10px] text-sky-400 font-mono-tech">v1.2.0-3d</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="industrial-select text-xs py-0.5"
              >
                <option value="all">🌐 Toptan Ambarlar</option>
                <option value="default">🚪 default</option>
                <option value="production">🚪 production</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/80">
              <ShipIcon className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] font-industrial text-slate-400">GEMİLER:</span>
              <span className="font-mono-tech font-bold text-sky-300 text-xs">{activeShips.length}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/80">
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-industrial text-slate-400">PALETLER:</span>
              <span className="font-mono-tech font-bold text-emerald-300 text-xs">{totalPallets}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-[11px] font-mono-tech">
            <ShieldCheck className="w-3 h-3" />
            <span>READ-ONLY</span>
          </div>

        </div>
      </header>

      {/* KATMAN 1: CANLI LOW-POLY 3D CANVASES (%85+ EKRAN ALANI) */}
      <Canvas
        shadows
        camera={{ position: [32, 28, 42], fov: 42 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[35, 45, 30]} intensity={1.6} castShadow />
        <pointLight position={[-15, 20, -10]} intensity={0.8} color="#38bdf8" />
        <Sky sunPosition={[120, 35, 100]} />

        <CameraController targetPosition={camTargetPos} targetLookAt={camTargetLookAt} />

        {viewMode === 'EXTERIOR' && (
          <>
            <Ocean />
            <DockAndShore />
            <GantryCrane position={[-12, 1, 6]} />
            <HarborVillage onClickBuilding={() => setViewMode('MASTER_BUILDING')} />

            {activeShips.map((ship) => (
              <CargoShip
                key={ship.id}
                position={ship.position}
                shipData={ship}
                onSelectPod={(pod, shipName) => setSelectedPod({ ...pod, shipName })}
                onSelectShip={handleSelectShip}
              />
            ))}
          </>
        )}

        {viewMode === 'MASTER_BUILDING' && (
          <MasterBuildingInterior onExit={handleResetCamera} />
        )}

        {viewMode === 'SHIP_INTERIOR' && (
          <ShipInterior
            shipName={selectedShip?.name || 'Gemi Alpha'}
            pods={selectedShip?.pods || []}
            onExit={handleResetCamera}
          />
        )}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={8}
          maxDistance={140}
        />
      </Canvas>

      {/* KATMAN 2: MINIMAL BOTTOM VIEW MODE TABS (%5 Yükseklik) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 industrial-panel p-1.5 rounded-xl border-amber-500/40">
        <button
          onClick={handleResetCamera}
          className={`industrial-btn ${viewMode === 'EXTERIOR' && !selectedShip ? 'industrial-btn-active' : ''}`}
        >
          <Eye className="w-4 h-4" />
          <span>🦅 TÜM LİMAN (KUŞBAKIŞI)</span>
        </button>

        <button
          onClick={() => setViewMode('MASTER_BUILDING')}
          className={`industrial-btn ${viewMode === 'MASTER_BUILDING' ? 'industrial-btn-active' : ''}`}
        >
          <Building2 className="w-4 h-4" />
          <span>🏢 YÖNETİM BİNASI İÇİ</span>
        </button>

        {activeShips.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => handleSelectShip(s)}
            className={`industrial-btn ${selectedShip?.id === s.id ? 'industrial-btn-blue-active' : ''}`}
          >
            <ShipIcon className="w-4 h-4" />
            <span>🚢 GEMİ {idx + 1}</span>
          </button>
        ))}
      </div>

      {/* KATMAN 2: SLEEK RIGHT SIDE DRAWER (MAX 280px GENİŞLİK - SADECE SEÇİMDE AÇILIR) */}
      {selectedShip && (
        <aside className="fixed top-16 right-4 z-20 w-72 industrial-panel p-4 rounded-xl border-sky-500/40 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
            <h3 className="font-industrial text-sm font-bold text-sky-400 flex items-center gap-2">
              <ShipIcon className="w-4 h-4" />
              <span>🚢 WORKER NODE MÜFETTİŞİ</span>
            </h3>
            <button onClick={handleResetCamera} className="text-slate-400 hover:text-white">
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

      {/* KATMAN 2: SLEEK POD DETAIL MODAL */}
      {selectedPod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xs industrial-panel p-5 rounded-2xl border-amber-500/50 shadow-2xl">
            <h3 className="font-industrial text-sm font-bold text-amber-400 pb-2 border-b border-slate-700 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>📦 PALET (POD) MÜFETTİŞİ</span>
            </h3>
            <div className="mt-3 space-y-2 text-xs font-mono-tech">
              <div className="flex justify-between"><span className="text-slate-400">Palet Adı:</span><span className="font-bold text-white">{selectedPod.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ambar:</span><span className="font-bold text-sky-400">{selectedPod.namespace}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Gemi:</span><span className="font-bold text-amber-300">{selectedPod.shipName}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Durum:</span><span className="font-bold text-emerald-400">{selectedPod.status}</span></div>
            </div>
            <button
              onClick={() => setSelectedPod(null)}
              className="mt-5 w-full industrial-btn industrial-btn-active justify-center"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
