/**
 * PHASE 0: AUDIT DATA FLOW VIOLATIONS
 * Scans for ComTrade API calls in StableDataManager where they shouldn't exist
 */

const fs = require('fs')
const path = require('path')

console.log('🚨 AUDITING DATA FLOW VIOLATIONS...')
console.log('=====================================')

async function auditDataFlowViolations() {
  const violations = []
  const bridgeFilePath = path.join(__dirname, '../lib/intelligence/database-intelligence-bridge.js')
  
  try {
    const bridgeContent = fs.readFileSync(bridgeFilePath, 'utf8')
    
    // Check for API calls in StableDataManager methods
    const stableDataManagerMatch = bridgeContent.match(/export class StableDataManager \{([\s\S]*?)^}/m)
    
    if (stableDataManagerMatch) {
      const stableDataManagerCode = stableDataManagerMatch[1]
      
      // Check for inappropriate API calls in StableDataManager
      const inappropriatePatterns = [
        { pattern: /fetchComtradeData/g, description: 'Direct ComTrade API calls in StableDataManager' },
        { pattern: /makeAPICall/g, description: 'Generic API calls in StableDataManager' },
        { pattern: /fetch\s*\(/g, description: 'Direct fetch() calls in StableDataManager' },
        { pattern: /comtradeapi\.un\.org/g, description: 'ComTrade API URL in StableDataManager' },
        { pattern: /getOrFetchAPIData/g, description: 'VolatileDataManager API calls in StableDataManager' }
      ]
      
      inappropriatePatterns.forEach(({ pattern, description }) => {
        const matches = stableDataManagerCode.match(pattern)
        if (matches) {
          violations.push({
            type: 'API_CALL_IN_STABLE_MANAGER',
            description: description,
            occurrences: matches.length,
            pattern: pattern.source
          })
        }
      })
      
      // Check for methods that should only query database
      const stableMethods = stableDataManagerCode.match(/static async (\w+)\(/g) || []
      
      console.log('\n📋 STABLE DATA MANAGER METHODS FOUND:')
      stableMethods.forEach(method => {
        const methodName = method.replace('static async ', '').replace('(', '')
        console.log(`  ✅ ${methodName}() - Should only query database`)
      })
      
      // Check for correct database patterns
      const databasePatterns = [
        { pattern: /supabase\.from\(/g, description: 'Proper database queries' },
        { pattern: /apiCallNeeded:\s*false/g, description: 'Correctly marked as no API needed' },
        { pattern: /source:\s*['"].*DATABASE.*['"]/g, description: 'Correctly marked as database source' }
      ]
      
      let correctPatterns = 0
      databasePatterns.forEach(({ pattern, description }) => {
        const matches = stableDataManagerCode.match(pattern)
        if (matches) {
          correctPatterns += matches.length
          console.log(`  ✅ ${description}: ${matches.length} occurrences`)
        }
      })
      
    } else {
      violations.push({
        type: 'STRUCTURE_ERROR',
        description: 'Could not find StableDataManager class structure'
      })
    }
    
    // Check VolatileDataManager for correct API usage
    const volatileDataManagerMatch = bridgeContent.match(/export class VolatileDataManager \{([\s\S]*?)^}/m)
    
    if (volatileDataManagerMatch) {
      const volatileDataManagerCode = volatileDataManagerMatch[1]
      
      const appropriatePatterns = [
        { pattern: /fetchComtradeData/g, description: 'ComTrade API calls (CORRECT in VolatileDataManager)' },
        { pattern: /makeAPICall/g, description: 'Generic API calls (CORRECT in VolatileDataManager)' },
        { pattern: /comtradeapi\.un\.org/g, description: 'ComTrade API URL (CORRECT in VolatileDataManager)' }
      ]
      
      console.log('\n📋 VOLATILE DATA MANAGER API USAGE:')
      appropriatePatterns.forEach(({ pattern, description }) => {
        const matches = volatileDataManagerCode.match(pattern)
        if (matches) {
          console.log(`  ✅ ${description}: ${matches.length} occurrences`)
        }
      })
    }
    
  } catch (error) {
    violations.push({
      type: 'FILE_READ_ERROR',
      description: `Could not read database intelligence bridge: ${error.message}`
    })
  }
  
  // Report results
  console.log('\n🔍 AUDIT RESULTS:')
  console.log('==================')
  
  if (violations.length === 0) {
    console.log('✅ NO VIOLATIONS FOUND!')
    console.log('Architecture follows correct volatile vs stable data separation')
    console.log('')
    console.log('CORRECT IMPLEMENTATION:')
    console.log('- StableDataManager: Only database queries (no API calls)')
    console.log('- VolatileDataManager: Handles all external API calls')
    console.log('- Proper separation of concerns maintained')
    
    return { 
      status: 'CLEAN', 
      violations: [], 
      message: 'Data flow architecture is correctly implemented' 
    }
  } else {
    console.log('❌ VIOLATIONS FOUND:')
    violations.forEach((violation, i) => {
      console.log(`\n${i + 1}. ${violation.type}`)
      console.log(`   Description: ${violation.description}`)
      if (violation.occurrences) {
        console.log(`   Occurrences: ${violation.occurrences}`)
      }
      if (violation.pattern) {
        console.log(`   Pattern: ${violation.pattern}`)
      }
    })
    
    return { 
      status: 'VIOLATIONS_FOUND', 
      violations,
      message: `Found ${violations.length} architecture violations that need fixing`
    }
  }
}

// Run the audit
auditDataFlowViolations()
  .then(result => {
    console.log('\n🎯 AUDIT COMPLETE')
    console.log(`Status: ${result.status}`)
    console.log(`Message: ${result.message}`)
    
    if (result.status === 'VIOLATIONS_FOUND') {
      console.log('\n🔧 NEXT STEPS:')
      console.log('1. Remove API calls from StableDataManager methods')
      console.log('2. Move any volatile data fetching to VolatileDataManager')
      console.log('3. Ensure all stable methods only query database')
      console.log('4. Test corrected data flow')
      process.exit(1)
    } else {
      console.log('\n✅ READY TO PROCEED TO NEXT PHASE')
      process.exit(0)
    }
  })
  .catch(error => {
    console.error('💥 Audit failed:', error)
    process.exit(1)
  })