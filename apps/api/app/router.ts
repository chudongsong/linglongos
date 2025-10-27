import type { Application } from 'egg';

/**
 * 路由定义
 *
 * 说明：绑定控制器方法到具体路径；
 * 中间件绑定在 `config.default.ts` 中通过 `config.middleware` 管理：`common`, `auth`, `bt`。
 *
 * 路由列表：
 * - `GET /api/v1/init/status` → `controller.init.checkStatus`
 * - `GET /api/v1/auth/google-auth-bind` → `controller.auth.googleAuthBind`
 * - `POST /api/v1/auth/google-auth-confirm` → `controller.auth.googleAuthConfirm`
 * - `POST /api/v1/auth/google-auth-verify` → `controller.auth.googleAuthVerify`
 * - `POST /api/v1/proxy/bind-panel-key` → `controller.proxy.bindPanelKey`
 * - `ALL /api/v1/proxy/request` → `controller.proxy.request`
 * - `GET /ui` → `controller.ui.index`（重定向到 `/public/index.html`）
 *
 * @param {Application} app - Egg 应用实例
 * @returns {void}
 */
export default (app: Application) => {
  const { router, controller } = app;

  router.get('/api/v1/init/status', controller.init.checkStatus);
  router.get('/api/v1/auth/google-auth-bind', controller.auth.googleAuthBind);
  router.post('/api/v1/auth/google-auth-confirm', controller.auth.googleAuthConfirm);
  router.post('/api/v1/auth/google-auth-verify', controller.auth.googleAuthVerify);

  router.post('/api/v1/proxy/bind-panel-key', controller.proxy.bindPanelKey);
  router.all('/api/v1/proxy/request', controller.proxy.request);

  router.get('/ui', controller.ui.index);
  // OpenAPI 文档导出
  router.get('/api/v1/docs/openapi.json', (controller as any).docs.openapi);
};
