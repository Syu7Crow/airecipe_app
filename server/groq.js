import './env.js'

const groqApiKey = process.env.GROQ_API_KEY
export const defaultGroqModel =
  process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
const groqBaseUrl = 'https://api.groq.com/openai/v1'

export const isGroqConfigured = Boolean(groqApiKey)

export function checkGroqConnection() {
  if (!groqApiKey) {
    return {
      ok: false,
      configured: false,
      message: 'Groq is not configured',
    }
  }

  return {
    ok: true,
    configured: true,
    message: 'Groq is configured on the server',
  }
}

export async function requestGroq(path, options = {}) {
  if (!groqApiKey) {
    throw new Error('Groq is not configured')
  }

  const response = await fetch(`${groqBaseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const responseText = await response.text()
  const payload = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    const message = payload?.error?.message ?? 'Groq request failed'
    throw new Error(message)
  }

  return payload
}

export function createGroqChatCompletion(payload) {
  return requestGroq('/chat/completions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
