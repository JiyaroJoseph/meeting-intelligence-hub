import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { chat, getMeetings } from '../api/client'
import { Spinner, Skeleton } from './UI'
import { Bot, MessageSquare, Sparkles, Send, Search, Library, ArrowUpRight, Quote } from 'lucide-react'

const suggestions = [
  'Why did we decide to delay the API launch?',
  'What were the three main concerns raised by the Finance Lead?',
  'Which tasks were assigned to Neha across all meetings?',
  'What decisions appear consistent across multiple meetings?'
]

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function CrossTranscriptChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingId, setTypingId] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [loadingMeetings, setLoadingMeetings] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const readyMeetings = useMemo(() => meetings.filter((meeting) => meeting.status === 'ready'), [meetings])

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const res = await getMeetings()
        const data = Array.isArray(res) ? res : res?.data || []
        setMeetings(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingMeetings(false)
      }
    }

    fetchMeetings()
    const interval = setInterval(fetchMeetings, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (messages.length === 0) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (typingId === null) return
    const target = messages.find((message) => message.id === typingId)
    if (!target || target.role !== 'assistant') return
    const full = target.data?.fullAnswer || ''
    const shown = target.data?.answer || ''
    if (shown.length >= full.length) {
      setTypingId(null)
      return
    }

    const timer = setTimeout(() => {
      setMessages((prev) => prev.map((message) => (
        message.id === typingId
          ? { ...message, data: { ...message.data, answer: full.slice(0, shown.length + 4) } }
          : message
      )))
    }, 16)

    return () => clearTimeout(timer)
  }, [messages, typingId])

  const send = async () => {
    const query = input.trim()
    if (!query || loading) return

    setInput('')
    const messageId = Date.now()
    setMessages((prev) => [...prev, { id: messageId, role: 'user', text: query, createdAt: new Date().toISOString() }])
    setLoading(true)

    try {
      const res = await chat(query)
      const answer = res.data?.answer || 'No answer generated.'
      const assistantId = messageId + 1
      setMessages((prev) => [...prev, {
        id: assistantId,
        role: 'assistant',
        createdAt: new Date().toISOString(),
        data: {
          ...res.data,
          fullAnswer: answer,
          answer: '',
        }
      }])
      setTypingId(assistantId)
    } catch {
      setMessages((prev) => [...prev, {
        id: messageId + 1,
        role: 'assistant',
        createdAt: new Date().toISOString(),
        data: {
          answer: 'Error reaching server.',
          fullAnswer: 'Error reaching server.',
          citations: [],
          confidence: 'Low',
          found_in_transcripts: false,
        }
      }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (event) => {
    if (event.isComposing) return
    const isEnter = event.key === 'Enter' || event.code === 'NumpadEnter'
    if (isEnter && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const applySuggestion = (value) => {
    setInput(value)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      if (inputRef.current) {
        const len = value.length
        inputRef.current.setSelectionRange(len, len)
      }
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_30px_80px_rgba(2,6,23,0.42)]">
        <div className="flex flex-col gap-4 border-b border-white/10 bg-gradient-to-r from-indigo-500/12 via-white/[0.03] to-cyan-500/12 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-200 shadow-[0_0_24px_rgba(99,102,241,0.24)]">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Cross-meeting chat</p>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                  {loadingMeetings ? 'Loading corpus' : `${readyMeetings.length} ready transcripts`}
                </span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Ask one question across every uploaded transcript.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Search, compare, and reason over all ready meetings at once. Answers come back with meeting-level citations and transcript excerpts.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/upload" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition-all hover:-translate-y-0.5 hover:border-indigo-400/25 hover:text-white">
              Upload more
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="flex-1 space-y-4 px-6 py-6">
          {messages.length === 0 && (
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-200">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Try a question like one of these</p>
                    <p className="text-xs text-slate-400">The assistant will search all ready transcripts first.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/65 px-4 py-3 text-left text-sm text-slate-200 transition-all hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-slate-950"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-slate-200">
                  <Library size={16} className="text-indigo-300" />
                  <p className="text-sm font-medium">Corpus coverage</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {loadingMeetings && <Skeleton className="h-8 w-28 rounded-full" />}
                  {!loadingMeetings && readyMeetings.length === 0 && (
                    <p className="text-sm text-slate-400">No ready transcripts yet. Upload files and wait for analysis to complete.</p>
                  )}
                  {!loadingMeetings && readyMeetings.map((meeting) => (
                    <span key={meeting.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/75 px-3 py-1.5 text-[11px] text-slate-300">
                      <MessageSquare size={10} className="text-cyan-300" />
                      {meeting.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`animate-slide-up flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'user'
                ? (
                  <div className="max-w-[84%] rounded-3xl rounded-br-md border border-indigo-400/15 bg-indigo-500/12 px-4 py-3 shadow-[0_10px_30px_rgba(79,70,229,0.12)]">
                    <p className="text-sm leading-6 text-white">{message.text}</p>
                    <p className="mt-2 text-right text-[11px] text-slate-500">You • {formatTime(message.createdAt)}</p>
                  </div>
                )
                : (
                  <div className="max-w-[90%] space-y-3 rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        <Bot size={12} />
                        Answer
                      </div>
                      <p className="mt-2 text-sm leading-7 text-white">{message.data.answer}</p>
                      <p className="mt-2 text-[11px] text-slate-500">Assistant • {formatTime(message.createdAt)}</p>
                    </div>

                    {message.data.citations?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Sources</p>
                        {message.data.citations.map((citation, index) => (
                          <div key={`${citation.meeting}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <Quote size={12} className="text-cyan-300" />
                              <p className="text-xs font-semibold text-indigo-200">{citation.meeting}{citation.speaker ? ` · ${citation.speaker}` : ''}</p>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-300">{citation.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${message.data.confidence === 'High' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : message.data.confidence === 'Medium' ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : 'border-rose-400/30 bg-rose-500/10 text-rose-200'}`}>
                      Confidence: {message.data.confidence}
                    </span>
                  </div>
                )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-indigo-200">
                <Spinner size={16} />
              </div>
              <div className="space-y-2 rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3">
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          )}

          {!loading && typingId !== null && (
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-indigo-200">
                <Spinner size={16} />
              </div>
              <div className="rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Spinner size={14} />
                  <span className="text-xs">Analyzing transcripts</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
            className="flex items-end gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 transition-colors focus-within:border-cyan-400/30 focus-within:bg-white/[0.06]"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about decisions, risks, owners, or cross-meeting patterns"
              rows={1}
              className="min-h-[46px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button type="submit" disabled={!input.trim() || loading} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white transition-all hover:scale-105 disabled:opacity-40">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_50px_rgba(2,6,23,0.3)]">
          <div className="flex items-center gap-2">
            <Search size={15} className="text-cyan-300" />
            <p className="text-sm font-medium text-white">How it works</p>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
            <li>Searches all ready transcripts by default.</li>
            <li>Finds the most relevant lines and sends them to the model for synthesis.</li>
            <li>Returns meeting-level citations so you can verify the answer quickly.</li>
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2">
            <Library size={15} className="text-indigo-300" />
            <p className="text-sm font-medium text-white">Ready transcripts</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {loadingMeetings && <Skeleton className="h-8 w-24 rounded-full" />}
            {!loadingMeetings && readyMeetings.length === 0 && <p className="text-sm text-slate-400">Nothing is ready yet.</p>}
            {!loadingMeetings && readyMeetings.map((meeting) => (
              <span key={meeting.id} className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/70 px-3 py-1.5 text-[11px] text-slate-300">
                {meeting.name}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
