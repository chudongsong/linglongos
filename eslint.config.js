import baseConfig from './env/eslint/src/index.js'
import vueConfig from './env/eslint/src/vue.js'
import vitestConfig from './env/eslint/src/vitest.js'

/**
 * ESLint 配置
 * 使用统一的环境配置库
 */
export default [
  // 基础配置
  ...baseConfig,
  
  // Vue 配置
  ...vueConfig,
  
  // Vitest 配置
  ...vitestConfig,
  
  // 项目特定配置
  {
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always',
          },
        },
      ],
      'vue/max-attributes-per-line': [
        'error',
        {
          singleline: 3,
          multiline: 1,
        },
      ],

      // TypeScript 相关规则
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 通用规则
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      'no-trailing-spaces': 'error',
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-spacing': ['error', { before: true, after: true }],
    },
  },
  
  // 测试文件特殊配置
   {
     files: ['**/__tests__/*.{j,t}s?(x)', '**/tests/unit/**/*.spec.{j,t}s?(x)'],
     rules: {
       'no-undef': 'off',
     },
   },
 ]
