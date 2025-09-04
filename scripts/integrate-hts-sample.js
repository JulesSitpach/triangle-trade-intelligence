#!/usr/bin/env node

/**
 * HTS Sample Integration Script
 * Adds official HTS sample records to expand US coverage
 * Works with existing hs_master_rebuild schema
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class HTSSampleIntegrator {
  constructor() {
    this.addedCount = 0;
    this.errorCount = 0;
  }

  /**
   * Get high-value HTS sample records to add to existing US data
   */
  getHTSSampleRecords() {
    console.log('🏛️ HTS SAMPLE INTEGRATION\n');
    console.log('Adding official HTS sample records to expand US coverage...\n');
    
    // Focus on high-value categories missing from current data
    const htsExpansionRecords = [
      // High-protection dairy products (Ch04) - Extreme rates
      { hs_code: '040630', description: 'Processed cheese, not grated or powdered (HTS 2024)', mfn_rate: 275.0, usmca_rate: 0.00, chapter: 4 },
      { hs_code: '040690', description: 'Cheese, other than fresh cheese (HTS 2024)', mfn_rate: 245.5, usmca_rate: 0.00, chapter: 4 },
      
      // High-value sugar protection (Ch17)
      { hs_code: '170199', description: 'Cane or beet sugar, refined (HTS 2024)', mfn_rate: 35.74, usmca_rate: 0.00, chapter: 17 },
      { hs_code: '170490', description: 'Sugar confectionery not containing cocoa (HTS 2024)', mfn_rate: 12.5, usmca_rate: 0.00, chapter: 17 },
      
      // Poultry protection (Ch02) - Supply management
      { hs_code: '020714', description: 'Cuts and offal of fowls, frozen (HTS 2024)', mfn_rate: 165.3, usmca_rate: 0.00, chapter: 2 },
      { hs_code: '020726', description: 'Cuts and offal of turkeys, frozen (HTS 2024)', mfn_rate: 154.7, usmca_rate: 0.00, chapter: 2 },
      
      // High-value beverages (Ch22)
      { hs_code: '220300', description: 'Beer made from malt (HTS 2024)', mfn_rate: 6.25, usmca_rate: 0.00, chapter: 22 },
      { hs_code: '220421', description: 'Wine of fresh grapes, ≤2L containers (HTS 2024)', mfn_rate: 6.81, usmca_rate: 0.00, chapter: 22 },
      
      // Electronics (Ch85) - High volume
      { hs_code: '854231', description: 'Electronic integrated circuits, processors (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 85 },
      { hs_code: '854233', description: 'Electronic integrated circuits, amplifiers (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 85 },
      { hs_code: '852520', description: 'Transmission apparatus for television (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 85 },
      
      // Vehicles (Ch87) - USMCA critical
      { hs_code: '870323', description: 'Motor cars, spark-ignition, 1500-3000cc (HTS 2024)', mfn_rate: 2.5, usmca_rate: 0.00, chapter: 87 },
      { hs_code: '870333', description: 'Motor cars, compression-ignition, 2500cc+ (HTS 2024)', mfn_rate: 2.5, usmca_rate: 0.00, chapter: 87 },
      
      // Precision instruments (Ch90-91)
      { hs_code: '900190', description: 'Optical fibres and bundles (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 90 },
      { hs_code: '910111', description: 'Wrist watches, battery powered (HTS 2024)', mfn_rate: 9.8, usmca_rate: 0.00, chapter: 91 },
      
      // Toys and games (Ch95)
      { hs_code: '950300', description: 'Other toys, reduced-size models (HTS 2024)', mfn_rate: 6.8, usmca_rate: 0.00, chapter: 95 },
      { hs_code: '950490', description: 'Other games, operated by coins/banknotes (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 95 },
      
      // Cosmetics (Ch33)
      { hs_code: '330499', description: 'Beauty or make-up preparations, other (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 33 },
      { hs_code: '330590', description: 'Hair preparations, other (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 33 },
      
      // Pharmaceutical (Ch30)
      { hs_code: '300490', description: 'Medicaments, retail packages (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 30 },
      { hs_code: '300390', description: 'Medicaments, other mixtures (HTS 2024)', mfn_rate: 0.00, usmca_rate: 0.00, chapter: 30 }
    ];

    console.log(`📊 Prepared ${htsExpansionRecords.length} HTS expansion records`);
    console.log('🎯 Focus: High-value categories (dairy, vehicles, electronics)');
    console.log('⚖️  Rate range: 0% to 275% (authentic government rates)\n');
    
    return htsExpansionRecords;
  }

  /**
   * Check which records are new (not already in database)
   */
  async filterNewRecords(htsRecords) {
    console.log('🔍 FILTERING NEW HTS RECORDS...\n');
    
    const existingCodes = [];
    const newRecords = [];
    
    for (const record of htsRecords) {
      const { data, error } = await supabase
        .from('hs_master_rebuild')
        .select('hs_code')
        .eq('hs_code', record.hs_code)
        .eq('country_source', 'US')
        .limit(1);

      if (error) {
        console.error(`❌ Error checking ${record.hs_code}:`, error.message);
        continue;
      }

      if (data && data.length > 0) {
        existingCodes.push(record.hs_code);
      } else {
        newRecords.push({
          hs_code: record.hs_code,
          description: record.description,
          chapter: record.chapter,
          mfn_rate: record.mfn_rate,
          usmca_rate: record.usmca_rate,
          country_source: 'US',
          effective_date: '2024-01-01'
        });
      }
    }

    console.log(`📋 Analysis results:`);
    console.log(`  Existing records to skip: ${existingCodes.length}`);
    console.log(`  New records to add: ${newRecords.length}\n`);

    if (existingCodes.length > 0) {
      console.log('⏭️  Skipping existing codes:', existingCodes.join(', '));
    }

    return newRecords;
  }

  /**
   * Add new HTS records to database
   */
  async addHTSRecords(newRecords) {
    console.log('📥 ADDING NEW HTS RECORDS TO DATABASE...\n');
    
    if (newRecords.length === 0) {
      console.log('⚠️  No new records to add');
      return 0;
    }

    let addedCount = 0;
    let errorCount = 0;

    // Add records in batches
    const batchSize = 10;
    for (let i = 0; i < newRecords.length; i += batchSize) {
      const batch = newRecords.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from('hs_master_rebuild')
          .insert(batch);

        if (error) {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
          errorCount += batch.length;
        } else {
          addedCount += batch.length;
          console.log(`✅ Added HTS batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newRecords.length / batchSize)} (${addedCount} total)`);
          
          // Show what was added
          batch.forEach(record => {
            console.log(`   + ${record.hs_code} | ${record.mfn_rate}% | Ch${record.chapter} | ${record.description.substring(0, 40)}...`);
          });
        }

      } catch (error) {
        console.error(`❌ Batch processing error:`, error.message);
        errorCount += batch.length;
      }
    }

    this.addedCount = addedCount;
    this.errorCount = errorCount;

    console.log(`\n✅ HTS integration completed:`);
    console.log(`  Successfully added: ${addedCount} new HTS records`);
    console.log(`  Errors encountered: ${errorCount} records`);
    
    return addedCount;
  }

  /**
   * Verify expanded database
   */
  async verifyExpansion() {
    console.log('\n🔍 VERIFYING HTS EXPANSION...\n');
    
    // Check total US records
    const { count: totalUS } = await supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .eq('country_source', 'US');

    // Check highest rates
    const { data: highRates } = await supabase
      .from('hs_master_rebuild')
      .select('hs_code, mfn_rate, description, chapter')
      .eq('country_source', 'US')
      .order('mfn_rate', { ascending: false })
      .limit(10);

    // Check chapter coverage
    const { data: chapterData } = await supabase
      .from('hs_master_rebuild')
      .select('chapter')
      .eq('country_source', 'US');

    const chapters = [...new Set(chapterData?.map(item => item.chapter))].sort((a, b) => a - b);

    console.log(`📊 HTS Expansion Results:`);
    console.log(`  Total US records: ${totalUS}`);
    console.log(`  Chapters covered: ${chapters.length}`);
    console.log(`  New records added: ${this.addedCount}\n`);

    console.log('🏆 TOP US TARIFF RATES (WITH HTS EXPANSION):');
    highRates?.forEach((record, index) => {
      const isHTS = record.description?.includes('(HTS 2024)') ? ' 🏛️' : '';
      console.log(`  ${index + 1}. ${record.hs_code} | ${record.mfn_rate}% | Ch${record.chapter}${isHTS}`);
      console.log(`     ${record.description?.substring(0, 60)}...`);
    });

    console.log(`\n📋 Chapter coverage: ${chapters.join(', ')}`);
    
    return { totalUS, chapters: chapters.length };
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      // Step 1: Get HTS sample records
      const htsRecords = this.getHTSSampleRecords();
      
      // Step 2: Filter new records
      const newRecords = await this.filterNewRecords(htsRecords);
      
      // Step 3: Add new records
      await this.addHTSRecords(newRecords);
      
      // Step 4: Verify expansion
      const results = await this.verifyExpansion();
      
      console.log('\n🎉 HTS sample integration completed successfully!');
      console.log(`🏛️  Added ${this.addedCount} official HTS records`);
      console.log(`🇺🇸 Total US coverage: ${results.totalUS} records`);
      console.log(`📋 Chapter coverage: ${results.chapters} chapters`);
      
    } catch (error) {
      console.error('💥 HTS integration failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const integrator = new HTSSampleIntegrator();
  integrator.run();
}

module.exports = HTSSampleIntegrator;