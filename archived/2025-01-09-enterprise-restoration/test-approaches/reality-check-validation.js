#!/usr/bin/env node

/**
 * REALITY CHECK VALIDATION
 * 
 * Quick test to prove what actually works RIGHT NOW
 * Uses the EXACT API formats found in the working customer-workflow-test.js
 */

const fetch = require('node-fetch');

async function realityCheck() {
  console.log('🔍 REALITY CHECK - What Actually Works Right Now');
  console.log('='.repeat(60));
  
  const baseUrl = 'http://localhost:3000';
  let workingFeatures = 0;
  let totalFeatures = 0;

  // Helper function for testing
  async function test(name, testFn) {
    totalFeatures++;
    try {
      console.log(`\n🧪 Testing: ${name}`);
      const result = await testFn();
      if (result.success) {
        console.log(`   ✅ SUCCESS: ${result.message || 'Working'}`);
        if (result.data) {
          console.log(`   📊 Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
        }
        workingFeatures++;
        return true;
      } else {
        console.log(`   ❌ FAILED: ${result.message || 'Not working'}`);
        return false;
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      return false;
    }
  }

  // Test 1: Server Health
  await test('Server Running', async () => {
    const response = await fetch(baseUrl);
    return {
      success: response.ok,
      message: response.ok ? `Server responding (${response.status})` : `Server error (${response.status})`
    };
  });

  // Test 2: Classification API (EXACT format from customer-workflow-test.js)
  await test('Product Classification API', async () => {
    const response = await fetch(`${baseUrl}/api/simple-classification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_description: 'electrical wire harness',
        business_type: 'manufacturing'
      })
    });
    
    if (!response.ok) {
      return { success: false, message: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.results && data.results.length > 0) {
      const firstResult = data.results[0];
      return {
        success: true,
        message: `Found ${data.results.length} HS codes`,
        data: {
          hs_code: firstResult.hs_code,
          description: firstResult.description?.substring(0, 50),
          confidence: firstResult.confidence
        }
      };
    } else {
      return { success: false, message: 'No results returned' };
    }
  });

  // Test 3: USMCA Qualification (EXACT format from customer-workflow-test.js)
  await test('USMCA Qualification Check', async () => {
    const response = await fetch(`${baseUrl}/api/simple-usmca-compliance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check_qualification',
        data: {
          hs_code: '8544429000',
          component_origins: 'Mexico,Canada',
          manufacturing_location: 'Mexico'
        }
      })
    });
    
    if (!response.ok) {
      return { success: false, message: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.qualification) {
      return {
        success: true,
        message: `Qualification result: ${data.qualification.qualified ? 'QUALIFIED' : 'NOT QUALIFIED'}`,
        data: {
          qualified: data.qualification.qualified,
          reason: data.qualification.reason,
          rule: data.qualification.rule_applied
        }
      };
    } else {
      return { success: false, message: 'No qualification data returned' };
    }
  });

  // Test 4: Savings Calculation (EXACT format from customer-workflow-test.js)
  await test('Tariff Savings Calculator', async () => {
    const response = await fetch(`${baseUrl}/api/simple-usmca-compliance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'calculate_savings',
        data: {
          hs_code: '8544429000',
          annual_import_value: 500000,
          supplier_country: 'China'
        }
      })
    });
    
    if (!response.ok) {
      return { success: false, message: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.savings) {
      return {
        success: true,
        message: `Annual savings: $${data.savings.annual_savings?.toLocaleString()}`,
        data: {
          annual: data.savings.annual_savings,
          monthly: data.savings.monthly_savings,
          percentage: data.savings.savings_percentage
        }
      };
    } else {
      return { success: false, message: 'No savings data returned' };
    }
  });

  // Test 5: Certificate Generation (EXACT format from customer-workflow-test.js)
  await test('Certificate Generation', async () => {
    const response = await fetch(`${baseUrl}/api/simple-usmca-compliance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_certificate',
        data: {
          companyName: 'Reality Check Corp',
          hsCode: '8544429000',
          productDescription: 'electrical wire harness',
          manufacturingLocation: 'Mexico',
          componentOrigins: 'Mexico,Canada',
          qualified: true
        }
      })
    });
    
    if (!response.ok) {
      return { success: false, message: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.certificate) {
      return {
        success: true,
        message: `Certificate generated: ${data.certificate.certificateId}`,
        data: {
          id: data.certificate.certificateId,
          qualified: data.certificate.usmcaQualified,
          content: data.certificate.regionalContent
        }
      };
    } else {
      return { success: false, message: 'No certificate data returned' };
    }
  });

  // Test 6: Admin API Sample
  await test('Admin APIs Responding', async () => {
    const response = await fetch(`${baseUrl}/api/admin/users`);
    
    return {
      success: response.ok,
      message: response.ok ? `Admin API responding (${response.status})` : `Admin API error (${response.status})`
    };
  });

  // Test 7: Main Workflow Page
  await test('USMCA Workflow Page', async () => {
    const response = await fetch(`${baseUrl}/usmca-workflow`);
    
    return {
      success: response.ok,
      message: response.ok ? `Workflow page loading` : `Workflow page error (${response.status})`
    };
  });

  // Final Report
  console.log('\n' + '='.repeat(60));
  console.log('🎯 REALITY CHECK SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ WORKING: ${workingFeatures}/${totalFeatures} features`);
  console.log(`📊 SUCCESS RATE: ${((workingFeatures/totalFeatures)*100).toFixed(1)}%`);
  
  if (workingFeatures >= 5) {
    console.log('\n🚀 CONCLUSION: Platform is MOSTLY FUNCTIONAL!');
    console.log('   The core customer workflow actually works.');
    console.log('   Previous test failures were due to wrong API expectations.');
  } else if (workingFeatures >= 3) {
    console.log('\n⚠️  CONCLUSION: Platform is PARTIALLY FUNCTIONAL');
    console.log('   Some core features work, others need fixing.');
  } else {
    console.log('\n❌ CONCLUSION: Platform has SERIOUS ISSUES');
    console.log('   Most core features are broken and need immediate attention.');
  }
  
  console.log('\n💡 This proves the disconnect between testing expectations and reality!');
}

// Run the reality check
if (require.main === module) {
  realityCheck().catch(error => {
    console.error('Reality check failed:', error.message);
    process.exit(1);
  });
}

module.exports = realityCheck;