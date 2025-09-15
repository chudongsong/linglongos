import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { logger } from '@/utils/logger';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
  message?: string;
}

export interface RateLimitInfo {
  totalHits: number;
  totalRequests: number;
  resetTime: Date;
  remainingRequests: number;
}

export class RateLimiter {
  private cache: NodeCache;
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator.bind(this),
      onLimitReached: this.defaultOnLimitReached.bind(this),
      message: 'Too many requests from this IP, please try again later.',
      ...options,
    };

    this.cache = new NodeCache({
      stdTTL: Math.ceil(this.options.windowMs / 1000),
      checkperiod: Math.ceil(this.options.windowMs / 1000 / 2),
      useClones: false,
    });
  }

  private defaultKeyGenerator(req: Request): string {
    // Use user ID if available, otherwise fall back to IP
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    
    return `ip:${this.getClientIP(req)}`;
  }

  private defaultOnLimitReached(req: Request, res: Response): void {
    logger.warn('Rate limit exceeded', {
      key: this.options.keyGenerator(req),
      requestId: req.requestId,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
  }

  private getClientIP(req: Request): string {
    return (
      req.get('X-Forwarded-For')?.split(',')[0] ||
      req.get('X-Real-IP') ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '127.0.0.1'
    ).trim();
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.options.keyGenerator(req);
      const now = Date.now();
      const windowStart = now - this.options.windowMs;
      
      // Get or create rate limit data
      let hitData = this.cache.get<{
        requests: { timestamp: number; success: boolean }[];
        windowStart: number;
      }>(key);
      
      if (!hitData || hitData.windowStart < windowStart) {
        // Initialize or reset window
        hitData = {
          requests: [],
          windowStart: now,
        };
      }
      
      // Clean old requests outside the window
      hitData.requests = hitData.requests.filter(req => req.timestamp > windowStart);
      
      // Count requests based on options
      let requestCount = hitData.requests.length;
      if (this.options.skipSuccessfulRequests) {
        requestCount = hitData.requests.filter(req => !req.success).length;
      }
      if (this.options.skipFailedRequests) {
        requestCount = hitData.requests.filter(req => req.success).length;
      }
      
      // Check if limit exceeded
      if (requestCount >= this.options.maxRequests) {
        this.options.onLimitReached(req, res);
        
        const resetTime = new Date(hitData.windowStart + this.options.windowMs);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
        res.setHeader('Retry-After', Math.ceil(this.options.windowMs / 1000));
        
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: this.options.message,
            retryAfter: Math.ceil(this.options.windowMs / 1000),
            resetTime: resetTime.toISOString(),
            timestamp: new Date().toISOString(),
          },
        });
      }
      
      // Add current request to tracking
      hitData.requests.push({
        timestamp: now,
        success: true, // Will be updated in response handler if needed
      });
      
      // Update cache
      this.cache.set(key, hitData);
      
      // Set rate limit headers
      const remaining = Math.max(0, this.options.maxRequests - requestCount - 1);
      const resetTime = new Date(hitData.windowStart + this.options.windowMs);
      
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
      
      // Update request status on response
      const originalJson = res.json;
      res.json = function(body: any) {
        // Update the request status based on response
        const currentData = this.cache?.get(key);
        if (currentData && currentData.requests.length > 0) {
          const lastRequest = currentData.requests[currentData.requests.length - 1];
          lastRequest.success = res.statusCode < 400;
          this.cache?.set(key, currentData);
        }
        
        return originalJson.call(this, body);
      }.bind({ cache: this.cache });
      
      next();
    };
  }
  
  public getRateLimitInfo(req: Request): RateLimitInfo | null {
    const key = this.options.keyGenerator(req);
    const hitData = this.cache.get<{
      requests: { timestamp: number; success: boolean }[];
      windowStart: number;
    }>(key);
    
    if (!hitData) {
      return null;
    }
    
    const now = Date.now();
    const windowStart = now - this.options.windowMs;
    const validRequests = hitData.requests.filter(req => req.timestamp > windowStart);
    
    return {
      totalHits: validRequests.length,
      totalRequests: validRequests.length,
      resetTime: new Date(hitData.windowStart + this.options.windowMs),
      remainingRequests: Math.max(0, this.options.maxRequests - validRequests.length),
    };
  }
  
  public reset(req: Request): void {
    const key = this.options.keyGenerator(req);
    this.cache.del(key);
  }
  
  public resetAll(): void {
    this.cache.flushAll();
  }
}

// Pre-configured rate limiters
export const createStrictRateLimit = (maxRequests: number = 10, windowMs: number = 60000) => {
  return new RateLimiter({
    windowMs,
    maxRequests,
    message: `Too many requests. Maximum ${maxRequests} requests per minute allowed.`,
  });
};

export const createAPIRateLimit = (maxRequests: number = 100, windowMs: number = 900000) => {
  return new RateLimiter({
    windowMs, // 15 minutes
    maxRequests,
    skipSuccessfulRequests: false,
    message: `API rate limit exceeded. Maximum ${maxRequests} requests per 15 minutes allowed.`,
  });
};

export const createAuthRateLimit = (maxRequests: number = 5, windowMs: number = 300000) => {
  return new RateLimiter({
    windowMs, // 5 minutes
    maxRequests,
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req: Request) => {
      // Rate limit by IP for auth attempts
      return `auth:${req.connection.remoteAddress || req.get('X-Forwarded-For') || '127.0.0.1'}`;
    },
    message: `Too many authentication attempts. Maximum ${maxRequests} failed attempts per 5 minutes allowed.`,
  });
};

// Export default rate limiter instance
export const defaultRateLimit = createAPIRateLimit();