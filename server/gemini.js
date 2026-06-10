import './env.js'

const geminiApiKey = process.env.GEMINI_API_KEY
export const geminiModelQueue = [
  { model: 'gemini-3.5-flash', requestsPerMinute: 5 },
  { model: 'gemini-3-flash-preview', requestsPerMinute: 5 },
  { model: 'gemini-2.5-flash', requestsPerMinute: 5 },
  { model: 'gemini-2.5-flash-lite', requestsPerMinute: 10 },
]
export const defaultGeminiModel = geminiModelQueue[0].model
const geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta'
const geminiRateWindowMs = 60 * 1000
const geminiUsageByModel = new Map()

export function checkGeminiConnection() {
  if (!geminiApiKey) {
    return {
      ok: false,
      configured: false,
      message: 'Gemini is not configured',
    }
  }

  return {
    ok: true,
    configured: true,
    message: 'Gemini is configured on the server',
  }
}

function stripDataUrl(value) {
  return String(value ?? '').replace(/^data:[^;]+;base64,/i, '')
}

function extractText(parts = []) {
  return parts
    .map((part) => part?.text)
    .filter(Boolean)
    .join('\n')
    .trim()
}

function extractInlineImages(parts = []) {
  return parts
    .map((part) => part?.inlineData ?? part?.inline_data)
    .filter((part) => part?.data && part?.mimeType)
    .map((part) => ({
      mimeType: part.mimeType,
      data: part.data,
    }))
}

function pruneModelUsage(model, now = Date.now()) {
  const timestamps = geminiUsageByModel.get(model) ?? []
  const freshTimestamps = timestamps.filter(
    (timestamp) => now - timestamp < geminiRateWindowMs,
  )

  geminiUsageByModel.set(model, freshTimestamps)
  return freshTimestamps
}

function getModelLimit(model) {
  return (
    geminiModelQueue.find((item) => item.model === model)?.requestsPerMinute ??
    5
  )
}

function getModelUsage(model, now = Date.now()) {
  const timestamps = pruneModelUsage(model, now)
  const limit = getModelLimit(model)
  const oldestTimestamp = timestamps[0]
  const resetInMs = oldestTimestamp
    ? Math.max(0, geminiRateWindowMs - (now - oldestTimestamp))
    : 0

  return {
    model,
    limit,
    used: timestamps.length,
    remaining: Math.max(0, limit - timestamps.length),
    resetInMs,
  }
}

function reserveModelUsage(model) {
  const now = Date.now()
  const usage = getModelUsage(model, now)

  if (usage.remaining <= 0) {
    return false
  }

  const timestamps = geminiUsageByModel.get(model) ?? []
  timestamps.push(now)
  geminiUsageByModel.set(model, timestamps)
  return true
}

export function getGeminiUsageSnapshot() {
  const now = Date.now()

  return geminiModelQueue.map((item) => getModelUsage(item.model, now))
}

function createRateLimitError(attemptedModels, skippedModels, errors) {
  const usage = getGeminiUsageSnapshot()
  const nextResetInMs = usage
    .map((item) => item.resetInMs)
    .filter((value) => value > 0)
    .sort((a, b) => a - b)[0] ?? geminiRateWindowMs
  const error = new Error('All Gemini models are currently rate limited or failed')

  error.statusCode = errors.length ? 502 : 429
  error.attemptedModels = attemptedModels
  error.skippedModels = skippedModels
  error.modelErrors = errors
  error.usage = usage
  error.retryAfterMs = nextResetInMs
  return error
}

async function requestGeminiModel({ model, body }) {
  if (!reserveModelUsage(model)) {
    const usage = getModelUsage(model)
    const error = new Error(`Gemini model rate limit reached: ${model}`)
    error.statusCode = 429
    error.model = model
    error.usage = usage
    throw error
  }

  const endpoint = `${geminiBaseUrl}/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(geminiApiKey)}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  const payload = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    const error = new Error(payload?.error?.message ?? 'Gemini request failed')
    error.statusCode = response.status
    error.model = model
    throw error
  }

  return payload
}

export async function generateGeminiContent({
  prompt,
  imageBase64,
  mimeType,
  responseMimeType,
  model,
}) {
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is required for Gemini operations')
  }

  if (!prompt?.trim()) {
    throw new Error('prompt is required')
  }

  const parts = [{ text: prompt.trim() }]

  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: stripDataUrl(imageBase64),
      },
    })
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
  }

  if (responseMimeType) {
    body.generationConfig = {
      responseMimeType,
    }
  }

  const candidateModels = model
    ? [
        model,
        ...geminiModelQueue
          .map((item) => item.model)
          .filter((candidateModel) => candidateModel !== model),
      ]
    : geminiModelQueue.map((item) => item.model)
  const attemptedModels = []
  const skippedModels = []
  const errors = []

  for (const candidateModel of candidateModels) {
    if (getModelUsage(candidateModel).remaining <= 0) {
      skippedModels.push(candidateModel)
      continue
    }

    try {
      attemptedModels.push(candidateModel)
      const payload = await requestGeminiModel({
        model: candidateModel,
        body,
      })
      const outputParts = payload?.candidates?.[0]?.content?.parts ?? []

      return {
        model: candidateModel,
        attemptedModels,
        skippedModels,
        usage: getGeminiUsageSnapshot(),
        text: extractText(outputParts),
        images: extractInlineImages(outputParts),
        raw: payload,
      }
    } catch (error) {
      const message = String(error?.message ?? '')

      if (!responseMimeType || !/responseMimeType|generationConfig|mime/i.test(message)) {
        errors.push({
          model: candidateModel,
          message,
          statusCode: error?.statusCode ?? null,
        })
        continue
      }

      const { generationConfig, ...bodyWithoutGenerationConfig } = body
      void generationConfig

      try {
        attemptedModels.push(candidateModel)
        const payload = await requestGeminiModel({
          model: candidateModel,
          body: bodyWithoutGenerationConfig,
        })
        const outputParts = payload?.candidates?.[0]?.content?.parts ?? []

        return {
          model: candidateModel,
          attemptedModels,
          skippedModels,
          usage: getGeminiUsageSnapshot(),
          text: extractText(outputParts),
          images: extractInlineImages(outputParts),
          raw: payload,
        }
      } catch (retryError) {
        errors.push({
          model: candidateModel,
          message: String(retryError?.message ?? ''),
          statusCode: retryError?.statusCode ?? null,
        })
      }
    }
  }

  throw createRateLimitError(attemptedModels, skippedModels, errors)
}
