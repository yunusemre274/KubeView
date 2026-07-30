import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import MasterDashboardOverlay from './MasterDashboardOverlay'
import NetworkTrafficParticles from './3d/NetworkTrafficParticles'
import EventLogDrawer from './EventLogDrawer'
import ConfirmationModal from './ConfirmationModal'
import IngressLighthouse from './3d/IngressLighthouse'
import NetworkPolicyBarriers from './3d/NetworkPolicyBarriers'
import { SmokeAndFlameEffect, RedFlagEffect, OOMKilledBurstEffect } from './3d/AnomalyEffects'
import { HPAMobileCrane, NodeAffinityLines, PDBMaintenanceFlag } from './3d/OrchestrationHelpers'
import { Eye, Building2, Ship as ShipIcon, X, Anchor, ShieldCheck, Box, Activity, Radio, ArrowRight, Zap, Clock, Lock, Unlock, Trash2, RefreshCw, Compass, ShieldAlert, Cpu, Camera, DollarSign, Tag, Layers, Server } from 'lucide-react'

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
function GantryCrane({ position = [-14, 1, 10], craneData, onSelectCrane, isImagePullBackOff = false }) {
  const [hovered, setHovered] = useState(false)
  const hookRef = useRef()

  useFrame(({ clock }) => {
    if (hookRef.current && isImagePullBackOff) {
      hookRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 3) * 0.4
    }
  })

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

      <group ref={hookRef} position={[6, 9.5, 0]}>
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[1.6, 0.8, 1.6]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 5, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>

        {isImagePullBackOff ? (
          <mesh position={[0, -3.8, 0]}>
            <torusGeometry args={[0.8, 0.15, 8, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
          </mesh>
        ) : (
          <mesh position={[0, -3.8, 0]} castShadow>
            <boxGeometry args={[2.2, 1.8, 4.2]} />
            <meshStandardMaterial color="#10b981" metalness={0.3} roughness={0.4} />
          </mesh>
        )}
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

// 6. 3D Kubelet Radar Icon
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

// 7. 3D Cargo Container (Pod)
function CargoContainer({ position, podData, shipName, onSelectPod, activeAnomaly }) {
  const [hovered, setHovered] = useState(false)
  const isCrashLoop = activeAnomaly === 'CrashLoopBackOff' && podData.id === 'pod-1'
  const isOOM = activeAnomaly === 'OOMKilled' && podData.id === 'pod-2'
  const isProbeFail = activeAnomaly === 'ReadinessFail' && podData.id === 'pod-1'

  return (
    <group position={position}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e) => { e.stopPropagation(); onSelectPod(podData, shipName); }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.4, 2.0, 4.8]} />
        <meshStandardMaterial
          color={isCrashLoop ? '#ef4444' : hovered ? '#38bdf8' : (podData.color || '#10b981')}
          emissive={isCrashLoop ? '#ef4444' : hovered ? '#0284c7' : '#000000'}
          emissiveIntensity={isCrashLoop ? 0.8 : hovered ? 0.4 : 0}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.45, 2.05, 4.85]} />
        <meshStandardMaterial color="#070a12" wireframe />
      </mesh>

      {isCrashLoop && <SmokeAndFlameEffect position={[0, 1.2, 0]} />}
      {isOOM && <OOMKilledBurstEffect position={[0, 1.0, 0]} />}
      {isProbeFail && <RedFlagEffect position={[0, 1.2, 0]} />}
    </group>
  )
}

// 8. Cargo Ship (Worker Node) With Smooth Patrol Rotation Curve
function CargoShip({ basePosition = [0, 0, 0], shipData, onSelectPod, onSelectShip, onSelectKubelet, activeAnomaly }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const isNodeNotReady = activeAnomaly === 'NodeNotReady' && shipData.id === 'node-2'

  const patrolCurve = useMemo(() => {
    const [x, y, z] = basePosition
    const points = [
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x + 6, y, z + 8),
      new THREE.Vector3(x + 14, y, z),
      new THREE.Vector3(x + 8, y, z - 8),
      new THREE.Vector3(x, y, z)
    ]
    return new THREE.CatmullRomCurve3(points, true)
  }, [basePosition])

  const progressRef = useRef(shipData.id === 'node-2' ? 0.5 : 0.0)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const t = progressRef.current
    if (!isNodeNotReady) {
      progressRef.current += delta * 0.012
    }

    const pos = patrolCurve.getPointAt(progressRef.current % 1)
    const tangent = patrolCurve.getTangentAt(progressRef.current % 1)

    if (isNodeNotReady) {
      groupRef.current.position.set(pos.x, pos.y - 0.8 + Math.sin(t * 3) * 0.05, pos.z)
      groupRef.current.rotation.z = -0.18 + Math.sin(t * 3) * 0.02
      groupRef.current.rotation.x = 0.12
    } else {
      groupRef.current.position.set(pos.x, pos.y + Math.sin(t * 15) * 0.08, pos.z)
      const angle = Math.atan2(tangent.x, tangent.z)
      groupRef.current.rotation.y = angle
      groupRef.current.rotation.z = Math.sin(t * 10) * 0.015
    }
  })

  const pods = shipData.pods || []

  return (
    <group ref={groupRef} position={basePosition}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[9, 1.2, 26]} />
        <meshStandardMaterial color={isNodeNotReady ? '#991b1b' : '#dc2626'} metalness={0.5} roughness={0.4} />
      </mesh>

      <mesh
        position={[0, 1.8, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        onClick={(e) => { e.stopPropagation(); onSelectShip(shipData); }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[9, 1.8, 26]} />
        <meshStandardMaterial
          color={isNodeNotReady ? '#7f1d1d' : hovered ? '#0284c7' : '#1e293b'}
          emissive={isNodeNotReady ? '#ef4444' : hovered ? '#0369a1' : '#000000'}
          emissiveIntensity={isNodeNotReady ? 0.4 : hovered ? 0.35 : 0}
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

      <KubeletRadar
        position={[0, 6.5, -9.5]}
        onClickKubelet={() => onSelectKubelet(shipData)}
      />

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
            activeAnomaly={activeAnomaly}
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
  const [showNetworkPolicy, setShowNetworkPolicy] = useState(false)
  const [showHPA, setShowHPA] = useState(true)
  const [activeClusterContext, setActiveClusterContext] = useState('minikube')
  
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)
  const [showEventLog, setShowEventLog] = useState(false)
  const [pendingMutation, setPendingMutation] = useState(null)
  const [activeAnomaly, setActiveAnomaly] = useState(null)

  const [eventsLog, setEventsLog] = useState([
    { id: 1, time: '23:38:10', message: 'Tersane v2.1.0 Pro Küme İzleme Hizmete Girdi', type: 'Normal', isUserTriggered: false },
    { id: 2, time: '23:39:05', message: 'Geniş Panoramik Kamera Görüşü Aktif', type: 'Normal', isUserTriggered: false },
    { id: 3, time: '23:40:00', message: 'Cluster Context: minikube bağlamı seçildi', type: 'Normal', isUserTriggered: false }
  ])

  const [camTargetPos, setCamTargetPos] = useState(new THREE.Vector3(44, 36, 58))
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
      labels: ['beta.kubernetes.io/arch=amd64', 'kubernetes.io/os=linux'],
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
      labels: ['beta.kubernetes.io/arch=amd64', 'kubernetes.io/os=linux'],
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

  const addEventLog = (message, type = 'Normal', isUser = false, targetObject = null) => {
    const timeStr = new Date().toLocaleTimeString('tr-TR')
    setEventsLog((prev) => [
      { id: Date.now(), time: timeStr, message, type, isUserTriggered: isUser, targetObject },
      ...prev.slice(0, 49)
    ])
  }

  const handleExportPNG = () => {
    const canvasElement = document.querySelector('.stage-wrapper canvas')
    if (canvasElement) {
      const dataUrl = canvasElement.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `tersane-3d-shipyard-${activeClusterContext}.png`
      link.href = dataUrl
      link.click()
      addEventLog('📸 3D Sahne Ekran Görüntüsü PNG Olarak İndirildi', 'Normal', true)
    }
  }

  const triggerAnomalySimulation = (anomalyType) => {
    setActiveAnomaly(anomalyType)
    if (anomalyType === 'CrashLoopBackOff') {
      addEventLog('⚠️ ALARM: Pod web-frontend-deploy-74b89 CrashLoopBackOff moduna girdi', 'Warning', false, 'pod-1')
      setCamTargetPos(new THREE.Vector3(12, 10, 16))
      setCamTargetLookAt(new THREE.Vector3(2, 2, 4))
    } else if (anomalyType === 'OOMKilled') {
      addEventLog('⚠️ ALARM: Pod api-backend-deploy-59d4c OOMKilled', 'Warning', false, 'pod-2')
      setCamTargetPos(new THREE.Vector3(14, 10, 16))
      setCamTargetLookAt(new THREE.Vector3(2, 2, 4))
    } else if (anomalyType === 'NodeNotReady') {
      addEventLog('⚠️ ALARM: Worker Node node-beta NotReady durumunda (Gemi durdu ve batıyor)', 'Warning', false, 'node-2')
      setCamTargetPos(new THREE.Vector3(38, 12, 12))
      setCamTargetLookAt(new THREE.Vector3(24, 0, -4))
    } else {
      setActiveAnomaly(null)
      addEventLog('Sistem Normale Döndü', 'Normal', false)
    }
  }

  const handleSelectIngress = () => {
    setActiveSelection({
      type: 'INGRESS',
      data: {
        name: 'tersane-ingress-gateway',
        hosts: ['tersane.k8s.local'],
        rules: [{ path: '/', service: 'web-frontend-svc:80' }, { path: '/api', service: 'api-backend-svc:8000' }],
        tls: 'Enabled (Let\'s Encrypt RSA 4096)'
      }
    })
    setCamTargetPos(new THREE.Vector3(42, 16, 32))
    setCamTargetLookAt(new THREE.Vector3(28, 4, 18))
  }

  const handleSelectNetworkPolicy = () => {
    setActiveSelection({
      type: 'NETWORK_POLICY',
      data: { name: 'default-deny-ingress', policyTypes: ['Ingress', 'Egress'], podSelector: 'app=api-backend-deploy' }
    })
    setCamTargetPos(new THREE.Vector3(4, 12, 14))
    setCamTargetLookAt(new THREE.Vector3(-10, 2, 0))
  }

  const handleSelectShip = (ship) => {
    setActiveSelection({ type: 'SHIP', data: ship })
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
        status: 'Active (Running)',
        last_heartbeat: '1.2s ago',
        readiness_probe: '2/2 Passing (100%)',
        pods: ship.pods || []
      }
    })
  }

  const handleSelectMaster = () => {
    setActiveSelection({ type: 'MASTER', data: {} })
    setCamTargetPos(new THREE.Vector3(-16, 8, -6))
    setCamTargetLookAt(new THREE.Vector3(-22, 4, -14))
    setTimeout(() => { setShowMasterDashboard(true) }, 400)
  }

  const handleSelectCrane = () => {
    setActiveSelection({
      type: 'CRANE',
      data: {
        scheduler_name: 'default-scheduler (v1.28.2)',
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
        hubble_mode: 'Cilium Hubble eBPF Active',
        services: [{ name: 'web-frontend-svc', clusterIP: '10.96.0.45', endpoints: ['10.244.0.12:80'] }]
      }
    })
    setCamTargetPos(new THREE.Vector3(32, 12, 0))
    setCamTargetLookAt(new THREE.Vector3(18, 4, -16))
  }

  const handleResetCamera = () => {
    setActiveSelection(null)
    setShowMasterDashboard(false)
    setShowEventLog(false)
    setCamTargetPos(new THREE.Vector3(44, 36, 58))
    setCamTargetLookAt(new THREE.Vector3(0, 2, 0))
  }

  const triggerDeletePodAction = (pod) => {
    if (isReadOnlyMode) return
    setPendingMutation({
      type: 'DELETE_POD',
      title: 'POD SİLME ONAYI',
      message: `Pod '${pod.name}' silinecek ve Deployment tarafından yeniden başlatılacak.`,
      targetName: pod.name
    })
  }

  const triggerRestartPodAction = (pod) => {
    if (isReadOnlyMode) return
    setPendingMutation({
      type: 'RESTART_POD',
      title: 'POD YENİDEN BAŞLATMA ONAYI',
      message: `Pod '${pod.name}' yeniden başlatılacak.`,
      targetName: pod.name
    })
  }

  const executePendingMutation = () => {
    if (!pendingMutation) return
    if (pendingMutation.type === 'DELETE_POD') {
      addEventLog(`Pod '${pendingMutation.targetName}' silindi (Kullanıcı Tetikledi)`, 'Warning', true, pendingMutation.targetName)
      setActiveSelection(null)
    } else if (pendingMutation.type === 'RESTART_POD') {
      addEventLog(`Pod '${pendingMutation.targetName}' yeniden başlatılıyor (Kullanıcı Tetikledi)`, 'Normal', true, pendingMutation.targetName)
    }
    setPendingMutation(null)
  }

  return (
    <div className="w-full h-full h-screen relative bg-slate-950 overflow-hidden">
      
      {/* GUARANTEED TOP HEADER STRIP WITH ID top-header-bar */}
      <header id="top-header-bar">
        
        {/* LEFT SECTION: LOGO & CLUSTER SELECTOR & READ-ONLY TOGGLE */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30">
            <Anchor className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-industrial text-xs font-bold text-amber-400 tracking-wider">
              TERSANE <span className="text-[10px] text-sky-400 font-mono-tech">v2.1.0</span>
            </span>
          </div>

          <select
            value={activeClusterContext}
            onChange={(e) => {
              setActiveClusterContext(e.target.value)
              addEventLog(`Küme Bağlamı Değiştirildi: ${e.target.value}`, 'Normal', true)
            }}
            className="industrial-select text-xs py-0.5"
          >
            <option value="minikube">🐳 minikube</option>
            <option value="docker-desktop">📦 docker-desktop</option>
            <option value="prod-cluster">☁️ prod-cluster</option>
          </select>

          <button
            onClick={() => {
              const nextMode = !isReadOnlyMode
              setIsReadOnlyMode(nextMode)
              addEventLog(`Mod Değiştirildi: ${nextMode ? 'SALT İZLEME MODU' : 'MÜDAHALE MODU'}`, 'Normal', true)
            }}
            className={`industrial-btn text-xs py-0.5 px-2 flex items-center gap-1 shadow ${isReadOnlyMode ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-amber-500/20 text-amber-300 border-amber-500/50'}`}
          >
            {isReadOnlyMode ? <Lock className="w-3 h-3 text-sky-400" /> : <Unlock className="w-3 h-3 text-amber-400" />}
            <span>{isReadOnlyMode ? '🔒 SALT İZLEME' : '🔓 MÜDAHALE AÇIK'}</span>
          </button>
        </div>

        {/* CENTER SECTION: CAMERA & VIEW MODE ACTION BUTTONS */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleResetCamera}
            className={`industrial-btn py-0.5 px-2 text-[11px] ${!activeSelection && !showMasterDashboard && !showEventLog ? 'industrial-btn-active' : ''}`}
          >
            <Eye className="w-3 h-3" />
            <span>🦅 KUŞBAKIŞI</span>
          </button>

          <button
            onClick={handleSelectMaster}
            className={`industrial-btn py-0.5 px-2 text-[11px] ${showMasterDashboard ? 'industrial-btn-active' : ''}`}
          >
            <Building2 className="w-3 h-3" />
            <span>🏢 YÖNETİM BİNASI</span>
          </button>

          <button
            onClick={() => setShowHPA(!showHPA)}
            className={`industrial-btn py-0.5 px-2 text-[11px] ${showHPA ? 'industrial-btn-blue-active' : ''}`}
          >
            <Cpu className="w-3 h-3 text-amber-400" />
            <span>🤖 HPA VİNCİ ({showHPA ? 'AKTİF' : 'PASİF'})</span>
          </button>

          <button
            onClick={() => setShowNetworkPolicy(!showNetworkPolicy)}
            className={`industrial-btn py-0.5 px-2 text-[11px] ${showNetworkPolicy ? 'bg-red-500/20 text-red-300 border-red-500/50' : ''}`}
          >
            <ShieldAlert className="w-3 h-3 text-red-400" />
            <span>🛡️ POLICY</span>
          </button>

          <button
            onClick={() => setShowNetworkTraffic(!showNetworkTraffic)}
            className={`industrial-btn py-0.5 px-2 text-[11px] ${showNetworkTraffic ? 'industrial-btn-blue-active' : ''}`}
          >
            <Zap className="w-3 h-3" />
            <span>⚡ TRAFİK</span>
          </button>

          <select
            onChange={(e) => triggerAnomalySimulation(e.target.value)}
            value={activeAnomaly || ''}
            className="industrial-select text-xs py-0.5"
          >
            <option value="">⚠️ ANOMALİ SİMÜLASYONU</option>
            <option value="CrashLoopBackOff">🔥 CrashLoopBackOff</option>
            <option value="OOMKilled">💥 OOMKilled</option>
            <option value="NodeNotReady">🌊 Node NotReady</option>
          </select>
        </div>

        {/* RIGHT SECTION: PNG EXPORT & EVENT LOG BUTTONS */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleExportPNG}
            className="industrial-btn text-xs py-0.5 px-2 flex items-center gap-1 border-sky-500/40 text-sky-300 hover:bg-sky-500/20"
          >
            <Camera className="w-3 h-3 text-sky-400" />
            <span>📸 PNG</span>
          </button>

          <button
            onClick={() => {
              setShowEventLog(!showEventLog)
              setActiveSelection(null)
            }}
            className={`industrial-btn text-xs py-0.5 px-2 flex items-center gap-1 ${showEventLog ? 'industrial-btn-active' : ''}`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>📋 GÜNLÜK ({eventsLog.length})</span>
          </button>
        </div>
      </header>

      {/* KATMAN 1: 3D CANVAS STAGE WRAPPER */}
      <div className="stage-wrapper pt-12">
        <Canvas
          shadows
          camera={{ position: [44, 36, 58], fov: 54 }}
          style={{ width: '100%', height: '100%', display: 'block' }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[45, 55, 40]} intensity={1.7} castShadow />
          <pointLight position={[-15, 20, -10]} intensity={0.8} color="#38bdf8" />
          <Sky sunPosition={[120, 35, 100]} />

          <CameraController targetPosition={camTargetPos} targetLookAt={camTargetLookAt} />

          <Ocean />
          <EnrichedDockAndShore onSelectLandStack={handleSelectCrane} />
          <GantryCrane
            position={[-12, 1, 6]}
            craneData={{}}
            onSelectCrane={handleSelectCrane}
            isImagePullBackOff={activeAnomaly === 'ImagePullBackOff'}
          />
          <GantryCrane position={[-12, 1, -16]} craneData={{}} onSelectCrane={handleSelectCrane} />
          <HarborVillage onClickBuilding={handleSelectMaster} />
          <KubeProxyStation position={[18, 0.2, -16]} onSelectKubeProxy={handleSelectKubeProxy} />

          {/* 3D Ingress Gateway Lighthouse */}
          <IngressLighthouse position={[28, 0.2, 18]} onSelectIngress={handleSelectIngress} />
          <NetworkPolicyBarriers position={[-10, 1.5, 0]} active={showNetworkPolicy} onSelectNetworkPolicy={handleSelectNetworkPolicy} />

          {showHPA && <HPAMobileCrane position={[-4, 1, 6]} />}
          <NodeAffinityLines start={[2, 1, 4]} end={[-22, 1, 0]} active={true} />
          <PDBMaintenanceFlag position={[-16, 2, 14]} />

          <NetworkTrafficParticles ships={activeShips} showTraffic={showNetworkTraffic} />

          {/* Cargo Ships with Smooth Patrol Loop */}
          {activeShips.map((ship) => (
            <CargoShip
              key={ship.id}
              basePosition={ship.position}
              shipData={ship}
              onSelectPod={handleSelectPod}
              onSelectShip={handleSelectShip}
              onSelectKubelet={handleSelectKubelet}
              activeAnomaly={activeAnomaly}
            />
          ))}

          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={8}
            maxDistance={200}
          />
        </Canvas>
      </div>

      {/* KATMAN 3: 2D MASTER CONTROL PLANE DASHBOARD OVERLAY */}
      {showMasterDashboard && (
        <MasterDashboardOverlay
          onClose={handleResetCamera}
          activeShips={activeShips}
        />
      )}

      {/* KATMAN 4: RING BUFFER EVENT LOG OVERLAY DRAWER */}
      <EventLogDrawer
        isOpen={showEventLog}
        onClose={() => setShowEventLog(false)}
        events={eventsLog}
        onSelectEvent={(ev) => {
          setShowEventLog(false)
          if (ev.targetObject === 'pod-1') {
            triggerAnomalySimulation('CrashLoopBackOff')
          }
        }}
      />

      {/* KATMAN 5: CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={!!pendingMutation}
        title={pendingMutation?.title}
        message={pendingMutation?.message}
        onConfirm={executePendingMutation}
        onCancel={() => setPendingMutation(null)}
      />

      {/* KATMAN 6: ABSOLUTE OVERLAY RIGHT INSPECTOR DRAWER */}
      <aside className={`info-panel-drawer pt-12 ${activeSelection && !showMasterDashboard && !showEventLog ? 'drawer-open' : 'drawer-closed'}`}>
        {activeSelection && (
          <div className="p-4 h-full flex flex-col justify-between overflow-y-auto font-mono-tech text-[11px]">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-700">
                <h3 className="font-industrial text-sm font-bold text-amber-400 flex items-center gap-2">
                  {activeSelection.type === 'KUBELET' && <Activity className="w-4 h-4 text-emerald-400" />}
                  {activeSelection.type === 'CRANE' && <Cpu className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'KUBE_PROXY' && <Radio className="w-4 h-4 text-sky-400" />}
                  {activeSelection.type === 'INGRESS' && <Compass className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'POD' && <Box className="w-4 h-4 text-emerald-400" />}
                  {activeSelection.type === 'SHIP' && <ShipIcon className="w-4 h-4 text-sky-400" />}
                  <span>
                    {activeSelection.type === 'KUBELET' && '📡 KUBELET AGENT (MASİF)'}
                    {activeSelection.type === 'CRANE' && '🏗️ KUBE-SCHEDULER (VİNÇ)'}
                    {activeSelection.type === 'KUBE_PROXY' && '📻 AĞ (KUBE-PROXY)'}
                    {activeSelection.type === 'INGRESS' && '🚨 INGRESS DENİZ FENERİ'}
                    {activeSelection.type === 'POD' && '📦 PALET (POD)'}
                    {activeSelection.type === 'SHIP' && '🚢 GEMİ (WORKER NODE)'}
                  </span>
                </h3>
                <button onClick={handleResetCamera} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* KUBELET DETAILS */}
              {activeSelection.type === 'KUBELET' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">KUBELET NODE AJANI:</span>
                    <strong className="text-emerald-400 text-xs">{activeSelection.data.node_name}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <div className="flex justify-between"><span>Durum:</span><strong className="text-emerald-400">{activeSelection.data.status}</strong></div>
                    <div className="flex justify-between"><span>Son Heartbeat:</span><span className="text-sky-300">{activeSelection.data.last_heartbeat}</span></div>
                    <div className="flex justify-between"><span>Readiness Probes:</span><strong className="text-emerald-400">{activeSelection.data.readiness_probe}</strong></div>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-sky-400 font-bold block text-[10px]">NODE CANLI POD'LARI ({activeSelection.data.pods?.length || 2}):</span>
                    {activeSelection.data.pods?.map((p) => (
                      <div key={p.id} className="text-[10px] text-slate-300 flex justify-between">
                        <span>● {p.name}</span>
                        <span className="text-emerald-400">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KUBE-SCHEDULER / CRANE DETAILS */}
              {activeSelection.type === 'CRANE' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">POD ZAMANLAYICI (VİNÇ):</span>
                    <strong className="text-amber-400 text-xs">{activeSelection.data.scheduler_name}</strong>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-sky-400 font-bold block text-[10px]">SON ZAMANLAMA KARARI:</span>
                    <div className="text-slate-200 text-[10px]">{activeSelection.data.last_decision}</div>
                  </div>
                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <div className="flex justify-between"><span>Bekleyen Pod Kuyruğu:</span><strong className="text-amber-300">{activeSelection.data.pending_queue} pod pending</strong></div>
                  </div>
                </div>
              )}

              {/* INGRESS GATEWAY LIGHTHOUSE DETAILS */}
              {activeSelection.type === 'INGRESS' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">INGRESS GATEWAY DENİZ FENERİ:</span>
                    <strong className="text-amber-400 text-xs">{activeSelection.data.name}</strong>
                  </div>
                  {activeSelection.data.rules?.length > 0 ? (
                    <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1.5">
                      <span className="text-sky-400 font-bold block text-[10px]">ROTA KURALLARI:</span>
                      {activeSelection.data.rules.map((r, i) => (
                        <div key={i} className="text-[10px] text-slate-200 bg-slate-900/80 p-1.5 rounded border border-slate-800">
                          ● Host: <strong className="text-white font-mono">tersane.k8s.local</strong> {r.path} ➔ <span className="text-emerald-400">{r.service}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 p-3 rounded border border-amber-500/30 text-amber-300 text-[10px]">
                      Bu cluster'da tanımlı Ingress kaynağı bulunamadı.
                    </div>
                  )}
                  <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                    <span className="text-slate-400 text-[10px]">TLS SERTİFİKASI:</span>
                    <div className="text-emerald-400 font-bold text-[10px]">{activeSelection.data.tls}</div>
                  </div>
                </div>
              )}

              {/* POD DETAILS */}
              {activeSelection.type === 'POD' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">POD ADI:</span>
                    <strong className="text-white text-xs break-all">{activeSelection.data.name || 'web-frontend-deploy-74b89'}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">AMBAR (NS):</span>
                      <strong className="text-sky-400">{activeSelection.data.namespace || 'default'}</strong>
                    </div>
                    <div className="bg-slate-800/60 p-2 rounded border border-slate-700">
                      <span className="text-slate-400 block text-[10px]">DURUM:</span>
                      <strong className="text-emerald-400">{activeSelection.data.status || 'Running'}</strong>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-amber-400 font-bold block text-[10px]">AĞ & DNS BİLGİSİ:</span>
                    <div>Pod IP: <strong className="text-slate-200">{activeSelection.data.ip || '10.244.0.12'}</strong></div>
                    <div>Service IP: <strong className="text-slate-200">{activeSelection.data.service_ip || '10.96.0.45'}</strong></div>
                    <div className="text-[9px] text-sky-300 break-all">{activeSelection.data.dns || 'web-frontend-svc.default.svc.cluster.local'}</div>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-purple-400 font-bold block text-[10px]">İÇİNDEKİ KONTEYNIRLAR:</span>
                    {(activeSelection.data.containers || [{ name: 'app', image: 'nginx:alpine', status: 'Running', restarts: 0 }]).map((c, idx) => (
                      <div key={idx} className="text-[10px] text-slate-300">
                        ● <strong>{c.name}</strong> ({c.image}) - <span className="text-emerald-400">{c.status}</span> (Restarts: {c.restarts})
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-sky-400 font-bold block text-[10px]">KAYNAK REQ / LIMIT:</span>
                    <div>CPU: <strong className="text-emerald-300">{activeSelection.data.resources?.cpu_req || '100m'}</strong> / <strong className="text-amber-300">{activeSelection.data.resources?.cpu_lim || '500m'}</strong></div>
                    <div>RAM: <strong className="text-purple-300">{activeSelection.data.resources?.mem_req || '128Mi'}</strong> / <strong className="text-amber-300">{activeSelection.data.resources?.mem_lim || '512Mi'}</strong></div>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-amber-500/30 space-y-1.5">
                    <span className="text-amber-400 font-bold block text-[10px]">🛠️ MÜDAHALE AKSİYONLARI:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={isReadOnlyMode || activeSelection.data.namespace === 'kube-system'}
                        onClick={() => triggerRestartPodAction(activeSelection.data)}
                        className={`industrial-btn text-[10px] py-1 justify-center ${isReadOnlyMode ? 'opacity-50 cursor-not-allowed' : 'industrial-btn-blue-active'}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>RESTART</span>
                      </button>

                      <button
                        disabled={isReadOnlyMode || activeSelection.data.namespace === 'kube-system'}
                        onClick={() => triggerDeletePodAction(activeSelection.data)}
                        className={`industrial-btn text-[10px] py-1 justify-center ${isReadOnlyMode ? 'opacity-50 cursor-not-allowed' : 'bg-red-600 text-white border-red-500 hover:bg-red-700'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>SİL</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* WORKER NODE DETAILS */}
              {activeSelection.type === 'SHIP' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">NODE ADI:</span>
                    <strong className="text-white text-xs">{activeSelection.data.name}</strong>
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

                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-2">
                    <span className="text-amber-400 font-bold block text-[10px]">KAPASİTE VS KULLANIM:</span>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300">
                        <span>CPU Kullanımı:</span>
                        <strong className="text-emerald-400">{activeSelection.data.metrics?.cpu_usage || '320m'} / {activeSelection.data.metrics?.cpu_capacity || '4000m'}</strong>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-emerald-500 h-full" style={{ width: '28%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-slate-300">
                        <span>RAM Kullanımı:</span>
                        <strong className="text-purple-400">{activeSelection.data.metrics?.memory_usage || '1024Mi'} / {activeSelection.data.metrics?.mem_capacity || '8192Mi'}</strong>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-purple-500 h-full" style={{ width: '22%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-sky-400 font-bold block text-[10px]">NODE SERVİSLERİ & AJANLAR:</span>
                    <div className="flex justify-between"><span>Kubelet Status:</span><strong className="text-emerald-400">Active (Running)</strong></div>
                    <div className="flex justify-between"><span>Kube-Proxy Status:</span><strong className="text-emerald-400">Active (iptables)</strong></div>
                    <div className="flex justify-between"><span>Bağlı Küme:</span><strong className="text-slate-200">{activeClusterContext}</strong></div>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700 space-y-1">
                    <span className="text-emerald-400 font-bold block text-[10px]">ÜZERİNDEKİ POD'LAR ({activeSelection.data.pods?.length || 2}):</span>
                    {(activeSelection.data.pods || []).map((p) => (
                      <div key={p.id} className="text-[10px] text-slate-300 flex justify-between">
                        <span>● {p.name}</span>
                        <span className="text-sky-400">[{p.namespace}]</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-amber-500/40 space-y-1">
                    <span className="text-amber-400 font-bold block text-[10px] flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" /> TAHMİNİ STATİK MALİYET:
                    </span>
                    <div className="flex justify-between text-[10px]"><span>Instance Tipi:</span><strong className="text-white">t3.medium (AWS)</strong></div>
                    <div className="flex justify-between text-[10px]"><span>Saatlik Ücret:</span><strong className="text-emerald-400">$0.0416 / saat</strong></div>
                    <div className="flex justify-between text-[10px]"><span>Tahmini Aylık:</span><strong className="text-amber-300">~$30.00 / ay</strong></div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Kapatmak için yukarıdaki X ikonuna tıklayın
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
