export function StatusBadge({ status }) {
  const map = {
    uploaded:   { label: 'UPLOADED',   cls: 'text-ops-muted border-ops-border' },
    processing: { label: 'PROCESSING', cls: 'text-ops-yellow border-ops-yellow/30 status-processing' },
    ready:      { label: 'READY',      cls: 'text-ops-green border-ops-green/30' },
    error:      { label: 'ERROR',      cls: 'text-ops-red border-ops-red/30' },
  }
  const { label, cls } = map[status] || map.uploaded
  return <span className={`font-mono text-[10px] border px-2 py-0.5 tracking-widest ${cls}`}>{label}</span>
}

export function ThreatBadge({ level }) {
  const lvl = (level || 'GREEN').toUpperCase()
  return <span className={`font-mono text-[10px] border px-2 py-0.5 tracking-widest threat-${lvl.toLowerCase()}`}>▲ {lvl}</span>
}

export function PriorityBadge({ priority }) {
  const map = {
    High:   'text-ops-red border-ops-red/30 bg-ops-red/5',
    Medium: 'text-ops-yellow border-ops-yellow/30 bg-ops-yellow/5',
    Low:    'text-ops-muted border-ops-border',
  }
  return <span className={`font-mono text-[10px] border px-2 py-0.5 tracking-widest ${map[priority] || map.Medium}`}>{priority?.toUpperCase()}</span>
}

export function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-ops-gold">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" />
    </svg>
  )
}

export function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-ops-border" />
      <span className="text-ops-gold text-xs font-mono tracking-widest">◆</span>
      <div className="flex-1 h-px bg-ops-border" />
    </div>
  )
}

export function SectionHeader({ icon, label, count }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && <span className="text-ops-gold">{icon}</span>}
      <span className="font-mono text-xs tracking-[4px] text-ops-gold uppercase">{label}</span>
      {count !== undefined && <span className="font-mono text-[10px] text-ops-muted border border-ops-border px-2 py-0.5">{count}</span>}
      <div className="flex-1 h-px bg-ops-border" />
    </div>
  )
}