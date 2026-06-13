import { useState } from 'react'
import Header from './components/Header'
import LessonCard from './components/LessonCard'
import Settings from './components/Settings'
import Calendar from './components/Calendar'
import { useLesson } from './hooks/useLesson'
import { useStreak } from './hooks/useStreak'
import { useDarkMode } from './hooks/useDarkMode'

export default function App() {
  const [view, setView] = useState('lesson')
  const { lesson, loading, error, reload } = useLesson()
  const { streak, completed, complete } = useStreak()
  const { dark, toggle: toggleDark } = useDarkMode()

  function toggleSettings() {
    setView(v => (v === 'settings' ? 'lesson' : 'settings'))
  }

  function toggleCalendar() {
    setView(v => (v === 'calendar' ? 'lesson' : 'calendar'))
  }

  return (
    <div className="app">
      <Header
        streak={streak.count}
        onSettingsClick={toggleSettings}
        settingsOpen={view === 'settings'}
        dark={dark}
        onDarkToggle={toggleDark}
        onCalendarClick={toggleCalendar}
      />
      <main>
        {view === 'settings' ? (
          <Settings onClose={() => setView('lesson')} />
        ) : view === 'calendar' ? (
          <Calendar />
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
