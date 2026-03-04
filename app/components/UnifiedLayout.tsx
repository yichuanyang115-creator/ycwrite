'use client'

import Sidebar from './Sidebar'

interface Article {
  id: string
  title: string
  wordCount: number
  createdAt: number
}

interface UnifiedLayoutProps {
  articles: Article[]
  currentArticleId: string | null
  onSelectArticle: (id: string) => void
  onNewArticle: () => void
  onDeleteArticle: (id: string) => void
  children: React.ReactNode
}

export default function UnifiedLayout({
  articles,
  currentArticleId,
  onSelectArticle,
  onNewArticle,
  onDeleteArticle,
  children
}: UnifiedLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 - 始终显示 */}
      <Sidebar
        articles={articles}
        currentArticleId={currentArticleId}
        onSelectArticle={onSelectArticle}
        onNewArticle={onNewArticle}
        onDeleteArticle={onDeleteArticle}
      />

      {/* 主内容区 - 动态切换 */}
      <main className="flex-1 flex flex-col bg-white">
        {children}
      </main>
    </div>
  )
}
