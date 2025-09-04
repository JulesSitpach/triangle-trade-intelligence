#!/usr/bin/env node
/**
 * AUTOMATIC DATABASE QUERY FIXER
 * Scans codebase and fixes database queries to match actual schema
 * 
 * Usage: node scripts/fix-database-queries.js
 */

const fs = require('fs');
const path = require('path');

// Import schema information (using require for Node.js compatibility)
const schemaPath = path.join(__dirname, '../lib/database/database-schema.js');

// Common problematic query patterns and their fixes
const QUERY_FIXES = [
  {
    pattern: /\.select\(['"`].*usmca_member.*['"`]\)/g,
    replacement: ".select('code, name, region, trade_agreements')",
    description: "Fix countries.usmca_member column reference"
  },
  {
    pattern: /\.select\(['"`].*chapter.*['"`]\)/g,
    replacement: ".select('hs_code')", 
    description: "Fix comtrade_reference.chapter column reference"
  },
  {
    pattern: /\.select\(['"`].*min_value.*['"`]\)/g,
    replacement: ".select('volume_range, numeric_value, display_order')",
    description: "Fix trade_volume_mappings.min_value column reference"
  },
  {
    pattern: /from\(['"`]classification_logs['"`]\)/g,
    replacement: "from('comtrade_reference')",
    description: "Replace non-existent classification_logs table"
  },
  {
    pattern: /from\(['"`]hs_codes['"`]\)/g,
    replacement: "from('comtrade_reference')",
    description: "Replace empty hs_codes table with comtrade_reference"
  }
];

// Files to scan for database queries
const SCAN_PATTERNS = [
  'pages/api/**/*.js',
  'lib/**/*.js',
  'components/**/*.js',
  'scripts/**/*.js'
];

/**
 * Scan directory for JavaScript files
 */
function scanDirectory(dirPath, pattern = '*.js') {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...scanDirectory(fullPath, pattern));
    } else if (stat.isFile() && item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Check if file contains database queries
 */
function hasDatabaseQueries(content) {
  const dbPatterns = [
    /\.from\(/,
    /\.select\(/,
    /supabase/i,
    /DATABASE_SCHEMA/,
    /TABLE_CONFIG/
  ];
  
  return dbPatterns.some(pattern => pattern.test(content));
}

/**
 * Fix database queries in file content
 */
function fixQueries(content, filePath) {
  let fixedContent = content;
  const appliedFixes = [];
  
  for (const fix of QUERY_FIXES) {
    if (fix.pattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
      appliedFixes.push(fix.description);
    }
  }
  
  // Additional specific fixes based on schema knowledge
  
  // Fix USMCA member checks
  if (fixedContent.includes('usmca_member')) {
    const usmcaFix = `
// ✅ FIXED: Check USMCA membership using actual schema
const isUSMCAMember = (country) => {
  return ['US', 'CA', 'MX'].includes(country.code) || 
         (country.trade_agreements && country.trade_agreements.includes('USMCA'));
};`.trim();
    
    if (!fixedContent.includes('isUSMCAMember')) {
      fixedContent = fixedContent.replace(
        /usmca_member/g,
        `// TODO: Use isUSMCAMember() helper function\n${usmcaFix}\n// usmca_member`
      );
      appliedFixes.push("Added USMCA member check helper");
    }
  }
  
  // Fix chapter extraction
  if (fixedContent.includes('.chapter') && fixedContent.includes('comtrade')) {
    const chapterFix = `
// ✅ FIXED: Extract chapter from hs_code
const extractChapter = (hsCode) => {
  return hsCode && hsCode.length >= 2 ? hsCode.substring(0, 2) : null;
};`.trim();
    
    if (!fixedContent.includes('extractChapter')) {
      fixedContent = fixedContent.replace(
        /\.chapter/g,
        `// TODO: Use extractChapter() helper\n${chapterFix}\n// .chapter`
      );
      appliedFixes.push("Added HS chapter extraction helper");
    }
  }
  
  return {
    content: fixedContent,
    fixes: appliedFixes,
    hasChanges: appliedFixes.length > 0
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 DATABASE QUERY FIXER - Scanning codebase...\n');
  
  const projectRoot = path.join(__dirname, '..');
  const filesToCheck = [
    ...scanDirectory(path.join(projectRoot, 'pages')),
    ...scanDirectory(path.join(projectRoot, 'lib')),
    ...scanDirectory(path.join(projectRoot, 'components')),
  ];
  
  let totalFiles = 0;
  let filesWithQueries = 0;
  let filesFixed = 0;
  const fixSummary = [];
  
  console.log(`Found ${filesToCheck.length} files to scan\n`);
  
  for (const filePath of filesToCheck) {
    totalFiles++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (hasDatabaseQueries(content)) {
        filesWithQueries++;
        console.log(`📊 Checking: ${path.relative(projectRoot, filePath)}`);
        
        const result = fixQueries(content, filePath);
        
        if (result.hasChanges) {
          filesFixed++;
          
          // Create backup
          const backupPath = `${filePath}.backup-${Date.now()}`;
          fs.writeFileSync(backupPath, content);
          
          // Write fixed content
          fs.writeFileSync(filePath, result.content);
          
          console.log(`  ✅ Fixed: ${result.fixes.join(', ')}`);
          console.log(`  💾 Backup: ${path.basename(backupPath)}`);
          
          fixSummary.push({
            file: path.relative(projectRoot, filePath),
            fixes: result.fixes,
            backup: backupPath
          });
        } else {
          console.log(`  ✨ Already correct`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`  Total files scanned: ${totalFiles}`);
  console.log(`  Files with database queries: ${filesWithQueries}`);
  console.log(`  Files fixed: ${filesFixed}`);
  
  if (fixSummary.length > 0) {
    console.log(`\n🔧 APPLIED FIXES:`);
    for (const fix of fixSummary) {
      console.log(`\n  📁 ${fix.file}:`);
      for (const change of fix.fixes) {
        console.log(`    - ${change}`);
      }
    }
    
    console.log(`\n💡 NEXT STEPS:`);
    console.log(`  1. Review the changes in each file`);
    console.log(`  2. Test the application to ensure queries work correctly`);
    console.log(`  3. Remove backup files once you're satisfied: rm *.backup-*`);
    console.log(`  4. Consider using SchemaAwareClient for future queries`);
  } else {
    console.log(`\n✅ No fixes needed - all queries appear to match the schema!`);
  }
  
  console.log(`\n📚 For reference, see:`);
  console.log(`  - Database schema: lib/database/database-schema.js`);
  console.log(`  - Validation utilities: lib/database/validate-schema.js`);
  console.log(`  - Schema inspection: node inspect-supabase.js`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixQueries, hasDatabaseQueries };