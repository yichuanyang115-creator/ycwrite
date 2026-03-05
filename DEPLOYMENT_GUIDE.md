# Write Master 部署完整指南

## 问题诊断

✅ **前端状态**：已成功部署到 Vercel (https://www.ycwrite.online/)
❌ **后端状态**：未部署，导致功能无法使用
🔧 **问题原因**：前端 API 调用指向 `localhost:8001`，但生产环境需要实际的后端服务

---

## 解决方案

### 方案 1：Railway 部署（推荐，免费额度充足）

#### 1.1 通过 Web 界面部署

1. **访问 Railway**
   ```
   https://railway.app/
   ```
   使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库
   - 如果仓库根目录不是 `write-master`，需要在设置中指定根目录

3. **配置环境变量**

   在项目的 Variables 标签页添加以下变量：
   ```
   ANTHROPIC_API_KEY=sk-reKOxLGDifJmPDOBKUYx9vFOHUXKsgVfKbRmzlhwXQjbfN85
   ANTHROPIC_BASE_URL=https://wolfai.top
   IMAGE_API_KEY=sk-YG7XqNuYtybjzGLwq5SHCVONFJcYZ69wSITuyuV6QACgOYcM
   IMAGE_API_BASE=https://api.apicore.ai/v1
   IMAGE_MODEL=gemini-2.5-flash-image-hd
   PORT=8001
   ```

4. **等待部署**
   - Railway 会自动检测 Dockerfile 并构建
   - 部署完成后，在 Settings → Domains 中生成公开域名
   - 记录这个 URL，例如：`https://write-master-production.up.railway.app`

#### 1.2 通过 CLI 部署（快速）

```bash
# 进入后端目录
cd write-master

# 运行部署脚本
../deploy-backend.sh
```

或手动执行：

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 设置环境变量
railway variables set ANTHROPIC_API_KEY=sk-reKOxLGDifJmPDOBKUYx9vFOHUXKsgVfKbRmzlhwXQjbfN85
railway variables set ANTHROPIC_BASE_URL=https://wolfai.top
railway variables set IMAGE_API_KEY=sk-YG7XqNuYtybjzGLwq5SHCVONFJcYZ69wSITuyuV6QACgOYcM
railway variables set IMAGE_API_BASE=https://api.apicore.ai/v1
railway variables set IMAGE_MODEL=gemini-2.5-flash-image-hd
railway variables set PORT=8001

# 部署
railway up

# 获取域名
railway domain
```

---

### 方案 2：Render 部署（备选）

1. **访问 Render**
   ```
   https://render.com/
   ```

2. **创建 Web Service**
   - 选择 "New +" → "Web Service"
   - 连接 GitHub 仓库
   - 选择 `write-master` 目录

3. **配置**
   - Name: `write-master-api`
   - Environment: `Docker`
   - 添加环境变量（同上）

4. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成

---

### 方案 3：Vercel Serverless（需要调整代码）

如果想在 Vercel 上部署后端，需要将 FastAPI 改为 Serverless 函数。当前架构不支持，需要重构。

---

## 更新前端配置

部署后端后，需要更新前端环境变量：

### 在 Vercel 中更新

1. 进入 Vercel 项目：https://vercel.com/
2. 选择 `ycwrite-web` 项目
3. Settings → Environment Variables
4. 找到 `BACKEND_API_URL`
5. 修改为后端部署的 URL（例如：`https://write-master-production.up.railway.app`）
6. 点击 Save
7. 进入 Deployments 标签
8. 点击最新部署的 "..." → "Redeploy"

### 或者更新本地 .env.local 并推送

```bash
cd ycwrite-web

# 编辑 .env.local
# 将 BACKEND_API_URL 改为实际的后端 URL

# 提交并推送
git add .env.local
git commit -m "Update backend URL"
git push

# Vercel 会自动重新部署
```

---

## 验证部署

### 1. 测试后端健康检查

```bash
curl https://your-backend-url.railway.app/health
```

应该返回：
```json
{"status":"ok","service":"write-master-api"}
```

### 2. 测试前端

访问 https://www.ycwrite.online/
- 输入主题，例如："AI Agent"
- 选择受众和长度
- 点击"开始生成"
- 应该能看到进度条和实时生成过程

---

## 故障排查

### 问题 1：后端部署失败

**检查日志**
- Railway: 项目页面 → Deployments → 点击失败的部署 → View Logs
- Render: 项目页面 → Logs

**常见原因**
- 依赖安装失败：检查 `requirements-api.txt`
- 端口配置错误：确保设置了 `PORT` 环境变量
- Dockerfile 错误：检查 `Dockerfile` 语法

### 问题 2：前端无法连接后端

**检查 CORS**
- 后端已配置 `allow_origins=["*"]`，应该不会有 CORS 问题

**检查 URL**
- 确认 Vercel 环境变量 `BACKEND_API_URL` 正确
- 确认后端 URL 可以访问（访问 `/health` 端点）

**检查浏览器控制台**
- 打开 https://www.ycwrite.online/
- 按 F12 打开开发者工具
- 查看 Console 和 Network 标签的错误信息

### 问题 3：生成过程中断

**超时问题**
- Railway 免费版有 5 分钟超时限制
- 如果文章生成超过 5 分钟，考虑升级 Railway 计划
- 或者优化生成流程，减少耗时

**API 配额**
- 检查 Anthropic API 配额是否用完
- 检查图片生成 API 配额

---

## 成本估算

### Railway（推荐）
- 免费额度：$5/月
- 预计使用：后端服务约 $3-5/月
- 适合个人项目和测试

### Render
- 免费版：有限制（休眠机制）
- Starter 版：$7/月
- 适合小型项目

### Vercel
- 前端免费
- Serverless 函数有限制（需要重构代码）

---

## 下一步优化建议

1. **添加监控**
   - 使用 Railway 的 Metrics 监控资源使用
   - 添加错误日志收集（如 Sentry）

2. **优化性能**
   - 添加 Redis 缓存常见查询结果
   - 优化图片生成流程

3. **增强安全性**
   - 限制 CORS 为具体域名
   - 添加 API 密钥认证
   - 添加请求频率限制

4. **备份数据**
   - 定期备份生成的文章
   - 考虑添加数据库存储历史记录

---

## 联系支持

如果遇到问题：
1. 检查 Railway/Render 的日志
2. 查看浏览器控制台错误
3. 检查环境变量配置
4. 确认 API 密钥有效

部署成功后，你的 Write Master 就可以完整运行了！🎉
