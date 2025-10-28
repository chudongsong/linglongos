# LinglongOS 项目文件结构说明

## 项目概述

LinglongOS 是一个基于现代Web技术栈的操作系统管理平台，采用前后端分离架构，支持多种管理面板集成。

## 整体架构

```
linglongos/
├── apps/                    # 应用程序目录
│   ├── api/                # 后端API服务
│   └── desktop/            # 前端桌面应用
├── docs/                   # 项目文档
├── packages/               # 共享包（如果存在）
├── scripts/                # 构建和部署脚本
├── .github/                # GitHub Actions配置
├── package.json            # 根项目配置
└── README.md              # 项目说明
```

## 后端API服务 (`apps/api/`)

### 目录结构
```
apps/api/
├── app/                    # 应用核心代码
│   ├── controllers/        # 控制器层
│   ├── models/            # 数据模型
│   ├── services/          # 业务逻辑层
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由定义
│   ├── config/            # 配置文件
│   ├── utils/             # 工具函数
│   └── public/            # 静态资源
│       └── setup.html     # 系统初始化页面（待迁移）
├── tests/                 # 测试文件
├── docs/                  # API文档
├── package.json           # 依赖配置
├── tsconfig.json          # TypeScript配置
└── README.md             # API服务说明
```

### 关键文件说明

#### `app/public/setup.html`
- **用途**: 系统初始化向导页面
- **功能**: 
  - 双因子认证(2FA)设置
  - 管理面板绑定
  - 系统状态检查
- **技术栈**: HTML + CSS + JavaScript
- **状态**: 待迁移到前端项目

#### API路由结构
```
/api/v1/
├── auth/                  # 认证相关
│   ├── google-auth-bind   # 生成2FA绑定信息
│   ├── google-auth-confirm # 确认2FA绑定
│   └── google-auth-verify # 2FA登录验证
├── proxy/                 # 代理相关
│   └── bind-panel-key     # 绑定管理面板
└── init/                  # 初始化相关
    └── status             # 系统状态检查
```

## 前端桌面应用 (`apps/desktop/`)

### 当前结构
```
apps/desktop/
├── src/                   # 源代码目录
├── public/                # 公共资源
├── package.json           # 依赖配置
├── vite.config.ts         # Vite配置
├── tsconfig.json          # TypeScript配置
├── tailwind.config.js     # Tailwind CSS配置
└── README.md             # 前端项目说明
```

### 规划的目录结构（基于React + Redux + TypeScript规范）
```
apps/desktop/
├── src/
│   ├── assets/            # 静态资源
│   ├── components/        # 通用组件
│   │   ├── ui/           # shadcn/ui组件
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── features/          # 功能模块
│   │   ├── Setup/         # 系统初始化模块
│   │   │   ├── Setup.tsx  # 主组件（Controller + View）
│   │   │   ├── setupSlice.ts # Redux状态管理
│   │   │   ├── components/ # 模块内组件
│   │   │   │   ├── TwoFactorStep.tsx
│   │   │   │   ├── PanelBindingStep.tsx
│   │   │   │   └── CompletionStep.tsx
│   │   │   └── index.ts   # 模块导出
│   │   └── Dashboard/     # 仪表板模块（未来扩展）
│   ├── hooks/             # 自定义Hooks
│   ├── services/          # API服务层
│   │   ├── api.ts         # Axios配置
│   │   ├── authService.ts # 认证服务
│   │   └── setupService.ts # 初始化服务
│   ├── layouts/           # 布局组件
│   ├── pages/             # 页面组件
│   ├── routes/            # 路由配置
│   ├── store/             # Redux Store
│   ├── types/             # 类型定义
│   ├── utils/             # 工具函数
│   ├── App.tsx
│   └── index.tsx
├── public/
├── tests/                 # 测试文件
│   ├── __tests__/         # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/              # 端到端测试
├── docs/                  # 前端文档
├── .storybook/           # Storybook配置（可选）
├── package.json
├── vite.config.ts
├── vitest.config.ts      # 测试配置
├── tsconfig.json
├── tailwind.config.js
├── components.json       # shadcn/ui配置
└── README.md
```

## 文档目录 (`docs/`)

### 当前结构
```
docs/
├── setup-initialization-business-process.md  # 业务流程文档
├── setup-initialization-api-spec.md          # API接口规范
└── project-structure.md                      # 项目结构说明（本文档）
```

### 规划的文档结构
```
docs/
├── business/              # 业务文档
│   ├── setup-process.md   # 初始化流程
│   └── user-stories.md    # 用户故事
├── technical/             # 技术文档
│   ├── api-spec.md        # API规范
│   ├── architecture.md    # 架构设计
│   └── deployment.md      # 部署指南
├── development/           # 开发文档
│   ├── setup-guide.md     # 开发环境搭建
│   ├── coding-standards.md # 编码规范
│   └── testing-guide.md   # 测试指南
├── migration/             # 迁移文档
│   ├── migration-plan.md  # 迁移计划
│   └── migration-report.md # 迁移报告
└── README.md             # 文档索引
```

## 技术栈说明

### 后端技术栈
- **运行时**: Node.js
- **框架**: Express.js / Fastify（推测）
- **语言**: TypeScript
- **数据库**: SQLite / PostgreSQL（推测）
- **认证**: TOTP (Time-based One-Time Password)
- **API**: RESTful API

### 前端技术栈
- **框架**: React 18+
- **状态管理**: Redux Toolkit + React-Redux
- **路由**: React Router 7+
- **类型系统**: TypeScript 5.2+
- **构建工具**: Vite 7+
- **UI框架**: shadcn/ui + Tailwind CSS 4+
- **图标**: lucide-react
- **HTTP客户端**: Axios
- **测试**: Vitest + React Testing Library

### 开发工具
- **代码规范**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **包管理**: pnpm（推荐）
- **CI/CD**: GitHub Actions

## 关键配置文件

### 根目录配置
- `package.json`: 工作空间配置，脚本定义
- `tsconfig.json`: TypeScript全局配置
- `.gitignore`: Git忽略规则
- `.github/workflows/`: CI/CD流水线配置

### 前端配置
- `vite.config.ts`: Vite构建配置
- `tailwind.config.js`: Tailwind CSS配置
- `components.json`: shadcn/ui组件配置
- `vitest.config.ts`: 测试配置

### 后端配置
- `package.json`: 后端依赖和脚本
- `tsconfig.json`: 后端TypeScript配置
- `app/config/`: 应用配置文件

## 数据流架构

### 系统初始化数据流
```
用户访问 → 前端路由 → Setup组件 → Redux Store → API Service → 后端API → 数据库
                ↓
用户界面 ← View组件 ← Controller ← Redux State ← API Response ← 业务逻辑 ← 数据查询
```

### 状态管理流程
```
用户操作 → UI事件 → Action Creator → Redux Thunk → API调用 → 状态更新 → UI重渲染
```

## 安全架构

### 认证流程
1. **2FA设置**: TOTP密钥生成 → QR码展示 → 验证码确认
2. **面板绑定**: API密钥验证 → 连接测试 → 绑定确认
3. **登录验证**: TOTP验证 → 会话创建 → 权限检查

### 数据保护
- **传输加密**: HTTPS/TLS
- **存储加密**: 敏感数据加密存储
- **会话管理**: 安全的会话生成和过期机制
- **输入验证**: 严格的参数验证和清理

## 部署架构

### 开发环境
```
开发者本地 → Git推送 → GitHub → Actions触发 → 构建测试 → 部署到测试环境
```

### 生产环境
```
测试通过 → 手动/自动发布 → 生产构建 → 容器化部署 → 负载均衡 → 监控告警
```

## 扩展性设计

### 模块化架构
- **功能模块**: 独立的功能模块，便于维护和扩展
- **组件复用**: 通用组件库，提高开发效率
- **API版本**: 支持API版本管理，向后兼容

### 国际化支持
- **多语言**: i18n国际化框架
- **本地化**: 时区、货币、日期格式适配
- **RTL支持**: 右到左语言支持

### 性能优化
- **代码分割**: 按需加载，减少初始包大小
- **缓存策略**: 合理的缓存机制
- **CDN加速**: 静态资源CDN分发

## 维护和监控

### 日志管理
- **结构化日志**: JSON格式日志
- **日志级别**: DEBUG/INFO/WARN/ERROR
- **日志聚合**: 集中式日志收集和分析

### 监控指标
- **性能监控**: 响应时间、吞吐量
- **错误监控**: 错误率、异常追踪
- **业务监控**: 用户行为、转化率

### 备份策略
- **数据备份**: 定期数据备份
- **配置备份**: 配置文件版本管理
- **灾难恢复**: 快速恢复机制