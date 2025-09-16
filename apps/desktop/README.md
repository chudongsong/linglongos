# 玲珑OS 桌面应用

基于Vue 3的现代化Web桌面操作系统，提供类原生操作系统的交互体验。

## 功能特性

### 🏠 桌面系统
- ✅ 网格化桌面图标布局
- ✅ 拖拽图标重新排列
- ✅ 文件夹管理
- ✅ 主题和壁纸配置
- ✅ 响应式设计

### 🪟 窗口管理
- ✅ 多窗口系统
- ✅ 窗口拖拽、缩放、最大化/最小化
- ✅ 窗口层级管理
- ✅ 任务栏窗口管理

### 🔐 认证系统
- ✅ 用户登录/登出
- ✅ 会话管理
- ✅ 权限控制
- ✅ 记住登录状态

### 🎨 UI组件
- ✅ 基于shadcn-vue的组件库
- ✅ 深色/浅色主题切换
- ✅ 动画效果
- ✅ 响应式布局

### 📱 内置应用
- ✅ 文件管理器 - 文件浏览和管理
- ✅ 终端模拟器 - 命令行界面
- ✅ 计算器 - 基础计算功能
- ⚠️ 任务管理器 - 进程监控（开发中）
- ⚠️ 文本编辑器 - 文本编辑（开发中）
- ✅ 系统设置 - 主题和配置

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **类型系统**: TypeScript 5.0+
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **UI组件**: shadcn-vue + Tailwind CSS
- **构建工具**: Vite
- **包管理**: pnpm

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```
访问 http://localhost:3000

### 构建生产版本
```bash
pnpm build
```

### 类型检查
```bash
pnpm type-check
```

## 项目结构

```
apps/desktop/
├── src/
│   ├── components/          # 组件
│   │   ├── ui/             # 基础UI组件
│   │   ├── layout/         # 布局组件
│   │   ├── desktop/        # 桌面组件
│   │   ├── window/         # 窗口组件
│   │   └── apps/           # 应用组件
│   ├── stores/             # Pinia状态管理
│   ├── router/             # 路由配置
│   ├── views/              # 页面视图
│   ├── composables/        # 组合式函数
│   ├── types/              # 类型定义
│   ├── utils/              # 工具函数
│   └── assets/             # 静态资源
├── public/                 # 公共资源
└── dist/                   # 构建输出
```

## 核心功能

### 状态管理
- `authStore` - 用户认证和权限管理
- `desktopStore` - 桌面配置和图标管理
- `windowStore` - 窗口状态管理
- `appStore` - 应用注册和生命周期管理

### 组件系统
- **桌面系统**: 网格布局、图标、文件夹
- **窗口系统**: 窗口框架、拖拽、控制
- **UI组件**: 基于shadcn-vue的统一组件库

### 路由设计
- `/login` - 登录页面
- `/` - 桌面主页
- `/settings` - 系统设置
- `/lock` - 锁屏页面

## 使用说明

### 登录
- 默认账号: `admin`
- 默认密码: `admin`

### 桌面操作
- 单击图标选中
- 双击图标启动应用
- 拖拽图标重新排列
- 右键显示上下文菜单

### 窗口操作
- 拖拽标题栏移动窗口
- 拖拽边缘调整大小
- 点击控制按钮最小化/最大化/关闭
- 双击标题栏最大化/还原

## 开发指南

### 添加新应用
1. 在 `src/components/apps/` 创建应用组件
2. 在 `src/stores/app.ts` 的 `loadSystemApps()` 中注册应用
3. 更新 `resolveAppComponent()` 的组件映射

### 自定义主题
1. 修改 `src/assets/styles/globals.css` 中的CSS变量
2. 更新 `tailwind.config.js` 中的主题配置
3. 使用 `desktopStore.setTheme()` 动态切换

### 添加新的UI组件
1. 在 `src/components/ui/` 创建组件
2. 基于shadcn-vue的设计规范
3. 使用Tailwind CSS进行样式

## 性能优化

- ✅ 组件懒加载
- ✅ 路由级代码分割
- ✅ 状态持久化
- ✅ 响应式设计
- ✅ 虚拟化渲染（大数据量）

## 浏览器支持

- Chrome >= 88
- Firefox >= 86
- Safari >= 14
- Edge >= 88

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

---

*玲珑OS - 让Web也能拥有桌面般的体验* 🚀