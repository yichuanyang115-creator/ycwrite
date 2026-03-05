# Write Master 部署指南

## 🚀 推荐方案: Render + Vercel

### 为什么选择这个方案？

1. **Render**: 免费额度充足（750小时/月），支持 Docker，配置简单
2. **Vercel**: 前端免费托管，自动部署，性能优秀
3. **总成本**: 0-7美元/月（免费版足够个人使用）

---

## 📋 部署步骤

### 步骤 1: 准备 Git 仓库

确保项目是统一的 monorepo 结构：

```bash
cd /Users/yangjingchuan/project/skills_adding/write_master

# 如果子目录有独立 .git，需要删除
rm -rf write-master/.git
rm -rf ycwrite-web/.git

# 确认当前仓库状态
git status
git add .
git commit -m "Prepare for deployment"
git push
```

### 步骤 2: 部署后端到 Render

1. **访问 Render**
   - 打开 https://render.com/
   - 使用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 选择你的 GitHub 仓库
   - 点击 "Connect"

3. **配置服务**
   ```
   Name: ycwrite-backend
   Region: Singapore (或最近的区域)
   Branch: main
   Root Directory: write-master
   Runtime: Docker
   Instance Type: Free
   ```

4. **添加环境变量**

   点击 "Advanced" → "Add Environment Variable"：
   ```
   ANTHROPIC_API_KEY=your_anthropic_key
   ANTHROPIC_BASE_URL=https://wolfai.top
   IMAGE_API_KEY=your_gemini_key
   IMAGE_API_BASE=https://api.apicore.ai/v1
   IMAGE_MODEL=gemini-2.5-flash-image-hd
   PORT=8001
   ```

5. **创建并部署**
   - 点击 "Create Web Service"
   - 等待部署完成（约 3-5 分钟）
   - 记录服务 URL，例如：`https://ycwrite-backend.onrender.com`

### 步骤 3: 更新前端配置

1. **在 Vercel 更新环境变量**
   - 访问 https://vercel.com/
   - 进入你的项目（ycwrite-web）
   - Settings → Environment Variables
   - 找到或添加 `BACKEND_API_URL`
   - 设置值为：`https://ycwrite-backend.onrender.com`（你的 Render URL）
   - 点击 Save

2. **重新部署前端**
   - 进入 Deployments 标签
   - 点击最新部署的 "..." → "Redeploy"
   - 等待部署完成

### 步骤 4: 验证部署

1. **测试后端健康检查**
   ```bash
   curl https://ycwrite-backend.onrender.com/health
   ```

   应该返回：
   ```json
   {"status":"ok","service":"write-master-api"}
   ```

2. **测试完整流程**
   - 访问 https://www.ycwrite.online/
   - 输入主题，例如："AI Agent"
   - 点击"开始生成"
   - 观察实时生成过程

---

## ⚠️ 重要提示

### Render 免费版限制

1. **休眠机制**: 15分钟无请求会休眠，下次请求需要冷启动（约30秒）
2. **每月 750 小时**: 足够个人使用
3. **超时限制**: 5分钟请求超时
4. **避免休眠**: 升级到 Starter 计划（$7/月）

### 首次请求较慢

- 冷启动需要 30-60 秒
- 可以在前端添加"正在唤醒服务"的提示
- 之后的请求会很快

---

## 🔧 故障排查

### 问题 1: Render 部署失败

**查看日志**:
- Render 项目页面 → Logs 标签
- 查看构建和运行日志

**常见原因**:
- Dockerfile 路径错误：确认 Root Directory 设置为 `write-master`
- 依赖安装失败：检查 `requirements-api.txt`
- 端口配置错误：确保设置了 `PORT=8001`

### 问题 2: 前端无法连接后端

**检查 CORS**:
- 后端已配置 `allow_origins=["*"]`，应该不会有 CORS 问题

**检查 URL**:
```bash
# 测试后端是否可访问
curl https://your-backend-url.onrender.com/health
```

**检查浏览器控制台**:
- 打开开发者工具 → Console
- 查看是否有网络错误
- 确认请求的 URL 是否正确

### 问题 3: 生成过程中断

**超时问题**:
- Render 免费版有 5 分钟超时
- 如果文章生成超过 5 分钟，考虑：
  - 优化生成流程
  - 减少内容长度
  - 升级 Render 计划

**API 配额**:
- 检查 Anthropic API 配额是否用完
- 检查 Gemini API 配额

---

## 🎯 其他部署方案

### 方案 B: Railway + Vercel

Railway 配置更简单，但免费额度较少（$5/月）。

**部署步骤**:
1. 访问 https://railway.app/
2. 创建新项目，连接 GitHub 仓库
3. 设置 Root Directory 为 `write-master`
4. 添加环境变量（同上）
5. 部署完成后更新 Vercel 环境变量

### 方案 C: 自建服务器

如果有自己的服务器，可以使用 Docker Compose：

```bash
cd write_master
docker-compose up -d
```

需要配置 Nginx 反向代理和 SSL 证书。

---

## 📊 成本对比

| 平台 | 后端 | 前端 | 总成本 |
|------|------|------|--------|
| Render + Vercel | 免费/$7 | 免费 | $0-7/月 |
| Railway + Vercel | $5 | 免费 | $5/月 |
| 自建服务器 | VPS成本 | 免费 | $5-20/月 |

**推荐**: Render 免费版，够用且稳定。

---

## 📈 性能优化建议

1. **添加监控**: 使用 Render 的 Metrics 监控资源使用
2. **添加缓存**: 使用 Redis 缓存常见查询结果
3. **优化图片**: 压缩生成的图片，减少传输大小
4. **添加 CDN**: 使用 Cloudflare 加速静态资源

---

## 🔐 安全建议

1. **限制 CORS**: 将 `allow_origins` 改为具体域名
2. **添加认证**: 实现 API 密钥认证
3. **速率限制**: 防止滥用 API
4. **环境变量**: 确保 API 密钥不暴露在代码中

---

部署成功后，你的 Write Master 就可以完整运行了！🎉
