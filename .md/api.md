# LinglongOS API 文档

统一面板代理与认证服务，基于 Egg v4 与 tegg（TypeScript）。提供 2FA 会话认证与上游面板代理（支持 bt、1panel），并包含简单 UI 跳转。

## 快速开始

- 开发：
  - `pnpm -C apps/api install`
  - `pnpm -C apps/api dev`
  - 访问：`http://127.0.0.1:7001/ui`
- 部署：
  - `pnpm -C apps/api tsc`
  - `pnpm -C apps/api start`
  - 停止：`pnpm -C apps/api stop`
- 要求：Node.js >= 20.x、TypeScript >= 5.x

## 项目结构（apps/api）

- `app/router.ts`：路由注册
- `app/controller/`：传统 Egg 控制器（`auth.ts`、`proxy.ts`、`ui.ts`）
- `app/service/`：服务层（`auth.ts`、`proxy.ts`、`storage.ts`）
- `app/middleware/`：中间件（`common.ts`、`auth.ts`、`bt.ts`）
- `app/module/`：tegg 模块示例（`bar` 控制器，`foo` 服务）
- `config/`：配置与插件（`config.default.ts`、`plugin.ts` 等）
- `app/public/index.html`：静态页面
- `test/`：测试用例（`auth.test.ts`、`proxy.test.ts` 等）

## 配置要点

- `config.default.ts`
  - `config.keys`：Cookie 签名密钥（需自定义）
  - `config.middleware`：`[ 'common', 'auth', 'bt' ]`
  - `auth.ignore`：`/^\/api\/v1\/auth\//`, `^\/public\/`, `^\/ui$`
  - `bt.match`：`/^\/api\/v1\/proxy\/request/`
  - `security.csrf.enable=false`
  - `sqlite.path`：`${appInfo.baseDir}/data/api.db`
  - `multipart.mode='file'`
- `plugin.ts`：启用 tegg 控制器/配置/事件总线/调度/AOP 与 tracer

## API 说明

### 认证

- `GET /api/v1/auth/google-auth-bind`
  - 返回：`{ code: 200, message: 'success', data: { qrCodeUrl, secret } }`
  - 说明：生成并存储 2FA `secret`，返回二维码 URL 与 `secret`
  - 鉴权：免认证（通过 `auth.ignore`）

- `POST /api/v1/auth/google-auth-verify`
  - 请求体：`{ token }`（6 位 TOTP）
  - 成功：签名会话 Cookie `ll_session`（`maxAge=4h`, `httpOnly`, `signed`）
  - 失败：`401 { code: 401, message: 'Invalid token or session expired.' }`
  - 鉴权：免认证（通过 `auth.ignore`）

### 代理

- `POST /api/v1/proxy/bind-panel-key`
  - 请求体：`{ type, url, key }`，`type ∈ { 'bt', '1panel' }`
  - 功能：绑定并保存面板地址与密钥
  - 响应：`{ code: 200, message: 'Panel key bound successfully.' }`
  - 鉴权：需要有效会话 Cookie `ll_session`

- `ALL /api/v1/proxy/request`
  - 参数来源：查询或请求体 `panelType`、`url`、`method`、`params`
  - `bt` 特殊：自动追加 `request_time`（秒）与 `request_token=md5(key+request_time)`
  - 上游 URL：`{panel.url}{url}`（自动补斜杠处理）
  - 响应：`{ code, message, data }`；`ctx.status=code` 透传上游 HTTP 状态码
  - 未配置面板：`400 { code: 400, message: 'Panel not configured.' }`
  - 鉴权：需要有效会话 Cookie `ll_session`

### UI

- `GET /ui`
  - 行为：`302` 重定向到 `/public/index.html`

## 中间件行为

- `common.ts`
  - 设置响应头：`X-Common-Middleware: enabled`
- `auth.ts`
  - 检查 `ll_session` 是否有效；无效时返回 `401 AUTH_REQUIRED`
  - 例外：`/api/v1/auth/**`、`/public/**`、`/ui`
- `bt.ts`
  - 匹配 `/api/v1/proxy/request` 请求；设置响应头 `X-BT-Middleware: enabled`

## 服务层

- `AuthService`
  - `generateBindInfo()`：生成 TOTP secret（`speakeasy`），保存到 `auth` 表
  - `verifyTokenAndCreateSession(token)`：校验 TOTP，创建 4h 会话并返回 `sessionId`

- `ProxyService`
  - `bindPanelKey(type, url, key)`：保存面板配置到 `panel` 表
  - `handleRequest(ctx)`：读取配置、拼装请求并调用 `axios`；异常时透传上游状态码与响应体

- `StorageService`（`better-sqlite3`）
  - 初始化表：
    - `auth(id, secret, created_at)`
    - `session(session_id, expires_at, created_at)`
    - `panel(type, url, key, updated_at)`
  - 能力：`setTwoFASecret`、`getTwoFASecret`、`createSession(ttlMs)`、`isValidSession`、`bindPanelKey`、`getPanel`

## tegg 模块示例

- `GET /` → `hello egg`
- `GET /bar/user?userId=...` → `hello, {userId}`（依赖 `HelloService.hello`）

## 测试

- 运行：`pnpm -C apps/api exec egg-bin test`
- 覆盖：
  - 2FA 验证流程与设置 Cookie（`auth.test.ts`）
  - bt 绑定与 GET/POST 代理、状态码透传与参数校验（`proxy.test.ts`）
  - 1panel 基本 GET 代理（`proxy.test.ts`）
  - tegg 模块控制器与服务（`home.test.ts`、`user.test.ts`、`HelloService.test.ts`）

## 示例

- 绑定 2FA：
  - `curl -s http://127.0.0.1:7001/api/v1/auth/google-auth-bind`
- 验证 2FA：
  - `curl -i -X POST http://127.0.0.1:7001/api/v1/auth/google-auth-verify -H 'Content-Type: application/json' -d '{"token":"123456"}'`
- 绑定面板（bt）：
  - `curl -X POST http://127.0.0.1:7001/api/v1/proxy/bind-panel-key -H 'Cookie: ll_session=...' -H 'Content-Type: application/json' -d '{"type":"bt","url":"https://httpbin.org","key":"abc123"}'`
- 代理 GET（bt）：
  - `curl 'http://127.0.0.1:7001/api/v1/proxy/request?panelType=bt&url=/get&method=GET' -H 'Cookie: ll_session=...'`
- 代理 POST（1panel）：
  - `curl -X POST http://127.0.0.1:7001/api/v1/proxy/request -H 'Cookie: ll_session=...' -H 'Content-Type: application/json' -d '{"panelType":"1panel","url":"/post","method":"POST","params":{"foo":"bar"}}'`

## 安全与建议

- 生产环境建议：
  - 自定义并保密 `config.keys`；SQLite 路径存储到持久化磁盘
  - 为 Cookie 增加 `secure` 与 `sameSite`（视部署场景）
  - 开启合理的 `CORS` 与速率限制
- 代理安全：
  - bt 的 `request_token` 基于共享密钥与时间戳，需配合 HTTPS 与服务端验证

## 业务流程

- 前置条件
  - 服务已运行：`http://127.0.0.1:7001`
  - 默认配置启用：签名 Cookie、关闭 CSRF（API 场景）

### 2FA 绑定与会话创建
- 生成绑定信息：`GET /api/v1/auth/google-auth-bind`
  - 返回：`secret`（base32）与 `qrCodeUrl`（`otpauth://...`）
  - 行为：持久化 `secret` 到 `auth` 表
- 验证 TOTP 并创建会话：`POST /api/v1/auth/google-auth-verify`
  - 请求体：`{ token }`（6 位一次性口令）
  - 成功：设置 `ll_session` Cookie（有效期 4h，`httpOnly`，签名）
  - 失败：`401 { code: 401, message: 'Invalid token or session expired.' }`

### 受保护接口访问
- 前提：客户端需携带有效 `ll_session` Cookie
- 示例：`GET /bar/user?userId=Alice`
  - 响应：`hello, Alice`
  - 无会话：`401 { code: 401, message: 'AUTH_REQUIRED' }`

### 面板绑定与代理
- 绑定面板：`POST /api/v1/proxy/bind-panel-key`
  - 请求体：`{ type, url, key }`
  - 成功：`{ code: 200, message: 'Panel key bound successfully.' }`
- 代理调用：`ALL /api/v1/proxy/request`
  - 参数：`panelType`、`url`、`method`、`params`
  - bt 特殊：自动追加 `request_time` 与 `request_token=md5(key+request_time)`
  - 未配置面板：`400 { code: 400, message: 'Panel not configured.' }`

### 会话生命周期
- 生成：`createSession(ttlMs=4h)` 持久化到 `session` 表
- 校验：`isValidSession(sessionId)`；过期返回 `false`
- 可选：实现 `logout` 删除 `session` 并清理 Cookie

### 错误处理约定
- `401 AUTH_REQUIRED`：缺少或无效会话
- `401 Invalid token or session expired.`：TOTP 验证失败或会话过期
- `400 Panel not configured.`：未绑定面板配置
- 代理错误：透传上游状态码到 `code` 与 `ctx.status`

### 典型调用序列
1. 绑定 2FA → `GET /api/v1/auth/google-auth-bind`（获得 `secret`/二维码）
2. 生成 TOTP → 输入 6 位口令（本地或 App）
3. 验证并创建会话 → `POST /api/v1/auth/google-auth-verify`（获得 `ll_session`）
4. 绑定面板 → `POST /api/v1/proxy/bind-panel-key`
5. 发起代理请求 → `GET/POST /api/v1/proxy/request`
6. 访问受保护接口 → `GET /bar/user?userId=Alice`

---

如需将本页内容同步到 `apps/api/README.md` 或生成英文版，请告知我目标路径或语言偏好。