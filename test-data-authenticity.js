/**
 * TEST SCRIPT: Data Authenticity Validation
 * Test the authenticity validator to ensure it detects fabricated metrics
 */

import { DataAuthenticityValidator } from './lib/validators/data-authenticity-validator.js';
import fs from 'fs/promises';

async function testDataAuthenticity() {
  console.log('🔍 TESTING DATA AUTHENTICITY VALIDATION\n');
  
  const testFiles = [
    './lib/intelligence/static-triangle-routes.js',
    './lib/intelligence/marcus-intelligence.js', 
    './lib/intelligence/beast-master-controller.js'
  ];
  
  const results = [];
  
  for (const filePath of testFiles) {
    try {
      console.log(`📄 Testing: ${filePath}`);
      
      const fileContent = await fs.readFile(filePath, 'utf8');
      const validation = await DataAuthenticityValidator.validateFile(filePath, fileContent);
      
      results.push(validation);
      
      console.log(`   Score: ${validation.score}/100`);
      console.log(`   Fabricated Issues: ${validation.fabricatedIssues.length}`);
      console.log(`   Authentic Patterns: ${validation.authenticDataFound.length}`);
      
      if (validation.fabricatedIssues.length > 0) {
        console.log('   🚨 FABRICATED ISSUES FOUND:');
        validation.fabricatedIssues.slice(0, 3).forEach(issue => {
          console.log(`      ${issue.severity}: ${issue.pattern} - ${issue.message}`);
        });
        if (validation.fabricatedIssues.length > 3) {
          console.log(`      ... and ${validation.fabricatedIssues.length - 3} more`);
        }
      }
      
      if (validation.authenticDataFound.length > 0) {
        console.log('   ✅ AUTHENTIC PATTERNS FOUND:');
        validation.authenticDataFound.slice(0, 3).forEach(auth => {
          console.log(`      ${auth.confidence}: ${auth.pattern}`);
        });
      }
      
      if (validation.recommendations.length > 0) {
        console.log('   📋 RECOMMENDATIONS:');
        validation.recommendations.forEach(rec => {
          console.log(`      ${rec.priority}: ${rec.action}`);
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`   ❌ Error testing ${filePath}:`, error.message);
      console.log('');
    }
  }
  
  // Generate overall report
  console.log('📊 OVERALL AUTHENTICITY REPORT\n');
  const report = DataAuthenticityValidator.generateAuthenticityReport(results);
  
  console.log(`Total Files Tested: ${report.totalFiles}`);
  console.log(`Average Authenticity Score: ${report.summary.averageScore}/100`);
  console.log(`Files with High Authenticity (90+): ${report.summary.authenticFiles}`);
  console.log(`Total Fabricated Issues: ${report.summary.fabricatedIssues}`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n🎯 PRIORITY ACTIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.action}`);
      if (rec.files && rec.files.length > 0) {
        console.log(`   Files: ${rec.files.join(', ')}`);
      }
    });
  }
  
  // Test the authentic calculators exist
  console.log('\n🧮 TESTING AUTHENTIC CALCULATORS\n');
  
  const calculatorTests = [
    './lib/calculators/authentic-shipping-calculator.js',
    './lib/calculators/authentic-reliability-calculator.js',
    './lib/calculators/authentic-savings-calculator.js'
  ];
  
  for (const calculatorPath of calculatorTests) {
    try {
      const calculatorContent = await fs.readFile(calculatorPath, 'utf8');
      const hasAuthentic = calculatorContent.includes('AUTHENTIC') && calculatorContent.includes('DATABASE');
      const hasValidation = calculatorContent.includes('validate') && calculatorContent.includes('authenticity');
      
      console.log(`📋 ${calculatorPath}`);
      console.log(`   Has authentic patterns: ${hasAuthentic ? '✅' : '❌'}`);
      console.log(`   Has validation methods: ${hasValidation ? '✅' : '❌'}`);
      console.log('');
      
    } catch (error) {
      console.log(`📋 ${calculatorPath}`);
      console.log(`   Status: ❌ File not found or unreadable`);
      console.log('');
    }
  }
  
  // Runtime data validation test
  console.log('🔄 TESTING RUNTIME DATA VALIDATION\n');
  
  const testData1 = {
    reliability: "92%",
    savings: "$180K-$420K annually",
    costPerKg: "$2.80-3.20"
  };
  
  const testData2 = {
    reliability: "CALCULATED_VIA_DATABASE",
    savings: "CALCULATED_VIA_TARIFF_DIFFERENTIAL", 
    costPerKg: "CALCULATED_VIA_AUTHENTIC_API"
  };
  
  const validation1 = DataAuthenticityValidator.validateRuntimeData(testData1, { source: 'test_fabricated' });
  const validation2 = DataAuthenticityValidator.validateRuntimeData(testData2, { source: 'test_authentic' });
  
  console.log('Test Data 1 (Fabricated Patterns):');
  console.log(`   Is Authentic: ${validation1.isAuthentic ? '✅' : '❌'}`);
  console.log(`   Warnings: ${validation1.warnings.length}`);
  if (validation1.warnings.length > 0) {
    validation1.warnings.forEach(warning => {
      console.log(`      ${warning.type}: ${warning.key} = ${warning.value}`);
    });
  }
  
  console.log('\nTest Data 2 (Authentic Patterns):');
  console.log(`   Is Authentic: ${validation2.isAuthentic ? '✅' : '❌'}`);
  console.log(`   Warnings: ${validation2.warnings.length}`);
  
  console.log('\n🎉 DATA AUTHENTICITY VALIDATION COMPLETE');
  
  return {
    overallScore: report.summary.averageScore,
    criticalIssues: report.summary.criticalIssues,
    authenticFiles: report.summary.authenticFiles,
    totalFiles: report.totalFiles
  };
}

// Run the test
testDataAuthenticity()
  .then(results => {
    console.log('\n✅ Test Results Summary:');
    console.log(`   Overall Authenticity: ${results.overallScore}/100`);
    console.log(`   Critical Issues: ${results.criticalIssues}`);
    console.log(`   Authentic Files: ${results.authenticFiles}/${results.totalFiles}`);
    
    if (results.criticalIssues === 0 && results.overallScore >= 85) {
      console.log('\n🎯 SUCCESS: Data authenticity validation is working effectively!');
      process.exit(0);
    } else {
      console.log('\n⚠️  ATTENTION: Some fabricated metrics may still exist');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });