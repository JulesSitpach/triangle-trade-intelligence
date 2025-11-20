/**
 * NORMALIZE ALL HS CODES TO HTS-8 FORMAT
 *
 * Fixes format inconsistency in policy_tariffs_cache:
 * - 6-digit codes (575): Append "00" → 8-digit
 * - 10-digit codes (365): Remove periods → 8-digit
 * - 8-digit codes (3,043): Already correct
 *
 * USITC HTS Standard: 8-digit codes, no periods
 * Example: "73269070" (NOT "732690" or "7326.90.70")
 *
 * USAGE:
 * node scripts/normalize-hs-codes-to-hts8.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 HS CODE NORMALIZATION TO HTS-8 STANDARD\n');

/**
 * Normalize any HS code format to 8-digit HTS-8
 */
function normalizeToHTS8(hsCode) {
  if (!hsCode) return null;

  // Remove periods, spaces, and dashes
  let normalized = hsCode.replace(/[.\s-]/g, '');

  // Pad with zeros to make 8 digits
  if (normalized.length < 8) {
    normalized = normalized.padEnd(8, '0');
  }

  // Truncate if longer than 8 digits (remove statistical suffix)
  if (normalized.length > 8) {
    normalized = normalized.substring(0, 8);
  }

  return normalized;
}

async function main() {
  try {
    // Step 1: Audit current state
    console.log('📊 STEP 1: Auditing current HS code formats...\n');

    const { data: audit } = await supabase.rpc('execute_sql', {
      query: `
        SELECT
          LENGTH(hs_code) as code_length,
          COUNT(*) as count,
          MIN(hs_code) as example_min,
          MAX(hs_code) as example_max
        FROM policy_tariffs_cache
        GROUP BY LENGTH(hs_code)
        ORDER BY code_length;
      `
    });

    if (!audit) {
      const { data: manualAudit, error } = await supabase
        .from('policy_tariffs_cache')
        .select('hs_code');

      if (error) throw error;

      const lengths = {};
      manualAudit.forEach(row => {
        const len = row.hs_code.length;
        lengths[len] = (lengths[len] || 0) + 1;
      });

      console.log('Current HS code formats:');
      Object.keys(lengths).sort().forEach(len => {
        console.log(`  ${len}-digit: ${lengths[len]} codes`);
      });
    }

    // Step 2: Get all records
    console.log('\n📋 STEP 2: Fetching all records...');

    const { data: allRecords, error: fetchError } = await supabase
      .from('policy_tariffs_cache')
      .select('*');

    if (fetchError) throw fetchError;

    console.log(`✅ Found ${allRecords.length} total records\n`);

    // Step 3: Normalize codes
    console.log('🔄 STEP 3: Normalizing HS codes to HTS-8 format...\n');

    const updates = [];
    const stats = {
      '6_to_8': 0,
      '10_to_8': 0,
      'already_8': 0,
      'other': 0
    };

    for (const record of allRecords) {
      const original = record.hs_code;
      const normalized = normalizeToHTS8(original);

      if (normalized !== original) {
        updates.push({
          ...record,
          hs_code: normalized,
          data_source: (record.data_source || '') + ` | HS code normalized from ${original} to ${normalized} (Nov 20, 2025)`,
          updated_at: new Date().toISOString()
        });

        // Track conversion type
        if (original.length === 6) {
          stats['6_to_8']++;
          if (stats['6_to_8'] <= 5) {
            console.log(`  6→8: ${original} → ${normalized}`);
          }
        } else if (original.length === 10) {
          stats['10_to_8']++;
          if (stats['10_to_8'] <= 5) {
            console.log(`  10→8: ${original} → ${normalized}`);
          }
        } else {
          stats['other']++;
          console.log(`  Other: ${original} (${original.length} chars) → ${normalized}`);
        }
      } else if (original.length === 8) {
        stats['already_8']++;
      }
    }

    console.log(`\n📊 NORMALIZATION SUMMARY:`);
    console.log(`  6-digit → 8-digit: ${stats['6_to_8']} codes`);
    console.log(`  10-digit → 8-digit: ${stats['10_to_8']} codes`);
    console.log(`  Already 8-digit: ${stats['already_8']} codes`);
    console.log(`  Other formats: ${stats['other']} codes`);
    console.log(`  Total updates needed: ${updates.length}\n`);

    if (updates.length === 0) {
      console.log('✅ All codes already in HTS-8 format. No updates needed.');
      return;
    }

    // Step 4: Update database
    console.log('💾 STEP 4: Updating database...\n');

    const batchSize = 100;
    let success = 0;
    let failed = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(updates.length / batchSize);

      process.stdout.write(`  ⏳ Batch ${batchNum}/${totalBatches} (${batch.length} codes)... `);

      // Delete old records first (to avoid unique constraint violations)
      const oldCodes = batch.map(r => r.hs_code.replace(/00$/, '').replace(/\./g, ''));
      await supabase
        .from('policy_tariffs_cache')
        .delete()
        .in('hs_code', oldCodes);

      // Insert normalized records
      const { error } = await supabase
        .from('policy_tariffs_cache')
        .upsert(batch, {
          onConflict: 'hs_code',
          ignoreDuplicates: false
        });

      if (error) {
        console.log(`❌ FAILED`);
        console.error(`     Error: ${error.message}`);
        failed += batch.length;
      } else {
        console.log(`✅ SUCCESS`);
        success += batch.length;
      }
    }

    console.log(`\n📊 UPDATE SUMMARY:`);
    console.log(`  ✅ Successfully updated: ${success} codes`);
    console.log(`  ❌ Failed: ${failed} codes`);
    console.log(`  📈 Success rate: ${((success / updates.length) * 100).toFixed(1)}%\n`);

    // Step 5: Verify
    console.log('🔍 STEP 5: Verifying normalization...\n');

    const { data: verifyAudit } = await supabase
      .from('policy_tariffs_cache')
      .select('hs_code');

    const verifyLengths = {};
    verifyAudit.forEach(row => {
      const len = row.hs_code.length;
      verifyLengths[len] = (verifyLengths[len] || 0) + 1;
    });

    console.log('After normalization:');
    Object.keys(verifyLengths).sort().forEach(len => {
      const count = verifyLengths[len];
      const status = len === '8' ? '✅' : '⚠️';
      console.log(`  ${status} ${len}-digit: ${count} codes`);
    });

    if (verifyLengths['8'] === allRecords.length) {
      console.log('\n🎉 SUCCESS! All HS codes normalized to HTS-8 format.\n');
    } else {
      console.log('\n⚠️ WARNING: Some codes still not in HTS-8 format. Review above.\n');
    }

  } catch (error) {
    console.error('\n❌ NORMALIZATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
