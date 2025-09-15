import axios, { AxiosRequestConfig } from 'axios';
import { PanelDetectionResult } from '@/types';
import { logger } from '@/utils/logger';

export interface DetectionStrategy {
  detect(endpoint: string, headers?: Record<string, string>): Promise<PanelDetectionResult>;
}

export class OnePanelDetector implements DetectionStrategy {
  async detect(endpoint: string, headers: Record<string, string> = {}): Promise<PanelDetectionResult> {
    try {
      const config: AxiosRequestConfig = {
        timeout: 5000,
        headers: {
          'User-Agent': 'API-Proxy-Service/1.0',
          ...headers,
        },
        validateStatus: () => true, // Accept all status codes
      };

      // 尝试通过检查常见端点来检测 1Panel
      const detectionEndpoints = [
        '/api/v1/auth/captcha',
        '/api/v1/auth/login',
        '/api/v1/system/info',
        '/api/v1',
      ];

      for (const path of detectionEndpoints) {
        try {
          const url = new URL(path, endpoint).toString();
          const response = await axios.get(url, config);
          
          // 检查响应头和内容以查找 1Panel 签名
          const serverHeader = response.headers['server']?.toLowerCase();
          const poweredBy = response.headers['x-powered-by']?.toLowerCase();
          
          // 检查 1Panel 特定指示器
          if (
            serverHeader?.includes('1panel') ||
            poweredBy?.includes('1panel') ||
            response.data?.toString().includes('1Panel') ||
            response.headers['x-panel-type']?.toLowerCase() === '1panel'
          ) {
            logger.debug('1Panel detected via headers/content', {
              endpoint,
              path,
              serverHeader,
              poweredBy,
            });

            return {
              panelType: 'onePanel',
              version: this.extractVersion(response.data, response.headers),
              capabilities: this.extractCapabilities(response.data),
            };
          }

          // 检查 1Panel 的典型 API 响应结构
          if (response.status === 200 && response.data) {
            const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            
            // 查找 1Panel 特定的 API 模式
            if (
              data.includes('"code":') ||
              data.includes('"success":') ||
              data.includes('"data":') ||
              (response.data && typeof response.data === 'object' && 'code' in response.data)
            ) {
              logger.debug('1Panel detected via API structure', {
                endpoint,
                path,
                responseStructure: typeof response.data,
              });

              return {
                panelType: 'onePanel',
                version: this.extractVersion(response.data, response.headers),
                capabilities: this.extractCapabilities(response.data),
              };
            }
          }
        } catch (error) {
          // 继续到下一个端点
          logger.debug('1Panel detection endpoint failed', {
            endpoint,
            path,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        panelType: 'unknown',
        capabilities: [],
      };
    } catch (error) {
      logger.error('1Panel detection failed:', error);
      return {
        panelType: 'unknown',
        capabilities: [],
      };
    }
  }

  private extractVersion(data: any, headers: Record<string, string>): string | undefined {
    // 尝试从头中提取版本
    const versionHeader = headers['x-panel-version'] || headers['x-1panel-version'];
    if (versionHeader) {
      return versionHeader;
    }

    // 尝试从响应数据中提取版本
    if (data && typeof data === 'object') {
      return data.version || data.app_version || data.build_version;
    }

    return undefined;
  }

  private extractCapabilities(data: any): string[] {
    const capabilities: string[] = [];
    
    if (data && typeof data === 'object') {
      // 在响应中查找能力指示器
      if (data.features || data.capabilities) {
        capabilities.push(...(data.features || data.capabilities));
      }
      
      // 根据可用端点推断能力
      if (data.endpoints) {
        capabilities.push('api_endpoints');
      }
    }

    return capabilities;
  }
}

export class BaotaDetector implements DetectionStrategy {
  async detect(endpoint: string, headers: Record<string, string> = {}): Promise<PanelDetectionResult> {
    try {
      const config: AxiosRequestConfig = {
        timeout: 5000,
        headers: {
          'User-Agent': 'API-Proxy-Service/1.0',
          ...headers,
        },
        validateStatus: () => true,
      };

      // 尝试通过检查常见端点来检测宝塔
      const detectionEndpoints = [
        '/login',
        '/api',
        '/bt',
        '/',
      ];

      for (const path of detectionEndpoints) {
        try {
          const url = new URL(path, endpoint).toString();
          const response = await axios.get(url, config);
          
          // 检查响应头和内容以查找宝塔签名
          const serverHeader = response.headers['server']?.toLowerCase();
          const poweredBy = response.headers['x-powered-by']?.toLowerCase();
          const contentType = response.headers['content-type']?.toLowerCase();
          
          // 检查宝塔特定指示器
          if (
            serverHeader?.includes('baota') ||
            serverHeader?.includes('bt') ||
            poweredBy?.includes('baota') ||
            response.data?.toString().includes('宝塔') ||
            response.data?.toString().includes('BT-Panel') ||
            response.data?.toString().includes('bt.cn')
          ) {
            logger.debug('Baota detected via headers/content', {
              endpoint,
              path,
              serverHeader,
              poweredBy,
            });

            return {
              panelType: 'baota',
              version: this.extractVersion(response.data, response.headers),
              capabilities: this.extractCapabilities(response.data),
            };
          }

          // 检查宝塔登录页面模式
          if (response.status === 200 && contentType?.includes('text/html')) {
            const htmlContent = response.data?.toString() || '';
            
            if (
              htmlContent.includes('宝塔面板') ||
              htmlContent.includes('bt-panel') ||
              htmlContent.includes('baota') ||
              htmlContent.includes('/static/bt_') ||
              htmlContent.includes('bt_login')
            ) {
              logger.debug('Baota detected via HTML content', {
                endpoint,
                path,
              });

              return {
                panelType: 'baota',
                version: this.extractVersion(response.data, response.headers),
                capabilities: this.extractCapabilities(response.data),
              };
            }
          }

          // Check for Baota API response patterns
          if (response.data && typeof response.data === 'object') {
            if (
              'status' in response.data ||
              'msg' in response.data ||
              'data' in response.data
            ) {
              // This could be Baota, but we need more confirmation
              logger.debug('Possible Baota API structure detected', {
                endpoint,
                path,
              });
            }
          }
        } catch (error) {
          logger.debug('Baota detection endpoint failed', {
            endpoint,
            path,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        panelType: 'unknown',
        capabilities: [],
      };
    } catch (error) {
      logger.error('Baota detection failed:', error);
      return {
        panelType: 'unknown',
        capabilities: [],
      };
    }
  }

  private extractVersion(data: any, headers: Record<string, string>): string | undefined {
    // 尝试从头中提取版本
    const versionHeader = headers['x-bt-version'] || headers['x-baota-version'];
    if (versionHeader) {
      return versionHeader;
    }

    // 尝试从响应数据中提取版本
    if (data && typeof data === 'object') {
      return data.version || data.panel_version || data.bt_version;
    }

    // Try to extract from HTML content
    if (typeof data === 'string') {
      const versionMatch = data.match(/版本[：:]\s*(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    }

    return undefined;
  }

  private extractCapabilities(data: any): string[] {
    const capabilities: string[] = [];
    
    // Default Baota capabilities
    capabilities.push('file_management', 'system_monitor', 'database_management');
    
    if (data && typeof data === 'object') {
      if (data.plugins || data.modules) {
        capabilities.push('plugin_support');
      }
    }

    return capabilities;
  }
}

export class PanelDetectionService {
  private detectors: DetectionStrategy[] = [
    new OnePanelDetector(),
    new BaotaDetector(),
  ];

  async detectPanelType(endpoint: string, headers?: Record<string, string>): Promise<PanelDetectionResult> {
    logger.info('Starting panel detection', { endpoint });

    // 验证端点格式
    try {
      new URL(endpoint);
    } catch (error) {
      logger.error('Invalid endpoint URL', { endpoint });
      return {
        panelType: 'unknown',
        capabilities: [],
      };
    }

    // 尝试每个检测器
    for (const detector of this.detectors) {
      try {
        const result = await detector.detect(endpoint, headers);
        
        if (result.panelType !== 'unknown') {
          logger.info('Panel detection successful', {
            endpoint,
            panelType: result.panelType,
            version: result.version,
            capabilities: result.capabilities,
          });
          
          return result;
        }
      } catch (error) {
        logger.warn('Detector failed', {
          detector: detector.constructor.name,
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.warn('Panel detection failed - unknown panel type', { endpoint });
    
    return {
      panelType: 'unknown',
      capabilities: [],
    };
  }

  async detectWithCache(endpoint: string, headers?: Record<string, string>, cacheTtl: number = 300): Promise<PanelDetectionResult> {
    // TODO: Implement caching logic
    // For now, just call detectPanelType directly
    return this.detectPanelType(endpoint, headers);
  }
}

export const panelDetectionService = new PanelDetectionService();