/**
 * Setup模块的Controller组件
 * 负责协调View与Model的交互，处理用户行为与业务流程
 */

import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import SetupView from './SetupView';
import {
  loadSystemStatus,
  generateTwoFactorBinding,
  confirmTwoFactorBinding,
  bindPanel,
  verifyTwoFactor,
  updatePinInput,
  clearPinInputs,
  decrementQrCodeCountdown,
  clearError,
  validatePinInput,
  formatPinToToken
} from './setupSlice';
import { SetupStep } from '@/types/setup';

/**
 * Setup Controller组件
 * 管理系统初始化流程的状态和用户交互
 */
const SetupController: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // 从Redux store获取状态
  const {
    currentStep,
    systemStatus,
    twoFactorInfo,
    isLoading,
    error,
    qrCodeCountdown,
    pinInputs,
    isStepCompleted
  } = useAppSelector(state => state.setup);

  // 组件挂载时加载系统状态
  useEffect(() => {
    dispatch(loadSystemStatus());
  }, [dispatch]);

  // QR码倒计时处理
  useEffect(() => {
    if (qrCodeCountdown > 0) {
      const timer = setInterval(() => {
        dispatch(decrementQrCodeCountdown());
      }, 1000);

      return () => clearInterval(timer);
    }
    return undefined;
  }, [qrCodeCountdown, dispatch]);

  // 监听初始化完成状态
  useEffect(() => {
    if (isStepCompleted[SetupStep.COMPLETION]) {
      // 延迟跳转，让用户看到完成状态
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isStepCompleted, navigate]);

  // 生成双因子认证绑定信息
  const handleGenerateTwoFactor = useCallback(() => {
    dispatch(generateTwoFactorBinding());
  }, [dispatch]);

  // 确认双因子认证绑定
  const handleConfirmTwoFactor = useCallback(() => {
    if (!twoFactorInfo || !validatePinInput(pinInputs)) {
      return;
    }

    const token = formatPinToToken(pinInputs);
    dispatch(confirmTwoFactorBinding({
      secret: twoFactorInfo.secret,
      token
    }));
  }, [dispatch, twoFactorInfo, pinInputs]);

  // 绑定管理面板
  const handleBindPanel = useCallback((
    type: 'bt' | '1panel' | 'aaPanel',
    url: string,
    key: string
  ) => {
    dispatch(bindPanel({ type, url, key }));
  }, [dispatch]);

  // 验证双因子认证（完成步骤）
  const handleVerifyTwoFactor = useCallback(() => {
    if (!validatePinInput(pinInputs)) {
      return;
    }

    const token = formatPinToToken(pinInputs);
    dispatch(verifyTwoFactor({ token }));
  }, [dispatch, pinInputs]);

  // 处理PIN输入变化
  const handlePinInputChange = useCallback((index: number, value: string) => {
    dispatch(updatePinInput({ index, value }));

    // 自动聚焦到下一个输入框
    if (value && index < 5) {
      const nextInput = document.querySelector(
        `input[data-pin-index="${index + 1}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }, [dispatch]);

  // 清除错误
  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 重试操作
  const handleRetry = useCallback(() => {
    dispatch(clearError());
    dispatch(clearPinInputs());

    // 根据当前步骤重试相应操作
    switch (currentStep) {
      case SetupStep.TWO_FACTOR:
        if (twoFactorInfo) {
          // 如果已有2FA信息，重新生成
          dispatch(generateTwoFactorBinding());
        }
        break;
      case SetupStep.PANEL_BINDING:
        // 面板绑定失败时，用户需要重新填写表单
        break;
      case SetupStep.COMPLETION:
        // 完成步骤失败时，清空PIN输入让用户重新输入
        break;
      default:
        break;
    }
  }, [dispatch, currentStep, twoFactorInfo]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC键清除错误
      if (event.key === 'Escape' && error) {
        handleClearError();
      }

      // Enter键提交当前步骤
      if (event.key === 'Enter' && !isLoading) {
        switch (currentStep) {
          case SetupStep.TWO_FACTOR:
            if (twoFactorInfo && validatePinInput(pinInputs)) {
              handleConfirmTwoFactor();
            } else if (!twoFactorInfo) {
              handleGenerateTwoFactor();
            }
            break;
          case SetupStep.COMPLETION:
            if (validatePinInput(pinInputs)) {
              handleVerifyTwoFactor();
            }
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    error,
    isLoading,
    currentStep,
    twoFactorInfo,
    pinInputs,
    handleClearError,
    handleConfirmTwoFactor,
    handleGenerateTwoFactor,
    handleVerifyTwoFactor
  ]);

  // 添加PIN输入框的data属性以支持自动聚焦
  useEffect(() => {
    const inputs = document.querySelectorAll('input[type="text"][maxlength="1"]');
    inputs.forEach((input, index) => {
      input.setAttribute('data-pin-index', index.toString());
    });
  });

  return (
    <SetupView
      currentStep={currentStep}
      systemStatus={systemStatus}
      twoFactorInfo={twoFactorInfo}
      isLoading={isLoading}
      error={error}
      qrCodeCountdown={qrCodeCountdown}
      pinInputs={pinInputs}
      isStepCompleted={isStepCompleted}
      onGenerateTwoFactor={handleGenerateTwoFactor}
      onConfirmTwoFactor={handleConfirmTwoFactor}
      onBindPanel={handleBindPanel}
      onVerifyTwoFactor={handleVerifyTwoFactor}
      onPinInputChange={handlePinInputChange}
      onClearError={handleClearError}
      onRetry={handleRetry}
    />
  );
};

export default SetupController;