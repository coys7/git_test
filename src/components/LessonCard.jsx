import { useState } from 'react'
import GoDeeper from './GoDeeper'
import Quiz from './Quiz'
import Notes from './Notes'
import Stoa from './Stoa'
import RecommendedReading from './RecommendedReading'
import { getToday, recordPursuit, recordSkip } from '../lib/storage'

export default function LessonCard({ lesson, loading, error, completed, onComplete, onReload, onUndo, canUndo }) {
  const [showDeeper, setShowDeeper] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showStoa, setShowStoa] = useState(false)
  const [showRecs, setShowRecs] = useState(false)
  const [flash, setFlash] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [tasteSignal, setTasteSignal] = useState(null)

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

  function handlePursue() {
    const catId = lesson._categoryId || lesson.category?.toLowerCase().replace(/\s+/g, '-')
    recordPursuit(catId)
    setTasteSignal('pursued')
    setTimeout(() => setTasteSignal(null), 2000)
  }

  function handleSkip() {
    const catId = lesson._categoryId || lesson.category?.toLowerCase().replace(/\s+/g, '-')
    recordSkip(catId)
    setTasteSignal('skipped')
    setTimeout(() => setTasteSignal(null), 2000)
  }

  if (loading) {
    return (
      <div className="loading-state" role="status" aria-live="polite">
        <div className="loading-orb" />
        <p className="loading-text">Preparing your next lesson…</p>
        {canUndo && (
          <button className="btn-secondary" style={{ marginTop: '1.25rem' }} onClick={onUndo}>
            ← Previous lesson
          </button>
        )}
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
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onReload}>Try again</button>
          {canUndo && (
            <button className="btn-secondary" onClick={onUndo}>← Previous lesson</button>
          )}
        </div>
      </div>
    )
  }

  if (!lesson) return null

  const wordCount = [lesson.body, ...(lesson.reflections || [])].join(' ').split(/\s+/).filter(Boolean).length
  const readingTime = Math.ceil(wordCount / 150)
  const today = getToday()

  return (
    <div className="lesson-wrapper">
      <article className="lesson-card">
        <div className="lesson-meta">
          <span className="category-tag">{lesson.category}</span>
          <span className="reading-time-sep" aria-hidden="true">·</span>
          <span className="reading-time">{readingTime} min read</span>

          {canUndo ? (
            <button className="meta-undo-btn" onClick={onUndo}>
              ← Previous lesson
            </button>
          ) : (
            <button className="meta-new-btn" onClick={onReload} title="Get a new lesson">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="10,2 10,5 7,5" />
                <path d="M10 5A4 4 0 1 1 6.5 2" />
              </svg>
              New
            </button>
          )}
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

          <div className="lesson-actions-secondary">
            <button
              className="btn-secondary"
              onClick={() => setShowDeeper(v => !v)}
              aria-expanded={showDeeper}
            >
              {showDeeper ? 'Less' : 'Go deeper →'}
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowQuiz(v => !v)}
              aria-expanded={showQuiz}
            >
              Quiz me
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowStoa(v => !v)}
              aria-expanded={showStoa}
            >
              Discuss
            </button>

            <button
              className="btn-secondary share-btn"
              onClick={handleShare}
              aria-label="Share lesson"
            >
              {shareCopied ? 'Copied!' : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="taste-row">
          {tasteSignal === 'pursued' && <span className="taste-feedback">Noted — more like this.</span>}
          {tasteSignal === 'skipped' && <span className="taste-feedback">Got it — less of this.</span>}
          {!tasteSignal && (
            <>
              <button className="taste-btn" onClick={handlePursue}>Pursue this topic</button>
              <span className="taste-sep" aria-hidden="true">·</span>
              <button className="taste-btn" onClick={handleSkip}>Skip this category</button>
            </>
          )}
        </div>
      </article>

      <div className="rec-block">
        <button
          className={`rec-trigger${showRecs ? ' rec-trigger--open' : ''}`}
          onClick={() => setShowRecs(v => !v)}
          aria-expanded={showRecs}
        >
          <div className="rec-trigger-text">
            <span className="rec-trigger-title">Recommended reading</span>
            {!showRecs && <span className="rec-trigger-sub">Books related to today's lesson</span>}
          </div>
          <svg
            width="16" height="16" viewBox="0 0 16 16"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: showRecs ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
            aria-hidden="true"
          >
            <polyline points="3,6 8,11 13,6" />
          </svg>
        </button>
        {showRecs && <RecommendedReading lesson={lesson} />}
      </div>
      {showQuiz && <Quiz lesson={lesson} />}
      {showDeeper && <GoDeeper lesson={lesson} />}
      {showStoa && <Stoa lesson={lesson} />}
    </div>
  )
}
