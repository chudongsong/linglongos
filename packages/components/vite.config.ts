import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@linglongos/components': resolve(__dirname, 'src'),
      '@linglongos/components/base': resolve(__dirname, 'src/components/base'),
      '@linglongos/components/functional': resolve(__dirname, 'src/components/functional'),
      '@linglongos/components/composables': resolve(__dirname, 'src/composables'),
      '@linglongos/components/utils': resolve(__dirname, 'src/utils'),
      '@linglongos/components/types': resolve(__dirname, 'src/types'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LinglongOSComponents',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'es.js' : 'js'}`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
})
