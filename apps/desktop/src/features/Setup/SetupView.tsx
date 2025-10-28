/**
 * Setup模块的View组件
 * 负责渲染系统初始化流程的UI界面
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, Shield, Link, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  SetupStep, 
  type SystemStatus, 
  type TwoFactorBindingInfo, 
  type ApiErrorResponse 
} from '@/types/setup';

// 步骤进度配置
const STEP_PROGRESS = {
  [SetupStep.TWO_FACTOR]: 33,
  [SetupStep.PANEL_BINDING]: 66,
  [SetupStep.COMPLETION]: 100
};

// 步骤标题配置
const STEP_TITLES = {
  [SetupStep.TWO_FACTOR]: '双因子认证设置',
  [SetupStep.PANEL_BINDING]: '管理面板绑定',
  [SetupStep.COMPLETION]: '初始化完成'
};

// 步骤描述配置
const STEP_DESCRIPTIONS = {
  [SetupStep.TWO_FACTOR]: '为您的账户设置双因子认证以增强安全性',
  [SetupStep.PANEL_BINDING]: '绑定您的服务器管理面板',
  [SetupStep.COMPLETION]: '系统初始化已完成，您可以开始使用'
};

interface SetupViewProps {
  currentStep: SetupStep;
  systemStatus: SystemStatus | null;
  twoFactorInfo: TwoFactorBindingInfo | null;
  isLoading: boolean;
  error: ApiErrorResponse | null;
  qrCodeCountdown: number;
  pinInputs: string[];
  isStepCompleted: Record<SetupStep, boolean>;
  onGenerateTwoFactor: () => void;
  onConfirmTwoFactor: () => void;
  onBindPanel: (type: 'bt' | '1panel' | 'aaPanel', url: string, key: string) => void;
  onVerifyTwoFactor: () => void;
  onPinInputChange: (index: number, value: string) => void;
  onClearError: () => void;
  onRetry: () => void;
}

/**
 * 步骤指示器组件
 */
const StepIndicator: React.FC<{
  currentStep: SetupStep;
  isStepCompleted: Record<SetupStep, boolean>;
}> = ({ currentStep, isStepCompleted }) => {
  const steps = [SetupStep.TWO_FACTOR, SetupStep.PANEL_BINDING, SetupStep.COMPLETION];
  
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = currentStep === step;
        const isCompleted = isStepCompleted[step];
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
              isCompleted 
                ? "bg-green-500 border-green-500 text-white" 
                : isActive 
                  ? "bg-blue-500 border-blue-500 text-white" 
                  : "bg-gray-100 border-gray-300 text-gray-500"
            )}>
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            
            {!isLast && (
              <div className={cn(
                "w-20 h-0.5 mx-4 transition-colors",
                isCompleted ? "bg-green-500" : "bg-gray-300"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * 错误提示组件
 */
const ErrorAlert: React.FC<{
  error: ApiErrorResponse;
  onClear: () => void;
  onRetry: () => void;
}> = ({ error, onClear, onRetry }) => (
  <Alert className="mb-6 border-red-200 bg-red-50">
    <AlertCircle className="h-4 w-4 text-red-600" />
    <AlertDescription className="text-red-800">
      <div className="flex items-center justify-between">
        <span>{error.message}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClear}>
            忽略
          </Button>
          {error.data?.retryAllowed && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              重试
            </Button>
          )}
        </div>
      </div>
    </AlertDescription>
  </Alert>
);

/**
 * 双因子认证步骤组件
 */
const TwoFactorStep: React.FC<{
  twoFactorInfo: TwoFactorBindingInfo | null;
  qrCodeCountdown: number;
  pinInputs: string[];
  isLoading: boolean;
  onGenerate: () => void;
  onConfirm: () => void;
  onPinInputChange: (index: number, value: string) => void;
}> = ({ 
  twoFactorInfo, 
  qrCodeCountdown, 
  pinInputs, 
  isLoading, 
  onGenerate, 
  onConfirm, 
  onPinInputChange 
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isPinComplete = pinInputs.every(pin => pin.length === 1);

  return (
    <div className="space-y-6">
      {!twoFactorInfo ? (
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600 mb-6">
            双因子认证可以为您的账户提供额外的安全保护。
            请点击下方按钮开始设置。
          </p>
          <Button onClick={onGenerate} disabled={isLoading}>
            {isLoading ? '生成中...' : '开始设置双因子认证'}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border inline-block">
              <img 
                src={twoFactorInfo.qrCodeUrl} 
                alt="2FA QR Code" 
                className="w-48 h-48"
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>二维码有效期：{formatTime(qrCodeCountdown)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                1. 使用认证器应用（如Google Authenticator、Microsoft Authenticator）扫描上方二维码
              </p>
              <p className="text-sm text-gray-600 mb-4">
                2. 输入认证器应用中显示的6位验证码
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              {pinInputs.map((pin, index) => (
                <Input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin}
                  onChange={(e) => onPinInputChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-lg font-mono"
                  placeholder="0"
                />
              ))}
            </div>

            <Button 
              onClick={onConfirm} 
              disabled={!isPinComplete || isLoading}
              className="w-full"
            >
              {isLoading ? '验证中...' : '确认绑定'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 面板绑定步骤组件
 */
const PanelBindingStep: React.FC<{
  isLoading: boolean;
  onBind: (type: 'bt' | '1panel' | 'aaPanel', url: string, key: string) => void;
}> = ({ isLoading, onBind }) => {
  const [selectedType, setSelectedType] = React.useState<'bt' | '1panel' | 'aaPanel'>('bt');
  const [url, setUrl] = React.useState('');
  const [key, setKey] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && key) {
      onBind(selectedType, url, key);
    }
  };

  const panelTypes = [
    { value: 'bt' as const, label: '宝塔面板', description: '支持宝塔Linux面板' },
    { value: '1panel' as const, label: '1Panel', description: '现代化的Linux服务器运维管理面板' },
    { value: 'aaPanel' as const, label: 'aaPanel', description: '宝塔面板国际版' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">
          绑定您的服务器管理面板，以便进行统一管理
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">面板类型</label>
          <div className="grid grid-cols-1 gap-3">
            {panelTypes.map((type) => (
              <label
                key={type.value}
                className={cn(
                  "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                  selectedType === type.value 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="panelType"
                  value={type.value}
                  checked={selectedType === type.value}
                  onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                  className="sr-only"
                />
                <div>
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="panel-url" className="block text-sm font-medium mb-2">
            面板地址
          </label>
          <Input
            id="panel-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-panel.example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="panel-key" className="block text-sm font-medium mb-2">
            API密钥
          </label>
          <Input
            id="panel-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="请输入面板API密钥"
            required
          />
        </div>

        <Button type="submit" disabled={!url || !key || isLoading} className="w-full">
          {isLoading ? '绑定中...' : '绑定面板'}
        </Button>
      </form>
    </div>
  );
};

/**
 * 完成步骤组件
 */
const CompletionStep: React.FC<{
  isLoading: boolean;
  onVerify: () => void;
  pinInputs: string[];
  onPinInputChange: (index: number, value: string) => void;
}> = ({ isLoading, onVerify, pinInputs, onPinInputChange }) => {
  const isPinComplete = pinInputs.every(pin => pin.length === 1);

  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
      <div>
        <h3 className="text-xl font-semibold mb-2">系统初始化即将完成</h3>
        <p className="text-gray-600">
          请输入双因子认证码以完成最后的验证步骤
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 justify-center">
          {pinInputs.map((pin, index) => (
            <Input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={pin}
              onChange={(e) => onPinInputChange(index, e.target.value)}
              className="w-12 h-12 text-center text-lg font-mono"
              placeholder="0"
            />
          ))}
        </div>

        <Button 
          onClick={onVerify} 
          disabled={!isPinComplete || isLoading}
          className="w-full"
        >
          {isLoading ? '验证中...' : '完成初始化'}
        </Button>
      </div>
    </div>
  );
};

/**
 * Setup主视图组件
 */
const SetupView: React.FC<SetupViewProps> = ({
  currentStep,
  systemStatus: _systemStatus,
  twoFactorInfo,
  isLoading,
  error,
  qrCodeCountdown,
  pinInputs,
  isStepCompleted,
  onGenerateTwoFactor,
  onConfirmTwoFactor,
  onBindPanel,
  onVerifyTwoFactor,
  onPinInputChange,
  onClearError,
  onRetry
}) => {
  const progress = STEP_PROGRESS[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">系统初始化</CardTitle>
            <CardDescription>
              {STEP_DESCRIPTIONS[currentStep]}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>初始化进度</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* 步骤指示器 */}
            <StepIndicator 
              currentStep={currentStep} 
              isStepCompleted={isStepCompleted} 
            />

            {/* 错误提示 */}
            {error && (
              <ErrorAlert 
                error={error} 
                onClear={onClearError} 
                onRetry={onRetry} 
              />
            )}

            {/* 当前步骤内容 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {STEP_TITLES[currentStep]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep === SetupStep.TWO_FACTOR && (
                  <TwoFactorStep
                    twoFactorInfo={twoFactorInfo}
                    qrCodeCountdown={qrCodeCountdown}
                    pinInputs={pinInputs}
                    isLoading={isLoading}
                    onGenerate={onGenerateTwoFactor}
                    onConfirm={onConfirmTwoFactor}
                    onPinInputChange={onPinInputChange}
                  />
                )}

                {currentStep === SetupStep.PANEL_BINDING && (
                  <PanelBindingStep
                    isLoading={isLoading}
                    onBind={onBindPanel}
                  />
                )}

                {currentStep === SetupStep.COMPLETION && (
                  <CompletionStep
                    isLoading={isLoading}
                    onVerify={onVerifyTwoFactor}
                    pinInputs={pinInputs}
                    onPinInputChange={onPinInputChange}
                  />
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupView;