# 玲珑OS (LingLong OS)

## 项目简介
玲珑OS是一个基于 Monorepo 的现代化 Web 操作环境，通过统一界面整合多种后端面板与服务，提升多服务器与多面板的运维效率与一致性。

## 目录
- [项目简介](#项目简介)
- [项目介绍](#项目介绍)
- [核心特色](#核心特色)
- [架构设计优点](#架构设计优点)
- [项目计划表](#项目计划表)
- [工作区结构](#工作区结构)
- [技术栈与版本要求](#技术栈与版本要求)
- [安装与启动](#安装与启动)
- [构建与预览](#构建与预览)
- [测试与代码质量](#测试与代码质量)
- [API 文档与路由](#api-文档与路由)
- [常用根脚本](#常用根脚本)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 项目介绍
- 背景：传统服务器面板（或多面板并存）在不同服务器、不同版本之间的操作体验差异较大，导致运维流程分散、成本高、难以统一管理与审计。玲珑OS以统一的 Web 操作环境为核心，通过聚合与适配多个面板与服务，提供一致的交互与流程，提高效率与可维护性。
- 目标：在不替代现有面板的前提下，提供一个现代、统一、可扩展的“外壳”，让运维人员与开发者在单一工作空间内完成跨面板、跨服务器的日常操作。
- 应用场景：多台服务器、多种面板混合场景下的统一管理；团队内规范化运维操作与审计；个人/小团队的轻量化集中管理；面向外部客户的标准化操作门户。
- 定位与价值：作为“前端统一操作层”，以最小侵入的方式整合既有面板与服务；价值主张为“统一界面、标准流程、可扩展生态、提高效率与一致性”。

## 核心特色
- 统一工作空间：跨面板的统一界面与操作流程，减少上下文切换，降低心智负担。
- 现代化技术栈：React 19 + Redux Toolkit + Vite 7 + Tailwind CSS 4，开发体验与性能兼顾。
- 可扩展代理层：API 服务以 Koa 3 + TypeScript 实现，可通过适配器与代理机制接入不同面板与服务，并内置 Swagger UI 文档。
- Monorepo 架构：pnpm + Turborepo 管理 apps 与 packages，统一规范、快速构建、稳定缓存。
- 文档与规范：统一 ESLint/Prettier/TypeScript 配置，配合 Vitest 进行单元与组件测试，保障质量。
- 与同类的差异化：强调“前端统一操作层”的定位，不替代现有面板；以代理与适配器连接后端生态，避免强耦合；在多面板场景下提供统一的 UI 与流程，降低学习与维护成本。

## 架构设计优点
- 主要组成：
  - 应用层：apps/desktop（桌面应用，React 19）、apps/api（API 服务，Koa 3 + TS）、apps/web（SvelteKit 实验性应用）。
  - 包与共享：packages/shared-types（类型共享）、packages/utils（工具库，tsup 构建、vitest 测试）。
  - 环境与规范：env/ 统一 ESLint/Prettier/TypeScript 配置；根级 Turbo、Workspace 管理任务与依赖。
- 可扩展性：模块化与适配器设计，API 通过代理机制接入不同面板类型；Monorepo 支持多应用并行演进与共享能力复用。
- 稳定性：统一规范与类型系统（TS 5.9），通过 ESLint/Prettier/Husky 保证一致性；Turbo 缓存与任务编排降低构建波动。
- 性能优势：Vite 7 快速开发与构建、按需模块；React 19 减少不必要渲染；Koa 中间件轻量高效；pnpm workspace 高效依赖管理。
- 技术选型理由：
  - React 19 + Redux Toolkit：成熟生态、类型友好、状态管理简单且可维护，适合复杂桌面级 UI。
  - Koa 3 + TypeScript：中间件模型简洁、易扩展，类型安全提升重构与协作效率。
  - Vite 7 + Turborepo + pnpm：提升开发与构建速度、共享缓存、跨项目一致的工作流。
  - Tailwind CSS 4：原子化样式与设计一致性，结合 tailwind-merge 简化条件样式。

## 项目计划表
- 当前进度（已完成里程碑与成果）：
  - Monorepo 工作区与统一规范（ESLint/Prettier/TS）建立，脚本与任务编排完善（Turbo、pnpm workspace）。
  - 桌面应用基础框架：React 19 + Redux Toolkit + Router + Tailwind 搭建；基础路由与状态管理上线；单元测试框架接入（Vitest + React Testing Library）。
  - API 服务：Koa 3 + TS 基础服务、CORS/静态资源、中间件与错误处理；Google Auth 绑定/验证流程；OpenAPI 文档生成与 Swagger UI 集成；代理请求与面板密钥绑定接口初版。
  - 工具库：tsup 构建与 vitest 测试流程完善，URL/验证等通用工具落地。
- 近期计划（未来 1-3 个月重点）：
  - 联通桌面应用与 API 代理能力：完善“面板绑定→代理请求→结果展示”的端到端流程与 UI。
  - 扩展代理能力：补齐 1Panel 等面板适配与策略；优化 SSL 相关容错与诊断信息。
  - 测试与质量：提高覆盖率至核心模块 ≥80%，补充集成测试与端到端用例；完善 CI 检查。
  - 文档与规范：补充开发规范与贡献指南细节；完善运维与部署说明。
- 待办事项（按优先级）
  - [高] 桌面应用-面板绑定与代理请求 UI 流完善（描述：实现绑定状态、错误提示与结果展示，打通端到端）
    - 负责人：Frontend Team
    - 预计完成时间：2025-10-15
    - 当前状态：in_progress
  - [高] API-代理服务支持 1Panel（描述：补齐面板类型、认证策略与路由文档）
    - 负责人：API Team
    - 预计完成时间：2025-10-31
    - 当前状态：pending
  - [中] 工具库-测试覆盖率至 85%（描述：补齐 URL/Validator 边界用例与异常分支）
    - 负责人：Library Maintainer
    - 预计完成时间：2025-10-10
    - 当前状态：in_progress
  - [中] 文档-补充桌面应用开发规范与最佳实践（描述：完善 README 与模块规范）
    - 负责人：Docs Maintainer
    - 预计完成时间：2025-10-05
    - 当前状态：pending
  - [低] Web 应用-初始 Landing 页面（描述：SvelteKit 基础页面与路由结构）
    - 负责人：Web Team
    - 预计完成时间：2025-11-15
    - 当前状态：pending
  - [低] CI 集成与检查（描述：加入覆盖率门槛与 lint、type-check 阶段门禁）
    - 负责人：Infra Maintainer
    - 预计完成时间：2025-10-20
    - 当前状态：pending

## 工作区结构
- apps/
  - desktop/：React 19 + Redux Toolkit + React Router + Tailwind CSS + Vite
  - api/：Node.js + Koa 3 + TypeScript（内置 Swagger UI 文档）
  - web/：SvelteKit + Vite（实验性应用）
- packages/
  - shared-types/：共享类型定义
  - utils/：通用工具库（tsup 构建、vitest 测试）
- env/：ESLint/Prettier/TypeScript 等统一配置
- pnpm-workspace.yaml：工作区配置
- turbo.json：构建与任务编排（Turbo）
- package.json：根脚本与依赖

## 技术栈与版本要求
- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0（项目使用 pnpm@8.12.1）
- Monorepo：pnpm + Turborepo
- 代码质量：ESLint + Prettier + Husky + lint-staged

## 安装与启动
1) 安装依赖
- pnpm install

2) 启动所有应用（并行）
- pnpm dev

3) 按应用启动（推荐在开发阶段分别启动）
- 桌面应用：pnpm --filter desktop dev
- API 服务：pnpm --filter @linglongos/api dev（默认端口：4000，可用环境变量 PORT 覆盖）
- Web 应用：pnpm --filter web dev

## 构建与预览
- 全量构建：pnpm build
- 单应用构建：
  - 桌面应用：pnpm --filter desktop build；预览：pnpm --filter desktop preview
  - Web 应用：pnpm --filter web build；预览：pnpm --filter web preview
  - API 服务：pnpm --filter @linglongos/api build；启动：pnpm --filter @linglongos/api start

## 测试与代码质量
- 统一运行：pnpm test / pnpm lint / pnpm type-check / pnpm format
- 桌面应用：Vitest + React Testing Library（支持 coverage）
- 工具库（packages/utils）：Vitest + @vitest/coverage-v8；构建使用 tsup
- API 服务：当前无测试占位（后续补充）

## API 文档与路由
- 运行 API 服务后访问 Swagger UI：
  - http://localhost:4000/docs
  - OpenAPI JSON：/api/v1/docs/openapi.json
- CORS 默认允许所有来源（origin: '*'），静态资源位于 public/

## 常用根脚本
- dev：turbo run dev（并行开发）
- build：turbo run build（并行构建并缓存）
- lint：turbo run lint
- test：turbo run test
- type-check：turbo run type-check
- format：prettier 统一格式化
- prepare：husky 安装钩子
- clean：清理 node_modules（bash scripts/clean-modules.sh）

## 贡献指南
1. Fork 仓库并创建特性分支（feature/your-feature）
2. 提交变更（使用规范化提交消息）
3. 发起 Pull Request 并补充说明

## 许可证
本项目采用 MIT 许可证。详见 LICENSE。
