# LingLongOS API 服务

基于 Node.js + Koa.js + TypeScript 的通用 API 代理库，支持宝塔面板和 1Panel 的统一代理访问。

## 功能特性

- 🔐 **Google 身份验证器 2FA 认证**：基于 TOTP 的双重认证
- 🛡️ **会话管理**：基于 Cookie 的会话鉴权机制
- 🔄 **多面板代理**：支持宝塔面板和 1Panel 的 API 代理
- 🎯 **统一响应格式**：标准化的 API 响应结构
- 📝 **TypeScript 支持**：完整的类型定义和类型安全

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Koa.js 2.x
- **语言**: TypeScript 5.x
- **认证**: otplib (Google Authenticator)
- **HTTP 客户端**: axios
- **参数验证**: zod
- **开发工具**: tsx, eslint

## 项目结构

```
src/
├── app.ts                 # 应用入口
├── config/
│   └── proxy.config.ts    # 代理配置
├── controllers/
│   ├── authController.ts  # 认证控制器
│   └── proxyController.ts # 代理控制器
├── middlewares/
│   ├── authMiddleware.ts  # 会话鉴权中间件
│   ├── btMiddleware.ts    # 宝塔签名中间件
│   └── commonMiddleware.ts # 通用响应中间件
├── services/
│   ├── authService.ts     # 认证服务
│   └── proxyService.ts    # 代理服务
├── routes/
│   └── index.ts          # 路由配置
└── utils/
    └── crypto.ts         # 加密工具
```

## API 接口

### 认证相关

#### 获取 Google 认证绑定信息
```
GET /api/v1/auth/google-auth-bind
```

返回二维码 URL 和密钥，用于 Google Authenticator 绑定。

#### 验证 Google 认证令牌
```
POST /api/v1/auth/google-auth-verify
Content-Type: application/json

{
  "token": "123456"
}
```

验证 6 位数 TOTP 令牌，成功后创建会话。

### 代理相关（需要认证）

#### 绑定面板密钥
```
POST /api/v1/proxy/bind-panel-key
Content-Type: application/json

{
  "type": "bt",
  "url": "http://panel.example.com:8888",
  "key": "your-32-character-api-key"
}
```

#### 代理请求
```
POST /api/v1/proxy/request
Content-Type: application/json

{
  "url": "/api/panel/get_sys_info",
  "panelType": "bt",
  "params": {}
}
```

## 开发

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm run dev
```

服务器将在 http://localhost:4000 启动。

### 构建
```bash
pnpm run build
```

### 生产运行
```bash
pnpm run start
```

## 安全特性

- **会话过期**：默认 4 小时会话有效期
- **Cookie 安全**：HttpOnly + SameSite 保护
- **参数验证**：使用 zod 进行严格的参数校验
- **错误处理**：统一的错误响应格式
- **CORS 配置**：可配置的跨域访问控制

## 架构设计

采用 MVC + Service 分层架构：

- **Controller 层**：处理 HTTP 请求和响应
- **Service 层**：业务逻辑和数据处理
- **Middleware 层**：横切关注点（认证、日志、错误处理）
- **Utils 层**：工具函数和辅助方法

## 许可证

MIT License
