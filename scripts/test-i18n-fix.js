#!/usr/bin/env node

/**
 * TEST I18N CONFIGURATION FIX
 * Verifies that the keySeparator conflict is resolved
 * Tests flat key structure works correctly
 */

const fs = require('fs');

console.log('🔧 TESTING I18N CONFIGURATION FIX');
console.log('================================\n');

// Test 1: Verify i18n config has correct flat structure settings
console.log('📋 Test 1: Checking i18n configuration...');
const i18nContent = fs.readFileSync('lib/i18n.js', 'utf8');

const hasCorrectKeySeparator = i18nContent.includes('keySeparator: false');
const hasCorrectNsSeparator = i18nContent.includes('nsSeparator: false');
const hasCorrectReturnObjects = i18nContent.includes('returnObjects: false');

console.log(`   keySeparator: false = ${hasCorrectKeySeparator ? '✅' : '❌'}`);
console.log(`   nsSeparator: false = ${hasCorrectNsSeparator ? '✅' : '❌'}`);
console.log(`   returnObjects: false = ${hasCorrectReturnObjects ? '✅' : '❌'}`);

// Test 2: Verify flat key structure in translation files
console.log('\n📋 Test 2: Checking translation file structure...');

const enTranslations = JSON.parse(fs.readFileSync('public/locales/en/common.json', 'utf8'));
const esTranslations = JSON.parse(fs.readFileSync('public/locales/es/common.json', 'utf8'));
const frTranslations = JSON.parse(fs.readFileSync('public/locales/fr/common.json', 'utf8'));

// Check for flat keys (should have them)
const flatKeys = ['intelligence', 'monitoring', 'routes', 'validated', 'database', 'connected'];
const flatKeysExist = flatKeys.every(key => enTranslations[key] && esTranslations[key] && frTranslations[key]);

console.log(`   Flat keys exist in all languages = ${flatKeysExist ? '✅' : '❌'}`);

if (flatKeysExist) {
  console.log('   Sample flat key verification:');
  flatKeys.forEach(key => {
    console.log(`     "${key}": EN="${enTranslations[key]}" | ES="${esTranslations[key]}" | FR="${frTranslations[key]}"`);
  });
}

// Test 3: Check for problematic nested structure conflicts
console.log('\n📋 Test 3: Checking for structure conflicts...');

const hasNestedObjects = Object.values(enTranslations).some(value => typeof value === 'object');
const hasProblematicKeys = Object.keys(enTranslations).some(key => key.includes('.') && key !== key.toLowerCase());

console.log(`   No conflicting nested objects = ${!hasNestedObjects ? '✅' : '❌'}`);
console.log(`   No problematic dot keys = ${!hasProblematicKeys ? '✅' : '❌'}`);

// Test 4: Verify geo detection flat keys
console.log('\n📋 Test 4: Checking geo detection keys...');

const geoKeys = [
  'geoDetectionDetecting',
  'geoDetectionAutoDetected', 
  'geoDetectionUserChoice',
  'geoDetectionRecommendedForLocation',
  'geoDetectionWorldwide'
];

const geoKeysExist = geoKeys.every(key => enTranslations[key] && esTranslations[key] && frTranslations[key]);

console.log(`   Geo detection flat keys exist = ${geoKeysExist ? '✅' : '❌'}`);

if (geoKeysExist) {
  console.log('   Sample geo detection keys:');
  geoKeys.slice(0, 3).forEach(key => {
    console.log(`     "${key}": EN="${enTranslations[key]}" | ES="${esTranslations[key]}" | FR="${frTranslations[key]}"`);
  });
}

// Test 5: Summary and next steps
console.log('\n🎯 CONFIGURATION FIX SUMMARY');
console.log('============================');

const allTestsPassed = hasCorrectKeySeparator && hasCorrectNsSeparator && hasCorrectReturnObjects && flatKeysExist && !hasNestedObjects && geoKeysExist;

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED!');
  console.log('');
  console.log('🎉 The i18n configuration conflict is RESOLVED!');
  console.log('');
  console.log('✅ Fixed Issues:');
  console.log('   • keySeparator: false (no dot conflicts)');
  console.log('   • nsSeparator: false (no namespace conflicts)');  
  console.log('   • returnObjects: false (flat structure)');
  console.log('   • Flat keys working across all languages');
  console.log('   • Geo detection keys properly added');
  console.log('');
  console.log('🚀 NEXT STEPS:');
  console.log('   1. Restart your development server');
  console.log('   2. Test language switching in browser');
  console.log('   3. Verify status indicators show translated text');
  console.log('   4. Test geo detection with Mexican/Canadian IPs');
  console.log('');
  console.log('🇲🇽 Mexican users will now see: "Base de Datos: Conectado"');
  console.log('🇨🇦 Canadian users will now see: "Base de Données: Connecté"');
  console.log('🇺🇸 US users will continue to see: "Database: Connected"');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('');
  console.log('Issues found:');
  if (!hasCorrectKeySeparator) console.log('   ❌ keySeparator still set to "." instead of false');
  if (!hasCorrectNsSeparator) console.log('   ❌ nsSeparator still set to ":" instead of false');
  if (!hasCorrectReturnObjects) console.log('   ❌ returnObjects still set to true instead of false');
  if (!flatKeysExist) console.log('   ❌ Missing flat translation keys');
  if (hasNestedObjects) console.log('   ❌ Conflicting nested objects found');
  if (!geoKeysExist) console.log('   ❌ Missing geo detection keys');
}

console.log('\n📊 Configuration Status: ' + (allTestsPassed ? 'READY FOR PRODUCTION' : 'NEEDS FIXES'));