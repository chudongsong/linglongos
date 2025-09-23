/**
 * useAppLauncher
 * 处理图标激活操作（双击/Enter/Space）：
 * - 若 target 为 URL 或 /path，则通过 WindowManager 打开（openWindow）
 * - 其他类型也统一派发 openWindow，交由 WindowManager 渲染
 */
import { useCallback } from 'react'
import { useAppDispatch } from '@store/index'
import { openWindow } from '@store/slices/window.slice'
import type { FullConfig, AppItem } from '@/types/config'

/**
 * 启动器 Hook：根据配置在交互时打开应用窗口
 * @param config 完整配置（可为空，表示尚未加载完成）
 */
export function useAppLauncher(config?: FullConfig | null) {
	const dispatch = useAppDispatch()

	/**
	 * 双击图标打开
	 * @param appId 应用 ID
	 */
	const handleIconDoubleClick = useCallback(
		(appId: string) => {
			const app: AppItem | undefined = config?.apps.find((a) => a.id === appId)
			const target = app?.action?.target
			if (typeof target === 'string' && /^(https?:\/\/|\/)/.test(target)) {
				if (app) dispatch(openWindow({ app }))
				return
			}
			if (app) dispatch(openWindow({ app }))
		},
		[config, dispatch],
	)

	/**
	 * 键盘可达性：Enter/Space 触发
	 * @param e 键盘事件
	 * @param id 应用 ID
	 */
	const handleIconKeyDown = useCallback(
		(e: React.KeyboardEvent, id: string) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				handleIconDoubleClick(id)
			}
		},
		[handleIconDoubleClick],
	)

	return { handleIconDoubleClick, handleIconKeyDown }
}
