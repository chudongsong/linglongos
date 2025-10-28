import type { Application } from 'egg';

/**
 * RESTful 路由定义
 *
 * 说明：使用 RESTful 风格的路由设计，符合 Egg.js 标准；
 * 中间件绑定在 `config.default.ts` 中通过 `config.middleware` 管理：`common`, `auth`, `bt`。
 *
 * RESTful 资源路由：
 * - `sessions` → 认证会话管理
 *   - `GET /api/v2/sessions/new` → 获取绑定信息（原 google-auth-bind）
 *   - `POST /api/v2/sessions` → 创建会话（原 google-auth-confirm/verify）
 * - `system` → 系统状态管理
 *   - `GET /api/v2/system` → 获取系统状态（原 init/status）
 * - `panels` → 面板配置管理
 *   - `POST /api/v2/panels` → 创建/更新面板配置（原 bind-panel-key）
 * - `proxy` → 代理请求处理
 *   - `POST /api/v2/proxy` → 处理代理请求（原 proxy/request）
 *
 * 兼容性路由（保持向后兼容）：
 * - `GET /ui` → `controller.ui.index`
 * - `GET /api/v1/docs/openapi.json` → 文档导出
 *
 * @param {Application} app - Egg 应用实例
 * @returns {void}
 */
export default (app: Application) => {
  const { controller, router } = app;

  // RESTful 风格路由 - 使用传统路由方式实现

  // 会话管理 (认证相关) - /api/v2/sessions
  router.get('/api/v2/sessions', controller.sessions.index);           // 获取会话列表
  router.get('/api/v2/sessions/new', controller.sessions.new);         // 获取绑定信息
  router.get('/api/v2/sessions/:id', controller.sessions.show);        // 获取特定会话
  router.post('/api/v2/sessions', controller.sessions.create);         // 创建会话(确认绑定/验证)
  router.put('/api/v2/sessions/:id', controller.sessions.update);      // 更新会话
  router.delete('/api/v2/sessions/:id', controller.sessions.destroy);  // 删除会话(登出)
  router.get('/api/v2/sessions/:id/edit', controller.sessions.edit);   // 获取编辑表单

  // 系统状态 - /api/v2/system
  router.get('/api/v2/system', controller.system.index);               // 获取系统状态
  router.get('/api/v2/system/new', controller.system.new);             // 获取新建表单
  router.get('/api/v2/system/:id', controller.system.show);            // 获取特定系统信息
  router.post('/api/v2/system', controller.system.create);             // 创建系统配置
  router.put('/api/v2/system/:id', controller.system.update);          // 更新系统配置
  router.delete('/api/v2/system/:id', controller.system.destroy);      // 删除系统配置
  router.get('/api/v2/system/:id/edit', controller.system.edit);       // 获取编辑表单

  // 面板配置 - /api/v2/panels
  router.get('/api/v2/panels', controller.panels.index);               // 获取面板列表
  router.get('/api/v2/panels/new', controller.panels.new);             // 获取新建表单
  router.get('/api/v2/panels/:id', controller.panels.show);            // 获取特定面板
  router.post('/api/v2/panels', controller.panels.create);             // 创建面板
  router.put('/api/v2/panels/:id', controller.panels.update);          // 更新面板
  router.delete('/api/v2/panels/:id', controller.panels.destroy);      // 删除面板
  router.get('/api/v2/panels/:id/edit', controller.panels.edit);       // 获取编辑表单

  // 代理请求 - /api/v2/proxy
  router.get('/api/v2/proxy', controller.proxy.index);                 // 获取代理列表
  router.get('/api/v2/proxy/new', controller.proxy.new);               // 获取新建表单
  router.get('/api/v2/proxy/:id', controller.proxy.show);              // 获取特定代理
  router.post('/api/v2/proxy', controller.proxy.create);               // 创建代理请求
  router.put('/api/v2/proxy/:id', controller.proxy.update);            // 更新代理
  router.delete('/api/v2/proxy/:id', controller.proxy.destroy);        // 删除代理
  router.get('/api/v2/proxy/:id/edit', controller.proxy.edit);         // 获取编辑表单

  // 向后兼容的 v1 API 路由
  router.get('/api/v1/init/status', controller.init.checkStatus);
  router.get('/api/v1/auth/google-auth-bind', controller.auth.googleAuthBind);
  router.post('/api/v1/auth/google-auth-confirm', controller.auth.googleAuthConfirm);
  router.post('/api/v1/auth/google-auth-verify', controller.auth.googleAuthVerify);
  router.post('/api/v1/proxy/bind-panel-key', controller.proxy.bindPanelKey);
  router.all('/api/v1/proxy/request', controller.proxy.request);

  // 其他路由
  router.get('/ui', controller.ui.index);
  router.get('/api/v1/docs/openapi.json', controller.docs.openapi);
};
