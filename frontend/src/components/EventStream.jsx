import React from 'react'
import { Radio, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export default function EventStream({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="fixed bottom-6 left-6 z-10 glass-panel px-4 py-2 rounded-xl text-xs text-slate-400 flex items-center gap-2">
        <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
        <span>📢 Liman Anonsları: Canlı event bekleniyor...</span>
      </div>
    )
  }

  const latestEvent = events[0]

  const getActionBadge = (action) => {
    switch (action) {
      case 'ADD':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">YÜKLENDİ (ADD)</span>
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold">GÜNCELLENDİ</span>
      case 'DELETE':
        return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">LİMANDAN AYRILDI (DEL)</span>
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">{action}</span>
    }
  }

  return (
    <div className="fixed bottom-6 left-6 z-10 max-w-md glass-panel p-3 rounded-xl shadow-xl text-slate-100 border border-sky-500/30 animate-slideUp">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
          <h4 className="text-xs font-bold tracking-wider text-sky-300">📢 CANLI LİMAN ANONSU</h4>
        </div>
        <span className="text-[10px] text-slate-400">{latestEvent.timestamp}</span>
      </div>

      <div className="flex items-center gap-3">
        {getActionBadge(latestEvent.action)}
        <div className="text-xs truncate">
          <span className="font-semibold text-white">{latestEvent.kind}: </span>
          <span className="text-slate-300">{latestEvent.namespace ? `${latestEvent.namespace}/` : ''}{latestEvent.name}</span>
          <span className="ml-2 text-slate-400 font-mono">[{latestEvent.status}]</span>
        </div>
      </div>
    </div>
  )
}
