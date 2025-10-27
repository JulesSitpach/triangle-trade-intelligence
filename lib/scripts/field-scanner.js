#!/usr/bin/env node

/**
 * FIELD MAPPING DISCOVERY TOOL
 * Scans codebase to identify all field access patterns
 * Helps find naming convention mismatches automatically
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  ignoreDirs: ['node_modules', '.next', '.git', 'dist', 'build', '__tests__'],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  outputFile: './field-mapping-report.json'
};

// Track all field accesses
const fieldMap = {
  snake_case: {},    // field_name pattern
  camelCase: {},     // fieldName pattern
  byFile: {}
};

const fieldPatterns = [];

/**
 * Check if directory should be skipped
 */
function shouldIgnore(dirName) {
  return config.ignoreDirs.some(ignore => dirName.includes(ignore));
}

/**
 * Scan a file for field access patterns
 * Looks for: object.field_name or object.fieldName patterns
 */
function scanFile(filePath, fileContent) {
  // Match patterns like: component.mfn_rate, component.mfnRate, results.usmca
  // Excludes method calls with parentheses
  const fieldAccessPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\.((?:[a-zA-Z_$][a-zA-Z0-9_$]*|'[^']*'|"[^"]*"))/g;

  let match;
  const fileFieldAccesses = [];

  while ((match = fieldAccessPattern.exec(fileContent)) !== null) {
    const object = match[1];
    let field = match[2];

    // Remove quotes if present
    if ((field.startsWith('"') && field.endsWith('"')) ||
        (field.startsWith("'") && field.endsWith("'"))) {
      field = field.slice(1, -1);
    }

    // Skip if it looks like a method call (next character is '(')
    const nextCharIndex = match.index + match[0].length;
    if (fileContent[nextCharIndex] === '(') {
      continue;
    }

    // Only track meaningful field names (contain component-related keywords)
    if (!field || field.length < 2) continue;

    // Track the access
    const isSnakeCase = field.includes('_');
    const isCamelCase = /[a-z][A-Z]/.test(field);

    fileFieldAccesses.push({
      object,
      field,
      isSnakeCase,
      isCamelCase,
      line: fileContent.substring(0, match.index).split('\n').length
    });

    // Record in global map
    if (isSnakeCase) {
      if (!fieldMap.snake_case[field]) {
        fieldMap.snake_case[field] = { count: 0, files: [] };
      }
      fieldMap.snake_case[field].count++;
      if (!fieldMap.snake_case[field].files.includes(filePath)) {
        fieldMap.snake_case[field].files.push(filePath);
      }
    }

    if (isCamelCase) {
      if (!fieldMap.camelCase[field]) {
        fieldMap.camelCase[field] = { count: 0, files: [] };
      }
      fieldMap.camelCase[field].count++;
      if (!fieldMap.camelCase[field].files.includes(filePath)) {
        fieldMap.camelCase[field].files.push(filePath);
      }
    }
  }

  if (fileFieldAccesses.length > 0) {
    fieldMap.byFile[filePath] = fileFieldAccesses;
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  if (shouldIgnore(dir)) return;

  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const relativePath = path.relative(process.cwd(), filePath);

      try {
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (config.extensions.some(ext => filePath.endsWith(ext))) {
          const content = fs.readFileSync(filePath, 'utf8');
          scanFile(relativePath, content);
        }
      } catch (err) {
        // Skip files we can't read
      }
    });
  } catch (err) {
    // Skip directories we can't read
  }
}

/**
 * Find potential naming convention mismatches
 * e.g., mfn_rate and mfnRate used for the same logical field
 */
function findMismatches() {
  const mismatches = [];

  // Common conversion patterns
  const snakeToCamelMap = {};

  Object.keys(fieldMap.snake_case).forEach(snakeField => {
    // Convert snake_case to camelCase
    const camelField = snakeField.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

    if (fieldMap.camelCase[camelField]) {
      mismatches.push({
        snakeCase: snakeField,
        camelCase: camelField,
        snakeFiles: fieldMap.snake_case[snakeField].files,
        camelFiles: fieldMap.camelCase[camelField].files,
        totalUsage: fieldMap.snake_case[snakeField].count + fieldMap.camelCase[camelField].count
      });
    }
  });

  return mismatches.sort((a, b) => b.totalUsage - a.totalUsage);
}

/**
 * Generate report
 */
function generateReport() {
  const mismatches = findMismatches();

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSnakeCaseFields: Object.keys(fieldMap.snake_case).length,
      totalCamelCaseFields: Object.keys(fieldMap.camelCase).length,
      filesScanned: Object.keys(fieldMap.byFile).length,
      potentialMismatches: mismatches.length
    },
    mismatches: mismatches.slice(0, 50), // Top 50
    snakeCaseFields: Object.keys(fieldMap.snake_case)
      .sort((a, b) => fieldMap.snake_case[b].count - fieldMap.snake_case[a].count)
      .slice(0, 30)
      .map(field => ({
        field,
        count: fieldMap.snake_case[field].count,
        files: fieldMap.snake_case[field].files.slice(0, 5)
      })),
    camelCaseFields: Object.keys(fieldMap.camelCase)
      .sort((a, b) => fieldMap.camelCase[b].count - fieldMap.camelCase[a].count)
      .slice(0, 30)
      .map(field => ({
        field,
        count: fieldMap.camelCase[field].count,
        files: fieldMap.camelCase[field].files.slice(0, 5)
      }))
  };

  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Field Mapping Discovery Tool');
  console.log('=' .repeat(60));
  console.log('Scanning codebase for field access patterns...\n');

  const startTime = Date.now();

  // Scan the codebase
  scanDirectory('./pages');
  scanDirectory('./components');
  scanDirectory('./lib');

  const scanTime = Date.now() - startTime;

  // Generate report
  const report = generateReport();

  // Display results
  console.log(`✅ Scan complete in ${scanTime}ms\n`);
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Snake_case fields found: ${report.summary.totalSnakeCaseFields}`);
  console.log(`CamelCase fields found: ${report.summary.totalCamelCaseFields}`);
  console.log(`Files scanned: ${report.summary.filesScanned}`);
  console.log(`Potential mismatches: ${report.summary.potentialMismatches}\n`);

  if (report.mismatches.length > 0) {
    console.log('⚠️  POTENTIAL FIELD NAMING MISMATCHES');
    console.log('=' .repeat(60));
    report.mismatches.slice(0, 20).forEach((mismatch, idx) => {
      console.log(`\n${idx + 1}. ${mismatch.snakeCase} ↔ ${mismatch.camelCase}`);
      console.log(`   Total usage: ${mismatch.totalUsage} times`);
      console.log(`   Snake_case files: ${mismatch.snakeFiles.slice(0, 3).join(', ')}`);
      console.log(`   CamelCase files: ${mismatch.camelFiles.slice(0, 3).join(', ')}`);
    });
  }

  console.log('\n\n🔝 TOP SNAKE_CASE FIELDS');
  console.log('=' .repeat(60));
  report.snakeCaseFields.slice(0, 15).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.field} (${item.count} uses)`);
  });

  console.log('\n\n🔝 TOP CAMEL_CASE FIELDS');
  console.log('=' .repeat(60));
  report.camelCaseFields.slice(0, 15).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.field} (${item.count} uses)`);
  });

  // Save to file
  fs.writeFileSync(
    config.outputFile,
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log(`\n✅ Full report saved to: ${config.outputFile}`);
}

// Run the scanner
main();
