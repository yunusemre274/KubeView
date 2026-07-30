import React, { useState } from 'react'
import { ScrollText, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'

export default function DeploymentPanel({ deployments = [] }) {
  const [isOpen, setIsOpen] = useState(true)

  const defaultDeployments = [
    { name: 'web-frontend-deploy', namespace: 'default', replicas: '3/3', status: 'Healthy' },
    { name: 'api-backend-deploy', namespace: 'default', replicas: '2/2', status: 'Healthy' },
    { name: 'redis-cache-set', namespace: 'production', replicas: '1/1', status: 'Healthy' }
  ]

  const activeList = deployments.length > 0 ? deployments : defaultDeployments

  return (
    <aside className="fixed top-20 right-4 z-20 pointer-events-auto">
      <div className="flex items-start gap-2">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="industrial-btn py-2 px-2 rounded-xl text-amber-400 border-amber-500/40 shadow-lg"
          title="Sefer Siparişleri Paneli"
        >
          {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {isOpen && (
          <div className="w-80 industrial-panel p-4 rounded-xl border-amber-500/30 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-700/80">
              <ScrollText className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-industrial text-base text-amber-400 font-bold leading-none">
                  📜 SEFER SİPARİŞLERİ (DEPLOYMENTS)
                </h2>
                <p className="text-[10px] text-slate-400 font-mono-tech mt-0.5">
                  Hedeflenen Kargo ve Palet Talimatnamesi
                </p>
              </div>
            </div>

            {/* List of Discrete Cards */}
            <div className="space-y-2.5 max-h-[70vh] overflow-y-auto pr-1">
              {activeList.map((dep, idx) => (
                <div key={dep.name || idx} className="industrial-card border-slate-700/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono-tech font-bold text-sky-300 text-xs truncate max-w-[170px]">
                      {dep.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono-tech px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      {dep.status || 'Healthy'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-tech mt-2 pt-2 border-t border-slate-800">
                    <span>Ambar: <strong className="text-slate-200">{dep.namespace}</strong></span>
                    <span>Sipariş Palet: <strong className="text-amber-400">{dep.replicas}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
