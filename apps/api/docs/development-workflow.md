# 开发流程文档

## 分支管理策略

### Git Flow 工作流

本项目采用 **Git Flow** 分支管理策略，结合团队实际开发需求进行优化：

#### 分支类型

| 分支类型 | 命名规范 | 用途 | 生命周期 |
|---------|----------|------|----------|
| main | main | 生产环境代码 | 长期 |
| develop | develop | 开发主分支 | 长期 |
| feature | feature/功能描述 | 新功能开发 | 短期 |
| release | release/版本号 | 发布准备 | 中期 |
| hotfix | hotfix/问题描述 | 生产环境紧急修复 | 短期 |

#### 分支操作流程

##### 1. 新功能开发
```bash
# 从develop创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication

# 开发完成后提交
git add .
git commit -m "feat(auth): 实现用户双因子认证功能"

# 推送到远程
git push origin feature/user-authentication
```

##### 2. 发布准备
```bash
# 从develop创建发布分支
git checkout develop
git checkout -b release/v1.2.0

# 修复bug并更新版本号
# ... 修复bug ...
git commit -m "fix: 修复登录页面样式问题"

# 合并到main和develop
git checkout main
git merge release/v1.2.0
git checkout develop
git merge release/v1.2.0
```

##### 3. 紧急修复
```bash
# 从main创建热修复分支
git checkout main
git checkout -b hotfix/security-patch

# 修复问题
git commit -m "fix(security): 修复SQL注入漏洞"

# 合并到main和develop
git checkout main
git merge hotfix/security-patch
git checkout develop
git merge hotfix/security-patch
```

## 代码审查规范

### 审查流程

1. **创建Pull Request**
   - 标题格式：`类型(范围): 简要描述`
   - 描述模板：
     ```markdown
     ## 变更内容
     - 新增功能：xxx
     - 修复问题：xxx
     
     ## 测试情况
     - [ ] 单元测试通过
     - [ ] 集成测试通过
     - [ ] 手动测试验证
     
     ## 破坏性变更
     - 无 / 有（说明影响）
     ```

2. **审查清单**
   - [ ] 代码符合项目规范
   - [ ] 功能测试通过
   - [ ] 性能影响评估
   - [ ] 安全漏洞检查
   - [ ] 文档更新完整

3. **审查标准**
   - 至少2人审查通过
   - 审查者需添加`LGTM`评论
   - 阻塞性问题必须修复

### 提交消息规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 类型说明
- **feat**: 新功能
- **fix**: Bug修复
- **docs**: 文档更新
- **style**: 代码格式调整
- **refactor**: 代码重构
- **test**: 测试相关
- **chore**: 构建/工具配置

#### 示例
```
feat(auth): 添加JWT令牌刷新机制

实现了自动刷新过期JWT令牌的功能，提升用户体验。

Closes #123
```

## CI/CD 流程

### GitHub Actions 工作流

#### 1. 持续集成 (CI)

**文件路径**: `.github/workflows/ci.yml`

```yaml
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run linter
      run: pnpm run lint
    
    - name: Run tests
      run: pnpm run test:ci
    
    - name: Run type check
      run: pnpm run tsc
    
    - name: Build application
      run: pnpm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

#### 2. 代码质量检查

**ESLint 配置**:
```json
{
  "extends": ["@eggjs/eslint-config-egg/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

**Prettier 配置**:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 3. 自动化测试

**测试层级**:
- **单元测试**: 覆盖核心业务逻辑
- **集成测试**: API接口测试
- **端到端测试**: 关键业务流程

**测试命令**:
```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 生成覆盖率报告
pnpm test:coverage
```

### 部署策略

#### 1. 环境配置

| 环境 | 分支 | 部署策略 | 域名 |
|------|------|----------|------|
| 开发 | develop | 自动部署 | dev-api.linglongos.com |
| 测试 | release/* | 手动部署 | test-api.linglongos.com |
| 预生产 | main | 手动部署 | staging-api.linglongos.com |
| 生产 | tagged release | 手动部署 | api.linglongos.com |

#### 2. Docker 部署

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod

# 复制源码
COPY . .

# 构建应用
RUN pnpm run build

# 暴露端口
EXPOSE 7001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7001/health || exit 1

# 启动应用
CMD ["npm", "start"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "7001:7001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=sqlite:/app/data/prod.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped
```

#### 3. 部署脚本

**部署命令**:
```bash
#!/bin/bash
# deploy.sh

set -e

echo "开始部署..."

# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
pnpm install --prod

# 3. 运行数据库迁移
pnpm run migrate:prod

# 4. 构建应用
pnpm run build

# 5. 重启服务
pm2 restart linglong-api

echo "部署完成！"
```

#### 4. 监控与告警

**健康检查端点**:
```typescript
// app/controller/health.ts
import { Controller } from 'egg';

export default class HealthController extends Controller {
  async index() {
    const { ctx } = this;
    
    // 检查数据库连接
    try {
      await ctx.model.User.findOne();
    } catch (error) {
      ctx.status = 503;
      ctx.body = { status: 'error', message: 'Database connection failed' };
      return;
    }
    
    ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

**监控指标**:
- 响应时间 < 200ms
- 错误率 < 1%
- CPU使用率 < 80%
- 内存使用率 < 85%

## 开发环境配置

### 本地开发环境

#### 1. 环境要求
- Node.js >= 16.0.0
- pnpm >= 7.0.0
- SQLite3 (包含编译工具)

#### 2. 初始化步骤
```bash
# 1. 克隆仓库
git clone https://github.com/linglongos/linglong-api.git
cd linglong-api

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 4. 初始化数据库
pnpm run migrate:dev

# 5. 启动开发服务器
pnpm run dev
```

#### 3. 开发工具配置

**VS Code 设置**:
```json
{
  "eslint.workingDirectories": ["apps/api"],
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

**调试配置**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/node_modules/.bin/egg-bin",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/api",
      "console": "integratedTerminal"
    }
  ]
}
```

### 数据库管理

#### 1. 迁移命令
```bash
# 创建迁移
pnpm run migrate:create --name add_user_table

# 运行迁移
pnpm run migrate:up

# 回滚迁移
pnpm run migrate:down

# 查看迁移状态
pnpm run migrate:status
```

#### 2. 数据备份
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/linglong-api"
DB_FILE="data/prod.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/backup_$DATE.db"

# 保留最近7天的备份
find $BACKUP_DIR -name "backup_*.db" -mtime +7 -delete

echo "备份完成: backup_$DATE.db"
```

## 发布流程

### 版本号规范

采用 [语义化版本](https://semver.org/lang/zh-CN/)：
- **MAJOR**: 不兼容的API修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 发布步骤

1. **准备发布**
   ```bash
   # 创建发布分支
   git checkout -b release/v1.2.0
   
   # 更新版本号
   npm version minor
   
   # 更新CHANGELOG.md
   npm run changelog
   ```

2. **测试验证**
   - 运行完整测试套件
   - 进行集成测试
   - 性能基准测试

3. **合并发布**
   ```bash
   # 合并到main
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   
   # 合并到develop
   git checkout develop
   git merge release/v1.2.0
   ```

4. **部署上线**
   - 部署到预生产环境
   - 生产环境部署
   - 验证部署结果

### 回滚策略

#### 快速回滚
```bash
# 回滚到上一个版本
pm2 restart linglong-api --update-env

# 或者使用Git回滚
git revert HEAD
npm run deploy
```

#### 数据库回滚
```bash
# 回滚迁移
pnpm run migrate:down --to 20231201000000

# 恢复备份
./scripts/restore-backup.sh backup_20231201_120000.db
```

## 故障排查指南

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查数据库文件权限
ls -la data/
chmod 644 data/*.db

# 检查数据库完整性
sqlite3 data/dev.db ".tables"
```

#### 2. 端口冲突
```bash
# 查找占用端口的进程
lsof -i :7001
kill -9 <PID>
```

#### 3. 内存泄漏
```bash
# 使用clinic.js诊断
npm install -g clinic
clinic doctor -- node app.js
```

### 日志查看
```bash
# 查看应用日志
pm2 logs linglong-api

# 查看系统日志
journalctl -u linglong-api -f

# 查看Nginx日志
tail -f /var/log/nginx/access.log
```

## 安全最佳实践

### 1. 依赖安全
```bash
# 检查安全漏洞
pnpm audit

# 自动修复
pnpm audit --fix
```

### 2. 密钥管理
- 使用环境变量存储敏感信息
- 定期轮换API密钥
- 使用密钥管理服务（如AWS Secrets Manager）

### 3. 访问控制
- 实施最小权限原则
- 定期审查用户权限
- 启用审计日志

### 4. 数据保护
- 敏感数据加密存储
- 传输层使用HTTPS/TLS
- 定期备份和恢复测试

## 性能优化

### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- 查询优化
EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = 'test@example.com';
```

### 2. 缓存策略
- Redis缓存热点数据
- HTTP缓存头优化
- CDN静态资源缓存

### 3. 监控指标
- QPS（每秒查询数）
- 响应时间P95/P99
- 错误率
- 资源使用率

### 4. 性能测试
```bash
# 使用Artillery进行负载测试
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:7001/api/health
```