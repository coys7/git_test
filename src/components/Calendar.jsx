import { useState } from 'react'
import { getHistory, getToday } from '../lib/storage'

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function formatMonthYear(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Calendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(null)

  const history = getHistory()
  const today = getToday()

  // Build a map: date string -> history entry
  const historyMap = {}
  for (const entry of history) {
    historyMap[entry.date] = entry
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }

  function nextMonth() {
    // Don't go past current month
    if (year === now.getFullYear() && month === now.getMonth()) return
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const isNextDisabled = year === now.getFullYear() && month === now.getMonth()

  // Compute days in month and starting weekday
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Pad with empty cells before the first day
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dateStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedEntry = selected ? historyMap[dateStr(selected)] : null

  return (
    <div className="calendar-section">
      <div className="calendar-header">
        <button
          className="cal-nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="10,3 5,8 10,13" />
          </svg>
        </button>
        <span className="cal-month-label">{formatMonthYear(year, month)}</span>
        <button
          className="cal-nav-btn"
          onClick={nextMonth}
          disabled={isNextDisabled}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,3 11,8 6,13" />
          </svg>
        </button>
      </div>

      <div className="cal-grid" role="grid" aria-label={formatMonthYear(year, month)}>
        {DAY_LABELS.map(d => (
          <div key={d} className="cal-day-label" role="columnheader">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="cal-cell cal-cell--empty" />

          const ds = dateStr(day)
          const entry = historyMap[ds]
          const isToday = ds === today
          const isSelected = selected === day

          let stateClass = ''
          if (entry?.completed) stateClass = 'cal-cell--completed'
          else if (entry) stateClass = 'cal-cell--viewed'

          return (
            <button
              key={ds}
              className={`cal-cell ${stateClass}${isToday ? ' cal-cell--today' : ''}${isSelected ? ' cal-cell--selected' : ''}`}
              onClick={() => setSelected(prev => (prev === day ? null : day))}
              aria-label={`${day} ${formatMonthYear(year, month)}${entry?.completed ? ', completed' : entry ? ', viewed' : ''}`}
              aria-pressed={isSelected}
            >
              <span className="cal-day-num">{day}</span>
              {entry?.completed && (
                <svg className="cal-check" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="1.5,5 4,7.5 8.5,2" />
                </svg>
              )}
              {entry && !entry.completed && (
                <span className="cal-dot" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="cal-detail" aria-live="polite">
          {selectedEntry ? (
            <>
              <p className="cal-detail-title">{selectedEntry.title || 'Lesson'}</p>
              {selectedEntry.category && (
                <p className="cal-detail-category">{selectedEntry.category}</p>
              )}
              <p className="cal-detail-status">
                {selectedEntry.completed ? 'Completed' : 'Viewed'}
              </p>
            </>
          ) : (
            <p className="cal-detail-empty">No lesson on this day.</p>
          )}
        </div>
      )}
    </div>
  )
}
