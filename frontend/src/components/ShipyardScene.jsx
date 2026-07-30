import React, { useRef, useState } from 'react'
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
import { Eye, Building2, Ship as ShipIcon, X, Anchor, ShieldCheck, Box, Activity, Radio, ArrowRight, Zap, Clock, Lock, Unlock, Trash2, RefreshCw, Compass, ShieldAlert, Cpu, Layers } from 'lucide-react'

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

// 8. Cargo Ship (Worker Node)
function CargoShip({ position = [0, 0, 0], shipData, onSelectPod, onSelectShip, onSelectKubelet, activeAnomaly }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const isNodeNotReady = activeAnomaly === 'NodeNotReady' && shipData.id === 'node-2'

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      if (isNodeNotReady) {
        groupRef.current.position.y = position[1] - 0.8 + Math.sin(t * 0.8) * 0.05
        groupRef.current.rotation.z = -0.18 + Math.sin(t * 0.8) * 0.02
        groupRef.current.rotation.x = 0.12
      } else {
        groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.12
        groupRef.current.rotation.z = Math.sin(t * 1.1 + position[0]) * 0.02
        groupRef.current.rotation.x = Math.cos(t * 0.9 + position[0]) * 0.015
      }
    }
  })

  const pods = shipData.pods || []

  return (
    <group ref={groupRef} position={position}>
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
  
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)
  const [showEventLog, setShowEventLog] = useState(false)
  const [pendingMutation, setPendingMutation] = useState(null)
  const [activeAnomaly, setActiveAnomaly] = useState(null)

  const [eventsLog, setEventsLog] = useState([
    { id: 1, time: '23:38:10', message: 'Tersane v1.9.0 Küme İzleme Hizmete Girdi', type: 'Normal', isUserTriggered: false },
    { id: 2, time: '23:39:05', message: 'HorizontalPodAutoscaler (HPA) Otomatik Ekstra Vinç Aktif', type: 'Normal', isUserTriggered: false },
    { id: 3, time: '23:40:00', message: 'Ingress Gateway Deniz Feneri aktif edildi', type: 'Normal', isUserTriggered: false }
  ])

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

  const addEventLog = (message, type = 'Normal', isUser = false, targetObject = null) => {
    const timeStr = new Date().toLocaleTimeString('tr-TR')
    setEventsLog((prev) => [
      { id: Date.now(), time: timeStr, message, type, isUserTriggered: isUser, targetObject },
      ...prev.slice(0, 49)
    ])
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
      addEventLog('⚠️ ALARM: Worker Node node-beta NotReady durumuna geçti', 'Warning', false, 'node-2')
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
        tls: 'Enabled (Let\'s Encrypt)'
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
    setCamTargetPos(new THREE.Vector3(ship.position[0] + 16, 14, ship.position[2] + 22))
    setCamTargetLookAt(new THREE.Vector3(...ship.position))
  }

  const handleSelectPod = (pod, shipName) => {
    setActiveSelection({ type: 'POD', data: { ...pod, shipName } })
  }

  const handleSelectKubelet = (ship) => {
    setActiveSelection({
      type: 'KUBELET',
      data: { node_name: ship.name, ip: ship.ip, status: 'Active (Running)', last_heartbeat: '1.2s ago', pods: ship.pods || [] }
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
      data: { scheduler_name: 'default-scheduler', last_decision: 'pod redis-cache-set-0 -> node-beta', pending_queue: 1 }
    })
    setCamTargetPos(new THREE.Vector3(2, 14, 22))
    setCamTargetLookAt(new THREE.Vector3(-12, 4, 6))
  }

  const handleSelectKubeProxy = () => {
    setActiveSelection({
      type: 'KUBE_PROXY',
      data: { mode: 'iptables', services: [{ name: 'web-frontend-svc', clusterIP: '10.96.0.45', endpoints: ['10.244.0.12:80'] }] }
    })
    setCamTargetPos(new THREE.Vector3(32, 12, 0))
    setCamTargetLookAt(new THREE.Vector3(18, 4, -16))
  }

  const handleResetCamera = () => {
    setActiveSelection(null)
    setShowMasterDashboard(false)
    setShowEventLog(false)
    setCamTargetPos(new THREE.Vector3(34, 30, 46))
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
      
      {/* SOL ÜST MİNİMAL ROZET */}
      <div className="fixed top-3 left-3 z-30 pointer-events-auto flex items-center gap-2">
        <div className="glass-panel px-3 py-1.5 rounded-lg border border-amber-500/30 flex items-center gap-2">
          <Anchor className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-industrial text-sm font-bold text-amber-400 tracking-wider">
            TERSANE <span className="text-[10px] text-sky-400 font-mono-tech">v1.9.0</span>
          </span>
        </div>

        <button
          onClick={() => {
            const nextMode = !isReadOnlyMode
            setIsReadOnlyMode(nextMode)
            addEventLog(`Mod Değiştirildi: ${nextMode ? 'SALT İZLEME MODU' : 'MÜDAHALE MODU'}`, 'Normal', true)
          }}
          className={`industrial-btn text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg ${isReadOnlyMode ? 'bg-sky-500/20 text-sky-300 border-sky-500/50' : 'bg-amber-500/20 text-amber-300 border-amber-500/50'}`}
        >
          {isReadOnlyMode ? <Lock className="w-3.5 h-3.5 text-sky-400" /> : <Unlock className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isReadOnlyMode ? '🔒 SALT İZLEME' : '🔓 MÜDAHALE AÇIK'}</span>
        </button>
      </div>

      {/* SAĞ ÜST OLAY GÜNLÜĞÜ BUTONU */}
      <div className="fixed top-3 right-3 z-30 pointer-events-auto">
        <button
          onClick={() => {
            setShowEventLog(!showEventLog)
            setActiveSelection(null)
          }}
          className={`industrial-btn text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-lg ${showEventLog ? 'industrial-btn-active' : ''}`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>📋 OLAY GÜNLÜĞÜ ({eventsLog.length})</span>
        </button>
      </div>

      {/* KATMAN 1: 3D CANVAS STAGE WRAPPER */}
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
          <GantryCrane
            position={[-12, 1, 6]}
            craneData={{}}
            onSelectCrane={handleSelectCrane}
            isImagePullBackOff={activeAnomaly === 'ImagePullBackOff'}
          />
          <GantryCrane position={[-12, 1, -16]} craneData={{}} onSelectCrane={handleSelectCrane} />
          <HarborVillage onClickBuilding={handleSelectMaster} />
          <KubeProxyStation position={[18, 0.2, -16]} onSelectKubeProxy={handleSelectKubeProxy} />

          <IngressLighthouse position={[28, 0.2, 18]} onSelectIngress={handleSelectIngress} />
          <NetworkPolicyBarriers position={[-10, 1.5, 0]} active={showNetworkPolicy} onSelectNetworkPolicy={handleSelectNetworkPolicy} />

          {/* FAZ 19: ORCHESTRATION HELPERS */}
          {showHPA && <HPAMobileCrane position={[-4, 1, 6]} />}
          <NodeAffinityLines start={[2, 1, 4]} end={[-22, 1, 0]} active={true} />
          <PDBMaintenanceFlag position={[-16, 2, 14]} />

          <NetworkTrafficParticles ships={activeShips} showTraffic={showNetworkTraffic} />

          {activeShips.map((ship) => (
            <CargoShip
              key={ship.id}
              position={ship.position}
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
            maxDistance={150}
          />
        </Canvas>
      </div>

      {/* KATMAN 2: MINIMAL BOTTOM TABS */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 industrial-panel p-1 rounded-xl border-amber-500/40">
        <button
          onClick={handleResetCamera}
          className={`industrial-btn py-1 text-xs ${!activeSelection && !showMasterDashboard && !showEventLog ? 'industrial-btn-active' : ''}`}
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
          onClick={() => setShowHPA(!showHPA)}
          className={`industrial-btn py-1 text-xs ${showHPA ? 'industrial-btn-blue-active' : ''}`}
        >
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>🤖 HPA VİNÇİ ({showHPA ? 'AKTİF' : 'PASİF'})</span>
        </button>

        <button
          onClick={() => setShowNetworkPolicy(!showNetworkPolicy)}
          className={`industrial-btn py-1 text-xs ${showNetworkPolicy ? 'bg-red-500/20 text-red-300 border-red-500/50' : ''}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span>🛡️ NETWORK POLICY</span>
        </button>

        <button
          onClick={() => setShowNetworkTraffic(!showNetworkTraffic)}
          className={`industrial-btn py-1 text-xs ${showNetworkTraffic ? 'industrial-btn-blue-active' : ''}`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>⚡ AĞ TRAFİĞİ</span>
        </button>

        <select
          onChange={(e) => triggerAnomalySimulation(e.target.value)}
          value={activeAnomaly || ''}
          className="industrial-select text-xs py-1"
        >
          <option value="">⚠️ ANOMALİ SİMÜLASYONU SEÇ</option>
          <option value="CrashLoopBackOff">🔥 CrashLoopBackOff</option>
          <option value="OOMKilled">💥 OOMKilled</option>
          <option value="NodeNotReady">🌊 Node NotReady</option>
          <option value="ImagePullBackOff">🏗️ ImagePullBackOff</option>
        </select>
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
      <aside className={`info-panel-drawer ${activeSelection && !showMasterDashboard && !showEventLog ? 'drawer-open' : 'drawer-closed'}`}>
        {activeSelection && (
          <div className="p-4 h-full flex flex-col justify-between overflow-y-auto font-mono-tech text-xs">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
                <h3 className="font-industrial text-base font-bold text-amber-400 flex items-center gap-2">
                  {activeSelection.type === 'INGRESS' && <Compass className="w-5 h-5 text-amber-400" />}
                  {activeSelection.type === 'NETWORK_POLICY' && <ShieldAlert className="w-5 h-5 text-red-400" />}
                  {activeSelection.type === 'POD' && <Box className="w-5 h-5 text-emerald-400" />}
                  {activeSelection.type === 'SHIP' && <ShipIcon className="w-5 h-5 text-sky-400" />}
                  {activeSelection.type === 'KUBELET' && <Activity className="w-5 h-5 text-emerald-400" />}
                  {activeSelection.type === 'MASTER' && <Building2 className="w-5 h-5 text-amber-400" />}
                  <span>
                    {activeSelection.type === 'INGRESS' && '🚨 INGRESS DENİZ FENERİ'}
                    {activeSelection.type === 'NETWORK_POLICY' && '🛡️ NETWORK POLICY BARİYERİ'}
                    {activeSelection.type === 'POD' && '📦 PALET (POD)'}
                    {activeSelection.type === 'SHIP' && '🚢 GEMİ (WORKER NODE)'}
                    {activeSelection.type === 'KUBELET' && '📡 KUBELET AGENT'}
                    {activeSelection.type === 'MASTER' && '🏢 YÖNETİM (MASTER)'}
                  </span>
                </h3>
                <button onClick={handleResetCamera} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* POD DETAILS */}
              {activeSelection.type === 'POD' && (
                <div className="space-y-4">
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
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Kapatmak için yukarıdaki X ikonuna tıklayın
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
