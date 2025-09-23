import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import App from '@/App.tsx'
import { store } from '@store/index'
import { loadingManager } from '@services/loadingManager'
import '@/tailwind.css'

/**
 * 应用入口：挂载 React 根节点
 * - 渐进式引入 Tailwind v4（仅 utilities/theme，禁用 preflight，避免重置影响现有 UI）
 */

// 启动前初始化加载管理器（样式/DOM 预检与进度推进）
void loadingManager.init()

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</StrictMode>,
)
