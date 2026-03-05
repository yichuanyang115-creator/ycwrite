# 🚀 快速部署指南 - 本地后端 + 公网访问

## ✅ 当前状态

- ✅ 后端运行在本地 `localhost:8001`
- ✅ 通过 localtunnel 暴露到公网
- ✅ 公网地址：`https://empty-ties-judge.loca.lt`

---

## 📋 Vercel 配置步骤（5分钟）

### 步骤 1: 登录 Vercel

1. 访问 https://vercel.com/
2. 使用 GitHub 账号登录

### 步骤 2: 进入项目设置

1. 在 Dashboard 找到你的项目（应该叫 `ycwrite-web` 或类似名称）
2. 点击项目名称进入项目页面
3. 点击顶部的 **Settings** 标签

### 步骤 3: 更新环境变量

1. 在左侧菜单点击 **Environment Variables**
2. 查找是否已有 `BACKEND_API_URL` 变量：

   **如果已存在**：
   - 点击变量右侧的 "..." 按钮
   - 选择 "Edit"
   - 修改值为：`https://empty-ties-judge.loca.lt`
   - 点击 "Save"

   **如果不存在**：
   - 点击 "Add New" 按钮
   - Name: `BACKEND_API_URL`
   - Value: `https://empty-ties-judge.loca.lt`
   - Environment: 选择 **Production**, **Preview**, **Development** 全部勾选
   - 点击 "Save"

### 步骤 4: 重新部署

1. 点击顶部的 **Deployments** 标签
2. 找到最新的部署记录（第一行）
3. 点击右侧的 "..." 按钮
4. 选择 **Redeploy**
5. 在弹窗中点击 **Redeploy** 确认
6. 等待部署完成（约 1-2 分钟）

### 步骤 5: 验证部署

1. 部署完成后，点击 **Visit** 按钮访问网站
2. 或直接访问 https://www.ycwrite.online/
3. 输入一个测试主题，例如："AI Agent"
4. 点击"开始生成"
5. 应该能看到实时生成过程！

---

## 🔧 保持本地服务运行

### 确保后端持续运行

在你的终端保持以下进程运行：

```bash
# 1. 后端服务（在 write-master 目录）
cd /Users/yangjingchuan/project/skills_adding/write_master/write-master
python3 api_server.py

# 2. localtunnel 隧道（在另一个终端）
cd /Users/yangjingchuan/project/skills_adding/write_master/ycwrite-web
npx localtunnel --port 8001
```

### 查看当前隧道地址

如果忘记了隧道地址，运行：

```bash
cat /tmp/lt.log
```

或者重新启动隧道：

```bash
npx localtunnel --port 8001
```

---

## ⚠️ 重要提示

### 1. 隧道地址会变化

每次重启 localtunnel，URL 都会变化（例如从 `empty-ties-judge.loca.lt` 变成 `blue-cats-run.loca.lt`）。

**如果 URL 变化了**：
1. 记录新的 URL
2. 回到 Vercel 更新 `BACKEND_API_URL`
3. 重新部署

### 2. 电脑需要保持开机

- 本地后端必须一直运行
- 电脑关机或休眠，网站就无法使用
- 适合演示和测试，不适合长期使用

### 3. 首次访问可能需要验证

localtunnel 有时会显示一个验证页面，点击 "Click to Continue" 即可。

---

## 🎯 快速启动脚本

为了方便，创建一个启动脚本：

```bash
# 创建启动脚本
cat > /Users/yangjingchuan/project/skills_adding/write_master/start-tunnel.sh << 'EOF'
#!/bin/bash

echo "🚀 启动 Write Master 后端和隧道..."

# 启动后端
cd /Users/yangjingchuan/project/skills_adding/write_master/write-master
python3 api_server.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动隧道
cd /Users/yangjingchuan/project/skills_adding/write_master/ycwrite-web
npx localtunnel --port 8001 > /tmp/lt.log 2>&1 &
TUNNEL_PID=$!
echo "✅ 隧道已启动 (PID: $TUNNEL_PID)"

# 等待隧道启动
sleep 5

# 显示隧道地址
echo ""
echo "🌐 公网地址："
cat /tmp/lt.log
echo ""
echo "📝 请将此地址更新到 Vercel 的 BACKEND_API_URL 环境变量"
echo ""
echo "停止服务请运行: kill $BACKEND_PID $TUNNEL_PID"
EOF

# 添加执行权限
chmod +x /Users/yangjingchuan/project/skills_adding/write_master/start-tunnel.sh
```

以后只需运行：

```bash
/Users/yangjingchuan/project/skills_adding/write_master/start-tunnel.sh
```

---

## 🔄 停止服务

```bash
# 查找进程
ps aux | grep -E "api_server|localtunnel" | grep -v grep

# 停止所有相关进程
pkill -f api_server
pkill -f localtunnel
```

---

## 📈 下一步优化

这是临时方案，适合快速验证。长期使用建议：

1. **Render 部署**：免费，稳定，但有休眠机制
2. **Railway 部署**：需要解决之前的部署问题
3. **Vercel Serverless**：需要改造代码，但完全免费

当前方案可以让你立即验证功能，之后再考虑长期部署。

---

## 🎉 完成！

现在你的网站应该完全可用了！

- 前端：https://www.ycwrite.online/
- 后端：https://empty-ties-judge.loca.lt
- 状态：✅ 运行中

享受你的 AI 写作助手吧！
