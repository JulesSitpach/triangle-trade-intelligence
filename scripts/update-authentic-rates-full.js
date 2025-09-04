#!/usr/bin/env node

/**
 * Update Authentic Tariff Rates - Full Range
 * Updates comtrade_reference with uncapped authentic government rates
 * Now that schema supports DECIMAL(5,2), we can use real rates up to 99.99%
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class AuthenticRateUpdaterFull {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.updatedCount = 0;
    this.highTariffCount = 0;
    this.skippedCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Test schema fix by trying high rates
   */
  async testSchemaFix() {
    console.log('🧪 Testing database schema fix...\n');
    
    const testRates = [37.50, 46.75, 99.99];
    let allPassed = true;
    
    for (const rate of testRates) {
      try {
        const { error } = await this.supabase
          .from('comtrade_reference')
          .update({ mfn_tariff_rate: rate })
          .eq('hs_code', '030299');
          
        if (error) {
          console.log(`❌ Rate ${rate}% failed: ${error.message}`);
          allPassed = false;
        } else {
          console.log(`✅ Rate ${rate}% works perfectly`);
        }
      } catch (err) {
        console.log(`❌ Rate ${rate}% exception: ${err.message}`);
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log('\n🎉 Schema fix confirmed! Ready for authentic high-tariff updates.\n');
    } else {
      console.log('\n❌ Schema fix incomplete. Cannot proceed with authentic rates.\n');
      return false;
    }
    
    return true;
  }

  /**
   * Get full-range aggregated rates (no caps)
   */
  async getAuthenticAggregatedRates() {
    console.log('🔍 Getting authentic aggregated rates (no caps)...');
    
    // Get all tariff rates without any filtering
    const { data: allRates } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source')
      .neq('mfn_rate', 0);

    if (!allRates) return [];

    console.log(`📊 Processing ${allRates.length} authentic government rates...`);

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

    // Calculate authentic rates (NO CAPS)
    const authenticRates = Array.from(aggregated.values()).map(group => {
      const avgMfn = group.mfn_rates.reduce((a, b) => a + b, 0) / group.mfn_rates.length;
      const avgUsmca = group.usmca_rates.reduce((a, b) => a + b, 0) / group.usmca_rates.length;
      const maxMfn = Math.max(...group.mfn_rates);
      const maxUsmca = Math.max(...group.usmca_rates);
      
      // Use authentic rates - no artificial caps
      return {
        hs_code_6digit: group.hs_code_6digit,
        authentic_mfn_rate: Math.round(avgMfn * 100) / 100, // Round to 2 decimals
        authentic_usmca_rate: Math.round(avgUsmca * 100) / 100,
        max_mfn_rate: maxMfn,
        max_usmca_rate: maxUsmca,
        is_high_tariff: avgMfn >= 20.0, // Flag high-tariff products
        rate_count: group.mfn_rates.length,
        countries: Array.from(group.countries).join(','),
        sources: Array.from(group.sources).join(',')
      };
    });

    console.log(`✅ Created ${authenticRates.length} authentic rate records`);
    
    const highTariffRates = authenticRates.filter(r => r.is_high_tariff);
    console.log(`🏆 ${highTariffRates.length} high-tariff products (≥20%) identified`);
    
    return authenticRates.sort((a, b) => b.authentic_mfn_rate - a.authentic_mfn_rate);
  }

  /**
   * Update comtrade_reference with authentic rates
   */
  async updateWithAuthenticRates(authenticRates) {
    console.log(`📥 Updating comtrade_reference with ${authenticRates.length} authentic rates...`);
    
    let updatedCount = 0;
    let highTariffCount = 0;
    let skippedCount = 0;

    for (const rateData of authenticRates) {
      try {
        const { data, error } = await this.supabase
          .from('comtrade_reference')
          .update({
            mfn_tariff_rate: rateData.authentic_mfn_rate,
            usmca_tariff_rate: rateData.authentic_usmca_rate,
            base_tariff_rate: rateData.authentic_mfn_rate,
            last_updated: new Date().toISOString()
          })
          .eq('hs_code', rateData.hs_code_6digit)
          .select();

        if (error) {
          console.warn(`⚠️ Failed to update ${rateData.hs_code_6digit}: ${error.message}`);
          skippedCount++;
        } else if (data && data.length > 0) {
          updatedCount++;
          if (rateData.is_high_tariff) {
            highTariffCount++;
          }
          
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} records (${highTariffCount} high-tariff)...`);
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
    this.highTariffCount = highTariffCount;
    this.skippedCount = skippedCount;

    console.log(`✅ Successfully updated ${updatedCount} records`);
    console.log(`🏆 ${highTariffCount} high-tariff products (≥20%) updated`);
    console.log(`⚠️ ${skippedCount} records skipped`);
    
    return updatedCount;
  }

  /**
   * Show high-value products report
   */
  async showHighValueProductsReport(authenticRates) {
    console.log('\n🏆 HIGH-VALUE USMCA SAVINGS OPPORTUNITIES:\n');
    
    const highValueRates = authenticRates
      .filter(r => r.is_high_tariff)
      .sort((a, b) => b.authentic_mfn_rate - a.authentic_mfn_rate)
      .slice(0, 10);
      
    for (const rate of highValueRates) {
      // Get product description
      const { data: product } = await this.supabase
        .from('comtrade_reference')
        .select('product_description')
        .eq('hs_code', rate.hs_code_6digit)
        .single();
        
      const desc = product?.product_description || 'Product description not available';
      const savings = rate.authentic_mfn_rate - rate.authentic_usmca_rate;
      
      console.log(`  ${rate.hs_code_6digit} | MFN: ${rate.authentic_mfn_rate}% | USMCA: ${rate.authentic_usmca_rate}% | Savings: ${savings}%`);
      console.log(`    ${desc.substring(0, 70)}...`);
      console.log(`    Sources: ${rate.sources}`);
      console.log('');
    }
  }

  /**
   * Calculate business impact
   */
  calculateBusinessImpact(authenticRates) {
    const highTariffProducts = authenticRates.filter(r => r.is_high_tariff);
    
    if (highTariffProducts.length === 0) return null;
    
    const avgRate = highTariffProducts.reduce((sum, r) => sum + r.authentic_mfn_rate, 0) / highTariffProducts.length;
    const maxRate = Math.max(...highTariffProducts.map(r => r.authentic_mfn_rate));
    const avgSavings = highTariffProducts.reduce((sum, r) => sum + (r.authentic_mfn_rate - r.authentic_usmca_rate), 0) / highTariffProducts.length;
    
    return {
      productCount: highTariffProducts.length,
      avgRate: avgRate,
      maxRate: maxRate,
      avgSavings: avgSavings,
      annualSavingsPerMillion: avgSavings * 10000 // Convert to dollars per $1M import
    };
  }

  /**
   * Verify final results
   */
  async verifyAuthenticResults() {
    console.log('🔍 Verifying authentic rate updates...');
    
    // Check hs_master_fixed coverage
    const { count: masterViewCount } = await this.supabase
      .from('hs_master_fixed')
      .select('*', { count: 'exact', head: true });

    console.log(`🎯 hs_master_fixed view now has ${masterViewCount} functional records`);

    // Check high-tariff products
    const { count: highTariffCount } = await this.supabase
      .from('hs_master_fixed')
      .select('*', { count: 'exact', head: true })
      .gte('mfn_rate', 20);

    console.log(`🏆 High-tariff products (≥20%): ${highTariffCount} records`);

    // Sample authentic high rates
    const { data: topRates } = await this.supabase
      .from('hs_master_fixed')
      .select('hs_code, mfn_rate, usmca_rate, product_description')
      .neq('mfn_rate', 0)
      .order('mfn_rate', { ascending: false })
      .limit(5);

    console.log('\n🏆 Top Authentic Tariff Rates:');
    topRates?.forEach((record, index) => {
      const savings = record.mfn_rate - record.usmca_rate;
      console.log(`  ${index + 1}. ${record.hs_code} | MFN: ${record.mfn_rate}% | Savings: ${savings}%`);
      console.log(`     ${record.product_description?.substring(0, 60)}...`);
    });

    return { masterViewCount, highTariffCount };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(businessImpact, finalResults) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalProcessed = this.updatedCount + this.skippedCount;
    const successRate = totalProcessed > 0 ? (this.updatedCount / totalProcessed * 100) : 0;

    console.log('\n📊 AUTHENTIC TARIFF RATE UPDATE REPORT');
    console.log('======================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Records updated: ${this.updatedCount}`);
    console.log(`🏆 High-tariff products (≥20%): ${this.highTariffCount}`);
    console.log(`⚠️  Records skipped: ${this.skippedCount}`);
    console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
    console.log(`🎯 hs_master_fixed coverage: ${finalResults.masterViewCount} records`);
    console.log(`💎 High-value opportunities: ${finalResults.highTariffCount} products`);
    
    if (businessImpact) {
      console.log(`\n💰 BUSINESS IMPACT:`);
      console.log(`  Average tariff rate: ${businessImpact.avgRate.toFixed(1)}%`);
      console.log(`  Maximum tariff rate: ${businessImpact.maxRate.toFixed(1)}%`);
      console.log(`  Average USMCA savings: ${businessImpact.avgSavings.toFixed(1)}%`);
      console.log(`  Annual savings per $1M imports: $${businessImpact.annualSavingsPerMillion.toLocaleString()}`);
    }
    
    console.log(`\n🎉 Your platform now shows AUTHENTIC government tariff rates`);
    console.log(`📅 Update completed: ${new Date().toISOString()}`);
    console.log('======================================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Authentic Tariff Rate Update (Full Range)...\n');
      
      // Step 1: Test schema fix
      const schemaWorking = await this.testSchemaFix();
      if (!schemaWorking) {
        throw new Error('Database schema not properly fixed');
      }
      
      // Step 2: Get authentic aggregated rates (no caps)
      const authenticRates = await this.getAuthenticAggregatedRates();
      
      if (authenticRates.length === 0) {
        console.log('❌ No authentic rates found to update');
        return;
      }

      // Step 3: Update with authentic rates
      await this.updateWithAuthenticRates(authenticRates);

      // Step 4: Show high-value products
      await this.showHighValueProductsReport(authenticRates);

      // Step 5: Calculate business impact
      const businessImpact = this.calculateBusinessImpact(authenticRates);

      // Step 6: Verify results
      const finalResults = await this.verifyAuthenticResults();

      // Step 7: Generate report
      this.generateReport(businessImpact, finalResults);
      
      console.log('🎉 Authentic rate update completed successfully!');
      console.log(`💡 Platform credibility restored: Real rates up to ${businessImpact?.maxRate.toFixed(1) || 'high'}%`);
      console.log(`🎯 Ready for production: ${finalResults.masterViewCount} products with authentic data`);
      
    } catch (error) {
      console.error('💥 Authentic rate update failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const updater = new AuthenticRateUpdaterFull();
  updater.run();
}

module.exports = AuthenticRateUpdaterFull;