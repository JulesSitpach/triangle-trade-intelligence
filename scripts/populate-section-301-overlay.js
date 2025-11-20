/**
 * POPULATE SECTION 301 OVERLAY
 *
 * Updates policy_tariffs_cache with current Section 301 tariff rates
 *
 * STRATEGY:
 * 1. Get all Chapter 85 codes from tariff_intelligence_master (738 codes)
 * 2. Research Section 301 rates using section-301-research-agent.js
 * 3. Upsert to policy_tariffs_cache (update existing, insert new)
 * 4. Mark stale entries as refreshed
 *
 * USAGE:
 * node scripts/populate-section-301-overlay.js [--chapter=85] [--limit=100] [--force-ai]
 *
 * OPTIONS:
 * --chapter=85     Target specific chapter (default: 85 for electronics)
 * --limit=100      Process only first N codes (for testing)
 * --force-ai       Force AI research instead of using known rates
 * --refresh-stale  Only refresh stale entries (faster)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { section301Agent } from '../lib/agents/section-301-research-agent.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const chapter = args.find(arg => arg.startsWith('--chapter='))?.split('=')[1] || '85';
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || null;
const forceAI = args.includes('--force-ai');
const refreshStaleOnly = args.includes('--refresh-stale');

console.log('🚀 SECTION 301 OVERLAY POPULATION\n');
console.log(`📊 Configuration:`);
console.log(`   Target Chapter: ${chapter} (${getChapterName(chapter)})`);
console.log(`   Limit: ${limit || 'All codes'}`);
console.log(`   Force AI: ${forceAI ? 'Yes' : 'No (use known rates)'}`);
console.log(`   Refresh Stale Only: ${refreshStaleOnly ? 'Yes' : 'No'}\n`);

function getChapterName(ch) {
  const names = {
    '85': 'Electrical machinery and equipment',
    '84': 'Machinery',
    '73': 'Steel articles',
    '76': 'Aluminum articles',
    '94': 'Furniture'
  };
  return names[ch] || 'Unknown';
}

/**
 * Get HTS codes to process from tariff_intelligence_master
 */
async function getHTSCodesToProcess() {
  let query = supabase
    .from('tariff_intelligence_master')
    .select('hts8')
    .like('hts8', `${chapter}%`)
    .order('hts8');

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch HTS codes:', error.message);
    throw error;
  }

  return data.map(row => row.hts8);
}

/**
 * Get currently stale entries
 */
async function getStaleEntries() {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code')
    .eq('is_stale', true)
    .like('hs_code', `${chapter}%`);

  if (error) {
    console.error('❌ Failed to fetch stale entries:', error.message);
    return [];
  }

  return data.map(row => row.hs_code);
}

/**
 * Upsert Section 301 data to policy_tariffs_cache
 */
async function upsertSection301Data(records) {
  console.log(`\n💾 Upserting ${records.length} records to policy_tariffs_cache...`);

  const batchSize = 50;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);

    process.stdout.write(`  ⏳ Batch ${batchNum}/${totalBatches} (${batch.length} codes)... `);

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

  console.log(`\n📊 UPSERT SUMMARY:`);
  console.log(`  ✅ Successfully upserted: ${success} codes`);
  console.log(`  ❌ Failed: ${failed} codes`);
  console.log(`  📈 Success rate: ${((success / records.length) * 100).toFixed(1)}%`);

  return { success, failed };
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Get HTS codes to process
    let htsCodes;

    if (refreshStaleOnly) {
      console.log('📋 STEP 1: Fetching stale entries...');
      htsCodes = await getStaleEntries();
      console.log(`✅ Found ${htsCodes.length} stale entries\n`);
    } else {
      console.log('📋 STEP 1: Fetching HTS codes from tariff_intelligence_master...');
      htsCodes = await getHTSCodesToProcess();
      console.log(`✅ Found ${htsCodes.length} codes to process\n`);
    }

    if (htsCodes.length === 0) {
      console.log('✅ No codes to process. Exiting.');
      return;
    }

    // Step 2: Research Section 301 rates
    console.log('🔍 STEP 2: Researching Section 301 rates...');
    console.log(`   Using: ${forceAI ? 'AI research (slow)' : 'Known rates + AI fallback (fast)'}\n`);

    const results = [];
    let processed = 0;

    for (const code of htsCodes) {
      processed++;
      const progress = ((processed / htsCodes.length) * 100).toFixed(1);

      process.stdout.write(`  [${processed}/${htsCodes.length}] ${progress}% - ${code}... `);

      try {
        const result = await section301Agent.researchRate(code, {
          originCountry: 'CN',
          forceAI
        });

        console.log(`✅ ${(result.section_301 * 100).toFixed(1)}% (${result.confidence})`);

        results.push({
          hs_code: code,
          section_301: result.section_301,
          // ✅ FIXED Nov 20, 2025: Use null instead of 0 (null = needs research, 0 = confirmed duty-free)
          section_232: result.section_232 || null,
          verified_date: result.verified_date,
          expires_at: result.expires_at,
          data_source: result.data_source,
          is_stale: result.is_stale,
          stale_reason: result.stale_reason,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        // Rate limit for AI calls (1 per second)
        if (forceAI && processed < htsCodes.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
      }
    }

    // Step 3: Upsert to database
    const { success, failed } = await upsertSection301Data(results);

    // Step 4: Summary
    console.log(`\n🎉 SECTION 301 OVERLAY COMPLETE!\n`);
    console.log(`📊 FINAL SUMMARY:`);
    console.log(`   Researched: ${results.length} codes`);
    console.log(`   Saved to database: ${success} codes`);
    console.log(`   Failed: ${failed} codes`);

    // Sample data
    const sample = results.slice(0, 5);
    console.log(`\n📋 SAMPLE DATA:`);
    sample.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.hs_code} → ${(row.section_301 * 100).toFixed(1)}% (${row.data_source.substring(0, 40)}...)`);
    });

  } catch (error) {
    console.error('\n❌ OVERLAY POPULATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
