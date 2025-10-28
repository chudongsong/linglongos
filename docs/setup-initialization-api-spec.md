# LinglongOS 系统初始化 API 接口规范

## 概述

本文档描述了 LinglongOS 系统初始化过程中使用的所有 API 接口，包括请求格式、响应格式、参数说明和错误码定义。

## 通用规范

### 基础信息
- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **认证方式**: Cookie-based session
- **字符编码**: UTF-8

### 通用响应格式
```json
{
  "status": 200,
  "message": "success",
  "data": {},
  "timestamp": 1234567890
}
```

### 通用错误码
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 成功 | 继续处理 |
| 400 | 请求参数错误 | 检查请求参数 |
| 401 | 未授权 | 重新登录 |
| 403 | 禁止访问 | 检查权限 |
| 404 | 资源不存在 | 检查请求路径 |
| 500 | 服务器内部错误 | 稍后重试 |

## API 接口详情

### 1. 系统状态检查

**接口描述**: 获取系统当前初始化状态

**请求信息**:
- **方法**: `GET`
- **路径**: `/init/status`
- **参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "message": "success",
  "data": {
    "hasTwoFA": false,
    "hasPanel": false,
    "hasValidSession": false,
    "systemVersion": "1.0.0",
    "initializationRequired": true
  },
  "timestamp": 1234567890
}
```

**响应字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| hasTwoFA | boolean | 是否已配置双因子认证 |
| hasPanel | boolean | 是否已绑定管理面板 |
| hasValidSession | boolean | 是否有有效登录会话 |
| systemVersion | string | 系统版本号 |
| initializationRequired | boolean | 是否需要初始化 |

**错误响应**:
```json
{
  "status": 500,
  "message": "Failed to get system status",
  "data": null,
  "timestamp": 1234567890
}
```

### 2. 生成2FA绑定信息

**接口描述**: 生成TOTP双因子认证的绑定信息和QR码

**请求信息**:
- **方法**: `GET`
- **路径**: `/auth/google-auth-bind`
- **参数**: 无

**响应格式**:
```json
{
  "status": 200,
  "message": "success",
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/LinglongOS:admin?secret=JBSWY3DPEHPK3PXP&issuer=LinglongOS",
    "backupCodes": ["12345678", "87654321"],
    "expiresAt": 1234567890
  },
  "timestamp": 1234567890
}
```

**响应字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| secret | string | TOTP密钥（Base32编码） |
| qrCodeUrl | string | TOTP URL，用于生成QR码 |
| backupCodes | array | 备用恢复码（可选） |
| expiresAt | number | 密钥过期时间戳 |

**错误响应**:
```json
{
  "status": 500,
  "message": "Failed to generate 2FA binding info",
  "data": null,
  "timestamp": 1234567890
}
```

### 3. 确认2FA绑定

**接口描述**: 验证TOTP验证码并确认绑定

**请求信息**:
- **方法**: `POST`
- **路径**: `/auth/google-auth-confirm`
- **请求体**:
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

**请求参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| secret | string | 是 | TOTP密钥 |
| token | string | 是 | 6位验证码 |

**响应格式**:
```json
{
  "status": 200,
  "message": "2FA binding confirmed successfully",
  "data": {
    "userId": "admin",
    "bindingTime": 1234567890,
    "nextStep": "panel-binding"
  },
  "timestamp": 1234567890
}
```

**响应字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户ID |
| bindingTime | number | 绑定时间戳 |
| nextStep | string | 下一步操作提示 |

**错误响应**:
```json
{
  "status": 400,
  "message": "Invalid verification code",
  "data": {
    "error": "INVALID_TOKEN",
    "retryAllowed": true,
    "remainingAttempts": 2
  },
  "timestamp": 1234567890
}
```

### 4. 绑定管理面板

**接口描述**: 绑定外部管理面板的API密钥

**请求信息**:
- **方法**: `POST`
- **路径**: `/proxy/bind-panel-key`
- **请求体**:
```json
{
  "type": "bt",
  "url": "https://panel.example.com",
  "key": "your-api-key-here"
}
```

**请求参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 面板类型：bt/1panel/aaPanel |
| url | string | 是 | 面板访问地址 |
| key | string | 是 | API密钥 |

**响应格式**:
```json
{
  "status": 200,
  "message": "Panel binding successful",
  "data": {
    "panelId": "panel_123",
    "panelType": "bt",
    "panelUrl": "https://panel.example.com",
    "bindingTime": 1234567890,
    "connectionStatus": "active"
  },
  "timestamp": 1234567890
}
```

**响应字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| panelId | string | 面板唯一标识 |
| panelType | string | 面板类型 |
| panelUrl | string | 面板地址 |
| bindingTime | number | 绑定时间戳 |
| connectionStatus | string | 连接状态 |

**错误响应**:
```json
{
  "status": 400,
  "message": "Panel binding failed",
  "data": {
    "error": "INVALID_API_KEY",
    "details": "The provided API key is invalid or expired"
  },
  "timestamp": 1234567890
}
```

### 5. 2FA登录验证

**接口描述**: 使用TOTP验证码进行登录验证

**请求信息**:
- **方法**: `POST`
- **路径**: `/auth/google-auth-verify`
- **请求体**:
```json
{
  "token": "123456"
}
```

**请求参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | 6位TOTP验证码 |

**响应格式**:
```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "sessionId": "sess_123456",
    "userId": "admin",
    "loginTime": 1234567890,
    "expiresAt": 1234567890,
    "redirectUrl": "/dashboard.html"
  },
  "timestamp": 1234567890
}
```

**响应字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| sessionId | string | 会话ID |
| userId | string | 用户ID |
| loginTime | number | 登录时间戳 |
| expiresAt | number | 会话过期时间戳 |
| redirectUrl | string | 登录后跳转地址 |

**错误响应**:
```json
{
  "status": 401,
  "message": "Authentication failed",
  "data": {
    "error": "INVALID_TOKEN",
    "retryAllowed": true,
    "lockoutTime": null
  },
  "timestamp": 1234567890
}
```

## 错误码详细说明

### 2FA相关错误码
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| INVALID_TOKEN | 验证码无效 | 重新输入正确的验证码 |
| TOKEN_EXPIRED | 验证码已过期 | 使用新的验证码 |
| TOKEN_USED | 验证码已使用 | 等待下一个验证码 |
| SECRET_INVALID | 密钥无效 | 重新生成绑定信息 |
| BINDING_FAILED | 绑定失败 | 检查网络连接后重试 |

### 面板绑定错误码
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| INVALID_PANEL_TYPE | 不支持的面板类型 | 选择支持的面板类型 |
| INVALID_URL | URL格式错误 | 检查URL格式 |
| INVALID_API_KEY | API密钥无效 | 检查API密钥是否正确 |
| CONNECTION_FAILED | 连接面板失败 | 检查网络和面板状态 |
| PANEL_ALREADY_BOUND | 面板已绑定 | 先解绑现有面板 |

### 系统状态错误码
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| SYSTEM_NOT_READY | 系统未就绪 | 完成必要的初始化步骤 |
| INITIALIZATION_REQUIRED | 需要初始化 | 执行系统初始化流程 |
| CONFIG_CORRUPTED | 配置文件损坏 | 重新初始化系统 |

## 安全注意事项

### 请求安全
1. **HTTPS**: 所有API请求必须使用HTTPS
2. **CSRF保护**: 包含CSRF令牌
3. **请求限制**: 实施请求频率限制
4. **输入验证**: 严格验证所有输入参数

### 认证安全
1. **会话管理**: 安全的会话生成和管理
2. **密钥保护**: TOTP密钥安全存储
3. **验证码限制**: 限制验证码尝试次数
4. **自动锁定**: 多次失败后自动锁定

### 数据保护
1. **敏感信息**: 不在响应中返回敏感信息
2. **日志记录**: 安全的日志记录策略
3. **数据加密**: 敏感数据加密存储
4. **定期清理**: 定期清理过期数据

## 测试用例

### 正常流程测试
1. 获取系统状态 → 生成2FA → 确认绑定 → 绑定面板 → 登录验证
2. 验证每个步骤的响应格式和数据正确性
3. 测试状态持久化和恢复

### 异常情况测试
1. 网络错误处理
2. 无效参数处理
3. 超时情况处理
4. 并发请求处理

### 安全测试
1. 无效验证码测试
2. 重放攻击测试
3. 参数注入测试
4. 权限验证测试