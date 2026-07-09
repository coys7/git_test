import { useState } from 'react'

const PIN = import.meta.env.VITE_ACCESS_PIN

export default function PinGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => {
    if (!PIN) return true
    return sessionStorage.getItem('paideia_access') === PIN
  })
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  if (!PIN || unlocked) return children

  function attempt() {
    if (input.trim() === PIN) {
      sessionStorage.setItem('paideia_access', PIN)
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
      setTimeout(() => setError(false), 1800)
    }
  }

  return (
    <div className="pin-gate">
      <div className="pin-gate-inner">
        <span className="pin-gate-wordmark">Paideia</span>
        <p className="pin-gate-label">Enter access code</p>
        <input
          className="pin-gate-input"
          type="password"
          inputMode="numeric"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          autoFocus
          autoComplete="off"
          placeholder="••••••"
        />
        {error && <p className="pin-gate-error">Incorrect code</p>}
        <button className="btn-primary pin-gate-btn" onClick={attempt}>
          Unlock
        </button>
      </div>
    </div>
  )
}
