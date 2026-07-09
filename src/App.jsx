import { useState } from 'react'
import PinGate from './components/PinGate'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import LessonCard from './components/LessonCard'
import Settings from './components/Settings'
import Calendar from './components/Calendar'
import Archive from './components/Archive'
import Library from './components/Library'
import Stats from './components/Stats'
import About from './components/About'
import WeeklyDigest from './components/WeeklyDigest'
import { useLesson } from './hooks/useLesson'
import { useStreak } from './hooks/useStreak'
import { useDarkMode } from './hooks/useDarkMode'

function isSunday() {
  return new Date().getDay() === 0
}

export default function App() {
  const [view, setView] = useState('lesson')
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showDigest, setShowDigest] = useState(() => isSunday())
  const { lesson, loading, error, reload, undoReload, canUndo } = useLesson()
  const { streak, completed, complete } = useStreak()
  const { dark, toggle: toggleDark } = useDarkMode()

  function handleCalendarClick() {
    setCalendarOpen(v => !v)
    if (view !== 'lesson') setView('lesson')
  }

  function handleNavigate(newView) {
    setCalendarOpen(false)
    setView(newView)
  }

  function handleReload() {
    reload(lesson)
  }

  function renderMain() {
    if (calendarOpen) return <Calendar />
    switch (view) {
      case 'archive': return <Archive />
      case 'library': return <Library lesson={lesson} />
      case 'stats': return <Stats />
      case 'settings': return <Settings onClose={() => setView('lesson')} onAbout={() => setView('about')} />
      case 'about': return <About onClose={() => setView('settings')} />
      default:
        return (
          <>
            {showDigest && isSunday() && (
              <WeeklyDigest onDismiss={() => setShowDigest(false)} />
            )}
            <LessonCard
              lesson={lesson}
              loading={loading}
              error={error}
              completed={completed}
              onComplete={complete}
              onReload={handleReload}
              onUndo={undoReload}
              canUndo={canUndo}
            />
          </>
        )
    }
  }

  return (
    <PinGate>
      <div className="app">
        <Header
          streak={streak.count}
          dark={dark}
          onDarkToggle={toggleDark}
          onCalendarClick={handleCalendarClick}
          calendarOpen={calendarOpen}
        />
        <main>
          {renderMain()}
        </main>
        <BottomNav view={view} onNavigate={handleNavigate} />
      </div>
    </PinGate>
  )
}
