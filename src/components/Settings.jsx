import { useState, useEffect } from 'react'
import { CATEGORIES } from '../lib/topics'
import { getActiveCategories, setActiveCategories } from '../lib/storage'
import { enableReminder, disableReminder, getReminderStatus } from '../lib/reminder'

export default function Settings({ onClose }) {
  const [active, setActive] = useState(() => getActiveCategories())
  const [reminderStatus, setReminderStatus] = useState('inactive')
  const [reminderMessage, setReminderMessage] = useState('')

  useEffect(() => {
    getReminderStatus().then(setReminderStatus)
  }, [])

  function toggle(id) {
    setActive(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev // never deselect all
        return prev.filter(c => c !== id)
      }
      return [...prev, id]
    })
  }

  function save() {
    setActiveCategories(active)
    onClose()
  }

  async function handleEnableReminder() {
    setReminderMessage('')
    const result = await enableReminder()
    if (result.ok) {
      setReminderStatus('active')
      setReminderMessage('')
    } else {
      setReminderMessage(result.reason)
    }
  }

  async function handleDisableReminder() {
    await disableReminder()
    setReminderStatus('inactive')
    setReminderMessage('')
  }

  function statusLabel() {
    if (reminderStatus === 'active') return 'Active'
    if (reminderStatus === 'unsupported') return 'Not supported on this device'
    return 'Inactive'
  }

  return (
    <div className="settings-panel">
      <h2 className="settings-title">What do you want to learn?</h2>
      <p className="settings-subtitle">
        Toggle categories on or off. Changes take effect with tomorrow's lesson.
      </p>

      <div className="category-list" role="group" aria-label="Learning categories">
        {CATEGORIES.map(cat => {
          const isActive = active.includes(cat.id)
          return (
            <button
              key={cat.id}
              className={`category-toggle${isActive ? ' active' : ''}`}
              onClick={() => toggle(cat.id)}
              aria-pressed={isActive}
            >
              <div className="category-toggle-row">
                <span className="category-name">{cat.name}</span>
                <span className="category-check" aria-hidden="true">
                  {isActive ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,7 6,11 12,3" />
                    </svg>
                  ) : null}
                </span>
              </div>
              <span className="category-desc">{cat.description}</span>
            </button>
          )
        })}
      </div>

      <div className="reminder-section">
        <p className="reminder-title">Daily Reminder</p>
        <p className={`reminder-status${reminderStatus === 'active' ? ' active' : ''}`}>
          {statusLabel()}
        </p>
        {reminderStatus === 'active' ? (
          <button className="btn-secondary" onClick={handleDisableReminder}>
            Disable reminder
          </button>
        ) : (
          <button
            className="btn-secondary"
            onClick={handleEnableReminder}
            disabled={reminderStatus === 'unsupported'}
          >
            Enable daily reminder
          </button>
        )}
        {reminderMessage && (
          <p className="reminder-note" style={{ marginTop: '0.6rem', color: 'var(--text-muted)' }}>
            {reminderMessage}
          </p>
        )}
        <p className="reminder-note">
          Works on Chrome Android with Lectio installed on your home screen. Timing is approximate.
        </p>
      </div>

      <button className="btn-primary" onClick={save}>Save &amp; close</button>
    </div>
  )
}
