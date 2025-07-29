/**
 * 简单的二维码生成工具
 * 注意：这是一个简化版实现，实际项目中建议使用成熟的库如 qrcode.js
 */

interface QRCodeOptions {
  /** Canvas 元素 */
  canvas: HTMLCanvasElement
  /** 二维码内容 */
  text: string
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 前景色 */
  colorDark?: string
  /** 背景色 */
  colorLight?: string
  /** 纠错级别 */
  correctLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * 生成二维码
 * 简化版实现，实际项目中应使用成熟的二维码库
 */
export function generateQRCode(options: QRCodeOptions): void {
  const { canvas, text, width, height, colorDark = '#000000', colorLight = '#FFFFFF' } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 清空画布
  ctx.fillStyle = colorLight
  ctx.fillRect(0, 0, width, height)

  // 在实际项目中，这里应该调用二维码生成算法
  // 以下是一个简单的占位实现，绘制一个假的二维码样式

  // 设置二维码区域大小（留出边距）
  const margin = width * 0.1
  const qrSize = width - margin * 2
  const cellSize = Math.floor(qrSize / 25) // 假设25x25的二维码

  ctx.fillStyle = colorDark

  // 绘制定位图案（左上角）
  drawPositionPattern(ctx, margin, margin, cellSize * 7)

  // 绘制定位图案（右上角）
  drawPositionPattern(ctx, width - margin - cellSize * 7, margin, cellSize * 7)

  // 绘制定位图案（左下角）
  drawPositionPattern(ctx, margin, height - margin - cellSize * 7, cellSize * 7)

  // 绘制一些随机的二维码数据点
  ctx.fillStyle = colorDark
  const dataAreaSize = qrSize - cellSize * 14 // 减去定位图案的空间
  const dataStartX = margin + cellSize * 7
  const dataStartY = margin + cellSize * 7

  // 使用文本的哈希值来生成一些看起来随机但确定的点
  const hash = simpleHash(text)

  for (let i = 0; i < dataAreaSize / cellSize; i++) {
    for (let j = 0; j < dataAreaSize / cellSize; j++) {
      // 使用哈希值和位置来决定是否绘制点
      if ((hash + i * 3 + j * 7) % 5 < 2) {
        ctx.fillRect(
          dataStartX + i * cellSize,
          dataStartY + j * cellSize,
          cellSize - 1,
          cellSize - 1
        )
      }
    }
  }
}

/**
 * 绘制二维码定位图案
 */
function drawPositionPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  const cellSize = size / 7

  // 外层方块
  ctx.fillRect(x, y, size, size)

  // 中间白色方块
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x + cellSize, y + cellSize, size - cellSize * 2, size - cellSize * 2)

  // 内层黑色方块
  ctx.fillStyle = '#000000'
  ctx.fillRect(x + cellSize * 2, y + cellSize * 2, size - cellSize * 4, size - cellSize * 4)
}

/**
 * 简单的字符串哈希函数
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // 转换为32位整数
  }
  return Math.abs(hash)
}
