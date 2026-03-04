// 思考流数据类型定义

export type ThinkingStage = 'research' | 'outline' | 'writing' | 'images' | 'formatting'
export type ThinkingType = 'analysis' | 'decision' | 'insight' | 'reference' | 'progress'

export interface ThinkingStep {
  id: string
  stage: ThinkingStage
  timestamp: number
  type: ThinkingType
  content: string
  metadata?: {
    confidence?: number
    sources?: string[]
    reasoning?: string
  }
}

export interface ThinkingFlow {
  articleId: string
  steps: ThinkingStep[]
  researchData?: string
  outlineData?: string
  createdAt: number
}
