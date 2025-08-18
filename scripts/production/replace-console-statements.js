#!/usr/bin/env node
/**
 * Script to replace console statements with production logger
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Files to process (excluding node_modules and .next)
const patterns = [
  'lib/**/*.js',
  'pages/**/*.js',
  '!node_modules/**',
  '!.next/**',
  '!scripts/**'
];

// Files to skip (already have logger imports or are bootstrap files)
const skipFiles = [
  'lib/production-logger.js',
  'lib/environment-validation.js'
];

// Replacement patterns
const replacements = [
  // Basic console.log replacements
  {
    pattern: /console\.log\('([^']+)'\)/g,
    replacement: "logger.info('$1')"
  },
  {
    pattern: /console\.log\("([^"]+)"\)/g,
    replacement: 'logger.info("$1")'
  },
  {
    pattern: /console\.log\(([^,)]+),\s*([^)]+)\)/g,
    replacement: 'logger.info($1, $2)'
  },
  {
    pattern: /console\.log\(([^)]+)\)/g,
    replacement: 'logger.info($1)'
  },
  
  // console.error replacements
  {
    pattern: /console\.error\('([^']+)',\s*([^)]+)\)/g,
    replacement: "logger.error('$1', $2)"
  },
  {
    pattern: /console\.error\("([^"]+)",\s*([^)]+)\)/g,
    replacement: 'logger.error("$1", $2)'
  },
  {
    pattern: /console\.error\('([^']+)'\)/g,
    replacement: "logger.error('$1')"
  },
  {
    pattern: /console\.error\("([^"]+)"\)/g,
    replacement: 'logger.error("$1")'
  },
  {
    pattern: /console\.error\(([^,)]+),\s*([^)]+)\)/g,
    replacement: 'logger.error($1, $2)'
  },
  {
    pattern: /console\.error\(([^)]+)\)/g,
    replacement: 'logger.error($1)'
  },
  
  // console.warn replacements
  {
    pattern: /console\.warn\('([^']+)',\s*([^)]+)\)/g,
    replacement: "logger.warn('$1', $2)"
  },
  {
    pattern: /console\.warn\("([^"]+)",\s*([^)]+)\)/g,
    replacement: 'logger.warn("$1", $2)'
  },
  {
    pattern: /console\.warn\('([^']+)'\)/g,
    replacement: "logger.warn('$1')"
  },
  {
    pattern: /console\.warn\("([^"]+)"\)/g,
    replacement: 'logger.warn("$1")'
  },
  {
    pattern: /console\.warn\(([^,)]+),\s*([^)]+)\)/g,
    replacement: 'logger.warn($1, $2)'
  },
  {
    pattern: /console\.warn\(([^)]+)\)/g,
    replacement: 'logger.warn($1)'
  },
  
  // console.info replacements
  {
    pattern: /console\.info\('([^']+)',\s*([^)]+)\)/g,
    replacement: "logger.info('$1', $2)"
  },
  {
    pattern: /console\.info\("([^"]+)",\s*([^)]+)\)/g,
    replacement: 'logger.info("$1", $2)'
  },
  {
    pattern: /console\.info\('([^']+)'\)/g,
    replacement: "logger.info('$1')"
  },
  {
    pattern: /console\.info\("([^"]+)"\)/g,
    replacement: 'logger.info("$1")'
  },
  {
    pattern: /console\.info\(([^,)]+),\s*([^)]+)\)/g,
    replacement: 'logger.info($1, $2)'
  },
  {
    pattern: /console\.info\(([^)]+)\)/g,
    replacement: 'logger.info($1)'
  },
  
  // console.debug replacements
  {
    pattern: /console\.debug\('([^']+)',\s*([^)]+)\)/g,
    replacement: "logger.debug('$1', $2)"
  },
  {
    pattern: /console\.debug\("([^"]+)",\s*([^)]+)\)/g,
    replacement: 'logger.debug("$1", $2)'
  },
  {
    pattern: /console\.debug\('([^']+)'\)/g,
    replacement: "logger.debug('$1')"
  },
  {
    pattern: /console\.debug\("([^"]+)"\)/g,
    replacement: 'logger.debug("$1")'
  },
  {
    pattern: /console\.debug\(([^,)]+),\s*([^)]+)\)/g,
    replacement: 'logger.debug($1, $2)'
  },
  {
    pattern: /console\.debug\(([^)]+)\)/g,
    replacement: 'logger.debug($1)'
  }
];

function addLoggerImport(content, filePath) {
  // Check if logger import already exists
  if (content.includes('import { logger }') || content.includes("require('./production-logger')")) {
    return content;
  }
  
  // Skip if file doesn't have console statements
  if (!/(console\.(log|error|warn|info|debug))/.test(content)) {
    return content;
  }
  
  // Determine the correct import path based on file location
  const relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'lib/production-logger.js'));
  const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
  const cleanImportPath = importPath.replace(/\\/g, '/').replace('.js', '');
  
  // Add import after existing imports
  const importLines = [];
  const lines = content.split('\n');
  let importEndIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('require(')) {
      importEndIndex = i + 1;
    } else if (lines[i].trim() === '' && importEndIndex > 0) {
      continue;
    } else if (importEndIndex > 0) {
      break;
    }
  }
  
  const beforeImports = lines.slice(0, importEndIndex);
  const afterImports = lines.slice(importEndIndex);
  
  return [
    ...beforeImports,
    `import { logger } from '${cleanImportPath}.js'`,
    '',
    ...afterImports
  ].join('\n');
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  let updatedContent = content;
  
  // Apply replacements
  let hasChanges = false;
  for (const { pattern, replacement } of replacements) {
    const newContent = updatedContent.replace(pattern, replacement);
    if (newContent !== updatedContent) {
      hasChanges = true;
      updatedContent = newContent;
    }
  }
  
  // Add logger import if needed
  if (hasChanges) {
    updatedContent = addLoggerImport(updatedContent, filePath);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`  ✅ Updated: ${filePath}`);
  } else {
    console.log(`  ⏭️ No changes: ${filePath}`);
  }
}

function main() {
  console.log('🔄 Replacing console statements with production logger...\n');
  
  const allFiles = [];
  for (const pattern of patterns) {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    allFiles.push(...files);
  }
  
  const filesToProcess = allFiles.filter(file => {
    const skipFile = skipFiles.some(skip => file.includes(skip));
    return !skipFile;
  });
  
  console.log(`Found ${filesToProcess.length} files to process\n`);
  
  let processed = 0;
  for (const file of filesToProcess) {
    try {
      processFile(file);
      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n✅ Processed ${processed}/${filesToProcess.length} files`);
  console.log('🎉 Console statement replacement complete!');
}

main();