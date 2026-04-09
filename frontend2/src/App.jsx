import { Routes, Route, Link, useLocation } from 'react-router-dom'
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
      <footer className="mt-16 border-t border-white/5 bg-slate-950/45">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">Debrief</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">Meeting intelligence, decision clarity</p>
            <p className="mt-2 text-xs text-slate-400">Turn transcripts into accountable decisions, actions, and traceable context.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <Link to="/" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 transition-colors hover:border-cyan-300/30 hover:text-white">Dashboard</Link>
            <Link to="/ask" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 transition-colors hover:border-cyan-300/30 hover:text-white">Ask AI</Link>
            <Link to="/upload" className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 transition-colors hover:border-cyan-300/30 hover:text-white">Upload</Link>
          </div>
        </div>

        <div className="border-t border-white/5 px-6 py-3">
          <p className="text-center text-xs text-slate-500">{currentYear} Debrief. Built for secure multi-meeting intelligence.</p>
        </div>
      </footer>
    </div>
  )
}