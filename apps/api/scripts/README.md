# Scripts 目录

本目录包含项目相关的脚本文件。

## 脚本说明

### 数据迁移脚本

- **`json-to-sqlite-migration.js`** - JSON 到 SQLite 数据迁移脚本
  - 用途：将 storage.json 中的数据迁移到 SQLite 数据库
  - 运行方式：`node json-to-sqlite-migration.js`
  - 注意：由于 better-sqlite3 编译问题，需要先启动应用

- **`sqlite-migration.sh`** - SQLite 数据库迁移脚本
  - 用途：使用系统 sqlite3 命令创建数据库和表结构
  - 运行方式：`./sqlite-migration.sh`
  - 功能：创建数据库表结构和索引

## 使用说明

1. 确保具有执行权限：`chmod +x *.sh`
2. 根据需要选择合适的迁移脚本
3. 建议先备份现有数据