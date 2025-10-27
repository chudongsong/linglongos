import { Service } from 'egg';
import * as speakeasy from 'speakeasy';

export default class AuthService extends Service {
  /**
   * 生成 2FA 绑定信息（不保存密钥）。
   *
   * 逻辑：
   * - 使用 `speakeasy.generateSecret` 生成 TOTP 密钥（base32 与 otpauth URL）；
   * - 仅返回二维码 URL 与密钥，不持久化；
   * - 密钥将在验证成功后通过 confirmBind 方法保存。
   *
   * @returns {Promise<{ qrCodeUrl: string; secret: string }>} - 二维码 URL 与 base32 密钥
   */
  async generateBindInfo(): Promise<{ qrCodeUrl: string; secret: string }> {
    const secret = speakeasy.generateSecret({ length: 20, name: 'LinglongOS' });
    return { qrCodeUrl: secret.otpauth_url || '', secret: secret.base32 };
  }

  /**
   * 确认绑定 2FA 并保存密钥。
   *
   * 逻辑：
   * - 验证提供的 TOTP 令牌是否正确；
   * - 验证成功后保存密钥到数据库；
   * - 创建会话。
   *
   * @param {string} secret - base32 密钥
   * @param {string} token - 用户输入的一次性口令
   * @returns {Promise<{ sessionId?: string } | null>} - 成功返回 `{ sessionId }`，失败返回 `null`
   */
  async confirmBind(secret: string, token: string): Promise<{ sessionId?: string } | null> {
     if (!secret || !token) return null;

     // 验证 TOTP 令牌
     const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token });
     if (!ok) return null;

     // 验证成功后保存密钥
     this.ctx.service.fileStorage.setTwoFASecret(secret);

     // 创建会话
     const sessionId = this.ctx.service.fileStorage.createSession(4 * 60 * 60 * 1000);
     return { sessionId };
   }

  /**
   * 校验 TOTP 令牌并创建会话。
   *
   * @param {string} [token] - 用户输入的一次性口令（可选）
   * @returns {Promise<{ sessionId?: string } | null>} - 成功返回 `{ sessionId }`，失败返回 `null`
   */
  async verifyTokenAndCreateSession(token?: string): Promise<{ sessionId?: string } | null> {
    if (!token) return null;
    const secret = this.ctx.service.fileStorage.getTwoFASecret();
    if (!secret) return null;
    const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token });
    if (!ok) return null;
    const sessionId = this.ctx.service.fileStorage.createSession(4 * 60 * 60 * 1000);
    return { sessionId };
  }
}
