import { useState, useEffect } from 'react'
import { generateDeeper } from '../lib/claude'

export default function GoDeeper({ lesson }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setContent(null)
      try {
        const text = await generateDeeper(lesson)
        if (!cancelled) setContent(text)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [lesson.title])

  return (
    <div className="deeper-section">
      <div className="deeper-label">Going Deeper</div>
      {loading && (
        <div className="deeper-loading">
          <div className="loading-orb small" aria-label="Loading" />
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {content && (
        <div className="deeper-body">
          {content.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}
    </div>
  )
}
