module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['ts', 'js', 'vue'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(vue)$': '@vue/vue3-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '<rootDir>/src/**/*.vue'
  ],
  coverageDirectory: '<rootDir>/tests/coverage'
}