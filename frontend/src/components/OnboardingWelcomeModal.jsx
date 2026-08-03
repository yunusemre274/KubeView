import React, { useState } from 'react'
import { Anchor, Ship, Box, Building2, HelpCircle, ArrowRight, CheckCircle2, X } from 'lucide-react'

export default function OnboardingWelcomeModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)

  if (!isOpen) return null

  const handleFinish = () => {
    localStorage.setItem('tersane_onboarding_seen', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col relative text-slate-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Anchor className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-industrial text-amber-400 tracking-wider">
                TERSANE (K8s Shipyard) REHBERİ
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">ADIM {step} / 3</p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Contents */}
        <div className="p-6 space-y-4 text-xs leading-relaxed min-h-[220px]">
          {step === 1 && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-bold text-sky-400 font-industrial flex items-center gap-2">
                <span>👋 Tersane'ye Hoş Geldiniz!</span>
              </h3>
              <p className="text-slate-300">
                Tersane, Kubernetes'in soyut <strong>pod, node, deployment ve service</strong> kavramlarını somut bir 
                3D liman ve tersane simülasyonuna dönüştüren canlı izleme platformudur.
              </p>
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gerçek Zamanlı Event-Driven Yayın</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Kubernetes cluster'ınızdaki tüm durum değişiklikleri `client-go` Informer/Watch mimarisiyle sıfır 
                  gecikmeli olarak 3D sahneye yansır.
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-bold text-amber-400 font-industrial flex items-center gap-2">
                <span>⚓ Temel Liman Metaforları</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                  <Ship className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block">Kargo Gemisi</strong>
                    <span className="text-slate-400">Worker Node (İşlem Gücü)</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                  <Box className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block">Kargo Paleti</strong>
                    <span className="text-slate-400">Pod (Çalışan Uygulama)</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block">Yönetim Binası</strong>
                    <span className="text-slate-400">Control Plane (Master Node)</span>
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 flex items-start gap-2">
                  <Anchor className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block">Vinç & Deniz Feneri</strong>
                    <span className="text-slate-400">Scheduler & Ingress Gateway</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-bold text-emerald-400 font-industrial flex items-center gap-2">
                <span>🎬 Nasıl Kullanılır?</span>
              </h3>
              <ul className="space-y-2 text-slate-300 list-disc list-inside text-[11px]">
                <li>
                  <strong className="text-slate-100">3D Etkileşim:</strong> Sahnedeki herhangi bir gemiye, konteynıra veya liman yapısına tıklayarak sağ tarafta <strong>Müfettiş Detay Çekmecesini</strong> açın.
                </li>
                <li>
                  <strong className="text-slate-100">Anomali Simülasyonu:</strong> Üst menüdeki açılır listeden <code>CrashLoopBackOff</code> veya <code>NodeNotReady</code> seçerek 3D görsel alarm efektlerini görün.
                </li>
                <li>
                  <strong className="text-slate-100">Gelişmiş Metrikler:</strong> Liman Binasına tıklayarak Control Plane metrik grafiklerini ve CPU/RAM kullanım trendlerini izleyin.
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className={`px-3 py-1.5 rounded text-xs font-industrial border transition ${
              step === 1 ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            ÖNCEKİ
          </button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === i ? 'bg-amber-400 w-4' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              className="px-3 py-1.5 rounded text-xs font-industrial bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border border-amber-400 shadow flex items-center gap-1 transition"
            >
              <span>SONRAKİ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-4 py-1.5 rounded text-xs font-industrial bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-400 shadow flex items-center gap-1 transition"
            >
              <span>TERSANEYİ KEŞFET</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
