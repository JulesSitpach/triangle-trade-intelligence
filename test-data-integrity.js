/**
 * Test Data Integrity and Enhanced Database Intelligence Bridge
 * Verifies corruption detection and authentic data filtering
 */

import DatabaseIntelligenceBridge, { StableDataManager } from './lib/intelligence/database-intelligence-bridge.js'
import { logInfo, logError } from './lib/production-logger.js'

async function testDataIntegrity() {
  console.log('🔍 TESTING DATA INTEGRITY AND CORRUPTION DETECTION')
  console.log('Objective: Verify enhanced Database Intelligence Bridge filters corrupted data')
  
  try {
    // Test 1: Comtrade Reference Data Quality
    console.log('\n📊 TEST 1: Comtrade Reference Data Quality')
    const comtradeData = await StableDataManager.getTradeFlowsData({
      productCategory: 'Electronics',
      limit: 20
    })
    
    console.log(`Records Returned: ${comtradeData.totalRecords}`)
    console.log(`Data Quality Score: ${comtradeData.dataQuality?.qualityScore || 'N/A'}%`)
    console.log(`Corrupted Filtered: ${comtradeData.dataQuality?.corruptedFiltered || 0}`)
    
    // Check sample data for corruption patterns
    const sampleRecord = comtradeData.records?.[0]
    if (sampleRecord) {
      console.log('\nSample Record:')
      console.log(`  HS Code: ${sampleRecord.hs_code}`)
      console.log(`  Description: ${sampleRecord.product_description}`)
      console.log(`  Category: ${sampleRecord.product_category}`)
      
      const isCorrupted = StableDataManager.detectCorruptedData(sampleRecord)
      console.log(`  Corruption Detected: ${isCorrupted ? '❌ YES' : '✅ NO'}`)
    }
    
    // Test 2: Authentic Trade Flows
    console.log('\n🌊 TEST 2: Authentic Trade Flows')
    const tradeFlows = await DatabaseIntelligenceBridge.getAuthenticTradeFlows({
      origin: 'China',
      destination: 'USA',
      limit: 10
    })
    
    console.log(`Trade Flows Found: ${tradeFlows.totalFlows}`)
    console.log(`Data Quality Score: ${tradeFlows.dataQuality?.qualityScore || 'N/A'}%`)
    console.log(`Corrupted Filtered: ${tradeFlows.dataQuality?.corruptedFiltered || 0}`)
    
    if (tradeFlows.flows?.length > 0) {
      console.log('\nSample Trade Flow:')
      const flow = tradeFlows.flows[0]
      console.log(`  Product: ${flow.product_description}`)
      console.log(`  Trade Value: $${flow.trade_value?.toLocaleString()}`)
      console.log(`  Data Source: ${flow.data_source}`)
      
      const isCorrupted = StableDataManager.detectCorruptedData(flow)
      console.log(`  Corruption Detected: ${isCorrupted ? '❌ YES' : '✅ NO'}`)
    }
    
    // Test 3: Triangle Routing Intelligence with Validation
    console.log('\n🔺 TEST 3: Triangle Routing Intelligence with Data Validation')
    const routingIntelligence = await DatabaseIntelligenceBridge.getTriangleRoutingIntelligence({
      origin: 'CN',
      destination: 'US',
      hsCode: '847110',
      businessType: 'Electronics',
      importVolume: '$1M - $5M'
    })
    
    console.log(`Triangle Options: ${routingIntelligence.triangleOptions?.length || 0}`)
    console.log(`Analysis Confidence: ${routingIntelligence.analysis?.confidence || 'N/A'}%`)
    console.log(`Data Source: ${routingIntelligence.analysis?.dataSource || 'N/A'}`)
    
    // Test 4: HS Code Validation with Authentic Data
    console.log('\n🔖 TEST 4: HS Code Validation with Authentic Data')
    const hsCodeData = await StableDataManager.getComtradeReference('847110')
    
    console.log(`HS Code Records: ${hsCodeData.totalRecords}`)
    console.log(`Confidence: ${hsCodeData.confidence}%`)
    console.log(`Corruption Detected: ${hsCodeData.corruptionDetected ? '❌ YES' : '✅ NO'}`)
    
    if (hsCodeData.records?.length > 0) {
      const record = hsCodeData.records[0]
      console.log(`Description: ${record.product_description}`)
      console.log(`Data Source: ${record.data_source || 'N/A'}`)
    }
    
    // Test 5: Corruption Pattern Detection
    console.log('\n⚠️  TEST 5: Corruption Pattern Detection')
    
    const testRecords = [
      {
        product_description: 'Live horses, pure-bred breeding animals',
        data_source: 'WCO_OFFICIAL',
        trade_value: 150000
      },
      {
        product_description: 'Food/Agriculture - Chapter 1 product 1 - Agricultural and food products',
        data_source: 'BACKUP_DATA',
        trade_value: 50000
      },
      {
        product_description: 'Victory Product Testing',
        data_source: 'FINAL_500K_ASSAULT_2024',
        trade_value: 999999999999
      }
    ]
    
    testRecords.forEach((record, i) => {
      const isCorrupted = StableDataManager.detectCorruptedData(record)
      console.log(`Record ${i+1}: ${isCorrupted ? '❌ CORRUPTED' : '✅ AUTHENTIC'}`)
      console.log(`  ${record.product_description.substring(0, 50)}...`)
    })
    
    // Overall Assessment
    console.log('\n🎯 OVERALL DATA INTEGRITY ASSESSMENT')
    
    const totalRecordsChecked = (comtradeData.totalRecords || 0) + (tradeFlows.totalFlows || 0)
    const totalCorruptedFiltered = (comtradeData.dataQuality?.corruptedFiltered || 0) + 
                                  (tradeFlows.dataQuality?.corruptedFiltered || 0)
    
    const overallQuality = totalRecordsChecked > 0 ? 
      Math.round(((totalRecordsChecked - totalCorruptedFiltered) / totalRecordsChecked) * 100) : 0
    
    console.log(`Total Records Analyzed: ${totalRecordsChecked}`)
    console.log(`Corrupted Records Filtered: ${totalCorruptedFiltered}`)
    console.log(`Overall Data Quality: ${overallQuality}%`)
    
    const isSystemReady = overallQuality >= 90 && 
                         routingIntelligence.triangleOptions?.length > 0 &&
                         !hsCodeData.corruptionDetected
    
    console.log(`System Ready for $100K+ Calculations: ${isSystemReady ? '✅ YES' : '❌ NO'}`)
    
    return {
      success: true,
      dataQuality: overallQuality,
      corruptedFiltered: totalCorruptedFiltered,
      systemReady: isSystemReady,
      tests: {
        comtradeData: comtradeData.dataQuality?.qualityScore || 0,
        tradeFlows: tradeFlows.dataQuality?.qualityScore || 0,
        triangleRouting: routingIntelligence.analysis?.confidence || 0,
        hsCodeValidation: hsCodeData.confidence || 0
      }
    }
    
  } catch (error) {
    logError('Data integrity test failed', { error })
    console.error('💥 TEST FAILED:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Execute test
testDataIntegrity()
  .then(result => {
    console.log('\n📋 TEST SUMMARY:')
    console.log(`Success: ${result.success}`)
    if (result.success) {
      console.log(`Data Quality: ${result.dataQuality}%`)
      console.log(`System Ready: ${result.systemReady}`)
      console.log(`Test Scores:`, result.tests)
      
      if (result.systemReady) {
        console.log('\n🚀 TRIANGLE INTELLIGENCE READY FOR AUTHENTIC $100K+ SAVINGS!')
      } else {
        console.log('\n⚠️  System requires additional data cleanup')
      }
    }
    process.exit(result.success ? 0 : 1)
  })
  .catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })