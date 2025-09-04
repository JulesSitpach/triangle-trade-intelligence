#!/usr/bin/env node

/**
 * Phase 2: Canadian Data Integration
 * Adds Canadian CBSA tariff rates to existing HS codes in hs_master_rebuild
 * Layers Canadian rates onto the USITC foundation for comprehensive USMCA coverage
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class CanadianDataIntegration {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.updatedCount = 0;
    this.newCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Analyze current hs_master_rebuild status
   */
  async analyzeCurrentStatus() {
    console.log('📊 ANALYZING CURRENT HS_MASTER_REBUILD STATUS\\n');
    
    // Check current records
    const { count: totalRecords } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true });

    // Check US-only records
    const { count: usOnlyRecords } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('country_source', 'US');

    console.log(`Current Status:`);
    console.log(`  Total HS codes in rebuild table: ${totalRecords}`);
    console.log(`  US-only records: ${usOnlyRecords}`);
    console.log(`  Missing Canadian rates: ${usOnlyRecords} records`);
    
    // Show sample HS codes we have
    const { data: sampleCodes } = await this.supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, country_source')
      .limit(10);
      
    console.log('\\nSample HS codes in rebuild table:');
    sampleCodes?.forEach(code => {
      console.log(`  ${code.hs_code} | US Rate: ${code.mfn_rate}% | Source: ${code.country_source}`);
    });

    return { totalRecords, usOnlyRecords };
  }

  /**
   * Get Canadian tariff data for matching HS codes
   */
  async getCanadianData() {
    console.log('\\n🍁 EXTRACTING CANADIAN TARIFF DATA...\\n');
    
    // Get all HS codes that exist in our rebuild table
    const { data: rebuildCodes } = await this.supabase
      .from('hs_master_rebuild')
      .select('hs_code');

    if (!rebuildCodes) {
      throw new Error('Failed to fetch HS codes from rebuild table');
    }

    const rebuildHSCodes = rebuildCodes.map(item => item.hs_code);
    console.log(`📋 Looking for Canadian rates for ${rebuildHSCodes.length} HS codes...`);

    // Get Canadian tariff data for matching codes
    const { data: canadianData, error } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, mfn_rate, usmca_rate, source, effective_date')
      .eq('country', 'CA')
      .in('hs_code', rebuildHSCodes)
      .neq('mfn_rate', 0);

    if (error) {
      throw new Error(`Failed to fetch Canadian data: ${error.message}`);
    }

    console.log(`✅ Found ${canadianData?.length || 0} Canadian tariff records matching our HS codes`);
    
    // Show top Canadian rates
    if (canadianData && canadianData.length > 0) {
      const sortedCanadian = canadianData.sort((a, b) => b.mfn_rate - a.mfn_rate);
      console.log('\\n🏆 TOP CANADIAN TARIFF RATES:');
      sortedCanadian.slice(0, 10).forEach((record, index) => {
        console.log(`  ${index + 1}. ${record.hs_code} | CA Rate: ${record.mfn_rate}% | Source: ${record.source}`);
      });
    }

    return canadianData || [];
  }

  /**
   * Update hs_master_rebuild with Canadian data
   */
  async updateWithCanadianData(canadianData) {
    console.log(`\\n📥 UPDATING HS_MASTER_REBUILD WITH CANADIAN DATA...\\n`);
    
    if (canadianData.length === 0) {
      console.log('⚠️  No Canadian data to process');
      return 0;
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Since your table has a simplified schema, we'll need to handle this differently
    // We can either update existing records with Canadian data or create new records
    console.log('📋 Processing strategy: Adding Canadian records as separate entries');

    const batchSize = 50;
    for (let i = 0; i < canadianData.length; i += batchSize) {
      const batch = canadianData.slice(i, i + batchSize);
      
      try {
        // Prepare Canadian records
        const canadianRecords = batch.map(item => ({
          hs_code: item.hs_code + '_CA', // Differentiate Canadian records
          description: `Canadian rates for ${item.hs_code}`,
          chapter: parseInt(item.hs_code.substring(0, 2)),
          mfn_rate: item.mfn_rate,
          usmca_rate: item.usmca_rate,
          country_source: 'CA',
          effective_date: item.effective_date || '2024-01-01'
        }));

        // Insert Canadian records
        const { error } = await this.supabase
          .from('hs_master_rebuild')
          .insert(canadianRecords);

        if (error) {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
          errorCount += batch.length;
        } else {
          updatedCount += batch.length;
          console.log(`✅ Processed Canadian batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(canadianData.length / batchSize)} (${updatedCount} total)`);
        }

      } catch (error) {
        console.error(`❌ Batch processing error:`, error.message);
        errorCount += batch.length;
      }
    }

    this.updatedCount = updatedCount;
    this.errorCount = errorCount;

    console.log(`\\n✅ Canadian data integration completed:`);
    console.log(`  Successfully added: ${updatedCount} Canadian records`);
    console.log(`  Errors encountered: ${errorCount} records`);
    
    return updatedCount;
  }

  /**
   * Create enhanced view with multi-country support
   */
  async createMultiCountryView() {
    console.log('\\n🎯 CREATING MULTI-COUNTRY COMPARISON VIEW...\\n');

    const viewSQL = `
      CREATE OR REPLACE VIEW hs_master_multicountry AS
      WITH base_codes AS (
        SELECT DISTINCT 
          CASE 
            WHEN hs_code LIKE '%_CA' THEN LEFT(hs_code, LENGTH(hs_code) - 3)
            WHEN hs_code LIKE '%_MX' THEN LEFT(hs_code, LENGTH(hs_code) - 3)  
            ELSE hs_code 
          END as base_hs_code
        FROM hs_master_rebuild
      ),
      rates_by_country AS (
        SELECT 
          CASE 
            WHEN hs_code LIKE '%_CA' THEN LEFT(hs_code, LENGTH(hs_code) - 3)
            WHEN hs_code LIKE '%_MX' THEN LEFT(hs_code, LENGTH(hs_code) - 3)
            ELSE hs_code 
          END as base_hs_code,
          country_source,
          mfn_rate,
          usmca_rate,
          description,
          chapter
        FROM hs_master_rebuild
        WHERE mfn_rate > 0
      )
      SELECT 
        r.base_hs_code as hs_code,
        MAX(CASE WHEN r.country_source = 'US' THEN r.description END) as description,
        MAX(r.chapter) as chapter,
        
        -- US Rates
        MAX(CASE WHEN r.country_source = 'US' THEN r.mfn_rate END) as us_mfn_rate,
        MAX(CASE WHEN r.country_source = 'US' THEN r.usmca_rate END) as us_usmca_rate,
        MAX(CASE WHEN r.country_source = 'US' THEN (r.mfn_rate - r.usmca_rate) END) as us_savings,
        
        -- Canadian Rates  
        MAX(CASE WHEN r.country_source = 'CA' THEN r.mfn_rate END) as ca_mfn_rate,
        MAX(CASE WHEN r.country_source = 'CA' THEN r.usmca_rate END) as ca_usmca_rate,
        MAX(CASE WHEN r.country_source = 'CA' THEN (r.mfn_rate - r.usmca_rate) END) as ca_savings,
        
        -- Best rate comparison
        GREATEST(
          COALESCE(MAX(CASE WHEN r.country_source = 'US' THEN r.mfn_rate END), 0),
          COALESCE(MAX(CASE WHEN r.country_source = 'CA' THEN r.mfn_rate END), 0)
        ) as highest_mfn_rate,
        
        GREATEST(
          COALESCE(MAX(CASE WHEN r.country_source = 'US' THEN (r.mfn_rate - r.usmca_rate) END), 0),
          COALESCE(MAX(CASE WHEN r.country_source = 'CA' THEN (r.mfn_rate - r.usmca_rate) END), 0)
        ) as best_usmca_savings,
        
        -- Product categorization
        CASE
          WHEN MAX(r.chapter) <= 24 THEN 'Food & Agriculture'
          WHEN MAX(r.chapter) <= 27 THEN 'Raw Materials'
          WHEN MAX(r.chapter) <= 38 THEN 'Chemicals'
          WHEN MAX(r.chapter) <= 40 THEN 'Plastics & Rubber'
          WHEN MAX(r.chapter) <= 43 THEN 'Leather & Hides'
          WHEN MAX(r.chapter) <= 49 THEN 'Wood & Paper'
          WHEN MAX(r.chapter) <= 63 THEN 'Textiles & Clothing'
          WHEN MAX(r.chapter) <= 67 THEN 'Footwear & Accessories'
          WHEN MAX(r.chapter) <= 71 THEN 'Stone & Precious Items'
          WHEN MAX(r.chapter) <= 83 THEN 'Base Metals'
          WHEN MAX(r.chapter) <= 85 THEN 'Machinery & Electronics'
          WHEN MAX(r.chapter) <= 89 THEN 'Transportation'
          WHEN MAX(r.chapter) <= 92 THEN 'Precision Instruments'
          ELSE 'Other Products'
        END as product_category
        
      FROM rates_by_country r
      GROUP BY r.base_hs_code
      HAVING COUNT(DISTINCT r.country_source) >= 1
      ORDER BY best_usmca_savings DESC;
    `;

    console.log('📋 SQL for multi-country view:');
    console.log('='*60);
    console.log(viewSQL);
    console.log('='*60);
    console.log('\\n⚠️  Please run this SQL in Supabase SQL Editor to create the multi-country view.');

    return viewSQL;
  }

  /**
   * Verify multi-country integration
   */
  async verifyIntegration() {
    console.log('\\n🔍 VERIFYING MULTI-COUNTRY INTEGRATION...\\n');
    
    // Check total records after integration
    const { count: totalRecords } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true });

    // Check by country
    const { count: usRecords } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('country_source', 'US');

    const { count: caRecords } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('country_source', 'CA');

    console.log(`📊 Integration Results:`);
    console.log(`  Total records: ${totalRecords}`);
    console.log(`  US records: ${usRecords}`);
    console.log(`  Canadian records: ${caRecords}`);
    console.log(`  Coverage expansion: ${((totalRecords - 750) / 750 * 100).toFixed(1)}% increase`);

    // Sample multi-country comparison
    const { data: samples } = await this.supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, country_source, description')
      .order('mfn_rate', { ascending: false })
      .limit(10);

    console.log('\\n🌍 SAMPLE MULTI-COUNTRY RATES:');
    samples?.forEach((record, index) => {
      const baseCode = record.hs_code.replace('_CA', '').replace('_MX', '');
      console.log(`  ${index + 1}. ${baseCode} (${record.country_source}) | Rate: ${record.mfn_rate}%`);
    });

    return { totalRecords, usRecords, caRecords };
  }

  /**
   * Generate comprehensive report
   */
  generateReport(verificationResults, initialStatus) {
    const duration = (Date.now() - this.startTime) / 1000;
    const successRate = this.updatedCount / (this.updatedCount + this.errorCount) * 100;

    console.log('\\n📊 PHASE 2: CANADIAN INTEGRATION REPORT');
    console.log('========================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`🍁 Canadian records added: ${this.updatedCount}`);
    console.log(`❌ Errors encountered: ${this.errorCount}`);
    console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
    console.log(`📊 Total records: ${initialStatus.totalRecords} → ${verificationResults.totalRecords}`);
    console.log(`🌍 Countries covered: US (${verificationResults.usRecords}) + CA (${verificationResults.caRecords})`);
    console.log(`🎯 Multi-country foundation: ESTABLISHED`);
    console.log(`📅 Integration completed: ${new Date().toISOString()}`);
    console.log('========================================\\n');

    console.log('🚀 NEXT STEPS (Phase 3):');
    console.log('1. Run the multi-country view SQL in Supabase');
    console.log('2. Test multi-country rate comparisons');
    console.log('3. Prepare for Mexican data integration (SAT)');
    console.log('4. Begin Phase 3: Complete USMCA triangulation\\n');

    console.log('💡 Your platform now has US + Canadian rate comparisons!');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🍁 PHASE 2: CANADIAN DATA INTEGRATION\\n');
      console.log('Layering Canadian CBSA rates onto USITC foundation...\\n');
      
      // Step 1: Analyze current status
      const initialStatus = await this.analyzeCurrentStatus();
      
      // Step 2: Get Canadian data
      const canadianData = await this.getCanadianData();
      
      if (canadianData.length === 0) {
        console.log('⚠️  No matching Canadian data found');
        return;
      }

      // Step 3: Update with Canadian data
      await this.updateWithCanadianData(canadianData);

      // Step 4: Create multi-country view
      await this.createMultiCountryView();

      // Step 5: Verify integration
      const verificationResults = await this.verifyIntegration();

      // Step 6: Generate report
      this.generateReport(verificationResults, initialStatus);
      
      console.log('🎉 Phase 2: Canadian Integration completed successfully!');
      console.log(`🌍 Your platform now has US + Canadian coverage for comprehensive USMCA analysis`);
      
    } catch (error) {
      console.error('💥 Phase 2: Canadian Integration failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const integration = new CanadianDataIntegration();
  integration.run();
}

module.exports = CanadianDataIntegration;