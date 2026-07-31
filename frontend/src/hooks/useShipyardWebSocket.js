import { useState, useEffect, useRef, useCallback } from 'react'

export function useShipyardWebSocket(initialPort = 8000) {
  const [isConnected, setIsConnected] = useState(false)
  const [activePort, setActivePort] = useState(initialPort)
  const [connectionError, setConnectionError] = useState(null)
  const [shipsMap, setShipsMap] = useState({})
  const [deploymentsList, setDeploymentsList] = useState([])
  const [eventsLog, setEventsLog] = useState([])

  const wsRef = useRef(null)
  const activePortRef = useRef(initialPort)
  const portAttemptRef = useRef(initialPort)
  const maxPortRef = useRef(initialPort + 5)
  const isConnectingRef = useRef(false)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    // If a connection is already OPEN or CONNECTING, do not open another socket
    if (wsRef.current) {
      const state = wsRef.current.readyState
      if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) {
        return
      }
    }

    if (isConnectingRef.current) return
    isConnectingRef.current = true

    const targetPort = portAttemptRef.current
    const host = window.location.hostname || 'localhost'
    const url = `ws://${host}:${targetPort}/ws`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        isConnectingRef.current = false
        setIsConnected(true)
        setConnectionError(null)
        activePortRef.current = targetPort
        setActivePort(targetPort)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message && message.type) {
            handleMessage(message)
          }
        } catch (err) {
          console.error('[ws-hook] Message processing error:', err)
          setConnectionError(`Mesaj işleme hatası: ${err.message}`)
        }
      }

      ws.onclose = (evt) => {
        isConnectingRef.current = false
        setIsConnected(false)

        // Clear existing reconnect timers
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }

        // If we haven't successfully connected on this port, try next port in fallback range
        if (portAttemptRef.current < maxPortRef.current && !activePortRef.current) {
          portAttemptRef.current += 1
          reconnectTimeoutRef.current = setTimeout(connect, 300)
        } else {
          // Reconnect on established active port after a short delay
          reconnectTimeoutRef.current = setTimeout(() => {
            portAttemptRef.current = activePortRef.current || initialPort
            connect()
          }, 3000)
        }
      }

      ws.onerror = (err) => {
        isConnectingRef.current = false
        setConnectionError(`WebSocket bağlantı hatası (Port ${targetPort})`)
      }
    } catch (err) {
      isConnectingRef.current = false
      setConnectionError(`Soket oluşturma hatası: ${err.message}`)
    }
  }, [initialPort])

  const handleMessage = (msg) => {
    try {
      const { type, payload } = msg

      if (type === 'INITIAL_STATE' && payload) {
        processInitialState(payload)
      } else if (type === 'RESOURCE_EVENT' && payload) {
        processResourceEvent(payload)
      }
    } catch (err) {
      console.error('[ws-hook] Failed in handleMessage:', err)
    }
  }

  const processInitialState = (payload) => {
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
        color: getPodColor(pod.status)
      })
    })

    setShipsMap(newShips)
  }

  const processResourceEvent = (payload) => {
    const { action, kind, name, namespace, status, metaphor } = payload
    const targetNode = metaphor?.node_name || 'unassigned'

    if (name) {
      setEventsLog((prev) => [
        {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString('tr-TR'),
          action: action || 'UPDATE',
          kind: kind || 'Event',
          name,
          namespace: namespace || 'default',
          status: status || 'Normal'
        },
        ...prev.slice(0, 49)
      ])
    }

    if (kind === 'Deployment' && name) {
      setDeploymentsList((prev) => {
        const filtered = prev.filter((d) => d.name !== name)
        if (action !== 'DELETE') {
          filtered.push({ name, namespace: namespace || 'default', replicas: status || '1/1 Ready', status: 'Healthy' })
        }
        return filtered
      })
    } else if (kind === 'Node' && name) {
      setShipsMap((prev) => {
        const next = { ...prev }
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
        return next
      })
    } else if (kind === 'Pod' && name) {
      setShipsMap((prev) => {
        const next = { ...prev }
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
            color: getPodColor(status)
          })
        }

        next[targetNode] = {
          ...next[targetNode],
          pods: existingPods
        }

        return next
      })
    }
  }

  const getPodColor = (status) => {
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

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        // Close socket on component unmount
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const shipsList = Object.values(shipsMap).map((ship, idx) => ({
    ...ship,
    position: ship.position || [idx * 14 - 10, 0, 0]
  }))

  const totalPallets = Object.values(shipsMap).reduce((acc, ship) => acc + (ship.pods ? ship.pods.length : 0), 0)

  return {
    isConnected,
    activePort,
    connectionError,
    ships: shipsList,
    totalShips: shipsList.length,
    totalPallets,
    eventsLog,
    deployments: deploymentsList
  }
}
