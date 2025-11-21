/**
 * MASTER TARIFF OVERLAY ORCHESTRATION SCRIPT
 *
 * PURPOSE:
 * Prevents data corruption by enforcing correct execution order of populate scripts.
 * The November 20, 2025 incident (233 corrupted records) was caused by running
 * Section 232 script BEFORE Section 301, causing section_301 to default to 0.
 *
 * CRITICAL EXECUTION ORDER:
 * 1. Section 301 (China electronics) - MUST run FIRST
 * 2. Section 232 (Steel/aluminum) - MUST run SECOND (preserves Section 301 data)
 * 3. Future overlays (Section 201, IEEPA, etc.) - Run after above
 *
 * USAGE:
 * node scripts/sync-all-tariff-overlays.js [--chapter=85] [--dry-run]
 *
 * OPTIONS:
 * --chapter=85    Target specific chapter (default: all relevant chapters)
 * --dry-run       Preview what would run without executing
 * --verbose       Show detailed progress
 *
 * SAFETY FEATURES:
 * - Pre-execution validation (checks database connectivity)
 * - Baseline metrics snapshot (record state before changes)
 * - Step-by-step validation (verify each script succeeded)
 * - Rollback instructions (if corruption detected)
 * - Post-execution health check (verify data integrity)
 *
 * Created: November 20, 2025
 * Reason: Prevent recurrence of Chapter 73 corruption incident
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const targetChapter = args.find(arg => arg.startsWith('--chapter='))?.split('=')[1];
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

console.log('🎯 MASTER TARIFF OVERLAY ORCHESTRATION\n');
console.log('═'.repeat(60));
console.log('Purpose: Enforce correct script execution order');
console.log('Why: Prevent data corruption from wrong sequence');
console.log('═'.repeat(60));
console.log('');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

/**
 * Execute a script as a child process
 */
function executeScript(scriptPath, scriptArgs = []) {
  return new Promise((resolve, reject) => {
    const scriptName = scriptPath.split('/').pop();
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶️  EXECUTING: ${scriptName}`);
    console.log(`   Arguments: ${scriptArgs.join(' ') || 'None'}`);
    console.log(`${'─'.repeat(60)}\n`);

    if (dryRun) {
      console.log(`   ✅ DRY RUN - Would execute: node ${scriptPath} ${scriptArgs.join(' ')}\n`);
      resolve({ code: 0, signal: null });
      return;
    }

    const child = spawn('node', [scriptPath, ...scriptArgs], {
      stdio: verbose ? 'inherit' : 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    if (!verbose) {
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code, signal) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} completed successfully\n`);
        resolve({ code, signal, stdout, stderr });
      } else {
        console.error(`\n❌ ${scriptName} FAILED with exit code ${code}\n`);
        if (!verbose && stderr) {
          console.error('Error output:');
          console.error(stderr);
        }
        reject(new Error(`Script failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`\n❌ Failed to start ${scriptName}:`, error.message);
      reject(error);
    });
  });
}

/**
 * Take baseline metrics snapshot before changes
 */
async function takeBaselineSnapshot() {
  console.log('📊 STEP 0: Taking baseline metrics snapshot...\n');

  try {
    // Count total records
    const { count: totalRecords, error: countError } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Count records with Section 301
    const { count: section301Count } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true })
      .not('section_301', 'is', null);

    // Count records with Section 232
    const { count: section232Count } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true })
      .not('section_232', 'is', null);

    // Count stale records
    const { count: staleCount } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_stale', true);

    const snapshot = {
      timestamp: new Date().toISOString(),
      totalRecords,
      section301Count,
      section232Count,
      staleCount
    };

    console.log('   📈 Baseline Metrics:');
    console.log(`      Total records: ${totalRecords}`);
    console.log(`      Section 301 populated: ${section301Count} (${((section301Count / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`      Section 232 populated: ${section232Count} (${((section232Count / totalRecords) * 100).toFixed(1)}%)`);
    console.log(`      Stale records: ${staleCount} (${((staleCount / totalRecords) * 100).toFixed(1)}%)`);
    console.log('');

    return snapshot;

  } catch (error) {
    console.error('   ❌ Failed to take baseline snapshot:', error.message);
    throw error;
  }
}

/**
 * Validate post-execution data integrity
 */
async function validateDataIntegrity(baseline) {
  console.log('\n📊 FINAL STEP: Validating data integrity...\n');

  try {
    // Count total records
    const { count: totalRecords } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true });

    // Count records with Section 301 = 0 (should be ZERO or documented)
    const { count: section301Zeros } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true })
      .eq('section_301', 0);

    // Count records with Section 232 = 0 (some are legitimate exemptions)
    const { count: section232Zeros } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true })
      .eq('section_232', 0);

    // Count records with both null (ghost codes)
    const { count: ghostCodes } = await supabase
      .from('policy_tariffs_cache')
      .select('*', { count: 'exact', head: true })
      .is('section_301', null)
      .is('section_232', null);

    console.log('   🔍 Data Integrity Report:');
    console.log(`      Total records: ${totalRecords} (baseline: ${baseline.totalRecords})`);
    console.log(`      Section 301 = 0: ${section301Zeros} ${section301Zeros > 0 ? '⚠️' : '✅'}`);
    console.log(`      Section 232 = 0: ${section232Zeros} ${section232Zeros > 47 ? '⚠️' : '✅'} (47 known exemptions OK)`);
    console.log(`      Ghost codes (both null): ${ghostCodes} ${ghostCodes > 0 ? '⚠️' : '✅'}`);
    console.log('');

    // Detect issues
    const issues = [];
    if (section301Zeros > 0) {
      issues.push(`Found ${section301Zeros} codes with section_301 = 0 (should be null or positive)`);
    }
    if (section232Zeros > 47) {
      issues.push(`Found ${section232Zeros} codes with section_232 = 0 (expected ~47 exemptions)`);
    }
    if (ghostCodes > 0) {
      issues.push(`Found ${ghostCodes} ghost codes with both section_301 and section_232 null`);
    }

    if (issues.length > 0) {
      console.log('   ⚠️  WARNINGS DETECTED:');
      issues.forEach((issue, i) => {
        console.log(`      ${i + 1}. ${issue}`);
      });
      console.log('');
      console.log('   📋 Recommended Actions:');
      console.log('      1. Review codes with section_301 = 0');
      console.log('      2. Verify exemptions for section_232 = 0');
      console.log('      3. Research ghost codes or mark as stale');
      console.log('');
    } else {
      console.log('   ✅ No data integrity issues detected!\n');
    }

    return { issues, totalRecords, section301Zeros, section232Zeros, ghostCodes };

  } catch (error) {
    console.error('   ❌ Failed to validate data integrity:', error.message);
    throw error;
  }
}

/**
 * Main orchestration logic
 */
async function main() {
  const startTime = Date.now();

  try {
    // Step 0: Baseline snapshot
    const baseline = await takeBaselineSnapshot();

    // STEP 1: Section 301 (Electronics - Chapter 85)
    console.log('═'.repeat(60));
    console.log('STEP 1: SECTION 301 OVERLAY (China Electronics)');
    console.log('═'.repeat(60));
    console.log('Why first: Creates baseline tariff structure');
    console.log('Impact: Populates section_301, sets section_232 = null');
    console.log('');

    if (targetChapter && targetChapter !== '85') {
      console.log(`   ⏭️  Skipping (target chapter: ${targetChapter})\n`);
    } else {
      await executeScript(
        join(__dirname, 'populate-section-301-overlay.js'),
        ['--chapter=85']
      );
    }

    // STEP 2: Section 232 (Steel/Aluminum - Chapters 72, 73, 76)
    console.log('═'.repeat(60));
    console.log('STEP 2: SECTION 232 OVERLAY (Steel/Aluminum)');
    console.log('═'.repeat(60));
    console.log('Why second: Preserves Section 301 data while adding Section 232');
    console.log('Impact: Adds section_232, PRESERVES existing section_301');
    console.log('');

    const steelChapters = ['72', '73', '76'];
    for (const chapter of steelChapters) {
      if (targetChapter && targetChapter !== chapter) {
        console.log(`   ⏭️  Skipping Chapter ${chapter} (target chapter: ${targetChapter})\n`);
        continue;
      }

      console.log(`\n📦 Processing Chapter ${chapter}...`);
      await executeScript(
        join(__dirname, 'populate-section-232-overlay.js'),
        [`--chapter=${chapter}`, '--origin-country=CN']
      );
    }

    // STEP 3: Future overlays (placeholder)
    console.log('\n═'.repeat(60));
    console.log('STEP 3: FUTURE OVERLAYS (Section 201, IEEPA, etc.)');
    console.log('═'.repeat(60));
    console.log('Status: Not implemented yet');
    console.log('When added: Run AFTER Section 301 and 232');
    console.log('');

    // Final validation
    const validation = await validateDataIntegrity(baseline);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('═'.repeat(60));
    console.log('🎉 MASTER ORCHESTRATION COMPLETE!');
    console.log('═'.repeat(60));
    console.log(`   Duration: ${duration}s`);
    console.log(`   Data integrity: ${validation.issues.length === 0 ? '✅ PASS' : '⚠️  WARNINGS'}`);
    console.log('');

    if (validation.issues.length > 0) {
      console.log('⚠️  Please review warnings above and take recommended actions.\n');
      process.exit(1);
    } else {
      console.log('✅ All tariff overlays synchronized successfully!\n');
    }

  } catch (error) {
    console.error('\n❌ ORCHESTRATION FAILED:', error.message);
    console.error(error.stack);
    console.log('\n📋 ROLLBACK INSTRUCTIONS:');
    console.log('   1. Check database backup from before this run');
    console.log('   2. Restore from backup if corruption detected');
    console.log('   3. Review error logs above');
    console.log('   4. Fix underlying issue before re-running');
    console.log('');
    process.exit(1);
  }
}

// Execute
main();
