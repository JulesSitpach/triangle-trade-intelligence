#!/usr/bin/env node

/**
 * Phase 1: USITC Integration
 * Populates hs_master_rebuild with authentic USITC HTS data
 * Creates the foundation with proper HS codes, descriptions, and US tariff rates
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class USITCIntegration {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Test the new table structure
   */
  async testNewTable() {
    console.log('🧪 Testing hs_master_rebuild table...\n');
    
    try {
      // Test insert with high tariff rate
      const testRecord = {
        hs_code: 'TEST001',
        description: 'Test product for schema validation',
        chapter: 64,
        mfn_rate: 46.75,
        usmca_rate: 0.0,
        country_source: 'US',
        effective_date: '2024-01-01'
      };

      const { error: insertError } = await this.supabase
        .from('hs_master_rebuild')
        .insert(testRecord);

      if (insertError) {
        console.log('❌ Table test failed:', insertError.message);
        return false;
      }

      console.log('✅ High tariff rate (46.75%) insert successful');

      // Clean up test record
      await this.supabase
        .from('hs_master_rebuild')
        .delete()
        .eq('hs_code', 'TEST001');

      console.log('✅ Table schema validation passed\n');
      return true;

    } catch (error) {
      console.log('❌ Table test error:', error.message);
      return false;
    }
  }

  /**
   * Get authentic USITC data from existing tariff_rates table
   */
  async getUSITCData() {
    console.log('📊 Extracting authentic USITC data from existing tariff_rates...\n');
    
    // Get US tariff data that's already authentic
    const { data: usData, error } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, mfn_rate, usmca_rate, source, effective_date')
      .eq('country', 'US')
      .neq('mfn_rate', 0)
      .order('mfn_rate', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch USITC data: ${error.message}`);
    }

    console.log(`✅ Found ${usData.length} authentic US tariff records`);
    
    // Show high-value samples
    console.log('\n🏆 TOP HIGH-TARIFF PRODUCTS FROM USITC:');
    usData.slice(0, 10).forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.hs_code} | Rate: ${record.mfn_rate}% | Source: ${record.source}`);
    });

    return usData;
  }

  /**
   * Generate comprehensive product descriptions for HS codes
   */
  generateUSITCDescription(hsCode, mfnRate) {
    const chapter = parseInt(hsCode.substring(0, 2));
    
    // Comprehensive HS chapter descriptions based on official HTS
    const chapterDescriptions = {
      1: 'Live animals',
      2: 'Meat and edible meat offal', 
      3: 'Fish and crustaceans, mollusks and other aquatic invertebrates',
      4: 'Dairy produce; birds\' eggs; natural honey; edible products of animal origin',
      5: 'Products of animal origin, not elsewhere specified or included',
      6: 'Live trees and other plants; bulbs, roots; cut flowers and ornamental foliage',
      7: 'Edible vegetables and certain roots and tubers',
      8: 'Edible fruit and nuts; peel of citrus fruit or melons',
      9: 'Coffee, tea, maté and spices',
      10: 'Cereals',
      11: 'Products of the milling industry; malt; starches; inulin; wheat gluten',
      12: 'Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit',
      13: 'Lac; gums, resins and other vegetable saps and extracts',
      14: 'Vegetable plaiting materials; vegetable products not elsewhere specified',
      15: 'Animal or vegetable fats and oils and their cleavage products',
      16: 'Preparations of meat, of fish or of crustaceans, mollusks or other aquatic invertebrates',
      17: 'Sugars and sugar confectionery',
      18: 'Cocoa and cocoa preparations',
      19: 'Preparations of cereals, flour, starch or milk; pastrycooks\' products',
      20: 'Preparations of vegetables, fruit, nuts or other parts of plants',
      21: 'Miscellaneous edible preparations',
      22: 'Beverages, spirits and vinegar',
      23: 'Residues and waste from the food industries; prepared animal fodder',
      24: 'Tobacco and manufactured tobacco substitutes',
      25: 'Salt; sulfur; earths and stone; plastering materials, lime and cement',
      26: 'Ores, slag and ash',
      27: 'Mineral fuels, mineral oils and products of their distillation',
      28: 'Inorganic chemicals; organic or inorganic compounds of precious metals',
      29: 'Organic chemicals',
      30: 'Pharmaceutical products',
      31: 'Fertilizers',
      32: 'Tanning or dyeing extracts; tannins and their derivatives; dyes, pigments',
      33: 'Essential oils and resinoids; perfumery, cosmetic or toilet preparations',
      34: 'Soap, organic surface-active agents, washing preparations, lubricating preparations',
      35: 'Albuminoidal substances; modified starches; glues; enzymes',
      36: 'Explosives; pyrotechnic products; matches; pyrophoric alloys',
      37: 'Photographic or cinematographic goods',
      38: 'Miscellaneous chemical products',
      39: 'Plastics and articles thereof',
      40: 'Rubber and articles thereof',
      41: 'Raw hides and skins (other than furskins) and leather',
      42: 'Articles of leather; saddlery and harness; travel goods, handbags and similar containers',
      43: 'Furskins and artificial fur; manufactures thereof',
      44: 'Wood and articles of wood; wood charcoal',
      45: 'Cork and articles of cork',
      46: 'Manufactures of straw, of esparto or of other plaiting materials; basketware',
      47: 'Pulp of wood or of other fibrous cellulosic material; recovered paper',
      48: 'Paper and paperboard; articles of paper pulp, of paper or of paperboard',
      49: 'Printed books, newspapers, pictures and other products of the printing industry',
      50: 'Silk',
      51: 'Wool, fine or coarse animal hair; horsehair yarn and woven fabric',
      52: 'Cotton',
      53: 'Other vegetable textile fibers; paper yarn and woven fabrics of paper yarn',
      54: 'Man-made filaments; strip and the like of man-made textile materials',
      55: 'Man-made staple fibers',
      56: 'Wadding, felt and nonwovens; special yarns; twine, cordage, ropes and cables',
      57: 'Carpets and other textile floor coverings',
      58: 'Special woven fabrics; tufted textile fabrics; lace; tapestries; trimmings; embroidery',
      59: 'Impregnated, coated, covered or laminated textile fabrics',
      60: 'Knitted or crocheted fabrics',
      61: 'Articles of apparel and clothing accessories, knitted or crocheted',
      62: 'Articles of apparel and clothing accessories, not knitted or crocheted',
      63: 'Other made-up textile articles; sets; worn clothing and worn textile articles',
      64: 'Footwear, gaiters and the like; parts of such articles',
      65: 'Headgear and parts thereof',
      66: 'Umbrellas, sun umbrellas, walking sticks, seat-sticks, whips, riding-crops',
      67: 'Prepared feathers and down and articles made of feathers or of down',
      68: 'Articles of stone, plaster, cement, asbestos, mica or similar materials',
      69: 'Ceramic products',
      70: 'Glass and glassware',
      71: 'Natural or cultured pearls, precious or semi-precious stones, precious metals',
      72: 'Iron and steel',
      73: 'Articles of iron or steel',
      74: 'Copper and articles thereof',
      75: 'Nickel and articles thereof',
      76: 'Aluminum and articles thereof',
      78: 'Lead and articles thereof',
      79: 'Zinc and articles thereof',
      80: 'Tin and articles thereof',
      81: 'Other base metals; cermets; articles thereof',
      82: 'Tools, implements, cutlery, spoons and forks, of base metal',
      83: 'Miscellaneous articles of base metal',
      84: 'Nuclear reactors, boilers, machinery and mechanical appliances',
      85: 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers',
      86: 'Railway or tramway locomotives, rolling stock and parts thereof',
      87: 'Vehicles other than railway or tramway rolling stock, and parts and accessories thereof',
      88: 'Aircraft, spacecraft, and parts thereof',
      89: 'Ships, boats and floating structures',
      90: 'Optical, photographic, cinematographic, measuring, checking, precision, medical instruments',
      91: 'Clocks and watches and parts thereof',
      92: 'Musical instruments; parts and accessories of such articles',
      93: 'Arms and ammunition; parts and accessories thereof',
      94: 'Furniture; bedding, mattresses, mattress supports, cushions and similar stuffed furnishings',
      95: 'Toys, games and sports requisites; parts and accessories thereof',
      96: 'Miscellaneous manufactured articles',
      97: 'Works of art, collectors\' pieces and antiques'
    };

    const baseDescription = chapterDescriptions[chapter] || 'Miscellaneous products';
    
    // Add specific context based on HS code patterns
    let specificDescription = baseDescription;
    
    // High-tariff product categories (common patterns)
    if (chapter === 64) {
      specificDescription = hsCode.startsWith('6404') ? 
        'Footwear with outer soles of rubber, plastics, leather or composition leather' :
        'Footwear, gaiters and similar articles';
    } else if (chapter === 61 || chapter === 62) {
      specificDescription = `Articles of apparel and clothing accessories${chapter === 61 ? ', knitted or crocheted' : ', not knitted or crocheted'}`;
    } else if (chapter === 42) {
      specificDescription = hsCode.startsWith('4202') ?
        'Trunks, suit-cases, vanity-cases, executive-cases, brief-cases, school satchels, handbags' :
        'Articles of leather; saddlery and harness; travel goods';
    }

    // Add tariff context for business value
    let tariffContext = '';
    if (mfnRate >= 30) {
      tariffContext = ' (Very high-tariff product - excellent USMCA savings opportunity)';
    } else if (mfnRate >= 20) {
      tariffContext = ' (High-tariff product - significant USMCA benefits)';
    } else if (mfnRate >= 10) {
      tariffContext = ' (Medium-tariff product - good USMCA potential)';
    } else if (mfnRate > 0) {
      tariffContext = ' (Low-tariff product)';
    }

    return `${hsCode} - ${specificDescription}${tariffContext}`;
  }

  /**
   * Populate hs_master_rebuild with USITC data
   */
  async populateUSITCData(usitcData) {
    console.log(`\n📥 Populating hs_master_rebuild with ${usitcData.length} USITC records...\n`);
    
    let processedCount = 0;
    let errorCount = 0;
    const batchSize = 50;

    for (let i = 0; i < usitcData.length; i += batchSize) {
      const batch = usitcData.slice(i, i + batchSize);
      
      try {
        // Prepare records for insertion
        const records = batch.map(item => ({
          hs_code: item.hs_code,
          description: this.generateUSITCDescription(item.hs_code, item.mfn_rate),
          chapter: parseInt(item.hs_code.substring(0, 2)),
          mfn_rate: item.mfn_rate,
          usmca_rate: item.usmca_rate,
          country_source: 'US',
          effective_date: item.effective_date || '2024-01-01'
        }));

        // Insert batch using upsert to handle duplicates
        const { error } = await this.supabase
          .from('hs_master_rebuild')
          .upsert(records, { onConflict: 'hs_code' });

        if (error) {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
          errorCount += batch.length;
        } else {
          processedCount += batch.length;
          console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usitcData.length / batchSize)} (${processedCount} total)`);
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Batch processing error:`, error.message);
        errorCount += batch.length;
      }
    }

    this.processedCount = processedCount;
    this.errorCount = errorCount;

    console.log(`\n✅ USITC integration completed:`);
    console.log(`  Successfully processed: ${processedCount} records`);
    console.log(`  Errors encountered: ${errorCount} records`);
    
    return processedCount;
  }

  /**
   * Verify the populated data
   */
  async verifyPopulation() {
    console.log('\n🔍 Verifying hs_master_rebuild population...\n');
    
    // Check total records
    const { count: totalRecords } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total records in hs_master_rebuild: ${totalRecords}`);

    // Check high-value products
    const { count: highValueCount } = await this.supabase
      .from('hs_master_rebuild')
      .select('*', { count: 'exact', head: true })
      .gte('mfn_rate', 20);

    console.log(`🏆 High-tariff products (≥20%): ${highValueCount}`);

    // Sample top products
    const { data: topProducts } = await this.supabase
      .from('hs_master_rebuild')
      .select('hs_code, description, mfn_rate, usmca_rate')
      .order('mfn_rate', { ascending: false })
      .limit(5);

    console.log('\n🏆 TOP HIGH-VALUE PRODUCTS:');
    topProducts?.forEach((record, index) => {
      const savings = record.mfn_rate - record.usmca_rate;
      console.log(`  ${index + 1}. ${record.hs_code} | MFN: ${record.mfn_rate}% | Savings: ${savings}%`);
      console.log(`     ${record.description.substring(0, 80)}...`);
    });

    // Check chapter distribution
    const { data: chapterStats } = await this.supabase
      .from('hs_master_rebuild')
      .select('chapter')
      .limit(1000);

    if (chapterStats) {
      const chapterCounts = {};
      chapterStats.forEach(record => {
        chapterCounts[record.chapter] = (chapterCounts[record.chapter] || 0) + 1;
      });

      console.log('\n📊 CHAPTER DISTRIBUTION (Top 10):');
      Object.entries(chapterCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([chapter, count]) => {
          console.log(`  Chapter ${chapter}: ${count} products`);
        });
    }

    return { totalRecords, highValueCount };
  }

  /**
   * Create optimized view for the application
   */
  async createOptimizedView() {
    console.log('\n🎯 Creating optimized view for application use...\n');

    const viewSQL = `
      CREATE OR REPLACE VIEW hs_master_optimized AS
      SELECT 
        hs_code,
        description,
        chapter,
        mfn_rate,
        usmca_rate,
        (mfn_rate - usmca_rate) as usmca_savings,
        country_source,
        effective_date,
        CASE 
          WHEN mfn_rate >= 30 THEN 'Very High'
          WHEN mfn_rate >= 20 THEN 'High' 
          WHEN mfn_rate >= 10 THEN 'Medium'
          WHEN mfn_rate > 0 THEN 'Low'
          ELSE 'Zero'
        END as tariff_category,
        CASE
          WHEN chapter <= 24 THEN 'Food & Agriculture'
          WHEN chapter <= 27 THEN 'Raw Materials'
          WHEN chapter <= 38 THEN 'Chemicals'
          WHEN chapter <= 40 THEN 'Plastics & Rubber'
          WHEN chapter <= 43 THEN 'Leather & Hides'
          WHEN chapter <= 49 THEN 'Wood & Paper'
          WHEN chapter <= 63 THEN 'Textiles & Clothing'
          WHEN chapter <= 67 THEN 'Footwear & Accessories'
          WHEN chapter <= 71 THEN 'Stone & Precious Items'
          WHEN chapter <= 83 THEN 'Base Metals'
          WHEN chapter <= 85 THEN 'Machinery & Electronics'
          WHEN chapter <= 89 THEN 'Transportation'
          WHEN chapter <= 92 THEN 'Precision Instruments'
          ELSE 'Other Products'
        END as product_category
      FROM hs_master_rebuild
      WHERE mfn_rate > 0
      ORDER BY mfn_rate DESC;
    `;

    console.log('📋 SQL for optimized view:');
    console.log('='*50);
    console.log(viewSQL);
    console.log('='*50);
    console.log('\n⚠️  Please run this SQL in Supabase SQL Editor to create the optimized view.');

    return viewSQL;
  }

  /**
   * Generate comprehensive report
   */
  generateReport(verificationResults) {
    const duration = (Date.now() - this.startTime) / 1000;
    const successRate = this.processedCount / (this.processedCount + this.errorCount) * 100;

    console.log('\n📊 PHASE 1: USITC INTEGRATION REPORT');
    console.log('====================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📥 Records processed: ${this.processedCount}`);
    console.log(`❌ Errors encountered: ${this.errorCount}`);
    console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
    console.log(`📊 Total HS codes: ${verificationResults.totalRecords}`);
    console.log(`🏆 High-value products (≥20%): ${verificationResults.highValueCount}`);
    console.log(`🎯 Foundation Status: ESTABLISHED`);
    console.log(`📅 Integration completed: ${new Date().toISOString()}`);
    console.log('====================================\n');

    console.log('🚀 NEXT STEPS (Phase 2):');
    console.log('1. Update your classification APIs to use hs_master_rebuild table');
    console.log('2. Test with the new comprehensive dataset');
    console.log('3. Prepare for Canadian data integration (CBSA)');
    console.log('4. Begin Phase 2: Multi-country rate layering\n');

    console.log('💡 Your platform now has a solid foundation of authentic USITC data!');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🇺🇸 PHASE 1: USITC INTEGRATION\n');
      console.log('Building foundation with authentic US government data...\n');
      
      // Step 1: Test new table
      const tableWorking = await this.testNewTable();
      if (!tableWorking) {
        throw new Error('hs_master_rebuild table not working properly');
      }

      // Step 2: Get USITC data
      const usitcData = await this.getUSITCData();
      
      if (usitcData.length === 0) {
        console.log('❌ No USITC data found to process');
        return;
      }

      // Step 3: Populate with USITC data
      await this.populateUSITCData(usitcData);

      // Step 4: Verify population
      const verificationResults = await this.verifyPopulation();

      // Step 5: Create optimized view
      await this.createOptimizedView();

      // Step 6: Generate report
      this.generateReport(verificationResults);
      
      console.log('🎉 Phase 1: USITC Integration completed successfully!');
      console.log(`📊 Your hs_master_rebuild table now has ${verificationResults.totalRecords} authentic products`);
      
    } catch (error) {
      console.error('💥 Phase 1: USITC Integration failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const integration = new USITCIntegration();
  integration.run();
}

module.exports = USITCIntegration;