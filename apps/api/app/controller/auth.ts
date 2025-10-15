import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * AuthController
 *
 * 负责 2FA（基于 TOTP）的绑定与验证流程：
 * - `googleAuthBind`：生成绑定用二维码 URL 与 base32 密钥，并持久化密钥；
 * - `googleAuthVerify`：校验一次性口令，成功后创建会话并写入签名 Cookie。
 */
export default class AuthController extends Controller {
  /**
   * 生成绑定信息（二维码 URL 与 base32 密钥）。
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 设置 `ctx.body` 为 `{ code, message, data: { qrCodeUrl, secret } }`
   */
  async googleAuthBind(ctx: Context) {
    const data = await ctx.service.auth.generateBindInfo();
    ctx.body = { code: 200, message: 'success', data };
  }

  /**
   * 验证 2FA 令牌并创建会话。
   *
   * @param {Context} ctx - Egg 请求上下文，`ctx.request.body.token` 为一次性口令
   * @returns {Promise<void>} - 根据校验结果设置响应与签名 Cookie（成功 200，失败 401）
   */
  async googleAuthVerify(ctx: Context) {
    const token = ctx.request.body?.token as string;
    const result = await ctx.service.auth.verifyTokenAndCreateSession(token);
    if (!result || !result.sessionId) {
      ctx.status = 401;
      ctx.body = { code: 401, message: 'Invalid token or session expired.' };
      return;
    }
    const maxAge = 4 * 60 * 60 * 1000;
    ctx.cookies.set('ll_session', result.sessionId!, {
      maxAge,
      httpOnly: true,
      signed: true,
    });
    ctx.body = { code: 200, message: 'Authentication successful, session created.' };
  }
}