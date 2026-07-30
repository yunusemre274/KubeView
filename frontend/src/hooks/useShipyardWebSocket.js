import { useState, useEffect, useRef, useCallback } from 'react'

export function useShipyardWebSocket(initialPort = 8000) {
  const [isConnected, setIsConnected] = useState(false)
  const [activePort, setActivePort] = useState(initialPort)
  const [shipsMap, setShipsMap] = useState({})
  const [deploymentsList, setDeploymentsList] = useState([])
  const [eventsLog, setEventsLog] = useState([])
  const wsRef = useRef(null)
  const portAttemptRef = useRef(initialPort)
  const maxPortRef = useRef(initialPort + 5)

  const connect = useCallback(() => {
    const targetPort = portAttemptRef.current
    const url = `ws://${window.location.hostname || 'localhost'}:${targetPort}/ws`

    console.log(`[ws-hook] Trying WebSocket connection on port ${targetPort}...`)
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      console.log(`[ws-hook] ✅ Connected successfully on port ${targetPort}`)
      setIsConnected(true)
      setActivePort(targetPort)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('[ws-hook] Error parsing WS message:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      // If we haven't connected yet, try next port in range
      if (portAttemptRef.current < maxPortRef.current && !isConnected) {
        portAttemptRef.current += 1
        console.log(`[ws-hook] ⚠️ Port ${targetPort} unreachable. Trying fallback port ${portAttemptRef.current}...`)
        setTimeout(connect, 500)
      } else {
        // Connected before, reconnect on same active port after delay
        setTimeout(() => {
          portAttemptRef.current = activePort
          connect()
        }, 3000)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [activePort, isConnected])

  const handleMessage = (msg) => {
    const { type, payload } = msg

    if (type === 'INITIAL_STATE') {
      processInitialState(payload)
    } else if (type === 'RESOURCE_EVENT') {
      processResourceEvent(payload)
    }
  }

  const processInitialState = (payload) => {
    const { nodes = [], pods = [] } = payload
    const newShips = {}

    nodes.forEach((node) => {
      newShips[node.name] = {
        id: node.name,
        name: `${node.name} (Worker Node)`,
        status: node.status,
        pods: []
      }
    })

    pods.forEach((pod) => {
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
        id: `${pod.namespace}/${pod.name}`,
        name: `📦 ${pod.name}`,
        namespace: pod.namespace,
        status: pod.status,
        color: getPodColor(pod.status)
      })
    })

    setShipsMap(newShips)
  }

  const processResourceEvent = (payload) => {
    const { action, kind, name, namespace, status, metaphor } = payload
    const targetNode = metaphor?.node_name || 'unassigned'

    setEventsLog((prev) => [
      {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        action,
        kind,
        name,
        namespace,
        status
      },
      ...prev.slice(0, 19)
    ])

    if (kind === 'Deployment') {
      setDeploymentsList((prev) => {
        const filtered = prev.filter((d) => d.name !== name)
        if (action !== 'DELETE') {
          filtered.push({ name, namespace, replicas: status, status: 'Healthy' })
        }
        return filtered
      })
    } else if (kind === 'Node') {
      setShipsMap((prev) => {
        const next = { ...prev }
        if (action === 'DELETE') {
          delete next[name]
        } else {
          next[name] = {
            id: name,
            name: `${name} (Worker Node)`,
            status,
            pods: next[name]?.pods || []
          }
        }
        return next
      })
    } else if (kind === 'Pod') {
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

        const podId = `${namespace}/${name}`
        const existingPods = next[targetNode].pods.filter((p) => p.id !== podId)

        if (action !== 'DELETE') {
          existingPods.push({
            id: podId,
            name: `📦 ${name}`,
            namespace,
            status,
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
        return '#22c55e'
      case 'Pending':
      case 'ContainerCreating':
        return '#eab308'
      case 'Failed':
      case 'Error':
        return '#ef4444'
      default:
        return '#3b82f6'
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const shipsList = Object.values(shipsMap).map((ship, idx) => ({
    ...ship,
    position: [idx * 10, 0, 0]
  }))

  const totalPallets = Object.values(shipsMap).reduce((acc, ship) => acc + ship.pods.length, 0)

  return {
    isConnected,
    activePort,
    ships: shipsList,
    totalShips: shipsList.length,
    totalPallets,
    eventsLog,
    deployments: deploymentsList
  }
}
