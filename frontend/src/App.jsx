import React from 'react'
import ShipyardScene from './components/ShipyardScene'
import { useShipyardWebSocket } from './hooks/useShipyardWebSocket'

export default function App() {
  const { isConnected, ships, totalShips, totalPallets, eventsLog, deployments } = useShipyardWebSocket()

  return (
    <main className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <ShipyardScene
        ships={ships}
        totalShips={totalShips}
        totalPallets={totalPallets}
        isConnected={isConnected}
        deployments={deployments}
        eventsLog={eventsLog}
      />
    </main>
  )
}
