import { useState, useEffect, useRef } from 'react'
import { buildStoaSystemPrompt, streamStoa } from '../lib/claude'
import { getStoaChat, saveStoaChat, getToday } from '../lib/storage'

export default function Stoa({ lesson }) {
  const date = getToday()
  const systemPrompt = buildStoaSystemPrompt(lesson)

  const [messages, setMessages] = useState(() => getStoaChat(date))
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const chips = lesson.reflections || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    saveStoaChat(date, messages)
  }, [messages, date])

  async function send(text) {
    if (!text.trim() || streaming) return
    setError(null)

    const userMsg = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')

    const controller = new AbortController()
    abortRef.current = controller

    setStreaming(true)
    let accumulated = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      await streamStoa(
        systemPrompt,
        newMessages,
        (chunk) => {
          accumulated += chunk
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: accumulated }
            return updated
          })
        },
        controller.signal
      )
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message)
        setMessages(prev => prev.slice(0, -1))
      }
    } finally {
      setStreaming(false)
      abortRef.current = null
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function handleAbort() {
    abortRef.current?.abort()
  }

  return (
    <div className="stoa-section">
      <div className="stoa-header">
        <span className="stoa-label">Stoa</span>
        {messages.length > 0 && (
          <button
            className="stoa-clear"
            onClick={() => setMessages([])}
            title="Clear conversation"
          >
            Clear
          </button>
        )}
      </div>

      {messages.length === 0 && chips.length > 0 && (
        <div className="stoa-chips">
          <p className="stoa-chips-prompt">Start with a reflection…</p>
          {chips.map((chip, i) => (
            <button
              key={i}
              className="stoa-chip"
              onClick={() => send(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="stoa-messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`stoa-msg stoa-msg--${msg.role}`}
            >
              {msg.role === 'assistant' && (
                <span className="stoa-msg-label">Stoa</span>
              )}
              <p className="stoa-msg-text">
                {msg.content}
                {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                  <span className="stoa-cursor" aria-hidden="true" />
                )}
              </p>
            </div>
          ))}
          {error && <p className="stoa-error">{error}</p>}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="stoa-input-row">
        <textarea
          ref={inputRef}
          className="stoa-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this lesson…"
          rows={2}
          disabled={streaming}
        />
        {streaming ? (
          <button className="stoa-send stoa-send--stop" onClick={handleAbort} aria-label="Stop">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            className="stoa-send"
            onClick={() => send(input)}
            disabled={!input.trim()}
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="13" x2="8" y2="3" />
              <polyline points="4,7 8,3 12,7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
