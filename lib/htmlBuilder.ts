import { marked } from 'marked'

const ARTICLE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;line-height:1.8}
.wrap{max-width:780px;margin:0 auto;padding:48px 24px}
h1{font-size:2rem;font-weight:800;line-height:1.3;margin-bottom:8px;background:linear-gradient(135deg,#0f172a,#334155);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
h2{font-size:1.4rem;font-weight:700;margin:2.5rem 0 1rem;color:#0f172a;padding-left:12px;border-left:4px solid #3b82f6}
h3{font-size:1.1rem;font-weight:600;margin:1.8rem 0 .8rem;color:#1e293b}
p{margin-bottom:1.2rem;color:#374151}
strong{color:#0f172a;font-weight:600}
em{color:#475569}
ul,ol{margin:0 0 1.2rem 1.5rem}
li{margin-bottom:.5rem;color:#374151}
blockquote{border-left:4px solid #3b82f6;padding:.75rem 1rem;background:#eff6ff;border-radius:0 8px 8px 0;margin:1.5rem 0;color:#1d4ed8}
code{background:#f1f5f9;padding:.15em .4em;border-radius:4px;font-size:.875em;font-family:'Fira Code',monospace;color:#e11d48}
pre{background:#0f172a;color:#e2e8f0;padding:1.25rem;border-radius:10px;overflow-x:auto;margin:1.5rem 0}
pre code{background:none;color:inherit;padding:0}
figure{margin:2rem 0;text-align:center}
figure img{max-width:100%;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.12)}
figcaption{margin-top:.6rem;font-size:.85rem;color:#64748b}
img{max-width:100%;border-radius:12px;display:block;margin:1.5rem auto;box-shadow:0 4px 24px rgba(0,0,0,.1)}
hr{border:none;border-top:1px solid #e2e8f0;margin:2.5rem 0}
table{width:100%;border-collapse:collapse;margin:1.5rem 0}
th{background:#f1f5f9;padding:.6rem 1rem;font-weight:600;text-align:left;border:1px solid #e2e8f0}
td{padding:.6rem 1rem;border:1px solid #e2e8f0}
tr:nth-child(even) td{background:#f8fafc}
.meta{color:#64748b;font-size:.9rem;margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid #e2e8f0}
@media(max-width:600px){.wrap{padding:24px 16px}h1{font-size:1.5rem}h2{font-size:1.2rem}}
@media print{body{background:#fff}.wrap{max-width:100%;padding:0}}
`

export async function buildHtml(markdown: string, title: string): Promise<string> {
  const htmlContent = await marked.parse(markdown, { gfm: true, breaks: true })

  // 将 <p><img ...></p> 包裹为 <figure>
  const wrappedHtml = htmlContent.replace(
    /<p>(<img[^>]+>)<\/p>/g,
    (_: string, img: string) => {
      const altMatch = img.match(/alt="([^"]*)"/)
      const alt = altMatch ? altMatch[1] : ''
      return `<figure>${img}${alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`
    }
  )

  const safeTitle = title.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c))

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <style>${ARTICLE_CSS}</style>
</head>
<body>
  <div class="wrap">
    <p class="meta">由 YCWrite · AI科普文章生成器 生成</p>
    ${wrappedHtml}
  </div>
</body>
</html>`
}
