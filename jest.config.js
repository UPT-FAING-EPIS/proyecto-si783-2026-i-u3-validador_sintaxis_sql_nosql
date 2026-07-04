module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  collectCoverageFrom: [
    'src/services/**/*.js',
    'skill/service/src/**/*.js',
    '!**/node_modules/**',
    '!**/docs/**',
    '!src/services/validator/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  clearMocks: true
};
