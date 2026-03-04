'use client'

interface StageState {
  id: string
  label: string
  status: 'pending' | 'active' | 'done'
  message?: string
}

interface GeneratingPanelProps {
  stages: StageState[]
  streamText: string
  streamRef: React.RefObject<HTMLDivElement | null>
}

export default function GeneratingPanel({ stages, streamText, streamRef }: GeneratingPanelProps) {
  const activeStage = stages.find(s => s.status === 'active')
  const doneCount = stages.filter(s => s.status === 'done').length
  const percent = Math.round((doneCount / stages.length) * 100)

  return (
    <div className="flex-1 overflow-y-auto p-12">
      <div className="max-w-3xl mx-auto">
        {/* 进度标题 */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">正在生成文章</h2>
          <p className="text-gray-500 text-sm">{activeStage?.message ?? '准备中...'}</p>
        </div>

        {/* 总进度条 */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>整体进度</span><span>{percent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* 阶段列表 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 space-y-3">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all
                ${stage.status === 'done' ? 'bg-green-100 text-green-600 border border-green-300' :
                  stage.status === 'active' ? 'bg-blue-100 text-blue-600 border border-blue-300' :
                  'bg-white text-gray-400 border border-gray-200'}`}>
                {stage.status === 'done' ? '✓' : stage.status === 'active' ?
                  <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin block" /> :
                  i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${
                  stage.status === 'done' ? 'text-green-600' :
                  stage.status === 'active' ? 'text-blue-600' :
                  'text-gray-400'}`}>
                  {stage.label}
                </div>
                {stage.status === 'active' && stage.message && (
                  <div className="text-xs text-gray-500 truncate">{stage.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 实时写作预览 */}
        {streamText && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">实时写作预览</span>
            </div>
            <div
              ref={streamRef}
              className="max-h-56 overflow-y-auto text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono"
            >
              {streamText}
              <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5 align-text-bottom" />
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          💡 提示：生成过程中可以点击左侧历史记录查看其他文章
        </p>
      </div>
    </div>
  )
}
