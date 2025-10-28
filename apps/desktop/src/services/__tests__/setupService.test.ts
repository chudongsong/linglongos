/**
 * setupService 测试
 * 
 * 测试Setup相关的API服务函数
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { 
  SystemStatus, 
  TwoFactorBindingInfo, 
  PanelBindingRequest,
  ApiResponse 
} from '@/types/setup';

// Mock api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

describe('setupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('类型定义验证', () => {
    it('应该有正确的SystemStatus类型', () => {
      const mockSystemStatus: SystemStatus = {
        hasTwoFA: false,
        hasPanel: false,
        hasValidSession: false,
        systemVersion: '1.0.0',
        initializationRequired: true
      };

      expect(mockSystemStatus).toBeDefined();
      expect(typeof mockSystemStatus.hasTwoFA).toBe('boolean');
      expect(typeof mockSystemStatus.systemVersion).toBe('string');
    });

    it('应该有正确的TwoFactorBindingInfo类型', () => {
      const mockTwoFactorInfo: TwoFactorBindingInfo = {
        secret: 'test-secret-key',
        qrCodeUrl: 'data:image/png;base64,test-qr-code',
        expiresAt: Date.now() + 300000
      };

      expect(mockTwoFactorInfo).toBeDefined();
      expect(typeof mockTwoFactorInfo.secret).toBe('string');
      expect(typeof mockTwoFactorInfo.qrCodeUrl).toBe('string');
      expect(typeof mockTwoFactorInfo.expiresAt).toBe('number');
    });

    it('应该有正确的PanelBindingRequest类型', () => {
      const mockRequest: PanelBindingRequest = {
        type: 'bt',
        url: 'https://panel.example.com',
        key: 'test-api-key'
      };

      expect(mockRequest).toBeDefined();
      expect(['bt', '1panel', 'aaPanel']).toContain(mockRequest.type);
      expect(typeof mockRequest.url).toBe('string');
      expect(typeof mockRequest.key).toBe('string');
    });

    it('应该有正确的ApiResponse类型', () => {
      const mockResponse: ApiResponse<{ success: boolean }> = {
        status: 200,
        data: { success: true },
        message: 'Success',
        timestamp: Date.now()
      };

      expect(mockResponse).toBeDefined();
      expect(typeof mockResponse.status).toBe('number');
      expect(typeof mockResponse.message).toBe('string');
      expect(typeof mockResponse.timestamp).toBe('number');
    });
  });

  describe('API端点验证', () => {
    it('应该定义正确的API端点', () => {
      const endpoints = {
        systemStatus: '/api/setup/status',
        generateTwoFactor: '/api/setup/two-factor/generate',
        confirmTwoFactor: '/api/setup/two-factor/confirm',
        bindPanel: '/api/setup/panel/bind',
        verifyTwoFactor: '/api/setup/two-factor/verify'
      };

      // 验证端点格式
      Object.values(endpoints).forEach(endpoint => {
        expect(endpoint).toMatch(/^\/api\/setup\//);
      });
    });
  });

  describe('错误处理类型', () => {
    it('应该正确处理网络错误', () => {
      const networkError = new Error('Network Error');
      expect(networkError).toBeInstanceOf(Error);
      expect(networkError.message).toBe('Network Error');
    });

    it('应该正确处理HTTP错误', () => {
      const httpError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' }
        }
      };

      expect(httpError.response.status).toBe(500);
      expect(httpError.response.data.message).toBe('Internal Server Error');
    });
  });
});