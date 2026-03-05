'use client'

interface EditorWorkspaceProps {
  children: React.ReactNode
}

export default function EditorWorkspace({ children }: EditorWorkspaceProps) {
  return (
    <div className="editor-workspace">
      <article className="editor-card">
        {children}
      </article>
    </div>
  )
}
