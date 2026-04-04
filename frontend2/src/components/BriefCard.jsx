import { ThreatBadge, Spinner } from './UI'
import { X, FileText, Sparkles } from 'lucide-react'

export default function BriefCard({ brief, loading, onClose }) {
  if (!brief && !loading) return null
  const intelBullets = (brief?.key_intel?.length ? brief.key_intel : brief?.key_points || []).slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white text-slate-900 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Executive brief</p>
              <p className="text-sm text-slate-500">Clean summary of the meeting outcome</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" aria-label="Close brief">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spinner size={28} />
            <p className="text-sm text-slate-500">Generating brief…</p>
          </div>
        )}

        {brief && !loading && (
          <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_0.9fr] animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{brief.classification}</span>
                <ThreatBadge level={brief.threat_level} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Summary</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 leading-tight">{brief.headline}</h2>
              </div>

              {brief.situation && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Overview</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{brief.situation}</p>
                </div>
              )}

              {brief.threat_reason && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Sparkles size={14} />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Why this rating</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{brief.threat_reason}</p>
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              {intelBullets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key points</p>
                  <ul className="mt-3 space-y-2">
                    {intelBullets.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.orders?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tasks</p>
                  <ul className="mt-3 space-y-2">
                    {brief.orders.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700">
                        <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {brief.risk_flags?.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Risk flags</p>
                  <ul className="mt-3 space-y-1">
                    {brief.risk_flags.map((flag, i) => (
                      <li key={i} className="text-sm text-rose-700">• {flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
