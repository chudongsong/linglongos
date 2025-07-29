#!/bin/bash

# 玲珑OS 开发启动脚本

echo "🚀 启动玲珑OS开发环境..."

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 需要Node.js 18或更高版本"
    exit 1
fi

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 请先安装pnpm: npm install -g pnpm"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 构建共享包
echo "🔨 构建共享包..."
pnpm --filter @linglongos/shared-types build
pnpm --filter @linglongos/ui build

# 启动开发服务器
echo "🌟 启动开发服务器..."
pnpm --filter @linglongos/desktop dev