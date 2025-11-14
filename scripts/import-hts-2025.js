/**
 * Import 2025 HTS Revision 25 into Database
 *
 * DATA SOURCE: https://hts.usitc.gov/current
 * Download: "Full Revision" Excel or CSV file
 *
 * USAGE:
 * 1. Download HTS file to: scripts/data/hts-2025-revision-25.csv
 * 2. Run: node scripts/import-hts-2025.js
 * 3. Verify: Check hts_official_2025 table in Supabase
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse HTS CSV file format
 *
 * Expected columns (from USITC download):
 * - HTS Number
 * - Indent
 * - Description
 * - Unit of Quantity
 * - General Rate (MFN)
 * - Special Rate (includes USMCA: "CA", "MX")
 * - Column 2 Rate
 */
function parseHTSFile(filePath) {
  console.log(`📄 Reading HTS file: ${filePath}`);

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Parse CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`✅ Parsed ${records.length} HTS records`);

  // Transform to database format
  const htsData = records
    .filter(record => {
      // Filter out header rows and non-tariff entries
      const htsNumber = record['HTS Number'] || record['hts_number'] || '';
      return htsNumber && /^\d{4}\.\d{2}/.test(htsNumber); // Valid HTS format: 1234.56.78
    })
    .map(record => {
      const htsNumber = (record['HTS Number'] || record['hts_number'] || '').trim();
      const description = (record['Description'] || record['description'] || '').trim();
      const unit = (record['Unit of Quantity'] || record['unit'] || '').trim();

      // Parse MFN rate (can be percentage or "Free")
      let generalRate = (record['General Rate of Duty'] || record['General'] || record['general_rate'] || '').trim();
      let mfnRate = 0;

      if (generalRate.toLowerCase() === 'free') {
        mfnRate = 0;
      } else {
        // Extract percentage: "2.5%", "2.5% ad val", "2.5 cents/kg", etc.
        const percentMatch = generalRate.match(/([\d.]+)%/);
        if (percentMatch) {
          mfnRate = parseFloat(percentMatch[1]);
        }
      }

      // Parse USMCA rate from Special column
      let usmcaRate = null;
      const specialRate = (record['Special'] || record['special_rate'] || '').trim();

      // Look for CA, MX, or Free in special rates
      if (specialRate.toLowerCase().includes('free') || specialRate.includes('CA') || specialRate.includes('MX')) {
        usmcaRate = 0;
      } else {
        // Try to extract percentage from special rate
        const specialMatch = specialRate.match(/([\d.]+)%/);
        if (specialMatch) {
          usmcaRate = parseFloat(specialMatch[1]);
        }
      }

      return {
        hts_code: htsNumber.replace(/\./g, ''), // Remove dots: 7326.90.85 → 7326.90.85
        hts_code_formatted: htsNumber,           // Keep dots for display
        description: description,
        unit_of_quantity: unit,
        general_rate_text: generalRate,          // Original text
        mfn_rate: mfnRate,                       // Parsed number
        special_rate_text: specialRate,          // Original text
        usmca_rate: usmcaRate,                   // Parsed USMCA rate (if applicable)
        revision: 'Revision 25',
        effective_date: '2025-01-01',
        source: 'USITC HTS 2025',
        imported_at: new Date().toISOString()
      };
    });

  console.log(`✅ Transformed ${htsData.length} valid HTS records`);

  return htsData;
}

/**
 * Create database table if it doesn't exist
 */
async function createHTSTable() {
  console.log('📋 Creating hts_official_2025 table if not exists...');

  // Note: This should be run as a Supabase migration, but including here for reference
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS hts_official_2025 (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      hts_code TEXT NOT NULL,                  -- Normalized: 7326.90.85 or 73269085
      hts_code_formatted TEXT,                 -- Display format: 7326.90.85
      description TEXT NOT NULL,
      unit_of_quantity TEXT,
      general_rate_text TEXT,                  -- Original rate text from USITC
      mfn_rate NUMERIC,                        -- Parsed MFN percentage
      special_rate_text TEXT,                  -- Original special rate text
      usmca_rate NUMERIC,                      -- Parsed USMCA rate (0 if Free)
      revision TEXT,                           -- "Revision 25"
      effective_date DATE,                     -- 2025-01-01
      source TEXT DEFAULT 'USITC HTS 2025',
      imported_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes for fast lookups
    CREATE INDEX IF NOT EXISTS idx_hts_2025_code ON hts_official_2025(hts_code);
    CREATE INDEX IF NOT EXISTS idx_hts_2025_formatted ON hts_official_2025(hts_code_formatted);
    CREATE INDEX IF NOT EXISTS idx_hts_2025_description ON hts_official_2025 USING gin(to_tsvector('english', description));
  `;

  console.log('⚠️ Run this SQL in Supabase SQL editor to create table:');
  console.log(createTableSQL);
}

/**
 * Import HTS data into Supabase
 */
async function importToDatabase(htsData) {
  console.log(`💾 Importing ${htsData.length} HTS records to database...`);

  // Delete existing data (fresh import)
  const { error: deleteError } = await supabase
    .from('hts_official_2025')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (deleteError && deleteError.code !== 'PGRST116') { // Ignore "not found" error
    console.error('⚠️ Warning: Could not clear existing data:', deleteError.message);
  } else {
    console.log('✅ Cleared existing HTS data');
  }

  // Import in batches of 1000 (Supabase limit)
  const batchSize = 1000;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < htsData.length; i += batchSize) {
    const batch = htsData.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('hts_official_2025')
      .insert(batch);

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      failed += batch.length;
    } else {
      imported += batch.length;
      console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} records (${imported}/${htsData.length})`);
    }
  }

  console.log('\n📊 IMPORT SUMMARY:');
  console.log(`  ✅ Successfully imported: ${imported} records`);
  console.log(`  ❌ Failed: ${failed} records`);
  console.log(`  📈 Success rate: ${((imported / htsData.length) * 100).toFixed(1)}%`);

  return { imported, failed };
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HTS 2025 Import Script Starting...\n');

  // Check if file exists
  const htsFilePath = path.join(process.cwd(), 'scripts', 'data', 'hts-2025-revision-25.csv');

  if (!fs.existsSync(htsFilePath)) {
    console.error('❌ ERROR: HTS file not found!');
    console.log('\n📥 DOWNLOAD INSTRUCTIONS:');
    console.log('1. Go to: https://hts.usitc.gov/current');
    console.log('2. Click "Download Full Revision"');
    console.log('3. Select CSV or Excel format');
    console.log('4. Save to: scripts/data/hts-2025-revision-25.csv');
    console.log('5. Run this script again');
    process.exit(1);
  }

  try {
    // Step 1: Show table creation SQL
    await createHTSTable();

    // Step 2: Parse HTS file
    const htsData = parseHTSFile(htsFilePath);

    if (htsData.length === 0) {
      console.error('❌ No valid HTS data found in file!');
      process.exit(1);
    }

    // Step 3: Show sample data
    console.log('\n📋 SAMPLE RECORDS:');
    console.log(JSON.stringify(htsData.slice(0, 3), null, 2));

    // Step 4: Import to database
    const { imported, failed } = await importToDatabase(htsData);

    // Step 5: Verify import
    const { count, error } = await supabase
      .from('hts_official_2025')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Verification failed:', error.message);
    } else {
      console.log(`\n✅ VERIFICATION: ${count} records in database`);
    }

    console.log('\n🎉 Import complete!');
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Update lib/utils/usitc-hts-api.js to query hts_official_2025 table');
    console.log('2. Test with real HTS codes');
    console.log('3. Monitor console for "🏛️ USITC Official: [code] = [rate]%"');

  } catch (error) {
    console.error('❌ Import failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
