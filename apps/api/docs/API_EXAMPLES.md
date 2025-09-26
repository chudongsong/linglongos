# API 使用示例

本文档提供了 LingLongOS API 的详细使用示例，包括认证流程、代理请求等常见场景。

## 📋 目录

- [认证流程](#认证流程)
- [面板代理](#面板代理)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

## 🔐 认证流程

### 1. 获取 Google Authenticator 绑定信息

**请求**:
```bash
curl -X GET "http://localhost:4000/api/v1/auth/google-auth-bind" \
  -H "Content-Type: application/json"
```

**响应**:
```json
{
  "code": 200,
  "status": "success",
  "message": "success",
  "data": {
    "qrCodeUrl": "otpauth://totp/LingLongOS:user?secret=JBSWY3DPEHPK3PXP&issuer=LingLongOS",
    "secret": "JBSWY3DPEHPK3PXP"
  }
}
```

**说明**:
- 使用 `qrCodeUrl` 生成二维码供用户扫描
- 用户在 Google Authenticator 中添加账户
- 服务器会设置绑定 Cookie，有效期 10 分钟

### 2. 验证 TOTP 令牌

**请求**:
```bash
curl -X POST "http://localhost:4000/api/v1/auth/google-auth-verify" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

**成功响应**:
```json
{
  "code": 200,
  "status": "success",
  "message": "认证成功，会话已创建"
}
```

**错误响应**:
```json
{
  "code": 401,
  "status": "error",
  "message": "令牌无效或会话已过期"
}
```

**说明**:
- 验证成功后会创建 4 小时有效期的会话
- 服务器会设置会话 Cookie
- 后续请求会自动验证会话

### 3. 检查认证配置状态

**请求**:
```bash
curl -X GET "http://localhost:4000/api/v1/auth/google-auth-config" \
  -H "Content-Type: application/json"
```

**响应**:
```json
{
  "code": 200,
  "status": "success",
  "message": "success",
  "data": {
    "isConfigured": true,
    "configuredAt": 1640995200000
  }
}
```

## 🔧 面板代理

### 1. 绑定面板密钥

**宝塔面板示例**:
```bash
curl -X POST "http://localhost:4000/api/v1/proxy/bind-panel-key" \
  -H "Content-Type: application/json" \
  -H "Cookie: ll_session=your-session-id" \
  -d '{
    "type": "bt",
    "url": "http://192.168.1.100:8888",
    "key": "your-32-character-bt-api-key"
  }'
```

**1Panel 示例**:
```bash
curl -X POST "http://localhost:4000/api/v1/proxy/bind-panel-key" \
  -H "Content-Type: application/json" \
  -H "Cookie: ll_session=your-session-id" \
  -d '{
    "type": "1panel",
    "url": "https://panel.example.com:10086",
    "key": "your-1panel-api-key"
  }'
```

**成功响应**:
```json
{
  "code": 200,
  "status": "success",
  "message": "面板密钥绑定成功"
}
```

### 2. 代理请求

#### GET 请求示例

**获取系统信息**:
```bash
curl -X GET "http://localhost:4000/api/v1/proxy/request?url=/api/panel/get_sys_info&panelType=bt" \
  -H "Cookie: ll_session=your-session-id"
```

**获取网站列表**:
```bash
curl -X GET "http://localhost:4000/api/v1/proxy/request?url=/data&panelType=bt&ignoreSslErrors=true" \
  -H "Cookie: ll_session=your-session-id"
```

#### POST 请求示例

**创建网站**:
```bash
curl -X POST "http://localhost:4000/api/v1/proxy/request" \
  -H "Content-Type: application/json" \
  -H "Cookie: ll_session=your-session-id" \
  -d '{
    "url": "/site",
    "panelType": "bt",
    "params": {
      "webname": {
        "domain": "example.com",
        "domainlist": ["example.com", "www.example.com"],
        "count": 0
      },
      "path": "/www/wwwroot/example.com",
      "type_id": 0,
      "type": "PHP",
      "version": "74",
      "port": "80",
      "ps": "示例网站"
    }
  }'
```

**删除文件**:
```bash
curl -X POST "http://localhost:4000/api/v1/proxy/request" \
  -H "Content-Type: application/json" \
  -H "Cookie: ll_session=your-session-id" \
  -d '{
    "url": "/files",
    "panelType": "bt",
    "params": {
      "type": "delete",
      "path": "/www/wwwroot/test.txt"
    }
  }'
```

### 3. 宝塔面板专用接口

**快捷获取系统信息**:
```bash
curl -X GET "http://localhost:4000/api/v1/btpanel/request?url=/api/panel/get_sys_info" \
  -H "Cookie: ll_session=your-session-id"
```

**快捷重启服务**:
```bash
curl -X POST "http://localhost:4000/api/v1/btpanel/request" \
  -H "Content-Type: application/json" \
  -H "Cookie: ll_session=your-session-id" \
  -d '{
    "url": "/system",
    "params": {
      "type": "restart",
      "name": "nginx"
    }
  }'
```

## ❌ 错误处理

### 常见错误响应

**认证失败**:
```json
{
  "code": 401,
  "status": "error",
  "message": "未授权访问"
}
```

**参数验证失败**:
```json
{
  "code": 400,
  "status": "error",
  "message": "参数无效",
  "data": {
    "fieldErrors": {
      "token": ["String must contain exactly 6 character(s)"]
    }
  }
}
```

**面板连接失败**:
```json
{
  "code": 500,
  "status": "error",
  "message": "连接被拒绝",
  "data": {
    "suggestion": "请检查面板地址和端口是否正确"
  }
}
```

**SSL 证书验证失败**:
```json
{
  "code": 400,
  "status": "error",
  "message": "SSL证书验证失败",
  "data": {
    "message": "self signed certificate",
    "suggestion": "您可以在请求中添加 \"ignoreSslErrors\": true 来跳过SSL证书验证，但这会降低安全性。",
    "example": {
      "ignoreSslErrors": true
    }
  }
}
```

## 💡 最佳实践

### 1. 会话管理

```javascript
// 检查会话是否有效
async function checkSession() {
  try {
    const response = await fetch('/api/v1/auth/google-auth-config', {
      credentials: 'include' // 包含 Cookie
    });
    
    if (response.status === 401) {
      // 会话已过期，需要重新认证
      window.location.href = '/login';
    }
    
    return response.ok;
  } catch (error) {
    console.error('检查会话失败:', error);
    return false;
  }
}
```

### 2. 错误处理

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API 请求失败:', error);
    throw error;
  }
}
```

### 3. 代理请求封装

```javascript
class PanelAPI {
  constructor(panelType) {
    this.panelType = panelType;
  }
  
  async request(url, params = {}, method = 'POST') {
    const requestData = {
      url,
      panelType: this.panelType,
      params
    };
    
    if (method === 'GET') {
      const queryString = new URLSearchParams({
        url,
        panelType: this.panelType,
        ...params
      }).toString();
      
      return apiRequest(`/api/v1/proxy/request?${queryString}`);
    } else {
      return apiRequest('/api/v1/proxy/request', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
    }
  }
  
  // 获取系统信息
  async getSystemInfo() {
    return this.request('/api/panel/get_sys_info', {}, 'GET');
  }
  
  // 获取网站列表
  async getWebsites() {
    return this.request('/data', { table: 'sites' });
  }
  
  // 重启服务
  async restartService(serviceName) {
    return this.request('/system', {
      type: 'restart',
      name: serviceName
    });
  }
}

// 使用示例
const btPanel = new PanelAPI('bt');
const systemInfo = await btPanel.getSystemInfo();
```

### 4. 安全建议

1. **HTTPS 部署**: 生产环境必须使用 HTTPS
2. **会话超时**: 定期检查会话状态，及时处理过期
3. **错误处理**: 不要在前端暴露敏感的错误信息
4. **输入验证**: 前端也要进行基本的参数验证
5. **日志监控**: 关注服务器日志，及时发现异常

### 5. 性能优化

1. **请求缓存**: 对不经常变化的数据进行缓存
2. **批量请求**: 合并多个相关请求
3. **错误重试**: 实现指数退避的重试机制
4. **超时设置**: 设置合理的请求超时时间

```javascript
// 带重试的请求函数
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiRequest(url, options);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 指数退避
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

**提示**: 更多详细的 API 文档请访问 [Swagger UI](http://localhost:4000/docs)。