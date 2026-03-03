import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YCWrite · AI科普文章生成器',
  description: '一站式 AI 科普文章自动化写作：调研 → 大纲 → 写作 → 配图 → 富文本输出',
  openGraph: {
    title: 'YCWrite · AI科普文章生成器',
    description: '输入主题，一键生成高质量 AI 科普文章',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0f172a] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
