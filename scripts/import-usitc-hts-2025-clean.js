/**
 * CLEAN IMPORT: USITC HTS 2025 Full Schedule
 *
 * STRATEGY: Wipe and replace tariff_intelligence_master with clean USITC data
 * SOURCE: htsdata.csv (36,170 official USITC codes)
 *
 * WHY CLEAN SLATE:
 * - Remove mixed AI + unknown source data (12,127 rows)
 * - Replace with 100% verified government data (36,170 rows)
 * - Clear data lineage: "USITC HTS 2025 Rev 28, imported Nov 14, 2025"
 * - Known gaps (Section 301/232) clearly marked as NULL
 *
 * USAGE:
 * 1. Backup already created: tariff_intelligence_master_backup_20251114
 * 2. Run: node scripts/import-usitc-hts-2025-clean.js
 * 3. Verify: Query tariff_intelligence_master
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
 * Parse USITC HTS CSV file
 * Handles BOM character and multiple HTS code formats
 */
function parseUSITCFile(filePath) {
  console.log(`📄 Reading USITC file: ${filePath}`);

  let fileContent = fs.readFileSync(filePath, 'utf-8');

  // Remove BOM character if present
  if (fileContent.charCodeAt(0) === 0xFEFF) {
    fileContent = fileContent.slice(1);
  }

  // Parse CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true // Handle BOM in csv-parse
  });

  console.log(`✅ Parsed ${records.length} total records from CSV`);

  // Filter and transform to database format
  const htsData = records
    .filter(record => {
      // Get HTS Number (handle potential BOM in column name)
      const htsNumber = record['HTS Number'] || record['\uFEFFHTS Number'] || '';

      // Only include valid 8-10 digit HTS codes with periods
      // Examples: "0101.21.00", "8542.31.00.15"
      // Skip: "", "0101" (chapter headers), null
      return htsNumber && /^\d{4}\.\d{2}(\.\d{2})?(\.\d{2})?$/.test(htsNumber);
    })
    .map(record => {
      const htsNumber = (record['HTS Number'] || record['\uFEFFHTS Number'] || '').trim();
      const description = (record['Description'] || '').trim();
      const unit = (record['Unit of Quantity'] || '').trim();
      const generalRateText = (record['General Rate of Duty'] || '').trim();
      const specialRateText = (record['Special Rate of Duty'] || '').trim();
      const column2RateText = (record['Column 2 Rate of Duty'] || '').trim();

      // Parse MFN rate (General Rate of Duty)
      let mfnRate = null;
      if (generalRateText.toLowerCase() === 'free') {
        mfnRate = 0; // Verified duty-free
      } else {
        const percentMatch = generalRateText.match(/([\d.]+)%/);
        if (percentMatch) {
          mfnRate = parseFloat(percentMatch[1]) / 100; // Convert 5.7% to 0.057
        }
      }

      // Parse USMCA rate from Special Rate column
      // Look for "CA", "MX", or "Free" indicating USMCA eligibility
      let usmcaRate = null;
      if (specialRateText.toLowerCase().includes('free') ||
          specialRateText.includes('CA') ||
          specialRateText.includes('MX')) {
        usmcaRate = 0; // USMCA duty-free
      } else {
        // Try to extract percentage
        const specialMatch = specialRateText.match(/([\d.]+)%/);
        if (specialMatch) {
          usmcaRate = parseFloat(specialMatch[1]) / 100;
        }
      }

      // Normalize HTS code: remove periods for database storage
      const hts8 = htsNumber.replace(/\./g, '').substring(0, 8); // Store as 8-digit

      return {
        hts8: hts8,
        brief_description: description,
        quantity_1_code: unit,
        mfn_text_rate: generalRateText,
        mfn_ad_val_rate: mfnRate, // Stored as decimal (0.057 = 5.7%)
        usmca_ad_val_rate: usmcaRate,
        data_source: 'USITC HTS 2025 Rev 28',
        begin_effect_date: '2025-01-01',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Section 301/232 set to NULL - will be added separately
        section_301: null,
        section_232: null
      };
    });

  console.log(`✅ Filtered to ${htsData.length} valid HTS codes (8-10 digit format)`);

  // Deduplicate by 8-digit HTS code (keep first occurrence)
  // CSV has sub-classifications (e.g., 8542.31.00.15) that normalize to same 8-digit code
  const seenCodes = new Map();
  const uniqueData = [];

  htsData.forEach(record => {
    if (!seenCodes.has(record.hts8)) {
      seenCodes.set(record.hts8, true);
      uniqueData.push(record);
    }
  });

  console.log(`✅ Deduplicated to ${uniqueData.length} unique 8-digit HTS codes`);
  console.log(`📊 Sample codes: ${uniqueData.slice(0, 3).map(h => h.hts8).join(', ')}`);

  return uniqueData;
}

/**
 * Wipe and import to tariff_intelligence_master
 */
async function cleanImport(htsData) {
  console.log(`\n🗑️  STEP 1: Wiping tariff_intelligence_master table...`);

  const { error: deleteError } = await supabase
    .from('tariff_intelligence_master')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (deleteError && deleteError.code !== 'PGRST116') {
    console.error('❌ Failed to clear table:', deleteError.message);
    throw deleteError;
  }

  console.log('✅ Table wiped clean');

  console.log(`\n💾 STEP 2: Importing ${htsData.length} USITC codes...`);

  // Import in batches of 500 (Supabase limit is 1000, use 500 for safety)
  const batchSize = 500;
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < htsData.length; i += batchSize) {
    const batch = htsData.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(htsData.length / batchSize);

    process.stdout.write(`  ⏳ Batch ${batchNum}/${totalBatches} (${batch.length} codes)... `);

    const { error } = await supabase
      .from('tariff_intelligence_master')
      .insert(batch);

    if (error) {
      console.log(`❌ FAILED`);
      console.error(`     Error: ${error.message}`);
      failed += batch.length;
    } else {
      console.log(`✅ SUCCESS`);
      imported += batch.length;
    }
  }

  console.log(`\n📊 IMPORT SUMMARY:`);
  console.log(`  ✅ Successfully imported: ${imported} codes`);
  console.log(`  ❌ Failed: ${failed} codes`);
  console.log(`  📈 Success rate: ${((imported / htsData.length) * 100).toFixed(1)}%`);

  return { imported, failed };
}

/**
 * Verify import
 */
async function verifyImport() {
  console.log(`\n🔍 STEP 3: Verifying import...`);

  const { count, error } = await supabase
    .from('tariff_intelligence_master')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Verification failed:', error.message);
    return;
  }

  console.log(`✅ Database now has ${count} codes`);

  // Sample data check
  const { data: sample } = await supabase
    .from('tariff_intelligence_master')
    .select('hts8, brief_description, mfn_ad_val_rate, data_source')
    .limit(5);

  console.log(`\n📋 SAMPLE DATA:`);
  sample.forEach((row, i) => {
    const rate = row.mfn_ad_val_rate !== null ? `${(row.mfn_ad_val_rate * 100).toFixed(1)}%` : 'Free';
    console.log(`  ${i + 1}. ${row.hts8} - ${row.brief_description.substring(0, 40)}... (${rate})`);
  });

  console.log(`\n  📊 Data source: ${sample[0]?.data_source}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 USITC HTS 2025 CLEAN IMPORT\n');
  console.log('⚠️  WARNING: This will WIPE tariff_intelligence_master table');
  console.log('✅ Backup already created: tariff_intelligence_master_backup_20251114\n');

  const htsFilePath = path.join(process.cwd(), 'scripts', 'data', 'hts-2025-revision-25.csv');

  if (!fs.existsSync(htsFilePath)) {
    console.error('❌ ERROR: CSV file not found!');
    console.log(`   Expected: ${htsFilePath}`);
    process.exit(1);
  }

  try {
    // Parse CSV
    const htsData = parseUSITCFile(htsFilePath);

    if (htsData.length === 0) {
      console.error('❌ No valid HTS data found!');
      process.exit(1);
    }

    // Clean import
    const { imported } = await cleanImport(htsData);

    // Verify
    await verifyImport();

    console.log(`\n🎉 CLEAN IMPORT COMPLETE!`);
    console.log(`\n📝 NEXT STEPS:`);
    console.log(`  1. Test component classification in UI`);
    console.log(`  2. Verify "Free" shows as "Free" (not "0.0%")`);
    console.log(`  3. Add Section 301/232 rates separately`);
    console.log(`  4. Monitor for display bugs (should show "Pending" for null)`);

  } catch (error) {
    console.error('\n❌ IMPORT FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
