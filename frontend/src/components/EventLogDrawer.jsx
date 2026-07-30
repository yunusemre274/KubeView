import React, { useState } from 'react'
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, X, ExternalLink, Filter } from 'lucide-react'

export default function EventLogDrawer({ isOpen, onClose, events = [], onSelectEvent }) {
  const [filter, setFilter] = useState('ALL')

  const filteredEvents = events.filter((ev) => {
    if (filter === 'MUTATION') return ev.isUserTriggered
    if (filter === 'WARNING') return ev.type === 'Warning'
    return true
  })

  return (
    <aside className={`info-panel-drawer ${isOpen ? 'drawer-open' : 'drawer-closed'}`}>
      {isOpen && (
        <div className="p-4 h-full flex flex-col justify-between overflow-y-auto font-mono-tech text-xs">
          <div>
            {/* HEADER */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
              <h3 className="font-industrial text-base font-bold text-amber-400 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <span>📋 OLAY GÜNLÜĞÜ (RING BUFFER)</span>
              </h3>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FILTER BUTTONS */}
            <div className="flex items-center gap-1 mb-4 text-[10px]">
              <button
                onClick={() => setFilter('ALL')}
                className={`industrial-btn py-0.5 px-2 ${filter === 'ALL' ? 'industrial-btn-active' : ''}`}
              >
                <span>TÜMÜ ({events.length})</span>
              </button>
              <button
                onClick={() => setFilter('MUTATION')}
                className={`industrial-btn py-0.5 px-2 ${filter === 'MUTATION' ? 'industrial-btn-blue-active' : ''}`}
              >
                <span>👤 MÜDAHALELER</span>
              </button>
              <button
                onClick={() => setFilter('WARNING')}
                className={`industrial-btn py-0.5 px-2 ${filter === 'WARNING' ? 'bg-red-500/20 text-red-300 border-red-500/40' : ''}`}
              >
                <span>⚠️ UYARILAR</span>
              </button>
            </div>

            {/* LOG LIST */}
            <div className="space-y-2.5">
              {filteredEvents.length === 0 ? (
                <div className="text-slate-500 text-center py-8 text-xs">
                  Henüz bir olay kaydedilmedi.
                </div>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    onClick={() => onSelectEvent && onSelectEvent(ev)}
                    className="industrial-card p-3 rounded-lg border hover:border-amber-500 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">{ev.time || '13:42:10'}</span>
                      {ev.isUserTriggered ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Kullanıcı Tetikledi
                        </span>
                      ) : ev.type === 'Warning' ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                          Warning
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Normal
                        </span>
                      )}
                    </div>

                    <div className="text-slate-200 font-bold text-xs break-all">{ev.message}</div>
                    
                    {ev.targetObject && (
                      <div className="text-[10px] text-sky-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Hedef: {ev.targetObject}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
            Son 1 saatlik in-memory ring buffer aktif
          </div>
        </div>
      )}
    </aside>
  )
}
