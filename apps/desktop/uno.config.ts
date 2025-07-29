import { defineConfig } from 'unocss'

export default defineConfig({
  // UnoCSS 配置
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
    },
  },
  shortcuts: {
    // 自定义快捷类
    'btn-base':
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'card-base': 'bg-white rounded-lg shadow-md border border-gray-200',
    window: 'backdrop-blur-lg bg-white/90 border border-white/20',
    'window-dark': 'backdrop-blur-lg bg-gray-800/90 border border-gray-600/20',
  },
})
