import js from '@eslint/js'
import prettierRules from 'eslint-config-prettier' // eslint插件 prettier
import turboPlugin from 'eslint-plugin-turbo' // eslint插件 turbo
import tseslint from 'typescript-eslint' // eslint插件 类型检查
import onlyWarn from 'eslint-plugin-only-warn' // eslint插件 只警告
import reactPlugin from 'eslint-plugin-react' // eslint插件 react
import reactHooksPlugin from 'eslint-plugin-react-hooks' // eslint插件 react-hooks
import globals from 'globals'

// React 专用的 ESLint 配置
export default tseslint.config([
	// 配置需要忽略的文件
	{
		ignores: ['node_modules', 'dist', 'build', '.next', 'coverage'],
	},
	// 基础配置
	js.configs.recommended,
	...tseslint.configs.recommended,
	// React 配置
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': reactHooksPlugin,
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.es2020,
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				ecmaVersion: 'latest',
				sourceType: 'module',
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			// React 基础规则
			'react/jsx-uses-react': 'error',
			'react/jsx-uses-vars': 'error',
			'react/jsx-key': 'error',
			'react/jsx-no-duplicate-props': 'error',
			'react/jsx-no-undef': 'error',
			'react/no-children-prop': 'error',
			'react/no-danger-with-children': 'error',
			'react/no-deprecated': 'error',
			'react/no-direct-mutation-state': 'error',
			'react/no-find-dom-node': 'error',
			'react/no-is-mounted': 'error',
			'react/no-render-return-value': 'error',
			'react/no-string-refs': 'error',
			'react/no-unescaped-entities': 'error',
			'react/no-unknown-property': 'error',
			'react/prop-types': 'off', // 使用 TypeScript 替代
			'react/react-in-jsx-scope': 'off', // React 17+ 不需要导入 React

			// React Hooks 规则
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// JSX 样式规则
			'react/jsx-boolean-value': ['error', 'never'],
			'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
			'react/jsx-fragments': ['error', 'syntax'],
			'react/jsx-no-useless-fragment': 'error',
			'react/jsx-pascal-case': 'error',
			'react/self-closing-comp': 'error',

			// 性能相关规则
			'react/jsx-no-bind': ['warn', { allowArrowFunctions: true }],
			'react/no-array-index-key': 'warn',
		},
	},
	// 配置 turbo 的 eslint 规则
	{
		plugins: {
			turbo: turboPlugin,
		},
		rules: {
			'turbo/no-undeclared-env-vars': 'warn',
		},
	},
	// 配置 only-warn 的 eslint 规则
	{
		plugins: {
			onlyWarn,
		},
	},
	// 修复 TypeScript-ESLint 的 no-unused-expressions 规则问题
	{
		rules: {
			'@typescript-eslint/no-unused-expressions': [
				'error',
				{
					allowShortCircuit: true,
					allowTernary: true,
					allowTaggedTemplates: true,
				},
			],
			// TypeScript 与 React 结合的规则
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
		},
	},
	// 配置 prettier 的 eslint 规则（放在最后以覆盖冲突规则）
	prettierRules,
])
