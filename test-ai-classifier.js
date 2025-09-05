/**
 * TEST SCRIPT FOR AI-POWERED HS CLASSIFIER
 * Tests the new intelligent classification system with known problem cases
 */

import 'dotenv/config';
import { classifyProduct, lookupSpecificHSCode } from './lib/classification/ai-powered-hs-classifier.js';

async function runClassificationTests() {
  console.log('=== AI-POWERED HS CLASSIFIER TESTS ===\n');
  
  const testCases = [
    {
      name: 'Copper Wire Test',
      description: 'Copper Wire',
      expectedChapter: 85,
      expectedHSPrefix: '8544'
    },
    {
      name: 'Plastic Connectors Test', 
      description: 'Plastic Connectors',
      expectedChapter: 85, // Should find electrical connectors, not random plastic items
      expectedHSPrefix: '8536'
    },
    {
      name: 'Wire Sheathing Test',
      description: 'Wire Sheathing', 
      expectedChapter: 39, // Could be 39 (plastic) or 85 (electrical insulation)
      expectedHSPrefix: '3917'
    },
    {
      name: 'Electrical Wire Test',
      description: 'Electrical Wire',
      expectedChapter: 85,
      expectedHSPrefix: '8544'
    },
    {
      name: 'Automotive Wire Harness Test',
      description: 'Automotive Wire Harness',
      expectedChapter: 85, // Should prioritize electrical over automotive
      expectedHSPrefix: '8544'
    },
    {
      name: 'Copper Electrical Conductor Test',
      description: 'Copper Electrical Conductor',
      expectedChapter: 85,
      expectedHSPrefix: '8544'
    }
  ];

  for (const testCase of testCases) {
    console.log(`--- ${testCase.name} ---`);
    console.log(`Input: "${testCase.description}"`);
    console.log(`Expected: Chapter ${testCase.expectedChapter}, HS ${testCase.expectedHSPrefix}xxxx`);
    
    try {
      const result = await classifyProduct(testCase.description);
      
      if (result.success) {
        console.log(`✅ Classification successful (${result.metadata.executionTime}ms)`);
        console.log(`Target Chapters: [${result.metadata.targetChapters.join(', ')}]`);
        console.log(`Product Terms: [${result.metadata.productTerms.slice(0, 5).join(', ')}]`);
        
        console.log('\n🎯 TOP SUGGESTIONS:');
        result.primarySuggestions.forEach((suggestion, index) => {
          const chapterMatch = suggestion.chapter === testCase.expectedChapter ? '✅' : '❌';
          const prefixMatch = suggestion.hsCode.startsWith(testCase.expectedHSPrefix) ? '✅' : '❌';
          
          console.log(`  ${index + 1}. ${chapterMatch}${prefixMatch} ${suggestion.displayText}`);
          console.log(`     Confidence: ${suggestion.confidence}% (${suggestion.confidenceText})`);
          console.log(`     Chapter: ${suggestion.chapter} | Match Type: ${suggestion.matchType}`);
          console.log(`     Tariff: MFN ${(suggestion.mfnRate * 100).toFixed(1)}% → USMCA ${(suggestion.usmcaRate * 100).toFixed(1)}%`);
        });
        
        // Analyze results quality
        const hasCorrectChapter = result.primarySuggestions.some(s => s.chapter === testCase.expectedChapter);
        const hasCorrectPrefix = result.primarySuggestions.some(s => s.hsCode.startsWith(testCase.expectedHSPrefix));
        
        console.log(`\n📊 RESULT QUALITY:`);
        console.log(`   Found target chapter ${testCase.expectedChapter}: ${hasCorrectChapter ? '✅ YES' : '❌ NO'}`);
        console.log(`   Found HS prefix ${testCase.expectedHSPrefix}: ${hasCorrectPrefix ? '✅ YES' : '❌ NO'}`);
        
      } else {
        console.log(`❌ Classification failed: ${result.error}`);
      }
      
    } catch (error) {
      console.log(`💥 Test error: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
  
  // Test specific HS code lookup
  console.log('--- HS CODE LOOKUP TESTS ---');
  const hsCodeTests = ['8544.42.20.00', '8544422000', '85444200', '8544'];
  
  for (const hsCode of hsCodeTests) {
    console.log(`Looking up: ${hsCode}`);
    const result = await lookupSpecificHSCode(hsCode);
    if (result) {
      console.log(`  ✅ Found: ${result.displayText} (${result.confidenceText})`);
    } else {
      console.log(`  ❌ Not found`);
    }
  }
  
  console.log('\n=== TESTING COMPLETE ===');
}

// Run the tests
runClassificationTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});