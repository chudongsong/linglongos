import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite 配置
 * @description 配置 Vue3 开发环境和构建选项
 */
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
			'@/views': fileURLToPath(new URL('./src/views', import.meta.url)),
			'@/stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
			'@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
			'@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
			'@/api': fileURLToPath(new URL('./src/api', import.meta.url)),
			'@/router': fileURLToPath(new URL('./src/router', import.meta.url)),
		},
	},
	server: {
		port: 3000,
		host: true,
		open: true,
	},
	build: {
		outDir: 'dist',
		sourcemap: false,
		minify: 'terser',
		rollupOptions: {
			output: {
				chunkFileNames: 'js/[name]-[hash].js',
				entryFileNames: 'js/[name]-[hash].js',
				assetFileNames: '[ext]/[name]-[hash].[ext]',
			},
		},
	},
})
