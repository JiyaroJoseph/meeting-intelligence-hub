import { useMemo, useState } from 'react'
import { AlertTriangle, Brain, BarChart3, ChevronRight, MessageSquareText, Users } from 'lucide-react'

const POSITIVE = ['agree', 'agreed', 'confirmed', 'confirm', 'yes', 'good idea', 'sounds safer', 'safer', 'proceed', 'prioritize', 'aligned', 'support', 'excited', 'backup']
const NEGATIVE = ['concern', 'risk', 'issue', 'problem', 'unclear', 'delay', 'blocked', 'worry', 'budget', 'exceed', 'not sure', 'sponsorship', 'difficulty', 'frustrat']
const UNCERTAIN = ['maybe', 'might', 'could', 'should', 'perhaps', 'not sure', 'unclear', 'think', 'guess', 'question']

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function parseSeconds(time) {
  if (!time) return null
  const parts = String(time).trim().split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return null
}

function analyzeText(text) {
  const lower = (text || '').toLowerCase()
  const positive = POSITIVE.filter((term) => lower.includes(term)).length
  const negative = NEGATIVE.filter((term) => lower.includes(term)).length
  const uncertain = UNCERTAIN.filter((term) => lower.includes(term)).length
  const score = positive - negative

  let tone = 'neutral'
  let label = 'Neutral'
  let emoji = '◌'

  if (negative >= 2 || /(?:risk|concern|delay|blocked|cannot|can't|unclear)/.test(lower)) {
    tone = 'conflict'
    label = 'Conflict'
    emoji = '⛔'
  } else if (positive >= 2 || /(?:agreed|confirmed|proceed|good idea|sounds safer|prioritize)/.test(lower)) {
    tone = 'consensus'
    label = 'Agreement'
    emoji = '✅'
  } else if (uncertain >= 2 || /(?:maybe|might|could|should|not sure|unclear)/.test(lower)) {
    tone = 'uncertainty'
    label = 'Uncertainty'
    emoji = '⚠️'
  }

  return { score, tone, label, emoji, positive, negative, uncertain }
}

function toneClasses(tone) {
  switch (tone) {
    case 'consensus':
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
    case 'conflict':
      return 'border-rose-400/20 bg-rose-500/10 text-rose-100'
    case 'uncertainty':
      return 'border-amber-400/20 bg-amber-500/10 text-amber-100'
    default:
      return 'border-slate-700 bg-slate-900/70 text-slate-200'
  }
}

function toneColor(tone, score) {
  if (tone === 'conflict') return 'linear-gradient(90deg, rgba(244,63,94,0.95), rgba(251,146,60,0.88))'
  if (tone === 'consensus') return 'linear-gradient(90deg, rgba(52,211,153,0.95), rgba(34,197,94,0.88))'
  if (tone === 'uncertainty') return 'linear-gradient(90deg, rgba(245,158,11,0.95), rgba(250,204,21,0.88))'
  if (score > 0) return 'linear-gradient(90deg, rgba(52,211,153,0.75), rgba(125,211,252,0.7))'
  if (score < 0) return 'linear-gradient(90deg, rgba(248,113,113,0.75), rgba(251,146,60,0.7))'
  return 'linear-gradient(90deg, rgba(148,163,184,0.65), rgba(100,116,139,0.55))'
}

function summarizeTone(avgScore, conflictCount, agreementCount) {
  if (conflictCount > agreementCount && avgScore <= 0) return { label: 'Tense', tone: 'conflict', emoji: '⛔' }
  if (agreementCount > conflictCount && avgScore >= 0.5) return { label: 'Positive', tone: 'consensus', emoji: '✅' }
  if (conflictCount > 0 || avgScore < 0) return { label: 'Mixed', tone: 'uncertainty', emoji: '⚠️' }
  return { label: 'Balanced', tone: 'neutral', emoji: '◌' }
}

function shortText(text, limit = 96) {
  const value = String(text || '').trim()
  if (value.length <= limit) return value
  return `${value.slice(0, limit - 1).trim()}…`
}

function bucketLabel(seconds, fallbackIndex) {
  if (seconds === null) return `Block ${fallbackIndex + 1}`
  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

export default function ToneDashboard({ meeting }) {
  const [selectedSegment, setSelectedSegment] = useState(null)
  const [openMoment, setOpenMoment] = useState(null)

  const analysis = useMemo(() => {
    const segments = Array.isArray(meeting?.segments) ? meeting.segments : []

    const segmentAnalyses = segments.map((segment, index) => {
      const text = segment?.text || ''
      const speaker = segment?.speaker || 'Unknown'
      const seconds = parseSeconds(segment?.time)
      const scoreInfo = analyzeText(text)
      return { ...segment, index, seconds, speaker, text, ...scoreInfo }
    })

    const timeline = []
    const useTimeBuckets = segmentAnalyses.some((segment) => segment.seconds !== null)
    if (useTimeBuckets) {
      const grouped = new Map()
      segmentAnalyses.forEach((segment) => {
        const bucketStart = Math.floor((segment.seconds || 0) / 300) * 300
        const key = String(bucketStart)
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key).push(segment)
      })
      Array.from(grouped.entries())
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .forEach(([bucketStart, items], bucketIndex) => {
          const avgScore = items.reduce((total, item) => total + item.score, 0) / items.length
          const dominant = items.reduce((best, item) => (!best || Math.abs(item.score) > Math.abs(best.score) ? item : best), null)
          timeline.push({
            label: bucketLabel(Number(bucketStart), bucketIndex),
            items,
            score: avgScore,
            dominant,
            index: bucketIndex,
          })
        })
    } else {
      for (let i = 0; i < segmentAnalyses.length; i += 5) {
        const items = segmentAnalyses.slice(i, i + 5)
        const avgScore = items.reduce((total, item) => total + item.score, 0) / (items.length || 1)
        const dominant = items.reduce((best, item) => (!best || Math.abs(item.score) > Math.abs(best.score) ? item : best), null)
        timeline.push({
          label: `Block ${timeline.length + 1}`,
          items,
          score: avgScore,
          dominant,
          index: timeline.length,
        })
      }
    }

    const speakers = new Map()
    segmentAnalyses.forEach((segment) => {
      const current = speakers.get(segment.speaker) || { name: segment.speaker, count: 0, positive: 0, negative: 0, uncertainty: 0, total: 0, examples: [] }
      current.count += 1
      current.positive += segment.positive
      current.negative += segment.negative
      current.uncertainty += segment.uncertain
      current.total += segment.score
      if (segment.tone !== 'neutral') current.examples.push(segment)
      speakers.set(segment.speaker, current)
    })

    const speakerList = [...speakers.values()]
      .map((speaker) => ({
        ...speaker,
        avg: speaker.count ? speaker.total / speaker.count : 0,
        ratio: speaker.positive + speaker.negative > 0 ? speaker.positive / (speaker.positive + speaker.negative) : 0.5,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    const conflictSegments = segmentAnalyses
      .filter((segment) => segment.tone === 'conflict' || segment.tone === 'uncertainty')
      .sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || (b.negative + b.uncertain) - (a.negative + a.uncertain))
      .slice(0, 3)

    const agreementCount = segmentAnalyses.filter((segment) => segment.tone === 'consensus').length
    const conflictCount = segmentAnalyses.filter((segment) => segment.tone === 'conflict').length
    const avgScore = segmentAnalyses.reduce((total, segment) => total + segment.score, 0) / (segmentAnalyses.length || 1)
    const overall = summarizeTone(avgScore, conflictCount, agreementCount)

    return { segmentAnalyses, timeline, speakerList, conflictSegments, agreementCount, conflictCount, overall }
  }, [meeting])

  const selected = selectedSegment || analysis.timeline[0]?.dominant || analysis.segmentAnalyses[0] || null

  if (!analysis.segmentAnalyses.length) {
    return <div className="text-sm text-slate-400">No transcript segments available for tone analysis.</div>
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneClasses(analysis.overall.tone)}`}>
          <Brain size={14} /> Overall vibe: {analysis.overall.label}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-slate-200">
          Conflict count <span className="text-rose-300">{analysis.conflictCount}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1.5 text-slate-200">
          Agreement count <span className="text-emerald-300">{analysis.agreementCount}</span>
        </span>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
          <BarChart3 size={16} className="text-indigo-300" /> Timeline
        </div>
        <div className="rounded-2xl bg-white/[0.03] p-3">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {analysis.timeline.map((bucket) => {
              const labelTone = bucket.dominant?.tone || 'neutral'
              const active = selected && selected.index === bucket.dominant?.index
              return (
                <button
                  key={`${bucket.label}-${bucket.index}`}
                  type="button"
                  onClick={() => setSelectedSegment(bucket.dominant || bucket.items[0])}
                  className={`h-5 min-w-[32px] flex-1 rounded-full transition-all ${active ? 'ring-1 ring-white/50 scale-y-110' : 'opacity-80 hover:opacity-100'}`}
                  style={{ background: toneColor(labelTone, bucket.score) }}
                  aria-label={`Select ${bucket.label}`}
                />
              )
            })}
          </div>
          {selected && (
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
              <div className="min-w-0">
                <p className="font-medium text-slate-200">Selected: {selected.speaker}{selected.time ? ` • ${selected.time}` : ''}</p>
                <p className="mt-1 line-clamp-1">{shortText(selected.text, 120)}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2.5 py-1 ${toneClasses(selected.tone)}`}>{selected.emoji} {selected.label}</span>
            </div>
          )}
          {selected && (
            <div className="mt-3 rounded-xl bg-slate-950/60 px-4 py-3 text-sm leading-7 text-slate-100">
              <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <MessageSquareText size={13} className="text-cyan-300" /> Transcript excerpt
              </div>
              {selected.text}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
            <Users size={16} className="text-cyan-300" /> Top 3 speakers
          </div>
          <div className="space-y-3">
            {analysis.speakerList.map((speaker) => {
              const positiveShare = clamp(speaker.ratio, 0, 1)
              const negativeShare = 1 - positiveShare
              const selectedSpeaker = selected?.speaker === speaker.name
              return (
                <button
                  key={speaker.name}
                  type="button"
                  onClick={() => {
                    const next = speaker.examples[0] || analysis.segmentAnalyses.find((segment) => segment.speaker === speaker.name) || null
                    setSelectedSegment(next)
                  }}
                  className={`w-full rounded-2xl px-1 py-2 text-left transition-all ${selectedSpeaker ? 'bg-white/[0.04]' : 'hover:bg-white/[0.03]'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">{speaker.name}</p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div className="flex h-full w-full">
                      <div className="h-full bg-emerald-400" style={{ width: `${positiveShare * 100}%` }} />
                      <div className="h-full bg-rose-400" style={{ width: `${negativeShare * 100}%` }} />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
            <AlertTriangle size={16} className="text-amber-300" /> Flagged moments
          </div>
          <div className="space-y-2">
            {analysis.conflictSegments.map((segment, index) => {
              const key = `${segment.speaker}-${segment.index}-${index}`
              const open = openMoment === key
              return (
                <details
                  key={key}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                  open={open}
                  onToggle={(event) => setOpenMoment(event.currentTarget.open ? key : null)}
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${segment.tone === 'conflict' ? 'border-rose-400/25 bg-rose-500/10 text-rose-100' : 'border-amber-400/25 bg-amber-500/10 text-amber-100'}`}>
                          {segment.tone === 'conflict' ? 'Conflict' : 'Uncertainty'}
                        </span>
                        <span className="text-xs text-slate-400">{segment.speaker}{segment.time ? ` • ${segment.time}` : ''}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{shortText(segment.text, 100)}</p>
                    </div>
                    <ChevronRight size={14} className="mt-1 shrink-0 text-slate-500 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm leading-7 text-white">
                    {segment.text}
                  </div>
                </details>
              )
            })}
            {analysis.conflictSegments.length === 0 && <p className="text-sm text-slate-400">No critical conflict or uncertainty moments found.</p>}
          </div>
        </div>
      </div>

    </section>
  )
}
