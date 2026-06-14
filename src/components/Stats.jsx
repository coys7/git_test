import { useMemo } from 'react'
import { getArchive, getStreak } from '../lib/storage'
import { CATEGORIES } from '../lib/topics'

export default function Stats() {
  const archive = useMemo(() => getArchive(), [])
  const streak = useMemo(() => getStreak(), [])

  const total = archive.length
  const completed = archive.filter(e => e.completed).length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const byCategoryId = useMemo(() => {
    const counts = {}
    for (const entry of archive) {
      const id = entry.categoryId || entry.category
      counts[id] = (counts[id] || 0) + 1
    }
    return counts
  }, [archive])

  const byCategory = useMemo(() => {
    const result = []
    for (const cat of CATEGORIES) {
      const count = byCategoryId[cat.id] || 0
      if (count > 0) result.push({ ...cat, count })
    }
    const knownIds = new Set(CATEGORIES.map(c => c.id))
    for (const [id, count] of Object.entries(byCategoryId)) {
      if (!knownIds.has(id) && count > 0) {
        result.push({ id, name: id, count })
      }
    }
    return result.sort((a, b) => b.count - a.count)
  }, [byCategoryId])

  const maxCount = byCategory.reduce((m, c) => Math.max(m, c.count), 1)

  return (
    <div className="stats-section">
      <h2 className="view-title">Your Learning</h2>

      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-number">{total}</span>
          <span className="stat-label">Lessons read</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{streak.count}</span>
          <span className="stat-label">Day streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{completionRate}%</span>
          <span className="stat-label">Completion rate</span>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="stats-breakdown">
          <h3 className="stats-section-title">By Category</h3>
          <div className="stats-bars">
            {byCategory.map(cat => (
              <div key={cat.id} className="stats-bar-row">
                <span className="stats-bar-label">{cat.name}</span>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ width: `${(cat.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="stats-bar-count">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <p className="stats-empty">Start reading daily lessons to see your stats here.</p>
      )}
    </div>
  )
}
