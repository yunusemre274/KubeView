import React from 'react'
import { Anchor, ShieldCheck, Ship, Box, Filter } from 'lucide-react'

export default function Navbar({
  isConnected = false,
  shipCount = 2,
  palletCount = 4,
  selectedNamespace = '',
  onNamespaceChange
}) {
  return (
    <header className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-panel text-slate-100 shadow-2xl">
      {/* Brand Logo */}
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

      {/* Namespace / Compartment Selector */}
      <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 px-3 py-1.5 rounded-xl">
        <Filter className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-slate-400 hidden sm:inline">Ambar (Namespace):</span>
        <select
          value={selectedNamespace}
          onChange={(e) => onNamespaceChange && onNamespaceChange(e.target.value)}
          className="bg-transparent text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
        >
          <option value="" className="bg-slate-900 text-slate-100">🚪 Tüm Ambarlar (All Namespaces)</option>
          <option value="default" className="bg-slate-900 text-slate-100">default</option>
          <option value="kube-system" className="bg-slate-900 text-slate-100">kube-system</option>
          <option value="production" className="bg-slate-900 text-slate-100">production</option>
        </select>
      </div>

      {/* Live Cluster Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Ship className="w-4 h-4 text-sky-400" />
          <span className="text-xs text-slate-400">Gemiler:</span>
          <span className="text-sm font-bold text-white">{shipCount}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
          <Box className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Paletler:</span>
          <span className="text-sm font-bold text-white">{palletCount}</span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>RBAC Read-Only</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="text-xs font-medium text-slate-300 hidden md:inline">
            {isConnected ? 'Canlı Akış (WS)' : 'Demo Mod (Faz 7)'}
          </span>
        </div>
      </div>
    </header>
  )
}
