import React, { useState } from 'react'
import { Activity, X, Clock, Zap, TrendingUp, Info } from 'lucide-react'

// 1. MINI SPARKLINE COMPONENT (Compact SVG for Object Cards)
export function MiniSparkline({ data = [], color = '#10b981', width = 100, height = 24 }) {
  if (!data || data.length < 2) {
    return (
      <div className="w-[100px] h-[24px] bg-slate-900/60 rounded border border-slate-800 flex items-center justify-center text-[8px] text-slate-500 font-mono">
        ⏳ Veri alınıyor...
      </div>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data, min + 1)
  const range = max - min || 1

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// 2. DETAILED INTERACTIVE TREND CHART MODAL (Detailed Axis, Hover Tooltip, Dual Line)
export function DetailedTrendChartModal({ isOpen, onClose, targetName = 'node-alpha', history = [] }) {
  const [hoverPoint, setHoverPoint] = useState(null)

  if (!isOpen) return null

  const accumulatedMins = Math.min(60, Math.max(1, Math.round(history.length * 0.5)))
  const isFullData = accumulatedMins >= 60

  const width = 360
  const height = 140

  const cpuData = history.map((h) => h.cpu || 25)
  const memData = history.map((h) => h.mem || 35)

  const buildPoints = (dataArr) => {
    if (dataArr.length < 2) return ''
    return dataArr
      .map((val, idx) => {
        const x = (idx / (dataArr.length - 1)) * width
        const y = height - (val / 100) * height
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const cpuPoints = buildPoints(cpuData)
  const memPoints = buildPoints(memData)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="industrial-panel w-full max-w-md p-4 rounded-xl border border-sky-500/40 bg-slate-900/95 shadow-2xl space-y-3 font-mono-tech text-[11px]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="font-industrial text-sm font-bold text-amber-400">
              📈 DETAYLI KAYNAK KULLANIM TRENDİ ({targetName})
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ACCUMULATION STATUS BADGE */}
        <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-[10px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" /> Tam Örneklem Süresi:
          </span>
          <span className={isFullData ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold animate-pulse'}>
            {isFullData ? '✅ 60dk / 60dk Dolu' : `⏳ Veri toplanıyor... (${accumulatedMins}dk/60dk)`}
          </span>
        </div>

        {/* CHART SVG AREA WITH Y-AXIS GRIDLINES */}
        <div className="relative bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-hidden">
          <div className="flex justify-between items-center mb-1 text-[9px] text-slate-400">
            <span className="text-emerald-400 font-bold">🟢 CPU (%)</span>
            <span className="text-purple-400 font-bold">🟣 RAM (%)</span>
            <span>Son 1 Saat</span>
          </div>

          <svg
            width="100%"
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const mouseX = e.clientX - rect.left
              const idx = Math.min(history.length - 1, Math.max(0, Math.floor((mouseX / rect.width) * history.length)))
              setHoverPoint(history[idx])
            }}
            onMouseLeave={() => setHoverPoint(null)}
          >
            {/* GRID LINES */}
            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />

            {/* Y-AXIS LABELS */}
            <text x="4" y={height * 0.25 - 2} fill="#64748b" fontSize="8">75%</text>
            <text x="4" y={height * 0.5 - 2} fill="#64748b" fontSize="8">50%</text>
            <text x="4" y={height * 0.75 - 2} fill="#64748b" fontSize="8">25%</text>

            {/* CPU & RAM POLYLINE PLOTS */}
            {cpuPoints && <polyline fill="none" stroke="#10b981" strokeWidth="2" points={cpuPoints} />}
            {memPoints && <polyline fill="none" stroke="#a855f7" strokeWidth="2" points={memPoints} />}
          </svg>

          {/* HOVER TOOLTIP */}
          {hoverPoint && (
            <div className="absolute top-2 right-2 bg-slate-900/95 p-2 rounded border border-sky-500/50 text-[9.5px] shadow-lg space-y-0.5 pointer-events-none">
              <div className="text-slate-400 text-[8.5px]">Saat: {hoverPoint.time}</div>
              <div className="text-emerald-400 font-bold">CPU: %{hoverPoint.cpu}</div>
              <div className="text-purple-400 font-bold">RAM: %{hoverPoint.mem}</div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-[9.5px] text-slate-400 pt-1 border-t border-slate-800">
          <span>Örnekleme: 30sn | Bellek-İçi Buffer (KISS)</span>
          <button onClick={onClose} className="industrial-btn text-[9px] py-0.5 px-3">
            KAPAT
          </button>
        </div>
      </div>
    </div>
  )
}

// 3. CLUSTER OVERVIEW TREND CHART (FOR MASTER DASHBOARD)
export function ClusterTrendChart({ history = [] }) {
  const width = 340
  const height = 90

  const cpuData = history.map((h) => h.clusterCpu || 28)
  const memData = history.map((h) => h.clusterMem || 38)

  const buildPoints = (dataArr) => {
    if (dataArr.length < 2) return ''
    return dataArr
      .map((val, idx) => {
        const x = (idx / (dataArr.length - 1)) * width
        const y = height - (val / 100) * height
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  const cpuPoints = buildPoints(cpuData)
  const memPoints = buildPoints(memData)

  return (
    <div className="industrial-panel p-3 rounded-lg space-y-1.5 border border-sky-500/30 bg-slate-900/90 font-mono-tech text-[10px]">
      <div className="flex justify-between items-center">
        <span className="text-sky-400 font-bold flex items-center gap-1 text-[10px]">
          <Activity className="w-3.5 h-3.5 text-sky-400" /> 📈 KÜME GENELİ ZAMAN İÇİNDEKİ TREND:
        </span>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-emerald-400 font-bold">🟢 CPU</span>
          <span className="text-purple-400 font-bold">🟣 RAM</span>
        </div>
      </div>

      <div className="bg-slate-950 p-2 rounded border border-slate-800">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#334155" strokeDasharray="3 3" strokeWidth="0.8" />
          {cpuPoints && <polyline fill="none" stroke="#10b981" strokeWidth="2" points={cpuPoints} />}
          {memPoints && <polyline fill="none" stroke="#a855f7" strokeWidth="2" points={memPoints} />}
        </svg>
      </div>

      <div className="flex justify-between text-[9px] text-slate-400">
        <span>Son 1 Saatlik Örneklem (120 nokta)</span>
        <span className="text-emerald-400">Aktif Yük: %28 CPU / %38 RAM</span>
      </div>
    </div>
  )
}
