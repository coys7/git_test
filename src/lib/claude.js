const SYSTEM_PROMPT = `You are the content engine for Lectio, a daily learning app. Generate a single micro-lesson on the topic provided.

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

const DEEPER_SYSTEM_PROMPT = `You are the content engine for Lectio, a daily learning app. The user has just read a lesson and wants to go deeper on the topic.

Rules:
- Length: 300-400 words. No more.
- Voice: More speculative, more personal — like the professor keeping you after class to tell you the thing they couldn't say in the lesson.
- Go somewhere the main lesson didn't: a counterargument, a related figure, a modern implication, a primary source worth seeking out, or a surprising historical footnote.
- No bullet points. Flowing prose only.
- Do NOT repeat content from the original lesson.
- Return plain text only — no JSON, no headers, no labels.`

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

export async function generateDeeper(lesson) {
  const userMessage = `The user just finished this lesson:\n\nTitle: ${lesson.title}\nCategory: ${lesson.category}\n\nLesson body:\n${lesson.body}\n\nGo deeper.`
  return callClaude(DEEPER_SYSTEM_PROMPT, userMessage, 800)
}
