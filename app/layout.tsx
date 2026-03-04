import type { Metadata } from 'next'
import './globals.css'
import './writemaster.css'

export const metadata: Metadata = {
  title: 'WRITEMASTER · AI科普文章生成器',
  description: '一站式 AI 科普文章自动化写作：调研 → 大纲 → 写作 → 配图 → 富文本输出',
  openGraph: {
    title: 'WRITEMASTER · AI科普文章生成器',
    description: '输入主题，一键生成高质量 AI 科普文章',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
