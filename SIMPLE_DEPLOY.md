# 🚀 最简单的部署方案：使用 Render

## 为什么选择 Render？

1. **免费额度充足**：750 小时/月免费
2. **支持 Monorepo**：可以在一个仓库部署多个服务
3. **配置简单**：Web 界面操作，不需要 CLI
4. **自动部署**：推送代码自动重新部署

---

## 📋 部署步骤（10分钟搞定）

### 步骤 1：整理 Git 仓库（2分钟）

```bash
cd /Users/yangjingchuan/project/skills_adding/write_master

# 删除子目录的独立 Git 仓库
rm -rf write-master/.git
rm -rf ycwrite-web/.git

# 初始化统一仓库
git init
git add .
git commit -m "Unified monorepo for deployment"

# 推送到 GitHub（如果还没有远程仓库）
# 方式 1：创建新仓库
# 去 GitHub 创建新仓库 ycwrite-fullstack，然后：
git remote add origin https://github.com/yichuanyang115-creator/ycwrite-fullstack.git
git branch -M main
git push -u origin main

# 方式 2：使用现有仓库（覆盖）
# git remote add origin https://github.com/yichuanyang115-creator/ycwrite.git
# git branch -M main
# git push -f origin main
```

### 步骤 2：部署后端到 Render（3分钟）

1. **访问 Render**
   - 打开 https://render.com/
   - 用 GitHub 账号登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 选择你的 GitHub 仓库 `ycwrite-fullstack`
   - 点击 "Connect"

3. **配置后端服务**
   ```
   Name: ycwrite-backend
   Region: Singapore (最近)
   Branch: main
   Root Directory: write-master
   Runtime: Docker
   Instance Type: Free
   ```

4. **添加环境变量**

   点击 "Advanced" → "Add Environment Variable"：
   ```
   ANTHROPIC_API_KEY=sk-reKOxLGDifJmPDOBKUYx9vFOHUXKsgVfKbRmzlhwXQjbfN85
   ANTHROPIC_BASE_URL=https://wolfai.top
   IMAGE_API_KEY=sk-YG7XqNuYtybjzGLwq5SHCVONFJcYZ69wSITuyuV6QACgOYcM
   IMAGE_API_BASE=https://api.apicore.ai/v1
   IMAGE_MODEL=gemini-2.5-flash-image-hd
   PORT=8001
   ```

5. **创建服务**
   - 点击 "Create Web Service"
   - 等待部署完成（约 3-5 分钟）
   - 记录服务 URL，例如：`https://ycwrite-backend.onrender.com`

### 步骤 3：更新前端配置（2分钟）

1. **更新 Vercel 环境变量**
   - 访问 https://vercel.com/
   - 进入 `ycwrite-web` 项目
   - Settings → Environment Variables
   - 找到 `BACKEND_API_URL`
   - 修改为：`https://ycwrite-backend.onrender.com`（你的 Render URL）
   - 点击 Save

2. **重新部署前端**
   - 进入 Deployments 标签
   - 点击最新部署的 "..." → "Redeploy"
   - 等待部署完成

### 步骤 4：测试（1分钟）

1. 访问 https://www.ycwrite.online/
2. 输入主题，例如："AI Agent"
3. 点击"开始生成"
4. 应该能看到完整的生成流程

---

## ⚠️ 注意事项

### Render 免费版限制

1. **休眠机制**：15分钟无请求会休眠，下次请求需要冷启动（约30秒）
2. **每月 750 小时**：足够个人使用
3. **如果需要避免休眠**：升级到 Starter 计划（$7/月）

### 首次请求可能较慢

- 冷启动需要 30-60 秒
- 之后的请求会很快
- 可以添加一个"正在唤醒服务"的提示

---

## 🔧 故障排查

### 问题 1：Render 部署失败

**查看日志**：
- Render 项目页面 → Logs 标签
- 查看错误信息

**常见原因**：
- Dockerfile 路径错误：确认 Root Directory 设置为 `write-master`
- 依赖安装失败：检查 `requirements-api.txt`

### 问题 2：前端无法连接后端

**检查 CORS**：
- 后端已配置 `allow_origins=["*"]`

**检查 URL**：
```bash
# 测试后端健康检查
curl https://ycwrite-backend.onrender.com/health
```

应该返回：
```json
{"status":"ok","service":"write-master-api"}
```

### 问题 3：生成过程中断

**超时问题**：
- Render 免费版有 5 分钟超时
- 如果超时，考虑优化代码或升级计划

---

## 📊 成本对比

| 平台 | 后端 | 前端 | 总成本 |
|------|------|------|--------|
| Render + Vercel | 免费/7美元 | 免费 | 0-7美元/月 |
| Railway + Vercel | 5美元 | 免费 | 5美元/月 |
| 全 Vercel | 不适合 | 免费 | - |

**推荐**：Render 免费版，够用且稳定。

---

## 🎯 立即执行

复制以下命令，一步步执行：

```bash
# 1. 整理仓库
cd /Users/yangjingchuan/project/skills_adding/write_master
rm -rf write-master/.git ycwrite-web/.git
git init
git add .
git commit -m "Unified monorepo for deployment"

# 2. 推送到 GitHub（选择一种方式）
# 新仓库：
git remote add origin https://github.com/yichuanyang115-creator/ycwrite-fullstack.git
git branch -M main
git push -u origin main

# 或覆盖现有仓库：
# git remote add origin https://github.com/yichuanyang115-creator/ycwrite.git
# git branch -M main
# git push -f origin main

# 3. 然后去 Render 网站按照步骤 2 操作
```

这是最简单、最可靠的方案。你现在就可以开始执行了！
