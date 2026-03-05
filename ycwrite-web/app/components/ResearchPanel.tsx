'use client'

interface ResearchPanelProps {
  researchData?: string
  outlineData?: string
}

export default function ResearchPanel({ researchData, outlineData }: ResearchPanelProps) {
  return (
    <div className="research-panel">
      <h2 className="section-title">调研与大纲</h2>

      {!researchData && !outlineData ? (
        <p className="content-text text-gray-500">暂无调研数据</p>
      ) : (
        <div className="research-content">
          {researchData && (
            <div className="research-section">
              <h3 className="subsection-title">主题调研</h3>
              <div className="research-text">{researchData}</div>
            </div>
          )}

          {outlineData && (
            <div className="research-section">
              <h3 className="subsection-title">文章大纲</h3>
              <div className="outline-text">{outlineData}</div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .research-panel {
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

        .research-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .research-section {
          background: #F8FAFC;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid #E2E8F0;
        }

        .subsection-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #3B82F6;
        }

        .research-text,
        .outline-text {
          color: #475569;
          line-height: 1.8;
          font-size: 0.9375rem;
          white-space: pre-wrap;
        }

        .outline-text {
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          background: white;
          padding: 1rem;
          border-radius: 0.375rem;
          border: 1px solid #E2E8F0;
        }
      `}</style>
    </div>
  )
}
