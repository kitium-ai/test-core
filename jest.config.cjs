const baseJestConfig = require('@kitiumai/config/jest.config.base.cjs');

module.exports = {
  ...baseJestConfig,
  displayName: '@kitiumai/test-core',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
};
