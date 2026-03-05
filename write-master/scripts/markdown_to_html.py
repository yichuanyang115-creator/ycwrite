#!/usr/bin/env python3
"""
Markdown转富文本HTML脚本
将文章Markdown和配图合并，输出可直接在浏览器打开的独立HTML文件

用法：
  python markdown_to_html.py \
    --input article.md \
    --images ./output/images/ \
    --template assets/html-template.html \
    --css assets/styles.css \
    --output ./output/article.html
"""

import argparse
import base64
import json
import re
import sys
from pathlib import Path

try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False


def read_file(path: str | Path) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def image_to_base64(image_path: Path) -> str | None:
    """将图片转为base64内联数据URI"""
    if not image_path.exists():
        return None

    suffix = image_path.suffix.lower()
    mime_map = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".svg": "image/svg+xml", ".gif": "image/gif", ".webp": "image/webp"}
    mime = mime_map.get(suffix, "image/png")

    with open(image_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{data}"


def replace_image_placeholders(content: str, images_dir: Path) -> str:
    """
    将Markdown中的图片引用替换为base64内联图片
    支持格式：![alt](images/image_01.png) 或 ![alt](image_01.png)
    """
    def replace_match(match):
        alt_text = match.group(1)
        img_path_str = match.group(2)

        # 尝试在images_dir中查找图片
        candidates = [
            images_dir / img_path_str,
            images_dir / Path(img_path_str).name,
            Path(img_path_str),
        ]

        for candidate in candidates:
            if candidate.exists():
                b64 = image_to_base64(candidate)
                if b64:
                    return f'![{alt_text}]({b64})'
                break

        # 未找到图片，保留原始引用
        return match.group(0)

    return re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_match, content)


def markdown_to_html_content(md_content: str) -> str:
    """将Markdown转换为HTML内容"""
    if MARKDOWN_AVAILABLE:
        return markdown.markdown(
            md_content,
            extensions=["tables", "fenced_code", "toc", "nl2br"],
        )
    else:
        # 基础fallback：手动转换常见Markdown语法
        html = md_content

        # 标题
        for i in range(6, 0, -1):
            pattern = r'^' + '#' * i + r'\s+(.+)$'
            html = re.sub(pattern, rf'<h{i}>\1</h{i}>', html, flags=re.MULTILINE)

        # 粗体和斜体
        html = re.sub(r'\*\*\*(.+?)\*\*\*', r'<strong><em>\1</em></strong>', html)
        html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)

        # 代码块
        html = re.sub(r'```[\w]*\n(.*?)```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
        html = re.sub(r'`(.+?)`', r'<code>\1</code>', html)

        # 图片（处理base64）
        html = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)',
                      r'<figure><img src="\2" alt="\1"><figcaption>\1</figcaption></figure>', html)

        # 链接
        html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)

        # 段落（双换行）
        paragraphs = html.split('\n\n')
        processed = []
        for p in paragraphs:
            p = p.strip()
            if p and not p.startswith('<h') and not p.startswith('<pre') and not p.startswith('<figure'):
                p = f'<p>{p}</p>'
            processed.append(p)
        html = '\n'.join(processed)

        return html


def build_html(template: str, css: str, article_html: str, title: str) -> str:
    """将内容填入HTML模板"""
    # 将图片Markdown语法转为HTML figure标签
    article_html = re.sub(
        r'<img src="([^"]+)" alt="([^"]*)"',
        r'<img src="\1" alt="\2" loading="lazy"',
        article_html
    )

    # 用figcaption包裹已有的图片（如果markdown库已处理）
    article_html = re.sub(
        r'<p>(<img[^>]+>)</p>',
        r'<figure>\1</figure>',
        article_html
    )

    html = template
    html = html.replace("{{TITLE}}", title)
    html = html.replace("{{CSS}}", css)
    html = html.replace("{{CONTENT}}", article_html)

    return html


def extract_title(md_content: str) -> str:
    """从Markdown内容中提取第一个H1标题"""
    match = re.search(r'^#\s+(.+)$', md_content, re.MULTILINE)
    return match.group(1).strip() if match else "文章"


def main():
    parser = argparse.ArgumentParser(description="Markdown转富文本HTML")
    parser.add_argument("--input", required=True, help="输入Markdown文件路径")
    parser.add_argument("--images", default="./output/images", help="图片目录")
    parser.add_argument("--template", default="assets/html-template.html", help="HTML模板路径")
    parser.add_argument("--css", default="assets/styles.css", help="CSS样式文件路径")
    parser.add_argument("--output", default="./output/article.html", help="输出HTML文件路径")
    args = parser.parse_args()

    # 检查依赖
    if not MARKDOWN_AVAILABLE:
        print("⚠️  python-markdown 未安装，使用基础转换。建议安装：pip install markdown")

    # 读取输入文件
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"❌ 输入文件未找到：{args.input}")
        sys.exit(1)

    md_content = read_file(input_path)
    images_dir = Path(args.images)

    # 查找模板文件（相对于脚本所在目录）
    script_dir = Path(__file__).parent.parent  # skill根目录
    template_path = Path(args.template)
    if not template_path.exists():
        template_path = script_dir / args.template
    css_path = Path(args.css)
    if not css_path.exists():
        css_path = script_dir / args.css

    if not template_path.exists():
        print(f"❌ HTML模板未找到：{args.template}")
        sys.exit(1)
    if not css_path.exists():
        print(f"❌ CSS文件未找到：{args.css}")
        sys.exit(1)

    template = read_file(template_path)
    css = read_file(css_path)

    # 替换图片占位符为base64
    print("处理图片...")
    md_with_images = replace_image_placeholders(md_content, images_dir)

    # 转换Markdown为HTML
    print("转换Markdown...")
    article_html = markdown_to_html_content(md_with_images)

    # 提取标题
    title = extract_title(md_content)

    # 生成最终HTML
    final_html = build_html(template, css, article_html, title)

    # 写入输出文件
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(final_html)

    file_size = output_path.stat().st_size / 1024
    print(f"✅ 输出完成：{output_path.resolve()}")
    print(f"   文件大小：{file_size:.1f} KB")
    print(f"   标题：{title}")


if __name__ == "__main__":
    main()
