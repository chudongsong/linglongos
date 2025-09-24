// Vitest 环境初始化：断言扩展与通用清理
// - 该文件在 vite.config.ts 的 test.setupFiles 中注册

import '@testing-library/jest-dom'
import { afterEach } from 'vitest'

/**
 * 注意：不在全局启用假定时器，避免 waitFor 等基于 setTimeout 的逻辑超时。
 * 如需使用假定时器，请在具体测试文件中调用 vi.useFakeTimers()/vi.useRealTimers()。
 */

/**
 * 每个测试后清理 DOM，避免跨用例污染
 */
afterEach(() => {
  document.body.innerHTML = ''
})