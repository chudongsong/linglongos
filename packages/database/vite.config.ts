import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'LinglongOSDatabase',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'es.js' : 'js'}`,
    },
    rollupOptions: {
      external: ['dexie', 'localforage'],
      output: {
        globals: {
          dexie: 'Dexie',
          localforage: 'localforage',
        },
      },
    },
  },
})
