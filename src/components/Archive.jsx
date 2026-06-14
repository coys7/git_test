import { useState, useMemo } from 'react'
import { getArchive, getNoteForDate } from '../lib/storage'
import { CATEGORIES } from '../lib/topics'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function Archive() {
  const entries = useMemo(() => [...getArchive()].reverse(), [])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState(null)
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase())
      const matchCat = !filterCat || e.category === filterCat || e.categoryId === filterCat
      return matchSearch && matchCat
    })
  }, [entries, search, filterCat])

  const categories = useMemo(() => {
    const seen = new Set()
    for (const e of entries) seen.add(e.category)
    return [...seen]
  }, [entries])

  if (selected) {
    const note = getNoteForDate(selected.date)
    return (
      <div className="archive-detail">
        <button className="archive-back" onClick={() => setSelected(null)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="10,3 4,8 10,13" />
          </svg>
          Back to archive
        </button>

        <div className="archive-detail-meta">
          <span className="category-tag">{selected.category}</span>
          <span className="archive-detail-date">{formatDate(selected.date)}</span>
          {selected.completed && (
            <span className="archive-detail-badge">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,6 5,9 10,3" />
              </svg>
              Completed
            </span>
          )}
        </div>

        <h2 className="archive-detail-title">{selected.title}</h2>
        <div className="lesson-divider" />

        {selected.body ? (
          <div className="lesson-body">
            {selected.body.split('\n\n').filter(Boolean).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="archive-no-body">Full text not available for this lesson.</p>
        )}

        {selected.reflections?.length > 0 && (
          <div className="reflections">
            <p className="reflections-label">Reflect</p>
            {selected.reflections.map((q, i) => (
              <p key={i} className="reflection-question">{q}</p>
            ))}
          </div>
        )}

        {note && (
          <div className="archive-note">
            <p className="archive-note-label">Your note</p>
            <p className="archive-note-text">{note}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="archive-section">
      <h2 className="view-title">Archive</h2>

      <div className="archive-search-row">
        <div className="archive-search-wrap">
          <svg className="archive-search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="5" />
            <line x1="10.5" y1="10.5" x2="15" y2="15" />
          </svg>
          <input
            className="archive-search"
            type="search"
            placeholder="Search lessons…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="archive-filters">
          <button
            className={`archive-filter${!filterCat ? ' active' : ''}`}
            onClick={() => setFilterCat(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`archive-filter${filterCat === cat ? ' active' : ''}`}
              onClick={() => setFilterCat(cat === filterCat ? null : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="archive-empty">
          {entries.length === 0
            ? 'Lessons you read will appear here.'
            : 'No lessons match your search.'}
        </div>
      ) : (
        <ul className="archive-list">
          {filtered.map(entry => (
            <li key={entry.date}>
              <button
                className="archive-item"
                onClick={() => setSelected(entry)}
              >
                <div className="archive-item-top">
                  <span className="archive-item-cat">{entry.category}</span>
                  <span className="archive-item-date">{formatDate(entry.date)}</span>
                </div>
                <p className="archive-item-title">{entry.title}</p>
                {entry.completed && (
                  <span className="archive-item-check" aria-label="Completed">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1.5,5.5 4.5,8.5 9.5,2.5" />
                    </svg>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
