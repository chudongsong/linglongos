module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  plugins: ['vue', '@typescript-eslint'],
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
  overrides: [
    {
      files: ['**/*.spec.js', '**/*.spec.ts', '**/*.test.js', '**/*.test.ts'],
      env: {
        jest: true,
      },
      rules: {
        'no-undef': 'off',
      },
    },
  ],
}
