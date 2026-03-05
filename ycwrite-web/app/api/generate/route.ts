import { NextRequest } from 'next/server'

export const maxDuration = 300 // Vercel Pro: 5分钟

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const params = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 调用 FastAPI 后端
        const response = await fetch(`${BACKEND_URL}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: params.topic,
            audience: params.audience || 'pm',
            length: params.length || 'medium',
            viewpoint: params.viewpoint,
          }),
        })

        if (!response.ok) {
          throw new Error(`Backend error: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              // 转发 SSE 事件到前端
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
        }
      } catch (error) {
        const errorData = JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : '生成过程中发生未知错误',
        })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
