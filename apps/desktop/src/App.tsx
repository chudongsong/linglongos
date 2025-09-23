import { useEffect } from 'react'
import Desktop from '@features/desktop/Desktop'
import WindowManager from '@components/WindowManager'
import Dock from '@components/Dock'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

/**
 * App 根组件：负责应用级初始化（配置加载、主题变量预置等）
 */
function App() {
	useEffect(() => {
		// 后续：在这里完成配置拉取与全局状态初始化
	}, [])

	return (
		<DndProvider backend={HTML5Backend}>
			<div className="app-root">
				<Desktop />
				<WindowManager />
				<Dock />
			</div>
		</DndProvider>
	)
}

export default App
