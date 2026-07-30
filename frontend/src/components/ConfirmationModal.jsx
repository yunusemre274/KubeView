import React from 'react'
import { AlertTriangle, ShieldAlert, Check, X } from 'lucide-react'

export default function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'EVET, UYGULA', danger = true }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="industrial-panel max-w-md w-full p-6 rounded-2xl border-red-500/40 shadow-2xl space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-industrial text-lg font-bold text-red-400">{title || 'GÜVENLİK ONAYI'}</h3>
            <span className="text-xs text-slate-400 font-mono-tech">Kubernetes Küme Mutasyonu</span>
          </div>
        </div>

        <p className="text-xs font-mono-tech text-slate-200 leading-relaxed bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="industrial-btn text-xs px-4 py-2"
          >
            <X className="w-4 h-4" />
            <span>İPTAL</span>
          </button>

          <button
            onClick={onConfirm}
            className={`industrial-btn text-xs px-4 py-2 ${danger ? 'bg-red-600 text-white border-red-500 hover:bg-red-700' : 'industrial-btn-active'}`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
