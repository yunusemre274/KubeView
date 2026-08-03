import React from 'react'

// Status Badge Color Mapper
export function getStatusBadgeStyle(status = '') {
  const s = String(status).toUpperCase()
  if (['RUNNING', 'READY', 'BOUND', 'COMPLETED', 'HEALTHY', 'NORMAL', 'SAFE'].some(k => s.includes(k))) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
  if (['PENDING', 'SCALING', 'WARNING', 'WAITING'].some(k => s.includes(k))) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  }
  if (['FAILED', 'NOTREADY', 'CRASH', 'OOM', 'ERROR', 'UNHEALTHY'].some(k => s.includes(k))) {
    return 'bg-red-500/20 text-red-300 border-red-500/40'
  }
  return 'bg-slate-800 text-slate-300 border-slate-700'
}

export function InfoCardBadge({ status }) {
  if (!status) return null
  const style = getStatusBadgeStyle(status)
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold border tracking-wide uppercase shrink-0 ${style}`}>
      {status}
    </span>
  )
}

// 1. InfoCard Header Structure
export function InfoCardHeader({ icon: Icon, title, subtitle, status, typeLabel = 'OBJECT' }) {
  return (
    <div className="space-y-1.5 pb-2 border-b border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <div className="p-1.5 rounded-md bg-slate-800/80 border border-slate-700/80 text-sky-400 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[9px] font-industrial text-slate-400 tracking-wider block uppercase">
              {typeLabel}
            </span>
            <h3 className="text-xs font-bold font-industrial text-slate-100 truncate tracking-wide" title={title}>
              {title}
            </h3>
          </div>
        </div>
        {status && <InfoCardBadge status={status} />}
      </div>
      {subtitle && <p className="text-[10px] text-slate-400 font-mono-tech truncate" title={subtitle}>{subtitle}</p>}
    </div>
  )
}

// 2. InfoCard Section Container
export function InfoCardSection({ title, icon: Icon, children, colorClass = 'text-amber-400' }) {
  return (
    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-2">
      {title && (
        <div className={`flex items-center gap-1.5 font-industrial text-[10px] font-bold tracking-wider uppercase border-b border-slate-800/60 pb-1 ${colorClass}`}>
          {Icon && <Icon className="w-3 h-3 shrink-0" />}
          <span>{title}</span>
        </div>
      )}
      <div className="space-y-1 text-[10.5px]">{children}</div>
    </div>
  )
}

// 3. InfoCard Row (Two-column aligned label-value pair)
export function InfoCardRow({ label, value, valueColor = 'text-slate-200', isLink = false, onClick, truncateValue = true }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center leading-tight py-0.5">
      <span className="col-span-5 text-slate-400 font-industrial text-[10px] uppercase truncate" title={label}>
        {label}:
      </span>
      <div className="col-span-7 font-mono-tech text-[10.5px] text-right min-w-0">
        {isLink ? (
          <button
            onClick={onClick}
            className={`font-bold hover:underline inline-flex items-center gap-1 justify-end truncate max-w-full ${valueColor}`}
            title={String(value)}
          >
            <span className="truncate">{value}</span>
          </button>
        ) : (
          <span className={`font-semibold ${truncateValue ? 'truncate block' : 'break-all'} ${valueColor}`} title={String(value)}>
            {value != null ? String(value) : '-'}
          </span>
        )}
      </div>
    </div>
  )
}

// 4. Main InfoCard Wrapper
export default function InfoCard({ children }) {
  return (
    <div className="space-y-3 font-mono-tech text-slate-200 max-h-[calc(100vh-110px)] overflow-y-auto pr-1 custom-scrollbar">
      {children}
    </div>
  )
}
