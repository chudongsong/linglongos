# LinglongOS API

统一面板代理与认证服务，基于 [Egg](https://eggjs.org) 与 [tegg](https://github.com/eggjs/tegg)

## 注释规范（TS JSDoc）

为提升可维护性，代码注释统一采用 TS JSDoc 风格，要求如下：

- 范围：模块、类、函数/方法、关键逻辑与配置返回对象。
- 必备信息：功能描述、参数说明（含类型与含义）、返回值类型与含义、可能的异常或边界情况。
- 统一格式：

```ts
/**
 * 功能简述（1-2 行）。
 * 可选：关键逻辑或流程要点。
 *
 * @param {Type} paramName - 参数含义与取值要求
 * @param {Type} [optionalParam] - 可选参数说明
 * @returns {ReturnType} - 返回值含义与结构说明
 * @throws {ErrorType} - 可能抛出的异常（如有）
 */
```

注意：在 TypeScript 中，JSDoc 的类型不会影响编译类型，但用于文档与 IDE 智能提示；同时保持函数签名上的显式 TS 类型。

## QuickStart

### Development

```bash
pnpm -C apps/api install
pnpm -C apps/api dev
# 本地服务默认端口 7001
```

Don't tsc compile at development mode, if you had run `tsc` then you need to `npm run clean` before `npm run dev`.

### Deploy

```bash
pnpm -C apps/api tsc
pnpm -C apps/api start
```

### API 文档导出（OpenAPI）

- 服务启动后，访问 `GET /api/v1/docs/openapi.json` 获取动态生成的 OpenAPI 3.0 文档。
- 可直接导入到 Apipost、Postman、Apifox 等 API 管理工具。

示例：

```bash
curl http://localhost:7001/api/v1/docs/openapi.json | jq .info
```

### Npm Scripts

- 使用 `pnpm -C apps/api lint` 检查代码风格
- 使用 `pnpm -C apps/api exec egg-bin test` 运行集成测试
- 使用 `pnpm -C apps/api clean` 清理编译产物

### Requirement

- Node.js >= 20.x
- Typescript >= 5.x

## 接口说明

- `GET /api/v1/auth/google-auth-bind`
  - 返回 `secret` 与二维码URL（本服务用于生成2FA）
- `POST /api/v1/auth/google-auth-verify`
  - 请求体：`{ token }`
  - 验证成功后设置会话Cookie：`ll_session`（签名）
- `POST /api/v1/proxy/bind-panel-key`
  - 请求体：`{ type, url, key }`
  - 绑定面板类型与目标地址、密钥
- `ALL /api/v1/proxy/request`
  - 支持查询或请求体传参：`panelType`、`url`、`method`、`params`
  - `bt` 类型会自动追加 `request_time` 与 `request_token=md5(key+request_time)`
  - 响应的 `code` 会透传上游 HTTP 状态码

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

## 运行测试

```bash
pnpm -C apps/api exec egg-bin test
```

测试覆盖：
- 2FA 验证与会话 Cookie 设置
- bt 面板绑定与 GET/POST 代理、状态码透传、鉴权参数校验
- 1panel 基本 GET 代理

CI 已配置于 `.github/workflows/api-tests.yml`，在推送或 PR 时自动运行。
