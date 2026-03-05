'use client'

import { useState, useRef, useCallback } from 'react'
import { useArticleHistory } from './hooks/useArticleHistory'
import { ThinkingStep } from '@/types/thinking'
import UnifiedLayout from './components/UnifiedLayout'
import FormPanel from './components/FormPanel'
import GeneratingPanel from './components/GeneratingPanel'
import ArticlePanel from './components/ArticlePanel'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ─── 类型 ─────────────────────────────────────────────────────
type ContentState =
  | { type: 'form' }
  | { type: 'generating', generatingId: string }
  | { type: 'article', articleId: string }

interface StageState {
  id: string
  label: string
  status: 'pending' | 'active' | 'done'
  message?: string
}

// ─── 常量 ─────────────────────────────────────────────────────
const INIT_STAGES: StageState[] = [
  { id: 'research',   label: '主题调研',   status: 'pending' },
  { id: 'outline',    label: '大纲生成',   status: 'pending' },
  { id: 'writing',    label: '正文写作',   status: 'pending' },
  { id: 'images',     label: '配图生成',   status: 'pending' },
  { id: 'formatting', label: '富文本排版', status: 'pending' },
]

// ─── 主组件 ───────────────────────────────────────────────────
export default function Home() {
  const [contentState, setContentState] = useState<ContentState>({ type: 'form' })
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('pm')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [viewpoint, setViewpoint] = useState('')
  const [stages, setStages] = useState<StageState[]>(INIT_STAGES)
  const [streamText, setStreamText] = useState('')
  const streamRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState<'thinking' | 'research' | 'article'>('article')
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [researchData, setResearchData] = useState('')
  const [outlineData, setOutlineData] = useState('')
  const { articles, saveArticle, getArticle, saveThinkingFlow, getThinkingFlow, deleteArticle } = useArticleHistory()

  const updateStage = useCallback((id: string, status: StageState['status'], message?: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, status, message } : s))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!topic.trim()) return
    const generatingId = Date.now().toString()
    setContentState({ type: 'generating', generatingId })
    setStages(INIT_STAGES)
    setStreamText('')
    setThinkingSteps([])
    setResearchData('')
    setOutlineData('')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'
      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), audience, length, viewpoint: viewpoint.trim() || undefined }),
      })
      if (!res.ok || !res.body) throw new Error(`请求失败 (${res.status})`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let accumulatedThinkingSteps: ThinkingStep[] = []

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break
        buf += decoder.decode(value, { stream: true })
        const parts = buf.split('\n\n')
        buf = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.trim().split('\n')
          let eventType = 'message'
          let dataStr = ''
          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim()
            else if (line.startsWith('data:')) dataStr = line.slice(5).trim()
          }
          if (!dataStr) continue

          try {
            const data = JSON.parse(dataStr)
            if (eventType === 'stage') updateStage(data.id, data.status, data.message)
            else if (eventType === 'stream') {
              setStreamText(prev => {
                const next = prev + data.text
                setTimeout(() => streamRef.current?.scrollTo({ top: 9999, behavior: 'smooth' }), 10)
                return next
              })
            }
            else if (eventType === 'thinking') {
              const newStep: ThinkingStep = {
                id: `${Date.now()}_${Math.random()}`,
                stage: data.stage,
                timestamp: data.timestamp,
                type: data.type,
                content: data.content,
                metadata: data.metadata
              }
              accumulatedThinkingSteps.push(newStep)
              setThinkingSteps(prev => [...prev, newStep])
            }
            else if (eventType === 'research_complete') {
              setResearchData(data.content)
            }
            else if (eventType === 'outline_complete') {
              setOutlineData(data.content)
            }
            else if (eventType === 'image_start') updateStage('images', 'active', data.message)
            else if (eventType === 'done') {
              const articleId = saveArticle({
                title: data.title,
                topic: topic.trim(),
                audience,
                length,
                viewpoint: viewpoint.trim() || undefined,
                markdown: '',
                html: data.html,
                wordCount: data.wordCount,
                imageCount: data.imageCount,
                researchData: data.research,
                outlineData: data.outline
              })

              // 保存思考流数据
              saveThinkingFlow({
                articleId,
                steps: accumulatedThinkingSteps,
                researchData: data.research,
                outlineData: data.outline,
                createdAt: Date.now()
              })

              setContentState({ type: 'article', articleId })
            }
            else if (eventType === 'error') {
              alert(`生成失败: ${data.message}`)
              setContentState({ type: 'form' })
            }
          } catch { }
        }
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : '网络错误，请重试')
      setContentState({ type: 'form' })
    }
  }, [topic, audience, length, viewpoint, updateStage, saveArticle, saveThinkingFlow, thinkingSteps])

  const handleNewArticle = useCallback(() => {
    setTopic('')
    setViewpoint('')
    setContentState({ type: 'form' })
  }, [])

  const handleSelectArticle = useCallback((id: string) => {
    setContentState({ type: 'article', articleId: id })
  }, [])

  const handleDeleteArticle = useCallback((id: string) => {
    deleteArticle(id)
    // 如果删除的是当前文章，返回表单页
    if (contentState.type === 'article' && contentState.articleId === id) {
      setContentState({ type: 'form' })
    }
  }, [deleteArticle, contentState])

  const handleCopy = useCallback(() => {
    if (contentState.type === 'article') {
      const article = getArticle(contentState.articleId)
      if (article) {
        // 创建临时 DOM 元素来提取纯文本
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = article.html

        // 移除 style 标签
        const styleTags = tempDiv.querySelectorAll('style')
        styleTags.forEach(tag => tag.remove())

        // 移除页脚信息
        const footer = tempDiv.querySelector('.meta, footer, [class*="footer"]')
        if (footer) footer.remove()

        // 移除第一个 h1 标题（通常是重复的）
        const firstH1 = tempDiv.querySelector('h1')
        if (firstH1) firstH1.remove()

        const plainText = tempDiv.innerText || tempDiv.textContent || ''

        // 添加文章标题到开头
        const finalText = `${article.title}\n\n${plainText.trim()}`
        navigator.clipboard.writeText(finalText).then(() => alert('已复制到剪贴板'))
      }
    }
  }, [contentState, getArticle])

  const handleExportPDF = useCallback(async () => {
    if (contentState.type === 'article') {
      const article = getArticle(contentState.articleId)
      if (article) {
        try {
          // 创建临时容器
          const tempDiv = document.createElement('div')
          tempDiv.style.position = 'absolute'
          tempDiv.style.left = '-9999px'
          tempDiv.style.width = '800px'
          tempDiv.style.padding = '40px'
          tempDiv.style.backgroundColor = '#ffffff'
          tempDiv.style.fontFamily = "'Noto Serif SC', serif"
          tempDiv.innerHTML = article.html
          document.body.appendChild(tempDiv)

          // 移除 style 标签
          const styleTags = tempDiv.querySelectorAll('style')
          styleTags.forEach(tag => tag.remove())

          // 生成 canvas
          const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
          })

          // 移除临时容器
          document.body.removeChild(tempDiv)

          // 创建 PDF
          const imgWidth = 210 // A4 宽度 (mm)
          const pageHeight = 297 // A4 高度 (mm)
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight
          const pdf = new jsPDF('p', 'mm', 'a4')
          let position = 0

          // 添加第一页
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          // 如果内容超过一页，添加更多页
          while (heightLeft > 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }

          // 下载 PDF
          pdf.save(`${article.title}.pdf`)
        } catch (error) {
          console.error('PDF 生成失败:', error)
          alert('PDF 生成失败，请重试')
        }
      }
    }
  }, [contentState, getArticle])

  const renderContent = () => {
    if (contentState.type === 'form') {
      return <FormPanel topic={topic} setTopic={setTopic} audience={audience} setAudience={setAudience} length={length} setLength={setLength} viewpoint={viewpoint} setViewpoint={setViewpoint} onSubmit={handleSubmit} />
    }
    if (contentState.type === 'generating') {
      return <GeneratingPanel stages={stages} streamText={streamText} streamRef={streamRef} />
    }
    if (contentState.type === 'article') {
      const article = getArticle(contentState.articleId)
      if (!article) return <div className="p-12 text-center text-gray-500">文章不存在</div>

      const thinkingFlow = getThinkingFlow(contentState.articleId)

      return <ArticlePanel
        article={article}
        currentView={currentView}
        onViewChange={setCurrentView}
        onCopy={handleCopy}
        onExportPDF={handleExportPDF}
        thinkingSteps={thinkingFlow?.steps || []}
      />
    }
    return null
  }

  return (
    <UnifiedLayout
      articles={articles}
      currentArticleId={contentState.type === 'article' ? contentState.articleId : null}
      onSelectArticle={handleSelectArticle}
      onNewArticle={handleNewArticle}
      onDeleteArticle={handleDeleteArticle}
    >
      {renderContent()}
    </UnifiedLayout>
  )
}
