/**
 * Unit tests for Supabase Client
 * Tests secure client creation and connection handling
 */

import { createSecureSupabaseClient, getSupabaseClient, testSupabaseConnection } from '../../lib/supabase-client.js'

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        count: 'exact',
        head: true,
        then: jest.fn(resolve => resolve({ data: [], error: null }))
      }))
    }))
  }))
}))

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the client singleton
    jest.resetModules()
  })

  describe('createSecureSupabaseClient', () => {
    it('should create a client with correct configuration', () => {
      const { createClient } = require('@supabase/supabase-js')
      
      const client = createSecureSupabaseClient()
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        expect.any(String),
        expect.objectContaining({
          auth: {
            autoRefreshToken: true,
            persistSession: true
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'X-Client-Info': 'triangle-intelligence-platform'
            }
          }
        })
      )
    })

    it('should return the same client instance on subsequent calls', () => {
      const client1 = createSecureSupabaseClient()
      const client2 = createSecureSupabaseClient()
      
      expect(client1).toBe(client2)
    })

    it('should throw error when environment variables are missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_URL

      expect(() => createSecureSupabaseClient()).toThrow('Missing required environment variable')

      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    })
  })

  describe('getSupabaseClient', () => {
    it('should return existing client or create new one', () => {
      const client = getSupabaseClient()
      expect(client).toBeDefined()
    })
  })

  describe('testSupabaseConnection', () => {
    it('should return true for successful connection test', async () => {
      const { createClient } = require('@supabase/supabase-js')
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })

      const result = await testSupabaseConnection()
      expect(result).toBe(true)
    })

    it('should return false for failed connection test', async () => {
      const { createClient } = require('@supabase/supabase-js')
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => Promise.resolve({ data: null, error: new Error('Connection failed') }))
        }))
      })

      const result = await testSupabaseConnection()
      expect(result).toBe(false)
    })

    it('should handle connection test exceptions', async () => {
      const { createClient } = require('@supabase/supabase-js')
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => Promise.reject(new Error('Network error')))
        }))
      })

      const result = await testSupabaseConnection()
      expect(result).toBe(false)
    })
  })

  describe('Client Configuration Security', () => {
    it('should use service role key on server', () => {
      delete global.window
      const { createClient } = require('@supabase/supabase-js')
      
      createSecureSupabaseClient()
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        'test-service-role-key',
        expect.any(Object)
      )
    })

    it('should use anon key on client', () => {
      global.window = {}
      const { createClient } = require('@supabase/supabase-js')
      
      createSecureSupabaseClient()
      
      expect(createClient).toHaveBeenCalledWith(
        'https://test-project.supabase.co',
        'test-anon-key',
        expect.any(Object)
      )
      
      delete global.window
    })
  })
})