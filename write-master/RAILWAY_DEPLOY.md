# Railway 部署指南

## 快速部署步骤

### 1. 准备 Railway 账号
- 访问 https://railway.app/
- 使用 GitHub 账号登录

### 2. 部署后端

**方式 A：通过 GitHub（推荐）**

1. 将 `write-master` 目录推送到 GitHub 仓库
2. 在 Railway 点击 "New Project" → "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway 会自动检测 Python 项目并部署

**方式 B：通过 Railway CLI**

```bash
cd write-master
npm install -g @railway/cli
railway login
railway init
railway up
```

### 3. 配置环境变量

在 Railway 项目设置中添加：

```
ANTHROPIC_API_KEY=sk-reKOxLGDifJmPDOBKUYx9vFOHUXKsgVfKbRmzlhwXQjbfN85
ANTHROPIC_BASE_URL=https://wolfai.top
IMAGE_API_KEY=sk-YG7XqNuYtybjzGLwq5SHCVONFJcYZ69wSITuyuV6QACgOYcM
IMAGE_API_BASE=https://api.apicore.ai/v1
IMAGE_MODEL=gemini-2.5-flash-image-hd
```

### 4. 获取部署 URL

部署完成后，Railway 会提供一个 URL，例如：
```
https://your-app.railway.app
```

### 5. 更新 Vercel 环境变量

在 Vercel 项目设置中更新：
```
BACKEND_API_URL=https://your-app.railway.app
```

然后重新部署前端。

### 6. 测试

访问 https://www.ycwrite.online/ 测试完整流程。

---

## 故障排查

**问题：部署失败**
- 检查 Railway 日志
- 确认 requirements-api.txt 包含所有依赖

**问题：运行时错误**
- 检查环境变量是否正确设置
- 查看 Railway 的 Logs 标签页

**问题：前端无法连接**
- 确认 BACKEND_API_URL 正确
- 检查 CORS 配置（已在 api_server.py 中配置）
