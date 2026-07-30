import React from 'react'
import { Anchor, ShieldCheck, Activity, Layers, Ship, Box } from 'lucide-react'

export default function Navbar({ isConnected = false, shipCount = 2, palletCount = 4 }) {
  return (
    <header className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-panel text-slate-100 shadow-2xl">
      {/* Brand Logo & Elevator Pitch */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-sky-500/20 border border-sky-400/30 rounded-lg text-sky-400">
          <Anchor className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide flex items-center gap-2 text-white">
            TERSANE <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">K8s 3D</span>
          </h1>
          <p className="text-xs text-slate-400">Kubernetes Canlı Liman ve Gemi Simülasyonu</p>
        </div>
      </div>

      {/* Live Cluster Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Ship className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-400">Gemiler (Nodes):</span>
          <span className="text-sm font-bold text-white">{shipCount}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Box className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Paletler (Pods):</span>
          <span className="text-sm font-bold text-white">{palletCount}</span>
        </div>

        {/* Read-Only RBAC Badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>RBAC: Read-Only (Safe)</span>
        </div>

        {/* WebSocket Connection Status */}
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="text-xs font-medium text-slate-300">
            {isConnected ? 'Canlı Akış (WS)' : 'Statik 3D Mod (Faz 3)'}
          </span>
        </div>
      </div>
    </header>
  )
}
