import { Controller } from 'egg';
import type { Context } from 'egg';

/**
 * SystemController - RESTful 系统状态管理
 *
 * 符合 Egg.js RESTful 标准的系统状态控制器：
 * - `index`：获取系统初始化状态
 */
export default class SystemController extends Controller {
  /**
   * 获取系统初始化状态
   * GET /api/v2/system
   *
   * @param {Context} ctx - Egg 请求上下文
   * @returns {Promise<void>} - 返回系统状态信息
   */
  async index(ctx: Context) {
    try {
      // 使用存储服务检查状态
      const storage = ctx.service.storage;

      // 检查 2FA 绑定状态
      const twoFASecret = storage.getTwoFASecret();
      const hasTwoFA = !!twoFASecret;

      // 检查面板绑定状态
      const panelConfig = storage.getPanel();
      const hasPanel = !!(panelConfig?.url && panelConfig?.key);

      // 检查会话状态（如果有 session cookie）
      const sessionId = ctx.cookies.get('ll_session');
      let hasValidSession = false;

      if (sessionId) {
        hasValidSession = storage.isValidSession(sessionId);
      }

      const systemStatus = {
        id: 'system',
        hasTwoFA,
        hasPanel,
        hasValidSession,
        needsInitialization: !hasTwoFA || !hasPanel,
        timestamp: new Date().toISOString(),
      };

      ctx.success(systemStatus);
    } catch (error: any) {
      ctx.logger.error('检查系统状态失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('检查系统状态失败', errorMessage);
    }
  }

  /**
   * 获取单个系统配置项（暂不实现）
   * GET /api/v2/system/:id
   */
  async show(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取单个系统配置项功能暂未实现');
  }

  /**
   * 创建系统配置（暂不实现）
   * POST /api/v2/system
   */
  async create(ctx: Context) {
    ctx.notImplemented('Not Implemented', '创建系统配置功能暂未实现');
  }

  /**
   * 更新系统配置（暂不实现）
   * PUT /api/v2/system/:id
   */
  async update(ctx: Context) {
    ctx.notImplemented('Not Implemented', '更新系统配置功能暂未实现');
  }

  /**
   * 删除系统配置（暂不实现）
   * DELETE /api/v2/system/:id
   */
  async destroy(ctx: Context) {
    ctx.notImplemented('Not Implemented', '删除系统配置功能暂未实现');
  }

  /**
   * 获取新建表单（暂不实现）
   * GET /api/v2/system/new
   */
  async new(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取新建表单功能暂未实现');
  }

  /**
   * 获取编辑表单（暂不实现）
   * GET /api/v2/system/:id/edit
   */
  async edit(ctx: Context) {
    ctx.notImplemented('Not Implemented', '获取编辑表单功能暂未实现');
  }
}