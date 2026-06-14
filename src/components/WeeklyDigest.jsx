import { useState, useEffect } from 'react'
import { generateWeeklyDigest } from '../lib/claude'
import { getWeeklyDigest, setWeeklyDigest, getThisWeekCompletedLessons } from '../lib/storage'

export default function WeeklyDigest({ onDismiss }) {
  const [digest, setDigest] = useState(() => getWeeklyDigest())
  const [loading, setLoading] = useState(!getWeeklyDigest())
  const [error, setError] = useState(null)

  useEffect(() => {
    if (digest) return

    const completedThisWeek = getThisWeekCompletedLessons()
    if (completedThisWeek.length < 2) {
      onDismiss()
      return
    }

    async function generate() {
      try {
        const result = await generateWeeklyDigest(completedThisWeek)
        setWeeklyDigest(result)
        setDigest(result)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    generate()
  }, [])

  if (loading) {
    return (
      <div className="digest-banner">
        <div className="digest-loading">
          <div className="loading-orb small" />
          <span className="loading-text">Synthesizing your week…</span>
        </div>
      </div>
    )
  }

  if (error || !digest) return null

  return (
    <div className="digest-banner">
      <div className="digest-inner">
        <div className="digest-header">
          <span className="digest-label">Weekly Digest</span>
          <button className="digest-close" onClick={onDismiss} aria-label="Dismiss digest">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>
        <p className="digest-synthesis">{digest.synthesis}</p>
        {digest.question && (
          <p className="digest-question">{digest.question}</p>
        )}
      </div>
    </div>
  )
}
