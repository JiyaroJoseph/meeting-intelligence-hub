import { useState, useRef, useEffect } from 'react'
import { chat } from '../api/client'
import { Spinner, Skeleton } from './UI'
import { Send, MessageSquare, Sparkles } from 'lucide-react'

export default function ChatPanel({ meetingId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingId, setTypingId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (typingId === null) return
    const target = messages.find(m => m.id === typingId)
    if (!target || target.role !== 'assistant') return
    const full = target.data?.fullAnswer || ''
    const shown = target.data?.answer || ''
    if (shown.length >= full.length) {
      setTypingId(null)
      return
    }
    const timer = setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === typingId
        ? { ...m, data: { ...m.data, answer: full.slice(0, shown.length + 3) } }
        : m
      ))
    }, 18)
    return () => clearTimeout(timer)
  }, [messages, typingId])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    const msgId = Date.now()
    const now = new Date().toISOString()
    setMessages(prev => [...prev, { id: msgId, role: 'user', text: q, createdAt: now }])
    setLoading(true)
    try {
      const res = await chat(q, meetingId ? [meetingId] : null)
      const answer = res.data?.answer || 'No answer generated.'
      const assistantId = msgId + 1
      setMessages(prev => [...prev, {
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
      setMessages(prev => [...prev, {
        id: msgId + 1,
        role: 'assistant',
        createdAt: new Date().toISOString(),
        data: { answer: 'Error reaching server.', fullAnswer: 'Error reaching server.', citations: [], confidence: 'Low', found_in_transcripts: false }
      }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.isComposing) return
    const isEnter = e.key === 'Enter' || e.code === 'NumpadEnter'
    if (isEnter && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const applySuggestion = (text) => {
    setInput(text)
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const len = text.length
        inputRef.current.setSelectionRange(len, len)
      }
    })
  }

  const formatTime = (value) => {
    if (!value) return ''
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="flex h-[540px] flex-col overflow-hidden rounded-3xl border border-white/8 bg-slate-950/60 shadow-[0_20px_60px_rgba(2,6,23,0.25)]">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
          <MessageSquare size={16} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Ask the transcript</p>
          <p className="text-xs text-slate-400">Answers are grounded in the selected meeting</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-white/5 text-indigo-300">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ask anything about this meeting</p>
              <p className="mt-1 text-sm text-slate-400">Try a question about decisions, tasks, or risks.</p>
            </div>
            <div className="grid w-full gap-2 md:max-w-xl md:grid-cols-1">
              {['"What did we decide about the API launch?"', '"Who is responsible for the budget?"', '"What concerns did the Finance Lead raise?"'].map(q => (
                <button key={q} onClick={() => applySuggestion(q.replace(/"/g, ''))} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left text-sm text-slate-300 transition-all hover:-translate-y-0.5 hover:border-indigo-400/20 hover:bg-white/[0.07]">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`animate-slide-up flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user'
              ? (
                <div className="max-w-[82%] rounded-3xl rounded-br-md border border-indigo-400/15 bg-indigo-500/10 px-4 py-3">
                  <p className="text-sm leading-6 text-white">{msg.text}</p>
                  <p className="mt-2 text-right text-[11px] text-slate-500">You • {formatTime(msg.createdAt || new Date())}</p>
                </div>
              )
              : (
                <div className="max-w-[86%] space-y-3 rounded-3xl rounded-bl-md border border-white/8 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm leading-6 text-white">{msg.data.answer}</p>
                    <p className="mt-2 text-[11px] text-slate-500">Assistant • {formatTime(msg.createdAt || new Date())}</p>
                  </div>
                  {msg.data.citations?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Sources</p>
                      {msg.data.citations.map((c, j) => (
                        <div key={j} className="rounded-2xl border border-white/8 bg-slate-950/70 px-3 py-2">
                          <p className="text-xs font-medium text-indigo-300">{c.meeting}{c.speaker ? ` · ${c.speaker}` : ''}</p>
                          <p className="mt-1 text-sm text-slate-300">{c.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className={`text-xs font-medium ${msg.data.confidence === 'High' ? 'text-emerald-300' : msg.data.confidence === 'Medium' ? 'text-amber-300' : 'text-rose-300'}`}>Confidence: {msg.data.confidence}</span>
                </div>
              )
            }
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded-2xl border border-white/8 bg-white/5" />
            <div className="space-y-2 rounded-3xl rounded-bl-md border border-white/8 bg-white/5 px-4 py-3">
              <Skeleton className="h-3 w-56" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        )}

        {!loading && typingId !== null && (
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 rounded-2xl border border-white/8 bg-white/5" />
            <div className="rounded-3xl rounded-bl-md border border-white/8 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Spinner size={14} />
                <span className="text-xs">Generating answer</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/5 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="flex items-end gap-3 rounded-2xl border border-white/8 bg-white/5 p-3 transition-colors focus-within:border-indigo-400/30 focus-within:bg-white/[0.07]"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask a question about this meeting"
            rows={1}
            className="min-h-[44px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button type="submit" disabled={!input.trim() || loading} className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:opacity-40">
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  )
}