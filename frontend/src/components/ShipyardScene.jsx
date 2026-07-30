import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { MasterBuildingInterior, ShipInterior } from './3d/BuildingInterior'
import { Eye, Building2, Ship as ShipIcon, X, Anchor, ShieldCheck, Cpu, HardDrive, Radio, CheckCircle2, AlertTriangle, Layers, Server, Activity, Network, ArrowRight } from 'lucide-react'

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
      <planeGeometry args={[300, 300, 32, 32]} />
      <meshStandardMaterial
        color="#0284c7"
        roughness={0.15}
        metalness={0.6}
        emissive="#0369a1"
        emissiveIntensity={0.15}
      />
    </mesh>
  )
}

// 2. Enriched Dock & Shoreline with Land Container Stacks
function EnrichedDockAndShore({ onSelectLandStack }) {
  return (
    <group position={[-22, 0.2, 0]}>
      <mesh position={[-14, 0.5, 0]} receiveShadow castShadow>
        <boxGeometry args={[20, 2, 90]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>

      <mesh position={[2, 0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[18, 1.6, 65]} />
        <meshStandardMaterial color="#475569" roughness={0.7} />
      </mesh>

      <mesh position={[10.9, 1.05, 0]}>
        <boxGeometry args={[0.25, 0.1, 65]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>

      <group position={[4, 1.1, 16]} onClick={() => onSelectLandStack && onSelectLandStack('pending-stack-1')}>
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[2.4, 2, 4.8]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[2.4, 2, 4.8]} />
          <meshStandardMaterial color="#ef4444" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[2.8, 1, 0]} castShadow>
          <boxGeometry args={[2.4, 2, 4.8]} />
          <meshStandardMaterial color="#eab308" metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
    </group>
  )
}

// 3. Multiple Iconic Yellow Gantry Cranes
function GantryCrane({ position = [-14, 1, 10], craneData, onSelectCrane }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => onSelectCrane(craneData)}
    >
      <mesh position={[-2.5, 6, -2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : '#f59e0b'} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[2.5, 6, -2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : '#f59e0b'} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[-2.5, 6, 2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : '#f59e0b'} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[2.5, 6, 2]} castShadow>
        <boxGeometry args={[0.8, 12, 0.8]} />
        <meshStandardMaterial color={hovered ? '#fbbf24' : '#f59e0b'} metalness={0.4} roughness={0.3} />
      </mesh>

      <mesh position={[2, 12.2, 0]} castShadow>
        <boxGeometry args={[14, 1.4, 1.8]} />
        <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.3} />
      </mesh>

      <group position={[6, 9.5, 0]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[1.6, 0.8, 1.6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 5, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0, -3.8, 0]} castShadow>
          <boxGeometry args={[2.2, 1.8, 4.2]} />
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
    <group position={[-22, 1.0, -14]}>
      <mesh
        position={[0, 4, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClickBuilding}
        castShadow
      >
        <boxGeometry args={[11, 7, 13]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : '#1e293b'}
          emissive={hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={hovered ? 0.35 : 0}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 8.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[10, 3.2, 4]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>

      <mesh position={[0, 4.5, 6.55]}>
        <boxGeometry args={[8.5, 3.2, 0.1]} />
        <meshPhysicalMaterial color="#38bdf8" transmission={0.9} roughness={0.1} transparent opacity={0.6} />
      </mesh>

      <group ref={radarRef} position={[0, 10.5, -4]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.8, 0.4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </mesh>
      </group>

      <mesh position={[14, 2.5, -4]} castShadow>
        <boxGeometry args={[8, 4.5, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.5} />
      </mesh>
      <mesh position={[14, 2.5, 6]} castShadow>
        <boxGeometry args={[8, 4.5, 8]} />
        <meshStandardMaterial color="#a855f7" roughness={0.5} />
      </mesh>
    </group>
  )
}

// 5. Kube-proxy Station
function KubeProxyStation({ position = [18, 0.2, -16], onSelectKubeProxy }) {
  const beaconRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.getElapsedTime() * 2
    }
  })

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onSelectKubeProxy}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[9, 1.2, 9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[5.5, 4.8, 5.5]} />
        <meshStandardMaterial color={hovered ? '#38bdf8' : '#0284c7'} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 7.5, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 4.5, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
      </mesh>
      <group ref={beaconRef} position={[0, 9.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.7, 16, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.4} />
        </mesh>
        <pointLight color="#38bdf8" intensity={2.5} distance={18} />
      </group>
    </group>
  )
}

// 6. 3D Cargo Container (Pod)
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
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.45, 2.05, 4.85]} />
        <meshStandardMaterial color="#070a12" wireframe />
      </mesh>
    </group>
  )
}

// 7. Cargo Ship (Worker Node)
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
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[9, 1.2, 26]} />
        <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.4} />
      </mesh>

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

      <mesh position={[0, 1.8, 14.5]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[6.35, 1.8, 6.35]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
      </mesh>

      <mesh position={[0, 4.2, -9]} castShadow>
        <boxGeometry args={[7, 3.2, 5.5]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>

      <mesh position={[0, 6.5, -9.5]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 2.2, 16]} />
        <meshStandardMaterial color="#ef4444" metalness={0.5} />
      </mesh>

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

// 8. Smooth Camera Controller
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
  const [activeSelection, setActiveSelection] = useState(null)
  const [selectedNamespace, setSelectedNamespace] = useState('all')

  const [camTargetPos, setCamTargetPos] = useState(new THREE.Vector3(34, 30, 46))
  const [camTargetLookAt, setCamTargetLookAt] = useState(new THREE.Vector3(0, 2, 0))

  const defaultShips = [
    {
      id: 'node-1',
      name: 'node-alpha (Worker Node 1)',
      ip: '192.168.1.101',
      status: 'Ready',
      position: [2, 0, 4],
      metrics: { cpu_usage: '320m', memory_usage: '1024Mi', cpu_capacity: '4000m', mem_capacity: '8192Mi' },
      kubelet_status: 'Active (Running)',
      kubeproxy_status: 'Active (Running)',
      pods: [
        {
          id: 'pod-1',
          name: 'web-frontend-deploy-74b89',
          namespace: 'default',
          color: '#10b981',
          status: 'Running',
          ip: '10.244.0.12',
          service_name: 'web-frontend-svc',
          service_ip: '10.96.0.45',
          dns: 'web-frontend-svc.default.svc.cluster.local',
          containers: [{ name: 'react-app', image: 'nginx:alpine', status: 'Running', restarts: 0 }],
          resources: { cpu_req: '100m', cpu_lim: '500m', mem_req: '128Mi', mem_lim: '512Mi' }
        },
        {
          id: 'pod-2',
          name: 'api-backend-deploy-59d4c',
          namespace: 'default',
          color: '#0284c7',
          status: 'Running',
          ip: '10.244.0.15',
          service_name: 'api-backend-svc',
          service_ip: '10.96.0.88',
          dns: 'api-backend-svc.default.svc.cluster.local',
          containers: [{ name: 'go-api', image: 'tersane/backend:v1.0.0', status: 'Running', restarts: 0 }],
          resources: { cpu_req: '200m', cpu_lim: '1000m', mem_req: '256Mi', mem_lim: '1024Mi' }
        }
      ]
    },
    {
      id: 'node-2',
      name: 'node-beta (Worker Node 2)',
      ip: '192.168.1.102',
      status: 'Ready',
      position: [24, 0, -4],
      metrics: { cpu_usage: '180m', memory_usage: '640Mi', cpu_capacity: '4000m', mem_capacity: '8192Mi' },
      kubelet_status: 'Active (Running)',
      kubeproxy_status: 'Active (Running)',
      pods: [
        {
          id: 'pod-4',
          name: 'redis-cache-set-0',
          namespace: 'production',
          color: '#a855f7',
          status: 'Running',
          ip: '10.244.1.20',
          service_name: 'redis-svc',
          service_ip: '10.96.0.120',
          dns: 'redis-svc.production.svc.cluster.local',
          containers: [{ name: 'redis', image: 'redis:7-alpine', status: 'Running', restarts: 0 }],
          resources: { cpu_req: '150m', cpu_lim: '500m', mem_req: '512Mi', mem_lim: '2048Mi' }
        }
      ]
    }
  ]

  const activeShips = ships.length > 0 ? ships : defaultShips
  const totalPallets = activeShips.reduce((acc, s) => acc + (s.pods?.length || 0), 0)

  const handleSelectShip = (ship) => {
    setActiveSelection({ type: 'SHIP', data: ship })
    setCamTargetPos(new THREE.Vector3(ship.position[0] + 16, 14, ship.position[2] + 22))
    setCamTargetLookAt(new THREE.Vector3(...ship.position))
  }

  const handleSelectPod = (pod, shipName) => {
    setActiveSelection({ type: 'POD', data: { ...pod, shipName } })
  }

  const handleSelectMaster = () => {
    setActiveSelection({ type: 'MASTER', data: {} })
    setCamTargetPos(new THREE.Vector3(-8, 12, 4))
    setCamTargetLookAt(new THREE.Vector3(-22, 4, -14))
  }

  const handleSelectCrane = () => {
    setActiveSelection({
      type: 'CRANE',
      data: {
        scheduler_name: 'default-scheduler',
        last_decision: 'pod redis-cache-set-0 -> node-beta (Score: 94/100, Reason: LeastRequestedPriority)',
        pending_queue: 1
      }
    })
    setCamTargetPos(new THREE.Vector3(2, 14, 22))
    setCamTargetLookAt(new THREE.Vector3(-12, 4, 6))
  }

  const handleSelectKubeProxy = () => {
    setActiveSelection({
      type: 'KUBE_PROXY',
      data: {
        mode: 'iptables',
        services: [
          { name: 'web-frontend-svc', clusterIP: '10.96.0.45', endpoints: ['10.244.0.12:80'] },
          { name: 'api-backend-svc', clusterIP: '10.96.0.88', endpoints: ['10.244.0.15:8000'] },
          { name: 'redis-svc', clusterIP: '10.96.0.120', endpoints: ['10.244.1.20:6379'] }
        ]
      }
    })
    setCamTargetPos(new THREE.Vector3(32, 12, 0))
    setCamTargetLookAt(new THREE.Vector3(18, 4, -16))
  }

  const handleResetCamera = () => {
    setActiveSelection(null)
    setViewMode('EXTERIOR')
    setCamTargetPos(new THREE.Vector3(34, 30, 46))
    setCamTargetLookAt(new THREE.Vector3(0, 2, 0))
  }

  return (
    <div className="w-full h-full h-screen min-h-0 flex-1 relative bg-slate-950 overflow-hidden flex flex-col">
      
      {/* SOL ÜST ULTRA MİNİMAL ROZET (< %3 EKRAN ALANI) */}
      <div className="fixed top-3 left-3 z-30 pointer-events-auto flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg border border-amber-500/30">
        <Anchor className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="font-industrial text-sm font-bold text-amber-400 tracking-wider">
          TERSANE <span className="text-[10px] text-sky-400 font-mono-tech">v1.4.0</span>
        </span>
      </div>

      {/* KATMAN 1: 3D CANVASES STAGE WRAPPER (%100 FULL SCREEN UNBROKEN HEIGHT) */}
      <div className="stage-wrapper w-full h-full flex-1 min-h-0 relative overflow-hidden">
        <Canvas
          shadows
          camera={{ position: [34, 30, 46], fov: 42 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[35, 45, 30]} intensity={1.6} castShadow />
          <pointLight position={[-15, 20, -10]} intensity={0.8} color="#38bdf8" />
          <Sky sunPosition={[120, 35, 100]} />

          <CameraController targetPosition={camTargetPos} targetLookAt={camTargetLookAt} />

          {viewMode === 'EXTERIOR' && (
            <>
              <Ocean />
              <EnrichedDockAndShore onSelectLandStack={handleSelectCrane} />
              <GantryCrane position={[-12, 1, 6]} craneData={{}} onSelectCrane={handleSelectCrane} />
              <GantryCrane position={[-12, 1, -16]} craneData={{}} onSelectCrane={handleSelectCrane} />
              <HarborVillage onClickBuilding={handleSelectMaster} />
              <KubeProxyStation position={[18, 0.2, -16]} onSelectKubeProxy={handleSelectKubeProxy} />

              {activeShips.map((ship) => (
                <CargoShip
                  key={ship.id}
                  position={ship.position}
                  shipData={ship}
                  onSelectPod={handleSelectPod}
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
              shipName={activeSelection?.data?.name || 'Gemi Alpha'}
              pods={activeSelection?.data?.pods || []}
              onExit={handleResetCamera}
            />
          )}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={8}
            maxDistance={150}
          />
        </Canvas>
      </div>

      {/* KATMAN 2: MINIMAL BOTTOM VIEW MODE TABS (%5 YÜKSEKLİK) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 industrial-panel p-1 rounded-xl border-amber-500/40">
        <button
          onClick={handleResetCamera}
          className={`industrial-btn py-1 text-xs ${viewMode === 'EXTERIOR' && !activeSelection ? 'industrial-btn-active' : ''}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>🦅 TÜM LİMAN (KUŞBAKIŞI)</span>
        </button>

        <button
          onClick={() => {
            setViewMode('MASTER_BUILDING')
            handleSelectMaster()
          }}
          className={`industrial-btn py-1 text-xs ${viewMode === 'MASTER_BUILDING' ? 'industrial-btn-active' : ''}`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>🏢 YÖNETİM BİNASI İÇİ</span>
        </button>

        {activeShips.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => handleSelectShip(s)}
            className={`industrial-btn py-1 text-xs ${activeSelection?.data?.id === s.id ? 'industrial-btn-blue-active' : ''}`}
          >
            <ShipIcon className="w-3.5 h-3.5" />
            <span>🚢 GEMİ {idx + 1}</span>
          </button>
        ))}
      </div>

      {/* KATMAN 2: SAĞ DİKEY BİLGİ KARTI ÇEKMECESİ (%100 HEIGHT, ~%15 WIDTH - SADECE SEÇİMDE AÇILIR) */}
      {activeSelection && (
        <aside className="fixed top-0 right-0 bottom-0 z-40 w-80 industrial-panel p-4 border-l border-amber-500/40 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fadeIn">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
              <h3 className="font-industrial text-base font-bold text-amber-400 flex items-center gap-2">
                {activeSelection.type === 'POD' && <Box className="w-5 h-5 text-emerald-400" />}
                {activeSelection.type === 'SHIP' && <ShipIcon className="w-5 h-5 text-sky-400" />}
                {activeSelection.type === 'MASTER' && <Building2 className="w-5 h-5 text-amber-400" />}
                {activeSelection.type === 'CRANE' && <Activity className="w-5 h-5 text-amber-400" />}
                {activeSelection.type === 'KUBE_PROXY' && <Radio className="w-5 h-5 text-sky-400" />}
                <span>
                  {activeSelection.type === 'POD' && '📦 PALET (POD)'}
                  {activeSelection.type === 'SHIP' && '🚢 GEMİ (WORKER NODE)'}
                  {activeSelection.type === 'MASTER' && '🏢 YÖNETİM (MASTER)'}
                  {activeSelection.type === 'CRANE' && '🏗️ VİNÇ (SCHEDULER)'}
                  {activeSelection.type === 'KUBE_PROXY' && '📻 AĞ (KUBE-PROXY)'}
                </span>
              </h3>
              <button onClick={handleResetCamera} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. POD / CONTAINER DETAILS */}
            {activeSelection.type === 'POD' && (
              <div className="space-y-4 text-xs font-mono-tech">
                <div>
                  <span className="text-slate-400 block text-[10px]">POD ADI:</span>
                  <strong className="text-white text-sm break-all">{activeSelection.data.name}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">AMBAR (NS):</span>
                    <strong className="text-sky-400">{activeSelection.data.namespace}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">DURUM:</span>
                    <strong className="text-emerald-400">{activeSelection.data.status}</strong>
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                  <span className="text-amber-400 block text-[10px] font-bold">AĞ & DNS BİLGİSİ:</span>
                  <div>Pod IP: <strong className="text-slate-200">{activeSelection.data.ip || '10.244.0.12'}</strong></div>
                  <div>Service IP: <strong className="text-slate-200">{activeSelection.data.service_ip || '10.96.0.45'}</strong></div>
                  <div className="text-[10px] text-sky-300 break-all">{activeSelection.data.dns || 'web-svc.default.svc.cluster.local'}</div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                  <span className="text-purple-400 block text-[10px] font-bold">KAYNAK LIMIT/REQUEST:</span>
                  <div>CPU: <strong className="text-emerald-300">{activeSelection.data.resources?.cpu_req || '100m'}</strong> / <strong className="text-amber-300">{activeSelection.data.resources?.cpu_lim || '500m'}</strong></div>
                  <div>RAM: <strong className="text-purple-300">{activeSelection.data.resources?.mem_req || '128Mi'}</strong> / <strong className="text-amber-300">{activeSelection.data.resources?.mem_lim || '512Mi'}</strong></div>
                </div>
              </div>
            )}

            {/* 2. WORKER NODE DETAILS */}
            {activeSelection.type === 'SHIP' && (
              <div className="space-y-4 text-xs font-mono-tech">
                <div>
                  <span className="text-slate-400 block text-[10px]">NODE ADI:</span>
                  <strong className="text-white text-sm">{activeSelection.data.name}</strong>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">NODE IP:</span>
                    <strong className="text-sky-300">{activeSelection.data.ip || '192.168.1.101'}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">SAĞLIK:</span>
                    <strong className="text-emerald-400">{activeSelection.data.status || 'Ready'}</strong>
                  </div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                  <span className="text-amber-400 block text-[10px] font-bold">KAPASİTE VS KULLANIM:</span>
                  <div>CPU: <strong className="text-emerald-300">{activeSelection.data.metrics?.cpu_usage || '320m'}</strong> / {activeSelection.data.metrics?.cpu_capacity || '4000m'}</div>
                  <div>RAM: <strong className="text-purple-300">{activeSelection.data.metrics?.memory_usage || '1024Mi'}</strong> / {activeSelection.data.metrics?.mem_capacity || '8192Mi'}</div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                  <span className="text-sky-400 block text-[10px] font-bold">SERVİSLER:</span>
                  <div>Kubelet: <strong className="text-emerald-400">Active (Running)</strong></div>
                  <div>Kube-Proxy: <strong className="text-emerald-400">Active (Running)</strong></div>
                </div>
                <button onClick={() => setViewMode('SHIP_INTERIOR')} className="w-full mt-2 industrial-btn industrial-btn-blue-active justify-center">
                  🚪 GEMİ İÇİNE GİR
                </button>
              </div>
            )}

            {/* 3. CONTROL TOWER DETAILS */}
            {activeSelection.type === 'MASTER' && (
              <div className="space-y-4 text-xs font-mono-tech">
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                  <span className="text-amber-400 block text-[10px] font-bold">CONTROL PLANE BİLEŞENLERİ:</span>
                  <div className="flex justify-between"><span>API Server:</span><span className="text-emerald-400 font-bold">● Healthy</span></div>
                  <div className="flex justify-between"><span>etcd (Kaptan):</span><span className="text-emerald-400 font-bold">● Healthy</span></div>
                  <div className="flex justify-between"><span>Scheduler (Vinç):</span><span className="text-emerald-400 font-bold">● Healthy</span></div>
                  <div className="flex justify-between"><span>Controller Mgr:</span><span className="text-emerald-400 font-bold">● Healthy</span></div>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                  <span className="text-sky-400 block text-[10px] font-bold">CLUSTER GENELİ NESNELER:</span>
                  <div className="flex justify-between"><span>Worker Nodes:</span><strong className="text-white">{activeShips.length}</strong></div>
                  <div className="flex justify-between"><span>Toplam Pods:</span><strong className="text-emerald-300">4</strong></div>
                  <div className="flex justify-between"><span>Deployments:</span><strong className="text-amber-300">3</strong></div>
                </div>
                <button onClick={() => setViewMode('MASTER_BUILDING')} className="w-full mt-2 industrial-btn industrial-btn-active justify-center">
                  🚪 YÖNETİM BİNASINA GİR
                </button>
              </div>
            )}

            {/* 4. SCHEDULER CRANE DETAILS */}
            {activeSelection.type === 'CRANE' && (
              <div className="space-y-4 text-xs font-mono-tech">
                <div>
                  <span className="text-slate-400 block text-[10px]">BİLEŞEN:</span>
                  <strong className="text-amber-400 text-sm">kube-scheduler</strong>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-2">
                  <span className="text-sky-400 block text-[10px] font-bold">SON SEVKİYAT KARARI:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    pod <strong className="text-emerald-300">redis-cache-set-0</strong> ➔ <strong className="text-sky-300">node-beta</strong>
                  </p>
                  <div className="text-[10px] text-amber-400">Skor: 94/100 (LeastRequestedPriority)</div>
                </div>
              </div>
            )}

            {/* 5. KUBE-PROXY DETAILS */}
            {activeSelection.type === 'KUBE_PROXY' && (
              <div className="space-y-4 text-xs font-mono-tech">
                <div>
                  <span className="text-slate-400 block text-[10px]">AĞ YÖNLENDİRME MERKEZİ:</span>
                  <strong className="text-sky-400 text-sm">kube-proxy (iptables mode)</strong>
                </div>
                <div className="space-y-2">
                  <span className="text-amber-400 block text-[10px] font-bold">SERVICE -> ENDPOINTS HARİTASI:</span>
                  {activeSelection.data.services?.map((svc) => (
                    <div key={svc.name} className="bg-slate-800/60 p-2 rounded border border-slate-700 text-[11px]">
                      <div className="font-bold text-sky-300">{svc.name}</div>
                      <div className="text-slate-400">ClusterIP: {svc.clusterIP}</div>
                      <div className="text-emerald-400 text-[10px] mt-1 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> {svc.endpoints?.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono-tech text-center">
            Kapatmak için yukarıdaki X ikonuna tıklayın
          </div>
        </aside>
      )}
    </div>
  )
}
