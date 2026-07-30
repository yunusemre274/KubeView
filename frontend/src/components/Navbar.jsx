import React from 'react'
import { Anchor, ShieldCheck, Ship, Box, Layers } from 'lucide-react'

export default function Navbar({
  selectedNamespace = 'all',
  onNamespaceChange,
  totalShips = 2,
  totalPallets = 4,
  namespaces = ['all', 'default', 'kube-system', 'production']
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 p-3 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto industrial-panel px-4 py-2.5 rounded-xl border-amber-500/30">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400">
            <Anchor className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-industrial text-xl font-bold text-amber-400 leading-none tracking-wider">
              TERSANE <span className="text-xs text-sky-400 font-mono-tech">v1.0.0-3d</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono-tech mt-0.5">
              Kubernetes 3D Shipyard Simulator
            </p>
          </div>
        </div>

        {/* Center: Styled Namespace Selector & Stat Badges */}
        <div className="flex items-center gap-4">
          {/* Namespace Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <Layers className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-industrial text-slate-400">AMBAR:</span>
            <select
              value={selectedNamespace}
              onChange={(e) => onNamespaceChange && onNamespaceChange(e.target.value)}
              className="industrial-select"
            >
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns === 'all' ? '🌐 Toptan Ambarlar (All Namespaces)' : `🚪 ${ns}`}
                </option>
              ))}
            </select>
          </div>

          {/* Ships Stat Badge Card */}
          <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <Ship className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-industrial text-slate-400">GEMİLER:</span>
            <span className="font-mono-tech font-bold text-sky-300 text-sm">{totalShips}</span>
          </div>

          {/* Pallets Stat Badge Card */}
          <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <Box className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-industrial text-slate-400">PALETLER:</span>
            <span className="font-mono-tech font-bold text-emerald-300 text-sm">{totalPallets}</span>
          </div>
        </div>

        {/* Right: RBAC Security Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-mono-tech">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-semibold">RBAC: READ-ONLY</span>
        </div>

      </div>
    </header>
  )
}
