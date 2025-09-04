#!/usr/bin/env node

/**
 * Test Multi-Country View
 * Validates that the multi-country comparison view is working properly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class MultiCountryViewTest {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
  }

  async testMultiCountryView() {
    console.log('🌍 TESTING MULTI-COUNTRY VIEW\n');
    
    try {
      // Test view exists and get record count
      const { count: totalRecords, error: countError } = await this.supabase
        .from('hs_master_multicountry')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.log('❌ Multi-country view error:', countError.message);
        console.log('🔧 Please run the fixed SQL from scripts/fixed-multicountry-view.sql\n');
        return false;
      }

      console.log(`✅ Multi-country view working! Records: ${totalRecords}\n`);

      // Test sample records
      const { data: samples, error: dataError } = await this.supabase
        .from('hs_master_multicountry')
        .select('hs_code, description, us_mfn_rate, ca_mfn_rate, best_usmca_savings, product_category')
        .order('best_usmca_savings', { ascending: false })
        .limit(10);

      if (dataError) {
        console.log('❌ Sample data error:', dataError.message);
        return false;
      }

      console.log('🏆 TOP MULTI-COUNTRY SAVINGS OPPORTUNITIES:');
      samples?.forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.hs_code} | Best Savings: ${record.best_usmca_savings?.toFixed(2) || 0}%`);
        console.log(`     US Rate: ${record.us_mfn_rate || 'N/A'}% | CA Rate: ${record.ca_mfn_rate || 'N/A'}%`);
        console.log(`     Category: ${record.product_category}`);
        console.log(`     Product: ${record.description?.substring(0, 60)}...`);
        console.log('');
      });

      // Test products with both US and CA rates
      const { data: dualRates, error: dualError } = await this.supabase
        .from('hs_master_multicountry')
        .select('hs_code, us_mfn_rate, ca_mfn_rate, best_usmca_savings')
        .not('us_mfn_rate', 'is', null)
        .not('ca_mfn_rate', 'is', null)
        .limit(5);

      if (!dualError && dualRates && dualRates.length > 0) {
        console.log('🇺🇸🍁 PRODUCTS WITH BOTH US AND CANADIAN RATES:');
        dualRates.forEach((record, index) => {
          console.log(`  ${index + 1}. ${record.hs_code} | US: ${record.us_mfn_rate}% | CA: ${record.ca_mfn_rate}% | Best: ${record.best_usmca_savings}%`);
        });
      } else {
        console.log('📊 No products found with both US and Canadian rates (normal - limited overlap)');
      }

      return true;

    } catch (error) {
      console.log('❌ Multi-country view test failed:', error.message);
      return false;
    }
  }

  async run() {
    const success = await this.testMultiCountryView();
    
    if (success) {
      console.log('\n✅ Multi-country view test PASSED!');
      console.log('🚀 Ready for Phase 3: Mexican Integration');
    } else {
      console.log('\n❌ Multi-country view test FAILED');
      console.log('🔧 Please fix the view before proceeding to Phase 3');
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const test = new MultiCountryViewTest();
  test.run();
}

module.exports = MultiCountryViewTest;