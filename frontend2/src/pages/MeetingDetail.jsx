import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMeeting, getBrief, getConflicts, exportCSV, exportPDF, reanalyzeMeeting } from '../api/client'
import { StatusBadge, PriorityBadge, SectionHeader, Spinner, Skeleton } from '../components/UI'
import ChatPanel from '../components/ChatPanel'
import BriefCard from '../components/BriefCard'
import { ArrowLeft, Download, FileText, Zap, AlertTriangle, Clock3, RefreshCw } from 'lucide-react'

export default function MeetingDetail() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [brief, setBrief] = useState(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const [conflicts, setConflicts] = useState([])
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState(null)

  const fetchMeeting = useCallback(async () => {
    try {
      const res = await getMeeting(id)
      setMeeting(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [id])

  const fetchConflicts = useCallback(async () => {
    try {
      const res = await getConflicts(id)
      setConflicts(res.data?.conflicts || [])
    } catch (e) {
      console.error(e)
      setConflicts([])
    }
  }, [id])

  useEffect(() => {
    fetchMeeting()
    fetchConflicts()
    const interval = setInterval(fetchMeeting, 3000)
    return () => clearInterval(interval)
  }, [fetchMeeting, fetchConflicts])

  const handleBrief = async () => {
    setShowBrief(true)
    if (brief) return
    setBriefLoading(true)
    try {
      const res = await getBrief(id)
      setBrief(res.data)
    } catch (e) { console.error(e) }
    finally { setBriefLoading(false) }
  }

  const handleRetryAnalysis = async () => {
    setRetrying(true)
    setRetryError(null)
    try {
      await reanalyzeMeeting(id)
      await fetchMeeting()
    } catch (e) {
      setRetryError(e?.response?.data?.detail || 'Unable to queue re-analysis.')
    } finally {
      setRetrying(false)
    }
  }

  if (loading) return <div className="mx-auto flex h-64 max-w-6xl items-center justify-center px-6"><div className="space-y-3 rounded-2xl border border-white/8 bg-white/5 p-6"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-56" /><Skeleton className="h-4 w-44" /></div></div>
  if (!meeting) return <div className="mx-auto max-w-4xl px-6 py-10"><p className="text-sm text-rose-300">Meeting not found.</p></div>

  const decisions = meeting.intel?.decisions || []
  const actions = meeting.intel?.action_items || []
  const timeline = (meeting.segments || []).slice(0, 22).map((seg, idx) => {
    const text = (seg.text || '').toLowerCase()
    let tag = 'dialogue'
    if (text.includes('decid') || text.includes('approve') || text.includes('agreed')) tag = 'decision'
    if (text.includes('action') || text.includes('owner') || text.includes('deadline') || text.includes('will ')) tag = tag === 'decision' ? 'decision-action' : 'action'
    if (text.includes('risk') || text.includes('blocked') || text.includes('delay') || text.includes('concern')) tag = tag.includes('action') ? 'risk-action' : 'risk'
    return { ...seg, idx, tag }
  })
  const timelineSpeakers = [...new Set(timeline.map(t => t.speaker || 'Unknown'))]

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      <div className="mt-6 flex flex-col gap-6 rounded-3xl border border-white/8 bg-white/5 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.25)] md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Meeting #{meeting.id}</span>
            <StatusBadge status={meeting.status} />
            {conflicts.length > 0 && <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-200">Conflicts detected</span>}
          </div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{meeting.name}</h1>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>{meeting.word_count?.toLocaleString()} words</span>
            <span>{meeting.speakers?.join(', ') || 'Unknown speakers'}</span>
            <span className="uppercase tracking-[0.16em] text-slate-500">{meeting.format?.toUpperCase()}</span>
          </div>
        </div>

        {meeting.status === 'ready' && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={handleBrief} className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-400">
              <Zap size={12} /> Brief me
            </button>
            <button onClick={() => exportCSV(id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-indigo-400/25 hover:text-white">
              <Download size={12} /> CSV
            </button>
            <button onClick={() => exportPDF(id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-indigo-400/25 hover:text-white">
              <FileText size={12} /> PDF
            </button>
          </div>
        )}
      </div>

      {meeting.status === 'processing' && (
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-5">
          <Spinner size={20} />
          <div>
            <p className="text-sm font-medium text-indigo-100">Analyzing transcript</p>
            <p className="mt-1 text-sm text-slate-400">This usually takes 15 to 30 seconds.</p>
          </div>
        </div>
      )}

      {meeting.status === 'error' && (
        <div className="mt-6 rounded-2xl border border-rose-400/15 bg-rose-500/10 p-5">
          <p className="text-sm font-medium text-rose-200">Analysis failed</p>
          <p className="mt-2 text-sm text-slate-300">{meeting.error_message || 'The transcript could not be processed.'}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetryAnalysis}
              disabled={retrying}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              {retrying ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />} {retrying ? 'Retrying...' : 'Retry analysis'}
            </button>
            {retryError && <span className="text-xs text-rose-300">{retryError}</span>}
          </div>
        </div>
      )}

      {meeting.status === 'ready' && (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Decisions</p>
              <p className="mt-3 text-3xl font-semibold text-white">{decisions.length}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tasks</p>
              <p className="mt-3 text-3xl font-semibold text-white">{actions.length}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Conflict checks</p>
              <p className="mt-3 text-3xl font-semibold text-white">{conflicts.length}</p>
            </div>
          </div>

          <div>
            <SectionHeader label="Key decisions" count={decisions.length} />
            {decisions.length === 0
              ? <p className="text-sm text-slate-400">No decisions extracted.</p>
              : (
                <div className="space-y-3">
                  {decisions.map(d => (
                    <div key={d.id} className="rounded-2xl border border-white/8 bg-white/5 p-5 transition-colors hover:border-indigo-400/20">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex shrink-0 items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-medium text-indigo-200">#{d.id}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{d.decision}</p>
                          {d.context && <p className="mt-1 text-sm text-slate-400">{d.context}</p>}
                          {d.rationale && (
                            <div className="mb-2 border-l-2 border-indigo-400/40 pl-3">
                              <p className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Rationale</p>
                              <p className="text-sm text-slate-300">{d.rationale}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${d.confidence === 'High' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : d.confidence === 'Low' ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-amber-400/30 bg-amber-500/10 text-amber-300'}`}>
                              Confidence {d.confidence || 'Medium'}
                            </span>
                            {d.dissenters?.length > 0 && <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-medium text-rose-300">Dissent {d.dissenters.length}</span>}
                          </div>
                          {d.stakeholders?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {d.stakeholders.map(s => (
                                <span key={s} className="rounded-full border border-white/8 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300">{s}</span>
                              ))}
                            </div>
                          )}
                          {d.dissenters?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {d.dissenters.map(s => (
                                <span key={s} className="rounded-full border border-rose-400/30 px-2.5 py-1 text-[11px] text-rose-300">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* CONFLICT DETECTOR */}
          <div>
            <SectionHeader icon={<AlertTriangle size={14} />} label="Cross-meeting conflict detector" count={conflicts.length} />
            {conflicts.length === 0
              ? <p className="text-sm text-slate-400">No contradictions detected against previous meetings.</p>
              : (
                <div className="space-y-3">
                  {conflicts.map((c, i) => (
                    <div key={`${c.topic}-${i}`} className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={13} className="text-rose-300" />
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-rose-200">{c.severity || 'Medium'} conflict · {c.topic?.toUpperCase() || 'Decision drift'}</p>
                      </div>
                      <p className="text-sm text-slate-300 mb-1"><span className="text-slate-100">Current:</span> {c.current_decision}</p>
                      <p className="text-sm text-slate-300"><span className="text-slate-100">Previous ({c.previous_meeting}):</span> {c.previous_decision}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* TIMELINE REPLAY */}
          <div>
            <SectionHeader icon={<Clock3 size={14} />} label="Timeline replay" count={timeline.length} />
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {timelineSpeakers.map(sp => (
                  <span key={sp} className="rounded-full border border-white/8 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300">{sp}</span>
                ))}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {timeline.map(item => (
                  <div key={item.idx} className="grid grid-cols-[92px_120px_1fr] gap-3 items-start timeline-row">
                    <span className="text-xs text-slate-500">{item.time || `Segment ${item.idx + 1}`}</span>
                    <span className="text-xs font-medium text-indigo-300">{item.speaker || 'Unknown'}</span>
                    <div className="relative rounded-xl border border-white/8 bg-slate-950/60 px-3 py-2">
                      <span className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${item.tag.includes('risk') ? 'bg-rose-400' : item.tag.includes('decision') ? 'bg-indigo-400' : item.tag.includes('action') ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                      <p className="pl-2 text-sm text-slate-300">{item.text}</p>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && <p className="text-sm text-slate-400">No timeline segments available for this transcript.</p>}
              </div>
            </div>
          </div>

          {/* ACTION ITEMS */}
          <div>
            <SectionHeader label="Tasks" count={actions.length} />
            {actions.length === 0
              ? <p className="text-sm text-slate-400">No tasks extracted.</p>
              : (
                <div className="overflow-x-auto rounded-2xl border border-white/8 bg-white/5">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/8">
                        {['#', 'TASK', 'OWNER', 'DEADLINE', 'PRIORITY'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium tracking-[0.18em] text-slate-400">{h === 'TASK' ? 'Task' : h === 'OWNER' ? 'Owner' : h === 'DEADLINE' ? 'Deadline' : h === 'PRIORITY' ? 'Priority' : h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map(a => (
                        <tr key={a.id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                          <td className="px-4 py-4 text-sm text-indigo-300">#{a.id}</td>
                          <td className="px-4 py-4 text-sm text-white">{a.task}</td>
                          <td className="px-4 py-4 text-sm text-slate-400">{a.owner}</td>
                          <td className="px-4 py-4 text-sm text-slate-400">{a.deadline}</td>
                          <td className="px-4 py-4"><PriorityBadge priority={a.priority} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>

          {/* CHAT */}
          <div>
            <SectionHeader label="Contextual query" />
            <ChatPanel meetingId={id} />
          </div>
        </div>
      )}

      {showBrief && <BriefCard brief={brief} loading={briefLoading} onClose={() => setShowBrief(false)} />}
    </div>
  )
}