type ApiResponse<T> =
  | ({ ok: true } & T)
  | {
      ok: false
      message?: string
    }

export type GeminiGenerateResult = {
  model: string
  attemptedModels?: string[]
  skippedModels?: string[]
  usage?: Array<{
    model: string
    limit: number
    used: number
    remaining: number
    resetInMs: number
  }>
  text: string
  images: Array<{
    mimeType: string
    data: string
  }>
  raw: unknown
}

async function readJson<T>(response: Response): Promise<T> {
  const responseText = await response.text()
  let payload: ApiResponse<T>

  try {
    payload = responseText
      ? (JSON.parse(responseText) as ApiResponse<T>)
      : ({ ok: false, message: response.statusText } as ApiResponse<T>)
  } catch {
    throw new Error(
      responseText
        ? `API response was not JSON: ${responseText.slice(0, 120)}`
        : response.statusText,
    )
  }

  if (!response.ok || !payload.ok) {
    throw new Error(
      'message' in payload
        ? (payload.message ?? response.statusText)
        : response.statusText,
    )
  }

  return payload as T
}

export async function generateGeminiContent({
  prompt,
  imageBase64,
  mimeType,
  model,
  responseMimeType,
}: {
  prompt: string
  imageBase64?: string
  mimeType?: string
  model?: string
  responseMimeType?: string
}) {
  const response = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      imageBase64,
      mimeType,
      model,
      responseMimeType,
    }),
  })

  return readJson<GeminiGenerateResult>(response)
}
