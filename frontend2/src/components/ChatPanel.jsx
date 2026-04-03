import { useState, useRef, useEffect } from 'react'
import { chat } from '../api/client'
import { Spinner } from './UI'
import { Send, MessageSquare } from 'lucide-react'

export default function ChatPanel({ meetingId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [typingId, setTypingId] = useState(null)
  const bottomRef = useRef(null)

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
    setMessages(prev => [...prev, { id: msgId, role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await chat(q, meetingId ? [meetingId] : null)
      const answer = res.data?.answer || 'No answer generated.'
      const assistantId = msgId + 1
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
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
        data: { answer: 'Error reaching server.', fullAnswer: 'Error reaching server.', citations: [], confidence: 'Low', found_in_transcripts: false }
      }])
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="flex flex-col h-[500px] bg-ops-card border border-ops-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-ops-border">
        <MessageSquare size={14} className="text-ops-gold" />
        <span className="font-mono text-xs tracking-widest text-ops-gold">CONTEXTUAL QUERY ENGINE</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <MessageSquare size={32} className="text-ops-border" strokeWidth={1} />
            <p className="font-mono text-xs text-ops-dim tracking-widest">ASK ANYTHING ABOUT THIS MISSION FILE</p>
            <div className="space-y-1">
              {['"What did we decide about the API launch?"', '"Who is responsible for the budget?"', '"What concerns did the Finance Lead raise?"'].map(q => (
                <button key={q} onClick={() => setInput(q.replace(/"/g, ''))} className="block w-full text-left font-mono text-[10px] text-ops-muted hover:text-ops-gold px-3 py-1.5 border border-ops-border hover:border-ops-gold/30 transition-all">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`animate-slide-up ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
            {msg.role === 'user'
              ? <div className="bg-ops-gold/10 border border-ops-gold/20 px-4 py-2 max-w-[80%]"><p className="text-ops-text text-sm">{msg.text}</p></div>
              : (
                <div className="space-y-3">
                  <div className="bg-ops-dark border border-ops-border px-4 py-3"><p className="text-ops-text text-sm leading-relaxed">{msg.data.answer}</p></div>
                  {msg.data.citations?.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-ops-muted tracking-widest">SOURCES</p>
                      {msg.data.citations.map((c, j) => (
                        <div key={j} className="border border-ops-gold/25 bg-ops-gold/5 glow-citation px-3 py-2">
                          <p className="font-mono text-[10px] text-ops-gold">{c.meeting}{c.speaker ? ` · ${c.speaker}` : ''}</p>
                          <p className="text-ops-muted text-xs italic mt-0.5">{c.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className={`font-mono text-[10px] tracking-widest ${msg.data.confidence === 'High' ? 'text-ops-green' : msg.data.confidence === 'Medium' ? 'text-ops-yellow' : 'text-ops-red'}`}>CONFIDENCE: {msg.data.confidence}</span>
                </div>
              )
            }
          </div>
        ))}
        {loading && <div className="flex items-center gap-2 text-ops-muted"><Spinner size={12} /><span className="font-mono text-[10px] tracking-widest status-processing">ANALYZING...</span></div>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ops-border p-3 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder="Ask about this mission file..." className="flex-1 bg-ops-dark border border-ops-border px-3 py-2 text-ops-text text-sm font-mono placeholder:text-ops-dim focus:outline-none focus:border-ops-gold/40 transition-colors" />
        <button onClick={send} disabled={!input.trim() || loading} className="bg-ops-gold text-ops-black px-4 py-2 hover:bg-ops-gold/80 transition-colors disabled:opacity-40"><Send size={14} /></button>
      </div>
    </div>
  )
}