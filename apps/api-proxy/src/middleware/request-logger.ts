import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createRequestLogger } from '@/utils/logger';
import { apiLogRepository } from '@/models/api-log.repository';
import { logger } from '@/utils/logger';

// Extend Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  req.startTime = Date.now();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  // Log request completion
  res.on('finish', async () => {
    const responseTime = Date.now() - req.startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    const logData = {
      method,
      url: originalUrl,
      statusCode,
      responseTime,
      ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
    };
    
    // Log to console/file
    if (statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    // Save to database for API endpoints (exclude health checks)
    if (req.user && originalUrl.startsWith('/api/') && !originalUrl.includes('/health')) {
      try {
        await apiLogRepository.create({
          userId: req.user.userId,
          panelConfigId: req.body?.configId || req.params?.configId || undefined,
          requestId: req.requestId,
          method,
          path: originalUrl,
          statusCode,
          responseTime,
          errorMessage: statusCode >= 400 ? res.get('X-Error-Message') : undefined,
        });
      } catch (error) {
        logger.error('Failed to save API log to database:', error);
      }
    }
  });
  
  // Use winston request logger
  createRequestLogger()(req, res, next);
};