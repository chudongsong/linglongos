# LinglongOS API 项目文档中心

欢迎来到 LinglongOS API 项目文档中心！这里是您了解、开发和使用 LinglongOS API 的完整指南。

## 🚀 项目简介

LinglongOS API 是一个基于 Egg.js 和 Tegg 框架构建的统一面板代理与认证服务，为 LinglongOS 系统提供安全、高效的 API 网关服务。

**核心特性：**
- 🔐 **统一认证管理**：基于 TOTP 的双因素认证机制
- 🔄 **面板代理服务**：智能代理转发和集中配置管理
- 📊 **RESTful API 设计**：标准化的 API 接口规范
- 🛡️ **高可用性**：完善的错误处理和日志记录
- ⚡ **易扩展性**：模块化架构设计

## 📚 文档导航

### 🎯 快速开始
- [项目概述](project-overview.md) - 了解项目背景、技术栈和业务目标
- [项目结构](project-structure.md) - 详细的项目目录结构和代码组织
- [开发环境配置](development-environment.md) - 本地开发环境搭建指南

### 🔧 开发指南
- [API 开发规范](api-development-spec.md) - RESTful API 设计原则和最佳实践
- [开发工作流程](development-workflow.md) - Git Flow、代码审查、CI/CD 流程
- [代码规范指南](coding-standards.md) - TypeScript、代码风格、命名规范
- [测试指南](testing-guide.md) - 单元测试、集成测试、测试策略

### 📖 API 文档
- [API 接口文档](api/) - 完整的 API 接口说明和示例
- [认证接口](api/auth.md) - 用户认证、2FA 相关接口
- [面板管理](api/panel.md) - 面板配置和管理接口
- [代理转发](api/proxy.md) - 代理请求转发接口

### 🚀 部署运维
- [部署指南](deployment-guide.md) - 生产环境部署步骤
- [Docker 部署](docker-deployment.md) - 容器化部署方案
- [环境配置](environment-setup.md) - 不同环境的配置管理
- [监控告警](monitoring.md) - 系统监控和告警配置
- [备份恢复](backup-restore.md) - 数据备份和灾难恢复

### 🔍 运维支持
- [故障排查指南](troubleshooting.md) - 常见问题解决方案
- [性能优化](performance-optimization.md) - 性能调优最佳实践
- [安全指南](security-guide.md) - 安全最佳实践和配置
- [日志分析](log-analysis.md) - 日志查看和分析方法

## 🗂️ 文档结构

```
docs/
├── README.md                    # 本文档 - 项目文档中心
├── project-overview.md         # 项目概述和技术栈
├── project-structure.md        # 项目结构和代码组织
├── api-development-spec.md     # API开发规范
├── development-workflow.md     # 开发工作流程
├── development-environment.md  # 开发环境配置
├── coding-standards.md         # 代码规范指南
├── testing-guide.md            # 测试指南
├── deployment-guide.md         # 部署指南
├── docker-deployment.md        # Docker部署方案
├── environment-setup.md        # 环境配置管理
├── monitoring.md               # 监控告警配置
├── troubleshooting.md          # 故障排查指南
├── performance-optimization.md # 性能优化指南
├── security-guide.md           # 安全最佳实践
├── backup-restore.md           # 备份恢复方案
├── log-analysis.md             # 日志分析方法
├── api/                        # API接口文档
│   ├── auth.md                # 认证接口文档
│   ├── panel.md               # 面板管理接口
│   ├── config.md              # 配置管理接口
│   └── proxy.md               # 代理转发接口
├── deployment/                 # 部署相关文档
├── development/               # 开发过程文档
└── examples/                  # 使用示例和代码片段
```

## 🛠️ 技术栈

### 后端技术栈
- **框架**: Egg.js 4.0.0 + Tegg 3.5.2
- **语言**: TypeScript 5.2+
- **数据库**: SQLite 3.x (better-sqlite3)
- **认证**: speakeasy 2.0.0 (TOTP 2FA)
- **HTTP**: axios 1.7.7
- **验证**: egg-validate 2.0.2
- **跨域**: egg-cors 3.0.1

### 开发工具
- **构建**: TypeScript 编译器
- **测试**: Mocha + egg-bin + egg-mock
- **规范**: ESLint (eslint-config-egg)
- **文档**: OpenAPI 3.0 自动生成
- **包管理**: pnpm

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- pnpm 包管理器
- Git 版本控制

### 安装和启动
```bash
# 安装依赖
pnpm -C apps/api install

# 启动开发服务器
pnpm -C apps/api dev

# 运行测试
pnpm -C apps/api test

# 构建项目
pnpm -C apps/api tsc

# 启动生产服务
pnpm -C apps/api start
```

### 访问文档
- **API文档**: http://localhost:7001/api/v1/docs/openapi.json
- **开发文档**: 查看本目录下的文档文件
- **示例代码**: 查看 `examples/` 目录

## 📋 开发检查清单

### 开始开发前
- [ ] 阅读 [项目概述](project-overview.md)
- [ ] 配置 [开发环境](development-environment.md)
- [ ] 了解 [项目结构](project-structure.md)
- [ ] 熟悉 [API规范](api-development-spec.md)

### 开发过程中
- [ ] 遵循 [代码规范](coding-standards.md)
- [ ] 使用 [开发工作流程](development-workflow.md)
- [ ] 编写 [测试用例](testing-guide.md)
- [ ] 查看 [API文档](api/)

### 部署前
- [ ] 阅读 [部署指南](deployment-guide.md)
- [ ] 配置 [生产环境](environment-setup.md)
- [ ] 设置 [监控告警](monitoring.md)
- [ ] 了解 [故障排查](troubleshooting.md)

## 🤝 贡献指南

### 文档贡献
1. 新增文档请放在对应的分类目录下
2. 文档命名使用小写字母和连字符
3. 重要的技术决策记录在 `development/` 目录
4. 保持文档的时效性和准确性

### 代码贡献
1. 遵循 [开发工作流程](development-workflow.md)
2. 编写完整的测试用例
3. 更新相关文档
4. 通过代码审查

## 📞 获取帮助

### 文档支持
- 📖 首先查阅相关文档
- 🔍 使用搜索功能查找关键词
- 📋 查看 [故障排查指南](troubleshooting.md)

### 技术支持
- 💬 创建 Issue 报告问题
- 📧 联系项目维护者
- 🎯 查看开发社区讨论

## 🔄 文档更新

本文档会随项目发展持续更新，建议定期查看最新版本。

**最近更新**: 2024年10月
**文档版本**: v1.0.0
**维护团队**: LinglongOS API 开发团队

---

*如果您发现文档有任何问题或需要改进，欢迎提交 Issue 或 Pull Request！*