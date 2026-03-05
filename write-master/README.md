# Write Master - AI科普文章自动化写作

大师级AI科普文章自动化写作技能。支持从主题到富文本成品的一站式完成。

## 功能特性

- ✅ 6个人工审核节点，确保内容质量
- ✅ 多信息源调研（Web + 微信公众号 + 小红书）
- ✅ HOOK-BRIDGE-CORE-CLOSE 文章结构
- ✅ AI自动配图（Gemini API）
- ✅ 富文本HTML输出

## 工作流程

1. **需求确认与参数收集** → 审核节点 1
2. **主题调研（MCP工具）** → 审核节点 2
3. **大纲生成** → 审核节点 3
4. **正文写作** → 审核节点 4
5. **配图生成** → 审核节点 5
6. **富文本排版** → 审核节点 6

## 安装依赖

```bash
pip install anthropic
```

## 环境变量配置

创建 `.env` 文件：

```bash
# Claude API
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=https://api.anthropic.com  # 可选

# Gemini API（用于图片生成）
GEMINI_API_KEY=your_gemini_key
```

## 使用方法

### 基本用法

```bash
python main.py "Claude API 使用指南"
```

### 指定参数

```bash
python main.py "Claude API 使用指南" --audience dev --length medium
```

## 输出文件

- `output/article.html` - 最终富文本文章
- `output/article.md` - Markdown源文件
- `output/research.md` - 调研报告
- `output/images/` - 配图文件夹
- `output/progress.json` - 进度状态

## 项目结构

```
write-master/
├── main.py                 # 主控制器
├── lib/                    # 核心模块
│   ├── params.py          # 参数处理
│   ├── review.py          # 审核节点
│   └── mcp_tools.py       # MCP工具封装
├── scripts/               # 工具脚本
│   ├── gemini_image_gen.py
│   ├── markdown_to_html.py
│   ├── config_loader.py
│   └── progress_tracker.py
├── references/            # 参考文档
│   ├── mcp-setup.md
│   ├── research-guide.md
│   ├── outline-templates.md
│   ├── writing-styles.md
│   ├── image-prompts-guide.md
│   └── gemini-setup.md
├── assets/                # 资源文件
│   ├── html-template.html
│   └── styles.css
└── output/                # 输出目录
```

## 当前状态

✅ 已完成：
- 参数收集模块
- 审核节点模块
- MCP工具封装（框架）
- 主控制器（框架）

⚠️ 待完善：
- MCP工具的实际调用实现
- Claude API 的大纲生成
- Claude API 的文章写作
- Gemini API 的图片生成集成
- Markdown 到 HTML 的转换

## 下一步计划

1. 实现 MCP 工具的实际调用
2. 完善 Claude API 集成（大纲、写作）
3. 集成 Gemini 图片生成
4. 测试完整工作流
5. 与 Web 应用集成

## 许可证

MIT
