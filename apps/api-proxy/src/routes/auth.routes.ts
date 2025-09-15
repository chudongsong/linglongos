import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { authService } from '@/auth/auth.service';
import { userRepository } from '@/models/user.repository';
import { asyncHandler } from '@/middleware/error-handler';
import { createValidationError, createAuthError } from '@/middleware/error-handler';
import { logger } from '@/utils/logger';

const router = Router();

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(128).required(),
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).max(128).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw createValidationError(error.details[0].message);
  }

  const { username, password } = value;

  // Find user by username
  const user = await userRepository.findByUsername(username);
  if (!user || !user.is_active) {
    throw createAuthError('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  // Verify password
  const isPasswordValid = await authService.verifyPassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw createAuthError('Invalid username or password', 'INVALID_CREDENTIALS');
  }

  // Generate tokens
  const tokens = authService.generateTokens({
    userId: user.user_id,
    username: user.username,
  });

  // Log successful login
  logger.info('User login successful', {
    userId: user.user_id,
    username: user.username,
    requestId: req.requestId,
    ip: req.ip,
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    },
    message: 'Login successful',
  });
}));

/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw createValidationError(error.details[0].message);
  }

  const { username, email, password } = value;

  // Check if username already exists
  const existingUser = await userRepository.findByUsername(username);
  if (existingUser) {
    throw createValidationError('Username already exists');
  }

  // Check if email already exists (if provided)
  if (email) {
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      throw createValidationError('Email already exists');
    }
  }

  // Create new user
  const newUser = await userRepository.create({
    username,
    email,
    password,
  });

  // Generate tokens
  const tokens = authService.generateTokens({
    userId: newUser.user_id,
    username: newUser.username,
  });

  // Log successful registration
  logger.info('User registration successful', {
    userId: newUser.user_id,
    username: newUser.username,
    requestId: req.requestId,
    ip: req.ip,
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.created_at,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    },
    message: 'Registration successful',
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const { error, value } = refreshTokenSchema.validate(req.body);
  if (error) {
    throw createValidationError(error.details[0].message);
  }

  const { refreshToken } = value;

  try {
    // Verify and refresh tokens
    const newTokens = authService.refreshAccessToken(refreshToken);

    logger.info('Token refresh successful', {
      requestId: req.requestId,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: {
        tokens: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn,
        },
      },
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    throw createAuthError('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
  }
}));

/**
 * POST /api/auth/logout
 * User logout (for future implementation with token blacklisting)
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implement token blacklisting
  // For now, we'll just return success
  
  logger.info('User logout', {
    requestId: req.requestId,
    ip: req.ip,
  });

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  // This endpoint requires authentication
  if (!req.user) {
    throw createAuthError('Authentication required', 'AUTH_REQUIRED');
  }

  // Get user details from database
  const user = await userRepository.findByUserId(req.user.userId);
  if (!user || !user.is_active) {
    throw createAuthError('User not found or inactive', 'USER_NOT_FOUND');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    },
    message: 'User information retrieved successfully',
  });
}));

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put('/password', asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createAuthError('Authentication required', 'AUTH_REQUIRED');
  }

  const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).max(128).required(),
  });

  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw createValidationError(error.details[0].message);
  }

  const { currentPassword, newPassword } = value;

  // Verify current password
  const isCurrentPasswordValid = await userRepository.verifyPassword(req.user.userId, currentPassword);
  if (!isCurrentPasswordValid) {
    throw createAuthError('Current password is incorrect', 'INVALID_PASSWORD');
  }

  // Update password
  await userRepository.update(req.user.userId, { password: newPassword });

  logger.info('Password changed successfully', {
    userId: req.user.userId,
    requestId: req.requestId,
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export default router;