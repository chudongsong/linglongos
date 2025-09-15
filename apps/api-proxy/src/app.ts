import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { serverConfig, authConfig, validateConfig } from '@/config';
import { databaseService } from '@/services/database.service';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error-handler';
import { requestLogger } from '@/middleware/request-logger';
import { sqlInjectionProtection, xssProtection } from '@/middleware/security/input-validation';
import { sanitizeInput, securityHeaders, validateRequestSize } from '@/middleware/security/basic-security';
import { createAuthRateLimit, defaultRateLimit } from '@/middleware/security/rate-limit';

// Import routes
import authRoutes from '@/routes/auth.routes';
import configRoutes from '@/routes/config.routes';
import proxyRoutes from '@/routes/proxy.routes';
import monitoringRoutes from '@/routes/monitoring.routes';

class ApiProxyServer {
  private app: express.Application;
  private server?: any;

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // Additional security headers
    this.app.use(securityHeaders);

    // Input sanitization
    this.app.use(sanitizeInput);

    // Request size validation
    this.app.use(validateRequestSize('10mb'));

    // Additional security headers
    this.app.use(securityHeaders);

    // Input sanitization
    this.app.use(sanitizeInput);

    // Request size validation
    this.app.use(validateRequestSize('10mb'));

    // CORS configuration
    this.app.use(cors({
      origin: serverConfig.cors.origin,
      credentials: serverConfig.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression
    this.app.use(compression());

    // Default rate limiting
    this.app.use(defaultRateLimit.middleware());

    // Stricter rate limiting for auth endpoints
    this.app.use('/api/auth', createAuthRateLimit().middleware());

    // Legacy rate limiting for compatibility
    const limiter = rateLimit({
      windowMs: authConfig.rateLimiting.windowMs,
      max: authConfig.rateLimiting.maxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    // Apply legacy limiter to specific routes if needed

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // API version info
    this.app.get('/api', (_req, res) => {
      res.status(200).json({
        name: 'API Proxy Service',
        version: '1.0.0',
        description: 'Node.js API proxy service for panel management',
        endpoints: {
          auth: '/api/auth',
          config: '/api/config',
          proxy: '/api/proxy',
        },
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/config', configRoutes);
    this.app.use('/api/proxy', proxyRoutes);
    this.app.use('/api/monitoring', monitoringRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.originalUrl} not found`,
          timestamp: new Date().toISOString(),
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Initialize database
      await databaseService.initialize();
      logger.info('Database initialized successfully');

      // Start server
      this.server = this.app.listen(serverConfig.port, serverConfig.host, () => {
        logger.info(`🚀 API Proxy Server started on ${serverConfig.host}:${serverConfig.port}`);
        logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔍 Health check available at: http://${serverConfig.host}:${serverConfig.port}/health`);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.shutdown('SIGTERM'));
      process.on('SIGINT', () => this.shutdown('SIGINT'));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (this.server) {
      this.server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connection
        try {
          await databaseService.close();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database:', error);
        }
        
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default ApiProxyServer;