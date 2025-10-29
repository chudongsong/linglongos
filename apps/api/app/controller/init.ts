import { Controller } from 'egg';

/**
 * 初始化状态控制器
 *
 * 负责检查系统初始化状态，包括：
 * - 2FA 绑定状态
 * - 面板绑定状态
 * - 会话状态
 */
export default class InitController extends Controller {
  /**
   * 检查系统初始化状态
   *
   * @description 检查 2FA 绑定和面板绑定状态，用于前端判断需要进行哪些初始化步骤
   * @returns {Promise<void>} 返回初始化状态信息
   */
  public async checkStatus() {
    const { ctx, service } = this;

    try {
      // 使用存储服务检查状态
      const storage = service.storage;

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

      ctx.success({
        hasTwoFA,
        hasPanel,
        hasValidSession,
        needsInitialization: !hasTwoFA || !hasPanel,
        // 添加调试信息
        debug: {
          sessionCookie: sessionId ? 'present' : 'missing',
          twoFASecret: twoFASecret ? 'present' : 'missing',
          panelConfig: panelConfig ? 'present' : 'missing',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      ctx.logger.error('检查初始化状态失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      ctx.internalError('检查初始化状态失败', errorMessage);
    }
  }
}