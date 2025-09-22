// Vite环境变量类型定义
interface ImportMetaEnv {
	readonly VITE_APP_TITLE?: string
	readonly VITE_API_BASE_URL?: string
	readonly VITE_APP_VERSION?: string
	readonly VITE_APP_ENV?: 'development' | 'production' | 'test'
	// 更多环境变量...
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

// 模块声明 - 静态资源
declare module '*.svg' {
	const content: string
	export default content
}

declare module '*.svg?react' {
	const ReactComponent: any
	export default ReactComponent
}

declare module '*.svg?url' {
	const content: string
	export default content
}

declare module '*.png' {
	const content: string
	export default content
}

declare module '*.jpg' {
	const content: string
	export default content
}

declare module '*.jpeg' {
	const content: string
	export default content
}

declare module '*.gif' {
	const content: string
	export default content
}

declare module '*.webp' {
	const content: string
	export default content
}

declare module '*.ico' {
	const content: string
	export default content
}

declare module '*.bmp' {
	const content: string
	export default content
}

// 样式文件模块声明
declare module '*.css' {
	const content: Record<string, string>
	export default content
}

declare module '*.scss' {
	const content: Record<string, string>
	export default content
}

declare module '*.sass' {
	const content: Record<string, string>
	export default content
}

declare module '*.less' {
	const content: Record<string, string>
	export default content
}

declare module '*.styl' {
	const content: Record<string, string>
	export default content
}

declare module '*.stylus' {
	const content: Record<string, string>
	export default content
}

// JSON文件模块声明
declare module '*.json' {
	const content: any
	export default content
}

// 全局类型定义
declare global {
	// 窗口对象扩展
	interface Window {
		__APP_VERSION__?: string
		__DEV__?: boolean
	}

	// 全局命名空间
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production' | 'test'
		}
	}
}

// 工具类型定义
export type Prettify<T> = {
	[K in keyof T]: T[K]
} & {}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredKeys<T> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? never : K
}[keyof T]

export type OptionalKeys<T> = {
	[K in keyof T]-?: {} extends Pick<T, K> ? K : never
}[keyof T]

// 导出空对象以确保这是一个模块
export {}