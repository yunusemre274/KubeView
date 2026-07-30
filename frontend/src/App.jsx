import React from 'react'
import ShipyardScene from './components/ShipyardScene'
import { useShipyardWebSocket } from './hooks/useShipyardWebSocket'

export default function App() {
  const { isConnected, ships, totalShips, totalPallets, eventsLog, deployments } = useShipyardWebSocket()

  return (
    <main className="w-full h-full h-screen flex-1 min-h-0 relative bg-slate-950 overflow-hidden flex flex-col">
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
