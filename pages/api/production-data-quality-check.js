/**
 * Production Data Quality Check API
 * Validates that all systems are using real data and no hardcoded responses
 */

import DatabaseIntelligenceBridge, { StableDataManager, VolatileDataManager } from '../../lib/intelligence/database-intelligence-bridge.js'
import { getSupabaseClient } from '../../lib/supabase-client.js'
import { logInfo, logPerformance } from '../../lib/utils/production-logger.js'

const supabase = getSupabaseClient()

export default async function handler(req, res) {
  const startTime = Date.now()
  const qualityReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    status: 'CHECKING',
    tests: [],
    summary: {}
  }

  try {
    logInfo('Starting production data quality check')

    // Test 1: Environment Configuration
    const envTest = {
      name: 'Environment Configuration',
      status: 'RUNNING'
    }
    
    const mockAPIsEnabled = process.env.USE_MOCK_APIS === 'true' || process.env.USE_MOCK === 'true'
    const hasRealAPIKeys = !!(process.env.COMTRADE_API_KEY && process.env.SHIPPO_API_KEY && process.env.ANTHROPIC_API_KEY)
    
    envTest.result = {
      mockAPIsDisabled: !mockAPIsEnabled,
      realAPIKeysConfigured: hasRealAPIKeys,
      status: (!mockAPIsEnabled && hasRealAPIKeys) ? 'PASS' : 'NEEDS_ATTENTION',
      details: {
        USE_MOCK_APIS: process.env.USE_MOCK_APIS,
        USE_MOCK: process.env.USE_MOCK,
        hasComtradeKey: !!process.env.COMTRADE_API_KEY,
        hasShippoKey: !!process.env.SHIPPO_API_KEY,
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY
      }
    }
    qualityReport.tests.push(envTest)

    // Test 2: Database Connectivity & Data Volume
    const dbTest = {
      name: 'Database Data Quality',
      status: 'RUNNING'
    }
    
    const [tradeFlows, comtradeRef, sessions, patterns] = await Promise.all([
      supabase.from('trade_flows').select('id', { count: 'exact', head: true }),
      supabase.from('comtrade_reference').select('id', { count: 'exact', head: true }),
      supabase.from('workflow_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('hindsight_pattern_library').select('id', { count: 'exact', head: true })
    ])
    
    const totalRecords = (tradeFlows.count || 0) + (comtradeRef.count || 0) + 
                        (sessions.count || 0) + (patterns.count || 0)
    
    dbTest.result = {
      tradeFlows: tradeFlows.count || 0,
      comtradeReference: comtradeRef.count || 0,
      userSessions: sessions.count || 0,
      successPatterns: patterns.count || 0,
      totalRecords,
      status: totalRecords > 500000 ? 'PASS' : 'NEEDS_IMPROVEMENT',
      target: '519,341+ records for production intelligence'
    }
    qualityReport.tests.push(dbTest)

    // Test 3: Stable Data System
    const stableTest = {
      name: 'Stable Data System',
      status: 'RUNNING'
    }
    
    const startStable = Date.now()
    const usmcaRates = await StableDataManager.getUSMCARates('MX-US')
    const stableResponseTime = Date.now() - startStable
    
    stableTest.result = {
      responseTime: stableResponseTime,
      apiCallNeeded: usmcaRates.apiCallNeeded,
      dataSource: usmcaRates.source,
      category: usmcaRates.category,
      status: (!usmcaRates.apiCallNeeded && stableResponseTime < 500 && 
               usmcaRates.source === 'STABLE_DATABASE') ? 'PASS' : 'FAIL',
      details: {
        rate: usmcaRates.rate,
        volatilityLevel: usmcaRates.volatilityLevel,
        treatyStatus: usmcaRates.status
      }
    }
    qualityReport.tests.push(stableTest)

    // Test 4: Volatile Data Caching System
    const volatileTest = {
      name: 'Volatile Data Caching',
      status: 'RUNNING'
    }
    
    const cacheConfigs = ['tariff_rates', 'shipping_rates', 'exchange_rates'].map(endpoint => ({
      endpoint,
      config: VolatileDataManager.getCacheConfig(endpoint),
      volatility: VolatileDataManager.getVolatilityLevel(endpoint)
    }))
    
    const allConfigsValid = cacheConfigs.every(item => 
      item.config.ttl > 0 && item.config.description && item.volatility
    )
    
    volatileTest.result = {
      cacheConfigurations: cacheConfigs,
      intelligentTTL: allConfigsValid,
      status: allConfigsValid ? 'PASS' : 'FAIL'
    }
    qualityReport.tests.push(volatileTest)

    // Test 5: API Response Quality
    const apiTest = {
      name: 'API Response Quality',
      status: 'RUNNING'
    }
    
    try {
      // Test a core intelligence API
      const hsResponse = await fetch(`http://localhost:3000/api/intelligence/hs-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDescription: 'electronics', businessType: 'manufacturing' })
      })
      
      const hsData = hsResponse.ok ? await hsResponse.json() : null
      
      apiTest.result = {
        httpStatus: hsResponse.status,
        responseReceived: !!hsData,
        hardcodedData: hsData?.hardcoded === false,
        databaseUsed: !!hsData?.databaseRecordsUsed,
        totalSuggestions: hsData?.totalSuggestions || 0,
        processingTime: hsData?.processingTime,
        status: (hsResponse.ok && hsData?.hardcoded === false && hsData?.databaseRecordsUsed) ? 'PASS' : 'NEEDS_REVIEW'
      }
    } catch (error) {
      apiTest.result = {
        status: 'FAIL',
        error: error.message
      }
    }
    qualityReport.tests.push(apiTest)

    // Test 6: Data Source Transparency
    const transparencyTest = {
      name: 'Data Source Transparency',
      status: 'RUNNING'
    }
    
    try {
      const productResponse = await fetch(`http://localhost:3000/api/product-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessType: 'electronics', importVolume: '$1M - $5M' })
      })
      
      const productData = productResponse.ok ? await productResponse.json() : null
      
      const hasDataSource = !!productData?.source
      const hasRecordCount = !!(productData?.totalRows || productData?.totalRecords)
      const isRealData = productData?.source !== 'mock' && productData?.source !== 'hardcoded'
      
      transparencyTest.result = {
        httpStatus: productResponse.status,
        hasDataSourceLabel: hasDataSource,
        hasRecordCount: hasRecordCount,
        isRealData: isRealData,
        dataSource: productData?.source,
        recordCount: productData?.totalRows || productData?.totalRecords,
        status: (hasDataSource && hasRecordCount && isRealData) ? 'PASS' : 'NEEDS_IMPROVEMENT'
      }
    } catch (error) {
      transparencyTest.result = {
        status: 'FAIL',
        error: error.message
      }
    }
    qualityReport.tests.push(transparencyTest)

    // Calculate Summary
    const passedTests = qualityReport.tests.filter(test => test.result?.status === 'PASS').length
    const failedTests = qualityReport.tests.filter(test => test.result?.status === 'FAIL').length
    const needsAttention = qualityReport.tests.filter(test => 
      test.result?.status === 'NEEDS_ATTENTION' || test.result?.status === 'NEEDS_IMPROVEMENT' || test.result?.status === 'NEEDS_REVIEW'
    ).length
    
    const totalTests = qualityReport.tests.length
    const overallStatus = failedTests === 0 ? (needsAttention === 0 ? 'PRODUCTION_READY' : 'MINOR_ISSUES') : 'CRITICAL_ISSUES'
    
    qualityReport.summary = {
      overallStatus,
      testsRun: totalTests,
      passed: passedTests,
      failed: failedTests,
      needsAttention: needsAttention,
      successRate: Math.round((passedTests / totalTests) * 100),
      totalDatabaseRecords: dbTest.result?.totalRecords || 0,
      mockDataStatus: envTest.result?.mockAPIsDisabled ? 'DISABLED' : 'ENABLED',
      dataIntegrity: dbTest.result?.status === 'PASS' ? 'HIGH' : 'NEEDS_IMPROVEMENT',
      recommendations: generateRecommendations(qualityReport.tests)
    }

    qualityReport.status = overallStatus
    
    const totalDuration = Date.now() - startTime
    logPerformance('productionDataQualityCheck', totalDuration, {
      testsRun: totalTests,
      overallStatus,
      databaseRecords: dbTest.result?.totalRecords
    })

    res.status(200).json(qualityReport)

  } catch (error) {
    logInfo('Production data quality check error', { error: error.message })
    res.status(500).json({
      ...qualityReport,
      status: 'SYSTEM_ERROR',
      error: error.message
    })
  }
}

function generateRecommendations(tests) {
  const recommendations = []
  
  tests.forEach(test => {
    switch (test.result?.status) {
      case 'FAIL':
        recommendations.push({
          priority: 'CRITICAL',
          area: test.name,
          issue: `${test.name} test failed`,
          action: 'Immediate investigation required',
          impact: 'System may not be production ready'
        })
        break
        
      case 'NEEDS_ATTENTION':
        recommendations.push({
          priority: 'HIGH',
          area: test.name,
          issue: `${test.name} needs configuration`,
          action: 'Review environment configuration and API keys',
          impact: 'Some features may fall back to reduced functionality'
        })
        break
        
      case 'NEEDS_IMPROVEMENT':
        recommendations.push({
          priority: 'MEDIUM',
          area: test.name,
          issue: `${test.name} could be optimized`,
          action: 'Consider data population or performance tuning',
          impact: 'System works but not at full capacity'
        })
        break
    }
  })
  
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'INFO',
      area: 'Overall System',
      issue: 'All tests passed successfully',
      action: 'No immediate action required',
      impact: 'System is production ready'
    })
  }
  
  return recommendations
}