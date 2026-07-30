import React, { useState } from 'react'
import { ShieldCheck, Cpu, HardDrive, Server, Activity, Radio, X, ArrowRight, ArrowLeft, Layers, CheckCircle2, AlertTriangle, RefreshCw, Box } from 'lucide-react'

export default function MasterDashboardOverlay({ onClose, activeShips = [], deployments = [] }) {
  const [activeTab, setActiveTab] = useState('OVERVIEW')
  const [selectedItem, setSelectedItem] = useState(null)

  const controlPlaneStatus = [
    { name: 'kube-apiserver', role: 'Küme API Kapısı', status: 'Healthy', latency: '2ms', version: 'v1.28.2' },
    { name: 'etcd (Kaptan Seyir Defteri)', role: 'Ana Veritabanı & State', status: 'Healthy', latency: '4ms', version: 'v3.5.9' },
    { name: 'kube-scheduler (Liman Vinci)', role: 'Pod Zamanlayıcı', status: 'Healthy', latency: '1ms', version: 'v1.28.2' },
    { name: 'kube-controller-manager', role: 'Küme Yaşam Döngüsü', status: 'Healthy', latency: '3ms', version: 'v1.28.2' }
  ]

  const mockDeployments = deployments.length > 0 ? deployments : [
    { name: 'web-frontend-deploy', replicas: '2/2', namespace: 'default', image: 'nginx:alpine', strategy: 'RollingUpdate' },
    { name: 'api-backend-deploy', replicas: '1/1', namespace: 'default', image: 'tersane/backend:v1.0.0', strategy: 'RollingUpdate' },
    { name: 'redis-cache-set', replicas: '1/1', namespace: 'production', image: 'redis:7-alpine', strategy: 'Recreate' }
  ]

  const totalPodsCount = activeShips.reduce((acc, s) => acc + (s.pods?.length || 0), 0)

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-6 animate-fadeIn text-slate-100">
      
      {/* 1. TOP HEADER & EXIT BUTTON */}
      <header className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Server className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-industrial text-xl font-bold text-amber-400 tracking-wide flex items-center gap-2">
              <span>🏢 MASTER NODE KONTROL KULESİ DASHBOARD</span>
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 font-mono-tech border border-emerald-500/40">ONLINE</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono-tech">Kubernetes Control Plane Canlı İzleme & Yönetim Konsolu</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="industrial-btn industrial-btn-active text-sm px-4 py-2 flex items-center gap-2 shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>🔙 DIŞARI ÇIK (KUŞBAKIŞI GÖRÜNÜME DÖN)</span>
        </button>
      </header>

      {/* 2. DASHBOARD NAVIGATION TABS */}
      <nav className="flex items-center gap-2 mb-6 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`industrial-btn ${activeTab === 'OVERVIEW' ? 'industrial-btn-active' : ''}`}
        >
          <Activity className="w-4 h-4" />
          <span>📊 GENEL BAKIK (OVERVIEW)</span>
        </button>

        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`industrial-btn ${activeTab === 'HEALTH' ? 'industrial-btn-active' : ''}`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>⚡ CONTROL PLANE SAĞLIĞI</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPLOYMENTS')}
          className={`industrial-btn ${activeTab === 'DEPLOYMENTS' ? 'industrial-btn-active' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>📦 SEVKİYATLAR & DEPLOYMENTS</span>
        </button>

        <button
          onClick={() => setActiveTab('LOAD_BALANCING')}
          className={`industrial-btn ${activeTab === 'LOAD_BALANCING' ? 'industrial-btn-active' : ''}`}
        >
          <Cpu className="w-4 h-4" />
          <span>⚖️ LOAD BALANCING (NODE YÜKÜ)</span>
        </button>
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* STAT CARDS */}
            <div className="grid grid-cols-4 gap-4">
              <div className="industrial-panel p-4 rounded-xl border-emerald-500/30">
                <span className="text-xs text-slate-400 font-mono-tech block">TOPLAM WORKER NODES (GEMİLER)</span>
                <div className="text-2xl font-bold font-industrial text-emerald-400 mt-1">{activeShips.length} Nodes</div>
                <span className="text-[10px] text-emerald-500/80 font-mono-tech mt-1 block">● %100 Ready Durumda</span>
              </div>

              <div className="industrial-panel p-4 rounded-xl border-sky-500/30">
                <span className="text-xs text-slate-400 font-mono-tech block">TOPLAM PODS (PALETLER)</span>
                <div className="text-2xl font-bold font-industrial text-sky-400 mt-1">{totalPodsCount} Pods</div>
                <span className="text-[10px] text-sky-500/80 font-mono-tech mt-1 block">● All Containers Active</span>
              </div>

              <div className="industrial-panel p-4 rounded-xl border-purple-500/30">
                <span className="text-xs text-slate-400 font-mono-tech block">AKTİF DEPLOYMENTS</span>
                <div className="text-2xl font-bold font-industrial text-purple-400 mt-1">{mockDeployments.length} Service Sets</div>
                <span className="text-[10px] text-purple-500/80 font-mono-tech mt-1 block">● RollingUpdate Active</span>
              </div>

              <div className="industrial-panel p-4 rounded-xl border-amber-500/30">
                <span className="text-xs text-slate-400 font-mono-tech block">PENDING PODS QUEUE</span>
                <div className="text-2xl font-bold font-industrial text-amber-400 mt-1">0 Pending</div>
                <span className="text-[10px] text-emerald-400 font-mono-tech mt-1 block">● Scheduler Kuyruğu Temiz</span>
              </div>
            </div>

            {/* CONTROL PLANE HEALTH SUMMARY */}
            <div className="industrial-panel p-5 rounded-xl">
              <h3 className="font-industrial text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span>CONTROL PLANE CANLI BİLEŞEN SAĞLIĞI</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {controlPlaneStatus.map((cp) => (
                  <div key={cp.name} className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-sm font-mono-tech text-sky-300 block">{cp.name}</strong>
                      <span className="text-xs text-slate-400">{cp.role} ({cp.version})</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded text-xs bg-emerald-500/20 text-emerald-400 font-mono-tech border border-emerald-500/40 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{cp.status}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1 font-mono-tech">Gecikme: {cp.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HEALTH */}
        {activeTab === 'HEALTH' && (
          <div className="space-y-4">
            <div className="industrial-panel p-5 rounded-xl space-y-4">
              <h3 className="font-industrial text-base font-bold text-sky-400 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span>DETAYLI SAĞLIK VE KONTROL KULESİ SEYİR DEFTERİ</span>
              </h3>
              <div className="space-y-3 font-mono-tech text-xs">
                <div className="bg-slate-900/90 p-3 rounded border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-amber-400 font-bold block">etcd Consensus Quorum:</span>
                    <span className="text-slate-400">3/3 Master Repositories in Sync (Raft Leader active)</span>
                  </div>
                  <span className="text-emerald-400 font-bold">VERIFIED</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-sky-400 font-bold block">kube-apiserver Auth & Authorization:</span>
                    <span className="text-slate-400">RBAC Mode: ReadOnly (System Admin Token active)</span>
                  </div>
                  <span className="text-emerald-400 font-bold">SECURE</span>
                </div>

                <div className="bg-slate-900/90 p-3 rounded border border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="text-purple-400 font-bold block">kube-scheduler Scoring Function:</span>
                    <span className="text-slate-400">NodeResourcesLeastRequested & NodeAffinity active</span>
                  </div>
                  <span className="text-emerald-400 font-bold">OPTIMAL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPLOYMENTS */}
        {activeTab === 'DEPLOYMENTS' && (
          <div className="space-y-4">
            <div className="industrial-panel p-5 rounded-xl space-y-4">
              <h3 className="font-industrial text-base font-bold text-purple-400 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <span>SEVKİYAT SİPARİŞLERİ (DEPLOYMENTS & PODS)</span>
              </h3>
              <div className="space-y-3 font-mono-tech text-xs">
                {mockDeployments.map((d) => (
                  <div
                    key={d.name}
                    onClick={() => setSelectedItem(d)}
                    className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 hover:border-purple-500 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <strong className="text-sm text-purple-300 block">{d.name}</strong>
                      <span className="text-slate-400 text-[11px]">Namespace: {d.namespace} | Image: {d.image}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                        {d.replicas} Replicas
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">{d.strategy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedItem && (
              <div className="industrial-panel p-4 rounded-xl border-amber-500/40 font-mono-tech text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
                  <span className="text-amber-400 font-bold">DETAY: {selectedItem.name}</span>
                  <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div>İmaj: <strong className="text-white">{selectedItem.image}</strong></div>
                <div>Strateji: <strong className="text-sky-300">{selectedItem.strategy}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LOAD BALANCING */}
        {activeTab === 'LOAD_BALANCING' && (
          <div className="space-y-4">
            <div className="industrial-panel p-5 rounded-xl space-y-4">
              <h3 className="font-industrial text-base font-bold text-sky-400 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                <span>WORKER NODES (GEMİLER) YÜK DAĞILIM KARŞILAŞTIRMASI</span>
              </h3>

              {activeShips.map((s) => {
                const cpuUsage = parseInt(s.metrics?.cpu_usage || '300')
                const cpuCap = parseInt(s.metrics?.cpu_capacity || '4000')
                const pct = Math.round((cpuUsage / cpuCap) * 100)

                return (
                  <div key={s.id} className="bg-slate-900/90 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-mono-tech">
                      <span className="text-sky-300 font-bold">{s.name} ({s.ip || '192.168.1.101'})</span>
                      <span className="text-emerald-400 font-bold">{s.metrics?.cpu_usage || '320m'} / {s.metrics?.cpu_capacity || '4000m'} (%{pct})</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full transition-all duration-500" style={{ width: `${Math.max(pct, 15)}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono-tech">
        <span>Tersane v1.4.0 Control Plane Telemetry</span>
        <span className="text-emerald-400 font-bold">● Live Sync Active</span>
      </footer>
    </div>
  )
}
