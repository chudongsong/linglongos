import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/config';
import { createAuthError } from '@/middleware/error-handler';

export interface TokenPayload {
  userId: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private jwtSecret: string;
  private refreshSecret: string;

  constructor() {
    this.jwtSecret = authConfig.jwtSecret;
    this.refreshSecret = `${authConfig.jwtSecret}_refresh`;
  }

  /**
   * 使用 bcrypt 对密码进行哈希加密
   */
  public async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码与哈希值是否匹配
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成访问令牌
   */
  public generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: authConfig.tokenExpiry,
      issuer: 'api-proxy-service',
      audience: 'api-proxy-client',
    });
  }

  /**
   * 生成刷新令牌
   */
  public generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: '7d',
      issuer: 'api-proxy-service',
      audience: 'api-proxy-client',
    });
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  public generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>): AuthTokens {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    // 计算过期时间（秒）
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
    const expiresIn = decoded.exp! - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * 验证访问令牌
   */
  public verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        issuer: 'api-proxy-service',
        audience: 'api-proxy-client',
      }) as TokenPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createAuthError('Access token has expired', 'TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createAuthError('Invalid access token', 'INVALID_TOKEN');
      } else {
        throw createAuthError('Token verification failed', 'TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * 验证刷新令牌
   */
  public verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, this.refreshSecret, {
        issuer: 'api-proxy-service',
        audience: 'api-proxy-client',
      }) as TokenPayload;

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createAuthError('Refresh token has expired', 'REFRESH_TOKEN_EXPIRED');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw createAuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      } else {
        throw createAuthError('Refresh token verification failed', 'REFRESH_TOKEN_VERIFICATION_FAILED');
      }
    }
  }

  /**
   * 从 Authorization 头中提取令牌
   */
  public extractTokenFromHeader(authorization?: string): string {
    if (!authorization) {
      throw createAuthError('Authorization header is required', 'MISSING_AUTH_HEADER');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createAuthError('Invalid authorization header format. Expected: Bearer <token>', 'INVALID_AUTH_HEADER');
    }

    return parts[1];
  }

  /**
   * 使用刷新令牌刷新访问令牌
   */
  public refreshAccessToken(refreshToken: string): AuthTokens {
    const payload = this.verifyRefreshToken(refreshToken);
    
    // 生成新的令牌
    return this.generateTokens({
      userId: payload.userId,
      username: payload.username,
    });
  }

  /**
   * 生成随机安全令牌，用于密码重置等场景
   */
  public generateSecureToken(length: number = 32): string {
    const crypto = require('crypto');
    return crypto.randomBytes(length).toString('hex');
  }
}

export const authService = new AuthService();