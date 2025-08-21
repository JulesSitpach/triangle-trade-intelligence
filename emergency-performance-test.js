/**
 * EMERGENCY PERFORMANCE TEST SCRIPT
 * Tests Beast Master Intelligence System performance after critical optimizations
 * 
 * Run with: node emergency-performance-test.js
 * Expected: All tests complete under 5 seconds, Beast Master under 2 seconds
 */

import { BeastMasterController } from './lib/intelligence/beast-master-controller.js';
import UnifiedGoldmineIntelligence from './lib/intelligence/goldmine-intelligence.js';
import { logInfo, logError, logPerformance } from './lib/production-logger.js';

// Test user profile for performance testing
const testUserProfile = {
  businessType: 'Electronics',
  primarySupplierCountry: 'CN', 
  importVolume: '$1M - $5M',
  companyName: 'Emergency Performance Test',
  timelinePriority: 'COST',
  currentPage: 'performance_test'
};

async function runEmergencyPerformanceTest() {
  console.log('🚨 EMERGENCY PERFORMANCE TEST STARTING...');
  console.log('Expected: Beast Master < 2000ms, All tests < 5000ms\n');
  
  const overallStartTime = Date.now();
  const results = {
    beastMaster: null,
    goldmine: null,
    similarityIntelligence: null,
    successPatterns: null,
    overallTime: null,
    status: 'UNKNOWN'
  };
  
  try {
    // 1. Test Beast Master Controller (CRITICAL - must be under 2000ms)
    console.log('1. Testing Beast Master Controller...');
    const beastStartTime = Date.now();
    
    const beastResults = await BeastMasterController.activateAllBeasts(
      testUserProfile,
      'performance_test',
      { source: 'emergency_test', realTime: true }
    );
    
    const beastTime = Date.now() - beastStartTime;
    results.beastMaster = {
      time: beastTime,
      status: beastResults.status,
      beasts: Object.keys(beastResults.beasts || {}),
      compoundInsights: beastResults.unified?.insights?.compound?.length || 0,
      passed: beastTime < 2000
    };
    
    console.log(`   ✓ Beast Master: ${beastTime}ms (${beastTime < 2000 ? 'PASS' : 'FAIL - TIMEOUT'})`);
    console.log(`   ✓ Compound Insights: ${results.beastMaster.compoundInsights}`);
    console.log(`   ✓ Status: ${results.beastMaster.status}\n`);
    
    // 2. Test Goldmine Intelligence (should be under 1000ms)
    console.log('2. Testing Goldmine Intelligence...');
    const goldmineStartTime = Date.now();
    
    const goldmineResults = await UnifiedGoldmineIntelligence.getFoundationIntelligence(testUserProfile);
    
    const goldmineTime = Date.now() - goldmineStartTime;
    results.goldmine = {
      time: goldmineTime,
      totalRecords: goldmineResults.summary?.totalRecords,
      confidenceScore: goldmineResults.summary?.confidenceScore,
      networkEffects: goldmineResults.volatile?.networkEffectsEnabled,
      passed: goldmineTime < 1000
    };
    
    console.log(`   ✓ Goldmine: ${goldmineTime}ms (${goldmineTime < 1000 ? 'PASS' : 'FAIL - TIMEOUT'})`);
    console.log(`   ✓ Total Records: ${results.goldmine.totalRecords}`);
    console.log(`   ✓ Confidence: ${results.goldmine.confidenceScore}%\n`);
    
    // 3. Test Individual Beast Methods (should each be under 800ms)
    console.log('3. Testing Individual Beast Methods...');
    
    // Similarity Intelligence
    const simStartTime = Date.now();
    const simResults = await BeastMasterController.getSimilarityIntelligenceFast(testUserProfile);
    const simTime = Date.now() - simStartTime;
    
    results.similarityIntelligence = {
      time: simTime,
      matches: simResults.matches?.length || 0,
      dataQuality: simResults.dataQuality,
      passed: simTime < 800
    };
    
    console.log(`   ✓ Similarity: ${simTime}ms (${simTime < 800 ? 'PASS' : 'FAIL - TIMEOUT'})`);
    console.log(`   ✓ Matches: ${results.similarityIntelligence.matches}`);
    
    // Success Patterns
    const patternsStartTime = Date.now();
    const patternsResults = await BeastMasterController.getSuccessPatternsOptimized(testUserProfile);
    const patternsTime = Date.now() - patternsStartTime;
    
    results.successPatterns = {
      time: patternsTime,
      patterns: patternsResults.patterns?.length || 0,
      dataQuality: patternsResults.dataQuality,
      passed: patternsTime < 600
    };
    
    console.log(`   ✓ Success Patterns: ${patternsTime}ms (${patternsTime < 600 ? 'PASS' : 'FAIL - TIMEOUT'})`);
    console.log(`   ✓ Patterns: ${results.successPatterns.patterns}\n`);
    
    // Calculate overall results
    const overallTime = Date.now() - overallStartTime;
    results.overallTime = overallTime;
    
    const allPassed = results.beastMaster.passed && 
                     results.goldmine.passed && 
                     results.similarityIntelligence.passed && 
                     results.successPatterns.passed;
    
    results.status = allPassed ? 'PERFORMANCE_RESTORED' : 'PERFORMANCE_ISSUES_REMAIN';
    
    // Final Results
    console.log('🏁 EMERGENCY PERFORMANCE TEST RESULTS');
    console.log('=====================================');
    console.log(`Overall Time: ${overallTime}ms`);
    console.log(`Status: ${results.status}`);
    console.log(`\nDetailed Results:`);
    console.log(`  Beast Master: ${results.beastMaster.time}ms (Target: <2000ms) - ${results.beastMaster.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Goldmine: ${results.goldmine.time}ms (Target: <1000ms) - ${results.goldmine.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Similarity: ${results.similarityIntelligence.time}ms (Target: <800ms) - ${results.similarityIntelligence.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Success Patterns: ${results.successPatterns.time}ms (Target: <600ms) - ${results.successPatterns.passed ? '✅ PASS' : '❌ FAIL'}`);
    
    if (allPassed) {
      console.log('\n🎉 PERFORMANCE CRISIS RESOLVED!');
      console.log('System ready for customer demonstrations.');
    } else {
      console.log('\n⚠️  PERFORMANCE ISSUES REMAIN');
      console.log('Additional optimization required before customer demos.');
    }
    
    // Log performance metrics
    logPerformance('emergency_performance_test', overallTime, {
      beastMasterTime: results.beastMaster.time,
      goldmineTime: results.goldmine.time,
      allTestsPassed: allPassed,
      status: results.status
    });
    
    return results;
    
  } catch (error) {
    const overallTime = Date.now() - overallStartTime;
    
    console.error('\n❌ EMERGENCY PERFORMANCE TEST FAILED');
    console.error(`Error: ${error.message}`);
    console.error(`Time before failure: ${overallTime}ms`);
    
    logError('Emergency performance test failed', {
      error: error.message,
      timeBeforeFailure: overallTime,
      testPhase: 'UNKNOWN'
    });
    
    results.status = 'CRITICAL_FAILURE';
    results.overallTime = overallTime;
    results.error = error.message;
    
    return results;
  }
}

// Memory monitoring during test
function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB'
  };
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Memory before test:', getMemoryUsage());
  
  runEmergencyPerformanceTest()
    .then(results => {
      console.log('\nMemory after test:', getMemoryUsage());
      
      // Exit with appropriate code
      if (results.status === 'PERFORMANCE_RESTORED') {
        process.exit(0); // Success
      } else {
        process.exit(1); // Performance issues remain
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      console.log('Memory at failure:', getMemoryUsage());
      process.exit(2); // Critical failure
    });
}

export default runEmergencyPerformanceTest;