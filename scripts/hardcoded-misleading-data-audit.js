#!/usr/bin/env node
/**
 * Comprehensive Hardcoded Misleading Data Audit
 * Finds ALL hardcoded values that could mislead users making business decisions
 *
 * Categories:
 * - CRITICAL: Policy tariffs, compliance data, legal requirements
 * - HIGH: Financial calculations, dates, thresholds, country lists
 * - MEDIUM: UI labels claiming "current" or "verified" data
 * - LOW: Example data in comments/docs
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate misleading hardcoded data
const CRITICAL_PATTERNS = [
  // Policy tariffs
  { pattern: /Section 301.*?(\d+\.?\d*)%/gi, category: 'Section 301 tariff rate', severity: 'CRITICAL' },
  { pattern: /Section 232.*?(\d+\.?\d*)%/gi, category: 'Section 232 tariff rate', severity: 'CRITICAL' },
  { pattern: /Reciprocal.*?(\d+\.?\d*)%/gi, category: 'Reciprocal tariff rate', severity: 'CRITICAL' },
  { pattern: /IEEPA.*?(\d+\.?\d*)%/gi, category: 'IEEPA tariff rate', severity: 'CRITICAL' },
  { pattern: /MFN.*?(\d+\.?\d*)%/gi, category: 'MFN tariff rate', severity: 'CRITICAL' },
  { pattern: /duty.*?(\d+\.?\d*)%/gi, category: 'Duty rate', severity: 'CRITICAL' },
  { pattern: /tariff.*?(\d+\.?\d*)%/gi, category: 'Generic tariff rate', severity: 'CRITICAL' },

  // Ranges that hide actual values
  { pattern: /(\d+\.?\d*)%?\s*to\s*(\d+\.?\d*)%/gi, category: 'Rate range (should show specific value)', severity: 'CRITICAL' },
  { pattern: /between\s+(\d+\.?\d*)%?\s+and\s+(\d+\.?\d*)%/gi, category: 'Rate range (should show specific value)', severity: 'CRITICAL' },

  // Compliance thresholds
  { pattern: /RVC.*?(\d+\.?\d*)%/gi, category: 'RVC threshold', severity: 'CRITICAL' },
  { pattern: /regional.*?content.*?(\d+\.?\d*)%/gi, category: 'Regional content threshold', severity: 'CRITICAL' },
  { pattern: /threshold.*?(\d+\.?\d*)%/gi, category: 'Qualification threshold', severity: 'CRITICAL' },

  // Savings claims
  { pattern: /\$[\d,]+\s*(annual|monthly|yearly)?\s*savings/gi, category: 'Hardcoded savings amount', severity: 'CRITICAL' },
  { pattern: /save\s+\$[\d,]+/gi, category: 'Hardcoded savings claim', severity: 'CRITICAL' },
  { pattern: /savings.*?\$[\d,]+/gi, category: 'Hardcoded savings figure', severity: 'CRITICAL' },
];

const HIGH_PATTERNS = [
  // Dates claiming currency
  { pattern: /(as of|current as of|updated|verified)\s+\d{1,2}\/\d{1,2}\/\d{2,4}/gi, category: 'Hardcoded verification date', severity: 'HIGH' },
  { pattern: /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+202\d/gi, category: 'Hardcoded date claiming currency', severity: 'HIGH' },
  { pattern: /effective\s+\d{1,2}\/\d{1,2}\/\d{2,4}/gi, category: 'Hardcoded effective date', severity: 'HIGH' },

  // Country/origin claims
  { pattern: /made in (China|Mexico|Canada|USA)/gi, category: 'Hardcoded origin country', severity: 'HIGH' },
  { pattern: /manufactured in (China|Mexico|Canada|USA)/gi, category: 'Hardcoded manufacturing location', severity: 'HIGH' },

  // Product classifications
  { pattern: /HS\s*code:?\s*\d{4,10}/gi, category: 'Hardcoded HS code', severity: 'HIGH' },
  { pattern: /HTS:?\s*\d{4,10}/gi, category: 'Hardcoded HTS code', severity: 'HIGH' },

  // Financial calculations
  { pattern: /annual.*?volume.*?\$[\d,]+/gi, category: 'Hardcoded trade volume', severity: 'HIGH' },
  { pattern: /import.*?value.*?\$[\d,]+/gi, category: 'Hardcoded import value', severity: 'HIGH' },
];

const MEDIUM_PATTERNS = [
  // UI text claiming data freshness
  { pattern: /current rate/gi, category: 'Claims "current" without timestamp', severity: 'MEDIUM' },
  { pattern: /latest rate/gi, category: 'Claims "latest" without timestamp', severity: 'MEDIUM' },
  { pattern: /verified rate/gi, category: 'Claims "verified" without date', severity: 'MEDIUM' },
  { pattern: /real-time/gi, category: 'Claims "real-time" data', severity: 'MEDIUM' },
  { pattern: /up to date/gi, category: 'Claims data is current', severity: 'MEDIUM' },

  // Typical/average claims
  { pattern: /typical.*?(\d+\.?\d*)%/gi, category: 'Claims "typical" rate', severity: 'MEDIUM' },
  { pattern: /average.*?(\d+\.?\d*)%/gi, category: 'Claims "average" rate', severity: 'MEDIUM' },
  { pattern: /most.*?(\d+\.?\d*)%/gi, category: 'Claims "most" products pay X%', severity: 'MEDIUM' },
];

// Directories to scan
const SCAN_DIRS = [
  'pages',
  'components',
  'lib',
  'styles'
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /package-lock\.json/,
  /\.md$/,  // Markdown docs are okay
  /__DEPRECATED__/,
  /\.test\./,
  /\.spec\./,
];

const findings = {
  CRITICAL: [],
  HIGH: [],
  MEDIUM: [],
  LOW: []
};

let filesScanned = 0;
let totalFindings = 0;

function shouldExcludeFile(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function scanFile(filePath) {
  if (shouldExcludeFile(filePath)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    filesScanned++;

    // Check all pattern categories
    const allPatterns = [
      ...CRITICAL_PATTERNS,
      ...HIGH_PATTERNS,
      ...MEDIUM_PATTERNS
    ];

    allPatterns.forEach(({ pattern, category, severity }) => {
      lines.forEach((line, lineNumber) => {
        const matches = line.match(pattern);
        if (matches) {
          // Skip if it's in a comment explaining the pattern (not actual usage)
          if (line.trim().startsWith('//') && line.includes('Example:')) return;
          if (line.trim().startsWith('*') && line.includes('e.g.')) return;

          findings[severity].push({
            file: filePath,
            line: lineNumber + 1,
            category,
            severity,
            code: line.trim(),
            matched: matches[0]
          });
          totalFindings++;
        }
      });
    });

  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !shouldExcludeFile(fullPath)) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err.message);
  }
}

// Main execution
console.log('🔍 Starting Comprehensive Misleading Data Audit...\n');

const projectRoot = process.argv[2] || process.cwd();
console.log(`📂 Scanning project: ${projectRoot}\n`);

SCAN_DIRS.forEach(dir => {
  const fullPath = path.join(projectRoot, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Scanning ${dir}/...`);
    scanDirectory(fullPath);
  }
});

// Generate report
console.log(`\n✅ Scan complete: ${filesScanned} files scanned, ${totalFindings} findings\n`);

console.log('=' .repeat(80));
console.log('AUDIT REPORT: HARDCODED MISLEADING DATA');
console.log('=' .repeat(80));

['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
  const items = findings[severity];
  if (items.length === 0) {
    console.log(`\n✅ ${severity}: 0 findings`);
    return;
  }

  console.log(`\n🚨 ${severity}: ${items.length} findings`);
  console.log('-'.repeat(80));

  // Group by category
  const byCategory = {};
  items.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  Object.entries(byCategory).forEach(([category, categoryItems]) => {
    console.log(`\n  📌 ${category} (${categoryItems.length} occurrences):`);
    categoryItems.slice(0, 5).forEach(item => {  // Show first 5 per category
      console.log(`     ${item.file}:${item.line}`);
      console.log(`     ${item.code.substring(0, 100)}${item.code.length > 100 ? '...' : ''}`);
      console.log(`     Matched: "${item.matched}"`);
      console.log('');
    });
    if (categoryItems.length > 5) {
      console.log(`     ... and ${categoryItems.length - 5} more\n`);
    }
  });
});

// Save JSON report
const reportPath = path.join(projectRoot, 'hardcoded-misleading-data-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    filesScanned,
    totalFindings,
    bySeverity: {
      CRITICAL: findings.CRITICAL.length,
      HIGH: findings.HIGH.length,
      MEDIUM: findings.MEDIUM.length
    }
  },
  findings
}, null, 2));

console.log(`\n📄 Full report saved to: ${reportPath}`);

// Exit with error code if critical findings exist
if (findings.CRITICAL.length > 0) {
  console.log(`\n❌ AUDIT FAILED: ${findings.CRITICAL.length} CRITICAL findings must be fixed`);
  console.log('   Users are seeing hardcoded values instead of real data!');
  process.exit(1);
} else if (findings.HIGH.length > 0) {
  console.log(`\n⚠️  AUDIT WARNING: ${findings.HIGH.length} HIGH findings should be addressed`);
  process.exit(0);
} else {
  console.log(`\n✅ AUDIT PASSED: No critical hardcoded misleading data found`);
  process.exit(0);
}
