# API开发规范文档

## RESTful API设计原则

### 1. 资源导向设计
- **资源命名**：使用名词复数形式，避免动词
  - ✅ 正确：`/api/v1/panels`、`/api/v1/users`
  - ❌ 错误：`/api/v1/getPanels`、`/api/v1/createUser`

- **资源层级**：使用层级关系表示关联
  - `/api/v1/panels/{id}/configs`
  - `/api/v1/users/{id}/sessions`

### 2. HTTP方法规范
| 方法 | 用途 | 幂等性 | 示例 |
|------|------|--------|------|
| GET | 获取资源 | 是 | `GET /api/v1/panels` |
| POST | 创建资源 | 否 | `POST /api/v1/panels` |
| PUT | 全量更新 | 是 | `PUT /api/v1/panels/{id}` |
| PATCH | 部分更新 | 否 | `PATCH /api/v1/panels/{id}` |
| DELETE | 删除资源 | 是 | `DELETE /api/v1/panels/{id}` |

### 3. 版本控制策略
- **URL版本控制**：在路径中包含版本号
  - 当前版本：`/api/v1/`
  - 版本格式：v{major}.{minor}，如 v1.1
  - 向后兼容：保持旧版本至少6个月

- **版本升级规则**：
  - 破坏性变更：主版本号升级
  - 新增功能：次版本号升级
  - Bug修复：补丁版本号升级

## 统一的请求/响应格式规范

### 请求格式
#### 请求头规范
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
X-Request-ID: {uuid}
```

#### 请求参数规范
- **查询参数**：使用驼峰命名法
  ```
  ?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
  ```

- **请求体**：使用 JSON 格式
  ```json
  {
    "name": "面板名称",
    "url": "https://example.com",
    "type": "panel"
  }
  ```

### 响应格式
#### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "123",
    "name": "面板名称",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid-123-456"
}
```

#### 分页响应
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid-123-456"
}
```

#### 错误响应
```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": {
    "type": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "requestId": "uuid-123-456"
}
```

## 错误代码标准化

### 错误码分类
| 范围 | 类别 | 示例 |
|------|------|------|
| 1xxx | 系统错误 | 1000: 服务器内部错误 |
| 2xxx | 认证错误 | 2001: 未授权访问 |
| 3xxx | 权限错误 | 3001: 权限不足 |
| 4xxx | 参数错误 | 4001: 参数缺失 |
| 5xxx | 业务错误 | 5001: 面板已存在 |

### 标准错误码表
```typescript
// 系统错误
SYSTEM_ERROR: 1000
DATABASE_ERROR: 1001
CONFIG_ERROR: 1002

// 认证错误
UNAUTHORIZED: 2001
INVALID_TOKEN: 2002
TOKEN_EXPIRED: 2003
INVALID_CREDENTIALS: 2004
TOTP_REQUIRED: 2005
TOTP_INVALID: 2006

// 权限错误
FORBIDDEN: 3001
ROLE_REQUIRED: 3002

// 参数错误
VALIDATION_ERROR: 4001
MISSING_PARAMETER: 4002
INVALID_FORMAT: 4003

// 业务错误
PANEL_NOT_FOUND: 5001
PANEL_EXISTS: 5002
PROXY_ERROR: 5003
CONFIG_NOT_FOUND: 5004
```

### 错误处理示例
```typescript
// 控制器层错误处理
async createPanel() {
  const { ctx } = this;
  try {
    const panel = await ctx.service.panel.create(ctx.request.body);
    ctx.success(panel);
  } catch (error) {
    if (error.code === 'PANEL_EXISTS') {
      ctx.throw(5002, '面板已存在');
    } else {
      ctx.throw(1000, '创建面板失败');
    }
  }
}
```

## 安全认证要求

### 认证机制
1. **JWT Token**：用于用户会话管理
   - 有效期：24小时
   - 存储：HTTP Only Cookie
   - 刷新：使用 Refresh Token

2. **双因素认证（2FA）**：
   - 基于 TOTP（Time-based One-Time Password）
   - 支持 Google Authenticator、Microsoft Authenticator
   - 密钥长度：32字节 Base32 编码

### 认证流程
```
1. 用户登录
   POST /api/v1/auth/login
   → 返回临时 Token（需要2FA验证）

2. 2FA验证
   POST /api/v1/auth/verify-totp
   → 返回完整 Token

3. 后续请求
   Header: Authorization: Bearer {token}
```

### 权限控制
- **基于角色的访问控制（RBAC）**
- **权限粒度**：接口级别
- **权限验证**：中间件统一处理

### 安全配置
```typescript
// 安全中间件配置
config.security = {
  csrf: {
    enable: false, // API 项目关闭 CSRF
  },
  domainWhiteList: ['http://localhost:3000'],
};

config.jwt = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
};
```

## 性能优化指南

### 1. 响应时间优化
- **数据库优化**：
  - 使用索引优化查询
  - 避免 N+1 查询问题
  - 使用连接池

- **缓存策略**：
  - Redis 缓存热点数据
  - HTTP 缓存头配置
  - 数据库查询缓存

### 2. 并发处理
- **连接池配置**：
  ```typescript
  config.sequelize = {
    pool: {
      max: 20,
      min: 5,
      idle: 10000,
    },
  };
  ```

- **限流配置**：
  ```typescript
  config.ratelimit = {
    max: 1000,
    duration: 60000,
  };
  ```

### 3. 资源优化
- **Gzip 压缩**：启用响应压缩
- **静态资源**：使用 CDN
- **数据库**：定期清理过期数据

## 文档自动生成方案

### OpenAPI 3.0 规范
项目使用 `egg-swagger-doc` 自动生成 API 文档：

#### 安装配置
```bash
npm install egg-swagger-doc --save
```

#### 配置示例
```typescript
// config/plugin.ts
export const swaggerdoc = {
  enable: true,
  package: 'egg-swagger-doc',
};

// config/config.default.ts
config.swaggerdoc = {
  dirScanner: './app/controller',
  apiInfo: {
    title: 'LinglongOS API',
    description: '统一面板代理与认证服务 API',
    version: '1.0.0',
  },
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
};
```

#### 文档注释示例
```typescript
import { Controller } from 'egg';

export default class PanelController extends Controller {
  /**
   * @summary 创建面板
   * @description 创建一个新的面板配置
   * @router post /api/v1/panels
   * @request body createPanelRequest
   * @response 200 createPanelResponse
   * @response 400 errorResponse
   * @response 500 errorResponse
   */
  public async create() {
    const { ctx } = this;
    // 实现代码...
  }
}

/**
 * @typedef createPanelRequest
 * @property {string} name - 面板名称 (必填)
 * @property {string} url - 面板地址 (必填)
 * @property {string} type - 面板类型 (必填)
 */

/**
 * @typedef createPanelResponse
 * @property {string} id - 面板ID
 * @property {string} name - 面板名称
 * @property {string} url - 面板地址
 * @property {string} createdAt - 创建时间
 */
```

### 文档访问
- **Swagger UI**：`http://localhost:7001/swagger-ui.html`
- **JSON 文档**：`http://localhost:7001/swagger-doc`

### 自动化测试
集成测试文档：
- **测试覆盖率**：使用 `nyc` 生成覆盖率报告
- **API 测试**：使用 `supertest` 进行接口测试
- **性能测试**：使用 `autocannon` 进行压力测试

## 开发最佳实践

### 1. 代码规范
- **命名规范**：使用驼峰命名法
- **注释规范**：使用 JSDoc 格式
- **错误处理**：统一错误处理机制

### 2. 日志规范
- **日志级别**：DEBUG、INFO、WARN、ERROR
- **日志格式**：JSON 格式，包含 requestId
- **日志存储**：按天分割，保留30天

### 3. 监控告警
- **健康检查**：`/health` 接口
- **性能监控**：响应时间、错误率
- **业务监控**：关键业务指标

### 4. 版本发布
- **语义化版本**：v1.0.0
- **发布流程**：
  1. 功能开发完成
  2. 代码审查通过
  3. 测试用例通过
  4. 文档更新完成
  5. 发布新版本