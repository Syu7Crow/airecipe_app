type GroqChatResponse = {
  ok: boolean
  message?: string
  completion?: {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }
}

declare global {
  interface Window {
    testGroq: (prompt: string) => Promise<void>
  }
}

export async function testGroqConnection(prompt: string) {
  const trimmedPrompt = prompt.trim()

  if (!trimmedPrompt) {
    console.error('[Groq test] prompt is required')
    return
  }

  try {
    const response = await fetch('/api/groq/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: trimmedPrompt,
          },
        ],
        temperature: 0,
        max_tokens: 32,
      }),
    })

    const payload = (await response.json()) as GroqChatResponse

    if (!response.ok || !payload.ok) {
      console.error('[Groq test] failed:', payload.message ?? response.statusText)
      return
    }

    const content = payload.completion?.choices?.[0]?.message?.content
    console.info('[Groq test] response:', content ?? payload.completion)
  } catch (error) {
    console.error('[Groq test] request failed:', error)
  }
}

window.testGroq = testGroqConnection
console.info('[Groq test] ready: run window.testGroq("your prompt")')
