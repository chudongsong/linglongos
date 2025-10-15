import { Service } from 'egg';
import * as speakeasy from 'speakeasy';

export default class AuthService extends Service {
  /**
   * 生成 2FA 绑定信息并保存密钥。
   *
   * 逻辑：
   * - 使用 `speakeasy.generateSecret` 生成 TOTP 密钥（base32 与 otpauth URL）；
   * - 通过 `storage.setTwoFASecret` 持久化 base32 密钥；
   * - 返回二维码 URL 与密钥。
   *
   * @returns {Promise<{ qrCodeUrl: string; secret: string }>} - 二维码 URL 与 base32 密钥
   */
  async generateBindInfo(): Promise<{ qrCodeUrl: string; secret: string }> {
    const secret = speakeasy.generateSecret({ length: 20, name: 'LinglongOS' });
    this.ctx.service.storage.setTwoFASecret(secret.base32);
    return { qrCodeUrl: secret.otpauth_url || '', secret: secret.base32 };
  }

  /**
   * 校验 TOTP 令牌并创建会话。
   *
   * @param {string} [token] - 用户输入的一次性口令（可选）
   * @returns {Promise<{ sessionId?: string } | null>} - 成功返回 `{ sessionId }`，失败返回 `null`
   */
  async verifyTokenAndCreateSession(token?: string): Promise<{ sessionId?: string } | null> {
    if (!token) return null;
    const secret = this.ctx.service.storage.getTwoFASecret();
    if (!secret) return null;
    const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token });
    if (!ok) return null;
    const sessionId = this.ctx.service.storage.createSession(4 * 60 * 60 * 1000);
    return { sessionId };
  }
}