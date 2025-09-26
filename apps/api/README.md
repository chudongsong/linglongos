# LingLongOS API 服务

一个基于 Koa.js 的现代化 API 服务，提供 Google 身份验证和面板代理功能。

## 🚀 功能特性

- **Google 身份验证**: 基于 TOTP 的双因素认证
- **面板代理**: 支持宝塔面板和 1Panel 的 API 代理
- **统一响应格式**: 标准化的 API 响应结构
- **完整的日志系统**: 包含 HTTP 请求、性能监控和安全日志
- **OpenAPI 文档**: 自动生成的 API 文档
- **TypeScript 支持**: 完整的类型定义和类型安全

## 📁 项目结构

```
src/
├── config/           # 配置管理
│   ├── auth.config.ts    # 认证配置
│   ├── logger.config.ts  # 日志配置
│   └── index.ts          # 统一配置导出
├── controllers/      # 控制器层
│   ├── authController.ts # 认证控制器
│   ├── proxyController.ts # 代理控制器
│   └── index.ts          # 统一控制器导出
├── middlewares/      # 中间件
│   ├── authMiddleware.ts    # 认证中间件
│   ├── commonMiddleware.ts  # 通用中间件
│   ├── loggerMiddleware.ts  # 日志中间件
│   └── index.ts             # 统一中间件导出
├── services/         # 服务层
│   ├── authService.ts   # 认证服务
│   ├── proxyService.ts  # 代理服务
│   └── index.ts         # 统一服务导出
├── types/           # 类型定义
│   └── index.ts         # 统一类型定义
├── routes/          # 路由配置
│   └── index.ts         # API 路由
├── docs/            # 文档生成
│   └── openapi.ts       # OpenAPI 文档生成
├── btpanel/         # 宝塔面板专用模块
│   └── index.ts         # 宝塔面板路由
└── app.ts           # 应用入口
```

## 🛠️ 技术栈

- **运行时**: Node.js 18+
- **框架**: Koa.js
- **语言**: TypeScript
- **认证**: Google Authenticator (TOTP)
- **日志**: Winston
- **文档**: OpenAPI 3.0 + Swagger UI
- **验证**: Zod
- **包管理**: pnpm

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

服务将在 `http://localhost:4000` 启动。

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务

```bash
pnpm start
```

## 📖 API 文档

启动服务后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:4000/docs
- **OpenAPI JSON**: http://localhost:4000/api/v1/docs/openapi.json
- **OpenAPI YAML**: http://localhost:4000/api/v1/docs/openapi.yaml

## 🔐 认证流程

### 1. 绑定 Google Authenticator

```bash
GET /api/v1/auth/google-auth-bind
```

返回二维码 URL，用户扫描后在 Google Authenticator 中添加账户。

### 2. 验证 TOTP 令牌

```bash
POST /api/v1/auth/google-auth-verify
Content-Type: application/json

{
  "token": "123456"
}
```

验证成功后会创建会话并设置 Cookie。

### 3. 使用认证接口

后续请求会自动验证会话 Cookie，无需额外处理。

## 🔧 代理功能

### 绑定面板密钥

```bash
POST /api/v1/proxy/bind-panel-key
Content-Type: application/json

{
  "type": "bt",
  "url": "http://panel.example.com:8888",
  "key": "your-api-key"
}
```

### 代理请求

```bash
# GET 请求
GET /api/v1/proxy/request?url=/api/panel/get_sys_info&panelType=bt

# POST 请求
POST /api/v1/proxy/request
Content-Type: application/json

{
  "url": "/api/panel/get_sys_info",
  "panelType": "bt",
  "params": {
    "action": "get_sys_info"
  }
}
```

## 📝 开发规范

### 代码风格

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 所有函数必须包含 JSDoc 注释
- 禁止使用 `any` 类型

### 文件命名

- 控制器: `xxxController.ts`
- 服务: `xxxService.ts`
- 中间件: `xxxMiddleware.ts`
- 配置: `xxx.config.ts`
- 类型: 统一在 `types/index.ts`

### 导入导出

- 使用统一的索引文件 (`index.ts`) 管理导出
- 导入路径使用 `.js` 扩展名（TypeScript 编译要求）
- 优先使用命名导出而非默认导出

### 错误处理

- 使用 `HttpError` 类处理业务错误
- 所有异步操作必须包含错误处理
- 错误信息使用中文，便于用户理解

### 日志记录

- HTTP 请求自动记录
- 业务操作使用 `logBusinessOperation` 装饰器
- 安全事件使用 `securityLogger`
- 性能监控自动记录响应时间

## 🔍 调试

### 日志级别

开发环境默认使用 `debug` 级别，生产环境使用 `info` 级别。

### 日志文件

日志文件保存在 `logs/` 目录：

- `error.log`: 错误日志
- `combined.log`: 所有日志
- `exceptions.log`: 未捕获异常
- `rejections.log`: 未处理的 Promise 拒绝

## 🧪 测试

```bash
# 运行测试
pnpm test

# 生成覆盖率报告
pnpm test:coverage
```

## 📦 部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 4000
CMD ["node", "dist/app.js"]
```

### 环境变量

- `PORT`: 服务端口 (默认: 4000)
- `NODE_ENV`: 环境模式 (development/production)
- `IGNORE_SSL_ERRORS`: 是否忽略 SSL 错误 (true/false)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有疑问，请：

1. 查看 [API 文档](http://localhost:4000/docs)
2. 检查日志文件
3. 提交 Issue

---

**注意**: 本项目仍在积极开发中，API 可能会发生变化。请关注更新日志。
