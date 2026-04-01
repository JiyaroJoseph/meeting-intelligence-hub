import { ThreatBadge, Spinner } from './UI'
import { X, Shield } from 'lucide-react'

export default function BriefCard({ brief, loading, onClose }) {
  if (!brief && !loading) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-ops-dark border border-ops-gold/40 max-w-2xl w-full max-h-[85vh] overflow-y-auto gold-glow">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ops-border">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-ops-gold" />
            <span className="font-mono text-xs tracking-[4px] text-ops-gold">EXECUTIVE BRIEF</span>
          </div>
          <button onClick={onClose} className="text-ops-dim hover:text-ops-text transition-colors"><X size={16} /></button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Spinner size={28} />
            <p className="font-mono text-xs text-ops-muted tracking-widest status-processing">GENERATING BRIEF...</p>
          </div>
        )}

        {brief && !loading && (
          <div className="p-6 space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ops-dim tracking-widest">{brief.classification}</span>
              <ThreatBadge level={brief.threat_level} />
            </div>
            <div>
              <p className="font-mono text-[10px] text-ops-gold tracking-widest mb-2">SITUATION</p>
              <h2 className="font-display text-2xl text-ops-text tracking-wide leading-tight">{brief.headline}</h2>
            </div>
            {brief.situation && (
              <div>
                <p className="font-mono text-[10px] text-ops-muted tracking-widest mb-2">OVERVIEW</p>
                <p className="text-ops-text text-sm leading-relaxed">{brief.situation}</p>
              </div>
            )}
            {brief.threat_reason && <div className="border-l-2 border-ops-gold pl-4"><p className="text-ops-muted text-xs italic">{brief.threat_reason}</p></div>}
            {brief.key_intel?.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-ops-gold tracking-widest mb-3">KEY INTELLIGENCE</p>
                <ul className="space-y-2">{brief.key_intel.map((item, i) => <li key={i} className="flex gap-3 text-sm text-ops-text"><span className="text-ops-gold mt-0.5 shrink-0">◆</span><span>{item}</span></li>)}</ul>
              </div>
            )}
            {brief.orders?.length > 0 && (
              <div>
                <p className="font-mono text-[10px] text-ops-gold tracking-widest mb-3">ORDERS</p>
                <ul className="space-y-2">{brief.orders.map((item, i) => <li key={i} className="flex gap-3 text-sm text-ops-text"><span className="text-ops-yellow mt-0.5 shrink-0">▶</span><span>{item}</span></li>)}</ul>
              </div>
            )}
            {brief.risk_flags?.length > 0 && (
              <div className="border border-ops-red/30 bg-ops-red/5 p-4">
                <p className="font-mono text-[10px] text-ops-red tracking-widest mb-3">⚠ RISK FLAGS</p>
                <ul className="space-y-1">{brief.risk_flags.map((flag, i) => <li key={i} className="text-ops-red text-xs">▲ {flag}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}