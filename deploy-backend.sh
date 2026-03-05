#!/bin/bash
# Railway 后端快速部署脚本

echo "🚀 开始部署 Write Master 后端到 Railway..."

cd write-master

# 检查是否安装 Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 安装 Railway CLI..."
    npm install -g @railway/cli
fi

# 登录 Railway
echo "🔐 请登录 Railway..."
railway login

# 初始化项目
echo "🎯 初始化 Railway 项目..."
railway init

# 设置环境变量
echo "⚙️  配置环境变量..."
railway variables set ANTHROPIC_API_KEY=sk-reKOxLGDifJmPDOBKUYx9vFOHUXKsgVfKbRmzlhwXQjbfN85
railway variables set ANTHROPIC_BASE_URL=https://wolfai.top
railway variables set IMAGE_API_KEY=sk-YG7XqNuYtybjzGLwq5SHCVONFJcYZ69wSITuyuV6QACgOYcM
railway variables set IMAGE_API_BASE=https://api.apicore.ai/v1
railway variables set IMAGE_MODEL=gemini-2.5-flash-image-hd
railway variables set PORT=8001

# 部署
echo "🚢 开始部署..."
railway up

# 获取部署 URL
echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 下一步："
echo "1. 运行 'railway domain' 获取部署 URL"
echo "2. 在 Vercel 项目中设置环境变量 BACKEND_API_URL 为该 URL"
echo "3. 重新部署 Vercel 前端"
echo ""
railway domain
