/**
 * 🔬 STAGE FLOW API TEST
 * Test the complete Stage 1 → Stage 2 API flow
 */

import { getIntelligentHSCodes, getIntelligentShipping } from '../../lib/database-intelligence-bridge.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    console.log('🔬 TESTING STAGE FLOW: Simulating Stage 1 → Stage 2 API calls')
    
    // Simulate Stage 1 form data
    const stage1Data = {
      companyName: 'Test Electronics Corp',
      businessType: 'Electronics',
      zipCode: '90210', 
      primarySupplierCountry: 'CN',
      importVolume: '$2M-$5M',
      timelinePriority: 'BALANCED'
    }
    
    // Simulate Stage 2 product descriptions
    const productDescriptions = [
      'Wireless Bluetooth Headphones',
      'LED Monitor 27 inch',
      'Smartphone Cases'
    ]
    
    console.log('📱 Testing HS Code Intelligence with Comtrade API...')
    
    const hsResults = []
    for (const product of productDescriptions) {
      try {
        console.log(`🔍 Getting HS codes for: ${product}`)
        const hsResult = await getIntelligentHSCodes(product, stage1Data.businessType)
        hsResults.push({
          product,
          hsCodeResult: hsResult,
          success: true
        })
      } catch (error) {
        console.error(`❌ HS code error for ${product}:`, error)
        hsResults.push({
          product,
          error: error.message,
          success: false
        })
      }
    }
    
    console.log('🚢 Testing Shipping Intelligence with Shippo API...')
    
    let shippingResult = null
    try {
      shippingResult = await getIntelligentShipping(
        [{ hsCode: '851712', description: 'Electronics' }], // Mock products
        stage1Data // Business profile
      )
    } catch (error) {
      console.error('❌ Shipping intelligence error:', error)
      shippingResult = { error: error.message, success: false }
    }
    
    // Summary
    const apiCallsSummary = {
      hsCodeTests: hsResults.length,
      hsCodeSuccesses: hsResults.filter(r => r.success).length,
      shippingTestSuccess: !!shippingResult && !shippingResult.error,
      enhancedWithLiveData: {
        hsCodesEnhanced: hsResults.some(r => r.hsCodeResult?.apiEnhanced),
        shippingEnhanced: shippingResult?.apiEnhanced
      }
    }
    
    console.log('✅ Stage flow API test completed')
    console.log('📊 Summary:', apiCallsSummary)
    
    return res.status(200).json({
      success: true,
      message: 'Stage flow API test completed',
      testData: {
        stage1Data,
        productDescriptions
      },
      results: {
        hsCodeResults: hsResults,
        shippingResult: shippingResult,
        apiCallsSummary
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Stage flow test error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      note: 'Stage flow test failed'
    })
  }
}