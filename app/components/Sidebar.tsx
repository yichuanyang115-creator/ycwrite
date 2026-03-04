'use client'

import { useState } from 'react'

interface Article {
  id: string
  title: string
  wordCount: number
  createdAt: number
}

interface SidebarProps {
  articles: Article[]
  currentArticleId?: string | null
  onSelectArticle: (id: string) => void
  onNewArticle: () => void
  onDeleteArticle: (id: string) => void
}

export default function Sidebar({ articles, currentArticleId, onSelectArticle, onNewArticle, onDeleteArticle }: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('确定要删除这篇文章吗？')) {
      onDeleteArticle(id)
    }
  }

  return (
    <aside className="sidebar">
      {/* Logo Section */}
      <div className="logo-section">
        <div className="logo-title">WRITEMASTER</div>
        <div className="logo-subtitle">
          <span className="logo-icon"></span>
          <span>WRITING LABORATORY BY YJC</span>
        </div>
      </div>

      {/* New Article Button */}
      <button
        onClick={onNewArticle}
        className="w-full mb-6 px-4 py-3 bg-[#DEDCD1] hover:bg-[#CCC9BD] text-[#2D2A26] rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
      >
        <span>+</span>
        <span>新建文章</span>
      </button>

      {/* History Section */}
      <div className="history-section">
        <div className="history-title">历史记录</div>
        {articles.length === 0 ? (
          <div className="text-xs text-slate-500 px-3 py-4">暂无历史记录</div>
        ) : (
          articles.map(article => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article.id)}
              onMouseEnter={() => setHoveredId(article.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`history-item ${currentArticleId === article.id ? 'active' : ''}`}
              style={{ position: 'relative' }}
            >
              <div className="history-item-title">{article.title}</div>
              <div className="history-item-meta">{article.wordCount.toLocaleString()}字</div>
              {hoveredId === article.id && (
                <button
                  onClick={(e) => handleDelete(e, article.id)}
                  className="delete-btn"
                  title="删除文章"
                >
                  ×
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Version Info */}
      <div className="version-info">
        v1.0.2<br />
        Claude Sonnet 4
      </div>

      <style jsx>{`
        .delete-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: #EF4444;
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          line-height: 1;
          transition: background 0.2s;
        }

        .delete-btn:hover {
          background: #DC2626;
        }
      `}</style>
    </aside>
  )
}
