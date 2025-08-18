/**
 * 🧪 API TEST ENDPOINT
 * Test Comtrade and Shippo integration
 */

import { apiManager } from '../../lib/api-strategy-manager.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { businessType = 'Electronics', supplierCountry = 'CN', importVolume = '$2M-$5M' } = req.body
    
    console.log('🧪 TESTING APIs with user data:', { businessType, supplierCountry, importVolume })
    
    const results = {}
    
    // Test 1: Get tariff data for volatile countries
    console.log('🌐 Testing Comtrade tariff API...')
    try {
      const tariffData = await apiManager.getData('tariff', {
        country: supplierCountry,
        product: '851712' // Electronics HS code example
      })
      results.tariffAPI = {
        success: true,
        data: tariffData,
        note: 'Comtrade API integration working'
      }
    } catch (error) {
      results.tariffAPI = {
        success: false,
        error: error.message,
        note: 'Comtrade API needs troubleshooting'
      }
    }
    
    // Test 2: Get shipping data
    console.log('🚢 Testing Shippo shipping API...')
    try {
      const shippingData = await apiManager.getData('shipping', {
        origin: supplierCountry,
        destination: 'US',
        weight: 1000
      })
      results.shippingAPI = {
        success: true,
        data: shippingData,
        note: 'Shippo API integration working'
      }
    } catch (error) {
      results.shippingAPI = {
        success: false,
        error: error.message,
        note: 'Shippo API needs troubleshooting'
      }
    }
    
    // Test 3: Get stable data (should NOT make API calls)
    console.log('🔒 Testing stable data caching...')
    const usmcaRate = await apiManager.getData('usmca_rate', { route: 'MX-US' })
    const portInfo = await apiManager.getData('port_info', { country: 'mexico' })
    const seasonality = await apiManager.getData('seasonality', { industry: businessType.toLowerCase() })
    
    results.stableData = {
      usmcaRate,
      portInfo,
      seasonality,
      note: 'Stable data cached - no API calls made'
    }
    
    // Test 4: API efficiency stats
    const efficiency = apiManager.getStats()
    results.apiEfficiency = efficiency
    
    console.log('✅ API test completed')
    
    return res.status(200).json({
      success: true,
      message: 'API integration test completed',
      testResults: results,
      recommendation: efficiency.efficiency > 0.5 ? 
        'Good API efficiency - caching is working' : 
        'Consider optimizing API usage',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ API test error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      note: 'API integration test failed'
    })
  }
}