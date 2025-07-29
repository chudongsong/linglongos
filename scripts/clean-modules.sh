#!/bin/bash

# 玲珑OS node_modules清理脚本

echo "🧹 开始清理所有node_modules文件夹..."

# 查找并删除所有node_modules文件夹
find . -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# 查找并删除所有.turbo文件夹（通常与Turborepo一起使用）
find . -name ".turbo" -type d -prune -exec rm -rf {} \; 2>/dev/null || true

# 清理pnpm存储（可选，取消注释以启用）
# echo "🗑️ 清理pnpm存储..."
# pnpm store prune

echo "✅ 清理完成！"
echo "💡 提示：使用 'pnpm install' 重新安装依赖"
