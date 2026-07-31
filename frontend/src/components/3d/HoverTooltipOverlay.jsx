import React from 'react'
import { Info } from 'lucide-react'

export default function HoverTooltipOverlay({ hoveredObject }) {
  if (!hoveredObject) return null

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-slate-900/95 border border-sky-500/50 shadow-2xl backdrop-blur-md px-4 py-2.5 rounded-lg max-w-md flex items-start gap-3 text-left">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="text-xs font-bold text-sky-300 font-industrial tracking-wide">{hoveredObject.title}</h4>
          <p className="text-[11px] text-slate-300 leading-tight mt-0.5">{hoveredObject.description}</p>
        </div>
      </div>
    </div>
  )
}
