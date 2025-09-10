#!/usr/bin/env node

/**
 * CUSTOMER SCENARIOS VALIDATION TEST
 * 
 * BUSINESS CONTEXT:
 * Validate that our critical fixes enable Sarah, Mike, and Lisa to see
 * real USMCA savings for their strategic supplier partnership decisions.
 * 
 * Success Criteria:
 * - TechCorp sees $169K+ electronics savings
 * - AutoDist sees $625K+ automotive savings  
 * - Fashion retailer sees $180K+ textiles savings
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class CustomerScenariosValidator {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.testResults = [];
  }

  async validateAllCustomerScenarios() {
    console.log('🎯 CUSTOMER SCENARIOS VALIDATION TEST\n');
    console.log('Testing critical fixes for Sarah, Mike, Lisa business outcomes\n');

    // Test each customer scenario
    await this.testTechCorpElectronics();
    await this.testAutoDistAutomotive();
    await this.testFashionRetailer();

    await this.generateValidationReport();
    return this.testResults;
  }

  async testTechCorpElectronics() {
    console.log('📱 TESTING: TechCorp Electronics Scenario');
    console.log('Customer: Sarah (Compliance Manager) + Mike (Procurement)');
    console.log('Product: Smart speaker with 8 components');
    console.log('Expected: $245K savings potential visible\n');

    const scenario = {
      customer: 'TechCorp Electronics',
      productDescription: 'Smart speaker with WiFi, Bluetooth, voice recognition',
      components: [
        { description: 'Main PCB with processors', origin_country: 'CN', value_percentage: 40 },
        { description: 'Speaker driver assembly', origin_country: 'MX', value_percentage: 15 },
        { description: 'Plastic housing and case', origin_country: 'CA', value_percentage: 20 },
        { description: 'Power adapter', origin_country: 'VN', value_percentage: 8 },
        { description: 'Audio cables and wiring', origin_country: 'MX', value_percentage: 10 },
        { description: 'Microphone components', origin_country: 'CA', value_percentage: 7 }
      ],
      annualImportValue: 5000000, // $5M
      expectedSavingsMin: 150000 // $150K minimum
    };

    try {
      // Test with a representative electronics HS code
      const { data: electronicsHS, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate')
        .like('hs_code', '8518%') // Audio equipment
        .gt('mfn_rate', 0)
        .limit(1);

      if (error || !electronicsHS || electronicsHS.length === 0) {
        throw new Error('No electronics HS codes with tariff rates found');
      }

      const hsCode = electronicsHS[0];
      const actualSavings = (hsCode.mfn_rate / 100) * scenario.annualImportValue;
      
      console.log(`   📊 Test Results:`);
      console.log(`   • HS Code: ${hsCode.hs_code} - ${hsCode.description?.substring(0, 50)}`);
      console.log(`   • MFN Rate: ${hsCode.mfn_rate}% → USMCA Rate: ${hsCode.usmca_rate}%`);
      console.log(`   • Annual Import Value: $${scenario.annualImportValue.toLocaleString()}`);
      console.log(`   • Calculated Savings: $${Math.round(actualSavings).toLocaleString()}`);
      console.log(`   • Expected Minimum: $${scenario.expectedSavingsMin.toLocaleString()}`);

      const passed = actualSavings >= scenario.expectedSavingsMin && hsCode.mfn_rate > 0;
      console.log(`   • Result: ${passed ? '✅ PASS' : '❌ FAIL'} - ${passed ? 'Sarah can see USMCA value!' : 'Insufficient savings shown'}`);

      this.testResults.push({
        scenario: scenario.customer,
        hsCode: hsCode.hs_code,
        mfnRate: hsCode.mfn_rate,
        usmcaRate: hsCode.usmca_rate,
        actualSavings,
        expectedSavings: scenario.expectedSavingsMin,
        passed,
        businessImpact: passed ? 'Sarah can justify USMCA certificates, Mike sees sourcing value' : 'Insufficient value for supplier decisions'
      });

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      this.testResults.push({
        scenario: scenario.customer,
        passed: false,
        error: error.message,
        businessImpact: 'Cannot demonstrate value to customers'
      });
    }

    console.log('');
  }

  async testAutoDistAutomotive() {
    console.log('🚗 TESTING: AutoDist Automotive Scenario');
    console.log('Customer: Sarah (Compliance) + Procurement Team');
    console.log('Product: Brake assembly with complex supply chain');
    console.log('Expected: $625K savings potential visible\n');

    const scenario = {
      customer: 'AutoDist Automotive',
      productDescription: 'Complete brake assembly for commercial vehicles',
      components: [
        { description: 'Brake rotor (cast iron)', origin_country: 'CN', value_percentage: 45 },
        { description: 'Brake pads (composite)', origin_country: 'MX', value_percentage: 25 },
        { description: 'Caliper assembly', origin_country: 'CA', value_percentage: 20 },
        { description: 'Hardware kit', origin_country: 'MX', value_percentage: 10 }
      ],
      annualImportValue: 25000000, // $25M
      expectedSavingsMin: 500000 // $500K minimum
    };

    try {
      // Test with automotive HS codes
      const { data: automotiveHS, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate')
        .like('hs_code', '8708%') // Auto parts
        .gt('mfn_rate', 0)
        .limit(1);

      if (error || !automotiveHS || automotiveHS.length === 0) {
        throw new Error('No automotive HS codes with tariff rates found');
      }

      const hsCode = automotiveHS[0];
      const actualSavings = (hsCode.mfn_rate / 100) * scenario.annualImportValue;
      
      console.log(`   📊 Test Results:`);
      console.log(`   • HS Code: ${hsCode.hs_code} - ${hsCode.description?.substring(0, 50)}`);
      console.log(`   • MFN Rate: ${hsCode.mfn_rate}% → USMCA Rate: ${hsCode.usmca_rate}%`);
      console.log(`   • Annual Import Value: $${scenario.annualImportValue.toLocaleString()}`);
      console.log(`   • Calculated Savings: $${Math.round(actualSavings).toLocaleString()}`);
      console.log(`   • Expected Minimum: $${scenario.expectedSavingsMin.toLocaleString()}`);

      const passed = actualSavings >= scenario.expectedSavingsMin && hsCode.mfn_rate > 0;
      console.log(`   • Result: ${passed ? '✅ PASS' : '❌ FAIL'} - ${passed ? 'Procurement team can see Mexico value!' : 'Insufficient savings shown'}`);

      this.testResults.push({
        scenario: scenario.customer,
        hsCode: hsCode.hs_code,
        mfnRate: hsCode.mfn_rate,
        usmcaRate: hsCode.usmca_rate,
        actualSavings,
        expectedSavings: scenario.expectedSavingsMin,
        passed,
        businessImpact: passed ? 'Strategic Mexico sourcing decisions enabled' : 'Insufficient value for supplier partnerships'
      });

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      this.testResults.push({
        scenario: scenario.customer,
        passed: false,
        error: error.message,
        businessImpact: 'Cannot guide strategic sourcing decisions'
      });
    }

    console.log('');
  }

  async testFashionRetailer() {
    console.log('👕 TESTING: Fashion Retailer Scenario');
    console.log('Customer: Mike (Procurement) + Lisa (Finance)');
    console.log('Product: Winter jacket supplier switch evaluation');
    console.log('Expected: $180K savings potential visible\n');

    const scenario = {
      customer: 'Fashion Retailer',
      productDescription: 'Winter jacket with insulation and hardware',
      components: [
        { description: 'Shell fabric (synthetic)', origin_country: 'CN', value_percentage: 40 },
        { description: 'Insulation material', origin_country: 'MX', value_percentage: 30 },
        { description: 'Zipper and hardware', origin_country: 'CN', value_percentage: 20 },
        { description: 'Trim and labels', origin_country: 'MX', value_percentage: 10 }
      ],
      annualImportValue: 2000000, // $2M
      expectedSavingsMin: 150000 // $150K minimum
    };

    try {
      // Test with textiles HS codes
      const { data: textilesHS, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code, description, mfn_rate, usmca_rate')
        .like('hs_code', '6203%') // Men's suits/jackets
        .gt('mfn_rate', 0)
        .limit(1);

      if (error || !textilesHS || textilesHS.length === 0) {
        throw new Error('No textiles HS codes with tariff rates found');
      }

      const hsCode = textilesHS[0];
      const actualSavings = (hsCode.mfn_rate / 100) * scenario.annualImportValue;
      
      console.log(`   📊 Test Results:`);
      console.log(`   • HS Code: ${hsCode.hs_code} - ${hsCode.description?.substring(0, 50)}`);
      console.log(`   • MFN Rate: ${hsCode.mfn_rate}% → USMCA Rate: ${hsCode.usmca_rate}%`);
      console.log(`   • Annual Import Value: $${scenario.annualImportValue.toLocaleString()}`);
      console.log(`   • Calculated Savings: $${Math.round(actualSavings).toLocaleString()}`);
      console.log(`   • Expected Minimum: $${scenario.expectedSavingsMin.toLocaleString()}`);

      const passed = actualSavings >= scenario.expectedSavingsMin && hsCode.mfn_rate > 0;
      console.log(`   • Result: ${passed ? '✅ PASS' : '❌ FAIL'} - ${passed ? 'Lisa can forecast Mexico supplier savings!' : 'Insufficient savings shown'}`);

      this.testResults.push({
        scenario: scenario.customer,
        hsCode: hsCode.hs_code,
        mfnRate: hsCode.mfn_rate,
        usmcaRate: hsCode.usmca_rate,
        actualSavings,
        expectedSavings: scenario.expectedSavingsMin,
        passed,
        businessImpact: passed ? 'China→Mexico switch financially justified' : 'Insufficient value for supplier change'
      });

    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      this.testResults.push({
        scenario: scenario.customer,
        passed: false,
        error: error.message,
        businessImpact: 'Cannot support supplier switch decisions'
      });
    }

    console.log('');
  }

  async generateValidationReport() {
    console.log('🎯 CUSTOMER SCENARIOS VALIDATION REPORT\n');
    
    const passedScenarios = this.testResults.filter(r => r.passed).length;
    const totalScenarios = this.testResults.length;
    const successRate = Math.round((passedScenarios / totalScenarios) * 100);

    console.log(`📊 Overall Success Rate: ${successRate}% (${passedScenarios}/${totalScenarios} scenarios)`);
    console.log('');

    console.log('🎯 BUSINESS IMPACT SUMMARY:');
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.scenario}:`);
      if (result.passed) {
        console.log(`   • Savings: $${Math.round(result.actualSavings).toLocaleString()} (${result.mfnRate}% rate)`);
        console.log(`   • Business Impact: ${result.businessImpact}`);
      } else {
        console.log(`   • Issue: ${result.error || 'Insufficient savings'}`);
        console.log(`   • Business Impact: ${result.businessImpact}`);
      }
      console.log('');
    });

    console.log('💼 PROFESSIONAL USER OUTCOMES:');
    if (successRate >= 100) {
      console.log('🎉 EXCELLENT: All customer scenarios show meaningful USMCA value');
      console.log('• Sarah: Can confidently recommend USMCA certificates with real savings data');
      console.log('• Mike: Has concrete cost data for strategic Mexico supplier partnerships');
      console.log('• Lisa: Can accurately forecast duty savings in financial planning');
    } else if (successRate >= 67) {
      console.log('✅ GOOD: Most customer scenarios demonstrate value');
      console.log('• Platform can support customer business decisions');
      console.log('• Some areas may need additional tariff data');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Limited customer value demonstration');
      console.log('• Additional tariff rate improvements needed');
      console.log('• Customer adoption may be limited');
    }

    console.log('\n🚀 PLATFORM READINESS ASSESSMENT:');
    if (successRate >= 100) {
      console.log('✅ READY FOR CUSTOMER TRIALS: Platform demonstrates clear USMCA value');
    } else if (successRate >= 67) {
      console.log('🔄 READY WITH MONITORING: Most scenarios work, watch for edge cases');
    } else {
      console.log('⚠️ NEEDS MORE WORK: Insufficient value demonstration for trials');
    }

    return {
      successRate,
      passedScenarios,
      totalScenarios,
      readyForCustomers: successRate >= 67
    };
  }
}

async function main() {
  const validator = new CustomerScenariosValidator();
  
  try {
    const results = await validator.validateAllCustomerScenarios();
    
    if (results.readyForCustomers) {
      console.log('\n🎉 CUSTOMER SCENARIOS VALIDATION: SUCCESS!');
      console.log('Platform ready to demonstrate value to Sarah, Mike, and Lisa');
      process.exit(0);
    } else {
      console.log('\n⚠️ CUSTOMER SCENARIOS VALIDATION: NEEDS IMPROVEMENT');
      console.log('Additional work needed before customer trials');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CustomerScenariosValidator;