const KEYS = {
  TODAY_LESSON: 'lectio_today_lesson',
  STREAK: 'lectio_streak',
  COMPLETED_TOPICS: 'lectio_completed_topics',
  ACTIVE_CATEGORIES: 'lectio_active_categories',
  HISTORY: 'lectio_history',
  TODAY_QUIZ: 'lectio_today_quiz',
  NOTES: 'lectio_notes'
}

const DEFAULT_CATEGORIES = ['philosophy', 'theology', 'history', 'niche-history', 'economics', 'science']

export function getToday() {
  return new Date().toISOString().split('T')[0]
}

export function getTodayLesson() {
  try {
    const stored = localStorage.getItem(KEYS.TODAY_LESSON)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed.date !== getToday()) return null
    return parsed.lesson
  } catch {
    return null
  }
}

export function setTodayLesson(lesson) {
  localStorage.setItem(KEYS.TODAY_LESSON, JSON.stringify({ date: getToday(), lesson }))
}

export function clearTodayLesson() {
  localStorage.removeItem(KEYS.TODAY_LESSON)
}

export function getStreak() {
  try {
    const stored = localStorage.getItem(KEYS.STREAK)
    return stored ? JSON.parse(stored) : { count: 0, lastCompleted: null }
  } catch {
    return { count: 0, lastCompleted: null }
  }
}

export function markTodayComplete() {
  const today = getToday()
  const streak = getStreak()
  if (streak.lastCompleted === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const newStreak = {
    count: streak.lastCompleted === yesterdayStr ? streak.count + 1 : 1,
    lastCompleted: today
  }
  localStorage.setItem(KEYS.STREAK, JSON.stringify(newStreak))
  return newStreak
}

export function isTodayComplete() {
  return getStreak().lastCompleted === getToday()
}

export function getCompletedTopics() {
  try {
    const stored = localStorage.getItem(KEYS.COMPLETED_TOPICS)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addCompletedTopic(topic) {
  const topics = getCompletedTopics()
  if (topics.includes(topic)) return
  topics.push(topic)
  if (topics.length > 60) topics.shift()
  localStorage.setItem(KEYS.COMPLETED_TOPICS, JSON.stringify(topics))
}

// ===== HISTORY =====

export function getHistory() {
  try {
    const stored = localStorage.getItem(KEYS.HISTORY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(history) {
  // Keep last 30 entries
  const trimmed = history.slice(-30)
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(trimmed))
}

export function recordLessonViewed(lesson) {
  if (!lesson) return
  const today = getToday()
  const history = getHistory()
  const existingIndex = history.findIndex(e => e.date === today)
  if (existingIndex !== -1) return // idempotent
  history.push({
    date: today,
    title: lesson.title,
    category: lesson.category,
    body: lesson.body || null,
    reflections: lesson.reflections || null,
    completed: false
  })
  saveHistory(history)
}

// ===== NOTES =====

export function getNoteForDate(date) {
  try {
    const stored = localStorage.getItem(KEYS.NOTES)
    if (!stored) return ''
    const notes = JSON.parse(stored)
    return notes[date] || ''
  } catch {
    return ''
  }
}

export function setNoteForDate(date, text) {
  try {
    const stored = localStorage.getItem(KEYS.NOTES)
    const notes = stored ? JSON.parse(stored) : {}
    notes[date] = text
    // Trim entries older than 60 days
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 60)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    for (const key of Object.keys(notes)) {
      if (key < cutoffStr) delete notes[key]
    }
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes))
  } catch {}
}

export function recordLessonCompleted() {
  const today = getToday()
  const history = getHistory()
  const existingIndex = history.findIndex(e => e.date === today)
  if (existingIndex !== -1) {
    history[existingIndex].completed = true
  } else {
    history.push({ date: today, title: '', category: '', completed: true })
  }
  saveHistory(history)
}

// ===== QUIZ =====

export function clearTodayQuiz() {
  localStorage.removeItem(KEYS.TODAY_QUIZ)
}

export function getTodayQuiz() {
  try {
    const stored = localStorage.getItem(KEYS.TODAY_QUIZ)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed.date !== getToday()) return null
    return parsed.quiz
  } catch {
    return null
  }
}

export function setTodayQuiz(quiz) {
  localStorage.setItem(KEYS.TODAY_QUIZ, JSON.stringify({ date: getToday(), quiz }))
}

export function getActiveCategories() {
  try {
    const stored = localStorage.getItem(KEYS.ACTIVE_CATEGORIES)
    if (!stored) return DEFAULT_CATEGORIES
    const parsed = JSON.parse(stored)
    return parsed.length > 0 ? parsed : DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

export function setActiveCategories(categories) {
  localStorage.setItem(KEYS.ACTIVE_CATEGORIES, JSON.stringify(categories))
}
