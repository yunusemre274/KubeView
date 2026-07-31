import React, { createContext, useContext, useState, useEffect } from 'react'

// -----------------------------------------------------------------------------
// MODULE-LEVEL SINGLETON CONNECTION MANAGER
// Defined OUTSIDE React rendering tree to guarantee EXACTLY 1 WebSocket connection
// regardless of React.StrictMode double-mounting or component re-renders.
// -----------------------------------------------------------------------------
const singletonManager = {
  socket: null,
  isConnecting: false,
  activePort: 8000,
  portAttempt: 8000,
  maxPort: 8005,
  reconnectTimer: null,
  listeners: new Set(),

  // Central Shared State
  state: {
    isConnected: false,
    activePort: 8000,
    connectionError: null,
    shipsMap: {},
    deploymentsList: [],
    eventsLog: []
  },

  // Notify all subscribed React Context consumers
  notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state })
      } catch (err) {
        console.error('[ws-singleton] Listener notification error:', err)
      }
    })
  },

  // Single Global Connection Method
  connect() {
    // 1. Guard against duplicate sockets: If connected or currently connecting, DO NOT OPEN ANOTHER SOCKET!
    if (this.socket) {
      const rs = this.socket.readyState
      if (rs === WebSocket.CONNECTING || rs === WebSocket.OPEN) {
        return
      }
    }

    if (this.isConnecting) return
    this.isConnecting = true

    const targetPort = this.portAttempt
    const host = window.location.hostname || 'localhost'
    const url = `ws://${host}:${targetPort}/ws`

    console.log(`[ws-singleton] 🚀 Initializing SINGLE global WebSocket connection to ${url}...`)

    try {
      const ws = new WebSocket(url)
      this.socket = ws

      ws.onopen = () => {
        console.log(`[ws-singleton] ✅ Single WebSocket connected successfully on port ${targetPort}`)
        this.isConnecting = false
        this.activePort = targetPort
        this.state.isConnected = true
        this.state.activePort = targetPort
        this.state.connectionError = null
        this.notifyListeners()
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message && message.type) {
            this.handleMessage(message)
          }
        } catch (err) {
          console.error('[ws-singleton] Message parsing error:', err)
          this.state.connectionError = `Mesaj işleme hatası: ${err.message}`
          this.notifyListeners()
        }
      }

      ws.onclose = () => {
        console.log(`[ws-singleton] 🔌 Single WebSocket closed on port ${targetPort}`)
        this.isConnecting = false
        this.socket = null
        this.state.isConnected = false
        this.notifyListeners()

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
        }

        // Fallback port scanning if initial connection hasn't succeeded yet
        if (!this.state.isConnected && this.portAttempt < this.maxPort) {
          this.portAttempt += 1
          this.reconnectTimer = setTimeout(() => this.connect(), 400)
        } else {
          // Reconnect on established active port after a delay
          this.reconnectTimer = setTimeout(() => {
            this.portAttempt = this.activePort || 8000
            this.connect()
          }, 3000)
        }
      }

      ws.onerror = (err) => {
        console.error(`[ws-singleton] WebSocket error on port ${targetPort}`)
        this.isConnecting = false
        this.state.connectionError = `Soket bağlantı hatası (Port ${targetPort})`
        this.notifyListeners()
      }
    } catch (err) {
      this.isConnecting = false
      this.socket = null
      this.state.connectionError = `Soket oluşturma hatası: ${err.message}`
      this.notifyListeners()
    }
  },

  handleMessage(msg) {
    try {
      const { type, payload } = msg

      if (type === 'INITIAL_STATE' && payload) {
        this.processInitialState(payload)
      } else if (type === 'RESOURCE_EVENT' && payload) {
        this.processResourceEvent(payload)
      }
    } catch (err) {
      console.error('[ws-singleton] Failed in handleMessage:', err)
    }
  },

  processInitialState(payload) {
    const { nodes = [], pods = [] } = payload
    const newShips = {}

    nodes.forEach((node) => {
      if (!node || !node.name) return
      newShips[node.name] = {
        id: node.name,
        name: `${node.name} (Worker Node)`,
        status: node.status || 'Ready',
        pods: []
      }
    })

    pods.forEach((pod) => {
      if (!pod || !pod.name) return
      const nodeName = pod.metaphor?.node_name || Object.keys(newShips)[0] || 'unassigned'
      if (!newShips[nodeName]) {
        newShips[nodeName] = {
          id: nodeName,
          name: `${nodeName} (Worker Node)`,
          status: 'Ready',
          pods: []
        }
      }

      newShips[nodeName].pods.push({
        id: `${pod.namespace || 'default'}/${pod.name}`,
        name: `📦 ${pod.name}`,
        namespace: pod.namespace || 'default',
        status: pod.status || 'Running',
        color: this.getPodColor(pod.status)
      })
    })

    this.state.shipsMap = newShips
    this.notifyListeners()
  },

  processResourceEvent(payload) {
    const { action, kind, name, namespace, status, metaphor } = payload
    const targetNode = metaphor?.node_name || 'unassigned'

    if (name) {
      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        action: action || 'UPDATE',
        kind: kind || 'Event',
        name,
        namespace: namespace || 'default',
        status: status || 'Normal'
      }
      this.state.eventsLog = [newEvent, ...this.state.eventsLog.slice(0, 49)]
    }

    if (kind === 'Deployment' && name) {
      const filtered = this.state.deploymentsList.filter((d) => d.name !== name)
      if (action !== 'DELETE') {
        filtered.push({ name, namespace: namespace || 'default', replicas: status || '1/1 Ready', status: 'Healthy' })
      }
      this.state.deploymentsList = filtered
    } else if (kind === 'Node' && name) {
      const next = { ...this.state.shipsMap }
      if (action === 'DELETE') {
        delete next[name]
      } else {
        next[name] = {
          id: name,
          name: `${name} (Worker Node)`,
          status: status || 'Ready',
          pods: next[name]?.pods || []
        }
      }
      this.state.shipsMap = next
    } else if (kind === 'Pod' && name) {
      const next = { ...this.state.shipsMap }
      if (!next[targetNode]) {
        next[targetNode] = {
          id: targetNode,
          name: `${targetNode} (Worker Node)`,
          status: 'Ready',
          pods: []
        }
      }

      const podId = `${namespace || 'default'}/${name}`
      const existingPods = next[targetNode].pods.filter((p) => p.id !== podId)

      if (action !== 'DELETE') {
        existingPods.push({
          id: podId,
          name: `📦 ${name}`,
          namespace: namespace || 'default',
          status: status || 'Running',
          color: this.getPodColor(status)
        })
      }

      next[targetNode] = {
        ...next[targetNode],
        pods: existingPods
      }

      this.state.shipsMap = next
    }

    this.notifyListeners()
  },

  getPodColor(status) {
    switch (status) {
      case 'Running':
      case 'SAFE':
      case 'Completed':
        return '#10b981'
      case 'Pending':
      case 'ContainerCreating':
      case 'WARNING':
        return '#f59e0b'
      case 'Failed':
      case 'Error':
      case 'CrashLoopBackOff':
      case 'OOMKilled':
      case 'CRITICAL':
        return '#ef4444'
      default:
        return '#0284c7'
    }
  }
}

// -----------------------------------------------------------------------------
// REACT CONTEXT & PROVIDER
// -----------------------------------------------------------------------------
const ShipyardClusterContext = createContext(null)

export function ShipyardClusterProvider({ children }) {
  const [clusterState, setClusterState] = useState({ ...singletonManager.state })

  useEffect(() => {
    // 1. Subscribe this Context Provider to updates from singletonManager
    const updateListener = (newState) => {
      setClusterState(newState)
    }

    singletonManager.listeners.add(updateListener)

    // 2. Initialize SINGLE global WebSocket connection
    singletonManager.connect()

    return () => {
      singletonManager.listeners.delete(updateListener)
    }
  }, [])

  const shipsList = Object.values(clusterState.shipsMap).map((ship, idx) => ({
    ...ship,
    position: ship.position || [idx * 14 - 10, 0, 0]
  }))

  const totalPallets = Object.values(clusterState.shipsMap).reduce((acc, ship) => acc + (ship.pods ? ship.pods.length : 0), 0)

  const value = {
    isConnected: clusterState.isConnected,
    activePort: clusterState.activePort,
    connectionError: clusterState.connectionError,
    ships: shipsList,
    totalShips: shipsList.length,
    totalPallets,
    eventsLog: clusterState.eventsLog,
    deployments: clusterState.deploymentsList
  }

  return (
    <ShipyardClusterContext.Provider value={value}>
      {children}
    </ShipyardClusterContext.Provider>
  )
}

// Custom Hook to consume the single shared WebSocket state
export function useClusterConnection() {
  const context = useContext(ShipyardClusterContext)
  if (!context) {
    throw new Error('useClusterConnection must be used within a ShipyardClusterProvider')
  }
  return context
}
