import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@linglongos/components': resolve(__dirname, '../../packages/components/src'),
      '@linglongos/utils': resolve(__dirname, '../../packages/utils/src'),
      '@linglongos/shared-types': resolve(__dirname, '../../packages/shared-types/src'),
      '@linglongos/services': resolve(__dirname, '../../packages/services/src'),
      '@linglongos/config': resolve(__dirname, '../../packages/config/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
