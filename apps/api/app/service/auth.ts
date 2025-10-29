import { Service } from 'egg';
import * as speakeasy from 'speakeasy';

/**
 * 认证服务类
 *
 * 负责处理2FA（基于TOTP）的绑定与验证流程，包括：
 * - 生成绑定信息（二维码URL与密钥）
 * - 确认绑定并保存密钥
 * - 验证令牌并创建会话
 */
export default class AuthService extends Service {
  /** 会话过期时间：4小时（毫秒） */
  private static readonly SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000;

  /** TOTP密钥长度 */
  private static readonly TOTP_SECRET_LENGTH = 20;

  /** 应用名称（用于TOTP标识） */
  private static readonly APP_NAME = 'LinglongOS';

  /**
   * 生成 2FA 绑定信息（不保存密钥）
   *
   * 逻辑：
   * - 使用 `speakeasy.generateSecret` 生成 TOTP 密钥（base32 与 otpauth URL）
   * - 仅返回二维码 URL 与密钥，不持久化
   * - 密钥将在验证成功后通过 confirmBind 方法保存
   *
   * @returns {Promise<{ qrCodeUrl: string; secret: string }>} 二维码 URL 与 base32 密钥
   */
  async generateBindInfo(): Promise<{ qrCodeUrl: string; secret: string }> {
    const secret = speakeasy.generateSecret({
      length: AuthService.TOTP_SECRET_LENGTH,
      name: AuthService.APP_NAME,
    });
    return {
      qrCodeUrl: secret.otpauth_url || '',
      secret: secret.base32,
    };
  }

  /**
   * 确认绑定 2FA 并保存密钥
   *
   * 逻辑：
   * - 验证提供的 TOTP 令牌是否正确
   * - 验证成功后保存密钥到数据库
   * - 创建会话
   *
   * @param {string} secret base32 密钥
   * @param {string} token 用户输入的一次性口令
   * @returns {Promise<{ sessionId?: string } | null>} 成功返回 `{ sessionId }`，失败返回 `null`
   */
  async confirmBind(secret: string, token: string): Promise<{ sessionId?: string } | null> {
    if (!secret || !token) {
      return null;
    }

    // 验证 TOTP 令牌
    if (!this.verifyTOTPToken(secret, token)) {
      return null;
    }

    // 验证成功后保存密钥
    this.ctx.service.storage.setTwoFASecret(secret);

    // 创建会话
    const sessionId = this.createSession();
    return { sessionId };
  }

  /**
   * 校验 TOTP 令牌并创建会话
   *
   * @param {string} [token] 用户输入的一次性口令（可选）
   * @returns {Promise<{ sessionId?: string } | null>} 成功返回 `{ sessionId }`，失败返回 `null`
   */
  async verifyTokenAndCreateSession(token?: string): Promise<{ sessionId?: string } | null> {
    if (!token) {
      return null;
    }

    const secret = this.ctx.service.storage.getTwoFASecret();
    if (!secret) {
      return null;
    }

    // 验证 TOTP 令牌
    if (!this.verifyTOTPToken(secret, token)) {
      return null;
    }

    // 创建会话
    const sessionId = this.createSession();
    return { sessionId };
  }

  /**
   * 验证 TOTP 令牌
   *
   * @private
   * @param {string} secret base32 密钥
   * @param {string} token 用户输入的一次性口令
   * @returns {boolean} 验证结果
   */
  private verifyTOTPToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });
  }

  /**
   * 创建会话
   *
   * @private
   * @returns {string} 会话ID
   */
  private createSession(): string {
    return this.ctx.service.storage.createSession(AuthService.SESSION_EXPIRY_MS);
  }
}