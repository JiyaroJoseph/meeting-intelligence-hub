import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeetings } from '../api/client'
import { StatusBadge, Spinner } from '../components/UI'
import { Upload } from 'lucide-react'

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMeetings = async () => {
    try {
      const res = await getMeetings()
      const data = Array.isArray(res)
        ? res
        : res?.data || res?.meetings || []

      setMeetings(data)
      setError(null)
    } catch (e) {
      if (e?.code === 'ERR_NETWORK' || e?.response?.status === 0) {
        setError('Failed to reach backend. Is the server running?')
      } else {
        setError(e?.response?.data?.detail || 'Failed to load mission files.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
    const interval = setInterval(fetchMeetings, 4000)
    return () => clearInterval(interval)
  }, [])

  const safeMeetings = Array.isArray(meetings) ? meetings : []
  const totalActions = safeMeetings.reduce((s, m) => s + (m.action_items_count || 0), 0)
  const totalDecisions = safeMeetings.reduce((s, m) => s + (m.decisions_count || 0), 0)
  const ready = safeMeetings.filter(m => m.status === 'ready').length


  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-10">
        <p className="font-mono text-xs text-ops-gold tracking-[6px] mb-2">OPERATIONS CENTER</p>
        <h1 className="font-display text-5xl text-ops-text tracking-wider mb-3">MISSION FILES</h1>
        <p className="text-ops-muted text-sm">Upload meeting transcripts. Extract intelligence. Execute.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'MISSION FILES', value: safeMeetings.length },
          { label: 'READY', value: ready },
          { label: 'DECISIONS', value: totalDecisions },
          { label: 'ACTION ITEMS', value: totalActions },
        ].map(({ label, value }) => (
          <div key={label} className="relative bg-ops-card border border-ops-border p-5 card-scan">
            <p className="font-mono text-[10px] text-ops-muted tracking-widest mb-2">{label}</p>
            <p className="font-display text-4xl text-ops-gold">{value}</p>
          </div>
        ))}
      </div>

      {!loading && safeMeetings.length === 0 && (
        <div className="border border-dashed border-ops-border p-16 text-center">
          <p className="font-mono text-ops-dim text-sm tracking-widest mb-4">NO MISSION FILES LOADED</p>
          <Link to="/upload" className="inline-flex items-center gap-2 bg-ops-gold text-ops-black font-mono text-xs tracking-widest px-6 py-3 hover:bg-ops-gold/80 transition-colors">
            <Upload size={14} /> UPLOAD TRANSCRIPT
          </Link>
        </div>
      )}

      {loading && <div className="flex items-center justify-center py-20"><Spinner size={24} /></div>}
      {error && <div className="border border-ops-red/30 bg-ops-red/5 p-4 text-ops-red font-mono text-xs">▲ {error}</div>}

      {safeMeetings.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs tracking-[4px] text-ops-gold">ACTIVE FILES</span>
            <div className="flex-1 h-px bg-ops-border" />
            <Link to="/upload" className="font-mono text-[10px] text-ops-muted hover:text-ops-gold tracking-widest transition-colors flex items-center gap-1">
              <Upload size={10} /> NEW FILE
            </Link>
          </div>
          <div className="space-y-2">
            {safeMeetings.map(m => (
              <Link key={m.id} to={`/mission/${m.id}`} className="block relative bg-ops-card border border-ops-border hover:border-ops-gold/40 p-5 transition-all gold-glow group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-[10px] text-ops-dim tracking-widest">#{m.id}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <h3 className="font-display text-xl text-ops-text tracking-wider group-hover:text-ops-gold transition-colors truncate">{m.name}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-mono text-[10px] text-ops-muted">{m.word_count?.toLocaleString()} WORDS</span>
                      <span className="font-mono text-[10px] text-ops-muted">{m.speakers?.length} SPEAKERS</span>
                      <span className="font-mono text-[10px] text-ops-muted">{m.format?.toUpperCase()}</span>
                    </div>
                  </div>
                  {m.status === 'ready' && (
                    <div className="flex gap-4 text-right shrink-0">
                      <div><p className="font-mono text-[10px] text-ops-muted">DECISIONS</p><p className="font-display text-2xl text-ops-gold">{m.decisions_count}</p></div>
                      <div><p className="font-mono text-[10px] text-ops-muted">ORDERS</p><p className="font-display text-2xl text-ops-gold">{m.action_items_count}</p></div>
                    </div>
                  )}
                  {m.status === 'processing' && (
                    <div className="flex items-center gap-2 text-ops-yellow"><Spinner size={14} /><span className="font-mono text-[10px] tracking-widest status-processing">ANALYZING...</span></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}