/**
 * 系统初始化相关的类型定义
 */

// 初始化步骤枚举
export enum SetupStep {
  TWO_FACTOR = 'two-factor',
  PANEL_BINDING = 'panel-binding', 
  COMPLETION = 'completion'
}

// 系统状态接口
export interface SystemStatus {
  hasTwoFA: boolean;
  hasPanel: boolean;
  hasValidSession: boolean;
  systemVersion: string;
  initializationRequired: boolean;
}

// 2FA绑定信息接口
export interface TwoFactorBindingInfo {
  secret: string;
  qrCodeUrl: string;
  backupCodes?: string[];
  expiresAt: number;
}

// 2FA确认请求接口
export interface TwoFactorConfirmRequest {
  secret: string;
  token: string;
}

// 2FA确认响应接口
export interface TwoFactorConfirmResponse {
  userId: string;
  bindingTime: number;
  nextStep: string;
}

// 面板绑定请求接口
export interface PanelBindingRequest {
  type: 'bt' | '1panel' | 'aaPanel';
  url: string;
  key: string;
}

// 面板绑定响应接口
export interface PanelBindingResponse {
  panelId: string;
  panelType: string;
  panelUrl: string;
  bindingTime: number;
  connectionStatus: string;
}

// 2FA验证请求接口
export interface TwoFactorVerifyRequest {
  token: string;
}

// 2FA验证响应接口
export interface TwoFactorVerifyResponse {
  sessionId: string;
  userId: string;
  loginTime: number;
  expiresAt: number;
  redirectUrl: string;
}

// Setup状态接口
export interface SetupState {
  currentStep: SetupStep;
  systemStatus: SystemStatus | null;
  twoFactorInfo: TwoFactorBindingInfo | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  qrCodeCountdown: number;
  pinInputs: string[];
  isStepCompleted: Record<SetupStep, boolean>;
}

// API错误响应接口
export interface ApiErrorResponse {
  status: number;
  message: string;
  data: {
    error: string;
    details?: string;
    retryAllowed?: boolean;
    remainingAttempts?: number;
    lockoutTime?: number;
  } | null;
  timestamp: number;
}

// 通用API响应接口
export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data: T;
  timestamp: number;
}