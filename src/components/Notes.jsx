import { useState, useEffect, useRef } from 'react'
import { getNoteForDate, setNoteForDate } from '../lib/storage'

export default function Notes({ date }) {
  const [text, setText] = useState(() => getNoteForDate(date))
  const timerRef = useRef(null)

  useEffect(() => {
    setText(getNoteForDate(date))
  }, [date])

  function handleChange(e) {
    const value = e.target.value
    setText(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setNoteForDate(date, value)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="notes-section">
      <p className="notes-label">Notes</p>
      <textarea
        className="notes-input"
        value={text}
        onChange={handleChange}
        placeholder="Your thoughts…"
        aria-label="Personal notes for today's lesson"
      />
    </div>
  )
}
