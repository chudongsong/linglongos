/**
 * ESLint 配置文件模板
 * 用于统一项目的代码风格和质量
 */

module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'vue', 'prettier'],
  rules: {
    // 基本规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',

    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/no-v-html': 'off',

    // 代码风格
    'prettier/prettier': 'warn',
    'arrow-body-style': ['warn', 'as-needed'],
    'prefer-arrow-callback': 'warn',
    'no-var': 'error',
    'prefer-const': 'warn',
    'object-shorthand': 'warn',
    'array-callback-return': 'error',
    'prefer-destructuring': 'warn',
    'prefer-template': 'warn',
    'prefer-rest-params': 'warn',
    'prefer-spread': 'warn',
    'no-useless-rename': 'warn',
    'no-useless-return': 'warn',
    'no-useless-concat': 'warn',
    'no-useless-constructor': 'warn',
    'no-useless-computed-key': 'warn',
    'no-useless-escape': 'warn',
    'no-duplicate-imports': 'error',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['../*'],
            message: '请使用相对路径或别名导入',
          },
        ],
      },
    ],

    // 命名规范
    camelcase: 'off',
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'memberLike',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE', 'PascalCase'],
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
        suffix: ['Type'],
      },
    ],
  },
  overrides: [
    {
      files: ['*.vue'],
      rules: {
        indent: 'off',
      },
    },
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/naming-convention': 'off',
      },
    },
    {
      files: ['*.js', '*.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}
