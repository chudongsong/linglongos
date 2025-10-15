import { useEffect } from 'react'
import Desktop from '@features/desktop/Desktop'
import WindowManager from '@components/WindowManager'
import Dock from '@components/Dock'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

/**
 * App 根组件
 *
 * 负责应用级初始化（例如：首屏配置加载、主题变量预置），并提供全局的 `react-dnd` 拖拽上下文。
 * 当前实现为最小可用版本，后续可以在 `useEffect` 中补充配置拉取与全局状态初始化逻辑。
 *
 * @remarks
 * - 通过 `DndProvider` 提供 HTML5 后端支持，供桌面图标与 Dock 等组件使用。
 * - 子组件包含 `Desktop`、`WindowManager` 与 `Dock`，共同组成桌面主界面。
 *
 * @returns 应用根节点的 JSX 结构
 */
function App() {
	useEffect(() => {
		// 后续：在这里完成配置拉取与全局状态初始化
	}, [])

	return (
		<DndProvider backend={HTML5Backend}>
			{/* 提供拖拽上下文（HTML5 Backend） */}
			<div className="app-root">
				<Desktop />
				<WindowManager />
				<Dock />
			</div>
		</DndProvider>
	)
}

export default App
