# Write Master - AI科普文章自动化写作平台

**在线地址**: https://www.ycwrite.online/

## 📋 项目概览

Write Master 是一个基于 Claude API 的 AI 科普文章自动化写作平台，支持从主题到富文本成品的一站式完成。

**技术栈**:
- 前端: Next.js 15 + React 19 + TypeScript
- 后端: Python FastAPI + Anthropic Claude API
- 配图: Gemini API

## 🏗️ 项目结构

```
write_master/
├── write-master/          # 后端服务 (Python FastAPI)
│   ├── api_server.py      # API 服务器
│   ├── main.py            # 核心生成逻辑
│   ├── scripts/           # 工具脚本
│   ├── references/        # 提示词模板
│   └── SKILL.md           # Skill 定义
├── ycwrite-web/           # 前端应用 (Next.js)
│   ├── app/               # 页面和 API 路由
│   └── lib/               # 工具函数
└── README.md              # 本文件
```

## 🚀 快速开始

### 本地开发

**1. 启动后端**
```bash
cd write-master
pip3 install -r requirements-api.txt
python3 api_server.py
```

**2. 启动前端**
```bash
cd ycwrite-web
npm install
npm run dev
```

访问 http://localhost:3000

### 环境变量配置

**后端 (write-master/.env)**:
```
ANTHROPIC_API_KEY=your_key
ANTHROPIC_BASE_URL=https://wolfai.top
IMAGE_API_KEY=your_gemini_key
IMAGE_API_BASE=https://api.apicore.ai/v1
IMAGE_MODEL=gemini-2.5-flash-image-hd
```

**前端 (ycwrite-web/.env.local)**:
```
BACKEND_API_URL=http://localhost:8001
```

## 📦 生产部署

### 推荐方案: Render + Vercel

**后端部署到 Render**:
1. 访问 https://render.com/ 并登录
2. 创建 Web Service，连接 GitHub 仓库
3. 配置:
   - Root Directory: `write-master`
   - Runtime: Docker
   - 添加环境变量（见上方）
4. 部署完成后记录 URL

**前端部署到 Vercel**:
1. 在 Vercel 项目设置中更新环境变量:
   - `BACKEND_API_URL=https://your-backend.onrender.com`
2. 重新部署

详细步骤参考 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## 📚 文档

- [ARCHITECTURE.md](ARCHITECTURE.md) - 架构设计
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - 部署指南
- [docs/INTEGRATION.md](docs/INTEGRATION.md) - 集成说明

## 🔧 核心功能

1. **主题调研**: 自动搜索相关资料
2. **大纲生成**: 结构化内容规划
3. **正文写作**: 流式输出 Markdown
4. **AI 配图**: Gemini API 生成插图
5. **富文本排版**: 转换为带样式的 HTML

## ⚠️ 注意事项

- Render 免费版有 15 分钟无请求休眠机制
- 首次请求可能需要 30-60 秒冷启动
- 生成一篇文章通常需要 1-3 分钟

## 📄 License

MIT
