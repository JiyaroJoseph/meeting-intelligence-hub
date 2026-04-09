import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck, Radar } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import MeetingDetail from './pages/MeetingDetail'
import Ask from './pages/Ask'

export default function App() {
  const loc = useLocation()
  const currentYear = new Date().getFullYear()
  return (
    <div className="min-h-screen text-ops-text font-sans">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-semibold tracking-tight text-xl text-white">Debrief</span>
            <span className="hidden text-xs text-slate-400 sm:block">Meeting intelligence</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 p-1">
            <Link to="/" className={`rounded-full px-4 py-2 text-sm transition-colors ${loc.pathname === '/' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>Dashboard</Link>
            <Link to="/ask" className={`rounded-full px-4 py-2 text-sm transition-colors ${loc.pathname === '/ask' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>Ask AI</Link>
            <Link to="/upload" className={`rounded-full px-4 py-2 text-sm transition-colors ${loc.pathname === '/upload' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>Upload</Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/mission/:id" element={<MeetingDetail />} />
      </Routes>
      <footer className="relative mt-20 overflow-hidden border-t border-cyan-400/15 bg-slate-950/70">
        <div className="pointer-events-none absolute -left-24 top-0 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-10 h-52 w-52 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="grid gap-8 md:grid-cols-[1.35fr_1fr_auto] md:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-200">
                <Radar size={12} />
                Debrief Command Layer
              </p>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">Secure intelligence for every meeting that matters.</h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Debrief turns raw transcripts into decisions, action owners, and source-backed context your team can trust.</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200">
                <ShieldCheck size={13} />
                Encrypted workspace • traceable outputs
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Explore</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                <Link to="/" className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 transition-colors hover:border-cyan-300/30 hover:text-white">Dashboard</Link>
                <Link to="/ask" className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 transition-colors hover:border-cyan-300/30 hover:text-white">Ask AI</Link>
                <Link to="/upload" className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 transition-colors hover:border-cyan-300/30 hover:text-white">Upload</Link>
              </div>
            </div>

            <Link to="/ask" className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(34,211,238,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(99,102,241,0.3)]">
              Open assistant
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/6 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{currentYear} Debrief. Meeting intelligence workspace.</p>
            <p>Built for teams that need auditable decisions and fast execution.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}