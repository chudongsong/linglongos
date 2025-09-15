import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '@/auth/auth.service';
import { createAuthError } from '@/middleware/error-handler';
import { logger } from '@/utils/logger';

// Extend Request type to include user information
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authService.extractTokenFromHeader(authHeader);
    
    // Verify the token
    const payload = authService.verifyAccessToken(token);
    
    // Attach user info to request
    req.user = payload;
    
    logger.debug('Token authenticated successfully', {
      userId: payload.userId,
      username: payload.username,
      requestId: req.requestId,
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't throw error if token is missing
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }
    
    const token = authService.extractTokenFromHeader(authHeader);
    const payload = authService.verifyAccessToken(token);
    
    req.user = payload;
    
    logger.debug('Optional authentication successful', {
      userId: payload.userId,
      username: payload.username,
      requestId: req.requestId,
    });
    
    next();
  } catch (error) {
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: req.requestId,
    });
    
    // For optional auth, we don't pass the error to next()
    next();
  }
};

/**
 * Middleware to require specific permissions (placeholder for future implementation)
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw createAuthError('Authentication required', 'AUTH_REQUIRED');
    }
    
    // TODO: Implement permission checking logic
    // For now, we'll just check if user is authenticated
    
    logger.debug('Permission check passed', {
      userId: req.user.userId,
      permission,
      requestId: req.requestId,
    });
    
    next();
  };
};

/**
 * Middleware to require admin role (placeholder for future implementation)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw createAuthError('Authentication required', 'AUTH_REQUIRED');
  }
  
  // TODO: Implement admin role checking
  // For now, we'll allow all authenticated users
  
  logger.debug('Admin check passed', {
    userId: req.user.userId,
    requestId: req.requestId,
  });
  
  next();
};

/**
 * Middleware to validate user owns resource (placeholder for future implementation)
 */
export const requireOwnership = (resourceParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw createAuthError('Authentication required', 'AUTH_REQUIRED');
    }
    
    const resourceId = req.params[resourceParam];
    
    // TODO: Implement ownership checking logic
    // This would typically check if the authenticated user owns the resource
    
    logger.debug('Ownership check passed', {
      userId: req.user.userId,
      resourceId,
      requestId: req.requestId,
    });
    
    next();
  };
};