#!/bin/bash
# TextOn 自动更新脚本

set -e

PROJECT_DIR="/var/www/texton"
cd "$PROJECT_DIR"

echo "=== 开始更新 TextOn ==="

# 1. 拉取最新代码
echo ">>> 拉取最新代码..."
git pull origin main

# 2. 更新后端依赖
echo ">>> 更新后端依赖..."
cd "$PROJECT_DIR/backend"
source venv/bin/activate
pip install -r requirements.txt -q

# 3. 更新数据库结构
echo ">>> 更新数据库..."
python3 -c "from app.models import Base, engine; Base.metadata.create_all(bind=engine)"

# 4. 更新前端依赖并构建
echo ">>> 构建前端..."
cd "$PROJECT_DIR/frontend"
npm install --silent
npm run build

# 5. 重启后端服务
echo ">>> 重启服务..."
systemctl restart texton

echo "=== 更新完成 ==="
