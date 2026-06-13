import { useState } from 'react'
import GoDeeper from './GoDeeper'
import Quiz from './Quiz'

export default function LessonCard({ lesson, loading, error, completed, onComplete, onReload }) {
  const [showDeeper, setShowDeeper] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [flash, setFlash] = useState(false)

  function handleComplete() {
    onComplete()
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
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

  return (
    <div className="lesson-wrapper">
      <article className="lesson-card">
        <div className="category-tag">{lesson.category}</div>
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
        </div>
      </article>

      {showQuiz && <Quiz lesson={lesson} />}
      {showDeeper && <GoDeeper lesson={lesson} />}
    </div>
  )
}
