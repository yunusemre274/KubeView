import React, { useState } from 'react'
import { HelpCircle, X, Info } from 'lucide-react'

const METAPHORS = [
  { k8s: 'Cluster', metaphor: '🏗️ Tersanenin Tamamı', desc: 'Tüm operasyonun gerçekleştiği liman ve tesis alanı' },
  { k8s: 'Control Plane / Master Node', metaphor: '🏢 Tersane Yönetim Binası', desc: 'Tüm kararların alındığı merkez' },
  { k8s: 'API Server', metaphor: '隔离 Kontrol Kulesi', desc: 'Tüm iletişimin geçtiği tek kule' },
  { k8s: 'Worker Node', metaphor: '🚢 Gemi (Kargo Gemisi)', desc: 'Kargo paletlerini taşıyan işlem birimi' },
  { k8s: 'Pod', metaphor: '🧱 Palet / Kargo Platformu', desc: 'Tekil veya çoklu kargo kutusunu tutan platform' },
  { k8s: 'Container', metaphor: '📦 Kargo Kutusu', desc: 'Uygulamanın kendisini barındıran birim' },
  { k8s: 'Namespace', metaphor: '🚪 Geminin Ambarı', desc: 'Mantıksal olarak ayrılmış bölmeler' },
  { k8s: 'Service', metaphor: '🎟️ Liman Gişesi', desc: 'Trafiği doğru paletlere yönlendiren nokta' },
]

export default function LegendModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-white hover:bg-slate-800/80 transition-all border border-sky-500/30 shadow-lg text-sm font-medium"
      >
        <HelpCircle className="w-4 h-4 text-sky-400" />
        <span>Metafor Rehberi</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl glass-panel p-6 text-slate-100 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">Kubernetes ↔️ Tersane Metafor Haritası</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {METAPHORS.map((m, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 gap-2">
                  <span className="font-semibold text-sky-300 text-sm">{m.k8s}</span>
                  <span className="font-bold text-emerald-400 text-sm">{m.metaphor}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              Tersane simülasyonunda her 3D obje gerçek bir Kubernetes kaynağını temsil eder.
            </div>
          </div>
        </div>
      )}
    </>
  )
}
