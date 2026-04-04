import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeetings, deleteMeeting, renameMeeting } from '../api/client'
import { StatusBadge, Spinner } from '../components/UI'
import { Upload, Pencil, Trash2, Check, X } from 'lucide-react'

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionError, setActionError] = useState(null)

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

  const startEdit = (meeting) => {
    setActionError(null)
    setEditingId(meeting.id)
    setEditingName(meeting.name || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveName = async (meetingId) => {
    const nextName = editingName.trim()
    if (!nextName) {
      setActionError('Name cannot be empty.')
      return
    }
    try {
      setActionLoadingId(meetingId)
      await renameMeeting(meetingId, nextName)
      setMeetings(prev => prev.map(m => (m.id === meetingId ? { ...m, name: nextName } : m)))
      cancelEdit()
    } catch (e) {
      setActionError(e?.response?.data?.detail || 'Failed to rename file.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (meetingId) => {
    try {
      setActionLoadingId(meetingId)
      setActionError(null)
      await deleteMeeting(meetingId)
      setMeetings(prev => prev.filter(m => m.id !== meetingId))
      if (editingId === meetingId) {
        cancelEdit()
      }
    } catch (e) {
      setActionError(e?.response?.data?.detail || 'Failed to delete file.')
    } finally {
      setActionLoadingId(null)
    }
  }

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
      {actionError && <div className="border border-ops-red/30 bg-ops-red/5 p-4 text-ops-red font-mono text-xs mt-2">▲ {actionError}</div>}

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
                    {editingId === m.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          saveName(m.id)
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          value={editingName}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full max-w-md bg-ops-dark border border-ops-border text-ops-text px-2 py-1 text-sm outline-none focus:border-ops-gold"
                        />
                        <button
                          type="submit"
                          disabled={actionLoadingId === m.id}
                          className="text-ops-green hover:text-ops-gold disabled:opacity-50"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          className="text-ops-muted hover:text-ops-red"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            cancelEdit()
                          }}
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <h3 className="font-display text-xl text-ops-text tracking-wider group-hover:text-ops-gold transition-colors truncate">{m.name}</h3>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="font-mono text-[10px] text-ops-muted">{m.word_count?.toLocaleString()} WORDS</span>
                      <span className="font-mono text-[10px] text-ops-muted">{m.speakers?.length} SPEAKERS</span>
                      <span className="font-mono text-[10px] text-ops-muted">{m.format?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      className="text-ops-muted hover:text-ops-gold transition-colors"
                      title="Rename"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        startEdit(m)
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="text-ops-muted hover:text-ops-red transition-colors disabled:opacity-50"
                      title="Delete"
                      disabled={actionLoadingId === m.id}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDelete(m.id)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
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