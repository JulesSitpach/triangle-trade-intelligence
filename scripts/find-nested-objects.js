#!/usr/bin/env node

/**
 * FIND NESTED OBJECTS IN TRANSLATION FILES
 * Identifies conflicting nested structures for flat key approach
 */

const fs = require('fs');

console.log('🔍 FINDING NESTED OBJECTS IN TRANSLATION FILES');
console.log('===============================================\n');

const files = [
  { path: 'public/locales/en/common.json', lang: 'EN' },
  { path: 'public/locales/es/common.json', lang: 'ES' },
  { path: 'public/locales/fr/common.json', lang: 'FR' }
];

files.forEach(file => {
  console.log(`📄 Checking ${file.lang}: ${file.path}`);
  
  try {
    const content = JSON.parse(fs.readFileSync(file.path, 'utf8'));
    const nestedKeys = [];
    
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        nestedKeys.push({
          key,
          nestedKeys: Object.keys(value).length,
          sample: Object.keys(value).slice(0, 3)
        });
      }
    });
    
    if (nestedKeys.length > 0) {
      console.log(`   ❌ Found ${nestedKeys.length} nested objects:`);
      nestedKeys.forEach(nested => {
        console.log(`      "${nested.key}": ${nested.nestedKeys} nested keys (${nested.sample.join(', ')}${nested.nestedKeys > 3 ? '...' : ''})`);
      });
    } else {
      console.log('   ✅ No nested objects found');
    }
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
  }
  
  console.log('');
});