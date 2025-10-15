/**
 * useStyleVars
 * 输出桌面根容器所需的 CSS 变量样式，包含：
 * - 网格尺寸：width/height/gap/padding
 * - 主题变量：selection、icon 文本颜色与阴影
 * - 并合并背景样式
 */
import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import type { FullConfig } from '@/types/config'

/**
 * 计算根容器的样式变量。
 *
 * 合成 CSS 变量（网格、主题）与背景样式，用于桌面根容器的内联样式。
 *
 * @param params `{ config, grid, backgroundStyle }`
 * @returns `CSSProperties` 合成后的样式对象
 */
export function useStyleVars(params: {
	config?: FullConfig | null
	grid: { width: number; height: number; gap: number }
	backgroundStyle: CSSProperties
}) {
	const { config, grid, backgroundStyle } = params
	const styleVars = useMemo(() => {
		const theme = config?.desktop?.theme
		const vars = {
			'--grid-width': `${grid.width}px`,
			'--grid-height': `${grid.height}px`,
			'--grid-gap': `${grid.gap}px`,
			'--grid-padding': `${config?.desktop?.padding ?? 10}px`,
			'--selection-color': theme?.selectionColor ?? 'rgba(74, 144, 226, 0.3)',
			'--selection-border': theme?.selectionBorder ?? '#4a90e2',
			'--icon-text-color': theme?.iconTextColor ?? '#ffffff',
			'--icon-text-shadow': theme?.iconTextShadow ?? '1px 1px 2px rgba(0, 0, 0, 0.5)',
		}
		const style: CSSProperties = {
			padding: `${config?.desktop?.padding ?? 10}px`,
			...backgroundStyle,
		}
		// 将 CSS 变量对象合并到样式对象返回
		return { ...vars, ...style } as unknown as CSSProperties
	}, [grid.width, grid.height, grid.gap, config?.desktop?.padding, backgroundStyle, config?.desktop?.theme])

	return styleVars
}
