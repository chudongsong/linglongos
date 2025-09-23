import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		// 将 '@/xxx' 映射到项目 src 目录，替代繁琐的相对路径（如 ../../xxx）
		alias: {
			// 根据 tsconfig.app.json 的 paths 映射补齐所有别名
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@types': fileURLToPath(new URL('./src/types', import.meta.url)),
			'@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
			'@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
			'@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
			'@components': fileURLToPath(new URL('./src/components', import.meta.url)),
			'@features': fileURLToPath(new URL('./src/features', import.meta.url)),
			'@services': fileURLToPath(new URL('./src/services', import.meta.url)),
			'@store': fileURLToPath(new URL('./src/store', import.meta.url)),
		},
	},
})
