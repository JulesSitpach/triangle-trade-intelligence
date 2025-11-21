/**
 * APPLY DATABASE CONSTRAINTS & INDEXES
 *
 * PURPOSE:
 * Apply defensive database-level constraints to policy_tariffs_cache table.
 * Reads SQL from migrations/add-tariff-cache-constraints.sql and executes.
 *
 * WHAT IT DOES:
 * 1. Reads SQL migration file
 * 2. Executes via Supabase client
 * 3. Verifies constraints were applied
 * 4. Tests constraints work (try inserting bad data)
 *
 * USAGE:
 * node scripts/apply-database-constraints.js [--verify-only]
 *
 * OPTIONS:
 * --verify-only    Only check if constraints exist (don't apply)
 * --test           Run test cases to verify constraints work
 *
 * EXIT CODES:
 * 0 = Success (all constraints applied)
 * 1 = Failure (could not apply constraints)
 * 2 = Partial (some constraints failed)
 *
 * Created: November 20, 2025
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

// Parse arguments
const args = process.argv.slice(2);
const verifyOnly = args.includes('--verify-only');
const runTests = args.includes('--test');

console.log('🔧 DATABASE CONSTRAINTS & INDEXES SETUP\n');
console.log('═'.repeat(60));
console.log(`Mode: ${verifyOnly ? 'VERIFY ONLY' : 'APPLY CONSTRAINTS'}`);
console.log(`Test: ${runTests ? 'Yes' : 'No'}`);
console.log('═'.repeat(60));
console.log('');

/**
 * Verify constraints exist
 */
async function verifyConstraints() {
  console.log('📋 Verifying constraints...\n');

  const constraints = [
    'chk_section_301_range',
    'chk_section_232_range',
    'chk_section_201_range',
    'chk_ieepa_rate_range'
  ];

  const indexes = [
    'idx_policy_tariffs_hs_code',
    'idx_policy_tariffs_origin',
    'idx_policy_tariffs_hs_origin',
    'idx_policy_tariffs_verified_date',
    'idx_policy_tariffs_section_301',
    'idx_policy_tariffs_section_232',
    'unique_policy_tariff_key',
    'unique_blanket_tariff_key'
  ];

  let allPresent = true;

  // Check CHECK constraints
  const { data: checkConstraints, error: checkError } = await supabase.rpc('execute_sql', {
    query: `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'policy_tariffs_cache'
      AND constraint_type = 'CHECK'
      ORDER BY constraint_name;
    `
  });

  if (checkError) {
    console.error('❌ Error checking constraints:', checkError.message);
    return false;
  }

  const existingConstraints = checkConstraints?.map(c => c.constraint_name) || [];

  for (const constraint of constraints) {
    const exists = existingConstraints.includes(constraint);
    console.log(`  ${exists ? '✅' : '❌'} ${constraint}`);
    if (!exists) allPresent = false;
  }

  console.log('');

  // Check indexes
  const { data: existingIndexes, error: indexError } = await supabase.rpc('execute_sql', {
    query: `
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'policy_tariffs_cache'
      ORDER BY indexname;
    `
  });

  if (indexError) {
    console.error('❌ Error checking indexes:', indexError.message);
    return false;
  }

  const indexNames = existingIndexes?.map(i => i.indexname) || [];

  for (const index of indexes) {
    const exists = indexNames.includes(index);
    console.log(`  ${exists ? '✅' : '❌'} ${index}`);
    if (!exists) allPresent = false;
  }

  console.log('');

  // Check NOT NULL constraints
  const { data: columns, error: colError } = await supabase.rpc('execute_sql', {
    query: `
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'policy_tariffs_cache'
      AND column_name IN ('hs_code', 'verified_source', 'verified_date')
      ORDER BY column_name;
    `
  });

  if (colError) {
    console.error('❌ Error checking columns:', colError.message);
    return false;
  }

  for (const col of columns || []) {
    const notNull = col.is_nullable === 'NO';
    console.log(`  ${notNull ? '✅' : '❌'} ${col.column_name} NOT NULL`);
    if (!notNull) allPresent = false;
  }

  console.log('');

  if (allPresent) {
    console.log('✅ All constraints and indexes are present\n');
  } else {
    console.log('⚠️  Some constraints or indexes are missing\n');
  }

  return allPresent;
}

/**
 * Apply constraints from SQL file
 */
async function applyConstraints() {
  console.log('📝 Reading SQL migration file...\n');

  const sqlPath = path.join(__dirname, 'migrations', 'add-tariff-cache-constraints.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found:', sqlPath);
    return false;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🔄 Applying constraints to database...\n');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .filter(s => !s.startsWith('--'))  // Remove comments
    .filter(s => !s.startsWith('/*'));  // Remove block comments

  let successCount = 0;
  let failCount = 0;

  for (const statement of statements) {
    // Skip comments and validation queries
    if (
      statement.includes('COMMENT ON') ||
      statement.includes('SELECT') ||
      statement.includes('DO $$')
    ) {
      continue;
    }

    try {
      const { error } = await supabase.rpc('execute_sql', {
        query: statement
      });

      if (error) {
        // Ignore "already exists" errors
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log('  ⏭️  Already exists (skipping)');
          successCount++;
        } else {
          console.error('  ❌ Error:', error.message);
          failCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      console.error('  ❌ Exception:', err.message);
      failCount++;
    }
  }

  console.log('');
  console.log(`✅ Applied ${successCount} constraints/indexes`);
  if (failCount > 0) {
    console.log(`❌ Failed ${failCount} constraints/indexes`);
  }
  console.log('');

  return failCount === 0;
}

/**
 * Test constraints work
 */
async function testConstraints() {
  console.log('🧪 Testing constraints...\n');

  const tests = [
    {
      name: 'Reject rate > 1.0',
      data: { hs_code: '99999999', section_301: 25.0, verified_source: 'TEST', verified_date: new Date().toISOString() },
      shouldFail: true
    },
    {
      name: 'Reject NULL hs_code',
      data: { hs_code: null, section_301: 0.25, verified_source: 'TEST', verified_date: new Date().toISOString() },
      shouldFail: true
    },
    {
      name: 'Reject NULL verified_source',
      data: { hs_code: '99999999', section_301: 0.25, verified_source: null, verified_date: new Date().toISOString() },
      shouldFail: true
    },
    {
      name: 'Accept valid record',
      data: { hs_code: '99999999', section_301: 0.25, verified_source: 'TEST', verified_date: new Date().toISOString(), origin_country: 'CN' },
      shouldFail: false
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const { error } = await supabase
        .from('policy_tariffs_cache')
        .insert(test.data);

      if (error) {
        if (test.shouldFail) {
          console.log(`  ✅ ${test.name} - Correctly rejected`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name} - Should have been accepted`);
          console.log(`     Error: ${error.message}`);
          failed++;
        }
      } else {
        if (test.shouldFail) {
          console.log(`  ❌ ${test.name} - Should have been rejected`);
          failed++;
          // Clean up
          await supabase
            .from('policy_tariffs_cache')
            .delete()
            .eq('hs_code', '99999999')
            .eq('verified_source', 'TEST');
        } else {
          console.log(`  ✅ ${test.name} - Correctly accepted`);
          passed++;
          // Clean up
          await supabase
            .from('policy_tariffs_cache')
            .delete()
            .eq('hs_code', '99999999')
            .eq('verified_source', 'TEST');
        }
      }
    } catch (err) {
      console.log(`  ❌ ${test.name} - Exception: ${err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`Test Results: ${passed}/${tests.length} passed`);
  console.log('');

  return failed === 0;
}

/**
 * Main execution
 */
async function main() {
  try {
    if (verifyOnly) {
      // Only verify
      const allPresent = await verifyConstraints();
      process.exit(allPresent ? 0 : 1);
    } else {
      // Apply constraints
      const applied = await applyConstraints();

      if (!applied) {
        console.error('❌ Failed to apply some constraints');
        process.exit(2);
      }

      // Verify they were applied
      const verified = await verifyConstraints();

      if (!verified) {
        console.error('❌ Verification failed - not all constraints applied');
        process.exit(2);
      }

      // Run tests if requested
      if (runTests) {
        const testsPassed = await testConstraints();
        if (!testsPassed) {
          console.error('❌ Some tests failed');
          process.exit(2);
        }
      }

      console.log('✅ DATABASE CONSTRAINTS APPLIED SUCCESSFULLY\n');
      console.log('Protection Added:');
      console.log('  ✅ CHECK constraints prevent rates outside 0.0-1.0 range');
      console.log('  ✅ NOT NULL constraints prevent missing critical fields');
      console.log('  ✅ UNIQUE constraints prevent duplicate records');
      console.log('  ✅ Performance indexes speed up queries');
      console.log('');
      console.log('Next Steps:');
      console.log('  1. Test by trying to insert bad data (should be rejected)');
      console.log('  2. Monitor query performance (should be faster)');
      console.log('  3. Run: node scripts/validate-tariff-cache-health.js');
      console.log('');

      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ CONSTRAINTS APPLICATION FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
