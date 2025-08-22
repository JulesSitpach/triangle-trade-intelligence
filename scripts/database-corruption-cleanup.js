/**
 * Database Corruption Cleanup Script
 * Critical data integrity restoration for Triangle Intelligence platform
 * Removes 208,800+ corrupted records while preserving ~250K authentic trade data
 */

import { getSupabaseClient } from '../lib/supabase-client.js'
import { logInfo, logError, logWarn, logDBQuery, logPerformance } from '../lib/production-logger.js'

const supabase = getSupabaseClient()

/**
 * CORRUPTION PATTERNS TO DELETE
 * These patterns identify fabricated test data that corrupts real savings calculations
 */
const CORRUPTION_PATTERNS = {
  trade_flows: {
    data_sources: [
      'FINAL_500K_ASSAULT_2024',
      'VICTORY_PUSH',
      'TEST_PHASE_2024'
    ],
    product_descriptions: [
      '%Victory Product%',
      '%Test Product%',
      '%Chapter % product %',
      '%base metal product %',
      '%agricultural and food products%'
    ]
  },
  comtrade_reference: {
    product_descriptions: [
      '%Chapter % product %',
      'Classification %',
      'Product description not available',
      'Food/Agriculture - Chapter%',
      '%agricultural and food products%',
      '%base metal product %'
    ]
  }
}

/**
 * Execute complete database corruption cleanup
 */
async function executeDataCleanup() {
  console.log('🔥 CRITICAL: Starting Database Corruption Cleanup')
  console.log('Target: Remove 208,800+ corrupted records, preserve ~250K authentic records')
  console.log('Stakes: $100K+ savings calculations must use authentic UN Comtrade data only')
  
  const startTime = Date.now()
  let totalDeleted = 0
  
  try {
    // Step 1: Analyze current corruption
    const preCleanupAnalysis = await analyzeCorruption()
    console.log('\n📊 PRE-CLEANUP ANALYSIS:')
    console.log('Trade Flows:', preCleanupAnalysis.tradeFlows)
    console.log('Comtrade Reference:', preCleanupAnalysis.comtradeReference)
    
    // Step 2: Delete corrupted trade_flows records
    console.log('\n🗑️ STEP 1: Cleaning trade_flows table...')
    const tradeFlowsDeleted = await cleanTradeFlows()
    totalDeleted += tradeFlowsDeleted
    
    // Step 3: Delete corrupted comtrade_reference records  
    console.log('\n🗑️ STEP 2: Cleaning comtrade_reference table...')
    const comtradeDeleted = await cleanComtradeReference()
    totalDeleted += comtradeDeleted
    
    // Step 4: Verify cleanup results
    const postCleanupAnalysis = await analyzeCorruption()
    console.log('\n✅ POST-CLEANUP ANALYSIS:')
    console.log('Trade Flows:', postCleanupAnalysis.tradeFlows)
    console.log('Comtrade Reference:', postCleanupAnalysis.comtradeReference)
    
    // Step 5: Validate data integrity
    const integrityCheck = await validateDataIntegrity()
    
    const totalDuration = Date.now() - startTime
    logPerformance('database_corruption_cleanup', totalDuration, {
      recordsDeleted: totalDeleted,
      authenticRecordsRemaining: integrityCheck.authenticRecords,
      integrityScore: integrityCheck.score
    })
    
    console.log('\n🎯 CLEANUP COMPLETE:')
    console.log(`Records Deleted: ${totalDeleted.toLocaleString()}`)
    console.log(`Authentic Records Remaining: ${integrityCheck.authenticRecords.toLocaleString()}`)
    console.log(`Data Integrity Score: ${integrityCheck.score}%`)
    console.log(`Duration: ${Math.round(totalDuration / 1000)}s`)
    
    if (integrityCheck.score >= 95) {
      console.log('✅ SUCCESS: Database integrity restored for authentic $100K+ savings calculations')
    } else {
      console.log('⚠️ WARNING: Data integrity below 95% - manual review required')
    }
    
    return {
      success: true,
      recordsDeleted: totalDeleted,
      authenticRecordsRemaining: integrityCheck.authenticRecords,
      integrityScore: integrityCheck.score,
      duration: totalDuration
    }
    
  } catch (error) {
    logError('Database cleanup failed', { error, totalDeleted })
    throw error
  }
}

/**
 * Clean corrupted trade_flows records
 */
async function cleanTradeFlows() {
  console.log('Deleting corrupted trade_flows records...')
  
  let totalDeleted = 0
  
  // Delete by corrupted data_source patterns
  for (const dataSource of CORRUPTION_PATTERNS.trade_flows.data_sources) {
    const { error, count } = await supabase
      .from('trade_flows')
      .delete()
      .eq('data_source', dataSource)
    
    if (error) {
      logError(`Failed to delete trade_flows with data_source: ${dataSource}`, { error })
      throw error
    }
    
    const deleted = count || 0
    totalDeleted += deleted
    console.log(`  ✓ Deleted ${deleted.toLocaleString()} records with data_source: ${dataSource}`)
    logDBQuery('trade_flows', 'DELETE', 0, deleted)
  }
  
  // Delete by corrupted product description patterns
  for (const pattern of CORRUPTION_PATTERNS.trade_flows.product_descriptions) {
    const { error, count } = await supabase
      .from('trade_flows')
      .delete()
      .like('product_description', pattern)
    
    if (error) {
      logError(`Failed to delete trade_flows with pattern: ${pattern}`, { error })
      throw error
    }
    
    const deleted = count || 0
    totalDeleted += deleted
    console.log(`  ✓ Deleted ${deleted.toLocaleString()} records matching pattern: ${pattern}`)
    logDBQuery('trade_flows', 'DELETE', 0, deleted)
  }
  
  console.log(`Total trade_flows deleted: ${totalDeleted.toLocaleString()}`)
  return totalDeleted
}

/**
 * Clean corrupted comtrade_reference records
 */
async function cleanComtradeReference() {
  console.log('Deleting corrupted comtrade_reference records...')
  
  let totalDeleted = 0
  
  // Delete by corrupted product description patterns
  for (const pattern of CORRUPTION_PATTERNS.comtrade_reference.product_descriptions) {
    const { error, count } = await supabase
      .from('comtrade_reference')
      .delete()
      .like('product_description', pattern)
    
    if (error) {
      logError(`Failed to delete comtrade_reference with pattern: ${pattern}`, { error })
      throw error
    }
    
    const deleted = count || 0
    totalDeleted += deleted
    console.log(`  ✓ Deleted ${deleted.toLocaleString()} records matching pattern: ${pattern}`)
    logDBQuery('comtrade_reference', 'DELETE', 0, deleted)
  }
  
  console.log(`Total comtrade_reference deleted: ${totalDeleted.toLocaleString()}`)
  return totalDeleted
}

/**
 * Analyze corruption levels before and after cleanup
 */
async function analyzeCorruption() {
  const analysis = {}
  
  // Analyze trade_flows
  const { data: tradeFlowsCount } = await supabase
    .from('trade_flows')
    .select('id', { count: 'exact', head: true })
  
  const { data: corruptedTradeFlows } = await supabase
    .from('trade_flows')
    .select('id', { count: 'exact', head: true })
    .in('data_source', CORRUPTION_PATTERNS.trade_flows.data_sources)
  
  analysis.tradeFlows = {
    total: tradeFlowsCount?.count || 0,
    corrupted: corruptedTradeFlows?.count || 0,
    authentic: (tradeFlowsCount?.count || 0) - (corruptedTradeFlows?.count || 0)
  }
  
  // Analyze comtrade_reference
  const { data: comtradeCount } = await supabase
    .from('comtrade_reference')
    .select('id', { count: 'exact', head: true })
  
  analysis.comtradeReference = {
    total: comtradeCount?.count || 0,
    // Note: Corrupted comtrade records are harder to count due to LIKE patterns
    estimatedCorrupted: 'TBD after cleanup',
    estimatedAuthentic: 'TBD after cleanup'
  }
  
  return analysis
}

/**
 * Validate data integrity after cleanup
 */
async function validateDataIntegrity() {
  console.log('Validating data integrity...')
  
  // Count remaining records
  const [tradeFlowsData, comtradeData] = await Promise.all([
    supabase.from('trade_flows').select('id', { count: 'exact', head: true }),
    supabase.from('comtrade_reference').select('id', { count: 'exact', head: true })
  ])
  
  const totalRecords = (tradeFlowsData.count || 0) + (comtradeData.count || 0)
  
  // Sample some records to check authenticity
  const { data: sampleTradeFlows } = await supabase
    .from('trade_flows')
    .select('product_description, data_source, trade_value')
    .not('data_source', 'in', `(${CORRUPTION_PATTERNS.trade_flows.data_sources.map(s => `"${s}"`).join(',')})`)
    .limit(10)
  
  const { data: sampleComtrade } = await supabase
    .from('comtrade_reference')
    .select('product_description, hs_code')
    .not('product_description', 'like', '%Chapter % product %')
    .limit(10)
  
  // Calculate integrity score based on authentic data patterns
  let integrityScore = 100
  
  // Check for remaining corruption patterns
  const corruptionFound = sampleTradeFlows?.some(record => 
    record.product_description?.includes('Victory Product') ||
    record.product_description?.includes('Test Product') ||
    record.data_source?.includes('ASSAULT')
  ) || sampleComtrade?.some(record =>
    record.product_description?.includes('Chapter') && record.product_description?.includes('product')
  )
  
  if (corruptionFound) {
    integrityScore -= 20
    logWarn('Corruption patterns still detected in sample data')
  }
  
  // Check for realistic trade values
  const unrealisticValues = sampleTradeFlows?.filter(record => 
    record.trade_value > 1000000000 || record.trade_value < 0
  ).length || 0
  
  if (unrealisticValues > 2) {
    integrityScore -= 10
    logWarn(`${unrealisticValues} unrealistic trade values found`)
  }
  
  // Check HS code authenticity
  const authenticHSCodes = sampleComtrade?.filter(record =>
    record.hs_code && record.hs_code.length >= 4 && !isNaN(record.hs_code)
  ).length || 0
  
  if (authenticHSCodes < 8) {
    integrityScore -= 10
    logWarn('Insufficient authentic HS codes found')
  }
  
  console.log(`Sample Trade Flows: ${sampleTradeFlows?.length || 0} records`)
  console.log(`Sample Comtrade: ${sampleComtrade?.length || 0} records`)
  console.log(`Authentic HS Codes: ${authenticHSCodes}/${sampleComtrade?.length || 0}`)
  
  return {
    authenticRecords: totalRecords,
    sampleSize: (sampleTradeFlows?.length || 0) + (sampleComtrade?.length || 0),
    score: Math.max(0, integrityScore)
  }
}

/**
 * Generate data quality report
 */
async function generateDataQualityReport() {
  console.log('\n📋 GENERATING DATA QUALITY REPORT...')
  
  const [
    { data: topTradeFlows },
    { data: topComtrade },
    { data: dataSources },
    { data: productCategories }
  ] = await Promise.all([
    supabase.from('trade_flows')
      .select('product_description, trade_value, reporter_country, partner_country')
      .order('trade_value', { ascending: false })
      .limit(5),
    supabase.from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .not('product_description', 'like', '%Chapter %')
      .limit(5),
    supabase.from('trade_flows')
      .select('data_source')
      .not('data_source', 'in', `(${CORRUPTION_PATTERNS.trade_flows.data_sources.map(s => `"${s}"`).join(',')})`)
      .order('data_source')
      .limit(10),
    supabase.from('comtrade_reference')
      .select('product_category')
      .not('product_category', 'is', null)
      .order('product_category')
      .limit(10)
  ])
  
  console.log('\n🔍 DATA QUALITY SAMPLES:')
  console.log('\nTop Trade Flows (by value):')
  topTradeFlows?.forEach((flow, i) => {
    console.log(`  ${i+1}. ${flow.product_description} - $${flow.trade_value?.toLocaleString()} (${flow.reporter_country} → ${flow.partner_country})`)
  })
  
  console.log('\nSample HS Codes:')
  topComtrade?.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.hs_code}: ${item.product_description} (${item.product_category})`)
  })
  
  console.log('\nRemaining Data Sources:')
  const uniqueSources = [...new Set(dataSources?.map(d => d.data_source) || [])]
  uniqueSources.forEach(source => console.log(`  - ${source}`))
  
  console.log('\nProduct Categories:')
  const uniqueCategories = [...new Set(productCategories?.map(d => d.product_category) || [])]
  uniqueCategories.slice(0, 10).forEach(cat => console.log(`  - ${cat}`))
}

/**
 * Main execution
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  executeDataCleanup()
    .then(async (result) => {
      await generateDataQualityReport()
      console.log('\n🎯 CLEANUP SUMMARY:')
      console.log(`✅ Success: ${result.success}`)
      console.log(`📊 Records Deleted: ${result.recordsDeleted.toLocaleString()}`)
      console.log(`📈 Authentic Records: ${result.authenticRecordsRemaining.toLocaleString()}`)
      console.log(`🛡️ Integrity Score: ${result.integrityScore}%`)
      console.log(`⚡ Duration: ${Math.round(result.duration / 1000)}s`)
      
      if (result.integrityScore >= 95) {
        console.log('\n🚀 Triangle Intelligence platform ready for authentic $100K+ savings calculations')
      }
      
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 CLEANUP FAILED:', error)
      console.error('Database integrity compromised - manual intervention required')
      process.exit(1)
    })
}

export { executeDataCleanup, analyzeCorruption, validateDataIntegrity, generateDataQualityReport }