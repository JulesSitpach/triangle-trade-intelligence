#!/usr/bin/env node

/**
 * AUTOMATED HARDCODED TEXT AUDIT SCRIPT
 * Scans core Triangle Intelligence pages for hardcoded English text
 * Target pages: /foundation → /product → /routing → /partnership → /hindsight → /alerts → /dashboard-hub
 */

const fs = require('fs')
const path = require('path')

// Core pages to audit
const CORE_PAGES = [
  'pages/foundation.js',
  'pages/product.js', 
  'pages/routing.js',
  'pages/partnership.js',
  'pages/hindsight.js',
  'pages/alerts.js',
  'pages/dashboard-hub.js'
]

// Patterns to find hardcoded English text
const HARDCODE_PATTERNS = [
  // JSX text content between tags
  />\s*([A-Z][a-zA-Z\s]{3,})\s*</g,
  
  // String literals in JSX attributes
  /(title|placeholder|alt|aria-label)=["']([A-Z][a-zA-Z\s]{3,})["']/g,
  
  // Text in template literals
  /`([A-Z][a-zA-Z\s]{3,})`/g,
  
  // Hardcoded strings in variables
  /const\s+\w+\s*=\s*["']([A-Z][a-zA-Z\s]{3,})["']/g,
  
  // Button/link text
  /(button|Button|Link).*>([A-Z][a-zA-Z\s]{3,})<\//g,
  
  // Console.log and alert strings
  /(console\.log|alert)\(["']([A-Z][a-zA-Z\s]{3,})["']\)/g
]

// Text that should be ignored (already translated or system text)
const IGNORE_PATTERNS = [
  /^(Triangle Intelligence|PRO v\d+\.\d+)$/,
  /^(USD|CAD|MX|US|CA|CN|JP|KR|IN|VN|TH|MY)$/,
  /^(HS|USMCA|API|JSON|HTTP|GET|POST)$/,
  /^(\d+[\w\s]*|\$[\d,]+)$/,
  /^(Loading\.\.\.|Searching\.\.\.|Processing\.\.\.)$/,
  /className|style|href|src|id/,
  /^[A-Z_]+$/, // ALL_CAPS constants
  /^\w+\(\)$/, // Function calls
]

function shouldIgnoreText(text) {
  if (!text || text.length < 4) return true
  
  return IGNORE_PATTERNS.some(pattern => {
    if (typeof pattern === 'string') {
      return text.includes(pattern)
    }
    return pattern.test(text)
  })
}

function auditFile(filePath) {
  console.log(`\n🔍 Auditing: ${filePath}`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`   ❌ File not found`)
    return { found: [], missing: true }
  }
  
  const content = fs.readFileSync(filePath, 'utf8')
  const found = []
  
  // Check each pattern
  HARDCODE_PATTERNS.forEach((pattern, index) => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const text = match[2] || match[1] // Get captured group
      const line = content.substring(0, match.index).split('\n').length
      
      if (!shouldIgnoreText(text)) {
        found.push({
          text,
          line,
          pattern: index,
          context: match[0]
        })
      }
    }
    // Reset regex lastIndex
    pattern.lastIndex = 0
  })
  
  // Remove duplicates
  const unique = found.filter((item, index, self) => 
    index === self.findIndex(t => t.text === item.text)
  )
  
  console.log(`   📊 Found ${unique.length} hardcoded text instances`)
  unique.forEach(item => {
    console.log(`      Line ${item.line}: "${item.text}"`)
  })
  
  return { found: unique, missing: false }
}

function generateTranslationKeys(hardcodedText, pageName) {
  const keys = []
  const pagePrefix = pageName.replace('.js', '').replace('dashboard-hub', 'dashboard')
  
  hardcodedText.forEach(item => {
    const text = item.text.trim()
    
    // Generate semantic key based on text content
    let keyName = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
    
    // Create semantic key name
    if (keyName.includes('title') || text.length > 30) {
      keyName = 'title'
    } else if (keyName.includes('subtitle') || keyName.includes('description')) {
      keyName = 'subtitle'
    } else if (keyName.includes('button') || keyName.includes('click') || keyName.includes('get started')) {
      keyName = 'getStarted'
    } else if (keyName.includes('continue') || keyName.includes('next')) {
      keyName = 'continue'
    } else if (keyName.includes('back') || keyName.includes('previous')) {
      keyName = 'back'
    } else if (keyName.includes('loading') || keyName.includes('processing')) {
      keyName = 'loading'
    } else if (keyName.includes('analysis') || keyName.includes('analyze')) {
      keyName = 'analysis'
    } else if (keyName.includes('save') || keyName.includes('savings')) {
      keyName = 'savings'
    } else {
      // Create key from first few words
      keyName = keyName.split(' ').slice(0, 3).join('')
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20)
    }
    
    const fullKey = `${pagePrefix}.${keyName}`
    
    keys.push({
      key: fullKey,
      value: text,
      line: item.line,
      context: item.context
    })
  })
  
  return keys
}

function main() {
  console.log('🚀 TRIANGLE INTELLIGENCE - HARDCODED TEXT AUDIT')
  console.log('===============================================')
  
  const allFindings = []
  const missingFiles = []
  
  // Audit each core page
  CORE_PAGES.forEach(pagePath => {
    const result = auditFile(pagePath)
    
    if (result.missing) {
      missingFiles.push(pagePath)
    } else {
      const pageName = path.basename(pagePath)
      const translationKeys = generateTranslationKeys(result.found, pageName)
      
      allFindings.push({
        page: pagePath,
        hardcoded: result.found,
        translationKeys
      })
    }
  })
  
  // Generate summary report
  console.log('\n📊 AUDIT SUMMARY')
  console.log('=================')
  
  const totalHardcoded = allFindings.reduce((sum, page) => sum + page.hardcoded.length, 0)
  console.log(`📄 Pages audited: ${CORE_PAGES.length - missingFiles.length}/${CORE_PAGES.length}`)
  console.log(`🔤 Total hardcoded text found: ${totalHardcoded}`)
  console.log(`🗝️ Translation keys needed: ${allFindings.reduce((sum, page) => sum + page.translationKeys.length, 0)}`)
  
  if (missingFiles.length > 0) {
    console.log(`\n❌ Missing files:`)
    missingFiles.forEach(file => console.log(`   ${file}`))
  }
  
  // Generate translation key additions for JSON files
  console.log('\n🔧 GENERATED TRANSLATION KEYS')
  console.log('==============================')
  
  const translationEntries = {}
  
  allFindings.forEach(pageData => {
    console.log(`\n📄 ${pageData.page}:`)
    
    pageData.translationKeys.forEach(item => {
      console.log(`   ${item.key}: "${item.value}"`)
      translationEntries[item.key] = item.value
    })
  })
  
  // Save translation keys to file
  const outputPath = 'scripts/missing-translations.json'
  fs.writeFileSync(outputPath, JSON.stringify(translationEntries, null, 2))
  console.log(`\n💾 Translation keys saved to: ${outputPath}`)
  
  // Performance recommendations
  console.log('\n⚡ OPTIMIZATION RECOMMENDATIONS')
  console.log('================================')
  console.log(`1. Replace ${totalHardcoded} hardcoded text instances with smartT() calls`)
  console.log(`2. Add ${Object.keys(translationEntries).length} new translation keys to JSON files`)
  console.log(`3. Estimated time savings: ${Math.ceil(totalHardcoded * 0.5)} hours vs manual work`)
  console.log(`4. Translation coverage will increase by ~${Math.round(totalHardcoded / 10)}%`)
  
  return {
    totalHardcoded,
    translationKeys: translationEntries,
    pagesAudited: CORE_PAGES.length - missingFiles.length,
    timeSavings: Math.ceil(totalHardcoded * 0.5)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { main, auditFile, generateTranslationKeys }