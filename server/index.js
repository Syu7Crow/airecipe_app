import { createServer } from 'node:http'
import {
  checkGroqConnection,
  createGroqChatCompletion,
  defaultGroqModel,
} from './groq.js'
import { checkSupabaseConnection } from './supabase.js'

const port = Number(process.env.PORT ?? 8787)

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

const server = createServer((request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    })
    response.end()
    return
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host}`)

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true })
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/supabase/status') {
    const status = checkSupabaseConnection()
    sendJson(response, status.ok ? 200 : 500, status)
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/groq/status') {
    const status = checkGroqConnection()
    sendJson(response, status.ok ? 200 : 500, status)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/groq/chat') {
    handleGroqChat(request, response)
    return
  }

  sendJson(response, 404, {
    ok: false,
    message: 'Not found',
  })
})

async function readJsonBody(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const bodyText = Buffer.concat(chunks).toString('utf8')

  if (!bodyText) {
    return null
  }

  return JSON.parse(bodyText)
}

async function handleGroqChat(request, response) {
  try {
    const body = await readJsonBody(request)

    if (!Array.isArray(body?.messages)) {
      sendJson(response, 400, {
        ok: false,
        message: 'messages are required',
      })
      return
    }

    const completion = await createGroqChatCompletion({
      model: body.model ?? defaultGroqModel,
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    })

    sendJson(response, 200, {
      ok: true,
      completion,
    })
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : 'Groq request failed',
    })
  }
}

server.listen(port, () => {
  console.info(`API server listening on http://localhost:${port}`)
})
