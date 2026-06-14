const KEYS = {
  TODAY_LESSON: 'lectio_today_lesson',
  STREAK: 'lectio_streak',
  COMPLETED_TOPICS: 'lectio_completed_topics',
  ACTIVE_CATEGORIES: 'lectio_active_categories',
  HISTORY: 'lectio_history',
  TODAY_QUIZ: 'lectio_today_quiz',
  NOTES: 'lectio_notes',
  TASTE_PROFILE: 'lectio_taste_profile',
  ARCHIVE: 'lectio_archive',
  STOA_CHATS: 'lectio_stoa_chats',
  LIBRARY: 'lectio_library',
  WEEKLY_DIGEST: 'lectio_weekly_digest'
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

// ===== HISTORY (capped at 30, used by calendar) =====

export function getHistory() {
  try {
    const stored = localStorage.getItem(KEYS.HISTORY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(history) {
  const trimmed = history.slice(-30)
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(trimmed))
}

export function recordLessonViewed(lesson) {
  if (!lesson) return
  const today = getToday()

  const history = getHistory()
  if (!history.find(e => e.date === today)) {
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

  addToArchive(lesson)
}

export function recordLessonCompleted() {
  const today = getToday()

  const history = getHistory()
  const idx = history.findIndex(e => e.date === today)
  if (idx !== -1) {
    history[idx].completed = true
  } else {
    history.push({ date: today, title: '', category: '', completed: true })
  }
  saveHistory(history)

  markArchiveCompleted(today)
}

// ===== ARCHIVE (unlimited, used by Archive view) =====

export function getArchive() {
  try {
    const stored = localStorage.getItem(KEYS.ARCHIVE)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addToArchive(lesson) {
  if (!lesson) return
  const today = getToday()
  const archive = getArchive()
  if (archive.find(e => e.date === today)) return
  archive.push({
    date: today,
    title: lesson.title,
    category: lesson.category,
    categoryId: lesson._categoryId || null,
    body: lesson.body || null,
    reflections: lesson.reflections || null,
    completed: false
  })
  localStorage.setItem(KEYS.ARCHIVE, JSON.stringify(archive))
}

function markArchiveCompleted(date) {
  const archive = getArchive()
  const entry = archive.find(e => e.date === date)
  if (entry) {
    entry.completed = true
    localStorage.setItem(KEYS.ARCHIVE, JSON.stringify(archive))
  }
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
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 60)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    for (const key of Object.keys(notes)) {
      if (key < cutoffStr) delete notes[key]
    }
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes))
  } catch {}
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

// ===== CATEGORIES =====

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

// ===== TASTE PROFILE =====

export function getTasteProfile() {
  try {
    const stored = localStorage.getItem(KEYS.TASTE_PROFILE)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function recordPursuit(categoryId) {
  if (!categoryId) return
  const profile = getTasteProfile()
  const key = `pursue_${categoryId}`
  profile[key] = (profile[key] || 0) + 1
  localStorage.setItem(KEYS.TASTE_PROFILE, JSON.stringify(profile))
}

export function recordSkip(categoryId) {
  if (!categoryId) return
  const profile = getTasteProfile()
  const key = `skip_${categoryId}`
  profile[key] = (profile[key] || 0) + 1
  localStorage.setItem(KEYS.TASTE_PROFILE, JSON.stringify(profile))
}

// ===== STOA CHATS =====

export function getStoaChat(date) {
  try {
    const stored = localStorage.getItem(KEYS.STOA_CHATS)
    const chats = stored ? JSON.parse(stored) : {}
    return chats[date] || []
  } catch {
    return []
  }
}

export function saveStoaChat(date, messages) {
  try {
    const stored = localStorage.getItem(KEYS.STOA_CHATS)
    const chats = stored ? JSON.parse(stored) : {}
    chats[date] = messages
    const keys = Object.keys(chats).sort()
    if (keys.length > 30) {
      for (const k of keys.slice(0, keys.length - 30)) delete chats[k]
    }
    localStorage.setItem(KEYS.STOA_CHATS, JSON.stringify(chats))
  } catch {}
}

// ===== LIBRARY =====

export function getLibrary() {
  try {
    const stored = localStorage.getItem(KEYS.LIBRARY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addBooksToLibrary(books) {
  const library = getLibrary()
  for (const book of books) {
    if (!library.find(b => b.id === book.id)) {
      library.push({ ...book, status: 'want', addedAt: new Date().toISOString() })
    }
  }
  localStorage.setItem(KEYS.LIBRARY, JSON.stringify(library))
}

export function cycleBookStatus(bookId) {
  const library = getLibrary()
  const book = library.find(b => b.id === bookId)
  if (!book) return
  const cycle = ['want', 'reading', 'read']
  const next = cycle[(cycle.indexOf(book.status) + 1) % cycle.length]
  book.status = next
  localStorage.setItem(KEYS.LIBRARY, JSON.stringify(library))
}

export function removeFromLibrary(bookId) {
  const library = getLibrary().filter(b => b.id !== bookId)
  localStorage.setItem(KEYS.LIBRARY, JSON.stringify(library))
}

// ===== WEEKLY DIGEST =====

export function getISOWeekKey() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

export function getWeeklyDigest() {
  try {
    const stored = localStorage.getItem(KEYS.WEEKLY_DIGEST)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed.week !== getISOWeekKey()) return null
    return parsed.digest
  } catch {
    return null
  }
}

export function setWeeklyDigest(digest) {
  localStorage.setItem(KEYS.WEEKLY_DIGEST, JSON.stringify({ week: getISOWeekKey(), digest }))
}

export function getThisWeekCompletedLessons() {
  const archive = getArchive()
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const mondayStr = monday.toISOString().split('T')[0]
  return archive.filter(e => e.completed && e.date >= mondayStr)
}
