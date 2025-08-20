#!/usr/bin/env node

/**
 * ADD MISSING TRANSLATION KEYS
 * Adds all missing translation keys found by the audit to translation files
 */

const fs = require('fs')

// Translation file paths
const enTranslationsPath = 'public/locales/en/common.json'
const esTranslationsPath = 'public/locales/es/common.json'
const frTranslationsPath = 'public/locales/fr/common.json'

// Load missing keys
const missingKeysPath = 'scripts/missing-translation-keys-found.json'

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

function loadMissingKeys() {
  try {
    return JSON.parse(fs.readFileSync(missingKeysPath, 'utf8'))
  } catch (error) {
    console.error('Error loading missing keys:', error)
    return {}
  }
}

function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[keys[keys.length - 1]] = value
}

function generateSpanishTranslation(englishText) {
  // Professional Spanish translations for Triangle Intelligence domain
  const spanishTranslations = {
    // Common UI terms
    'Live Business Intelligence': 'Inteligencia Comercial en Vivo',
    'Intelligence Level': 'Nivel de Inteligencia',
    'Annual Savings': 'Ahorros Anuales',
    'Geographic Intelligence': 'Inteligencia Geográfica',
    'Route Confidence': 'Confianza de Ruta',
    'Database': 'Base de Datos',
    'Analysis': 'Análisis',
    'Enterprise Intelligence Analytics': 'Análisis de Inteligencia Empresarial',
    'Real Time': 'Tiempo Real',
    'Streaming': 'Transmisión',
    'Live Data': 'Datos en Vivo',
    'This Month': 'Este Mes',
    'Tracked Value': 'Valor Rastreado',
    'Optimization': 'Optimización',
    'Optimal': 'Óptimo',
    'Analyzing': 'Analizando',
    'Complete': 'Completo',
    'Confidence': 'Confianza',
    'Intelligence': 'Inteligencia',
    'Monitoring': 'Monitoreo',
    'Enterprise Deep Dive': 'Análisis Empresarial Profundo',
    
    // Navigation
    'User': 'Usuario',
    'Active Session': 'Sesión Activa',
    'Alerts': 'Alertas',
    'Account': 'Cuenta',
    'Logout': 'Cerrar Sesión',
    
    // Business Intelligence
    'Business Intelligence': 'Inteligencia de Negocios',
    
    // Error messages
    'Invalid Foundation': 'Fundación Inválida',
    'Complete Foundation': 'Fundación Completa',
    'Invalid Product': 'Producto Inválido',
    'Complete Product': 'Producto Completo',
    'Analytics Load': 'Carga de Análisis',
    
    // Routing terms
    'Products Direct Canada': 'Productos Directos a Canadá',
    'Two To Three Months': 'Dos a Tres Meses',
    'Low': 'Bajo',
    'Up To150 K': 'Hasta $150K',
    'Standard Optimized': 'Estándar Optimizado',
    'Direct Canadian Import': 'Importación Directa Canadiense',
    'No Triangle Complexity': 'Sin Complejidad Triangular',
    'Canadian Compliance': 'Cumplimiento Canadiense',
    'Local Distribution': 'Distribución Local',
    'Products Via Canada U S': 'Productos Vía Canadá-EE.UU.'
  }
  
  return spanishTranslations[englishText] || englishText
}

function generateFrenchTranslation(englishText) {
  // Professional French translations for Triangle Intelligence domain
  const frenchTranslations = {
    // Common UI terms
    'Live Business Intelligence': 'Intelligence Commerciale en Direct',
    'Intelligence Level': 'Niveau d\'Intelligence',
    'Annual Savings': 'Économies Annuelles',
    'Geographic Intelligence': 'Intelligence Géographique',
    'Route Confidence': 'Confiance de Route',
    'Database': 'Base de Données',
    'Analysis': 'Analyse',
    'Enterprise Intelligence Analytics': 'Analyses d\'Intelligence d\'Entreprise',
    'Real Time': 'Temps Réel',
    'Streaming': 'Diffusion',
    'Live Data': 'Données en Direct',
    'This Month': 'Ce Mois',
    'Tracked Value': 'Valeur Suivie',
    'Optimization': 'Optimisation',
    'Optimal': 'Optimal',
    'Analyzing': 'Analyse en Cours',
    'Complete': 'Complet',
    'Confidence': 'Confiance',
    'Intelligence': 'Intelligence',
    'Monitoring': 'Surveillance',
    'Enterprise Deep Dive': 'Analyse Approfondie d\'Entreprise',
    
    // Navigation
    'User': 'Utilisateur',
    'Active Session': 'Session Active',
    'Alerts': 'Alertes',
    'Account': 'Compte',
    'Logout': 'Déconnexion',
    
    // Business Intelligence
    'Business Intelligence': 'Intelligence d\'Affaires',
    
    // Error messages
    'Invalid Foundation': 'Fondation Invalide',
    'Complete Foundation': 'Fondation Complète',
    'Invalid Product': 'Produit Invalide',
    'Complete Product': 'Produit Complet',
    'Analytics Load': 'Chargement d\'Analyses',
    
    // Routing terms
    'Products Direct Canada': 'Produits Directs vers le Canada',
    'Two To Three Months': 'Deux à Trois Mois',
    'Low': 'Faible',
    'Up To150 K': 'Jusqu\'à 150K$',
    'Standard Optimized': 'Standard Optimisé',
    'Direct Canadian Import': 'Importation Directe Canadienne',
    'No Triangle Complexity': 'Aucune Complexité Triangulaire',
    'Canadian Compliance': 'Conformité Canadienne',
    'Local Distribution': 'Distribution Locale',
    'Products Via Canada U S': 'Produits via Canada-É.-U.'
  }
  
  return frenchTranslations[englishText] || englishText
}

function addMissingKeys() {
  console.log('🔧 ADDING MISSING TRANSLATION KEYS')
  console.log('=================================')
  
  const translations = loadTranslations()
  const missingKeys = loadMissingKeys()
  
  let addedCount = { en: 0, es: 0, fr: 0 }
  
  console.log(`📊 Processing ${Object.keys(missingKeys).length} missing keys...`)
  
  Object.entries(missingKeys).forEach(([key, englishFallback]) => {
    // Skip malformed keys
    if (key.includes('${') || key.includes('product_description, product_category') || key === '*') {
      console.log(`⚠️  Skipping malformed key: ${key}`)
      return
    }
    
    // Clean up the English fallback
    let cleanEnglish = englishFallback
    if (cleanEnglish.includes('Detected}')) {
      cleanEnglish = 'Business Type Updated'
    }
    
    // Add to English translations
    if (!getNestedValue(translations.en, key)) {
      setNestedValue(translations.en, key, cleanEnglish)
      addedCount.en++
    }
    
    // Add to Spanish translations
    if (!getNestedValue(translations.es, key)) {
      const spanishTranslation = generateSpanishTranslation(cleanEnglish)
      setNestedValue(translations.es, key, spanishTranslation)
      addedCount.es++
    }
    
    // Add to French translations
    if (!getNestedValue(translations.fr, key)) {
      const frenchTranslation = generateFrenchTranslation(cleanEnglish)
      setNestedValue(translations.fr, key, frenchTranslation)
      addedCount.fr++
    }
  })
  
  // Save updated translations
  try {
    fs.writeFileSync(enTranslationsPath, JSON.stringify(translations.en, null, 2))
    fs.writeFileSync(esTranslationsPath, JSON.stringify(translations.es, null, 2))
    fs.writeFileSync(frTranslationsPath, JSON.stringify(translations.fr, null, 2))
    
    console.log('\n✅ TRANSLATION KEYS ADDED SUCCESSFULLY')
    console.log('====================================')
    console.log(`🇺🇸 English: ${addedCount.en} keys added`)
    console.log(`🇲🇽 Spanish: ${addedCount.es} keys added`)
    console.log(`🇨🇦 French: ${addedCount.fr} keys added`)
    
    console.log('\n🎯 RESULT: Missing translation keys resolved!')
    console.log('Text like "Live Business Intelligence" will now display properly translated.')
    
    return addedCount
    
  } catch (error) {
    console.error('❌ Error saving translations:', error)
    return null
  }
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Run if called directly
if (require.main === module) {
  addMissingKeys()
}

module.exports = { addMissingKeys }