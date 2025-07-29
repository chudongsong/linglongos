# 玲珑OS (LingLong OS)

> 面向多面板API的统一前端操作环境 - A Unified Frontend for Multi-Panel APIs

[![Version](https://img.shields.io/badge/version-2.2-blue.svg)](https://github.com/linglongos/linglongos)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vue](https://img.shields.io/badge/Vue-3.4+-green.svg)](https://vuejs.org/)

## 🎯 项目概述

玲珑OS是一个现代化的Web操作系统，旨在解决多面板管理的痛点。它并非要取代宝塔等后端面板，而是为其提供一个统一、现代、高效的"外壳"。通过一个仿原生操作系统的Web界面，将用户分散在不同服务器、不同版本的管理面板聚合到同一个工作空间中。

### 🌟 核心特色

- **🎨 现代化UI设计** - 采用半透明、模糊效果等现代UI设计语言
- **🖥️ 完整桌面体验** - 提供窗口管理、任务栏、文件管理等完整OS功能
- **🔧 统一操作界面** - 解决多面板UI不一致的问题
- **⚡ 高性能架构** - 基于Vue 3 + TypeScript的现代化技术栈
- **🧩 模块化设计** - Monorepo架构，便于维护和扩展

### 🎯 目标用户

- **中小型企业运维工程师** - 在一个界面中高效管理多个客户或项目的服务器
- **独立开发者/站长** - 简化多台服务器的日常维护工作，降低心智负担
- **技术团队** - 获得一个统一、可扩展的运维操作平台

## 🏗️ 项目架构

### 📁 目录结构

```
linglongos/
├── apps/                          # 应用层
│   └── desktop/                   # 主桌面应用
│       ├── src/
│       │   ├── components/        # Vue组件
│       │   ├── views/            # 页面视图
│       │   ├── stores/           # Pinia状态管理
│       │   └── utils/            # 工具函数
│       ├── public/               # 静态资源
│       └── package.json
├── packages/                      # 包管理层
│   ├── shared-types/             # 共享类型定义
│   ├── ui/                       # UI组件库
│   ├── services/                 # 核心服务
│   └── utils/                    # 工具库
├── demo/                         # 演示版本
├── pnpm-workspace.yaml          # Monorepo配置
├── turbo.json                   # Turborepo配置
└── package.json                 # 根包配置
```

### 🎯 架构设计原则

- **领域驱动设计 (DDD)** - 按业务领域划分模块，降低耦合度
- **依赖注入 (DI)** - 通过统一容器管理依赖，便于测试和替换
- **事件驱动架构 (EDA)** - 模块间通过事件总线进行低耦合通信
- **适配器模式** - 核心逻辑与具体API实现解耦，保证扩展性

## 📦 核心模块详解

### 🖥️ 1. 桌面系统 (Desktop System)

**位置**: `apps/desktop/src/components/Desktop/`

**核心功能**:
- 桌面环境渲染和管理
- 图标网格系统和自由布局
- 桌面壁纸和主题管理
- 小组件系统

**调用方式**:
```typescript
// 桌面配置管理
import { useDesktopStore } from '@/stores/desktop'

const desktopStore = useDesktopStore()

// 添加桌面图标
desktopStore.addIcon({
  id: 'file-manager',
  type: 'app',
  position: { x: 0, y: 0 },
  appId: 'file-manager'
})

// 添加小组件
desktopStore.addWidget({
  id: 'clock-widget',
  type: 'clock',
  position: { x: 5, y: 0 },
  size: { width: 2, height: 1 }
})
```

### 🪟 2. 窗口系统 (Window System)

**位置**: `apps/desktop/src/components/Window/`

**核心功能**:
- 窗口创建、销毁和管理
- 窗口拖拽、缩放、最大化/最小化
- 窗口层级管理和焦点控制
- 窗口布局管理（分屏等）

**调用方式**:
```typescript
// 窗口管理
import { useWindowStore } from '@/stores/window'

const windowStore = useWindowStore()

// 创建新窗口
const windowId = windowStore.createWindow({
  title: '文件管理器',
  component: 'FileManager',
  width: 800,
  height: 600,
  resizable: true,
  maximizable: true
})

// 窗口操作
windowStore.minimizeWindow(windowId)
windowStore.maximizeWindow(windowId)
windowStore.closeWindow(windowId)
```

### 📊 3. 系统栏 (System Bars)

**位置**: `apps/desktop/src/components/SystemBar/`

**核心功能**:
- 顶部信息栏（时间、通知、用户菜单）
- 底部任务栏（应用启动器、运行中应用）
- 开始菜单和系统托盘

**调用方式**:
```typescript
// 任务栏管理
import { useTaskbarStore } from '@/stores/taskbar'

const taskbarStore = useTaskbarStore()

// 添加应用到任务栏
taskbarStore.pinApp('file-manager')

// 显示通知
taskbarStore.showNotification({
  title: '系统通知',
  message: '操作完成',
  type: 'success'
})
```

### 📁 4. 文件管理器 (File Manager)

**位置**: `packages/apps/file-manager/`

**核心功能**:
- 多标签页文件浏览
- 文件基础操作（增删改查）
- 文件搜索和过滤
- 文件预览和编辑

**调用方式**:
```typescript
// 文件操作服务
import { FileService } from '@linglongos/services'

const fileService = new FileService()

// 获取文件列表
const files = await fileService.listFiles('/home/user')

// 文件操作
await fileService.createFolder('/home/user/新建文件夹')
await fileService.copyFile('/path/source.txt', '/path/target.txt')
await fileService.deleteFile('/path/file.txt')
```

### 💻 5. 终端模拟器 (Terminal)

**位置**: `packages/apps/terminal/`

**核心功能**:
- 多标签页终端会话
- 命令执行和输出显示
- 终端主题和字体配置
- SSH连接管理

**调用方式**:
```typescript
// 终端服务
import { TerminalService } from '@linglongos/services'

const terminalService = new TerminalService()

// 创建终端会话
const sessionId = await terminalService.createSession({
  host: 'localhost',
  shell: '/bin/bash'
})

// 执行命令
await terminalService.executeCommand(sessionId, 'ls -la')
```

### ⚙️ 6. 任务管理器 (Task Manager)

**位置**: `packages/apps/task-manager/`

**核心功能**:
- 进程列表和监控
- 系统资源使用情况
- 服务管理（启动/停止/重启）
- 性能图表展示

**调用方式**:
```typescript
// 系统监控服务
import { SystemService } from '@linglongos/services'

const systemService = new SystemService()

// 获取进程列表
const processes = await systemService.getProcessList()

// 获取系统资源
const resources = await systemService.getSystemResources()

// 服务管理
await systemService.restartService('nginx')
```

### 🛠️ 7. 工具库 (@linglongos/utils)

**位置**: `packages/utils/`

**核心功能**:
- 数据类型判断和处理
- 文件操作和路径处理
- URL解析和参数处理
- 正则表达式和验证
- 格式化工具

**调用方式**:
```typescript
// 工具库使用
import { 
  DataType, 
  FileUtils, 
  Validator, 
  NumberFormat 
} from '@linglongos/utils'

// 数据类型判断
if (DataType.isString(data)) {
  // 处理字符串
}

// 文件处理
const fileType = FileUtils.getFileType('document.pdf')
const fileSize = FileUtils.formatSize(1024 * 1024)

// 数据验证
const isValidEmail = Validator.isEmail('user@example.com')

// 数字格式化
const formattedNumber = NumberFormat.toThousands(1234567)
```

### 🎨 8. UI组件库 (@linglongos/ui)

**位置**: `packages/ui/`

**核心功能**:
- 基础组件（Button、Input、Modal等）
- 布局组件（Grid、Flex、Container等）
- 表单组件（Form、Select、DatePicker等）
- 数据展示组件（Table、Chart、Tree等）

**调用方式**:
```vue
<template>
  <l-button type="primary" @click="handleClick">
    点击按钮
  </l-button>
  
  <l-modal v-model:visible="modalVisible" title="对话框">
    <p>对话框内容</p>
  </l-modal>
  
  <l-table :data="tableData" :columns="columns" />
</template>

<script setup lang="ts">
import { LButton, LModal, LTable } from '@linglongos/ui'
</script>
```

### 🔧 9. 核心服务 (@linglongos/services)

**位置**: `packages/services/`

**核心功能**:
- API网关和适配器管理
- 用户认证和权限管理
- 数据持久化服务
- 事件总线和通信

**调用方式**:
```typescript
// 服务注入和使用
import { ServiceContainer } from '@linglongos/services'

// 获取服务实例
const apiService = ServiceContainer.get('ApiService')
const authService = ServiceContainer.get('AuthService')

// 用户认证
const user = await authService.login('username', 'password')

// API调用
const response = await apiService.request('/api/files', {
  method: 'GET',
  params: { path: '/home' }
})
```

## 🚀 开发思路

### 1. 渐进式开发策略

**第一阶段 - MVP核心功能**
- ✅ 基础桌面环境
- ✅ 窗口管理系统
- ✅ 文件管理器
- ✅ 用户认证系统

**第二阶段 - 功能完善**
- 🔄 终端模拟器完善
- 🔄 任务管理器增强
- 🔄 系统设置中心
- 🔄 应用商店框架

**第三阶段 - 生态扩展**
- 📋 适配器平台开放
- 📋 插件系统开发
- 📋 AI助手集成
- 📋 多租户支持

### 2. 技术架构演进

**当前架构特点**:
- 基于Vue 3 + TypeScript的现代化前端架构
- Monorepo管理，模块化开发
- 事件驱动的松耦合设计
- 适配器模式支持多后端

**架构优势**:
- 🎯 **高内聚低耦合** - 每个模块职责单一，依赖清晰
- 🔧 **易于测试** - 依赖注入使得单元测试更容易
- 🚀 **高性能** - 基于Vue 3的响应式系统和虚拟DOM
- 📈 **可扩展** - 适配器模式支持接入任意后端API

### 3. 数据流设计

```
用户操作 → UI组件 → Store状态管理 → Service服务层 → Adapter适配器 → 后端API
    ↓         ↓          ↓            ↓           ↓
  事件触发 → 状态更新 → 业务逻辑 → 数据转换 → API调用
```

## 🔮 扩展思路

### 1. 适配器生态扩展

**当前支持**:
- 宝塔面板适配器
- 1Panel适配器（规划中）

**扩展方向**:
```typescript
// 适配器接口标准化
interface PanelAdapter {
  // 基础信息
  name: string
  version: string
  
  // 文件操作
  listFiles(path: string): Promise<FileItem[]>
  createFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  
  // 系统监控
  getSystemInfo(): Promise<SystemInfo>
  getProcessList(): Promise<Process[]>
  
  // 服务管理
  getServices(): Promise<Service[]>
  controlService(name: string, action: 'start' | 'stop' | 'restart'): Promise<void>
}

// 新适配器注册
AdapterRegistry.register('cpanel', new CpanelAdapter())
AdapterRegistry.register('plesk', new PleskAdapter())
AdapterRegistry.register('directadmin', new DirectAdminAdapter())
```

### 2. 插件系统架构

**插件生命周期**:
```typescript
interface Plugin {
  name: string
  version: string
  
  // 生命周期钩子
  install(app: App): void
  activate(): Promise<void>
  deactivate(): Promise<void>
  uninstall(): Promise<void>
  
  // 扩展点
  contributes?: {
    commands?: Command[]
    menus?: MenuItem[]
    views?: ViewContribution[]
    themes?: Theme[]
  }
}

// 插件管理器
class PluginManager {
  async installPlugin(pluginUrl: string): Promise<void>
  async enablePlugin(pluginId: string): Promise<void>
  async disablePlugin(pluginId: string): Promise<void>
  getInstalledPlugins(): Plugin[]
}
```

### 3. AI助手集成

**智能运维助手**:
```typescript
interface AIAssistant {
  // 自然语言命令解析
  parseCommand(input: string): Promise<Command>
  
  // 智能建议
  getSuggestions(context: OperationContext): Promise<Suggestion[]>
  
  // 异常诊断
  diagnoseIssue(logs: LogEntry[]): Promise<Diagnosis>
  
  // 自动化脚本生成
  generateScript(description: string): Promise<Script>
}

// 使用示例
const ai = new AIAssistant()
const command = await ai.parseCommand("重启nginx服务")
// 解析为: { action: 'restart', service: 'nginx' }
```

### 4. 微前端架构演进

**当前**: 单体前端应用
**目标**: 微前端架构

```typescript
// 微前端应用注册
interface MicroApp {
  name: string
  entry: string
  container: string
  activeRule: string | ((location: Location) => boolean)
}

// 应用注册
registerMicroApps([
  {
    name: 'file-manager',
    entry: '//localhost:3001',
    container: '#file-manager-container',
    activeRule: '/file-manager'
  },
  {
    name: 'terminal',
    entry: '//localhost:3002', 
    container: '#terminal-container',
    activeRule: '/terminal'
  }
])
```

### 5. 多租户支持

**租户隔离**:
```typescript
interface Tenant {
  id: string
  name: string
  domain: string
  config: TenantConfig
  resources: ResourceQuota
}

interface TenantConfig {
  theme: ThemeConfig
  features: FeatureFlags
  integrations: Integration[]
}

// 租户上下文
class TenantContext {
  getCurrentTenant(): Tenant
  switchTenant(tenantId: string): Promise<void>
  getTenantConfig(): TenantConfig
}
```

### 6. 性能优化方向

**代码分割**:
```typescript
// 路由级别的代码分割
const routes = [
  {
    path: '/file-manager',
    component: () => import('@/views/FileManager.vue')
  },
  {
    path: '/terminal', 
    component: () => import('@/views/Terminal.vue')
  }
]

// 组件级别的懒加载
const LazyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
```

**虚拟滚动**:
```typescript
// 大数据量列表优化
import { VirtualList } from '@linglongos/ui'

// 处理万级数据的文件列表
<VirtualList
  :items="fileList"
  :item-height="32"
  :visible-count="20"
/>
```

## 🎯 技术栈总结

| 层级 | 技术选型 | 作用 |
|------|----------|------|
| **项目管理** | pnpm + Turborepo | Monorepo管理，依赖优化，构建加速 |
| **前端框架** | Vue 3 + TypeScript | 响应式UI，类型安全，开发体验 |
| **状态管理** | Pinia | 轻量级状态管理，TypeScript友好 |
| **路由管理** | Vue Router 4 | SPA路由，懒加载，导航守卫 |
| **UI框架** | 自研组件库 + UnoCSS | 统一设计语言，原子化CSS |
| **构建工具** | Vite + tsup | 快速开发构建，模块打包 |
| **代码质量** | ESLint + Prettier + Husky | 代码规范，自动格式化，提交检查 |
| **测试框架** | Vitest + Vue Test Utils | 单元测试，组件测试 |

## 📈 项目状态

- **当前版本**: v2.2
- **开发状态**: 核心功能完成，持续迭代中
- **部署状态**: ✅ 已部署到CloudStudio
- **预览地址**: http://aec33874335b4f0badc1e81f63f37095.ap-singapore.myide.io

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**玲珑OS** - 让服务器管理变得简单而优雅 ✨