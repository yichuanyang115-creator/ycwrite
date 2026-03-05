# Write Master 集成说明

## ✅ 已完成的集成工作

### 1. 后端 FastAPI 服务

- ✅ `write-master/api_server.py` - SSE 流式接口
- ✅ `write-master/requirements-api.txt` - API 依赖
- ✅ `write-master/main.py` - 核心生成逻辑 + 事件回调
- ✅ 事件格式匹配前端期望
- ✅ HTML 内容正确返回
- ✅ 图片自动 base64 内联

### 2. 前端 Next.js 应用

- ✅ `ycwrite-web/app/api/generate/route.ts` - 调用后端 API
- ✅ `ycwrite-web/.env.local` - 环境变量配置
- ✅ 实时进度显示
- ✅ 流式内容预览

---

## 🔌 API 接口说明

### 端点: POST /api/generate

**请求格式**:
```json
{
  "topic": "AI Agent",
  "audience": "产品经理",
  "length": "short",
  "viewpoint": "可选的核心观点"
}
```

**响应格式**: Server-Sent Events (SSE)

### 事件类型

#### 1. 阶段更新
```json
{
  "type": "stage",
  "stage": 1,
  "name": "主题调研"
}
```

阶段列表:
- Stage 1: 主题调研
- Stage 2: 大纲生成
- Stage 3: 正文写作
- Stage 4: 配图生成
- Stage 5: 富文本排版
- Stage 6: 完成

#### 2. 调研完成
```json
{
  "type": "research_complete",
  "summary": "调研摘要",
  "sources": ["来源1", "来源2"]
}
```

#### 3. 大纲完成
```json
{
  "type": "outline_complete",
  "outline": "# 大纲内容\n## 章节1\n..."
}
```

#### 4. 正文流式输出
```json
{
  "type": "stream",
  "text": "文章内容片段..."
}
```

#### 5. 配图开始
```json
{
  "type": "image_start",
  "count": 3
}
```

#### 6. 单张图片完成
```json
{
  "type": "image_done",
  "id": "image_01",
  "success": true
}
```

#### 7. 全部完成
```json
{
  "type": "done",
  "html": "<html>完整的富文本内容</html>",
  "title": "文章标题",
  "wordCount": 3000,
  "imageCount": 3
}
```

#### 8. 错误
```json
{
  "type": "error",
  "message": "错误信息"
}
```

---

## 🧪 本地测试

### 1. 启动后端

```bash
cd write-master

# 安装依赖
pip3 install -r requirements-api.txt

# 启动服务
python3 api_server.py
```

服务将在 http://localhost:8001 启动

### 2. 测试后端 API

```bash
# 健康检查
curl http://localhost:8001/health

# 测试文章生成
curl -X POST http://localhost:8001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI Agent",
    "audience": "产品经理",
    "length": "short"
  }'
```

### 3. 启动前端

```bash
cd ycwrite-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:3000 启动

### 4. 端到端测试

1. 访问 http://localhost:3000
2. 填写表单并提交
3. 观察实时进度和内容生成

---

## 🔧 配置说明

### 后端配置 (write-master/.env)

```bash
# Anthropic API
ANTHROPIC_API_KEY=your_key
ANTHROPIC_BASE_URL=https://wolfai.top

# Gemini 配图 API
IMAGE_API_KEY=your_gemini_key
IMAGE_API_BASE=https://api.apicore.ai/v1
IMAGE_MODEL=gemini-2.5-flash-image-hd

# 服务端口
PORT=8001
```

### 前端配置 (ycwrite-web/.env.local)

```bash
# 后端 API 地址
BACKEND_API_URL=http://localhost:8001

# 生产环境
# BACKEND_API_URL=https://your-backend.onrender.com
```

---

## 🚀 生产部署集成

### 方案 A: 分离部署（推荐）

**后端**: 部署到 Render/Railway
**前端**: 部署到 Vercel

**集成步骤**:
1. 部署后端，获取 URL（如 `https://backend.onrender.com`）
2. 在 Vercel 设置环境变量 `BACKEND_API_URL`
3. 重新部署前端

### 方案 B: Next.js API 路由代理

在 `ycwrite-web/next.config.ts` 中配置反向代理：

```typescript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/generate',
        destination: process.env.BACKEND_API_URL + '/api/generate'
      }
    ]
  }
}
```

这样前端可以直接调用 `/api/generate`，Next.js 会自动转发到后端。

---

## ⚠️ 注意事项

### 1. 超时限制

- **Vercel 免费版**: 10秒超时（不适合长时间生成）
- **Vercel Pro**: 5分钟超时
- **Render 免费版**: 5分钟超时
- **建议**: 使用分离部署，后端独立运行

### 2. CORS 配置

后端已配置允许所有来源：
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

生产环境建议限制为具体域名：
```python
allow_origins=["https://www.ycwrite.online"]
```

### 3. 环境变量安全

- ✅ API 密钥存储在后端环境变量
- ✅ 前端只存储后端 URL
- ❌ 不要在前端代码中暴露 API 密钥

### 4. MCP 工具依赖

后端使用 MCP (Model Context Protocol) 进行网络搜索，需要：
- Node.js 环境
- MCP 服务器配置

确保部署环境安装了 Node.js。

---

## 🐛 常见问题

### Q1: 前端无法连接后端

**检查清单**:
- [ ] 后端服务是否启动
- [ ] `BACKEND_API_URL` 是否正确
- [ ] 防火墙/CORS 配置
- [ ] 浏览器控制台是否有错误

### Q2: 后端报错 "ANTHROPIC_API_KEY not found"

**解决方案**:
- 检查 `write-master/.env` 文件是否存在
- 确认环境变量已正确加载
- 生产环境检查平台的环境变量设置

### Q3: 图片生成失败

**可能原因**:
- Gemini API 配置错误
- API 密钥无效或配额用完
- 网络连接问题

**调试方法**:
```bash
# 查看后端日志
tail -f write-master/logs/*.log
```

### Q4: SSE 连接中断

**可能原因**:
- 网络不稳定
- 代理服务器不支持 SSE
- 超时限制

**解决方案**:
- 添加重连机制
- 使用 WebSocket 替代 SSE
- 增加超时时间

---

## 📊 性能优化

### 1. 添加缓存

使用 Redis 缓存常见主题的调研结果：

```python
import redis
cache = redis.Redis(host='localhost', port=6379)

# 缓存调研结果
cache.set(f"research:{topic}", research_data, ex=3600)
```

### 2. 并行处理

图片生成可以并行处理：

```python
import asyncio

async def generate_images_parallel(prompts):
    tasks = [generate_image(prompt) for prompt in prompts]
    return await asyncio.gather(*tasks)
```

### 3. 流式优化

减少每次发送的数据量，提高响应速度：

```python
# 每 100 个字符发送一次
buffer = ""
for char in content:
    buffer += char
    if len(buffer) >= 100:
        yield buffer
        buffer = ""
```

---

## 🔄 升级路径

### 短期优化
- [ ] 添加请求队列（多用户并发）
- [ ] 实现历史记录功能
- [ ] 添加文章编辑功能

### 中期优化
- [ ] 用户认证系统
- [ ] 云端存储历史记录
- [ ] 支持导出 PDF/Word

### 长期优化
- [ ] 多语言支持
- [ ] 自定义写作风格
- [ ] 协作编辑功能

---

集成完成！如有问题，请查看日志或联系开发者。
