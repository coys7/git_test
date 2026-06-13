import { useState } from 'react'
import { getStreak, markTodayComplete, isTodayComplete } from '../lib/storage'

export function useStreak() {
  const [streak, setStreak] = useState(() => getStreak())
  const [completed, setCompleted] = useState(() => isTodayComplete())

  function complete() {
    const newStreak = markTodayComplete()
    setStreak(newStreak)
    setCompleted(true)
  }

  return { streak, completed, complete }
}
