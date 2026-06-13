import { useState, useEffect, useCallback } from 'react'
import { generateLesson } from '../lib/claude'
import {
  getTodayLesson,
  setTodayLesson,
  clearTodayLesson,
  getActiveCategories,
  getCompletedTopics,
  addCompletedTopic
} from '../lib/storage'
import { getRandomActiveCategory, getTopicPrompt } from '../lib/topics'

export function useLesson() {
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadLesson = useCallback(async (forceReload = false) => {
    setLoading(true)
    setError(null)

    if (!forceReload) {
      const cached = getTodayLesson()
      if (cached) {
        setLesson(cached)
        setLoading(false)
        return
      }
    }

    try {
      const activeCategories = getActiveCategories()
      const categoryId = getRandomActiveCategory(activeCategories)
      const completedTopics = getCompletedTopics()
      const topicPrompt = getTopicPrompt(categoryId, completedTopics)

      const generated = await generateLesson(topicPrompt)
      setTodayLesson(generated)
      if (generated.title) addCompletedTopic(generated.title)
      setLesson(generated)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLesson()
  }, [loadLesson])

  const reload = useCallback(() => {
    clearTodayLesson()
    loadLesson(true)
  }, [loadLesson])

  return { lesson, loading, error, reload }
}
