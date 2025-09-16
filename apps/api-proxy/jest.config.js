export default {
	preset: 'ts-jest/presets/default-esm',
	testEnvironment: 'node',
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/*.test.ts', '!src/index.ts'],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
}
