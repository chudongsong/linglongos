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
- **测试工具**: Vitest + React Testing Library（单元与组件测试）

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

## 测试规范（Vitest + React Testing Library）

1. 测试范围与目标
   - 单元测试（纯函数、工具方法、Redux slice 中的 reducer 与 selectors）。
   - 组件测试（UI 组件与页面组件，使用 React Testing Library 验证行为与可访问性）。
   - Hooks 测试（使用 renderHook 验证副作用与状态变更）。
   - 覆盖率目标：核心功能 > 80%。

2. 依赖与工具
   - vitest（测试运行时）
   - @vitest/coverage-v8（覆盖率）
   - @testing-library/react、@testing-library/jest-dom、@testing-library/user-event（组件测试）
   - jsdom（浏览器环境模拟）

3. 目录与命名
   - 测试文件与被测文件同目录存放，或集中于 __tests__ 目录。
   - 命名：*.test.ts、*.test.tsx 或 *.spec.ts、*.spec.tsx。

4. 运行命令（使用 pnpm）
   - test（一次性）：pnpm vitest run
   - test:watch（监听）：pnpm vitest
   - coverage：pnpm vitest run --coverage
   - ui（可选）：pnpm vitest --ui

5. 基本配置建议（vitest.config.ts / vite.config.ts 中 test 字段）
   ```ts
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./src/test/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
         reportsDirectory: './coverage',
         thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 }
       },
       include: ['src/**/*.{test,spec}.{ts,tsx}'],
       exclude: ['node_modules', 'dist']
     }
   });
   ```

6. React Testing Library 规范
   - 用例从用户视角出发：优先通过可访问性查询（ByRole、ByLabelText、ByText）。
   - 事件使用 userEvent（避免 fireEvent 直接触发合成事件）。
   - 异步断言使用 findBy 与 waitFor，确保副作用完成后再断言。
   - 首选语义断言：expect(...).toBeInTheDocument()、toHaveTextContent() 等（来自 jest-dom）。
   - 快照用于结构稳定的展示型组件，避免过度使用。

7. Hooks 测试规范
   - 使用 @testing-library/react 提供的 renderHook 与 act 管理更新。
   - 对含定时器或请求的 hooks：使用 vi.useFakeTimers() 或 mock 网络层（Service）以提高确定性。
   - 返回对象的 hooks 建议断言关键字段与回调被调用次数/参数。

8. Redux/Router 集成测试
   - 通过自定义 render 包装 Provider/Router：在测试工具函数中封装 Redux Provider 与 MemoryRouter。
   - 组件测试应在尽可能接近真实运行环境的 Provider 树下进行，减少 mock 深度。

9. Mock 与时钟
   - 模块 mock：vi.mock('模块名')；函数/计时器：vi.fn() / vi.spyOn() / vi.useFakeTimers()。
   - 每个用例后使用 vi.clearAllMocks()、vi.restoreAllMocks() 清理副作用。

10. 覆盖率与限制
   - 对关键路径启用阈值门禁（覆盖率不足视为失败）。
   - 忽略纯样式与声明文件（/* istanbul ignore next */ 或在配置中 exclude）。

11. 约定与检查清单
   - 单元测试聚焦输入→输出，不关心内部实现细节。
   - 组件测试聚焦交互→可见结果，避免查询非可访问节点。
   - 异步与副作用必须显式等待或模拟，避免“偶现红/绿”。
   - 每个公共 hooks/工具函数需至少提供一个典型场景与一个边界场景用例。


## 最佳实践

1. **代码质量**:
   - 严禁使用 `any` 类型；边界输入可使用 `unknown` 并通过类型守卫或模式匹配尽快收窄为具体类型
   - 所有函数、组件、hooks 必须使用 TypeScript 完整类型定义（参数、返回值、状态、错误）
   - 错误必须捕获并处理，统一错误模型与提示策略
   - 所有代码必须包含完整注释（函数用途、参数说明、返回值类型），采用 JSDoc/TSDoc 规范

2. **函数式编程范式（全面采用）**:
   - 以纯函数为核心，避免不必要的副作用（I/O、时间、随机数、DOM 操作）
   - 状态不可变：使用 Redux Toolkit/Immer 的不可变更新语义，严禁直接修改对象或数组
   - 优先使用组合而非继承，避免在 UI 层使用 Class；通过函数组合与管道化组织业务逻辑
   - 数据处理优先使用 `map`/`filter`/`reduce` 等声明式风格，避免命令式循环导致可读性下降
   - 引用透明：函数输出仅依赖输入；避免使用隐藏的全局状态
   - 在 React 中通过 `useMemo`/`useCallback` 保持稳定引用，减少不必要重渲染
   - 异步与副作用集中在 hooks 与 thunk 中管理，确保可测试与可控

3. **Hooks 封装与复用规范**:
   - 命名：自定义 hooks 必须以 `use` 开头，存放于 `hooks/` 或模块内 `hooks` 目录
   - 职责：单一职责；UI 与逻辑分离，hooks 不返回 JSX
   - 输入输出：参数与返回值必须完整类型定义，建议返回对象以提升可扩展性；必要时返回 tuple 并在注释中说明顺序与语义
   - 依赖：依赖数组必须完整、稳定；避免闭包陷阱，必要时使用 `ref` 保存跨渲染的可变值
   - 副作用：在 hooks 内集中处理副作用，确保可控与可测试；在清理函数中释放资源
   - 复用：将跨模块的通用逻辑抽象为 hooks（如请求、节流/防抖、表单、分页、权限、主题、路由参数解析等）
   - 测试：hooks 应具备可测试性（React Testing Library），避免与外部环境强耦合（如全局定时器、直接 DOM 操作）
   - 文档：每个 hooks 必须包含 JSDoc 注释（用途、参数、返回值、示例）

   示例：
   ```typescript
   /**
    * useFetchUser - 获取并管理用户数据的通用 hooks
    *
    * @param userId 用户 ID（string）
    * @returns 对象：{ data: User | null, loading: boolean, error: string | null, refetch: () => Promise<void> }
    *
    * 用途：在任意组件中复用用户数据获取逻辑，保持副作用集中、类型安全与注释完备
    */
   export function useFetchUser(userId: string): {
     data: User | null;
     loading: boolean;
     error: string | null;
     refetch: () => Promise<void>;
   } {
     // 内部实现省略，仅示例注释与类型定义
     // ...
   }
   ```

4. **类型严格性与类型定义**:
   - 全项目开启 TypeScript 严格模式（`tsconfig`: `strict: true`）
   - 禁止使用 `any`；边界输入采用 `unknown` 并使用类型守卫/模式匹配收窄
   - 公共类型集中于 `types/`；模块内类型就近维护并通过 `index.ts` 导出必要类型
   - 优先使用类型别名（`type`）搭配联合/交叉与字面量类型；在需要扩展时使用 `interface`
   - API DTO 与前端视图模型区分，避免直接耦合后端返回结构
   - 使用泛型提升复用性（如数据列表、分页、响应包装）

5. **注释与文档规范（强制）**:
   - 所有函数、组件、hooks 必须使用 JSDoc/TSDoc 注释，包含用途、参数与返回值类型说明
   - 组件 props 接口必须注释每个字段含义、单位/取值范围与可选性
   - 对含副作用的函数需标注副作用来源与清理方式
   - 公共工具函数需提供使用示例

   JSDoc 示例：
   ```typescript
   /**
    * formatPrice - 将分单位价格格式化为带货币符号的字符串
    *
    * @param amount 分单位的价格，必须为非负整数
    * @param currency 货币符号（默认：'¥'）
    * @returns 格式化后的价格字符串，如 "¥1,234.56"
    */
   export function formatPrice(amount: number, currency: string = '¥'): string {
     // ...
   }
   ```

6. **性能优化**:
   - 核心目标：在不添乱的前提下，帮助 React 更快、更高效地完成遍历渲染，使更新链路尽可能短。
   - 一、控制组件重渲染的波及范围：只让该更新的更新
     - 灵活运用 `React.memo` 跳过重渲染；对纯渲染组件配合 props 浅比较避免子树递归渲染
     - React 默认行为：父组件更新会递归遍历所有子组件，生成新的虚拟 DOM 并 Diff；即便最终提交的真实 DOM 不多，组件调用和 Diff 也有成本，层级高或逻辑复杂时尤甚
   - 二、避免组件入参的不必要变更：稳定对象/函数引用
     - 需要生成数组、对象时使用 `useMemo` 缓存，避免在 JSX 中直接字面量创建新引用
     - 向子组件传递回调时使用 `useCallback` 缓存，避免 JSX 内联函数导致每次渲染创建新函数
     - 使用 Context 时，`<Provider value={...}>` 的 `value` 若为对象，需用 `useMemo` 包裹，否则依赖该上下文的子组件将随着上层重渲染而全部更新，即便已被 `memo` 包裹
   - 三、避免频繁、重复、无意义的 `setState`
     - 与页面展示/更新无关的数据不维护在 State 中；例如计数器等可用 `useRef` 存储以避免触发渲染
     - 合并状态更新，减少 `setState` 次数；例如多个请求完成后统一合并设置到一个 State，避免中间多次无意义重渲染
   - 通用策略：
     - 合理使用 `React.memo`、`useMemo`、`useCallback` 保持引用稳定
     - 列表渲染使用稳定 `key`；大数据列表采用虚拟滚动
     - 资源懒加载与按需加载；拆分 bundle，优化首屏

7. **可测试性**:
   - 业务逻辑与 UI 分离；hooks 与 Service 层可独立测试
   - 核心功能测试覆盖率 > 80%，包含边界与错误路径

8. **可维护性**:
   - 遵循单一职责原则，模块化与组合优先
   - 代码复用（hooks、通用组件、泛型工具）
   - 避免硬编码，使用配置或常量

本规范在保持清晰架构的同时，引入函数式编程与 hooks 复用的统一标准，确保类型安全与注释完备，提升项目的可读性、可测试性与可维护性。
