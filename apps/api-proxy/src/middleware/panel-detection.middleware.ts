import { Request, Response, NextFunction } from 'express';
import { panelDetectionService } from './panel-detection.service';
import { PanelDetectionResult } from '@/types';
import { logger } from '@/utils/logger';
import { createValidationError } from '@/middleware/error-handler';

// Extend Request type to include panel detection results
declare global {
  namespace Express {
    interface Request {
      panelDetection?: PanelDetectionResult;
      targetEndpoint?: string;
    }
  }
}

/**
 * Middleware to detect panel type from target endpoint
 */
export const detectPanelType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract target endpoint from request
    const endpoint = extractEndpointFromRequest(req);
    
    if (!endpoint) {
      throw createValidationError('Target endpoint not found in request');
    }

    // Store endpoint in request for later use
    req.targetEndpoint = endpoint;

    // Detect panel type
    const detectionResult = await panelDetectionService.detectPanelType(endpoint, req.headers as Record<string, string>);
    
    // Store detection result in request
    req.panelDetection = detectionResult;

    logger.debug('Panel detection completed', {
      requestId: req.requestId,
      endpoint,
      panelType: detectionResult.panelType,
      version: detectionResult.version,
    });

    next();
  } catch (error) {
    logger.error('Panel detection middleware failed', {
      requestId: req.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    next(error);
  }
};

/**
 * Middleware to require specific panel type
 */
export const requirePanelType = (expectedPanelType: 'onePanel' | 'baota') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const panelDetection = req.panelDetection;
    
    if (!panelDetection) {
      throw createValidationError('Panel detection not performed');
    }

    if (panelDetection.panelType !== expectedPanelType) {
      throw createValidationError(
        `Expected panel type ${expectedPanelType}, but detected ${panelDetection.panelType}`,
        {
          expected: expectedPanelType,
          detected: panelDetection.panelType,
        }
      );
    }

    logger.debug('Panel type requirement satisfied', {
      requestId: req.requestId,
      expectedPanelType,
      detectedPanelType: panelDetection.panelType,
    });

    next();
  };
};

/**
 * Middleware to require specific panel capabilities
 */
export const requireCapabilities = (requiredCapabilities: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const panelDetection = req.panelDetection;
    
    if (!panelDetection) {
      throw createValidationError('Panel detection not performed');
    }

    const missingCapabilities = requiredCapabilities.filter(
      capability => !panelDetection.capabilities.includes(capability)
    );

    if (missingCapabilities.length > 0) {
      throw createValidationError(
        `Panel missing required capabilities: ${missingCapabilities.join(', ')}`,
        {
          required: requiredCapabilities,
          available: panelDetection.capabilities,
          missing: missingCapabilities,
        }
      );
    }

    logger.debug('Panel capabilities requirement satisfied', {
      requestId: req.requestId,
      requiredCapabilities,
      availableCapabilities: panelDetection.capabilities,
    });

    next();
  };
};

/**
 * Extract target endpoint from request
 */
function extractEndpointFromRequest(req: Request): string | null {
  // Check for explicit endpoint in headers
  const headerEndpoint = req.headers['x-target-endpoint'] as string;
  if (headerEndpoint) {
    return headerEndpoint;
  }

  // Check for endpoint in query parameters
  const queryEndpoint = req.query.endpoint as string;
  if (queryEndpoint) {
    return queryEndpoint;
  }

  // Check for endpoint in request body
  if (req.body && req.body.endpoint) {
    return req.body.endpoint;
  }

  // Try to extract from URL path (for proxy routes)
  const pathSegments = req.path.split('/').filter(segment => segment);
  
  // Look for URL-like patterns in path segments
  for (const segment of pathSegments) {
    if (segment.startsWith('http%3A%2F%2F') || segment.startsWith('https%3A%2F%2F')) {
      // URL-encoded endpoint
      return decodeURIComponent(segment);
    }
    
    if (segment.startsWith('http://') || segment.startsWith('https://')) {
      return segment;
    }
  }

  return null;
}

/**
 * Middleware to validate endpoint format
 */
export const validateEndpoint = (req: Request, res: Response, next: NextFunction) => {
  try {
    const endpoint = extractEndpointFromRequest(req);
    
    if (!endpoint) {
      throw createValidationError(
        'Target endpoint is required. Provide it via X-Target-Endpoint header, endpoint query parameter, or request body.'
      );
    }

    // Validate URL format
    try {
      const url = new URL(endpoint);
      
      // Check protocol
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw createValidationError('Endpoint must use HTTP or HTTPS protocol');
      }

      // Check hostname
      if (!url.hostname) {
        throw createValidationError('Endpoint must have a valid hostname');
      }

    } catch (urlError) {
      throw createValidationError(
        'Invalid endpoint URL format',
        { endpoint, error: urlError instanceof Error ? urlError.message : 'Unknown error' }
      );
    }

    req.targetEndpoint = endpoint;

    logger.debug('Endpoint validation passed', {
      requestId: req.requestId,
      endpoint,
    });

    next();
  } catch (error) {
    next(error);
  }
};