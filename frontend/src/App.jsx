import React from 'react'
import Navbar from './components/Navbar'
import ShipyardScene from './components/ShipyardScene'
import LegendModal from './components/LegendModal'

export default function App() {
  return (
    <main className="w-full h-screen relative bg-slate-950 overflow-hidden">
      <Navbar isConnected={false} shipCount={2} palletCount={4} />
      <ShipyardScene />
      <LegendModal />
    </main>
  )
}
