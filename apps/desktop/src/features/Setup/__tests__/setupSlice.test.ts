/**
 * Setup Slice 单元测试
 * 
 * 测试Redux状态管理的业务逻辑和状态变更
 */

import { describe, it, expect } from 'vitest';
import {
  validatePinInput,
  formatPinToToken,
  canProceedToStep
} from '../setupSlice';
import { SetupStep, type SetupState } from '@/types/setup';

describe('setupSlice 业务逻辑', () => {
  describe('validatePinInput', () => {
    it('应该验证有效的PIN输入', () => {
      const validPin = ['1', '2', '3', '4', '5', '6'];
      expect(validatePinInput(validPin)).toBe(true);
    });

    it('应该拒绝无效的PIN输入', () => {
      expect(validatePinInput(['1', '2', '3', '4', '5', ''])).toBe(false);
      expect(validatePinInput(['1', '2', '3', '4', '5', 'a'])).toBe(false);
      expect(validatePinInput(['1', '2', '3', '4', '5', '12'])).toBe(false);
    });
  });

  describe('formatPinToToken', () => {
    it('应该将PIN数组格式化为字符串', () => {
      const pin = ['1', '2', '3', '4', '5', '6'];
      expect(formatPinToToken(pin)).toBe('123456');
    });
  });

  describe('canProceedToStep', () => {
    const createMockState = (completedSteps: SetupStep[] = []): SetupState => ({
      currentStep: SetupStep.TWO_FACTOR,
      systemStatus: null,
      twoFactorInfo: null,
      isLoading: false,
      error: null,
      qrCodeCountdown: 0,
      pinInputs: ['', '', '', '', '', ''],
      isStepCompleted: {
        [SetupStep.TWO_FACTOR]: completedSteps.includes(SetupStep.TWO_FACTOR),
        [SetupStep.PANEL_BINDING]: completedSteps.includes(SetupStep.PANEL_BINDING),
        [SetupStep.COMPLETION]: completedSteps.includes(SetupStep.COMPLETION)
      }
    });

    it('应该允许进入第一步', () => {
      const state = createMockState();
      expect(canProceedToStep(SetupStep.TWO_FACTOR, state)).toBe(true);
    });

    it('应该在第一步完成后允许进入第二步', () => {
      const state = createMockState([SetupStep.TWO_FACTOR]);
      expect(canProceedToStep(SetupStep.PANEL_BINDING, state)).toBe(true);
    });

    it('应该在前两步完成后允许进入最后一步', () => {
      const state = createMockState([SetupStep.TWO_FACTOR, SetupStep.PANEL_BINDING]);
      expect(canProceedToStep(SetupStep.COMPLETION, state)).toBe(true);
    });

    it('不应该跳过步骤', () => {
      const state = createMockState();
      expect(canProceedToStep(SetupStep.PANEL_BINDING, state)).toBe(false);
      expect(canProceedToStep(SetupStep.COMPLETION, state)).toBe(false);
    });
  });
});