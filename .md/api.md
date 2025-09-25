好的，以下是根据您的要求，优化并整合了会话鉴权和 Google Auth 验证跳转的完整 **API 和技术文档**。

这份文档包含了项目的整体设计、所有 API 接口的详细定义、以及实现逻辑。所有受保护的接口都会在请求前检查会话，如果会话无效或不存在，将引导用户重新进行 Google Auth 验证。

-----

### API 和技术文档

#### 项目概述

本项目是一个基于 **Node.js、Koa.js、TypeScript** 的通用 **API 代理库**。它采用可配置化的设计，能够统一管理不同面板（如宝塔、1Panel）的 API 请求。为确保安全性，所有 API 请求都需通过 **Google 身份验证器** 进行双重认证（2FA），并在会话失效时强制用户重新认证。

#### 项目技术栈

  * **后端核心**: Node.js, Koa.js
  * **语言**: TypeScript
  * **代码规范**: Prettier (格式化), ESLint (规范)
  * **单元测试**: Jest
  * **认证**: `google-auth-library`
  * **代理请求**: `axios`
  * **加密**: `md5`

-----

### API 接口定义

所有非认证相关的 API 接口都需要进行会话鉴权。如果会话验证失败（如会话过期、用户未绑定 2FA 或未进行 2FA 验证），服务器将返回特定的错误码，并建议前端重定向到认证页面。

#### 1\. 认证相关 API

##### **Google 身份验证器绑定**

  * **URL**: `/api/v1/auth/google-auth-bind`
  * **方法**: `GET`
  * **描述**: 获取用于绑定 Google 身份验证器的二维码 URL 和密钥。用户首次绑定时调用。
  * **返回参数**:
      * `qrCodeUrl` (string): 包含密钥的二维码 URL，用户可使用 Google Authenticator 扫描。
      * `secret` (string): 用于生成 2FA 令牌的密钥。
  * **示例响应**:
    ```json
    {
      "code": 200,
      "message": "success",
      "data": {
        "qrCodeUrl": "otpauth://totp/YourApp:user?secret=JBSWY3DPEHPK3PXP&issuer=YourApp",
        "secret": "JBSWY3DPEHPK3PXP"
      }
    }
    ```

##### **Google 身份验证器验证**

  * **URL**: `/api/v1/auth/google-auth-verify`
  * **方法**: `POST`
  * **描述**: 验证用户提供的 6 位数 2FA 令牌。验证成功后，创建有效会话（默认 4 小时），此会话将用于后续的 API 鉴权。
  * **请求参数**:
      * `token` (string, **必需**): 用户在 Google Authenticator 应用中看到的 6 位数令牌。
  * **示例响应 (成功)**:
    ```json
    {
      "code": 200,
      "message": "Authentication successful, session created."
    }
    ```
  * **示例响应 (失败)**:
    ```json
    {
      "code": 401,
      "message": "Invalid token or session expired."
    }
    ```

-----

#### 2\. 受保护的 API (需要会话鉴权)

##### **面板密钥绑定**

  * **URL**: `/api/v1/proxy/bind-panel-key`
  * **方法**: `POST`
  * **描述**: 绑定并保存面板的 API 访问信息。
  * **请求参数**:
      * `type` (string, **必需**): 面板类型，如 `'bt'`（宝塔）或 `'1panel'`。
      * `url` (string, **必需**): 面板 API 地址，格式为 **协议 + 地址 + 端口**。
      * `key` (string, **必需**): API 密钥，长度为 32 位。
  * **示例响应 (成功)**:
    ```json
    {
      "code": 200,
      "message": "Panel key bound successfully."
    }
    ```

##### **代理请求**

  * **URL**: `/api/v1/proxy/request`
  * **方法**: `POST` 或 `GET`
  * **描述**: 代理请求到指定的面板 API。该接口会自动处理宝塔面板所需的 `request_time` 和 `request_token` 参数，并对返回数据进行格式化。
  * **请求参数**:
      * `url` (string, **必需**): 要代理的面板 API 路径，如 `/api/panel/get_sys_info`。
      * `panelType` (string, **必需**): 指定要使用的面板类型（`'bt'` 或 `'1panel'`）。
      * `params` (object, 可选): 代理请求所需的其他参数。
  * **示例响应 (宝塔面板)**:
    ```json
    {
      "code": 200,
      "message": "success",
      "data": {
        "panel_version": "7.9.8",
        "system": "Centos",
        ...
      }
    }
    ```

-----

### 技术实现文档

#### 1\. 项目结构

```
/src
├── config/
│   └── proxy.config.ts    // 面板代理规则配置文件
├── controllers/
│   ├── authController.ts  // 认证控制器
│   └── proxyController.ts // 代理控制器
├── services/
│   ├── authService.ts     // 认证服务，处理 2FA 逻辑
│   └── proxyService.ts    // 核心代理服务，读取配置并执行代理
├── middlewares/
│   ├── authMiddleware.ts  // 核心：会话鉴权中间件
│   ├── btMiddleware.ts    // 宝塔代理数据处理中间件
│   └── commonMiddleware.ts // 通用数据处理中间件
├── utils/
│   └── crypto.ts
├── routes/
│   └── index.ts
├── app.ts                 // 应用入口文件
```

#### 2\. 核心逻辑实现

##### **会话鉴权中间件 (`authMiddleware.ts`)**

这是整个系统的核心安全层。所有受保护的路由都将通过这个中间件。

  * **功能**: 检查用户请求的会话状态。
  * **逻辑**:
    1.  在 **Koa** 路由前，`authMiddleware` 会检查请求头或 Cookie 中的会话 ID。
    2.  根据会话 ID 在服务器端查找对应的会话数据。
    3.  如果会话不存在，或者已过期，或者用户未完成 2FA 验证，中间件将中断请求。
    4.  服务器返回统一的 **401 Unauthorized** 状态码，并附带一个特定的错误码（例如 `AUTH_REQUIRED`）。
    5.  前端接收到此特定错误码后，**立即重定向** 到 `/auth` 或其他 Google Auth 验证页面，强制用户重新登录。
    6.  如果会话有效，请求将继续传递给下一个中间件或控制器。

##### **代理中间件 (`btMiddleware.ts` / `commonMiddleware.ts`)**

  * **功能**: 在代理请求前后处理数据。
  * **逻辑**:
    1.  **宝塔代理**:
          * `btMiddleware` 在请求发送到宝塔面板前，根据配置文件中的密钥，自动计算并注入 `request_time` 和 `request_token` 这两个参数。
          * 接收到宝塔面板的响应后，也可以在这里进行统一的格式化处理，确保返回给前端的数据结构一致。
    2.  **通用代理**:
          * `commonMiddleware` 用于处理所有面板代理的通用逻辑，例如请求参数的验证、数据格式的统一转换等。

这种设计确保了后端服务的健壮性和安全性。**会话管理与业务逻辑解耦**，所有业务控制器无需关心鉴权问题，大大简化了代码复杂度。
