# API Proxy Service - API 文档

## 基础信息

- **Base URL**: `http://localhost:3001`
- **Content-Type**: `application/json`
- **认证方式**: JWT Bearer Token

## 认证端点

### 1. 用户注册

**POST** `/api/auth/register`

注册新用户账户。

#### 请求体

```json
{
	"username": "string", // 必填，3-50字符
	"email": "string", // 可选，有效邮箱格式
	"password": "string" // 必填，6-128字符
}
```

#### 响应示例

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "uuid",
			"username": "testuser",
			"email": "test@example.com",
			"createdAt": "2024-01-15T10:30:00Z"
		},
		"tokens": {
			"accessToken": "jwt_token",
			"refreshToken": "refresh_token",
			"expiresIn": 86400
		}
	},
	"message": "Registration successful"
}
```

### 2. 用户登录

**POST** `/api/auth/login`

用户登录获取访问令牌。

#### 请求体

```json
{
	"username": "string", // 必填
	"password": "string" // 必填
}
```

#### 响应示例

```json
{
	"success": true,
	"data": {
		"user": {
			"id": "uuid",
			"username": "testuser",
			"email": "test@example.com",
			"createdAt": "2024-01-15T10:30:00Z"
		},
		"tokens": {
			"accessToken": "jwt_token",
			"refreshToken": "refresh_token",
			"expiresIn": 86400
		}
	},
	"message": "Login successful"
}
```

### 3. 刷新令牌

**POST** `/api/auth/refresh`

使用刷新令牌获取新的访问令牌。

#### 请求体

```json
{
	"refreshToken": "string" // 必填
}
```

### 4. 获取用户信息

**GET** `/api/auth/me`

获取当前用户信息。

**Headers**: `Authorization: Bearer <access_token>`

### 5. 修改密码

**PUT** `/api/auth/password`

修改用户密码。

**Headers**: `Authorization: Bearer <access_token>`

#### 请求体

```json
{
	"currentPassword": "string", // 必填
	"newPassword": "string" // 必填，6-128字符
}
```

## 面板配置管理

### 1. 获取面板配置列表

**GET** `/api/config/panels`

获取当前用户的面板配置列表。

**Headers**: `Authorization: Bearer <access_token>`

#### 查询参数

- `panelType` (可选): onePanel | baota
- `isActive` (可选): true | false
- `healthStatus` (可选): healthy | unhealthy | unknown
- `search` (可选): 搜索关键词
- `page` (可选): 页码，默认1
- `limit` (可选): 每页条数，默认20

#### 响应示例

```json
{
	"success": true,
	"data": {
		"configs": [
			{
				"id": 1,
				"name": "My 1Panel Server",
				"panelType": "onePanel",
				"endpoint": "https://panel.example.com",
				"isActive": true,
				"healthStatus": "healthy",
				"lastHealthCheck": "2024-01-15T10:30:00Z",
				"createdAt": "2024-01-15T09:00:00Z",
				"updatedAt": "2024-01-15T10:30:00Z"
			}
		],
		"pagination": {
			"page": 1,
			"limit": 20,
			"total": 1,
			"totalPages": 1
		}
	},
	"message": "Panel configurations retrieved successfully"
}
```

### 2. 获取单个面板配置

**GET** `/api/config/panels/{id}`

获取指定ID的面板配置详情。

**Headers**: `Authorization: Bearer <access_token>`

### 3. 创建面板配置

**POST** `/api/config/panels`

创建新的面板配置。

**Headers**: `Authorization: Bearer <access_token>`

#### 请求体

```json
{
	"name": "string", // 必填，1-100字符
	"panelType": "onePanel|baota", // 必填
	"endpoint": "string", // 必填，有效URL
	"apiKey": "string" // 必填，1-500字符
}
```

### 4. 更新面板配置

**PUT** `/api/config/panels/{id}`

更新指定的面板配置。

**Headers**: `Authorization: Bearer <access_token>`

#### 请求体

```json
{
	"name": "string", // 可选
	"endpoint": "string", // 可选
	"apiKey": "string" // 可选
}
```

### 5. 删除面板配置

**DELETE** `/api/config/panels/{id}`

删除指定的面板配置（软删除）。

**Headers**: `Authorization: Bearer <access_token>`

### 6. 测试面板连接

**POST** `/api/config/panels/{id}/test`

测试面板配置的连接状态。

**Headers**: `Authorization: Bearer <access_token>`

#### 响应示例

```json
{
	"success": true,
	"data": {
		"isHealthy": true,
		"healthStatus": "healthy",
		"testedAt": "2024-01-15T10:30:00Z"
	},
	"message": "Panel configuration test successful"
}
```

## API代理

### 1. 通过配置ID代理

**ALL** `/api/proxy/{configId}/*`

使用已保存的面板配置代理请求。

**Headers**: `Authorization: Bearer <access_token>`

#### 示例

```http
GET /api/proxy/1/system/info
Authorization: Bearer <access_token>
```

自动转换为对应面板的API调用：

- 1Panel: `GET /api/v1/system/info`
- 宝塔: `POST /ajax` with action=GetSystemTotal

### 2. 自动检测代理

**ALL** `/api/proxy/auto/*`

自动检测面板类型并代理请求。

**Headers**:

- `Authorization: Bearer <access_token>`
- `X-API-Key: <panel_api_key>` 或在请求体中提供

#### 查询参数

- `endpoint`: 目标面板地址

#### 示例

```http
GET /api/proxy/auto/system/info?endpoint=https://panel.example.com
Authorization: Bearer <access_token>
X-API-Key: your-panel-api-key
```

### 3. 健康检查

**GET** `/api/proxy/health/{configId}`

检查指定面板配置的健康状态。

**Headers**: `Authorization: Bearer <access_token>`

## 错误响应格式

所有错误响应都遵循统一格式：

```json
{
	"success": false,
	"error": {
		"code": "ERROR_CODE",
		"category": "AUTH|VALIDATION|PANEL_CONN|PROXY|INTERNAL",
		"message": "Error description",
		"details": {},
		"timestamp": "2024-01-15T10:30:00Z",
		"requestId": "uuid"
	}
}
```

### 常见错误码

- `AUTH_REQUIRED`: 需要认证
- `INVALID_TOKEN`: 无效令牌
- `TOKEN_EXPIRED`: 令牌已过期
- `VALIDATION_ERROR`: 请求验证失败
- `CONFIG_NOT_FOUND`: 配置不存在
- `ACCESS_DENIED`: 访问被拒绝
- `PANEL_CONN_ERROR`: 面板连接错误
- `PROXY_ERROR`: 代理请求错误

## 面板API映射

### 1Panel API映射

| 通用路径       | 1Panel API            | 描述       |
| -------------- | --------------------- | ---------- |
| `/auth/login`  | `/api/v1/auth/login`  | 登录       |
| `/system/info` | `/api/v1/system/info` | 系统信息   |
| `/containers`  | `/api/v1/containers`  | 容器列表   |
| `/images`      | `/api/v1/images`      | 镜像列表   |
| `/websites`    | `/api/v1/websites`    | 网站管理   |
| `/databases`   | `/api/v1/databases`   | 数据库管理 |

### 宝塔面板API映射

| 通用路径       | 宝塔API     | Action           | 描述       |
| -------------- | ----------- | ---------------- | ---------- |
| `/auth/login`  | `/login`    | -                | 登录       |
| `/system/info` | `/ajax`     | `GetSystemTotal` | 系统信息   |
| `/websites`    | `/site`     | `GetSites`       | 网站列表   |
| `/databases`   | `/database` | `GetDatabases`   | 数据库列表 |
| `/files`       | `/files`    | `GetDir`         | 文件管理   |

## 请求/响应示例

### 1Panel系统信息查询

**请求**:

```http
GET /api/proxy/1/system/info
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**实际转换为**:

```http
GET https://panel.example.com/api/v1/system/info
Authorization: Bearer panel-api-key
Content-Type: application/json
X-Panel-Type: onePanel
```

### 宝塔面板网站列表查询

**请求**:

```http
GET /api/proxy/2/websites/list
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**实际转换为**:

```http
POST https://panel.example.com/site
Content-Type: application/x-www-form-urlencoded
X-BT-Key: baota-api-key

action=GetSites&p=1&limit=20&request_token=baota_api_request&request_time=1642248000
```

## 速率限制

- **默认限制**: 每15分钟100个请求
- **基于IP**: 限制来源IP的请求频率
- **响应头**:
  - `X-RateLimit-Limit`: 限制数量
  - `X-RateLimit-Remaining`: 剩余请求数
  - `X-RateLimit-Reset`: 重置时间

## 版本信息

- **API版本**: 1.0.0
- **更新时间**: 2024-01-15
- **兼容性**: Node.js 18+
