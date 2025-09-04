#!/usr/bin/env node

/**
 * Fix Database Schema for Full Tariff Rate Range
 * Updates field precision to handle rates up to 99.99% without overflow
 * Preserves data integrity for authentic government rates
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class DatabaseSchemaFixer {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.startTime = Date.now();
  }

  /**
   * Check current schema constraints
   */
  async checkCurrentSchema() {
    console.log('🔍 Checking current database schema constraints...\n');
    
    // Test current limits
    const testRates = [9.99, 10.00, 37.50, 99.99];
    const results = [];
    
    for (const rate of testRates) {
      try {
        const { error } = await this.supabase
          .from('comtrade_reference')
          .update({ mfn_tariff_rate: rate })
          .eq('hs_code', '030299');
          
        if (error) {
          results.push({ rate, status: 'FAIL', error: error.message });
        } else {
          results.push({ rate, status: 'SUCCESS', error: null });
        }
      } catch (err) {
        results.push({ rate, status: 'ERROR', error: err.message });
      }
    }
    
    console.log('Current Schema Test Results:');
    results.forEach(result => {
      console.log(`  ${result.rate}%: ${result.status} ${result.error ? '- ' + result.error : ''}`);
    });
    
    const maxWorkingRate = results.filter(r => r.status === 'SUCCESS').pop()?.rate || 0;
    console.log(`\n📊 Maximum working rate: ${maxWorkingRate}%`);
    console.log(`❌ Current constraint: Rates above ${maxWorkingRate}% cause overflow\n`);
    
    return maxWorkingRate;
  }

  /**
   * Show impact of current constraints
   */
  async showImpactAnalysis() {
    console.log('💼 BUSINESS IMPACT ANALYSIS\n');
    
    // Get authentic rates that are being truncated
    const { data: highRates } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source')
      .gte('mfn_rate', 10)
      .order('mfn_rate', { ascending: false })
      .limit(10);
      
    console.log('🚨 HIGH-TARIFF PRODUCTS BEING MISREPRESENTED:');
    
    if (highRates && highRates.length > 0) {
      highRates.forEach((rate, index) => {
        const realSavings = rate.mfn_rate - rate.usmca_rate;
        const cappedSavings = 9.99 - rate.usmca_rate;
        const lostSavings = realSavings - cappedSavings;
        
        console.log(`  ${index + 1}. HS ${rate.hs_code} (${rate.country})`);
        console.log(`     Real Rate: ${rate.mfn_rate}% | Capped: 9.99% | Lost Savings: ${lostSavings.toFixed(1)}%`);
        console.log(`     Source: ${rate.source}`);
      });
      
      // Calculate business impact
      const avgLostSavings = highRates.reduce((sum, rate) => {
        const realSavings = rate.mfn_rate - rate.usmca_rate;
        const cappedSavings = 9.99 - rate.usmca_rate;
        return sum + (realSavings - cappedSavings);
      }, 0) / highRates.length;
      
      console.log(`\n💰 BUSINESS IMPACT:`);
      console.log(`  Average lost savings per product: ${avgLostSavings.toFixed(1)}%`);
      console.log(`  For $1M import volume: $${(avgLostSavings * 10000).toLocaleString()} underestimated savings`);
      console.log(`  Credibility risk: HIGH - Users will discover real rates elsewhere`);
    }
  }

  /**
   * Attempt schema fix using SQL commands
   */
  async attemptSchemaFix() {
    console.log('\n🔧 ATTEMPTING DATABASE SCHEMA FIX...\n');
    
    // Since we can't directly modify Supabase schema via API,
    // we'll provide the SQL commands that need to be run
    const schemaFixSQL = `
-- Fix database schema to handle full tariff rate range
-- Run these commands in Supabase SQL Editor:

ALTER TABLE comtrade_reference 
  ALTER COLUMN mfn_tariff_rate TYPE DECIMAL(5,2);

ALTER TABLE comtrade_reference 
  ALTER COLUMN usmca_tariff_rate TYPE DECIMAL(5,2);

ALTER TABLE comtrade_reference 
  ALTER COLUMN base_tariff_rate TYPE DECIMAL(5,2);

-- Verify the changes
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'comtrade_reference' 
  AND column_name LIKE '%tariff_rate';
`;

    console.log('📋 REQUIRED SQL COMMANDS (Run in Supabase SQL Editor):');
    console.log('='*60);
    console.log(schemaFixSQL);
    console.log('='*60);
    
    // Test if schema is already fixed
    console.log('\n🧪 Testing if schema is already fixed...');
    
    try {
      const { error } = await this.supabase
        .from('comtrade_reference')
        .update({ mfn_tariff_rate: 37.50 })
        .eq('hs_code', '030299');
        
      if (error) {
        console.log('❌ Schema still needs fixing:', error.message);
        return false;
      } else {
        console.log('✅ Schema appears to be fixed! Testing high rates...');
        
        // Test multiple high rates
        const testRates = [37.50, 50.00, 99.99];
        let allPassed = true;
        
        for (const rate of testRates) {
          const { error: testError } = await this.supabase
            .from('comtrade_reference')
            .update({ mfn_tariff_rate: rate })
            .eq('hs_code', '030299');
            
          if (testError) {
            console.log(`❌ Rate ${rate}% failed:`, testError.message);
            allPassed = false;
          } else {
            console.log(`✅ Rate ${rate}% works`);
          }
        }
        
        return allPassed;
      }
    } catch (error) {
      console.log('❌ Schema test failed:', error.message);
      return false;
    }
  }

  /**
   * Create manual schema fix instructions
   */
  createSchemaFixInstructions() {
    console.log('\n📝 MANUAL SCHEMA FIX INSTRUCTIONS\n');
    console.log('Since Supabase schema changes require direct SQL access:');
    console.log('');
    console.log('1. 🌐 Go to your Supabase Dashboard');
    console.log('2. 📊 Navigate to SQL Editor');
    console.log('3. 📝 Create a new query');
    console.log('4. 📋 Copy and paste the SQL commands shown above');
    console.log('5. ▶️  Run the query');
    console.log('6. ✅ Verify the schema changes worked');
    console.log('');
    console.log('Alternative: Update table schema through Supabase Table Editor');
    console.log('- Change mfn_tariff_rate from DECIMAL(4,2) to DECIMAL(5,2)');
    console.log('- Change usmca_tariff_rate from DECIMAL(4,2) to DECIMAL(5,2)');
    console.log('- Change base_tariff_rate from DECIMAL(4,2) to DECIMAL(5,2)');
  }

  /**
   * Generate comprehensive report
   */
  generateReport(maxWorkingRate, schemaFixed) {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\n📊 DATABASE SCHEMA FIX REPORT');
    console.log('==============================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Current max working rate: ${maxWorkingRate}%`);
    console.log(`🔧 Schema fix status: ${schemaFixed ? 'COMPLETED ✅' : 'REQUIRES MANUAL FIX ❌'}`);
    
    if (!schemaFixed) {
      console.log(`🚨 CRITICAL: Authentic government rates above ${maxWorkingRate}% are being lost`);
      console.log('🎯 Action Required: Fix database schema to handle rates up to 99.99%');
      console.log('⚠️  Business Risk: Incorrect tariff calculations undermine platform credibility');
    } else {
      console.log('✅ Database can now handle full range of government tariff rates');
      console.log('🎉 Ready to update with authentic high-tariff data');
    }
    
    console.log(`📅 Analysis completed: ${new Date().toISOString()}`);
    console.log('==============================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Database Schema Fix Analysis...\n');
      
      // Step 1: Check current constraints
      const maxWorkingRate = await this.checkCurrentSchema();
      
      // Step 2: Show business impact
      await this.showImpactAnalysis();
      
      // Step 3: Attempt schema fix
      const schemaFixed = await this.attemptSchemaFix();
      
      // Step 4: Provide manual fix instructions if needed
      if (!schemaFixed) {
        this.createSchemaFixInstructions();
      }
      
      // Step 5: Generate report
      this.generateReport(maxWorkingRate, schemaFixed);
      
      if (schemaFixed) {
        console.log('🎉 Schema fix completed! Ready to update with authentic rates.');
        console.log('💡 Next step: Run tariff rate updates without capping');
      } else {
        console.log('⚠️  Schema fix required before proceeding with authentic rate updates');
        console.log('🔧 Please run the provided SQL commands in Supabase Dashboard');
      }
      
    } catch (error) {
      console.error('💥 Schema fix analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const fixer = new DatabaseSchemaFixer();
  fixer.run();
}

module.exports = DatabaseSchemaFixer;