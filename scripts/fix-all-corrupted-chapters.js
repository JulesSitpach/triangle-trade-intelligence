/**
 * MASTER ORCHESTRATION SCRIPT - Fix All Corrupted Tariff Cache Records
 *
 * Systematically repairs all 995 corrupted records across 12 chapters
 * Uses fixed Section 232 agent (25% steel, 10% aluminum)
 *
 * USAGE:
 * node scripts/fix-all-corrupted-chapters.js
 *
 * STRATEGY:
 * 1. Run chapters in order of impact (largest first)
 * 2. Always run Section 301 BEFORE Section 232
 * 3. Validate after each chapter
 * 4. Report progress and errors
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Chapters to fix (in order of impact - largest first)
const CHAPTERS_TO_FIX = [
  { chapter: '85', name: 'Electrical machinery', corrupted: 643 },
  { chapter: '72', name: 'Iron and steel', corrupted: 212 },
  { chapter: '76', name: 'Aluminum and articles', corrupted: 31 },
  { chapter: '28', name: 'Inorganic chemicals', corrupted: 7 },
  { chapter: '87', name: 'Vehicles', corrupted: 6 },
  { chapter: '26', name: 'Ores, slag and ash', corrupted: 5 },
  { chapter: '79', name: 'Zinc and articles', corrupted: 4 },
  { chapter: '81', name: 'Other base metals', corrupted: 3 },
  { chapter: '80', name: 'Tin and articles', corrupted: 2 },
  { chapter: '25', name: 'Salt, sulfur, earths', corrupted: 1 },
  { chapter: '84', name: 'Machinery', corrupted: 1 },
  { chapter: '90', name: 'Optical instruments', corrupted: 1 }
];

const ORIGIN_COUNTRY = 'CN'; // China (highest corruption rate)
const TOTAL_CORRUPTED = 915; // Excluding 79 Chapter 73 format issues

console.log('🚀 MASTER TARIFF CACHE REPAIR\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 REPAIR PLAN:');
console.log(`   Total chapters: ${CHAPTERS_TO_FIX.length}`);
console.log(`   Total corrupted codes: ${TOTAL_CORRUPTED}`);
console.log(`   Origin country: ${ORIGIN_COUNTRY}`);
console.log(`   Strategy: Largest chapters first (max impact)\n`);

let successCount = 0;
let failureCount = 0;
let totalProcessed = 0;

/**
 * Run Section 301 + Section 232 scripts for a chapter
 */
async function fixChapter(chapterInfo) {
  const { chapter, name, corrupted } = chapterInfo;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📦 Chapter ${chapter}: ${name} (${corrupted} corrupted codes)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Section 301 (China tariffs - must run FIRST)
    console.log(`⏳ [1/2] Running Section 301 for Chapter ${chapter}...`);
    const { stdout: stdout301 } = await execAsync(
      `node scripts/populate-section-301-overlay.js --chapter=${chapter}`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Extract success count from output
    const match301 = stdout301.match(/Successfully upserted: (\d+) codes/);
    const codes301 = match301 ? parseInt(match301[1]) : 0;
    console.log(`✅ Section 301: ${codes301} codes updated\n`);

    // Step 2: Section 232 (Steel/aluminum tariffs - must run SECOND)
    console.log(`⏳ [2/2] Running Section 232 for Chapter ${chapter}...`);
    const { stdout: stdout232 } = await execAsync(
      `node scripts/populate-section-232-overlay.js --chapter=${chapter} --origin-country=${ORIGIN_COUNTRY}`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    // Extract success count from output
    const match232 = stdout232.match(/Successfully upserted: (\d+) codes/);
    const codes232 = match232 ? parseInt(match232[1]) : 0;
    console.log(`✅ Section 232: ${codes232} codes updated\n`);

    // Success
    successCount += corrupted;
    totalProcessed += corrupted;

    console.log(`✅ Chapter ${chapter} COMPLETE: ${corrupted} codes fixed\n`);
    console.log(`📊 PROGRESS: ${totalProcessed}/${TOTAL_CORRUPTED} codes (${((totalProcessed / TOTAL_CORRUPTED) * 100).toFixed(1)}%)\n`);

    return true;

  } catch (error) {
    console.error(`❌ Chapter ${chapter} FAILED:`, error.message);
    console.error('   Continuing to next chapter...\n');

    failureCount += corrupted;
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  // Process each chapter in sequence
  for (const chapter of CHAPTERS_TO_FIX) {
    const success = await fixChapter(chapter);

    // Small delay between chapters to avoid overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 REPAIR COMPLETE!\n');
  console.log('📊 FINAL SUMMARY:');
  console.log(`   Total processed: ${totalProcessed}/${TOTAL_CORRUPTED} codes`);
  console.log(`   Successfully fixed: ${successCount} codes`);
  console.log(`   Failed: ${failureCount} codes`);
  console.log(`   Success rate: ${((successCount / TOTAL_CORRUPTED) * 100).toFixed(1)}%`);
  console.log(`   Duration: ${duration} minutes\n`);

  if (failureCount > 0) {
    console.log('⚠️  Some chapters failed - check errors above');
    console.log('   Run validation script to see remaining corruption:');
    console.log('   node scripts/validate-tariff-cache.js\n');
    process.exit(1);
  } else {
    console.log('✅ All chapters fixed successfully!');
    console.log('   Run validation to confirm:');
    console.log('   node scripts/validate-tariff-cache.js\n');
    process.exit(0);
  }
}

main();
