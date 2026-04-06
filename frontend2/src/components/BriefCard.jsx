import { useEffect } from 'react'
import { Spinner } from './UI'
import { X, FileText } from 'lucide-react'

export default function BriefCard({ brief, loading, onClose }) {
  if (!brief && !loading) return null
  const intelBullets = (brief?.key_intel?.length ? brief.key_intel : brief?.key_points || []).slice(0, 4)

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xl animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/12 bg-slate-950 text-slate-100 shadow-[0_30px_80px_rgba(2,6,23,0.55)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Executive brief</p>
              <p className="text-sm text-slate-400">Only the essentials</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close brief">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Spinner size={28} />
            <p className="text-sm text-slate-400">Generating brief...</p>
          </div>
        )}

        {brief && !loading && (
          <div className="animate-slide-up space-y-5 p-6">
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-white">{brief.headline || 'Meeting summary'}</h2>
              {brief.situation && <p className="mt-3 text-sm leading-6 text-slate-300">{brief.situation}</p>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              {intelBullets.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Key points</p>
                  <ul className="mt-3 space-y-2">
                    {intelBullets.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-200">
                        <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                        <span>{item}</span>
                      </li>
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
