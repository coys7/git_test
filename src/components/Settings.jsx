import { useState } from 'react'
import { CATEGORIES } from '../lib/topics'
import { getActiveCategories, setActiveCategories } from '../lib/storage'

export default function Settings({ onClose }) {
  const [active, setActive] = useState(() => getActiveCategories())

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

      <button className="btn-primary" onClick={save}>Save &amp; close</button>
    </div>
  )
}
