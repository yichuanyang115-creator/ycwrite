'use client'

import TopBar from './TopBar'
import EditorWorkspace from './EditorWorkspace'
import ThinkingFlowPanel from './ThinkingFlowPanel'
import ResearchPanel from './ResearchPanel'
import { ThinkingStep } from '@/types/thinking'

interface Article {
  id: string
  title: string
  html: string
  wordCount: number
  imageCount: number
  createdAt: number
  researchData?: string
  outlineData?: string
}

interface ArticlePanelProps {
  article: Article
  currentView: 'thinking' | 'research' | 'article'
  onViewChange: (view: 'thinking' | 'research' | 'article') => void
  onCopy: () => void
  onExportPDF: () => void
  thinkingSteps?: ThinkingStep[]
}

export default function ArticlePanel({
  article,
  currentView,
  onViewChange,
  onCopy,
  onExportPDF,
  thinkingSteps = []
}: ArticlePanelProps) {
  const readingMinutes = Math.max(1, Math.round(article.wordCount / 400))
  const date = new Date(article.createdAt).toLocaleDateString('zh-CN')

  return (
    <>
      {/* 顶部导航栏 */}
      <TopBar
        title={article.title}
        status="已完成"
        wordCount={article.wordCount}
        date={date}
        imageCount={article.imageCount}
        readingMinutes={readingMinutes}
        currentView={currentView}
        onViewChange={onViewChange}
        onCopy={onCopy}
        onExportPDF={onExportPDF}
      />

      {/* 编辑器工作区 */}
      <EditorWorkspace>
        {currentView === 'article' && (
          <div className="article-view">
            <iframe
              srcDoc={article.html}
              title="文章预览"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}
        {currentView === 'thinking' && (
          <ThinkingFlowPanel steps={thinkingSteps} />
        )}
        {currentView === 'research' && (
          <ResearchPanel
            researchData={article.researchData}
            outlineData={article.outlineData}
          />
        )}
      </EditorWorkspace>
    </>
  )
}
