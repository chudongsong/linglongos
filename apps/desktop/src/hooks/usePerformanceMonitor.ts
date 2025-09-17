/**
 * 性能监控Hook
 * @description 监控组件渲染性能和用户交互响应时间
 */

import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  /** 组件渲染时间 */
  renderTime: number;
  /** 交互响应时间 */
  interactionTime: number;
  /** 内存使用情况 */
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

interface UsePerformanceMonitorOptions {
  /** 是否启用性能监控 */
  enabled?: boolean;
  /** 性能数据回调 */
  onMetrics?: (metrics: PerformanceMetrics) => void;
  /** 组件名称，用于标识 */
  componentName?: string;
}

/**
 * 性能监控Hook
 * @param options 配置选项
 */
export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { enabled = true, onMetrics, componentName = 'Unknown' } = options;
  
  const renderStartRef = useRef<number>(0);
  const interactionStartRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    interactionTime: 0
  });

  // 开始渲染计时
  const startRenderTiming = useCallback(() => {
    if (!enabled) return;
    renderStartRef.current = performance.now();
  }, [enabled]);

  // 结束渲染计时
  const endRenderTiming = useCallback(() => {
    if (!enabled || renderStartRef.current === 0) return;
    
    const renderTime = performance.now() - renderStartRef.current;
    metricsRef.current.renderTime = renderTime;
    
    // 获取内存使用情况（如果支持）
    if ('memory' in performance) {
      const perfWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      metricsRef.current.memoryUsage = perfWithMemory.memory;
    }
    
    if (onMetrics) {
      onMetrics({ ...metricsRef.current });
    }
    
    // 在开发环境下输出性能信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
    
    renderStartRef.current = 0;
  }, [enabled, onMetrics, componentName]);

  // 开始交互计时
  const startInteractionTiming = useCallback(() => {
    if (!enabled) return;
    interactionStartRef.current = performance.now();
  }, [enabled]);

  // 结束交互计时
  const endInteractionTiming = useCallback(() => {
    if (!enabled || interactionStartRef.current === 0) return;
    
    const interactionTime = performance.now() - interactionStartRef.current;
    metricsRef.current.interactionTime = interactionTime;
    
    if (onMetrics) {
      onMetrics({ ...metricsRef.current });
    }
    
    // 在开发环境下输出性能信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} interaction time: ${interactionTime.toFixed(2)}ms`);
    }
    
    interactionStartRef.current = 0;
  }, [enabled, onMetrics, componentName]);

  // 组件挂载时开始计时
  useEffect(() => {
    startRenderTiming();
    return () => {
      endRenderTiming();
    };
  }, [startRenderTiming, endRenderTiming]);

  return {
    startRenderTiming,
    endRenderTiming,
    startInteractionTiming,
    endInteractionTiming,
    metrics: metricsRef.current
  };
}

/**
 * 简化的性能计时器Hook
 * @param label 计时器标签
 */
export function usePerformanceTimer(label: string) {
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current === 0) return;
    
    const duration = performance.now() - startTimeRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Timer] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    startTimeRef.current = 0;
    return duration;
  }, [label]);

  return { start, end };
}