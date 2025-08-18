/**
 * Unit tests for Environment Validation
 * Critical production readiness testing
 */

import {
  validateEnvironment,
  getEnvVar,
  isProduction,
  isDevelopment,
  safeLog,
  getSupabaseConfig,
  validateAPIKeysSecurity
} from '../../lib/environment-validation.js'

describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset console mocks
    jest.clearAllMocks()
  })

  describe('validateEnvironment', () => {
    it('should pass validation when all required variables are present', () => {
      expect(() => validateEnvironment()).not.toThrow()
    })

    it('should throw error when required variables are missing', () => {
      const originalEnv = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      expect(() => validateEnvironment()).toThrow('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL')

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv
    })
  })

  describe('getEnvVar', () => {
    it('should return environment variable value when present', () => {
      const result = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
      expect(result).toBe('https://test-project.supabase.co')
    })

    it('should throw error for missing required variable', () => {
      expect(() => getEnvVar('NONEXISTENT_VAR')).toThrow('Missing required environment variable: NONEXISTENT_VAR')
    })

    it('should return default for missing optional variable', () => {
      const result = getEnvVar('NONEXISTENT_VAR', false)
      expect(result).toBeUndefined()
    })
  })

  describe('Environment Detection', () => {
    it('should correctly detect test environment', () => {
      expect(process.env.NODE_ENV).toBe('test')
      expect(isProduction()).toBe(false)
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('getSupabaseConfig', () => {
    it('should return valid Supabase configuration', () => {
      const config = getSupabaseConfig()
      expect(config).toHaveProperty('url')
      expect(config).toHaveProperty('key')
      expect(config.url).toBe('https://test-project.supabase.co')
    })

    it('should use service role key on server side', () => {
      // Simulate server environment
      const originalWindow = global.window
      delete global.window

      const config = getSupabaseConfig()
      expect(config.key).toBe('test-service-role-key')

      global.window = originalWindow
    })

    it('should use anon key on client side', () => {
      // Simulate client environment
      global.window = {}

      const config = getSupabaseConfig()
      expect(config.key).toBe('test-anon-key')
    })
  })

  describe('safeLog', () => {
    it('should not log in production by default', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      safeLog('test message')
      expect(console.log).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should log when forced', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      safeLog('test message', null, true)
      expect(console.log).toHaveBeenCalledWith('test message')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('validateAPIKeysSecurity', () => {
    it('should not throw in server environment', () => {
      delete global.window
      expect(() => validateAPIKeysSecurity()).not.toThrow()
    })

    it('should detect exposed keys on client', () => {
      global.window = {
        process: {
          env: {
            SUPABASE_SERVICE_ROLE_KEY: 'exposed-key'
          }
        }
      }

      expect(() => validateAPIKeysSecurity()).toThrow('SECURITY VIOLATION')
    })
  })
})