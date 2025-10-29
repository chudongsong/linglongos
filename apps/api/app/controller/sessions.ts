import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * SessionsController - RESTful 认证会话管理
 *
 * 符合 Egg.js RESTful 标准的认证会话控制器：
 * - `new`：获取绑定信息（生成二维码 URL 与 base32 密钥）
 * - `create`：创建会话（确认绑定或验证令牌）
 * @controller Sessions
 */
export default class SessionsController extends Controller {
  /**
   * 获取绑定信息
   * 生成 TOTP 二维码 URL 与 base32 密钥
   * @summary 获取TOTP绑定信息
   * @description 生成用于双因子认证的TOTP二维码URL和base32密钥
   * @router get /api/v2/generate_bind_info
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
   * 创建会话
   * 确认绑定或验证令牌
   * @summary 创建认证会话
   * @description 通过TOTP令牌验证创建用户认证会话
   * @router post /api/v2/create_session
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
   * POST /api/v1/sessions/update_session
   */
  async update(ctx: Context) {
    ctx.notImplemented('更新会话功能暂未实现');
  }

  /**
   * 删除会话（登出）
   * POST /api/v1/sessions/delete_session
   */
  async destroy(ctx: Context) {
    try {
      // 从请求体或Cookie中获取sessionId
      const { id: sessionIdFromBody } = ctx.request.body as { id?: string };
      const sessionId = sessionIdFromBody || ctx.cookies.get('ll_session');

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