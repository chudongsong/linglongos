import type { Context } from 'egg';

/**
 * 认证中间件：校验签名会话 Cookie `ll_session` 是否有效。
 *
 * 用途：拦截受保护的接口请求，确保来自已认证用户；
 * 逻辑：读取 `ll_session`，通过 `ctx.service.storage.isValidSession(sid)` 判断会话是否未过期。
 * 白名单：某些接口（如初始化状态检查、2FA绑定）允许未认证访问。
 *
 * @returns {(ctx: Context, next: () => Promise<any>) => Promise<void>} - 返回 Egg 中间件函数；会话无效时写入 401 响应
 */
export default function authMiddleware() {
  // 不需要认证的路径白名单
  const whitelist = [
    '/api/v1/init/status',           // 初始化状态检查
    '/api/v1/auth/google-auth-bind', // 2FA 绑定（生成二维码）
    '/api/v1/auth/google-auth-verify', // 2FA 验证（首次绑定或登录）
    '/swagger-doc',                  // Swagger JSON 文档
    '/swagger-ui.html',              // Swagger UI 页面
    '/swagger-ui-bundle.js',         // Swagger UI 资源文件
    '/swagger-ui-standalone-preset.js', // Swagger UI 资源文件
    '/swagger-ui.css',               // Swagger UI 样式文件
  ];

  return async (ctx: Context, next: () => Promise<any>) => {
    // 检查是否在白名单中
    if (whitelist.includes(ctx.path)) {
      await next();
      return;
    }

    const sid = ctx.cookies.get('ll_session', { signed: true });
    const ok = sid ? ctx.service.storage.isValidSession(sid) : false;
    if (!ok) {
      ctx.unauthorized('AUTH_REQUIRED');
      return;
    }
    await next();
  };
}
