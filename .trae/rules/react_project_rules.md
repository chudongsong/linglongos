# React + Redux + TypeScript 开发规范

## 技术栈概述

- **核心框架**: React 18+（函数式组件）
- **状态管理**: Redux Toolkit + React-Redux
- **路由管理**: React Router 7+
- **类型系统**: TypeScript 5.2+
- **构建工具**: Vite 7+
- **样式方案**: Tailwind CSS 4+ + tailwind-merge
- **图标库**: lucide-react
- **HTTP客户端**: Axios
- **代码规范**: ESLint + Prettier
- **测试工具**: Jest + React Testing Library

## 项目结构

```
src/
├── assets/             # 静态资源(图片、字体等)
├── components/         # 通用共享组件
│   ├── Button/
│   ├── Input/
│   └── Modal/
├── features/           # 按功能模块划分
│   └── User/           # 用户功能模块
│       ├── User.tsx    # 包含Controller与View
│       ├── userSlice.ts # Model层(状态与业务逻辑)
│       └── index.ts    # 模块导出
│   └── Product/        # 产品功能模块
│       ├── Product.tsx
│       ├── productSlice.ts
│       └── index.ts
├── hooks/              # 全局共享hooks
├── services/           # 统一API服务
│   ├── api.ts          # API基础配置(axios实例)
│   ├── userService.ts  # 用户相关API
│   └── productService.ts # 产品相关API
├── layouts/            # 布局组件
├── pages/              # 页面组件(组合功能模块)
├── routes/             # 路由配置
├── store/              # Redux store配置
├── types/              # 全局类型定义
├── utils/              # 工具函数
├── App.tsx
└── index.tsx
```

## 核心架构模式（MVC + Service）

### 1. Model层（数据模型与状态）

**职责**:
- 定义数据结构与类型
- 管理Redux状态
- 实现业务逻辑与数据验证
- 调用Service层获取数据

**实现方式**:
- 文件位置: `features/[Feature]/[feature]Slice.ts`
- 包含TypeScript接口定义数据模型
- 使用Redux Toolkit的createSlice管理状态
- 通过createAsyncThunk调用Service层API

**基础示例**:
```typescript
// userSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchUser } from '../../services/userService';

// 数据模型
export interface User {
  id: string;
  name: string;
  email: string;
}

// 异步操作
export const loadUser = createAsyncThunk(
  'users/loadUser',
  async (userId: string) => await fetchUser(userId)
);

// 业务逻辑
export const validateUser = (user: Partial<User>): boolean => {
  return !!user.name && !!user.email;
};

// 状态管理
const userSlice = createSlice({
  name: 'users',
  initialState: {
    currentUser: null as User | null,
    loading: false,
    error: null as string | null
  },
  reducers: {},
  extraReducers: (builder) => {
    // 处理异步状态
  }
});

export default userSlice.reducer;
```

### 2. View层（视图展示）

**职责**:
- 纯UI展示，不包含业务逻辑
- 通过props接收数据与回调函数
- 处理UI交互并触发回调
- 负责样式与响应式展示

**实现方式**:
- 作为`[Feature].tsx`中的内部组件
- 使用Tailwind CSS处理样式
- 通过props接收Controller传递的数据
- 通过回调函数与Controller交互

**基础示例**:
```tsx
// User.tsx中的View部分
const UserView = ({ 
  user, 
  isLoading, 
  onEdit 
}: { 
  user: User | null;
  isLoading: boolean;
  onEdit: () => void;
}) => {
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="p-4 border">
      <h2>{user?.name}</h2>
      <button onClick={onEdit} className="btn">Edit</button>
    </div>
  );
};
```

### 3. Controller层（逻辑控制）

**职责**:
- 协调View与Model的交互
- 处理用户行为与业务流程
- 调用Redux actions更新状态
- 管理路由与导航

**实现方式**:
- 作为`[Feature].tsx`中的默认导出组件
- 使用Redux hooks获取状态与dispatch
- 调用Service层处理API操作
- 向View传递数据与回调函数

**基础示例**:
```tsx
// User.tsx中的Controller部分
const UserController = ({ userId }: { userId: string }) => {
  const dispatch = useAppDispatch();
  const { currentUser, loading } = useAppSelector(state => state.users);
  
  useEffect(() => {
    dispatch(loadUser(userId));
  }, [dispatch, userId]);
  
  const handleEdit = () => {
    // 处理编辑逻辑
  };
  
  return (
    <UserView 
      user={currentUser}
      isLoading={loading}
      onEdit={handleEdit}
    />
  );
};

export default UserController;
```

### 4. Service层（API服务）

**职责**:
- 统一管理所有API请求
- 处理请求/响应拦截与错误
- 封装API方法，提供一致接口
- 与后端服务交互

**实现方式**:
- 文件位置: `services/[feature]Service.ts`
- 使用axios发送HTTP请求
- 基础配置集中在`api.ts`
- 返回Promise，不处理业务逻辑

**基础示例**:
```typescript
// userService.ts
import api from './api';
import { User } from '../features/User/userSlice';

export const fetchUser = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const updateUser = async (user: Partial<User>): Promise<User> => {
  const response = await api.put(`/users/${user.id}`, user);
  return response.data;
};
```

## 命名规范

- **功能模块文件夹**: 单数PascalCase（如`User`、`Product`）
- **Controller/View文件**: `[Feature].tsx`（如`User.tsx`）
- **Model文件**: `[feature]Slice.ts`（如`userSlice.ts`）
- **Service文件**: `[feature]Service.ts`（如`userService.ts`）
- **组件命名**: PascalCase（如`UserController`、`UserView`）
- **函数/变量**: camelCase（如`fetchUser`、`handleEdit`）
- **类型/接口**: PascalCase（如`User`、`ProductProps`）
- **常量**: UPPER_SNAKE_CASE（如`MAX_RETRY`）

## 组件通信规范

1. **模块内部通信**:
   - Controller → View: 通过props传递数据
   - View → Controller: 通过回调函数传递事件

2. **模块之间通信**:
   - 共享数据: 通过Redux Store
   - 跨模块调用: 通过Service层方法
   - 页面跳转: 通过React Router的navigate

3. **父子组件通信**:
   - 父传子: props传递数据
   - 子传父: 回调函数传递事件
   - 避免超过3层的props传递

## 代码组织原则

1. **文件组织**:
   - 每个功能模块文件不超过3个
   - 单个文件代码不超过300行，超限则拆分
   - 相关逻辑集中存放，减少文件跳转

2. **导入顺序**:
   - 外部依赖（react, redux等）
   - 内部共享模块（hooks, utils等）
   - 同模块内组件/类型
   - 样式相关

3. **导出规范**:
   - 模块通过index.ts导出公共API
   - 组件默认导出，工具函数命名导出
   - 隐藏内部实现细节，不导出私有成员

## 状态管理原则

1. **状态分类**:
   - 全局状态: Redux Store（用户信息、全局配置等）
   - 模块状态: 对应Feature的Slice（如用户列表、产品详情）
   - 局部UI状态: 组件内useState（表单输入、展开/折叠等）

2. **状态设计**:
   - 扁平化存储，避免深层嵌套
   - 最小化状态，避免冗余数据
   - 状态包含加载状态与错误信息

3. **异步状态处理**:
   - 包含pending/fulfilled/rejected三种状态
   - 统一错误处理机制
   - 避免重复请求

## 样式规范

1. **样式实现**:
   - 优先使用Tailwind CSS工具类
   - 复杂条件样式使用tailwind-merge
   - 全局样式通过@layer扩展Tailwind

2. **响应式设计**:
   - 使用Tailwind断点（sm, md, lg, xl）
   - 移动优先设计原则
   - 关键UI元素适配不同屏幕

3. **样式组织**:
   - 样式与组件就近存放
   - 避免全局样式冲突
   - 主题样式集中配置

## 最佳实践

1. **代码质量**:
   - 禁止使用any类型
   - 组件props必须定义接口
   - 错误必须捕获并处理
   - 编写必要的注释

2. **性能优化**:
   - 合理使用React.memo, useMemo, useCallback
   - 列表渲染使用稳定key
   - 大数据列表实现虚拟滚动
   - 图片与资源懒加载

3. **可测试性**:
   - 业务逻辑与UI分离，便于测试
   - Service层方法可独立测试
   - 核心功能测试覆盖率>80%

4. **可维护性**:
   - 遵循单一职责原则
   - 代码复用（hooks, 通用组件）
   - 避免硬编码，使用配置或常量

本规范平衡了代码组织的清晰度与开发效率，适合中小型React项目使用。团队可根据实际需求进行适当调整，但应保持核心原则的一致性。
