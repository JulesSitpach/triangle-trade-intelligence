/**
 * Check USMCA Tariff Rates Table - The Real Data Source
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUSMCATariffRates() {
  console.log('🎯 CHECKING USMCA TARIFF RATES - THE REAL DATA');
  console.log('===============================================\n');

  try {
    // 1. Get electronic/semiconductor records
    console.log('📊 1. ELECTRONIC/SEMICONDUCTOR RECORDS:');
    const { data: electronicsData } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code, hs_description, mfn_rate, usmca_rate, savings_percentage')
      .or('hs_code.like.8542%,hs_code.like.8541%,hs_description.ilike.%processor%,hs_description.ilike.%sensor%')
      .limit(5);
    
    if (electronicsData && electronicsData.length > 0) {
      electronicsData.forEach(record => {
        console.log(`   ${record.hs_code}: MFN ${record.mfn_rate}%, USMCA ${record.usmca_rate}%, Savings ${record.savings_percentage}%`);
        console.log(`      ${record.hs_description?.substring(0, 80)}...`);
      });
    } else {
      console.log('   No electronics records found');
    }

    // 2. Look for records with actual high tariff rates
    console.log('\n📊 2. HIGH TARIFF RATE RECORDS (>10%):');
    const { data: highTariffData } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code, hs_description, mfn_rate, usmca_rate, savings_percentage')
      .gt('mfn_rate', 10)
      .limit(5);
    
    if (highTariffData && highTariffData.length > 0) {
      highTariffData.forEach(record => {
        console.log(`   ${record.hs_code}: MFN ${record.mfn_rate}%, USMCA ${record.usmca_rate}%, Savings ${record.savings_percentage}%`);
        console.log(`      ${record.hs_description?.substring(0, 80)}...`);
      });
    } else {
      console.log('   No high tariff records found');
    }

    // 3. Search for specific products we've been testing
    console.log('\n📊 3. SPECIFIC PRODUCT MATCHES:');
    
    // CMOS image sensors
    const { data: cmosData } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code, hs_description, mfn_rate, usmca_rate, savings_percentage')
      .or('hs_description.ilike.%cmos%,hs_description.ilike.%image sensor%,hs_code.like.8542%')
      .limit(3);
    
    console.log('CMOS/Image Sensors:');
    if (cmosData && cmosData.length > 0) {
      cmosData.forEach(record => {
        console.log(`   ${record.hs_code}: MFN ${record.mfn_rate}%, USMCA ${record.usmca_rate}%`);
        console.log(`      ${record.hs_description}`);
      });
    } else {
      console.log('   No CMOS records found');
    }

    // Optical lenses
    const { data: opticsData } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code, hs_description, mfn_rate, usmca_rate, savings_percentage')
      .or('hs_description.ilike.%lens%,hs_description.ilike.%optical%,hs_code.like.9002%')
      .limit(3);
    
    console.log('\nOptical Lenses:');
    if (opticsData && opticsData.length > 0) {
      opticsData.forEach(record => {
        console.log(`   ${record.hs_code}: MFN ${record.mfn_rate}%, USMCA ${record.usmca_rate}%`);
        console.log(`      ${record.hs_description}`);
      });
    } else {
      console.log('   No optical records found');
    }

    // 4. Check HS code format patterns
    console.log('\n📊 4. HS CODE FORMAT ANALYSIS:');
    const { data: formatData } = await supabase
      .from('usmca_tariff_rates')
      .select('hs_code')
      .limit(20);
    
    if (formatData) {
      const formats = {};
      formatData.forEach(record => {
        const format = record.hs_code?.includes('.') ? 'with_dots' : 'without_dots';
        const length = record.hs_code?.replace(/\./g, '').length;
        const key = `${format}_${length}digit`;
        formats[key] = (formats[key] || 0) + 1;
      });
      
      console.log('HS Code formats in usmca_tariff_rates:');
      Object.entries(formats).forEach(([format, count]) => {
        console.log(`   ${format}: ${count} records`);
      });
    }

    // 5. Test bridging with AI classification results
    console.log('\n📊 5. TESTING BRIDGING PATTERNS:');
    
    // Test pattern: AI gives 854231, need to find in USMCA table
    const testCodes = ['854231', '8542.31', '8542.31.00', '85423100'];
    
    for (const testCode of testCodes) {
      const { data: bridgeData } = await supabase
        .from('usmca_tariff_rates')
        .select('hs_code, mfn_rate, usmca_rate')
        .or(`hs_code.eq.${testCode},hs_code.like.${testCode}%`)
        .limit(1);
      
      if (bridgeData && bridgeData.length > 0) {
        console.log(`✅ ${testCode} → Found: ${bridgeData[0].hs_code} (MFN: ${bridgeData[0].mfn_rate}%)`);
      } else {
        console.log(`❌ ${testCode} → Not found`);
      }
    }

    console.log('\n🎯 ANALYSIS COMPLETE');
    
  } catch (error) {
    console.error('USMCA tariff inspection failed:', error);
  }
}

// Run inspection
checkUSMCATariffRates();