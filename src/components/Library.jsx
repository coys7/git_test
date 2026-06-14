import { useState, useEffect, useCallback } from 'react'
import { generateBookRecs } from '../lib/claude'
import { getLibrary, addBooksToLibrary, cycleBookStatus, removeFromLibrary } from '../lib/storage'
import { AMAZON_AFFILIATE_TAG } from '../config'

const STATUS_LABELS = { want: 'Want to read', reading: 'Reading', read: 'Read' }
const STATUS_NEXT = { want: 'reading', reading: 'read', read: 'want' }

function BookCover({ searchQuery, title }) {
  const [coverUrl, setCoverUrl] = useState(null)

  useEffect(() => {
    if (!searchQuery) return
    let cancelled = false

    async function fetchCover() {
      try {
        const q = encodeURIComponent(searchQuery)
        const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i,title`)
        const data = await res.json()
        const coverId = data.docs?.[0]?.cover_i
        if (!cancelled && coverId) {
          setCoverUrl(`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)
        }
      } catch {}
    }

    fetchCover()
    return () => { cancelled = true }
  }, [searchQuery])

  if (!coverUrl) {
    return (
      <div className="book-cover book-cover--placeholder">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </div>
    )
  }

  return (
    <img
      className="book-cover"
      src={coverUrl}
      alt={`Cover of ${title}`}
      loading="lazy"
    />
  )
}

function BookCard({ book, onCycle, onRemove }) {
  const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(book.title + ' ' + book.author)}&tag=${AMAZON_AFFILIATE_TAG}`

  return (
    <div className="book-card">
      <a
        className="book-cover-link"
        href={amazonUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Find "${book.title}" on Amazon`}
      >
        <BookCover searchQuery={book.searchQuery} title={book.title} />
      </a>
      <div className="book-info">
        <a
          className="book-title"
          href={amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {book.title}
        </a>
        <p className="book-author">{book.author}</p>
        <p className="book-why">{book.why}</p>
        <div className="book-actions">
          <button
            className={`book-status book-status--${book.status}`}
            onClick={() => onCycle(book.id)}
            title={`Next: ${STATUS_NEXT[book.status]}`}
          >
            {STATUS_LABELS[book.status]}
          </button>
          <button
            className="book-remove"
            onClick={() => onRemove(book.id)}
            aria-label="Remove from library"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Library({ lesson }) {
  const [library, setLibrary] = useState(() => getLibrary())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!lesson) return
    setLoading(true)
    setError(null)
    try {
      const books = await generateBookRecs(lesson)
      const withIds = books.map((b, i) => ({
        ...b,
        id: `${Date.now()}-${i}`
      }))
      addBooksToLibrary(withIds)
      setLibrary(getLibrary())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [lesson])

  function handleCycle(id) {
    cycleBookStatus(id)
    setLibrary(getLibrary())
  }

  function handleRemove(id) {
    removeFromLibrary(id)
    setLibrary(getLibrary())
  }

  const groups = {
    reading: library.filter(b => b.status === 'reading'),
    want: library.filter(b => b.status === 'want'),
    read: library.filter(b => b.status === 'read')
  }

  return (
    <div className="library-section">
      <div className="library-header">
        <h2 className="view-title">Your Library</h2>
        <button
          className="btn-secondary library-rec-btn"
          onClick={refresh}
          disabled={loading || !lesson}
        >
          {loading ? 'Finding books…' : 'Get recommendations'}
        </button>
      </div>

      {error && <p className="library-error">{error}</p>}

      {library.length === 0 && !loading && (
        <div className="library-empty">
          <p>Get book recommendations based on today's lesson.</p>
          <p className="library-empty-note">Claude will suggest 3 books, and you can add more any time.</p>
        </div>
      )}

      {['reading', 'want', 'read'].map(status => {
        const books = groups[status]
        if (!books.length) return null
        return (
          <div key={status} className="library-group">
            <h3 className="library-group-title">{STATUS_LABELS[status]}</h3>
            <div className="library-grid">
              {books.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  onCycle={handleCycle}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
