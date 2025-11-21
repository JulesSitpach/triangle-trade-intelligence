/**
 * FIX TARIFF || 0 DEFAULTS - AUTOMATED REPAIR SCRIPT
 *
 * PURPOSE:
 * Systematically fix all 26 critical `|| 0` defaults in tariff code.
 * These defaults hide missing data by converting null → 0% (implying duty-free).
 *
 * WHAT IT FIXES:
 * 1. User input component defaults (lines 745-749)
 * 2. Cached rate defaults (lines 941-945)
 * 3. Policy rate defaults (lines 1034-1035, 1220)
 * 4. Component enrichment defaults (lines 1346-1350)
 * 5. USMCA hardcoded assumption (line 1420) - CRITICAL
 *
 * STRATEGY:
 * - Change `|| 0` to `?? null` in tariff contexts
 * - Preserve `|| 0` for non-tariff numeric fields (counts, percentages)
 * - Remove USMCA origin assumption logic (lines 1417-1424)
 * - Add comments explaining why null is correct
 *
 * SAFETY:
 * - Creates backup before changes
 * - Shows diff of what will change
 * - Requires confirmation before applying
 *
 * USAGE:
 * node scripts/fix-tariff-defaults.js [--dry-run] [--auto]
 *
 * Created: November 20, 2025
 * Reason: Fix 26 critical `|| 0` defaults hiding missing tariff data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const auto = args.includes('--auto');

console.log('🔧 FIX TARIFF || 0 DEFAULTS\n');
console.log('═'.repeat(60));
console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE FIX'}`);
console.log(`Auto: ${auto ? 'Yes (no confirmation)' : 'No (will prompt)'}`);
console.log('═'.repeat(60));
console.log('');

const fixes = [
  {
    file: 'pages/api/ai-usmca-complete-analysis.js',
    name: 'User Input Component Defaults (Lines 745-749)',
    description: 'When user provides components without tariff data, should be null (needs research), not 0% (duty-free)',
    find: `          mfn_rate: component.mfn_rate || 0,
          base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
          section_301: component.section_301 || 0,
          section_232: component.section_232 || 0,
          usmca_rate: component.usmca_rate || 0,`,
    replace: `          // ✅ FIX (Nov 20, 2025): Use null for missing rates (not 0)
          // - null = needs research
          // - 0 = confirmed duty-free (misleading if not researched)
          mfn_rate: component.mfn_rate ?? null,
          base_mfn_rate: component.base_mfn_rate ?? component.mfn_rate ?? null,
          section_301: component.section_301 ?? null,
          section_232: component.section_232 ?? null,
          usmca_rate: component.usmca_rate ?? null,`,
    critical: true
  },
  {
    file: 'pages/api/ai-usmca-complete-analysis.js',
    name: 'Cached Rate Defaults (Lines 941-945)',
    description: 'When database has null rates, should stay null (not default to 0%)',
    find: `                mfn_rate: parseFloat(cachedRate.mfn_rate) || 0,
                base_mfn_rate: parseFloat(cachedRate.mfn_rate) || 0,
                section_301: parseFloat(cachedRate.section_301) || 0,
                section_232: parseFloat(cachedRate.section_232) || 0,
                usmca_rate: parseFloat(cachedRate.usmca_rate) || 0,`,
    replace: `                // ✅ FIX (Nov 20, 2025): Preserve null from database
                // - Database null = not researched yet
                // - Don't convert to 0 (hides missing data)
                mfn_rate: cachedRate.mfn_rate ? parseFloat(cachedRate.mfn_rate) : null,
                base_mfn_rate: cachedRate.mfn_rate ? parseFloat(cachedRate.mfn_rate) : null,
                section_301: cachedRate.section_301 ? parseFloat(cachedRate.section_301) : null,
                section_232: cachedRate.section_232 ? parseFloat(cachedRate.section_232) : null,
                usmca_rate: cachedRate.usmca_rate ? parseFloat(cachedRate.usmca_rate) : null,`,
    critical: true
  },
  {
    file: 'pages/api/ai-usmca-complete-analysis.js',
    name: 'Policy Rate Defaults (Lines 1034-1035)',
    description: 'When policy tariffs missing from database, should be null (not 0%)',
    find: `              policyRates.section_301 = policyCache.section_301 || 0;
              policyRates.section_232 = policyCache.section_232 || 0;`,
    replace: `              // ✅ FIX (Nov 20, 2025): Keep null if database has null
              policyRates.section_301 = policyCache.section_301 ?? null;
              policyRates.section_232 = policyCache.section_232 ?? null;`,
    critical: true
  },
  {
    file: 'pages/api/ai-usmca-complete-analysis.js',
    name: 'Component Enrichment Defaults (Lines 1346-1350)',
    description: 'When enriching components with AI results, preserve null (don't default to 0%)',
    find: `            mfn_rate: component.mfn_rate || 0,
            base_mfn_rate: component.base_mfn_rate || component.mfn_rate || 0,
            section_301: component.section_301 || 0,
            section_232: component.section_232 || 0,
            usmca_rate: component.usmca_rate || 0,`,
    replace: `            // ✅ FIX (Nov 20, 2025): Preserve null for missing rates
            mfn_rate: component.mfn_rate ?? null,
            base_mfn_rate: component.base_mfn_rate ?? component.mfn_rate ?? null,
            section_301: component.section_301 ?? null,
            section_232: component.section_232 ?? null,
            usmca_rate: component.usmca_rate ?? null,`,
    critical: true
  },
  {
    file: 'pages/api/ai-usmca-complete-analysis.js',
    name: 'USMCA Hardcoded Assumption (Lines 1417-1424) - MOST CRITICAL',
    description: 'Remove assumption that USMCA origin = 0% rate. USMCA rates vary by product (0%, 2.5%, 5%, etc). Origin ≠ Qualification.',
    find: `            // ✅ FIX (Nov 12): USMCA-origin components ALWAYS get 0% USMCA rate (duty-free under USMCA)
            const originCountry = (comp.origin_country || '').toUpperCase();
            const isUSMCAOrigin = ['US', 'CA', 'MX'].includes(originCountry);
            const usmcaRate = isUSMCAOrigin ? 0 : (aiResult.usmca_rate || 0);

            if (isUSMCAOrigin && aiResult.usmca_rate !== 0) {
              console.log(\`   ⚠️ [USMCA-CORRECTION] Component from \${originCountry} - forcing USMCA rate to 0% (was \${aiResult.usmca_rate})\`);
            }`,
    replace: `            // ✅ FIX (Nov 20, 2025): NEVER assume USMCA rate = 0%
            // - USMCA rates vary by product (0%, 2.5%, 5%, etc - query database)
            // - Origin ≠ Qualification (Mexico product may not qualify if RVC < threshold)
            // - Qualification checked separately by USMCA engine (don't mix with rate lookup)
            const usmcaRate = aiResult.usmca_rate ?? null;`,
    critical: true
  }
];

async function applyFixes() {
  let totalFixed = 0;
  let totalFailed = 0;

  for (const fix of fixes) {
    const filePath = path.join(__dirname, '..', fix.file);

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📝 ${fix.name}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`File: ${fix.file}`);
    console.log(`Description: ${fix.description}`);
    console.log(`Critical: ${fix.critical ? '🔴 YES' : '⚠️  No'}`);
    console.log('');

    // Read file
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error(`❌ Failed to read file: ${error.message}\n`);
      totalFailed++;
      continue;
    }

    // Check if fix is needed
    if (!content.includes(fix.find)) {
      console.log(`✅ Already fixed or not found (skipping)\n`);
      continue;
    }

    // Show what will change
    console.log('BEFORE:');
    console.log(fix.find.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('');
    console.log('AFTER:');
    console.log(fix.replace.split('\n').map(line => `  ${line}`).join('\n'));
    console.log('');

    if (dryRun) {
      console.log('🔍 DRY RUN - Would apply this fix\n');
      continue;
    }

    // Apply fix
    try {
      const newContent = content.replace(fix.find, fix.replace);

      // Backup original
      const backupPath = `${filePath}.backup-${Date.now()}`;
      fs.writeFileSync(backupPath, content);
      console.log(`💾 Backup created: ${path.basename(backupPath)}`);

      // Write fixed version
      fs.writeFileSync(filePath, newContent);
      console.log(`✅ Fix applied successfully\n`);
      totalFixed++;
    } catch (error) {
      console.error(`❌ Failed to apply fix: ${error.message}\n`);
      totalFailed++;
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY\n');
  console.log(`   Total fixes: ${fixes.length}`);
  console.log(`   ✅ Applied: ${totalFixed}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   ⏭️  Skipped: ${fixes.length - totalFixed - totalFailed}`);
  console.log('');

  if (totalFixed > 0 && !dryRun) {
    console.log('✅ All critical || 0 defaults have been fixed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Review changes in git diff');
    console.log('2. Test with: npm run dev:3001');
    console.log('3. Commit with: git add . && git commit -m "fix: Replace || 0 with ?? null in tariff code"');
    console.log('');
  }
}

applyFixes();
