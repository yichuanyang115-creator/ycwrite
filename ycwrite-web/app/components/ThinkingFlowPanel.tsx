'use client'

import { ThinkingStep } from '@/types/thinking'

interface ThinkingFlowPanelProps {
  steps: ThinkingStep[]
}

const STAGE_LABELS: Record<string, string> = {
  research: '主题调研',
  outline: '大纲生成',
  writing: '正文写作',
  images: '配图生成',
  formatting: '富文本排版'
}

const TYPE_LABELS: Record<string, string> = {
  analysis: '分析',
  decision: '决策',
  insight: '洞察',
  reference: '参考',
  progress: '进度'
}

const TYPE_COLORS: Record<string, string> = {
  analysis: '#3B82F6',
  decision: '#8B5CF6',
  insight: '#10B981',
  reference: '#F59E0B',
  progress: '#6B7280'
}

export default function ThinkingFlowPanel({ steps }: ThinkingFlowPanelProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="thinking-flow-panel">
      <h2 className="section-title">AI 生成过程</h2>

      {steps.length === 0 ? (
        <p className="content-text text-gray-500">暂无思考流数据</p>
      ) : (
        <div className="thinking-timeline">
          {steps.map((step) => (
            <div key={step.id} className="thinking-step">
              <div className="step-header">
                <span
                  className="step-type-badge"
                  style={{ backgroundColor: TYPE_COLORS[step.type] }}
                >
                  {TYPE_LABELS[step.type]}
                </span>
                <span className="step-stage">{STAGE_LABELS[step.stage]}</span>
                <span className="step-time">{formatTime(step.timestamp)}</span>
              </div>
              <div className="step-content">{step.content}</div>
              {step.metadata && (
                <div className="step-metadata">
                  {step.metadata.confidence && (
                    <span className="metadata-item">
                      置信度: {(step.metadata.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  {step.metadata.reasoning && (
                    <div className="metadata-reasoning">{step.metadata.reasoning}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .thinking-flow-panel {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 1.5rem;
        }

        .content-text {
          color: #64748B;
          line-height: 1.6;
        }

        .thinking-timeline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .thinking-step {
          background: #F8FAFC;
          border-left: 3px solid #E2E8F0;
          padding: 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .thinking-step:hover {
          border-left-color: #3B82F6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .step-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
        }

        .step-type-badge {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          color: white;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .step-stage {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 500;
        }

        .step-time {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-left: auto;
        }

        .step-content {
          color: #334155;
          line-height: 1.6;
          font-size: 0.875rem;
        }

        .step-metadata {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid #E2E8F0;
        }

        .metadata-item {
          font-size: 0.75rem;
          color: #64748B;
          margin-right: 1rem;
        }

        .metadata-reasoning {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 0.5rem;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
