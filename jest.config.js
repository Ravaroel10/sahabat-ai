/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // The `ai` package is ESM-only; route-handler test files that import
    // `buildErrorStream` (used by the proxy error path) would otherwise
    // explode with `SyntaxError: Cannot use import statement outside a
    // module`. A tiny CJS mock at `jest/__mocks__/ai.ts` provides just
    // the surface area our tests exercise.
    '^ai$': '<rootDir>/jest/__mocks__/ai.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  /**
   * `ai` (and `@ai-sdk/*` ecosystem packages) ship ESM-only. Jest's
   * ts-jest transform pipeline needs to transpile them through
   * CommonJS so the test runtime can resolve their import statements.
   * Without this override Jest throws
   *   SyntaxError: Cannot use import statement outside a module
   * the first time a route-handler test pulls in `buildErrorStream`.
   */
  transformIgnorePatterns: ['node_modules/(?!(ai|@ai-sdk)/)'],
};

module.exports = config;
