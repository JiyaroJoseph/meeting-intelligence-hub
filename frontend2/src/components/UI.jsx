export function StatusBadge({ status }) {
  const map = {
    uploaded: { label: 'Uploaded', cls: 'text-slate-300 border-slate-700 bg-slate-900/60' },
    processing: { label: 'Processing', cls: 'text-indigo-300 border-indigo-400/30 bg-indigo-500/10' },
    ready: { label: 'Ready', cls: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10' },
    error: { label: 'Error', cls: 'text-rose-300 border-rose-400/30 bg-rose-500/10' },
  }
  const { label, cls } = map[status] || map.uploaded
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-tight ${cls}`}>{label}</span>
}

export function ThreatBadge({ level }) {
  const lvl = (level || 'green').toLowerCase()
  const map = {
    green: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10',
    yellow: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    red: 'text-rose-300 border-rose-400/30 bg-rose-500/10',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${map[lvl] || map.green}`}>{level || 'Green'}</span>
}

export function PriorityBadge({ priority }) {
  const map = {
    High: 'text-rose-300 border-rose-400/30 bg-rose-500/10',
    Medium: 'text-amber-300 border-amber-400/30 bg-amber-500/10',
    Low: 'text-slate-300 border-slate-700 bg-slate-900/60',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${map[priority] || map.Medium}`}>{priority || 'Medium'}</span>
}

export function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-indigo-400">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse-soft rounded-xl bg-slate-700/60 ${className}`} />
}

export function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-slate-700" />
      <span className="text-indigo-400 text-xs">◆</span>
      <div className="flex-1 h-px bg-slate-700" />
    </div>
  )
}

export function SectionHeader({ icon, label, count }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {icon && <span className="text-indigo-400">{icon}</span>}
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">{label}</p>
      </div>
      {count !== undefined && <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300">{count}</span>}
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  )
}