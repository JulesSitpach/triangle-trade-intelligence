/**
 * Test API: Volatile/Stable Data Separation
 * Validates that the enhanced system works correctly
 */

import DatabaseIntelligenceBridge, { StableDataManager, VolatileDataManager } from '../../lib/intelligence/database-intelligence-bridge.js'
import { logInfo, logPerformance } from '../../lib/utils/production-logger.js'

export default async function handler(req, res) {
  const startTime = Date.now()
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {}
  }

  try {
    logInfo('Starting volatile/stable separation test')

    // Test 1: Stable Data Performance (should be instant, no API calls)
    const stableTest1 = Date.now()
    const usmcaRates = await StableDataManager.getUSMCARates('MX-US')
    const stableTest1Duration = Date.now() - stableTest1

    testResults.tests.push({
      name: 'Stable Data: USMCA Rates',
      duration: stableTest1Duration,
      apiCallNeeded: usmcaRates.apiCallNeeded,
      result: usmcaRates.apiCallNeeded === false && stableTest1Duration < 200 ? 'PASS' : 'FAIL',
      details: {
        rate: usmcaRates.rate,
        source: usmcaRates.source,
        category: usmcaRates.category,
        volatilityLevel: usmcaRates.volatilityLevel
      }
    })

    // Test 2: More Stable Data (institutional memory)
    const stableTest2 = Date.now()
    const successPatterns = await StableDataManager.getSuccessPatterns('manufacturing')
    const stableTest2Duration = Date.now() - stableTest2

    testResults.tests.push({
      name: 'Stable Data: Success Patterns',
      duration: stableTest2Duration,
      apiCallNeeded: successPatterns.apiCallNeeded,
      result: successPatterns.apiCallNeeded === false && stableTest2Duration < 500 ? 'PASS' : 'FAIL',
      details: {
        patternCount: successPatterns.patterns?.length || 0,
        confidence: successPatterns.confidence,
        category: successPatterns.category
      }
    })

    // Test 3: Volatile Data Caching (should use cache or make API call)
    const volatileTest1 = Date.now()
    const tariffData = await VolatileDataManager.getOrFetchAPIData('tariff_rates', {
      country: 'CN',
      hsCode: '8471',
      businessType: 'electronics'
    })
    const volatileTest1Duration = Date.now() - volatileTest1

    testResults.tests.push({
      name: 'Volatile Data: Tariff Rates with Intelligent TTL',
      duration: volatileTest1Duration,
      source: tariffData.source,
      apiCallMade: tariffData.apiCallMade,
      result: tariffData.volatilityLevel && tariffData.cacheConfig ? 'PASS' : 'FAIL',
      details: {
        volatilityLevel: tariffData.volatilityLevel,
        cacheConfig: tariffData.cacheConfig,
        ttl: tariffData.cacheConfig?.ttl,
        cached: !tariffData.apiCallMade
      }
    })

    // Test 4: Cache Configuration System
    const cacheConfigs = {
      'tariff_rates': VolatileDataManager.getCacheConfig('tariff_rates'),
      'shipping_rates': VolatileDataManager.getCacheConfig('shipping_rates'),
      'exchange_rates': VolatileDataManager.getCacheConfig('exchange_rates')
    }

    testResults.tests.push({
      name: 'Cache Configuration System',
      duration: 1, // Instant
      result: Object.values(cacheConfigs).every(config => config.ttl && config.description) ? 'PASS' : 'FAIL',
      details: {
        configurations: Object.entries(cacheConfigs).map(([endpoint, config]) => ({
          endpoint,
          ttl: `${config.ttl/3600000}h`,
          description: config.description,
          volatilityLevel: VolatileDataManager.getVolatilityLevel(endpoint)
        }))
      }
    })

    // Test 5: Unified Intelligence Bridge (combines both systems)
    const unifiedTest = Date.now()
    const fullIntelligence = await DatabaseIntelligenceBridge.getTariffIntelligence({
      origin: 'CN',
      destination: 'US', 
      hsCode: '8471',
      businessType: 'electronics'
    })
    const unifiedTestDuration = Date.now() - unifiedTest

    testResults.tests.push({
      name: 'Unified Intelligence Bridge',
      duration: unifiedTestDuration,
      result: fullIntelligence.stable && fullIntelligence.volatile ? 'PASS' : 'FAIL',
      details: {
        stableComponents: Object.keys(fullIntelligence.stable || {}),
        volatileComponents: Object.keys(fullIntelligence.volatile || {}),
        recommendation: fullIntelligence.recommendation?.savings,
        apiCallsMade: fullIntelligence.recommendation?.apiCallsMade || 0
      }
    })

    // Test 6: Data Separation Status API
    try {
      const statusResponse = await fetch(`http://localhost:3000/api/intelligence/data-separation-status`)
      const statusData = statusResponse.ok ? await statusResponse.json() : null

      testResults.tests.push({
        name: 'Data Separation Status API',
        duration: statusData?.responseTime || 0,
        result: statusData?.status === 'SUCCESS' ? 'PASS' : 'FAIL',
        details: {
          systemActive: statusData?.system?.separationActive,
          volatileEndpoints: statusData?.volatileData?.endpoints?.length || 0,
          overallHitRate: statusData?.volatileData?.overallHitRate,
          totalStableRecords: statusData?.stableData?.totalRecords
        }
      })
    } catch (error) {
      testResults.tests.push({
        name: 'Data Separation Status API',
        duration: 0,
        result: 'FAIL',
        details: { error: error.message }
      })
    }

    // Calculate summary
    const passedTests = testResults.tests.filter(test => test.result === 'PASS').length
    const totalTests = testResults.tests.length
    const avgStableDuration = testResults.tests
      .filter(test => test.name.includes('Stable Data'))
      .reduce((sum, test) => sum + test.duration, 0) / testResults.tests.filter(test => test.name.includes('Stable Data')).length

    const totalApiCallsMade = testResults.tests
      .reduce((sum, test) => sum + (test.details?.apiCallsMade || 0), 0)

    testResults.summary = {
      overallResult: passedTests === totalTests ? 'ALL_TESTS_PASS' : 'SOME_TESTS_FAILED',
      testsPassedRatio: `${passedTests}/${totalTests}`,
      averageStableDataResponse: `${Math.round(avgStableDuration)}ms`,
      totalAPICallsMade: totalApiCallsMade,
      systemOptimization: totalApiCallsMade <= 2 ? 'EXCELLENT' : 'NEEDS_IMPROVEMENT',
      volatileStableSeparation: passedTests >= 4 ? 'WORKING' : 'NEEDS_FIX'
    }

    const totalDuration = Date.now() - startTime
    logPerformance('volatileStableSeparationTest', totalDuration, {
      testsRun: totalTests,
      testsPassed: passedTests,
      avgStableResponse: avgStableDuration,
      totalApiCalls: totalApiCallsMade
    })

    res.status(200).json(testResults)

  } catch (error) {
    logInfo('Volatile/stable separation test error', { error: error.message })
    res.status(500).json({
      error: 'Test execution failed',
      message: error.message,
      partialResults: testResults
    })
  }
}