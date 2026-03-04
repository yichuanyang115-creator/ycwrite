'use client'

import Sidebar from './Sidebar'
import TopBar from './TopBar'
import EditorWorkspace from './EditorWorkspace'

interface Article {
  id: string
  title: string
  html: string
  wordCount: number
  imageCount: number
  createdAt: number
}

interface NewLayoutViewProps {
  article: Article
  articles: Article[]
  currentView: 'thinking' | 'research' | 'article'
  onViewChange: (view: 'thinking' | 'research' | 'article') => void
  onSelectArticle: (id: string) => void
  onCopy: () => void
  onBack: () => void
}

export default function NewLayoutView({
  article,
  articles,
  currentView,
  onViewChange,
  onSelectArticle,
  onCopy,
  onBack
}: NewLayoutViewProps) {
  const readingMinutes = Math.max(1, Math.round(article.wordCount / 400))
  const date = new Date(article.createdAt).toLocaleDateString('zh-CN')

  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <Sidebar
        articles={articles}
        currentArticleId={article.id}
        onSelectArticle={onSelectArticle}
      />

      {/* 主内容区 */}
      <main className="flex-1 flex flex-col">
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
        />

        {/* 编辑器工作区 */}
        <EditorWorkspace>
          {currentView === 'article' && (
            <div className="article-view">
              <iframe
                srcDoc={article.html}
                title="文章预览"
                className="w-full h-[70vh] border-0 rounded-lg"
                sandbox="allow-same-origin"
              />
            </div>
          )}
          {currentView === 'thinking' && (
            <div className="thinking-view">
              <div className="content-label">思考流</div>
              <h2 className="section-title">生成过程</h2>
              <p className="content-text">
                此功能将在后续版本中实现，用于展示AI的思考过程和调研笔记。
              </p>
            </div>
          )}
          {currentView === 'research' && (
            <div className="research-view">
              <div className="content-label">研究报告</div>
              <h2 className="section-title">文章大纲</h2>
              <p className="content-text">
                此功能将在后续版本中实现，用于展示结构化的研究资料和大纲。
              </p>
            </div>
          )}
        </EditorWorkspace>

        {/* 返回按钮 */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← 返回生成页面
          </button>
        </div>
      </main>
    </div>
  )
}
