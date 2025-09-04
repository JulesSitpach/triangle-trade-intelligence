#!/usr/bin/env node

/**
 * Normalize and Match Tariff Rates Script
 * Uses SQL-based matching to connect tariff_rates with comtrade_reference
 * Strategy: Normalize HS codes to 6 digits and perform bulk updates
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class NormalizeAndMatchRates {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.startTime = Date.now();
  }

  /**
   * Analyze current state before matching
   */
  async analyzeCurrentState() {
    console.log('📊 Analyzing current database state...\n');
    
    // Check tariff_rates structure
    const { data: tariffSample } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source')
      .neq('mfn_rate', 0)
      .limit(5);
      
    console.log('Sample tariff_rates records:');
    tariffSample?.forEach(record => {
      console.log(`  ${record.hs_code} (${record.hs_code.length} digits) | ${record.country} | MFN: ${record.mfn_rate}% | Source: ${record.source}`);
    });
    
    // Check comtrade_reference structure
    const { data: comtradeSample } = await this.supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, mfn_tariff_rate')
      .limit(5);
      
    console.log('\nSample comtrade_reference records:');
    comtradeSample?.forEach(record => {
      console.log(`  ${record.hs_code} (${record.hs_code.length} digits) | Rate: ${record.mfn_tariff_rate}% | ${record.product_description?.substring(0, 40)}...`);
    });
    
    // Count records
    const { count: tariffCount } = await this.supabase
      .from('tariff_rates')
      .select('*', { count: 'exact', head: true });
      
    const { count: comtradeCount } = await this.supabase
      .from('comtrade_reference')  
      .select('*', { count: 'exact', head: true });
      
    console.log(`\n📋 Database Summary:`);
    console.log(`  tariff_rates: ${tariffCount} records`);
    console.log(`  comtrade_reference: ${comtradeCount} records`);
    
    return { tariffCount, comtradeCount };
  }

  /**
   * Create aggregated tariff rates for 6-digit HS codes
   */
  async createAggregatedRates() {
    console.log('🔄 Creating aggregated tariff rates for 6-digit HS codes...');
    
    // Create a temporary view of aggregated rates
    const aggregationQuery = `
      SELECT 
        LEFT(hs_code, 6) as hs_code_6digit,
        AVG(mfn_rate) as avg_mfn_rate,
        AVG(usmca_rate) as avg_usmca_rate,
        MAX(mfn_rate) as max_mfn_rate,
        MAX(usmca_rate) as max_usmca_rate,
        COUNT(*) as rate_count,
        STRING_AGG(DISTINCT country, ',') as countries,
        STRING_AGG(DISTINCT source, ',') as sources
      FROM tariff_rates 
      WHERE mfn_rate > 0 
        AND LENGTH(hs_code) >= 6
      GROUP BY LEFT(hs_code, 6)
      ORDER BY avg_mfn_rate DESC
    `;

    try {
      const { data: aggregatedRates, error } = await this.supabase.rpc('execute_sql', {
        query: aggregationQuery
      });

      if (error) {
        // Fallback to application-level aggregation
        console.log('📝 Using application-level aggregation...');
        return await this.applicationLevelAggregation();
      }

      console.log(`✅ Created ${aggregatedRates?.length || 0} aggregated rate records`);
      return aggregatedRates || [];

    } catch (error) {
      console.log('📝 SQL aggregation failed, using application approach...');
      return await this.applicationLevelAggregation();
    }
  }

  /**
   * Fallback aggregation using application logic
   */
  async applicationLevelAggregation() {
    console.log('🔄 Performing application-level rate aggregation...');
    
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
          rates: [],
          countries: new Set(),
          sources: new Set()
        });
      }
      
      const group = aggregated.get(hsCode6);
      group.rates.push({
        mfn: rate.mfn_rate,
        usmca: rate.usmca_rate
      });
      group.countries.add(rate.country);
      group.sources.add(rate.source);
    });

    // Calculate averages and maximums
    const result = Array.from(aggregated.values()).map(group => {
      const mfnRates = group.rates.map(r => r.mfn);
      const usmcaRates = group.rates.map(r => r.usmca);
      
      return {
        hs_code_6digit: group.hs_code_6digit,
        avg_mfn_rate: mfnRates.reduce((a, b) => a + b, 0) / mfnRates.length,
        avg_usmca_rate: usmcaRates.reduce((a, b) => a + b, 0) / usmcaRates.length,
        max_mfn_rate: Math.max(...mfnRates),
        max_usmca_rate: Math.max(...usmcaRates),
        rate_count: group.rates.length,
        countries: Array.from(group.countries).join(','),
        sources: Array.from(group.sources).join(',')
      };
    });

    console.log(`✅ Application-level aggregation created ${result.length} records`);
    return result.sort((a, b) => b.avg_mfn_rate - a.avg_mfn_rate);
  }

  /**
   * Update comtrade_reference with aggregated rates
   */
  async updateWithAggregatedRates(aggregatedRates) {
    console.log(`📥 Updating comtrade_reference with ${aggregatedRates.length} aggregated rates...`);
    
    let updatedCount = 0;
    let matchedCount = 0;
    
    for (const rateData of aggregatedRates) {
      try {
        // Use the average rate as primary, but indicate if there are multiple sources
        const mfnRate = rateData.avg_mfn_rate;
        const usmcaRate = rateData.avg_usmca_rate;
        
        // Validate rates
        if (!this.isValidRate(mfnRate) || !this.isValidRate(usmcaRate)) {
          continue;
        }

        const { data, error } = await this.supabase
          .from('comtrade_reference')
          .update({
            mfn_tariff_rate: Math.round(mfnRate * 100) / 100, // Round to 2 decimals
            usmca_tariff_rate: Math.round(usmcaRate * 100) / 100,
            base_tariff_rate: Math.round(mfnRate * 100) / 100,
            last_updated: new Date().toISOString()
          })
          .eq('hs_code', rateData.hs_code_6digit)
          .select();

        if (error) {
          console.warn(`⚠️ Failed to update ${rateData.hs_code_6digit}: ${error.message}`);
        } else if (data && data.length > 0) {
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`✅ Updated ${updatedCount} records so far...`);
          }
        }
        
        matchedCount++;

      } catch (error) {
        console.warn(`⚠️ Error updating ${rateData.hs_code_6digit}: ${error.message}`);
      }
    }

    console.log(`✅ Successfully updated ${updatedCount} comtrade_reference records`);
    console.log(`📊 Matched ${matchedCount} out of ${aggregatedRates.length} aggregated rates`);
    
    return updatedCount;
  }

  /**
   * Validate tariff rate values
   */
  isValidRate(rate) {
    return typeof rate === 'number' && 
           !isNaN(rate) && 
           isFinite(rate) && 
           rate >= 0 && 
           rate <= 1000; // Allow up to 1000% for edge cases
  }

  /**
   * Verify the matching results
   */
  async verifyResults() {
    console.log('🔍 Verifying matching results...');
    
    // Check updated records
    const { count: updatedCount } = await this.supabase
      .from('comtrade_reference')
      .select('*', { count: 'exact', head: true })
      .neq('mfn_tariff_rate', 0);

    console.log(`📊 comtrade_reference records with non-zero rates: ${updatedCount}`);

    // Sample updated records
    const { data: samples } = await this.supabase
      .from('comtrade_reference')
      .select('hs_code, mfn_tariff_rate, usmca_tariff_rate, product_description')
      .neq('mfn_tariff_rate', 0)
      .order('mfn_tariff_rate', { ascending: false })
      .limit(10);

    console.log('\n🏆 Top 10 Updated Records by Tariff Rate:');
    samples?.forEach((record, index) => {
      const savings = record.mfn_tariff_rate - record.usmca_tariff_rate;
      console.log(`  ${index + 1}. ${record.hs_code} | MFN: ${record.mfn_tariff_rate}% | USMCA: ${record.usmca_tariff_rate}% | Savings: ${savings}%`);
      console.log(`     ${record.product_description?.substring(0, 80)}...`);
    });

    // Check hs_master_fixed coverage improvement
    const { count: masterViewCount } = await this.supabase
      .from('hs_master_fixed')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎯 hs_master_fixed view now has ${masterViewCount} functional records`);

    return { updatedCount, masterViewCount };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(initialState, finalResults) {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\n📊 NORMALIZE AND MATCH RATES REPORT');
    console.log('====================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📋 Source data: ${initialState.tariffCount} tariff rates, ${initialState.comtradeCount} products`);
    console.log(`✅ Records updated: ${finalResults.updatedCount}`);
    console.log(`🎯 hs_master_fixed coverage: ${finalResults.masterViewCount} records`);
    console.log(`📈 Coverage improvement: ${((finalResults.updatedCount / initialState.comtradeCount) * 100).toFixed(1)}% of products now have tariff rates`);
    console.log(`🎉 Your classification system has dramatically expanded capability`);
    console.log(`📅 Matching completed: ${new Date().toISOString()}`);
    console.log('====================================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Normalize and Match Rates Process...\n');
      
      // Step 1: Analyze current state
      const initialState = await this.analyzeCurrentState();
      
      // Step 2: Create aggregated rates for 6-digit codes
      const aggregatedRates = await this.createAggregatedRates();
      
      if (aggregatedRates.length === 0) {
        console.log('❌ No aggregated rates created - check data');
        return;
      }

      // Step 3: Update comtrade_reference with aggregated rates
      const updatedCount = await this.updateWithAggregatedRates(aggregatedRates);

      // Step 4: Verify results
      const finalResults = await this.verifyResults();

      // Step 5: Generate report
      this.generateReport(initialState, { ...finalResults, updatedCount });
      
      console.log('🎉 Normalize and match rates completed successfully!');
      console.log(`💡 Your classification system can now handle ${finalResults.masterViewCount} products with authentic government rates`);
      
    } catch (error) {
      console.error('💥 Normalize and match rates failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const processor = new NormalizeAndMatchRates();
  processor.run();
}

module.exports = NormalizeAndMatchRates;