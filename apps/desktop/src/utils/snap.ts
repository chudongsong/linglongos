/**
 * 吸附与网格工具函数
 *
 * 提供窗口拖拽与缩放时的对齐、网格吸附与窗口间吸附能力。
 * 与 UI 解耦，便于在组件与 hooks 中复用与进行单元测试。
 */

/** 吸附阈值（像素），当偏差小于等于该阈值时触发吸附 */
/** 吸附触发的偏差阈值（像素） */
export const SNAP_THRESHOLD = 12

/** 网格尺寸（像素），用于网格吸附与对齐 */
/** 网格基础尺寸（像素），用于网格吸附与对齐计算 */
export const GRID_SIZE = 8

/**
 * 计算接近目标的吸附
 * @param value 当前值
 * @param targets 目标位置数组
 * @param threshold 吸附阈值（像素）
 * @returns 包含吸附后的值与可选的引导线坐标；若未命中阈值返回原值与 null
 */
export function snapTo(value: number, targets: number[], threshold: number): { value: number; guide: number | null } {
  let snapped = value
  let guide: number | null = null
  let bestDelta = Infinity
  for (const t of targets) {
    const d = Math.abs(value - t)
    if (d <= threshold && d < bestDelta) {
      bestDelta = d
      snapped = t
      guide = t
    }
  }
  return { value: snapped, guide }
}

/**
 * 将值吸附到最近的网格点（可选阈值）
 * @param value 当前值
 * @param grid 网格尺寸
 * @param threshold 吸附阈值（像素）
 * @returns 若在阈值内则返回最近网格点，否则返回原值
 */
export function snapToGrid(value: number, grid: number, threshold: number): number {
  const nearest = Math.round(value / grid) * grid
  if (Math.abs(value - nearest) <= threshold) return nearest
  return value
}

/**
 * 计算拖拽时 X 轴相对其他窗口的最佳吸附
 * - 尝试让 “left / right / centerX” 分别对齐到 targets 中任意一条线
 * - 选择位移量（绝对值）最小且在阈值内的一种
 * @param left 当前窗口左侧坐标
 * @param width 当前窗口宽度
 * @param targets X 轴目标线集合
 * @param threshold 吸附阈值（像素）
 * @returns 最佳吸附后的 left 与引导线以及是否命中；若无命中则返回原位与 hit=false
 */
export function computeBestSnapX(
  left: number,
  width: number,
  targets: number[],
  threshold: number,
): { left: number; guide: number | null; hit: boolean } | null {
  const centerX = left + width / 2
  const right = left + width
  const c = snapTo(centerX, targets, threshold)
  const l = snapTo(left, targets, threshold)
  const r = snapTo(right, targets, threshold)

  const candidates: Array<{ move: number; left: number; guide: number | null }> = []
  if (c.value !== centerX) candidates.push({ move: Math.abs(c.value - centerX), left: Math.round(c.value - width / 2), guide: c.guide })
  if (l.value !== left) candidates.push({ move: Math.abs(l.value - left), left: l.value, guide: l.guide })
  if (r.value !== right) candidates.push({ move: Math.abs(r.value - right), left: left + (r.value - right), guide: r.guide })

  if (!candidates.length) return { left, guide: null, hit: false }
  candidates.sort((a, b) => a.move - b.move)
  const best = candidates[0]!
  /* c8 ignore next */
  return { left: best.left, guide: best.guide ?? null, hit: true }
}

/**
 * 计算拖拽时 Y 轴相对其他窗口的最佳吸附
 * - 尝试让 “top / bottom / centerY” 分别对齐到 targets 中任意一条线
 * - 选择位移量（绝对值）最小且在阈值内的一种
 * @param top 当前窗口顶部坐标
 * @param height 当前窗口高度
 * @param targets Y 轴目标线集合
 * @param threshold 吸附阈值（像素）
 * @returns 最佳吸附后的 top 与引导线以及是否命中；若无命中则返回原位与 hit=false
 */
export function computeBestSnapY(
  top: number,
  height: number,
  targets: number[],
  threshold: number,
): { top: number; guide: number | null; hit: boolean } | null {
  const centerY = top + height / 2
  const bottom = top + height
  const c = snapTo(centerY, targets, threshold)
  const t = snapTo(top, targets, threshold)
  const b = snapTo(bottom, targets, threshold)

  const candidates: Array<{ move: number; top: number; guide: number | null }> = []
  if (c.value !== centerY) candidates.push({ move: Math.abs(c.value - centerY), top: Math.round(c.value - height / 2), guide: c.guide })
  if (t.value !== top) candidates.push({ move: Math.abs(t.value - top), top: t.value, guide: t.guide })
  if (b.value !== bottom) candidates.push({ move: Math.abs(b.value - bottom), top: top + (b.value - bottom), guide: b.guide })

  if (!candidates.length) return { top, guide: null, hit: false }
  candidates.sort((a, b) => a.move - b.move)
  const best = candidates[0]!
  /* c8 ignore next */
  return { top: best.top, guide: best.guide ?? null, hit: true }
}