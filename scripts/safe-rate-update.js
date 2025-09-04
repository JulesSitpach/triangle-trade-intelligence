#!/usr/bin/env node

/**
 * Safe Tariff Rate Update Script
 * Updates comtrade_reference with capped tariff rates to avoid numeric overflow
 * Caps rates at 9.99% to work within database field constraints
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  maxRate: 9.99 // Maximum rate to avoid overflow
};

class SafeRateUpdater {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.updatedCount = 0;
    this.cappedCount = 0;
    this.skippedCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Get aggregated rates for 6-digit HS codes with safe limits
   */
  async getSafeAggregatedRates() {
    console.log('🔍 Getting aggregated rates with safe limits...');
    
    // Get all tariff rates
    const { data: allRates } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source')
      .neq('mfn_rate', 0);

    if (!allRates) return [];

    // Group by 6-digit HS code
    const aggregated = new Map();
    
    allRates.forEach(rate => {
      const hsCode6 = rate.hs_code.substring(0, 6);
      
      if (!aggregated.has(hsCode6)) {
        aggregated.set(hsCode6, {
          hs_code_6digit: hsCode6,
          mfn_rates: [],
          usmca_rates: [],
          countries: new Set(),
          sources: new Set()
        });
      }
      
      const group = aggregated.get(hsCode6);
      group.mfn_rates.push(rate.mfn_rate);
      group.usmca_rates.push(rate.usmca_rate);
      group.countries.add(rate.country);
      group.sources.add(rate.source);
    });

    // Calculate safe rates (capped at maxRate)
    const safeRates = Array.from(aggregated.values()).map(group => {
      const avgMfn = group.mfn_rates.reduce((a, b) => a + b, 0) / group.mfn_rates.length;
      const avgUsmca = group.usmca_rates.reduce((a, b) => a + b, 0) / group.usmca_rates.length;
      const maxMfn = Math.max(...group.mfn_rates);
      const maxUsmca = Math.max(...group.usmca_rates);
      
      // Cap rates to avoid overflow
      const safeMfn = Math.min(avgMfn, config.maxRate);
      const safeUsmca = Math.min(avgUsmca, config.maxRate);
      
      return {
        hs_code_6digit: group.hs_code_6digit,
        safe_mfn_rate: Math.round(safeMfn * 100) / 100, // Round to 2 decimals
        safe_usmca_rate: Math.round(safeUsmca * 100) / 100,
        original_mfn_rate: avgMfn,
        original_usmca_rate: avgUsmca,
        max_mfn_rate: maxMfn,
        was_capped: avgMfn > config.maxRate || avgUsmca > config.maxRate,
        rate_count: group.mfn_rates.length,
        countries: Array.from(group.countries).join(',')
      };
    });

    console.log(`✅ Created ${safeRates.length} safe aggregated rates`);
    
    const cappedRates = safeRates.filter(r => r.was_capped);
    console.log(`📊 ${cappedRates.length} rates were capped to avoid overflow`);
    
    return safeRates.sort((a, b) => b.safe_mfn_rate - a.safe_mfn_rate);
  }

  /**
   * Update comtrade_reference with safe rates
   */
  async updateWithSafeRates(safeRates) {
    console.log(`📥 Updating comtrade_reference with ${safeRates.length} safe rates...`);
    
    let updatedCount = 0;
    let cappedCount = 0;
    let skippedCount = 0;

    for (const rateData of safeRates) {
      try {
        const { data, error } = await this.supabase
          .from('comtrade_reference')
          .update({
            mfn_tariff_rate: rateData.safe_mfn_rate,
            usmca_tariff_rate: rateData.safe_usmca_rate,
            base_tariff_rate: rateData.safe_mfn_rate,
            last_updated: new Date().toISOString()
          })
          .eq('hs_code', rateData.hs_code_6digit)
          .select();

        if (error) {
          console.warn(`⚠️ Failed to update ${rateData.hs_code_6digit}: ${error.message}`);
          skippedCount++;
        } else if (data && data.length > 0) {
          updatedCount++;
          if (rateData.was_capped) {
            cappedCount++;
          }
          
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} records (${cappedCount} capped)...`);
          }
        } else {
          skippedCount++;
        }

      } catch (error) {
        console.warn(`⚠️ Error updating ${rateData.hs_code_6digit}: ${error.message}`);
        skippedCount++;
      }
    }

    this.updatedCount = updatedCount;
    this.cappedCount = cappedCount;
    this.skippedCount = skippedCount;

    console.log(`✅ Successfully updated ${updatedCount} records`);
    console.log(`📊 ${cappedCount} rates were capped to ${config.maxRate}%`);
    console.log(`⚠️ ${skippedCount} records skipped`);
    
    return updatedCount;
  }

  /**
   * Show capped rates report
   */
  async showCappedRatesReport(safeRates) {
    console.log('\n📊 HIGH-TARIFF PRODUCTS (Capped to avoid overflow):');
    
    const cappedRates = safeRates
      .filter(r => r.was_capped)
      .sort((a, b) => b.original_mfn_rate - a.original_mfn_rate)
      .slice(0, 10);
      
    for (const rate of cappedRates) {
      // Get product description
      const { data: product } = await this.supabase
        .from('comtrade_reference')
        .select('product_description')
        .eq('hs_code', rate.hs_code_6digit)
        .single();
        
      const desc = product?.product_description || 'Unknown product';
      console.log(`  ${rate.hs_code_6digit} | Original: ${rate.original_mfn_rate.toFixed(1)}% → Capped: ${rate.safe_mfn_rate}%`);
      console.log(`    ${desc.substring(0, 60)}...`);
    }
  }

  /**
   * Verify final results
   */
  async verifyResults() {
    console.log('🔍 Verifying final results...');
    
    // Check hs_master_fixed coverage
    const { count: masterViewCount } = await this.supabase
      .from('hs_master_fixed')
      .select('*', { count: 'exact', head: true });

    console.log(`🎯 hs_master_fixed view now has ${masterViewCount} functional records`);

    // Sample top rates within safe limits
    const { data: topRates } = await this.supabase
      .from('hs_master_fixed')
      .select('hs_code, mfn_rate, usmca_rate, product_description')
      .neq('mfn_rate', 0)
      .order('mfn_rate', { ascending: false })
      .limit(5);

    console.log('\n🏆 Top Tariff Rates (Within Safe Limits):');
    topRates?.forEach((record, index) => {
      const savings = record.mfn_rate - record.usmca_rate;
      console.log(`  ${index + 1}. ${record.hs_code} | MFN: ${record.mfn_rate}% | Savings: ${savings}%`);
      console.log(`     ${record.product_description?.substring(0, 60)}...`);
    });

    return { masterViewCount };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(finalResults) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalProcessed = this.updatedCount + this.skippedCount;
    const successRate = totalProcessed > 0 ? (this.updatedCount / totalProcessed * 100) : 0;

    console.log('\n📊 SAFE TARIFF RATE UPDATE REPORT');
    console.log('==================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Records updated: ${this.updatedCount}`);
    console.log(`📊 Rates capped (>${config.maxRate}%): ${this.cappedCount}`);
    console.log(`⚠️  Records skipped: ${this.skippedCount}`);
    console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
    console.log(`🎯 hs_master_fixed coverage: ${finalResults.masterViewCount} records`);
    console.log(`🎉 Your classification system now works within database constraints`);
    console.log(`📅 Update completed: ${new Date().toISOString()}`);
    console.log('==================================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Safe Tariff Rate Update...\n');
      console.log(`⚠️  Note: Rates will be capped at ${config.maxRate}% to avoid database overflow\n`);
      
      // Step 1: Get safe aggregated rates
      const safeRates = await this.getSafeAggregatedRates();
      
      if (safeRates.length === 0) {
        console.log('❌ No rates found to update');
        return;
      }

      // Step 2: Update with safe rates
      await this.updateWithSafeRates(safeRates);

      // Step 3: Show capped rates report
      await this.showCappedRatesReport(safeRates);

      // Step 4: Verify results
      const finalResults = await this.verifyResults();

      // Step 5: Generate report
      this.generateReport(finalResults);
      
      console.log('🎉 Safe rate update completed successfully!');
      console.log(`💡 Database constraints: Max rate ${config.maxRate}% (higher rates were capped)`);
      console.log(`🎯 Classification coverage: ${finalResults.masterViewCount} products ready for use`);
      
    } catch (error) {
      console.error('💥 Safe rate update failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const updater = new SafeRateUpdater();
  updater.run();
}

module.exports = SafeRateUpdater;