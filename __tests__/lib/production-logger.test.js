/**
 * Unit tests for Production Logger
 * Ensures sensitive data is protected and logging works correctly
 */

import { logger, logError, logInfo, logDebug } from '../../lib/production-logger.js'

describe('Production Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Data Sanitization', () => {
    it('should redact API keys', () => {
      const sensitiveData = 'API key: sk-ant-api03-1234567890abcdef'
      const sanitized = logger.sanitize(sensitiveData)
      expect(sanitized).toBe('API key: [REDACTED]')
    })

    it('should redact JWT tokens', () => {
      const sensitiveData = 'Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
      const sanitized = logger.sanitize(sensitiveData)
      expect(sanitized).toBe('Token: [REDACTED]')
    })

    it('should redact sensitive object properties', () => {
      const sensitiveObj = {
        username: 'john',
        password: 'secret123',
        apiKey: 'sk-1234567890',
        data: 'normal data'
      }
      const sanitized = logger.sanitize(sensitiveObj)
      
      expect(sanitized.username).toBe('john')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.apiKey).toBe('[REDACTED]')
      expect(sanitized.data).toBe('normal data')
    })

    it('should handle nested objects', () => {
      const nestedObj = {
        user: {
          id: 1,
          credentials: {
            password: 'secret',
            token: 'jwt-token'
          }
        }
      }
      const sanitized = logger.sanitize(nestedObj)
      
      expect(sanitized.user.id).toBe(1)
      expect(sanitized.user.credentials.password).toBe('[REDACTED]')
      expect(sanitized.user.credentials.token).toBe('[REDACTED]')
    })

    it('should handle arrays', () => {
      const arrayData = [
        { name: 'item1', secret: 'hidden' },
        { name: 'item2', secret: 'also-hidden' }
      ]
      const sanitized = logger.sanitize(arrayData)
      
      expect(sanitized[0].name).toBe('item1')
      expect(sanitized[0].secret).toBe('[REDACTED]')
      expect(sanitized[1].name).toBe('item2')
      expect(sanitized[1].secret).toBe('[REDACTED]')
    })
  })

  describe('Log Levels', () => {
    it('should log errors in all environments', () => {
      logger.error('Test error', { code: 500 })
      expect(console.error).toHaveBeenCalled()
    })

    it('should log warnings in all environments', () => {
      logger.warn('Test warning')
      expect(console.warn).toHaveBeenCalled()
    })

    it('should log info messages', () => {
      logger.info('Test info')
      expect(console.log).toHaveBeenCalled()
    })

    it('should only log debug in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logger.debug('Test debug')
      expect(console.log).toHaveBeenCalled()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Specialized Logging Methods', () => {
    it('should log performance metrics', () => {
      logger.performance('database-query', 150, { table: 'users' })
      expect(console.log).toHaveBeenCalled()
    })

    it('should log API calls', () => {
      logger.apiCall('GET', '/api/users', 200, 200)
      expect(console.log).toHaveBeenCalled()
    })

    it('should log database queries', () => {
      logger.dbQuery('users', 'SELECT', 50, 25)
      expect(console.log).toHaveBeenCalled()
    })

    it('should log security events as warnings', () => {
      logger.security('unauthorized-access', { ip: '1.2.3.4' })
      expect(console.warn).toHaveBeenCalled()
    })

    it('should log business events', () => {
      logger.business('user-signup', { userId: 123 })
      expect(console.log).toHaveBeenCalled()
    })
  })

  describe('Convenience Functions', () => {
    it('should provide logError convenience function', () => {
      logError('Test error')
      expect(console.error).toHaveBeenCalled()
    })

    it('should provide logInfo convenience function', () => {
      logInfo('Test info')
      expect(console.log).toHaveBeenCalled()
    })

    it('should provide logDebug convenience function', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logDebug('Test debug')
      expect(console.log).toHaveBeenCalled()
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Production vs Development Formatting', () => {
    it('should format as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      
      logger.info('Test message', { data: 'test' })
      
      const callArgs = console.log.mock.calls[0]
      expect(typeof callArgs[0]).toBe('string')
      expect(() => JSON.parse(callArgs[0])).not.toThrow()
      
      process.env.NODE_ENV = originalEnv
    })

    it('should format as objects in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      logger.info('Test message', { data: 'test' })
      
      const callArgs = console.log.mock.calls[0]
      expect(callArgs.length).toBeGreaterThan(1)
      
      process.env.NODE_ENV = originalEnv
    })
  })
})