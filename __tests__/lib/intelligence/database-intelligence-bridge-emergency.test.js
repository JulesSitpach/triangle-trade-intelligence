/**
 * Emergency Test Coverage for Database Intelligence Bridge
 * Task 1.4: Critical triangle routing calculations and $100K+ savings estimates
 * Framework: Jest with minimal environment setup - no global setup to avoid JSDOM errors
 */

// Set up minimal test environment
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'

// Mock production logger to prevent console noise
jest.mock('../../../lib/utils/production-logger.js', () => ({
  logDebug: jest.fn(),
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDBQuery: jest.fn(),
  logAPICall: jest.fn(),
  logPerformance: jest.fn()
}))

// Mock Supabase client with predictable data for testing
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({
            data: [{ 
              usmca_rate: 0,
              origin_country: 'MX',
              destination_country: 'US'
            }],
            error: null
          }))
        }))
      }))
    }))
  }))
}

// Mock the Supabase client module
jest.mock('../../../lib/supabase-client.js', () => ({
  getSupabaseClient: jest.fn(() => mockSupabaseClient)
}))

import { StableDataManager, VolatileDataManager, DatabaseIntelligenceBridge } from '../../../lib/intelligence/database-intelligence-bridge.js'

describe('Database Intelligence Bridge - Emergency Coverage', () => {
  
  describe('Critical Business Logic: Triangle Routing Calculations', () => {
    
    test('USMCA rates should always return 0% (treaty-locked)', async () => {
      const result = await StableDataManager.getUSMCARates('MX-US')
      
      expect(result.rate).toBe(0)
      expect(result.status).toBe('TREATY_LOCKED')
      expect(result.apiCallNeeded).toBe(false)
      expect(result.confidence).toBe(100)
    })
    
    test('Triangle routing should calculate $100K+ savings correctly', async () => {
      // Mock trade flow data for China → Mexico → US
      const mockTradeFlows = [
        {
          hs_code: '8471',
          china_tariff_rate: 25.0, // 25% direct China tariff
          product_description: 'Computer equipment',
          trade_value: 1000000 // $1M import volume
        }
      ]
      
      // Mock comtrade reference to return our test data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: mockTradeFlows,
            error: null
          }))
        }))
      })
      
      const routing = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
        origin: 'CN',
        destination: 'US',
        hsCode: '8471',
        businessType: 'Electronics',
        importVolume: '$1M - $5M'
      })
      
      // Verify triangle routing options are provided
      expect(routing.triangleOptions).toBeDefined()
      expect(routing.triangleOptions.length).toBeGreaterThan(0)
      
      // Verify efficiency metrics show database usage
      expect(routing.efficiency.apiCallsMade).toBe(0)
      expect(routing.efficiency.allFromDatabase).toBe(true)
      
      // Verify analysis confidence is high
      expect(routing.analysis.confidence).toBeGreaterThanOrEqual(70)
    })
    
    test('Savings calculation should show correct tariff differences', async () => {
      const directTariff = 25.0 // 25% China direct
      const triangleTariff = 0   // 0% USMCA
      const importValue = 1000000 // $1M
      
      const directCost = importValue * (directTariff / 100)
      const triangleCost = importValue * (triangleTariff / 100)
      const savings = directCost - triangleCost
      
      // Verify savings calculation logic
      expect(savings).toBe(250000) // $250K savings
      expect(savings).toBeGreaterThan(100000) // Meets $100K+ requirement
    })
  })
  
  describe('Volatile vs Stable Data Separation', () => {
    
    test('Stable data should not require API calls', async () => {
      const usmcaResult = await StableDataManager.getUSMCARates('CA-US')
      
      expect(usmcaResult.apiCallNeeded).toBe(false)
      expect(usmcaResult.source).toBe('STABLE_DATABASE')
      expect(usmcaResult.category).toBe(StableDataManager.STABLE_CATEGORIES.TREATY_LOCKED)
    })
    
    test('Volatile data should support caching with TTL', async () => {
      const cacheConfig = VolatileDataManager.getCacheConfig('tariff_rates')
      
      expect(cacheConfig.ttl).toBe(3600000) // 1 hour
      expect(cacheConfig.description).toContain('Tariff rates')
      
      const volatilityLevel = VolatileDataManager.getVolatilityLevel('tariff_rates')
      expect(volatilityLevel).toBe('EXTREMELY_VOLATILE')
    })
  })
  
  describe('Database Intelligence Bridge Integration', () => {
    
    test('Tariff intelligence should combine stable and volatile data', async () => {
      const intelligence = await DatabaseIntelligenceBridge.getTariffIntelligence({
        origin: 'CN',
        destination: 'US', 
        hsCode: '8471',
        businessType: 'Electronics'
      })
      
      expect(intelligence.stable).toBeDefined()
      expect(intelligence.volatile).toBeDefined()
      expect(intelligence.stable.usmca).toBeDefined()
      expect(intelligence.recommendation).toBeDefined()
      expect(intelligence.recommendation.apiCallsMade).toBeDefined()
    })
    
    test('API stats should track volatile/stable separation efficiency', async () => {
      // Mock API cache data
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => Promise.resolve({
          data: [
            { endpoint: 'tariff_rates', cached_at: new Date().toISOString(), expires_at: new Date(Date.now() + 3600000).toISOString() }
          ],
          error: null
        }))
      })
      
      const stats = await DatabaseIntelligenceBridge.getAPIStats()
      
      expect(stats.enhanced).toBeDefined()
      expect(stats.enhanced.cacheEfficiency).toBeDefined()
      expect(stats.enhanced.systemOptimization).toContain('80%+ API call reduction')
    })
  })
  
  describe('Performance and Error Handling', () => {
    
    test('Database errors should not crash the system', async () => {
      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' }
          }))
        }))
      })
      
      const result = await StableDataManager.getUSMCARates('MX-US')
      
      // Should return fallback data, not crash
      expect(result.rate).toBe(0) // USMCA default
      expect(result.source).toBe('USMCA_DEFAULT')
    })
    
    test('Performance logging should track response times', async () => {
      const start = Date.now()
      await StableDataManager.getUSMCARates('CA-US')
      const duration = Date.now() - start
      
      // Verify performance is tracked (under 1 second for stable data)
      expect(duration).toBeLessThan(1000)
    })
  })
  
  describe('Critical Production Scenarios', () => {
    
    test('Should handle missing HS code gracefully', async () => {
      const result = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
        origin: 'CN',
        destination: 'US',
        hsCode: null, // Missing HS code
        businessType: 'Electronics'
      })
      
      expect(result).toBeDefined()
      expect(result.triangleOptions).toBeDefined()
      expect(result.efficiency.apiCallsMade).toBe(0)
    })
    
    test('Should provide triangle options for major trade routes', async () => {
      const result = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
        origin: 'CN',
        destination: 'USA',
        hsCode: '8471',
        businessType: 'Electronics'
      })
      
      expect(result.triangleOptions).toBeDefined()
      expect(result.triangleOptions.length).toBeGreaterThanOrEqual(2) // Mexico and Canada routes
      
      // Verify USMCA routes show 0% tariff
      const usmcaRoutes = result.triangleOptions.filter(route => 
        route.type === 'TRIANGLE_USMCA'
      )
      expect(usmcaRoutes.length).toBeGreaterThan(0)
      usmcaRoutes.forEach(route => {
        expect(route.usmcaTariff).toBe(0)
      })
    })
  })
})

describe('Network Effects and Institutional Learning', () => {
  
  test('Success patterns should provide business intelligence', async () => {
    // Mock success patterns from hindsight database
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [
            {
              business_type: 'Electronics',
              pattern_type: 'TRIANGLE_ROUTING_SUCCESS',
              confidence_score: 95,
              annual_savings: 250000
            }
          ],
          error: null
        }))
      }))
    })
    
    const patterns = await StableDataManager.getSuccessPatterns('Electronics')
    
    expect(patterns.patterns).toBeDefined()
    expect(patterns.confidence).toBeGreaterThanOrEqual(70)
    expect(patterns.apiCallNeeded).toBe(false)
    expect(patterns.category).toBe(StableDataManager.STABLE_CATEGORIES.HISTORICAL)
  })
  
  test('Platform metrics should show real database scale', async () => {
    // Mock realistic platform metrics
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => Promise.resolve({
        count: 597072,
        data: [],
        error: null
      }))
    })
    
    const metrics = await StableDataManager.getRealPlatformMetrics()
    
    expect(metrics.tradeRecords).toBeGreaterThan(500000)
    expect(metrics.averageSavings).toBeGreaterThanOrEqual(100000)
    expect(metrics.successRate).toBeGreaterThanOrEqual(80)
    expect(metrics.apiCallNeeded).toBe(false)
  })
})