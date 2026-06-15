import { useState, useEffect } from 'react'
import { generateBookRecs } from '../lib/claude'
import { getLibrary, addBooksToLibrary } from '../lib/storage'
import { AMAZON_AFFILIATE_TAG } from '../config'

export default function RecommendedReading({ lesson }) {
  const [books, setBooks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [added, setAdded] = useState(() => new Set(getLibrary().map(b => b.id)))

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        const recs = await generateBookRecs(lesson)
        if (!cancelled) setBooks(recs.map((b, i) => ({ ...b, id: `${lesson.title}-${i}`, category: lesson.category })))
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [lesson.title])

  function handleAdd(book) {
    addBooksToLibrary([book])
    setAdded(prev => new Set([...prev, book.id]))
  }

  return (
    <div className="rec-section">
      <p className="rec-label">Recommended Reading</p>

      {loading && (
        <div className="rec-loading">
          <div className="loading-orb small" />
          <span className="loading-text">Finding books…</span>
        </div>
      )}

      {error && <p className="rec-error">{error}</p>}

      {books && (
        <div className="rec-list">
          {books.map(book => {
            const inLibrary = added.has(book.id)
            const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}&tag=${AMAZON_AFFILIATE_TAG}`

            return (
              <div key={book.id} className="rec-book">
                <div className="rec-book-info">
                  <a
                    className="rec-book-title"
                    href={amazonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {book.title}
                  </a>
                  <span className="rec-book-author">{book.author}</span>
                  <p className="rec-book-why">{book.why}</p>
                </div>
                <button
                  className={`rec-add-btn${inLibrary ? ' rec-add-btn--added' : ''}`}
                  onClick={() => handleAdd(book)}
                  disabled={inLibrary}
                >
                  {inLibrary ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="1.5,5.5 4.5,8.5 9.5,2.5" />
                      </svg>
                      Saved
                    </>
                  ) : 'Add to library'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
