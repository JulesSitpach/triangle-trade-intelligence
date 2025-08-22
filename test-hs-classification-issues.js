/**
 * Test script to verify HS code classification issues
 * Tests the exact problems mentioned: invalid formats, incorrect classifications, vague confidence
 */

import { fastHSClassifier } from './lib/fast-hs-classifier.js'
import DatabaseIntelligenceBridge, { StableDataManager } from './lib/intelligence/database-intelligence-bridge.js'

async function testHSCodeIssues() {
  console.log('🔍 TESTING HS CODE CLASSIFICATION ISSUES')
  console.log('=' .repeat(60))

  // Test 1: Check format validation for invalid codes
  console.log('\n1. Testing invalid HS code format: "0100.01"')
  try {
    const result = await fastHSClassifier.classifyProduct('live horses', 'Agriculture')
    console.log('Result:', result[0])
    
    if (result[0]?.code === '0100.01') {
      console.log('❌ ISSUE CONFIRMED: Invalid format "0100.01" (should be 6+ digits, no decimals)')
    } else {
      console.log('Current code format:', result[0]?.code)
    }
  } catch (error) {
    console.log('Error:', error.message)
  }

  // Test 2: Check classification accuracy for HS code 010001
  console.log('\n2. Testing HS code 010001 classification')
  try {
    const result = await StableDataManager.getComtradeReference('010001')
    console.log('Database result for 010001:', result.records[0])
    
    if (result.records[0]?.product_description?.includes('Food/Agriculture')) {
      console.log('❌ ISSUE CONFIRMED: Code 010001 showing as "Food/Agriculture" instead of "Live horses, pure-bred breeding animals"')
    }
  } catch (error) {
    console.log('Error fetching 010001:', error.message)
  }

  // Test 3: Test sample codes for correct classifications
  const testCodes = ['010001', '010290', '020110']
  console.log('\n3. Testing sample codes for correct WCO classifications')
  
  for (const code of testCodes) {
    try {
      const result = await StableDataManager.getComtradeReference(code)
      console.log(`\nHS Code ${code}:`)
      console.log('  Current description:', result.records[0]?.product_description || 'Not found')
      
      // Expected WCO classifications
      const expectedClassifications = {
        '010001': 'Live horses, pure-bred breeding animals',
        '010290': 'Live bovine animals, other',
        '020110': 'Carcasses and half-carcasses of bovine animals, fresh or chilled'
      }
      
      const expected = expectedClassifications[code]
      console.log('  Expected WCO description:', expected)
      
      if (result.records[0]?.product_description !== expected) {
        console.log('  ❌ MISMATCH DETECTED')
      } else {
        console.log('  ✅ CORRECT')
      }
    } catch (error) {
      console.log(`  Error with ${code}:`, error.message)
    }
  }

  // Test 4: Check confidence calculation methodology
  console.log('\n4. Testing confidence calculation transparency')
  try {
    const result = await fastHSClassifier.classifyProduct('smartphone', 'Electronics')
    console.log('Classification result:', result[0])
    console.log('Confidence:', result[0]?.confidence)
    console.log('Source:', result[0]?.source)
    
    if (!result[0]?.matchType || !result[0]?.source) {
      console.log('❌ ISSUE CONFIRMED: Vague confidence metrics without clear calculation methodology')
    }
  } catch (error) {
    console.log('Error:', error.message)
  }

  // Test 5: Check HS code format validation
  console.log('\n5. Testing HS code format validation')
  const testFormats = ['0100.01', '010001', '8517.62', '851762']
  
  for (const format of testFormats) {
    const isValid = validateHSCodeFormat(format)
    console.log(`Format "${format}": ${isValid ? '✅ Valid' : '❌ Invalid'}`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('🎯 TEST COMPLETE - Issues identified for fixing')
}

function validateHSCodeFormat(code) {
  // Proper HS code validation
  const cleaned = code.replace(/\D/g, '') // Remove non-digits
  return cleaned.length >= 6 && !code.includes('.')
}

// Run the test
testHSCodeIssues().catch(console.error)