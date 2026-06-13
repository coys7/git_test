const KEYS = {
  TODAY_LESSON: 'lectio_today_lesson',
  STREAK: 'lectio_streak',
  COMPLETED_TOPICS: 'lectio_completed_topics',
  ACTIVE_CATEGORIES: 'lectio_active_categories'
}

const DEFAULT_CATEGORIES = ['philosophy', 'theology', 'political-philosophy', 'history', 'niche-history']

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
