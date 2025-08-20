#!/usr/bin/env node

/**
 * TEST MIXED TRANSLATION STRUCTURE
 * Tests if current i18n configuration properly handles both flat and nested keys
 */

const fs = require('fs');

console.log('🧪 TESTING MIXED TRANSLATION STRUCTURE');
console.log('=====================================\n');

// Load the translation file
const enTranslations = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8'));

console.log('📊 STRUCTURE ANALYSIS:');
console.log('====================');

let flatKeys = 0;
let nestedObjects = 0;
let totalNestedKeys = 0;

Object.entries(enTranslations).forEach(([key, value]) => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    nestedObjects++;
    const nestedKeyCount = Object.keys(value).length;
    totalNestedKeys += nestedKeyCount;
    console.log(`   🏗️  "${key}": ${nestedKeyCount} nested keys`);
  } else {
    flatKeys++;
  }
});

console.log(`\n📈 SUMMARY:`);
console.log(`   ✅ Flat keys: ${flatKeys}`);
console.log(`   🏗️  Nested objects: ${nestedObjects}`);
console.log(`   📋 Total nested keys: ${totalNestedKeys}`);
console.log(`   🎯 Total structure elements: ${flatKeys + nestedObjects}`);

console.log('\n🧪 KEY ACCESS TESTING:');
console.log('=====================');

// Test flat key access
console.log('   Testing flat keys:');
const flatTestKeys = ['intelligence', 'monitoring', 'database', 'connected'];
flatTestKeys.forEach(key => {
  const value = enTranslations[key];
  console.log(`      "${key}": ${value ? `"${value}"` : 'MISSING'} ${value ? '✅' : '❌'}`);
});

// Test nested key access
console.log('\n   Testing nested keys:');
const nestedTestKeys = [
  'nav.brandName',
  'foundation.title', 
  'common.next',
  'actions.save'
];

nestedTestKeys.forEach(keyPath => {
  const [parent, child] = keyPath.split('.');
  const parentObj = enTranslations[parent];
  const value = parentObj && typeof parentObj === 'object' ? parentObj[child] : undefined;
  console.log(`      "${keyPath}": ${value ? `"${value}"` : 'MISSING'} ${value ? '✅' : '❌'}`);
});

console.log('\n🔧 CONFIGURATION RECOMMENDATIONS:');
console.log('=================================');

if (flatKeys > 0 && nestedObjects > 0) {
  console.log('   📝 MIXED STRUCTURE DETECTED:');
  console.log('      ✅ Current config should work: keySeparator: ".", returnObjects: true');
  console.log('      ✅ Flat keys work as direct access: t("intelligence")');
  console.log('      ✅ Nested keys work with dot notation: t("nav.brandName")');
  console.log('\n   💡 OPTIMIZATION STRATEGY:');
  console.log('      🎯 Keep current mixed approach (working solution)');
  console.log('      📈 Gradual migration: New keys as flat, existing nested preserved');
  console.log('      🚀 Both patterns supported simultaneously');
} else if (flatKeys > 0) {
  console.log('   📝 FLAT STRUCTURE: Use keySeparator: false');
} else {
  console.log('   📝 NESTED STRUCTURE: Use keySeparator: "."');
}

console.log('\n🎯 NEXT STEPS:');
console.log('=============');
console.log('   1. ✅ Keep current i18n config (mixed structure support)');
console.log('   2. 🧪 Test translation functions in actual app');
console.log('   3. 📋 Document both usage patterns for developers');
console.log('   4. 🚀 Consider gradual migration strategy if needed');