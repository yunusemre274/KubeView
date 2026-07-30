import React, { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import MasterDashboardOverlay from './MasterDashboardOverlay'
import NetworkTrafficParticles from './3d/NetworkTrafficParticles'
import { Eye, Building2, Ship as ShipIcon, X, Anchor, ShieldCheck, Box, Activity, Radio, ArrowRight, Zap } from 'lucide-react'

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
      <planeGeometry args={[320, 320, 32, 32]} />
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

// 2. Enriched Dock & Shoreline
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

      <group
        position={[4, 1.1, 16]}
        onClick={(e) => {
          e.stopPropagation()
          onSelectLandStack && onSelectLandStack('pending-stack-1')
        }}
      >
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[2.4, 2, 4.8]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[2.4, 2, 4.8]} />
          <meshStandardMaterial color="#ef4444" metalness={0.3} roughness={0.4} />
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
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelectCrane(craneData); }}
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
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e) => { e.stopPropagation(); onClickBuilding(); }}
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

      <group ref={radarRef} position={[0, 10.5, -4]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.8, 0.4, 0.4]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} />
        </mesh>
      </group>
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
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onSelectKubeProxy(); }}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[9, 1.2, 9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[5.5, 4.8, 5.5]} />
        <meshStandardMaterial color={hovered ? '#38bdf8' : '#0284c7'} metalness={0.7} roughness={0.2} />
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

// 6. 3D Kubelet Rotating Radar Icon on Mast (Geminin Dümencisi / Node Agent)
function KubeletRadar({ position = [0, 8.5, -9.5], onClickKubelet }) {
  const radarRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (radarRef.current) {
      radarRef.current.rotation.y = clock.getElapsedTime() * 2.5
    }
  })

  return (
    <group
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      onClick={(e) => { e.stopPropagation(); onClickKubelet(); }}
    >
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 2.2, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>

      <group ref={radarRef} position={[0, 1.2, 0]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.3, 0.3]} />
          <meshStandardMaterial
            color={hovered ? '#fbbf24' : '#10b981'}
            emissive={hovered ? '#f59e0b' : '#059669'}
            emissiveIntensity={0.8}
            metalness={0.6}
          />
        </mesh>
        <mesh position={[0.9, 0, 0]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  )
}

// 7. 3D Cargo Container (Pod) with Explicit StopPropagation
function CargoContainer({ position, podData, shipName, onSelectPod }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectPod(podData, shipName)
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.4, 2.0, 4.8]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : (podData.color || '#10b981')}
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

// 8. Cargo Ship (Worker Node) with Kubelet Radar & Event StopPropagation
function CargoShip({ position = [0, 0, 0], shipData, onSelectPod, onSelectShip, onSelectKubelet }) {
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

      {/* SHIP HULL - Raycast target for Node onClick */}
      <mesh
        position={[0, 1.8, 0]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectShip(shipData)
        }}
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

      {/* KUBELET RADAR ICON ON MAST */}
      <KubeletRadar
        position={[0, 6.5, -9.5]}
        onClickKubelet={() => onSelectKubelet(shipData)}
      />

      {/* POD CONTAINERS */}
      {pods.map((pod, idx) => {
        const row = Math.floor(idx / 2)
        const col = idx % 2
        const x = (col - 0.5) * 3.2
        const z = -3 + row * 5.4
        return (
          <CargoContainer
            key={pod.id || idx}
            position={[x, 3.7, z]}
            podData={pod}
            shipName={shipData.name}
            onSelectPod={onSelectPod}
          />
        )
      })}
    </group>
  )
}

// 9. Smooth Camera Lerp Controller
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
  const [activeSelection, setActiveSelection] = useState(null)
  const [showMasterDashboard, setShowMasterDashboard] = useState(false)
  const [showNetworkTraffic, setShowNetworkTraffic] = useState(true)

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

  const handleSelectShip = (ship) => {
    setActiveSelection({ type: 'SHIP', data: ship })
    setCamTargetPos(new THREE.Vector3(ship.position[0] + 16, 14, ship.position[2] + 22))
    setCamTargetLookAt(new THREE.Vector3(...ship.position))
  }

  const handleSelectPod = (pod, shipName) => {
    setActiveSelection({ type: 'POD', data: { ...pod, shipName } })
  }

  const handleSelectKubelet = (ship) => {
    setActiveSelection({
      type: 'KUBELET',
      data: {
        node_name: ship.name,
        ip: ship.ip,
        status: ship.kubelet_status || 'Active (Running)',
        last_heartbeat: '1.2s ago',
        readiness_probe: '100% Passing (2/2 probes)',
        pods: ship.pods || []
      }
    })
  }

  const handleSelectMaster = () => {
    setActiveSelection({ type: 'MASTER', data: {} })
    setCamTargetPos(new THREE.Vector3(-16, 8, -6))
    setCamTargetLookAt(new THREE.Vector3(-22, 4, -14))
    setTimeout(() => {
      setShowMasterDashboard(true)
    }, 400)
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
    setShowMasterDashboard(false)
    setCamTargetPos(new THREE.Vector3(34, 30, 46))
    setCamTargetLookAt(new THREE.Vector3(0, 2, 0))
  }

  return (
    <div className="w-full h-full h-screen relative bg-slate-950 overflow-hidden">
      
      {/* SOL ÜST ULTRA MİNİMAL ROZET (< %3 EKRAN ALANI) */}
      <div className="fixed top-3 left-3 z-30 pointer-events-auto flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg border border-amber-500/30">
        <Anchor className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="font-industrial text-sm font-bold text-amber-400 tracking-wider">
          TERSANE <span className="text-[10px] text-sky-400 font-mono-tech">v1.4.0</span>
        </span>
      </div>

      {/* KATMAN 1: 3D CANVAS STAGE WRAPPER - ABSOLUTE FULLSCREEN */}
      <div className="stage-wrapper">
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

          <Ocean />
          <EnrichedDockAndShore onSelectLandStack={handleSelectCrane} />
          <GantryCrane position={[-12, 1, 6]} craneData={{}} onSelectCrane={handleSelectCrane} />
          <GantryCrane position={[-12, 1, -16]} craneData={{}} onSelectCrane={handleSelectCrane} />
          <HarborVillage onClickBuilding={handleSelectMaster} />
          <KubeProxyStation position={[18, 0.2, -16]} onSelectKubeProxy={handleSelectKubeProxy} />

          {/* LIVE ANIMATED NETWORK PARTICLES */}
          <NetworkTrafficParticles ships={activeShips} showTraffic={showNetworkTraffic} />

          {activeShips.map((ship) => (
            <CargoShip
              key={ship.id}
              position={ship.position}
              shipData={ship}
              onSelectPod={handleSelectPod}
              onSelectShip={handleSelectShip}
              onSelectKubelet={handleSelectKubelet}
            />
          ))}

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

      {/* KATMAN 2: MINIMAL BOTTOM VIEW MODE TABS */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 industrial-panel p-1 rounded-xl border-amber-500/40">
        <button
          onClick={handleResetCamera}
          className={`industrial-btn py-1 text-xs ${!activeSelection && !showMasterDashboard ? 'industrial-btn-active' : ''}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>🦅 TÜM LİMAN (KUŞBAKIŞI)</span>
        </button>

        <button
          onClick={handleSelectMaster}
          className={`industrial-btn py-1 text-xs ${showMasterDashboard ? 'industrial-btn-active' : ''}`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>🏢 YÖNETİM BİNASINA GİR</span>
        </button>

        <button
          onClick={() => setShowNetworkTraffic(!showNetworkTraffic)}
          className={`industrial-btn py-1 text-xs ${showNetworkTraffic ? 'industrial-btn-blue-active' : ''}`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>⚡ AĞ TRAFİĞİ ({showNetworkTraffic ? 'AÇIK' : 'KAPALI'})</span>
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

      {/* KATMAN 3: 2D MASTER CONTROL PLANE DASHBOARD OVERLAY */}
      {showMasterDashboard && (
        <MasterDashboardOverlay
          onClose={handleResetCamera}
          activeShips={activeShips}
        />
      )}

      {/* KATMAN 4: ABSOLUTE OVERLAY RIGHT DRAWER */}
      <aside className={`info-panel-drawer ${activeSelection && !showMasterDashboard ? 'drawer-open' : 'drawer-closed'}`}>
        {activeSelection && (
          <div className="p-4 h-full flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                <h3 className="font-industrial text-base font-bold text-amber-400 flex items-center gap-2">
                  {activeSelection.type === 'POD' && <Box className="w-5 h-5 text-emerald-400" />}
                  {activeSelection.type === 'SHIP' && <ShipIcon className="w-5 h-5 text-sky-400" />}
                  {activeSelection.type === 'KUBELET' && <Activity className="w-5 h-5 text-emerald-400" />}
                  {activeSelection.type === 'MASTER' && <Building2 className="w-5 h-5 text-amber-400" />}
                  {activeSelection.type === 'CRANE' && <Activity className="w-5 h-5 text-amber-400" />}
                  {activeSelection.type === 'KUBE_PROXY' && <Radio className="w-5 h-5 text-sky-400" />}
                  <span>
                    {activeSelection.type === 'POD' && '📦 PALET (POD)'}
                    {activeSelection.type === 'SHIP' && '🚢 GEMİ (WORKER NODE)'}
                    {activeSelection.type === 'KUBELET' && '📡 KUBELET AGENT'}
                    {activeSelection.type === 'MASTER' && '🏢 YÖNETİM (MASTER)'}
                    {activeSelection.type === 'CRANE' && '🏗️ VİNÇ (SCHEDULER)'}
                    {activeSelection.type === 'KUBE_PROXY' && '📻 AĞ (KUBE-PROXY)'}
                  </span>
                </h3>
                <button onClick={handleResetCamera} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. POD DETAILS */}
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
                </div>
              )}

              {/* 3. KUBELET AGENT DETAILS */}
              {activeSelection.type === 'KUBELET' && (
                <div className="space-y-4 text-xs font-mono-tech">
                  <div>
                    <span className="text-slate-400 block text-[10px]">NODE KUBELET AGENT:</span>
                    <strong className="text-emerald-400 text-sm">{activeSelection.data.node_name}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-2">
                    <div className="flex justify-between"><span>Durum:</span><strong className="text-emerald-400">{activeSelection.data.status}</strong></div>
                    <div className="flex justify-between"><span>Son Heartbeat:</span><strong className="text-sky-300">{activeSelection.data.last_heartbeat}</strong></div>
                    <div className="flex justify-between"><span>Readiness Probe:</span><strong className="text-amber-300">{activeSelection.data.readiness_probe}</strong></div>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700">
                    <span className="text-sky-400 block text-[10px] font-bold mb-1">YÖNETİLEN POD'LAR:</span>
                    {activeSelection.data.pods?.map((p) => (
                      <div key={p.name} className="text-[11px] text-slate-300">● {p.name}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. MASTER BUILDING DETAILS */}
              {activeSelection.type === 'MASTER' && (
                <div className="space-y-4 text-xs font-mono-tech">
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-amber-400 block text-[10px] font-bold">CONTROL PLANE BİLEŞENLERİ:</span>
                    <div className="flex justify-between"><span>API Server:</span><span className="text-emerald-400 font-bold">● Healthy</span></div>
                    <div className="flex justify-between"><span>etcd (Kaptan):</span><span className="text-emerald-400 font-bold">● Healthy</span></div>
                  </div>
                  <button onClick={handleSelectMaster} className="w-full mt-2 industrial-btn industrial-btn-active justify-center">
                    🚪 2D DASHBOARD KONSOLUNU AÇ
                  </button>
                </div>
              )}

              {/* 5. SCHEDULER DETAILS */}
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
                  </div>
                </div>
              )}

              {/* 6. KUBE-PROXY DETAILS */}
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
          </div>
        )}
      </aside>
    </div>
  )
}
