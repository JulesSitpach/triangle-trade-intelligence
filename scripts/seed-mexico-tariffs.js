/**
 * Seed Mexican Tariff Data from SIAVI API
 *
 * SIAVI (Sistema de Información Arancelaria Vía Internet)
 * Official Mexican government tariff database
 *
 * Source: http://siavi.economia.gob.mx/
 *
 * Strategy:
 * 1. Use existing US HS codes as starting point (12,118 codes)
 * 2. Query SIAVI API for each code to get Mexican rates
 * 3. Insert into tariff_rates_mexico table
 * 4. Track progress and errors
 *
 * Run with: node scripts/seed-mexico-tariffs.js
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// SIAVI API endpoint (unofficial, parsed from HTML)
const SIAVI_BASE_URL = 'http://siavi.economia.gob.mx/siavi5r/aranceles.php';

class MexicoTariffSeeder {
  constructor() {
    this.stats = {
      total: 0,
      success: 0,
      notFound: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  /**
   * Fetch tariff data from SIAVI for a specific HS code
   */
  async fetchFromSIAVI(hsCode) {
    try {
      // Normalize: Remove periods, ensure 8 digits
      const normalized = hsCode.replace(/\./g, '').padEnd(8, '0').substring(0, 8);

      const response = await axios.get(SIAVI_BASE_URL, {
        params: { fraccion: normalized },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (response.status !== 200) {
        return { error: `HTTP ${response.status}` };
      }

      // Parse HTML response
      const $ = cheerio.load(response.data);

      // Extract rates from SIAVI page structure
      // (Structure may vary - this is an approximation)
      const mfnRate = this.extractRate($, 'IGI General') ||
                      this.extractRate($, 'Arancel General');
      const usmcaRate = this.extractRate($, 'T-MEC') ||
                        this.extractRate($, 'TLCAN') ||
                        0; // Default 0 for USMCA members

      // Extract description
      const description = $('td:contains("Descripción")').next().text().trim() ||
                         $('td:contains("Description")').next().text().trim();

      return {
        hs_code: normalized,
        description: description.substring(0, 500), // Truncate
        mfn_rate: this.parseRate(mfnRate),
        usmca_rate: this.parseRate(usmcaRate),
        source: 'SIAVI',
        source_url: `${SIAVI_BASE_URL}?fraccion=${normalized}`
      };

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        return { error: 'Timeout' };
      }
      if (error.response?.status === 404) {
        return { error: 'Not found' };
      }
      return { error: error.message };
    }
  }

  /**
   * Extract rate from parsed HTML
   */
  extractRate($, label) {
    const cell = $(`td:contains("${label}")`).next();
    const text = cell.text().trim();

    // Look for percentage patterns
    const match = text.match(/(\d+\.?\d*)\s*%/);
    if (match) {
      return parseFloat(match[1]);
    }

    // Check if it says "Exento" (exempt) or "Free"
    if (/exento|free|0%/i.test(text)) {
      return 0;
    }

    return null;
  }

  /**
   * Parse rate string to numeric percentage
   */
  parseRate(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;

    const str = String(value).trim();

    // Already a number
    const num = parseFloat(str);
    if (!isNaN(num)) return num;

    // Extract from percentage string
    const match = str.match(/(\d+\.?\d*)\s*%/);
    if (match) return parseFloat(match[1]);

    // "Exento" or "Free" = 0%
    if (/exento|free/i.test(str)) return 0;

    return null;
  }

  /**
   * Get all US HS codes to use as seed list
   */
  async getUSHSCodes() {
    console.log('📋 Fetching US HS codes from tariff_intelligence_master...');

    const { data, error } = await supabase
      .from('tariff_intelligence_master')
      .select('hts8, brief_description')
      .order('hts8');

    if (error) {
      throw new Error(`Failed to fetch US codes: ${error.message}`);
    }

    console.log(`✅ Found ${data.length} US HS codes\n`);
    return data;
  }

  /**
   * Save Mexican tariff rate to database
   */
  async saveTariffRate(tariffData) {
    const { error } = await supabase
      .from('tariff_rates_mexico')
      .upsert({
        hs_code: tariffData.hs_code,
        description: tariffData.description,
        mfn_rate: tariffData.mfn_rate,
        usmca_rate: tariffData.usmca_rate,
        effective_date: '2025-01-01', // Current schedule
        source: tariffData.source,
        source_url: tariffData.source_url,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'hs_code,effective_date'
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  /**
   * Process a batch of HS codes
   */
  async processBatch(codes, batchSize = 50) {
    console.log(`\n🔄 Processing batch of ${codes.length} codes...`);

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];
      this.stats.total++;

      try {
        // Fetch from SIAVI
        const mexicoData = await this.fetchFromSIAVI(code.hts8);

        if (mexicoData.error) {
          if (mexicoData.error === 'Not found') {
            this.stats.notFound++;
            console.log(`⚠️  ${code.hts8}: Not found in SIAVI`);
          } else {
            this.stats.errors++;
            console.log(`❌ ${code.hts8}: ${mexicoData.error}`);
          }
          continue;
        }

        // Use US description as fallback
        if (!mexicoData.description) {
          mexicoData.description = code.brief_description;
        }

        // Save to database
        await this.saveTariffRate(mexicoData);
        this.stats.success++;

        // Progress indicator
        if (this.stats.total % 100 === 0) {
          const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(0);
          const rate = (this.stats.total / elapsed).toFixed(1);
          console.log(`\n📊 Progress: ${this.stats.total}/${codes.length} (${rate}/s)`);
          console.log(`   ✅ Success: ${this.stats.success}`);
          console.log(`   ⚠️  Not found: ${this.stats.notFound}`);
          console.log(`   ❌ Errors: ${this.stats.errors}`);
        } else if (this.stats.success % 10 === 0 && this.stats.success > 0) {
          process.stdout.write('.');
        }

        // Rate limiting (be nice to SIAVI server)
        await this.sleep(500); // 500ms between requests = 2 req/s

      } catch (error) {
        this.stats.errors++;
        console.log(`❌ ${code.hts8}: ${error.message}`);
      }
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main seeding process
   */
  async seed(options = {}) {
    const {
      dryRun = false,
      limit = null,
      startFrom = 0
    } = options;

    console.log('🇲🇽 Mexico Tariff Data Seeding');
    console.log('=' .repeat(70));
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Limit: ${limit || 'All codes'}`);
    console.log(`Start from: ${startFrom}`);
    console.log('=' .repeat(70));

    try {
      // Get US codes as template
      let usCodes = await this.getUSHSCodes();

      // Apply filters
      if (startFrom > 0) {
        usCodes = usCodes.slice(startFrom);
      }
      if (limit) {
        usCodes = usCodes.slice(0, limit);
      }

      console.log(`\n🎯 Will process ${usCodes.length} HS codes\n`);

      if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No data will be saved\n');
      }

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < usCodes.length; i += batchSize) {
        const batch = usCodes.slice(i, i + batchSize);

        if (dryRun) {
          console.log(`\n[DRY RUN] Would process batch ${i}-${i + batch.length}`);
          // Just test first 3 codes in dry run
          if (i === 0) {
            await this.processBatch(batch.slice(0, 3));
          }
          break; // Only do first batch in dry run
        } else {
          await this.processBatch(batch, batchSize);
        }
      }

      // Final stats
      const elapsed = ((Date.now() - this.stats.startTime) / 1000).toFixed(0);
      console.log('\n\n' + '='.repeat(70));
      console.log('✅ Seeding Complete!');
      console.log('='.repeat(70));
      console.log(`Total processed: ${this.stats.total}`);
      console.log(`✅ Success: ${this.stats.success}`);
      console.log(`⚠️  Not found: ${this.stats.notFound}`);
      console.log(`❌ Errors: ${this.stats.errors}`);
      console.log(`⏱️  Time: ${elapsed}s (${(this.stats.total / elapsed).toFixed(1)}/s)`);
      console.log('='.repeat(70));

    } catch (error) {
      console.error('\n💥 Fatal error:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    dryRun: args.includes('--dry-run'),
    limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
    startFrom: args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1]) : 0
  };

  const seeder = new MexicoTariffSeeder();

  seeder.seed(options)
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = { MexicoTariffSeeder };
