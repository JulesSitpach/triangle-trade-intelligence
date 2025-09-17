const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^lib/(.*)$': '<rootDir>/lib/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^config/(.*)$': '<rootDir>/config/$1',
    '^pages/(.*)$': '<rootDir>/pages/$1'
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'config/**/*.js',
    'lib/**/*.js',
    'pages/api/**/*.js',
    'components/**/*.js',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/archive-for-deletion/**'
  ],
  coverageThreshold: {
    global: {
      lines: 75,
      statements: 75,
      branches: 65,
      functions: 75
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/archive-for-deletion/',
    '<rootDir>/node_modules/'
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  testTimeout: 30000,
  maxWorkers: '50%'
};

module.exports = createJestConfig(customJestConfig);