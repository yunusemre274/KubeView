import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, Text } from '@react-three/drei'
import * as THREE from 'three'
import MasterDashboardOverlay from './MasterDashboardOverlay'
import NetworkTrafficParticles from './3d/NetworkTrafficParticles'
import EventLogDrawer from './EventLogDrawer'
import ConfirmationModal from './ConfirmationModal'
import IngressLighthouse from './3d/IngressLighthouse'
import NetworkPolicyBarriers from './3d/NetworkPolicyBarriers'
import ConfigMapAndSecretMesh from './3d/ConfigMapAndSecretMesh'
import StorageDepotMesh from './3d/StorageDepotMesh'
import { StatefulSetShip, DaemonSetEquipment, JobTaskBoatMesh } from './3d/WorkloadHelpers'
import PodLogViewer from './PodLogViewer'
import { SmokeAndFlameEffect, RedFlagEffect, OOMKilledBurstEffect } from './3d/AnomalyEffects'
import { HPAMobileCrane, NodeAffinityLines, PDBMaintenanceFlag } from './3d/OrchestrationHelpers'
import { MiniSparkline, DetailedTrendChartModal } from './3d/MetricTrendCharts'
import { calculateContainerDeckPosition, calculateShipDockPosition, calculateShipPatrolPosition } from '../constants/dimensions'
import InfoCard, { InfoCardHeader, InfoCardSection, InfoCardRow, InfoCardBadge } from './InfoCard'
import HoverTooltipOverlay from './3d/HoverTooltipOverlay'
import OnboardingWelcomeModal from './OnboardingWelcomeModal'
import { OBJECT_DESCRIPTIONS } from '../constants/descriptions'
import { Eye, Building2, Ship as ShipIcon, X, Anchor, ShieldCheck, Box, Activity, Radio, ArrowRight, Zap, Clock, Lock, Unlock, Trash2, RefreshCw, Compass, ShieldAlert, Cpu, Camera, DollarSign, Tag, Layers, Server, FileText, ClipboardList, Key, Shield, Database, HardDrive, Link2, Repeat, Play, Layers3, Terminal, UserCheck, ShieldCheck as ShieldCheckIcon, AlertTriangle, TrendingUp, HelpCircle } from 'lucide-react'

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
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, -0.5, 0]} receiveShadow>
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
function GantryCrane({ position = [-14, 1, 10], craneData, onSelectCrane, isImagePullBackOff = false, onHover }) {
  const [hovered, setHovered] = useState(false)
  const hookRef = useRef()

  useFrame(({ clock }) => {
    if (hookRef.current && isImagePullBackOff) {
      hookRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 3) * 0.4
    }
  })

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    onHover && onHover('CRANE')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    onHover && onHover(null)
  }

  return (
    <group
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => { e.stopPropagation(); onSelectCrane(craneData); }}
    >
      <Text position={[0, 13.5, 0]} fontSize={0.65} color="#f59e0b" anchorX="center" outlineWidth={0.06} outlineColor="#0f172a">
        🤖 SCHEDULER (VİNÇ)
      </Text>
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
function HarborVillage({ onClickBuilding, onHover }) {
  const [hovered, setHovered] = useState(false)
  const radarRef = useRef()

  useFrame(({ clock }) => {
    if (radarRef.current) {
      radarRef.current.rotation.y = clock.getElapsedTime() * 2
    }
  })

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    onHover && onHover('MASTER')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    onHover && onHover(null)
  }

  return (
    <group position={[-22, 1.0, -14]}>
      {/* 3D Visual Identification Label */}
      <Text position={[0, 11.8, 0]} fontSize={0.7} color="#ef4444" anchorX="center" outlineWidth={0.06} outlineColor="#0f172a">
        🏢 CONTROL PLANE (YÖNETİM BİNASI)
      </Text>

      <mesh
        position={[0, 4, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
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
function KubeProxyStation({ position = [18, 0.2, -16], onSelectKubeProxy, onHover }) {
  const beaconRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = clock.getElapsedTime() * 2
    }
  })

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    onHover && onHover('KUBE_PROXY')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    onHover && onHover(null)
  }

  return (
    <group
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={(e) => { e.stopPropagation(); onSelectKubeProxy(); }}
    >
      {/* 3D Visual Identification Label */}
      <Text position={[0, 11.2, 0]} fontSize={0.65} color="#38bdf8" anchorX="center" outlineWidth={0.06} outlineColor="#0f172a">
        ⚡ KUBE-PROXY
      </Text>

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
function CargoContainer({ position, podData, shipName, onSelectPod, activeAnomaly, index = 0, onHover }) {
  const [hovered, setHovered] = useState(false)
  const isCrashLoop = activeAnomaly === 'CrashLoopBackOff' && (podData.id === 'pod-1' || index === 0)
  const isOOM = activeAnomaly === 'OOMKilled' && (podData.id === 'pod-2' || index === 1)
  const isProbeFail = activeAnomaly === 'ReadinessFail' && (podData.id === 'pod-1' || index === 0)

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    onHover && onHover('POD')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    onHover && onHover(null)
  }

  return (
    <group position={position}>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
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

// 8. Cargo Ship (Worker Node) With Smooth Patrol Rotation Curve & DaemonSet Antenna
function CargoShip({ basePosition = [0, 0, 0], shipData, onSelectPod, onSelectShip, onSelectKubelet, onSelectDaemonSet, activeAnomaly, shipIndex = 0, totalShips = 1, onHover }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const isNodeNotReady = activeAnomaly === 'NodeNotReady' && (shipData.id === 'node-2' || shipIndex === 1 || shipIndex === 0)

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    onHover && onHover('SHIP')
  }

  const handlePointerOut = (e) => {
    e.stopPropagation()
    setHovered(false)
    onHover && onHover(null)
  }

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const elapsedTime = clock.getElapsedTime()

    // Calculate zero-collision phase-spaced patrol position in open water
    const { position, rotationY, t } = calculateShipPatrolPosition(shipIndex, totalShips, elapsedTime, isNodeNotReady)

    if (isNodeNotReady) {
      groupRef.current.position.set(position[0], position[1] - 0.8 + Math.sin(t * 3) * 0.05, position[2])
      groupRef.current.rotation.y = rotationY
      groupRef.current.rotation.z = -0.18 + Math.sin(t * 3) * 0.02
      groupRef.current.rotation.x = 0.12
    } else {
      groupRef.current.position.set(position[0], position[1] + Math.sin(t * 15) * 0.08, position[2])
      groupRef.current.rotation.y = rotationY
      groupRef.current.rotation.x = 0
      groupRef.current.rotation.z = Math.sin(t * 10) * 0.015
    }
  })

  const pods = shipData.pods || []

  return (
    <group ref={groupRef} position={basePosition}>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => { e.stopPropagation(); onSelectShip(shipData); }}
        position={[0, 0.4, 0]}
        castShadow
      >
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

      {/* DAEMONSET STANDART EKİPMAN ANTENİ */}
      <DaemonSetEquipment
        position={[0, 6.5, -7.0]}
        dsData={{ name: 'kube-flannel-ds', namespace: 'kube-system', desired: 2, current: 2, ready: 2 }}
        onSelectDaemonSet={onSelectDaemonSet}
        onHover={onHover}
      />

      {pods.map((pod, idx) => {
        const containerPos = calculateContainerDeckPosition(idx)
        return (
          <CargoContainer
            key={pod.id || idx}
            index={idx}
            position={containerPos}
            podData={pod}
            shipName={shipData.name}
            onSelectPod={onSelectPod}
            activeAnomaly={activeAnomaly}
            onHover={onHover}
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

export default function ShipyardScene({ ships = [], isConnected = false, eventsLog: externalEventsLog = [], deployments: externalDeployments = [] }) {
  const [showOnboardingModal, setShowOnboardingModal] = useState(() => {
    return localStorage.getItem('tersane_onboarding_seen') !== 'true'
  })
  const [hoveredObject, setHoveredObject] = useState(null)
  const [activeSelection, setActiveSelection] = useState(null)
  const [showMasterDashboard, setShowMasterDashboard] = useState(false)
  const [showNetworkTraffic, setShowNetworkTraffic] = useState(true)

  const handleHover = (descKey) => {
    if (!descKey) {
      setHoveredObject(null)
    } else if (typeof descKey === 'string') {
      setHoveredObject(OBJECT_DESCRIPTIONS[descKey] || null)
    } else {
      setHoveredObject(descKey)
    }
  }
  const [showNetworkPolicy, setShowNetworkPolicy] = useState(false)
  const [showHPA, setShowHPA] = useState(true)
  const [activeClusterContext, setActiveClusterContext] = useState('minikube')
  const [podDrawerTab, setPodDrawerTab] = useState('details')
  const [showDetailedTrendModal, setShowDetailedTrendModal] = useState(false)

  // IN-MEMORY SHORT-TERM METRICS RING BUFFER (LAST 1 HOUR, 120 POINTS MAX)
  const [metricsHistory, setMetricsHistory] = useState(() => {
    const initialPoints = []
    const now = new Date()
    for (let i = 24; i >= 0; i--) {
      const timeStr = new Date(now.getTime() - i * 30000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      initialPoints.push({
        time: timeStr,
        cpu: Math.floor(20 + Math.sin(i * 0.4) * 12 + Math.random() * 6),
        mem: Math.floor(30 + Math.cos(i * 0.3) * 10 + Math.random() * 5),
        clusterCpu: Math.floor(25 + Math.sin(i * 0.2) * 10 + Math.random() * 4),
        clusterMem: Math.floor(35 + Math.cos(i * 0.25) * 8 + Math.random() * 4)
      })
    }
    return initialPoints
  })

  // DECOUPLED METRIC BUFFER SAMPLING LOOP (EVERY 5 SECONDS)
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsHistory((prev) => {
        const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const last = prev[prev.length - 1] || { cpu: 25, mem: 35, clusterCpu: 28, clusterMem: 38 }
        const newPoint = {
          time: nowStr,
          cpu: Math.min(95, Math.max(10, Math.round(last.cpu + (Math.random() - 0.48) * 8))),
          mem: Math.min(90, Math.max(15, Math.round(last.mem + (Math.random() - 0.49) * 5))),
          clusterCpu: Math.min(90, Math.max(12, Math.round(last.clusterCpu + (Math.random() - 0.48) * 6))),
          clusterMem: Math.min(85, Math.max(20, Math.round(last.clusterMem + (Math.random() - 0.49) * 4)))
        }
        return [...prev.slice(-119), newPoint]
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])
  
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false)
  const [showEventLog, setShowEventLog] = useState(false)
  const [pendingMutation, setPendingMutation] = useState(null)
  const [activeAnomaly, setActiveAnomaly] = useState(null)
  const [activeJobBoat, setActiveJobBoat] = useState({
    name: 'db-migration-job-8841',
    namespace: 'default',
    completions: '1/1',
    status: 'Completed',
    start_time: '11:05:00',
    end_time: '11:05:42'
  })

  const [eventsLog, setEventsLog] = useState([
    { id: 1, time: '23:38:10', message: 'Tersane v2.7.0 Pro Küme İzleme Hizmete Girdi', type: 'Normal', isUserTriggered: false },
    { id: 2, time: '23:39:05', message: 'Zaman İçindeki Metrik Trend Grafiği Ring Buffer Aktif', type: 'Normal', isUserTriggered: false },
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
          owner_kind: 'Deployment',
          owner_name: 'web-frontend-deploy',
          service_account: 'default',
          bound_roles: ['view', 'tersane-role'],
          color: '#10b981',
          status: 'Running',
          ip: '10.244.0.12',
          service_name: 'web-frontend-svc',
          service_ip: '10.96.0.45',
          dns: 'web-frontend-svc.default.svc.cluster.local',
          containers: [
            { name: 'react-app', image: 'nginx:alpine', status: 'Running', restarts: 0 },
            { name: 'sidecar-proxy', image: 'envoyproxy/envoy:v1.28', status: 'Running', restarts: 0 }
          ],
          resources: { cpu_req: '100m', cpu_lim: '500m', mem_req: '128Mi', mem_lim: '512Mi' }
        },
        {
          id: 'pod-2',
          name: 'api-backend-deploy-59d4c',
          namespace: 'default',
          owner_kind: 'Deployment',
          owner_name: 'api-backend-deploy',
          service_account: 'admin-sa',
          bound_roles: ['cluster-admin'],
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
          owner_kind: 'StatefulSet',
          owner_name: 'redis-cache-set',
          ordinal: '#0',
          service_account: 'default',
          bound_roles: ['view'],
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

  const handleSelectServiceAccount = (saName = 'default', namespace = 'default') => {
    const isAdmin = saName === 'admin-sa'
    setActiveSelection({
      type: 'SERVICEACCOUNT',
      data: {
        name: saName,
        namespace,
        is_admin: isAdmin,
        bound_role: isAdmin ? 'cluster-admin' : 'view',
        bound_binding: isAdmin ? 'admin-sa-binding' : 'default-view-binding',
        used_by_pods: isAdmin ? ['api-backend-deploy-59d4c'] : ['web-frontend-deploy-74b89', 'redis-cache-set-0'],
        created_at: '2026-07-20T08:00:00Z'
      }
    })
  }

  const handleSelectRole = (roleName = 'view', isCluster = false) => {
    setActiveSelection({
      type: 'ROLE',
      data: {
        name: roleName,
        namespace: isCluster ? '' : 'default',
        is_cluster: isCluster,
        rules: [
          { resources: ['pods', 'pods/log', 'configmaps', 'services'], verbs: ['get', 'list', 'watch'] },
          { resources: ['events'], verbs: ['get', 'list'] }
        ],
        bound_sas: ['default', 'tersane-sa']
      }
    })
  }

  const handleSelectStatefulSet = () => {
    setActiveSelection({
      type: 'STATEFULSET',
      data: {
        name: 'redis-cache-set',
        namespace: 'production',
        replicas: '1/1 Ready',
        service_name: 'redis-svc',
        ordinal: '#0',
        bound_pvc: 'web-data-pvc',
        pod_names: ['redis-cache-set-0']
      }
    })
    setCamTargetPos(new THREE.Vector3(-4, 12, -12))
    setCamTargetLookAt(new THREE.Vector3(-14, 2, -22))
  }

  const handleSelectDaemonSet = (ds) => {
    setActiveSelection({
      type: 'DAEMONSET',
      data: ds || {
        name: 'kube-flannel-ds',
        namespace: 'kube-system',
        desired: 2,
        current: 2,
        ready: 2,
        nodes: ['node-alpha', 'node-beta']
      }
    })
    setCamTargetPos(new THREE.Vector3(14, 16, 16))
    setCamTargetLookAt(new THREE.Vector3(2, 6, 4))
  }

  const handleSelectJob = (job) => {
    setActiveSelection({
      type: 'JOB',
      data: job || activeJobBoat
    })
    setCamTargetPos(new THREE.Vector3(24, 10, 28))
    setCamTargetLookAt(new THREE.Vector3(14, 1, 18))
  }

  const handleTriggerCronJob = (cronJobName) => {
    const newJobName = `db-backup-job-${Math.floor(1000 + Math.random() * 9000)}`
    const newJob = {
      name: newJobName,
      namespace: 'default',
      completions: '1/1',
      status: 'Running',
      start_time: new Date().toLocaleTimeString('tr-TR'),
      end_time: 'Devam ediyor...'
    }
    setActiveJobBoat(newJob)
    addEventLog(`⏰ CronJob '${cronJobName}' yeni bir Job başlattı: ${newJobName}`, 'Normal', true)
    
    setCamTargetPos(new THREE.Vector3(24, 10, 28))
    setCamTargetLookAt(new THREE.Vector3(14, 1, 18))

    setTimeout(() => {
      setActiveJobBoat((prev) => ({ ...prev, status: 'Completed', end_time: new Date().toLocaleTimeString('tr-TR') }))
      addEventLog(`✅ Job '${newJobName}' başarıyla tamamlandı (Completed)`, 'Normal', false)
    }, 4500)
  }

  const handleSelectConfigMap = () => {
    setActiveSelection({
      type: 'CONFIGMAP',
      data: {
        name: 'web-frontend-config',
        namespace: 'default',
        used_by: ['web-frontend-deploy-74b89'],
        created_at: '2026-07-25T10:00:00Z',
        data: {
          APP_ENV: 'production',
          LOG_LEVEL: 'info',
          MAX_CONNECTIONS: '100',
          'nginx.conf': 'server {\n  listen 80;\n  server_name localhost;\n  location / {\n    root /usr/share/nginx/html;\n    index index.html;\n  }\n}'
        }
      }
    })
    setCamTargetPos(new THREE.Vector3(-4, 10, -10))
    setCamTargetLookAt(new THREE.Vector3(-8, 1, -18))
  }

  const handleSelectSecret = () => {
    setActiveSelection({
      type: 'SECRET',
      data: {
        name: 'db-credentials-secret',
        namespace: 'default',
        type: 'Opaque',
        key_names: ['DB_USER', 'DB_PASSWORD', 'API_SECRET_KEY'],
        used_by: ['api-backend-deploy-59d4c'],
        created_at: '2026-07-28T14:20:00Z'
      }
    })
    setCamTargetPos(new THREE.Vector3(2, 10, -10))
    setCamTargetLookAt(new THREE.Vector3(-2, 1, -18))
  }

  const handleSelectPVC = () => {
    setActiveSelection({
      type: 'PVC',
      data: {
        name: 'web-data-pvc',
        namespace: 'default',
        status: 'Bound',
        requested_capacity: '10Gi',
        bound_pv: 'pv-storage-disk-01',
        storage_class: 'gp3 (AWS EBS)',
        access_modes: ['ReadWriteOnce'],
        used_by_pods: ['web-frontend-deploy-74b89'],
        created_at: '2026-07-26T12:00:00Z'
      }
    })
    setCamTargetPos(new THREE.Vector3(-18, 12, 28))
    setCamTargetLookAt(new THREE.Vector3(-28, 2, 18))
  }

  const handleSelectPV = () => {
    setActiveSelection({
      type: 'PV',
      data: {
        name: 'pv-storage-disk-01',
        status: 'Bound',
        capacity: '10Gi',
        storage_class: 'gp3 (AWS EBS)',
        reclaim_policy: 'Retain',
        bound_pvc: 'default/web-data-pvc',
        backend_type: 'AWS EBS gp3 (vol-03b9f1a2)',
        created_at: '2026-07-26T11:45:00Z'
      }
    })
    setCamTargetPos(new THREE.Vector3(-18, 12, 28))
    setCamTargetLookAt(new THREE.Vector3(-28, 2, 18))
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
    setPodDrawerTab('details')
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
              TERSANE <span className="text-[10px] text-sky-400 font-mono-tech">v2.7.0</span>
            </span>
          </div>

          {/* Connection Status Live Badge */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-industrial font-bold ${
            isConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500'}`} />
            <span>{isConnected ? 'CANLI STREAM' : 'BAĞLANTI KOPUK'}</span>
          </div>

          <div className="relative flex items-center">
            <select
              value={activeClusterContext}
              onChange={(e) => {
                setActiveClusterContext(e.target.value)
                addEventLog(`Küme Bağlamı Seçildi (UI Önizleme): ${e.target.value}`, 'Normal', true)
              }}
              className="industrial-select text-xs py-0.5 pr-14"
            >
              <option value="minikube">🐳 minikube</option>
              <option value="docker-desktop">📦 docker-desktop</option>
              <option value="prod-cluster">☁️ prod-cluster</option>
            </select>
            <span className="absolute right-1 text-[9px] px-1 rounded bg-slate-800 text-amber-400/80 font-mono pointer-events-none">
              ⚡ UI Önizleme
            </span>
          </div>

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

        {/* RIGHT SECTION: HELP, PNG EXPORT & EVENT LOG BUTTONS */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowOnboardingModal(true)}
            className="industrial-btn text-xs py-0.5 px-2 flex items-center gap-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
          >
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span>❓ YARDIM</span>
          </button>

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
            onHover={handleHover}
          />
          <GantryCrane position={[-12, 1, -16]} craneData={{}} onSelectCrane={handleSelectCrane} onHover={handleHover} />
          <HarborVillage onClickBuilding={handleSelectMaster} onHover={handleHover} />
          <KubeProxyStation position={[18, 0.2, -16]} onSelectKubeProxy={handleSelectKubeProxy} onHover={handleHover} />

          {/* 3D ConfigMap Notice Board & 3D Secret Safe Box */}
          <ConfigMapAndSecretMesh
            configMapPosition={[-8, 0.2, -18]}
            secretPosition={[-2, 0.2, -18]}
            onSelectConfigMap={handleSelectConfigMap}
            onSelectSecret={handleSelectSecret}
            onHover={handleHover}
          />

          {/* 3D Land-Based Storage Depot (PVC/PV Kiralanmış Ambar) */}
          <StorageDepotMesh
            position={[-32, 0.2, 18]}
            pvcData={{ name: 'web-data-pvc', status: 'Bound', capacity: '10Gi' }}
            pvData={{ name: 'pv-storage-disk-01', capacity: '10Gi' }}
            targetPodPosition={[2, 1, 4]}
            onSelectStorage={handleSelectPVC}
            onHover={handleHover}
          />

          {/* 3D STATEFULSET SHIP (NUMARALI SABİT DEMİRLİ GEMİ) */}
          <StatefulSetShip
            position={[-14, 0, -26]}
            stsData={{ name: 'redis-cache-set', ordinal: '#0', replicas: '1/1 Ready' }}
            onSelectStatefulSet={handleSelectStatefulSet}
            onHover={handleHover}
          />

          {/* 3D JOB TASK BOAT (GEÇİCİ GÖREV ŞALUPASI) */}
          <JobTaskBoatMesh
            position={[16, 0.2, 22]}
            jobData={activeJobBoat}
            onSelectJob={handleSelectJob}
            onHover={handleHover}
          />

          {/* 3D Ingress Gateway Lighthouse */}
          <IngressLighthouse position={[32, 0.2, 18]} onSelectIngress={handleSelectIngress} onHover={handleHover} />
          <NetworkPolicyBarriers position={[-10, 1.5, 0]} active={showNetworkPolicy} onSelectNetworkPolicy={handleSelectNetworkPolicy} />

          {showHPA && <HPAMobileCrane position={[-4, 1, 6]} />}
          <NodeAffinityLines start={[2, 1, 4]} end={[-22, 1, 0]} active={true} />
          <PDBMaintenanceFlag position={[-16, 2, 14]} />

          <NetworkTrafficParticles ships={activeShips} showTraffic={showNetworkTraffic} />

          {/* Cargo Ships with Smooth Patrol Loop */}
          {activeShips.map((ship, shipIdx) => (
            <CargoShip
              key={ship.id}
              shipIndex={shipIdx}
              totalShips={activeShips.length}
              basePosition={ship.position}
              shipData={ship}
              onSelectPod={handleSelectPod}
              onSelectShip={handleSelectShip}
              onSelectKubelet={handleSelectKubelet}
              onSelectDaemonSet={handleSelectDaemonSet}
              activeAnomaly={activeAnomaly}
              onHover={handleHover}
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
          onTriggerCronJob={handleTriggerCronJob}
          metricsHistory={metricsHistory}
        />
      )}

      {/* DETAILED METRIC TREND CHART MODAL */}
      <DetailedTrendChartModal
        isOpen={showDetailedTrendModal}
        onClose={() => setShowDetailedTrendModal(false)}
        targetName={activeSelection?.data?.name || 'node-alpha'}
        history={metricsHistory}
      />

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
          <div className="p-3.5 h-full flex flex-col justify-between font-mono-tech text-[10.5px]">
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <h3 className="font-industrial text-xs font-bold text-amber-400 flex items-center gap-2">
                  {activeSelection.type === 'KUBELET' && <Activity className="w-4 h-4 text-emerald-400" />}
                  {activeSelection.type === 'CRANE' && <Cpu className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'KUBE_PROXY' && <Radio className="w-4 h-4 text-sky-400" />}
                  {activeSelection.type === 'INGRESS' && <Compass className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'POD' && <Box className="w-4 h-4 text-emerald-400" />}
                  {activeSelection.type === 'SHIP' && <ShipIcon className="w-4 h-4 text-sky-400" />}
                  {activeSelection.type === 'CONFIGMAP' && <ClipboardList className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'SECRET' && <Key className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'PVC' && <Database className="w-4 h-4 text-purple-400" />}
                  {activeSelection.type === 'PV' && <HardDrive className="w-4 h-4 text-purple-400" />}
                  {activeSelection.type === 'STATEFULSET' && <Layers3 className="w-4 h-4 text-purple-400" />}
                  {activeSelection.type === 'DAEMONSET' && <Terminal className="w-4 h-4 text-sky-400" />}
                  {activeSelection.type === 'JOB' && <Play className="w-4 h-4 text-amber-400" />}
                  {activeSelection.type === 'SERVICEACCOUNT' && <UserCheck className="w-4 h-4 text-sky-400" />}
                  {activeSelection.type === 'ROLE' && <ShieldCheckIcon className="w-4 h-4 text-purple-400" />}
                  <span>
                    {activeSelection.type === 'KUBELET' && '📡 KUBELET AGENT (MASİF)'}
                    {activeSelection.type === 'CRANE' && '🏗️ KUBE-SCHEDULER (VİNÇ)'}
                    {activeSelection.type === 'KUBE_PROXY' && '📻 AĞ (KUBE-PROXY)'}
                    {activeSelection.type === 'INGRESS' && '🚨 INGRESS DENİZ FENERİ'}
                    {activeSelection.type === 'POD' && '📦 PALET (POD)'}
                    {activeSelection.type === 'SHIP' && '🚢 GEMİ (WORKER NODE)'}
                    {activeSelection.type === 'CONFIGMAP' && '📋 SEVKİYAT FÖYÜ (CONFIGMAP)'}
                    {activeSelection.type === 'SECRET' && '🔐 KİLİTLİ KASA (SECRET)'}
                    {activeSelection.type === 'PVC' && '🏢 DEPO TALEBİ (PVC)'}
                    {activeSelection.type === 'PV' && '🏭 FİZİKSEL DEPO AMBARI (PV)'}
                    {activeSelection.type === 'STATEFULSET' && '🔢 NUMARALI SABİT GEMİ (STATEFULSET)'}
                    {activeSelection.type === 'DAEMONSET' && '🧯 STANDART EKİPMAN (DAEMONSET)'}
                    {activeSelection.type === 'JOB' && '⚓ GÖREV ŞALUPASI (JOB)'}
                    {activeSelection.type === 'SERVICEACCOUNT' && '🪪 KİMLİK KARTI (SERVICEACCOUNT)'}
                    {activeSelection.type === 'ROLE' && '🛡️ YETKİ ROZETİ (ROLE / RULES)'}
                  </span>
                </h3>
                <button onClick={handleResetCamera} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <InfoCard>
                {/* WORKER NODE DETAILS WITH SPARKLINE & DETAILED TREND LINK */}
                {activeSelection.type === 'SHIP' && (
                  <>
                    <InfoCardHeader title={activeSelection.data.name} subtitle={activeSelection.data.ip || '192.168.1.101'} status={activeSelection.data.status || 'Ready'} typeLabel="WORKER NODE" icon={ShipIcon} />
                    <InfoCardSection title="⚡ KAPASİTE VE CANLI TREND" colorClass="text-amber-400">
                      <div className="flex justify-between items-center pb-1">
                        <span className="text-slate-400 text-[10px]">CPU / RAM METRİK:</span>
                        <button onClick={() => setShowDetailedTrendModal(true)} className="industrial-btn text-[9px] py-0.5 px-1.5 border-sky-500/40 text-sky-300">
                          <TrendingUp className="w-2.5 h-2.5" /> DETAYLI GRAFİK
                        </button>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">CPU: <strong className="text-emerald-400">{activeSelection.data.metrics?.cpu_usage || '320m'} / {activeSelection.data.metrics?.cpu_capacity || '4000m'}</strong></span>
                          <MiniSparkline data={metricsHistory.map((h) => h.cpu)} color="#10b981" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300">RAM: <strong className="text-purple-400">{activeSelection.data.metrics?.memory_usage || '1024Mi'} / {activeSelection.data.metrics?.mem_capacity || '8192Mi'}</strong></span>
                          <MiniSparkline data={metricsHistory.map((h) => h.mem)} color="#a855f7" />
                        </div>
                      </div>
                    </InfoCardSection>
                    <InfoCardSection title="📌 TEMEL BİLGİLER">
                      <InfoCardRow label="Node IP" value={activeSelection.data.ip || '192.168.1.101'} valueColor="text-sky-300" />
                      <InfoCardRow label="Sağlık" value={activeSelection.data.status || 'Ready'} valueColor="text-emerald-400" />
                      <InfoCardRow label="Bağlı Küme" value={activeClusterContext} />
                    </InfoCardSection>
                    <InfoCardSection title={`📦 ÜZERİNDEKİ POD'LAR (${activeSelection.data.pods?.length || 2})`} colorClass="text-emerald-400">
                      {(activeSelection.data.pods || []).map((p) => (
                        <InfoCardRow key={p.id} label={p.name} value={p.namespace} valueColor="text-sky-400" />
                      ))}
                    </InfoCardSection>
                  </>
                )}

                {/* SERVICEACCOUNT DETAILS */}
                {activeSelection.type === 'SERVICEACCOUNT' && (
                  <>
                    <InfoCardHeader title={activeSelection.data.name} status={activeSelection.data.is_admin ? 'CLUSTER-ADMIN' : 'NORMAL'} typeLabel="SERVICEACCOUNT" icon={UserCheck} />
                    {activeSelection.data.is_admin && (
                      <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/50 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                        <div className="text-[10px] text-red-300 leading-tight">
                          <strong className="text-red-400 block">⚠️ AŞIRI YETKİLİ SERVICEACCOUNT:</strong>
                          Bu ServiceAccount <code className="text-amber-300 font-mono font-bold">cluster-admin</code> rolüne bağlıdır!
                        </div>
                      </div>
                    )}
                    <InfoCardSection title="BAĞLI ROL VEYA BİNDİNG">
                      <InfoCardRow label="Binding" value={activeSelection.data.bound_binding} />
                      <InfoCardRow label="Hedef Rol" value={activeSelection.data.bound_role} isLink={true} onClick={() => handleSelectRole(activeSelection.data.bound_role, activeSelection.data.is_admin)} valueColor="text-purple-300" />
                    </InfoCardSection>
                    <InfoCardSection title="BU SA İLE ÇALIŞAN POD'LAR" colorClass="text-emerald-400">
                      {activeSelection.data.used_by_pods?.map((podName, idx) => (
                        <InfoCardRow key={idx} label={`Pod #${idx + 1}`} value={podName} />
                      ))}
                    </InfoCardSection>
                  </>
                )}

                {/* ROLE / CLUSTERROLE RULES DETAILS */}
                {activeSelection.type === 'ROLE' && (
                  <>
                    <InfoCardHeader title={activeSelection.data.name} status={activeSelection.data.is_cluster ? 'CLUSTERROLE' : 'ROLE'} typeLabel="ROLE / CLUSTERROLE" icon={ShieldCheckIcon} />
                    <InfoCardSection title="📋 TANIMLI İZİNLER (RULES TABLOSU)" colorClass="text-amber-400">
                      <div className="space-y-1.5">
                        {activeSelection.data.rules?.map((rule, idx) => (
                          <div key={idx} className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1 text-[10px]">
                            <div className="flex items-center gap-1 text-sky-300">
                              <Box className="w-3 h-3 text-sky-400 shrink-0" />
                              <strong>Kaynaklar:</strong> <span className="text-white font-mono truncate">{rule.resources.join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-400">
                              <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                              <strong>Eylemler:</strong> <span className="text-emerald-300 font-mono truncate">{rule.verbs.join(', ')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </InfoCardSection>
                    <InfoCardSection title="BAĞLI SERVICEACCOUNT'LAR">
                      {activeSelection.data.bound_sas?.map((saName, idx) => (
                        <InfoCardRow key={idx} label={`SA #${idx + 1}`} value={saName} />
                      ))}
                    </InfoCardSection>
                  </>
                )}

                {/* POD DETAILS & LOG VIEWER */}
                {activeSelection.type === 'POD' && (
                  <div className="space-y-2.5">
                    <div className="flex border-b border-slate-800 pb-2 gap-2">
                      <button
                        onClick={() => setPodDrawerTab('details')}
                        className={`flex-1 py-1 px-2 rounded text-[10.5px] font-industrial flex items-center justify-center gap-1.5 border transition ${
                          podDrawerTab === 'details'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Box className="w-3.5 h-3.5" />
                        <span>📋 DETAYLAR</span>
                      </button>

                      <button
                        onClick={() => setPodDrawerTab('logs')}
                        className={`flex-1 py-1 px-2 rounded text-[10.5px] font-industrial flex items-center justify-center gap-1.5 border transition ${
                          podDrawerTab === 'logs'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold shadow'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                        <span>📜 LOGLAR</span>
                      </button>
                    </div>

                    {podDrawerTab === 'details' && (
                      <>
                        <InfoCardHeader title={activeSelection.data.name || 'web-frontend-deploy-74b89'} subtitle={activeSelection.data.namespace || 'default'} status={activeSelection.data.status || 'Running'} typeLabel="POD" icon={Box} />
                        <InfoCardSection title="📌 TEMEL BİLGİLER">
                          <InfoCardRow label="Ambar (NS)" value={activeSelection.data.namespace || 'default'} valueColor="text-sky-400" />
                          <InfoCardRow label="Owner" value={`${activeSelection.data.owner_kind || 'Deployment'}:${activeSelection.data.owner_name || 'app'}`} valueColor="text-purple-300" />
                          <InfoCardRow label="SA" value={activeSelection.data.service_account || 'default'} isLink={true} onClick={() => handleSelectServiceAccount(activeSelection.data.service_account || 'default', activeSelection.data.namespace || 'default')} valueColor="text-sky-300" />
                        </InfoCardSection>
                        <InfoCardSection title="🌐 AĞ & DNS BİLGİSİ" colorClass="text-amber-400">
                          <InfoCardRow label="Pod IP" value={activeSelection.data.ip || '10.244.0.12'} />
                          <InfoCardRow label="Service IP" value={activeSelection.data.service_ip || '10.96.0.45'} />
                          <InfoCardRow label="DNS Adı" value={activeSelection.data.dns || 'web-frontend.svc.local'} valueColor="text-sky-300" />
                        </InfoCardSection>
                        <InfoCardSection title="📜 İÇİNDEKİ KONTEYNIRLAR" colorClass="text-purple-400">
                          {(activeSelection.data.containers || [{ name: 'app', image: 'nginx:alpine', status: 'Running', restarts: 0 }]).map((c, idx) => (
                            <InfoCardRow key={idx} label={c.name} value={`${c.image} (${c.status})`} valueColor="text-emerald-300" />
                          ))}
                        </InfoCardSection>
                        <InfoCardSection title="🛠️ MÜDAHALE AKSİYONLARI" colorClass="text-amber-400">
                          <div className="grid grid-cols-2 gap-2 pt-1">
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
                        </InfoCardSection>
                      </>
                    )}

                    {podDrawerTab === 'logs' && (
                      <PodLogViewer pod={activeSelection.data} />
                    )}
                  </div>
                )}
              </InfoCard>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Kapatmak için yukarıdaki X ikonuna tıklayın
            </div>
          </div>
        )}
      </aside>

      {/* KATMAN 7: 3D OBJECT HOVER TOOLTIP OVERLAY */}
      <HoverTooltipOverlay hoveredObject={hoveredObject} />

      {/* KATMAN 8: DISCONNECTED BACKEND ALERT OVERLAY BANNER */}
      {!isConnected && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-lg bg-red-950/90 border border-red-500/60 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-pulse">
          <div className="p-1.5 rounded-full bg-red-500/20 text-red-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-red-200 font-industrial tracking-wider flex items-center gap-2">
              <span>⚠️ KUBERNETES BACKEND SUNUCUSUNA BAĞLANILAMADI</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-red-900 text-red-300 font-mono">PORT 8000-8020</span>
            </div>
            <p className="text-[10px] text-slate-300">
              WebSocket kanalı kapalı. Sunucuyu başlatın: <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded font-mono">cd backend && go run main.go</code>
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2.5 py-1 rounded text-[11px] bg-red-800 hover:bg-red-700 text-white font-industrial border border-red-500/40 flex items-center gap-1 transition shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>YENİDEN DENE</span>
          </button>
        </div>
      )}

      {/* KATMAN 9: FIRST-TIME ONBOARDING WELCOME MODAL */}
      <OnboardingWelcomeModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
    </div>
  )
}
