import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from '@/App.tsx'
import { store } from '@store/index'
import { loadingManager } from '@services/loadingManager'
import '@/tailwind.css'

// 启动前初始化加载管理器（样式/DOM 预检与进度推进）
void loadingManager.init()

/**
 * 应用入口
 *
 * 在严格模式中创建 React 根节点并挂载应用，同时提供 Redux Provider。
 *
 * @remarks
 * - 在入口处调用 `loadingManager.init()` 以完成样式与 DOM 的预检，推进首屏进度。
 * - 真正完成配置加载后，应通过 `loadingManager.finishWithConfig(config)` 收尾并隐藏遮罩。
 */

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</StrictMode>,
)
