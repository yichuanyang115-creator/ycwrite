export interface ImageTask {
  id: string
  prompt: string
}

type ProgressFn = (event: string, data: Record<string, unknown>) => void

export async function generateImages(
  tasks: ImageTask[],
  onProgress: ProgressFn
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  for (const task of tasks) {
    onProgress('image_start', { id: task.id, message: `正在生成配图 ${task.id}...` })

    try {
      const b64 = await callImageAPI(task.prompt)
      results[task.id] = b64
      onProgress('image_done', { id: task.id, success: b64.startsWith('data:image/png') })
    } catch (e) {
      console.error(`Image generation failed for ${task.id}:`, e)
      results[task.id] = createPlaceholderSvg(task.prompt)
      onProgress('image_done', { id: task.id, success: false })
    }
  }

  return results
}

async function callImageAPI(prompt: string): Promise<string> {
  const apiKey = process.env.IMAGE_API_KEY
  const baseUrl = process.env.IMAGE_API_BASE ?? 'https://api.apicore.ai/v1'
  const model = process.env.IMAGE_MODEL ?? 'gemini-2.5-flash-image-hd'

  if (!apiKey) return createPlaceholderSvg(prompt)

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      n: 1,
    }),
  })

  if (!res.ok) {
    throw new Error(`Image API ${res.status}: ${await res.text()}`)
  }

  const json = await res.json()
  return await extractImage(json, prompt)
}

async function extractImage(json: Record<string, unknown>, fallbackPrompt: string): Promise<string> {
  const choices = json.choices as Array<{ message: { content: unknown } }>
  if (!choices?.length) return createPlaceholderSvg(fallbackPrompt)

  const content = choices[0]?.message?.content

  // 格式1：列表内容
  if (Array.isArray(content)) {
    for (const part of content as Array<Record<string, unknown>>) {
      if (part.type === 'image_url') {
        const url = (part.image_url as Record<string, string>)?.url ?? ''
        if (url.startsWith('data:image/')) return url
        if (url.startsWith('http')) return await urlToBase64(url)
      }
    }
  }

  // 格式2：字符串（data URL 或 markdown 图片链接）
  if (typeof content === 'string') {
    if (content.startsWith('data:image/')) return content

    const match = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/)
    if (match) return await urlToBase64(match[1])
  }

  return createPlaceholderSvg(fallbackPrompt)
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed: ${url}`)
  const buf = await res.arrayBuffer()
  const b64 = Buffer.from(buf).toString('base64')
  return `data:image/png;base64,${b64}`
}

function createPlaceholderSvg(description: string): string {
  const safe = description.replace(/[<>&"]/g, '').slice(0, 60)
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#1e1b4b"/><stop offset="100%" style="stop-color:#1e3a5f"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="8,4" rx="12"/>
  <text x="600" y="295" font-family="Arial,sans-serif" font-size="20" fill="#64748b" text-anchor="middle">[配图占位符]</text>
  <text x="600" y="335" font-family="Arial,sans-serif" font-size="16" fill="#475569" text-anchor="middle">${safe}</text>
</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export function extractImagePlaceholders(markdown: string): ImageTask[] {
  const regex = /\[IMAGE:\s*([^\]]+)\]/g
  const tasks: ImageTask[] = []
  let match
  let index = 0
  while ((match = regex.exec(markdown)) !== null) {
    tasks.push({ id: `img_${String(++index).padStart(2, '0')}`, prompt: match[1].trim() })
  }
  return tasks
}

export function replaceImagePlaceholders(
  markdown: string,
  images: Record<string, string>
): string {
  let index = 0
  return markdown.replace(/\[IMAGE:\s*[^\]]+\]/g, () => {
    const id = `img_${String(++index).padStart(2, '0')}`
    const src = images[id]
    return src ? `![配图${index}](${src})` : `![配图${index}（生成失败）]()`
  })
}
