/**
 * useBackgroundStyle
 * 根据配置计算桌面背景样式对象。
 */
import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import type { FullConfig } from '@/types/config'

/**
 * 背景样式计算 Hook
 * @param config 完整配置（可为空）
 * @returns CSSProperties 样式对象
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
