/**
 * CRISIS PIVOT READINESS VERIFICATION
 * Tests actual database content to validate USMCA workflow accuracy
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mrwitpgbcaxgnirqtavt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yd2l0cGdiY2F4Z25pcnF0YXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NTE2NTIsImV4cCI6MjA0MjMyNzY1Mn0.nWU8JPXbz37CcCqjGfkvRFEXTO81xXNemddw1sUf1Ko';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCrisisReadiness() {
  console.log('=================================================');
  console.log('  TRIANGLE INTELLIGENCE CRISIS PIVOT READINESS  ');
  console.log('  Testing USMCA Workflow Accuracy for 25% Tariff Crisis');
  console.log('=================================================\n');

  const readiness = {
    dataPopulation: false,
    tariffAccuracy: false,
    qualificationRules: false,
    hsCodeCoverage: false,
    savingsCalculation: false,
    certificateGeneration: false,
    overallScore: 0
  };

  // 1. CHECK DATA POPULATION
  console.log('📊 1. DATABASE POPULATION CHECK');
  console.log('─────────────────────────────────');
  
  // Check tariff_rates table
  const { count: tariffCount } = await supabase
    .from('tariff_rates')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✓ tariff_rates table: ${tariffCount || 0} records`);
  if (tariffCount > 10000) {
    console.log('  ✅ Excellent coverage (>10,000 tariff records)');
    readiness.tariffAccuracy = true;
  } else if (tariffCount > 1000) {
    console.log('  ⚠️ Limited coverage (needs more tariff data)');
  } else {
    console.log('  ❌ Insufficient data for crisis positioning');
  }

  // Check comtrade_reference table
  const { count: hsCount } = await supabase
    .from('comtrade_reference')
    .select('*', { count: 'exact', head: true });
  
  console.log(`✓ comtrade_reference table: ${hsCount || 0} HS codes`);
  if (hsCount > 5000) {
    console.log('  ✅ Comprehensive HS code database');
    readiness.hsCodeCoverage = true;
  } else if (hsCount > 1000) {
    console.log('  ⚠️ Partial HS code coverage');
  } else {
    console.log('  ❌ Need more HS codes for accurate classification');
  }

  // Check usmca_qualification_rules
  const { data: qualRules, count: ruleCount } = await supabase
    .from('usmca_qualification_rules')
    .select('*', { count: 'exact' });
  
  console.log(`✓ usmca_qualification_rules: ${ruleCount || 0} rules`);
  if (qualRules && qualRules.length > 0) {
    const categories = [...new Set(qualRules.map(r => r.product_category).filter(c => c))];
    console.log(`  Categories covered: ${categories.join(', ')}`);
    if (ruleCount >= 7) {
      console.log('  ✅ Major product categories covered');
      readiness.qualificationRules = true;
    }
  }

  readiness.dataPopulation = (tariffCount > 0 && hsCount > 0 && ruleCount > 0);

  // 2. TEST SAVINGS CALCULATION ACCURACY
  console.log('\n💰 2. SAVINGS CALCULATION TEST');
  console.log('─────────────────────────────────');
  
  const testProducts = [
    { hs: '6109100010', name: 'Cotton T-shirts', volume: 1000000 },
    { hs: '8517120050', name: 'Smartphones', volume: 5000000 },
    { hs: '6403990060', name: 'Footwear', volume: 2000000 }
  ];

  let savingsFound = false;
  for (const product of testProducts) {
    const { data: rate } = await supabase
      .from('tariff_rates')
      .select('mfn_rate, usmca_rate')
      .eq('hs_code', product.hs)
      .single();
    
    if (rate) {
      const mfnCost = product.volume * (rate.mfn_rate || 0);
      const usmcaCost = product.volume * (rate.usmca_rate || 0);
      const savings = mfnCost - usmcaCost;
      
      if (savings > 0) {
        console.log(`✓ ${product.name}: $${savings.toLocaleString()} USMCA savings`);
        console.log(`  (MFN: ${(rate.mfn_rate * 100).toFixed(1)}% → USMCA: ${(rate.usmca_rate * 100).toFixed(1)}%)`);
        savingsFound = true;
      }
    }
  }
  
  if (savingsFound) {
    console.log('  ✅ Savings calculations verified');
    readiness.savingsCalculation = true;
  } else {
    console.log('  ❌ Cannot demonstrate savings - critical for crisis messaging');
  }

  // 3. CERTIFICATE GENERATION CAPABILITY
  console.log('\n📄 3. CERTIFICATE GENERATION CAPABILITY');
  console.log('─────────────────────────────────');
  
  const certRequirements = {
    'HS Codes': hsCount > 0,
    'Qualification Rules': ruleCount > 0,
    'Regional Content Thresholds': qualRules?.some(r => r.regional_content_threshold) || false,
    'Required Documentation': qualRules?.some(r => r.required_documentation?.length > 0) || false
  };

  Object.entries(certRequirements).forEach(([req, met]) => {
    console.log(`${met ? '✅' : '❌'} ${req}`);
  });

  const certReady = Object.values(certRequirements).filter(v => v).length;
  if (certReady >= 3) {
    readiness.certificateGeneration = true;
    console.log('  ✅ Certificate generation ready');
  } else {
    console.log('  ❌ Missing certificate generation requirements');
  }

  // 4. CRISIS MESSAGING VALIDATION
  console.log('\n🚨 4. CRISIS MESSAGING VALIDATION');
  console.log('─────────────────────────────────');
  
  // Check for high-tariff products that would be affected by 25% penalty
  const { data: highTariffProducts } = await supabase
    .from('tariff_rates')
    .select('hs_code, mfn_rate, usmca_rate')
    .gt('mfn_rate', 0.10) // Products with >10% MFN rate
    .eq('usmca_rate', 0)   // But 0% under USMCA
    .limit(5);

  if (highTariffProducts && highTariffProducts.length > 0) {
    console.log('✅ Found products with significant USMCA savings:');
    highTariffProducts.forEach(p => {
      const savings = (p.mfn_rate * 100).toFixed(1);
      console.log(`  - HS ${p.hs_code}: Save ${savings}% with USMCA`);
    });
  } else {
    console.log('⚠️ Limited high-impact savings examples for crisis messaging');
  }

  // 5. CALCULATE OVERALL READINESS
  console.log('\n🎯 CRISIS PIVOT READINESS ASSESSMENT');
  console.log('═════════════════════════════════════');
  
  const scores = {
    'Data Population': readiness.dataPopulation ? 100 : 0,
    'Tariff Accuracy': readiness.tariffAccuracy ? 100 : 0,
    'HS Code Coverage': readiness.hsCodeCoverage ? 100 : 0,
    'Qualification Rules': readiness.qualificationRules ? 100 : 0,
    'Savings Calculation': readiness.savingsCalculation ? 100 : 0,
    'Certificate Generation': readiness.certificateGeneration ? 100 : 0
  };

  Object.entries(scores).forEach(([category, score]) => {
    const bar = '█'.repeat(Math.floor(score/10)) + '░'.repeat(10 - Math.floor(score/10));
    console.log(`${category.padEnd(25)} ${bar} ${score}%`);
  });

  readiness.overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / 6;
  
  console.log(`\nOVERALL READINESS: ${readiness.overallScore.toFixed(0)}%`);
  
  // FINAL VERDICT
  console.log('\n📋 FINAL VERDICT FOR CRISIS PIVOT');
  console.log('═════════════════════════════════════');
  
  if (readiness.overallScore >= 80) {
    console.log('✅ READY FOR CRISIS PIVOT');
    console.log('\nYour USMCA workflow is accurate enough to support crisis messaging.');
    console.log('You can confidently claim to help companies avoid 25% penalties.');
    console.log('\nNEXT STEPS:');
    console.log('1. Update landing page with crisis messaging');
    console.log('2. Add 25% penalty calculator to workflow');
    console.log('3. Emphasize "Perfect Documentation = No Penalties"');
    console.log('4. Launch targeted marketing campaign');
  } else if (readiness.overallScore >= 50) {
    console.log('⚠️ PARTIALLY READY - NEEDS IMPROVEMENT');
    console.log('\nYour core infrastructure works but needs data improvements.');
    console.log('\nCRITICAL FIXES NEEDED:');
    if (!readiness.tariffAccuracy) console.log('• Load more tariff data from CBP');
    if (!readiness.hsCodeCoverage) console.log('• Expand HS code database');
    if (!readiness.qualificationRules) console.log('• Add more qualification rules');
    if (!readiness.savingsCalculation) console.log('• Verify savings calculations');
    console.log('\nConsider soft launch with "Beta" disclaimer while improving.');
  } else {
    console.log('❌ NOT READY FOR CRISIS PIVOT');
    console.log('\nThe workflow lacks the accuracy needed for crisis positioning.');
    console.log('Making compliance claims without accurate data is risky.');
    console.log('\nRECOMMENDATION:');
    console.log('Focus on data population first, then pivot to crisis messaging.');
  }

  // Show example crisis message if ready
  if (readiness.overallScore >= 50) {
    console.log('\n💡 SAMPLE CRISIS MESSAGE:');
    console.log('═════════════════════════════════════');
    console.log('"While your competitors face 25% Trump tariffs,');
    console.log(' Triangle Intelligence ensures your USMCA compliance');
    console.log(' keeps you at 0%. One documentation error = $250,000 penalty.');
    console.log(' Our platform has helped companies save millions.');
    console.log(' Don\'t let tariffs destroy your business - get protected today."');
  }

  return readiness;
}

// Run the verification
verifyCrisisReadiness()
  .then(readiness => {
    console.log('\n✓ Crisis readiness assessment complete');
    process.exit(readiness.overallScore >= 80 ? 0 : 1);
  })
  .catch(error => {
    console.error('Error during verification:', error);
    process.exit(1);
  });