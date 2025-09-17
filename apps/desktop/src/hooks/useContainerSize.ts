/**
 * 容器尺寸监听Hook
 * @description 监听容器尺寸变化，用于响应式布局调整
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface ContainerSize {
  width: number;
  height: number;
}

interface UseContainerSizeOptions {
  /** 防抖延迟（毫秒） */
  debounceDelay?: number;
  /** 是否启用监听 */
  enabled?: boolean;
}

interface UseContainerSizeReturn {
  /** 容器尺寸 */
  size: ContainerSize;
  /** 容器引用 */
  ref: React.RefObject<HTMLDivElement | null>;
  /** 手动刷新尺寸 */
  refresh: () => void;
}

export function useContainerSize(options: UseContainerSizeOptions = {}): UseContainerSizeReturn {
  const {
    debounceDelay = 150,
    enabled = true
  } = options;

  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // 更新尺寸
  const updateSize = useCallback(() => {
    if (!containerRef.current) return;

    const { clientWidth, clientHeight } = containerRef.current;
    setSize(prevSize => {
      // 只有尺寸真正变化时才更新
      if (prevSize.width !== clientWidth || prevSize.height !== clientHeight) {
        return { width: clientWidth, height: clientHeight };
      }
      return prevSize;
    });
  }, []);

  // 防抖更新
  const debouncedUpdateSize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(updateSize, debounceDelay);
  }, [updateSize, debounceDelay]);

  // 手动刷新
  const refresh = useCallback(() => {
    updateSize();
  }, [updateSize]);

  // 监听尺寸变化
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    // 初始化尺寸
    updateSize();

    // 创建 ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdateSize();
    });

    // 开始观察
    resizeObserver.observe(container);

    // 监听窗口尺寸变化（备用方案）
    const handleWindowResize = () => {
      debouncedUpdateSize();
    };

    window.addEventListener('resize', handleWindowResize);

    // 清理函数
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, updateSize, debouncedUpdateSize]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    size,
    ref: containerRef,
    refresh
  };
}