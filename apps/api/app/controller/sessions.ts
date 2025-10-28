import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * SessionsController - RESTful 认证会话管理
 *
 * 符合 Egg.js RESTful 标准的认证会话控制器：
 * - `new`：获取绑定信息（生成二维码 URL 与 base32 密钥）
 * - `create`：创建会话（确认绑定或验证令牌）
 */
export default class SessionsController extends Controller {
  /**
   * 获取绑定信息（二维码 URL 与 base32 密钥）
   * GET /api/v2/sessions/new
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回绑定信息
   */
  async new(ctx: Context) {
    try {
      const data = await ctx.service.auth.generateBindInfo();
      ctx.success(data);
    } catch (error) {
      ctx.logger.error('生成绑定信息失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('生成绑定信息失败', errorMessage);
    }
  }

  /**
   * 创建会话（确认绑定或验证令牌）
   * POST /api/v2/sessions
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 创建会话并设置 Cookie
   */
  async create(ctx: Context) {
    // 定义验证规则
    const createRule = {
      secret: { type: 'string', required: false },
      token: 'string',
    };

    try {
      // 验证请求参数
      (ctx as any).validate(createRule, ctx.request.body);

      const { secret, token } = ctx.request.body as { secret?: string; token: string };

      let result;
      if (secret) {
        // 确认绑定流程
        result = await ctx.service.auth.confirmBind(secret, token);
      } else {
        // 验证令牌流程
        result = await ctx.service.auth.verifyTokenAndCreateSession(token);
      }

      if (!result || !result.sessionId) {
        ctx.unauthorized('Invalid token or authentication failed');
        return;
      }

      // 设置会话 Cookie
      const maxAge = 4 * 60 * 60 * 1000; // 4小时
      ctx.cookies.set('ll_session', result.sessionId, {
        maxAge,
        httpOnly: true,
        signed: true,
      });

      ctx.success({ session_id: result.sessionId }, 'Session created successfully', 201);
    } catch (error: any) {
      if (error.code === 'invalid_param') {
        ctx.validationError('Validation Failed', JSON.stringify(error.errors));
      } else {
        ctx.logger.error('创建会话失败:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.internalError('创建会话失败', errorMessage);
      }
    }
  }

  /**
   * 获取会话列表（暂不实现）
   * GET /api/v2/sessions
   */
  async index(ctx: Context) {
    ctx.notImplemented('会话列表功能暂未实现');
  }

  /**
   * 获取单个会话（暂不实现）
   * GET /api/v2/sessions/:id
   */
  async show(ctx: Context) {
    ctx.notImplemented('获取单个会话功能暂未实现');
  }

  /**
   * 更新会话（暂不实现）
   * PUT /api/v2/sessions/:id
   */
  async update(ctx: Context) {
    ctx.notImplemented('更新会话功能暂未实现');
  }

  /**
   * 删除会话（登出）
   * DELETE /api/v2/sessions/:id
   */
  async destroy(ctx: Context) {
    try {
      const sessionId = ctx.params?.id || ctx.cookies.get('ll_session');

      if (sessionId) {
        // 清除服务端会话
        ctx.service.storage.removeSession(sessionId);
        // 清除客户端 Cookie
        ctx.cookies.set('ll_session', null);
      }

      ctx.success(null, 'Session deleted successfully', 204);
    } catch (error) {
      ctx.logger.error('删除会话失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('删除会话失败', errorMessage);
    }
  }

  /**
   * 获取编辑表单（暂不实现）
   * GET /api/v2/sessions/:id/edit
   */
  async edit(ctx: Context) {
    ctx.notImplemented('获取编辑表单功能暂未实现');
  }
}