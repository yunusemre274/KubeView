import React, { useState } from 'react'
import { ShieldCheck, Cpu, Server, Activity, X, ArrowLeft, Layers, CheckCircle2, Radio, HardDrive } from 'lucide-react'

export default function MasterDashboardOverlay({ onClose, activeShips = [], deployments = [] }) {
  const [activeTab, setActiveTab] = useState('OVERVIEW')
  const [selectedItem, setSelectedItem] = useState(null)

  const controlPlaneStatus = [
    { name: 'kube-apiserver', role: 'API Gateway', status: 'Healthy', latency: '2ms', version: 'v1.28.2' },
    { name: 'etcd (Seyir Defteri)', role: 'Cluster State DB', status: 'Healthy', latency: '4ms', version: 'v3.5.9' },
    { name: 'kube-scheduler (Vinç)', role: 'Pod Zamanlayıcı', status: 'Healthy', latency: '1ms', version: 'v1.28.2' },
    { name: 'kube-controller-manager', role: 'Yaşam Döngüsü', status: 'Healthy', latency: '3ms', version: 'v1.28.2' }
  ]

  const mockDeployments = deployments.length > 0 ? deployments : [
    { name: 'web-frontend-deploy', replicas: '2/2', namespace: 'default', image: 'nginx:alpine', strategy: 'RollingUpdate' },
    { name: 'api-backend-deploy', replicas: '1/1', namespace: 'default', image: 'tersane/backend:v1.0.0', strategy: 'RollingUpdate' },
    { name: 'redis-cache-set', replicas: '1/1', namespace: 'production', image: 'redis:7-alpine', strategy: 'Recreate' }
  ]

  const totalPodsCount = activeShips.reduce((acc, s) => acc + (s.pods?.length || 0), 0)

  return (
    <aside className="master-dashboard-drawer p-4 flex flex-col justify-between overflow-y-auto animate-fadeIn font-mono-tech text-xs">
      <div>
        {/* 1. TOP HEADER */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-500/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Server className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-industrial text-sm font-bold text-amber-400">🏢 CONTROL PLANE DASHBOARD</h3>
              <span className="text-[10px] text-sky-400">Kubernetes Master & Node Agents</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. TAB BUTTONS */}
        <div className="grid grid-cols-2 gap-1 mb-4">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`industrial-btn py-1 text-[11px] justify-center ${activeTab === 'OVERVIEW' ? 'industrial-btn-active' : ''}`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>📊 GENEL BAKIK</span>
          </button>

          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`industrial-btn py-1 text-[11px] justify-center ${activeTab === 'HEALTH' ? 'industrial-btn-active' : ''}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>⚡ NODE AJANLARI</span>
          </button>

          <button
            onClick={() => setActiveTab('DEPLOYMENTS')}
            className={`industrial-btn py-1 text-[11px] justify-center ${activeTab === 'DEPLOYMENTS' ? 'industrial-btn-active' : ''}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>📦 SEVKİYATLAR</span>
          </button>

          <button
            onClick={() => setActiveTab('LOAD')}
            className={`industrial-btn py-1 text-[11px] justify-center ${activeTab === 'LOAD' ? 'industrial-btn-active' : ''}`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>⚖️ YÜK DAĞILIMI</span>
          </button>
        </div>

        {/* 3. TAB CONTENTS */}
        <div className="space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="industrial-panel p-2.5 rounded-lg border-emerald-500/30">
                  <span className="text-[10px] text-slate-400 block">WORKER NODES</span>
                  <div className="text-base font-bold font-industrial text-emerald-400">{activeShips.length} Gemiler</div>
                  <span className="text-[9px] text-emerald-400 font-mono-tech">● All Ready</span>
                </div>

                <div className="industrial-panel p-2.5 rounded-lg border-sky-500/30">
                  <span className="text-[10px] text-slate-400 block">TOPLAM PODS</span>
                  <div className="text-base font-bold font-industrial text-sky-400">{totalPodsCount} Paletler</div>
                  <span className="text-[9px] text-sky-400 font-mono-tech">● Active</span>
                </div>
              </div>

              {/* CONTROL PLANE COMPONENTS */}
              <div className="industrial-panel p-3 rounded-lg space-y-2">
                <span className="text-amber-400 font-bold block text-[10px]">CONTROL PLANE SAĞLIĞI:</span>
                {controlPlaneStatus.map((cp) => (
                  <div key={cp.name} className="bg-slate-900/90 p-2 rounded border border-slate-800 flex items-center justify-between text-[11px]">
                    <div>
                      <strong className="text-sky-300 block">{cp.name}</strong>
                      <span className="text-[10px] text-slate-400">{cp.role}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {cp.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: NODE AGENTS (REGRESYON 2 FIX - KUBELET & SCHEDULER DETAILS) */}
          {activeTab === 'HEALTH' && (
            <div className="space-y-3">
              <div className="industrial-panel p-3 rounded-lg space-y-2">
                <span className="text-sky-400 font-bold block text-[10px]">📡 KUBELET & KUBE-PROXY NODE AJANLARI:</span>
                {activeShips.map((ship) => (
                  <div key={ship.id} className="bg-slate-900/90 p-2.5 rounded border border-slate-800 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <strong className="text-white">{ship.name}</strong>
                      <span className="text-emerald-400 text-[10px] font-bold">Ready</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Kubelet Status:</span>
                      <strong className="text-emerald-400">Active (Running)</strong>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Kube-Proxy Status:</span>
                      <strong className="text-emerald-400">Active (iptables)</strong>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Son Heartbeat:</span>
                      <span className="text-sky-300">1.2s ago</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="industrial-panel p-3 rounded-lg space-y-1.5 text-[11px]">
                <span className="text-amber-400 font-bold block text-[10px]">🏗️ KUBE-SCHEDULER STATUS:</span>
                <div>Scheduler Engine: <strong className="text-slate-200">default-scheduler</strong></div>
                <div>Zamanlama Skoru: <strong className="text-emerald-400">94/100 (LeastRequestedPriority)</strong></div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPLOYMENTS */}
          {activeTab === 'DEPLOYMENTS' && (
            <div className="space-y-2">
              {mockDeployments.map((d) => (
                <div
                  key={d.name}
                  onClick={() => setSelectedItem(d)}
                  className="industrial-card p-2.5 rounded-lg border hover:border-purple-500 cursor-pointer space-y-1"
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <strong className="text-purple-300">{d.name}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                      {d.replicas}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Namespace: {d.namespace}</div>
                  <div className="text-[10px] text-slate-400">Image: {d.image}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LOAD BALANCING */}
          {activeTab === 'LOAD' && (
            <div className="space-y-3">
              {activeShips.map((s) => {
                const cpuUsage = parseInt(s.metrics?.cpu_usage || '320')
                const cpuCap = parseInt(s.metrics?.cpu_capacity || '4000')
                const pct = Math.round((cpuUsage / cpuCap) * 100)

                return (
                  <div key={s.id} className="industrial-panel p-2.5 rounded-lg space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-sky-300 font-bold">{s.name}</span>
                      <span className="text-emerald-400 font-bold">%{pct}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full" style={{ width: `${Math.max(pct, 15)}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center">
        Tersane v2.0.0 Control Panel
      </div>
    </aside>
  )
}
