import { authService } from '@/auth/auth.service';

describe('AuthService', () => {
  describe('Password Management', () => {
    const password = 'testPassword123';
    let hashedPassword: string;

    test('should hash password correctly', async () => {
      hashedPassword = await authService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should verify password correctly', async () => {
      const isValid = await authService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject invalid password', async () => {
      const isValid = await authService.verifyPassword('wrongPassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Management', () => {
    const payload = {
      userId: 'test-user-id',
      username: 'testuser',
    };

    let accessToken: string;
    let refreshToken: string;

    test('should generate access token', () => {
      accessToken = authService.generateAccessToken(payload);
      
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3); // JWT format
    });

    test('should generate refresh token', () => {
      refreshToken = authService.generateRefreshToken(payload);
      
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe('string');
      expect(refreshToken.split('.')).toHaveLength(3); // JWT format
    });

    test('should generate both tokens', () => {
      const tokens = authService.generateTokens(payload);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBeGreaterThan(0);
    });

    test('should verify access token', () => {
      const verifiedPayload = authService.verifyAccessToken(accessToken);
      
      expect(verifiedPayload.userId).toBe(payload.userId);
      expect(verifiedPayload.username).toBe(payload.username);
      expect(verifiedPayload.iat).toBeDefined();
      expect(verifiedPayload.exp).toBeDefined();
    });

    test('should verify refresh token', () => {
      const verifiedPayload = authService.verifyRefreshToken(refreshToken);
      
      expect(verifiedPayload.userId).toBe(payload.userId);
      expect(verifiedPayload.username).toBe(payload.username);
    });

    test('should refresh access token', () => {
      const newTokens = authService.refreshAccessToken(refreshToken);
      
      expect(newTokens.accessToken).toBeDefined();
      expect(newTokens.refreshToken).toBeDefined();
      expect(newTokens.accessToken).not.toBe(accessToken);
    });

    test('should reject invalid token', () => {
      expect(() => {
        authService.verifyAccessToken('invalid-token');
      }).toThrow();
    });

    test('should reject malformed token', () => {
      expect(() => {
        authService.verifyAccessToken('malformed.token');
      }).toThrow();
    });
  });

  describe('Token Extraction', () => {
    test('should extract token from valid authorization header', () => {
      const token = 'valid-jwt-token';
      const authHeader = `Bearer ${token}`;
      
      const extractedToken = authService.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    test('should throw error for missing authorization header', () => {
      expect(() => {
        authService.extractTokenFromHeader(undefined);
      }).toThrow('Authorization header is required');
    });

    test('should throw error for invalid authorization header format', () => {
      expect(() => {
        authService.extractTokenFromHeader('InvalidFormat token');
      }).toThrow('Invalid authorization header format');
    });

    test('should throw error for missing Bearer prefix', () => {
      expect(() => {
        authService.extractTokenFromHeader('token-without-bearer');
      }).toThrow('Invalid authorization header format');
    });
  });

  describe('Security Token Generation', () => {
    test('should generate secure token with default length', () => {
      const token = authService.generateSecureToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    test('should generate secure token with custom length', () => {
      const token = authService.generateSecureToken(16);
      
      expect(token).toBeDefined();
      expect(token.length).toBe(32); // 16 bytes = 32 hex characters
    });

    test('should generate different tokens each time', () => {
      const token1 = authService.generateSecureToken();
      const token2 = authService.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });
});