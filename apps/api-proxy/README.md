# API Proxy Service

Node.js API代理服务，用于代理用户提供的API和密钥，访问不同的面板接口（1Panel和宝塔面板），通过中间件机制实现面板类型的智能识别和路由分发。

## 功能特性

### 核心功能
- **API代理服务**：转发用户请求到目标面板API
- **密钥管理**：安全存储和管理用户API密钥（AES-256-GCM加密）
- **面板识别**：自动识别1Panel和宝塔面板类型
- **中间件架构**：模块化处理不同面板的请求格式

### 技术特性
- **JWT认证**：安全的用户认证和授权
- **请求转换**：统一API接口转换为面板特定格式
- **健康检查**：定期检查面板连接状态
- **错误处理**：统一的错误处理和日志记录
- **限流保护**：防止API滥用的速率限制

## 技术栈

- **运行时**: Node.js (v18+)
- **框架**: Express.js + TypeScript
- **数据库**: SQLite
- **安全**: JWT + AES-256-GCM加密
- **日志**: Winston
- **验证**: Joi
- **代理**: Axios + http-proxy-middleware

## 快速开始

### 1. 安装依赖

```bash
cd apps/api-proxy
pnpm install
```

### 2. 环境配置

复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的配置：
```env
# 安全配置（生产环境必须修改）
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=your-32-char-encryption-key-here

# 服务器配置
PORT=3001
HOST=localhost

# 数据库配置
DATABASE_PATH=./data/api-proxy.db
```

### 3. 启动服务

开发环境：
```bash
pnpm dev
```

生产环境：
```bash
pnpm build
pnpm start
```

### 4. 健康检查

访问 http://localhost:3001/health 确认服务正常运行。

## API 文档

### 认证端点

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 刷新Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### 面板配置管理

#### 创建面板配置
```http
POST /api/config/panels
Authorization: Bearer <your-access-token>
Content-Type: application/json

{
  "name": "My 1Panel Server",
  "panelType": "onePanel",
  "endpoint": "https://panel.example.com",
  "apiKey": "your-panel-api-key"
}
```

#### 获取面板配置列表
```http
GET /api/config/panels
Authorization: Bearer <your-access-token>
```

#### 测试面板连接
```http
POST /api/config/panels/{id}/test
Authorization: Bearer <your-access-token>
```

### API代理

#### 通过配置ID代理请求
```http
GET /api/proxy/{configId}/system/info
Authorization: Bearer <your-access-token>
```

#### 自动检测面板类型并代理
```http
GET /api/proxy/auto/system/info?endpoint=https://panel.example.com
Authorization: Bearer <your-access-token>
X-API-Key: your-panel-api-key
```

## 支持的面板

### 1Panel
- **认证方式**: Bearer Token
- **API前缀**: `/api/v1`
- **支持功能**: 
  - 系统信息查询
  - 容器管理
  - 镜像管理
  - 应用管理
  - 文件管理

### 宝塔面板
- **认证方式**: API Key + 签名验证
- **API前缀**: `/api`
- **支持功能**:
  - 系统信息查询
  - 网站管理
  - 数据库管理
  - FTP管理
  - 文件管理

## 目录结构

```
apps/api-proxy/
├── src/
│   ├── auth/                 # 认证相关
│   ├── config/              # 配置管理
│   ├── controllers/         # 控制器
│   ├── middleware/          # 中间件
│   │   ├── panels/         # 面板特定中间件
│   │   └── security/       # 安全中间件
│   ├── models/             # 数据模型
│   ├── routes/             # 路由定义
│   ├── services/           # 业务服务
│   ├── types/              # 类型定义
│   └── utils/              # 工具函数
├── test/                   # 测试文件
├── docs/                   # 文档
└── data/                   # 数据文件（SQLite数据库）
```

## 安全说明

### 数据加密
- **API密钥加密**: 使用AES-256-GCM算法加密存储
- **密码哈希**: 使用bcrypt进行密码哈希
- **传输安全**: 建议使用HTTPS进行生产部署

### 访问控制
- **JWT认证**: 所有API端点都需要有效的JWT token
- **用户隔离**: 用户只能访问自己的面板配置
- **权限验证**: 支持细粒度的权限控制

### 安全最佳实践
1. **更换默认密钥**: 生产环境必须设置强密码的JWT_SECRET和ENCRYPTION_KEY
2. **使用HTTPS**: 生产环境务必启用HTTPS
3. **定期轮换**: 定期轮换API密钥和访问令牌
4. **监控日志**: 关注异常访问和错误日志

## 监控和日志

### 日志级别
- **DEBUG**: 详细的调试信息
- **INFO**: 一般操作信息
- **WARN**: 警告信息
- **ERROR**: 错误信息

### 监控指标
- 请求响应时间
- 错误率统计
- 面板健康状态
- 用户活跃度

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查DATABASE_PATH配置
   - 确保目录权限正确

2. **面板连接失败**
   - 验证面板endpoint是否可达
   - 检查API密钥是否正确
   - 确认面板类型识别正确

3. **JWT验证失败**
   - 检查JWT_SECRET配置
   - 确认token没有过期

### 日志查看
```bash
# 查看应用日志
tail -f logs/api-proxy.log

# 查看错误日志
tail -f logs/api-proxy-error.log
```

## 开发指南

### 添加新面板支持

1. 在 `src/middleware/panels/` 创建新的中间件
2. 实现面板检测逻辑
3. 添加路径映射规则
4. 更新路由配置

### 扩展API功能

1. 在对应的路由文件中添加新端点
2. 实现请求验证和处理逻辑
3. 添加相应的测试用例
4. 更新API文档

## 许可证

MIT License - 详见 LICENSE 文件