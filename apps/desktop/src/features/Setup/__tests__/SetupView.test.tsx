/**
 * SetupView 组件测试
 * 
 * 测试Setup视图组件的渲染和用户交互
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetupView from '../SetupView';
import { SetupStep } from '@/types/setup';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Link: () => <div data-testid="link-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />
}));

describe('SetupView', () => {
  const defaultProps = {
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
    },
    onGenerateTwoFactor: vi.fn(),
    onConfirmTwoFactor: vi.fn(),
    onBindPanel: vi.fn(),
    onVerifyTwoFactor: vi.fn(),
    onPinInputChange: vi.fn(),
    onClearError: vi.fn(),
    onRetry: vi.fn()
  };

  describe('渲染测试', () => {
    it('应该渲染系统初始化标题', () => {
      render(<SetupView {...defaultProps} />);
      
      expect(screen.getByText('系统初始化')).toBeInTheDocument();
    });

    it('应该显示正确的进度条', () => {
      render(<SetupView {...defaultProps} />);
      
      expect(screen.getByText('初始化进度')).toBeInTheDocument();
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('应该显示步骤指示器', () => {
      render(<SetupView {...defaultProps} />);
      
      // 检查步骤指示器是否存在
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('双因子认证步骤', () => {
    it('应该显示开始设置按钮', () => {
      render(<SetupView {...defaultProps} />);
      
      expect(screen.getByText('开始设置双因子认证')).toBeInTheDocument();
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument();
    });

    it('应该调用生成2FA函数', async () => {
      const user = userEvent.setup();
      const onGenerateTwoFactor = vi.fn();
      
      render(
        <SetupView 
          {...defaultProps} 
          onGenerateTwoFactor={onGenerateTwoFactor}
        />
      );
      
      const button = screen.getByText('开始设置双因子认证');
      await user.click(button);
      
      expect(onGenerateTwoFactor).toHaveBeenCalledOnce();
    });

    it('应该显示QR码和PIN输入框', () => {
      const twoFactorInfo = {
        secret: 'test-secret',
        qrCodeUrl: 'data:image/png;base64,test',
        expiresAt: Date.now() + 300000
      };

      render(
        <SetupView 
          {...defaultProps} 
          twoFactorInfo={twoFactorInfo}
          qrCodeCountdown={300}
        />
      );
      
      expect(screen.getByAltText('2FA QR Code')).toBeInTheDocument();
      expect(screen.getByText('二维码有效期：5:00')).toBeInTheDocument();
      
      // 应该有6个PIN输入框
      const pinInputs = screen.getAllByPlaceholderText('0');
      expect(pinInputs).toHaveLength(6);
    });

    it('应该处理PIN输入变化', async () => {
      const user = userEvent.setup();
      const onPinInputChange = vi.fn();
      const twoFactorInfo = {
        secret: 'test-secret',
        qrCodeUrl: 'data:image/png;base64,test',
        expiresAt: Date.now() + 300000
      };

      render(
        <SetupView 
          {...defaultProps} 
          twoFactorInfo={twoFactorInfo}
          onPinInputChange={onPinInputChange}
        />
      );
      
      const firstInput = screen.getAllByPlaceholderText('0')[0];
      expect(firstInput).toBeDefined();
      await user.type(firstInput!, '1');
      
      expect(onPinInputChange).toHaveBeenCalledWith(0, '1');
    });

    it('应该在PIN完整时启用确认按钮', () => {
      const twoFactorInfo = {
        secret: 'test-secret',
        qrCodeUrl: 'data:image/png;base64,test',
        expiresAt: Date.now() + 300000
      };

      render(
        <SetupView 
          {...defaultProps} 
          twoFactorInfo={twoFactorInfo}
          pinInputs={['1', '2', '3', '4', '5', '6']}
        />
      );
      
      const confirmButton = screen.getByText('确认绑定');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('面板绑定步骤', () => {
    it('应该显示面板类型选择', () => {
      render(
        <SetupView 
          {...defaultProps} 
          currentStep={SetupStep.PANEL_BINDING}
        />
      );
      
      expect(screen.getByText('宝塔面板')).toBeInTheDocument();
      expect(screen.getByText('1Panel')).toBeInTheDocument();
      expect(screen.getByText('aaPanel')).toBeInTheDocument();
    });

    it('应该显示URL和密钥输入框', () => {
      render(
        <SetupView 
          {...defaultProps} 
          currentStep={SetupStep.PANEL_BINDING}
        />
      );
      
      expect(screen.getByLabelText('面板地址')).toBeInTheDocument();
      expect(screen.getByLabelText('API密钥')).toBeInTheDocument();
    });

    it('应该处理面板类型选择', async () => {
      const user = userEvent.setup();
      
      render(
        <SetupView 
          {...defaultProps} 
          currentStep={SetupStep.PANEL_BINDING}
        />
      );
      
      const onePanelRadio = screen.getByDisplayValue('1panel');
      await user.click(onePanelRadio);
      
      expect(onePanelRadio).toBeChecked();
    });
  });

  describe('完成步骤', () => {
    it('应该显示完成图标和消息', () => {
      render(
        <SetupView 
          {...defaultProps} 
          currentStep={SetupStep.COMPLETION}
        />
      );
      
      expect(screen.getByText('系统初始化即将完成')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('应该显示最终验证的PIN输入', () => {
      render(
        <SetupView 
          {...defaultProps} 
          currentStep={SetupStep.COMPLETION}
        />
      );
      
      const pinInputs = screen.getAllByPlaceholderText('0');
      expect(pinInputs).toHaveLength(6);
      
      const completeButton = screen.getByText('完成初始化');
      expect(completeButton).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该显示错误提示', () => {
      const error = {
        status: 400,
        message: '验证码错误',
        data: { error: '验证码错误', retryAllowed: true },
        timestamp: Date.now()
      };

      render(
        <SetupView 
          {...defaultProps} 
          error={error}
        />
      );
      
      expect(screen.getByText('验证码错误')).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
      expect(screen.getByText('忽略')).toBeInTheDocument();
    });

    it('应该调用错误处理函数', async () => {
      const user = userEvent.setup();
      const onClearError = vi.fn();
      const onRetry = vi.fn();
      const error = {
        status: 400,
        message: '验证码错误',
        data: { error: '验证码错误', retryAllowed: true },
        timestamp: Date.now()
      };

      render(
        <SetupView 
          {...defaultProps} 
          error={error}
          onClearError={onClearError}
          onRetry={onRetry}
        />
      );
      
      await user.click(screen.getByText('忽略'));
      expect(onClearError).toHaveBeenCalledOnce();
      
      await user.click(screen.getByText('重试'));
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      render(
        <SetupView 
          {...defaultProps} 
          isLoading
        />
      );
      
      expect(screen.getByText('生成中...')).toBeInTheDocument();
    });

    it('应该在加载时禁用按钮', () => {
      render(
        <SetupView 
          {...defaultProps} 
          isLoading
        />
      );
      
      const button = screen.getByText('生成中...');
      expect(button).toBeDisabled();
    });
  });
});