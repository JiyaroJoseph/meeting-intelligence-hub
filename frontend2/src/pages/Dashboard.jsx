import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeetings, deleteMeeting, renameMeeting } from '../api/client'
import { StatusBadge, Spinner, Skeleton } from '../components/UI'
import { Upload, Pencil, Trash2, Check, X, Plus, Search } from 'lucide-react'

export default function Dashboard() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [query, setQuery] = useState('')

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
  const filteredMeetings = safeMeetings.filter(m => {
    const haystack = `${m.name || ''} ${m.filename || ''} ${m.id || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 animate-fade-in">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white md:text-5xl">Meetings</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Upload transcripts, review extracted intelligence, and keep decisions moving.</p>
        </div>
        <Link to="/upload" className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-100">
          <Plus size={14} /> New transcript
        </Link>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Transcripts', value: safeMeetings.length },
          { label: 'Ready', value: ready },
          { label: 'Decisions', value: totalDecisions },
          { label: 'Tasks', value: totalActions },
        ].map(({ label, value }) => (
          <div key={label} className="surface-glow rounded-2xl border border-white/6 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-indigo-400/20">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-white">{value}</p>
          </div>
        ))}
      </div>

      {!loading && safeMeetings.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.04] p-16 text-center">
          <p className="text-sm font-medium text-slate-200">No transcripts yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Upload a meeting transcript to extract decisions, tasks, and a brief summary.</p>
          <Link to="/upload" className="mt-6 inline-flex items-center gap-2 rounded-full bg-indigo-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-400">
            <Upload size={14} /> Upload transcript
          </Link>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-white/6 bg-white/5 p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-7 w-2/3" />
              <div className="mt-4 flex gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
      {actionError && <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{actionError}</div>}

      {safeMeetings.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/8 bg-slate-950/60 shadow-[0_20px_60px_rgba(2,6,23,0.25)]">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <div>
              <p className="text-sm font-medium text-white">Recent meetings</p>
              <p className="mt-1 text-sm text-slate-400">Search, rename, and manage your uploaded transcripts.</p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transcripts" className="w-full rounded-full border border-white/8 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-indigo-400/30 focus:bg-white/[0.07]" />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredMeetings.map(m => (
              <div key={m.id} className="group grid gap-4 px-5 py-5 transition-colors hover:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_200px]">
                <Link to={`/mission/${m.id}`} className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={m.status} />
                    <span className="text-xs text-slate-500">#{m.id}</span>
                    <span className="text-xs text-slate-500">{m.filename?.split('.').pop()?.toUpperCase()}</span>
                  </div>
                  {editingId === m.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        saveName(m.id)
                      }}
                      className="mt-3 flex flex-wrap items-center gap-2"
                    >
                      <input
                        value={editingName}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="min-w-[240px] flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-indigo-400/40"
                      />
                      <button type="submit" disabled={actionLoadingId === m.id} className="inline-flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-50" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                        <Check size={14} /> Save
                      </button>
                      <button type="button" className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-white" onClick={(e) => { e.preventDefault(); e.stopPropagation(); cancelEdit() }}>
                        <X size={14} /> Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <h3 className="mt-3 truncate text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-indigo-300">{m.name}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span>{m.word_count?.toLocaleString()} words</span>
                        <span>{m.speakers?.length} speakers</span>
                        <span>{m.format?.toUpperCase()}</span>
                      </div>
                    </>
                  )}
                </Link>

                <div className="flex items-center justify-between gap-3 md:justify-end">
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Decisions</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{m.decisions_count}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tasks</p>
                      <p className="mt-1 text-2xl font-semibold text-white">{m.action_items_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                    <button className="inline-flex items-center justify-center rounded-full border border-white/8 bg-white/5 p-2 text-slate-300 transition-colors hover:border-indigo-400/30 hover:text-white" title="Rename" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(m) }}>
                      <Pencil size={14} />
                    </button>
                    <button className="inline-flex items-center justify-center rounded-full border border-white/8 bg-white/5 p-2 text-slate-300 transition-colors hover:border-rose-400/30 hover:text-rose-200 disabled:opacity-50" title="Delete" disabled={actionLoadingId === m.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(m.id) }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredMeetings.length === 0 && !loading && (
              <div className="px-5 py-10 text-sm text-slate-400">No meetings match your search.</div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}