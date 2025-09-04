#!/usr/bin/env node

/**
 * Authentic Tariff Rate Updater
 * Updates existing comtrade_reference records with authentic tariff rates from tariff_rates table
 * Focus: Replace placeholder 0% rates with real government tariff data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class AuthenticRateUpdater {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.updatedCount = 0;
    this.skippedCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Find matches between comtrade_reference and tariff_rates
   */
  async findRateMatches() {
    console.log('🔍 Finding matches between product catalog and authentic tariff rates...');
    
    // Get HS codes from comtrade_reference with placeholder rates
    const { data: products } = await this.supabase
      .from('comtrade_reference')
      .select('hs_code')
      .eq('mfn_tariff_rate', 0);
    
    if (!products || products.length === 0) {
      console.log('✅ No products with placeholder rates found');
      return [];
    }

    console.log(`📊 Found ${products.length} products with placeholder rates`);

    // Get authentic tariff rates for these codes
    const hsCodes = products.map(p => p.hs_code);
    const matches = [];

    // Check in chunks to avoid query size limits
    const chunkSize = 100;
    for (let i = 0; i < hsCodes.length; i += chunkSize) {
      const chunk = hsCodes.slice(i, i + chunkSize);
      
      const { data: rates } = await this.supabase
        .from('tariff_rates')
        .select('hs_code, country, mfn_rate, usmca_rate, source')
        .in('hs_code', chunk)
        .neq('mfn_rate', 0); // Only get non-zero authentic rates

      if (rates && rates.length > 0) {
        // Group by HS code and select best rate
        const rateMap = new Map();
        rates.forEach(rate => {
          if (!rateMap.has(rate.hs_code) || this.isBetterRate(rate, rateMap.get(rate.hs_code))) {
            rateMap.set(rate.hs_code, rate);
          }
        });

        matches.push(...Array.from(rateMap.values()));
      }
    }

    console.log(`✅ Found ${matches.length} authentic rate matches`);
    return matches;
  }

  /**
   * Determine if one rate is better than another for updates
   */
  isBetterRate(newRate, currentRate) {
    // Prefer US rates, then CA, then MX
    const countryPriority = { 'US': 3, 'CA': 2, 'MX': 1 };
    const newPriority = countryPriority[newRate.country] || 0;
    const currentPriority = countryPriority[currentRate.country] || 0;
    
    if (newPriority !== currentPriority) {
      return newPriority > currentPriority;
    }
    
    // If same country priority, prefer higher (more meaningful) rates
    return newRate.mfn_rate > currentRate.mfn_rate;
  }

  /**
   * Update comtrade_reference records with authentic rates
   */
  async updateAuthenticRates(matches) {
    console.log(`📥 Updating ${matches.length} records with authentic tariff rates...`);
    
    let updatedCount = 0;
    let skippedCount = 0;

    for (const match of matches) {
      try {
        // Validate rate values before update
        if (!this.isValidRate(match.mfn_rate) || !this.isValidRate(match.usmca_rate)) {
          console.warn(`⚠️ Invalid rate for ${match.hs_code}: MFN=${match.mfn_rate}, USMCA=${match.usmca_rate}`);
          skippedCount++;
          continue;
        }

        // Update the record
        const { error } = await this.supabase
          .from('comtrade_reference')
          .update({
            mfn_tariff_rate: match.mfn_rate,
            usmca_tariff_rate: match.usmca_rate,
            base_tariff_rate: match.mfn_rate,
            last_updated: new Date().toISOString()
          })
          .eq('hs_code', match.hs_code);

        if (error) {
          console.warn(`⚠️ Failed to update ${match.hs_code}:`, error.message);
          skippedCount++;
        } else {
          updatedCount++;
          if (updatedCount % 50 === 0) {
            console.log(`✅ Updated ${updatedCount} records so far...`);
          }
        }

      } catch (error) {
        console.warn(`⚠️ Error updating ${match.hs_code}:`, error.message);
        skippedCount++;
      }
    }

    this.updatedCount = updatedCount;
    this.skippedCount = skippedCount;
    
    console.log(`✅ Successfully updated ${updatedCount} records`);
    console.log(`⚠️ Skipped ${skippedCount} records due to errors`);
    
    return updatedCount;
  }

  /**
   * Validate that a tariff rate is reasonable
   */
  isValidRate(rate) {
    return typeof rate === 'number' && 
           !isNaN(rate) && 
           isFinite(rate) && 
           rate >= 0 && 
           rate <= 100; // Reasonable upper bound for tariff rates
  }

  /**
   * Verify improvement in hs_master_fixed coverage
   */
  async verifyImprovement() {
    console.log('🔍 Checking hs_master_fixed coverage improvement...');
    
    const { count: newCoverage } = await this.supabase
      .from('hs_master_fixed')
      .select('*', { count: 'exact', head: true });

    console.log(`📈 Current hs_master_fixed coverage: ${newCoverage} records`);
    
    // Sample some records to show variety
    const { data: samples } = await this.supabase
      .from('hs_master_fixed')
      .select('hs_code, mfn_rate, usmca_rate, product_description')
      .neq('mfn_rate', 0)
      .limit(5);

    console.log('Sample records with authentic rates:');
    samples?.forEach(record => {
      console.log(`  ${record.hs_code} | MFN: ${record.mfn_rate}% | USMCA: ${record.usmca_rate}% | ${record.product_description?.substring(0, 30)}...`);
    });

    return newCoverage;
  }

  /**
   * Generate update report
   */
  generateReport(initialCoverage, finalCoverage) {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalProcessed = this.updatedCount + this.skippedCount;
    const successRate = totalProcessed > 0 ? (this.updatedCount / totalProcessed * 100) : 0;
    const coverageImprovement = finalCoverage && initialCoverage ? 
      (finalCoverage - initialCoverage) : 0;

    console.log('\n💰 AUTHENTIC TARIFF RATE UPDATE REPORT');
    console.log('======================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Records updated: ${this.updatedCount}`);
    console.log(`⚠️  Records skipped: ${this.skippedCount}`);
    console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
    
    if (initialCoverage && finalCoverage) {
      console.log(`🎯 Coverage change: ${initialCoverage} → ${finalCoverage} records`);
      console.log(`📊 Records added: ${coverageImprovement}`);
    }
    
    console.log(`🎉 Your classification system now uses more authentic government data`);
    console.log(`📅 Update completed: ${new Date().toISOString()}`);
    console.log('======================================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Authentic Tariff Rate Update...\n');
      
      // Get initial coverage
      const { count: initialCoverage } = await this.supabase
        .from('hs_master_fixed')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Initial hs_master_fixed coverage: ${initialCoverage} records`);

      // Step 1: Find rate matches
      const matches = await this.findRateMatches();
      
      if (matches.length === 0) {
        console.log('✅ No rate matches found - all records may already have authentic rates');
        return;
      }

      // Step 2: Update with authentic rates
      await this.updateAuthenticRates(matches);

      // Step 3: Verify improvement
      const finalCoverage = await this.verifyImprovement();

      // Step 4: Generate report
      this.generateReport(initialCoverage, finalCoverage);
      
      console.log('🎉 Authentic rate update completed successfully!');
      
    } catch (error) {
      console.error('💥 Authentic rate update failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const updater = new AuthenticRateUpdater();
  updater.run();
}

module.exports = AuthenticRateUpdater;