import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from '@/routes'

/**
 * App 根组件
 *
 * 负责应用级初始化（例如：首屏配置加载、主题变量预置），并提供路由管理。
 * 当前实现为最小可用版本，后续可以在 `useEffect` 中补充配置拉取与全局状态初始化逻辑。
 *
 * @remarks
 * - 通过 `RouterProvider` 提供路由管理，根据系统状态显示不同页面。
 * - 路由守卫会自动检查系统初始化状态并重定向到相应页面。
 *
 * @returns 应用根节点的 JSX 结构
 */
function App() {
	useEffect(() => {
		// 后续：在这里完成配置拉取与全局状态初始化
	}, [])

	return <RouterProvider router={router} />
}

export default App
