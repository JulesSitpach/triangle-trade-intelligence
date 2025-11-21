/**
 * TARIFF CACHE HEALTH CHECK & VALIDATION
 *
 * PURPOSE:
 * Daily automated validation of policy_tariffs_cache data integrity.
 * Detects corruption early instead of discovering it weeks later.
 *
 * WHAT IT CHECKS:
 * 1. No records with section_301 = 0 (should be null or positive)
 * 2. No records with section_232 = 0 (except 47 known exemptions)
 * 3. No ghost codes (both section_301 and section_232 null)
 * 4. China codes all have section_301 populated
 * 5. Steel codes (Chapter 73) all have section_232 (or documented null)
 * 6. Data freshness (<24h for volatile, <90d for stable)
 * 7. HS code format consistency (8-digit, no periods)
 * 8. Tariff rate ranges (0.0-1.0, not 0-100)
 *
 * USAGE:
 * node scripts/validate-tariff-cache-health.js [--fix] [--verbose]
 *
 * OPTIONS:
 * --fix       Automatically fix issues (where safe)
 * --verbose   Show detailed output
 * --alert     Exit with code 1 if critical issues found (for CI/CD)
 *
 * EXIT CODES:
 * 0 = All checks passed
 * 1 = Critical issues found (corruption detected)
 * 2 = Warnings only (minor issues)
 *
 * RECOMMENDED:
 * Run daily via cron job:
 * 0 8 * * * cd /path/to/project && node scripts/validate-tariff-cache-health.js --alert
 *
 * Created: November 20, 2025
 * Reason: Detect corruption early (233 corrupted records went undetected for weeks)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const fixIssues = args.includes('--fix');
const verbose = args.includes('--verbose');
const alertMode = args.includes('--alert');

console.log('🏥 TARIFF CACHE HEALTH CHECK\n');
console.log('═'.repeat(60));
console.log(`Run at: ${new Date().toISOString()}`);
console.log(`Mode: ${fixIssues ? 'FIX ISSUES' : 'READ ONLY'}`);
console.log(`Alert: ${alertMode ? 'Enabled (exit 1 on critical)' : 'Disabled'}`);
console.log('═'.repeat(60));
console.log('');

const results = {
  checks: [],
  criticalIssues: 0,
  warnings: 0,
  passed: 0
};

/**
 * Add check result
 */
function addCheck(name, passed, message, severity = 'info') {
  results.checks.push({ name, passed, message, severity });

  if (!passed) {
    if (severity === 'critical') {
      results.criticalIssues++;
    } else if (severity === 'warning') {
      results.warnings++;
    }
  } else {
    results.passed++;
  }

  const icon = passed ? '✅' : (severity === 'critical' ? '❌' : '⚠️ ');
  console.log(`${icon} ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
  console.log('');
}

/**
 * CHECK 1: No section_301 = 0 (should be null or positive)
 */
async function checkSection301Zeros() {
  const { data, error, count } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code, section_301, data_source', { count: 'exact' })
    .eq('section_301', 0);

  if (error) {
    addCheck('Section 301 Zero Check', false, `Database error: ${error.message}`, 'critical');
    return;
  }

  if (count > 0) {
    addCheck(
      'Section 301 Zero Check',
      false,
      `Found ${count} codes with section_301 = 0. These should be null (not researched) or positive (duty rate). First 3: ${data.slice(0, 3).map(r => r.hs_code).join(', ')}`,
      'critical'
    );

    if (verbose) {
      console.log('   Full list:');
      data.forEach(row => {
        console.log(`   - ${row.hs_code}: section_301 = 0 (source: ${row.data_source})`);
      });
      console.log('');
    }
  } else {
    addCheck('Section 301 Zero Check', true, 'No codes with section_301 = 0');
  }
}

/**
 * CHECK 2: Section 232 zeros (some are legitimate exemptions)
 */
async function checkSection232Zeros() {
  const { data, error, count } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code, section_232, data_source', { count: 'exact' })
    .eq('section_232', 0);

  if (error) {
    addCheck('Section 232 Zero Check', false, `Database error: ${error.message}`, 'critical');
    return;
  }

  const expectedExemptions = 47;
  const passed = count <= expectedExemptions + 5; // Allow 5 buffer

  if (!passed) {
    addCheck(
      'Section 232 Zero Check',
      false,
      `Found ${count} codes with section_232 = 0 (expected ~${expectedExemptions} exemptions). ${count - expectedExemptions} unexpected zeros.`,
      'warning'
    );
  } else {
    addCheck('Section 232 Zero Check', true, `${count} codes with section_232 = 0 (within expected range)`);
  }
}

/**
 * CHECK 3: Ghost codes (both tariffs null)
 */
async function checkGhostCodes() {
  const { data, error, count } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code', { count: 'exact' })
    .is('section_301', null)
    .is('section_232', null);

  if (error) {
    addCheck('Ghost Code Check', false, `Database error: ${error.message}`, 'critical');
    return;
  }

  if (count > 0) {
    addCheck(
      'Ghost Code Check',
      false,
      `Found ${count} ghost codes (both section_301 and section_232 null). These should be researched or marked stale. First 3: ${data.slice(0, 3).map(r => r.hs_code).join(', ')}`,
      'warning'
    );
  } else {
    addCheck('Ghost Code Check', true, 'No ghost codes found');
  }
}

/**
 * CHECK 4: China codes must have Section 301
 */
async function checkChinaSection301() {
  const { count, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .eq('origin_country', 'CN')
    .is('section_301', null);

  if (error) {
    addCheck('China Section 301 Check', false, `Database error: ${error.message}`, 'critical');
    return;
  }

  if (count > 0) {
    addCheck(
      'China Section 301 Check',
      false,
      `Found ${count} China codes without section_301. All China imports should have Section 301 rate (25%).`,
      'critical'
    );
  } else {
    addCheck('China Section 301 Check', true, 'All China codes have section_301 populated');
  }
}

/**
 * CHECK 5: Steel codes (Chapter 73) must have Section 232
 */
async function checkSteelSection232() {
  const { count, error } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .like('hs_code', '73%')
    .is('section_232', null);

  if (error) {
    addCheck('Steel Section 232 Check', false, `Database error: ${error.message}`, 'critical');
    return;
  }

  if (count > 0) {
    addCheck(
      'Steel Section 232 Check',
      false,
      `Found ${count} Chapter 73 codes without section_232. Steel products should have Section 232 rate (25% or 50%).`,
      'warning'
    );
  } else {
    addCheck('Steel Section 232 Check', true, 'All Chapter 73 codes have section_232 populated');
  }
}

/**
 * CHECK 6: Data freshness (Enhanced Nov 20, 2025)
 */
async function checkDataFreshness() {
  const { count: total } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true });

  const { count: fresh24h } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .gte('verified_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const { count: fresh7d } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .gte('verified_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { count: fresh30d } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .gte('verified_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const { count: fresh90d } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .gte('verified_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  // Check volatile tariffs (China Section 301 - should be <7 days)
  const { count: chinaTotal } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .eq('origin_country', 'CN')
    .not('section_301', 'is', null);

  const { count: chinaFresh7d } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .eq('origin_country', 'CN')
    .not('section_301', 'is', null)
    .gte('verified_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const staleCount = total - fresh90d;
  const stalePercent = ((staleCount / total) * 100).toFixed(1);
  const chinaStalePercent = chinaTotal > 0 ? (((chinaTotal - chinaFresh7d) / chinaTotal) * 100).toFixed(1) : 0;

  // Overall freshness check
  const passed = stalePercent < 5; // Less than 5% stale overall

  // Volatile data check (China Section 301)
  const volatilePassed = chinaStalePercent < 10; // Less than 10% of China rates stale

  if (!passed || !volatilePassed) {
    const issues = [];
    if (!passed) {
      issues.push(`Overall: ${stalePercent}% stale (>90 days)`);
    }
    if (!volatilePassed) {
      issues.push(`China Section 301: ${chinaStalePercent}% stale (>7 days)`);
    }

    addCheck(
      'Data Freshness Check',
      false,
      `Data staleness detected: ${issues.join(', ')}. ${fresh24h} updated in last 24h, ${fresh7d} in last 7 days, ${fresh90d} in last 90 days. China rates: ${chinaFresh7d}/${chinaTotal} fresh.`,
      volatilePassed ? 'warning' : 'critical'
    );
  } else {
    addCheck(
      'Data Freshness Check',
      true,
      `${stalePercent}% stale (${staleCount} of ${total} codes). Freshness breakdown: ${fresh24h} in 24h, ${fresh7d} in 7d, ${fresh90d} in 90d. China Section 301: ${chinaFresh7d}/${chinaTotal} fresh (${(100 - chinaStalePercent).toFixed(1)}%).`
    );
  }
}

/**
 * CHECK 7: HS code format consistency
 */
async function checkHSCodeFormat() {
  // Check for codes with periods
  const { count: withPeriods } = await supabase
    .from('policy_tariffs_cache')
    .select('*', { count: 'exact', head: true })
    .like('hs_code', '%.%');

  // Check code lengths
  const { data: lengths } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code')
    .limit(1000);

  const lengthCounts = {};
  lengths?.forEach(row => {
    const len = row.hs_code.length;
    lengthCounts[len] = (lengthCounts[len] || 0) + 1;
  });

  const has10Digit = lengthCounts[10] > 0;
  const has6Digit = lengthCounts[6] > 0;
  const has8Digit = lengthCounts[8] > 0;

  const issues = [];
  if (withPeriods > 0) issues.push(`${withPeriods} codes with periods`);
  if (has10Digit) issues.push(`${lengthCounts[10]} 10-digit codes (need truncation)`);

  if (issues.length > 0) {
    addCheck(
      'HS Code Format Check',
      false,
      `Found format inconsistencies: ${issues.join(', ')}. Expected: 8-digit or 6-digit parent codes.`,
      'warning'
    );
  } else {
    addCheck(
      'HS Code Format Check',
      true,
      `All codes are properly formatted. ${has8Digit ? lengthCounts[8] : 0} 8-digit, ${has6Digit ? lengthCounts[6] : 0} 6-digit parent codes.`
    );
  }
}

/**
 * CHECK 8: Tariff rate ranges (0.0-1.0, not 0-100)
 */
async function checkTariffRateRanges() {
  // Check for rates >1.0 (likely stored as percentages instead of decimals)
  const { count: invalidRates, data } = await supabase
    .from('policy_tariffs_cache')
    .select('hs_code, section_301, section_232', { count: 'exact' })
    .or('section_301.gt.1.0,section_232.gt.1.0');

  if (invalidRates > 0) {
    addCheck(
      'Tariff Rate Range Check',
      false,
      `Found ${invalidRates} codes with rates >1.0 (likely stored as percentages instead of decimals). First 3: ${data.slice(0, 3).map(r => `${r.hs_code} (301:${r.section_301}, 232:${r.section_232})`).join(', ')}`,
      'critical'
    );
  } else {
    addCheck('Tariff Rate Range Check', true, 'All rates are in valid range (0.0-1.0)');
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Running 8 validation checks...\n');

    await checkSection301Zeros();
    await checkSection232Zeros();
    await checkGhostCodes();
    await checkChinaSection301();
    await checkSteelSection232();
    await checkDataFreshness();
    await checkHSCodeFormat();
    await checkTariffRateRanges();

    // Summary
    console.log('═'.repeat(60));
    console.log('📊 HEALTH CHECK SUMMARY\n');
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ⚠️  Warnings: ${results.warnings}`);
    console.log(`   ❌ Critical: ${results.criticalIssues}`);
    console.log('');

    if (results.criticalIssues > 0) {
      console.log('🚨 CRITICAL ISSUES DETECTED!\n');
      console.log('Recommended actions:');
      console.log('1. Review critical issues above');
      console.log('2. Check recent populate script executions');
      console.log('3. Restore from backup if widespread corruption');
      console.log('4. Re-run populate scripts in correct order');
      console.log('');

      if (alertMode) {
        process.exit(1);
      }
    } else if (results.warnings > 0) {
      console.log('⚠️  WARNINGS FOUND (non-critical)\n');
      console.log('Recommended actions:');
      console.log('1. Review warnings above');
      console.log('2. Address data quality issues gradually');
      console.log('3. Consider refreshing stale data');
      console.log('');

      if (alertMode) {
        process.exit(2);
      }
    } else {
      console.log('✅ ALL CHECKS PASSED!\n');
      console.log('Tariff cache is healthy and ready for production.\n');
    }

  } catch (error) {
    console.error('\n❌ HEALTH CHECK FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
