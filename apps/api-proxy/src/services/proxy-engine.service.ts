import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request, Response, NextFunction } from 'express';
import { ProxyRequest, ProxyResponse, UserCredentials } from '@/types';
import { logger } from '@/utils/logger';
import { panelConfig } from '@/config';
import { createProxyError, createPanelConnectionError } from '@/middleware/error-handler';

export interface ProxyEngineOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  validateSsl?: boolean;
}

export class ProxyEngine {
  private defaultOptions: ProxyEngineOptions = {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    validateSsl: false,
  };

  constructor(options?: Partial<ProxyEngineOptions>) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  /**
   * Execute proxy request using axios
   */
  public async executeRequest(
    proxyRequest: ProxyRequest,
    targetPath: string,
    options?: Partial<ProxyEngineOptions>
  ): Promise<ProxyResponse> {
    const startTime = Date.now();
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      // Build target URL
      const targetUrl = this.buildTargetUrl(proxyRequest.userCredentials.endpoint, targetPath);
      
      // Prepare request configuration
      const axiosConfig: AxiosRequestConfig = {
        method: proxyRequest.method.toLowerCase() as any,
        url: targetUrl,
        headers: proxyRequest.headers,
        timeout: mergedOptions.timeout,
        validateStatus: () => true, // Accept all status codes
        httpsAgent: mergedOptions.validateSsl ? undefined : new (require('https').Agent)({
          rejectUnauthorized: false,
        }),
      };

      // Add request body for non-GET requests
      if (proxyRequest.method !== 'GET' && proxyRequest.body) {
        if (proxyRequest.headers['content-type']?.includes('application/json')) {
          axiosConfig.data = JSON.stringify(proxyRequest.body);
        } else if (proxyRequest.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
          axiosConfig.data = this.serializeFormData(proxyRequest.body);
        } else {
          axiosConfig.data = proxyRequest.body;
        }
      }

      // Execute request with retry logic
      const response = await this.executeWithRetry(axiosConfig, mergedOptions);
      
      const processingTime = Date.now() - startTime;

      logger.info('Proxy request successful', {
        url: targetUrl,
        method: proxyRequest.method,
        statusCode: response.status,
        processingTime: `${processingTime}ms`,
        panelType: proxyRequest.panelType,
      });

      return {
        statusCode: response.status,
        headers: response.headers as Record<string, string>,
        body: response.data,
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Proxy request failed', {
        url: proxyRequest.userCredentials.endpoint,
        method: proxyRequest.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: `${processingTime}ms`,
        panelType: proxyRequest.panelType,
      });

      throw createProxyError(
        `Proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          endpoint: proxyRequest.userCredentials.endpoint,
          method: proxyRequest.method,
          processingTime,
        }
      );
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(
    config: AxiosRequestConfig,
    options: ProxyEngineOptions
  ): Promise<AxiosResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.retryAttempts!; attempt++) {
      try {
        const response = await axios(config);
        
        // Don't retry on successful responses (even 4xx/5xx)
        if (response.status < 500 || attempt === options.retryAttempts) {
          return response;
        }

        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx) or final attempt
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.status < 500) {
            return error.response;
          }
          if (attempt === options.retryAttempts) {
            throw lastError;
          }
        } else if (attempt === options.retryAttempts) {
          throw lastError;
        }

        // Wait before retry
        if (attempt < options.retryAttempts!) {
          const delay = options.retryDelay! * Math.pow(2, attempt - 1); // Exponential backoff
          logger.debug(`Retrying request in ${delay}ms (attempt ${attempt}/${options.retryAttempts})`, {
            url: config.url,
            error: lastError.message,
          });
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Create HTTP proxy middleware for streaming requests
   */
  public createProxyMiddleware(
    credentials: UserCredentials,
    options?: Partial<ProxyEngineOptions>
  ): any {
    const mergedOptions = { ...this.defaultOptions, ...options };

    const proxyOptions: Options = {
      target: credentials.endpoint,
      changeOrigin: true,
      secure: mergedOptions.validateSsl,
      timeout: mergedOptions.timeout,
      
      // Custom header modification
      onProxyReq: (proxyReq, req: Request) => {
        // Add authentication headers based on panel type
        if (credentials.panelType === 'onePanel') {
          proxyReq.setHeader('Authorization', `Bearer ${credentials.apiKey}`);
        } else if (credentials.panelType === 'baota') {
          proxyReq.setHeader('X-BT-Key', credentials.apiKey);
        }

        // Add tracking headers
        proxyReq.setHeader('X-Proxy-Source', 'api-proxy-service');
        proxyReq.setHeader('X-Request-ID', req.requestId || 'unknown');

        logger.debug('Proxy request headers set', {
          requestId: req.requestId,
          target: credentials.endpoint,
          panelType: credentials.panelType,
        });
      },

      // Handle proxy response
      onProxyRes: (proxyRes, req: Request, res: Response) => {
        // Add response headers
        res.setHeader('X-Proxy-Target', credentials.endpoint);
        res.setHeader('X-Panel-Type', credentials.panelType);

        logger.debug('Proxy response received', {
          requestId: req.requestId,
          statusCode: proxyRes.statusCode,
          target: credentials.endpoint,
        });
      },

      // Handle errors
      onError: (err, req: Request, res: Response) => {
        logger.error('Proxy middleware error', {
          requestId: req.requestId,
          error: err.message,
          target: credentials.endpoint,
        });

        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            error: {
              code: 'PROXY_ERROR',
              message: 'Proxy request failed',
              details: {
                target: credentials.endpoint,
                error: err.message,
              },
              timestamp: new Date().toISOString(),
            },
          });
        }
      },

      // Path rewriting
      pathRewrite: (path, req: Request) => {
        // Use mapped path if available
        const mappedPath = req.mappedPath || path;
        
        logger.debug('Path rewritten for proxy', {
          requestId: req.requestId,
          originalPath: path,
          mappedPath,
          panelType: credentials.panelType,
        });

        return mappedPath;
      },
    };

    return createProxyMiddleware(proxyOptions);
  }

  /**
   * Build target URL
   */
  private buildTargetUrl(endpoint: string, path: string): string {
    try {
      const baseUrl = new URL(endpoint);
      const targetUrl = new URL(path, baseUrl);
      return targetUrl.toString();
    } catch (error) {
      throw createPanelConnectionError(
        `Invalid endpoint or path: ${endpoint}${path}`,
        endpoint
      );
    }
  }

  /**
   * Serialize form data for URL encoding
   */
  private serializeFormData(data: any): string {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    }
    
    return params.toString();
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for target endpoint
   */
  public async healthCheck(credentials: UserCredentials): Promise<boolean> {
    try {
      const healthPath = credentials.panelType === 'onePanel' 
        ? '/api/v1/system/info' 
        : '/ajax';

      const response = await axios({
        method: 'GET',
        url: this.buildTargetUrl(credentials.endpoint, healthPath),
        timeout: 5000,
        validateStatus: () => true,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false,
        }),
      });

      const isHealthy = response.status < 500;
      
      logger.debug('Health check completed', {
        endpoint: credentials.endpoint,
        panelType: credentials.panelType,
        statusCode: response.status,
        isHealthy,
      });

      return isHealthy;
    } catch (error) {
      logger.warn('Health check failed', {
        endpoint: credentials.endpoint,
        panelType: credentials.panelType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return false;
    }
  }
}

export const proxyEngine = new ProxyEngine({
  timeout: panelConfig.onePanel.defaultTimeout,
  retryAttempts: panelConfig.onePanel.retryAttempts,
  retryDelay: 1000,
  validateSsl: false,
});