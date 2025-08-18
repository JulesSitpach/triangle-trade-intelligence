// Jest setup for Triangle Intelligence Platform testing
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'
process.env.COMTRADE_API_KEY = 'test-comtrade-key'
process.env.SHIPPO_API_KEY = 'test-shippo-key'
process.env.NODE_ENV = 'test'

// Mock fetch globally
global.fetch = jest.fn()

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      beforePopState: jest.fn(),
      prefetch: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock window.location
delete window.location
window.location = { 
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
}

// Mock console methods to keep test output clean
console.log = jest.fn()
console.warn = jest.fn()
console.error = jest.fn()

// Setup test utilities
beforeEach(() => {
  jest.clearAllMocks()
})

// Global test timeout
jest.setTimeout(10000)