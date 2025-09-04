#!/usr/bin/env node

/**
 * Tariff Rate Matching Script
 * Connects detailed HS codes in comtrade_reference with existing tariff data
 * Populates missing tariff rates and identifies gaps for manual data entry
 * 
 * Purpose: Bridge the gap between comprehensive HS codes and authentic tariff data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  matching: {
    batchSize: 500,
    maxRetries: 3
  }
};

class TariffRateMatcher {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.matchedCount = 0;
    this.unmatchedCount = 0;
    this.updatedCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Get all HS codes from comtrade_reference that need tariff rate matching
   */
  async getHSCodesForMatching() {
    console.log('📋 Fetching HS codes that need tariff rate matching...');
    
    const { data, error } = await this.supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, product_category')
      .is('mfn_tariff_rate', null) // Only get codes without tariff rates
      .order('hs_code');

    if (error) {
      throw new Error(`Failed to fetch HS codes: ${error.message}`);
    }

    console.log(`✅ Found ${data.length} HS codes needing tariff rate matching`);
    return data;
  }

  /**
   * Get all available tariff rates from tariff_rates table
   */
  async getTariffRates() {
    console.log('💰 Fetching available tariff rates...');
    
    const { data, error } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source, effective_date');

    if (error) {
      throw new Error(`Failed to fetch tariff rates: ${error.message}`);
    }

    // Create lookup maps for efficient matching
    const tariffMap = new Map();
    
    data.forEach(rate => {
      if (!tariffMap.has(rate.hs_code)) {
        tariffMap.set(rate.hs_code, {});
      }
      tariffMap.get(rate.hs_code)[rate.country] = {
        mfn_rate: rate.mfn_rate,
        usmca_rate: rate.usmca_rate,
        source: rate.source,
        effective_date: rate.effective_date
      };
    });

    console.log(`✅ Loaded ${data.length} tariff rates for ${tariffMap.size} unique HS codes`);
    return tariffMap;
  }

  /**
   * Match HS codes with tariff rates using multiple strategies
   */
  matchTariffRates(hsCodes, tariffMap) {
    console.log('🔍 Matching HS codes with tariff rates...');
    
    const matches = [];
    const unmatched = [];
    
    for (const hsRecord of hsCodes) {
      const hsCode = hsRecord.hs_code;
      const match = this.findTariffMatch(hsCode, tariffMap);
      
      if (match) {
        matches.push({
          hs_code: hsCode,
          product_description: hsRecord.product_description,
          product_category: hsRecord.product_category,
          tariff_data: match,
          match_method: match.method
        });
        this.matchedCount++;
      } else {
        unmatched.push(hsRecord);
        this.unmatchedCount++;
      }
    }
    
    console.log(`✅ Successfully matched ${matches.length} HS codes`);
    console.log(`⚠️ Could not match ${unmatched.length} HS codes`);
    
    return { matches, unmatched };
  }

  /**
   * Find tariff rate match using multiple strategies
   */
  findTariffMatch(hsCode, tariffMap) {
    // Strategy 1: Exact match
    if (tariffMap.has(hsCode)) {
      return {
        ...this.selectBestTariffData(tariffMap.get(hsCode)),
        method: 'exact_match'
      };
    }
    
    // Strategy 2: Try variations (remove trailing zeros)
    const variations = this.generateHSCodeVariations(hsCode);
    for (const variation of variations) {
      if (tariffMap.has(variation)) {
        return {
          ...this.selectBestTariffData(tariffMap.get(variation)),
          method: 'variation_match',
          original_code: variation
        };
      }
    }
    
    // Strategy 3: Chapter-level match (first 4 digits)
    if (hsCode.length >= 4) {
      const chapterCode = hsCode.substring(0, 4);
      if (tariffMap.has(chapterCode)) {
        return {
          ...this.selectBestTariffData(tariffMap.get(chapterCode)),
          method: 'chapter_match',
          original_code: chapterCode
        };
      }
    }
    
    return null;
  }

  /**
   * Generate HS code variations for matching
   */
  generateHSCodeVariations(hsCode) {
    const variations = [];
    
    // Remove trailing zeros progressively
    let code = hsCode;
    while (code.length > 4 && code.endsWith('0')) {
      code = code.slice(0, -1);
      variations.push(code);
    }
    
    // Try padding with zeros if code is short
    if (hsCode.length < 10) {
      const paddedCode = hsCode.padEnd(10, '0');
      variations.push(paddedCode);
    }
    
    return variations;
  }

  /**
   * Select best tariff data from multiple countries
   */
  selectBestTariffData(countryData) {
    // Priority: US > CA > MX (based on data completeness)
    const priorityOrder = ['US', 'CA', 'MX'];
    
    for (const country of priorityOrder) {
      if (countryData[country]) {
        return {
          country: country,
          mfn_rate: countryData[country].mfn_rate,
          usmca_rate: countryData[country].usmca_rate,
          source: countryData[country].source,
          effective_date: countryData[country].effective_date,
          all_countries: Object.keys(countryData)
        };
      }
    }
    
    // Fallback to any available country
    const firstCountry = Object.keys(countryData)[0];
    if (firstCountry) {
      return {
        country: firstCountry,
        mfn_rate: countryData[firstCountry].mfn_rate,
        usmca_rate: countryData[firstCountry].usmca_rate,
        source: countryData[firstCountry].source,
        effective_date: countryData[firstCountry].effective_date,
        all_countries: Object.keys(countryData)
      };
    }
    
    return null;
  }

  /**
   * Update comtrade_reference table with matched tariff rates
   */
  async updateComtradeReference(matches) {
    console.log(`💾 Updating comtrade_reference with ${matches.length} matched tariff rates...`);
    
    const batchSize = config.matching.batchSize;
    let updatedCount = 0;
    
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);
      
      try {
        // Update records one by one for reliability
        for (const match of batch) {
          const { error } = await this.supabase
            .from('comtrade_reference')
            .update({
              mfn_tariff_rate: match.tariff_data.mfn_rate,
              usmca_tariff_rate: match.tariff_data.usmca_rate
            })
            .eq('hs_code', match.hs_code);

          if (error) {
            console.warn(`⚠️ Failed to update ${match.hs_code}:`, error.message);
          } else {
            updatedCount++;
          }
        }
        
        this.updatedCount = updatedCount;
        console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(matches.length / batchSize)} (${updatedCount} total)`);
        
      } catch (error) {
        console.error(`❌ Batch update failed:`, error.message);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} HS codes with tariff rates`);
    return updatedCount;
  }

  /**
   * Generate unmatched codes report for manual processing
   */
  async generateUnmatchedReport(unmatchedCodes) {
    console.log('📊 Generating report for unmatched HS codes...');
    
    // Group unmatched codes by chapter for easier manual processing
    const chapterGroups = {};
    
    unmatchedCodes.forEach(code => {
      const chapter = code.hs_code.substring(0, 2);
      if (!chapterGroups[chapter]) {
        chapterGroups[chapter] = [];
      }
      chapterGroups[chapter].push(code);
    });
    
    console.log('\n📋 UNMATCHED HS CODES BY CHAPTER');
    console.log('=================================');
    
    Object.entries(chapterGroups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([chapter, codes]) => {
        console.log(`Chapter ${chapter}: ${codes.length} unmatched codes`);
        if (codes.length <= 5) {
          codes.forEach(code => {
            console.log(`  ${code.hs_code}: ${code.product_description.substring(0, 50)}...`);
          });
        }
      });
    
    console.log('=================================\n');
    
    return chapterGroups;
  }

  /**
   * Generate comprehensive matching report
   */
  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    const totalCodes = this.matchedCount + this.unmatchedCount;
    const matchRate = totalCodes > 0 ? (this.matchedCount / totalCodes * 100) : 0;
    
    console.log('\n💰 TARIFF RATE MATCHING REPORT');
    console.log('==============================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total HS codes processed: ${totalCodes}`);
    console.log(`✅ Successfully matched: ${this.matchedCount} (${matchRate.toFixed(1)}%)`);
    console.log(`⚠️  Unmatched codes: ${this.unmatchedCount} (${(100 - matchRate).toFixed(1)}%)`);
    console.log(`💾 Database updates: ${this.updatedCount}`);
    console.log(`🎯 Coverage improvement: From 142 to ${142 + this.updatedCount} HS codes with tariff data`);
    console.log(`📅 Matching completed: ${new Date().toISOString()}`);
    console.log('==============================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Tariff Rate Matching Process...\n');
      
      // Step 1: Get HS codes needing tariff rate matching
      const hsCodes = await this.getHSCodesForMatching();
      
      if (hsCodes.length === 0) {
        console.log('✅ All HS codes already have tariff rates - no matching needed');
        return;
      }

      // Step 2: Load available tariff rates
      const tariffMap = await this.getTariffRates();
      
      if (tariffMap.size === 0) {
        throw new Error('No tariff rates found in database');
      }

      // Step 3: Match HS codes with tariff rates
      const { matches, unmatched } = this.matchTariffRates(hsCodes, tariffMap);

      // Step 4: Update database with matches
      if (matches.length > 0) {
        await this.updateComtradeReference(matches);
      }

      // Step 5: Generate report for unmatched codes
      if (unmatched.length > 0) {
        await this.generateUnmatchedReport(unmatched);
      }

      // Step 6: Generate comprehensive report
      this.generateReport();
      
      console.log('🎉 Tariff rate matching completed successfully!');
      
      if (unmatched.length > 0) {
        console.log(`💡 Next steps: Consider adding tariff data for the ${unmatched.length} unmatched codes`);
        console.log('🌐 Sources: CBP HTS, CBSA Customs Tariff, SAT TIGIE schedules');
      }
      
    } catch (error) {
      console.error('💥 Tariff rate matching failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const matcher = new TariffRateMatcher();
  matcher.run();
}

module.exports = TariffRateMatcher;