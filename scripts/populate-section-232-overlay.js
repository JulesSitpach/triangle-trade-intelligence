/**
 * POPULATE SECTION 232 OVERLAY
 *
 * Updates policy_tariffs_cache with current Section 232 tariff rates (steel/aluminum)
 *
 * STRATEGY:
 * 1. Get all Chapter 72, 73, 76 codes from tariff_intelligence_master
 * 2. Research Section 232 rates using section-232-research-agent.js
 * 3. Upsert to policy_tariffs_cache (update existing, insert new)
 * 4. Mark stale entries as refreshed
 *
 * USAGE:
 * node scripts/populate-section-232-overlay.js --chapter=72 --origin-country=CN
 * node scripts/populate-section-232-overlay.js --chapter=73 --origin-country=CN
 * node scripts/populate-section-232-overlay.js --chapter=76 --origin-country=CN
 *
 * OPTIONS:
 * --chapter=72          Target specific chapter (72=steel, 73=steel articles, 76=aluminum)
 * --origin-country=CN   Origin country code (CN, DE, JP, etc.)
 * --limit=100           Process only first N codes (for testing)
 * --refresh-stale       Only refresh stale entries (faster)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { section232Agent } from '../lib/agents/section-232-research-agent.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const chapter = args.find(arg => arg.startsWith('--chapter='))?.split('=')[1];
const originCountry = args.find(arg => arg.startsWith('--origin-country='))?.split('=')[1];
const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || null;
const refreshStaleOnly = args.includes('--refresh-stale');

// Validation
if (!chapter) {
  console.error('❌ ERROR: --chapter parameter is required');
  console.log('   Usage: node scripts/populate-section-232-overlay.js --chapter=72 --origin-country=CN');
  console.log('   Valid chapters: 72 (steel), 73 (steel articles), 76 (aluminum)');
  process.exit(1);
}

if (!['72', '73', '76'].includes(chapter)) {
  console.error(`❌ ERROR: Invalid chapter ${chapter}. Section 232 only applies to chapters 72, 73, 76`);
  process.exit(1);
}

if (!originCountry) {
  console.error('❌ ERROR: --origin-country parameter is required');
  console.log('   Example: --origin-country=CN (for China)');
  console.log('   Common codes: CN (China), DE (Germany), JP (Japan), KR (South Korea), CA (Canada), MX (Mexico)');
  console.log('   Note: Section 232 applies to ALL countries (50% rate). Only US-smelted aluminum/steel is exempt.');
  process.exit(1);
}

console.log('🚀 SECTION 232 OVERLAY POPULATION\n');
console.log(`📊 Configuration:`);
console.log(`   Target Chapter: ${chapter} (${getChapterName(chapter)})`);
console.log(`   Origin Country: ${originCountry}`);
console.log(`   Limit: ${limit || 'All codes'}`);
console.log(`   Refresh Stale Only: ${refreshStaleOnly ? 'Yes' : 'No'}\n`);

// WARNING about Section 232 rates (applies to ALL countries, no USMCA exemption)
if (['CA', 'MX', 'US', 'Canada', 'Mexico', 'United States'].includes(originCountry)) {
  console.log(`⚠️  IMPORTANT: ${originCountry} is NOT EXEMPT from Section 232`);
  console.log(`   USMCA countries pay 50% Section 232 tariff (NO exemption)`);
  console.log(`   Only US-smelted aluminum or US-melted steel is exempt\n`);
}

function getChapterName(ch) {
  const names = {
    '72': 'Iron and steel',
    '73': 'Articles of iron or steel',
    '76': 'Aluminum and articles thereof'
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
 * Get existing cache entries for merging
 * We need to preserve existing Section 301 data when updating Section 232
 */
async function getExistingCacheEntries(htsCodes) {
  const { data, error } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code, section_301, data_source')
    .in('hs_code', htsCodes);

  if (error) {
    console.error('⚠️  Warning: Failed to fetch existing cache entries:', error.message);
    return {};
  }

  // Map by hs_code for easy lookup
  const cacheMap = {};
  data.forEach(row => {
    cacheMap[row.hs_code] = row;
  });

  return cacheMap;
}

/**
 * Upsert Section 232 data to policy_tariffs_cache
 * PRESERVES existing Section 301 data (doesn't overwrite)
 */
async function upsertSection232Data(records) {
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

    // Step 2: Get existing cache entries (to preserve Section 301 data)
    console.log('📋 STEP 2: Fetching existing cache entries...');
    const existingCache = await getExistingCacheEntries(htsCodes);
    console.log(`✅ Found ${Object.keys(existingCache).length} existing cache entries\n`);

    // Step 3: Research Section 232 rates
    console.log('🔍 STEP 3: Researching Section 232 rates...');
    console.log(`   Origin Country: ${originCountry}\n`);

    const results = [];
    let processed = 0;

    for (const code of htsCodes) {
      processed++;
      const progress = ((processed / htsCodes.length) * 100).toFixed(1);

      process.stdout.write(`  [${processed}/${htsCodes.length}] ${progress}% - ${code}... `);

      try {
        const result = await section232Agent.researchRate(code, {
          originCountry
        });

        console.log(`✅ ${(result.section_232 * 100).toFixed(1)}% (${result.confidence})`);

        // Get existing Section 301 data (preserve it)
        const existing = existingCache[code] || {};
        // ✅ FIXED Nov 20, 2025: Use null instead of 0 (null = needs research, 0 = confirmed duty-free)
        const existingSection301 = existing.section_301 !== undefined ? existing.section_301 : null;

        // Merge Section 232 with existing Section 301
        results.push({
          hs_code: code,
          section_301: existingSection301, // PRESERVE existing Section 301
          section_232: result.section_232,
          verified_date: result.verified_date,
          expires_at: result.expires_at,
          data_source: `${existing.data_source || ''} | ${result.data_source}`.trim().replace(/^\| /, ''),
          is_stale: result.is_stale,
          stale_reason: result.stale_reason,
          aluminum_source: result.aluminum_source, // NEW: Track aluminum source for exemption
          exemption_notes: result.exemption_notes, // NEW: Exemption guidance
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      } catch (error) {
        console.log(`❌ FAILED - ${error.message}`);
      }
    }

    // Step 4: Upsert to database
    const { success, failed } = await upsertSection232Data(results);

    // Step 5: Summary
    console.log(`\n🎉 SECTION 232 OVERLAY COMPLETE!\n`);
    console.log(`📊 FINAL SUMMARY:`);
    console.log(`   Researched: ${results.length} codes`);
    console.log(`   Saved to database: ${success} codes`);
    console.log(`   Failed: ${failed} codes`);

    // Sample data
    const sample = results.slice(0, 5);
    console.log(`\n📋 SAMPLE DATA:`);
    sample.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.hs_code} → Section 232: ${(row.section_232 * 100).toFixed(1)}% | Section 301: ${(row.section_301 * 100).toFixed(1)}%`);
    });

    // Summary by rate
    const rateCounts = {};
    results.forEach(row => {
      const rate = (row.section_232 * 100).toFixed(1);
      rateCounts[rate] = (rateCounts[rate] || 0) + 1;
    });

    console.log(`\n📊 SECTION 232 RATE DISTRIBUTION:`);
    Object.keys(rateCounts).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(rate => {
      console.log(`   ${rate}%: ${rateCounts[rate]} codes`);
    });

  } catch (error) {
    console.error('\n❌ OVERLAY POPULATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
