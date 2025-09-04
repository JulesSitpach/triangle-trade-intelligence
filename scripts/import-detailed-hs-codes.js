#!/usr/bin/env node

/**
 * Detailed HS Code Import Pipeline
 * Downloads comprehensive 6+ digit HS product codes from UN Comtrade API
 * Replaces chapter-level descriptions with tradeable product classifications
 * 
 * Source: UN Comtrade API (comprehensive global HS nomenclature)
 * Target: Replace existing comtrade_reference with detailed product codes
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Configuration
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  comtrade: {
    apiKey: process.env.COMTRADE_API_KEY || process.env.UN_COMTRADE_KEY,
    baseUrl: 'https://comtradeapi.un.org/data/v1/get',
    // Get all commodities at maximum detail (6+ digits)
    query: 'C/A/HS?fmt=json&max=50000&head=H'
  },
  processing: {
    batchSize: 1000,
    maxRetries: 3,
    delayBetweenRequests: 1000
  }
};

class DetailedHSCodeImporter {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.key);
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    this.hsCodesMap = new Map();
  }

  /**
   * Fetch comprehensive HS codes from UN Comtrade API
   */
  async fetchComtradeData() {
    console.log('🌐 Fetching comprehensive HS codes from UN Comtrade API...');
    
    const apiUrl = `${config.comtrade.baseUrl}/${config.comtrade.query}`;
    console.log('API URL:', apiUrl);

    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'Ocp-Apim-Subscription-Key': config.comtrade.apiKey,
          'User-Agent': 'Triangle-Intelligence-USMCA-Platform/1.0'
        }
      };

      https.get(apiUrl, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const jsonData = JSON.parse(data);
              console.log(`✅ Received ${jsonData.data?.length || 0} HS codes from UN Comtrade`);
              resolve(jsonData.data || []);
            } catch (error) {
              reject(new Error(`JSON parsing failed: ${error.message}`));
            }
          } else {
            reject(new Error(`API request failed: ${response.statusCode}`));
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Process and validate HS code data
   */
  processHSCodes(rawData) {
    console.log('📊 Processing HS code data for detailed product classifications...');
    
    const processedCodes = [];
    let skippedChapterLevel = 0;
    
    for (const item of rawData) {
      try {
        // Extract HS code and description
        const hsCode = item.CommodityCode || item.cmdCode;
        const description = item.CommodityDescription || item.cmdDescE;
        
        if (!hsCode || !description) {
          continue;
        }

        // Clean HS code (remove dots, spaces)
        const cleanHSCode = hsCode.toString().replace(/[^\d]/g, '');
        
        // Only include 6+ digit codes (actual tradeable products)
        if (cleanHSCode.length >= 6) {
          // Determine product category from chapter (first 2 digits)
          const chapter = parseInt(cleanHSCode.substring(0, 2));
          const productCategory = this.getProductCategoryFromChapter(chapter);
          
          processedCodes.push({
            hs_code: cleanHSCode,
            product_description: this.cleanDescription(description),
            usmca_eligible: this.assessUSMCAEligibility(cleanHSCode),
            product_category: productCategory,
            chapter: chapter,
            mfn_tariff_rate: null, // Will be populated from tariff_rates table
            usmca_tariff_rate: null // Will be populated from tariff_rates table
          });
        } else {
          skippedChapterLevel++;
        }
        
      } catch (error) {
        console.warn('⚠️ Failed to process HS code:', error.message);
        this.errorCount++;
      }
    }
    
    console.log(`✅ Processed ${processedCodes.length} detailed product codes`);
    console.log(`📋 Skipped ${skippedChapterLevel} chapter-level codes (too general)`);
    
    return processedCodes;
  }

  /**
   * Map chapter numbers to product categories
   */
  getProductCategoryFromChapter(chapter) {
    const categoryMap = {
      1: 'Live Animals',
      2: 'Meat & Fish',
      3: 'Fish & Seafood',
      4: 'Dairy Products',
      5: 'Animal Products',
      6: 'Live Trees & Plants',
      7: 'Vegetables',
      8: 'Fruits & Nuts',
      9: 'Coffee, Tea & Spices',
      10: 'Cereals',
      11: 'Flour & Starch',
      12: 'Oil Seeds & Plants',
      13: 'Vegetable Extracts',
      14: 'Vegetable Materials',
      15: 'Animal & Vegetable Fats',
      16: 'Prepared Meat & Fish',
      17: 'Sugars',
      18: 'Cocoa & Chocolate',
      19: 'Prepared Cereals',
      20: 'Prepared Vegetables',
      21: 'Miscellaneous Food',
      22: 'Beverages & Spirits',
      23: 'Food Waste & Animal Feed',
      24: 'Tobacco',
      25: 'Salt, Stone & Earth',
      26: 'Ores & Metals',
      27: 'Mineral Fuels',
      28: 'Inorganic Chemicals',
      29: 'Organic Chemicals',
      30: 'Pharmaceutical Products',
      31: 'Fertilizers',
      32: 'Paints & Varnishes',
      33: 'Essential Oils & Cosmetics',
      34: 'Soap & Cleaning Products',
      35: 'Protein Substances',
      36: 'Explosives',
      37: 'Photographic Supplies',
      38: 'Miscellaneous Chemical',
      39: 'Plastics',
      40: 'Rubber',
      41: 'Raw Hides & Skins',
      42: 'Leather Articles',
      43: 'Furskins',
      44: 'Wood Articles',
      45: 'Cork Articles',
      46: 'Basketwork',
      47: 'Pulp & Paper Materials',
      48: 'Paper & Paperboard',
      49: 'Printed Books & Newspapers',
      50: 'Silk',
      51: 'Wool & Animal Hair',
      52: 'Cotton',
      53: 'Vegetable Textile Fibers',
      54: 'Man-made Filaments',
      55: 'Man-made Staple Fibers',
      56: 'Wadding & Felt',
      57: 'Carpets',
      58: 'Special Woven Fabrics',
      59: 'Impregnated Textiles',
      60: 'Knitted Fabrics',
      61: 'Knitted Apparel',
      62: 'Woven Apparel',
      63: 'Textile Articles',
      64: 'Footwear',
      65: 'Headgear',
      66: 'Umbrellas & Walking Sticks',
      67: 'Feathers & Down',
      68: 'Stone & Ceramic Products',
      69: 'Ceramic Products',
      70: 'Glass & Glassware',
      71: 'Pearls & Precious Stones',
      72: 'Iron & Steel',
      73: 'Iron & Steel Articles',
      74: 'Copper Articles',
      75: 'Nickel Articles',
      76: 'Aluminum Articles',
      78: 'Lead Articles',
      79: 'Zinc Articles',
      80: 'Tin Articles',
      81: 'Base Metal Articles',
      82: 'Tools & Cutlery',
      83: 'Miscellaneous Base Metal',
      84: 'Machinery & Mechanical',
      85: 'Electronics & Electrical',
      86: 'Railway Equipment',
      87: 'Automotive',
      88: 'Aircraft',
      89: 'Ships & Boats',
      90: 'Optical & Medical Instruments',
      91: 'Clocks & Watches',
      92: 'Musical Instruments',
      93: 'Arms & Ammunition',
      94: 'Furniture',
      95: 'Toys & Sports Equipment',
      96: 'Miscellaneous Manufactured',
      97: 'Works of Art'
    };

    return categoryMap[chapter] || 'Other Products';
  }

  /**
   * Assess USMCA eligibility based on HS code
   */
  assessUSMCAEligibility(hsCode) {
    // Most products are eligible for USMCA if they meet origin requirements
    // Exceptions are rare and usually related to specific trade restrictions
    const chapter = parseInt(hsCode.substring(0, 2));
    
    // Generally eligible chapters (most products)
    const generallyEligible = [
      39, 40, 42, 44, 48, 49, // Plastics, rubber, leather, wood, paper
      61, 62, 63, 64, // Textiles and apparel
      72, 73, 76, 84, 85, 87, // Metals, machinery, automotive
      90, 94, 95 // Instruments, furniture, toys
    ];
    
    return generallyEligible.includes(chapter);
  }

  /**
   * Clean and standardize product descriptions
   */
  cleanDescription(description) {
    return description
      .replace(/^[0-9\s\-]+/, '') // Remove leading codes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .replace(/;$/, '') // Remove trailing semicolon
      .substring(0, 500); // Limit length
  }

  /**
   * Replace comtrade_reference table with detailed HS codes
   */
  async replaceComtradeReference(processedCodes) {
    console.log('🔄 Replacing comtrade_reference with detailed product codes...');
    
    try {
      // Backup existing table (optional - create backup)
      console.log('📋 Creating backup of existing comtrade_reference...');
      const { error: backupError } = await this.supabase.rpc('backup_comtrade_reference');
      
      if (backupError) {
        console.warn('⚠️ Backup creation failed (continuing anyway):', backupError.message);
      }

      // Clear existing table
      console.log('🗑️ Clearing existing comtrade_reference table...');
      const { error: deleteError } = await this.supabase
        .from('comtrade_reference')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) {
        throw new Error(`Failed to clear table: ${deleteError.message}`);
      }

      // Insert new detailed codes in batches
      console.log(`📥 Inserting ${processedCodes.length} detailed HS codes...`);
      const batchSize = config.processing.batchSize;
      let insertedCount = 0;

      for (let i = 0; i < processedCodes.length; i += batchSize) {
        const batch = processedCodes.slice(i, i + batchSize);
        
        const { data, error } = await this.supabase
          .from('comtrade_reference')
          .insert(batch);

        if (error) {
          console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error);
          this.errorCount += batch.length;
        } else {
          insertedCount += batch.length;
          this.processedCount += batch.length;
          console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(processedCodes.length / batchSize)}`);
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ Successfully replaced comtrade_reference with ${insertedCount} detailed product codes`);
      return insertedCount;

    } catch (error) {
      throw new Error(`Failed to replace comtrade_reference: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    
    console.log('\n📊 DETAILED HS CODE IMPORT REPORT');
    console.log('==================================');
    console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Successfully processed: ${this.processedCount} records`);
    console.log(`❌ Errors encountered: ${this.errorCount} records`);
    console.log(`📈 Success rate: ${((this.processedCount / (this.processedCount + this.errorCount)) * 100).toFixed(1)}%`);
    console.log(`🎯 Data source: UN Comtrade API (6+ digit product codes only)`);
    console.log(`📅 Import completed: ${new Date().toISOString()}`);
    console.log(`🔧 Next step: Run tariff rate matching to populate pricing data`);
    console.log('==================================\n');
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting Detailed HS Code Import Pipeline...\n');
      
      // Validate API key
      if (!config.comtrade.apiKey) {
        throw new Error('UN Comtrade API key not found. Please set COMTRADE_API_KEY or UN_COMTRADE_KEY in .env.local');
      }

      // Step 1: Fetch comprehensive HS codes from UN Comtrade
      const rawData = await this.fetchComtradeData();
      
      if (!rawData || rawData.length === 0) {
        throw new Error('No HS code data received from UN Comtrade API');
      }

      // Step 2: Process and validate the data
      const processedCodes = this.processHSCodes(rawData);
      
      if (processedCodes.length === 0) {
        throw new Error('No valid detailed HS codes found after processing');
      }

      // Step 3: Replace existing comtrade_reference with detailed codes
      await this.replaceComtradeReference(processedCodes);

      // Step 4: Generate report
      this.generateReport();
      
      console.log('🎉 Detailed HS code import completed successfully!');
      console.log('💡 Your classification system now has comprehensive 6+ digit product codes');
      console.log('🔗 Next: Run tariff rate matching to connect with your existing tariff data');
      
    } catch (error) {
      console.error('💥 Detailed HS code import failed:', error.message);
      console.error('🔍 Check your UN Comtrade API key and network connection');
      process.exit(1);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const importer = new DetailedHSCodeImporter();
  importer.run();
}

module.exports = DetailedHSCodeImporter;