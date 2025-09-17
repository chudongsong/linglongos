# 桌面应用技术文档

## 1. 项目概述

本项目是一个基于现代前端技术栈构建的桌面应用框架，包含用户认证系统(登录界面)和桌面管理功能。应用采用模块化架构设计，确保代码可维护性和可扩展性，同时提供流畅的用户体验。

## 2. 技术栈详情

### 核心框架
- **React 19**: 用于构建用户界面的JavaScript库，提供组件化开发和高效的DOM渲染
- **Vite 7**: 前端构建工具，提供极速的开发体验和优化的构建输出
- **pnpm**: 快速、节省磁盘空间的包管理器，支持monorepo架构

### 状态管理
- **Rematch**: 基于Redux的简化状态管理库，减少样板代码，提供更直观的API

### 路由管理
- **React Router**: 处理应用内导航和路由管理，支持嵌套路由和代码分割

### UI与样式
- **shadcn**: 可定制的UI组件库，基于Radix UI构建，提供无障碍支持
- **Tailwind CSS**: 实用优先的CSS框架，用于快速构建自定义界面

### 交互功能
- **React DnD**: 拖放功能库，用于实现桌面组件的拖拽交互

### 代码质量
- **ESLint**: 静态代码分析工具，确保代码质量和一致性
- **Prettier**: 代码格式化工具，保持统一的代码风格

## 3. 环境搭建

### 前置要求
- Node.js 18.x 或更高版本
- pnpm 8.x 或更高版本

### 初始化项目

```bash
# 创建Vite项目
pnpm create vite@7 my-desktop-app -- --template react-ts

# 进入项目目录
cd my-desktop-app

# 安装依赖
pnpm install

# 安装额外依赖
pnpm install @rematch/core react-redux react-router-dom @dnd-kit/core @dnd-kit/utilities
pnpm install -D tailwindcss postcss autoprefixer eslint prettier eslint-config-prettier
pnpm install -D @types/react @types/react-dom @types/node

# 初始化Tailwind CSS
npx tailwindcss init -p
```

### 配置文件设置

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**.eslintrc.js**
```javascript
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["react", "@typescript-eslint"],
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    // 自定义规则
  }
}
```

**.prettierrc**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

## 4. 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 共享组件
│   ├── ui/           # shadcn组件
│   ├── layout/       # 布局组件
│   └── common/       # 通用组件
├── config/           # 应用配置
├── features/         # 功能模块
│   ├── auth/         # 认证相关(登录等)
│   └── desktop/      # 桌面管理相关
├── hooks/            # 自定义钩子
├── models/           # Rematch状态模型
├── routes/           # 路由配置
├── services/         # API服务
├── store/            # Rematch store配置
├── styles/           # 全局样式
├── types/            # TypeScript类型定义
├── utils/            # 工具函数
├── App.tsx           # 应用入口组件
└── main.tsx          # 应用渲染入口
```

## 5. 核心功能实现

### 5.1 状态管理配置 (Rematch)

**src/store/index.ts**
```typescript
import { init, RematchDispatch, RematchRootState } from '@rematch/core';
import { models, RootModel } from '../models';

export const store = init({
  models,
});

export type Store = typeof store;
export type Dispatch = RematchDispatch<RootModel>;
export type RootState = RematchRootState<RootModel>;
```

**src/models/index.ts**
```typescript
import { Models } from '@rematch/core';
import auth from './auth';
import desktop from './desktop';

export interface RootModel extends Models<RootModel> {
  auth: typeof auth;
  desktop: typeof desktop;
}

export const models: RootModel = { auth, desktop };
```

**src/models/auth.ts**
```typescript
import { createModel } from '@rematch/core';
import { RootModel } from './index';

interface AuthState {
  user: { id: string; name: string; email: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const auth = createModel<RootModel>()({
  state: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  } as AuthState,
  
  reducers: {
    loginStart: (state) => ({
      ...state,
      isLoading: true,
      error: null,
    }),
    loginSuccess: (state, payload) => ({
      ...state,
      isLoading: false,
      isAuthenticated: true,
      user: payload.user,
      token: payload.token,
    }),
    loginFailure: (state, payload) => ({
      ...state,
      isLoading: false,
      error: payload,
    }),
    logout: () => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
  },
  
  effects: (dispatch) => ({
    async login(userData: { email: string; password: string }) {
      dispatch.auth.loginStart();
      try {
        // 实际项目中替换为API调用
        const response = await new Promise((resolve) => 
          setTimeout(() => resolve({ 
            user: { id: '1', name: 'User', email: userData.email }, 
            token: 'dummy-token' 
          }), 1000)
        );
        dispatch.auth.loginSuccess(response);
        return true;
      } catch (error) {
        dispatch.auth.loginFailure('Login failed');
        return false;
      }
    },
  }),
});
```

### 5.2 路由配置

**src/routes/index.tsx**
```typescript
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Layout from '../components/layout/Layout';
import Login from '../features/auth/Login';
import Desktop from '../features/desktop/Desktop';
import ProtectedRoute from './ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <Desktop />,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
```

**src/routes/ProtectedRoute.tsx**
```typescript
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

### 5.3 登录界面实现

**src/features/auth/Login.tsx**
```typescript
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Dispatch } from '../../store';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<Dispatch>();
  const navigate = useNavigate();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await dispatch.auth.login({ email, password });
    if (success) {
      navigate('/');
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email">邮箱</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password">密码</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.4 桌面管理实现

**src/features/desktop/Desktop.tsx**
```typescript
import { useSelector, useDispatch } from 'react-redux';
import { RootState, Dispatch } from '../../store';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import DesktopIcon from './DesktopIcon';
import { useState } from 'react';

export default function Desktop() {
  const { icons } = useSelector((state: RootState) => state.desktop);
  const dispatch = useDispatch<Dispatch>();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      dispatch.desktop.reorderIcons({
        activeId: active.id as string,
        overId: over.id as string,
      });
    }
    
    setActiveId(null);
  };

  const findIcon = (id: string | null) => {
    if (!id) return null;
    return icons.find(icon => icon.id === id);
  };

  const activeIcon = findIcon(activeId);

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto">
      <DndContext onDragEnd={handleDragEnd} onDragStart={(event) => setActiveId(event.active.id as string)}>
        <div className="p-6 grid grid-cols-5 gap-6">
          {icons.map((icon) => (
            <DesktopIcon key={icon.id} icon={icon} />
          ))}
        </div>
        
        <DragOverlay>
          {activeIcon && (
            <div style={{ transform: CSS.Transform.toString(activeIcon.transform) }}>
              <DesktopIcon icon={activeIcon} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
```

**src/features/desktop/DesktopIcon.tsx**
```typescript
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { IconType } from '../../models/desktop';

interface DesktopIconProps {
  icon: IconType;
  isDragging?: boolean;
}

export default function DesktopIcon({ icon, isDragging = false }: DesktopIconProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: icon.id,
    data: {
      type: 'icon',
      icon,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center cursor-move select-none"
    >
      <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-md mb-2">
        <span className="text-2xl">{icon.icon}</span>
      </div>
      <span className="text-sm text-gray-800 max-w-[80px] text-center truncate">
        {icon.name}
      </span>
    </div>
  );
}
```

## 6. 开发规范

### 代码风格
- 使用ESLint和Prettier保持代码风格一致
- 遵循React最佳实践，使用函数组件和Hooks
- 组件命名使用PascalCase，函数和变量使用camelCase
- 文件名与组件名保持一致

### 提交规范
- 提交信息遵循Conventional Commits规范
- 提交前运行`pnpm lint`确保代码质量

### 组件开发
- 通用组件放在`components/common`目录
- UI组件使用shadcn并放在`components/ui`目录
- 组件应保持单一职责，避免过大的组件

## 7. 构建与部署

### 开发环境
```bash
# 启动开发服务器
pnpm dev
```

### 构建生产版本
```bash
# 构建应用
pnpm build

# 预览构建结果
pnpm preview
```

### 部署说明
1. 构建生产版本后，将`dist`目录中的文件部署到服务器
2. 配置适当的缓存策略，利用Vite的内容哈希文件名
3. 对于桌面应用分发，可以考虑使用Electron包装Web应用

## 8. 扩展与维护

### 功能扩展
- 新增功能应放在`features`目录下，保持模块化
- 添加新的状态管理模型时，遵循Rematch的规范
- 新组件应考虑复用性和可测试性

### 测试策略
- 单元测试：使用Jest测试工具函数和状态模型
- 组件测试：使用React Testing Library测试UI组件
- E2E测试：考虑使用Cypress测试关键用户流程

### 性能优化
- 使用React.memo避免不必要的重渲染
- 实现代码分割，减小初始加载体积
- 对大型列表使用虚拟滚动

通过以上技术文档，开发团队可以快速了解项目结构、技术栈和实现方式，从而高效地进行开发和维护工作。该文档将作为项目开发的参考指南，确保团队成员遵循统一的规范和最佳实践。
