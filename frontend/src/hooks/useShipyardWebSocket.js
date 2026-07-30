import { useState, useEffect, useRef, useCallback } from 'react'

export function useShipyardWebSocket(url = 'ws://localhost:8000/ws') {
  const [isConnected, setIsConnected] = useState(false)
  const [shipsMap, setShipsMap] = useState({})
  const [eventsLog, setEventsLog] = useState([])
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    try {
      console.log(`[ws-hook] Connecting to WebSocket: ${url}`)
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[ws-hook] WebSocket connected successfully.')
        setIsConnected(true)
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
        console.log('[ws-hook] WebSocket disconnected. Reconnecting in 3 seconds...')
        setIsConnected(false)
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      ws.onerror = (err) => {
        console.error('[ws-hook] WebSocket error:', err)
        ws.close()
      }
    } catch (err) {
      console.error('[ws-hook] Connection exception:', err)
    }
  }, [url])

  const handleMessage = (msg) => {
    const { type, payload } = msg

    if (type === 'INITIAL_STATE') {
      console.log('[ws-hook] Received INITIAL_STATE payload:', payload)
      processInitialState(payload)
    } else if (type === 'RESOURCE_EVENT') {
      console.log('[ws-hook] Received RESOURCE_EVENT:', payload)
      processResourceEvent(payload)
    }
  }

  const processInitialState = (payload) => {
    const { nodes = [], pods = [] } = payload
    const newShips = {}

    // Initialize Ships from Nodes
    nodes.forEach((node) => {
      newShips[node.name] = {
        id: node.name,
        name: `${node.name} (Worker Node)`,
        status: node.status,
        pods: []
      }
    })

    // Assign Pods to Ships
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
      ...prev.slice(0, 19) // Keep last 20 events
    ])

    if (kind === 'Node') {
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
        // Ensure ship exists
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
        return '#22c55e' // Green
      case 'Pending':
      case 'ContainerCreating':
        return '#eab308' // Yellow
      case 'Failed':
      case 'Error':
        return '#ef4444' // Red
      default:
        return '#3b82f6' // Blue
    }
  }

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
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
    ships: shipsList,
    totalShips: shipsList.length,
    totalPallets,
    eventsLog
  }
}
