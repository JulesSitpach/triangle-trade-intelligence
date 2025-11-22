/**
 * SYSTEMATIC PATTERN AUDIT SCRIPT
 *
 * PURPOSE:
 * Find ALL instances of problematic code patterns throughout the codebase.
 * Don't just fix one bug - fix the entire PATTERN.
 *
 * PATTERNS TO FIND:
 * 1. Tariff defaults to 0% (|| 0, ? 0 :, : 0})
 * 2. Hardcoded tariff returns (return 0;)
 * 3. Hardcoded tariff assignments (section_301 = 0.25)
 * 4. HS code queries without normalization
 * 5. USMCA hardcoded assumptions (if USMCA return 0)
 * 6. Tariff queries without fallback hierarchy
 * 7. Error handling that defaults to 0%
 * 8. Rate calculations without database lookup
 *
 * USAGE:
 * node scripts/audit-problematic-patterns.js [--fix] [--pattern=PATTERN_NAME]
 *
 * OPTIONS:
 * --fix             Attempt to auto-fix safe patterns
 * --pattern=NAME    Only search for specific pattern
 * --verbose         Show all matches, not just count
 *
 * Created: November 20, 2025
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const fixMode = args.includes('--fix');
const verbose = args.includes('--verbose');
const patternArg = args.find(arg => arg.startsWith('--pattern='));
const specificPattern = patternArg ? patternArg.split('=')[1] : null;

console.log('🔍 SYSTEMATIC PATTERN AUDIT\n');
console.log('═'.repeat(60));
console.log(`Mode: ${fixMode ? 'FIX' : 'AUDIT ONLY'}`);
console.log(`Pattern: ${specificPattern || 'ALL'}`);
console.log(`Verbose: ${verbose ? 'Yes' : 'No'}`);
console.log('═'.repeat(60));
console.log('');

/**
 * Pattern definitions
 */
const patterns = [
  {
    name: 'tariff_defaults_to_zero',
    description: 'Tariff fields defaulting to 0% instead of null',
    regex: /(\|\|\s*0[,;\s)]|:\s*0[,;\s})]|\?\s*0\s*:|default:\s*0)/g,
    context: ['section_301', 'section_232', 'section_201', 'ieepa', 'usmca_rate', 'mfn_rate', 'tariff', 'rate'],
    severity: 'critical',
    fix: (match, file) => match.replace(/\|\|\s*0/, '?? null'),
    explanation: 'Defaulting to 0% hides missing data (should be null = needs research)'
  },
  {
    name: 'hardcoded_tariff_returns',
    description: 'Hardcoded return 0; in tariff context',
    regex: /return\s+0\s*;/g,
    context: ['tariff', 'rate', 'section', 'duty', 'mfn', 'usmca'],
    severity: 'critical',
    fix: null, // Manual review required
    explanation: 'Returning 0 assumes duty-free without verification'
  },
  {
    name: 'hardcoded_tariff_rates',
    description: 'Hardcoded tariff rate assignments (not from database)',
    regex: /(section_301|section_232|section_201|ieepa|tariff_rate)\s*=\s*(0\.\d+|0\.25|0\.50|0\.075)/g,
    context: [],
    severity: 'critical',
    fix: null, // Manual review required
    explanation: 'Tariff rates should come from database, not hardcoded'
  },
  {
    name: 'hs_code_no_normalization',
    description: 'HS code queries without normalization',
    regex: /\.eq\(['"]hs_code['"],\s*([^n])/g,  // .eq('hs_code', X) where X != normalized
    context: [],
    severity: 'high',
    fix: null, // Manual review required
    explanation: 'HS codes should be normalized before querying (73.26.90.70 → 73269070)'
  },
  {
    name: 'usmca_hardcoded_zero',
    description: 'USMCA hardcoded to 0% assumption',
    regex: /(if.*usmca.*return\s+0|usmca.*\?\s*0\s*:|usmcaRate\s*=\s*0)/gi,
    context: [],
    severity: 'critical',
    fix: null, // Manual review required
    explanation: 'USMCA rates vary by product (0%, 2.5%, 5%), never assume 0%'
  },
  {
    name: 'tariff_query_no_fallback',
    description: 'Tariff queries without fallback hierarchy',
    regex: /\.eq\(['"]hs_code['"].*\.single\(\)|\.maybeSingle\(\)/g,
    context: ['policy_tariffs', 'tariff_intelligence'],
    severity: 'medium',
    fix: null, // Manual refactor required
    explanation: 'Should use fallback hierarchy (8-digit → 6-digit → 4-digit)'
  },
  {
    name: 'error_default_zero',
    description: 'Error handling that defaults to 0%',
    regex: /(catch.*return\s+0|catch.*:\s*0[,;])/g,
    context: ['tariff', 'rate', 'duty'],
    severity: 'high',
    fix: null, // Manual review required
    explanation: 'Errors should return null or throw, not default to 0%'
  },
  {
    name: 'rate_calc_no_db',
    description: 'Rate calculations without database lookup',
    regex: /(totalRate|total_rate|final_rate)\s*=\s*(0\.\d+|\d+\s*\*\s*0\.\d+)/g,
    context: [],
    severity: 'medium',
    fix: null, // Manual review required
    explanation: 'Rates should be fetched from database, not calculated from constants'
  }
];

/**
 * Search for pattern in file
 */
async function searchPattern(pattern, file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const matches = [];

    // Find all matches
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      // Check if match is in relevant context
      const matchContext = content.substring(Math.max(0, match.index - 200), Math.min(content.length, match.index + 200));

      // If pattern has context requirements, check them
      if (pattern.context && pattern.context.length > 0) {
        const hasContext = pattern.context.some(ctx =>
          matchContext.toLowerCase().includes(ctx.toLowerCase())
        );

        if (!hasContext) {
          continue; // Skip this match, not in relevant context
        }
      }

      // Get line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

      // Get the line content
      const lines = content.split('\n');
      const line = lines[lineNumber - 1];

      matches.push({
        match: match[0],
        line: lineNumber,
        content: line.trim(),
        context: matchContext
      });
    }

    return matches;
  } catch (error) {
    return [];
  }
}

/**
 * Get all JavaScript files
 */
function getAllJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        getAllJSFiles(filePath, fileList);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Main audit
 */
async function runAudit() {
  const projectRoot = path.join(__dirname, '..');
  const filesToScan = getAllJSFiles(projectRoot);

  console.log(`Scanning ${filesToScan.length} JavaScript files...\n`);

  const results = [];

  // Filter patterns if specific pattern requested
  const patternsToCheck = specificPattern
    ? patterns.filter(p => p.name === specificPattern)
    : patterns;

  if (patternsToCheck.length === 0) {
    console.error(`❌ Pattern "${specificPattern}" not found`);
    process.exit(1);
  }

  for (const pattern of patternsToCheck) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🔍 Searching: ${pattern.description}`);
    console.log(`${'─'.repeat(60)}`);

    let totalMatches = 0;
    const fileMatches = [];

    for (const file of filesToScan) {
      const matches = await searchPattern(pattern, file);

      if (matches.length > 0) {
        totalMatches += matches.length;
        fileMatches.push({
          file: path.relative(projectRoot, file),
          matches
        });
      }
    }

    results.push({
      pattern: pattern.name,
      description: pattern.description,
      severity: pattern.severity,
      totalMatches,
      files: fileMatches.length,
      explanation: pattern.explanation
    });

    // Display results
    if (totalMatches === 0) {
      console.log(`✅ No matches found (pattern is clean)\n`);
    } else {
      console.log(`❌ Found ${totalMatches} matches in ${fileMatches.length} files\n`);

      if (verbose || fileMatches.length <= 10) {
        for (const fileMatch of fileMatches.slice(0, 10)) {
          console.log(`\n  📄 ${fileMatch.file}`);
          for (const match of fileMatch.matches.slice(0, 3)) {
            console.log(`     Line ${match.line}: ${match.content.substring(0, 80)}`);
          }
          if (fileMatch.matches.length > 3) {
            console.log(`     ... and ${fileMatch.matches.length - 3} more matches`);
          }
        }

        if (fileMatches.length > 10) {
          console.log(`\n  ... and ${fileMatches.length - 10} more files`);
        }
      }

      console.log(`\n  ⚠️  ${pattern.explanation}`);
      console.log('');
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('═'.repeat(60));
  console.log('');

  const criticalIssues = results.filter(r => r.severity === 'critical' && r.totalMatches > 0);
  const highIssues = results.filter(r => r.severity === 'high' && r.totalMatches > 0);
  const mediumIssues = results.filter(r => r.severity === 'medium' && r.totalMatches > 0);

  console.log(`🔴 Critical Issues: ${criticalIssues.length} patterns, ${criticalIssues.reduce((sum, r) => sum + r.totalMatches, 0)} total matches`);
  console.log(`🟠 High Issues: ${highIssues.length} patterns, ${highIssues.reduce((sum, r) => sum + r.totalMatches, 0)} total matches`);
  console.log(`🟡 Medium Issues: ${mediumIssues.length} patterns, ${mediumIssues.reduce((sum, r) => sum + r.totalMatches, 0)} total matches`);
  console.log('');

  if (criticalIssues.length > 0) {
    console.log('Critical patterns found:');
    for (const issue of criticalIssues) {
      console.log(`  ❌ ${issue.pattern}: ${issue.totalMatches} matches`);
    }
    console.log('');
  }

  // Recommendations
  console.log('Recommendations:');
  console.log('  1. Fix CRITICAL patterns first (data corruption risk)');
  console.log('  2. Run with --verbose to see all matches');
  console.log('  3. Review each match manually (don\'t auto-fix without understanding)');
  console.log('  4. Add linter rules to prevent recurrence');
  console.log('  5. Update documentation with pattern rules');
  console.log('');

  if (fixMode) {
    console.log('⚠️  Auto-fix mode not yet implemented (requires manual review)');
    console.log('');
  }

  // Exit code
  if (criticalIssues.length > 0) {
    process.exit(1);
  } else if (highIssues.length > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

runAudit();
