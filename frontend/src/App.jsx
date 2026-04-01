import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import MeetingDetail from './pages/MeetingDetail'

export default function App() {
  const loc = useLocation()
  return (
    <div className="min-h-screen bg-ops-black text-ops-text font-sans">
      <nav className="border-b border-ops-border bg-ops-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-display text-2xl text-ops-gold tracking-widest">DEBRIEF</span>
            <span className="text-ops-dim text-xs font-mono tracking-widest hidden sm:block">// MEETING INTELLIGENCE</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className={`font-mono text-xs tracking-widest transition-colors ${loc.pathname === '/' ? 'text-ops-gold' : 'text-ops-muted hover:text-ops-text'}`}>OPS CENTER</Link>
            <Link to="/upload" className={`font-mono text-xs tracking-widest transition-colors ${loc.pathname === '/upload' ? 'text-ops-gold' : 'text-ops-muted hover:text-ops-text'}`}>UPLOAD</Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/mission/:id" element={<MeetingDetail />} />
      </Routes>
      <footer className="border-t border-ops-border mt-16 py-4">
        <p className="text-center font-mono text-[10px] text-ops-dim tracking-widest">DEBRIEF · CLASSIFIED · NOT FOR DISTRIBUTION</p>
      </footer>
    </div>
  )
}