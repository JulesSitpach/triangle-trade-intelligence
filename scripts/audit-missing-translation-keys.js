#!/usr/bin/env node

/**
 * MISSING TRANSLATION KEYS AUDIT
 * Finds translation keys used in code but missing from translation files
 */

const fs = require('fs')
const path = require('path')

// Translation file paths
const enTranslationsPath = 'public/locales/en/common.json'
const esTranslationsPath = 'public/locales/es/common.json'
const frTranslationsPath = 'public/locales/fr/common.json'

// Pages to audit
const PAGES_TO_AUDIT = [
  'pages/foundation.js',
  'pages/product.js',
  'pages/routing.js',
  'pages/partnership.js',
  'pages/hindsight.js',
  'pages/alerts.js',
  'pages/dashboard-hub.js'
]

function loadTranslations() {
  try {
    const en = fs.existsSync(enTranslationsPath) ? JSON.parse(fs.readFileSync(enTranslationsPath, 'utf8')) : {}
    const es = fs.existsSync(esTranslationsPath) ? JSON.parse(fs.readFileSync(esTranslationsPath, 'utf8')) : {}
    const fr = fs.existsSync(frTranslationsPath) ? JSON.parse(fs.readFileSync(frTranslationsPath, 'utf8')) : {}
    return { en, es, fr }
  } catch (error) {
    console.error('Error loading translations:', error)
    return { en: {}, es: {}, fr: {} }
  }
}

function extractTranslationKeys(content) {
  const keys = new Set()
  
  // Pattern 1: t('key') or t("key")
  const tFunctionPattern = /t\(['"`]([^'"`]+)['"`]\)/g
  let match
  while ((match = tFunctionPattern.exec(content)) !== null) {
    keys.add(match[1])
  }
  
  // Pattern 2: t('key', 'fallback') or t("key", "fallback")
  const tFunctionWithFallbackPattern = /t\(['"`]([^'"`]+)['"`]\s*,\s*['"`][^'"`]*['"`]\)/g
  while ((match = tFunctionWithFallbackPattern.exec(content)) !== null) {
    keys.add(match[1])
  }
  
  // Pattern 3: smartT('key') or smartT("key")
  const smartTPattern = /smartT\(['"`]([^'"`]+)['"`]\)/g
  while ((match = smartTPattern.exec(content)) !== null) {
    keys.add(match[1])
  }
  
  return Array.from(keys)
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

function auditMissingKeys() {
  console.log('🔍 MISSING TRANSLATION KEYS AUDIT')
  console.log('==================================')
  
  const translations = loadTranslations()
  const allMissingKeys = new Set()
  const fileResults = {}
  
  // Audit each page
  PAGES_TO_AUDIT.forEach(filePath => {
    console.log(`\n📄 Auditing: ${filePath}`)
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found`)
      return
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const keysInFile = extractTranslationKeys(content)
      const missingKeys = {
        en: [],
        es: [],
        fr: []
      }
      
      keysInFile.forEach(key => {
        // Check if key exists in each language
        if (!getNestedValue(translations.en, key)) {
          missingKeys.en.push(key)
          allMissingKeys.add(key)
        }
        if (!getNestedValue(translations.es, key)) {
          missingKeys.es.push(key)
          allMissingKeys.add(key)
        }
        if (!getNestedValue(translations.fr, key)) {
          missingKeys.fr.push(key)
          allMissingKeys.add(key)
        }
      })
      
      fileResults[filePath] = {
        totalKeys: keysInFile.length,
        missingKeys,
        allKeys: keysInFile
      }
      
      console.log(`   📊 Total translation keys found: ${keysInFile.length}`)
      console.log(`   ❌ Missing in EN: ${missingKeys.en.length}`)
      console.log(`   ❌ Missing in ES: ${missingKeys.es.length}`)
      console.log(`   ❌ Missing in FR: ${missingKeys.fr.length}`)
      
      if (missingKeys.en.length > 0) {
        console.log(`   🔑 Sample missing EN keys: ${missingKeys.en.slice(0, 3).join(', ')}`)
      }
      
    } catch (error) {
      console.error(`   ❌ Error reading ${filePath}:`, error.message)
    }
  })
  
  // Generate missing keys file
  const missingKeysArray = Array.from(allMissingKeys)
  const missingTranslations = {}
  
  missingKeysArray.forEach(key => {
    // Generate a reasonable fallback for the missing key
    missingTranslations[key] = generateFallbackText(key)
  })
  
  // Save missing keys
  const outputPath = 'scripts/missing-translation-keys-found.json'
  fs.writeFileSync(outputPath, JSON.stringify(missingTranslations, null, 2))
  
  console.log('\n📊 AUDIT SUMMARY')
  console.log('================')
  console.log(`🔑 Unique missing keys found: ${missingKeysArray.length}`)
  console.log(`📁 Files audited: ${Object.keys(fileResults).length}`)
  console.log(`💾 Missing keys saved to: ${outputPath}`)
  
  console.log('\n🔑 TOP MISSING KEYS:')
  missingKeysArray.slice(0, 10).forEach(key => {
    console.log(`   ${key}: "${missingTranslations[key]}"`)
  })
  
  console.log('\n📄 PER-FILE BREAKDOWN:')
  Object.entries(fileResults).forEach(([file, data]) => {
    const fileName = file.split('/').pop()
    console.log(`   ${fileName}: ${data.totalKeys} keys, ${data.missingKeys.en.length} missing EN`)
  })
  
  return {
    totalMissingKeys: missingKeysArray.length,
    missingTranslations,
    fileResults
  }
}

function generateFallbackText(key) {
  // Convert key to human-readable text
  const parts = key.split('.')
  const lastPart = parts[parts.length - 1]
  
  // Handle common patterns
  if (lastPart.includes('title') || lastPart.includes('Title')) {
    return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()
  }
  
  // Convert camelCase to Title Case
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
    .replace(/\b\w/g, l => l.toUpperCase())
}

// Run if called directly
if (require.main === module) {
  auditMissingKeys()
}

module.exports = { auditMissingKeys }