/**
 * Import Mexican Tariff Data from Excel File
 *
 * This script imports LIGIE tariff data from a manually downloaded
 * Excel file from SNICE (National Foreign Trade Information Service)
 *
 * Download file from:
 * https://www.snice.gob.mx/cs/avi/snice/ligie.info22.html
 *
 * Run with: node scripts/import-mexico-excel.js <path-to-excel-file>
 *
 * Expected Excel columns:
 * - Fracción (HS code)
 * - Descripción (Description)
 * - IGI General / Arancel General (MFN rate)
 * - T-MEC / TLCAN (USMCA rate)
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ExcelImporter {
  constructor(filePath) {
    this.filePath = filePath;
    this.stats = {
      total: 0,
      success: 0,
      skipped: 0,
      errors: 0
    };
  }

  /**
   * Parse Excel file
   */
  parseExcelFile() {
    console.log(`📂 Reading Excel file: ${this.filePath}`);

    try {
      const workbook = XLSX.readFile(this.filePath);
      const sheetName = workbook.SheetNames[0]; // First sheet
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log(`✅ Parsed ${data.length} rows from sheet "${sheetName}"\n`);

      return data;
    } catch (error) {
      throw new Error(`Failed to read Excel file: ${error.message}`);
    }
  }

  /**
   * Normalize HS code (remove periods, spaces, ensure 8 digits)
   */
  normalizeHSCode(code) {
    if (!code) return null;

    let normalized = String(code)
      .replace(/\./g, '')
      .replace(/\s/g, '')
      .trim();

    // Pad to 8 digits if needed
    if (normalized.length < 8) {
      normalized = normalized.padEnd(8, '0');
    }

    return normalized.substring(0, 8);
  }

  /**
   * Parse rate from various formats
   */
  parseRate(value) {
    if (value === null || value === undefined || value === '') return null;

    // Already a number
    if (typeof value === 'number') return value;

    const str = String(value).trim();

    // "Ex" or "Exento" = 0%
    if (/^ex$/i.test(str) || /exento|free/i.test(str)) return 0;

    // Extract percentage: "5.5%", "5.5 %", "5.5"
    const match = str.match(/(\d+\.?\d*)\s*%?/);
    if (match) return parseFloat(match[1]);

    return null;
  }

  /**
   * Map Excel row to database schema
   */
  mapRowToTariff(row) {
    // Try various common column names (Spanish/English variations)
    const hsCode = this.normalizeHSCode(
      row['Fracción'] ||
      row['Fraccion'] ||
      row['HS Code'] ||
      row['Código'] ||
      row['Codigo']
    );

    if (!hsCode) {
      return null; // Skip rows without HS code
    }

    const description = (
      row['Descripción'] ||
      row['Descripcion'] ||
      row['Description'] ||
      ''
    ).toString().substring(0, 500); // Truncate

    const mfnRate = this.parseRate(
      row['IGI General'] ||
      row['Arancel General'] ||
      row['MFN Rate'] ||
      row['General Rate']
    );

    const usmcaRate = this.parseRate(
      row['T-MEC'] ||
      row['TMEC'] ||
      row['TLCAN'] ||
      row['USMCA'] ||
      row['NAFTA']
    ) || 0; // Default 0 for USMCA

    return {
      hs_code: hsCode,
      description: description,
      mfn_rate: mfnRate,
      usmca_rate: usmcaRate,
      effective_date: '2025-01-01', // Current schedule
      source: 'SNICE',
      source_url: 'https://www.snice.gob.mx/cs/avi/snice/ligie.info22.html'
    };
  }

  /**
   * Import tariffs to database
   */
  async importToDatabase(tariffs) {
    console.log(`\n💾 Importing ${tariffs.length} tariff rates to database...`);

    const batchSize = 100;

    for (let i = 0; i < tariffs.length; i += batchSize) {
      const batch = tariffs.slice(i, i + batchSize);

      try {
        const { error } = await supabase
          .from('tariff_rates_mexico')
          .upsert(batch, {
            onConflict: 'hs_code,effective_date'
          });

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        this.stats.success += batch.length;

        // Progress indicator
        if ((i + batchSize) % 500 === 0) {
          console.log(`   Imported ${i + batchSize}/${tariffs.length}...`);
        }

      } catch (error) {
        console.error(`❌ Batch ${i}-${i + batch.length} failed:`, error.message);
        this.stats.errors += batch.length;
      }
    }
  }

  /**
   * Main import process
   */
  async import() {
    console.log('🇲🇽 Mexico Tariff Excel Import');
    console.log('=' .repeat(70));

    try {
      // Parse Excel
      const rows = this.parseExcelFile();
      this.stats.total = rows.length;

      // Map to tariff objects
      console.log('🔄 Mapping rows to tariff structure...');
      const tariffs = [];

      for (const row of rows) {
        const tariff = this.mapRowToTariff(row);

        if (!tariff) {
          this.stats.skipped++;
          continue;
        }

        tariffs.push(tariff);
      }

      console.log(`✅ Mapped ${tariffs.length} valid tariff rates`);
      console.log(`⚠️  Skipped ${this.stats.skipped} invalid rows\n`);

      // Preview first 3
      console.log('📋 Preview (first 3 tariffs):');
      for (let i = 0; i < Math.min(3, tariffs.length); i++) {
        console.log(`   ${i + 1}. ${tariffs[i].hs_code}: ${tariffs[i].description.substring(0, 50)}`);
        console.log(`      MFN: ${tariffs[i].mfn_rate}%, USMCA: ${tariffs[i].usmca_rate}%`);
      }

      // Confirm import
      console.log('\n❓ Ready to import. Press Ctrl+C to cancel, or wait 5s to continue...');
      await this.sleep(5000);

      // Import to database
      await this.importToDatabase(tariffs);

      // Final stats
      console.log('\n' + '='.repeat(70));
      console.log('✅ Import Complete!');
      console.log('='.repeat(70));
      console.log(`Total rows: ${this.stats.total}`);
      console.log(`✅ Imported: ${this.stats.success}`);
      console.log(`⚠️  Skipped: ${this.stats.skipped}`);
      console.log(`❌ Errors: ${this.stats.errors}`);
      console.log('='.repeat(70));

    } catch (error) {
      console.error('\n💥 Import failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Excel file path required');
    console.error('\nUsage: node scripts/import-mexico-excel.js <path-to-excel-file>');
    console.error('\nExample:');
    console.error('  node scripts/import-mexico-excel.js ./downloads/LIGIE-2025.xlsx');
    process.exit(1);
  }

  const filePath = args[0];
  const importer = new ExcelImporter(filePath);

  importer.import()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Import failed:', error.message);
      process.exit(1);
    });
}

module.exports = { ExcelImporter };
