import { Router, Request, Response, NextFunction } from 'express';
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

// 对所有路由应用认证
router.use(authenticateToken);

/**
 * 加载面板配置的中间件
 */
const loadPanelConfig = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw createAuthError('Authentication required', 'AUTH_REQUIRED');
  }

  const configId = parseInt(req.params.configId, 10);
  if (isNaN(configId)) {
    throw createValidationError('Invalid configuration ID');
  }

  // 使用解密的 API 密钥获取配置
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

  // 检查所有权
  if (config.user_id !== req.user.userId) {
    throw createAuthError('Access denied', 'ACCESS_DENIED');
  }

  // 检查配置是否激活
  if (!config.is_active) {
    throw createValidationError('Panel configuration is not active');
  }

  // 在请求中存储配置
  req.panelConfig = config;

  next();
});

/**
 * 应用面板特定处理的中间件
 */
const applyPanelMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.panelConfig) {
    throw createProxyError('Panel configuration not loaded');
  }

  // 为中间件设置凭据
  req.body.credentials = {
    userId: req.panelConfig.user_id,
    panelType: req.panelConfig.panel_type,
    endpoint: req.panelConfig.endpoint,
    apiKey: req.panelConfig.apiKey,
  };

  // 应用面板特定中间件
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
 * 将请求代理到已配置的面板
 */
router.all('/:configId/*', 
  loadPanelConfig,
  applyPanelMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.panelConfig || !req.proxyRequest || !req.mappedPath) {
      throw createProxyError('Request not properly processed by panel middleware');
    }

    try {
      // 执行代理请求
      const response = await proxyEngine.executeRequest(
        req.proxyRequest,
        req.mappedPath
      );

      // 设置响应头
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          res.setHeader(key, value);
        }
      });

      // 添加代理信息头
      res.setHeader('X-Proxy-Source', 'api-proxy-service');
      res.setHeader('X-Panel-Type', req.panelConfig.panel_type);
      res.setHeader('X-Processing-Time', `${response.processingTime}ms`);

      // 发送响应
      res.status(response.statusCode).json(response.body);

      // 记录成功的代理请求
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
 * 自动检测面板类型并代理请求
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

    // 为自动代理创建临时凭据
    const credentials = {
      userId: req.user.userId,
      panelType: req.panelDetection.panelType,
      endpoint: req.targetEndpoint,
      apiKey: req.headers['x-api-key'] as string || req.body.apiKey,
    };

    if (!credentials.apiKey) {
      throw createValidationError('API key is required. Provide it via X-API-Key header or request body.');
    }

    // 为中间件设置凭据
    req.body.credentials = credentials;

    // 应用面板特定中间件
    let panelMiddleware;
    if (req.panelDetection.panelType === 'onePanel') {
      panelMiddleware = onePanelMiddleware.middleware();
    } else if (req.panelDetection.panelType === 'baota') {
      panelMiddleware = baotaMiddleware.middleware();
    } else {
      throw createProxyError(`Unsupported panel type: ${req.panelDetection.panelType}`);
    }

    // 应用中间件并执行请求
    panelMiddleware(req, res, async () => {
      try {
        if (!req.proxyRequest || !req.mappedPath) {
          throw createProxyError('Request not properly processed by panel middleware');
        }

        const response = await proxyEngine.executeRequest(
          req.proxyRequest,
          req.mappedPath
        );

        // 设置响应头
        Object.entries(response.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            res.setHeader(key, value);
          }
        });

        // 添加代理信息头
        res.setHeader('X-Proxy-Source', 'api-proxy-service');
        res.setHeader('X-Panel-Type', req.panelDetection!.panelType);
        res.setHeader('X-Panel-Detection', 'auto');
        res.setHeader('X-Processing-Time', `${response.processingTime}ms`);

        // 发送响应
        res.status(response.statusCode).json(response.body);

        // 记录成功的自动代理请求
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
 * 检查特定面板配置的健康状态
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

    // 在数据库中更新健康状态
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

// 扩展 Request 类型以包含面板配置
declare global {
  namespace Express {
    interface Request {
      panelConfig?: any;
    }
  }
}

export default router;