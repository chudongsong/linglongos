# Linglong Desktop 应用（React + TypeScript + Vite）

本项目为类 Ubuntu 风格的桌面应用前端，包含桌面、窗口管理器与 Dock，并提供设置应用以管理外观与系统选项。基于 React + TypeScript + Vite 构建，使用 Redux Toolkit 管理全局状态，`react-dnd` 实现拖拽与图标管理。

## 项目概述
- 技术栈：`React`, `TypeScript`, `Vite`, `Redux Toolkit`, `react-dnd`, `tailwindcss`
- 主要模块：
  - `features/desktop`：桌面页面与图标管理
  - `components/WindowManager`：窗口渲染与交互控制
  - `components/Dock`：应用中心与快捷启动栏
  - `features/settings`：系统设置应用（背景、主题、版本、双重认证、宝塔账号、管理 API）
  - `store`：全局状态切片（`desktop`/`window`/`settings`）
  - `services`：配置加载、加载遮罩管理、设置服务
  - `hooks`：桌面网格、拖拽、选择、预览等行为抽象
  - `types`：配置与 DnD 类型定义

## 模块说明
- `src/App.tsx`：应用根组件，提供 `react-dnd` 上下文与桌面主界面容器。
- `src/main.tsx`：应用入口，挂载 React 根并在启动时初始化 `loadingManager`。
- `src/components/Dock.tsx`：左侧应用中心 + 右侧快捷启动栏；支持拖拽排序与从应用中心添加。
- `src/components/WindowManager.tsx`：窗口层组件，支持聚焦、移动、缩放、最小化/最大化。
- `src/features/desktop/Desktop.tsx`：桌面页面，计算并设置网格尺寸、渲染图标、处理选择与拖拽。
- `src/features/settings`：设置应用模块，含各类设置面板组件与导出。
- `src/store/slices/*`：Redux 切片：
  - `desktop.slice`：完整配置加载、图标尺寸与网格计算
  - `window.slice`：窗口生命周期与交互（创建/关闭/聚焦/移动/缩放/最小化/最大化）
  - `settings.slice`：设置状态与异步流程（加载/保存/版本/双重认证/宝塔/管理 API）
- `src/services/config.service.ts`：加载并合并配置，规范化资源路径。
- `src/services/loadingManager.ts`：加载遮罩与进度管理，预检与资源预加载。
- `src/hooks/*`：常用行为抽象（网格、拖拽、选择、预览、容器尺寸/投递等）。
- `src/types/*`：类型定义（应用配置、网格、DnD 项、设置等）。
- `src/utils/snap.ts`：吸附与网格工具常量。

## 开发指南
### 启动与构建
- 安装依赖：`pnpm i` 或 `npm i`
- 开发启动：`pnpm dev`（Vite 开发服务器）
- 生产构建：`pnpm build`；预览：`pnpm preview`

### 状态管理约定
- 使用 Redux Toolkit `createSlice` 定义切片，保持 reducer 纯函数与最小副作用。
- 异步流程使用 `createAsyncThunk`，在 `extraReducers` 处理 pending/fulfilled/rejected。
- 导出 `useAppDispatch` 与 `useAppSelector` 以获得类型安全的 hooks。

### 代码风格与注释
- 类型与函数使用 TSDoc/JSDoc 注释，描述功能、参数与返回值。
- 组件 props 与导出函数应明确类型，避免 `any`。
- 优先使用 `const` 与不可变数据操作，保持可读性与可测试性。

### 目录结构
```
src/
  App.tsx
  main.tsx
  components/
    Dock.tsx
    WindowManager.tsx
  features/
    desktop/
      Desktop.tsx
    settings/
      Settings.tsx
      components/
  hooks/
  services/
  store/
    slices/
  types/
  utils/
```

### 测试
- 使用 `vitest` + `@testing-library/react`，覆盖 hooks、services 与 store。
- 运行：`pnpm test`

### 部署与静态资源
- 静态资源统一放置在 `public/images`，路径以 `/images/...` 引用。
- 配置 JSON 位于 `public/config`，通过服务层加载并合并。
