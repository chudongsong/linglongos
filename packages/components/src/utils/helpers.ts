/**
 * 生成唯一ID
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: number | null = null

  return function (this: any, ...args: Parameters<T>): void {
    if (timer) {
      window.clearTimeout(timer)
    }

    timer = window.setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function (this: any, ...args: Parameters<T>): void {
    const now = Date.now()

    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 检查是否为移动设备
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 获取元素相对于视口的位置
 */
export function getElementPosition(el: HTMLElement): {
  top: number
  left: number
  right: number
  bottom: number
} {
  const rect = el.getBoundingClientRect()

  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
  }
}

/**
 * 检查点是否在元素内
 */
export function isPointInElement(x: number, y: number, el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()

  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, format = 'YYYY-MM-DD'): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  const pad = (num: number): string => num.toString().padStart(2, '0')

  return format
    .replace('YYYY', year.toString())
    .replace('MM', pad(month))
    .replace('DD', pad(day))
    .replace('HH', pad(hours))
    .replace('mm', pad(minutes))
    .replace('ss', pad(seconds))
}
