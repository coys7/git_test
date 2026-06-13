import { useState } from 'react'
import GoDeeper from './GoDeeper'
import Quiz from './Quiz'
import Notes from './Notes'
import { getToday } from '../lib/storage'

export default function LessonCard({ lesson, loading, error, completed, onComplete, onReload }) {
  const [showDeeper, setShowDeeper] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [flash, setFlash] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  function handleComplete() {
    onComplete()
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: lesson.title,
          text: 'Today I learned: ' + lesson.title,
          url: window.location.href
        })
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(lesson.title + '\n\n' + lesson.body)
      } catch {}
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1800)
    }
  }

  if (loading) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <div className="loading-orb" />
        <p className="loading-text">Preparing today's lesson…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state" role="alert">
        <svg className="error-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="16" cy="16" r="13" />
          <line x1="16" y1="10" x2="16" y2="17" />
          <circle cx="16" cy="22" r="1" fill="currentColor" stroke="none" />
        </svg>
        <p className="error-message">{error}</p>
        <button className="btn-secondary" onClick={onReload}>Try again</button>
      </div>
    )
  }

  if (!lesson) return null

  const wordCount = lesson.body ? lesson.body.split(/\s+/).filter(Boolean).length : 0
  const readingTime = Math.ceil(wordCount / 200)
  const today = getToday()

  return (
    <div className="lesson-wrapper">
      <article className="lesson-card">
        <div className="lesson-meta">
          <span className="category-tag">{lesson.category}</span>
          <span className="reading-time-sep" aria-hidden="true">·</span>
          <span className="reading-time">{readingTime} min read</span>
        </div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-divider" aria-hidden="true" />

        <div className="lesson-body">
          {lesson.body.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {lesson.reflections?.length > 0 && (
          <div className="reflections" aria-label="Reflection questions">
            <p className="reflections-label">Reflect</p>
            {lesson.reflections.map((q, i) => (
              <p key={i} className="reflection-question">{q}</p>
            ))}
          </div>
        )}

        <Notes date={today} />

        <div className="lesson-actions">
          {completed ? (
            <div className="completed-badge">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="2,7 6,11 12,3" />
              </svg>
              Completed today
            </div>
          ) : (
            <button
              className={`btn-primary${flash ? ' flash' : ''}`}
              onClick={handleComplete}
            >
              {flash ? 'Marked complete' : 'Mark complete'}
            </button>
          )}

          <button
            className="btn-secondary"
            onClick={() => setShowDeeper(v => !v)}
            aria-expanded={showDeeper}
          >
            {showDeeper ? 'Show less' : 'Go deeper →'}
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowQuiz(v => !v)}
            aria-expanded={showQuiz}
          >
            {showQuiz ? 'Hide quiz' : 'Quiz me'}
          </button>

          <button
            className="btn-secondary share-btn"
            onClick={handleShare}
            aria-label="Share lesson"
          >
            {shareCopied ? 'Copied!' : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            )}
          </button>

          <button
            className="icon-btn"
            onClick={onReload}
            aria-label="Get a different lesson"
            title="New lesson"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </article>

      {showQuiz && <Quiz lesson={lesson} />}
      {showDeeper && <GoDeeper lesson={lesson} />}
    </div>
  )
}
