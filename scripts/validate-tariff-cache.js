/**
 * VALIDATE TARIFF CACHE - Database Integrity Check
 *
 * Checks for systematic corruption caused by default-to-zero pattern in populate scripts
 *
 * USAGE:
 * node scripts/validate-tariff-cache.js
 * node scripts/validate-tariff-cache.js --fix-scripts  (also checks script code)
 *
 * WHAT IT CHECKS:
 * 1. Database corruption (section_301 = 0 or section_232 = 0 when other is > 0)
 * 2. Script code patterns (|| 0 or : 0 defaults for tariff fields)
 * 3. Generates fix commands to repair corrupted data
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const args = process.argv.slice(2);
const checkScripts = args.includes('--fix-scripts');

console.log('🔍 TARIFF CACHE VALIDATION\n');
console.log(`📊 Checking:`);
console.log(`   ✅ Database corruption patterns`);
if (checkScripts) {
  console.log(`   ✅ Script code patterns (--fix-scripts enabled)`);
}
console.log('');

/**
 * Check database for corruption patterns
 */
async function checkDatabaseCorruption() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  DATABASE CORRUPTION CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const { data, error } = await supabase.rpc('exec', {
    query: `
      SELECT
        SUBSTRING(hs_code, 1, 2) as chapter,
        COUNT(*) as total_codes,
        SUM(CASE WHEN section_301 = 0 AND section_232 > 0 THEN 1 ELSE 0 END) as corrupted_301,
        SUM(CASE WHEN section_232 = 0 AND section_301 > 0 THEN 1 ELSE 0 END) as corrupted_232,
        SUM(CASE WHEN section_301 = 0 AND section_232 = 0 THEN 1 ELSE 0 END) as both_zero,
        SUM(CASE WHEN section_301 > 0 AND section_232 > 0 THEN 1 ELSE 0 END) as healthy
      FROM policy_tariffs_cache
      GROUP BY SUBSTRING(hs_code, 1, 2)
      ORDER BY chapter;
    `
  });

  if (error) {
    // Fallback to direct query if RPC doesn't work
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('policy_tariffs_cache')
      .select('hs_code, section_301, section_232');

    if (fallbackError) {
      console.error('❌ Failed to query database:', fallbackError.message);
      return null;
    }

    // Group by chapter manually
    const chapterStats = {};
    fallbackData.forEach(row => {
      const chapter = row.hs_code.substring(0, 2);
      if (!chapterStats[chapter]) {
        chapterStats[chapter] = {
          chapter,
          total_codes: 0,
          corrupted_301: 0,
          corrupted_232: 0,
          both_zero: 0,
          healthy: 0
        };
      }

      chapterStats[chapter].total_codes++;

      if (row.section_301 === 0 && row.section_232 > 0) {
        chapterStats[chapter].corrupted_301++;
      } else if (row.section_232 === 0 && row.section_301 > 0) {
        chapterStats[chapter].corrupted_232++;
      } else if (row.section_301 === 0 && row.section_232 === 0) {
        chapterStats[chapter].both_zero++;
      } else if (row.section_301 > 0 && row.section_232 > 0) {
        chapterStats[chapter].healthy++;
      }
    });

    return Object.values(chapterStats).sort((a, b) => a.chapter.localeCompare(b.chapter));
  }

  return data;
}

/**
 * Check script files for dangerous default-to-zero patterns
 */
function checkScriptPatterns() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  SCRIPT CODE PATTERN CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const scriptsDir = path.join(__dirname);
  const scripts = fs.readdirSync(scriptsDir).filter(f => f.startsWith('populate-') && f.endsWith('.js'));

  const violations = [];

  scripts.forEach(scriptFile => {
    const filePath = path.join(scriptsDir, scriptFile);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Pattern 1: existingSection301 = ... ? ... : 0;
    const ternaryPattern = /(existingSection\d+|section_\d+)\s*=\s*[^;]+\s*:\s*0\s*;/;

    // Pattern 2: section_232: result.section_232 || 0,
    const orPattern = /section_(301|232|tariff):\s*[^,]+\|\|\s*0\s*[,;]/;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      if (ternaryPattern.test(line) && line.includes('section_')) {
        violations.push({
          file: scriptFile,
          line: lineNum,
          code: line.trim(),
          type: 'Ternary default to 0',
          severity: '🔴 CRITICAL'
        });
      }

      if (orPattern.test(line)) {
        violations.push({
          file: scriptFile,
          line: lineNum,
          code: line.trim(),
          type: 'OR default to 0',
          severity: '🔴 CRITICAL'
        });
      }
    });
  });

  return violations;
}

/**
 * Generate fix commands
 */
function generateFixCommands(stats) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  RECOMMENDED FIX COMMANDS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const corruptedChapters = stats.filter(s => s.corrupted_301 > 0 || s.corrupted_232 > 0);

  if (corruptedChapters.length === 0) {
    console.log('✅ No corrupted data found. Database is healthy!\n');
    return [];
  }

  console.log('Run these commands IN ORDER to fix corrupted data:\n');

  const commands = [];

  corruptedChapters.forEach(stat => {
    const chapter = stat.chapter;
    const chapterName = getChapterName(chapter);

    console.log(`📦 Chapter ${chapter} (${chapterName}):`);
    console.log(`   Corrupted section_301: ${stat.corrupted_301} codes`);
    console.log(`   Corrupted section_232: ${stat.corrupted_232} codes`);
    console.log('');

    if (stat.corrupted_301 > 0 || stat.corrupted_232 > 0) {
      const cmd301 = `node scripts/populate-section-301-overlay.js --chapter=${chapter}`;
      const cmd232 = `node scripts/populate-section-232-overlay.js --chapter=${chapter} --origin-country=CN`;

      commands.push(cmd301, cmd232);

      console.log(`   1️⃣  ${cmd301}`);
      console.log(`   2️⃣  ${cmd232}`);
      console.log('');
    }
  });

  return commands;
}

/**
 * Get human-readable chapter name
 */
function getChapterName(chapter) {
  const names = {
    '72': 'Iron and steel',
    '73': 'Articles of iron or steel',
    '76': 'Aluminum and articles',
    '85': 'Electrical machinery',
    '84': 'Machinery',
    '25': 'Salt, sulfur, earths',
    '26': 'Ores, slag and ash',
    '28': 'Inorganic chemicals',
    '79': 'Zinc and articles',
    '80': 'Tin and articles',
    '81': 'Other base metals',
    '87': 'Vehicles',
    '90': 'Optical instruments'
  };
  return names[chapter] || 'Unknown';
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Check database corruption
    const stats = await checkDatabaseCorruption();

    if (!stats) {
      console.error('❌ Database check failed. Exiting.');
      process.exit(1);
    }

    // Display results
    console.log('📊 DATABASE STATUS:\n');
    console.log('Chapter | Total | ✅ Healthy | 🔴 Missing 301 | 🔴 Missing 232 | Both 0');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    let totalCodes = 0;
    let totalCorrupted301 = 0;
    let totalCorrupted232 = 0;
    let totalHealthy = 0;

    stats.forEach(stat => {
      totalCodes += stat.total_codes;
      totalCorrupted301 += stat.corrupted_301;
      totalCorrupted232 += stat.corrupted_232;
      totalHealthy += stat.healthy;

      const healthPct = ((stat.healthy / stat.total_codes) * 100).toFixed(1);
      const status = stat.corrupted_301 === 0 && stat.corrupted_232 === 0 ? '✅' : '🔴';

      console.log(
        `${status} ${stat.chapter.padEnd(5)} | ${String(stat.total_codes).padStart(5)} | ` +
        `${String(stat.healthy).padStart(10)} | ${String(stat.corrupted_301).padStart(14)} | ` +
        `${String(stat.corrupted_232).padStart(14)} | ${String(stat.both_zero).padStart(6)}`
      );
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `TOTAL   | ${String(totalCodes).padStart(5)} | ${String(totalHealthy).padStart(10)} | ` +
      `${String(totalCorrupted301).padStart(14)} | ${String(totalCorrupted232).padStart(14)}`
    );
    console.log('');

    // Step 2: Check script patterns (if --fix-scripts)
    let scriptViolations = [];
    if (checkScripts) {
      scriptViolations = checkScriptPatterns();

      if (scriptViolations.length > 0) {
        console.log(`❌ FOUND ${scriptViolations.length} CODE VIOLATIONS:\n`);

        scriptViolations.forEach((v, i) => {
          console.log(`${i + 1}. ${v.severity} ${v.file}:${v.line}`);
          console.log(`   Type: ${v.type}`);
          console.log(`   Code: ${v.code}`);
          console.log('');
        });

        console.log('🔧 FIX REQUIRED:');
        console.log('   Change all `: 0` to `: null` for section_301 and section_232 fields');
        console.log('   Change all `|| 0` to `|| null` for section_301 and section_232 fields\n');
      } else {
        console.log('✅ No dangerous code patterns found in scripts.\n');
      }
    }

    // Step 3: Generate fix commands
    const commands = generateFixCommands(stats);

    // Step 4: Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 VALIDATION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const totalCorrupted = totalCorrupted301 + totalCorrupted232;
    const healthPct = ((totalHealthy / totalCodes) * 100).toFixed(1);

    console.log(`Total HS codes in cache: ${totalCodes}`);
    console.log(`Healthy (both tariffs present): ${totalHealthy} (${healthPct}%)`);
    console.log(`Corrupted (missing section_301): ${totalCorrupted301}`);
    console.log(`Corrupted (missing section_232): ${totalCorrupted232}`);
    console.log(`Total corrupted: ${totalCorrupted}`);

    if (checkScripts) {
      console.log(`Script code violations: ${scriptViolations.length}`);
    }

    console.log('');

    if (totalCorrupted > 0) {
      console.log(`🔴 STATUS: CORRUPTION DETECTED - ${totalCorrupted} codes need repair`);
      console.log(`📝 Run the commands above to fix corrupted data`);
      process.exit(1);
    } else if (scriptViolations.length > 0) {
      console.log(`⚠️  STATUS: SCRIPTS NEED FIXING - ${scriptViolations.length} violations found`);
      console.log(`🔧 Fix the code patterns before running populate scripts again`);
      process.exit(1);
    } else {
      console.log('✅ STATUS: ALL CHECKS PASSED - Database is healthy');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ VALIDATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
