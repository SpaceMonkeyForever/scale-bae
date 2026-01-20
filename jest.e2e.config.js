/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/e2e/suites/**/*.test.ts"],
  testTimeout: 60000, // 60s for E2E tests
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Verbose output for better debugging
  verbose: true,
  // Fail fast on first error during development
  bail: process.env.CI ? false : true,
  // Setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  // Module resolution
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Root directory
  rootDir: ".",
  // Test results
  reporters: ["default"],
};

module.exports = config;
