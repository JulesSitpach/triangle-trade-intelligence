/**
 * Unit tests for StableDataManager.getUSMCARates() function only
 * Tests USMCA rate retrieval with proper mocking
 */

// Mock the Supabase client first
const mockSupabaseClient = {
  from: jest.fn(() => ({
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

import { StableDataManager } from '../../../lib/intelligence/database-intelligence-bridge.js'

describe('StableDataManager.getUSMCARates()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return USMCA rates for Mexico-US route', async () => {
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

  it('should return USMCA rates for Canada-US route', async () => {
    const mockUSMCAData = [{
      id: 2,
      origin_country: 'CA',
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

  it('should handle single country route defaulting to US destination', async () => {
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

  it('should return 0% rate even when database returns empty data', async () => {
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