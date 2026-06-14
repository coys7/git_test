const SYSTEM_PROMPT = `You are the content engine for Paideia, a daily learning app. Generate a single micro-lesson on the topic provided.

Rules:
- Length: 350-450 words. No more.
- Voice: Scholarly but readable. Like a brilliant professor in office hours, not a textbook or a Wikipedia article.
- Structure: Open with a hook — a surprising fact, a tension, a question that reframes the topic. Then deliver the substance. Close with why it still matters.
- No bullet points. Flowing prose only.
- End with exactly 2 reflection questions that are genuinely thought-provoking, not softball.
- Return JSON only in this shape:
{
  "title": "...",
  "category": "...",
  "body": "...",
  "reflections": ["...", "..."]
}`

const DEEPER_SYSTEM_PROMPT = `You are the content engine for Paideia, a daily learning app. The user has just read a lesson and wants to go deeper on the topic.

Rules:
- Length: 300-400 words. No more.
- Voice: More speculative, more personal — like the professor keeping you after class to tell you the thing they couldn't say in the lesson.
- Go somewhere the main lesson didn't: a counterargument, a related figure, a modern implication, a primary source worth seeking out, or a surprising historical footnote.
- No bullet points. Flowing prose only.
- Do NOT repeat content from the original lesson.
- Return plain text only — no JSON, no headers, no labels.`

const QUIZ_SYSTEM_PROMPT = `You are the quiz engine for Paideia, a daily learning app. The user has just read a lesson and you must generate exactly 3 multiple-choice questions to test their comprehension.

Rules:
- Each question must be clearly answerable from the lesson content.
- Provide exactly 4 options per question (A, B, C, D).
- Make distractors plausible but clearly wrong on reflection.
- The explanation should be 1–2 sentences clarifying why the correct answer is right.
- Return JSON only in this exact shape, no markdown fences:
{"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."},{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."},{"q":"...","options":["...","...","...","..."],"answer":0,"explanation":"..."}]}`

const BOOK_RECS_PROMPT = `You are the Paideia librarian. Based on the lesson provided, recommend exactly 3 books a curious reader should explore next.

Rules:
- Recommend real, published books that are well-regarded.
- Each book should genuinely connect to the lesson's themes.
- Mix primary sources, accessible histories, and challenging intellectual reads where appropriate.
- The searchQuery field should be a concise search string to find the book on Open Library (e.g. "Meditations Marcus Aurelius").
- Return JSON only — no markdown fences:
{"books":[{"title":"...","author":"...","why":"...","searchQuery":"..."},{"title":"...","author":"...","why":"...","searchQuery":"..."},{"title":"...","author":"...","why":"...","searchQuery":"..."}]}`

const CONNECTED_PROMPT = `You are the Paideia archivist. Given today's lesson and a list of past lessons the user has read, identify 2-3 past lessons that connect most interestingly to today's lesson thematically, intellectually, or historically.

Return JSON only — no markdown fences:
{"connections":[{"date":"YYYY-MM-DD","title":"...","connection":"One sentence explaining the link."}]}`

const WEEKLY_DIGEST_PROMPT = `You are Paideia's weekly synthesis voice. The user has completed the following lessons this week. Write a 250-300 word reflection that finds the surprising connections between them — threads they may not have noticed — and ends with one powerful question to carry into the week ahead.

Return JSON only — no markdown fences:
{"synthesis":"...","question":"..."}`

async function callClaude(system, userMessage, maxTokens) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
  if (!apiKey) {
    throw new Error('API key not found. Copy .env.example to .env and add your Claude API key.')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Request failed (${response.status})`)
  }

  const data = await response.json()
  return data.content[0].text
}

export async function generateLesson(topicPrompt) {
  const text = await callClaude(SYSTEM_PROMPT, topicPrompt, 1024)
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim()
  return JSON.parse(cleaned)
}

export async function generateQuiz(lesson) {
  const userMessage = `Generate a quiz for this lesson:\n\nTitle: ${lesson.title}\nCategory: ${lesson.category}\n\n${lesson.body}`
  const text = await callClaude(QUIZ_SYSTEM_PROMPT, userMessage, 1024)
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim()
  return JSON.parse(cleaned)
}

export async function generateDeeper(lesson) {
  const userMessage = `The user just finished this lesson:\n\nTitle: ${lesson.title}\nCategory: ${lesson.category}\n\nLesson body:\n${lesson.body}\n\nGo deeper.`
  return callClaude(DEEPER_SYSTEM_PROMPT, userMessage, 800)
}

export function buildStoaSystemPrompt(lesson) {
  return `You are the Stoa — a wise, curious companion in the Paideia learning app. You and the user have just read the same lesson together, and you're here to explore it in conversation.

Today's lesson — "${lesson.title}" (${lesson.category}):
${lesson.body}

Reflection questions posed:
${(lesson.reflections || []).map(r => `• ${r}`).join('\n')}

How to engage:
- Be conversational but learned — like a brilliant friend who happens to know a great deal about this.
- Build on the lesson without repeating it verbatim.
- Ask the occasional question to draw the user deeper.
- Embrace nuance, counterargument, and personal application.
- Keep responses to 150-250 words. No bullet lists. Flowing prose.`
}

export async function streamStoa(systemPrompt, messages, onChunk, signal) {
  const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
  if (!apiKey) throw new Error('API key not configured.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Request failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          onChunk(parsed.delta.text)
        }
      } catch {}
    }
  }
}

export async function generateBookRecs(lesson) {
  const userMessage = `Generate book recommendations for this lesson:\n\nTitle: ${lesson.title}\nCategory: ${lesson.category}\n\n${lesson.body}`
  const text = await callClaude(BOOK_RECS_PROMPT, userMessage, 800)
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim()
  return JSON.parse(cleaned).books
}

export async function findConnectedLessons(currentLesson, pastLessons) {
  if (pastLessons.length < 5) return []
  const pastSummary = pastLessons
    .slice(-20)
    .map(e => `${e.date}: "${e.title}" (${e.category})`)
    .join('\n')
  const userMessage = `Today's lesson: "${currentLesson.title}" (${currentLesson.category})\n\nPast lessons:\n${pastSummary}`
  try {
    const text = await callClaude(CONNECTED_PROMPT, userMessage, 512)
    const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim()
    return JSON.parse(cleaned).connections || []
  } catch {
    return []
  }
}

export async function generateWeeklyDigest(completedLessons) {
  const lessonList = completedLessons
    .map(e => `• "${e.title}" (${e.category})`)
    .join('\n')
  const userMessage = `This week's lessons:\n${lessonList}`
  const text = await callClaude(WEEKLY_DIGEST_PROMPT, userMessage, 600)
  const cleaned = text.replace(/^```json\s*|\s*```$/g, '').trim()
  return JSON.parse(cleaned)
}
