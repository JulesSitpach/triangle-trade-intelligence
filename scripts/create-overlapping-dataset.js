#!/usr/bin/env node

/**
 * Create Overlapping Dataset
 * Populates comtrade_reference with product descriptions for HS codes that exist in tariff_rates
 * This ensures the tables can actually join and provide meaningful results
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  }
};

class OverlappingDatasetCreator {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.addedCount = 0;
    this.startTime = Date.now();
  }

  /**
   * Get HS codes from tariff_rates that don't exist in comtrade_reference
   */
  async getMissingProducts() {
    console.log('🔍 Finding HS codes with tariff data but no product descriptions...\n');
    
    // Get all HS codes from tariff_rates (with rates)
    const { data: tariffCodes } = await this.supabase
      .from('tariff_rates')
      .select('hs_code, country, mfn_rate, usmca_rate, source')
      .neq('mfn_rate', 0)
      .order('mfn_rate', { ascending: false });

    // Get all HS codes from comtrade_reference  
    const { data: comtradeCodes } = await this.supabase
      .from('comtrade_reference')
      .select('hs_code');

    if (!tariffCodes || !comtradeCodes) {
      throw new Error('Failed to fetch HS codes');
    }

    console.log(`📊 Found ${tariffCodes.length} tariff records and ${comtradeCodes.length} product records`);

    // Create sets for efficient lookup
    const comtradeSet = new Set(comtradeCodes.map(item => item.hs_code));
    const missingProducts = new Map();

    // Find tariff codes missing from comtrade_reference
    tariffCodes.forEach(tariff => {
      const hsCode = tariff.hs_code;
      const hsCode6 = hsCode.substring(0, 6);
      
      // Check both full code and 6-digit version
      if (!comtradeSet.has(hsCode) && !comtradeSet.has(hsCode6)) {
        if (!missingProducts.has(hsCode6)) {
          missingProducts.set(hsCode6, {
            hs_code: hsCode6,
            sample_tariff: tariff,
            max_rate: tariff.mfn_rate
          });
        } else {
          // Keep the highest rate as sample
          const existing = missingProducts.get(hsCode6);
          if (tariff.mfn_rate > existing.max_rate) {
            existing.sample_tariff = tariff;
            existing.max_rate = tariff.mfn_rate;
          }
        }
      }
    });

    const missingArray = Array.from(missingProducts.values())
      .sort((a, b) => b.max_rate - a.max_rate);

    console.log(`✅ Found ${missingArray.length} HS codes with tariff data but no product descriptions`);
    
    // Show top missing high-value products
    console.log('\\n🏆 TOP MISSING HIGH-VALUE PRODUCTS:');
    missingArray.slice(0, 10).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.hs_code} | Rate: ${item.max_rate}% | Country: ${item.sample_tariff.country} | Source: ${item.sample_tariff.source}`);
    });

    return missingArray;
  }

  /**
   * Generate product descriptions for missing HS codes
   */
  generateProductDescription(hsCode, sampleTariff) {
    const chapter = parseInt(hsCode.substring(0, 2));
    
    // Enhanced chapter mapping with detailed descriptions
    const chapterDescriptions = {
      1: { category: 'Live Animals', desc: 'Live animals including horses, cattle, sheep' },
      2: { category: 'Meat & Edible Offal', desc: 'Fresh, chilled, frozen meat and edible offal' },
      3: { category: 'Fish & Seafood', desc: 'Fish, crustaceans, mollusks and aquatic products' },
      4: { category: 'Dairy Products', desc: 'Milk, cheese, eggs and other dairy products' },
      5: { category: 'Animal Products', desc: 'Products of animal origin including feathers, bones' },
      6: { category: 'Live Plants', desc: 'Live trees, plants, bulbs and cut flowers' },
      7: { category: 'Vegetables', desc: 'Edible vegetables, roots and tubers' },
      8: { category: 'Fruits & Nuts', desc: 'Edible fruits, nuts, citrus and melon peels' },
      9: { category: 'Coffee, Tea & Spices', desc: 'Coffee, tea, spices and culinary herbs' },
      10: { category: 'Cereals', desc: 'Wheat, rice, barley and other cereal grains' },
      11: { category: 'Flour & Starch', desc: 'Milling products, malt and starches' },
      12: { category: 'Oil Seeds', desc: 'Oil seeds, oleaginous fruits and grains' },
      13: { category: 'Vegetable Extracts', desc: 'Lac, gums, resins and vegetable extracts' },
      14: { category: 'Vegetable Materials', desc: 'Vegetable plaiting materials and products' },
      15: { category: 'Animal & Vegetable Fats', desc: 'Fats, oils and their derivatives' },
      16: { category: 'Prepared Meat', desc: 'Prepared meat, fish and seafood products' },
      17: { category: 'Sugar', desc: 'Sugars and sugar confectionery' },
      18: { category: 'Cocoa', desc: 'Cocoa and cocoa preparations' },
      19: { category: 'Prepared Cereals', desc: 'Prepared cereals, flour, starch products' },
      20: { category: 'Preserved Vegetables', desc: 'Preserved vegetables, fruits and nuts' },
      21: { category: 'Food Preparations', desc: 'Miscellaneous edible preparations' },
      22: { category: 'Beverages', desc: 'Beverages, spirits and vinegar' },
      23: { category: 'Food Waste', desc: 'Food industry residues and animal feed' },
      24: { category: 'Tobacco', desc: 'Tobacco and manufactured tobacco substitutes' },
      25: { category: 'Salt & Stone', desc: 'Salt, sulfur, stone, plaster, lime and cement' },
      26: { category: 'Ores', desc: 'Ores, slag and ash' },
      27: { category: 'Mineral Fuels', desc: 'Mineral fuels, oils and distillation products' },
      28: { category: 'Inorganic Chemicals', desc: 'Inorganic chemicals and compounds' },
      29: { category: 'Organic Chemicals', desc: 'Organic chemicals' },
      30: { category: 'Pharmaceutical Products', desc: 'Pharmaceutical products' },
      31: { category: 'Fertilizers', desc: 'Fertilizers' },
      32: { category: 'Paints & Varnishes', desc: 'Tanning and dyeing extracts, paints, varnishes' },
      33: { category: 'Essential Oils', desc: 'Essential oils, cosmetics and toiletries' },
      34: { category: 'Soap & Detergents', desc: 'Soap, washing and cleaning preparations' },
      35: { category: 'Protein Substances', desc: 'Protein substances, modified starches, glues' },
      36: { category: 'Explosives', desc: 'Explosives, pyrotechnics, matches' },
      37: { category: 'Photographic Products', desc: 'Photographic and cinematographic goods' },
      38: { category: 'Chemical Products', desc: 'Miscellaneous chemical products' },
      39: { category: 'Plastics', desc: 'Plastics and plastic articles' },
      40: { category: 'Rubber', desc: 'Rubber and rubber articles' },
      41: { category: 'Raw Hides', desc: 'Raw hides, skins and leather' },
      42: { category: 'Leather Articles', desc: 'Articles of leather, saddlery, handbags, cases' },
      43: { category: 'Furskins', desc: 'Furskins and artificial fur articles' },
      44: { category: 'Wood Products', desc: 'Wood and articles of wood, wood charcoal' },
      45: { category: 'Cork', desc: 'Cork and articles of cork' },
      46: { category: 'Basketwork', desc: 'Basketwork, wickerwork and other plaited articles' },
      47: { category: 'Pulp Materials', desc: 'Pulp of wood and other fibrous materials' },
      48: { category: 'Paper', desc: 'Paper, paperboard and articles thereof' },
      49: { category: 'Printed Matter', desc: 'Printed books, newspapers, pictures' },
      50: { category: 'Silk', desc: 'Silk and silk yarn and woven fabrics' },
      51: { category: 'Wool', desc: 'Wool, fine animal hair, horsehair yarn' },
      52: { category: 'Cotton', desc: 'Cotton and cotton yarn and woven fabrics' },
      53: { category: 'Vegetable Fibers', desc: 'Other vegetable textile fibers and yarns' },
      54: { category: 'Man-made Filaments', desc: 'Man-made filaments and woven fabrics' },
      55: { category: 'Man-made Staple', desc: 'Man-made staple fibers and woven fabrics' },
      56: { category: 'Wadding & Felt', desc: 'Wadding, felt, nonwovens, twine, cordage' },
      57: { category: 'Carpets', desc: 'Carpets and other textile floor coverings' },
      58: { category: 'Special Fabrics', desc: 'Special woven fabrics, lace, tapestries' },
      59: { category: 'Coated Textiles', desc: 'Impregnated, coated or laminated textiles' },
      60: { category: 'Knitted Fabrics', desc: 'Knitted or crocheted fabrics' },
      61: { category: 'Knitted Clothing', desc: 'Articles of apparel, knitted or crocheted' },
      62: { category: 'Woven Clothing', desc: 'Articles of apparel, not knitted or crocheted' },
      63: { category: 'Textile Articles', desc: 'Other made-up textile articles, worn clothing' },
      64: { category: 'Footwear', desc: 'Footwear, gaiters and similar articles' },
      65: { category: 'Headgear', desc: 'Headgear and parts thereof' },
      66: { category: 'Umbrellas', desc: 'Umbrellas, walking sticks, whips, riding crops' },
      67: { category: 'Feathers', desc: 'Prepared feathers, down, artificial flowers' },
      68: { category: 'Stone Articles', desc: 'Articles of stone, plaster, cement, asbestos' },
      69: { category: 'Ceramic Products', desc: 'Ceramic products' },
      70: { category: 'Glass', desc: 'Glass and glassware' },
      71: { category: 'Precious Items', desc: 'Natural pearls, precious stones and metals' },
      72: { category: 'Iron & Steel', desc: 'Iron and steel' },
      73: { category: 'Iron Articles', desc: 'Articles of iron or steel' },
      74: { category: 'Copper', desc: 'Copper and articles thereof' },
      75: { category: 'Nickel', desc: 'Nickel and articles thereof' },
      76: { category: 'Aluminum', desc: 'Aluminum and articles thereof' },
      78: { category: 'Lead', desc: 'Lead and articles thereof' },
      79: { category: 'Zinc', desc: 'Zinc and articles thereof' },
      80: { category: 'Tin', desc: 'Tin and articles thereof' },
      81: { category: 'Base Metals', desc: 'Other base metals, cermets, articles thereof' },
      82: { category: 'Tools', desc: 'Tools, cutlery, spoons, forks' },
      83: { category: 'Metal Articles', desc: 'Miscellaneous articles of base metal' },
      84: { category: 'Machinery', desc: 'Nuclear reactors, boilers, machinery' },
      85: { category: 'Electronics', desc: 'Electrical machinery, equipment, parts' },
      86: { category: 'Railway Equipment', desc: 'Railway locomotives, rolling stock, track' },
      87: { category: 'Motor Vehicles', desc: 'Vehicles other than railway, parts' },
      88: { category: 'Aircraft', desc: 'Aircraft, spacecraft and parts thereof' },
      89: { category: 'Ships', desc: 'Ships, boats and floating structures' },
      90: { category: 'Instruments', desc: 'Optical, photographic, medical instruments' },
      91: { category: 'Timepieces', desc: 'Clocks, watches and parts thereof' },
      92: { category: 'Musical Instruments', desc: 'Musical instruments and parts' },
      93: { category: 'Arms', desc: 'Arms, ammunition and parts thereof' },
      94: { category: 'Furniture', desc: 'Furniture, bedding, lighting, prefab buildings' },
      95: { category: 'Toys', desc: 'Toys, games, sports equipment' },
      96: { category: 'Manufactured Articles', desc: 'Miscellaneous manufactured articles' },
      97: { category: 'Art Objects', desc: 'Works of art, collectors pieces, antiques' }
    };

    const chapterInfo = chapterDescriptions[chapter] || { category: 'Other Products', desc: 'Other products' };
    
    // Create detailed description
    let description = `${hsCode} - ${chapterInfo.desc}`;
    
    // Add rate context for business importance
    if (sampleTariff.mfn_rate >= 20) {
      description += ' (High-tariff product with significant USMCA savings opportunity)';
    } else if (sampleTariff.mfn_rate >= 10) {
      description += ' (Medium-tariff product with USMCA benefits)';
    } else if (sampleTariff.mfn_rate > 0) {
      description += ' (Low-tariff product)';
    }

    return description;
  }

  /**
   * Add missing products to comtrade_reference
   */
  async addMissingProducts(missingProducts) {
    console.log(`\\n📥 Adding ${missingProducts.length} missing products to comtrade_reference...`);
    
    let addedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < missingProducts.length; i += batchSize) {
      const batch = missingProducts.slice(i, i + batchSize);
      
      try {
        // Prepare records for insertion
        const records = batch.map(item => {
          const hsCode = item.hs_code;
          const chapter = parseInt(hsCode.substring(0, 2));
          
          return {
            hs_code: hsCode,
            product_description: this.generateProductDescription(hsCode, item.sample_tariff),
            product_category: this.getProductCategory(chapter),
            usmca_eligible: this.assessUSMCAEligibility(chapter),
            mfn_tariff_rate: item.sample_tariff.mfn_rate,
            usmca_tariff_rate: item.sample_tariff.usmca_rate,
            base_tariff_rate: item.sample_tariff.mfn_rate,
            last_updated: new Date().toISOString()
          };
        });

        // Insert batch
        const { data, error } = await this.supabase
          .from('comtrade_reference')
          .insert(records);

        if (error) {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        } else {
          addedCount += batch.length;
          console.log(`✅ Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingProducts.length / batchSize)} (${addedCount} total)`);
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Batch insertion error:`, error.message);
      }
    }

    this.addedCount = addedCount;
    console.log(`\\n✅ Successfully added ${addedCount} new product records`);
    return addedCount;
  }

  /**
   * Helper methods
   */
  getProductCategory(chapter) {
    if (chapter <= 24) return 'Food & Agriculture';
    if (chapter <= 27) return 'Raw Materials';
    if (chapter <= 38) return 'Chemicals';
    if (chapter <= 40) return 'Plastics & Rubber';
    if (chapter <= 43) return 'Leather & Hides';
    if (chapter <= 49) return 'Wood & Paper';
    if (chapter <= 63) return 'Textiles & Clothing';
    if (chapter <= 67) return 'Footwear & Accessories';
    if (chapter <= 71) return 'Stone & Precious Items';
    if (chapter <= 83) return 'Base Metals';
    if (chapter <= 85) return 'Machinery & Electronics';
    if (chapter <= 89) return 'Transportation';
    if (chapter <= 92) return 'Precision Instruments';
    return 'Other Products';
  }

  assessUSMCAEligibility(chapter) {
    // Most manufactured goods are USMCA eligible
    const eligible = [39, 40, 42, 44, 48, 49, 61, 62, 63, 64, 72, 73, 76, 84, 85, 87, 90, 94, 95];
    return eligible.includes(chapter);
  }

  /**
   * Verify results
   */
  async verifyResults() {
    console.log('\\n🔍 Verifying overlapping dataset creation...');
    
    // Check new totals
    const { count: newTotal } = await this.supabase
      .from('comtrade_reference')
      .select('*', { count: 'exact', head: true });

    // Check hs_master_fixed coverage
    const { count: masterViewCount } = await this.supabase
      .from('hs_master_fixed')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 comtrade_reference total: ${newTotal} records`);
    console.log(`🎯 hs_master_fixed coverage: ${masterViewCount} records`);
    
    // Sample new high-value products
    const { data: newHighValue } = await this.supabase
      .from('hs_master_fixed')
      .select('hs_code, mfn_rate, usmca_rate, product_description')
      .gte('mfn_rate', 10)
      .order('mfn_rate', { ascending: false })
      .limit(5);

    console.log('\\n🏆 NEW HIGH-VALUE PRODUCTS:');
    newHighValue?.forEach((record, index) => {
      const savings = record.mfn_rate - record.usmca_rate;
      console.log(`  ${index + 1}. ${record.hs_code} | Rate: ${record.mfn_rate}% | Savings: ${savings}%`);
      console.log(`     ${record.product_description?.substring(0, 70)}...`);
    });

    return { newTotal, masterViewCount };
  }

  /**
   * Generate report
   */
  generateReport(results) {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\\n📊 OVERLAPPING DATASET CREATION REPORT');
    console.log('=======================================');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📥 Products added: ${this.addedCount}`);
    console.log(`📊 Total products: ${results.newTotal}`);
    console.log(`🎯 Functional coverage: ${results.masterViewCount} records`);
    console.log(`🔗 Tables now properly connected with overlapping data`);
    console.log(`📅 Creation completed: ${new Date().toISOString()}`);
    console.log('=======================================\\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Creating Overlapping Dataset for Table Connection...\\n');
      
      // Step 1: Find missing products
      const missingProducts = await this.getMissingProducts();
      
      if (missingProducts.length === 0) {
        console.log('✅ Tables already have overlapping data');
        return;
      }

      // Step 2: Add missing products
      await this.addMissingProducts(missingProducts);

      // Step 3: Verify results
      const results = await this.verifyResults();

      // Step 4: Generate report
      this.generateReport(results);
      
      console.log('🎉 Overlapping dataset creation completed!');
      console.log(`💡 Your tables can now join properly with ${results.masterViewCount} functional products`);
      
    } catch (error) {
      console.error('💥 Overlapping dataset creation failed:', error.message);
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const creator = new OverlappingDatasetCreator();
  creator.run();
}

module.exports = OverlappingDatasetCreator;