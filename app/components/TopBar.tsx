'use client'

interface TopBarProps {
  title: string
  status: string
  wordCount: number
  date: string
  imageCount: number
  readingMinutes: number
  currentView: 'thinking' | 'research' | 'article'
  onViewChange: (view: 'thinking' | 'research' | 'article') => void
  onCopy: () => void
  onExportPDF: () => void
}

export default function TopBar({
  title,
  status,
  wordCount,
  date,
  imageCount,
  readingMinutes,
  currentView,
  onViewChange,
  onCopy,
  onExportPDF
}: TopBarProps) {
  return (
    <header className="main-header">
      <div className="flex-1">
        {/* Title */}
        <h1 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
          {title}
        </h1>

        {/* Metadata */}
        <div className="header-meta">
          <span>● {status}</span>
          <span>{wordCount.toLocaleString()}字</span>
          <span>{date}</span>
          <span>{imageCount}张插图</span>
          <span>约{readingMinutes}分钟</span>
        </div>
      </div>

      {/* Right: Compact Toolbar */}
      <div className="header-toolbar">
        {/* View Switcher */}
        <div className="segmented-control">
          <button
            className={`segmented-button ${currentView === 'thinking' ? 'active' : ''}`}
            onClick={() => onViewChange('thinking')}
          >
            思考流
          </button>
          <button
            className={`segmented-button ${currentView === 'research' ? 'active' : ''}`}
            onClick={() => onViewChange('research')}
          >
            研究报告
          </button>
          <button
            className={`segmented-button ${currentView === 'article' ? 'active' : ''}`}
            onClick={() => onViewChange('article')}
          >
            成品文章
          </button>
        </div>

        {/* Icon Buttons */}
        <button className="icon-button" onClick={onCopy} title="一键复制">
          <span>📋</span>
        </button>
        <button className="icon-button" onClick={onExportPDF} title="导出PDF">
          <span>📄</span>
        </button>
      </div>
    </header>
  )
}
