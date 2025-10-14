/**
 * HTS 2025 Data Import Script
 * Imports official USITC tariff data into Supabase
 *
 * Usage: node database/migrations/import-hts-data.js
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BATCH_SIZE = 500; // Import in batches to avoid memory issues
const CSV_FILE = path.join(process.cwd(), 'tariff_database_2025.txt');

/**
 * Parse and normalize HTS data row
 */
function normalizeHTSRow(row) {
  return {
    hts8: row.hts8,
    brief_description: row.brief_description || null,

    // MFN Rates
    mfn_text_rate: row.mfn_text_rate || null,
    mfn_rate_type_code: row.mfn_rate_type_code || null,
    mfn_ave: row.mfn_ave || null,
    mfn_ad_val_rate: parseFloat(row.mfn_ad_val_rate) || 0,
    mfn_specific_rate: parseFloat(row.mfn_specific_rate) || 0,
    mfn_other_rate: parseFloat(row.mfn_other_rate) || 0,

    // USMCA Rates
    usmca_indicator: row.usmca_indicator || null,
    usmca_rate_type_code: row.usmca_rate_type_code || null,
    usmca_ad_val_rate: parseFloat(row.usmca_ad_val_rate) || 0,
    usmca_specific_rate: parseFloat(row.usmca_specific_rate) || 0,
    usmca_other_rate: parseFloat(row.usmca_other_rate) || 0,

    // Mexico Rates
    nafta_mexico_ind: row.nafta_mexico_ind || null,
    mexico_rate_type_code: row.mexico_rate_type_code || null,
    mexico_ad_val_rate: parseFloat(row.mexico_ad_val_rate) || 0,
    mexico_specific_rate: parseFloat(row.mexico_specific_rate) || 0,

    // Canada Rates
    nafta_canada_ind: row.nafta_canada_ind || null,

    // Effective Dates
    begin_effect_date: row.begin_effect_date || null,
    end_effective_date: row.end_effective_date || null,

    // Classification Info
    quantity_1_code: row.quantity_1_code || null,
    quantity_2_code: row.quantity_2_code || null,
    wto_binding_code: row.wto_binding_code || null,

    // Special Program Indicators
    gsp_indicator: row.gsp_indicator || null,
    cbi_indicator: row.cbi_indicator || null,
    agoa_indicator: row.agoa_indicator || null,
    israel_fta_indicator: row.israel_fta_indicator || null,
    jordan_indicator: row.jordan_indicator || null,
    singapore_indicator: row.singapore_indicator || null,
    chile_indicator: row.chile_indicator || null,
    australia_indicator: row.australia_indicator || null,
    korea_indicator: row.korea_indicator || null,
    colombia_indicator: row.colombia_indicator || null,
    panama_indicator: row.panama_indicator || null,
    peru_indicator: row.peru_indicator || null,

    // Administrative
    footnote_comment: row.footnote_comment || null,
    additional_duty: row.additional_duty || null,

    // Metadata
    data_source: 'USITC HTS 2025'
  };
}

/**
 * Import HTS data in batches
 */
async function importHTSData() {
  console.log('🚀 Starting HTS 2025 data import...\n');

  // Read CSV file
  console.log(`📂 Reading file: ${CSV_FILE}`);
  const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');

  // Parse CSV
  console.log('📊 Parsing CSV data...');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`✅ Parsed ${records.length} HTS codes\n`);

  // Process in batches
  let imported = 0;
  let failed = 0;
  const batches = Math.ceil(records.length / BATCH_SIZE);

  for (let i = 0; i < batches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, records.length);
    const batch = records.slice(start, end);

    console.log(`📦 Importing batch ${i + 1}/${batches} (${start + 1}-${end} of ${records.length})...`);

    // Normalize batch data
    const normalizedBatch = batch.map(normalizeHTSRow);

    // Insert batch
    const { data, error } = await supabase
      .from('hts_tariff_rates_2025')
      .upsert(normalizedBatch, {
        onConflict: 'hts8',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`❌ Error importing batch ${i + 1}:`, error.message);
      failed += batch.length;
    } else {
      imported += batch.length;
      console.log(`✅ Batch ${i + 1} imported successfully`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Import Complete!\n');
  console.log(`✅ Successfully imported: ${imported} HTS codes`);
  if (failed > 0) {
    console.log(`❌ Failed to import: ${failed} HTS codes`);
  }
  console.log('='.repeat(60));

  // Verify some key codes
  console.log('\n🔍 Verifying sample HTS codes...\n');

  const sampleCodes = ['32089000', '39091000', '38151200', '32061100'];

  for (const code of sampleCodes) {
    const { data, error } = await supabase
      .from('hts_tariff_rates_2025')
      .select('hts8, brief_description, mfn_ad_val_rate, usmca_ad_val_rate')
      .eq('hts8', code)
      .single();

    if (data) {
      const savings = ((data.mfn_ad_val_rate - data.usmca_ad_val_rate) * 100).toFixed(1);
      console.log(`✅ ${data.hts8}: ${data.brief_description?.substring(0, 50)}...`);
      console.log(`   MFN: ${(data.mfn_ad_val_rate * 100).toFixed(1)}% | USMCA: ${(data.usmca_ad_val_rate * 100).toFixed(1)}% | Savings: ${savings}%\n`);
    } else {
      console.log(`❌ ${code}: Not found (${error?.message || 'unknown error'})\n`);
    }
  }
}

// Run import
console.log('\n' + '='.repeat(60));
console.log('🇺🇸 USITC HTS 2025 Tariff Data Import');
console.log('Triangle Trade Intelligence Platform');
console.log('='.repeat(60) + '\n');

importHTSData()
  .then(() => {
    console.log('\n✅ Import process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import process failed:', error);
    process.exit(1);
  });
