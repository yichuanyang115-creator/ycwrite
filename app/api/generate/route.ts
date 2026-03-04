import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  buildResearchPrompt,
  buildOutlinePrompt,
  buildWritingPrompt,
  LENGTH_CONFIG,
  type ArticleParams,
} from '@/lib/prompts'
import { generateImages, extractImagePlaceholders, replaceImagePlaceholders } from '@/lib/imageGen'
import { buildHtml } from '@/lib/htmlBuilder'

export const maxDuration = 300 // Vercel Pro: 5分钟

const MODEL = 'claude-sonnet-4-6'

export async function POST(req: NextRequest) {
  const params: ArticleParams = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        const client = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY!,
          ...(process.env.ANTHROPIC_BASE_URL
            ? { baseURL: process.env.ANTHROPIC_BASE_URL }
            : {}),
        })
        const cfg = LENGTH_CONFIG[params.length]

        // ── 阶段1：调研 ──────────────────────────────────────
        send('stage', { id: 'research', status: 'active', message: '正在分析主题，调研背景知识...' })

        const researchMsg = await client.messages.create({
          model: MODEL,
          max_tokens: 1200,
          messages: [{ role: 'user', content: buildResearchPrompt(params) }],
        })
        const research = (researchMsg.content[0] as { text: string }).text
        send('stage', { id: 'research', status: 'done' })

        // ── 阶段2：大纲 ──────────────────────────────────────
        send('stage', { id: 'outline', status: 'active', message: '正在生成文章大纲...' })

        const outlineMsg = await client.messages.create({
          model: MODEL,
          max_tokens: 800,
          messages: [{ role: 'user', content: buildOutlinePrompt(params, research) }],
        })
        const outline = (outlineMsg.content[0] as { text: string }).text
        send('stage', { id: 'outline', status: 'done' })

        // ── 阶段3：正文写作（流式）───────────────────────────
        send('stage', { id: 'writing', status: 'active', message: '正在撰写正文，请稍候...' })

        let articleMd = ''
        const writingStream = client.messages.stream({
          model: MODEL,
          max_tokens: cfg.maxTokens,
          messages: [{ role: 'user', content: buildWritingPrompt(params, research, outline) }],
        })

        for await (const chunk of writingStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            articleMd += chunk.delta.text
            send('stream', { text: chunk.delta.text })
          }
        }
        send('stage', { id: 'writing', status: 'done' })

        // ── 阶段4：配图生成 ──────────────────────────────────
        send('stage', { id: 'images', status: 'active', message: '正在生成 AI 配图...' })

        const imageTasks = extractImagePlaceholders(articleMd)
        const imageResults = await generateImages(imageTasks, send)
        const articleWithImages = replaceImagePlaceholders(articleMd, imageResults)

        send('stage', { id: 'images', status: 'done' })

        // ── 阶段5：富文本排版 ────────────────────────────────
        send('stage', { id: 'formatting', status: 'active', message: '正在生成富文本 HTML...' })

        const titleMatch = articleMd.match(/^##?\s+(.+)$/m)
        const title = titleMatch ? titleMatch[1].trim() : params.topic
        const html = await buildHtml(articleWithImages, title)

        send('stage', { id: 'formatting', status: 'done' })

        // ── 完成 ─────────────────────────────────────────────
        const wordCount = articleMd.replace(/[^\u4e00-\u9fa5\w]/g, '').length
        const imageCount = Object.keys(imageResults).length

        send('done', { html, title, wordCount, imageCount })
      } catch (error) {
        send('error', {
          message: error instanceof Error ? error.message : '生成过程中发生未知错误',
        })
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
