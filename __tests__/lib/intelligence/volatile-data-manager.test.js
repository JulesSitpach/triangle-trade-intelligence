/**
 * Unit tests for VolatileDataManager.getOrFetchAPIData() function only
 * Tests volatile data caching and API call logic
 */

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        gt: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      }))
    })),
    upsert: jest.fn(() => Promise.resolve({
      data: [{ id: 1 }],
      error: null
    })),
    insert: jest.fn(() => Promise.resolve({
      data: [{ id: 1 }],
      error: null
    }))
  }))
}

jest.mock('../../../lib/supabase-client.js', () => ({
  getSupabaseClient: jest.fn(() => mockSupabaseClient)
}))

jest.mock('../../../lib/utils/production-logger.js', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDBQuery: jest.fn(),
  logAPICall: jest.fn(),
  logPerformance: jest.fn()
}))

global.fetch = jest.fn()

import { VolatileDataManager } from '../../../lib/intelligence/database-intelligence-bridge.js'

describe('VolatileDataManager.getOrFetchAPIData()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch.mockReset()
  })

  it('should return cached data when cache is valid', async () => {
    const mockCachedData = [{
      endpoint: 'tariff_rates',
      response_data: { rates: { CN: 25, MX: 0 } },
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString()
    }]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gt: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockCachedData,
                error: null
              }))
            }))
          }))
        }))
      }))
    })

    const result = await VolatileDataManager.getOrFetchAPIData('tariff_rates', { country: 'CN' })

    expect(result).toEqual({
      source: 'DATABASE_CACHE',
      data: mockCachedData[0].response_data,
      apiCallMade: false,
      cachedAt: mockCachedData[0].cached_at,
      rssTriggered: false,
      cacheConfig: VolatileDataManager.getCacheConfig('tariff_rates'),
      volatilityLevel: 'EXTREMELY_VOLATILE'
    })
  })

  it('should make API call when cache is expired', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gt: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({
        data: [{ id: 1 }],
        error: null
      })),
      insert: jest.fn(() => Promise.resolve({
        data: [{ id: 1 }],
        error: null
      }))
    })

    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { CN: 30 }, recordCount: 100 })
    })

    const result = await VolatileDataManager.getOrFetchAPIData('tariff_rates', { country: 'CN' })

    expect(result.source).toBe('LIVE_API')
    expect(result.apiCallMade).toBe(true)
    expect(result.data).toEqual({ rates: { CN: 30 }, recordCount: 100 })
    expect(result.volatilityLevel).toBe('EXTREMELY_VOLATILE')
  })

  it('should force fresh data for high urgency RSS alerts', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ rates: { CN: 35 }, recordCount: 50 })
    })

    mockSupabaseClient.from.mockReturnValue({
      upsert: jest.fn(() => Promise.resolve({
        data: [{ id: 1 }],
        error: null
      })),
      insert: jest.fn(() => Promise.resolve({
        data: [{ id: 1 }],
        error: null
      }))
    })

    const result = await VolatileDataManager.getOrFetchAPIData('tariff_rates', {
      trigger: 'RSS_ALERT',
      urgency: 35,
      source: 'trade_policy_update'
    })

    expect(result.source).toBe('RSS_LIVE_API')
    expect(result.apiCallMade).toBe(true)
    expect(result.rssTriggered).toBe(true)
    expect(result.data).toEqual({ rates: { CN: 35 }, recordCount: 50 })
  })

  it('should handle API call failures gracefully', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gt: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      }))
    })

    global.fetch.mockRejectedValue(new Error('Network timeout'))

    await expect(VolatileDataManager.getOrFetchAPIData('tariff_rates', { country: 'CN' }))
      .rejects.toThrow('Network timeout')
  })

  it('should use different cache TTL for RSS-triggered requests', async () => {
    const recentCacheData = [{
      endpoint: 'tariff_rates',
      response_data: { rates: { CN: 25 } },
      cached_at: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
      expires_at: new Date(Date.now() + 2400000).toISOString()  // 40 minutes from now
    }]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          gt: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: recentCacheData,
                error: null
              }))
            }))
          }))
        }))
      }))
    })

    const result = await VolatileDataManager.getOrFetchAPIData('tariff_rates', {
      trigger: 'RSS_ALERT',
      urgency: 25
    })

    expect(result.source).toBe('RSS_CACHED')
    expect(result.rssTriggered).toBe(true)
  })
})