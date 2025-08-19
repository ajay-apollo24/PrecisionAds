module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/api'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage/api',
  setupFilesAfterEnv: ['<rootDir>/tests/api/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1, // Run API tests sequentially
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
}; 