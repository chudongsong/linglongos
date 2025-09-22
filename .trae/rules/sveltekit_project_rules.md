# SvelteKit 项目开发规范

适用范围
- 适用于 Monorepo 下的 SvelteKit 应用（当前：apps/web）。

技术栈概述
- 核心框架：Svelte 5 + SvelteKit 2（基于 Vite 7）
- 语言与类型：TypeScript 5
- 构建与开发：Vite（开发用 `vite dev`，不使用 `svelte-kit dev`）
- 运行环境：Node.js（@sveltejs/adapter-node，产物位于 build）
- 质量保障：ESLint 9（Flat Config）+ Prettier 3 + svelte-check
- 测试：Vitest 3（可选，推荐配合 @vitest/coverage-v8 与 @testing-library/svelte）

版本与依赖建议
- @sveltejs/kit：^2.x
- svelte：^5.x
- vite：^7.x
- typescript：^5.x
- svelte-check：^4.x
- @sveltejs/adapter-node：^5.x
- eslint：^9.x
- vitest：^3.x（可选）

脚本约定（与 Turbo pipeline 对齐）
- dev：vite dev
- build：vite build
- preview：vite preview
- start：node build（适配器构建后的 Node 服务）
- type-check：svelte-check --tsconfig ./tsconfig.json
- lint：eslint . --ext .ts,.js
- test：vitest run（可选）
说明：脚本需在 apps/web/package.json 中维护，并与根 turbo.json 任务名称一致（dev/build/lint/test/type-check）。

TypeScript 与别名
- tsconfig：extends "./.svelte-kit/tsconfig.json"；compilerOptions：noEmit=true，types 包含 "svelte" 与 "vite/client"。
- 禁止在 tsconfig 中使用 baseUrl/paths（会与 SvelteKit 生成配置冲突），统一通过 kit.alias 管理别名。
- 推荐别名：$lib → src/lib、$components → src/components、$routes → src/routes。

SvelteKit 配置
- 适配器：@sveltejs/adapter-node；产物目录：build。
- 使用 kit.alias 管理路径别名，避免在 tsconfig/vite.config 中重复设置。
- 示例：
```ts
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter({ out: 'build' }),
    alias: {
      $lib: 'src/lib',
      $components: 'src/components',
      $routes: 'src/routes'
    }
  }
};

export default config;
```

Vite 配置
- 通过 SvelteKit 集成 @sveltejs/kit/vite 插件，无需重复配置别名。
- 开发服务器默认 host 0.0.0.0、port 5173（可按需在 package.json 脚本参数调整）。
- 按需配置 optimizeDeps、server.proxy、build.rollupOptions 等，不与 SvelteKit 路由与别名冲突。

项目结构（SvelteKit 约定式路由）
项目结构示例

```
src/
├── app.html                # 自定义 HTML 模板（包含 %sveltekit.head% 与 %sveltekit.body%）
├── lib/                    # 领域无关的可复用模块（工具、stores、服务客户端等）
│   ├── services/           # API 客户端与服务封装
│   ├── stores/             # 全局/模块化 Svelte stores
│   └── utils/              # 通用工具函数
├── components/             # 通用 UI 组件（与路由解耦合）
├── routes/                 # 约定式路由
│   ├── +layout.svelte      # 应用布局
│   ├── +layout.ts          # 布局级 load（仅在客户端或同构执行）
│   ├── +layout.server.ts   # 布局级服务端 load（仅服务端）
│   ├── +page.svelte        # 页面视图
│   ├── +page.ts            # 页面级 load（同构）
│   ├── +page.server.ts     # 页面级服务端 load（仅服务端）
│   ├── +server.ts          # 同路径 API 端点（REST）
│   └── +error.svelte       # 错误页面
├── styles/                 # 全局样式与样式变量
└── hooks.server.ts         # 全局服务端 Hook（鉴权/日志/本地化等）
```

数据获取与路由导航
- 数据获取：
  - 页面/布局使用 load 函数获取数据，遵循“能在服务器取就不在客户端取”的原则，优先使用 +*.server.ts。 
  - 服务端 load 可直接访问私有环境变量与凭证，避免将敏感信息暴露给客户端。 
- 导航与预取：
  - 使用来自 $app/navigation 的 goto 进行编程式导航。 
  - 使用 sveltekit:prefetch 或 use:enhance 进行预取与无刷新表单增强。 

表单与 Actions
- 在 +page.server.ts 中定义 export const actions 以声明表单处理逻辑（create/update/delete 等）。 
- 结合 use:enhance 提升用户体验，避免整页刷新，并在 Action 返回的 form 状态中提供错误与校验信息。 

环境变量与配置
- 使用 $env/static/public 读取以 PUBLIC_ 开头的公开环境变量（编译期替换）。 
- 使用 $env/static/private 读取仅服务器可用的私有变量（编译期替换）。 
- 如需在运行时动态解析，使用 $env/dynamic/private（仅服务端）/$env/dynamic/public（客户端可见，值来自 import.meta.env）。 

服务端 Hooks 与鉴权
- 在 hooks.server.ts 的 handle 中集中处理：
  - 用户鉴权/会话解析（例如从 Cookie 提取会话并附着到 event.locals） 
  - 国际化/时区/租户信息注入 
  - 统一错误与日志追踪（可对接 OpenTelemetry 等） 
- 在受保护的路由的 load 或 +server.ts 中检查权限，不满足时执行 redirect 或抛出 error。 

错误处理与重定向
- 抛出错误：从 '@sveltejs/kit' 导入 error 并抛出 `throw error(404, 'Not Found')`。 
- 重定向：从 '@sveltejs/kit' 导入 redirect 并执行 `throw redirect(302, '/login')`。 
- 自定义错误 UI：在 +error.svelte 中渲染 message 与 status，并给出返回入口。 

代码组织与约束
- 导入顺序：外部依赖 → 内部共享模块（$lib）→ 同模块内组件/类型 → 样式
- 模块通过 index.ts 导出公共 API；隐藏内部实现
- 单文件不宜过长（>300 行建议拆分），函数保持单一职责

导出规范
- 模块通过 index.ts 导出公共 API，集中出口便于维护与树摇
- 组件默认导出（default export），工具函数/常量使用命名导出（named export）
- 隐藏内部实现细节，不导出私有成员或仅用于测试的内容
- 避免跨模块深度依赖，保持模块边界清晰

状态管理原则
- 优先使用 Svelte stores（writable/derived/readable）管理共享状态
- 将 UI 局部状态保留在组件内部（let/props）
- 避免冗余状态与深层嵌套；通过派生 store 合成需要的视图数据

样式规范
- 推荐 Tailwind CSS 4 工具类；复杂条件样式配合 clsx/tw-merge（按需）
- 样式与组件就近；全局样式在 +layout.svelte 统一引入
- 注意 v4 与 v3 的不兼容改动，升级需同步调整

质量与最佳实践
- TypeScript 严格模式，避免 any；必要时以 unknown/object 替代
- load/请求错误处理与边界：提供 +error.svelte 与合适的重定向
- SSR/CSR 区分：仅浏览器可用 API 需在 onMount 或 `if (browser)` 分支中使用
- 引入第三方库时注意体积与 SSR 兼容性

测试（可选但推荐）
- 单元测试：Vitest；覆盖率：@vitest/coverage-v8
- 组件测试：@testing-library/svelte（如需）
- 目录与命名：*.test.ts / *.spec.ts，位于组件旁或 tests 目录
- 关键功能覆盖率目标：≥80%

依赖升级流程
- 全仓库升级：pnpm -r up --latest
- 升级后验证：
  - dev 可启动、页面可访问
  - svelte-check 通过
  - lint/test 通过
- 常见修复：若 svelte-check 缺少 '@opentelemetry/api'，安装 dev 依赖修复

构建与运行（生产）
- 构建：pnpm --filter @linglongos/web build
- 产物：build（Node 可执行产物）
- 运行：pnpm --filter @linglongos/web start（等价 `node build`）

常见问题与提示
- 不使用 `svelte-kit dev`，请使用 `vite dev`
- tsconfig 不要配置 baseUrl/paths，统一使用 kit.alias
- SSR 环境下避免访问浏览器专有 API；仅在 onMount 或 browser 分支使用
- Tailwind v4 需按官方指引迁移配置

PR 校验建议
- 至少执行：lint、type-check、build（如有测试则包含 test/coverage）
- 本地预览确认页面正常（http://localhost:5173/）