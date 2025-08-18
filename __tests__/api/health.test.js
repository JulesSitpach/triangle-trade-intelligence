/**
 * Unit tests for Health Check API
 * Validates production readiness monitoring
 */

import handler from '../../pages/api/health.js'
import { testSupabaseConnection } from '../../lib/supabase-client.js'

// Mock the Supabase client
jest.mock('../../lib/supabase-client.js', () => ({
  testSupabaseConnection: jest.fn()
}))

// Mock the monitoring system
jest.mock('../../lib/monitoring.js', () => ({
  getHealthMetrics: jest.fn(() => ({
    uptime: 3600,
    requests: {
      total: 100,
      errors: 5,
      errorRate: 5
    },
    memory: {
      heapUsed: 45,
      heapTotal: 67,
      external: 12
    },
    activeAlerts: 0
  })),
  trackAPICall: jest.fn()
}))

describe('/api/health', () => {
  let req, res

  beforeEach(() => {
    req = {
      method: 'GET',
      headers: {}
    }
    res = {
      status: jest.fn(() => res),
      json: jest.fn(() => res),
      setHeader: jest.fn()
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful Health Check', () => {
    beforeEach(() => {
      testSupabaseConnection.mockResolvedValue(true)
      process.env.ANTHROPIC_API_KEY = 'test-key'
      process.env.COMTRADE_API_KEY = 'test-key'
    })

    it('should return healthy status when all systems operational', async () => {
      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          database: 'connected',
          apis: expect.objectContaining({
            anthropic: expect.objectContaining({ configured: true }),
            comtrade: expect.objectContaining({ configured: true })
          }),
          features: expect.objectContaining({
            monitoring: 'enabled',
            security: 'enabled'
          })
        })
      )
    })

    it('should include system metrics', async () => {
      await handler(req, res)

      const call = res.json.mock.calls[0][0]
      expect(call).toHaveProperty('uptime')
      expect(call).toHaveProperty('system.memory')
      expect(call).toHaveProperty('system.requests')
      expect(call).toHaveProperty('responseTime')
    })

    it('should apply security headers', async () => {
      await handler(req, res)

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
    })
  })

  describe('Degraded Health States', () => {
    it('should return degraded status when database disconnected', async () => {
      testSupabaseConnection.mockResolvedValue(false)
      process.env.ANTHROPIC_API_KEY = 'test-key'
      process.env.COMTRADE_API_KEY = 'test-key'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      const call = res.json.mock.calls[0][0]
      expect(call.status).toBe('degraded')
      expect(call.database).toBe('disconnected')
    })

    it('should return degraded status when critical APIs missing', async () => {
      testSupabaseConnection.mockResolvedValue(true)
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.COMTRADE_API_KEY

      await handler(req, res)

      const call = res.json.mock.calls[0][0]
      expect(call.status).toBe('degraded')
      expect(call.apis.anthropic.configured).toBe(false)
      expect(call.apis.comtrade.configured).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle method not allowed', async () => {
      req.method = 'POST'

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(405)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Method not allowed'
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      testSupabaseConnection.mockRejectedValue(new Error('Connection failed'))
      process.env.ANTHROPIC_API_KEY = 'test-key'
      process.env.COMTRADE_API_KEY = 'test-key'

      await handler(req, res)

      const call = res.json.mock.calls[0][0]
      expect(call.database).toBe('error')
    })

    it('should handle unexpected errors', async () => {
      // Mock a function to throw an error
      const originalEnv = process.env.NODE_ENV
      delete process.env.NODE_ENV
      
      // Create a scenario that would cause an error
      testSupabaseConnection.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req, res)

      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'unhealthy',
          error: 'Internal health check failure'
        })
      )

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Production vs Development Behavior', () => {
    it('should provide appropriate detail level for monitoring', async () => {
      testSupabaseConnection.mockResolvedValue(true)
      process.env.ANTHROPIC_API_KEY = 'test-key'
      process.env.COMTRADE_API_KEY = 'test-key'

      await handler(req, res)

      const response = res.json.mock.calls[0][0]
      
      // Should include monitoring-friendly data
      expect(response).toHaveProperty('timestamp')
      expect(response).toHaveProperty('version')
      expect(response).toHaveProperty('environment')
      expect(response).not.toHaveProperty('internalState')
      expect(response).not.toHaveProperty('debugging')
    })
  })
})