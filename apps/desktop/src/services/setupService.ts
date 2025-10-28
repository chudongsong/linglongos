/**
 * 系统初始化相关的API服务
 */

import api from './api';
import type {
  SystemStatus,
  TwoFactorBindingInfo,
  TwoFactorConfirmRequest,
  TwoFactorConfirmResponse,
  PanelBindingRequest,
  PanelBindingResponse,
  TwoFactorVerifyRequest,
  TwoFactorVerifyResponse,
  ApiResponse
} from '@/types/setup';

/**
 * 获取系统初始化状态
 * @returns Promise<SystemStatus> 系统状态信息
 */
export const getSystemStatus = async (): Promise<SystemStatus> => {
  const response = await api.get<ApiResponse<SystemStatus>>('/init/status');
  return response.data.data;
};

/**
 * 生成2FA绑定信息
 * @returns Promise<TwoFactorBindingInfo> 2FA绑定信息
 */
export const generateTwoFactorBinding = async (): Promise<TwoFactorBindingInfo> => {
  const response = await api.get<ApiResponse<TwoFactorBindingInfo>>('/auth/google-auth-bind');
  return response.data.data;
};

/**
 * 确认2FA绑定
 * @param request 2FA确认请求参数
 * @returns Promise<TwoFactorConfirmResponse> 确认响应
 */
export const confirmTwoFactorBinding = async (
  request: TwoFactorConfirmRequest
): Promise<TwoFactorConfirmResponse> => {
  const response = await api.post<ApiResponse<TwoFactorConfirmResponse>>(
    '/auth/google-auth-confirm',
    request
  );
  return response.data.data;
};

/**
 * 绑定管理面板
 * @param request 面板绑定请求参数
 * @returns Promise<PanelBindingResponse> 绑定响应
 */
export const bindPanel = async (
  request: PanelBindingRequest
): Promise<PanelBindingResponse> => {
  const response = await api.post<ApiResponse<PanelBindingResponse>>(
    '/proxy/bind-panel-key',
    request
  );
  return response.data.data;
};

/**
 * 2FA登录验证
 * @param request 2FA验证请求参数
 * @returns Promise<TwoFactorVerifyResponse> 验证响应
 */
export const verifyTwoFactor = async (
  request: TwoFactorVerifyRequest
): Promise<TwoFactorVerifyResponse> => {
  const response = await api.post<ApiResponse<TwoFactorVerifyResponse>>(
    '/auth/google-auth-verify',
    request
  );
  return response.data.data;
};