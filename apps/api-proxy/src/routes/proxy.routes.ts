import { Router, Request, Response } from 'express';
import { panelConfigRepository } from '@/models/panel-config.repository';
import { authenticateToken } from '@/auth/auth.middleware';
import { validateEndpoint, detectPanelType } from '@/middleware/panel-detection.middleware';
import { onePanelMiddleware } from '@/middleware/panels/onepanel.middleware';
import { baotaMiddleware } from '@/middleware/panels/baota.middleware';
import { proxyEngine } from '@/services/proxy-engine.service';
import { asyncHandler } from '@/middleware/error-handler';
import { createValidationError, createAuthError, createProxyError } from '@/middleware/error-handler';
import { logger } from '@/utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * Middleware to load panel configuration
 */
const loadPanelConfig = asyncHandler(async (req: Request, res: Response, next) => {
  if (!req.user) {
    throw createAuthError('Authentication required', 'AUTH_REQUIRED');
  }

  const configId = parseInt(req.params.configId, 10);
  if (isNaN(configId)) {
    throw createValidationError('Invalid configuration ID');
  }

  // Get configuration with decrypted API key
  const config = await panelConfigRepository.findByIdDecrypted(configId);
  if (!config) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'CONFIG_NOT_FOUND',
        message: 'Panel configuration not found',
      },
    });
  }

  // Check ownership
  if (config.user_id !== req.user.userId) {
    throw createAuthError('Access denied', 'ACCESS_DENIED');
  }

  // Check if configuration is active
  if (!config.is_active) {
    throw createValidationError('Panel configuration is not active');
  }

  // Store configuration in request
  req.panelConfig = config;

  next();
});

/**
 * Middleware to apply panel-specific processing
 */
const applyPanelMiddleware = (req: Request, res: Response, next) => {
  if (!req.panelConfig) {
    throw createProxyError('Panel configuration not loaded');
  }

  // Set credentials for middleware
  req.body.credentials = {
    userId: req.panelConfig.user_id,
    panelType: req.panelConfig.panel_type,
    endpoint: req.panelConfig.endpoint,
    apiKey: req.panelConfig.apiKey,
  };

  // Apply panel-specific middleware
  if (req.panelConfig.panel_type === 'onePanel') {
    onePanelMiddleware.middleware()(req, res, next);
  } else if (req.panelConfig.panel_type === 'baota') {
    baotaMiddleware.middleware()(req, res, next);
  } else {
    throw createProxyError(`Unsupported panel type: ${req.panelConfig.panel_type}`);
  }
};

/**
 * ALL /api/proxy/:configId/*
 * Proxy requests to configured panel
 */
router.all('/:configId/*', 
  loadPanelConfig,
  applyPanelMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.panelConfig || !req.proxyRequest || !req.mappedPath) {
      throw createProxyError('Request not properly processed by panel middleware');
    }

    try {
      // Execute proxy request
      const response = await proxyEngine.executeRequest(
        req.proxyRequest,
        req.mappedPath
      );

      // Set response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          res.setHeader(key, value);
        }
      });

      // Add proxy information headers
      res.setHeader('X-Proxy-Source', 'api-proxy-service');
      res.setHeader('X-Panel-Type', req.panelConfig.panel_type);
      res.setHeader('X-Processing-Time', `${response.processingTime}ms`);

      // Send response
      res.status(response.statusCode).json(response.body);

      // Log successful proxy request
      logger.info('Proxy request completed', {
        configId: req.panelConfig.id,
        userId: req.user?.userId,
        method: req.method,
        originalPath: req.path,
        mappedPath: req.mappedPath,
        statusCode: response.statusCode,
        processingTime: response.processingTime,
        requestId: req.requestId,
      });

    } catch (error) {
      logger.error('Proxy request failed', {
        configId: req.panelConfig.id,
        userId: req.user?.userId,
        method: req.method,
        originalPath: req.path,
        mappedPath: req.mappedPath,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      throw error;
    }
  })
);

/**
 * ALL /api/proxy/auto/*
 * Auto-detect panel type and proxy request
 */
router.all('/auto/*',
  validateEndpoint,
  detectPanelType,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user || !req.panelDetection || !req.targetEndpoint) {
      throw createProxyError('Auto-proxy request not properly configured');
    }

    if (req.panelDetection.panelType === 'unknown') {
      throw createProxyError('Unable to detect panel type for the target endpoint');
    }

    // Create temporary credentials for auto-proxy
    const credentials = {
      userId: req.user.userId,
      panelType: req.panelDetection.panelType,
      endpoint: req.targetEndpoint,
      apiKey: req.headers['x-api-key'] as string || req.body.apiKey,
    };

    if (!credentials.apiKey) {
      throw createValidationError('API key is required. Provide it via X-API-Key header or request body.');
    }

    // Set credentials for middleware
    req.body.credentials = credentials;

    // Apply panel-specific middleware
    let panelMiddleware;
    if (req.panelDetection.panelType === 'onePanel') {
      panelMiddleware = onePanelMiddleware.middleware();
    } else if (req.panelDetection.panelType === 'baota') {
      panelMiddleware = baotaMiddleware.middleware();
    } else {
      throw createProxyError(`Unsupported panel type: ${req.panelDetection.panelType}`);
    }

    // Apply middleware and execute request
    panelMiddleware(req, res, async () => {
      try {
        if (!req.proxyRequest || !req.mappedPath) {
          throw createProxyError('Request not properly processed by panel middleware');
        }

        const response = await proxyEngine.executeRequest(
          req.proxyRequest,
          req.mappedPath
        );

        // Set response headers
        Object.entries(response.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            res.setHeader(key, value);
          }
        });

        // Add proxy information headers
        res.setHeader('X-Proxy-Source', 'api-proxy-service');
        res.setHeader('X-Panel-Type', req.panelDetection!.panelType);
        res.setHeader('X-Panel-Detection', 'auto');
        res.setHeader('X-Processing-Time', `${response.processingTime}ms`);

        // Send response
        res.status(response.statusCode).json(response.body);

        // Log successful auto-proxy request
        logger.info('Auto-proxy request completed', {
          userId: req.user?.userId,
          method: req.method,
          originalPath: req.path,
          mappedPath: req.mappedPath,
          detectedPanelType: req.panelDetection?.panelType,
          statusCode: response.statusCode,
          processingTime: response.processingTime,
          requestId: req.requestId,
        });

      } catch (error) {
        logger.error('Auto-proxy request failed', {
          userId: req.user?.userId,
          method: req.method,
          originalPath: req.path,
          mappedPath: req.mappedPath,
          detectedPanelType: req.panelDetection?.panelType,
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId: req.requestId,
        });

        throw error;
      }
    });
  })
);

/**
 * GET /api/proxy/health/:configId
 * Check health of specific panel configuration
 */
router.get('/health/:configId',
  loadPanelConfig,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.panelConfig) {
      throw createProxyError('Panel configuration not loaded');
    }

    const credentials = {
      userId: req.panelConfig.user_id,
      panelType: req.panelConfig.panel_type,
      endpoint: req.panelConfig.endpoint,
      apiKey: req.panelConfig.apiKey,
    };

    const isHealthy = await proxyEngine.healthCheck(credentials);
    const healthStatus = isHealthy ? 'healthy' : 'unhealthy';

    // Update health status in database
    await panelConfigRepository.updateHealthStatus(req.panelConfig.id, healthStatus);

    logger.info('Panel health check completed', {
      configId: req.panelConfig.id,
      userId: req.user?.userId,
      isHealthy,
      requestId: req.requestId,
    });

    res.json({
      success: true,
      data: {
        configId: req.panelConfig.id,
        isHealthy,
        healthStatus,
        checkedAt: new Date().toISOString(),
        panelType: req.panelConfig.panel_type,
        endpoint: req.panelConfig.endpoint,
      },
      message: `Panel is ${healthStatus}`,
    });
  })
);

// Extend Request type to include panel configuration
declare global {
  namespace Express {
    interface Request {
      panelConfig?: any;
    }
  }
}

export default router;