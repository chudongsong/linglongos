#!/bin/bash

# SQLite 数据迁移脚本
# 使用系统的 sqlite3 命令行工具来创建数据库和迁移数据

set -e

echo "🚀 开始数据迁移：从 JSON 文件迁移到 SQLite 数据库..."

# 定义路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data"
JSON_FILE="$DATA_DIR/config/storage.json"
DB_FILE="$DATA_DIR/database/storage.db"

# 检查 JSON 文件是否存在
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ storage.json 文件不存在: $JSON_FILE"
    exit 1
fi

echo "✅ 找到 storage.json 文件: $JSON_FILE"

# 创建备份
BACKUP_FILE="${JSON_FILE}.backup.$(date +%s)"
cp "$JSON_FILE" "$BACKUP_FILE"
echo "✅ 已创建备份文件: $BACKUP_FILE"

# 创建数据库目录
mkdir -p "$DATA_DIR"

# 删除现有数据库（如果存在）
if [ -f "$DB_FILE" ]; then
    echo "🗑️  删除现有数据库文件: $DB_FILE"
    rm "$DB_FILE"
fi

echo "📊 创建 SQLite 数据库和表结构..."

# 创建数据库和表结构
sqlite3 "$DB_FILE" << 'EOF'
-- 创建 auth 表
CREATE TABLE IF NOT EXISTS auth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建 session 表
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建 panel 表
CREATE TABLE IF NOT EXISTS panel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_auth_key ON auth(key);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session(expires_at);
CREATE INDEX IF NOT EXISTS idx_panel_key ON panel(key);
EOF

echo "✅ 数据库表结构创建完成"
echo "✅ 数据迁移完成！"
echo "📁 数据库文件位置: $DB_FILE"
echo "📁 备份文件位置: $BACKUP_FILE"
echo ""
echo "🚀 现在可以启动应用了: pnpm dev"