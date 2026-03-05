# Write Master Web 集成指南

## ✅ 已完成的工作

### 1. 后端 FastAPI 服务
- ✅ 创建 `write-master/api_server.py` - SSE 流式接口
- ✅ 创建 `write-master/requirements-api.txt` - API 依赖
- ✅ 修改 `write-master/main.py` - 添加事件回调支持
- ✅ 修复事件格式匹配前端期望（stage/research_complete/outline_complete/done）
- ✅ 修复 HTML 内容返回（读取文件内容而非路径）
- ✅ 图片已自动 base64 内联（无需额外处理）

### 2. 前端 Next.js 集成
- ✅ 修改 `ycwrite-web/app/api/generate/route.ts` - 调用后端 API
- ✅ 配置 `ycwrite-web/.env.local` - 添加 BACKEND_API_URL

---

## 🚀 本地测试步骤

### 步骤 1: 启动 FastAPI 后端

```bash
cd /Users/yangjingchuan/project/skills_adding/write_master/write-master

# 安装依赖
pip3 install -r requirements-api.txt

# 启动服务
python3 api_server.py
```

服务将在 http://localhost:8000 启动

### 步骤 2: 测试后端 API

```bash
# 健康检查
curl http://localhost:8000/health

# 测试文章生成（新终端）
./test_api.sh
```

### 步骤 3: 启动前端

```bash
cd /Users/yangjingchuan/project/skills_adding/write_master/ycwrite-web

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:3000 启动

### 步骤 4: 端到端测试

1. 访问 http://localhost:3000
2. 填写表单：
   - 主题：AI Agent
   - 受众：产品经理
   - 长度：短文
3. 点击生成
4. 观察实时进度更新

---

## 📦 生产部署

### 方案 A: 分离部署（推荐）

**后端部署（Railway/Render/AWS）：**

1. 将 `write-master` 目录部署到云服务器
2. 设置环境变量：
   ```
   ANTHROPIC_API_KEY=your_key
   ANTHROPIC_BASE_URL=https://wolfai.top
   GEMINI_API_KEY=your_gemini_key
   ```
3. 启动命令：`uvicorn api_server:app --host 0.0.0.0 --port 8000`

**前端部署（Vercel）：**

1. 在 Vercel 项目设置中添加环境变量：
   ```
   BACKEND_API_URL=https://your-backend-domain.com
   ```
2. 重新部署前端

### 方案 B: 反向代理（可选）

在 `ycwrite-web/next.config.ts` 中配置：

```typescript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/generate',
        destination: 'https://your-backend.com/api/generate'
      }
    ]
  }
}
```

---

## 🔍 事件流格式

后端发送的 SSE 事件类型：

```typescript
// 阶段更新
{ type: 'stage', stage: 1-6, name: '阶段名称' }

// 调研完成
{ type: 'research_complete', summary: '...', sources: [...] }

// 大纲完成
{ type: 'outline_complete', outline: '...' }

// 正文流式输出
{ type: 'stream', text: '...' }

// 配图开始
{ type: 'image_start', count: 3 }

// 单张图片完成
{ type: 'image_done', id: 'image_01', success: true }

// 全部完成
{ type: 'done', html: '...', title: '...', wordCount: 3000, imageCount: 3 }

// 错误
{ type: 'error', message: '...' }
```

---

## ⚠️ 注意事项

1. **超时限制**：Vercel 免费版 10 秒超时，Pro 版 5 分钟
2. **CORS 配置**：已在 api_server.py 中配置允许所有来源
3. **环境变量**：确保前后端的 API Key 一致
4. **MCP 工具**：后端需要 Node.js 环境（用于 MCP 服务器）

---

## 🐛 故障排查

**问题 1：前端无法连接后端**
- 检查 BACKEND_API_URL 是否正确
- 检查后端服务是否启动
- 检查防火墙/CORS 配置

**问题 2：后端报错 "ANTHROPIC_API_KEY not found"**
- 检查 write-master/.env 文件是否存在
- 确认环境变量已正确加载

**问题 3：图片生成失败**
- 检查 config.json 中的 Gemini API 配置
- 确认 IMAGE_API_KEY 有效

---

## 📊 性能优化（可选）

### 1. 添加 Redis 缓存
```python
from redis import Redis
cache = Redis(host='localhost', port=6379)
```

### 2. 使用 WebSocket 替代 SSE
```python
@app.websocket("/ws/generate")
async def websocket_generate(websocket: WebSocket):
    await websocket.accept()
    # 实时推送
```

### 3. 任务队列（多用户并发）
```python
from celery import Celery
celery = Celery('tasks', broker='redis://localhost:6379')
```
