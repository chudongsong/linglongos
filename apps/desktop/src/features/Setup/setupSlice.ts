/**
 * Setup模块的Redux状态管理
 * 负责管理系统初始化流程的状态和业务逻辑
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  SetupStep,
  type SetupState,
  type SystemStatus,
  type TwoFactorBindingInfo,
  type TwoFactorConfirmRequest,
  type PanelBindingRequest,
  type TwoFactorVerifyRequest,
  type ApiErrorResponse
} from '@/types/setup';
import * as setupService from '@/services/setupService';

// 初始状态
const initialState: SetupState = {
  currentStep: SetupStep.TWO_FACTOR,
  systemStatus: null,
  twoFactorInfo: null,
  isLoading: false,
  error: null,
  qrCodeCountdown: 0,
  pinInputs: ['', '', '', '', '', ''],
  isStepCompleted: {
    [SetupStep.TWO_FACTOR]: false,
    [SetupStep.PANEL_BINDING]: false,
    [SetupStep.COMPLETION]: false
  }
};

// 异步操作：获取系统状态
export const loadSystemStatus = createAsyncThunk(
  'setup/loadSystemStatus',
  async (_, { rejectWithValue }) => {
    try {
      return await setupService.getSystemStatus();
    } catch (error: unknown) {
      // 只传递序列化的错误信息，避免Redux非序列化警告
      const isAxiosError = (err: unknown): err is { response?: { status?: number; data?: { message?: string; error?: string; details?: string } }; message?: string } => {
        return typeof err === 'object' && err !== null;
      };

      const serializedError: ApiErrorResponse = {
        status: isAxiosError(error) ? error.response?.status || 500 : 500,
        message: isAxiosError(error) ? (error.response?.data?.message || error.message || 'Network error') : 'Network error',
        data: isAxiosError(error) && error.response?.data ? {
          error: error.response.data.error || 'Unknown error',
          ...(error.response.data.details && { details: error.response.data.details })
        } : null,
        timestamp: Date.now()
      };
      return rejectWithValue(serializedError);
    }
  }
);

// 异步操作：生成2FA绑定信息
export const generateTwoFactorBinding = createAsyncThunk(
  'setup/generateTwoFactorBinding',
  async (_, { rejectWithValue }) => {
    try {
      return await setupService.generateTwoFactorBinding();
    } catch (error) {
      return rejectWithValue(error as ApiErrorResponse);
    }
  }
);

// 异步操作：确认2FA绑定
export const confirmTwoFactorBinding = createAsyncThunk(
  'setup/confirmTwoFactorBinding',
  async (request: TwoFactorConfirmRequest, { rejectWithValue }) => {
    try {
      return await setupService.confirmTwoFactorBinding(request);
    } catch (error) {
      return rejectWithValue(error as ApiErrorResponse);
    }
  }
);

// 异步操作：绑定管理面板
export const bindPanel = createAsyncThunk(
  'setup/bindPanel',
  async (request: PanelBindingRequest, { rejectWithValue }) => {
    try {
      return await setupService.bindPanel(request);
    } catch (error) {
      return rejectWithValue(error as ApiErrorResponse);
    }
  }
);

// 异步操作：2FA验证
export const verifyTwoFactor = createAsyncThunk(
  'setup/verifyTwoFactor',
  async (request: TwoFactorVerifyRequest, { rejectWithValue }) => {
    try {
      return await setupService.verifyTwoFactor(request);
    } catch (error) {
      return rejectWithValue(error as ApiErrorResponse);
    }
  }
);

// 业务逻辑：验证PIN输入
export const validatePinInput = (pinInputs: string[]): boolean => {
  return pinInputs.every(pin => pin.length === 1 && /^\d$/.test(pin));
};

// 业务逻辑：格式化PIN为6位字符串
export const formatPinToToken = (pinInputs: string[]): string => {
  return pinInputs.join('');
};

// 业务逻辑：检查步骤是否可以进行
export const canProceedToStep = (step: SetupStep, state: SetupState): boolean => {
  switch (step) {
    case SetupStep.TWO_FACTOR:
      return true;
    case SetupStep.PANEL_BINDING:
      return state.isStepCompleted[SetupStep.TWO_FACTOR];
    case SetupStep.COMPLETION:
      return state.isStepCompleted[SetupStep.TWO_FACTOR] && 
             state.isStepCompleted[SetupStep.PANEL_BINDING];
    default:
      return false;
  }
};

const setupSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    // 设置当前步骤
    setCurrentStep: (state, action: PayloadAction<SetupStep>) => {
      if (canProceedToStep(action.payload, state)) {
        state.currentStep = action.payload;
      }
    },

    // 更新PIN输入
    updatePinInput: (state, action: PayloadAction<{ index: number; value: string }>) => {
      const { index, value } = action.payload;
      if (index >= 0 && index < 6 && /^\d?$/.test(value)) {
        state.pinInputs[index] = value;
      }
    },

    // 清空PIN输入
    clearPinInputs: (state) => {
      state.pinInputs = ['', '', '', '', '', ''];
    },

    // 设置QR码倒计时
    setQrCodeCountdown: (state, action: PayloadAction<number>) => {
      state.qrCodeCountdown = action.payload;
    },

    // 减少QR码倒计时
    decrementQrCodeCountdown: (state) => {
      if (state.qrCodeCountdown > 0) {
        state.qrCodeCountdown -= 1;
      }
    },

    // 标记步骤完成
    markStepCompleted: (state, action: PayloadAction<SetupStep>) => {
      state.isStepCompleted[action.payload] = true;
    },

    // 清除错误
    clearError: (state) => {
      state.error = null;
    },

    // 重置状态
    resetSetup: (state) => {
      Object.assign(state, initialState);
    }
  },
  extraReducers: (builder) => {
    // 获取系统状态
    builder
      .addCase(loadSystemStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSystemStatus.fulfilled, (state, action: PayloadAction<SystemStatus>) => {
        state.isLoading = false;
        state.systemStatus = action.payload;
        
        // 根据系统状态设置步骤完成状态
        if (action.payload.hasTwoFA) {
          state.isStepCompleted[SetupStep.TWO_FACTOR] = true;
        }
        if (action.payload.hasPanel) {
          state.isStepCompleted[SetupStep.PANEL_BINDING] = true;
        }
        if (action.payload.hasValidSession) {
          state.isStepCompleted[SetupStep.COMPLETION] = true;
        }

        // 设置当前步骤
        if (!action.payload.hasTwoFA) {
          state.currentStep = SetupStep.TWO_FACTOR;
        } else if (!action.payload.hasPanel) {
          state.currentStep = SetupStep.PANEL_BINDING;
        } else if (!action.payload.hasValidSession) {
          state.currentStep = SetupStep.COMPLETION;
        }
      })
      .addCase(loadSystemStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiErrorResponse | null;
      });

    // 生成2FA绑定信息
    builder
      .addCase(generateTwoFactorBinding.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateTwoFactorBinding.fulfilled, (state, action: PayloadAction<TwoFactorBindingInfo>) => {
        state.isLoading = false;
        state.twoFactorInfo = action.payload;
        state.qrCodeCountdown = 300; // 5分钟倒计时
      })
      .addCase(generateTwoFactorBinding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiErrorResponse | null;
      });

    // 确认2FA绑定
    builder
      .addCase(confirmTwoFactorBinding.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmTwoFactorBinding.fulfilled, (state) => {
        state.isLoading = false;
        state.isStepCompleted[SetupStep.TWO_FACTOR] = true;
        state.currentStep = SetupStep.PANEL_BINDING;
        state.pinInputs = ['', '', '', '', '', ''];
      })
      .addCase(confirmTwoFactorBinding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiErrorResponse | null;
      });

    // 绑定管理面板
    builder
      .addCase(bindPanel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bindPanel.fulfilled, (state) => {
        state.isLoading = false;
        state.isStepCompleted[SetupStep.PANEL_BINDING] = true;
        state.currentStep = SetupStep.COMPLETION;
      })
      .addCase(bindPanel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiErrorResponse | null;
      });

    // 2FA验证
    builder
      .addCase(verifyTwoFactor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyTwoFactor.fulfilled, (state) => {
        state.isLoading = false;
        state.isStepCompleted[SetupStep.COMPLETION] = true;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as ApiErrorResponse | null;
      });
  }
});

export const {
  setCurrentStep,
  updatePinInput,
  clearPinInputs,
  setQrCodeCountdown,
  decrementQrCodeCountdown,
  markStepCompleted,
  clearError,
  resetSetup
} = setupSlice.actions;

export default setupSlice.reducer;