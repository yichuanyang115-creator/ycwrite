'use client'

import { useState, useRef, useCallback } from 'react'
import { AUDIENCE_LABELS, LENGTH_CONFIG } from '@/lib/prompts'

// ─── 类型 ─────────────────────────────────────────────────────
type Phase = 'form' | 'generating' | 'done' | 'error'

interface StageState {
  id: string
  label: string
  status: 'pending' | 'active' | 'done'
  message?: string
}

interface DoneData {
  html: string
  title: string
  wordCount: number
  imageCount: number
}

// ─── 常量 ─────────────────────────────────────────────────────
const AUDIENCES = Object.entries(AUDIENCE_LABELS).map(([id, label]) => ({ id, label }))

const LENGTHS = [
  { id: 'short',  label: '短文',  desc: '1000-2000字',  sub: '配图 1-2 张',  icon: '⚡' },
  { id: 'medium', label: '中篇',  desc: '2000-5000字',  sub: '配图 2-3 张',  icon: '📄', recommended: true },
  { id: 'long',   label: '长篇',  desc: '5000字以上',   sub: '配图 5 张+',   icon: '📚' },
] as const

const INIT_STAGES: StageState[] = [
  { id: 'research',   label: '主题调研',   status: 'pending' },
  { id: 'outline',    label: '大纲生成',   status: 'pending' },
  { id: 'writing',    label: '正文写作',   status: 'pending' },
  { id: 'images',     label: '配图生成',   status: 'pending' },
  { id: 'formatting', label: '富文本排版', status: 'pending' },
]

// ─── 主组件 ───────────────────────────────────────────────────
export default function Home() {
  const [phase, setPhase] = useState<Phase>('form')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('pm')
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [viewpoint, setViewpoint] = useState('')
  const [stages, setStages] = useState<StageState[]>(INIT_STAGES)
  const [streamText, setStreamText] = useState('')
  const [done, setDone] = useState<DoneData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const streamRef = useRef<HTMLDivElement>(null)

  // ─── 更新阶段状态 ──────────────────────────────────────────
  const updateStage = useCallback((id: string, status: StageState['status'], message?: string) => {
    setStages(prev => prev.map(s => s.id === id ? { ...s, status, message } : s))
  }, [])

  // ─── 提交生成 ─────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!topic.trim()) return
    setPhase('generating')
    setStages(INIT_STAGES)
    setStreamText('')
    setDone(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), audience, length, viewpoint: viewpoint.trim() || undefined }),
      })

      if (!res.ok || !res.body) throw new Error(`请求失败 (${res.status})`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

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
            else if (eventType === 'image_start') updateStage('images', 'active', data.message)
            else if (eventType === 'done') { setDone(data); setPhase('done') }
            else if (eventType === 'error') { setErrorMsg(data.message); setPhase('error') }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '网络错误，请重试')
      setPhase('error')
    }
  }, [topic, audience, length, viewpoint, updateStage])

  // ─── 下载 HTML ────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!done) return
    const blob = new Blob([done.html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${done.title.replace(/[^\u4e00-\u9fa5\w-]/g, '_').slice(0, 40)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }, [done])

  // ─── 渲染 ─────────────────────────────────────────────────
  return (
    <main className="min-h-screen">
      {phase === 'form' && <FormView topic={topic} setTopic={setTopic} audience={audience} setAudience={setAudience} length={length} setLength={setLength} viewpoint={viewpoint} setViewpoint={setViewpoint} onSubmit={handleSubmit} />}
      {phase === 'generating' && <GeneratingView stages={stages} streamText={streamText} streamRef={streamRef} />}
      {phase === 'done' && done && <ResultView done={done} onDownload={handleDownload} onReset={() => setPhase('form')} />}
      {phase === 'error' && <ErrorView message={errorMsg} onReset={() => setPhase('form')} />}
    </main>
  )
}

// ─── 表单页 ───────────────────────────────────────────────────
function FormView({ topic, setTopic, audience, setAudience, length, setLength, viewpoint, setViewpoint, onSubmit }: {
  topic: string; setTopic: (v: string) => void
  audience: string; setAudience: (v: string) => void
  length: 'short' | 'medium' | 'long'; setLength: (v: 'short' | 'medium' | 'long') => void
  viewpoint: string; setViewpoint: (v: string) => void
  onSubmit: () => void
}) {
  const [showExtra, setShowExtra] = useState(false)
  const canSubmit = topic.trim().length > 0

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse-slow" />
          AI 科普文章生成器
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          输入主题，<span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">一键成文</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          自动调研 · 智能写作 · AI 配图 · 富文本输出
        </p>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-2xl bg-[#1e293b] border border-[#334155] rounded-2xl p-8 shadow-2xl animate-slide-up">

        {/* 主题 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">文章主题 *</label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && onSubmit()}
            placeholder="例如：AI Agent、Transformer原理、大模型幻觉问题..."
            className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-base"
          />
        </div>

        {/* 目标受众 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">目标受众</label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(a => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${audience === a.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-[#0f172a] text-slate-400 border border-[#334155] hover:border-blue-500/50 hover:text-slate-200'}`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* 文章长度 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">文章长度</label>
          <div className="grid grid-cols-3 gap-3">
            {LENGTHS.map(l => (
              <button
                key={l.id}
                onClick={() => setLength(l.id as 'short' | 'medium' | 'long')}
                className={`relative p-4 rounded-xl border text-left transition-all ${length === l.id ? 'border-blue-500 bg-blue-500/10' : 'border-[#334155] bg-[#0f172a] hover:border-slate-500'}`}
              >
                {'recommended' in l && l.recommended && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">推荐</span>
                )}
                <div className="text-xl mb-1">{l.icon}</div>
                <div className="font-semibold text-white text-sm">{l.label}</div>
                <div className="text-slate-400 text-xs mt-0.5">{l.desc}</div>
                <div className="text-slate-500 text-xs">{l.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 可选参数 */}
        <div className="mb-8">
          <button onClick={() => setShowExtra(!showExtra)} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <span className={`transition-transform ${showExtra ? 'rotate-90' : ''}`}>▶</span>
            可选参数
          </button>
          {showExtra && (
            <div className="mt-3 animate-fade-in">
              <input
                type="text"
                value={viewpoint}
                onChange={e => setViewpoint(e.target.value)}
                placeholder="核心观点（可选）：例如 AI Agent 将重塑产品经理工作方式"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              />
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-xl font-semibold text-base transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          开始生成文章 →
        </button>

        <p className="text-center text-xs text-slate-500 mt-4">
          预计耗时 1-3 分钟 · 支持下载为独立 HTML 文件
        </p>
      </div>
    </div>
  )
}

// ─── 生成中页 ─────────────────────────────────────────────────
function GeneratingView({ stages, streamText, streamRef }: {
  stages: StageState[]
  streamText: string
  streamRef: React.RefObject<HTMLDivElement | null>
}) {
  const activeStage = stages.find(s => s.status === 'active')
  const doneCount = stages.filter(s => s.status === 'done').length
  const percent = Math.round((doneCount / stages.length) * 100)

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl animate-fade-in">

        {/* 进度标题 */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">正在生成文章</h2>
          <p className="text-slate-400 text-sm">{activeStage?.message ?? '准备中...'}</p>
        </div>

        {/* 总进度条 */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>整体进度</span><span>{percent}%</span>
          </div>
          <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {/* 阶段列表 */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 mb-6 space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all
                ${stage.status === 'done' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  stage.status === 'active' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-[#0f172a] text-slate-600 border border-[#334155]'}`}>
                {stage.status === 'done' ? '✓' : stage.status === 'active' ? <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin block" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${stage.status === 'done' ? 'text-green-400' : stage.status === 'active' ? 'text-blue-300' : 'text-slate-500'}`}>
                  {stage.label}
                </div>
                {stage.status === 'active' && stage.message && (
                  <div className="text-xs text-slate-500 truncate">{stage.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 实时写作预览 */}
        {streamText && (
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">实时写作预览</span>
            </div>
            <div
              ref={streamRef}
              className="max-h-56 overflow-y-auto text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono"
            >
              {streamText}
              <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse-slow ml-0.5 align-text-bottom" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 结果页 ───────────────────────────────────────────────────
function ResultView({ done, onDownload, onReset }: {
  done: DoneData
  onDownload: () => void
  onReset: () => void
}) {
  const readingMinutes = Math.max(1, Math.round(done.wordCount / 400))

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-4xl animate-slide-up">

        {/* 顶部操作栏 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-400 text-lg">✓</span>
              <h2 className="text-xl font-bold text-white">{done.title}</h2>
            </div>
            <div className="flex gap-4 text-sm text-slate-400">
              <span>约 {done.wordCount.toLocaleString()} 字</span>
              <span>{done.imageCount} 张配图</span>
              <span>阅读约 {readingMinutes} 分钟</span>
            </div>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button onClick={onReset} className="px-4 py-2 rounded-lg border border-[#334155] text-slate-400 hover:text-white hover:border-slate-400 text-sm transition-colors">
              重新生成
            </button>
            <button onClick={onDownload} className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
              下载 HTML ↓
            </button>
          </div>
        </div>

        {/* 文章预览 iframe */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#334155]" style={{ height: '75vh' }}>
          <iframe
            srcDoc={done.html}
            title="文章预览"
            className="w-full h-full"
            sandbox="allow-same-origin"
          />
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          图片已 Base64 内嵌 · 下载后可直接在浏览器打开 · 无需网络
        </p>
      </div>
    </div>
  )
}

// ─── 错误页 ───────────────────────────────────────────────────
function ErrorView({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-white mb-2">生成失败</h2>
        <p className="text-slate-400 text-sm mb-8 bg-[#1e293b] rounded-lg p-4 text-left font-mono">{message}</p>
        <button onClick={onReset} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors">
          返回重试
        </button>
      </div>
    </div>
  )
}
