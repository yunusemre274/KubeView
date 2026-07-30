import React from 'react'
import Navbar from './components/Navbar'
import ShipyardScene from './components/ShipyardScene'
import LegendModal from './components/LegendModal'
import EventStream from './components/EventStream'
import { useShipyardWebSocket } from './hooks/useShipyardWebSocket'

export default function App() {
  const { isConnected, ships, totalShips, totalPallets, eventsLog } = useShipyardWebSocket()

  return (
    <main className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <Navbar
        isConnected={isConnected}
        shipCount={totalShips}
        palletCount={totalPallets}
      />
      <ShipyardScene ships={ships} />
      <EventStream events={eventsLog} />
      <LegendModal />
    </main>
  )
}
