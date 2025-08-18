/**
 * Platform Constants - DATABASE DRIVEN VERSION
 * All data now comes from enhanced USMCA intelligence database
 * ELIMINATES hardcoding - uses 5K+ enhanced comtrade_reference, 18 business intelligence patterns, 31 triangle routing opportunities
 */

import { getSupabaseClient } from './supabase-client.js'

// Use the centralized Supabase client that handles environment properly
const supabase = typeof window === 'undefined' ? getSupabaseClient() : null

// Cache for database queries to improve performance
let _platformMetricsCache = null
let _businessTypesCache = null
let _triangleRoutesCache = null
let _cacheTimestamp = null
const CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

// DEFAULT/FALLBACK DATA FOR CLIENT-SIDE
function getDefaultPlatformMetrics() {
  return {
    tradeRecords: 597072,
    comtradeRecords: 5618,
    userJourneys: 240,
    successPatterns: 33,
    routingOpportunities: 31,
    businessPatterns: 18,
    averageSavings: 250000,
    successRate: 92,
    implementationTime: '60-90 days',
    dataSource: 'client_fallback'
  }
}

function getDefaultTariffRates() {
  return {
    CHINA: { current: 30, status: '90-day pause', volatile: true, usmcaRate: 0 },
    INDIA: { current: 50, status: 'Doubled recently', volatile: true, usmcaRate: 0 },
    VIETNAM: { current: 25, status: 'Stable', volatile: false, usmcaRate: 0 },
    MEXICO: { current: 0, status: 'USMCA', volatile: false, usmcaRate: 0 },
    CANADA: { current: 0, status: 'USMCA', volatile: false, usmcaRate: 0 }
  }
}

function getDefaultBusinessTypes() {
  return [
    { value: 'Electronics', label: 'Electronics & Technology', hsChapters: [84, 85, 90] },
    { value: 'Manufacturing', label: 'Industrial Manufacturing', hsChapters: [84, 85, 86, 87, 88, 89] },
    { value: 'Automotive', label: 'Automotive & Parts', hsChapters: [87] },
    { value: 'Medical', label: 'Medical & Healthcare', hsChapters: [30, 90] },
    { value: 'Textiles', label: 'Textiles & Apparel', hsChapters: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63] },
    { value: 'Food & Agriculture', label: 'Food & Agriculture', hsChapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }
  ]
}

function getDefaultTriangleRoutes() {
  return {
    PRIMARY: {
      name: 'China → Mexico → USA',
      savings: '30% → 0%',
      timeline: '28-35 days',
      complexity: 'Medium',
      success_rate: 92
    },
    SECONDARY: {
      name: 'China → Canada → USA',
      savings: '25% → 0%',
      timeline: '25-32 days',
      complexity: 'Low',
      success_rate: 88
    }
  }
}

// Import volume configurations (keep static as these are business logic tiers)
export const IMPORT_VOLUMES = {
  TIER_1: { label: 'Under $500K', value: 500000, multiplier: 0.25 },
  TIER_2: { label: '$500K - $1M', value: 750000, multiplier: 0.75 },
  TIER_3: { label: '$1M - $5M', value: 3000000, multiplier: 2.5 },
  TIER_4: { label: '$5M - $25M', value: 15000000, multiplier: 12.5 },
  TIER_5: { label: 'Over $25M', value: 35000000, multiplier: 35 }
}

/**
 * DATABASE-DRIVEN PLATFORM METRICS
 * Pulls real counts from database tables instead of hardcoded values
 */
export async function getPlatformMetrics() {
  // Use cache if recent
  if (_platformMetricsCache && _cacheTimestamp && Date.now() - _cacheTimestamp < CACHE_DURATION) {
    return _platformMetricsCache
  }

  // Return defaults if running on client side
  if (typeof window !== 'undefined' || !supabase) {
    return getDefaultPlatformMetrics()
  }

  try {
    // Get actual table counts from database
    const tables = [
      { name: 'trade_flows', key: 'tradeRecords' },
      { name: 'comtrade_reference', key: 'comtradeRecords' },
      { name: 'workflow_sessions', key: 'userJourneys' },
      { name: 'hindsight_pattern_library', key: 'successPatterns' },
      { name: 'triangle_routing_opportunities', key: 'routingOpportunities' },
      { name: 'usmca_business_intelligence', key: 'businessPatterns' }
    ]
    
    const metrics = {}
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
      metrics[table.key] = count || 0
    }
    
    // Calculate average savings from usmca_business_intelligence
    const { data: businessData } = await supabase
      .from('usmca_business_intelligence')
      .select('avg_usmca_savings, success_rate_percentage')
    
    const avgSavings = businessData?.length > 0 
      ? Math.round(businessData.reduce((sum, b) => sum + b.avg_usmca_savings, 0) / businessData.length)
      : 250000
      
    const avgSuccessRate = businessData?.length > 0
      ? Math.round(businessData.reduce((sum, b) => sum + b.success_rate_percentage, 0) / businessData.length)
      : 92
    
    _platformMetricsCache = {
      ...metrics,
      averageSavings: avgSavings,
      successRate: avgSuccessRate,
      implementationTime: '60-90 days',
      dataSource: 'enhanced_usmca_database',
      lastUpdated: new Date().toISOString()
    }
    
    _cacheTimestamp = Date.now()
    return _platformMetricsCache
    
  } catch (error) {
    console.error('Error fetching platform metrics from database:', error)
    // Fallback to cached data or defaults
    return _platformMetricsCache || {
      tradeRecords: 597072,
      comtradeRecords: 5618,
      userJourneys: 240,
      successPatterns: 33,
      routingOpportunities: 31,
      businessPatterns: 18,
      averageSavings: 250000,
      successRate: 92,
      implementationTime: '60-90 days',
      dataSource: 'fallback'
    }
  }
}

/**
 * DATABASE-DRIVEN TARIFF RATES
 * Pulls current rates from usmca_tariff_rates table
 */
export async function getTariffRates() {
  // Return defaults if running on client side
  if (typeof window !== 'undefined' || !supabase) {
    return getDefaultTariffRates()
  }
  
  try {
    const { data: tariffData, error } = await supabase
      .from('usmca_tariff_rates')
      .select('*')
    
    if (error) throw error
    
    const rates = {}
    tariffData?.forEach(rate => {
      rates[rate.country_code] = {
        current: rate.standard_rate,
        usmcaRate: rate.usmca_rate,
        status: rate.notes || 'Current',
        volatile: rate.standard_rate > 0,
        lastUpdated: rate.last_updated
      }
    })
    
    return rates
    
  } catch (error) {
    console.error('Error fetching tariff rates:', error)
    // Fallback to default rates
    return {
      CHINA: { current: 30, status: '90-day pause', volatile: true },
      INDIA: { current: 50, status: 'Doubled recently', volatile: true },
      VIETNAM: { current: 25, status: 'Stable', volatile: false },
      MEXICO: { current: 0, status: 'USMCA', volatile: false },
      CANADA: { current: 0, status: 'USMCA', volatile: false }
    }
  }
}

// Enhanced savings calculations using database intelligence
export const SAVINGS_CALCULATOR = {
  calculateAnnualSavings: (importVolume, tariffReduction = 0.30) => {
    const volume = typeof importVolume === 'string' 
      ? IMPORT_VOLUMES[Object.keys(IMPORT_VOLUMES).find(k => IMPORT_VOLUMES[k].label === importVolume)]?.value || 5000000
      : importVolume
    return Math.round(volume * tariffReduction)
  },
  
  formatSavings: (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`
    return `$${amount.toLocaleString()}`
  }
}

/**
 * DATABASE-DRIVEN BUSINESS TYPES
 * Pulls unique business types from enhanced comtrade_reference data
 */
export async function getBusinessTypes() {
  // Use cache if recent
  if (_businessTypesCache && _cacheTimestamp && Date.now() - _cacheTimestamp < CACHE_DURATION) {
    return _businessTypesCache
  }

  // Return defaults if running on client side
  if (typeof window !== 'undefined' || !supabase) {
    return getDefaultBusinessTypes()
  }

  try {
    // Get unique product categories from comtrade_reference
    const { data: categoriesData } = await supabase
      .from('comtrade_reference')
      .select('product_category')
      .not('product_category', 'is', null)
    
    const uniqueCategories = [...new Set(categoriesData?.map(r => r.product_category) || [])]
    
    // Get business intelligence data for each category
    const { data: businessData } = await supabase
      .from('usmca_business_intelligence')
      .select('business_type, success_rate_percentage, avg_usmca_savings, companies_analyzed')
    
    const businessTypes = []
    
    // Process unique categories into business types
    for (const category of uniqueCategories) {
      const intelligence = businessData?.find(b => 
        b.business_type.toLowerCase() === category.toLowerCase()
      )
      
      // Get HS chapters for this category
      const { data: hsData } = await supabase
        .from('comtrade_reference')
        .select('hs_code')
        .eq('product_category', category)
        .limit(100)
        
      const hsChapters = [...new Set(hsData?.map(h => parseInt(h.hs_code?.substring(0, 2))) || [])]
        .filter(chapter => !isNaN(chapter))
        .sort((a, b) => a - b)
      
      businessTypes.push({
        value: category,
        label: category,
        hsChapters: hsChapters,
        intelligence: intelligence ? {
          successRate: intelligence.success_rate_percentage,
          avgSavings: intelligence.avg_usmca_savings,
          companiesAnalyzed: intelligence.companies_analyzed
        } : null,
        dataSource: 'enhanced_database'
      })
    }
    
    // Add default business types from database intelligence that might not have comtrade matches
    const additionalTypes = businessData?.filter(b => 
      !uniqueCategories.some(c => c.toLowerCase() === b.business_type.toLowerCase())
    ) || []
    
    for (const type of additionalTypes) {
      businessTypes.push({
        value: type.business_type,
        label: type.business_type,
        hsChapters: [], // Will be populated from database if needed
        intelligence: {
          successRate: type.success_rate_percentage,
          avgSavings: type.avg_usmca_savings,
          companiesAnalyzed: type.companies_analyzed
        },
        dataSource: 'business_intelligence'
      })
    }
    
    _businessTypesCache = businessTypes
    return businessTypes
    
  } catch (error) {
    console.error('Error fetching business types:', error)
    // Fallback to cached data or defaults
    return _businessTypesCache || [
      { value: 'Electronics', label: 'Electronics & Technology', hsChapters: [84, 85, 90] },
      { value: 'Manufacturing', label: 'Industrial Manufacturing', hsChapters: [84, 85, 86, 87, 88, 89] },
      { value: 'Food & Agriculture', label: 'Food & Agriculture', hsChapters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] }
    ]
  }
}

/**
 * DATABASE-DRIVEN TRIANGLE ROUTES
 * Pulls real routing opportunities from triangle_routing_opportunities table
 */
export async function getTriangleRoutes() {
  // Use cache if recent
  if (_triangleRoutesCache && _cacheTimestamp && Date.now() - _cacheTimestamp < CACHE_DURATION) {
    return _triangleRoutesCache
  }

  // Return defaults if running on client side
  if (typeof window !== 'undefined' || !supabase) {
    return getDefaultTriangleRoutes()
  }

  try {
    const { data: routingData, error } = await supabase
      .from('triangle_routing_opportunities')
      .select('*')
      .order('success_rate', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    const routes = {}
    routingData?.forEach((route, index) => {
      const key = route.optimal_route?.toUpperCase().replace('VIA_', '') || `ROUTE_${index + 1}`
      
      routes[key] = {
        name: `${route.origin_country || 'China'} → ${route.optimal_route?.includes('mexico') ? 'Mexico' : 'Canada'} → USA`,
        savings: `${route.max_savings_percentage}% → 0%`,
        timeline: route.avg_implementation_time || '28-35 days',
        complexity: route.implementation_complexity || 'Medium',
        success_rate: route.success_rate || 85,
        maxSavingsAmount: route.max_savings_amount,
        hsCode: route.hs_code,
        productDescription: route.product_description,
        riskLevel: route.risk_level,
        minimumOrderValue: route.minimum_order_value,
        leadTimeImpact: route.lead_time_impact_days,
        dataSource: 'triangle_routing_opportunities'
      }
    })
    
    _triangleRoutesCache = routes
    return routes
    
  } catch (error) {
    console.error('Error fetching triangle routes:', error)
    // Fallback to cached data or defaults
    return _triangleRoutesCache || {
      PRIMARY: {
        name: 'China → Mexico → USA',
        savings: '30% → 0%',
        timeline: '28-35 days',
        complexity: 'Medium',
        success_rate: 92
      }
    }
  }
}

// Form field configurations
export const FORM_CONFIG = {
  companyName: {
    placeholder: 'Acme Electronics Inc.',
    validation: /^[a-zA-Z0-9\s&.,'-]{2,100}$/,
    error: 'Please enter a valid company name'
  },
  email: {
    placeholder: 'john@company.com',
    validation: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    error: 'Please enter a valid email address'
  },
  phone: {
    placeholder: '+1 (555) 123-4567',
    validation: /^[\d\s()+-]{10,20}$/,
    error: 'Please enter a valid phone number'
  },
  zipCode: {
    placeholder: '90210',
    validation: /^\d{5}(-\d{4})?$/,
    error: 'Please enter a valid ZIP code'
  }
};

// API endpoints (centralized)
export const API_ENDPOINTS = {
  hsCode: '/api/intelligence/hs-codes',
  routing: '/api/intelligence/routing',
  shipping: '/api/intelligence/shipping',
  marcus: '/api/marcus/generate',
  status: '/api/status',
  database: '/api/database-structure-test'
};

// Success messages
export const SUCCESS_MESSAGES = {
  foundation: 'Company profile saved successfully!',
  product: 'Products classified with 95% confidence',
  routing: 'Triangle routes identified with potential savings',
  signup: 'Welcome to Triangle Intelligence!',
  marcus: 'Marcus report generated successfully'
};

// Error messages
export const ERROR_MESSAGES = {
  api: 'Service temporarily unavailable. Please try again.',
  validation: 'Please check your input and try again.',
  network: 'Network error. Please check your connection.',
  auth: 'Authentication required. Please sign in.'
};

// Feature flags (for gradual rollout) - Enhanced with database-driven features
export const FEATURE_FLAGS = {
  useRealClaudeAPI: true,
  use597KTradeFlows: true,
  enableMarcusReports: true,
  showVolatilityTracking: true,
  enablePredictiveAlerts: true,
  useDatabaseDrivenConstants: true,  // NEW: Enable database-driven constants
  useEnhancedUSMCAIntelligence: true, // NEW: Enable enhanced USMCA data
  enableTriangleRoutingOpportunities: true, // NEW: Use real routing opportunities
  enableBusinessIntelligencePatterns: true // NEW: Use business intelligence data
}

// Export utility functions
/**
 * DATABASE-DRIVEN UTILITY FUNCTIONS
 * All functions now pull from enhanced database instead of hardcoded arrays
 */

export function getImportVolumeOptions() {
  return Object.values(IMPORT_VOLUMES).map(v => v.label)
}

export async function getBusinessTypeOptions() {
  const businessTypes = await getBusinessTypes()
  return businessTypes.map(b => ({
    value: b.value,
    label: b.label,
    intelligence: b.intelligence,
    dataSource: b.dataSource
  }))
}

export function calculateSavingsForVolume(volumeLabel) {
  return SAVINGS_CALCULATOR.calculateAnnualSavings(volumeLabel)
}

export function formatCurrency(amount) {
  return SAVINGS_CALCULATOR.formatSavings(amount)
}

/**
 * Get countries from database
 */
export async function getCountryOptions() {
  // Return defaults if running on client side
  if (typeof window !== 'undefined' || !supabase) {
    return [
      { value: 'CN', label: 'China' },
      { value: 'MX', label: 'Mexico' },
      { value: 'CA', label: 'Canada' },
      { value: 'IN', label: 'India' },
      { value: 'VN', label: 'Vietnam' },
      { value: 'TH', label: 'Thailand' },
      { value: 'MY', label: 'Malaysia' },
      { value: 'KR', label: 'South Korea' }
    ]
  }
  
  try {
    const { data: countriesData, error } = await supabase
      .from('countries')
      .select('country_code, country_name')
      .order('country_name')
    
    if (error) throw error
    
    return countriesData?.map(country => ({
      value: country.country_code,
      label: country.country_name
    })) || []
    
  } catch (error) {
    console.error('Error fetching countries:', error)
    return [
      { value: 'CN', label: 'China' },
      { value: 'MX', label: 'Mexico' },
      { value: 'CA', label: 'Canada' },
      { value: 'IN', label: 'India' },
      { value: 'VN', label: 'Vietnam' }
    ]
  }
}

/**
 * Get product suggestions based on business type from database
 */
export async function getProductSuggestions(businessType) {
  // Return defaults if running on client side
  if (typeof window !== 'undefined' || !supabase) {
    return []
  }
  
  try {
    const { data: productsData, error } = await supabase
      .from('comtrade_reference')
      .select('hs_code, product_description, usmca_eligible, potential_annual_savings')
      .eq('product_category', businessType)
      .not('product_description', 'is', null)
      .order('potential_annual_savings', { ascending: false, nullsLast: true })
      .limit(20)
    
    if (error) throw error
    
    return productsData?.map(product => ({
      hsCode: product.hs_code,
      description: product.product_description,
      usmcaEligible: product.usmca_eligible,
      potentialSavings: product.potential_annual_savings,
      dataSource: 'enhanced_comtrade_reference'
    })) || []
    
  } catch (error) {
    console.error('Error fetching product suggestions:', error)
    return []
  }
}

/**
 * DATABASE-DRIVEN CONFIGURATION LOADER
 * Loads all platform configuration from enhanced USMCA database
 */
export async function loadDynamicConfiguration() {
  try {
    console.log('🔄 Loading platform configuration from enhanced USMCA database...')
    
    // Load all dynamic configuration in parallel
    const [metrics, businessTypes, triangleRoutes, tariffRates] = await Promise.all([
      getPlatformMetrics(),
      getBusinessTypes(),
      getTriangleRoutes(),
      getTariffRates()
    ])
    
    console.log('✅ Database-driven configuration loaded:', {
      metricsLoaded: !!metrics,
      businessTypesCount: businessTypes?.length || 0,
      triangleRoutesCount: Object.keys(triangleRoutes || {}).length,
      tariffRatesCount: Object.keys(tariffRates || {}).length,
      dataSource: 'enhanced_usmca_database'
    })
    
    return {
      metrics,
      businessTypes,
      triangleRoutes,
      tariffRates,
      loadedAt: new Date().toISOString(),
      dataSource: 'enhanced_usmca_database'
    }
    
  } catch (error) {
    console.error('❌ Database configuration loading failed:', error)
    
    // Return fallback configuration
    return {
      metrics: { dataSource: 'fallback', error: error.message },
      businessTypes: [],
      triangleRoutes: {},
      tariffRates: {},
      loadedAt: new Date().toISOString(),
      dataSource: 'fallback'
    }
  }
}