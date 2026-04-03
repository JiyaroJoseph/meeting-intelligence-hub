import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMeeting, getBrief, getConflicts, exportCSV, exportPDF } from '../api/client'
import { StatusBadge, PriorityBadge, SectionHeader, Spinner } from '../components/UI'
import ChatPanel from '../components/ChatPanel'
import BriefCard from '../components/BriefCard'
import { ArrowLeft, Download, FileText, Zap, AlertTriangle, Orbit } from 'lucide-react'

export default function MeetingDetail() {
  const { id } = useParams()
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [brief, setBrief] = useState(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const [conflicts, setConflicts] = useState([])

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

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size={28} /></div>
  if (!meeting) return <div className="max-w-4xl mx-auto px-6 py-10"><p className="font-mono text-ops-red">Mission file not found.</p></div>

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
    <div className="max-w-5xl mx-auto px-6 py-10 animate-fade-in">
      <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs text-ops-muted hover:text-ops-gold tracking-widest mb-8 transition-colors">
        <ArrowLeft size={12} /> OPS CENTER
      </Link>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-[10px] text-ops-dim tracking-widest">MISSION #{meeting.id}</span>
            <StatusBadge status={meeting.status} />
            {conflicts.length > 0 && <span className="font-mono text-[10px] text-ops-red border border-ops-red/30 bg-ops-red/10 px-2 py-0.5 tracking-widest">CONFLICTS DETECTED</span>}
          </div>
          <h1 className="font-display text-4xl text-ops-text tracking-wider mb-2">{meeting.name}</h1>
          <div className="flex flex-wrap gap-4">
            <span className="font-mono text-xs text-ops-muted">{meeting.word_count?.toLocaleString()} WORDS</span>
            <span className="font-mono text-xs text-ops-muted">{meeting.speakers?.join(', ') || 'UNKNOWN'}</span>
            <span className="font-mono text-xs text-ops-muted">{meeting.format?.toUpperCase()}</span>
          </div>
        </div>

        {meeting.status === 'ready' && (
          <div className="flex flex-wrap gap-2 shrink-0">
            <button onClick={handleBrief} className="flex items-center gap-2 bg-ops-gold text-ops-black font-mono text-xs tracking-widest px-4 py-2.5 hover:bg-ops-gold/80 transition-colors">
              <Zap size={12} /> BRIEF ME
            </button>
            <button onClick={() => exportCSV(id)} className="flex items-center gap-2 border border-ops-border text-ops-muted font-mono text-xs tracking-widest px-4 py-2.5 hover:border-ops-gold/40 hover:text-ops-text transition-colors">
              <Download size={12} /> CSV
            </button>
            <button onClick={() => exportPDF(id)} className="flex items-center gap-2 border border-ops-border text-ops-muted font-mono text-xs tracking-widest px-4 py-2.5 hover:border-ops-gold/40 hover:text-ops-text transition-colors">
              <FileText size={12} /> DOSSIER PDF
            </button>
          </div>
        )}
      </div>

      {meeting.status === 'processing' && (
        <div className="flex items-center gap-4 border border-ops-yellow/30 bg-ops-yellow/5 p-5 mb-8">
          <Spinner size={20} />
          <div>
            <p className="font-mono text-xs text-ops-yellow tracking-widest">ANALYZING TRANSCRIPT</p>
            <p className="text-ops-muted text-xs mt-1">Claude is extracting intelligence. This takes 15–30 seconds.</p>
          </div>
        </div>
      )}

      {meeting.status === 'ready' && (
        <div className="space-y-10">
          {/* DECISIONS */}
          <div>
            <SectionHeader label="DECISION DNA" count={decisions.length} />
            {decisions.length === 0
              ? <p className="font-mono text-xs text-ops-dim">No decisions extracted.</p>
              : (
                <div className="space-y-2">
                  {decisions.map(d => (
                    <div key={d.id} className="bg-ops-card border border-ops-border p-4 gold-glow">
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-[10px] text-ops-gold border border-ops-gold/30 px-2 py-0.5 shrink-0">#{d.id}</span>
                        <div className="flex-1">
                          <p className="text-ops-text text-sm font-medium mb-1">{d.decision}</p>
                          {d.context && <p className="text-ops-muted text-xs mb-2">{d.context}</p>}
                          {d.rationale && (
                            <div className="mb-2 border-l-2 border-ops-gold/50 pl-3">
                              <p className="font-mono text-[10px] text-ops-gold tracking-widest mb-1">RATIONALE</p>
                              <p className="text-ops-muted text-xs">{d.rationale}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`font-mono text-[10px] px-2 py-0.5 border ${d.confidence === 'High' ? 'text-ops-green border-ops-green/30 bg-ops-green/10' : d.confidence === 'Low' ? 'text-ops-red border-ops-red/30 bg-ops-red/10' : 'text-ops-yellow border-ops-yellow/30 bg-ops-yellow/10'}`}>
                              CONFIDENCE {d.confidence || 'MEDIUM'}
                            </span>
                            {d.dissenters?.length > 0 && <span className="font-mono text-[10px] px-2 py-0.5 border border-ops-red/30 text-ops-red">DISSENT {d.dissenters.length}</span>}
                          </div>
                          {d.stakeholders?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {d.stakeholders.map(s => (
                                <span key={s} className="font-mono text-[10px] border border-ops-border text-ops-muted px-2 py-0.5">{s}</span>
                              ))}
                            </div>
                          )}
                          {d.dissenters?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {d.dissenters.map(s => (
                                <span key={s} className="font-mono text-[10px] border border-ops-red/30 text-ops-red px-2 py-0.5">{s}</span>
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
            <SectionHeader icon={<AlertTriangle size={14} />} label="CROSS-MEETING CONFLICT DETECTOR" count={conflicts.length} />
            {conflicts.length === 0
              ? <p className="font-mono text-xs text-ops-dim">No contradictions detected against previous mission files.</p>
              : (
                <div className="space-y-2">
                  {conflicts.map((c, i) => (
                    <div key={`${c.topic}-${i}`} className="border border-ops-red/30 bg-ops-red/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={13} className="text-ops-red" />
                        <p className="font-mono text-[10px] text-ops-red tracking-widest">{c.severity || 'MEDIUM'} CONFLICT · {c.topic?.toUpperCase() || 'DECISION DRIFT'}</p>
                      </div>
                      <p className="text-xs text-ops-muted mb-1"><span className="text-ops-text">Current:</span> {c.current_decision}</p>
                      <p className="text-xs text-ops-muted"><span className="text-ops-text">Previous ({c.previous_meeting}):</span> {c.previous_decision}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* TIMELINE REPLAY */}
          <div>
            <SectionHeader icon={<Orbit size={14} />} label="TIMELINE REPLAY" count={timeline.length} />
            <div className="border border-ops-border bg-ops-card/60 p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                {timelineSpeakers.map(sp => (
                  <span key={sp} className="font-mono text-[10px] border border-ops-border text-ops-muted px-2 py-0.5">{sp}</span>
                ))}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {timeline.map(item => (
                  <div key={item.idx} className="grid grid-cols-[92px_120px_1fr] gap-3 items-start timeline-row">
                    <span className="font-mono text-[10px] text-ops-dim">{item.time || `SEG ${item.idx + 1}`}</span>
                    <span className="font-mono text-[10px] text-ops-gold">{item.speaker || 'Unknown'}</span>
                    <div className="relative border border-ops-border/70 bg-ops-dark/70 px-3 py-2">
                      <span className={`absolute left-0 top-0 h-full w-1 ${item.tag.includes('risk') ? 'bg-ops-red' : item.tag.includes('decision') ? 'bg-ops-gold' : item.tag.includes('action') ? 'bg-ops-yellow' : 'bg-ops-border'}`} />
                      <p className="text-xs text-ops-muted pl-2">{item.text}</p>
                    </div>
                  </div>
                ))}
                {timeline.length === 0 && <p className="font-mono text-xs text-ops-dim">No timeline segments available for this transcript.</p>}
              </div>
            </div>
          </div>

          {/* ACTION ITEMS */}
          <div>
            <SectionHeader label="ORDERS — ACTION ITEMS" count={actions.length} />
            {actions.length === 0
              ? <p className="font-mono text-xs text-ops-dim">No action items extracted.</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-ops-border">
                        {['#', 'TASK', 'OWNER', 'DEADLINE', 'PRIORITY'].map(h => (
                          <th key={h} className="text-left font-mono text-[10px] text-ops-muted tracking-widest py-2 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map(a => (
                        <tr key={a.id} className="border-b border-ops-border/50 hover:bg-ops-card transition-colors">
                          <td className="py-3 pr-4 font-mono text-[10px] text-ops-gold">#{a.id}</td>
                          <td className="py-3 pr-4 text-ops-text text-sm">{a.task}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-ops-muted">{a.owner}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-ops-muted">{a.deadline}</td>
                          <td className="py-3"><PriorityBadge priority={a.priority} /></td>
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
            <SectionHeader label="CONTEXTUAL QUERY" />
            <ChatPanel meetingId={id} />
          </div>
        </div>
      )}

      {showBrief && <BriefCard brief={brief} loading={briefLoading} onClose={() => setShowBrief(false)} />}
    </div>
  )
}