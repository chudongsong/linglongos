/**
 * useBackgroundStyle
 * 根据配置计算桌面背景样式对象。
 */
import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import type { FullConfig } from '@/types/config'

/**
 * 背景样式计算 Hook。
 *
 * 根据配置的背景信息（图片或渐变）生成桌面根容器的内联样式对象。
 *
 * @param config 完整配置（可为空）
 * @returns `CSSProperties` 样式对象
 */
export function useBackgroundStyle(config?: FullConfig | null) {
	const backgroundStyle = useMemo<CSSProperties>(() => {
		const bg = config?.desktop?.background
		if (!bg) return {}
		if (bg.type === 'image' && bg.value) {
			return {
				backgroundImage: `url(${bg.value})`,
				backgroundSize: bg.size || 'cover',
				backgroundPosition: bg.position || 'center',
				backgroundRepeat: bg.repeat || 'no-repeat',
			}
		}
		if (bg.type === 'gradient' && bg.value) {
			return { background: bg.value }
		}
		return {}
	}, [config?.desktop?.background])

	return backgroundStyle
}
