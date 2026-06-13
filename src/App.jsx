import { useState } from 'react'
import Header from './components/Header'
import LessonCard from './components/LessonCard'
import Settings from './components/Settings'
import { useLesson } from './hooks/useLesson'
import { useStreak } from './hooks/useStreak'

export default function App() {
  const [view, setView] = useState('lesson')
  const { lesson, loading, error, reload } = useLesson()
  const { streak, completed, complete } = useStreak()

  function toggleSettings() {
    setView(v => (v === 'settings' ? 'lesson' : 'settings'))
  }

  return (
    <div className="app">
      <Header
        streak={streak.count}
        onSettingsClick={toggleSettings}
        settingsOpen={view === 'settings'}
      />
      <main>
        {view === 'settings' ? (
          <Settings onClose={() => setView('lesson')} />
        ) : (
          <LessonCard
            lesson={lesson}
            loading={loading}
            error={error}
            completed={completed}
            onComplete={complete}
            onReload={reload}
          />
        )}
      </main>
    </div>
  )
}
