/**
 * Unit tests for Database Intelligence Bridge
 * Tests specific functions: StableDataManager.getUSMCARates(), VolatileDataManager.getOrFetchAPIData(), and triangle routing calculations
 */

import { StableDataManager, VolatileDataManager, DatabaseIntelligenceBridge } from '../../../lib/intelligence/database-intelligence-bridge.js'

// Mock the Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        limit: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      limit: jest.fn(() => Promise.resolve({
        data: [],
        error: null
      })),
      gt: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      })),
      contains: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      gte: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      })),
      in: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    })),
    insert: jest.fn(() => Promise.resolve({
      data: [{ id: 1 }],
      error: null
    })),
    upsert: jest.fn(() => Promise.resolve({
      data: [{ id: 1 }],
      error: null
    }))
  }))
}

// Mock the Supabase client module
jest.mock('../../../lib/supabase-client.js', () => ({
  getSupabaseClient: jest.fn(() => mockSupabaseClient)
}))

// Mock the production logger
jest.mock('../../../lib/utils/production-logger.js', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDBQuery: jest.fn(),
  logAPICall: jest.fn(),
  logPerformance: jest.fn()
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Database Intelligence Bridge - Specific Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    global.fetch.mockReset()
  })

  describe('StableDataManager.getUSMCARates()', () => {
    it('should return USMCA rates for valid Mexico-US route', async () => {
      // Mock successful database response
      const mockUSMCAData = [{
        id: 1,
        origin_country: 'MX',
        destination_country: 'US',
        usmca_rate: 0,
        created_at: '2020-01-01'
      }]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockUSMCAData,
                error: null
              }))
            }))
          }))
        }))
      })

      const result = await StableDataManager.getUSMCARates('MX-US')

      expect(result).toEqual({
        source: 'STABLE_DATABASE',
        rate: 0,
        status: 'TREATY_LOCKED',
        apiCallNeeded: false,
        confidence: 100,
        data: mockUSMCAData[0],
        category: StableDataManager.STABLE_CATEGORIES.TREATY_LOCKED,
        volatilityLevel: 'STABLE',
        lastChanged: 'Treaty signed 2020, next review 2026'
      })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usmca_tariff_rates')
    })

    it('should return USMCA rates for valid Canada-US route', async () => {
      const mockUSMCAData = [{
        id: 2,
        origin_country: 'CA',
        destination_country: 'US',
        usmca_rate: 0,
        created_at: '2020-01-01'
      }]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockUSMCAData,
                error: null
              }))
            }))
          }))
        }))
      })

      const result = await StableDataManager.getUSMCARates('CA-US')

      expect(result.rate).toBe(0)
      expect(result.status).toBe('TREATY_LOCKED')
      expect(result.apiCallNeeded).toBe(false)
      expect(result.confidence).toBe(100)
    })

    it('should return default USMCA rate when database query fails', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: null,
                error: new Error('Database connection failed')
              }))
            }))
          }))
        }))
      })

      const result = await StableDataManager.getUSMCARates('MX-US')

      expect(result).toEqual({
        source: 'USMCA_DEFAULT',
        rate: 0,
        status: 'TREATY_LOCKED',
        apiCallNeeded: false,
        confidence: 100
      })
    })

    it('should handle single country route (defaults to US destination)', async () => {
      const mockUSMCAData = [{
        id: 3,
        origin_country: 'MX',
        destination_country: 'US',
        usmca_rate: 0
      }]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: mockUSMCAData,
                error: null
              }))
            }))
          }))
        }))
      })

      const result = await StableDataManager.getUSMCARates('MX')

      expect(result.rate).toBe(0)
      expect(result.apiCallNeeded).toBe(false)
    })

    it('should return 0% rate even when database returns null data', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      })

      const result = await StableDataManager.getUSMCARates('MX-US')

      expect(result.rate).toBe(0) // Always 0% for USMCA
      expect(result.source).toBe('STABLE_DATABASE')
      expect(result.apiCallNeeded).toBe(false)
    })
  })

  describe('VolatileDataManager.getOrFetchAPIData()', () => {
    it('should return cached data when cache is valid', async () => {
      const mockCachedData = [{
        endpoint: 'tariff_rates',
        response_data: { rates: { CN: 25, MX: 0 } },
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
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
      // Mock expired cache
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gt: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [], // No valid cache
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

      // Mock successful API response
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
      // Mock API response
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ rates: { CN: 35 }, recordCount: 50 })
      })

      // Mock cache update
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
      // Mock no cache
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

      // Mock API failure
      global.fetch.mockRejectedValue(new Error('Network timeout'))

      await expect(VolatileDataManager.getOrFetchAPIData('tariff_rates', { country: 'CN' }))
        .rejects.toThrow('Network timeout')
    })

    it('should use different cache TTL for RSS-triggered requests', async () => {
      const recentCacheData = [{
        endpoint: 'tariff_rates',
        response_data: { rates: { CN: 25 } },
        cached_at: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
        expires_at: new Date(Date.now() + 2400000).toISOString() // 40 minutes from now
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

      // For RSS requests, 20-minute-old cache should be considered stale (30min limit)
      const result = await VolatileDataManager.getOrFetchAPIData('tariff_rates', {
        trigger: 'RSS_ALERT',
        urgency: 25
      })

      expect(result.source).toBe('RSS_CACHED')
      expect(result.rssTriggered).toBe(true)
    })

    it('should handle unknown endpoints with error', async () => {
      await expect(VolatileDataManager.getOrFetchAPIData('unknown_endpoint', {}))
        .rejects.toThrow('Unknown volatile endpoint: unknown_endpoint. Use StableDataManager for stable data.')
    })
  })

  describe('Triangle Routing Calculations', () => {
    it('should get complete triangle routing intelligence', async () => {
      // Mock static triangle routes import
      const mockStaticRoutes = {
        recommendedRoutes: [
          {
            route: 'CN-MX-US',
            details: {
              routeName: 'China via Mexico Triangle',
              transitDays: 28,
              costPerKg: 2.50,
              reliability: 95,
              tariffSavings: 300000,
              complexity: 'Medium',
              executiveSummary: 'Optimal USMCA route',
              advantages: ['0% tariff', 'Fast transit'],
              seasonalFactors: ['Q4 capacity'],
            },
            priority: 'HIGH',
            reasoning: 'Maximum savings with proven reliability'
          }
        ],
        executiveInsights: {
          primaryRecommendation: 'Mexico triangle route',
          potentialSavings: 300000,
          implementationTimeline: '60 days'
        },
        quarterlyUpdate: {
          status: 'active',
          nextReview: '2024-Q1'
        }
      }

      // Mock static routes module
      jest.doMock('../../../lib/intelligence/static-triangle-routes', () => ({
        getOptimizedRoutes: jest.fn(() => mockStaticRoutes),
        getRouteStatus: jest.fn(() => ({ status: 'active' })),
        executiveIntelligence: jest.fn(() => ({ confidence: 95 }))
      }), { virtual: true })

      const params = {
        origin: 'CN',
        destination: 'US',
        hsCode: '8471',
        businessType: 'Electronics',
        importVolume: '$5M - $25M',
        riskTolerance: 'Medium'
      }

      const result = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence(params)

      expect(result.triangleOptions).toHaveLength(1)
      expect(result.triangleOptions[0].route).toBe('CN-MX-US')
      expect(result.triangleOptions[0].tariffSavings).toBe(300000)
      expect(result.analysis.confidence).toBe(95)
      expect(result.analysis.executiveReady).toBe(true)
      expect(result.efficiency.apiCallsMade).toBe(0)
      expect(result.efficiency.staticIntelligence).toBe(true)
    })

    it('should fallback to database intelligence when static routes fail', async () => {
      // Mock static routes failure
      jest.doMock('../../../lib/intelligence/static-triangle-routes', () => {
        throw new Error('Static routes not available')
      }, { virtual: true })

      // Mock database responses
      const mockComtradeData = {
        records: [
          { hs_code: '8471', product_description: 'Computers', trade_value: 1000000 }
        ],
        totalRecords: 1
      }

      const mockUSMCAData = {
        rate: 0,
        status: 'TREATY_LOCKED',
        apiCallNeeded: false
      }

      const mockPortData = {
        ports: [{ port_code: 'USLAX', port_name: 'Los Angeles' }],
        apiCallNeeded: false
      }

      const mockRouteData = {
        routes: [{ route_id: 1, route_name: 'Pacific Route' }],
        apiCallNeeded: false
      }

      // Mock each database call
      jest.spyOn(StableDataManager, 'getComtradeReference')
        .mockResolvedValue(mockComtradeData)
      jest.spyOn(StableDataManager, 'getUSMCARates')
        .mockResolvedValue(mockUSMCAData)
      jest.spyOn(StableDataManager, 'getPortInfo')
        .mockResolvedValue(mockPortData)
      jest.spyOn(StableDataManager, 'getTradeRoutes')
        .mockResolvedValue(mockRouteData)

      const params = {
        origin: 'CN',
        destination: 'USA',
        hsCode: '8471',
        businessType: 'Electronics'
      }

      const result = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence(params)

      expect(result.triangleOptions).toHaveLength(2) // CN->MX->US and CN->CA->US
      expect(result.triangleOptions[0].route).toBe('CN → Mexico → USA')
      expect(result.triangleOptions[0].usmcaTariff).toBe(0)
      expect(result.triangleOptions[1].route).toBe('CN → Canada → USA')
      expect(result.efficiency.apiCallsMade).toBe(0)
      expect(result.efficiency.allFromDatabase).toBe(true)
    })

    it('should calculate triangle route savings correctly', async () => {
      const params = {
        origin: 'CN',
        destination: 'USA',
        hsCode: '8471',
        businessType: 'Electronics'
      }

      // Mock the database responses for route calculation
      jest.spyOn(StableDataManager, 'getComtradeReference')
        .mockResolvedValueOnce({ // First call for direct flow
          records: [{ hs_code: '8471', trade_value: 1000000 }],
          totalRecords: 1
        })
        .mockResolvedValueOnce({ // Second call for Mexico leg
          records: [{ hs_code: '8471', trade_value: 800000 }],
          totalRecords: 1
        })
        .mockResolvedValueOnce({ // Third call for Canada leg
          records: [{ hs_code: '8471', trade_value: 600000 }],
          totalRecords: 1
        })

      jest.spyOn(StableDataManager, 'getUSMCARates')
        .mockResolvedValue({
          rate: 0,
          status: 'TREATY_LOCKED',
          apiCallNeeded: false
        })

      jest.spyOn(StableDataManager, 'getPortInfo')
        .mockResolvedValue({
          ports: [{ port_code: 'USLAX' }],
          apiCallNeeded: false
        })

      jest.spyOn(StableDataManager, 'getTradeRoutes')
        .mockResolvedValue({
          routes: [{ route_id: 1 }],
          apiCallNeeded: false
        })

      const result = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence(params)

      expect(result.triangleOptions).toHaveLength(2)
      expect(result.analysis.recommendTriangle).toBe(true)
      expect(result.analysis.potentialSavings).toBe('High - 0% USMCA tariffs')
      expect(result.analysis.confidence).toBeGreaterThanOrEqual(70)
    })

    it('should handle empty trade data gracefully', async () => {
      const params = {
        origin: 'XX', // Non-existent country
        destination: 'USA',
        hsCode: '9999', // Non-existent HS code
        businessType: 'Unknown'
      }

      // Mock empty database responses
      jest.spyOn(StableDataManager, 'getComtradeReference')
        .mockResolvedValue({
          records: [],
          totalRecords: 0
        })

      jest.spyOn(StableDataManager, 'getUSMCARates')
        .mockResolvedValue({
          rate: 0,
          status: 'TREATY_LOCKED',
          apiCallNeeded: false
        })

      jest.spyOn(StableDataManager, 'getPortInfo')
        .mockResolvedValue({
          ports: [],
          apiCallNeeded: false
        })

      jest.spyOn(StableDataManager, 'getTradeRoutes')
        .mockResolvedValue({
          routes: [],
          apiCallNeeded: false
        })

      const result = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence(params)

      expect(result.direct.available).toBe(false)
      expect(result.triangleOptions).toHaveLength(2) // Still creates triangle options
      expect(result.analysis.confidence).toBe(70) // Lower confidence due to no data
      expect(result.efficiency.allFromDatabase).toBe(true)
    })
  })

  describe('Cache Configuration and Volatility Levels', () => {
    it('should return correct cache configuration for different endpoints', () => {
      const tariffConfig = VolatileDataManager.getCacheConfig('tariff_rates')
      expect(tariffConfig.ttl).toBe(3600000) // 1 hour
      expect(tariffConfig.description).toBe('Tariff rates (political decisions)')

      const shippingConfig = VolatileDataManager.getCacheConfig('shipping_rates')
      expect(shippingConfig.ttl).toBe(7200000) // 2 hours

      const defaultConfig = VolatileDataManager.getCacheConfig('unknown_endpoint')
      expect(defaultConfig.ttl).toBe(3600000) // Default 1 hour
    })

    it('should calculate volatility levels correctly', () => {
      expect(VolatileDataManager.getVolatilityLevel('tariff_rates')).toBe('EXTREMELY_VOLATILE')
      expect(VolatileDataManager.getVolatilityLevel('exchange_rates')).toBe('HIGHLY_VOLATILE')
      expect(VolatileDataManager.getVolatilityLevel('country_risk')).toBe('MODERATELY_VOLATILE')
      expect(VolatileDataManager.getVolatilityLevel('port_congestion')).toBe('WEEKLY_VOLATILE')
    })

    it('should calculate intelligent cache expiry for RSS triggers', () => {
      const urgentExpiry = VolatileDataManager.calculateIntelligentCacheExpiry('tariff_rates', true, 35)
      expect(urgentExpiry).toBe(0.25) // 25% of base TTL for urgent RSS alerts

      const normalExpiry = VolatileDataManager.calculateIntelligentCacheExpiry('tariff_rates', true, 20)
      expect(normalExpiry).toBe(0.5) // 50% of base TTL for normal RSS alerts

      const baseExpiry = VolatileDataManager.calculateIntelligentCacheExpiry('tariff_rates', false, 0)
      expect(baseExpiry).toBe(1) // Base TTL for non-RSS requests
    })
  })
})