import { useState } from 'react'
import { generateQuiz } from '../lib/claude'
import { getTodayQuiz, setTodayQuiz } from '../lib/storage'

const LABELS = ['A', 'B', 'C', 'D']

export default function Quiz({ lesson }) {
  const [quiz, setQuiz] = useState(() => getTodayQuiz())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selections, setSelections] = useState({})
  const [checked, setChecked] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const generated = await generateQuiz(lesson)
      setTodayQuiz(generated)
      setQuiz(generated)
      setSelections({})
      setChecked(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(qIdx, optIdx) {
    if (checked) return
    setSelections(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  function handleCheck() {
    if (Object.keys(selections).length < quiz.questions.length) return
    setChecked(true)
  }

  function getScore() {
    return quiz.questions.reduce((acc, q, i) => acc + (selections[i] === q.answer ? 1 : 0), 0)
  }

  function scoreLabel(score, total) {
    const pct = score / total
    if (pct === 1) return 'Perfect.'
    if (pct >= 0.67) return 'Solid.'
    if (pct >= 0.34) return 'Keep reading.'
    return 'Worth a re-read.'
  }

  if (loading) {
    return (
      <div className="quiz-section">
        <div className="quiz-loading" role="status" aria-live="polite">
          <div className="loading-orb small" />
          <span className="loading-text">Generating questions…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="quiz-section">
        <p className="quiz-error">{error}</p>
        <button className="btn-secondary" onClick={handleGenerate}>Try again</button>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="quiz-section quiz-placeholder">
        <p className="quiz-placeholder-text">Test your understanding with 3 questions.</p>
        <button className="btn-secondary" onClick={handleGenerate}>Generate quiz</button>
      </div>
    )
  }

  const allAnswered = Object.keys(selections).length === quiz.questions.length
  const score = checked ? getScore() : null

  return (
    <div className="quiz-section">
      <p className="quiz-label">Quiz</p>

      <div className="quiz-questions">
        {quiz.questions.map((q, qIdx) => {
          const selected = selections[qIdx]
          const isCorrect = checked && selected === q.answer
          const isWrong = checked && selected !== undefined && selected !== q.answer

          return (
            <div key={qIdx} className="quiz-question">
              <p className="quiz-q-text">{qIdx + 1}. {q.q}</p>
              <div className="quiz-options">
                {q.options.map((opt, oIdx) => {
                  let state = ''
                  if (checked) {
                    if (oIdx === q.answer) state = 'correct'
                    else if (oIdx === selected && selected !== q.answer) state = 'wrong'
                  } else if (selected === oIdx) {
                    state = 'selected'
                  }

                  return (
                    <button
                      key={oIdx}
                      className={`quiz-option${state ? ` quiz-option--${state}` : ''}`}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      disabled={checked}
                      aria-pressed={selected === oIdx}
                    >
                      <span className="quiz-option-label">{LABELS[oIdx]}</span>
                      <span className="quiz-option-text">{opt}</span>
                    </button>
                  )
                })}
              </div>
              {isWrong && (
                <p className="quiz-explanation">{q.explanation}</p>
              )}
              {isCorrect && (
                <p className="quiz-correct-note">Correct.</p>
              )}
            </div>
          )
        })}
      </div>

      {!checked ? (
        <button
          className="btn-primary"
          onClick={handleCheck}
          disabled={!allAnswered}
          style={{ marginTop: '1.25rem' }}
        >
          Check answers
        </button>
      ) : (
        <div className="quiz-score">
          <span className="quiz-score-number">{score} of {quiz.questions.length}</span>
          <span className="quiz-score-label"> — {scoreLabel(score, quiz.questions.length)}</span>
        </div>
      )}
    </div>
  )
}
