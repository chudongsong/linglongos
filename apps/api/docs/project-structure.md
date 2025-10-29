# 项目结构说明文档

## 目录结构详解

```
linglongos/apps/api/
├── app/                          # 应用核心代码
│   ├── controller/               # 控制器层 - 处理HTTP请求
│   │   ├── auth.ts              # 认证相关接口
│   │   ├── panel.ts             # 面板管理接口
│   │   ├── config.ts            # 配置管理接口
│   │   └── proxy.ts             # 代理转发接口
│   ├── service/                 # 服务层 - 业务逻辑处理
│   │   ├── auth.ts              # 认证服务
│   │   ├── panel.ts             # 面板服务
│   │   ├── config.ts            # 配置服务
│   │   └── proxy.ts             # 代理服务
│   ├── model/                   # 数据模型层 - 数据库模型
│   │   ├── user.ts              # 用户模型
│   │   ├── panel.ts             # 面板模型
│   │   ├── config.ts            # 配置模型
│   │   └── session.ts           # 会话模型
│   ├── middleware/              # 中间件
│   │   ├── auth.ts              # 认证中间件
│   │   ├── cors.ts              # 跨域中间件
│   │   ├── error.ts             # 错误处理中间件
│   │   ├── ratelimit.ts         # 限流中间件
│   │   └── proxy.ts             # 代理中间件
│   ├── extend/                  # 框架扩展
│   │   ├── context.ts           # 上下文扩展
│   │   └── helper.ts            # 工具函数扩展
│   └── router.ts                # 路由配置
├── config/                      # 配置文件
│   ├── config.default.ts        # 默认配置
│   ├── config.local.ts          # 本地配置
│   ├── config.prod.ts           # 生产配置
│   └── plugin.ts                # 插件配置
├── database/                    # 数据库相关
│   ├── migrations/              # 数据库迁移文件
│   └── seeders/                 # 数据种子文件
├── docs/                        # 项目文档
│   ├── api-development-spec.md  # API开发规范
│   ├── deployment-guide.md      # 部署指南
│   └── project-structure.md     # 项目结构说明
├── logs/                        # 日志文件
├── test/                        # 测试文件
│   ├── controller/              # 控制器测试
│   ├── service/                 # 服务测试
│   └── fixtures/                # 测试数据
├── typings/                     # TypeScript类型定义
│   ├── index.d.ts               # 全局类型定义
│   └── egg/                     # Egg.js类型扩展
├── app.ts                       # 应用入口
├── agent.ts                     # 代理进程入口
├── package.json                 # 项目依赖
├── tsconfig.json                # TypeScript配置
├── .eslintrc.js                 # ESLint配置
├── .prettierrc.js               # Prettier配置
└── README.md                    # 项目说明
```

## 核心模块功能说明

### 1. 认证模块 (Auth)
**位置**: `app/controller/auth.ts`, `app/service/auth.ts`

**功能职责**:
- 用户登录认证
- JWT Token 生成与验证
- 双因素认证 (2FA)
- 用户权限管理

**核心接口**:
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `POST /api/v1/auth/refresh` - Token 刷新
- `POST /api/v1/auth/verify-totp` - 2FA 验证

### 2. 面板管理模块 (Panel)
**位置**: `app/controller/panel.ts`, `app/service/panel.ts`

**功能职责**:
- 面板 CRUD 操作
- 面板状态监控
- 面板配置管理
- 面板访问控制

**核心接口**:
- `GET /api/v1/panels` - 获取面板列表
- `POST /api/v1/panels` - 创建面板
- `GET /api/v1/panels/:id` - 获取面板详情
- `PUT /api/v1/panels/:id` - 更新面板
- `DELETE /api/v1/panels/:id` - 删除面板

### 3. 配置管理模块 (Config)
**位置**: `app/controller/config.ts`, `app/service/config.ts`

**功能职责**:
- 系统配置管理
- 用户偏好设置
- 配置版本控制
- 配置热更新

**核心接口**:
- `GET /api/v1/configs` - 获取配置列表
- `POST /api/v1/configs` - 创建配置
- `PUT /api/v1/configs/:id` - 更新配置
- `DELETE /api/v1/configs/:id` - 删除配置

### 4. 代理转发模块 (Proxy)
**位置**: `app/controller/proxy.ts`, `app/service/proxy.ts`, `app/middleware/proxy.ts`

**功能职责**:
- 请求路由转发
- 负载均衡
- 缓存管理
- 健康检查

**核心接口**:
- `GET /api/v1/proxy/*` - 代理转发接口
- `POST /api/v1/proxy/*` - 代理转发接口
- `GET /api/v1/health` - 健康检查

## 代码组织规范

### 1. 分层架构
```
Request → Controller → Service → Model → Database
    ↓         ↓          ↓        ↓
Response ← Controller ← Service ← Model
```

**控制器层 (Controller)**:
- 处理 HTTP 请求和响应
- 参数验证和转换
- 调用服务层处理业务逻辑
- 返回标准化响应格式

**服务层 (Service)**:
- 实现核心业务逻辑
- 调用模型层进行数据操作
- 处理业务规则和计算
- 提供事务支持

**模型层 (Model)**:
- 定义数据结构
- 数据库操作封装
- 数据验证和转换
- 关联关系管理

### 2. 命名规范

**文件命名**:
- 控制器文件：小写连字符，如 `user-controller.ts`
- 服务文件：小写连字符，如 `user-service.ts`
- 模型文件：小写连字符，如 `user-model.ts`

**类和方法命名**:
- 类名：帕斯卡命名法，如 `UserController`
- 方法名：驼峰命名法，如 `getUserById`
- 常量名：全大写下划线，如 `MAX_RETRY_COUNT`

**变量命名**:
- 局部变量：驼峰命名法，如 `userName`
- 全局变量：驼峰命名法，如 `appConfig`
- 私有变量：下划线前缀，如 `_privateVar`

### 3. 代码风格规范

**TypeScript 规范**:
```typescript
// 接口定义
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 类型别名
type UserStatus = 'active' | 'inactive' | 'banned';

// 枚举定义
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}
```

**错误处理规范**:
```typescript
// 自定义错误类
class BusinessError extends Error {
  constructor(
    public code: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

// 使用示例
try {
  const user = await this.userService.getUserById(userId);
  if (!user) {
    throw new BusinessError(404, '用户不存在');
  }
} catch (error) {
  this.ctx.logger.error('获取用户失败', error);
  throw error;
}
```

## 测试策略与覆盖率要求

### 1. 测试金字塔
```
    /\
   /  \
  /    \  端到端测试 (10%)
 /      \
/        \
----------  集成测试 (30%)
|        |
|        |
|        |  单元测试 (60%)
----------
```

### 2. 测试类型

**单元测试 (Unit Tests)**:
- 测试单个函数或方法
- 覆盖率目标：80%
- 测试框架：Jest

**集成测试 (Integration Tests)**:
- 测试模块间交互
- 覆盖率目标：70%
- 测试框架：Supertest

**端到端测试 (E2E Tests)**:
- 测试完整用户流程
- 覆盖率目标：60%
- 测试框架：Cypress

### 3. 测试目录结构
```
test/
├── unit/                      # 单元测试
│   ├── service/
│   │   ├── auth.test.ts
│   │   ├── panel.test.ts
│   │   └── config.test.ts
│   ├── model/
│   │   ├── user.test.ts
│   │   └── panel.test.ts
│   └── utils/
│       └── validator.test.ts
├── integration/               # 集成测试
│   ├── controller/
│   │   ├── auth.test.ts
│   │   └── panel.test.ts
│   └── api/
│       └── auth.test.ts
└── e2e/                      # 端到端测试
    ├── auth.e2e.test.ts
    └── panel.e2e.test.ts
```

### 4. 测试配置

**Jest 配置** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 5. 测试用例示例

**单元测试示例**:
```typescript
// test/unit/service/panel.test.ts
import { PanelService } from '../../../src/service/panel';

describe('PanelService', () => {
  let panelService: PanelService;

  beforeEach(() => {
    panelService = new PanelService();
  });

  describe('createPanel', () => {
    it('should create a new panel', async () => {
      const panelData = {
        name: 'Test Panel',
        url: 'https://example.com',
        type: 'panel'
      };

      const result = await panelService.createPanel(panelData);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(panelData.name);
      expect(result.url).toBe(panelData.url);
    });

    it('should throw error if panel already exists', async () => {
      const panelData = {
        name: 'Existing Panel',
        url: 'https://existing.com',
        type: 'panel'
      };

      await expect(panelService.createPanel(panelData))
        .rejects.toThrow('面板已存在');
    });
  });
});
```

**集成测试示例**:
```typescript
// test/integration/controller/auth.test.ts
import { app } from '../bootstrap';

describe('Auth Controller', () => {
  it('should login successfully', async () => {
    const response = await app.httpRequest()
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser',
        password: 'testpass'
      });

    expect(response.status).toBe(200);
    expect(response.body.code).toBe(200);
    expect(response.body.data).toHaveProperty('token');
  });
});
```

### 6. 测试覆盖率报告

**生成覆盖率报告**:
```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 查看 HTML 报告
open coverage/lcov-report/index.html
```

**覆盖率要求**:
- 行覆盖率：≥80%
- 函数覆盖率：≥80%
- 分支覆盖率：≥70%
- 语句覆盖率：≥80%

### 7. 持续集成测试

**GitHub Actions 工作流** (`.github/workflows/test.yml`):
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

## 开发环境配置

### 1. 环境变量配置
创建 `.env` 文件：
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=linglongos

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=7001
NODE_ENV=development
```

### 2. 开发工具推荐
- **IDE**: VS Code
- **插件**: ESLint、Prettier、TypeScript、Jest
- **调试**: Chrome DevTools、VS Code Debugger

### 3. 开发命令
```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 代码检查
npm run lint

# 格式化代码
npm run format

# 运行测试
npm run test

# 生成测试覆盖率报告
npm run test:coverage

# 构建项目
npm run build

# 生产环境启动
npm start
```