import React, { useState } from 'react'
import { ScrollText, ChevronDown, ChevronUp, Layers, ArrowUpRight } from 'lucide-react'

export default function DeploymentPanel({ deployments = [] }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const defaultDeployments = [
    { name: 'web-frontend-deploy', namespace: 'default', replicas: '3/3', status: 'Healthy' },
    { name: 'api-backend-deploy', namespace: 'default', replicas: '2/2', status: 'Healthy' },
    { name: 'redis-cache-set', namespace: 'cache', replicas: '1/1', status: 'Healthy' }
  ]

  const activeDeployments = deployments.length > 0 ? deployments : defaultDeployments

  return (
    <div className="fixed top-24 left-4 z-10 w-72 glass-panel rounded-xl text-slate-100 border border-slate-700/60 shadow-xl overflow-hidden animate-fadeIn">
      {/* Panel Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3.5 bg-slate-900/60 border-b border-slate-800 hover:bg-slate-800/60 transition-all"
      >
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold tracking-wider text-amber-300">📜 SEFER SİPARİŞLERİ</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
            {activeDeployments.length}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Deployment List */}
      {isExpanded && (
        <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
          {activeDeployments.map((dep, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between hover:border-amber-500/40 transition-all group"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  {dep.name}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>Ambar: {dep.namespace}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {dep.replicas}
                </span>
                <span className="text-[9px] text-slate-400">Replicas</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
