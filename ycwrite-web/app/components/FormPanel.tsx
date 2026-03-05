'use client'

import { AUDIENCE_LABELS } from '@/lib/prompts'

const AUDIENCES = Object.entries(AUDIENCE_LABELS).map(([id, label]) => ({ id, label }))

const LENGTHS = [
  { id: 'short',  label: '短文',  desc: '1000-2000字',  sub: '配图 1 张',  icon: '⚡' },
  { id: 'medium', label: '中篇',  desc: '2000-5000字',  sub: '配图 2 张',  icon: '📄', recommended: true },
  { id: 'long',   label: '长篇',  desc: '5000字以上',   sub: '配图 3 张',  icon: '📚' },
] as const

interface FormPanelProps {
  topic: string
  setTopic: (v: string) => void
  audience: string
  setAudience: (v: string) => void
  length: 'short' | 'medium' | 'long'
  setLength: (v: 'short' | 'medium' | 'long') => void
  viewpoint: string
  setViewpoint: (v: string) => void
  onSubmit: () => void
}

export default function FormPanel({
  topic,
  setTopic,
  audience,
  setAudience,
  length,
  setLength,
  viewpoint,
  setViewpoint,
  onSubmit
}: FormPanelProps) {
  const canSubmit = topic.trim().length > 0

  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">创建新文章</h1>
          <p className="text-gray-500">输入主题，AI 将自动调研、写作、配图并生成富文本文章</p>
        </div>

        {/* 主题 */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">文章主题 *</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="例如：AI Agent、Transformer原理、大模型幻觉问题..."
              className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#DEDCD1] focus:ring-1 focus:ring-[#DEDCD1] transition-colors"
            />
            <button
              onClick={onSubmit}
              disabled={!canSubmit}
              className="px-6 py-3 rounded-lg font-medium text-sm transition-all bg-[#DEDCD1] hover:bg-[#CCC9BD] text-[#2D2A26] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              开始生成
            </button>
          </div>
        </div>

        {/* 目标受众 */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">目标受众</label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCES.map(a => (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  audience === a.id
                    ? 'bg-[#DEDCD1] text-[#2D2A26] shadow-md'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-[#DEDCD1] hover:bg-[#FAF9F7]'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* 文章长度 */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">文章长度</label>
          <div className="grid grid-cols-3 gap-3">
            {LENGTHS.map(l => (
              <button
                key={l.id}
                onClick={() => setLength(l.id as 'short' | 'medium' | 'long')}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  length === l.id
                    ? 'border-[#DEDCD1] bg-[#FAF9F7]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {'recommended' in l && l.recommended && (
                  <span className="absolute -top-2 -right-2 bg-[#DEDCD1] text-[#2D2A26] text-xs px-2 py-0.5 rounded-full font-medium">推荐</span>
                )}
                <div className="text-xl mb-1">{l.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{l.label}</div>
                <div className="text-gray-500 text-xs mt-0.5">{l.desc}</div>
                <div className="text-gray-400 text-xs">{l.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 核心观点（可选） */}
        <div className="mb-10">
          <label className="block text-sm font-semibold text-gray-700 mb-3">核心观点（可选）</label>
          <input
            type="text"
            value={viewpoint}
            onChange={e => setViewpoint(e.target.value)}
            placeholder="例如：AI Agent 将重塑产品经理工作方式"
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#DEDCD1] transition-colors"
          />
        </div>
      </div>
    </div>
  )
}
