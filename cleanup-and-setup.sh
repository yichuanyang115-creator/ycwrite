#!/bin/bash
set -e

echo "🧹 开始整理仓库..."

cd /Users/yangjingchuan/project/skills_adding/write_master

# 备份当前状态
echo "📦 备份当前状态..."
timestamp=$(date +%Y%m%d_%H%M%S)
mkdir -p ../backups
cp -r . ../backups/write_master_backup_$timestamp

# 删除子目录的独立 Git 仓库
echo "🗑️  删除子目录的独立 Git 仓库..."
rm -rf write-master/.git
rm -rf ycwrite-web/.git

# 初始化统一仓库
echo "🎯 初始化统一 Git 仓库..."
git init

# 创建 .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.env
.venv

# Node
node_modules/
.next/
out/
.DS_Store
*.log

# IDE
.vscode/
.idea/

# Output
write-master/output/
*.log

# Local env
.env.local
EOF

# 添加所有文件
echo "📝 添加文件到 Git..."
git add .
git commit -m "Initial commit: unified monorepo for Render deployment"

echo ""
echo "✅ 仓库整理完成！"
echo ""
echo "📋 下一步："
echo ""
echo "1️⃣  推送到 GitHub（选择一种方式）："
echo ""
echo "   方式 A - 创建新仓库（推荐）："
echo "   --------------------------------"
echo "   a. 访问 https://github.com/new"
echo "   b. 创建仓库名：ycwrite-fullstack"
echo "   c. 不要初始化 README"
echo "   d. 然后运行："
echo ""
echo "      git remote add origin https://github.com/yichuanyang115-creator/ycwrite-fullstack.git"
echo "      git branch -M main"
echo "      git push -u origin main"
echo ""
echo "   方式 B - 覆盖现有仓库："
echo "   --------------------------------"
echo "      git remote add origin https://github.com/yichuanyang115-creator/ycwrite.git"
echo "      git branch -M main"
echo "      git push -f origin main"
echo ""
echo "2️⃣  部署后端到 Render："
echo "   a. 访问 https://render.com/"
echo "   b. 用 GitHub 登录"
echo "   c. New + → Web Service"
echo "   d. 选择你的仓库"
echo "   e. 配置："
echo "      - Name: ycwrite-backend"
echo "      - Root Directory: write-master"
echo "      - Runtime: Docker"
echo "      - 添加环境变量（见 SIMPLE_DEPLOY.md）"
echo "   f. Create Web Service"
echo ""
echo "3️⃣  更新 Vercel 前端："
echo "   a. 访问 https://vercel.com/"
echo "   b. 进入项目 Settings → Environment Variables"
echo "   c. 修改 BACKEND_API_URL 为 Render 提供的 URL"
echo "   d. Redeploy"
echo ""
echo "📖 详细步骤请查看: SIMPLE_DEPLOY.md"
echo ""
