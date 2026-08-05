import React, { useState } from 'react'
import { X, ShieldAlert, Cpu, Box, Radio, Zap, Anchor, Server, Activity, ArrowRight, Play, RefreshCw, FileText, Calendar, Clock, Shield, Key, Lock, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import { ClusterTrendChart } from './3d/MetricTrendCharts'

export default function MasterDashboardOverlay({ onClose, activeShips = [], onTriggerCronJob, metricsHistory = [], deployments = [] }) {
  const [activeTab, setActiveTab] = useState('OVERVIEW')

  const mockCronJobs = [
    { name: 'db-backup-cronjob', namespace: 'default', schedule: '*/5 * * * *', last_run: '3 dk önce (Succeeded)', next_run: '2 dk sonra' },
    { name: 'log-cleanup-cronjob', namespace: 'production', schedule: '0 0 * * *', last_run: '12 saat önce (Succeeded)', next_run: '12 saat sonra' }
  ]

  return (
    <div className="master-dashboard-overlay pt-12">
      <div className="industrial-panel h-full flex flex-col justify-between p-4 overflow-y-auto border-l border-slate-700 bg-slate-950/95 backdrop-blur-md">
        
        {/* HEADER STRIP */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Building2Icon className="w-5 h-5 text-amber-400" />
              <h2 className="font-industrial text-sm font-bold text-amber-400 tracking-wider">
                YÖNETİM BİNASI & CONTROL PLANE
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TAB STRIP */}
          <div className="flex border-b border-slate-800 my-3 text-[11px] font-industrial">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`flex-1 py-1.5 text-center border-b-2 font-bold transition ${activeTab === 'OVERVIEW' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              GENEL BAKIŞ
            </button>
            <button
              onClick={() => setActiveTab('NODES')}
              className={`flex-1 py-1.5 text-center border-b-2 font-bold transition ${activeTab === 'NODES' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              GEMİLER ({activeShips.length})
            </button>
            <button
              onClick={() => setActiveTab('DEPLOYMENTS')}
              className={`flex-1 py-1.5 text-center border-b-2 font-bold transition ${activeTab === 'DEPLOYMENTS' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              SEFERLER
            </button>
            <button
              onClick={() => setActiveTab('LOAD')}
              className={`flex-1 py-1.5 text-center border-b-2 font-bold transition ${activeTab === 'LOAD' ? 'border-amber-400 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              YÜK DAĞILIMI
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-3 font-mono-tech text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div className="industrial-card p-2.5 rounded-lg border">
                  <span className="text-slate-400 text-[10px] block">TOPLAM GEMİ (NODE):</span>
                  <strong className="text-amber-400 text-sm font-bold">{activeShips.length} Active</strong>
                </div>
                <div className="industrial-card p-2.5 rounded-lg border">
                  <span className="text-slate-400 text-[10px] block">TOPLAM PALET (POD):</span>
                  <strong className="text-emerald-400 text-sm font-bold">3 Running</strong>
                </div>
              </div>

              {/* CLUSTER OVERVIEW TREND CHART */}
              <ClusterTrendChart history={metricsHistory} />

              <div className="industrial-panel p-3 rounded-lg space-y-1 text-[11px]">
                <span className="text-sky-400 font-bold block text-[10px]">🏢 KONTROL KULESİ SAĞLIK BİLGİSİ:</span>
                <div className="flex justify-between"><span>kube-apiserver:</span><strong className="text-emerald-400">Healthy (v1.28.2)</strong></div>
                <div className="flex justify-between"><span>etcd cluster:</span><strong className="text-emerald-400">3/3 Sync (Quorum Active)</strong></div>
                <div className="flex justify-between"><span>kube-controller-mgr:</span><strong className="text-emerald-400">Leader Active</strong></div>
                <div className="flex justify-between"><span>kube-scheduler:</span><strong className="text-emerald-400">Leader Active</strong></div>
              </div>

              <div className="industrial-panel p-3 rounded-lg space-y-1 text-[11px]">
                <span className="text-purple-400 font-bold block text-[10px]">📦 DEPOLAMA VE YAPILANDIRMA:</span>
                <div className="flex justify-between"><span>Depolama (PVC/PV):</span><strong className="text-purple-300">1 PVC (10Gi Bound)</strong></div>
                <div className="flex justify-between"><span>Sevkiyat Föyü (ConfigMap):</span><strong className="text-amber-300">1 Active</strong></div>
                <div className="flex justify-between"><span>Kilitli Kasa (Secret):</span><strong className="text-sky-300">1 Encrypted</strong></div>
              </div>

              {/* RBAC VE GÜVENLİK ROZETLERİ PANELDİR */}
              <div className="industrial-panel p-3 rounded-lg space-y-2 border border-red-500/30 bg-slate-900/90">
                <span className="text-red-400 font-bold block text-[10px] flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-red-400 animate-pulse" /> 🛡️ RBAC VE GÜVENLİK ROZETLERİ:
                </span>
                
                <div className="grid grid-cols-2 gap-1.5 text-[9.5px] text-center">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[8.5px]">ServiceAccount:</span>
                    <strong className="text-sky-300">12 Tanımlı</strong>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[8.5px]">Role / ClusterRole:</span>
                    <strong className="text-purple-300">11 Aktif</strong>
                  </div>
                </div>

                {/* OVERLY PERMISSIVE SECURITY WARNING BADGE */}
                <div className="bg-red-500/10 p-2 rounded border border-red-500/50 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-[9.5px] text-red-300 leading-tight">
                    <strong className="text-red-400 block font-bold">⚠️ AŞIRI YETKİLİ SERVICEACCOUNT DETEKSİYONU:</strong>
                    SA <code className="text-amber-300 font-mono">admin-sa</code> ➔ <code className="text-red-300 font-mono">cluster-admin</code> rolüne bağlı! Tüm kaynaklara sınırsız müdahale yetkisi içeriyor.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NODES */}
          {activeTab === 'NODES' && (
            <div className="space-y-2 font-mono-tech text-[11px]">
              {activeShips.map((s) => (
                <div key={s.id} className="industrial-card p-2.5 rounded-lg border space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-sky-300">{s.name}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {s.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">IP: {s.ip}</div>
                  <div className="text-[10px] text-slate-400">Kapasite: {s.metrics?.cpu_capacity} CPU / {s.metrics?.mem_capacity} RAM</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: DEPLOYMENTS & CRONJOB SCHEDULE */}
          {activeTab === 'DEPLOYMENTS' && (
            <div className="space-y-3 font-mono-tech text-[11px]">
              <div className="space-y-1.5">
                <span className="text-purple-400 font-bold block text-[10px]">📦 AKTİF DEPLOYMENT VE İŞ YÜKLERİ ({deployments.length}):</span>
                {deployments.length > 0 ? (
                  deployments.map((d) => (
                    <div key={d.name} className="industrial-card p-2.5 rounded-lg border space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <strong className="text-purple-300 font-bold">● {d.name}</strong>
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px] border border-purple-500/40">
                          {d.replicas}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-300 truncate">Namespace: <strong className="text-sky-400">{d.namespace}</strong></div>
                      <div className="text-[10px] text-slate-400 truncate">İmaj: <code className="text-amber-300 font-mono">{d.image || 'nginx:latest'}</code> ({d.strategy || 'RollingUpdate'})</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-center text-[10px] text-slate-400 italic">
                    Bu cluster'da tanımlı Deployment yok.
                  </div>
                )}
              </div>

              {/* CRONJOB SEFER TARİFESİ */}
              <div className="industrial-panel p-3 rounded-lg space-y-2 border border-amber-500/30">
                <span className="text-amber-400 font-bold block text-[10px] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> ⏰ SEFER TARİFESİ (CRONJOB SCHEDULE):
                </span>

                {mockCronJobs.map((cj) => (
                  <div key={cj.name} className="bg-slate-900/90 p-2 rounded border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center">
                      <strong className="text-sky-300 text-[10px]">● {cj.name}</strong>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px]">
                        {cj.schedule}
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400">Son Sefer: {cj.last_run}</div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                      <span className="text-[9.5px] text-emerald-400">Sonraki: {cj.next_run}</span>
                      <button
                        onClick={() => onTriggerCronJob && onTriggerCronJob(cj.name)}
                        className="industrial-btn text-[9px] py-0.5 px-2 bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5 text-amber-400" />
                        <span>JET TETİKLE</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LOAD BALANCING & TREND */}
          {activeTab === 'LOAD' && (
            <div className="space-y-3 font-mono-tech text-[11px]">
              <ClusterTrendChart history={metricsHistory} />

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

        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 text-center font-mono-tech">
          Tersane v2.7.0 Pro Master Control Panel
        </div>
      </div>
    </div>
  )
}

function Building2Icon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  )
}
